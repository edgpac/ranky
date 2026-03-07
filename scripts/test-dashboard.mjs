/**
 * test-dashboard.mjs — Smoke test the live HayVista dashboard
 *
 * Navigates through key tabs and API endpoints, reports what's working
 * and what's failing. Useful after deploys or when debugging.
 *
 * USAGE:
 *   open -a "Google Chrome" --args --remote-debugging-port=9222
 *   node scripts/test-dashboard.mjs
 *   node scripts/test-dashboard.mjs --local   # test localhost:5173 instead
 */

import { newPage, closeBrowser } from './connect.mjs';

const isLocal = process.argv.includes('--local');
const BASE = isLocal ? 'http://localhost:5173' : 'https://hayvista.com';
const API  = isLocal ? 'http://localhost:3001' : 'https://ranky-production.up.railway.app';

const results = [];

function log(label, status, detail = '') {
  const icon = status === 'ok' ? '✅' : status === 'warn' ? '⚠️ ' : '❌';
  console.log(`${icon} ${label}${detail ? ': ' + detail : ''}`);
  results.push({ label, status, detail });
}

const page = await newPage();

// ─── 1. Dashboard loads ───────────────────────────────────────────────────
console.log(`\nTesting: ${BASE}/dashboard\n`);
try {
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(3000);
  const title = await page.title();
  log('Dashboard loads', 'ok', title);
  await page.screenshot({ path: '/tmp/dash-home.png' });
} catch (e) {
  log('Dashboard loads', 'fail', e.message);
}

// ─── 2. API health ────────────────────────────────────────────────────────
const endpoints = [
  { path: '/api/me',               label: 'Auth (/api/me)' },
  { path: '/api/posts',            label: 'Posts tab' },
  { path: '/api/reviews',          label: 'Reviews tab' },
  { path: '/api/photos',           label: 'Photos tab' },
  { path: '/api/qa',               label: 'Q&A tab' },
  { path: '/api/memory',           label: 'Memory tab' },
  { path: '/api/insights',         label: 'Insights tab' },
  { path: '/api/gbp-profile',      label: 'Edit Profile tab' },
  { path: '/api/permission-check', label: 'GBP permission check' },
];

for (const { path, label } of endpoints) {
  try {
    const res = await page.evaluate(async (url) => {
      const r = await fetch(url, { credentials: 'include' });
      return { status: r.status, ok: r.ok };
    }, `${API}${path}`);

    if (res.status === 401) {
      log(label, 'warn', '401 — not logged in (guest mode)');
    } else if (res.ok) {
      log(label, 'ok', `HTTP ${res.status}`);
    } else {
      log(label, 'fail', `HTTP ${res.status}`);
    }
  } catch (e) {
    log(label, 'fail', e.message);
  }
}

// ─── 3. Tab navigation ────────────────────────────────────────────────────
const tabs = ['posts', 'reviews', 'photos', 'qa', 'memory', 'insights'];
for (const tab of tabs) {
  try {
    await page.goto(`${BASE}/dashboard?tab=${tab}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `/tmp/dash-tab-${tab}.png` });
    log(`Tab: ${tab}`, 'ok', 'rendered');
  } catch (e) {
    log(`Tab: ${tab}`, 'fail', e.message);
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────
console.log('\n─── Summary ─────────────────────────────────');
const failed = results.filter(r => r.status === 'fail');
const warned = results.filter(r => r.status === 'warn');
console.log(`Total: ${results.length}  Passed: ${results.length - failed.length - warned.length}  Warnings: ${warned.length}  Failed: ${failed.length}`);
if (failed.length > 0) {
  console.log('\nFailed:');
  failed.forEach(r => console.log(`  ❌ ${r.label}: ${r.detail}`));
}
console.log('\nScreenshots saved to /tmp/dash-*.png');

await closeBrowser();
