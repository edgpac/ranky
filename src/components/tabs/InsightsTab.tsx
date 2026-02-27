import { useEffect, useState } from 'react';

interface MetricValue {
  metric: string;
  totalValue?: { metricOption: string; value: string };
}

interface GscRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface InsightsData {
  locationMetrics?: Array<{ metricValues: MetricValue[] }>;
}

interface Props {
  businessName: string;
  ready: boolean;
}

function extractMetric(insights: InsightsData | null, metric: string): number {
  if (!insights?.locationMetrics?.[0]?.metricValues) return 0;
  const found = insights.locationMetrics[0].metricValues.find((m) => m.metric === metric);
  return parseInt(found?.totalValue?.value || '0', 10);
}

const STAT_CARDS = [
  { metric: 'VIEWS_SEARCH',              label: 'Search views',      icon: '🔍', color: 'bg-blue-50 border-blue-100' },
  { metric: 'VIEWS_MAPS',                label: 'Maps views',        icon: '🗺️', color: 'bg-indigo-50 border-indigo-100' },
  { metric: 'ACTIONS_WEBSITE',           label: 'Website clicks',    icon: '🖱️', color: 'bg-purple-50 border-purple-100' },
  { metric: 'ACTIONS_PHONE',             label: 'Phone calls',       icon: '📞', color: 'bg-green-50 border-green-100' },
  { metric: 'ACTIONS_DRIVING_DIRECTIONS',label: 'Directions',        icon: '📍', color: 'bg-yellow-50 border-yellow-100' },
  { metric: 'QUERIES_DIRECT',            label: 'Direct searches',   icon: '🎯', color: 'bg-orange-50 border-orange-100' },
  { metric: 'QUERIES_INDIRECT',          label: 'Discovery searches',icon: '🌐', color: 'bg-teal-50 border-teal-100' },
  { metric: 'PHOTOS_VIEWS_MERCHANT',     label: 'Photo views',       icon: '📸', color: 'bg-pink-50 border-pink-100' },
];

export default function InsightsTab({ businessName, ready }: Props) {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [gscQueries, setGscQueries] = useState<GscRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ready) return;
    fetch('/api/insights', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d.error && !d.gscQueries) throw new Error(d.error);
        setInsights(d.insights || null);
        setGscQueries(d.gscQueries || []);
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

  return (
    <div className="flex flex-col gap-8">
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-xl px-5 py-3">
          GBP insights unavailable ({error}). GSC data below is still live.
        </div>
      )}

      {/* GBP stat cards */}
      {insights && (
        <div>
          <h3 className="text-sm font-bold text-slate-600 mb-3">Google Business Profile — last 28 days</h3>
          <div className="grid grid-cols-4 gap-3">
            {STAT_CARDS.map((card) => (
              <div key={card.metric} className={`rounded-2xl border p-5 ${card.color}`}>
                <span className="text-2xl">{card.icon}</span>
                <p className="text-2xl font-extrabold text-slate-900 mt-2">
                  {extractMetric(insights, card.metric).toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GSC query table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-600">Top Google searches — last 28 days</h3>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-md">via Search Console</span>
        </div>

        {gscQueries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-slate-400 text-sm">
            No Search Console data found. Make sure your site is verified in GSC.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500">Query</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Impressions</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Clicks</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Position</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500">Opportunity</th>
                </tr>
              </thead>
              <tbody>
                {gscQueries.map((row) => {
                  const opportunity = row.impressions > 50 && row.clicks === 0;
                  return (
                    <tr key={row.keys[0]} className="border-b border-gray-50 hover:bg-slate-50/50">
                      <td className="px-5 py-3 text-slate-800 font-medium">{row.keys[0]}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{row.impressions.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{row.clicks}</td>
                      <td className="px-4 py-3 text-right text-slate-600">#{Math.round(row.position)}</td>
                      <td className="px-5 py-3 text-right">
                        {opportunity ? (
                          <span className="text-xs font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded-full">Post target</span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-slate-400 mt-2">"Post target" = high impressions with zero clicks — prime opportunity for a GBP post.</p>
      </div>
    </div>
  );
}
