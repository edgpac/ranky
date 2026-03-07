/**
 * connect.mjs — shared CDP helper
 *
 * Connects Playwright to your already-running Chrome browser.
 * No cookie injection, no session expiry — uses your live authenticated session.
 *
 * USAGE (before running any script):
 *   open -a "Google Chrome" --args --remote-debugging-port=9222
 *
 * Then in any script:
 *   import { getPage, closeBrowser } from './connect.mjs';
 *   const page = await getPage();
 *   ...
 *   await closeBrowser();
 */

import { chromium } from 'playwright';

const CDP_URL = 'http://localhost:9222';

let browser = null;

export async function getBrowser() {
  if (browser) return browser;
  try {
    browser = await chromium.connectOverCDP(CDP_URL);
    console.log('Connected to Chrome via CDP');
    return browser;
  } catch (e) {
    console.error(`
Could not connect to Chrome. Make sure Chrome is running with:

  open -a "Google Chrome" --args --remote-debugging-port=9222

Then try again.
`);
    process.exit(1);
  }
}

/** Returns the first existing page, or opens a new one. */
export async function getPage() {
  const b = await getBrowser();
  const contexts = b.contexts();
  if (contexts.length === 0) {
    const ctx = await b.newContext();
    return ctx.newPage();
  }
  const pages = contexts[0].pages();
  return pages.length > 0 ? pages[0] : contexts[0].newPage();
}

/** Opens a fresh page in the existing context (keeps auth). */
export async function newPage() {
  const b = await getBrowser();
  const contexts = b.contexts();
  const ctx = contexts.length > 0 ? contexts[0] : await b.newContext();
  return ctx.newPage();
}

export async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
