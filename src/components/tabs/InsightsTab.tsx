import { useEffect, useState } from 'react';

interface MetricValue {
  metric: string;
  totalValue?: { metricOption: string; value: string };
}

interface InsightsData {
  locationMetrics?: Array<{ metricValues: MetricValue[] }>;
}

interface Props {
  businessName: string;
  ready: boolean;
}

type Period = '7d' | '28d' | '90d';

const PERIOD_LABELS: Record<Period, string> = {
  '7d': 'Last 7 days',
  '28d': 'Last 28 days',
  '90d': 'Last 90 days',
};

const MONTHS = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
const BAR_VALUES = [45, 62, 78, 120, 89, 95];
const MAX_BAR_HEIGHT = 120;

const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
  backdropFilter: 'blur(8px)',
  borderRadius: '1rem',
  padding: '1.25rem',
};

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

function extractMetric(insights: InsightsData | null, metric: string): number {
  if (!insights?.locationMetrics?.[0]?.metricValues) return 0;
  const found = insights.locationMetrics[0].metricValues.find((m) => m.metric === metric);
  return parseInt(found?.totalValue?.value || '0', 10);
}

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
}

function MetricCard({ label, value, trend, trendUp }: MetricCardProps) {
  return (
    <div style={glassCard}>
      <p style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.5)', marginBottom: '0.5rem', fontWeight: 500 }}>{label}</p>
      <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'rgba(240,244,255,0.95)', lineHeight: 1 }}>
        {value}
      </p>
      {trend && (
        <span
          style={{
            display: 'inline-block',
            marginTop: '0.5rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '0.125rem 0.5rem',
            borderRadius: '9999px',
            background: trendUp ? 'rgba(52,211,153,0.12)' : 'rgba(239,68,68,0.12)',
            color: trendUp ? '#34d399' : '#f87171',
            border: `1px solid ${trendUp ? 'rgba(52,211,153,0.25)' : 'rgba(239,68,68,0.25)'}`,
          }}
        >
          {trendUp ? '↑' : '↓'} {trend}
        </span>
      )}
    </div>
  );
}

export default function InsightsTab({ ready }: Props) {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('28d');

  useEffect(() => {
    if (!ready) { setLoading(false); return; }
    fetch('/api/insights', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d.insights) setInsights(d.insights);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ready]);

  if (!ready && !loading) {
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
          Connect your Google Business Profile to see performance data.
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

  // Use API data if available, else mock
  const interactions = insights
    ? extractMetric(insights, 'VIEWS_SEARCH') + extractMetric(insights, 'VIEWS_MAPS')
    : 180;

  const maxVal = Math.max(...BAR_VALUES);

  return (
    <div className="flex flex-col gap-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'rgba(240,244,255,0.95)' }}>Performance</h2>
        <select
          style={{ ...inputStyle, width: 'auto', cursor: 'pointer', appearance: 'none' as const }}
          value={period}
          onChange={(e) => setPeriod(e.target.value as Period)}
        >
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <option key={p} value={p} style={{ background: '#080d1a' }}>{PERIOD_LABELS[p]}</option>
          ))}
        </select>
      </div>

      {/* 4 metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <MetricCard label="Interactions" value={interactions.toLocaleString()} trend="+12%" trendUp />
        <MetricCard label="Calls" value="—" />
        <MetricCard label="Directions" value="—" />
        <MetricCard label="Website Clicks" value="—" />
      </div>

      {/* Bar chart */}
      <div style={glassCard}>
        <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'rgba(240,244,255,0.8)', marginBottom: '1.5rem' }}>
          Monthly Searches
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '1rem',
            height: `${MAX_BAR_HEIGHT + 32}px`,
          }}
        >
          {MONTHS.map((month, i) => {
            const barH = Math.round((BAR_VALUES[i] / maxVal) * MAX_BAR_HEIGHT);
            return (
              <div
                key={month}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}
              >
                <span style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.55)', fontWeight: 500 }}>
                  {BAR_VALUES[i]}
                </span>
                <div
                  style={{
                    width: '100%',
                    height: `${barH}px`,
                    borderRadius: '0.375rem 0.375rem 0 0',
                    background: 'linear-gradient(180deg, #4f8ef7 0%, #7c5af7 100%)',
                    transition: 'height 0.4s ease',
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.45)' }}>{month}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
