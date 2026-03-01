import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppT } from '../contexts/LanguageContext';

const FREQ_OPTIONS = [1, 2, 3];
const TONE_OPTIONS = ['Friendly', 'Professional', 'Bilingual'];

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: 'var(--text)',
};

const STORAGE_KEY = 'hayvista_signup_form';

const defaultForm = {
  name: '',
  email: '',
  businessName: '',
  businessType: 'general',
  whatsapp: '',
  tone: 'Friendly',
  postsPerWeek: 3,
};

export default function SignupPage() {
  const navigate = useNavigate();
  const t = useAppT().signup;
  const [step, setStep] = useState<0 | 1>(0);
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [form, setForm] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...defaultForm, ...JSON.parse(saved) } : defaultForm;
    } catch {
      return defaultForm;
    }
  });
  const updateForm = (patch: Partial<typeof defaultForm>) => {
    setForm((prev: typeof defaultForm) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleFeatureSelect = (_tab: string) => {
    setStep(1);
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div style={{ position: 'absolute', top: '-5%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,142,247,0.10) 0%, transparent 65%)', filter: 'blur(48px)' }} />
        <div style={{ position: 'absolute', bottom: '0%', right: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,90,247,0.08) 0%, transparent 65%)', filter: 'blur(48px)' }} />
      </div>

      {/* Left branding panel */}
      <div
        className="w-[420px] shrink-0 flex flex-col gap-8 p-14 relative"
        style={{ background: 'rgba(255,255,255,0.025)', borderRight: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <img src="/hayvista-logo.png" alt="HayVista" style={{ width: 72, height: 72, objectFit: 'contain', flexShrink: 0 }} />
        </div>

        <div className="mt-4">
          <h2 className="text-3xl font-extrabold leading-snug mb-4">
            {t.tagline.split('always')[0]}
            <span style={{ background: 'linear-gradient(90deg, #4f8ef7, #7c5af7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {t.tagline.includes('always') ? 'always ' + t.tagline.split('always')[1] : t.tagline}
            </span>
          </h2>
          <p className="text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {t.taglineSub}
          </p>
        </div>

        <div className="flex flex-col gap-3.5 mt-2">
          {t.bullets.map((bullet) => (
            <div key={bullet} className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--success)' }} />
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{bullet}</span>
            </div>
          ))}
        </div>

        <div className="mt-auto flex gap-6 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {t.stats.map((s) => (
            <div key={s.l}>
              <p className="text-xl font-extrabold" style={{ color: 'var(--accent)' }}>{s.v}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center px-12 py-12 gap-6 overflow-y-auto relative">
        <button
          onClick={() => navigate('/')}
          className="absolute top-6 right-8 text-xs flex items-center gap-1.5 transition-all"
          style={{ color: 'rgba(240,244,255,0.4)' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(240,244,255,0.4)'; }}
        >
          ← {t.step1.backBtn.replace('← ', '')}
        </button>

        {/* ── Step 0: Feature selection ── */}
        {step === 0 && (
          <>
            <div>
              <h1 className="text-2xl font-extrabold">{t.step0.heading}</h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {t.step0.sub}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {t.features.map((f) => (
                <button
                  key={f.tab}
                  onClick={() => handleFeatureSelect(f.tab)}
                  className="flex flex-col gap-2 p-5 rounded-2xl text-left transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.border = '1px solid rgba(79,142,247,0.4)';
                    e.currentTarget.style.background = 'rgba(79,142,247,0.07)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  }}
                >
                  <span className="text-2xl">{f.icon}</span>
                  <span className="text-sm font-bold">{f.label}</span>
                  <span className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{f.desc}</span>
                </button>
              ))}
            </div>

            <p className="text-sm text-center" style={{ color: 'rgba(240,244,255,0.4)' }}>
              {t.step0.alreadyHave}{' '}
              <button
                onClick={() => { setMode('login'); setStep(1); }}
                className="underline"
                style={{ color: 'var(--accent)' }}
              >
                {t.step0.signIn}
              </button>
            </p>
          </>
        )}

        {/* ── Step 1: Account form ── */}
        {step === 1 && (
          <>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setStep(0); }}
                className="text-xs px-3 py-1.5 rounded-lg transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', color: 'var(--text-muted)' }}
              >
                {t.step1.backBtn}
              </button>
              <div>
                <h1 className="text-2xl font-extrabold">{mode === 'signup' ? t.step1.signupHeading : t.step1.loginHeading}</h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {mode === 'signup' ? t.step1.signupSub : t.step1.loginSub}
                </p>
              </div>
            </div>

            {mode === 'signup' && (
              <>
                {/* Name + Business */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{t.step1.yourName}</label>
                    <input
                      className="h-11 px-3 rounded-lg text-sm outline-none"
                      style={inputStyle}
                      placeholder={t.step1.namePlaceholder}
                      value={form.name}
                      onChange={(e) => updateForm({ name: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{t.step1.businessName}</label>
                    <input
                      className="h-11 px-3 rounded-lg text-sm outline-none"
                      style={inputStyle}
                      placeholder={t.step1.bizPlaceholder}
                      value={form.businessName}
                      onChange={(e) => updateForm({ businessName: e.target.value })}
                    />
                  </div>
                </div>

                {/* Business Type */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{t.step1.businessType}</label>
                  <select
                    className="h-11 px-3 rounded-lg text-sm outline-none"
                    style={inputStyle}
                    value={form.businessType}
                    onChange={(e) => updateForm({ businessType: e.target.value })}
                  >
                    {t.businessTypes.map((bt) => (
                      <option key={bt.value} value={bt.value} style={{ background: '#0d1424' }}>{bt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Tone */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{t.step1.postTone}</label>
                  <div className="flex gap-2">
                    {TONE_OPTIONS.map((tone) => (
                      <button
                        key={tone}
                        onClick={() => updateForm({ tone })}
                        className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
                        style={form.tone === tone
                          ? { background: 'var(--accent)', color: '#fff' }
                          : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)' }
                        }
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Posting frequency */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                    {t.step1.postFreq}
                  </label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {FREQ_OPTIONS.map((n) => (
                      <button
                        key={n}
                        onClick={() => updateForm({ postsPerWeek: n })}
                        className="flex flex-col items-center justify-center py-3 rounded-xl text-sm transition-all"
                        style={form.postsPerWeek === n
                          ? { background: 'rgba(79,142,247,0.12)', border: '2px solid var(--accent)', color: 'var(--accent)' }
                          : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)' }
                        }
                      >
                        <span className="text-xl font-extrabold" style={{ color: form.postsPerWeek === n ? 'var(--accent)' : 'var(--text-muted)' }}>{n}×</span>
                        <span className="text-[11px] mt-0.5">{t.step1.perWeek}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Submit */}
            <button
              onClick={() => { window.location.href = '/auth/google'; }}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold text-base transition-all"
              style={{ background: 'linear-gradient(135deg, #4f8ef7, #7c5af7)', color: '#fff' }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#fff" fillOpacity=".9"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#fff" fillOpacity=".9"/>
                <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#fff" fillOpacity=".9"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#fff" fillOpacity=".9"/>
              </svg>
              {mode === 'signup' ? t.step1.ctaSignup : t.step1.ctaLogin}
            </button>

            {/* Mode toggle */}
            <p className="text-sm text-center" style={{ color: 'rgba(240,244,255,0.4)' }}>
              {mode === 'signup' ? (
                <>{t.step1.alreadyHave}{' '}
                  <button onClick={() => { setMode('login'); }} className="underline" style={{ color: 'var(--accent)' }}>
                    {t.step1.signIn}
                  </button>
                </>
              ) : (
                <>{t.step1.noAccount}{' '}
                  <button onClick={() => { setMode('signup'); }} className="underline" style={{ color: 'var(--accent)' }}>
                    {t.step1.getStarted}
                  </button>
                </>
              )}
            </p>

            <p className="text-xs text-center" style={{ color: 'rgba(240,244,255,0.3)' }}>
              {t.step1.legal}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
