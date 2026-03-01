import { useEffect, useState } from 'react';

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

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: 'white',
  borderRadius: '0.5rem',
  height: '2.25rem',
  padding: '0 0.75rem',
  fontSize: '0.875rem',
  outline: 'none',
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
  fontSize: '0.8125rem',
  cursor: 'pointer',
};

const btnDanger: React.CSSProperties = {
  background: 'rgba(239,68,68,0.15)',
  border: '1px solid rgba(239,68,68,0.3)',
  color: '#f87171',
  borderRadius: '0.5rem',
  padding: '0.375rem 0.75rem',
  fontSize: '0.8125rem',
  cursor: 'pointer',
};

let nextId = 200;

function formatGbpPrice(item: GbpServiceItem): string {
  const p = item.price;
  if (!p) return '';
  const units = parseInt(p.units || '0', 10);
  if (!units) return '';
  return `$${units}/${p.currencyCode === 'USD' ? 'hr' : p.currencyCode || 'hr'}`;
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

function ServiceCard({
  svc,
  draft,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onDraftChange,
}: {
  svc: Service;
  draft: { name: string; desc: string; price: string } | undefined;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onDraftChange: (field: 'name' | 'desc' | 'price', value: string) => void;
}) {
  if (svc.editing) {
    return (
      <div
        style={{
          background: 'rgba(79,142,247,0.05)',
          border: '1px solid rgba(79,142,247,0.30)',
          backdropFilter: 'blur(8px)',
          borderRadius: '0.875rem',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <div className="flex gap-3">
          <input
            style={{ ...inputStyle, flex: 2, width: '100%' }}
            placeholder="Service name"
            value={draft?.name ?? svc.name}
            onChange={(e) => onDraftChange('name', e.target.value)}
            autoFocus
          />
          <input
            style={{ ...inputStyle, flex: 1, width: '100%' }}
            placeholder="Price (e.g. $85/hr)"
            value={draft?.price ?? svc.price}
            onChange={(e) => onDraftChange('price', e.target.value)}
          />
        </div>
        <input
          style={{ ...inputStyle, width: '100%' }}
          placeholder="Short description"
          value={draft?.desc ?? svc.desc}
          onChange={(e) => onDraftChange('desc', e.target.value)}
        />
        <div className="flex gap-2 justify-end">
          <button style={btnGhost} onClick={onCancel}>Cancel</button>
          <button style={btnPrimary} onClick={onSave}>Save to GBP</button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.10)',
        backdropFilter: 'blur(8px)',
        borderRadius: '0.875rem',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        transition: 'background 0.18s, border-color 0.18s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.08)';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.18)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.10)';
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(240,244,255,0.95)', marginBottom: '0.2rem' }}>
          {svc.name}
        </div>
        {svc.desc && (
          <div
            style={{
              fontSize: '0.8125rem',
              color: 'rgba(240,244,255,0.5)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {svc.desc}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2.5 flex-shrink-0">
        {svc.price && (
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#34d399' }}>{svc.price}</span>
        )}
        <button style={btnGhost} onClick={onEdit}>Edit</button>
        <button style={btnDanger} onClick={onDelete}>✕</button>
      </div>
    </div>
  );
}

export default function ServicesTab({ ready }: { ready: boolean }) {
  const [services, setServices] = useState<Service[]>([]);
  const [drafts, setDrafts] = useState<Record<number, { name: string; desc: string; price: string }>>({});
  const [loading, setLoading] = useState(true);
  const [fromGbp, setFromGbp] = useState(false);

  useEffect(() => {
    if (!ready) { setLoading(false); return; }
    fetch('/api/services', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        const items: GbpServiceItem[] = d.services || [];
        if (items.length > 0) {
          setServices(mapGbpServices(items));
          setFromGbp(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ready]);

  if (!ready) {
    return (
      <div
        style={{
          border: '2px dashed rgba(255,255,255,0.15)',
          borderRadius: '1rem',
          padding: '3rem',
          textAlign: 'center',
        }}
      >
        <p style={{ color: 'rgba(240,244,255,0.5)', fontSize: '0.875rem' }}>GBP not connected</p>
        <p style={{ color: 'rgba(240,244,255,0.35)', fontSize: '0.8125rem', marginTop: '0.5rem' }}>
          Connect your Google Business Profile to manage services.
        </p>
      </div>
    );
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#4f8ef7', borderTopColor: 'transparent' }} />
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
    <div className="flex flex-col gap-4">
      <p style={{ fontSize: '0.8125rem', color: 'rgba(232,238,255,0.45)' }}>
        Keep your service listings up to date on Google Business Profile so customers always see what you offer.
      </p>

      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'rgba(240,244,255,0.95)' }}>
            Services{' '}
            <span style={{ color: 'rgba(240,244,255,0.4)', fontWeight: 400, fontSize: '0.875rem' }}>
              ({services.length})
            </span>
          </h2>
          {fromGbp && (
            <p style={{ fontSize: '0.75rem', color: 'rgba(52,211,153,0.8)', marginTop: '0.2rem' }}>
              Loaded from Google Business Profile
            </p>
          )}
        </div>
        <button style={btnPrimary} onClick={addService}>+ Add Service</button>
      </div>

      {services.length === 0 && (
        <div
          style={{
            border: '2px dashed rgba(255,255,255,0.12)',
            borderRadius: '1rem',
            padding: '3rem',
            textAlign: 'center',
          }}
        >
          <p style={{ color: 'rgba(240,244,255,0.4)', fontSize: '0.875rem' }}>
            No services on your GBP yet. Click "+ Add Service" to get started.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {services.map((svc) => (
          <ServiceCard
            key={svc.id}
            svc={svc}
            draft={drafts[svc.id]}
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
