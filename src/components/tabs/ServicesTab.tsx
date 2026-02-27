import { useEffect, useState } from 'react';

interface ServiceItem {
  structuredServiceItem?: { serviceTypeId: string; description?: string };
  freeFormServiceItem?: {
    category?: { displayName: string; serviceTypeId: string };
    label?: { displayName: string; languageCode: string; description?: string };
  };
}

interface BusinessInfo {
  services: ServiceItem[];
  categories: { primaryCategory?: { displayName: string }; additionalCategories?: Array<{ displayName: string }> };
  hours: any;
  website: string;
  phone: string;
}

function getServiceName(s: ServiceItem): string {
  return (
    s.freeFormServiceItem?.label?.displayName ||
    s.freeFormServiceItem?.category?.displayName ||
    s.structuredServiceItem?.serviceTypeId?.replace(/_/g, ' ').toLowerCase() ||
    'Unknown service'
  );
}

function getServiceDesc(s: ServiceItem): string {
  return s.freeFormServiceItem?.label?.description || s.structuredServiceItem?.description || '';
}

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const card: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
};

export default function ServicesTab({ ready }: { ready: boolean }) {
  const [info, setInfo] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ready) return;
    fetch('/api/services', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { if (d.error) throw new Error(d.error); setInfo(d); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [ready]);

  if (!ready || loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
    </div>
  );

  if (error) return (
    <div className="rounded-xl px-5 py-4 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)' }}>{error}</div>
  );

  if (!info) return null;

  const allCategories = [
    info.categories?.primaryCategory?.displayName,
    ...(info.categories?.additionalCategories?.map((c) => c.displayName) || []),
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-7">

      {/* Info cards */}
      <div className="grid grid-cols-3 gap-4">
        {info.website && (
          <div className="rounded-2xl px-5 py-4" style={card}>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Website</p>
            <a href={info.website} target="_blank" rel="noopener noreferrer" className="text-sm break-all hover:underline" style={{ color: 'var(--accent)' }}>{info.website}</a>
          </div>
        )}
        {info.phone && (
          <div className="rounded-2xl px-5 py-4" style={card}>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Phone</p>
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{info.phone}</p>
          </div>
        )}
        {allCategories.length > 0 && (
          <div className="rounded-2xl px-5 py-4" style={card}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>GBP categories</p>
            <div className="flex flex-wrap gap-1">
              {allCategories.map((cat) => (
                <span key={cat} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(240,244,255,0.7)' }}>{cat}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Services list */}
      <div>
        <h3 className="text-sm font-bold mb-3" style={{ color: 'rgba(240,244,255,0.6)' }}>Services listed on Google ({info.services.length})</h3>
        {info.services.length === 0 ? (
          <div className="rounded-2xl p-8 text-center text-sm" style={card}>
            <span style={{ color: 'var(--text-muted)' }}>No services found. Add them in your Google Business Profile dashboard.</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {info.services.map((s, i) => (
              <div key={i} className="rounded-xl px-4 py-3 flex flex-col gap-0.5" style={card}>
                <p className="text-sm font-semibold capitalize" style={{ color: 'var(--text)' }}>{getServiceName(s)}</p>
                {getServiceDesc(s) && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{getServiceDesc(s)}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hours */}
      {info.hours?.periods && (
        <div>
          <h3 className="text-sm font-bold mb-3" style={{ color: 'rgba(240,244,255,0.6)' }}>Business hours</h3>
          <div className="rounded-2xl overflow-hidden" style={card}>
            <table className="w-full text-sm">
              <tbody>
                {DAY_LABELS.map((day, idx) => {
                  const period = info.hours.periods.find((p: any) => p.openDay === day.toUpperCase());
                  return (
                    <tr key={day} style={{ borderBottom: idx < DAY_LABELS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                      <td className="px-5 py-3 font-medium w-32" style={{ color: 'var(--text)' }}>{day}</td>
                      <td className="px-5 py-3" style={{ color: 'var(--text-muted)' }}>
                        {period
                          ? `${period.openTime?.hours ?? 0}:${String(period.openTime?.minutes ?? 0).padStart(2, '0')} – ${period.closeTime?.hours ?? 0}:${String(period.closeTime?.minutes ?? 0).padStart(2, '0')}`
                          : <span style={{ color: 'rgba(255,255,255,0.2)' }}>Closed</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
