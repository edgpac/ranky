# HayVista — Project Context for Claude

## What This Product Is
HayVista is an AI-powered SaaS that automatically manages Google Business Profile (GBP) content for local businesses (plumbers, contractors, shops). It reads a business's GBP, photos, services, products, social media links, and local search data — then publishes 3 posts/week with AI copy tailored to the real business context — all for $17/month.

**Live URL:** https://hayvista.com
**Backend (Railway):** https://ranky-production.up.railway.app
**GitHub:** https://github.com/edgpac/ranky

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| Backend | Node.js + Express (ESM, `server/index.mjs`) |
| Database | PostgreSQL on Railway |
| Auth | Google OAuth 2.0 (passport-google-oauth20) |
| Payments | Stripe (checkout sessions) |
| Email | Resend (`digest@hayvista.com`) |
| AI | Anthropic Claude (`claude-sonnet-4-6`) |
| Hosting | Vercel (frontend) + Railway (backend + DB) |
| GBP API | Google Business Profile API |

---

## Project Structure

```
ranky/
├── server/
│   └── index.mjs          # Express backend — all API routes, crons, GBP logic
├── src/
│   ├── App.tsx             # Router — all page routes
│   ├── main.tsx
│   ├── pages/
│   │   ├── LandingPage.tsx     # Public marketing page (EN/ES)
│   │   ├── SignupPage.tsx      # Google OAuth sign-in form
│   │   ├── AuthCallback.tsx    # Post-OAuth: routes to Stripe or dashboard
│   │   ├── Dashboard.tsx       # Main app — guest mode + authenticated mode
│   │   ├── PrivacyPage.tsx     # Uses SubPageLayout
│   │   ├── TermsPage.tsx       # Uses SubPageLayout
│   │   └── FaqPage.tsx         # 10 GBP/SEO FAQs — Uses SubPageLayout
│   ├── components/
│   │   ├── SubPageLayout.tsx   # Shared nav + footer for Privacy, Terms, FAQ
│   │   └── tabs/               # Dashboard tab components
│   │       ├── PostsTab.tsx
│   │       ├── ReviewsTab.tsx
│   │       ├── PhotosTab.tsx
│   │       ├── InsightsTab.tsx
│   │       ├── ServicesTab.tsx
│   │       ├── EditProfileTab.tsx
│   │       ├── BookingsTab.tsx
│   │       ├── GetReviewsTab.tsx
│   │       ├── SocialLinksSection.tsx
│       └── ProductsTab.tsx
│   ├── contexts/
│   │   └── LanguageContext.tsx  # EN/ES language toggle
│   └── translations/
│       ├── landing.ts           # Landing page copy (EN + ES)
│       └── app.ts               # All non-landing copy — Dashboard, tabs, sub-pages (EN + ES)
├── public/
│   ├── hayvista-logo.png   # Main logo — used in all navbars (80px)
│   ├── sitemap.xml         # 5 pages: /, /signup, /privacy, /terms, /faq
│   └── robots.txt
├── index.html              # Vite entry — meta tags, OG, verification tags
├── vercel.json             # Rewrites: /api/* + /auth/* → Railway; SPA catch-all
└── .env                    # Never commit — see env vars below
```

---

## Routes

| Path | Description |
|---|---|
| `/` | LandingPage (public) |
| `/signup` | SignupPage — Google OAuth |
| `/auth/callback` | AuthCallback — post-OAuth routing |
| `/dashboard` | Dashboard — guest browse or full access |
| `/privacy` | PrivacyPage |
| `/terms` | TermsPage |
| `/faq` | FaqPage — 10 GBP/SEO questions, linked from footer |

---

## User Flow

1. **Landing** → "Get Started Free" / hero CTA → `/dashboard` (guest browse)
2. **Landing** → Pricing CTA / Final CTA → Stripe checkout (calls `/api/stripe/create-checkout`; on 401 redirects to `/signup`)
3. **Dashboard (guest)** → tabs visible with inline "Connect Google" banner → `/signup`
4. **Signup** → Google OAuth → `/auth/google` → `/auth/callback`
5. **AuthCallback** → checks `/api/me` subscription_status:
   - `active` → `/dashboard`
   - not active + `VITE_STRIPE_PRICE_ID` set → Stripe checkout
   - fallback → `/dashboard`
6. **Stripe success** → subscriber lands on `/dashboard` with full access

---

## Key Environment Variables

```env
# Frontend (Vite — prefix VITE_)
VITE_STRIPE_PRICE_ID=price_xxx        # Must match STRIPE_STARTER_PRICE_ID

# Backend (Railway)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://ranky-production.up.railway.app/auth/google/callback
ANTHROPIC_API_KEY=sk-ant-...
RESEND_API_KEY=                        # Fill in after Resend DNS verifies
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_STARTER_PRICE_ID=
DATABASE_URL=postgresql://...
PORT=3001
FRONTEND_URL=https://hayvista.com
SESSION_SECRET=
NODE_ENV=production
```

---

## Important Patterns

### Guest Mode (Dashboard)
- `/api/me` returns 401 → `isGuest = true`
- Tabs render with a small inline banner instead of a fullscreen gate
- Banner: "Connect your Google Business Profile..." + "Connect Google" → `/signup`

### Language Toggle
- `LanguageContext` provides `lang: 'en' | 'es'`
- Landing copy: `src/translations/landing.ts`
- All app/dashboard/tab copy: `src/translations/app.ts` — accessed via `useAppT()` hook
- Both EN and ES must be updated together for any copy change

### Weekly Email Digest
- Built in `server/index.mjs` as `sendWeeklyDigest()`
- Sends via Resend from `digest@hayvista.com`
- Cron is **commented out** — uncomment after Google API review approves
- DNS records for `hayvista.com` already added to GoDaddy (DKIM, MX, SPF)

### Post Generation Cron
- Runs Mon/Wed/Fri at 9am via `node-cron`
- Uses `claude-sonnet-4-6` via Anthropic SDK
- `generatePostForClient(client)` enriches the Claude prompt with:
  - GSC top search query for the week (what locals are actually searching)
  - A random GBP photo URL
  - GBP business description + service items (from `mybusinessbusinessinformation` v1)
  - Products from the local `products` DB table (fallback if no GBP services)
  - Social links from `clients.social_links` — Claude references active platforms in CTAs
    but never fabricates platforms the business hasn't added

### Social Media Links (`src/components/tabs/SocialLinksSection.tsx`)
- Rendered as a second card below the main profile card in the Edit Profile tab
- Platforms: Instagram, Facebook, TikTok, YouTube, LinkedIn, X
- `GET /api/social-links` — returns `social_links` JSONB from `clients` table
- `PATCH /api/social-links` — saves to DB + best-effort pushes to GBP URL attributes
  (`attributes/url_instagram`, `url_facebook`, etc.) — graceful fail until write scope approved
- Stored in `clients.social_links JSONB DEFAULT '{}'` (migration in `initDB`)
- Social links are also read by `generatePostForClient` for richer post CTAs

### Pricing Card
- Triggered by "Pricing" button in navbar (`pricingOpen` state)
- Has backdrop click-to-close + explicit ✕ button in top-right corner of card
- CTA inside card → Stripe checkout; close just dismisses without navigating

### Logo
- File: `/hayvista-logo.png` (black circle, white HAYVISTA text)
- Landing navbar: `80px` base, `96px` sm+
- SubPageLayout navbar: `80px`
- SubPageLayout footer: `56px`

### SubPageLayout (`src/components/SubPageLayout.tsx`)
- Shared nav + footer used by Privacy, Terms, FAQ
- Nav: logo + "Get Started" blue button → `/signup`
- Footer: logo, address, email, copyright, links to Privacy / Terms / FAQ
- Wrap any new sub-page content in `<SubPageLayout>` to get nav + footer automatically

### Vercel Rewrites
- `/api/*` and `/auth/*` proxy to Railway backend
- `/sitemap.xml` and `/robots.txt` served as static files explicitly
- `/(.*)`catch-all → `/index.html` for SPA routing

---

## Contact Email

- **Public contact:** `hayvista@gmail.com` (used in footer, Privacy, Terms pages)
- **Digest sender:** `digest@hayvista.com` via Resend (server only, not a contact address)

---

## SEO & GSC

- **Sitemap:** https://hayvista.com/sitemap.xml (submitted to GSC, status: Success, 5 pages)
- **robots.txt:** https://hayvista.com/robots.txt
- **Verification tag:** `aUdXm81wc2h6sDHytOQNfY3qfDPfVpxnH0qZ1AUTUW8`
- **GSC property:** `sc-domain:hayvista.com` (domain property — verified ✅ via DNS TXT record)
- **Previous property:** `https://www.hayvista.com/` (URL prefix — keep but ignore, non-www canonical means it misses most traffic)
- **GSC MCP note:** MCP tool is connected to a different Google account (only sees `caboshandyman.com`). Reconnect with hayvista.com account for full analytics once data accumulates (2–4 weeks).
- **OG image needed:** `public/og-image.png` (1200×630) — not yet created

## Resend DNS Status (GoDaddy)

- DKIM TXT `resend._domainkey` — Verified ✅
- MX `send` → `feedback-smtp.us-east-1.amazonses.com` — Verified ✅
- TXT `send` (SPF) — Verified ✅
- MX `@` (inbound receiving) — Pending (not needed for digest sending)
- Domain status in Resend: **Partially Verified** — sending is enabled

---

## Pending / Not Yet Active

- [ ] Resend API key — generate in Resend dashboard → add to Railway as `RESEND_API_KEY`
- [ ] Weekly digest cron — uncomment in `server/index.mjs` after Google API review approves
- [ ] Stripe keys — add to Railway once Stripe account set up
- [ ] `VITE_STRIPE_PRICE_ID` — set after Stripe product created
- [ ] `public/og-image.png` — create 1200×630 social preview image
