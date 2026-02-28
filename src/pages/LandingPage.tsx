import { useNavigate } from 'react-router-dom';

const STEPS = [
  {
    n: '01',
    icon: '🔗',
    title: 'Connect your Google account',
    desc: 'One login with Google. We get read access to your photos and search data. You never share a password.',
  },
  {
    n: '02',
    icon: '🧠',
    title: 'We match photos to searches',
    desc: 'Claude reads your photos and your real local search data to find the best match — then writes a post that answers what people are already looking for.',
  },
  {
    n: '03',
    icon: '🚀',
    title: 'Posts go live automatically',
    desc: 'Your GBP gets fresh posts on your schedule — 1 to 4 times a week. You get a WhatsApp update showing what went up.',
  },
];

const PLANS = [
  {
    name: 'Starter',
    price: '$79',
    freq: '1 post / week',
    highlight: false,
    features: ['Photo + search matching', 'Auto-posting to GBP', 'Weekly WhatsApp update', 'Cancel anytime'],
  },
  {
    name: 'Growth',
    price: '$149',
    freq: '2 posts / week',
    highlight: true,
    features: ['Everything in Starter', '2× the GBP visibility', 'Priority support', 'Cancel anytime'],
  },
  {
    name: 'Pro',
    price: '$199',
    freq: 'Up to 4 posts / week',
    highlight: false,
    features: ['Everything in Growth', 'Maximum GBP activity', 'Fastest ranking results', 'Cancel anytime'],
  },
];

const STATS = [
  { value: '4×', label: 'more GBP visibility' },
  { value: '2 min', label: 'setup time' },
  { value: '0', label: 'posts written by you' },
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
          <img src="/rankylogo.png" alt="Ranky" style={{ width: 56, height: 56, objectFit: 'contain', flexShrink: 0 }} />
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/signup')}
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
          AUTOMATED GBP POSTING
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight max-w-4xl mb-6">
          Your Google Business Profile{' '}
          <span style={{ background: 'linear-gradient(90deg, #4f8ef7, #7c5af7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            posts itself.
          </span>
        </h1>

        <p className="text-lg md:text-xl max-w-xl leading-relaxed mb-10" style={{ color: 'var(--text-muted)' }}>
          We use your real job photos and what locals are already searching for to write and post to your GBP every week. Automatically.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => navigate('/signup')}
            className="text-base font-bold px-8 py-4 rounded-xl transition-all"
            style={{ background: 'linear-gradient(135deg, #4f8ef7, #7c5af7)', color: '#fff', boxShadow: '0 0 40px rgba(79,142,247,0.35)' }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 60px rgba(79,142,247,0.5)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 40px rgba(79,142,247,0.35)'; }}
          >
            Get Started Free
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

      {/* ── How it works ────────────────────────────────────────────── */}
      <section id="how" className="relative px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-widest mb-3" style={{ color: 'var(--accent)' }}>HOW IT WORKS</p>
            <h2 className="text-4xl font-extrabold">Three steps. Zero effort after setup.</h2>
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

      {/* ── Pricing ─────────────────────────────────────────────────── */}
      <section className="relative px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-widest mb-3" style={{ color: 'var(--accent)' }}>PRICING</p>
            <h2 className="text-4xl font-extrabold">Simple pricing. No surprises.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className="rounded-2xl p-8 flex flex-col gap-5 relative"
                style={p.highlight ? {
                  background: 'linear-gradient(145deg, rgba(79,142,247,0.16), rgba(124,90,247,0.12))',
                  border: '1px solid rgba(79,142,247,0.4)',
                  boxShadow: '0 0 60px rgba(79,142,247,0.15), inset 0 1px 0 rgba(255,255,255,0.12)',
                } : glass}
              >
                {p.highlight && (
                  <span
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full"
                    style={{ background: 'var(--accent)', color: '#fff' }}
                  >
                    Most Popular
                  </span>
                )}
                <p className="text-sm font-semibold" style={{ color: p.highlight ? 'var(--accent)' : 'var(--text-muted)' }}>{p.name}</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-extrabold">{p.price}</span>
                  <span className="text-sm mb-1.5" style={{ color: 'var(--text-muted)' }}>/mo</span>
                </div>
                <p className="text-sm font-semibold" style={{ color: p.highlight ? '#a5c4fd' : 'rgba(240,244,255,0.55)' }}>{p.freq}</p>
                <ul className="flex flex-col gap-2 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(240,244,255,0.7)' }}>
                      <span style={{ color: 'var(--success)' }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/signup')}
                  className="w-full py-3 rounded-xl text-sm font-semibold transition-all mt-2"
                  style={p.highlight
                    ? { background: 'var(--accent)', color: '#fff' }
                    : { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', color: 'var(--text)' }
                  }
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                >
                  Get Started
                </button>
              </div>
            ))}
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
            Start showing up where your customers are searching.
          </h2>
          <p className="text-base" style={{ color: 'var(--text-muted)' }}>
            Login with Google once. Posts go up every week.
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="text-base font-bold px-10 py-4 rounded-xl transition-all"
            style={{ background: 'linear-gradient(135deg, #4f8ef7, #7c5af7)', color: '#fff', boxShadow: '0 0 40px rgba(79,142,247,0.35)' }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 60px rgba(79,142,247,0.5)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 40px rgba(79,142,247,0.35)'; }}
          >
            Connect My Google Profile — Free
          </button>
        </div>
      </section>

      </main>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer
        className="flex items-center justify-between px-8 md:px-16 h-[64px]"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span className="font-bold text-lg">Ranky</span>
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>© 2026 Ranky. Automated GBP posting for local businesses.</span>
      </footer>
    </div>
  );
}
