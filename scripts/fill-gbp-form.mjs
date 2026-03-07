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
  console.log('Navigating to GBP Contact Us form...');
  await page.goto('https://support.google.com/business/gethelp', {
    waitUntil: 'domcontentloaded', timeout: 20000,
  });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: './scripts/screenshots/form-start.png' });
  console.log('Start screenshot: ./scripts/screenshots/form-start.png');

  // Step 1: Select business from custom dropdown
  try {
    const bizDropdown = page.locator('[aria-label*="business" i], [jsname], select').first();
    if (await bizDropdown.isVisible({ timeout: 2000 })) {
      await bizDropdown.click();
      await page.waitForTimeout(1000);
      // Click "Hay Vista" option if it appears
      const hayVista = page.getByText('Hay Vista', { exact: false });
      if (await hayVista.isVisible({ timeout: 2000 })) {
        await hayVista.click();
        console.log('Selected business: Hay Vista');
        await page.waitForTimeout(1000);
      }
    }
  } catch { console.warn('Could not select business dropdown'); }

  // Step 1: Fill the "Tell us what we can help with" text field
  try {
    const textarea = page.locator('textarea, [role="textbox"]').first();
    if (await textarea.isVisible({ timeout: 2000 })) {
      await textarea.click();
      await textarea.fill('GBP API access request — need Application For Basic Access to Google My Business API v4.9 to manage posts, reviews, and photos for local businesses via HayVista SaaS platform.');
      console.log('Filled help text');
      await page.waitForTimeout(500);
    }
  } catch { console.warn('Could not fill help text'); }

  // Click Next
  const nextBtn = page.getByRole('button', { name: /next/i });
  if (await nextBtn.isVisible({ timeout: 2000 })) {
    await page.screenshot({ path: './scripts/screenshots/form-step1-filled.png' });
    console.log('Step 1 filled: ./scripts/screenshots/form-step1-filled.png');
    if (!isDryRun) {
      await nextBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: './scripts/screenshots/form-step2.png' });
      console.log('Step 2: ./scripts/screenshots/form-step2.png — drop in "For Claudes eyes" to continue');
    } else {
      console.log('\n[DRY RUN] Step 1 filled. Check ./scripts/screenshots/form-step1-filled.png');
    }
  } else {
    await page.screenshot({ path: './scripts/screenshots/form-quota-filled.png' });
    console.log('Screenshot: ./scripts/screenshots/form-quota-filled.png');
    if (isDryRun) console.log('[DRY RUN] Not submitted.');
  }
}

// ─── Allowlist wizard (developers.google.com) ─────────────────────────────
async function fillAllowlistForm(page) {
  console.log('Navigating to GBP API allowlist form...');
  await page.goto('https://developers.google.com/my-business/content/prereqs', {
    waitUntil: 'domcontentloaded', timeout: 30000,
  });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: './scripts/screenshots/form-allowlist.png' });
  console.log('Screenshot: ./scripts/screenshots/form-allowlist.png — drop it in "For Claudes eyes" to see current step.');

  // Click Confirm if present
  const confirmBtn = page.getByRole('button', { name: /confirm/i });
  if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('Clicking Confirm...');
    await confirmBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: './scripts/screenshots/form-allowlist-step2.png' });
    console.log('Step 2 screenshot: ./scripts/screenshots/form-allowlist-step2.png');
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
