import { useNavigate } from 'react-router-dom';

const STEPS = [
  {
    n: '01',
    icon: '🔗',
    title: 'Connects on day one — no orientation',
    desc: 'One login with Google. HayVista reads your Business Profile, your photos, and your local search data. It already knows what your market needs. No handholding required.',
  },
  {
    n: '02',
    icon: '🧠',
    title: 'Understands your business without being told',
    desc: 'It studies your real job photos, your services, and what people nearby are actually searching for — then writes content that speaks directly to those customers.',
  },
  {
    n: '03',
    icon: '📅',
    title: 'Shows up every week. Does the work. Sends a recap.',
    desc: 'Posts publish to your GBP up to 4 times a week — within Google\'s guidelines so your profile stays clean. You get a WhatsApp summary of what went up. You stay in control.',
  },
];

const PLAN_FEATURES = [
  'Up to 4 posts / week',
  'Photo + search keyword matching',
  'GBP content published automatically',
  'Weekly WhatsApp activity summary',
  'Reviews, Photos, Services & Insights dashboard',
  'No contracts — cancel anytime',
];

const STATS = [
  { value: '$17', label: 'per month — less than minimum wage' },
  { value: '4×', label: 'max posts/week — no Google spam' },
  { value: '100%', label: 'Google API compliant' },
];

const glass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(8px)',
  boxShadow: '0 4px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.07)',
};

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {/* ── Ambient background orbs ─────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div style={{ position: 'absolute', top: '-8%', left: '15%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,142,247,0.11) 0%, transparent 65%)', filter: 'blur(48px)' }} />
        <div style={{ position: 'absolute', top: '35%', right: '-8%', width: 550, height: 550, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,90,247,0.09) 0%, transparent 65%)', filter: 'blur(48px)' }} />
        <div style={{ position: 'absolute', bottom: '5%', left: '5%', width: 450, height: 450, borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.07) 0%, transparent 65%)', filter: 'blur(48px)' }} />
      </div>

      {/* ── Navbar ──────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-8 md:px-16 h-[68px]"
        style={{ background: 'rgba(8,13,26,0.75)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-2.5">
          <img src="/hayvista-logo.png" alt="HayVista" style={{ width: 80, height: 80, objectFit: 'contain', flexShrink: 0 }} />
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
            style={{ background: 'var(--accent)', color: '#fff' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            Get Started Free
          </button>
        </div>
      </nav>

      {/* ── Main content ─────────────────────────────────────────── */}
      <main>
      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center text-center px-6 pt-28 pb-24">
        <div
          className="flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-xs font-semibold tracking-widest"
          style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', color: 'var(--success)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          YOUR BEST EMPLOYEE — FOR $17 A MONTH
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight max-w-4xl mb-6">
          The employee who already knows{' '}
          <span style={{ background: 'linear-gradient(90deg, #4f8ef7, #7c5af7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            your business.
          </span>
        </h1>

        <p className="text-lg md:text-xl max-w-2xl leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
          No training. No onboarding. No sick days.
        </p>
        <p className="text-lg md:text-xl max-w-2xl leading-relaxed mb-10" style={{ color: 'var(--text-muted)' }}>
          HayVista walks in on day one, reads your Google Business Profile, studies your photos and what locals are searching for — and starts publishing content that puts you in front of customers every single week.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-base font-bold px-8 py-4 rounded-xl transition-all"
            style={{ background: 'linear-gradient(135deg, #4f8ef7, #7c5af7)', color: '#fff', boxShadow: '0 0 40px rgba(79,142,247,0.35)' }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 60px rgba(79,142,247,0.5)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 40px rgba(79,142,247,0.35)'; }}
          >
            Meet Your New Employee — Free
          </button>
        </div>

        {/* Stats */}
        <div className="mt-20 flex flex-wrap justify-center gap-12">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-extrabold" style={{ color: 'var(--accent)' }}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── What makes this employee different ──────────────────────── */}
      <section className="relative px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <div
            className="rounded-2xl px-8 py-10 flex flex-col gap-5"
            style={{
              background: 'linear-gradient(135deg, rgba(79,142,247,0.07), rgba(124,90,247,0.05))',
              border: '1px solid rgba(79,142,247,0.18)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <p className="text-xs font-bold tracking-widest" style={{ color: 'var(--accent)' }}>WHY HAYVISTA WORKS</p>
            <h2 className="text-2xl font-extrabold leading-snug">
              Most businesses lose customers because they're invisible on Google.<br />
              Not because they do bad work.
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              A great plumber, contractor, or shop owner spends their day doing the job — not writing Google posts.
              HayVista is the team member who handles that. It knows your services, your area, your photos.
              It writes the content, picks the right keywords, and publishes — while you focus on the work that actually pays.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-2">
              {[
                { icon: '🧠', label: 'No training needed', desc: 'Reads your GBP and starts working immediately' },
                { icon: '📸', label: 'Uses your real photos', desc: 'Matches job photos to local search queries automatically' },
                { icon: '📅', label: 'Never misses a week', desc: 'Publishes up to 4× per week — within Google\'s limits' },
                { icon: '📲', label: 'Keeps you in the loop', desc: 'Weekly WhatsApp recap of everything published' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl p-4 flex flex-col gap-1.5"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <span className="text-xl">{item.icon}</span>
                  <p className="text-sm font-bold">{item.label}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────── */}
      <section id="how" className="relative px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-widest mb-3" style={{ color: 'var(--accent)' }}>HOW IT WORKS</p>
            <h2 className="text-4xl font-extrabold">Three steps. Runs itself after that.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="rounded-2xl p-7 flex flex-col gap-4 transition-all cursor-default"
                style={glass}
                onMouseEnter={(e) => { e.currentTarget.style.border = '1px solid rgba(79,142,247,0.3)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'; }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{s.icon}</span>
                  <span className="text-xs font-bold tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>{s.n}</span>
                </div>
                <h3 className="text-base font-bold">{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Compliance & Trust ──────────────────────────────────────── */}
      <section className="relative px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <div
            className="rounded-2xl px-8 py-10 flex flex-col gap-4"
            style={{
              background: 'rgba(52,211,153,0.04)',
              border: '1px solid rgba(52,211,153,0.15)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span style={{ color: 'var(--success)', fontSize: 18 }}>🔒</span>
              <p className="text-xs font-bold tracking-widest" style={{ color: 'var(--success)' }}>GOOGLE API COMPLIANCE</p>
            </div>
            <h2 className="text-2xl font-extrabold">Your data. Your control.</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              HayVista uses the Google Business Profile API in strict accordance with the{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent)', textDecoration: 'underline' }}
              >
                Google API Services User Data Policy
              </a>
              , including all Limited Use requirements. We access your Business Profile only to suggest and publish content on your behalf — nothing else.
            </p>
            <ul className="flex flex-col gap-2 mt-1">
              {[
                'We never sell or share your Google data with third parties',
                'OAuth access can be revoked at any time from your Google Account settings',
                'You can review, pause, or disconnect your profile at any time',
                'All content is suggested by AI and published according to your chosen schedule',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm" style={{ color: 'rgba(240,244,255,0.75)' }}>
                  <span style={{ color: 'var(--success)', marginTop: 2, flexShrink: 0 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────── */}
      <section className="relative px-6 py-24">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-widest mb-3" style={{ color: 'var(--accent)' }}>PRICING</p>
            <h2 className="text-4xl font-extrabold">Simple pricing. No surprises.</h2>
            <p className="text-base mt-3" style={{ color: 'var(--text-muted)' }}>
              One plan. Every feature. Less than a meal out.
            </p>
          </div>

          {/* Single plan card */}
          <div
            className="rounded-2xl p-10 flex flex-col gap-6 relative"
            style={{
              background: 'linear-gradient(145deg, rgba(79,142,247,0.16), rgba(124,90,247,0.12))',
              border: '1px solid rgba(79,142,247,0.4)',
              boxShadow: '0 0 60px rgba(79,142,247,0.15), inset 0 1px 0 rgba(255,255,255,0.12)',
            }}
          >
            <span
              className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              Everything included
            </span>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--accent)' }}>Starter Plan</p>
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-extrabold">$17</span>
                  <span className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>/month</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold" style={{ color: 'rgba(240,244,255,0.45)' }}>capped at</p>
                <p className="text-2xl font-extrabold" style={{ color: '#a5c4fd' }}>4×</p>
                <p className="text-xs" style={{ color: 'rgba(240,244,255,0.45)' }}>posts / week</p>
              </div>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: 'rgba(240,244,255,0.5)', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
              Posts are capped at 4 per week to respect Google's publishing guidelines and keep your profile healthy — no spam, no penalties.
            </p>

            <ul className="flex flex-col gap-3">
              {PLAN_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm" style={{ color: 'rgba(240,244,255,0.82)' }}>
                  <span style={{ color: 'var(--success)', flexShrink: 0 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-4 rounded-xl text-base font-bold transition-all"
              style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 0 30px rgba(79,142,247,0.35)' }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              Hire HayVista — Get Started Free
            </button>
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────── */}
      <section className="relative px-6 py-28 text-center">
        <div
          className="max-w-3xl mx-auto rounded-3xl px-8 py-20 flex flex-col items-center gap-6"
          style={{
            background: 'linear-gradient(135deg, rgba(79,142,247,0.10), rgba(124,90,247,0.08))',
            border: '1px solid rgba(79,142,247,0.2)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 0 80px rgba(79,142,247,0.10)',
          }}
        >
          <h2 className="text-4xl md:text-5xl font-extrabold leading-tight max-w-lg">
            Your most important hire costs $17 a month.
          </h2>
          <p className="text-base max-w-md" style={{ color: 'var(--text-muted)' }}>
            No résumé. No interview. No training. HayVista shows up every week, knows your business, and keeps you visible where your next customer is searching.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-base font-bold px-10 py-4 rounded-xl transition-all"
            style={{ background: 'linear-gradient(135deg, #4f8ef7, #7c5af7)', color: '#fff', boxShadow: '0 0 40px rgba(79,142,247,0.35)' }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 60px rgba(79,142,247,0.5)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 40px rgba(79,142,247,0.35)'; }}
          >
            Make the Hire — Free to Start
          </button>
        </div>
      </section>

      </main>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer
        className="px-8 md:px-16 py-8"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-bold text-lg">HayVista</span>
          <div className="flex flex-col items-center md:items-end gap-1">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              HayVista Inc. · Cabo San Lucas, BCS, Mexico ·{' '}
              <a href="mailto:support@hayvista.com" style={{ color: 'var(--accent)' }}>support@hayvista.com</a>
            </span>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              © 2026 HayVista. AI-assisted GBP content management for local businesses.
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          <a href="/privacy" style={{ color: 'rgba(255,255,255,0.45)' }} className="hover:underline">Privacy Policy</a>
          <a href="/terms" style={{ color: 'rgba(255,255,255,0.45)' }} className="hover:underline">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
}
