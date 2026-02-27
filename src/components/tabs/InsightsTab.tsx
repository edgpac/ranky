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
  { metric: 'VIEWS_SEARCH',               label: 'Search views',       icon: '🔍' },
  { metric: 'VIEWS_MAPS',                 label: 'Maps views',         icon: '🗺️' },
  { metric: 'ACTIONS_WEBSITE',            label: 'Website clicks',     icon: '🖱️' },
  { metric: 'ACTIONS_PHONE',              label: 'Phone calls',        icon: '📞' },
  { metric: 'ACTIONS_DRIVING_DIRECTIONS', label: 'Directions',         icon: '📍' },
  { metric: 'QUERIES_DIRECT',             label: 'Direct searches',    icon: '🎯' },
  { metric: 'QUERIES_INDIRECT',           label: 'Discovery searches', icon: '🌐' },
  { metric: 'PHOTOS_VIEWS_MERCHANT',      label: 'Photo views',        icon: '📸' },
];

const card: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
};

export default function InsightsTab({ ready }: Props) {
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

  if (!ready || loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div className="flex flex-col gap-7">
      {error && (
        <div className="rounded-xl px-5 py-3 text-sm" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: 'var(--warning)' }}>
          GBP insights unavailable ({error}). GSC data below is still live.
        </div>
      )}

      {/* GBP stat cards */}
      {insights && (
        <div>
          <h3 className="text-sm font-bold mb-3" style={{ color: 'rgba(240,244,255,0.6)' }}>Google Business Profile — last 28 days</h3>
          <div className="grid grid-cols-4 gap-3">
            {STAT_CARDS.map((c) => (
              <div key={c.metric} className="rounded-2xl p-5 text-center" style={card}>
                <span className="text-2xl">{c.icon}</span>
                <p className="text-2xl font-extrabold mt-2" style={{ color: 'var(--text)' }}>
                  {extractMetric(insights, c.metric).toLocaleString()}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{c.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GSC query table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold" style={{ color: 'rgba(240,244,255,0.6)' }}>Top Google searches — last 28 days</h3>
          <span className="text-xs px-2 py-1 rounded-md" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>via Search Console</span>
        </div>

        {gscQueries.length === 0 ? (
          <div className="rounded-2xl p-8 text-center text-sm" style={card}>
            <span style={{ color: 'var(--text-muted)' }}>No Search Console data found. Make sure your site is verified in GSC.</span>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={card}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                  <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Query</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Impressions</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Clicks</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Position</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Opportunity</th>
                </tr>
              </thead>
              <tbody>
                {gscQueries.map((row) => {
                  const opportunity = row.impressions > 50 && row.clicks === 0;
                  return (
                    <tr key={row.keys[0]} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td className="px-5 py-3 font-medium" style={{ color: 'var(--text)' }}>{row.keys[0]}</td>
                      <td className="px-4 py-3 text-right" style={{ color: 'rgba(240,244,255,0.7)' }}>{row.impressions.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right" style={{ color: 'rgba(240,244,255,0.7)' }}>{row.clicks}</td>
                      <td className="px-4 py-3 text-right" style={{ color: 'rgba(240,244,255,0.7)' }}>#{Math.round(row.position)}</td>
                      <td className="px-5 py-3 text-right">
                        {opportunity ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(79,142,247,0.15)', color: 'var(--accent)' }}>Post target</span>
                        ) : (
                          <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>"Post target" = high impressions with zero clicks — prime opportunity for a GBP post.</p>
      </div>
    </div>
  );
}
