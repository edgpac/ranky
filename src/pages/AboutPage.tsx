import SubPageLayout from '../components/SubPageLayout';

export default function AboutPage() {
  return (
    <SubPageLayout>
      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* Header */}
        <h1 className="text-3xl font-bold text-slate-900 mb-2">About HayVista</h1>
        <p className="text-sm text-slate-500 mb-10">AI-powered Google Business Profile management for local businesses</p>

        {/* Hero blurb */}
        <section className="mb-12">
          <p className="text-slate-700 leading-relaxed text-sm mb-4">
            HayVista is an AI-powered Google Business Profile manager built for local businesses that want to show up in search without hiring a marketing team. Once connected, HayVista reads your real GBP data — your photos, services, business hours, and the search queries locals are actually typing into Google — and automatically publishes up to three tailored posts per week written by Claude AI. Every post is matched to your most relevant photo using computer vision, grounded in live search data from Google Search Console, and written in your business's tone. Whether you're a contractor, restaurant, salon, real estate agent, or hotel, HayVista recognizes your business type and surfaces the right fields, hours, and service options automatically.
          </p>
          <p className="text-slate-700 leading-relaxed text-sm">
            Beyond posts, HayVista gives you a full control panel for your Google presence: manage and respond to reviews, answer customer Q&amp;A, upload SEO-optimized photos with AI-generated EXIF metadata, add custom photo descriptions that sync directly to GBP so Google indexes them, track weekly performance insights, and keep your services, social links, and profile details up to date — all from one dashboard, all for $17/month. No agency. No steep learning curve. Just a business profile that works for you while you focus on the work.
          </p>
        </section>

        {/* Feature grid */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">What's included</h2>
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
        <section className="mb-12">
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
            <p className="text-sm font-semibold text-slate-900 mb-1">Ready to grow on Google?</p>
            <p className="text-xs text-slate-500">Connect your Google Business Profile and let HayVista handle the rest.</p>
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

const FEATURES = [
  {
    icon: '✍️',
    title: 'Auto-generated GBP posts',
    body: 'Claude AI writes 3 posts per week tailored to your real business — driven by what locals are actually searching for that week.',
  },
  {
    icon: '📸',
    title: 'Smart photo matching',
    body: 'Computer vision reads your photos and picks the most relevant image for each post. Add custom descriptions to give Claude extra context.',
  },
  {
    icon: '⭐',
    title: 'Review management',
    body: 'See all your customer reviews in one place and get AI-suggested reply drafts so no review goes unanswered.',
  },
  {
    icon: '❓',
    title: 'Q&A management',
    body: 'Monitor and answer Google Q&A directly from your dashboard. Claude auto-drafts answers based on your business profile.',
  },
  {
    icon: '📊',
    title: 'Performance insights',
    body: 'Weekly view of your Google Search Console data — impressions, clicks, and the queries driving traffic to your profile.',
  },
  {
    icon: '🛠️',
    title: 'Profile editor',
    body: 'Update hours, services, description, and attributes. Business-type templates surface the right fields for your category automatically.',
  },
  {
    icon: '🖼️',
    title: 'SEO photo uploads',
    body: 'Photos are enriched with AI-generated EXIF metadata and captions before uploading to GBP so Google indexes them properly.',
  },
  {
    icon: '🔗',
    title: 'Social links sync',
    body: 'Add Instagram, Facebook, TikTok, YouTube, and more. Links sync to GBP attributes and get woven into your AI post CTAs.',
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
