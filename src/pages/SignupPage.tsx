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
  businessName: '',
  businessType: 'general',
  whatsapp: '',
  tone: 'Friendly',
  postsPerWeek: 3,
};

export default function SignupPage() {
  const navigate = useNavigate();
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

  const handleGoogleConnect = async () => {
    await fetch('/auth/presignup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form),
    });
    window.location.href = '/auth/google';
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

      {/* ── Left branding panel ─────────────────────────────────────── */}
      <div
        className="w-[420px] shrink-0 flex flex-col gap-8 p-14 relative"
        style={{ background: 'rgba(255,255,255,0.025)', borderRight: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => navigate('/')}
        >
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

        {/* Mini stat row */}
        <div className="mt-auto flex gap-6 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {[{ v: '2 min', l: 'setup' }, { v: '0', l: 'posts you write' }, { v: '4×', l: 'more visibility' }].map((s) => (
            <div key={s.l}>
              <p className="text-xl font-extrabold" style={{ color: 'var(--accent)' }}>{s.v}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center px-12 py-12 gap-6 overflow-y-auto relative">
        <div>
          <h1 className="text-2xl font-extrabold">Get started</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Takes 2 minutes. No credit card required.</p>
        </div>

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
          <p className="text-xs" style={{ color: 'rgba(240,244,255,0.3)' }}>New clients with many photos can post more frequently to build momentum.</p>
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

        {/* Google Connect */}
        <button
          onClick={handleGoogleConnect}
          disabled={!form.name || !form.businessName}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-semibold text-base transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text)' }}
          onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
            <path fill="#34A853" d="M6.3 14.7l7 5.1C15 16.1 19.1 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 16.3 2 9.7 7.4 6.3 14.7z"/>
            <path fill="#FBBC05" d="M24 46c5.5 0 10.4-1.8 14.3-4.9l-6.6-5.4C29.8 37.6 27 38.5 24 38.5c-6.1 0-11.2-4.1-13-9.7l-7 5.4C7.5 41.8 15.2 46 24 46z"/>
            <path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-1 2.7-2.8 5-5.1 6.6l6.6 5.4c3.8-3.6 6.2-8.9 6.2-15.5 0-1.3-.2-2.7-.5-4z"/>
          </svg>
          Continue with Google
        </button>

        <p className="text-xs text-center" style={{ color: 'rgba(240,244,255,0.3)' }}>
          By continuing you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
