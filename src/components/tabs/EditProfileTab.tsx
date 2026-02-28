import { useEffect, useState } from 'react';

interface Client {
  business_name: string;
  name: string;
  posts_per_week: number;
  tone: string;
  business_type: string;
  subscription_status: string;
  whatsapp?: string;
  review_link?: string;
  city?: string;
}

interface HourRow {
  closed: boolean;
  open: string;
  close: string;
}

type Hours = Record<string, HourRow>;

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const CATEGORY_OPTIONS = [
  'General Contractor',
  'Handyman',
  'Electrician',
  'Plumber',
  'HVAC',
  'Painter',
  'Roofer',
  'Landscaper',
  'Cleaner',
];

const TONE_OPTIONS = ['Friendly', 'Professional', 'Bilingual'];
const FREQ_OPTIONS = [1, 2, 3, 4];

function defaultHours(): Hours {
  const h: Hours = {};
  DAYS.forEach((d) => {
    h[d] = { closed: d === 'Sunday', open: '08:00', close: '17:00' };
  });
  return h;
}

const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
  backdropFilter: 'blur(8px)',
  borderRadius: '1rem',
  padding: '1.5rem',
};

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: 'white',
  borderRadius: '0.5rem',
  height: '2.25rem',
  padding: '0 0.75rem',
  fontSize: '0.875rem',
  width: '100%',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'rgba(240,244,255,0.5)',
  marginBottom: '0.25rem',
  display: 'block',
};

const valueStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'rgba(240,244,255,0.85)',
};

const btnPrimary: React.CSSProperties = {
  background: '#4f8ef7',
  color: 'white',
  borderRadius: '0.5rem',
  padding: '0.5rem 1rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
};

const btnGhost: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.15)',
  color: 'rgba(240,244,255,0.7)',
  borderRadius: '0.5rem',
  padding: '0.375rem 0.75rem',
  fontSize: '0.875rem',
  cursor: 'pointer',
};

interface Props {
  client: Client | null;
  onClientUpdated: (client: Client) => void;
}

export default function EditProfileTab({ client, onClientUpdated }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [businessName, setBusinessName] = useState(client?.business_name || '');
  const [category, setCategory] = useState(client?.business_type || 'General Contractor');
  const [tone, setTone] = useState(client?.tone || 'Friendly');
  const [postsPerWeek, setPostsPerWeek] = useState(client?.posts_per_week || 1);
  const [whatsapp, setWhatsapp] = useState(client?.whatsapp || '');
  const [city, setCity] = useState(client?.city || '');
  const [description, setDescription] = useState('');
  const [hours] = useState<Hours>(defaultHours());

  const MAX_DESC = 750;

  useEffect(() => {
    if (!client) return;
    setBusinessName(client.business_name || '');
    setCategory(client.business_type || 'General Contractor');
    setTone(client.tone || 'Friendly');
    setPostsPerWeek(client.posts_per_week || 1);
    setWhatsapp(client.whatsapp || '');
    setCity(client.city || '');
  }, [client?.business_name, client?.business_type, client?.tone, client?.posts_per_week, client?.whatsapp, client?.city]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: businessName,
          business_type: category,
          tone,
          posts_per_week: postsPerWeek,
          whatsapp,
          city,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      onClientUpdated(data.client);
      setEditing(false);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={glassCard}>
      <div className="flex items-center justify-between mb-6">
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'rgba(240,244,255,0.95)' }}>Edit Profile</h2>
        {editing ? (
          <div className="flex gap-2 items-center">
            {saveError && <span style={{ fontSize: '0.75rem', color: '#f87171' }}>{saveError}</span>}
            <button style={btnGhost} onClick={() => { setEditing(false); setSaveError(''); }}>Cancel</button>
            <button
              style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        ) : (
          <button style={btnGhost} onClick={() => setEditing(true)}>Edit</button>
        )}
      </div>

      {!editing ? (
        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
          <div>
            <span style={labelStyle}>Business Name</span>
            <span style={valueStyle}>{businessName || '—'}</span>
          </div>
          <div>
            <span style={labelStyle}>Category</span>
            <span style={valueStyle}>{category || '—'}</span>
          </div>
          <div>
            <span style={labelStyle}>WhatsApp</span>
            <span style={valueStyle}>{whatsapp || '—'}</span>
          </div>
          <div>
            <span style={labelStyle}>City / Service Area</span>
            <span style={valueStyle}>{city || '—'}</span>
          </div>
          <div>
            <span style={labelStyle}>Posts Per Week</span>
            <span style={valueStyle}>{postsPerWeek}×</span>
          </div>
          <div>
            <span style={labelStyle}>Post Tone</span>
            <span style={valueStyle}>{tone}</span>
          </div>
          <div className="col-span-2">
            <span style={labelStyle}>Description</span>
            <span style={valueStyle}>{description || '—'}</span>
          </div>
          <div className="col-span-2">
            <span style={labelStyle}>
              Hours{' '}
              <span style={{ fontWeight: 400, opacity: 0.5 }}>(editable once GBP scope approved)</span>
            </span>
            <div className="flex flex-col gap-1 mt-1">
              {DAYS.map((day) => (
                <div key={day} className="flex gap-4 text-sm">
                  <span style={{ color: 'rgba(240,244,255,0.6)', width: '96px', flexShrink: 0 }}>{day}</span>
                  <span style={valueStyle}>
                    {hours[day].closed ? 'Closed' : `${hours[day].open} – ${hours[day].close}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Business Name</label>
              <input
                style={inputStyle}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Your business name"
              />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <select
                style={{ ...inputStyle, appearance: 'none' as const }}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} style={{ background: '#080d1a' }}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>WhatsApp</label>
              <input
                style={inputStyle}
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+1 555 000 0000"
                type="tel"
              />
            </div>
            <div>
              <label style={labelStyle}>City / Service Area</label>
              <input
                style={inputStyle}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City or service area"
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Post Tone</label>
            <div className="flex gap-2 mt-1">
              {TONE_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  style={{
                    padding: '0.375rem 1rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: '1px solid',
                    background: tone === t ? 'rgba(79,142,247,0.15)' : 'rgba(255,255,255,0.04)',
                    borderColor: tone === t ? 'rgba(79,142,247,0.4)' : 'rgba(255,255,255,0.10)',
                    color: tone === t ? '#4f8ef7' : 'rgba(240,244,255,0.6)',
                    transition: 'all 0.15s',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Posts Per Week</label>
            <div className="grid grid-cols-4 gap-2 mt-1">
              {FREQ_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setPostsPerWeek(n)}
                  className="flex flex-col items-center justify-center py-3 rounded-xl"
                  style={{
                    background: postsPerWeek === n ? 'rgba(79,142,247,0.12)' : 'rgba(255,255,255,0.04)',
                    border: `${postsPerWeek === n ? 2 : 1}px solid ${postsPerWeek === n ? '#4f8ef7' : 'rgba(255,255,255,0.08)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: postsPerWeek === n ? '#4f8ef7' : 'rgba(240,244,255,0.5)' }}>
                    {n}×
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: 'rgba(240,244,255,0.4)', marginTop: '0.125rem' }}>per week</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.10)',
                color: 'white',
                borderRadius: '0.5rem',
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                width: '100%',
                outline: 'none',
                resize: 'vertical',
                minHeight: '100px',
              }}
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESC))}
              placeholder="Describe your business…"
              rows={4}
            />
            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'rgba(240,244,255,0.5)', marginTop: '0.25rem' }}>
              {description.length} / {MAX_DESC}
            </div>
          </div>

          <div>
            <label style={{ ...labelStyle, marginBottom: '0.5rem' }}>
              Regular Hours{' '}
              <span style={{ fontWeight: 400, color: 'rgba(240,244,255,0.35)', fontSize: '0.7rem' }}>
                (editing available once GBP write scope is approved)
              </span>
            </label>
            <div className="flex flex-col gap-2" style={{ opacity: 0.45, pointerEvents: 'none' }}>
              {DAYS.map((day) => (
                <div key={day} className="flex items-center gap-3">
                  <span style={{ color: 'rgba(240,244,255,0.7)', fontSize: '0.875rem', width: '96px', flexShrink: 0 }}>{day}</span>
                  <span style={{ fontSize: '0.8125rem', color: 'rgba(240,244,255,0.5)' }}>
                    {hours[day].closed ? 'Closed' : `${hours[day].open} – ${hours[day].close}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
