/**
 * check-gbp-approval.mjs
 * Run: node scripts/check-gbp-approval.mjs
 *
 * Makes a live GBP API call using your stored credentials.
 * Returns APPROVED ✅ or PENDING ⏳ based on the response.
 */

import 'dotenv/config';
import pg from 'pg';
import { google } from 'googleapis';

const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function getAccessToken(client) {
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

async function gbpCall(token, path) {
  const res = await fetch(`https://mybusiness.googleapis.com/v4/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  return { status: res.status, body: text };
}

async function main() {
  console.log('\n🔍 HayVista — GBP API Approval Check\n');

  // Get the hayvista account, falling back to the first client with a refresh token
  const { rows } = await pool.query(
    `SELECT id, email, google_access_token, google_refresh_token, gbp_account_name
     FROM clients
     WHERE google_refresh_token IS NOT NULL
     ORDER BY (email = 'hayvista@gmail.com') DESC, id ASC LIMIT 1`
  );

  if (!rows.length) {
    console.error('❌ No clients with a refresh token found in DB.');
    process.exit(1);
  }

  const client = rows[0];
  console.log(`Account : ${client.email}`);
  console.log(`GBP loc : ${client.gbp_account_name || '(none saved)'}\n`);

  let token;
  try {
    token = await getAccessToken(client);
    console.log('✅ Access token obtained\n');
  } catch (e) {
    console.error('❌ Could not get access token:', e.message);
    process.exit(1);
  }

  // Test 1: List accounts
  console.log('--- Test: GET accounts ---');
  const accounts = await gbpCall(token, 'accounts');
  console.log(`Status: ${accounts.status}`);

  let parsed;
  try { parsed = JSON.parse(accounts.body); } catch { parsed = null; }

  if (accounts.status === 200 && parsed?.accounts?.length) {
    console.log(`\n✅ APPROVED — ${parsed.accounts.length} account(s) returned:`);
    parsed.accounts.forEach(a => console.log(`  • ${a.name} (${a.accountName || a.type})`));
  } else if (accounts.status === 403) {
    const msg = parsed?.error?.message || accounts.body.slice(0, 200);
    if (msg.includes('quota') || msg.includes('disabled') || msg.includes('PERMISSION_DENIED')) {
      console.log('\n⏳ PENDING — API quota is 0 (access not yet approved)');
      console.log(`   Detail: ${msg}`);
    } else {
      console.log('\n⚠️  403 but unexpected reason:');
      console.log(`   ${msg}`);
    }
  } else if (accounts.status === 429) {
    console.log('\n⏳ PENDING — Rate limited (quota still 0)');
  } else if (accounts.status === 200 && parsed && !parsed.accounts) {
    console.log('\n⏳ PENDING — 200 OK but no accounts in response (quota 0, empty list)');
    console.log('   Raw:', accounts.body.slice(0, 300));
  } else if (accounts.status === 404) {
    console.log('\n⏳ PENDING — 404 from GBP API (partner access not yet approved)');
    console.log('   Google returns 404 when the API is not enabled for your project.');
    console.log('   Check hayvista@gmail.com for approval email from Google.');
  } else {
    console.log(`\n❓ Unexpected response (${accounts.status}):`);
    console.log('   ', accounts.body.slice(0, 400));
  }

  // Test 2: If we have a saved location, try to read it directly
  if (client.gbp_account_name) {
    console.log(`\n--- Test: GET ${client.gbp_account_name} ---`);
    const loc = await gbpCall(token, client.gbp_account_name);
    console.log(`Status: ${loc.status}`);
    if (loc.status === 200) {
      const locParsed = JSON.parse(loc.body);
      console.log(`✅ Location accessible: ${locParsed.locationName || locParsed.name}`);
    } else {
      console.log(`   Response: ${loc.body.slice(0, 200)}`);
    }
  }

  console.log('\n');
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
