/**
 * screenshot.mjs — Take a screenshot of any URL using your live Chrome session
 *
 * Useful for debugging any page that requires being logged in to Google,
 * GCP console, HayVista dashboard, etc.
 *
 * USAGE:
 *   open -a "Google Chrome" --args --remote-debugging-port=9222
 *   node scripts/screenshot.mjs <url> [output-path]
 *
 * EXAMPLES:
 *   node scripts/screenshot.mjs https://hayvista.com/dashboard
 *   node scripts/screenshot.mjs https://business.google.com/locations /tmp/gbp.png
 *   node scripts/screenshot.mjs https://console.cloud.google.com /tmp/gcp.png
 */

import { newPage, closeBrowser } from './connect.mjs';

const url = process.argv[2];
const out = process.argv[3] || `./scripts/screenshots/screenshot-${Date.now()}.png`;

if (!url) {
  console.error('Usage: node scripts/screenshot.mjs <url> [output-path]');
  process.exit(1);
}

const page = await newPage();

console.log(`Navigating to: ${url}`);
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(4000); // let JS render

await page.screenshot({ path: out, fullPage: true });
console.log(`Screenshot saved: ${out}`);
console.log(`Page title: ${await page.title()}`);

await closeBrowser();
