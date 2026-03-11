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

  // Debug: log all interactive elements on the form
  const formElements = await page.evaluate(() => {
    const els = [...document.querySelectorAll('input, textarea, select, [role="textbox"], [role="combobox"], [role="listbox"]')];
    return els.map(el => ({
      tag: el.tagName,
      role: el.getAttribute('role'),
      placeholder: el.getAttribute('placeholder'),
      ariaLabel: el.getAttribute('aria-label'),
      id: el.id,
      className: el.className.slice(0, 60),
      text: el.textContent?.slice(0, 50),
    }));
  });
  console.log('Form elements found:', JSON.stringify(formElements, null, 2));

  // Step 1: Select business from custom dropdown ("Which business do you need help with?")
  // The dropdown is a div[role="listbox"] with class hcfeSearchselectSelectcontainer
  try {
    const dropdownTrigger = page.locator('.hcfeSearchselectSelectcontainer').first();
    const selectOneVisible = await dropdownTrigger.isVisible({ timeout: 3000 }).catch(() => false);
    if (selectOneVisible) {
      await dropdownTrigger.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: './scripts/screenshots/form-dropdown-open.png' });
      console.log('Dropdown opened: ./scripts/screenshots/form-dropdown-open.png');

      // After opening, inspect DOM to find option elements
      const optInfo = await page.evaluate(() => {
        const candidates = [...document.querySelectorAll('li, [role="option"], [class*="Option"], [class*="option"]')]
          .filter(el => el.textContent?.includes('Hay Vista'));
        return candidates.map(el => ({
          tag: el.tagName,
          cls: el.className?.slice(0, 80),
          text: el.textContent?.trim().slice(0, 80),
        }));
      });
      console.log('Hay Vista option candidates:', JSON.stringify(optInfo));

      // Click via evaluate — option is a BUTTON.hcfeSearchselectMenuitem
      const clicked = await page.evaluate(() => {
        const candidates = [...document.querySelectorAll('button[class*="Menuitem"], button[class*="menuitem"], li, [role="option"]')]
          .filter(el => el.textContent?.includes('Hay Vista'));
        if (candidates.length > 0) {
          candidates[0].click();
          return candidates[0].textContent?.trim().slice(0, 80);
        }
        return null;
      });
      if (clicked) {
        console.log('Selected business via evaluate:', clicked);
        await page.waitForTimeout(1000);
      } else {
        console.warn('Could not click Hay Vista option');
      }
    } else {
      console.warn('Business dropdown trigger not found');
    }
  } catch (e) { console.warn('Could not select business dropdown:', e.message); }

  // Step 1: Fill the "Tell us what we can help with" text field
  // DOM inspection found: input.scSharedMaterialtextfieldnative-control (no placeholder attr)
  // 100 char max — keep concise
  const HELP_TEXT = 'GBP API partner access needed for HayVista SaaS — auto-post, reviews, photos for local SMBs.';
  try {
    const field = page.locator('input.scSharedMaterialtextfieldnative-control, input[class*="native-control"]').first();
    const found = await field.isVisible({ timeout: 2000 }).catch(() => false);
    if (found) {
      await field.click();
      await field.fill(HELP_TEXT);
      console.log('Filled help text');
      await page.waitForTimeout(500);
    } else {
      // Fallback: try the TEXTAREA with class csi
      const ta = page.locator('textarea.csi').first();
      if (await ta.isVisible({ timeout: 2000 }).catch(() => false)) {
        await ta.fill(HELP_TEXT);
        console.log('Filled help text (textarea.csi)');
      } else {
        console.warn('Could not find help text field');
      }
    }
  } catch (e) { console.warn('Could not fill help text:', e.message); }

  // Click Next
  const nextBtn = page.getByRole('button', { name: /next/i });
  if (await nextBtn.isVisible({ timeout: 2000 })) {
    await page.screenshot({ path: './scripts/screenshots/form-step1-filled.png' });
    console.log('Step 1 filled: ./scripts/screenshots/form-step1-filled.png');
    if (!isDryRun) {
      await nextBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: './scripts/screenshots/form-step2.png' });
      console.log('Step 2 screenshot: ./scripts/screenshots/form-step2.png');

      // Step 2: Choose category — click "API Issue"
      try {
        const apiIssueBtn = page.getByRole('button', { name: /api issue/i });
        if (await apiIssueBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await apiIssueBtn.click();
          console.log('Selected category: API Issue');
          await page.waitForTimeout(1000);
          await page.screenshot({ path: './scripts/screenshots/form-step2-filled.png' });
          console.log('Step 2 filled: ./scripts/screenshots/form-step2-filled.png');

          // Click "Next step" → Resources page
          const nextStep = page.getByRole('button', { name: /next step/i });
          if (await nextStep.isVisible({ timeout: 2000 }).catch(() => false)) {
            await nextStep.click();
            await page.waitForTimeout(3000);
            await page.screenshot({ path: './scripts/screenshots/form-step3.png' });
            console.log('Step 3 (resources): ./scripts/screenshots/form-step3.png');

            // Step 3 is just a resources page — click "Next step" to reach Contact options
            const nextStep2 = page.getByRole('button', { name: /next step/i });
            if (await nextStep2.isVisible({ timeout: 3000 }).catch(() => false)) {
              await nextStep2.click();
              await page.waitForTimeout(3000);
              await page.screenshot({ path: './scripts/screenshots/form-step4.png' });
              console.log('Step 4 (contact options): ./scripts/screenshots/form-step4.png');
              await handleContactOptions(page);
            }
          } else {
            console.warn('"Next step" button not found after selecting API Issue');
          }
        } else {
          // Form may have skipped category (remembered from last session) — already on Resources
          console.log('No category buttons — already at Resources step, clicking Next step');
          const nextStepDirect = page.getByRole('button', { name: /next step/i });
          if (await nextStepDirect.isVisible({ timeout: 2000 }).catch(() => false)) {
            await nextStepDirect.click();
            await page.waitForTimeout(3000);
            await page.screenshot({ path: './scripts/screenshots/form-step3.png' });
            console.log('Step 3: ./scripts/screenshots/form-step3.png');

            // Step 3 — Contact options: click Email
            await handleContactOptions(page);
          }
        }
      } catch (e) { console.warn('Step 2 error:', e.message); }
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

// ─── Contact options step (Step 3) ─────────────────────────────────────────
async function handleContactOptions(page) {
  try {
    const emailBtn = page.getByRole('button', { name: /email/i });
    if (await emailBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await emailBtn.click();
      console.log('Clicked Email option');
      await page.waitForTimeout(3000);
      await page.screenshot({ path: './scripts/screenshots/form-email.png' });
      console.log('Email form: ./scripts/screenshots/form-email.png');

      // Fill email form fields
      await fillEmailForm(page);
    } else {
      await page.screenshot({ path: './scripts/screenshots/form-contact-options.png' });
      console.log('Contact options screenshot: ./scripts/screenshots/form-contact-options.png');
      console.warn('Email button not found — check screenshot');
    }
  } catch (e) { console.warn('Contact options error:', e.message); }
}

// ─── Email form (after clicking Email in contact options) ───────────────────
async function fillEmailForm(page) {
  try {
    await page.waitForTimeout(2000);

    // Step A: If "Application For Basic API Access" is visible as an open option, click it
    const appForAccessVisible = await page.evaluate(() => {
      const el = [...document.querySelectorAll('li, option, [role="option"]')]
        .find(e => e.textContent?.trim() === 'Application For Basic API Access');
      if (el) { el.click(); return true; }
      return false;
    });
    if (appForAccessVisible) {
      console.log('Selected: Application For Basic API Access');
      await page.waitForTimeout(2000);
    } else {
      console.log('Option not visible as open list — checking current dropdown value or opening it');
      // Try opening the "What can we help with?" dropdown (it uses a custom select-like component)
      const dropdownClicked = await page.evaluate(() => {
        // Find the dropdown for "What can we help with?" — NOT the Language select
        const allSelects = [...document.querySelectorAll('[class*="select"], [role="combobox"]')]
          .filter(el => !el.getAttribute('aria-label')?.includes('Language'));
        if (allSelects[0]) { allSelects[0].click(); return allSelects[0].className?.slice(0, 60); }
        return null;
      });
      if (dropdownClicked) {
        console.log('Opened dropdown:', dropdownClicked);
        await page.waitForTimeout(1000);
        await page.evaluate(() => {
          const el = [...document.querySelectorAll('li, option, [role="option"]')]
            .find(e => e.textContent?.trim() === 'Application For Basic API Access');
          if (el) el.click();
        });
        await page.waitForTimeout(2000);
      }
    }

    // Step B: Find "Apply for Google Business Profile API access" — may be in an iframe
    await page.waitForTimeout(1000);

    // Check for iframes
    const frameCount = page.frames().length;
    console.log('Frames on page:', frameCount, page.frames().map(f => f.url()).join(', '));

    // Try main frame first
    let applyClicked = await page.evaluate(() => {
      const el = [...document.querySelectorAll('a, button, [role="button"]')]
        .find(e => e.textContent?.trim().includes('Apply for Google Business Profile API access'));
      if (el) { el.click(); return 'main: ' + el.tagName + ' ' + el.textContent?.trim().slice(0, 60); }
      return null;
    });

    // If not found in main frame, find the href in child frames and navigate directly
    if (!applyClicked) {
      for (const frame of page.frames()) {
        if (frame === page.mainFrame()) continue;
        try {
          const href = await frame.evaluate(() => {
            const el = [...document.querySelectorAll('a')]
              .find(e => e.textContent?.trim().includes('Apply for Google Business Profile API access'));
            return el?.href || null;
          });
          if (href) {
            console.log('Found apply link href:', href);
            await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 30000 });
            applyClicked = 'navigate: ' + href;
            break;
          }
        } catch { /* cross-origin frame */ }
      }
    }

    if (applyClicked) {
      console.log('Clicked:', applyClicked);
      await page.waitForTimeout(5000);
      await page.screenshot({ path: './scripts/screenshots/form-api-apply.png' });
      console.log('API application page: ./scripts/screenshots/form-api-apply.png');
      console.log('Current URL:', page.url());
      await scanAndFillApiForm(page);
    } else {
      await page.screenshot({ path: './scripts/screenshots/form-email-debug.png' });
      console.log('Apply button not found — debug: ./scripts/screenshots/form-email-debug.png');
    }
  } catch (e) { console.warn('fillEmailForm error:', e.message); }
}

// ─── API application form (after clicking "Apply for GBP API access") ────────
async function scanAndFillApiForm(page) {
  try {
    console.log('Current URL:', page.url());
    const fields = await page.evaluate(() => {
      const els = [...document.querySelectorAll('input:not([type=hidden]):not([type=radio]):not([type=checkbox]), textarea, select')];
      return els.map(el => ({
        tag: el.tagName, type: el.type,
        placeholder: el.getAttribute('placeholder'),
        ariaLabel: el.getAttribute('aria-label'),
        label: document.querySelector(`label[for="${el.id}"]`)?.textContent?.trim().slice(0, 60),
        id: el.id, name: el.name,
        cls: el.className?.slice(0, 60),
        value: el.value?.slice(0, 40),
      }));
    });
    console.log('API form fields:', JSON.stringify(fields, null, 2));
    await page.screenshot({ path: './scripts/screenshots/form-api-fields.png' });
    console.log('API form fields screenshot: ./scripts/screenshots/form-api-fields.png');
  } catch (e) { console.warn('scanAndFillApiForm error:', e.message); }
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
