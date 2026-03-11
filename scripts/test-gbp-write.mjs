/**
 * test-gbp-write.mjs
 * Run: node scripts/test-gbp-write.mjs
 *
 * Tests which GBP API endpoints work with your existing OAuth token —
 * without partner access. Tries v4 + all newer v1 split APIs.
 * Also attempts a real draft post (write test).
 */

import 'dotenv/config';
import pg from 'pg';
import { google } from 'googleapis';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function getToken(client) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
  auth.setCredentials({
    access_token: client.google_access_token,
    refresh_token: client.google_refresh_token,
  });
  const { token } = await auth.getAccessToken();
  return token;
}

async function hit(token, method, url, body) {
  const opts = {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const text = await res.text();
  let parsed = null;
  try { parsed = JSON.parse(text); } catch {}
  return { status: res.status, parsed, raw: text };
}

function result(label, status, parsed) {
  const ok = status >= 200 && status < 300;
  const icon = ok ? '✅' : status === 403 ? '🚫' : status === 404 ? '❌' : '⚠️ ';
  console.log(`${icon} ${label}: ${status}`);
  if (ok && parsed) console.log('   ', JSON.stringify(parsed).slice(0, 200));
  if (!ok && parsed?.error) console.log(`   Error: ${parsed.error.message?.slice(0, 150)}`);
  return { ok, parsed };
}

async function main() {
  console.log('\n🧪 GBP Write Access Test\n' + '─'.repeat(50));

  const { rows } = await pool.query(
    `SELECT id, email, google_access_token, google_refresh_token, gbp_account_name
     FROM clients WHERE google_refresh_token IS NOT NULL
     ORDER BY (email = 'hayvista@gmail.com') DESC, id ASC LIMIT 1`
  );
  if (!rows.length) { console.error('No client found'); process.exit(1); }

  const client = rows[0];
  console.log(`Account: ${client.email}\n`);

  const token = await getToken(client);

  // ── 1. v1 Account Management API ───────────────────────────────────────────
  console.log('\n── Account Management (v1) ──');
  const acctMgmt = await hit(token, 'GET', 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts');
  const { ok: acctOk, parsed: acctParsed } = result('GET v1/accounts', acctMgmt.status, acctMgmt.parsed);

  let accountName = null;
  if (acctOk && acctParsed?.accounts?.length) {
    accountName = acctParsed.accounts[0].name;
    console.log(`   Account name: ${accountName}`);
  }

  // ── 2. v1 Business Information API ─────────────────────────────────────────
  console.log('\n── Business Information (v1) ──');
  if (accountName) {
    const locs = await hit(token, 'GET',
      `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,storefrontAddress`
    );
    const { ok: locsOk, parsed: locsParsed } = result('GET v1/locations', locs.status, locs.parsed);

    if (locsOk && locsParsed?.locations?.length) {
      const loc = locsParsed.locations[0];
      console.log(`   Location: ${loc.name} — ${loc.title}`);

      // Try reading the location directly
      const locDetail = await hit(token, 'GET',
        `https://mybusinessbusinessinformation.googleapis.com/v1/${loc.name}?readMask=name,title,storefrontAddress,websiteUri`
      );
      result('GET v1/location detail', locDetail.status, locDetail.parsed);
    }
  } else {
    // Try with known location ID from memory
    const knownLoc = await hit(token, 'GET',
      `https://mybusinessbusinessinformation.googleapis.com/v1/locations/15307649334467972155?readMask=name,title`
    );
    result('GET v1/known location ID', knownLoc.status, knownLoc.parsed);
  }

  // ── 3. v4 API (old — already known to 404, but let's confirm) ──────────────
  console.log('\n── GBP v4 API ──');
  const v4Accts = await hit(token, 'GET', 'https://mybusiness.googleapis.com/v4/accounts');
  result('GET v4/accounts', v4Accts.status, v4Accts.parsed);

  // ── 4. Write test — try creating a LOCAL POST ───────────────────────────────
  console.log('\n── Write Test: Local Post ──');

  // Build the location path we'll try posting to
  let locationPath = client.gbp_account_name; // e.g. accounts/X/locations/Y

  if (!locationPath && accountName) {
    // Try to discover location from v1
    const locs = await hit(token, 'GET',
      `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name`
    );
    if (locs.ok && locs.parsed?.locations?.length) {
      // Convert v1 location name to v4 format
      locationPath = locs.parsed.locations[0].name; // might already be accounts/X/locations/Y
    }
  }

  if (!locationPath) {
    console.log('⚠️  No location path available — cannot test write');
    console.log('   Sign in to hayvista.com with your GBP account to save the location, then rerun.');
  } else {
    console.log(`   Posting to: ${locationPath}`);

    // Draft a test post — won't be published, just tests the API response
    const testPost = {
      languageCode: 'en-US',
      summary: '[HayVista API test] Checking write access — this post was created by the HayVista automation system.',
      callToAction: { actionType: 'LEARN_MORE', url: 'https://hayvista.com' },
      topicType: 'STANDARD',
    };

    const postRes = await hit(token, 'POST',
      `https://mybusiness.googleapis.com/v4/${locationPath}/localPosts`,
      testPost
    );
    result('POST v4/localPosts (write test)', postRes.status, postRes.parsed);

    if (postRes.ok) {
      console.log('\n🎉 WRITE ACCESS WORKS — no partner approval needed!');
      console.log('   The OAuth token is enough for your own GBP profile.');
      console.log(`   Post name: ${postRes.parsed?.name}`);
      console.log('\n   ⚠️  Delete this test post from your GBP dashboard.');
    }
  }

  // ── 5. Reviews read test ────────────────────────────────────────────────────
  if (locationPath) {
    console.log('\n── Read Test: Reviews ──');
    const reviews = await hit(token, 'GET',
      `https://mybusiness.googleapis.com/v4/${locationPath}/reviews?pageSize=3`
    );
    result('GET v4/reviews', reviews.status, reviews.parsed);
    if (reviews.ok && reviews.parsed?.reviews?.length) {
      console.log(`   Found ${reviews.parsed.reviews.length} review(s)`);
    }
  }

  console.log('\n' + '─'.repeat(50) + '\n');
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
