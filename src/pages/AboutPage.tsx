import SubPageLayout from '../components/SubPageLayout';

export default function AboutPage() {
  return (
    <SubPageLayout>
      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* Header */}
        <h1 className="text-3xl font-bold text-slate-900 mb-2">About HayVista</h1>
        <p className="text-sm text-slate-500 mb-10">Your Google Business Profile — fully automated, always in your control</p>

        {/* Hero blurb */}
        <section className="mb-14">
          <p className="text-slate-700 leading-relaxed text-sm mb-4">
            HayVista is not a tool that asks you to do things. It's a system that does them for you — and asks your permission before anything goes live on Google. Connect your Google Business Profile once, and three automation engines run in parallel: one publishes posts grounded in real search data, one drafts and posts replies to every customer review, and one answers every Q&amp;A question on your profile. Every action is written by Claude AI, tailored to your actual business, and held in a 24-hour review window before going live. Edit it, skip it, or do nothing — it handles itself.
          </p>
          <p className="text-slate-700 leading-relaxed text-sm">
            HayVista reads your real GBP data — your photos, services, business hours, and the search queries locals are actually typing into Google — and uses all of it as context for every piece of AI-generated content. Posts are matched to your most relevant photo using computer vision. Replies mirror the tone of the reviewer. Answers are grounded in your actual services. Beyond the initial read, HayVista builds a persistent memory document for your business: your brand tone, top services, what content has performed, recurring customer themes, and patterns in your reviews. Claude reads this before every generation — so posts, replies, and answers don't just sound consistent, they get measurably more accurate the longer you use the platform. Whether you're a contractor, restaurant, salon, real estate agent, or hotel, HayVista recognizes your business type and surfaces the right fields automatically — all for $17/month. No agency. No steep learning curve. Just a business profile that keeps getting sharper.
          </p>
        </section>

        {/* Three engines */}
        <section className="mb-14">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Three automation engines</h2>
          <p className="text-xs text-slate-400 mb-6">Each one runs on its own schedule. Every action has a 24-hour window — edit, cancel, or post immediately. Untouched actions go live automatically.</p>
          <div className="flex flex-col gap-5">
            {ENGINES.map((e) => (
              <div
                key={e.title}
                className="rounded-xl border border-slate-100 bg-slate-50 px-5 py-4 flex gap-4"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                    style={{ background: e.color }}
                  >
                    {e.icon}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 mb-1">{e.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{e.body}</p>
                  <p className="text-xs text-slate-400 mt-1.5 font-medium">{e.schedule}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Feature grid */}
        <section className="mb-14">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Everything else included</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-3">
                <span className="text-xl mt-0.5 flex-shrink-0">{f.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800 mb-0.5">{f.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Built for */}
        <section className="mb-14">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Built for</h2>
          <div className="flex flex-wrap gap-2">
            {BUSINESS_TYPES.map((b) => (
              <span
                key={b}
                className="text-xs font-medium px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100"
              >
                {b}
              </span>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-gray-100 pt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900 mb-1">Ready to put your Google profile on autopilot?</p>
            <p className="text-xs text-slate-500">Connect once. HayVista handles posts, reviews, and Q&A — and gets smarter about your business every week.</p>
          </div>
          <a
            href="/signup"
            style={{
              background: '#4f8ef7', color: '#fff', borderRadius: '0.625rem',
              padding: '0.5rem 1.25rem', fontSize: '0.875rem', fontWeight: 600,
              textDecoration: 'none', whiteSpace: 'nowrap' as const, flexShrink: 0,
            }}
          >
            Get Started — $17/mo
          </a>
        </section>

        <div className="mt-12 pt-8 border-t border-gray-100 text-sm text-slate-500">
          Questions?{' '}
          <a href="mailto:hayvista@gmail.com" className="text-blue-600 hover:underline">hayvista@gmail.com</a>
        </div>
      </div>
    </SubPageLayout>
  );
}

const ENGINES = [
  {
    icon: '✍️',
    color: 'rgba(79,142,247,0.12)',
    title: 'Post engine — Mon, Wed, Fri at 9 AM',
    schedule: 'Schedule: 3×/week · 24-hour approval window · auto-publishes if untouched',
    body: 'Claude reads that week\'s top search queries from Google Search Console, picks the most relevant photo using computer vision, and writes a GBP post in your business\'s tone. It reads your business memory before writing — so posts reflect your established brand tone, your top services, and what has performed well. A 24-hour window opens — edit it, discard it, or publish it immediately. Do nothing and it goes live automatically.',
  },
  {
    icon: '⭐',
    color: 'rgba(251,191,36,0.12)',
    title: 'Review engine — triggered on every new review',
    schedule: 'Trigger: new review · 24-hour reply window · auto-posts reply if untouched',
    body: 'The moment a customer review comes in, Claude drafts a tailored reply. It reads your business memory to match the brand tone and service references you\'ve established — so replies don\'t just sound polished, they sound like you. It detects the reviewer\'s tone — casual, technical, angry, enthusiastic — and mirrors it. Mentions the specific service and location naturally for local SEO. A 24-hour window opens. Edit it, cancel it, or post immediately. Untouched: it goes live on Google automatically.',
  },
  {
    icon: '❓',
    color: 'rgba(52,211,153,0.12)',
    title: 'Q&A engine — scans every 6 hours',
    schedule: 'Schedule: every 6 hours · 24-hour answer window · auto-posts if untouched',
    body: 'Every 6 hours HayVista scans your Google Business Q&A for unanswered customer questions. Claude drafts answers grounded in your real services, hours, and business memory — so recurring questions get consistent, on-brand answers rather than generic ones. Same 24-hour window. Same controls. If you don\'t act: the answer posts to your profile automatically.',
  },
];

const FEATURES = [
  {
    icon: '🧠',
    title: 'Business memory',
    body: 'Claude builds a persistent knowledge document for your business — your brand tone, top services, review patterns, Q&A themes, and what content has worked. Every AI generation reads it first. The longer you use HayVista, the more accurate and consistent the output becomes.',
  },
  {
    icon: '📸',
    title: 'Smart photo matching',
    body: 'Computer vision reads your GBP photos and picks the most contextually relevant image for each post. Add your own descriptions to give Claude extra context — they sync directly to GBP so Google indexes them.',
  },
  {
    icon: '📊',
    title: 'Performance insights',
    body: 'Weekly view of your Google Search Console data — impressions, clicks, and the exact queries driving traffic to your profile. The same data that powers every AI post.',
  },
  {
    icon: '🛠️',
    title: 'Profile editor',
    body: 'Update hours, services, description, and attributes from your dashboard. Business-type templates surface the right fields for your category — contractor, restaurant, salon, hotel, medical, real estate, or retail.',
  },
  {
    icon: '🖼️',
    title: 'SEO photo uploads',
    body: 'Photos are enriched with AI-generated EXIF metadata and captions before uploading to GBP so Google can index them properly for local search.',
  },
  {
    icon: '🔗',
    title: 'Social links sync',
    body: 'Add Instagram, Facebook, TikTok, YouTube, LinkedIn, and more. Links sync to GBP URL attributes and get woven into your AI post CTAs — only the platforms you\'ve actually added.',
  },
  {
    icon: '📧',
    title: 'Weekly digest email',
    body: 'A weekly summary of your GBP performance, new reviews, and upcoming scheduled posts — delivered to your inbox every Monday.',
  },
];

const BUSINESS_TYPES = [
  'General Contractors', 'Plumbers', 'Electricians', 'HVAC', 'Landscapers',
  'Restaurants', 'Cafes', 'Bars', 'Bakeries',
  'Hair Salons', 'Barbershops', 'Spas', 'Nail Studios',
  'Hotels', 'Motels', 'Bed & Breakfasts',
  'Doctors', 'Dentists', 'Clinics', 'Therapists',
  'Real Estate Agents', 'Property Managers', 'Realtors',
  'Retail Stores', 'Boutiques', 'Markets',
];
