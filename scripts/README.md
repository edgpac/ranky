# HayVista Playwright Scripts

Automation scripts that control your live Chrome browser via CDP (Chrome DevTools Protocol).
No cookie injection, no session expiry — scripts use your already-authenticated Chrome session.

---

## Setup (one time)

```bash
npm install
npx playwright install chromium
```

---

## Starting Chrome with CDP (required before every script)

```bash
open -a "Google Chrome" --args --remote-debugging-port=9222
```

Chrome must be running with this flag before any script will work.
You only need to do this once per machine restart — leave that Chrome window open.

---

## Scripts

### `connect.mjs`
Shared helper imported by all other scripts. Not run directly.

### `gbp-scrape.mjs`
Navigates to business.google.com/locations and extracts the GBP location name
in `accounts/X/locations/Y` format needed to connect HayVista.

```bash
node scripts/gbp-scrape.mjs
```

Output saved to `/tmp/gbp_location_name.txt` if found.
Screenshot saved to `/tmp/gbp-scrape.png`.

### `fill-gbp-form.mjs`
Fills out Google Business Profile API access forms automatically.

```bash
# Fill the GBP API allowlist form (developers.google.com)
node scripts/fill-gbp-form.mjs

# Fill the support.google.com quota/access form
node scripts/fill-gbp-form.mjs --form=quota

# Dry run — fill but do NOT submit (for review)
node scripts/fill-gbp-form.mjs --form=quota --dry-run
```

### `screenshot.mjs`
Takes a full-page screenshot of any URL using your live authenticated Chrome session.

```bash
node scripts/screenshot.mjs <url> [output-path]

# Examples:
node scripts/screenshot.mjs https://hayvista.com/dashboard
node scripts/screenshot.mjs https://business.google.com/locations /tmp/gbp.png
node scripts/screenshot.mjs https://console.cloud.google.com /tmp/gcp.png
```

### `test-dashboard.mjs`
Smoke tests the live HayVista dashboard — checks all API endpoints and tab renders.

```bash
# Test production (hayvista.com)
node scripts/test-dashboard.mjs

# Test local dev server
node scripts/test-dashboard.mjs --local
```

Screenshots of each tab saved to `/tmp/dash-tab-*.png`.

---

## Project State

### GCP Project
| Field          | Value                          |
|----------------|-------------------------------|
| Project Name   | Gemini API                     |
| Project ID     | gen-lang-client-0397405367     |
| Project Number | 1005175082848                  |

### Known GBP Identifiers (Hay Vista)
| Field        | Value                  |
|--------------|------------------------|
| Location ID  | 15307649334467972155   |
| FID / CID    | 10035441415569680653   |
| GBP URL      | business.google.com/n/15307649334467972155/profile |
| Account ID   | unknown — pending API approval |
| Full API path | accounts/UNKNOWN/locations/15307649334467972155 |

Once the GBP API is approved, run `node scripts/gbp-scrape.mjs` to auto-discover
the account ID and get the full `accounts/X/locations/Y` path.

### GBP API Status
| API                              | Status                        |
|----------------------------------|-------------------------------|
| My Business Account Management   | Enabled, quota = 0 (pending approval) |
| My Business Business Information | Enabled, quota = 0 (pending approval) |
| GBP API v4.9 (posts/reviews/photos) | Needs partner access form — submitted |

### API Architecture
All GBP v4 calls in `server/index.mjs` use `gbpV4Fetch(auth, method, path, body)` —
a direct `fetch()` wrapper to `https://mybusiness.googleapis.com/v4/` using a Bearer token.
The old `google.mybusiness({ version: 'v4' })` client was removed in googleapis v144.

### Engines (all blocked until API approved)
| Engine   | Schedule      | Status                          |
|----------|---------------|---------------------------------|
| Posts    | Mon/Wed/Fri 9am | Drafts in DB, publish blocked  |
| Reviews  | On new review  | Drafts in DB, reply blocked    |
| Q&A      | Every 6h       | Drafts in DB, post blocked     |

### Pending Items
- [ ] GBP API partner access approved (hayvista@gmail.com, submitted)
- [ ] Stripe keys added to Railway
- [ ] Resend API key added to Railway (DNS verified, sending enabled)
- [ ] Weekly digest cron uncommented after GBP API approval
- [ ] public/og-image.png created (1200x630)

---

## URLs
| Service    | URL |
|------------|-----|
| Production frontend | https://hayvista.com |
| Production backend  | https://ranky-production.up.railway.app |
| GitHub repo         | https://github.com/edgpac/ranky |
| GCP console         | https://console.cloud.google.com/?project=gen-lang-client-0397405367 |
| GBP dashboard       | https://business.google.com/locations |
