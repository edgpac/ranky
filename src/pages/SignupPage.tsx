import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FREQ_OPTIONS = [1, 2, 3, 4];
const TONE_OPTIONS = ['Friendly', 'Professional', 'Bilingual'];
const BUSINESS_TYPES = [
  { value: 'general',     label: 'General / Other' },
  { value: 'restaurant',  label: 'Restaurant / Café / Food' },
  { value: 'contractor',  label: 'Contractor / Handyman / Home Services' },
  { value: 'medical',     label: 'Medical / Dental / Wellness' },
  { value: 'salon',       label: 'Salon / Barbershop / Spa' },
  { value: 'gym',         label: 'Gym / Fitness / Yoga' },
  { value: 'retail',      label: 'Retail Store / Boutique' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'auto',        label: 'Auto Repair / Dealership' },
  { value: 'legal',       label: 'Law Firm / Legal Services' },
];

const FEATURES = [
  { icon: '⭐', label: 'Reviews',     tab: 'reviews',     desc: 'Respond to customer reviews with AI-matched tone' },
  { icon: '📸', label: 'Photos',      tab: 'photos',      desc: 'Drop in real photos from your jobs or location. We tag them with the right keywords and push them to your GBP — that\'s all you need to do.' },
  { icon: '📝', label: 'Posts',       tab: 'posts',       desc: 'We look at your photos, services, and products, then check what people nearby are searching for — and write posts that connect the two.' },
  { icon: '📊', label: 'Insights',    tab: 'insights',    desc: 'Track views, searches, and profile activity' },
  { icon: '🛠️', label: 'Services',    tab: 'services',    desc: 'Keep your service listings up to date' },
  { icon: '🔗', label: 'Get Reviews', tab: 'get-reviews', desc: 'Share your review link and grow your rating' },
];

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
  const [step, setStep] = useState<0 | 1>(0);
  const [selectedFeature, setSelectedFeature] = useState('');
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

  const handleFeatureSelect = (tab: string) => {
    setSelectedFeature(tab);
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
            Your GBP,{' '}
            <span style={{ background: 'linear-gradient(90deg, #4f8ef7, #7c5af7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              always visible.
            </span>
          </h2>
          <p className="text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Real photos. Real search data. AI-crafted content published on your schedule.
          </p>
        </div>

        <div className="flex flex-col gap-3.5 mt-2">
          {[
            'No passwords shared. Ever.',
            'Works with your existing GBP photos.',
            'Cancel anytime. No contracts.',
          ].map((t) => (
            <div key={t} className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--success)' }} />
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{t}</span>
            </div>
          ))}
        </div>

        <div className="mt-auto flex gap-6 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {[{ v: '2 min', l: 'setup' }, { v: '100%', l: 'GBP compliant' }, { v: '4×', l: 'more visibility' }].map((s) => (
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
          ← Back to home
        </button>

        {/* ── Step 0: Feature selection ── */}
        {step === 0 && (
          <>
            <div>
              <h1 className="text-2xl font-extrabold">What would you like to manage?</h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Choose a feature to get started — you can use all of them once you're in.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map((f) => (
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
              Already have an account?{' '}
              <button
                onClick={() => { setMode('login'); setStep(1); }}
                className="underline"
                style={{ color: 'var(--accent)' }}
              >
                Sign in
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
                ← Back
              </button>
              <div>
                <h1 className="text-2xl font-extrabold">{mode === 'signup' ? 'Connect your Google Business Profile' : 'Welcome back'}</h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {mode === 'signup' ? 'Create a free account and link your Google profile to start managing your content.' : 'Sign in to your HayVista account.'}
                </p>
              </div>
            </div>

            {mode === 'signup' && (
              <>
                {/* Name + Business */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Your name</label>
                    <input
                      className="h-11 px-3 rounded-lg text-sm outline-none"
                      style={inputStyle}
                      placeholder="Your name"
                      value={form.name}
                      onChange={(e) => updateForm({ name: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Business name</label>
                    <input
                      className="h-11 px-3 rounded-lg text-sm outline-none"
                      style={inputStyle}
                      placeholder="Your business name"
                      value={form.businessName}
                      onChange={(e) => updateForm({ businessName: e.target.value })}
                    />
                  </div>
                </div>

                {/* Business Type */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Business type</label>
                  <select
                    className="h-11 px-3 rounded-lg text-sm outline-none"
                    style={inputStyle}
                    value={form.businessType}
                    onChange={(e) => updateForm({ businessType: e.target.value })}
                  >
                    {BUSINESS_TYPES.map((bt) => (
                      <option key={bt.value} value={bt.value} style={{ background: '#0d1424' }}>{bt.label}</option>
                    ))}
                  </select>
                </div>

                {/* WhatsApp */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                    WhatsApp number <span style={{ color: 'rgba(240,244,255,0.3)', fontWeight: 400 }}>(for weekly post updates)</span>
                  </label>
                  <input
                    className="h-11 px-3 rounded-lg text-sm outline-none"
                    style={inputStyle}
                    placeholder="+1 555 000 0000"
                    value={form.whatsapp}
                    onChange={(e) => updateForm({ whatsapp: e.target.value })}
                  />
                </div>

                {/* Tone */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Post tone</label>
                  <div className="flex gap-2">
                    {TONE_OPTIONS.map((t) => (
                      <button
                        key={t}
                        onClick={() => updateForm({ tone: t })}
                        className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
                        style={form.tone === t
                          ? { background: 'var(--accent)', color: '#fff' }
                          : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)' }
                        }
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Posting frequency */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                    How often do you want to post?
                  </label>
                  <div className="grid grid-cols-4 gap-2 mt-1">
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
                        <span className="text-[11px] mt-0.5">per week</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Submit — redirects to Google OAuth which handles auth + GBP permissions */}
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
              {mode === 'signup' ? 'Continue With Google' : 'Sign In with Google'}
            </button>

            {/* Mode toggle */}
            <p className="text-sm text-center" style={{ color: 'rgba(240,244,255,0.4)' }}>
              {mode === 'signup' ? (
                <>Already have an account?{' '}
                  <button onClick={() => { setMode('login')}} className="underline" style={{ color: 'var(--accent)' }}>
                    Sign in
                  </button>
                </>
              ) : (
                <>Don't have an account?{' '}
                  <button onClick={() => { setMode('signup')}} className="underline" style={{ color: 'var(--accent)' }}>
                    Get started
                  </button>
                </>
              )}
            </p>

            <p className="text-xs text-center" style={{ color: 'rgba(240,244,255,0.3)' }}>
              By continuing you agree to our Terms of Service and Privacy Policy.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
