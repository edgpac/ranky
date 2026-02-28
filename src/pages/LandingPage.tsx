import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { landing } from '../translations/landing';

const glass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(8px)',
  boxShadow: '0 4px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.07)',
};

function LangToggle() {
  const { language, setLanguage } = useLanguage();
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
      aria-label={language === 'en' ? 'Switch to Spanish' : 'Switch to English'}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: '4rem',
        borderRadius: '30em',
        padding: '0.25rem 0',
        fontSize: '0.8125rem',
        fontWeight: 700,
        border: '1px solid rgba(79,142,247,0.4)',
        cursor: 'pointer',
        background: hovered ? 'linear-gradient(135deg, #4f8ef7, #7c5af7)' : 'transparent',
        color: hovered ? '#fff' : '#4f8ef7',
        transition: 'background 0.3s ease, color 0.3s ease',
        letterSpacing: '0.05em',
      }}
    >
      {language === 'en' ? 'ES' : 'EN'}
    </button>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = landing[language];
  const [pricingOpen, setPricingOpen] = useState(false);

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
        style={{ background: 'rgba(8,13,26,0.75)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'relative' }}
      >
        <div className="flex items-center gap-2.5">
          <img src="/hayvista-logo.png" alt="HayVista" style={{ width: 80, height: 80, objectFit: 'contain', flexShrink: 0 }} />
        </div>
        <div className="flex items-center gap-3">
          <LangToggle />
          <button
            onClick={() => setPricingOpen((v) => !v)}
            className="text-sm font-medium px-4 py-2 rounded-xl transition-all"
            style={{
              background: pricingOpen ? 'rgba(79,142,247,0.12)' : 'transparent',
              border: `1px solid ${pricingOpen ? 'rgba(79,142,247,0.35)' : 'rgba(255,255,255,0.10)'}`,
              color: pricingOpen ? '#4f8ef7' : 'rgba(240,244,255,0.65)',
            }}
          >
            {t.nav.pricing}
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
            style={{ background: 'var(--accent)', color: '#fff' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            {t.nav.cta}
          </button>
        </div>

        {/* Pricing dropdown */}
        {pricingOpen && (
          <>
            <div className="fixed inset-0" style={{ zIndex: 40 }} onClick={() => setPricingOpen(false)} />
            <div
              className="absolute right-8 top-[calc(100%+8px)] w-[380px] rounded-2xl p-8 flex flex-col gap-5"
              style={{
                zIndex: 50,
                background: 'linear-gradient(145deg, rgba(10,16,35,0.98), rgba(14,20,42,0.98))',
                border: '1px solid rgba(79,142,247,0.4)',
                boxShadow: '0 0 60px rgba(79,142,247,0.18), 0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
                backdropFilter: 'blur(24px)',
              }}
            >
              <div className="text-center mb-1">
                <p className="text-xs font-bold tracking-widest mb-1" style={{ color: 'var(--accent)' }}>{t.pricing.label}</p>
                <h3 className="text-lg font-extrabold">{t.pricing.h3}</h3>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{t.pricing.sub}</p>
              </div>

              <span className="self-center text-xs font-bold px-4 py-1 rounded-full" style={{ background: 'var(--accent)', color: '#fff' }}>
                {t.pricing.badge}
              </span>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--accent)' }}>{t.pricing.planName}</p>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold">$17</span>
                    <span className="text-sm mb-1.5" style={{ color: 'var(--text-muted)' }}>{t.pricing.perMonth}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: 'rgba(240,244,255,0.45)' }}>{t.pricing.cappedAt}</p>
                  <p className="text-2xl font-extrabold" style={{ color: '#a5c4fd' }}>4×</p>
                  <p className="text-xs" style={{ color: 'rgba(240,244,255,0.45)' }}>{t.pricing.postsWeek}</p>
                </div>
              </div>

              <p className="text-xs leading-relaxed" style={{ color: 'rgba(240,244,255,0.45)', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '0.75rem' }}>
                {t.pricing.disclaimer}
              </p>

              <ul className="flex flex-col gap-2">
                {t.pricing.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(240,244,255,0.8)' }}>
                    <span style={{ color: 'var(--success)', flexShrink: 0 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => { setPricingOpen(false); navigate('/dashboard'); }}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all"
                style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 0 24px rgba(79,142,247,0.3)' }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                {t.pricing.cta}
              </button>
            </div>
          </>
        )}
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
          {t.badge}
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight max-w-4xl mb-6">
          {t.hero.h1a}{' '}
          <span style={{ background: 'linear-gradient(90deg, #4f8ef7, #7c5af7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {t.hero.h1b}
          </span>
        </h1>

        <p className="text-lg md:text-xl max-w-2xl leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
          {t.hero.sub1}
        </p>
        <p className="text-lg md:text-xl max-w-2xl leading-relaxed mb-10" style={{ color: 'var(--text-muted)' }}>
          {t.hero.sub2}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-base font-bold px-8 py-4 rounded-xl transition-all"
            style={{ background: 'linear-gradient(135deg, #4f8ef7, #7c5af7)', color: '#fff', boxShadow: '0 0 40px rgba(79,142,247,0.35)' }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 60px rgba(79,142,247,0.5)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 40px rgba(79,142,247,0.35)'; }}
          >
            {t.hero.cta}
          </button>
        </div>

        {/* Stats */}
        <div className="mt-20 flex flex-wrap justify-center gap-12">
          {t.stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-extrabold" style={{ color: 'var(--accent)' }}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why HayVista Works ──────────────────────────────────────── */}
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
            <p className="text-xs font-bold tracking-widest" style={{ color: 'var(--accent)' }}>{t.why.label}</p>
            <h2 className="text-2xl font-extrabold leading-snug" style={{ whiteSpace: 'pre-line' }}>
              {t.why.h2}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {t.why.body}
            </p>
            <div className="grid grid-cols-2 gap-4 mt-2">
              {t.why.tiles.map((item) => (
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
            <p className="text-xs font-bold tracking-widest mb-3" style={{ color: 'var(--accent)' }}>{t.how.label}</p>
            <h2 className="text-4xl font-extrabold">{t.how.h2}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {t.how.steps.map((s) => (
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
              <p className="text-xs font-bold tracking-widest" style={{ color: 'var(--success)' }}>{t.compliance.label}</p>
            </div>
            <h2 className="text-2xl font-extrabold">{t.compliance.h2}</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {language === 'en' ? (
                <>
                  HayVista uses the Google Business Profile API in strict accordance with the{' '}
                  <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
                    {t.compliance.linkText}
                  </a>
                  , including all Limited Use requirements. We access your Business Profile only to suggest and publish content on your behalf — nothing else.
                </>
              ) : (
                <>
                  HayVista utiliza la API de Perfil de Negocio de Google en estricta conformidad con la{' '}
                  <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
                    {t.compliance.linkText}
                  </a>
                  , incluidos todos los requisitos de Uso Limitado. Accedemos a tu Perfil de Negocio solo para sugerir y publicar contenido en tu nombre — nada más.
                </>
              )}
            </p>
            <ul className="flex flex-col gap-2 mt-1">
              {t.compliance.bullets.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm" style={{ color: 'rgba(240,244,255,0.75)' }}>
                  <span style={{ color: 'var(--success)', marginTop: 2, flexShrink: 0 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
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
            {t.finalCta.h2}
          </h2>
          <p className="text-base max-w-md" style={{ color: 'var(--text-muted)' }}>
            {t.finalCta.body}
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-base font-bold px-10 py-4 rounded-xl transition-all"
            style={{ background: 'linear-gradient(135deg, #4f8ef7, #7c5af7)', color: '#fff', boxShadow: '0 0 40px rgba(79,142,247,0.35)' }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 60px rgba(79,142,247,0.5)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 40px rgba(79,142,247,0.35)'; }}
          >
            {t.finalCta.cta}
          </button>
        </div>
      </section>

      </main>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="px-8 md:px-16 py-8" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-bold text-lg">HayVista</span>
          <div className="flex flex-col items-center md:items-end gap-1">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {t.footer.address} ·{' '}
              <a href="mailto:support@hayvista.com" style={{ color: 'var(--accent)' }}>support@hayvista.com</a>
            </span>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{t.footer.copyright}</span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4 text-xs">
          <a href="/privacy" style={{ color: 'rgba(255,255,255,0.45)' }} className="hover:underline">{t.footer.privacy}</a>
          <a href="/terms" style={{ color: 'rgba(255,255,255,0.45)' }} className="hover:underline">{t.footer.terms}</a>
        </div>
      </footer>
    </div>
  );
}
