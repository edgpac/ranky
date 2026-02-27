import { useEffect, useState } from 'react';

interface ServiceItem {
  structuredServiceItem?: {
    serviceTypeId: string;
    description?: string;
  };
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

export default function ServicesTab({ ready }: { ready: boolean }) {
  const [info, setInfo] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ready) return;
    fetch('/api/services', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setInfo(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [ready]);

  if (!ready) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-9 h-9 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">Pulling your business data from Google</p>
        <p className="text-xs text-slate-400 mt-1">Connecting to your Business Profile — this only takes a moment on first load.</p>
      </div>
    </div>
  );

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-5 py-4">{error}</div>;
  if (!info) return null;

  const allCategories = [
    info.categories?.primaryCategory?.displayName,
    ...(info.categories?.additionalCategories?.map((c) => c.displayName) || []),
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-8">

      {/* Basic info */}
      <div className="grid grid-cols-3 gap-4">
        {info.website && (
          <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
            <p className="text-xs font-semibold text-slate-500 mb-1">Website</p>
            <a href={info.website} target="_blank" rel="noopener noreferrer" className="text-sm text-brand hover:underline break-all">{info.website}</a>
          </div>
        )}
        {info.phone && (
          <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
            <p className="text-xs font-semibold text-slate-500 mb-1">Phone</p>
            <p className="text-sm text-slate-800 font-medium">{info.phone}</p>
          </div>
        )}
        {allCategories.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
            <p className="text-xs font-semibold text-slate-500 mb-1">GBP categories</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {allCategories.map((cat) => (
                <span key={cat} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{cat}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Services list */}
      <div>
        <h3 className="text-sm font-bold text-slate-600 mb-3">Services listed on Google ({info.services.length})</h3>
        {info.services.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-slate-400 text-sm">
            No services found. Add them in your Google Business Profile dashboard.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {info.services.map((s, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex flex-col gap-0.5">
                <p className="text-sm font-semibold text-slate-800 capitalize">{getServiceName(s)}</p>
                {getServiceDesc(s) && <p className="text-xs text-slate-400">{getServiceDesc(s)}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hours */}
      {info.hours?.periods && (
        <div>
          <h3 className="text-sm font-bold text-slate-600 mb-3">Business hours</h3>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {DAY_LABELS.map((day, idx) => {
                  const period = info.hours.periods.find((p: any) => p.openDay === day.toUpperCase());
                  return (
                    <tr key={day} className={idx < DAY_LABELS.length - 1 ? 'border-b border-gray-50' : ''}>
                      <td className="px-5 py-3 font-medium text-slate-700 w-32">{day}</td>
                      <td className="px-5 py-3 text-slate-500">
                        {period
                          ? `${period.openTime?.hours ?? 0}:${String(period.openTime?.minutes ?? 0).padStart(2, '0')} – ${period.closeTime?.hours ?? 0}:${String(period.closeTime?.minutes ?? 0).padStart(2, '0')}`
                          : <span className="text-slate-300">Closed</span>}
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
