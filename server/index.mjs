import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import sharp from 'sharp';
import archiver from 'archiver';
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

// GBP write scope approved — case 6-4557000040809
const SCOPES = [
  'https://www.googleapis.com/auth/business.manage',
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(helmet());
app.use(express.json());
// Note: express.raw is only applied locally on the Stripe webhook route, not globally
app.use('/uploads', express.static(UPLOADS_DIR));

const PgSession = connectPgSimple(session);
app.use(session({
  store: new PgSession({ pool, createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  },
}));

// ─── Rate Limiters ────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many AI requests, please slow down' },
});
app.use('/auth/login', authLimiter);
app.use('/auth/signup', authLimiter);
app.use('/api/generate-post', aiLimiter);
app.use('/api/reviews/generate-reply', aiLimiter);
app.use('/api/photos/upload', aiLimiter);
app.use('/api/manual/write-post', aiLimiter);
app.use('/api/manual/write-reply', aiLimiter);
app.use('/api/manual/write-answer', aiLimiter);
app.use('/api/images/process', aiLimiter);

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
  await pool.query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'`);
  await pool.query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS lat DECIMAL`);
  await pool.query(`ALTER TABLE clients ADD COLUMN IF NOT EXISTS lng DECIMAL`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      price TEXT DEFAULT '',
      url TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS url TEXT DEFAULT ''`);
  await pool.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS auto_approve_at TIMESTAMPTZ`);
  await pool.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS post_type TEXT DEFAULT 'standard'`);
  await pool.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS offer_title TEXT`);
  await pool.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS event_title TEXT`);
  await pool.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS event_start TIMESTAMPTZ`);
  await pool.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS event_end TIMESTAMPTZ`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS qa_answers (
      id SERIAL PRIMARY KEY,
      client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
      question_id TEXT NOT NULL,
      question_text TEXT NOT NULL,
      author_name TEXT DEFAULT '',
      create_time TEXT,
      answer_text TEXT,
      status TEXT DEFAULT 'draft',
      auto_approve_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(client_id, question_id)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS photo_labels (
      id SERIAL PRIMARY KEY,
      client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
      photo_url TEXT NOT NULL,
      ai_description TEXT NOT NULL,
      user_description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(client_id, photo_url)
    )
  `);
  // Idempotent migration: add user_description column if it was created without it
  await pool.query(`
    ALTER TABLE photo_labels ADD COLUMN IF NOT EXISTS user_description TEXT
  `);
  // ─── Pending review reply drafts ────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pending_replies (
      id SERIAL PRIMARY KEY,
      client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
      review_name TEXT NOT NULL,
      review_id TEXT NOT NULL,
      draft_text TEXT NOT NULL,
      auto_post_at TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(client_id, review_id)
    )
  `);
  // ─── Per-client AI business memory ───────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS business_memory (
      id         SERIAL PRIMARY KEY,
      client_id  INTEGER REFERENCES clients(id) ON DELETE CASCADE,
      content    TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(client_id)
    )
  `);
  // ─── Manual Mode content library ──────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS manual_content (
      id             SERIAL PRIMARY KEY,
      client_id      INTEGER REFERENCES clients(id) ON DELETE CASCADE,
      type           TEXT NOT NULL CHECK (type IN ('post','reply','answer','image')),
      input_data     JSONB NOT NULL DEFAULT '{}',
      generated_text TEXT,
      quality_score  INTEGER,
      quality_tips   JSONB DEFAULT '[]',
      quality_strengths JSONB DEFAULT '[]',
      filename       TEXT,
      posted_at      TIMESTAMPTZ,
      created_at     TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_manual_content_client_created
    ON manual_content(client_id, created_at DESC)
  `);
  // Safe migrations — add columns that may be missing from older deployments
  await pool.query(`ALTER TABLE manual_content ADD COLUMN IF NOT EXISTS filename TEXT`);
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

/** Direct HTTP fetch to GBP v4 API — replaces removed google.mybusiness({ version: 'v4' }) client.
 *  path: resource path relative to https://mybusiness.googleapis.com/v4/ e.g. "accounts/1/locations/2/reviews"
 */
async function gbpV4Fetch(auth, method, path, body) {
  const { token } = await auth.getAccessToken();
  const url = `https://mybusiness.googleapis.com/v4/${path}`;
  const opts = {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (res.status === 204 || res.status === 200 && res.headers.get('content-length') === '0') return {};
  const text = await res.text();
  if (!res.ok) throw new Error(`GBP v4 ${method} ${path} → ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : {};
}

// ─── Photo helpers ────────────────────────────────────────────────────────────

/** Geocode a business name + city using Nominatim (OpenStreetMap). No API key needed.
 *  Returns { lat, lng } or null on failure. */
async function geocodeNominatim(businessName, city) {
  try {
    const q = encodeURIComponent(`${businessName} ${city}`.trim());
    const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'HayVista/1.0 (hayvista@gmail.com)' } });
    const data = await res.json();
    if (data?.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (e) {
    console.warn('[geo] Nominatim geocoding failed:', e.message);
  }
  return null;
}

/** Trigger background geocoding for a client if lat/lng not yet set. */
function geocodeClientIfNeeded(client) {
  if (client.lat && client.lng) return;
  if (!client.city && !client.business_name) return;
  setImmediate(async () => {
    const coords = await geocodeNominatim(client.business_name || '', client.city || '');
    if (coords) {
      await pool.query('UPDATE clients SET lat = $1, lng = $2 WHERE id = $3', [coords.lat, coords.lng, client.id]);
      console.log(`[geo] geocoded client ${client.id} (${client.business_name}): ${coords.lat}, ${coords.lng}`);
    }
  });
}

/** Convert decimal degrees to GPS rational format [[deg,1],[min,1],[sec*100,100]] */
function decimalToGpsRational(decimal) {
  const d = Math.floor(Math.abs(decimal));
  const mDecimal = (Math.abs(decimal) - d) * 60;
  const m = Math.floor(mDecimal);
  const s = Math.round((mDecimal - m) * 60 * 100);
  return [[d, 1], [m, 1], [s, 100]];
}

/** Build SEO-friendly filename from business name + category. */
function seoFilename(businessName, category) {
  const slug = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${slug(businessName)}-${slug(category)}-${Date.now()}.jpg`;
}

// In-memory location cache — populated by permission-check, avoids repeated accounts.list calls
const locationMemCache = new Map(); // clientId -> locationName

// GBP response cache — prevents quota exhaustion (mybusiness API limits)
const gbpCache = new Map(); // key: `${clientId}:${route}` -> { data, ts }
const GBP_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

function getGbpCached(key) {
  const entry = gbpCache.get(key);
  if (entry && Date.now() - entry.ts < GBP_CACHE_TTL_MS) return entry.data;
  return null;
}
function setGbpCached(key, data) {
  gbpCache.set(key, { data, ts: Date.now() });
}
function invalidateGbpCache(clientId, route) {
  gbpCache.delete(`${clientId}:${route}`);
}

// Per-client rate guard — prevents hammering accounts.list even if frontend retries or React StrictMode double-fires
const lastGbpCallTime = new Map(); // clientId -> timestamp (ms)
const GBP_CALL_COOLDOWN_MS = 65_000;
const gbpInFlight = new Set(); // clientIds currently awaiting accounts.list — prevents race-condition double-fire

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

async function callClaude(systemPrompt, messages, maxTokens = 400, model = 'claude-sonnet-4-6') {
  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages,
  });
  return response.content[0].text;
}

/** Score AI-generated content via Haiku. Returns { score, tips, strengths }. Never throws. */
async function scoreContent(type, generatedText, client) {
  const city = client.city || 'the local area';
  const bizName = client.business_name || 'this business';
  const criteria = {
    post: `- Local keyword / city mention present (worth 20pts)
- Strong CTA in closing line (worth 20pts)
- Compelling hook in opening (worth 20pts)
- Business name mentioned naturally (worth 15pts)
- Length 190-220 words (worth 15pts)
- No generic filler phrases (worth 10pts)`,
    reply: `- Tone mirrors the review's sentiment (worth 25pts)
- Specific service or item mentioned (worth 20pts)
- Location reference included naturally (worth 20pts)
- Length 40-90 words (worth 20pts)
- No generic phrases like "We value your feedback" (worth 15pts)`,
    answer: `- Directly answers the question asked (worth 30pts)
- SEO keywords woven in naturally (worth 25pts)
- Business-specific info included (worth 20pts)
- Appropriate length for the style chosen (worth 15pts)
- Professional but friendly tone (worth 10pts)`,
  };
  const prompt = `Score this Google Business Profile ${type} for a business called "${bizName}" in ${city}.

Scoring criteria (total 100 points):
${criteria[type] || criteria.post}

Content to score:
"""
${generatedText.slice(0, 1500)}
"""

Return ONLY valid JSON with no explanation:
{"score":<0-100>,"tips":["<tip1>","<tip2>","<tip3>"],"strengths":["<strength1>","<strength2>"]}
Tips are improvements needed (max 3, short phrases). Strengths are what's working well (max 2, short phrases).`;

  try {
    const raw = await callClaude(
      'You are a GBP content quality scorer. Return only valid JSON.',
      [{ role: 'user', content: prompt }],
      200,
      'claude-haiku-4-5-20251001',
    );
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    return {
      score: Math.min(100, Math.max(0, parseInt(parsed.score, 10) || 70)),
      tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 3) : [],
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 2) : [],
    };
  } catch {
    return { score: 70, tips: [], strengths: [] };
  }
}

/** Build system prompt for manual post generation */
function buildManualPostSystemPrompt(client, businessMemory, postType, targetName, targetCity, lang = 'en') {
  const bizLabel = BUSINESS_TYPE_LABELS[client.business_type || 'general'] || 'local business';
  const city = targetCity || client.city || 'the local area';
  const bizName = targetName || client.business_name || 'the business';
  const socialLinks = client.social_links || {};
  const activeSocials = Object.entries(socialLinks)
    .filter(([, url]) => url)
    .map(([p]) => p.charAt(0).toUpperCase() + p.slice(1));

  const postTypeNote = {
    offer: 'This is an OFFER post. Include a clear promotional offer or limited-time deal. Make it feel urgent but genuine.',
    event: 'This is an EVENT post. Frame around a specific date-relevant service, seasonal event, or local occasion.',
    seasonal: 'This is a SEASONAL post. Tie the content to the current season or upcoming holiday naturally.',
    standard: 'This is a standard UPDATE post. Focus on a service, recent job, or helpful tip.',
  }[postType] || 'This is a standard UPDATE post.';

  const memorySection = businessMemory ? `\n## Business Memory (reference)\n${businessMemory}\n` : '';
  const socialNote = activeSocials.length > 0
    ? `Active social platforms: ${activeSocials.join(', ')} — you may reference these in the CTA naturally.`
    : '';

  return `You are a local business marketing expert writing Google Business Profile posts for ${bizLabel}s in ${city}.

Business name: ${bizName}
Location: ${city}
${memorySection}
## Quality Rubric — you MUST earn all 100 points:
- [20pts] Mention "${city}" or the specific neighborhood at least once naturally in the body
- [20pts] Strong, specific CTA in the closing line (include phone/booking/address — not just "give us a call")
- [20pts] Compelling opening hook that targets a real customer pain point
- [15pts] Use the exact business name "${bizName}" naturally in the body (NEVER write [Business Name] or any placeholder)
- [15pts] Total length 190-220 words — aim for the full 220
- [10pts] Zero generic filler ("In today's world", "Are you looking for", "right tools right know-how", "We value…")

## Format:
1. Opening: single emoji + punchy hook. No period.
2. Body: 2-3 sentences about ${bizName} and how they solve the problem. Include the city name here.
3. Bullet list (3 items) using ✅ for specific services/benefits.
4. One sentence of key value or social proof.
5. Closing CTA: emoji + specific action with contact detail. ${socialNote}

## Rules:
- No hashtags
- Sound like a real local business owner, not a marketing robot
- End with action, not a question
- NEVER use brackets or placeholders of any kind
- Write exactly 190-220 words — do not stop short
- Language: write entirely in ${lang === 'es' ? 'Spanish' : 'English'}

Post type: ${postTypeNote}`;
}

/** Download a photo URL → base64 string + mimeType. Returns null on failure. */
async function fetchPhotoAsBase64(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const mimeType = contentType.split(';')[0].trim();
    const buffer = Buffer.from(await res.arrayBuffer());
    return { base64: buffer.toString('base64'), mimeType };
  } catch (e) {
    console.warn('fetchPhotoAsBase64 failed:', e.message);
    return null;
  }
}

/** Use Claude Vision (Haiku) to describe a single photo in ~15 words. */
async function describePhotoWithVision(base64, mimeType, businessName, bizLabel) {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 60,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
        { type: 'text', text: `You are describing a Google Business Profile photo for ${businessName}, a ${bizLabel}. Describe what you see in 10–15 words. Be specific about subjects, colors, setting. No intro, no punctuation at end.` },
      ],
    }],
  });
  return response.content[0].text.trim();
}


/**
 * Background job: label up to `limit` unlabeled photos for a client using Claude Vision.
 * Fires and forgets — caller does NOT await this.
 */
// ─── Build reply system prompt (shared by manual + auto-draft) ────────────────
async function buildReplySystemPrompt(client) {
  const bizLabel = BUSINESS_TYPE_LABELS[client.business_type || 'general'] || 'local business';
  const city = client.city || '';
  const locationLine = city ? ` serving ${city}` : '';
  const businessMemory = await getBusinessMemory(client.id);
  const memorySection = businessMemory
    ? `\n\n## What we know about this business\n${businessMemory}`
    : '';
  return `You are the owner of ${client.business_name}, a ${bizLabel}${locationLine}. Write a genuine, reputation-protecting, SEO-aware reply to a Google review.

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
- Never be defensive, never argue, never dismiss.
- Language: reply in the same language the reviewer wrote in. If the review is in Spanish, reply entirely in Spanish.${memorySection}`;
}

// ─── Auto-draft pending replies for unreplied reviews (background) ─────────────
async function generatePendingReplies(client, reviews, _mybusiness, autoPostHours = 24) {
  try {
    const systemPrompt = await buildReplySystemPrompt(client);
    for (const review of reviews.slice(0, 10)) {
      try {
        const reviewId = review.name.split('/').pop();
        const stars = { ONE: '1/5', TWO: '2/5', THREE: '3/5', FOUR: '4/5', FIVE: '5/5' }[review.starRating] || review.starRating;
        const userPrompt = `Rating: ${stars} stars\nReview: "${review.comment || '(no written comment, just a star rating)'}"`;
        const draftText = await callClaude(systemPrompt, [{ role: 'user', content: userPrompt }], 200);
        const autoPostAt = new Date(Date.now() + autoPostHours * 3600 * 1000).toISOString();
        await pool.query(
          `INSERT INTO pending_replies (client_id, review_name, review_id, draft_text, auto_post_at)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (client_id, review_id) DO NOTHING`,
          [client.id, review.name, reviewId, draftText, autoPostAt]
        );
        console.log(`[auto-reply] drafted reply for review ${reviewId} (client ${client.id})`);
      } catch (e) {
        console.warn(`[auto-reply] failed to draft for review ${review.name}:`, e.message);
      }
    }
  } catch (e) {
    console.warn('[auto-reply] generatePendingReplies error:', e.message);
  }
}

// ─── Business Memory Helpers ──────────────────────────────────

/**
 * Fetch the client's business memory from DB.
 * Returns '' on any error or if no row exists — graceful no-op for all callers.
 * Hard-trimmed to 2000 chars (~500 tokens) before injection into prompts.
 */
async function getBusinessMemory(clientId) {
  try {
    const { rows } = await pool.query(
      'SELECT content FROM business_memory WHERE client_id = $1',
      [clientId]
    );
    if (!rows[0]?.content) return '';
    const raw = rows[0].content;
    if (raw.length <= 2000) return raw;
    const trimmed = raw.slice(0, 2000);
    const lastNewline = trimmed.lastIndexOf('\n');
    return (lastNewline > 1500 ? trimmed.slice(0, lastNewline) : trimmed) + '\n[...memory truncated]';
  } catch (e) {
    console.warn('[memory] getBusinessMemory error (non-fatal):', e.message);
    return '';
  }
}

/**
 * One-time bootstrap: builds the initial business memory document using Sonnet.
 * Assembles data from GBP, products, post history, and reply history.
 * Idempotent — safe to call multiple times (ON CONFLICT DO UPDATE).
 */
async function bootstrapMemory(client) {
  try {
    const bizLabel = BUSINESS_TYPE_LABELS[client.business_type || 'general'] || 'local business';

    // 1. Products from DB
    const { rows: productRows } = await pool.query(
      'SELECT name, description FROM products WHERE client_id = $1 ORDER BY created_at ASC LIMIT 10',
      [client.id]
    );

    // 2. GBP description + services (best-effort)
    let gbpDescription = '';
    let gbpServices = [];
    try {
      const auth = getClientAuth(client);
      const locationName = await ensureLocation(client);
      const locRes = await google.mybusinessbusinessinformation({ version: 'v1', auth })
        .locations.get({ name: locationName, readMask: 'profile,serviceItems' });
      gbpDescription = locRes.data?.profile?.description || '';
      gbpServices = (locRes.data?.serviceItems || [])
        .filter((s) => s.freeFormServiceItem?.label?.displayName)
        .slice(0, 8)
        .map((s) => s.freeFormServiceItem.label.displayName);
    } catch (e) {
      console.warn('[memory] bootstrap GBP fetch skipped:', e.message);
    }

    // 3. Top 5 search queries used in past posts
    const { rows: queryRows } = await pool.query(
      `SELECT search_query, COUNT(*) AS cnt FROM posts
       WHERE client_id = $1 AND search_query IS NOT NULL
       GROUP BY search_query ORDER BY cnt DESC LIMIT 5`,
      [client.id]
    );

    // 4. Last 3 posted review replies
    const { rows: replyRows } = await pool.query(
      `SELECT draft_text FROM pending_replies
       WHERE client_id = $1 AND status = 'posted'
       ORDER BY created_at DESC LIMIT 3`,
      [client.id]
    );

    const serviceList = gbpServices.length > 0 ? gbpServices : productRows.map((p) => p.name);
    const socialLinks = client.social_links || {};
    const activeSocials = Object.entries(socialLinks).filter(([, v]) => v).map(([k]) => k);

    const inputSummary = [
      `Business: ${client.business_name}`,
      `Type: ${bizLabel}`,
      `City: ${client.city || 'unknown'}`,
      `Tone setting: ${client.tone || 'Friendly'}`,
      gbpDescription ? `GBP description: "${gbpDescription}"` : null,
      serviceList.length > 0 ? `Services/products: ${serviceList.join(', ')}` : null,
      activeSocials.length > 0 ? `Active social platforms: ${activeSocials.join(', ')}` : null,
      queryRows.length > 0 ? `Top search queries used in posts: ${queryRows.map((r) => r.search_query).join(', ')}` : null,
      replyRows.length > 0 ? `Sample review replies posted: ${replyRows.map((r) => r.draft_text.slice(0, 120)).join(' | ')}` : null,
    ].filter(Boolean).join('\n');

    const systemPrompt = `You are writing a concise internal business memory document for an AI content system. This document will be injected into future AI prompts to ensure consistency. Write dense, specific facts — not instructions or marketing copy.

Output ONLY the markdown document, no preamble or explanation. Keep it under 450 words. Use these exact section headers:

## Business Identity
## Voice & Tone
## Top Services
## What Has Worked
## Review Patterns
## Q&A Themes`;

    const content = await callClaude(
      systemPrompt,
      [{ role: 'user', content: `Generate the business memory document for this business:\n\n${inputSummary}` }],
      600
    );

    await pool.query(
      `INSERT INTO business_memory (client_id, content, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (client_id) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()`,
      [client.id, content]
    );
    console.log(`[memory] bootstrapped for client ${client.id}`);
    return content;
  } catch (e) {
    console.warn('[memory] bootstrapMemory error:', e.message);
    return '';
  }
}

/**
 * Background update: append learnings after a post is generated.
 * Uses Haiku — cheap and fast. Fires via setImmediate, never blocks generation.
 */
async function updateMemoryAfterPost(client, post) {
  try {
    const { rows } = await pool.query(
      'SELECT content FROM business_memory WHERE client_id = $1',
      [client.id]
    );
    if (!rows[0]?.content) return;
    const updated = await callClaude(
      `You maintain a business memory document for an AI content system. A new GBP post was just generated. Update ONLY the "What Has Worked" and "Top Services" sections with brief factual notes — do not repeat what is already there. Keep additions under 50 words total. Return the COMPLETE updated document.`,
      [{ role: 'user', content: `Current memory:\n${rows[0].content}\n\nNew post:\nSearch query: "${post.search_query || 'none'}"\nPost type: ${post.post_type || 'standard'}\nPost text: "${(post.post_text || '').slice(0, 300)}"` }],
      700,
      'claude-haiku-4-5-20251001'
    );
    await pool.query(
      'UPDATE business_memory SET content = $1, updated_at = NOW() WHERE client_id = $2',
      [updated, client.id]
    );
  } catch (e) {
    console.warn('[memory] updateMemoryAfterPost error (non-fatal):', e.message);
  }
}

/**
 * Background update: append learnings after a review reply is posted.
 */
async function updateMemoryAfterReply(client, reviewStars, reviewText, replyText) {
  try {
    const { rows } = await pool.query(
      'SELECT content FROM business_memory WHERE client_id = $1',
      [client.id]
    );
    if (!rows[0]?.content) return;
    const updated = await callClaude(
      `You maintain a business memory document for an AI content system. A review reply was just posted to Google. Update ONLY the "Review Patterns" section with brief factual notes about sentiment or recurring themes — do not repeat existing notes. Keep additions under 40 words. Return the COMPLETE updated document.`,
      [{ role: 'user', content: `Current memory:\n${rows[0].content}\n\nReview: ${reviewStars}/5 stars — "${(reviewText || '(no comment)').slice(0, 200)}"\nOur reply: "${(replyText || '').slice(0, 200)}"` }],
      700,
      'claude-haiku-4-5-20251001'
    );
    await pool.query(
      'UPDATE business_memory SET content = $1, updated_at = NOW() WHERE client_id = $2',
      [updated, client.id]
    );
  } catch (e) {
    console.warn('[memory] updateMemoryAfterReply error (non-fatal):', e.message);
  }
}

/**
 * Background update: append learnings after a Q&A answer is posted.
 */
async function updateMemoryAfterQA(client, questionText, answerText) {
  try {
    const { rows } = await pool.query(
      'SELECT content FROM business_memory WHERE client_id = $1',
      [client.id]
    );
    if (!rows[0]?.content) return;
    const updated = await callClaude(
      `You maintain a business memory document for an AI content system. A Q&A answer was just posted to Google. Update ONLY the "Q&A Themes" section with brief factual notes about recurring question topics — do not repeat existing notes. Keep additions under 40 words. Return the COMPLETE updated document.`,
      [{ role: 'user', content: `Current memory:\n${rows[0].content}\n\nQuestion: "${(questionText || '').slice(0, 200)}"\nAnswer: "${(answerText || '').slice(0, 200)}"` }],
      700,
      'claude-haiku-4-5-20251001'
    );
    await pool.query(
      'UPDATE business_memory SET content = $1, updated_at = NOW() WHERE client_id = $2',
      [updated, client.id]
    );
  } catch (e) {
    console.warn('[memory] updateMemoryAfterQA error (non-fatal):', e.message);
  }
}

async function labelPhotosInBackground(client, photos, bizLabel, limit = 5) {
  try {
    const photoUrls = photos.slice(0, 20).map((p) => p.googleUrl || p.sourceUrl).filter(Boolean);
    if (photoUrls.length === 0) return;

    // Find which URLs we've already labeled
    const { rows: existing } = await pool.query(
      'SELECT photo_url FROM photo_labels WHERE client_id = $1',
      [client.id]
    );
    const labeled = new Set(existing.map((r) => r.photo_url));
    const toLabel = photoUrls.filter((url) => !labeled.has(url)).slice(0, limit);
    if (toLabel.length === 0) return;

    for (const url of toLabel) {
      try {
        const img = await fetchPhotoAsBase64(url);
        if (!img) continue;
        const description = await describePhotoWithVision(img.base64, img.mimeType, client.business_name, bizLabel);
        await pool.query(
          `INSERT INTO photo_labels (client_id, photo_url, ai_description)
           VALUES ($1, $2, $3)
           ON CONFLICT (client_id, photo_url) DO UPDATE SET ai_description = EXCLUDED.ai_description`,
          [client.id, url, description]
        );
        console.log(`[vision] labeled photo for client ${client.id}: "${description}"`);
      } catch (e) {
        console.warn(`[vision] failed to label ${url}:`, e.message);
      }
    }
  } catch (e) {
    console.warn('[vision] labelPhotosInBackground error:', e.message);
  }
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
    const clientId = result.rows[0].id;
    req.session.clientId = clientId;
    req.session.pendingSignup = null;

    // Background: fetch GBP account name once using the fresh OAuth tokens.
    // Skips if checked within 5 min to prevent quota exhaustion on rapid re-logins.
    setImmediate(async () => {
      try {
        const { rows: [row] } = await pool.query('SELECT gbp_account_name, last_gbp_check FROM clients WHERE id = $1', [clientId]);
        if (row?.gbp_account_name) return; // already saved
        const lastCheck = row?.last_gbp_check ? new Date(row.last_gbp_check).getTime() : 0;
        if (Date.now() - lastCheck < 5 * 60 * 1000) {
          console.log(`[oauth] GBP lookup skipped for client ${clientId} — checked within 5 min`);
          return;
        }
        const accountMgmt = google.mybusinessaccountmanagement({ version: 'v1', auth: callbackClient });
        const accountsRes = await accountMgmt.accounts.list();
        const account = accountsRes.data.accounts?.[0];
        if (account) {
          const bizInfo = google.mybusinessbusinessinformation({ version: 'v1', auth: callbackClient });
          const locRes = await bizInfo.accounts.locations.list({ parent: account.name, readMask: 'name' });
          const loc = locRes.data.locations?.[0];
          if (loc) {
            // Write timestamp only on success so a 429 failure doesn't lock out the next attempt
            await pool.query('UPDATE clients SET gbp_account_name = $1, last_gbp_check = NOW() WHERE id = $2', [loc.name, clientId]);
            locationMemCache.set(clientId, loc.name);
            console.log(`✅ GBP location cached at login for client ${clientId}:`, loc.name);
          }
        }
      } catch (e) {
        console.warn(`[oauth] GBP account lookup failed for client ${clientId}:`, e.message);
      }
    });

    const jwtToken = jwt.sign({ clientId }, process.env.SESSION_SECRET, { expiresIn: '30d' });
    req.session.save(() => {
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${jwtToken}`);
    });
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?error=auth_failed`);
  }
});

app.post('/auth/presignup', (req, res) => {
  const { name, businessName, businessType, whatsapp, tone, postsPerWeek } = req.body;
  req.session.pendingSignup = { name, businessName, businessType, whatsapp, tone, postsPerWeek };
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
    const isProd = process.env.NODE_ENV === 'production';
    res.setHeader('Set-Cookie', `hayvista_token=${token}; Path=/; Max-Age=${30 * 24 * 3600}; HttpOnly; SameSite=${isProd ? 'None' : 'Lax'}${isProd ? '; Secure' : ''}`);
    res.json({ ok: true });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'An internal error occurred' });
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
    const isProd = process.env.NODE_ENV === 'production';
    res.setHeader('Set-Cookie', `hayvista_token=${token}; Path=/; Max-Age=${30 * 24 * 3600}; HttpOnly; SameSite=${isProd ? 'None' : 'Lax'}${isProd ? '; Secure' : ''}`);
    res.json({ ok: true });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

app.post('/auth/logout', (req, res) => {
  req.session.destroy(() => {});
  res.setHeader('Set-Cookie', 'hayvista_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict');
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
  const clientId = req.session.clientId;
  // In-process guard (single-instance, same event loop)
  if (gbpInFlight.has(clientId)) {
    return res.json({ ok: true, locationReady: false, cooldownSec: 65 });
  }
  gbpInFlight.add(clientId);
  try {
    const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [clientId]);
    const client = rows[0];

    // If location already saved in DB, return immediately — never call accounts.list again
    if (client.gbp_account_name) {
      locationMemCache.set(client.id, client.gbp_account_name);
      return res.json({ ok: true, locationReady: true });
    }

    // Atomic DB-level rate guard — works across multiple Railway instances.
    // UPDATE only succeeds if no recent call exists; acts as a distributed mutex.
    const { rowCount } = await pool.query(
      `UPDATE clients SET last_gbp_check = NOW()
       WHERE id = $1 AND (last_gbp_check IS NULL OR last_gbp_check < NOW() - INTERVAL '65 seconds')`,
      [clientId]
    );
    if (rowCount === 0) {
      const { rows: fresh } = await pool.query('SELECT last_gbp_check FROM clients WHERE id = $1', [clientId]);
      const lastMs = fresh[0]?.last_gbp_check ? new Date(fresh[0].last_gbp_check).getTime() : 0;
      const remainingSec = Math.max(0, Math.round((lastMs + GBP_CALL_COOLDOWN_MS - Date.now()) / 1000));
      console.log(`⏳ DB rate guard: blocking for client ${clientId} (${remainingSec}s remaining)`);
      return res.json({ ok: true, locationReady: false, cooldownSec: remainingSec || 65 });
    }
    // Also update in-memory map for fast-path on same instance
    lastGbpCallTime.set(clientId, Date.now());

    const auth = getClientAuth(client);

    // --- Try v1 mybusinessaccountmanagement first ---
    let locationName = null;
    try {
      const accountMgmt = google.mybusinessaccountmanagement({ version: 'v1', auth });
      const accountsRes = await accountMgmt.accounts.list();
      const account = accountsRes.data.accounts?.[0];
      console.log('✅ accounts.list (v1) succeeded, account:', account?.name);
      if (account) {
        const bizInfo = google.mybusinessbusinessinformation({ version: 'v1', auth });
        const locRes = await bizInfo.accounts.locations.list({ parent: account.name, readMask: 'name' });
        locationName = locRes.data.locations?.[0]?.name || null;
      }
    } catch (v1Err) {
      const v1Msg = v1Err.message || '';
      const isQuota = v1Err.status === 429 || v1Msg.includes('rateLimitExceeded') || v1Msg.includes('Quota exceeded') || v1Msg.includes('RESOURCE_EXHAUSTED');
      console.warn('⚠️  accounts.list (v1) failed:', v1Err.status, v1Msg.slice(0, 80));

      if (isQuota || v1Err.status === 403) {
        // --- Fallback: try GBP v4 accounts.list ---
        try {
          const v4Accounts = await gbpV4Fetch(auth, 'GET', 'accounts');
          const account = v4Accounts.accounts?.[0];
          console.log('✅ accounts.list (v4 fallback) succeeded, account:', account?.name);
          if (account) {
            const v4Locs = await gbpV4Fetch(auth, 'GET', `${account.name}/locations`);
            locationName = v4Locs.locations?.[0]?.name || null;
            console.log('✅ locations.list (v4 fallback) locationName:', locationName);
          }
        } catch (v4Err) {
          console.warn('⚠️  accounts.list (v4 fallback) failed:', v4Err.message?.slice(0, 120));
          // Both APIs failed — surface as a quota/API-not-enabled error
          if (!locationName) throw v1Err; // re-throw original for UI handling
        }
      } else {
        throw v1Err;
      }
    }

    let locationReady = false;
    if (locationName) {
      await pool.query('UPDATE clients SET gbp_account_name = $1 WHERE id = $2', [locationName, client.id]);
      locationMemCache.set(client.id, locationName);
      console.log('✅ GBP location cached:', locationName);
      locationReady = true;
    }
    res.json({ ok: true, locationReady });
  } catch (err) {
    const msg = err.message || '';
    const status = err.status || err.code || 0;
    console.error('🔴 Permission check failed:', status, msg.slice(0, 120));
    if (status === 429 || msg.includes('rateLimitExceeded') || msg.includes('Quota exceeded')) {
      return res.json({ ok: true, locationReady: false });
    }
    const isPermission = msg.includes('Insufficient') || status === 403;
    const isNotEnabled = msg.includes('has not been used') || msg.includes('disabled') || msg.includes('SERVICE_DISABLED');
    res.status(isPermission ? 403 : 500).json({
      ok: false, locationReady: false, error: msg, status, needsReauth: isPermission, apiNotEnabled: isNotEnabled,
    });
  } finally {
    gbpInFlight.delete(clientId);
  }
});

// ─── /api/me ─────────────────────────────────────────────────
const SAFE_CLIENT_COLUMNS = `id, email, name, business_name, whatsapp, tone, business_type,
  posts_per_week, subscription_status, review_link, city, social_links,
  gbp_account_name, created_at`;

const OWNER_EMAIL = 'hayvista@gmail.com';

app.get('/api/me', requireAuth, async (req, res) => {
  const client = await pool.query(`SELECT ${SAFE_CLIENT_COLUMNS} FROM clients WHERE id = $1`, [req.session.clientId]);
  const posts = await pool.query('SELECT * FROM posts WHERE client_id = $1 ORDER BY posted_at DESC LIMIT 20', [req.session.clientId]);
  const products = await pool.query('SELECT * FROM products WHERE client_id = $1 ORDER BY created_at ASC', [req.session.clientId]);
  const row = client.rows[0];
  res.json({ client: { ...row, isOwner: row?.email === OWNER_EMAIL }, posts: posts.rows, products: products.rows });
});

// ─── Owner-only middleware ────────────────────────────────────────────────────
async function requireOwner(req, res, next) {
  if (!req.session?.clientId) return res.status(401).json({ error: 'Unauthorized' });
  const { rows } = await pool.query('SELECT email FROM clients WHERE id = $1', [req.session.clientId]);
  if (!rows.length || rows[0].email !== OWNER_EMAIL) return res.status(403).json({ error: 'Forbidden' });
  next();
}

// ─── Owner: process image ─────────────────────────────────────────────────────
app.post('/api/owner/process-image', requireOwner, upload.single('photo'), async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.session.clientId]);
    const client = rows[0];
    const category = req.body.category || 'EXTERIOR';
    const manualCaption = req.body.caption || '';
    const bizLabel = BUSINESS_TYPE_LABELS[client.business_type || 'general'] || 'local business';

    // 1. Claude Vision — describe the photo
    let aiCaption = '';
    try {
      const base64 = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype || 'image/jpeg';
      aiCaption = await describePhotoWithVision(base64, mimeType, client.business_name, bizLabel);
    } catch (e) {
      console.warn('[owner] Vision failed:', e.message);
    }
    const finalCaption = manualCaption || aiCaption;

    // 2. Claude — generate full SEO metadata
    let meta = {
      title: `${client.business_name} - ${category.toLowerCase()}`,
      description: finalCaption || `${category} photo from ${client.business_name}`,
      keywords: [client.business_name, bizLabel, category.toLowerCase()],
    };
    try {
      const metaPrompt = `Generate SEO metadata for a GBP photo.
Business: ${client.business_name} (${bizLabel})
Category: ${category}
AI caption: "${finalCaption}"
Return ONLY JSON: {"title":"<60 chars","description":"<150 chars","keywords":["k1","k2","k3","k4","k5"]}`;
      const raw = await callClaude('Return only valid JSON, no explanation.', [{ role: 'user', content: metaPrompt }], 300);
      meta = { ...meta, ...JSON.parse(raw.replace(/```json|```/g, '').trim()) };
    } catch (e) {
      console.warn('[owner] Meta generation failed:', e.message);
    }

    // 3. Geocode if needed
    geocodeClientIfNeeded(client);
    const lat = client.lat ? parseFloat(client.lat) : null;
    const lng = client.lng ? parseFloat(client.lng) : null;

    const gpsExif = (lat && lng) ? {
      GPS: {
        GPSLatitudeRef: lat >= 0 ? 'N' : 'S',
        GPSLatitude: decimalToGpsRational(lat),
        GPSLongitudeRef: lng >= 0 ? 'E' : 'W',
        GPSLongitude: decimalToGpsRational(lng),
        GPSVersionID: '2300',
      },
    } : {};

    // 4. Process with Sharp — inject all EXIF + GPS
    const filename = seoFilename(client.business_name, category);
    const outputPath = join(UPLOADS_DIR, filename);

    await sharp(req.file.buffer)
      .jpeg({ quality: 92 })
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
          ...gpsExif,
        },
      })
      .toFile(outputPath);

    const backendUrl = process.env.BACKEND_URL || `http://localhost:${PORT}`;
    const publicUrl = `${backendUrl}/uploads/${filename}`;

    res.json({
      ok: true,
      filename,
      downloadUrl: publicUrl,
      meta: {
        title: meta.title,
        description: meta.description,
        keywords: meta.keywords,
        aiCaption,
        category,
        gpsInjected: !!(lat && lng),
        lat, lng,
      },
    });
  } catch (err) {
    console.error('[owner] process-image error:', err);
    res.status(500).json({ error: 'Processing failed' });
  }
});

// ─── Posts ────────────────────────────────────────────────────

app.patch('/api/posts/:id', requireAuth, async (req, res) => {
  try {
    const { text, status } = req.body;
    if (!text?.trim() && !status) return res.status(400).json({ error: 'text or status required' });
    const VALID_STATUS = ['pending', 'approved', 'posted'];
    if (status && !VALID_STATUS.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const sets = [];
    const vals = [];
    let i = 1;
    if (text?.trim()) {
      sets.push(`post_text = $${i++}`);
      vals.push(text.trim());
      // Editing resets the auto-approve window to 20 hours from now
      sets.push(`auto_approve_at = NOW() + INTERVAL '20 hours'`);
    }
    if (status) {
      sets.push(`status = $${i++}`);
      vals.push(status);
      // Manual approve/discard clears the timer
      sets.push(`auto_approve_at = NULL`);
    }
    vals.push(req.params.id, req.session.clientId);
    const result = await pool.query(
      `UPDATE posts SET ${sets.join(', ')} WHERE id = $${i++} AND client_id = $${i} RETURNING *`,
      vals
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Post not found' });
    const post = result.rows[0];

    // "Post Now" — attempt live GBP publish
    if (status === 'approved') {
      const { rows: [client] } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.session.clientId]);
      try {
        const auth = getClientAuth(client);
        const locationName = await ensureLocation(client);
        const requestBody = { languageCode: 'en-US', summary: post.post_text, topicType: 'STANDARD' };
        if (post.photo_url) requestBody.media = [{ mediaFormat: 'PHOTO', sourceUrl: post.photo_url }];
        await gbpV4Fetch(auth, 'POST', `${locationName}/localPosts`, requestBody);
        const { rows: [updated] } = await pool.query(
          `UPDATE posts SET status = 'posted', posted_at = NOW() WHERE id = $1 RETURNING *`,
          [post.id]
        );
        return res.json({ post: updated });
      } catch (e) {
        console.warn(`GBP post publish failed for post ${post.id}:`, e.message);
        // Status stays 'approved' — visible in dashboard, won't retry automatically
      }
    }

    res.json({ post });
  } catch (err) {
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

app.delete('/api/posts/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM posts WHERE id = $1 AND client_id = $2', [req.params.id, req.session.clientId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

app.post('/api/generate-post', requireAuth, async (req, res) => {
  try {
    const VALID_POST_TYPES = ['standard', 'offer', 'event'];
    const postType = VALID_POST_TYPES.includes(req.body?.postType) ? req.body.postType : undefined;
    const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.session.clientId]);
    const post = await generatePostForClient(rows[0], postType);
    res.json({ post });
  } catch (err) {
    console.error('Generate post error:', err);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Owner Studio — generate a post draft without saving it (copy/paste into GBP manually)
app.post('/api/posts/generate-draft', requireOwner, async (req, res) => {
  try {
    const topic = typeof req.body?.topic === 'string' ? req.body.topic.trim().slice(0, 200) : '';
    const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.session.clientId]);
    const post = await generatePostForClient(rows[0], undefined, topic || undefined);
    res.json({ post });
  } catch (err) {
    console.error('Generate draft error:', err);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// MANUAL MODE — AI content creation tools (no GBP API required)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Manual: Write Post ───────────────────────────────────────────────────────
app.post('/api/manual/write-post', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.session.clientId]);
    const client = rows[0];
    const VALID_TYPES = ['standard', 'offer', 'event', 'seasonal'];
    const postType = VALID_TYPES.includes(req.body?.postType) ? req.body.postType : 'standard';
    const seoKeyword = typeof req.body?.seoKeyword === 'string' ? req.body.seoKeyword.trim().slice(0, 60) : '';
    const lang = req.body?.lang === 'es' ? 'es' : 'en';
    const rawAnswers = req.body?.contextAnswers;
    const contextAnswers = Array.isArray(rawAnswers) ? rawAnswers.slice(0, 5).map((a) => String(a).trim().slice(0, 500)) : [];

    // 1. Business memory
    const businessMemory = await getBusinessMemory(client.id);

    // Q4 = city/neighborhood (index 3), Q5 = business name (index 4)
    const targetCity = contextAnswers[3] || client.city || 'the local area';
    const targetName = contextAnswers[4] || client.business_name;

    // 2. Build system prompt — pass targetName + targetCity + lang so rubric references exact values
    const systemPrompt = buildManualPostSystemPrompt(client, businessMemory, postType, targetName, targetCity, lang);
    const city = targetCity;
    // Build context block from Q1–Q3 only (city + name are used directly in prompt)
    const contextAnswersFilled = contextAnswers.slice(0, 3).filter(Boolean);
    const seoLine = seoKeyword ? `\nTarget SEO keyword to weave in naturally: "${seoKeyword}"` : '';

    // 3. Generate post — multimodal (image → post) or text-only
    let generatedText;
    let aiCaption = '';

    if (req.file) {
      // Image path: pass image directly to Sonnet so it writes the post while looking at the photo.
      // Simultaneously get a short Haiku caption for the "AI saw:" UI display.
      const base64 = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype || 'image/jpeg';
      const ownerContext = contextAnswersFilled.length > 0
        ? `\n\nThe business owner also provided their perspective:\n${contextAnswersFilled.map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\nUse both the photo and the owner's description equally — the image shows what happened, the owner's words give you their angle and intent.`
        : '\n\nWrite the post based on what you see in the photo.';
      const userText = `Write a GBP post for ${targetName} in ${city}. Weave the business name naturally into the post body.${seoLine}${ownerContext}`;

      const [postResponse, captionText] = await Promise.all([
        anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 700,
          system: systemPrompt,
          messages: [{ role: 'user', content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
            { type: 'text', text: userText },
          ]}],
        }),
        describePhotoWithVision(base64, mimeType, client.business_name,
          BUSINESS_TYPE_LABELS[client.business_type || 'general'] || 'local business'
        ).catch(() => ''),
      ]);
      generatedText = postResponse.content[0].text.trim();
      aiCaption = captionText;
    } else {
      // Text-only path
      const contextBlock = contextAnswersFilled.map((a, i) => `Context ${i + 1}: ${a}`).join('\n');
      const userPrompt = `Write a GBP post for ${targetName} in ${city}. Weave the business name naturally into the post body.${seoLine}\n${contextBlock}`;
      generatedText = await callClaude(systemPrompt, [{ role: 'user', content: userPrompt }], 700);
    }

    // 4. Score
    const { score, tips, strengths } = await scoreContent('post', generatedText, client);

    // 5. Save to library
    const { rows: saved } = await pool.query(
      `INSERT INTO manual_content (client_id, type, input_data, generated_text, quality_score, quality_tips, quality_strengths)
       VALUES ($1, 'post', $2, $3, $4, $5, $6) RETURNING id, created_at`,
      [client.id, JSON.stringify({ postType, seoKeyword, contextAnswers, aiCaption }), generatedText, score, JSON.stringify(tips), JSON.stringify(strengths)],
    );

    // 6. Update memory non-blocking
    if (businessMemory) setImmediate(() => updateMemoryAfterPost(client, { post_text: generatedText, search_query: seoKeyword }).catch(() => {}));

    res.json({ id: saved[0].id, generatedText, qualityScore: score, tips, strengths, aiCaption, charCount: generatedText.length });
  } catch (err) {
    console.error('[manual/write-post]', err);
    res.status(500).json({ error: 'Post generation failed' });
  }
});

// ─── Manual: Write Review Reply ───────────────────────────────────────────────
app.post('/api/manual/write-reply', requireAuth, async (req, res) => {
  try {
    const reviewText = typeof req.body?.reviewText === 'string' ? req.body.reviewText.trim().slice(0, 5000) : '';
    const starRating = Math.min(5, Math.max(1, parseInt(req.body?.starRating, 10) || 3));
    if (!reviewText) return res.status(400).json({ error: 'reviewText is required' });

    const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.session.clientId]);
    const client = rows[0];

    // 1. Detect sentiment + key phrases via Haiku (fast, non-blocking on failure)
    let detection = { sentiment: 'positive', keyPhrases: [], mentionedService: '' };
    try {
      const detectPrompt = `Analyze this ${starRating}-star review and return ONLY JSON:
{"sentiment":"positive|neutral|negative|mixed","keyPhrases":["<phrase1>","<phrase2>","<phrase3>"],"mentionedService":"<service or empty string>"}
Review: "${reviewText.slice(0, 1000)}"`;
      const raw = await callClaude('Return only valid JSON, no explanation.', [{ role: 'user', content: detectPrompt }], 150, 'claude-haiku-4-5-20251001');
      detection = { ...detection, ...JSON.parse(raw.replace(/```json|```/g, '').trim()) };
    } catch (e) { console.warn('[manual/reply] Detection failed:', e.message); }

    // 2. Build system prompt (reuses existing helper which already injects memory)
    const systemPrompt = await buildReplySystemPrompt(client);

    // 3. Generate reply
    const userPrompt = `Write a reply to this ${starRating}-star review for ${client.business_name}.
Detected tone: ${detection.sentiment}. Mirror this tone in your reply.
${detection.mentionedService ? `Service mentioned: ${detection.mentionedService}` : ''}
Review: "${reviewText}"
Reply (40-90 words, no quotes, no preamble):`;

    const [generatedText] = await Promise.all([
      callClaude(systemPrompt, [{ role: 'user', content: userPrompt }], 200),
    ]);
    const { score, tips, strengths } = await scoreContent('reply', generatedText, client);

    const { rows: saved } = await pool.query(
      `INSERT INTO manual_content (client_id, type, input_data, generated_text, quality_score, quality_tips, quality_strengths)
       VALUES ($1, 'reply', $2, $3, $4, $5, $6) RETURNING id, created_at`,
      [client.id, JSON.stringify({ reviewText: reviewText.slice(0, 500), starRating, detection }), generatedText, score, JSON.stringify(tips), JSON.stringify(strengths)],
    );

    if (detection.sentiment) setImmediate(() => updateMemoryAfterReply(client, starRating, reviewText, generatedText).catch(() => {}));

    res.json({ id: saved[0].id, generatedText, qualityScore: score, tips, strengths, detection });
  } catch (err) {
    console.error('[manual/write-reply]', err);
    res.status(500).json({ error: 'Reply generation failed' });
  }
});

// ─── Manual: Write Q&A Answer ─────────────────────────────────────────────────
app.post('/api/manual/write-answer', requireAuth, async (req, res) => {
  try {
    const question = typeof req.body?.question === 'string' ? req.body.question.trim().slice(0, 2000) : '';
    const VALID_STYLES = ['brief', 'detailed', 'conversational'];
    const style = VALID_STYLES.includes(req.body?.style) ? req.body.style : 'brief';
    const seoMode = req.body?.seoMode === true || req.body?.seoMode === 'true';
    if (!question) return res.status(400).json({ error: 'question is required' });

    const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.session.clientId]);
    const client = rows[0];
    const businessMemory = await getBusinessMemory(client.id);

    const bizLabel = BUSINESS_TYPE_LABELS[client.business_type || 'general'] || 'local business';
    const city = client.city || 'the local area';
    const styleInstr = {
      brief: 'Answer in 2-3 sentences. Be direct and helpful.',
      detailed: 'Answer in 1-2 paragraphs. Include specifics about hours, services, pricing ranges, or process.',
      conversational: 'Answer in a warm, friendly conversational tone as if speaking directly to the customer. 2-4 sentences.',
    }[style];
    const seoInstr = seoMode ? `\nSEO mode: naturally weave in "${client.business_name}", "${city}", and a relevant service keyword. Do NOT make it feel stuffed.` : '';
    const memorySection = businessMemory ? `\nBusiness context:\n${businessMemory.slice(0, 800)}` : '';

    const systemPrompt = `You are answering a customer question on Google Business Profile for ${client.business_name}, a ${bizLabel} in ${city}.
${memorySection}${seoInstr}
${styleInstr}
Rules: Never say "Great question", never add a preamble. Answer directly. Sound like the business owner. Reply in the same language as the question — if the question is in Spanish, answer entirely in Spanish.`;

    const generatedText = await callClaude(systemPrompt, [{ role: 'user', content: `Customer question: "${question}"` }], 300);
    const { score, tips, strengths } = await scoreContent('answer', generatedText, client);

    const { rows: saved } = await pool.query(
      `INSERT INTO manual_content (client_id, type, input_data, generated_text, quality_score, quality_tips, quality_strengths)
       VALUES ($1, 'answer', $2, $3, $4, $5, $6) RETURNING id, created_at`,
      [client.id, JSON.stringify({ question, style, seoMode }), generatedText, score, JSON.stringify(tips), JSON.stringify(strengths)],
    );

    setImmediate(() => updateMemoryAfterQA(client, question, generatedText).catch(() => {}));

    res.json({ id: saved[0].id, generatedText, qualityScore: score, tips, strengths });
  } catch (err) {
    console.error('[manual/write-answer]', err);
    res.status(500).json({ error: 'Answer generation failed' });
  }
});

// ─── Manual: Batch process images (open to all users) ─────────────────────────
app.post('/api/images/process', requireAuth, upload.array('photos', 10), async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.session.clientId]);
    const client = rows[0];
    const bizLabel = BUSINESS_TYPE_LABELS[client.business_type || 'general'] || 'local business';
    geocodeClientIfNeeded(client);

    const rawCats = req.body?.categories;
    const categories = Array.isArray(rawCats) ? rawCats : (rawCats ? [rawCats] : []);
    const rawCaptions = req.body?.captions;
    const captions = Array.isArray(rawCaptions) ? rawCaptions : (rawCaptions ? [rawCaptions] : []);

    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files uploaded' });

    const lat = client.lat ? parseFloat(client.lat) : null;
    const lng = client.lng ? parseFloat(client.lng) : null;
    const gpsExif = (lat && lng) ? {
      GPS: {
        GPSLatitudeRef: lat >= 0 ? 'N' : 'S',
        GPSLatitude: decimalToGpsRational(lat),
        GPSLongitudeRef: lng >= 0 ? 'E' : 'W',
        GPSLongitude: decimalToGpsRational(lng),
        GPSVersionID: '2300',
      },
    } : {};

    const backendUrl = process.env.BACKEND_URL || `http://localhost:${PORT}`;
    const results = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const category = categories[i] || 'EXTERIOR';
      const manualCaption = captions[i] || '';
      try {
        // Vision caption
        let aiCaption = '';
        try {
          aiCaption = await describePhotoWithVision(file.buffer.toString('base64'), file.mimetype, client.business_name, bizLabel);
        } catch (e) { console.warn(`[images/process] Vision failed for file ${i}:`, e.message); }
        const finalCaption = manualCaption || aiCaption;

        // SEO metadata
        let meta = { title: `${client.business_name} - ${category.toLowerCase()}`, description: finalCaption || `${category} photo`, keywords: [client.business_name, bizLabel, category.toLowerCase()] };
        try {
          const metaPrompt = `Generate SEO metadata for a GBP photo.\nBusiness: ${client.business_name} (${bizLabel})\nCategory: ${category}\nCaption: "${finalCaption}"\nReturn ONLY JSON: {"title":"<60 chars","description":"<150 chars","keywords":["k1","k2","k3","k4","k5"]}`;
          const raw = await callClaude('Return only valid JSON, no explanation.', [{ role: 'user', content: metaPrompt }], 300);
          meta = { ...meta, ...JSON.parse(raw.replace(/```json|```/g, '').trim()) };
        } catch (e) { console.warn(`[images/process] Meta gen failed for file ${i}:`, e.message); }

        // Sharp processing — try with EXIF/GPS, fall back to plain JPEG if metadata fails
        console.log(`[images/process] file ${i}: category=${category} caption="${manualCaption}" uploads_dir=${UPLOADS_DIR}`);
        const filename = seoFilename(client.business_name, category);
        const outputPath = join(UPLOADS_DIR, filename);
        let gpsInjected = false;
        try {
          await sharp(file.buffer)
            .jpeg({ quality: 92 })
            .withMetadata({
              exif: {
                IFD0: {
                  ImageDescription: meta.description,
                  Artist: client.business_name,
                  Copyright: `© ${new Date().getFullYear()} ${client.business_name}`,
                },
                ...gpsExif,
              },
            })
            .toFile(outputPath);
          gpsInjected = !!(lat && lng);
        } catch (sharpErr) {
          console.warn(`[images/process] EXIF injection failed for file ${i}, falling back to plain JPEG:`, sharpErr.message);
          await sharp(file.buffer).jpeg({ quality: 92 }).toFile(outputPath);
        }

        // Save to library
        await pool.query(
          `INSERT INTO manual_content (client_id, type, input_data, filename)
           VALUES ($1, 'image', $2, $3)`,
          [client.id, JSON.stringify({ category, aiCaption, meta }), filename],
        );

        results.push({ index: i, ok: true, filename, downloadUrl: `${backendUrl}/uploads/${filename}`, meta: { ...meta, aiCaption, category, gpsInjected } });
      } catch (e) {
        console.error(`[images/process] File ${i} failed:`, e.message);
        results.push({ index: i, ok: false, error: e.message });
      }
    }

    res.json({ results, gpsInjected: !!(lat && lng) });
  } catch (err) {
    console.error('[images/process]', err);
    res.status(500).json({ error: 'Image processing failed' });
  }
});

// ─── Manual: Download images as ZIP ───────────────────────────────────────────
app.post('/api/images/download-zip', requireAuth, async (req, res) => {
  try {
    const filenames = Array.isArray(req.body?.filenames) ? req.body.filenames.slice(0, 10) : [];
    if (!filenames.length) return res.status(400).json({ error: 'No filenames provided' });

    // Validate all files belong to requesting client
    const { rows } = await pool.query(
      `SELECT filename FROM manual_content WHERE client_id = $1 AND filename = ANY($2)`,
      [req.session.clientId, filenames],
    );
    const validFilenames = new Set(rows.map((r) => r.filename));
    const toZip = filenames.filter((f) => validFilenames.has(f));
    if (!toZip.length) return res.status(403).json({ error: 'No accessible files found' });

    const zipName = `hayvista-photos-${Date.now()}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.on('error', (err) => { console.error('[download-zip]', err); res.status(500).end(); });
    archive.pipe(res);

    for (const filename of toZip) {
      const filePath = join(UPLOADS_DIR, filename);
      archive.file(filePath, { name: filename });
    }
    await archive.finalize();
  } catch (err) {
    console.error('[download-zip]', err);
    if (!res.headersSent) res.status(500).json({ error: 'ZIP creation failed' });
  }
});

// ─── Manual: Content Library ───────────────────────────────────────────────────
app.get('/api/manual/library', requireAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const typeFilter = ['post', 'reply', 'answer', 'image'].includes(req.query.type) ? req.query.type : null;
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';

    let whereClause = 'WHERE client_id = $1';
    const params = [req.session.clientId];
    if (typeFilter) { params.push(typeFilter); whereClause += ` AND type = $${params.length}`; }
    if (search) { params.push(`%${search}%`); whereClause += ` AND generated_text ILIKE $${params.length}`; }

    const countRes = await pool.query(`SELECT COUNT(*) FROM manual_content ${whereClause}`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    params.push(limit, offset);
    const { rows } = await pool.query(
      `SELECT id, type, input_data, generated_text, quality_score, quality_tips, quality_strengths, filename, posted_at, created_at
       FROM manual_content ${whereClause}
       ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    const backendUrl = process.env.BACKEND_URL || `http://localhost:${PORT}`;
    const items = rows.map((r) => ({
      ...r,
      quality_tips: r.quality_tips || [],
      quality_strengths: r.quality_strengths || [],
      downloadUrl: r.filename ? `${backendUrl}/uploads/${r.filename}` : null,
    }));

    res.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[manual/library]', err);
    res.status(500).json({ error: 'Failed to load library' });
  }
});

app.patch('/api/manual/library/:id/posted', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE manual_content SET posted_at = NOW() WHERE id = $1 AND client_id = $2 AND posted_at IS NULL RETURNING *`,
      [req.params.id, req.session.clientId],
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found or already posted' });

    const row = rows[0];
    const { rows: clientRows } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.session.clientId]);
    const client = clientRows[0];

    // Trigger memory updates non-blocking
    setImmediate(async () => {
      try {
        if (row.type === 'post') await updateMemoryAfterPost(client, { post_text: row.generated_text, search_query: row.input_data?.seoKeyword || '' });
        else if (row.type === 'reply') await updateMemoryAfterReply(client, row.input_data?.starRating || 3, row.input_data?.reviewText || '', row.generated_text);
        else if (row.type === 'answer') await updateMemoryAfterQA(client, row.input_data?.question || '', row.generated_text);
      } catch (e) { console.warn('[library/posted] Memory update failed:', e.message); }
    });

    res.json({ ok: true, postedAt: row.posted_at });
  } catch (err) {
    console.error('[manual/library/posted]', err);
    res.status(500).json({ error: 'Failed to mark as posted' });
  }
});

app.delete('/api/manual/library/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM manual_content WHERE id = $1 AND client_id = $2', [req.params.id, req.session.clientId]);
    res.json({ ok: true });
  } catch (err) {
    console.error('[manual/library/delete]', err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// ─── End Manual Mode routes ────────────────────────────────────────────────────

// Rotate post type: Mon=OFFER, Wed=STANDARD, Fri=EVENT
function resolvePostType() {
  const day = new Date().getDay(); // 0=Sun,1=Mon,...,5=Fri
  if (day === 1) return 'offer';
  if (day === 5) return 'event';
  return 'standard';
}

async function generatePostForClient(client, overridePostType, overrideTopic) {
  const postType = overridePostType || resolvePostType();
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

  // 2. GBP photos + description + services (single location fetch)
  let photos = [];
  let photoMeta = [];  // descriptive list for Claude to choose from
  let gbpDescription = '';
  let gbpServices = [];
  try {
    const locationName = await ensureLocation(client);
    const [mediaData, locRes] = await Promise.all([
      gbpV4Fetch(auth, 'GET', `${locationName}/media`),
      google.mybusinessbusinessinformation({ version: 'v1', auth })
        .locations.get({ name: locationName, readMask: 'profile,serviceItems' }),
    ]);
    photos = (mediaData.mediaItems || []).filter((p) => p.mediaFormat === 'PHOTO' || !p.mediaFormat);

    // Load labels from DB (user_description preferred over ai_description)
    const photoSlice = photos.slice(0, 20);
    const photoUrlsForLabels = photoSlice.map((p) => p.googleUrl || p.sourceUrl).filter(Boolean);
    let labelMap = {};
    if (photoUrlsForLabels.length > 0) {
      try {
        const { rows: labelRows } = await pool.query(
          'SELECT photo_url, ai_description, user_description FROM photo_labels WHERE client_id = $1 AND photo_url = ANY($2)',
          [client.id, photoUrlsForLabels]
        );
        // user_description wins if set; otherwise fall back to ai_description
        labelMap = Object.fromEntries(labelRows.map((r) => [r.photo_url, r.user_description || r.ai_description]));
      } catch (e) { /* non-fatal */ }
    }

    photoMeta = photoSlice.map((p, i) => {
      const url = p.googleUrl || p.sourceUrl;
      const cat = p.locationAssociation?.category || 'GENERAL';
      const dbDesc = url && labelMap[url] ? ` — "${labelMap[url]}"` : '';
      const gbpDesc = !dbDesc && p.description ? ` — "${p.description}"` : '';
      return `${i}: ${cat}${dbDesc || gbpDesc}`;
    });
    gbpDescription = locRes.data?.profile?.description || '';
    gbpServices = (locRes.data?.serviceItems || [])
      .filter((s) => s.freeFormServiceItem?.label?.displayName)
      .slice(0, 8)
      .map((s) => s.freeFormServiceItem.label.displayName);
  } catch (e) {
    console.warn('GBP fetch failed:', e.message);
  }

  // 3. Products from DB
  let products = [];
  try {
    const { rows: pRows } = await pool.query(
      'SELECT name FROM products WHERE client_id = $1 ORDER BY created_at ASC LIMIT 8',
      [client.id]
    );
    products = pRows.map((p) => p.name);
  } catch (e) { /* non-fatal */ }

  // 4. Build business context for the prompt
  const bizLabel = BUSINESS_TYPE_LABELS[client.business_type || 'general'] || 'local business';
  const city = client.city || 'Los Cabos';
  const socialLinks = client.social_links || {};
  const activeSocials = Object.entries(socialLinks)
    .filter(([, url]) => url)
    .map(([platform]) => platform.charAt(0).toUpperCase() + platform.slice(1));

  const serviceList = gbpServices.length > 0 ? gbpServices : products;
  const contextLines = [];
  if (gbpDescription) contextLines.push(`Business description: "${gbpDescription}"`);
  if (serviceList.length > 0) contextLines.push(`Key services/products: ${serviceList.join(', ')}`);
  if (activeSocials.length > 0) contextLines.push(`Active social platforms: ${activeSocials.join(', ')}`);

  const businessContext = contextLines.length > 0
    ? `\nAbout this business:\n${contextLines.map((l) => `- ${l}`).join('\n')}\n`
    : '';

  // 5. Build post type context
  const postTypeInstructions = {
    offer: `This is an OFFER post. Include a clear promotional offer or limited-time deal. Add a line like "Valid through [end of month]" or similar. Make it feel urgent but genuine.`,
    event: `This is an EVENT post. Frame the post around a specific date-relevant service, seasonal event, or local occasion. Include a time-bound hook (e.g. "This weekend", "This month").`,
    standard: `This is a standard UPDATE post. Focus on a service, recent job, or helpful tip.`,
  };
  const postTypeNote = postTypeInstructions[postType] || postTypeInstructions.standard;

  // 6. Claude writes the post
  const businessMemory = await getBusinessMemory(client.id);
  const memorySection = businessMemory
    ? `\n## Business Memory (reference only)\n${businessMemory}\n`
    : '';

  const systemPrompt = `You are a local business marketing expert specializing in Google Business Profile posts for ${bizLabel}s.
${businessContext}${memorySection}
Always write posts in this exact format:

1. Opening line: A single emoji + a punchy hook sentence targeting a specific customer pain point or audience. No period — keep it sharp.

2. Body paragraph: 2–3 sentences introducing ${client.business_name}, what they do, and how they solve the problem. Mention the local area naturally if relevant. Tone: ${client.tone}.

3. If applicable, include a short service highlight list using this format:
✅ [benefit or service]
✅ [benefit or service]
✅ [benefit or service]

4. One sentence explaining the key value or reassurance (why it matters to the customer).

5. Closing CTA: A single line starting with a relevant emoji + a direct call to action (e.g. "Message us", "Call us today", "Book online").
   - If the business has active social platforms listed above, occasionally end with a social CTA that fits the post naturally (e.g. "Follow us on Instagram for before/after photos" or "Watch our latest work on YouTube").
   - Never reference a platform that is not listed above.

Rules:
- 150–220 words total
- No hashtags
- No fluff or filler phrases like "In today's world" or "Are you looking for"
- Sound like a real local business owner, not a marketing robot
- End with action, not a question

Post type instruction: ${postTypeNote}`;

  const topicClause = overrideTopic
    ? `Focus specifically on this topic: "${overrideTopic}".`
    : `The most searched local query this week is: "${topQuery}". Build the post around this search intent naturally.`;

  const userPrompt = `Write a GBP post for ${client.business_name}, a ${bizLabel} in ${city}. ${topicClause}`;

  const postText = await callClaude(systemPrompt, [{ role: 'user', content: userPrompt }], 500);

  // 7. Smart photo picker — match post content to the most relevant GBP photo
  let photoUrl = null;
  if (photos.length === 1) {
    photoUrl = photos[0].googleUrl || photos[0].sourceUrl;
  } else if (photos.length > 1) {
    try {
      const pickPrompt = `Match this Google Business Profile post to the most visually relevant photo.\n\nPost:\n${postText}\n\nAvailable photos (index: CATEGORY — description):\n${photoMeta.join('\n')}\n\nReply with ONLY the index number of the best matching photo. Just the number, nothing else.`;
      const idxStr = await callClaude('', [{ role: 'user', content: pickPrompt }], 10, 'claude-haiku-4-5-20251001');
      const idx = parseInt(idxStr.trim(), 10);
      if (!isNaN(idx) && idx >= 0 && photos[idx]) {
        photoUrl = photos[idx].googleUrl || photos[idx].sourceUrl;
      }
    } catch (e) {
      console.warn('Photo picker failed:', e.message);
    }
    // Fallback to random if picker failed
    if (!photoUrl) {
      const pick = photos[Math.floor(Math.random() * photos.length)];
      if (pick) photoUrl = pick.googleUrl || pick.sourceUrl;
    }
  }

  const result = await pool.query(
    `INSERT INTO posts (client_id, photo_url, post_text, search_query, status, post_type, auto_approve_at)
     VALUES ($1, $2, $3, $4, 'pending', $5, NOW() + INTERVAL '24 hours') RETURNING *`,
    [client.id, photoUrl, postText, topQuery, postType]
  );
  const savedPost = result.rows[0];
  setImmediate(() => updateMemoryAfterPost(client, savedPost));
  return savedPost;
}

// ─── Profile ─────────────────────────────────────────────────

const VALID_TONES = ['Friendly', 'Professional', 'Bilingual'];
const VALID_BUSINESS_TYPES = Object.keys(BUSINESS_TYPE_LABELS);

app.patch('/api/profile', requireAuth, async (req, res) => {
  try {
    const { business_name, business_type, tone, posts_per_week, whatsapp, review_link, city } = req.body;
    if (tone && !VALID_TONES.includes(tone)) return res.status(400).json({ error: 'Invalid tone' });
    if (business_type && !VALID_BUSINESS_TYPES.includes(business_type)) return res.status(400).json({ error: 'Invalid business type' });
    const safePosts = posts_per_week != null ? Math.min(Math.max(parseInt(posts_per_week, 10) || 1, 1), 7) : null;
    await pool.query(
      `UPDATE clients SET
        business_name  = COALESCE($1, business_name),
        business_type  = COALESCE($2, business_type),
        tone           = COALESCE($3, tone),
        posts_per_week = COALESCE($4, posts_per_week),
        whatsapp       = COALESCE($5, whatsapp),
        review_link    = COALESCE($6, review_link),
        city           = COALESCE($7, city)
       WHERE id = $8`,
      [
        business_name ?? null,
        business_type ?? null,
        tone ?? null,
        safePosts,
        whatsapp ?? null,
        review_link ?? null,
        city ?? null,
        req.session.clientId,
      ]
    );
    const { rows } = await pool.query(`SELECT ${SAFE_CLIENT_COLUMNS} FROM clients WHERE id = $1`, [req.session.clientId]);
    res.json({ client: rows[0] });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'An internal error occurred' });
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
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

app.post('/api/products', requireAuth, async (req, res) => {
  try {
    const { name, description = '', price = '', url = '' } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    const { rows } = await pool.query(
      'INSERT INTO products (client_id, name, description, price, url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.session.clientId, name.trim(), description.trim(), price.trim(), url.trim()]
    );
    res.json({ product: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

app.patch('/api/products/:id', requireAuth, async (req, res) => {
  try {
    const { name, description, price, url } = req.body;
    const { rows } = await pool.query(
      `UPDATE products SET
        name        = COALESCE($1, name),
        description = COALESCE($2, description),
        price       = COALESCE($3, price),
        url         = COALESCE($4, url)
       WHERE id = $5 AND client_id = $6 RETURNING *`,
      [name ?? null, description ?? null, price ?? null, url ?? null, req.params.id, req.session.clientId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'An internal error occurred' });
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
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// ─── Reviews ─────────────────────────────────────────────────

app.get('/api/reviews', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.session.clientId]);
    const client = rows[0];
    const cacheKey = `${client.id}:reviews`;
    const cached = getGbpCached(cacheKey);
    if (cached) return res.json(cached);
    const auth = getClientAuth(client);
    const locationName = await ensureLocation(client);
    const reviewsData = await gbpV4Fetch(auth, 'GET', `${locationName}/reviews?orderBy=updateTime+desc&pageSize=50`);
    const reviews = reviewsData.reviews || [];

    // Load pending reply drafts for this client
    const { rows: pendingRows } = await pool.query(
      `SELECT review_id, draft_text, auto_post_at, status FROM pending_replies
       WHERE client_id = $1 AND status = 'pending'`,
      [client.id]
    );
    const pendingMap = Object.fromEntries(pendingRows.map((r) => [r.review_id, r]));

    // Enrich reviews with their pending draft (if any)
    const enriched = reviews.map((r) => {
      const reviewId = r.name.split('/').pop();
      const pending = pendingMap[reviewId];
      return {
        ...r,
        pendingReply: pending
          ? { draftText: pending.draft_text, autoPostAt: pending.auto_post_at }
          : null,
      };
    });

    const reviewsPayload = {
      reviews: enriched,
      averageRating: reviewsData.averageRating,
      totalReviewCount: reviewsData.totalReviewCount,
    };
    setGbpCached(cacheKey, reviewsPayload);
    res.json(reviewsPayload);

    // Background: generate drafts for unreplied reviews that don't have one yet
    const needsDraft = reviews.filter((r) => {
      if (r.reviewReply) return false;
      const reviewId = r.name.split('/').pop();
      return !pendingMap[reviewId];
    });
    if (needsDraft.length > 0) {
      setImmediate(() => generatePendingReplies(client, needsDraft, null));
    }
  } catch (err) {
    console.error('Reviews fetch error:', err);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

app.post('/api/reviews/generate-reply', requireAuth, async (req, res) => {
  try {
    const { review } = req.body;
    const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.session.clientId]);
    const client = rows[0];
    const systemPrompt = await buildReplySystemPrompt(client);
    const stars = { ONE: '1/5', TWO: '2/5', THREE: '3/5', FOUR: '4/5', FIVE: '5/5' }[review.starRating] || review.starRating;
    const userPrompt = `Rating: ${stars} stars\nReview: "${review.comment || '(no written comment, just a star rating)'}"`;
    const reply = await callClaude(systemPrompt, [{ role: 'user', content: userPrompt }], 200);
    res.json({ reply });
  } catch (err) {
    console.error('Generate reply error:', err);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Update the draft text for a pending reply (user edits before auto-post)
app.patch('/api/reviews/pending-reply', requireAuth, async (req, res) => {
  try {
    const { reviewId, draftText } = req.body;
    if (!reviewId || !draftText?.trim()) return res.status(400).json({ error: 'reviewId and draftText required' });
    await pool.query(
      `UPDATE pending_replies SET draft_text = $1 WHERE client_id = $2 AND review_id = $3 AND status = 'pending'`,
      [draftText.trim(), req.session.clientId, reviewId]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Cancel auto-post for a pending reply
app.delete('/api/reviews/pending-reply/:reviewId', requireAuth, async (req, res) => {
  try {
    await pool.query(
      `UPDATE pending_replies SET status = 'cancelled' WHERE client_id = $1 AND review_id = $2 AND status = 'pending'`,
      [req.session.clientId, req.params.reviewId]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Post a pending reply immediately (don't wait for the timer)
app.post('/api/reviews/pending-reply/:reviewId/post-now', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT pr.*, c.google_access_token, c.google_refresh_token, c.gbp_account_name
       FROM pending_replies pr
       JOIN clients c ON c.id = pr.client_id
       WHERE pr.client_id = $1 AND pr.review_id = $2 AND pr.status = 'pending'`,
      [req.session.clientId, req.params.reviewId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'No pending reply found' });
    const pending = rows[0];
    const client = { id: req.session.clientId, google_access_token: pending.google_access_token, google_refresh_token: pending.google_refresh_token, gbp_account_name: pending.gbp_account_name };
    const auth = getClientAuth(client);
    await gbpV4Fetch(auth, 'PUT', `${pending.review_name}/reply`, { comment: pending.draft_text });
    await pool.query(
      `UPDATE pending_replies SET status = 'posted' WHERE id = $1`,
      [pending.id]
    );
    invalidateGbpCache(req.session.clientId, 'reviews');
    res.json({ ok: true });
    // Update memory with this reply in background
    const replyClient = { id: req.session.clientId, google_access_token: pending.google_access_token, google_refresh_token: pending.google_refresh_token, gbp_account_name: pending.gbp_account_name };
    setImmediate(() => updateMemoryAfterReply(replyClient, null, null, pending.draft_text));
  } catch (err) {
    console.error('Post-now error:', err);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

app.post('/api/reviews/reply', requireAuth, async (req, res) => {
  try {
    const { reviewName, replyText } = req.body;
    if (!reviewName || !replyText?.trim()) return res.status(400).json({ error: 'reviewName and replyText required' });
    const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.session.clientId]);
    const client = rows[0];
    const locationName = await ensureLocation(client);
    if (!reviewName.startsWith(locationName)) {
      return res.status(403).json({ error: 'Review does not belong to your location' });
    }
    const auth = getClientAuth(client);
    await gbpV4Fetch(auth, 'PUT', `${reviewName}/reply`, { comment: replyText.trim() });
    res.json({ ok: true });
  } catch (err) {
    console.error('Post reply error:', err);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// ─── Insights ────────────────────────────────────────────────

app.get('/api/insights', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.session.clientId]);
    const client = rows[0];
    const insightsCacheKey = `${client.id}:insights`;
    const cachedInsights = getGbpCached(insightsCacheKey);
    if (cachedInsights) return res.json(cachedInsights);
    const auth = getClientAuth(client);
    const locationName = await ensureLocation(client);
    const accountName = locationName.split('/locations/')[0];

    const endTime = new Date();
    const startTime = new Date(Date.now() - 28 * 86400000);

    let insightsData = null;
    try {
      insightsData = await gbpV4Fetch(auth, 'POST', `${accountName}/locations:reportInsights`, {
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
      });
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

    const insightsPayload = { insights: insightsData, gscQueries };
    setGbpCached(insightsCacheKey, insightsPayload);
    res.json(insightsPayload);
  } catch (err) {
    console.error('Insights error:', err);
    res.status(500).json({ error: 'An internal error occurred', insights: null, gscQueries: [] });
  }
});

// ─── Photos ──────────────────────────────────────────────────

app.get('/api/photos', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.session.clientId]);
    const client = rows[0];
    const photosCacheKey = `${client.id}:photos`;
    const cachedPhotos = getGbpCached(photosCacheKey);
    if (cachedPhotos) return res.json(cachedPhotos);
    const auth = getClientAuth(client);
    const locationName = await ensureLocation(client);
    const mediaData = await gbpV4Fetch(auth, 'GET', `${locationName}/media`);
    const photos = mediaData.mediaItems || [];

    // Enrich each photo with AI + user labels from DB
    const urls = photos.map((p) => p.googleUrl || p.sourceUrl).filter(Boolean);
    let labelMap = {};
    if (urls.length > 0) {
      const { rows: labelRows } = await pool.query(
        'SELECT photo_url, ai_description, user_description FROM photo_labels WHERE client_id = $1 AND photo_url = ANY($2)',
        [client.id, urls]
      );
      labelMap = Object.fromEntries(labelRows.map((r) => [r.photo_url, { aiDescription: r.ai_description, userDescription: r.user_description }]));
    }
    const enriched = photos.map((p) => {
      const url = p.googleUrl || p.sourceUrl;
      const label = (url && labelMap[url]) || {};
      return { ...p, aiDescription: label.aiDescription || null, userDescription: label.userDescription || null };
    });

    const photosPayload = { photos: enriched };
    setGbpCached(photosCacheKey, photosPayload);
    res.json(photosPayload);
    // Trigger background Vision labeling without blocking the response
    const bizLabel = BUSINESS_TYPE_LABELS[client.business_type || 'general'] || 'local business';
    setImmediate(() => labelPhotosInBackground(client, photos, bizLabel));
  } catch (err) {
    console.error('Photos fetch error:', err);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Only allow Google / HayVista CDN URLs to prevent stored SSRF
function isAllowedPhotoUrl(url) {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === 'https:' && (
      hostname.endsWith('.googleapis.com') ||
      hostname.endsWith('.googleusercontent.com') ||
      hostname.endsWith('.hayvista.com') ||
      hostname.endsWith('.railway.app')
    );
  } catch { return false; }
}

// Save a user-written (or user-confirmed) description for a GBP photo
app.patch('/api/photos/label', requireAuth, async (req, res) => {
  try {
    const { photo_url, media_name, description } = req.body;
    if (!photo_url) return res.status(400).json({ error: 'photo_url required' });
    if (!isAllowedPhotoUrl(photo_url)) return res.status(400).json({ error: 'Invalid photo URL' });
    const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.session.clientId]);
    const client = rows[0];
    const trimmed = (description || '').trim() || null;

    // 1. Save to HayVista DB (used by Claude post picker)
    await pool.query(
      `INSERT INTO photo_labels (client_id, photo_url, ai_description, user_description)
       VALUES ($1, $2, '', $3)
       ON CONFLICT (client_id, photo_url) DO UPDATE SET user_description = EXCLUDED.user_description`,
      [client.id, photo_url, trimmed]
    );

    // 2. Also push description to GBP so Google reads it (best-effort)
    let gbpUpdated = false;
    if (media_name && trimmed) {
      try {
        const auth = getClientAuth(client);
        await gbpV4Fetch(auth, 'PATCH', `${media_name}?updateMask=description`, { description: trimmed });
        gbpUpdated = true;
      } catch (e) {
        console.warn('GBP media.patch failed (non-fatal):', e.message);
      }
    }

    res.json({ ok: true, gbpUpdated });
  } catch (err) {
    console.error('Photo label error:', err);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// Debug: show exactly what the AI photo picker sees for each photo (including AI labels)
app.get('/api/photos/debug', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.session.clientId]);
    const client = rows[0];
    const auth = getClientAuth(client);
    const locationName = await ensureLocation(client);
    const mediaData = await gbpV4Fetch(auth, 'GET', `${locationName}/media`);
    const all = (mediaData.mediaItems || []).filter((p) => p.mediaFormat === 'PHOTO' || !p.mediaFormat);
    const photoSlice = all.slice(0, 20);
    const urls = photoSlice.map((p) => p.googleUrl || p.sourceUrl).filter(Boolean);
    let dbLabelMap = {};
    if (urls.length > 0) {
      const { rows: labelRows } = await pool.query(
        'SELECT photo_url, ai_description, user_description FROM photo_labels WHERE client_id = $1 AND photo_url = ANY($2)',
        [client.id, urls]
      );
      dbLabelMap = Object.fromEntries(labelRows.map((r) => [r.photo_url, { ai: r.ai_description, user: r.user_description }]));
    }
    const pickerView = photoSlice.map((p, i) => {
      const url = p.googleUrl || p.sourceUrl || null;
      const cat = p.locationAssociation?.category || 'GENERAL';
      const label = (url && dbLabelMap[url]) || {};
      const userDesc = label.user || null;
      const aiDesc = label.ai || null;
      const gbpDesc = p.description || null;
      const effectiveDesc = userDesc || aiDesc || gbpDesc;
      return {
        index: i,
        category: cat,
        gbpDescription: gbpDesc,
        aiDescription: aiDesc,
        userDescription: userDesc,
        url,
        pickerLine: `${i}: ${cat}${effectiveDesc ? ` — "${effectiveDesc}"` : ''}`,
      };
    });
    const labeled = Object.values(dbLabelMap).filter((l) => l.ai || l.user).length;
    res.json({ total: all.length, labeled, pickerView });
  } catch (err) {
    console.error('Photos debug error:', err);
    res.status(500).json({ error: 'An internal error occurred' });
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

    // 2. Inject EXIF metadata with Sharp (SEO filename + GPS if available)
    const filename = seoFilename(client.business_name, category);
    const outputPath = join(UPLOADS_DIR, filename);

    // Trigger background geocoding if client has no coords yet
    geocodeClientIfNeeded(client);

    const gpsExif = (client.lat && client.lng) ? {
      GPS: {
        GPSLatitudeRef: client.lat >= 0 ? 'N' : 'S',
        GPSLatitude: decimalToGpsRational(client.lat),
        GPSLongitudeRef: client.lng >= 0 ? 'E' : 'W',
        GPSLongitude: decimalToGpsRational(client.lng),
        GPSVersionID: '2300',
      },
    } : {};

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
          ...gpsExif,
        },
      })
      .toFile(outputPath);

    // 3. Build public URL
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${PORT}`;
    const publicUrl = `${backendUrl}/uploads/${filename}`;

    // 4. Upload to GBP
    const auth = getClientAuth(client);
    const locationName = await ensureLocation(client);
    await gbpV4Fetch(auth, 'POST', `${locationName}/media`, {
      mediaFormat: 'PHOTO',
      locationAssociation: { category },
      sourceUrl: publicUrl,
      description: meta.description,
    });

    invalidateGbpCache(client.id, 'photos');
    res.json({ ok: true, url: publicUrl, meta });

    // 5. Auto-label the uploaded photo with Claude Vision (background, non-blocking)
    setImmediate(async () => {
      try {
        const bizLabel = BUSINESS_TYPE_LABELS[client.business_type || 'general'] || 'local business';
        const base64 = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype || 'image/jpeg';
        const aiDescription = await describePhotoWithVision(base64, mimeType, client.business_name, bizLabel);
        await pool.query(
          `INSERT INTO photo_labels (client_id, photo_url, ai_description)
           VALUES ($1, $2, $3)
           ON CONFLICT (client_id, photo_url) DO UPDATE SET ai_description = EXCLUDED.ai_description`,
          [client.id, publicUrl, aiDescription]
        );
        console.log(`[vision] auto-labeled uploaded photo for client ${client.id}: "${aiDescription}"`);
      } catch (e) {
        console.warn('[vision] upload label failed:', e.message);
      }
    });
  } catch (err) {
    console.error('Photo upload error:', err);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

app.delete('/api/photos/:mediaName', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.session.clientId]);
    const client = rows[0];
    const auth = getClientAuth(client);
    const mediaName = decodeURIComponent(req.params.mediaName);
    await gbpV4Fetch(auth, 'DELETE', mediaName);
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete photo error:', err);
    res.status(500).json({ error: 'An internal error occurred' });
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
    res.status(500).json({ error: 'An internal error occurred' });
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
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// ─── Manual GBP location setup (bypasses accounts.list quota) ────────────────
app.post('/api/gbp/set-location', requireAuth, async (req, res) => {
  const { locationName } = req.body;
  if (!locationName || !/^accounts\/\d+\/locations\/\d+$/.test(locationName.trim())) {
    return res.status(400).json({ error: 'Invalid format. Expected: accounts/123456/locations/789012' });
  }
  const name = locationName.trim();
  await pool.query('UPDATE clients SET gbp_account_name = $1 WHERE id = $2', [name, req.session.clientId]);
  locationMemCache.set(req.session.clientId, name);
  console.log(`✅ GBP location manually set for client ${req.session.clientId}:`, name);
  res.json({ ok: true, gbp_account_name: name });
});

// ─── Social Links ─────────────────────────────────────────────

const GBP_ATTR_MAP = {
  instagram: 'url_instagram',
  facebook:  'url_facebook',
  tiktok:    'url_tiktok',
  youtube:   'url_youtube',
  linkedin:  'url_linkedin',
  x:         'url_twitter',
};
const ALLOWED_SOCIAL_KEYS = Object.keys(GBP_ATTR_MAP);

app.get('/api/social-links', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT social_links FROM clients WHERE id = $1', [req.session.clientId]);
    res.json({ links: rows[0]?.social_links || {} });
  } catch (err) {
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

app.patch('/api/social-links', requireAuth, async (req, res) => {
  try {
    const raw = req.body?.links;
    if (!raw || typeof raw !== 'object') return res.status(400).json({ error: 'links object required' });

    // Whitelist keys and require non-empty string values
    const clean = {};
    for (const key of ALLOWED_SOCIAL_KEYS) {
      const val = typeof raw[key] === 'string' ? raw[key].trim() : '';
      if (val) clean[key] = val;
    }

    await pool.query('UPDATE clients SET social_links = $1 WHERE id = $2', [JSON.stringify(clean), req.session.clientId]);

    // Best-effort GBP attribute sync (will fail until write scope is approved)
    let gbpSynced = false;
    try {
      const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.session.clientId]);
      const client = rows[0];
      const auth = getClientAuth(client);
      const locationName = await ensureLocation(client);
      const bizInfo = google.mybusinessbusinessinformation({ version: 'v1', auth });
      const attributes = Object.entries(clean).map(([key, url]) => ({
        name: `attributes/${GBP_ATTR_MAP[key]}`,
        urlValues: [{ url }],
      }));
      if (attributes.length > 0) {
        await bizInfo.locations.attributes.updateAttributes({
          name: locationName + '/attributes',
          attributeMask: Object.keys(clean).map((k) => `attributes/${GBP_ATTR_MAP[k]}`).join(','),
          requestBody: { name: locationName + '/attributes', attributes },
        });
        gbpSynced = true;
      }
    } catch (gbpErr) {
      console.warn('GBP social link sync skipped:', gbpErr.message);
    }

    res.json({ links: clean, gbpSynced });
  } catch (err) {
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// ─── Business Memory ──────────────────────────────────────────

app.get('/api/memory', requireAuth, async (req, res) => {
  try {
    const { rows: [client] } = await pool.query(
      'SELECT * FROM clients WHERE id = $1', [req.session.clientId]
    );
    const { rows } = await pool.query(
      'SELECT content, updated_at FROM business_memory WHERE client_id = $1',
      [client.id]
    );
    if (rows[0]) {
      return res.json({ memory: rows[0].content, updatedAt: rows[0].updated_at });
    }
    // No memory yet — bootstrap in background, return bootstrapping state
    setImmediate(() => bootstrapMemory(client));
    res.json({ memory: null, updatedAt: null, bootstrapping: true });
  } catch (err) {
    console.error('Memory fetch error:', err);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

app.patch('/api/memory', requireAuth, async (req, res) => {
  try {
    const { content } = req.body;
    if (typeof content !== 'string') return res.status(400).json({ error: 'content required' });
    const trimmed = content.slice(0, 6000);
    await pool.query(
      `INSERT INTO business_memory (client_id, content, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (client_id) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()`,
      [req.session.clientId, trimmed]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Memory update error:', err);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// ─── Q&A ──────────────────────────────────────────────────────
// Fetches questions from GBP, stores in qa_answers, returns combined list.

app.get('/api/qa', requireAuth, async (req, res) => {
  try {
    const { rows: [client] } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.session.clientId]);
    const auth = getClientAuth(client);
    const locationName = await ensureLocation(client);

    let gbpQuestions = [];
    try {
      const r = await gbpV4Fetch(auth, 'GET', `${locationName}/questions?pageSize=20`);
      gbpQuestions = r.questions || [];
    } catch (e) {
      console.warn('Q&A GBP fetch failed:', e.message);
    }

    // Upsert any new questions into local DB
    for (const q of gbpQuestions) {
      const qId = q.name.split('/').pop();
      await pool.query(
        `INSERT INTO qa_answers (client_id, question_id, question_text, author_name, create_time)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (client_id, question_id) DO NOTHING`,
        [client.id, qId, q.text || '', q.author?.displayName || '', q.createTime || '']
      );
    }

    const { rows } = await pool.query(
      'SELECT * FROM qa_answers WHERE client_id = $1 ORDER BY created_at DESC',
      [client.id]
    );
    res.json({ questions: rows });
  } catch (err) {
    console.error('Q&A fetch error:', err);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

app.post('/api/qa/generate-answer', requireAuth, async (req, res) => {
  try {
    const { questionId } = req.body;
    if (!questionId) return res.status(400).json({ error: 'questionId required' });

    const { rows: [client] } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.session.clientId]);
    const { rows: [qa] } = await pool.query(
      'SELECT * FROM qa_answers WHERE client_id = $1 AND id = $2',
      [client.id, questionId]
    );
    if (!qa) return res.status(404).json({ error: 'Question not found' });

    const bizLabel = BUSINESS_TYPE_LABELS[client.business_type || 'general'] || 'local business';
    const qaMemory = await getBusinessMemory(client.id);
    const qaMemoryNote = qaMemory ? `\n\nContext about this business:\n${qaMemory.split('\n').slice(0, 20).join('\n')}` : '';
    const systemPrompt = `You are a helpful, professional customer service representative for ${client.business_name}, a ${bizLabel}. Write a concise, friendly answer to a customer question posted on Google. Tone: ${client.tone}. Keep it under 100 words. No hashtags. Reply in the same language as the question — if the question is in Spanish, answer entirely in Spanish.${qaMemoryNote}`;
    const answerText = await callClaude(systemPrompt, [{ role: 'user', content: `Customer question: "${qa.question_text}"\n\nWrite a helpful answer.` }], 150);

    const { rows: [updated] } = await pool.query(
      `UPDATE qa_answers SET answer_text = $1, status = 'draft', auto_approve_at = NOW() + INTERVAL '24 hours'
       WHERE id = $2 AND client_id = $3 RETURNING *`,
      [answerText, qa.id, client.id]
    );
    res.json({ question: updated });
  } catch (err) {
    console.error('Q&A generate error:', err);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

app.post('/api/qa/answer', requireAuth, async (req, res) => {
  try {
    const { questionId } = req.body;
    if (!questionId) return res.status(400).json({ error: 'questionId required' });

    const { rows: [client] } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.session.clientId]);
    const { rows: [qa] } = await pool.query(
      'SELECT * FROM qa_answers WHERE client_id = $1 AND id = $2',
      [client.id, questionId]
    );
    if (!qa || !qa.answer_text) return res.status(400).json({ error: 'No answer draft to post' });

    // Best-effort post to GBP
    let gbpPosted = false;
    try {
      const auth = getClientAuth(client);
      const locationName = await ensureLocation(client);
      await gbpV4Fetch(auth, 'POST', `${locationName}/questions/${qa.question_id}/answers:upsert`, { answer: { text: qa.answer_text } });
      gbpPosted = true;
    } catch (e) {
      console.warn('Q&A GBP post failed:', e.message);
    }

    const { rows: [updated] } = await pool.query(
      `UPDATE qa_answers SET status = 'posted', auto_approve_at = NULL WHERE id = $1 AND client_id = $2 RETURNING *`,
      [qa.id, client.id]
    );
    res.json({ question: updated, gbpPosted });
    setImmediate(() => updateMemoryAfterQA(client, qa.question_text, qa.answer_text));
  } catch (err) {
    console.error('Q&A post error:', err);
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

app.patch('/api/qa/:id', requireAuth, async (req, res) => {
  try {
    const { answer_text } = req.body;
    if (!answer_text?.trim()) return res.status(400).json({ error: 'answer_text required' });
    const { rows: [updated] } = await pool.query(
      `UPDATE qa_answers SET answer_text = $1, status = 'draft', auto_approve_at = NOW() + INTERVAL '24 hours'
       WHERE id = $2 AND client_id = $3 RETURNING *`,
      [answer_text.trim(), req.params.id, req.session.clientId]
    );
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json({ question: updated });
  } catch (err) {
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

app.delete('/api/qa/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM qa_answers WHERE id = $1 AND client_id = $2', [req.params.id, req.session.clientId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'An internal error occurred' });
  }
});

// ─── Profile Health Audit ─────────────────────────────────────

app.get('/api/audit', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.session.clientId]);
    const client = rows[0];
    const auth = getClientAuth(client);
    const locationName = await ensureLocation(client);
    const items = [];

    // 1. Photos count
    try {
      const mediaData = await gbpV4Fetch(auth, 'GET', `${locationName}/media?pageSize=100`);
      const count = (mediaData.mediaItems || []).length;
      if (count >= 10) {
        items.push({ id: 'photos', status: 'ok', title: `${count} photos`, message: 'Good — AI post generation has plenty of images to work with.', tab: 'photos' });
      } else if (count >= 5) {
        items.push({ id: 'photos', status: 'warn', title: `Only ${count} photos`, message: 'Add more photos — AI post generation works best with 10 or more.', tab: 'photos' });
      } else {
        items.push({ id: 'photos', status: 'error', title: `Only ${count} photo${count === 1 ? '' : 's'}`, message: 'Critical: AI needs 10+ photos to generate varied, visual posts. Add photos now.', tab: 'photos' });
      }
    } catch { items.push({ id: 'photos', status: 'warn', title: 'Photos unavailable', message: 'Could not check photo count — GBP API pending.', tab: 'photos' }); }

    // 2. Reviews: total count + avg rating + unanswered
    try {
      const reviewsData = await gbpV4Fetch(auth, 'GET', `${locationName}/reviews?pageSize=50`);
      const reviews = reviewsData.reviews || [];
      const total = reviewsData.totalReviewCount || reviews.length;
      const avg = parseFloat(reviewsData.averageRating) || 0;
      const unanswered = reviews.filter((r) => !r.reviewReply).length;

      if (total >= 10) {
        items.push({ id: 'review_count', status: 'ok', title: `${total} reviews`, message: 'Strong review volume — keep it up.', tab: 'reviews' });
      } else if (total >= 5) {
        items.push({ id: 'review_count', status: 'warn', title: `${total} reviews`, message: 'Getting there — aim for 10+ to build trust with new customers.', tab: 'getreviews' });
      } else {
        items.push({ id: 'review_count', status: 'error', title: `Only ${total} review${total === 1 ? '' : 's'}`, message: 'Very few reviews — most competitors have 10+. Share your review link to catch up.', tab: 'getreviews' });
      }

      if (avg >= 4.2) {
        items.push({ id: 'avg_rating', status: 'ok', title: `${avg.toFixed(1)} star average`, message: 'Above average for your category — well done.', tab: 'reviews' });
      } else if (avg >= 3.8) {
        items.push({ id: 'avg_rating', status: 'warn', title: `${avg.toFixed(1)} star average`, message: 'Slightly below the 4.2 benchmark for top-ranked local businesses.', tab: 'reviews' });
      } else if (avg > 0) {
        items.push({ id: 'avg_rating', status: 'error', title: `${avg.toFixed(1)} star average`, message: 'Below competitive threshold — reply to low-star reviews professionally to show responsiveness.', tab: 'reviews' });
      }

      if (unanswered === 0) {
        items.push({ id: 'unanswered', status: 'ok', title: 'All reviews answered', message: 'Great — responding to reviews boosts your local ranking.', tab: 'reviews' });
      } else if (unanswered <= 2) {
        items.push({ id: 'unanswered', status: 'warn', title: `${unanswered} unanswered review${unanswered > 1 ? 's' : ''}`, message: 'Reply soon — Google rewards businesses that respond to reviews.', tab: 'reviews' });
      } else {
        items.push({ id: 'unanswered', status: 'error', title: `${unanswered} unanswered reviews`, message: 'Multiple reviews without replies hurt your ranking. Use AI reply to respond quickly.', tab: 'reviews' });
      }
    } catch { items.push({ id: 'reviews', status: 'warn', title: 'Reviews unavailable', message: 'Could not check review data — GBP API pending.', tab: 'reviews' }); }

    // 3. GBP profile completeness
    try {
      const bizInfo = google.mybusinessbusinessinformation({ version: 'v1', auth });
      const loc = await bizInfo.locations.get({ name: locationName, readMask: 'profile,websiteUri,regularHours' });
      const d = loc.data;
      const hasDesc = !!(d.profile?.description?.trim());
      const hasWebsite = !!(d.websiteUri?.trim());
      const hasHours = !!(d.regularHours?.periods?.length);

      items.push({
        id: 'description',
        status: hasDesc ? 'ok' : 'error',
        title: hasDesc ? 'Business description set' : 'No business description',
        message: hasDesc ? 'Good — your description helps Google match you to relevant searches.' : 'Missing: add a description to improve how often you appear in search results.',
        tab: 'profile',
      });
      items.push({
        id: 'website',
        status: hasWebsite ? 'ok' : 'error',
        title: hasWebsite ? 'Website linked' : 'No website on your GBP',
        message: hasWebsite ? 'Website is set — this improves click-through from your profile.' : 'Add your website URL — businesses with websites rank higher in local search.',
        tab: 'profile',
      });
      items.push({
        id: 'hours',
        status: hasHours ? 'ok' : 'warn',
        title: hasHours ? 'Business hours set' : 'Business hours not set',
        message: hasHours ? 'Hours are set — customers can see when you\'re open.' : 'Set your hours — profiles without hours appear less trustworthy to customers.',
        tab: 'profile',
      });
    } catch { /* skip profile checks if GBP unavailable */ }

    // 4. Posts this week
    try {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const { rows: recentPosts } = await pool.query(
        "SELECT COUNT(*) AS cnt FROM posts WHERE client_id = $1 AND posted_at > $2 AND status IN ('posted','approved')",
        [client.id, weekAgo]
      );
      const count = parseInt(recentPosts[0].cnt, 10);
      if (count >= 2) {
        items.push({ id: 'posts_week', status: 'ok', title: `${count} posts this week`, message: 'Automation is working — regular posts keep your profile active and visible.', tab: 'posts' });
      } else if (count === 1) {
        items.push({ id: 'posts_week', status: 'warn', title: '1 post this week', message: 'Aim for 2–3 posts per week to maximize GBP visibility.', tab: 'posts' });
      } else {
        items.push({ id: 'posts_week', status: 'error', title: 'No posts this week', message: 'No recent posts — inactive profiles rank lower. Check the automation schedule.', tab: 'posts' });
      }
    } catch { /* skip */ }

    // 5. Unanswered Q&A
    try {
      const { rows: qaRows } = await pool.query(
        "SELECT COUNT(*) AS cnt FROM qa_answers WHERE client_id = $1 AND (status = 'unanswered' OR (answer_text IS NULL AND status != 'posted'))",
        [client.id]
      );
      const unansweredQA = parseInt(qaRows[0].cnt, 10);
      if (unansweredQA > 0) {
        items.push({ id: 'qa', status: 'warn', title: `${unansweredQA} unanswered Q&A`, message: 'Customer questions on your GBP are waiting — AI will auto-draft answers every 6 hours.', tab: 'qa' });
      }
    } catch { /* skip */ }

    // 6. Google Messaging
    items.push({
      id: 'messaging',
      status: 'warn',
      title: 'Google Messaging not verified',
      message: 'Enable Google Messaging so customers can contact you directly from Search and Maps.',
      tab: 'bookings',
    });

    res.json({ items });
  } catch (err) {
    console.error('Audit error:', err);
    res.status(500).json({ error: 'An internal error occurred' });
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
    const menuData = await gbpV4Fetch(auth, 'GET', `${locationName}/foodMenus`);
    res.json({ menu: menuData });
  } catch (err) {
    console.error('Menu fetch error:', err);
    res.status(500).json({ error: 'An internal error occurred', menu: null });
  }
});

// ─── Stripe Routes ────────────────────────────────────────────

app.post('/api/stripe/create-checkout', requireAuth, async (req, res) => {
  const { priceId } = req.body;
  const allowedPriceIds = new Set([process.env.STRIPE_STARTER_PRICE_ID].filter(Boolean));
  if (!priceId || !allowedPriceIds.has(priceId)) {
    return res.status(400).json({ error: 'Invalid price' });
  }
  const { rows } = await pool.query(`SELECT ${SAFE_CLIENT_COLUMNS} FROM clients WHERE id = $1`, [req.session.clientId]);
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

const escHtml = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

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
          <td style="padding:12px 16px;color:#e8eeff;font-size:14px;line-height:1.5">${escHtml(p.post_text)}</td>
          <td style="padding:12px 16px;color:#4f8ef7;font-size:12px;white-space:nowrap">${escHtml(p.search_query) || '—'}</td>
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

// Weekly digest — every Monday at 9am PT
cron.schedule('0 9 * * 1', sendWeeklyDigest, { timezone: 'America/Los_Angeles' });

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

// ─── Q&A automation cron (every 6 hours) ─────────────────────
// Scans GBP for new questions, generates AI answer drafts, auto-approves after 24h.
cron.schedule('0 */6 * * *', async () => {
  console.log('⏰ Q&A cron: scanning for unanswered questions');
  try {
    const { rows: clients } = await pool.query("SELECT * FROM clients WHERE subscription_status IN ('active', 'trial')");
    for (const client of clients) {
      try {
        const auth = getClientAuth(client);
        const locationName = await ensureLocation(client);
        const r = await gbpV4Fetch(auth, 'GET', `${locationName}/questions?pageSize=20`);
        const questions = r.questions || [];
        for (const q of questions) {
          const qId = q.name.split('/').pop();
          // Skip if already answered by business
          if (q.topAnswers?.some((a) => a.author?.type === 'MERCHANT')) continue;
          // Upsert question
          const { rows: [row] } = await pool.query(
            `INSERT INTO qa_answers (client_id, question_id, question_text, author_name, create_time)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (client_id, question_id) DO UPDATE SET question_text = EXCLUDED.question_text
             RETURNING *`,
            [client.id, qId, q.text || '', q.author?.displayName || '', q.createTime || '']
          );
          // Generate draft if no answer yet
          if (!row.answer_text) {
            const bizLabel = BUSINESS_TYPE_LABELS[client.business_type || 'general'] || 'local business';
            const cronQaMemory = await getBusinessMemory(client.id);
            const cronQaNote = cronQaMemory ? `\n\nContext about this business:\n${cronQaMemory.split('\n').slice(0, 20).join('\n')}` : '';
            const sysP = `You are a helpful customer service rep for ${client.business_name}, a ${bizLabel}. Write a concise, professional answer in under 80 words. No hashtags. Reply in the same language as the question — if the question is in Spanish, answer entirely in Spanish.${cronQaNote}`;
            const answerText = await callClaude(sysP, [{ role: 'user', content: `Question: "${row.question_text}"` }], 120);
            await pool.query(
              `UPDATE qa_answers SET answer_text = $1, status = 'draft', auto_approve_at = NOW() + INTERVAL '24 hours'
               WHERE id = $2`,
              [answerText, row.id]
            );
          }
        }
      } catch (e) {
        console.warn(`Q&A cron skip ${client.business_name}:`, e.message);
      }
    }
  } catch (e) {
    console.error('Q&A cron error:', e);
  }
});

// ─── Hourly auto-post cron ────────────────────────────────────
cron.schedule('0 * * * *', async () => {
  try {
    // ── Posts: publish to GBP then mark posted ─────────────────
    const { rows: pendingPosts } = await pool.query(
      `SELECT p.*, c.google_access_token, c.google_refresh_token, c.gbp_account_name, c.business_name
       FROM posts p
       JOIN clients c ON c.id = p.client_id
       WHERE p.status = 'pending'
         AND p.auto_approve_at IS NOT NULL
         AND p.auto_approve_at <= NOW()`
    );
    for (const row of pendingPosts) {
      try {
        const client = { id: row.client_id, google_access_token: row.google_access_token, google_refresh_token: row.google_refresh_token, gbp_account_name: row.gbp_account_name };
        const auth = getClientAuth(client);
        const locationName = await ensureLocation(client);
        const requestBody = { languageCode: 'en-US', summary: row.post_text, topicType: 'STANDARD' };
        if (row.photo_url) requestBody.media = [{ mediaFormat: 'PHOTO', sourceUrl: row.photo_url }];
        await gbpV4Fetch(auth, 'POST', `${locationName}/localPosts`, requestBody);
        await pool.query(`UPDATE posts SET status = 'posted', posted_at = NOW(), auto_approve_at = NULL WHERE id = $1`, [row.id]);
        console.log(`⏰ Auto-posted GBP post ${row.id} for ${row.business_name}`);
      } catch (e) {
        console.warn(`⏰ Auto-post failed for post ${row.id} (${row.business_name}):`, e.message);
        await pool.query(`UPDATE posts SET status = 'approved', auto_approve_at = NULL WHERE id = $1`, [row.id]);
      }
    }
    if (pendingPosts.length > 0) {
      console.log(`⏰ Processed ${pendingPosts.length} auto-post job(s)`);
    }

    // ── Q&A: post answer to GBP then mark posted ───────────────
    const { rows: pendingQA } = await pool.query(
      `SELECT qa.*, c.google_access_token, c.google_refresh_token, c.gbp_account_name, c.business_name
       FROM qa_answers qa
       JOIN clients c ON c.id = qa.client_id
       WHERE qa.status = 'draft'
         AND qa.auto_approve_at IS NOT NULL
         AND qa.auto_approve_at <= NOW()`
    );
    for (const row of pendingQA) {
      try {
        const client = { id: row.client_id, google_access_token: row.google_access_token, google_refresh_token: row.google_refresh_token, gbp_account_name: row.gbp_account_name };
        const auth = getClientAuth(client);
        const locationName = await ensureLocation(client);
        await gbpV4Fetch(auth, 'POST', `${locationName}/questions/${row.question_id}/answers:upsert`, { answer: { text: row.answer_text } });
        await pool.query(`UPDATE qa_answers SET status = 'posted', auto_approve_at = NULL WHERE id = $1`, [row.id]);
        console.log(`⏰ Auto-posted Q&A answer ${row.id} for ${row.business_name}`);
        setImmediate(() => updateMemoryAfterQA({ id: row.client_id, google_access_token: row.google_access_token, google_refresh_token: row.google_refresh_token, gbp_account_name: row.gbp_account_name }, row.question_text, row.answer_text));
      } catch (e) {
        console.warn(`⏰ Auto-post failed for Q&A ${row.id} (${row.business_name}):`, e.message);
        await pool.query(`UPDATE qa_answers SET status = 'approved', auto_approve_at = NULL WHERE id = $1`, [row.id]);
      }
    }
    if (pendingQA.length > 0) {
      console.log(`⏰ Processed ${pendingQA.length} auto-post Q&A job(s)`);
    }
    // Auto-post pending review replies whose timer has expired
    const { rows: pendingReplies } = await pool.query(
      `SELECT pr.*, c.google_access_token, c.google_refresh_token, c.gbp_account_name, c.business_name
       FROM pending_replies pr
       JOIN clients c ON c.id = pr.client_id
       WHERE pr.status = 'pending' AND pr.auto_post_at <= NOW()`
    );
    for (const pending of pendingReplies) {
      try {
        const client = { id: pending.client_id, google_access_token: pending.google_access_token, google_refresh_token: pending.google_refresh_token, gbp_account_name: pending.gbp_account_name };
        const auth = getClientAuth(client);
        await gbpV4Fetch(auth, 'PUT', `${pending.review_name}/reply`, { comment: pending.draft_text });
        await pool.query(`UPDATE pending_replies SET status = 'posted' WHERE id = $1`, [pending.id]);
        console.log(`⏰ Auto-posted reply for review ${pending.review_id} (${pending.business_name})`);
        const memClient = { id: pending.client_id, google_access_token: pending.google_access_token, google_refresh_token: pending.google_refresh_token, gbp_account_name: pending.gbp_account_name };
        setImmediate(() => updateMemoryAfterReply(memClient, null, null, pending.draft_text));
      } catch (e) {
        console.warn(`⏰ Auto-post failed for review ${pending.review_id}:`, e.message);
      }
    }
    if (pendingReplies.length > 0) {
      console.log(`⏰ Processed ${pendingReplies.length} auto-reply job(s)`);
    }
  } catch (e) {
    console.error('Auto-approve cron error:', e);
  }
});

// ─── Start ────────────────────────────────────────────────────
initDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Ranky server running on port ${PORT}`));
});
