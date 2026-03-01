import { useEffect, useState } from 'react';
import { resolveTemplate, type ProfileTemplate } from './profileTemplates';
import ProfileSkeleton from './ProfileSkeleton';
import SocialLinksSection from './SocialLinksSection';

// ─── Interfaces ───────────────────────────────────────────────────────────────

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

interface GbpHourRow {
  closed: boolean;
  open: string;
  close: string;
}

type GbpHours = Record<string, GbpHourRow>;

interface GbpProfileData {
  businessName: string;
  phone: string;
  additionalPhones: string[];
  website: string;
  description: string;
  hours: GbpHours;
  moreHours: Record<string, GbpHours>;
  serviceArea: string;
  address: string;
  primaryCategory: string;
  additionalCategories: string[];
  isOpen: boolean;
}

// ─── Hours helpers ────────────────────────────────────────────────────────────

const GBP_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

/** Return single-line summary from a GBP hours map */
function summarizeHours(hours: GbpHours | null): string {
  if (!hours) return 'Hours not available';
  const allClosed = GBP_DAYS.every((d) => !hours[d] || hours[d].closed);
  if (allClosed) return 'Closed';

  const openDays = GBP_DAYS.filter((d) => hours[d] && !hours[d].closed);

  if (openDays.length === 7) {
    const first = hours[openDays[0]];
    const allSame = openDays.every((d) => hours[d].open === first.open && hours[d].close === first.close);
    if (allSame) return `Open daily ${first.open}–${first.close}`;
  }

  const monSat = GBP_DAYS.slice(0, 6);
  const monSatSame =
    monSat.every((d) => hours[d] && !hours[d].closed) &&
    monSat.every((d) => hours[d].open === hours['MONDAY'].open && hours[d].close === hours['MONDAY'].close);

  if (monSatSame) {
    const sun = hours['SUNDAY'];
    const sunPart = !sun || sun.closed ? 'Sun Closed' : `Sun ${sun.open}–${sun.close}`;
    return `Mon–Sat ${hours['MONDAY'].open}–${hours['MONDAY'].close} · ${sunPart}`;
  }

  const monFri = GBP_DAYS.slice(0, 5);
  const monFriSame =
    monFri.every((d) => hours[d] && !hours[d].closed) &&
    monFri.every((d) => hours[d].open === hours['MONDAY'].open && hours[d].close === hours['MONDAY'].close);

  if (monFriSame) {
    const sat = hours['SATURDAY'];
    const sun = hours['SUNDAY'];
    const satPart = !sat || sat.closed ? 'Sat Closed' : `Sat ${sat.open}–${sat.close}`;
    const sunPart = !sun || sun.closed ? 'Sun Closed' : `Sun ${sun.open}–${sun.close}`;
    return `Mon–Fri ${hours['MONDAY'].open}–${hours['MONDAY'].close} · ${satPart} · ${sunPart}`;
  }

  return openDays
    .map((d) => `${d.slice(0, 3).charAt(0) + d.slice(1, 3).toLowerCase()} ${hours[d].open}–${hours[d].close}`)
    .join(' · ');
}

// ─── Style constants ──────────────────────────────────────────────────────────

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

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Attribute badge showing ✓ or ✗ with label */
function AttributeBadge({ label, value }: { label: string; value?: boolean }) {
  const on = value === true;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.375rem 0.625rem',
        borderRadius: '0.5rem',
        background: on ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${on ? 'rgba(52,211,153,0.20)' : 'rgba(255,255,255,0.08)'}`,
      }}
    >
      <span style={{ fontSize: '0.75rem', color: on ? '#34d399' : 'rgba(240,244,255,0.35)' }}>
        {on ? '✓' : '✗'}
      </span>
      <span style={{ fontSize: '0.75rem', color: on ? 'rgba(240,244,255,0.75)' : 'rgba(240,244,255,0.35)' }}>
        {label}
      </span>
    </div>
  );
}

// ─── View mode: template-driven layout ────────────────────────────────────────

const MORE_HOURS_LABELS: Record<string, string> = {
  DELIVERY:       'Delivery Hours',
  TAKEOUT:        'Takeout Hours',
  KITCHEN:        'Kitchen Hours',
  HAPPY_HOURS:    'Happy Hours',
  BRUNCH:         'Brunch Hours',
  DRIVE_THROUGH:  'Drive-through Hours',
  PICKUP:         'Pickup Hours',
  ONLINE_SERVICE: 'Telehealth Hours',
};

function ProfileView({
  gbp,
  client,
  template,
  localExtras,
}: {
  gbp: GbpProfileData | null;
  client: Client | null;
  template: ProfileTemplate;
  localExtras: Record<string, string>;
}) {
  const businessName = gbp?.businessName || client?.business_name || '';
  const primaryCategory = gbp?.primaryCategory || client?.business_type || '';
  const phone = gbp?.phone || client?.whatsapp || '';
  const website = gbp?.website || client?.website || '';
  const description = gbp?.description || '';
  const address = gbp?.address || '';
  const serviceArea = gbp?.serviceArea || client?.city || '';
  const hoursSummary = summarizeHours(gbp?.hours ?? null);

  const moreHoursToShow = template.moreHoursToShow.filter(
    (id) => gbp?.moreHours?.[id],
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Row 1: Name | Category */}
      <div className="grid grid-cols-2 gap-x-8">
        <div>
          <span style={labelStyle}>Business Name</span>
          <span style={valueStyle}>{businessName || <span style={notSetStyle}>Not set</span>}</span>
        </div>
        <div>
          <span style={labelStyle}>Primary Category</span>
          <span style={valueStyle}>{primaryCategory || <span style={notSetStyle}>Not set</span>}</span>
        </div>
      </div>

      {/* Row 2: Phone | Website */}
      <div className="grid grid-cols-2 gap-x-8">
        <div>
          <span style={labelStyle}>Phone</span>
          <span style={valueStyle}>{phone || <span style={notSetStyle}>Not set</span>}</span>
        </div>
        <div>
          <span style={labelStyle}>Website</span>
          <span style={valueStyle}>
            {website
              ? <a href={website} target="_blank" rel="noreferrer" style={{ color: '#4f8ef7', textDecoration: 'none' }}>{website}</a>
              : <span style={notSetStyle}>Not set</span>
            }
          </span>
        </div>
      </div>

      {/* Physical address (storefront businesses) */}
      {template.showAddress && (
        <div>
          <span style={labelStyle}>Address</span>
          <span style={valueStyle}>{address || <span style={notSetStyle}>Not set</span>}</span>
        </div>
      )}

      {/* Description */}
      <div>
        <span style={labelStyle}>Description</span>
        <span style={{ ...valueStyle, color: description ? undefined : 'rgba(240,244,255,0.25)', fontStyle: description ? 'normal' : 'italic' }}>
          {description || 'No description added yet'}
        </span>
      </div>

      {/* Hours */}
      <div className="grid grid-cols-2 gap-x-8">
        <div>
          <span style={labelStyle}>
            {template.hoursLabel}{' '}
            <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, opacity: 0.5 }}>
              (editable once GBP approved)
            </span>
          </span>
          <span style={valueStyle}>{hoursSummary}</span>
        </div>
        {template.showServiceArea && (
          <div>
            <span style={labelStyle}>{template.key === 'real_estate' ? 'Markets Served' : 'Service Area'}</span>
            <span style={valueStyle}>{serviceArea || <span style={notSetStyle}>Not set</span>}</span>
          </div>
        )}
      </div>

      {/* More hours rows (restaurant, store, doctor) */}
      {moreHoursToShow.length > 0 && (
        <div>
          <span style={{ ...labelStyle, marginBottom: '0.625rem', display: 'block' }}>Additional Hours</span>
          <div className="grid grid-cols-2 gap-3">
            {moreHoursToShow.map((id) => (
              <div key={id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.5rem', padding: '0.625rem 0.75rem' }}>
                <span style={{ ...labelStyle, marginBottom: '0.25rem', display: 'block' }}>{MORE_HOURS_LABELS[id] ?? id}</span>
                <span style={{ fontSize: '0.8125rem', color: 'rgba(240,244,255,0.7)' }}>
                  {summarizeHours(gbp?.moreHours?.[id] ?? null)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attribute grid (restaurant, hotel, store, salon, doctor) */}
      {template.attributes.length > 0 && (
        <div>
          <span style={{ ...labelStyle, marginBottom: '0.625rem', display: 'block' }}>Service Options</span>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(template.attributes.length, 3)}, 1fr)`,
              gap: '0.5rem',
            }}
          >
            {template.attributes.map((attr) => (
              <AttributeBadge key={attr.id} label={attr.label} value={undefined} />
            ))}
          </div>
          <p style={{ fontSize: '0.6875rem', color: 'rgba(240,244,255,0.25)', marginTop: '0.5rem', fontStyle: 'italic' }}>
            Attribute data loads from your GBP once API write scope is approved.
          </p>
        </div>
      )}

      {/* Extra fields: URL rows (menu URL, booking URL etc.) */}
      {template.extraFields.filter((f) => f.type === 'url').length > 0 && (
        <div className="grid grid-cols-2 gap-x-8">
          {template.extraFields.filter((f) => f.type === 'url').map((field) => (
            <div key={field.id}>
              <span style={labelStyle}>{field.label}</span>
              <span style={valueStyle}>
                {localExtras[field.id]
                  ? <a href={localExtras[field.id]} target="_blank" rel="noreferrer" style={{ color: '#4f8ef7', textDecoration: 'none' }}>{localExtras[field.id]}</a>
                  : <span style={notSetStyle}>Not set</span>
                }
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Hotel: check-in / check-out chips */}
      {template.key === 'hotel' && (
        <div className="grid grid-cols-2 gap-x-8">
          {template.extraFields.filter((f) => f.type === 'time').map((field) => (
            <div key={field.id}>
              <span style={labelStyle}>{field.label}</span>
              <span style={valueStyle}>{localExtras[field.id] || <span style={notSetStyle}>Not set</span>}</span>
            </div>
          ))}
        </div>
      )}

      {/* HayVista AI Settings */}
      <div style={dividerStyle}>
        <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(240,244,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
          HayVista AI Settings
        </p>
        <div className="grid grid-cols-2 gap-x-8">
          <div>
            <span style={labelStyle}>Posts per week</span>
            <span style={valueStyle}>{client?.posts_per_week ?? 1}×</span>
          </div>
          <div>
            <span style={labelStyle}>Post Tone</span>
            <span style={valueStyle}>{client?.tone || 'Friendly'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Props and main component ─────────────────────────────────────────────────

const TONE_OPTIONS = ['Friendly', 'Professional', 'Bilingual'];
const FREQ_OPTIONS = [1, 2, 3, 4];
const CATEGORY_OPTIONS = [
  'General Contractor', 'Handyman', 'Electrician', 'Plumber', 'HVAC',
  'Painter', 'Roofer', 'Landscaper', 'Cleaner',
];
const OTHER_SENTINEL = '__other__';

interface Props {
  client: Client | null;
  ready: boolean;
  onClientUpdated: (client: Client) => void;
}

export default function EditProfileTab({ client, ready, onClientUpdated }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // GBP live data
  const [gbpData, setGbpData] = useState<GbpProfileData | null>(null);
  const [gbpLoading, setGbpLoading] = useState(false);

  // Local editable fields
  const [businessName, setBusinessName] = useState(client?.business_name || '');
  const [category, setCategory] = useState(() => {
    const bt = client?.business_type || 'General Contractor';
    return CATEGORY_OPTIONS.includes(bt) ? bt : OTHER_SENTINEL;
  });
  const [customCategory, setCustomCategory] = useState(() => {
    const bt = client?.business_type || '';
    return CATEGORY_OPTIONS.includes(bt) ? '' : bt;
  });
  const [tone, setTone] = useState(client?.tone || 'Friendly');
  const [postsPerWeek, setPostsPerWeek] = useState(client?.posts_per_week || 1);
  const [phone, setPhone] = useState(client?.whatsapp || '');
  const [website, setWebsite] = useState(client?.website || '');
  const [serviceArea, setServiceArea] = useState(client?.city || '');
  const [description, setDescription] = useState('');

  // Template-specific extras (stored locally; keyed by ExtraField.id)
  const [extras, setExtras] = useState<Record<string, string>>({});

  const MAX_DESC = 750;

  // Sync local state when client prop changes
  useEffect(() => {
    if (!client) return;
    setBusinessName(client.business_name || '');
    const bt = client.business_type || 'General Contractor';
    if (CATEGORY_OPTIONS.includes(bt)) {
      setCategory(bt);
      setCustomCategory('');
    } else {
      setCategory(OTHER_SENTINEL);
      setCustomCategory(bt);
    }
    setTone(client.tone || 'Friendly');
    setPostsPerWeek(client.posts_per_week || 1);
    setPhone(client.whatsapp || '');
    setWebsite(client.website || '');
    setServiceArea(client.city || '');
  }, [
    client?.business_name, client?.business_type, client?.tone,
    client?.posts_per_week, client?.whatsapp, client?.website, client?.city,
  ]);

  // Fetch real GBP data when GBP connection is ready
  useEffect(() => {
    if (!ready) return;
    setGbpLoading(true);
    fetch('/api/gbp-profile', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setGbpData(d);
      })
      .catch(() => {}) // graceful fallback to local data
      .finally(() => setGbpLoading(false));
  }, [ready]);

  // Resolve effective category: use free-text when "Other" is selected
  const effectiveCategory = category === OTHER_SENTINEL ? customCategory : category;

  // Pick template: prefer live GBP category, fall back to local business_type
  const template: ProfileTemplate = resolveTemplate(
    gbpData?.primaryCategory || effectiveCategory || '',
  );

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
          business_type: category === OTHER_SENTINEL ? customCategory : category,
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

  return (
    <div>
    <div style={glassCard}>
      {/* Header */}
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

      {/* Template label chip */}
      {!editing && (
        <div className="mb-5" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              background: 'rgba(79,142,247,0.10)',
              border: '1px solid rgba(79,142,247,0.22)',
              color: '#4f8ef7',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {template.key.replace('_', ' ')}
          </span>
          {gbpLoading && (
            <span style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.35)' }}>
              Loading from Google…
            </span>
          )}
        </div>
      )}

      {/* Body */}
      {!editing ? (
        gbpLoading
          ? <ProfileSkeleton template={template} />
          : <ProfileView gbp={gbpData} client={client} template={template} localExtras={extras} />
      ) : (
        <EditForm
          businessName={businessName} setBusinessName={setBusinessName}
          category={category} setCategory={setCategory}
          customCategory={customCategory} setCustomCategory={setCustomCategory}
          phone={phone} setPhone={setPhone}
          website={website} setWebsite={setWebsite}
          serviceArea={serviceArea} setServiceArea={setServiceArea}
          description={description} setDescription={setDescription}
          tone={tone} setTone={setTone}
          postsPerWeek={postsPerWeek} setPostsPerWeek={setPostsPerWeek}
          template={template}
          extras={extras} setExtras={setExtras}
          maxDesc={MAX_DESC}
        />
      )}
    </div>
    <SocialLinksSection ready={ready} />
    </div>
  );
}

// ─── Edit form ────────────────────────────────────────────────────────────────

interface EditFormProps {
  businessName: string; setBusinessName: (v: string) => void;
  category: string; setCategory: (v: string) => void;
  customCategory: string; setCustomCategory: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  website: string; setWebsite: (v: string) => void;
  serviceArea: string; setServiceArea: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  tone: string; setTone: (v: string) => void;
  postsPerWeek: number; setPostsPerWeek: (v: number) => void;
  template: ProfileTemplate;
  extras: Record<string, string>; setExtras: (v: Record<string, string>) => void;
  maxDesc: number;
}

function EditForm({
  businessName, setBusinessName,
  category, setCategory,
  customCategory, setCustomCategory,
  phone, setPhone,
  website, setWebsite,
  serviceArea, setServiceArea,
  description, setDescription,
  tone, setTone,
  postsPerWeek, setPostsPerWeek,
  template, extras, setExtras, maxDesc,
}: EditFormProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Base fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label style={labelStyle}>Business Name</label>
          <input style={inputStyle} value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Your business name" />
        </div>
        <div>
          <label style={labelStyle}>Primary Category</label>
          <select
            style={{ ...inputStyle, appearance: 'none' as const }}
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              if (e.target.value !== OTHER_SENTINEL) setCustomCategory('');
            }}
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt} value={opt} style={{ background: '#080d1a' }}>{opt}</option>
            ))}
            <option value={OTHER_SENTINEL} style={{ background: '#080d1a' }}>Other — describe below</option>
          </select>
          {category === OTHER_SENTINEL && (
            <input
              style={{ ...inputStyle, marginTop: '0.5rem' }}
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="e.g. Dog walker, Mobile ice cream seller…"
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
          )}
        </div>
        <div>
          <label style={labelStyle}>Phone</label>
          <input style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 0000" type="tel" />
        </div>
        <div>
          <label style={labelStyle}>Website</label>
          <input style={inputStyle} value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="yourbusiness.com" type="url" />
        </div>
        {template.showServiceArea && (
          <div className="col-span-2">
            <label style={labelStyle}>{template.key === 'real_estate' ? 'Markets Served' : 'Service Area'}</label>
            <input style={inputStyle} value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} placeholder="City or service area" />
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label style={labelStyle}>Description</label>
        <textarea
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'white', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem', width: '100%', outline: 'none', resize: 'vertical', minHeight: '100px' }}
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, maxDesc))}
          placeholder="Describe your business…"
          rows={4}
        />
        <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'rgba(240,244,255,0.5)', marginTop: '0.25rem' }}>
          {description.length} / {maxDesc}
        </div>
      </div>

      {/* Template extra fields (booking URL, menu URL, check-in/out times) */}
      {template.extraFields.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {template.extraFields.map((field) => (
            <div key={field.id}>
              <label style={labelStyle}>{field.label}</label>
              <input
                style={inputStyle}
                type={field.type === 'url' ? 'url' : 'time'}
                value={extras[field.id] || ''}
                onChange={(e) => setExtras({ ...extras, [field.id]: e.target.value })}
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </div>
      )}

      {/* Hours read-only notice */}
      <div>
        <label style={{ ...labelStyle, marginBottom: '0.25rem' }}>
          {template.hoursLabel}{' '}
          <span style={{ fontWeight: 400, color: 'rgba(240,244,255,0.35)', fontSize: '0.7rem', textTransform: 'none', letterSpacing: 0 }}>
            (editing available once GBP write scope is approved)
          </span>
        </label>
      </div>

      {/* HayVista AI Settings */}
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
                    padding: '0.375rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 500,
                    cursor: 'pointer', border: '1px solid',
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
                    cursor: 'pointer', transition: 'all 0.15s',
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
  );
}
