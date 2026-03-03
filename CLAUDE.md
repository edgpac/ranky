# HayVista — Project Context for Claude

## What This Product Is
HayVista is an AI-powered SaaS that fully automates Google Business Profile (GBP) management for local businesses. Three automation engines run in parallel: a **post engine** (Mon/Wed/Fri), a **review engine** (triggered on every new review), and a **Q&A engine** (every 6 hours). Every action is AI-drafted, held in a 24-hour review window, and auto-posted if untouched — all for $17/month.

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
│   │   ├── FaqPage.tsx         # 10 GBP/SEO FAQs — Uses SubPageLayout
│   │   └── AboutPage.tsx       # Product capability page — Uses SubPageLayout
│   ├── components/
│   │   ├── SubPageLayout.tsx       # Shared nav + footer for Privacy, Terms, FAQ, About
│   │   ├── CountdownBanner.tsx     # Shared 24h countdown banner + useCountdown hook (Posts, Q&A, Reviews)
│   │   └── tabs/               # Dashboard tab components
│   │       ├── PostsTab.tsx
│   │       ├── ReviewsTab.tsx
│   │       ├── PhotosTab.tsx
│   │       ├── InsightsTab.tsx
│   │       ├── ServicesTab.tsx
│   │       ├── EditProfileTab.tsx
│   │       ├── BookingsTab.tsx
│   │       ├── GetReviewsTab.tsx
│   │       └── MemoryTab.tsx
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
| `/about` | AboutPage — product capabilities + three automation engines |

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

### 24-Hour Automation Pattern (Posts, Q&A, Reviews)
All three automation engines follow the same pattern:
1. AI draft is generated and stored in DB with `auto_post_at = NOW() + 24h`
2. Frontend shows `<CountdownBanner>` (yellow bar + draining progress, from `src/components/CountdownBanner.tsx`)
3. User controls: **Edit** (inline textarea) | **Cancel/Discard** | **Post/Publish Now** (skips timer)
4. Hourly cron picks up any row where `auto_post_at <= NOW()` and posts to GBP
- Posts: `auto_approve_at` column on `posts` table — currently marks `status = 'approved'` (GBP publish pending write-scope approval)
- Q&A: `auto_approve_at` column on `qa_answers` table — posts answer to GBP via `mybusiness…qa.create`
- Reviews: `pending_replies` table (`client_id`, `review_id`, `draft_text`, `auto_post_at`, `status`) — posts reply via `reviews.updateReply`

### Post Generation Cron
- Runs Mon/Wed/Fri at 9am via `node-cron`
- Uses `claude-sonnet-4-6` via Anthropic SDK
- `generatePostForClient(client)` enriches the Claude prompt with:
  - GSC top search query for the week (what locals are actually searching)
  - GBP business description + service items (from `mybusinessbusinessinformation` v1)
  - Products from the local `products` DB table (fallback if no GBP services)
  - Social links from `clients.social_links` — Claude references active platforms in CTAs
    but never fabricates platforms the business hasn't added
- **Smart photo picker:** after post text is generated, a Haiku call picks the most
  relevant photo by matching post content to `photoMeta` descriptors
- **photoMeta priority:** `user_description` → `ai_description` → GBP caption → category only

### Review Auto-Reply (`pending_replies` DB table)
- `GET /api/reviews` — enriches each review with its `pendingReply: { draftText, autoPostAt }` from `pending_replies`
- Background job: for any unreplied review with no pending draft, calls `generatePendingReplies()` via `setImmediate`
- `generatePendingReplies()` uses `buildReplySystemPrompt(client)` (shared with manual generate-reply route)
- `PATCH /api/reviews/pending-reply` — user edits the draft text before auto-post window closes
- `DELETE /api/reviews/pending-reply/:reviewId` — cancels auto-post (status → 'cancelled')
- `POST /api/reviews/pending-reply/:reviewId/post-now` — posts immediately, sets status → 'posted'
- Hourly cron auto-posts all `pending_replies` where `auto_post_at <= NOW() AND status = 'pending'`

### Business Memory (`business_memory` DB table)
- Stores a living markdown document per client that Claude reads before every AI generation
- Schema: `id, client_id, content TEXT, updated_at TIMESTAMPTZ, UNIQUE(client_id)`
- `getBusinessMemory(clientId)` — async helper, trims to 2000 chars (~500 tokens), returns `''` on error (graceful no-op)
- `bootstrapMemory(client)` — one-time Sonnet call; fires via `setImmediate` on first `GET /api/memory` if no row exists. Assembles GBP description+services, products, top 5 search queries, last 3 posted replies into a 6-section markdown doc
- Memory injected into all 3 engines under `if (businessMemory)` guard — zero impact when empty:
  - Posts: appended to `systemPrompt` in `generatePostForClient()`
  - Reviews: `buildReplySystemPrompt(client)` is `async`, appends memory at bottom
  - Q&A: first 20 lines appended to `sysP` in both manual route and cron
- `updateMemoryAfterPost/Reply/QA()` — Haiku calls via `setImmediate`, non-blocking, update specific sections after each generation event
- `GET /api/memory` — returns `{ memory, updatedAt }` or `{ memory: null, bootstrapping: true }` (triggers bootstrap)
- `PATCH /api/memory` — accepts `{ content }`, trims to 6000 chars, upserts
- Frontend: `MemoryTab.tsx` — 3 states: loading spinner, bootstrapping (polls every 8s), loaded (monospace display + inline edit/save)

### Photo Labels (`photo_labels` DB table)
- Stores AI Vision descriptions + user-written descriptions per photo URL
- `ai_description` — auto-generated by Claude Haiku Vision (background job on `GET /api/photos`)
- `user_description` — user-edited via pencil icon in Photos tab (overrides AI label everywhere)
- `PATCH /api/photos/label` — saves user description to DB **and** pushes to GBP via `media.patch`
  so Google indexes the updated caption for local SEO
- New uploads: auto-labeled via Vision from the raw buffer after GBP upload (background)
- Photos tab cards: show **AI** badge (blue) or **Custom** badge (green); pencil opens inline editor
- Mock photo cards show gradient placeholders + "Sample" badge (matches Posts/Reviews tab quality)

### Business Type Templates (`src/components/tabs/profileTemplates.ts`)
- `resolveTemplate(businessType)` maps any GBP category or free-text → one of 7 `ProfileTemplate` keys
- Templates: `contractor` (default/SAB), `restaurant`, `store`, `salon`, `hotel`, `doctor`, `real_estate`
- Each template controls: `hoursLabel`, `showAddress`, `showServiceArea`, `moreHoursToShow`, `attributes`, `extraFields`
- Edit Profile tab allows "Other — describe below" free-text category; maps to correct template via keyword matching
- `KEYWORD_MAP` in `profileTemplates.ts` covers 100+ business-type keywords across all 7 templates

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

## AI Engine Discovery

- **`public/llms.txt`** — plain-text product summary for LLM crawlers (Perplexity, ChatGPT, Claude, etc.)
- **JSON-LD in `index.html`** — `SoftwareApplication` + `Organization` schemas served on every page
- **FAQPage JSON-LD** — injected dynamically in `FaqPage.tsx` via `useEffect` (10 Q&As as `Question`/`Answer` pairs)
- **`robots.txt`** — explicitly permits GPTBot, ClaudeBot, PerplexityBot, Google-Extended, ChatGPT-User, anthropic-ai, cohere-ai + blocks `/dashboard` and `/auth/`
- **SPA rendering gap** — site is a client-side React SPA; non-JS crawlers see `<div id="root"></div>`. Most modern AI crawlers (Perplexity, ChatGPT, Google AI Overview) execute JavaScript so impact is limited, but a future SSG migration (e.g. `vite-react-ssg`) would fully close this gap. Requires changing `main.tsx` to use `ViteReactSSG` and refactoring App.tsx to export a routes array.

## SEO & GSC

- **Sitemap:** https://hayvista.com/sitemap.xml (submitted to GSC, status: Success, 6 pages incl. /about)
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
