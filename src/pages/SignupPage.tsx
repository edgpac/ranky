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

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    businessName: '',
    businessType: 'general',
    whatsapp: '',
    tone: 'Friendly',
    postsPerWeek: 3,
  });

  const handleGoogleConnect = async () => {
    // Send form to server session before OAuth redirect
    await fetch('/auth/presignup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form),
    });
    window.location.href = '/auth/google';
  };

  return (
    <div className="min-h-screen flex font-sans">

      {/* Left panel */}
      <div className="w-[480px] shrink-0 bg-slate-900 flex flex-col gap-8 p-16">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-6 h-6 rounded-full bg-brand" />
          <span className="text-white font-bold text-xl">Ranky</span>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-50 leading-snug">
          Your GBP posts itself while you work.
        </h2>
        <p className="text-slate-400 text-base leading-relaxed">
          Real photos. Real search data. Posts go up automatically every week.
        </p>
        <div className="flex flex-col gap-4 mt-2">
          {[
            'No passwords shared. Ever.',
            'Works with your existing GBP photos.',
            'Cancel anytime. No contracts.',
          ].map((t) => (
            <div key={t} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-brand shrink-0" />
              <span className="text-slate-400 text-sm">{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 bg-white flex flex-col justify-center px-16 py-16 gap-7">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Get started</h1>
          <p className="text-slate-400 text-sm mt-1">Takes 2 minutes. No credit card required.</p>
        </div>

        {/* Name + Business */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700">Your name</label>
            <input
              className="h-11 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
              placeholder="Edgar"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700">Business name</label>
            <input
              className="h-11 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
              placeholder="Cabos Handyman"
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
            />
          </div>
        </div>

        {/* Business Type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-700">Business type</label>
          <select
            className="h-11 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 text-slate-700"
            value={form.businessType}
            onChange={(e) => setForm({ ...form, businessType: e.target.value })}
          >
            {BUSINESS_TYPES.map((bt) => (
              <option key={bt.value} value={bt.value}>{bt.label}</option>
            ))}
          </select>
        </div>

        {/* WhatsApp */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-700">WhatsApp number <span className="text-gray-400 font-normal">(for weekly post updates)</span></label>
          <input
            className="h-11 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
            placeholder="+52 624 000 0000"
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
          />
        </div>

        {/* Tone */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-700">Post tone</label>
          <div className="flex gap-2">
            {TONE_OPTIONS.map((t) => (
              <button
                key={t}
                onClick={() => setForm({ ...form, tone: t })}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  form.tone === t
                    ? 'bg-brand text-white font-semibold'
                    : 'bg-gray-50 border border-gray-200 text-gray-700 hover:border-brand/40'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Posting frequency */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-700">
            How often do you want to post?
          </label>
          <p className="text-xs text-gray-400">New clients with many photos can post more frequently to build momentum.</p>
          <div className="grid grid-cols-4 gap-2 mt-1">
            {FREQ_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setForm({ ...form, postsPerWeek: n })}
                className={`flex flex-col items-center justify-center py-3 rounded-xl text-sm transition-all ${
                  form.postsPerWeek === n
                    ? 'bg-green-50 border-2 border-brand text-brand'
                    : 'bg-gray-50 border border-gray-200 text-gray-400 hover:border-brand/40'
                }`}
              >
                <span className={`text-xl font-extrabold ${form.postsPerWeek === n ? 'text-brand' : 'text-gray-400'}`}>{n}×</span>
                <span className="text-[11px] mt-0.5">per week</span>
              </button>
            ))}
          </div>
        </div>

        {/* Google Connect */}
        <button
          onClick={handleGoogleConnect}
          disabled={!form.name || !form.businessName}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl border border-gray-200 bg-white text-slate-900 font-semibold text-base hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
            <path fill="#34A853" d="M6.3 14.7l7 5.1C15 16.1 19.1 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 16.3 2 9.7 7.4 6.3 14.7z"/>
            <path fill="#FBBC05" d="M24 46c5.5 0 10.4-1.8 14.3-4.9l-6.6-5.4C29.8 37.6 27 38.5 24 38.5c-6.1 0-11.2-4.1-13-9.7l-7 5.4C7.5 41.8 15.2 46 24 46z"/>
            <path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-1 2.7-2.8 5-5.1 6.6l6.6 5.4c3.8-3.6 6.2-8.9 6.2-15.5 0-1.3-.2-2.7-.5-4z"/>
          </svg>
          Continue with Google
        </button>

        <p className="text-xs text-gray-400 text-center">
          By continuing you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>

    </div>
  );
}
