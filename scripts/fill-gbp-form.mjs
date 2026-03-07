/**
 * fill-gbp-form.mjs — Fill and submit Google Business Profile API access forms
 *
 * Handles two forms:
 *   1. GBP API Allowlist (developers.google.com) — "Application For Basic Access"
 *   2. GBP Support Quota form (support.google.com/business/contact/api)
 *
 * Uses your live Chrome session — no auth needed.
 *
 * USAGE:
 *   open -a "Google Chrome" --args --remote-debugging-port=9222
 *   node scripts/fill-gbp-form.mjs
 *   node scripts/fill-gbp-form.mjs --form=quota   # support.google.com quota form
 *   node scripts/fill-gbp-form.mjs --dry-run       # fill but do NOT submit
 */

import { newPage, closeBrowser } from './connect.mjs';

// ─── Business data ─────────────────────────────────────────────────────────
const FORM_DATA = {
  name:           'Hay Vista',
  email:          'hayvista@gmail.com',
  company:        'Hay Vista',
  website:        'https://hayvista.com',
  projectId:      'gen-lang-client-0397405367',
  projectNumber:  '1005175082848',
  useCase: `HayVista (hayvista.com) is a SaaS platform that automates Google Business Profile management
for local businesses. We use the GBP API to publish posts (Mon/Wed/Fri), reply to reviews within 24h,
answer Q&A questions, and manage photos on behalf of our customers. All actions are AI-drafted and
reviewed before publishing. We are building a multi-tenant platform serving SMBs across the US.`,
};

const isDryRun = process.argv.includes('--dry-run');
const formType = process.argv.find(a => a.startsWith('--form='))?.split('=')[1] || 'allowlist';

// ─── Allowlist form (developers.google.com) ────────────────────────────────
async function fillAllowlistForm(page) {
  console.log('Navigating to GBP API allowlist form...');
  await page.goto('https://developers.google.com/my-business/content/prereqs', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/form-allowlist-start.png' });

  // The allowlist form is typically an embedded Google Form or multi-step wizard.
  // Fill fields as they appear — selectors may need updating if Google changes the form.
  try {
    // Step 1: Confirm account (click Confirm if present)
    const confirmBtn = page.getByRole('button', { name: /confirm/i });
    if (await confirmBtn.isVisible({ timeout: 3000 })) {
      console.log('Clicking Confirm account...');
      await confirmBtn.click();
      await page.waitForTimeout(2000);
    }
  } catch { /* not on confirm step */ }

  await page.screenshot({ path: '/tmp/form-allowlist-step.png' });
  console.log('Screenshot saved to /tmp/form-allowlist-step.png');
  console.log('Form is open. Fill remaining fields manually or extend this script.');
}

// ─── Support quota form (support.google.com) ──────────────────────────────
async function fillQuotaForm(page) {
  console.log('Navigating to GBP support/quota form...');
  await page.goto('https://support.google.com/business/contact/api', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(3000);

  // Change topic to "Application For Basic Access" if Quota Increase is selected
  try {
    const topicSelect = page.locator('select').first();
    if (await topicSelect.isVisible({ timeout: 3000 })) {
      await topicSelect.selectOption({ label: /Application For Basic Access/i });
      console.log('Set topic to: Application For Basic Access');
      await page.waitForTimeout(1000);
    }
  } catch { console.warn('Could not set topic dropdown — check selector'); }

  // Fill Name
  await fillField(page, '[name="name"], input[placeholder*="name" i]', FORM_DATA.name);

  // Fill Email
  await fillField(page, '[name="email"], input[type="email"]', FORM_DATA.email);

  // Fill Company Name
  await fillField(page, '[name="company"], input[placeholder*="company" i]', FORM_DATA.company);

  // Fill Project ID
  await fillField(page, 'input[placeholder*="Project ID" i], [name*="project_id" i]', FORM_DATA.projectId);

  // Fill Project Number
  await fillField(page, 'input[placeholder*="Project Number" i], [name*="project_number" i]', FORM_DATA.projectNumber);

  // Select API — try GBP API v4.9 first, fall back to Account Management
  try {
    const apiSelect = page.locator('select').last();
    if (await apiSelect.isVisible({ timeout: 3000 })) {
      try {
        await apiSelect.selectOption({ label: /GBP API v4/i });
        console.log('Selected API: GBP API v4.9');
      } catch {
        await apiSelect.selectOption({ label: /Account Management/i });
        console.log('Selected API: Account Management API');
      }
    }
  } catch { console.warn('Could not set API dropdown — check selector'); }

  await page.screenshot({ path: '/tmp/form-quota-filled.png' });
  console.log('Screenshot saved to /tmp/form-quota-filled.png');

  if (isDryRun) {
    console.log('\n[DRY RUN] Form filled but NOT submitted.');
    return;
  }

  // Submit
  const submitBtn = page.getByRole('button', { name: /submit/i });
  if (await submitBtn.isVisible({ timeout: 3000 })) {
    console.log('Submitting form...');
    await submitBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/form-quota-submitted.png' });
    console.log('Submitted. Screenshot saved to /tmp/form-quota-submitted.png');
  } else {
    console.warn('Submit button not found. Check /tmp/form-quota-filled.png');
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────
async function fillField(page, selector, value) {
  try {
    const el = page.locator(selector).first();
    if (await el.isVisible({ timeout: 2000 })) {
      await el.fill('');
      await el.fill(value);
      console.log(`Filled "${selector.split(',')[0]}" with: ${value}`);
    }
  } catch {
    console.warn(`Could not fill field: ${selector}`);
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────
const page = await newPage();

if (formType === 'quota') {
  await fillQuotaForm(page);
} else {
  await fillAllowlistForm(page);
}

await closeBrowser();
