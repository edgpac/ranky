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

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: 'var(--text)',
};

const STORAGE_KEY = 'ranky_signup_form';

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
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [form, setForm] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...defaultForm, ...JSON.parse(saved) } : defaultForm;
    } catch {
      return defaultForm;
    }
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateForm = (patch: Partial<typeof defaultForm>) => {
    setForm((prev: typeof defaultForm) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const url = mode === 'signup' ? '/auth/signup' : '/auth/login';
      const body = mode === 'signup' ? { ...form, password } : { email: form.email, password };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong'); return; }
      navigate('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || !form.email || !password || (mode === 'signup' && (!form.name || !form.businessName));

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
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg, #4f8ef7, #7c5af7)', flexShrink: 0 }} />
          <span className="font-bold text-xl">Ranky</span>
        </div>

        <div className="mt-4">
          <h2 className="text-3xl font-extrabold leading-snug mb-4">
            Your GBP posts itself{' '}
            <span style={{ background: 'linear-gradient(90deg, #4f8ef7, #7c5af7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              while you work.
            </span>
          </h2>
          <p className="text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Real photos. Real search data. Posts go up automatically every week.
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
          {[{ v: '2 min', l: 'setup' }, { v: '0', l: 'posts you write' }, { v: '4×', l: 'more visibility' }].map((s) => (
            <div key={s.l}>
              <p className="text-xl font-extrabold" style={{ color: 'var(--accent)' }}>{s.v}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col justify-center px-12 py-12 gap-6 overflow-y-auto relative">
        <div>
          <h1 className="text-2xl font-extrabold">{mode === 'signup' ? 'Get started' : 'Welcome back'}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {mode === 'signup' ? 'Takes 2 minutes. No credit card required.' : 'Sign in to your Ranky account.'}
          </p>
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
                  placeholder="Edgar"
                  value={form.name}
                  onChange={(e) => updateForm({ name: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Business name</label>
                <input
                  className="h-11 px-3 rounded-lg text-sm outline-none"
                  style={inputStyle}
                  placeholder="Cabos Handyman"
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
                placeholder="+52 624 000 0000"
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

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Email</label>
          <input
            type="email"
            className="h-11 px-3 rounded-lg text-sm outline-none"
            style={inputStyle}
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => updateForm({ email: e.target.value })}
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Password</label>
          <input
            type="password"
            className="h-11 px-3 rounded-lg text-sm outline-none"
            style={inputStyle}
            placeholder={mode === 'signup' ? 'Create a password' : 'Your password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !isDisabled) handleSubmit(); }}
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isDisabled}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #4f8ef7, #7c5af7)', color: '#fff' }}
        >
          {loading ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
        </button>

        {/* Mode toggle */}
        <p className="text-sm text-center" style={{ color: 'rgba(240,244,255,0.4)' }}>
          {mode === 'signup' ? (
            <>Already have an account?{' '}
              <button onClick={() => { setMode('login'); setError(''); }} className="underline" style={{ color: 'var(--accent)' }}>
                Sign in
              </button>
            </>
          ) : (
            <>Don't have an account?{' '}
              <button onClick={() => { setMode('signup'); setError(''); }} className="underline" style={{ color: 'var(--accent)' }}>
                Get started
              </button>
            </>
          )}
        </p>

        <p className="text-xs text-center" style={{ color: 'rgba(240,244,255,0.3)' }}>
          By continuing you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
