import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import multer from 'multer';
import sharp from 'sharp';
import { google } from 'googleapis';
import Anthropic from '@anthropic-ai/sdk';
import Stripe from 'stripe';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pg from 'pg';
import cron from 'node-cron';
import { Resend } from 'resend';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = join(__dirname, 'uploads');
await mkdir(UPLOADS_DIR, { recursive: true });

const { Pool } = pg;
const app = express();
const PORT = process.env.PORT || 3001;

// ─── DB ───────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// ─── Clients ──────────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// ─── Google OAuth ─────────────────────────────────────────────
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// NOTE: business.manage is a restricted GBP scope that requires Google API access approval.
// Re-add it once case 7-9537000040761 is approved: 'https://www.googleapis.com/auth/business.manage'
const SCOPES = [
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(express.raw({ type: 'application/json' }));
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  },
}));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

// ─── DB Init ──────────────────────────────────────────────────
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clients (
      id SERIAL PRIMARY KEY,
      google_id TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      name TEXT,
      business_name TEXT,
      whatsapp TEXT,
      tone TEXT DEFAULT 'Friendly',
      business_type TEXT DEFAULT 'general',
      posts_per_week INTEGER DEFAULT 1,
      google_access_token TEXT,
      google_refresh_token TEXT,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      subscription_status TEXT DEFAULT 'trial',
      gbp_account_name TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      client_id INTEGER REFERENCES clients(id),
      photo_url TEXT,
      post_text TEXT,
      search_query TEXT,
      status TEXT DEFAULT 'pending',
      posted_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  await pool.query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS business_type TEXT DEFAULT 'general'`);
  await pool.query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_gbp_check TIMESTAMPTZ`);
  await pool.query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS password_hash TEXT`);
  await pool.query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS review_link TEXT`);
  await pool.query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS city TEXT DEFAULT ''`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      price TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log('✅ DB ready');
}

// ─── Shared Helpers ───────────────────────────────────────────

const BUSINESS_TYPE_LABELS = {
  restaurant:  'restaurant or food business',
  contractor:  'home services or contracting business',
  medical:     'medical or healthcare practice',
  salon:       'beauty salon or spa',
  gym:         'gym or fitness studio',
  retail:      'retail shop',
  real_estate: 'real estate agency',
  auto:        'auto repair or dealership',
  legal:       'law firm or legal services',
  general:     'local business',
};

function getClientAuth(client) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  auth.setCredentials({
    access_token: client.google_access_token,
    refresh_token: client.google_refresh_token,
  });
  return auth;
}

// In-memory location cache — populated by permission-check, avoids repeated accounts.list calls
const locationMemCache = new Map(); // clientId -> locationName

// Per-client rate guard — prevents hammering accounts.list even if frontend retries or React StrictMode double-fires
const lastGbpCallTime = new Map(); // clientId -> timestamp (ms)
const GBP_CALL_COOLDOWN_MS = 65_000;

// Returns cached location name. Throws with a clear message if not cached yet.
// accounts.list is ONLY called from /api/permission-check to stay under rate limits.
async function ensureLocation(client) {
  if (locationMemCache.has(client.id)) return locationMemCache.get(client.id);
  const name = client.gbp_account_name
    || (await pool.query('SELECT gbp_account_name FROM clients WHERE id = $1', [client.id])).rows[0]?.gbp_account_name;
  if (!name) throw new Error('GBP location not connected yet — please wait for the permission check to complete');
  locationMemCache.set(client.id, name);
  return name;
}

async function callClaude(systemPrompt, messages, maxTokens = 400) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    system: systemPrompt,
    messages,
  });
  return response.content[0].text;
}

// ─── Auth Routes ──────────────────────────────────────────────

app.get('/auth/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({ access_type: 'offline', prompt: 'consent', scope: SCOPES });
  res.redirect(url);
});

// Force re-auth (clears stored tokens so Google issues a fresh one with all current scopes)
app.get('/auth/reauth', (req, res) => {
  const url = oauth2Client.generateAuthUrl({ access_type: 'offline', prompt: 'consent', scope: SCOPES });
  res.redirect(url);
});

app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect(`${process.env.FRONTEND_URL}/auth/callback?error=no_code`);
  try {
    const callbackClient = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    const { tokens } = await callbackClient.getToken(code);
    callbackClient.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: callbackClient });
    const { data: profile } = await oauth2.userinfo.get();
    const signup = req.session.pendingSignup || {};
    const result = await pool.query(`
      INSERT INTO clients (google_id, email, name, business_name, whatsapp, tone, business_type, posts_per_week, google_access_token, google_refresh_token)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (google_id) DO UPDATE SET
        google_access_token = EXCLUDED.google_access_token,
        google_refresh_token = COALESCE(EXCLUDED.google_refresh_token, clients.google_refresh_token),
        name = COALESCE(EXCLUDED.name, clients.name),
        business_name = COALESCE(EXCLUDED.business_name, clients.business_name),
        business_type = COALESCE(EXCLUDED.business_type, clients.business_type)
      RETURNING id
    `, [
      profile.id, profile.email,
      signup.name || profile.name,
      signup.businessName || '',
      signup.whatsapp || '',
      signup.tone || 'Friendly',
      signup.businessType || 'general',
      signup.postsPerWeek || 1,
      tokens.access_token, tokens.refresh_token,
    ]);
    req.session.clientId = result.rows[0].id;
    req.session.pendingSignup = null;
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?error=auth_failed`);
  }
});

app.post('/auth/presignup', (req, res) => {
  req.session.pendingSignup = req.body;
  res.json({ ok: true });
});

app.post('/auth/signup', async (req, res) => {
  const { email, password, name, businessName, businessType, whatsapp, tone, postsPerWeek } = req.body;
  if (!email || !password || !name || !businessName) {
    return res.status(400).json({ error: 'Email, password, name and business name are required' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(`
      INSERT INTO clients (google_id, email, name, business_name, whatsapp, tone, business_type, posts_per_week, password_hash)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (google_id) DO UPDATE SET
        name = COALESCE(EXCLUDED.name, clients.name),
        business_name = COALESCE(EXCLUDED.business_name, clients.business_name),
        password_hash = EXCLUDED.password_hash
      RETURNING id
    `, [
      `email:${email.toLowerCase()}`, email.toLowerCase(),
      name, businessName, whatsapp || '', tone || 'Friendly',
      businessType || 'general', postsPerWeek || 1, hash,
    ]);
    const clientId = result.rows[0].id;
    req.session.clientId = clientId;
    const token = jwt.sign({ clientId }, process.env.SESSION_SECRET, { expiresIn: '30d' });
    res.json({ ok: true, token });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const { rows } = await pool.query(
      'SELECT * FROM clients WHERE google_id = $1',
      [`email:${email.toLowerCase()}`]
    );
    if (!rows.length) return res.status(401).json({ error: 'No account found with that email' });
    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Incorrect password' });
    const clientId = rows[0].id;
    req.session.clientId = clientId;
    const token = jwt.sign({ clientId }, process.env.SESSION_SECRET, { expiresIn: '30d' });
    res.json({ ok: true, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/auth/logout', (req, res) => {
  req.session.destroy(() => {});
  res.setHeader('Set-Cookie', 'hayvista_token=; path=/; max-age=0; SameSite=Strict');
  res.json({ ok: true });
});

// ─── Auth middleware ──────────────────────────────────────────
function requireAuth(req, res, next) {
  if (req.session.clientId) return next();
  // Fallback: verify JWT from browser-set cookie (survives proxy/MemoryStore issues)
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/(?:^|;\s*)hayvista_token=([^;]+)/);
  if (match) {
    try {
      const decoded = jwt.verify(decodeURIComponent(match[1]), process.env.SESSION_SECRET);
      if (decoded.clientId) { req.session.clientId = decoded.clientId; return next(); }
    } catch { /* invalid token — fall through to 401 */ }
  }
  return res.status(401).json({ error: 'Not authenticated' });
}

// ─── Permission check (also seeds the location name into DB + memory cache) ───
app.get('/api/permission-check', requireAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.session.clientId]);
  const client = rows[0];

  // If location already cached, skip the rate-limited API call entirely
  if (client.gbp_account_name) {
    locationMemCache.set(client.id, client.gbp_account_name);
    return res.json({ ok: true, locationReady: true });
  }

  // Backend rate guard — DB is source of truth, in-memory Map is fast-path cache
  const now = Date.now();
  const dbTime = client.last_gbp_check ? new Date(client.last_gbp_check).getTime() : 0;
  const lastCall = Math.max(lastGbpCallTime.get(client.id) ?? 0, dbTime);
  if (now - lastCall < GBP_CALL_COOLDOWN_MS) {
    const remainingSec = Math.round((GBP_CALL_COOLDOWN_MS - (now - lastCall)) / 1000);
    console.log(`⏳ Rate guard: blocking for client ${client.id} (${remainingSec}s remaining)`);
    return res.json({ ok: true, locationReady: false, cooldownSec: remainingSec });
  }

  // Mark call time before hitting Google — extends window even if call fails
  const stamp = new Date();
  lastGbpCallTime.set(client.id, now);
  pool.query('UPDATE clients SET last_gbp_check = $1 WHERE id = $2', [stamp, client.id]).catch(() => {});

  try {
    const auth = getClientAuth(client);
    const accountMgmt = google.mybusinessaccountmanagement({ version: 'v1', auth });
    const accountsRes = await accountMgmt.accounts.list();
    const account = accountsRes.data.accounts?.[0];
    console.log('✅ accounts.list succeeded, account:', account?.name);

    let locationReady = false;
    if (account) {
      const bizInfo = google.mybusinessbusinessinformation({ version: 'v1', auth });
      const locRes = await bizInfo.accounts.locations.list({ parent: account.name, readMask: 'name' });
      const loc = locRes.data.locations?.[0];
      if (loc) {
        await pool.query('UPDATE clients SET gbp_account_name = $1 WHERE id = $2', [loc.name, client.id]);
        locationMemCache.set(client.id, loc.name);
        console.log('✅ GBP location cached:', loc.name);
        locationReady = true;
      }
    }
    res.json({ ok: true, locationReady });
  } catch (err) {
    const msg = err.message || '';
    const status = err.status || err.code || 0;
    console.error('🔴 Permission check failed:', status, msg.slice(0, 120));
    // 429 = rate limited — permissions are fine but location can't be fetched yet
    if (status === 429 || msg.includes('rateLimitExceeded') || msg.includes('Quota exceeded')) {
      return res.json({ ok: true, locationReady: false });
    }
    const isPermission = msg.includes('Insufficient') || status === 403;
    const isNotEnabled = msg.includes('has not been used') || msg.includes('disabled') || msg.includes('SERVICE_DISABLED');
    res.status(isPermission ? 403 : 500).json({
      ok: false, locationReady: false, error: msg, status, needsReauth: isPermission, apiNotEnabled: isNotEnabled,
    });
  }
});

// ─── /api/me ─────────────────────────────────────────────────
app.get('/api/me', requireAuth, async (req, res) => {
  const client = await pool.query('SELECT * FROM clients WHERE id = $1', [req.session.clientId]);
  const posts = await pool.query('SELECT * FROM posts WHERE client_id = $1 ORDER BY posted_at DESC LIMIT 20', [req.session.clientId]);
  const products = await pool.query('SELECT * FROM products WHERE client_id = $1 ORDER BY created_at ASC', [req.session.clientId]);
  res.json({ client: client.rows[0], posts: posts.rows, products: products.rows });
});

// ─── Posts ────────────────────────────────────────────────────

app.patch('/api/posts/:id', requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Text is required' });
    const result = await pool.query(
      'UPDATE posts SET post_text = $1 WHERE id = $2 AND client_id = $3 RETURNING *',
      [text.trim(), req.params.id, req.session.clientId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Post not found' });
    res.json({ post: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/generate-post', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.session.clientId]);
    const post = await generatePostForClient(rows[0]);
    res.json({ post });
  } catch (err) {
    console.error('Generate post error:', err);
    res.status(500).json({ error: err.message });
  }
});

async function generatePostForClient(client) {
  const auth = getClientAuth(client);

  // 1. GSC top query
  let topQuery = 'local services';
  try {
    const sc = google.webmasters({ version: 'v3', auth });
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0];
    const gscRes = await sc.searchanalytics.query({
      siteUrl: `sc-domain:${client.email.split('@')[1]}`,
      requestBody: { startDate: start, endDate: end, dimensions: ['query'], rowLimit: 10 },
    });
    const rows = gscRes.data.rows || [];
    const best = rows.sort((a, b) => b.impressions - a.impressions).find((r) => r.clicks === 0);
    if (best) topQuery = best.keys[0];
  } catch (e) {
    console.warn('GSC fetch failed:', e.message);
  }

  // 2. GBP photos
  let photoUrl = null;
  try {
    const locationName = await ensureLocation(client);
    const mybusiness = google.mybusiness({ version: 'v4', auth });
    const mediaRes = await mybusiness.accounts.locations.media.list({ parent: locationName });
    const photos = mediaRes.data.mediaItems || [];
    const pick = photos[Math.floor(Math.random() * photos.length)];
    if (pick) photoUrl = pick.googleUrl || pick.sourceUrl;
  } catch (e) {
    console.warn('GBP photos fetch failed:', e.message);
  }

  // 3. Claude writes the post
  const bizLabel = BUSINESS_TYPE_LABELS[client.business_type || 'general'] || 'local business';
  const systemPrompt = `You are a local business marketing expert specializing in Google Business Profile posts for ${bizLabel}s.

Always write posts in this exact format:

1. Opening line: A single emoji + a punchy hook sentence targeting a specific customer pain point or audience. No period — keep it sharp.

2. Body paragraph: 2–3 sentences introducing ${client.business_name}, what they do, and how they solve the problem. Mention the local area naturally if relevant. Tone: ${client.tone}.

3. If applicable, include a short service highlight list using this format:
✅ [benefit or service]
✅ [benefit or service]
✅ [benefit or service]

4. One sentence explaining the key value or reassurance (why it matters to the customer).

5. Closing CTA: A single line starting with a wrench, phone, or relevant emoji + a direct call to action (e.g. "Message us", "Call us today", "Book online").

Rules:
- 150–220 words total
- No hashtags
- No fluff or filler phrases like "In today's world" or "Are you looking for"
- Sound like a real local business owner, not a marketing robot
- End with action, not a question`;

  const userPrompt = `Write a GBP post for ${client.business_name}, a ${bizLabel} in Los Cabos. The most searched local query this week is: "${topQuery}". Build the post around this search intent naturally.`;

  const postText = await callClaude(systemPrompt, [{ role: 'user', content: userPrompt }], 500);

  const result = await pool.query(
    `INSERT INTO posts (client_id, photo_url, post_text, search_query, status) VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
    [client.id, photoUrl, postText, topQuery]
  );
  return result.rows[0];
}

// ─── Profile ─────────────────────────────────────────────────

app.patch('/api/profile', requireAuth, async (req, res) => {
  try {
    const { business_name, business_type, tone, posts_per_week, whatsapp, review_link, city } = req.body;
    const { rows } = await pool.query(
      `UPDATE clients SET
        business_name  = COALESCE($1, business_name),
        business_type  = COALESCE($2, business_type),
        tone           = COALESCE($3, tone),
        posts_per_week = COALESCE($4, posts_per_week),
        whatsapp       = COALESCE($5, whatsapp),
        review_link    = COALESCE($6, review_link),
        city           = COALESCE($7, city)
       WHERE id = $8 RETURNING *`,
      [
        business_name ?? null,
        business_type ?? null,
        tone ?? null,
        posts_per_week ?? null,
        whatsapp ?? null,
        review_link ?? null,
        city ?? null,
        req.session.clientId,
      ]
    );
    res.json({ client: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Products ────────────────────────────────────────────────

app.get('/api/products', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM products WHERE client_id = $1 ORDER BY created_at ASC',
      [req.session.clientId]
    );
    res.json({ products: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', requireAuth, async (req, res) => {
  try {
    const { name, description = '', price = '' } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    const { rows } = await pool.query(
      'INSERT INTO products (client_id, name, description, price) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.session.clientId, name.trim(), description.trim(), price.trim()]
    );
    res.json({ product: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/products/:id', requireAuth, async (req, res) => {
  try {
    const { name, description, price } = req.body;
    const { rows } = await pool.query(
      `UPDATE products SET
        name        = COALESCE($1, name),
        description = COALESCE($2, description),
        price       = COALESCE($3, price)
       WHERE id = $4 AND client_id = $5 RETURNING *`,
      [name ?? null, description ?? null, price ?? null, req.params.id, req.session.clientId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', requireAuth, async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM products WHERE id = $1 AND client_id = $2',
      [req.params.id, req.session.clientId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Product not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Reviews ─────────────────────────────────────────────────

app.get('/api/reviews', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.session.clientId]);
    const client = rows[0];
    const auth = getClientAuth(client);
    const locationName = await ensureLocation(client);
    const mybusiness = google.mybusiness({ version: 'v4', auth });
    const reviewsRes = await mybusiness.accounts.locations.reviews.list({
      parent: locationName,
      orderBy: 'updateTime desc',
      pageSize: 50,
    });
    res.json({
      reviews: reviewsRes.data.reviews || [],
      averageRating: reviewsRes.data.averageRating,
      totalReviewCount: reviewsRes.data.totalReviewCount,
    });
  } catch (err) {
    console.error('Reviews fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reviews/generate-reply', requireAuth, async (req, res) => {
  try {
    const { review } = req.body;
    const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.session.clientId]);
    const client = rows[0];
    const bizLabel = BUSINESS_TYPE_LABELS[client.business_type || 'general'] || 'local business';

    const city = client.city || '';
    const locationLine = city ? ` serving ${city}` : '';
    const systemPrompt = `You are the owner of ${client.business_name}, a ${bizLabel}${locationLine}. Write a genuine, reputation-protecting, SEO-aware reply to a Google review.

Follow these three steps:

STEP 1 — DETECT REVIEWER TONE: Casual | Formal | Technical | Emotional | Angry | Enthusiastic
Mirror it exactly. A casual reviewer gets a warm, conversational reply. A technical reviewer (contractor noting materials, chef discussing technique, foodie mentioning pairings) gets a reply that matches their vocabulary and knowledge level.

STEP 2 — DETECT REVIEWER INTENT and respond accordingly:
- Praise → Reinforce the specific detail they mentioned, express genuine gratitude, invite them back.
- Complaint → Acknowledge their specific frustration calmly, take ownership, offer a concrete resolution, invite direct contact.
- Mixed → Validate the positive, address the concern directly, show commitment to improving.
- Question → Answer clearly and invite them to reach out for more detail.
- Technical critique → Respond with equal expertise; show you understand the issue at a professional level.

STEP 3 — WEAVE IN ONE SUBTLE LOCAL SIGNAL:
Mention the specific service performed${city ? ` and the location (${city})` : ''} naturally in the reply — never as a keyword dump.
✓ Right: "We're glad the electrical panel upgrade${city ? ` in ${city}` : ''} went smoothly."
✗ Wrong: "Thank you for choosing the best electrician in ${city || 'your area'}!"

Hard rules:
- NEVER start with "Thank you for your review" — engage with what they actually said.
- Under 80 words.
- Tone: ${client.tone}.
- No hashtags, no emojis.
- Never be defensive, never argue, never dismiss.`;

    const stars = { ONE: '1/5', TWO: '2/5', THREE: '3/5', FOUR: '4/5', FIVE: '5/5' }[review.starRating] || review.starRating;
    const userPrompt = `Rating: ${stars} stars\nReview: "${review.comment || '(no written comment, just a star rating)'}"`;

    const reply = await callClaude(systemPrompt, [{ role: 'user', content: userPrompt }], 200);
    res.json({ reply });
  } catch (err) {
    console.error('Generate reply error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reviews/reply', requireAuth, async (req, res) => {
  try {
    const { reviewName, replyText } = req.body;
    const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.session.clientId]);
    const client = rows[0];
    const auth = getClientAuth(client);
    const mybusiness = google.mybusiness({ version: 'v4', auth });
    await mybusiness.accounts.locations.reviews.updateReply({
      name: reviewName,
      requestBody: { comment: replyText },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Post reply error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Insights ────────────────────────────────────────────────

app.get('/api/insights', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.session.clientId]);
    const client = rows[0];
    const auth = getClientAuth(client);
    const locationName = await ensureLocation(client);
    const accountName = locationName.split('/locations/')[0];
    const mybusiness = google.mybusiness({ version: 'v4', auth });

    const endTime = new Date();
    const startTime = new Date(Date.now() - 28 * 86400000);

    let insightsData = null;
    try {
      const insightsRes = await mybusiness.accounts.locations.reportInsights({
        name: accountName,
        requestBody: {
          locationNames: [locationName],
          basicRequest: {
            metricRequests: [
              { metric: 'QUERIES_DIRECT' },
              { metric: 'QUERIES_INDIRECT' },
              { metric: 'VIEWS_MAPS' },
              { metric: 'VIEWS_SEARCH' },
              { metric: 'ACTIONS_WEBSITE' },
              { metric: 'ACTIONS_PHONE' },
              { metric: 'ACTIONS_DRIVING_DIRECTIONS' },
              { metric: 'PHOTOS_VIEWS_MERCHANT' },
              { metric: 'PHOTOS_COUNT_MERCHANT' },
            ],
            timeRange: { startTime: startTime.toISOString(), endTime: endTime.toISOString() },
          },
        },
      });
      insightsData = insightsRes.data;
    } catch (e) {
      console.warn('GBP insights failed:', e.message);
    }

    // GSC top queries (we know this works)
    let gscQueries = [];
    try {
      const sc = google.webmasters({ version: 'v3', auth });
      const end = endTime.toISOString().split('T')[0];
      const start = startTime.toISOString().split('T')[0];
      const gscRes = await sc.searchanalytics.query({
        siteUrl: `sc-domain:${client.email.split('@')[1]}`,
        requestBody: { startDate: start, endDate: end, dimensions: ['query'], rowLimit: 20 },
      });
      gscQueries = gscRes.data.rows || [];
    } catch (e) {
      console.warn('GSC insights failed:', e.message);
    }

    res.json({ insights: insightsData, gscQueries });
  } catch (err) {
    console.error('Insights error:', err);
    res.status(500).json({ error: err.message, insights: null, gscQueries: [] });
  }
});

// ─── Photos ──────────────────────────────────────────────────

app.get('/api/photos', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.session.clientId]);
    const client = rows[0];
    const auth = getClientAuth(client);
    const locationName = await ensureLocation(client);
    const mybusiness = google.mybusiness({ version: 'v4', auth });
    const mediaRes = await mybusiness.accounts.locations.media.list({ parent: locationName });
    res.json({ photos: mediaRes.data.mediaItems || [] });
  } catch (err) {
    console.error('Photos fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/photos/upload', requireAuth, upload.single('photo'), async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.session.clientId]);
    const client = rows[0];
    const category = req.body.category || 'INTERIOR';
    const userCaption = req.body.caption || '';
    const bizLabel = BUSINESS_TYPE_LABELS[client.business_type || 'general'] || 'local business';

    // 1. Claude generates SEO metadata
    const metaPrompt = `Generate SEO metadata for a photo being uploaded to Google Business Profile.
Business: ${client.business_name}
Type: ${bizLabel}
Photo category: ${category}
User caption: "${userCaption}"

Return ONLY a JSON object, no markdown:
{"title":"short keyword-rich title under 60 chars","description":"2-sentence keyword-rich description under 150 chars","keywords":["keyword1","keyword2","keyword3","keyword4","keyword5"]}`;

    let meta = {
      title: `${client.business_name} - ${category.toLowerCase()}`,
      description: userCaption || `${category.toLowerCase()} photo from ${client.business_name}, a ${bizLabel}.`,
      keywords: [client.business_name, bizLabel, category.toLowerCase()],
    };
    try {
      const raw = await callClaude('You are an SEO expert. Return only valid JSON, no explanation.', [{ role: 'user', content: metaPrompt }], 300);
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      meta = { ...meta, ...parsed };
    } catch (e) {
      console.warn('Meta generation failed, using defaults:', e.message);
    }

    // 2. Inject EXIF metadata with Sharp
    const filename = `${Date.now()}-photo.jpg`;
    const outputPath = join(UPLOADS_DIR, filename);

    await sharp(req.file.buffer)
      .jpeg({ quality: 88 })
      .withMetadata({
        exif: {
          IFD0: {
            ImageDescription: meta.description,
            Artist: client.business_name,
            Copyright: `© ${new Date().getFullYear()} ${client.business_name}`,
            XPTitle: Buffer.from(meta.title + '\0', 'ucs2'),
            XPComment: Buffer.from(meta.description + '\0', 'ucs2'),
            XPKeywords: Buffer.from(meta.keywords.join(';') + '\0', 'ucs2'),
          },
        },
      })
      .toFile(outputPath);

    // 3. Build public URL
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${PORT}`;
    const publicUrl = `${backendUrl}/uploads/${filename}`;

    // 4. Upload to GBP
    const auth = getClientAuth(client);
    const locationName = await ensureLocation(client);
    const mybusiness = google.mybusiness({ version: 'v4', auth });

    await mybusiness.accounts.locations.media.create({
      parent: locationName,
      requestBody: {
        mediaFormat: 'PHOTO',
        locationAssociation: { category },
        sourceUrl: publicUrl,
        description: meta.description,
      },
    });

    res.json({ ok: true, url: publicUrl, meta });
  } catch (err) {
    console.error('Photo upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/photos/:mediaName', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.session.clientId]);
    const client = rows[0];
    const auth = getClientAuth(client);
    const mybusiness = google.mybusiness({ version: 'v4', auth });
    const mediaName = decodeURIComponent(req.params.mediaName);
    await mybusiness.accounts.locations.media.delete({ name: mediaName });
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete photo error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Services & Business Info ─────────────────────────────────

app.get('/api/services', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.session.clientId]);
    const client = rows[0];
    const auth = getClientAuth(client);
    const locationName = await ensureLocation(client);
    const bizInfo = google.mybusinessbusinessinformation({ version: 'v1', auth });
    const location = await bizInfo.locations.get({
      name: locationName,
      readMask: 'serviceItems,categories,regularHours,websiteUri,phoneNumbers',
    });
    res.json({
      services: location.data.serviceItems || [],
      categories: location.data.categories || {},
      hours: location.data.regularHours || null,
      website: location.data.websiteUri || '',
      phone: location.data.phoneNumbers?.primaryPhone || '',
    });
  } catch (err) {
    console.error('Services fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GBP Profile (full location data for Edit Profile tab) ──────────────────

/** GBP day names → display order */
const GBP_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

/** Parse GBP regularHours.periods[] → { MONDAY: { closed, open, close }, ... } */
function parseGbpPeriods(periods = []) {
  const result = {};
  GBP_DAYS.forEach((d) => { result[d] = { closed: true, open: '00:00', close: '00:00' }; });
  periods.forEach(({ openDay, openTime, closeTime }) => {
    if (openDay && openTime && closeTime) {
      result[openDay] = { closed: false, open: openTime, close: closeTime };
    }
  });
  return result;
}

/** Parse GBP moreHours[] → { hoursTypeId: { MONDAY: {...}, ... }, ... } */
function parseMoreHours(moreHours = []) {
  const result = {};
  moreHours.forEach(({ hoursTypeId, periods }) => {
    if (!hoursTypeId) return;
    result[hoursTypeId] = parseGbpPeriods(periods);
  });
  return result;
}

/** Parse GBP serviceArea → readable string */
function parseServiceArea(serviceArea) {
  if (!serviceArea) return '';
  if (serviceArea.places?.placeInfos?.length) {
    return serviceArea.places.placeInfos.map((p) => p.placeName || p.name).filter(Boolean).join(', ');
  }
  if (serviceArea.radius?.radiusKm) return `${Math.round(serviceArea.radius.radiusKm)} km radius`;
  return '';
}

/** Format GBP PostalAddress → single-line string */
function formatGbpAddress(addr) {
  if (!addr) return '';
  const parts = [
    (addr.addressLines || []).join(', '),
    addr.locality,
    addr.administrativeArea,
    addr.postalCode,
  ].filter(Boolean);
  return parts.join(', ');
}

app.get('/api/gbp-profile', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.session.clientId]);
    const client = rows[0];
    const auth = getClientAuth(client);
    const locationName = await ensureLocation(client);
    const bizInfo = google.mybusinessbusinessinformation({ version: 'v1', auth });
    const loc = await bizInfo.locations.get({
      name: locationName,
      readMask: 'name,title,phoneNumbers,websiteUri,profile,regularHours,moreHours,serviceArea,storefrontAddress,categories,openInfo',
    });
    const d = loc.data;
    res.json({
      businessName:         d.title || '',
      phone:                d.phoneNumbers?.primaryPhone || '',
      additionalPhones:     d.phoneNumbers?.additionalPhones || [],
      website:              d.websiteUri || '',
      description:          d.profile?.description || '',
      hours:                parseGbpPeriods(d.regularHours?.periods),
      moreHours:            parseMoreHours(d.moreHours),
      serviceArea:          parseServiceArea(d.serviceArea),
      address:              formatGbpAddress(d.storefrontAddress),
      primaryCategory:      d.categories?.primaryCategory?.displayName || '',
      additionalCategories: (d.categories?.additionalCategories || []).map((c) => c.displayName),
      isOpen:               d.openInfo?.status === 'OPEN',
    });
  } catch (err) {
    console.error('GBP profile fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Menu (restaurants) ───────────────────────────────────────

app.get('/api/menu', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.session.clientId]);
    const client = rows[0];
    if (client.business_type !== 'restaurant') return res.json({ menu: null });
    const auth = getClientAuth(client);
    const locationName = await ensureLocation(client);
    const mybusiness = google.mybusiness({ version: 'v4', auth });
    const menuRes = await mybusiness.accounts.locations.foodMenus.get({
      name: `${locationName}/foodMenus`,
    });
    res.json({ menu: menuRes.data });
  } catch (err) {
    console.error('Menu fetch error:', err);
    res.status(500).json({ error: err.message, menu: null });
  }
});

// ─── Stripe Routes ────────────────────────────────────────────

app.post('/api/stripe/create-checkout', requireAuth, async (req, res) => {
  const { priceId } = req.body;
  const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.session.clientId]);
  const client = rows[0];
  let customerId = client.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: client.email, name: client.business_name });
    customerId = customer.id;
    await pool.query('UPDATE clients SET stripe_customer_id = $1 WHERE id = $2', [customerId, client.id]);
  }
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.FRONTEND_URL}/dashboard?subscribed=true`,
    cancel_url: `${process.env.FRONTEND_URL}/signup`,
  });
  res.json({ url: session.url });
});

app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }
  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.created') {
    const sub = event.data.object;
    await pool.query(
      'UPDATE clients SET stripe_subscription_id = $1, subscription_status = $2 WHERE stripe_customer_id = $3',
      [sub.id, sub.status, sub.customer]
    );
  }
  res.json({ received: true });
});

// ─── Weekly Email Digest ──────────────────────────────────────
// Sends each active subscriber a summary of posts published in the last 7 days.
// Uses Resend (resend.com) — free tier covers 3,000 emails/month.
// TO ENABLE: set RESEND_API_KEY in Railway env vars, then uncomment the cron.schedule below.

async function sendWeeklyDigest() {
  if (!resend) { console.log('⏭️  Digest skipped — RESEND_API_KEY not set'); return; }

  const since = new Date();
  since.setDate(since.getDate() - 7);

  const { rows: clients } = await pool.query(
    "SELECT * FROM clients WHERE subscription_status IN ('active', 'trial') AND email IS NOT NULL"
  );

  for (const client of clients) {
    try {
      const { rows: posts } = await pool.query(
        `SELECT post_text, search_query, posted_at, photo_url
         FROM posts
         WHERE client_id = $1 AND posted_at >= $2
         ORDER BY posted_at DESC`,
        [client.id, since.toISOString()]
      );

      if (posts.length === 0) continue; // nothing published this week — skip

      const postRows = posts.map((p) => `
        <tr style="border-bottom:1px solid #1e2740">
          <td style="padding:12px 16px;color:#e8eeff;font-size:14px;line-height:1.5">${p.post_text}</td>
          <td style="padding:12px 16px;color:#4f8ef7;font-size:12px;white-space:nowrap">${p.search_query || '—'}</td>
          <td style="padding:12px 16px;color:rgba(232,238,255,0.45);font-size:12px;white-space:nowrap">${new Date(p.posted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
        </tr>`).join('');

      const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#060b18;font-family:'DM Sans',system-ui,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:32px 16px">
    <tr><td>
      <!-- Header -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
        <tr>
          <td style="padding-bottom:24px;border-bottom:1px solid rgba(255,255,255,0.08)">
            <p style="margin:0;font-size:22px;font-weight:800;color:#e8eeff">HayVista</p>
            <p style="margin:4px 0 0;font-size:13px;color:rgba(232,238,255,0.45)">Your weekly GBP activity recap</p>
          </td>
        </tr>
      </table>

      <!-- Greeting -->
      <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#e8eeff">Hey ${client.name || client.business_name} 👋</p>
      <p style="margin:0 0 24px;font-size:14px;color:rgba(232,238,255,0.65);line-height:1.6">
        Here's what HayVista published to your Google Business Profile this week.
        ${posts.length} post${posts.length > 1 ? 's' : ''} went live — keeping you visible to local customers.
      </p>

      <!-- Stats pill -->
      <table cellpadding="0" cellspacing="0" style="margin-bottom:28px">
        <tr>
          <td style="background:rgba(79,142,247,0.12);border:1px solid rgba(79,142,247,0.28);border-radius:12px;padding:12px 20px">
            <span style="font-size:24px;font-weight:800;color:#4f8ef7">${posts.length}×</span>
            <span style="font-size:13px;color:rgba(232,238,255,0.55);margin-left:8px">published this week</span>
          </td>
        </tr>
      </table>

      <!-- Posts table -->
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden;margin-bottom:32px">
        <thead>
          <tr style="background:rgba(255,255,255,0.04)">
            <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:rgba(232,238,255,0.4);letter-spacing:0.08em">POST</th>
            <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:rgba(232,238,255,0.4);letter-spacing:0.08em">KEYWORD</th>
            <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;color:rgba(232,238,255,0.4);letter-spacing:0.08em">DATE</th>
          </tr>
        </thead>
        <tbody>${postRows}</tbody>
      </table>

      <!-- CTA -->
      <table cellpadding="0" cellspacing="0" style="margin-bottom:40px">
        <tr>
          <td style="border-radius:10px;background:linear-gradient(135deg,#4f8ef7,#7c5af7)">
            <a href="${process.env.FRONTEND_URL}/dashboard" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:700;color:#fff;text-decoration:none">
              View your dashboard →
            </a>
          </td>
        </tr>
      </table>

      <!-- Footer -->
      <p style="margin:0;font-size:11px;color:rgba(232,238,255,0.25);line-height:1.6">
        HayVista · Cabo San Lucas, BCS, Mexico<br>
        You're receiving this because you're subscribed to HayVista.<br>
        <a href="${process.env.FRONTEND_URL}/dashboard" style="color:rgba(232,238,255,0.35)">Manage your account</a>
      </p>
    </td></tr>
  </table>
</body>
</html>`;

      await resend.emails.send({
        from: 'HayVista <digest@hayvista.com>',
        to: client.email,
        subject: `Your week on Google: ${posts.length} post${posts.length > 1 ? 's' : ''} published for ${client.business_name}`,
        html,
      });

      console.log(`📧 Weekly digest sent to ${client.email} (${posts.length} posts)`);
    } catch (e) {
      console.error(`❌ Digest failed for ${client.email}:`, e.message);
    }
  }
}

// ── COMMENTED OUT — uncomment after Google API review is approved ──────────
// cron.schedule('0 9 * * 1', sendWeeklyDigest, { timezone: 'America/Los_Angeles' });
// Runs every Monday at 9am PT. One email per client showing the past 7 days of posts.

// ─── Cron ────────────────────────────────────────────────────
cron.schedule('0 9 * * 1,3,5', async () => {
  console.log('⏰ Cron: generating scheduled posts');
  try {
    const { rows: clients } = await pool.query("SELECT * FROM clients WHERE subscription_status IN ('active', 'trial')");
    for (const client of clients) {
      try {
        await generatePostForClient(client);
        console.log(`✅ Post generated for ${client.business_name}`);
      } catch (e) {
        console.error(`❌ Failed for ${client.business_name}:`, e.message);
      }
    }
  } catch (e) {
    console.error('Cron error:', e);
  }
});

// ─── Start ────────────────────────────────────────────────────
initDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Ranky server running on port ${PORT}`));
});
