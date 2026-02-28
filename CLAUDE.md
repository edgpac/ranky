# HayVista — Project Context for Claude

## What This Product Is
HayVista is an AI-powered SaaS that automatically manages Google Business Profile (GBP) content for local businesses (plumbers, contractors, shops). It reads a business's GBP, photos, and local search data, then publishes up to 4 posts/week — all for $17/month.

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
│   │   ├── PrivacyPage.tsx
│   │   └── TermsPage.tsx
│   ├── components/
│   │   └── tabs/               # Dashboard tab components
│   │       ├── PostsTab.tsx
│   │       ├── ReviewsTab.tsx
│   │       ├── PhotosTab.tsx
│   │       ├── InsightsTab.tsx
│   │       ├── ServicesTab.tsx
│   │       ├── EditProfileTab.tsx
│   │       ├── BookingsTab.tsx
│   │       ├── GetReviewsTab.tsx
│   │       └── ProductsTab.tsx
│   ├── contexts/
│   │   └── LanguageContext.tsx  # EN/ES language toggle
│   └── translations/
│       └── landing.ts           # All landing page copy (EN + ES)
├── public/
│   ├── sitemap.xml
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
- All landing copy lives in `src/translations/landing.ts`
- Both EN and ES must be updated together for any copy change

### Weekly Email Digest
- Built in `server/index.mjs` as `sendWeeklyDigest()`
- Sends via Resend from `digest@hayvista.com`
- Cron is **commented out** — uncomment after Google API review approves
- DNS records for `hayvista.com` already added to GoDaddy (DKIM, MX, SPF)

### Post Generation Cron
- Runs Mon/Wed/Fri at 9am via `node-cron`
- Uses `claude-sonnet-4-6` via Anthropic SDK

### Vercel Rewrites
- `/api/*` and `/auth/*` proxy to Railway backend
- `/sitemap.xml` and `/robots.txt` served as static files explicitly
- `/(.*)`catch-all → `/index.html` for SPA routing

---

## SEO & GSC

- **Sitemap:** https://hayvista.com/sitemap.xml (submitted to GSC, status: Success, 4 pages)
- **robots.txt:** https://hayvista.com/robots.txt
- **Verification tag:** `aUdXm81wc2h6sDHytOQNfY3qfDPfVpxnH0qZ1AUTUW8`
- **GSC property:** `hayvista.com` (domain property)
- **OG image needed:** `public/og-image.png` (1200×630) — not yet created

---

## Pending / Not Yet Active

- [ ] Resend API key — add to Railway once generated
- [ ] Stripe keys — add to Railway once Stripe account set up
- [ ] `VITE_STRIPE_PRICE_ID` — set after Stripe product created
- [ ] Weekly digest cron — uncomment in `server/index.mjs` after Google API review
- [ ] `public/og-image.png` — create 1200×630 social preview image
