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
  return (
    <button
      className="lang-toggle-btn"
      onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
      aria-label={language === 'en' ? 'Switch to Spanish' : 'Switch to English'}
    >
      {language === 'en' ? 'ES' : 'EN'}
    </button>
  );
}

const PRICE_ID = import.meta.env.VITE_STRIPE_PRICE_ID as string | undefined;
const API = import.meta.env.VITE_API_URL ?? '';

async function startCheckout(navigate: ReturnType<typeof useNavigate>) {
  if (!PRICE_ID) { navigate('/signup'); return; }
  try {
    const res = await fetch(`${API}/api/stripe/create-checkout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId: PRICE_ID }),
    });
    if (res.status === 401) { navigate('/signup'); return; }
    const { url } = await res.json();
    window.location.href = url;
  } catch {
    navigate('/signup');
  }
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = landing[language];
  const [pricingOpen, setPricingOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  async function handleCheckout() {
    setCheckoutLoading(true);
    await startCheckout(navigate);
    setCheckoutLoading(false);
  }

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {/* ── Ambient orbs ─────────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div style={{ position: 'absolute', top: '-8%', left: '15%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,142,247,0.11) 0%, transparent 65%)', filter: 'blur(48px)' }} />
        <div style={{ position: 'absolute', top: '35%', right: '-8%', width: 550, height: 550, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,90,247,0.09) 0%, transparent 65%)', filter: 'blur(48px)' }} />
        <div style={{ position: 'absolute', bottom: '5%', left: '5%', width: 450, height: 450, borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.07) 0%, transparent 65%)', filter: 'blur(48px)' }} />
      </div>

      {/* ── Navbar ──────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8 md:px-16 h-[64px] sm:h-[68px]"
        style={{ background: 'rgba(8,13,26,0.80)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'relative' }}
      >
        <img
          src="/hayvista-logo.png"
          alt="HayVista"
          style={{ width: 56, height: 56, objectFit: 'contain', flexShrink: 0 }}
          className="sm:w-[72px] sm:h-[72px]"
        />

        <div className="flex items-center gap-2 sm:gap-3">
          <LangToggle />
          <button
            onClick={() => setPricingOpen((v) => !v)}
            className="font-medium rounded-xl transition-all"
            style={{
              height: '2.1em',
              fontSize: 15,
              paddingLeft: '1em',
              paddingRight: '1em',
              background: pricingOpen ? 'rgba(79,142,247,0.12)' : 'transparent',
              border: `1px solid ${pricingOpen ? 'rgba(79,142,247,0.35)' : 'rgba(255,255,255,0.10)'}`,
              color: pricingOpen ? '#4f8ef7' : 'rgba(240,244,255,0.65)',
            }}
          >
            {t.nav.pricing}
          </button>
          <button
            onClick={handleCheckout}
            disabled={checkoutLoading}
            className="font-semibold rounded-xl transition-all"
            style={{ height: '2.1em', fontSize: 15, paddingLeft: '1.1em', paddingRight: '1.1em', background: 'var(--accent)', color: '#fff', opacity: checkoutLoading ? 0.65 : 1 }}
            onMouseEnter={(e) => { if (!checkoutLoading) e.currentTarget.style.opacity = '0.85'; }}
            onMouseLeave={(e) => { if (!checkoutLoading) e.currentTarget.style.opacity = '1'; }}
          >
            {checkoutLoading ? '…' : t.nav.cta}
          </button>
        </div>

        {/* ── Pricing panel — dropdown on desktop, fixed overlay on mobile ── */}
        {pricingOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0"
              style={{ zIndex: 40, background: 'rgba(0,0,0,0.5)' }}
              onClick={() => setPricingOpen(false)}
            />

            {/* Card — full-screen on mobile, right-anchored dropdown on md+ */}
            <div
              className="
                fixed inset-x-3 top-[72px] bottom-3
                md:absolute md:inset-auto md:right-4 md:top-[calc(100%+8px)] md:bottom-auto md:w-[460px]
                rounded-2xl overflow-y-auto flex flex-col gap-0
              "
              style={{
                zIndex: 50,
                background: 'linear-gradient(160deg, rgba(8,14,32,0.97) 0%, rgba(12,18,40,0.97) 100%)',
                border: '1px solid rgba(79,142,247,0.45)',
                boxShadow: '0 0 0 1px rgba(124,90,247,0.15), 0 0 60px rgba(79,142,247,0.22), 0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.09)',
                backdropFilter: 'blur(32px)',
              }}
            >
              {/* Glass specular top edge */}
              <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)', flexShrink: 0 }} />

              <div className="p-6 sm:p-7 flex flex-col gap-5">
                {/* Header */}
                <div className="text-center">
                  <p className="text-[10px] font-bold tracking-[0.15em] mb-1.5" style={{ color: 'var(--accent)' }}>{t.pricing.label}</p>
                  <h3 className="text-xl font-extrabold">{t.pricing.h3}</h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{t.pricing.sub}</p>
                </div>

                {/* Value comparison banner */}
                <div
                  className="rounded-xl px-4 py-3 flex items-center justify-between"
                  style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.18)' }}
                >
                  <div>
                    <p className="text-[10px] font-semibold" style={{ color: 'rgba(240,244,255,0.4)' }}>{t.pricing.valueLabel}</p>
                    <p className="text-sm font-bold line-through" style={{ color: 'rgba(239,68,68,0.7)' }}>{t.pricing.valueCrossed}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold" style={{ color: 'rgba(240,244,255,0.4)' }}>{t.pricing.valueYours}</p>
                    <div className="flex items-end gap-0.5">
                      <span className="text-3xl font-extrabold" style={{ color: '#34d399', lineHeight: 1 }}>$17</span>
                      <span className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{t.pricing.perMonth}</span>
                    </div>
                  </div>
                </div>

                {/* Cap note */}
                <p className="text-[11px] leading-relaxed text-center" style={{ color: 'rgba(240,244,255,0.4)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0.6rem 0' }}>
                  {t.pricing.cappedNote}
                </p>

                {/* Feature groups */}
                <div className="flex flex-col gap-4">
                  {t.pricing.groups.map((group) => (
                    <div key={group.title}>
                      <p className="text-[9px] font-bold tracking-[0.14em] mb-2" style={{ color: 'rgba(79,142,247,0.7)' }}>{group.title}</p>
                      <ul className="flex flex-col gap-1.5">
                        {group.items.map((item) => (
                          <li key={item.text} className="flex items-start gap-2.5 text-sm" style={{ color: 'rgba(240,244,255,0.82)' }}>
                            <span style={{ flexShrink: 0, fontSize: '1rem' }}>{item.icon}</span>
                            <span style={{ lineHeight: 1.45 }}>{item.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  onClick={() => { setPricingOpen(false); handleCheckout(); }}
                  disabled={checkoutLoading}
                  className="w-full py-3.5 rounded-xl text-sm font-bold transition-all mt-1"
                  style={{
                    background: 'linear-gradient(135deg, #4f8ef7, #7c5af7)',
                    color: '#fff',
                    boxShadow: '0 0 32px rgba(79,142,247,0.4), 0 0 64px rgba(124,90,247,0.2)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    opacity: checkoutLoading ? 0.65 : 1,
                  }}
                  onMouseEnter={(e) => { if (!checkoutLoading) e.currentTarget.style.opacity = '0.88'; }}
                  onMouseLeave={(e) => { if (!checkoutLoading) e.currentTarget.style.opacity = '1'; }}
                >
                  {checkoutLoading ? 'Redirecting…' : t.pricing.cta}
                </button>
              </div>
            </div>
          </>
        )}
      </nav>

      {/* ── Main content ─────────────────────────────────────────── */}
      <main>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center text-center px-4 sm:px-6 pt-20 sm:pt-28 pb-16 sm:pb-24">
        <div
          className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full mb-6 sm:mb-8 text-[10px] sm:text-xs font-semibold tracking-widest"
          style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', color: 'var(--success)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          {t.badge}
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-tight max-w-4xl mb-5 sm:mb-6">
          {t.hero.h1a}{' '}
          <span style={{ background: 'linear-gradient(90deg, #4f8ef7, #7c5af7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {t.hero.h1b}
          </span>
        </h1>

        <p className="text-base sm:text-lg md:text-xl max-w-2xl leading-relaxed mb-3" style={{ color: 'var(--text-muted)' }}>
          {t.hero.sub1}
        </p>
        <p className="text-base sm:text-lg md:text-xl max-w-2xl leading-relaxed mb-8 sm:mb-10" style={{ color: 'var(--text-muted)' }}>
          {t.hero.sub2}
        </p>

        <button
          onClick={handleCheckout}
          disabled={checkoutLoading}
          className="text-sm sm:text-base font-bold px-7 sm:px-8 py-3.5 sm:py-4 rounded-xl transition-all"
          style={{ background: 'linear-gradient(135deg, #4f8ef7, #7c5af7)', color: '#fff', boxShadow: '0 0 40px rgba(79,142,247,0.35)', opacity: checkoutLoading ? 0.65 : 1 }}
          onMouseEnter={(e) => { if (!checkoutLoading) e.currentTarget.style.boxShadow = '0 0 60px rgba(79,142,247,0.5)'; }}
          onMouseLeave={(e) => { if (!checkoutLoading) e.currentTarget.style.boxShadow = '0 0 40px rgba(79,142,247,0.35)'; }}
        >
          {checkoutLoading ? 'Redirecting…' : t.hero.cta}
        </button>

        {/* Stats */}
        <div className="mt-14 sm:mt-20 flex flex-wrap justify-center gap-8 sm:gap-12">
          {t.stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--accent)' }}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why HayVista Works ──────────────────────────────────────── */}
      <section className="relative px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto">
          <div
            className="rounded-2xl px-5 sm:px-8 py-8 sm:py-10 flex flex-col gap-5"
            style={{
              background: 'linear-gradient(135deg, rgba(79,142,247,0.07), rgba(124,90,247,0.05))',
              border: '1px solid rgba(79,142,247,0.18)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <p className="text-[10px] sm:text-xs font-bold tracking-widest" style={{ color: 'var(--accent)' }}>{t.why.label}</p>
            <h2 className="text-xl sm:text-2xl font-extrabold leading-snug" style={{ whiteSpace: 'pre-line' }}>
              {t.why.h2}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {t.why.body}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-1">
              {t.why.tiles.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl p-3 sm:p-4 flex flex-col gap-1.5"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <span className="text-xl">{item.icon}</span>
                  <p className="text-xs sm:text-sm font-bold">{item.label}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────── */}
      <section id="how" className="relative px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-[10px] sm:text-xs font-bold tracking-widest mb-3" style={{ color: 'var(--accent)' }}>{t.how.label}</p>
            <h2 className="text-2xl sm:text-4xl font-extrabold">{t.how.h2}</h2>
          </div>
          <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {t.how.steps.map((s) => (
              <div
                key={s.n}
                className="rounded-2xl p-5 sm:p-7 flex flex-col gap-3 sm:gap-4 transition-all cursor-default"
                style={glass}
                onMouseEnter={(e) => { e.currentTarget.style.border = '1px solid rgba(79,142,247,0.3)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'; }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{s.icon}</span>
                  <span className="text-xs font-bold tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>{s.n}</span>
                </div>
                <h3 className="text-sm sm:text-base font-bold">{s.title}</h3>
                <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Compliance & Trust ──────────────────────────────────────── */}
      <section className="relative px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto">
          <div
            className="rounded-2xl px-5 sm:px-8 py-8 sm:py-10 flex flex-col gap-4"
            style={{
              background: 'rgba(52,211,153,0.04)',
              border: '1px solid rgba(52,211,153,0.15)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span style={{ color: 'var(--success)', fontSize: 18 }}>🔒</span>
              <p className="text-[10px] sm:text-xs font-bold tracking-widest" style={{ color: 'var(--success)' }}>{t.compliance.label}</p>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold">{t.compliance.h2}</h2>
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
                <li key={item} className="flex items-start gap-2 text-xs sm:text-sm" style={{ color: 'rgba(240,244,255,0.75)' }}>
                  <span style={{ color: 'var(--success)', marginTop: 2, flexShrink: 0 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────── */}
      <section className="relative px-4 sm:px-6 py-20 sm:py-28 text-center">
        <div
          className="max-w-3xl mx-auto rounded-3xl px-6 sm:px-8 py-14 sm:py-20 flex flex-col items-center gap-5 sm:gap-6"
          style={{
            background: 'linear-gradient(135deg, rgba(79,142,247,0.10), rgba(124,90,247,0.08))',
            border: '1px solid rgba(79,142,247,0.2)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 0 80px rgba(79,142,247,0.10)',
          }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight max-w-lg">
            {t.finalCta.h2}
          </h2>
          <p className="text-sm sm:text-base max-w-md" style={{ color: 'var(--text-muted)' }}>
            {t.finalCta.body}
          </p>
          <button
            onClick={handleCheckout}
            disabled={checkoutLoading}
            className="text-sm sm:text-base font-bold px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl transition-all"
            style={{ background: 'linear-gradient(135deg, #4f8ef7, #7c5af7)', color: '#fff', boxShadow: '0 0 40px rgba(79,142,247,0.35)', opacity: checkoutLoading ? 0.65 : 1 }}
            onMouseEnter={(e) => { if (!checkoutLoading) e.currentTarget.style.boxShadow = '0 0 60px rgba(79,142,247,0.5)'; }}
            onMouseLeave={(e) => { if (!checkoutLoading) e.currentTarget.style.boxShadow = '0 0 40px rgba(79,142,247,0.35)'; }}
          >
            {checkoutLoading ? 'Redirecting…' : t.finalCta.cta}
          </button>
        </div>
      </section>

      </main>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="px-4 sm:px-8 md:px-16 py-8" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-bold text-lg">HayVista</span>
          <div className="flex flex-col items-center md:items-end gap-1">
            <span className="text-xs sm:text-sm text-center md:text-right" style={{ color: 'var(--text-muted)' }}>
              {t.footer.address} ·{' '}
              <a href="mailto:support@hayvista.com" style={{ color: 'var(--accent)' }}>support@hayvista.com</a>
            </span>
            <span className="text-xs text-center md:text-right" style={{ color: 'rgba(255,255,255,0.3)' }}>{t.footer.copyright}</span>
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
