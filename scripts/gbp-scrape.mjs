/**
 * gbp-scrape.mjs — Extract GBP account/location name from business.google.com
 *
 * Navigates to business.google.com/locations in your live Chrome session,
 * extracts the accounts/X/locations/Y path, and prints it.
 *
 * If found, you can paste the result into the HayVista dashboard manual field
 * or directly update the DB via /api/gbp/set-location.
 *
 * Known info from previous sessions:
 *   Location ID : 15307649334467972155
 *   FID/CID     : 10035441415569680653
 *   GBP URL     : business.google.com/n/15307649334467972155/profile
 *
 * USAGE:
 *   open -a "Google Chrome" --args --remote-debugging-port=9222
 *   node scripts/gbp-scrape.mjs
 */

import { newPage, closeBrowser } from './connect.mjs';
import { writeFileSync } from 'fs';

const page = await newPage();
console.log('Navigating to business.google.com/locations ...');

await page.goto('https://business.google.com/locations', {
  waitUntil: 'domcontentloaded',
  timeout: 30000,
});

// Wait for JS to render the listing
await page.waitForTimeout(8000);

// 1. Try to find accounts/X/locations/Y in page source
const html = await page.content();
const apiPathMatch = html.match(/accounts\/(\d+)\/locations\/(\d+)/);

// 2. Try to find it in anchor hrefs
const hrefMatch = await page.evaluate(() => {
  const anchors = [...document.querySelectorAll('a')];
  for (const a of anchors) {
    const m = a.href.match(/accounts\/(\d+)\/locations\/(\d+)/);
    if (m) return m[0];
  }
  return null;
});

// 3. Try n/ URL format to get location ID at minimum
const nUrlMatch = await page.evaluate(() => {
  const anchors = [...document.querySelectorAll('a')];
  for (const a of anchors) {
    const m = a.href.match(/\/n\/(\d+)/);
    if (m) return m[1];
  }
  return null;
});

// 4. Look for embedded JSON data blocks
const jsonMatch = html.match(/"(accounts\/\d+\/locations\/\d+)"/);

const locationName = apiPathMatch?.[0] || hrefMatch || jsonMatch?.[1] || null;
const locationId = nUrlMatch || '15307649334467972155'; // fallback to known value

await page.screenshot({ path: '/tmp/gbp-scrape.png' });
console.log('Screenshot saved to /tmp/gbp-scrape.png');

if (locationName) {
  console.log('\nFOUND location name:', locationName);
  writeFileSync('/tmp/gbp_location_name.txt', locationName);
  console.log('Saved to /tmp/gbp_location_name.txt');
  console.log('\nTo connect HayVista, run:');
  console.log(`  curl -X POST https://ranky-production.up.railway.app/api/gbp/set-location \\`);
  console.log(`    -H "Content-Type: application/json" \\`);
  console.log(`    -d '{"locationName":"${locationName}"}' \\`);
  console.log(`    --cookie "your-session-cookie"`);
} else {
  console.log('\nCould not find accounts/X/locations/Y in page.');
  console.log('Known location ID:', locationId);
  console.log('Try: visit business.google.com/n/' + locationId + '/profile');
  console.log('and check the Network tab for any requests containing accounts/X/locations/Y');
}

await closeBrowser();
