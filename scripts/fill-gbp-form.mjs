/**
 * fill-gbp-form.mjs — Fill and submit Google Business Profile API access forms
 *
 * USAGE:
 *   node scripts/fill-gbp-form.mjs                  # GBP API allowlist form
 *   node scripts/fill-gbp-form.mjs --form=quota      # quota/support form
 *   node scripts/fill-gbp-form.mjs --dry-run         # fill but do NOT submit
 */

import { newPage, closeBrowser } from './connect.mjs';

const FORM_DATA = {
  name:          'Hay Vista',
  email:         'hayvista@gmail.com',
  company:       'Hay Vista',
  website:       'https://hayvista.com',
  projectId:     'gen-lang-client-0397405367',
  projectNumber: '1005175082848',
  useCase: `HayVista (hayvista.com) is a SaaS platform that automates Google Business Profile management
for local businesses. We use the GBP API to publish posts (Mon/Wed/Fri), reply to reviews within 24h,
answer Q&A questions, and manage photos on behalf of our customers. All actions are AI-drafted and
reviewed before publishing. We serve SMBs across the US.`,
};

const isDryRun = process.argv.includes('--dry-run');
const formType = process.argv.find(a => a.startsWith('--form='))?.split('=')[1] || 'allowlist';

// ─── Sign-in check ─────────────────────────────────────────────────────────
async function ensureSignedIn(page) {
  await page.goto('https://myaccount.google.com/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2000);

  const signInBtn = page.getByRole('link', { name: /sign in/i });
  const isSignedOut = await signInBtn.isVisible({ timeout: 2000 }).catch(() => false);

  if (isSignedOut) {
    console.log('\nNot signed into Google. Opening sign-in page...');
    await page.goto('https://accounts.google.com/signin', { waitUntil: 'domcontentloaded' });
    console.log('Please sign in with hayvista@gmail.com in the browser window.');
    console.log('Waiting up to 2 minutes...');
    await page.waitForURL('**/myaccount.google.com**', { timeout: 120000 }).catch(() => {});
    await page.waitForTimeout(2000);
    console.log('Signed in. Continuing...\n');
  } else {
    console.log('Already signed into Google.');
  }
}

// ─── Quota / support form ─────────────────────────────────────────────────
async function fillQuotaForm(page) {
  // Try known URLs for the GBP API support form
  const candidates = [
    'https://support.google.com/business/contact/api',
    'https://support.google.com/business/gethelp',
    'https://developers.google.com/my-business/content/prereqs',
  ];

  let landed = false;
  for (const url of candidates) {
    console.log(`Trying: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000);
    const is404 = await page.locator("text=can't be found").isVisible({ timeout: 1000 }).catch(() => false);
    if (!is404) {
      console.log('Form page found at:', url);
      landed = true;
      break;
    }
    console.log('  → 404, trying next...');
  }

  if (!landed) {
    await page.screenshot({ path: '/tmp/form-notfound.png' });
    console.log('\nCould not find the form. Screenshot at /tmp/form-notfound.png');
    console.log('Go to the form manually in the browser and drop a screenshot in "For Claudes eyes".');
    return;
  }

  await page.screenshot({ path: '/tmp/form-start.png' });
  console.log('Start screenshot: /tmp/form-start.png');

  // Change topic to "Application For Basic Access" if dropdown present
  try {
    const topicSelect = page.locator('select').first();
    if (await topicSelect.isVisible({ timeout: 2000 })) {
      const options = await topicSelect.locator('option').allTextContents();
      console.log('Topic options:', options);
      const basicAccess = options.find(o => /basic access/i.test(o));
      if (basicAccess) {
        await topicSelect.selectOption({ label: basicAccess });
        console.log('Set topic to:', basicAccess);
        await page.waitForTimeout(1000);
      }
    }
  } catch { /* no dropdown */ }

  await fillField(page, 'input[placeholder*="name" i], [name="name"]', FORM_DATA.name);
  await fillField(page, 'input[type="email"], [name="email"]', FORM_DATA.email);
  await fillField(page, 'input[placeholder*="company" i], [name*="company" i]', FORM_DATA.company);
  await fillField(page, 'input[placeholder*="Project ID" i], [name*="project_id" i]', FORM_DATA.projectId);
  await fillField(page, 'input[placeholder*="Project Number" i], [name*="project_number" i]', FORM_DATA.projectNumber);

  // API dropdown
  try {
    const apiSelect = page.locator('select').last();
    if (await apiSelect.isVisible({ timeout: 2000 })) {
      const opts = await apiSelect.locator('option').allTextContents();
      console.log('API options:', opts);
      const v4 = opts.find(o => /v4/i.test(o));
      const acct = opts.find(o => /account/i.test(o));
      if (v4) { await apiSelect.selectOption({ label: v4 }); console.log('Selected:', v4); }
      else if (acct) { await apiSelect.selectOption({ label: acct }); console.log('Selected:', acct); }
    }
  } catch { /* no dropdown */ }

  await page.screenshot({ path: '/tmp/form-quota-filled.png' });
  console.log('Filled screenshot: /tmp/form-quota-filled.png');

  if (isDryRun) {
    console.log('\n[DRY RUN] Form filled but NOT submitted. Check /tmp/form-quota-filled.png');
    return;
  }

  const submitBtn = page.getByRole('button', { name: /submit/i });
  if (await submitBtn.isVisible({ timeout: 2000 })) {
    await submitBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/form-submitted.png' });
    console.log('Submitted! Screenshot: /tmp/form-submitted.png');
  } else {
    console.log('No submit button found. Check /tmp/form-quota-filled.png');
  }
}

// ─── Allowlist wizard (developers.google.com) ─────────────────────────────
async function fillAllowlistForm(page) {
  console.log('Navigating to GBP API allowlist form...');
  await page.goto('https://developers.google.com/my-business/content/prereqs', {
    waitUntil: 'domcontentloaded', timeout: 30000,
  });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/form-allowlist.png' });
  console.log('Screenshot: /tmp/form-allowlist.png — drop it in "For Claudes eyes" to see current step.');

  // Click Confirm if present
  const confirmBtn = page.getByRole('button', { name: /confirm/i });
  if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('Clicking Confirm...');
    await confirmBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/form-allowlist-step2.png' });
    console.log('Step 2 screenshot: /tmp/form-allowlist-step2.png');
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────
async function fillField(page, selector, value) {
  try {
    const el = page.locator(selector).first();
    if (await el.isVisible({ timeout: 1500 })) {
      await el.fill('');
      await el.fill(value);
      console.log(`  Filled: ${value}`);
    }
  } catch { /* field not found */ }
}

// ─── Main ──────────────────────────────────────────────────────────────────
const page = await newPage();
await ensureSignedIn(page);

if (formType === 'quota') {
  await fillQuotaForm(page);
} else {
  await fillAllowlistForm(page);
}

await closeBrowser();
