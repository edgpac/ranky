import { useState } from 'react';

interface Client {
  business_name: string;
  name: string;
  posts_per_week: number;
  tone: string;
  business_type: string;
  subscription_status: string;
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

export default function EditProfileTab({ client }: { client: Client | null }) {
  const [editing, setEditing] = useState(false);
  const [businessName, setBusinessName] = useState(client?.business_name || '');
  const [category, setCategory] = useState(client?.business_type || 'General Contractor');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState<Hours>(defaultHours());

  const MAX_DESC = 750;

  const handleSave = () => {
    setEditing(false);
  };

  const updateHour = (day: string, field: keyof HourRow, value: string | boolean) => {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  return (
    <div style={glassCard}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'rgba(240,244,255,0.95)' }}>Edit Profile</h2>
        {editing ? (
          <div className="flex gap-2">
            <button style={btnGhost} onClick={() => setEditing(false)}>Cancel</button>
            <button style={btnPrimary} onClick={handleSave}>Save Changes</button>
          </div>
        ) : (
          <button style={btnGhost} onClick={() => setEditing(true)}>Edit</button>
        )}
      </div>

      {!editing ? (
        /* View mode: 2-column grid */
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
            <span style={labelStyle}>Phone</span>
            <span style={valueStyle}>{phone || '—'}</span>
          </div>
          <div>
            <span style={labelStyle}>Website</span>
            <span style={valueStyle}>{website || '—'}</span>
          </div>
          <div className="col-span-2">
            <span style={labelStyle}>Description</span>
            <span style={valueStyle}>{description || '—'}</span>
          </div>
          <div className="col-span-2">
            <span style={labelStyle}>Hours</span>
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
        /* Edit mode */
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
              <label style={labelStyle}>Phone</label>
              <input
                style={inputStyle}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                type="tel"
              />
            </div>
            <div>
              <label style={labelStyle}>Website URL</label>
              <input
                style={inputStyle}
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourbusiness.com"
                type="url"
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
              placeholder="Describe your business..."
              rows={4}
            />
            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'rgba(240,244,255,0.5)', marginTop: '0.25rem' }}>
              {description.length} / {MAX_DESC}
            </div>
          </div>

          {/* Hours grid */}
          <div>
            <label style={{ ...labelStyle, marginBottom: '0.75rem' }}>Regular Hours</label>
            <div className="flex flex-col gap-2">
              {DAYS.map((day) => (
                <div key={day} className="flex items-center gap-3">
                  <span style={{ color: 'rgba(240,244,255,0.7)', fontSize: '0.875rem', width: '96px', flexShrink: 0 }}>{day}</span>
                  <label className="flex items-center gap-1.5 cursor-pointer" style={{ fontSize: '0.8125rem', color: 'rgba(240,244,255,0.5)' }}>
                    <input
                      type="checkbox"
                      checked={hours[day].closed}
                      onChange={(e) => updateHour(day, 'closed', e.target.checked)}
                      style={{ accentColor: '#4f8ef7' }}
                    />
                    Closed
                  </label>
                  {!hours[day].closed && (
                    <>
                      <input
                        type="time"
                        style={{ ...inputStyle, width: '110px' }}
                        value={hours[day].open}
                        onChange={(e) => updateHour(day, 'open', e.target.value)}
                      />
                      <span style={{ color: 'rgba(240,244,255,0.4)', fontSize: '0.875rem' }}>–</span>
                      <input
                        type="time"
                        style={{ ...inputStyle, width: '110px' }}
                        value={hours[day].close}
                        onChange={(e) => updateHour(day, 'close', e.target.value)}
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
