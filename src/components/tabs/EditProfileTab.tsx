import { useEffect, useState } from 'react';

interface Client {
  business_name: string;
  name: string;
  posts_per_week: number;
  tone: string;
  business_type: string;
  subscription_status: string;
  whatsapp?: string;
  website?: string;
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

/** Returns a single-line hours summary, e.g. "Mon–Sat 08:00–17:00 · Sun Closed" */
function summarizeHours(hours: Hours): string {
  const allClosed = DAYS.every((d) => hours[d].closed);
  if (allClosed) return 'Closed';

  const openDays = DAYS.filter((d) => !hours[d].closed);
  const allSameSchedule = openDays.every(
    (d) => hours[d].open === hours[openDays[0]].open && hours[d].close === hours[openDays[0]].close,
  );

  if (openDays.length === 7 && allSameSchedule) {
    return `Open daily ${hours[openDays[0]].open}–${hours[openDays[0]].close}`;
  }

  const monSat = DAYS.slice(0, 6);
  const monSatSame =
    monSat.every((d) => !hours[d].closed) &&
    monSat.every((d) => hours[d].open === hours['Monday'].open && hours[d].close === hours['Monday'].close);

  if (monSatSame) {
    const sunPart = hours['Sunday'].closed
      ? 'Sun Closed'
      : `Sun ${hours['Sunday'].open}–${hours['Sunday'].close}`;
    return `Mon–Sat ${hours['Monday'].open}–${hours['Monday'].close} · ${sunPart}`;
  }

  const monFri = DAYS.slice(0, 5);
  const monFriSame =
    monFri.every((d) => !hours[d].closed) &&
    monFri.every((d) => hours[d].open === hours['Monday'].open && hours[d].close === hours['Monday'].close);

  if (monFriSame) {
    const satPart = hours['Saturday'].closed
      ? 'Sat Closed'
      : `Sat ${hours['Saturday'].open}–${hours['Saturday'].close}`;
    const sunPart = hours['Sunday'].closed
      ? 'Sun Closed'
      : `Sun ${hours['Sunday'].open}–${hours['Sunday'].close}`;
    return `Mon–Fri ${hours['Monday'].open}–${hours['Monday'].close} · ${satPart} · ${sunPart}`;
  }

  // Fallback: list open days compactly
  return openDays.map((d) => `${d.slice(0, 3)} ${hours[d].open}–${hours[d].close}`).join(' · ');
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
  fontSize: '0.6875rem',
  fontWeight: 600,
  color: 'rgba(240,244,255,0.45)',
  marginBottom: '0.3rem',
  display: 'block',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

const valueStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: 'rgba(240,244,255,0.88)',
  lineHeight: 1.5,
  display: 'block',
};

const notSetStyle: React.CSSProperties = {
  color: 'rgba(240,244,255,0.25)',
  fontStyle: 'italic',
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

const dividerStyle: React.CSSProperties = {
  borderTop: '1px solid rgba(255,255,255,0.07)',
  marginTop: '0.25rem',
  paddingTop: '1.25rem',
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
  const [phone, setPhone] = useState(client?.whatsapp || '');
  const [website, setWebsite] = useState(client?.website || '');
  const [serviceArea, setServiceArea] = useState(client?.city || '');
  const [description, setDescription] = useState('');
  const [hours] = useState<Hours>(defaultHours());

  const MAX_DESC = 750;

  useEffect(() => {
    if (!client) return;
    setBusinessName(client.business_name || '');
    setCategory(client.business_type || 'General Contractor');
    setTone(client.tone || 'Friendly');
    setPostsPerWeek(client.posts_per_week || 1);
    setPhone(client.whatsapp || '');
    setWebsite(client.website || '');
    setServiceArea(client.city || '');
  }, [
    client?.business_name,
    client?.business_type,
    client?.tone,
    client?.posts_per_week,
    client?.whatsapp,
    client?.website,
    client?.city,
  ]);

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
          whatsapp: phone,
          website,
          city: serviceArea,
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

  const hoursSummary = summarizeHours(hours);

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
        <div className="flex flex-col gap-5">
          {/* GBP-native fields */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            <div>
              <span style={labelStyle}>Business Name</span>
              <span style={valueStyle}>{businessName || <span style={notSetStyle}>Not set</span>}</span>
            </div>
            <div>
              <span style={labelStyle}>Primary Category</span>
              <span style={valueStyle}>{category}</span>
            </div>
            <div>
              <span style={labelStyle}>Phone</span>
              <span style={valueStyle}>{phone || <span style={notSetStyle}>Not set</span>}</span>
            </div>
            <div>
              <span style={labelStyle}>Website</span>
              <span style={valueStyle}>{website || <span style={notSetStyle}>Not set</span>}</span>
            </div>
          </div>

          <div>
            <span style={labelStyle}>Description</span>
            <span style={{ ...valueStyle, color: description ? 'rgba(240,244,255,0.88)' : undefined }}>
              {description || <span style={notSetStyle}>No description added yet</span>}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-8">
            <div>
              <span style={labelStyle}>
                Hours{' '}
                <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, opacity: 0.5 }}>(editable once GBP approved)</span>
              </span>
              <span style={valueStyle}>{hoursSummary}</span>
            </div>
            <div>
              <span style={labelStyle}>Service Area</span>
              <span style={valueStyle}>{serviceArea || <span style={notSetStyle}>Not set</span>}</span>
            </div>
          </div>

          {/* HayVista AI settings */}
          <div style={dividerStyle}>
            <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(240,244,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
              HayVista AI Settings
            </p>
            <div className="grid grid-cols-2 gap-x-8">
              <div>
                <span style={labelStyle}>Posts per week</span>
                <span style={valueStyle}>{postsPerWeek}×</span>
              </div>
              <div>
                <span style={labelStyle}>Post Tone</span>
                <span style={valueStyle}>{tone}</span>
              </div>
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
              <label style={labelStyle}>Primary Category</label>
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
              <label style={labelStyle}>Phone</label>
              <input
                style={inputStyle}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 000 0000"
                type="tel"
              />
            </div>
            <div>
              <label style={labelStyle}>Website</label>
              <input
                style={inputStyle}
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="yourbusiness.com"
                type="url"
              />
            </div>
            <div className="col-span-2">
              <label style={labelStyle}>Service Area</label>
              <input
                style={inputStyle}
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value)}
                placeholder="City or service area"
              />
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
              <span style={{ fontWeight: 400, color: 'rgba(240,244,255,0.35)', fontSize: '0.7rem', textTransform: 'none', letterSpacing: 0 }}>
                (editing available once GBP write scope is approved)
              </span>
            </label>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(240,244,255,0.45)', opacity: 0.7 }}>{hoursSummary}</p>
          </div>

          <div style={dividerStyle}>
            <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(240,244,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
              HayVista AI Settings
            </p>

            <div className="flex flex-col gap-4">
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
