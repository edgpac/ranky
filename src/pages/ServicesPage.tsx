import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { services } from '../translations/services';

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

export default function ServicesPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = services[language];

  useEffect(() => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'HayVista Services',
      description: 'Software development, GBP automation, and AI education services by HayVista Inc.',
      url: 'https://hayvista.com/services',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          item: {
            '@type': 'Service',
            name: 'Google Business Profile Automation',
            description: 'Three AI engines run in parallel — posts 3×/week, review replies, and Q&A answers — all drafted by Claude and held in a 24-hour review window before going live.',
            provider: { '@type': 'Organization', name: 'HayVista', url: 'https://hayvista.com' },
            offers: { '@type': 'Offer', price: '17.00', priceCurrency: 'USD', description: 'Monthly subscription — no contracts, cancel anytime' },
            url: 'https://hayvista.com/signup',
          },
        },
        {
          '@type': 'ListItem',
          position: 2,
          item: {
            '@type': 'Service',
            name: 'Software & Consulting',
            description: 'Web and mobile application development, cloud infrastructure, platform consulting, and IT guidance for businesses.',
            provider: { '@type': 'Organization', name: 'HayVista', url: 'https://hayvista.com' },
            url: 'https://hayvista.com/services',
          },
        },
        {
          '@type': 'ListItem',
          position: 3,
          item: {
            '@type': 'Course',
            name: 'Vibe Coding — Build Real Software with Claude Code',
            description: 'Learn to build real software with Claude Code. From idea to deployed product. No prior coding experience required. Focused on local business automation.',
            provider: { '@type': 'Organization', name: 'HayVista', url: 'https://hayvista.com' },
            url: 'https://wa.me/526121698328',
            courseMode: 'online',
            inLanguage: ['en', 'es'],
          },
        },
      ],
    };
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = 'services-schema';
    el.textContent = JSON.stringify(schema);
    document.head.appendChild(el);
    return () => { document.getElementById('services-schema')?.remove(); };
  }, []);

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
        style={{ background: 'rgba(8,13,26,0.80)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <a href="/">
          <img src="/hayvista-logo.png" alt="HayVista" style={{ width: 80, height: 80, objectFit: 'contain' }} />
        </a>
        <div className="flex items-center gap-2 sm:gap-3">
          <LangToggle />
          <button
            onClick={() => navigate('/dashboard')}
            className="font-semibold rounded-xl transition-all whitespace-nowrap"
            style={{ height: '2.1em', fontSize: 15, paddingLeft: '1.1em', paddingRight: '1.1em', background: 'var(--accent)', color: '#fff' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            {t.nav.cta}
          </button>
        </div>
      </nav>

      <main>

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section className="relative flex flex-col items-center text-center px-4 sm:px-6 pt-20 sm:pt-28 pb-16 sm:pb-24">
          <div
            className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full mb-6 sm:mb-8 text-[10px] sm:text-xs font-semibold tracking-widest"
            style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', color: 'var(--success)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            {t.hero.badge}
          </div>

          <h1 className="flex flex-col items-center text-4xl sm:text-5xl md:text-7xl font-extrabold leading-tight max-w-4xl mb-5 sm:mb-6">
            <span>{t.hero.h1a}</span>
            <span
              style={{
                background: 'linear-gradient(90deg, #34d399, #4f8ef7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {t.hero.h1b}
            </span>
          </h1>

          <p className="text-base sm:text-lg max-w-xl leading-relaxed mb-8 sm:mb-10" style={{ color: 'var(--text-muted)' }}>
            {t.hero.sub}
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            {t.hero.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(79,142,247,0.10)', border: '1px solid rgba(79,142,247,0.22)', color: '#4f8ef7' }}
              >
                {tag}
              </span>
            ))}
          </div>
        </section>

        {/* ── Software & Consulting ──────────────────────────────────── */}
        <section className="relative px-4 sm:px-6 py-12 sm:py-16">
          <div className="max-w-5xl mx-auto">
            <div className="mb-10">
              <p className="text-[10px] sm:text-xs font-bold tracking-widest mb-3" style={{ color: 'var(--accent)' }}>{t.software.label}</p>
              <h2 className="text-2xl sm:text-4xl font-extrabold leading-snug mb-3" style={{ whiteSpace: 'pre-line' }}>{t.software.h2}</h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t.software.sub}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {t.software.cards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl p-5 flex flex-col gap-2 transition-all"
                  style={glass}
                  onMouseEnter={(e) => { e.currentTarget.style.border = '1px solid rgba(79,142,247,0.30)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'; }}
                >
                  <span className="text-2xl">{card.icon}</span>
                  <p className="text-sm font-bold">{card.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── GBP Automation ────────────────────────────────────────── */}
        <section className="relative px-4 sm:px-6 py-12 sm:py-16">
          <div className="max-w-5xl mx-auto">
            <div className="mb-10">
              <p className="text-[10px] sm:text-xs font-bold tracking-widest mb-3" style={{ color: '#34d399' }}>{t.gbp.label}</p>
              <h2 className="text-2xl sm:text-4xl font-extrabold mb-3">{t.gbp.h2}</h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t.gbp.sub}</p>
            </div>

            {/* Featured product card */}
            <div
              className="rounded-2xl p-6 sm:p-8 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
              style={{
                background: 'linear-gradient(135deg, rgba(52,211,153,0.07), rgba(79,142,247,0.05))',
                border: '1px solid rgba(52,211,153,0.25)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div className="flex flex-col gap-2 flex-1">
                <span
                  className="self-start text-[9px] font-bold tracking-widest px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}
                >
                  {t.gbp.featuredBadge}
                </span>
                <p className="text-base sm:text-lg font-extrabold">{t.gbp.featuredTitle}</p>
                <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{t.gbp.featuredDesc}</p>
              </div>
              <a
                href="/dashboard"
                className="shrink-0 font-bold rounded-xl px-5 py-2.5 text-sm whitespace-nowrap"
                style={{
                  background: 'linear-gradient(135deg, #4f8ef7, #7c5af7)',
                  color: '#fff',
                  textDecoration: 'none',
                  boxShadow: '0 0 24px rgba(79,142,247,0.3)',
                }}
              >
                {t.gbp.featuredCta}
              </a>
            </div>

            {/* Sub-cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {t.gbp.cards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl p-5 flex flex-col gap-2 transition-all"
                  style={glass}
                  onMouseEnter={(e) => { e.currentTarget.style.border = '1px solid rgba(52,211,153,0.25)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'; }}
                >
                  <span className="text-2xl">{card.icon}</span>
                  <p className="text-sm font-bold">{card.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Vibe Coding ───────────────────────────────────────────── */}
        <section className="relative px-4 sm:px-6 py-12 sm:py-20">
          <div className="max-w-5xl mx-auto">
            <div className="mb-10">
              <p className="text-[10px] sm:text-xs font-bold tracking-widest mb-3" style={{ color: '#7c5af7' }}>{t.vibe.label}</p>
              <h2 className="text-2xl sm:text-4xl font-extrabold mb-3">
                {t.vibe.h2a}{' '}
                <span style={{ background: 'linear-gradient(90deg, #7c5af7, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {t.vibe.h2b}
                </span>
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t.vibe.sub}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bullet points */}
              <div className="flex flex-col gap-4">
                <ul className="flex flex-col gap-3">
                  {t.vibe.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3">
                      <span style={{ color: '#34d399', flexShrink: 0, marginTop: 2 }}>✓</span>
                      <span className="text-sm leading-relaxed" style={{ color: 'rgba(240,244,255,0.80)' }}>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="https://wa.me/526121698328"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="self-start font-bold rounded-xl px-6 py-3 text-sm mt-2"
                  style={{
                    background: 'linear-gradient(135deg, #25d366, #128c7e)',
                    color: '#fff',
                    textDecoration: 'none',
                    boxShadow: '0 0 24px rgba(37,211,102,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {t.vibe.cta}
                </a>
              </div>

              {/* Terminal card */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: '#0a0f1e', border: '1px solid rgba(124,90,247,0.25)', boxShadow: '0 0 40px rgba(124,90,247,0.12)' }}
              >
                {/* Terminal title bar */}
                <div
                  className="flex items-center gap-2 px-4 py-2.5"
                  style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444' }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#f59e0b' }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#22c55e' }} />
                  <span className="text-[11px] font-mono ml-2" style={{ color: 'rgba(255,255,255,0.3)' }}>vibe-coding — chat</span>
                </div>
                {/* Terminal body */}
                <div className="p-5 flex flex-col gap-3">
                  {t.vibe.terminal.map((line, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span
                        className="text-xs font-mono flex-shrink-0 mt-0.5"
                        style={{ color: line.prompt ? '#7c5af7' : '#34d399' }}
                      >
                        {line.prompt ? '>' : '$'}
                      </span>
                      <span
                        className="text-xs sm:text-sm font-mono leading-relaxed"
                        style={{ color: line.prompt ? 'rgba(240,244,255,0.70)' : 'rgba(52,211,153,0.90)' }}
                      >
                        {line.text}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs font-mono" style={{ color: '#7c5af7' }}>{'>'}</span>
                    <span className="w-2 h-4 animate-pulse" style={{ background: '#7c5af7', borderRadius: 1 }} />
                  </div>
                </div>
              </div>
            </div>
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
              <a href="mailto:hayvista@gmail.com" style={{ color: 'var(--accent)' }}>hayvista@gmail.com</a>
            </span>
            <span className="text-xs text-center md:text-right" style={{ color: 'rgba(255,255,255,0.3)' }}>{t.footer.copyright}</span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4 text-xs">
          <a href="/privacy" style={{ color: 'rgba(255,255,255,0.45)' }} className="hover:underline">{t.footer.privacy}</a>
          <a href="/terms" style={{ color: 'rgba(255,255,255,0.45)' }} className="hover:underline">{t.footer.terms}</a>
          <a href="/faq" style={{ color: 'rgba(255,255,255,0.45)' }} className="hover:underline">{t.footer.faq}</a>
          <a href="/about" style={{ color: 'rgba(255,255,255,0.45)' }} className="hover:underline">{t.footer.about}</a>
          <a href="/services" style={{ color: 'rgba(255,255,255,0.45)' }} className="hover:underline">{t.footer.services}</a>
        </div>
      </footer>
    </div>
  );
}
