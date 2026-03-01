import { useEffect, useState } from 'react';
import { useAppT } from '../../contexts/LanguageContext';

interface GbpServiceItem {
  freeFormServiceItem?: {
    category?: string;
    label?: { displayName?: string; description?: string };
  };
  serviceTypeId?: string;
  isOffered?: boolean;
  price?: { currencyCode?: string; units?: string; nanos?: number };
}

interface Service {
  id: number;
  name: string;
  desc: string;
  price: string;
  editing: boolean;
  fromGbp?: boolean;
}

// ─── Mock services (guest / empty state preview) ──────────────────────────────

const MOCK_SERVICES: Service[] = [
  { id: -1, name: 'Property Setup Services',       desc: 'Furniture assembly, TV mounting, ceiling fan installation',                            price: '',          editing: false },
  { id: -2, name: 'Vacation Rental Maintenance',   desc: 'Airbnb and VRBO property maintenance — monthly contracts from $300–$1,500',            price: '',          editing: false },
  { id: -3, name: 'Kitchen Services & Remodeling', desc: 'Complete kitchen services including plumbing, electrical, lighting',                    price: '',          editing: false },
  { id: -4, name: 'Bathroom Services & Remodeling',desc: 'Toilet unclogging and installation, vanity, shower',                                    price: '',          editing: false },
  { id: -5, name: 'Plumbing Services',             desc: '24/7 emergency plumbing with 30-minute response',                                      price: 'From $1,100', editing: false },
  { id: -6, name: 'Electrical Services',           desc: 'Licensed electricians for outlets, lighting, ceiling fans, panel upgrades',             price: 'From $1,100', editing: false },
  { id: -7, name: 'Drain Cleaning & Unclogging',   desc: 'Professional drain cleaning for clogged sinks, tubs, toilets',                         price: 'From $1,100', editing: false },
  { id: -8, name: 'Furniture Assembly & TV Mounting', desc: 'Expert assembly (IKEA, Wayfair, Amazon) and professional TV mounting',              price: 'From $1,100', editing: false },
  { id: -9, name: 'General Handyman Services',     desc: 'Comprehensive handyman services for residential and commercial properties',             price: 'From $1,100', editing: false },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: 'white',
  borderRadius: '0.5rem',
  height: '2.25rem',
  padding: '0 0.75rem',
  fontSize: '0.875rem',
  outline: 'none',
  fontFamily: 'inherit',
};

const btnPrimary: React.CSSProperties = {
  background: '#4f8ef7',
  color: 'white',
  borderRadius: '0.5rem',
  padding: '0.4rem 0.875rem',
  fontSize: '0.8125rem',
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const btnGhost: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.12)',
  color: 'rgba(240,244,255,0.6)',
  borderRadius: '0.4rem',
  padding: '0.25rem 0.625rem',
  fontSize: '0.75rem',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const btnDelete: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(248,113,113,0.18)',
  color: 'rgba(248,113,113,0.65)',
  borderRadius: '0.4rem',
  width: '1.875rem',
  height: '1.875rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.75rem',
  cursor: 'pointer',
  flexShrink: 0,
  fontFamily: 'inherit',
};

let nextId = 200;

function formatGbpPrice(item: GbpServiceItem): string {
  const p = item.price;
  if (!p) return '';
  const units = parseInt(p.units || '0', 10);
  if (!units) return '';
  return `$${units.toLocaleString()}`;
}

function mapGbpServices(items: GbpServiceItem[]): Service[] {
  return items
    .filter((s) => s.freeFormServiceItem?.label?.displayName)
    .map((s, i) => ({
      id: i + 1,
      name: s.freeFormServiceItem!.label!.displayName!,
      desc: s.freeFormServiceItem?.label?.description || '',
      price: formatGbpPrice(s),
      editing: false,
      fromGbp: true,
    }));
}

// ─── Service card ─────────────────────────────────────────────────────────────

function ServiceCard({
  svc,
  draft,
  isMock,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onDraftChange,
}: {
  svc: Service;
  draft: { name: string; desc: string; price: string } | undefined;
  isMock: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onDraftChange: (field: 'name' | 'desc' | 'price', value: string) => void;
}) {
  const ts = useAppT().services;
  if (svc.editing) {
    return (
      <div
        style={{
          background: 'rgba(79,142,247,0.05)',
          border: '1px solid rgba(79,142,247,0.28)',
          borderRadius: '0.875rem',
          padding: '0.875rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.625rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.625rem' }}>
          <input
            style={{ ...inputStyle, flex: 2 }}
            placeholder={ts.namePlaceholder}
            value={draft?.name ?? svc.name}
            onChange={(e) => onDraftChange('name', e.target.value)}
            autoFocus
          />
          <input
            style={{ ...inputStyle, flex: 1 }}
            placeholder={ts.pricePlaceholder}
            value={draft?.price ?? svc.price}
            onChange={(e) => onDraftChange('price', e.target.value)}
          />
        </div>
        <input
          style={{ ...inputStyle, width: '100%' }}
          placeholder={ts.descPlaceholder}
          value={draft?.desc ?? svc.desc}
          onChange={(e) => onDraftChange('desc', e.target.value)}
        />
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button style={btnGhost} onClick={onCancel}>{ts.cancel}</button>
          <button style={btnPrimary} onClick={onSave}>{ts.save}</button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '0.75rem',
        padding: '0.75rem 0.875rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.875rem',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.13)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
    >
      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(240,244,255,0.92)', lineHeight: 1.3 }}>
          {svc.name}
        </p>
        {svc.desc && (
          <p
            style={{
              fontSize: '0.8125rem',
              color: 'rgba(240,244,255,0.45)',
              marginTop: '0.15rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {svc.desc}
          </p>
        )}
      </div>

      {/* Price + actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        {svc.price && (
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#34d399',
              background: 'rgba(52,211,153,0.08)',
              border: '1px solid rgba(52,211,153,0.18)',
              borderRadius: '9999px',
              padding: '0.15rem 0.55rem',
              whiteSpace: 'nowrap',
            }}
          >
            {svc.price}
          </span>
        )}
        {!isMock && <button style={btnGhost} onClick={onEdit}>{ts.edit}</button>}
        {!isMock && (
          <button style={btnDelete} onClick={onDelete} title="Remove service">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export default function ServicesTab({ ready }: { ready: boolean }) {
  const ts = useAppT().services;
  const [services, setServices] = useState<Service[]>(MOCK_SERVICES);
  const [drafts, setDrafts] = useState<Record<number, { name: string; desc: string; price: string }>>({});
  const [loading, setLoading] = useState(false);
  const [isMockMode, setIsMockMode] = useState(true);

  useEffect(() => {
    if (!ready) return;
    setLoading(true);
    fetch('/api/services', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        const items: GbpServiceItem[] = d.services || [];
        if (items.length > 0) {
          setServices(mapGbpServices(items));
          setIsMockMode(false);
        } else {
          setServices([]);
          setIsMockMode(false);
        }
      })
      .catch(() => { setIsMockMode(false); })
      .finally(() => setLoading(false));
  }, [ready]);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div
        className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#4f8ef7', borderTopColor: 'transparent' }}
      />
    </div>
  );

  const startEdit = (svc: Service) => {
    setDrafts((d) => ({ ...d, [svc.id]: { name: svc.name, desc: svc.desc, price: svc.price } }));
    setServices((prev) => prev.map((s) => s.id === svc.id ? { ...s, editing: true } : s));
  };

  const saveEdit = (id: number) => {
    const draft = drafts[id];
    if (!draft) return;
    setServices((prev) =>
      prev.map((s) => s.id === id ? { ...s, name: draft.name, desc: draft.desc, price: draft.price, editing: false } : s)
    );
  };

  const cancelEdit = (id: number) => {
    setServices((prev) => {
      const svc = prev.find((s) => s.id === id);
      if (svc && svc.name === '') return prev.filter((s) => s.id !== id);
      return prev.map((s) => s.id === id ? { ...s, editing: false } : s);
    });
  };

  const deleteService = (id: number) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const addService = () => {
    const id = nextId++;
    setServices((prev) => [...prev, { id, name: '', desc: '', price: '', editing: true }]);
    setDrafts((d) => ({ ...d, [id]: { name: '', desc: '', price: '' } }));
  };

  const updateDraft = (id: number, field: 'name' | 'desc' | 'price', value: string) => {
    setDrafts((d) => ({ ...d, [id]: { ...d[id], [field]: value } }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'rgba(240,244,255,0.95)' }}>{ts.heading}</h2>
        {!isMockMode && (
          <button style={btnPrimary} onClick={addService}>{ts.addService}</button>
        )}
      </div>

      {/* Subtitle */}
      <p style={{ fontSize: '0.8125rem', color: 'rgba(240,244,255,0.38)', lineHeight: 1.5, marginTop: '-0.25rem' }}>
        {isMockMode ? ts.subtitleMock : ts.subtitleReal}
      </p>

      {/* Service list */}
      {services.length === 0 && !isMockMode && (
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '0.875rem',
            padding: '3rem',
            textAlign: 'center',
          }}
        >
          <p style={{ color: 'rgba(240,244,255,0.32)', fontSize: '0.875rem' }}>
            {ts.noServices}
          </p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {services.map((svc) => (
          <ServiceCard
            key={svc.id}
            svc={svc}
            draft={drafts[svc.id]}
            isMock={isMockMode}
            onEdit={() => startEdit(svc)}
            onSave={() => saveEdit(svc.id)}
            onCancel={() => cancelEdit(svc.id)}
            onDelete={() => deleteService(svc.id)}
            onDraftChange={(field, value) => updateDraft(svc.id, field, value)}
          />
        ))}
      </div>
    </div>
  );
}
