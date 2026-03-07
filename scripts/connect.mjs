/**
 * connect.mjs — Playwright browser helper (persistent profile)
 *
 * Launches Playwright's own Chromium with a saved profile in ~/.hayvista-browser/.
 * First run: a browser window opens — sign into Google once, then close it.
 * All future runs: already signed in, no setup needed.
 *
 * No need to restart your main Chrome. No CDP port conflicts.
 *
 * USAGE in any script:
 *   import { newPage, closeBrowser } from './connect.mjs';
 *   const page = await newPage();
 *   ...
 *   await closeBrowser();
 */

import { chromium } from 'playwright';
import { join } from 'path';
import { homedir } from 'os';

const PROFILE_DIR = join(homedir(), '.hayvista-browser');

let context = null;

export async function getContext() {
  if (context) return context;
  console.log('Launching browser (profile: ~/.hayvista-browser)...');
  context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,          // visible — you can watch and intervene
    channel: 'chromium',      // use Playwright's built-in Chromium
    viewport: { width: 1280, height: 900 },
    args: ['--no-first-run', '--no-default-browser-check'],
  });
  console.log('Browser ready.');
  return context;
}

/** Opens a new page in the persistent context (keeps all cookies/auth). */
export async function newPage() {
  const ctx = await getContext();
  return ctx.newPage();
}

/** Returns the first existing page, or opens a new one. */
export async function getPage() {
  const ctx = await getContext();
  const pages = ctx.pages();
  return pages.length > 0 ? pages[0] : ctx.newPage();
}

export async function closeBrowser() {
  if (context) {
    await context.close();
    context = null;
  }
}
