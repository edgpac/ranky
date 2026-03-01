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

// ─── Mock data (last 6 months ending Feb 2026) ────────────────────────────────

const ALL_MONTHS = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
const ALL_BARS   = [45, 62, 78, 180, 89, 95];
const MOCK_INTERACTIONS = 180;

// ─── Period options ───────────────────────────────────────────────────────────

type PeriodKey = '6m' | '3m' | '1m';

function buildPeriodLabel(monthCount: number): string {
  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth() - monthCount + 1, 1);
  const fmt = (d: Date) => d.toLocaleString('default', { month: 'short', year: 'numeric' });
  return monthCount === 1 ? fmt(end) : `${fmt(start)} \u2013 ${fmt(end)}`;
}

const PERIODS: { key: PeriodKey; months: number }[] = [
  { key: '6m', months: 6 },
  { key: '3m', months: 3 },
  { key: '1m', months: 1 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractMetric(insights: InsightsData | null, metric: string): number {
  if (!insights?.locationMetrics?.[0]?.metricValues) return 0;
  const found = insights.locationMetrics[0].metricValues.find((m) => m.metric === metric);
  return parseInt(found?.totalValue?.value || '0', 10);
}

// ─── Metric card ─────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  subGreen,
}: {
  label: string;
  value: string | number;
  sub?: string;
  subGreen?: boolean;
}) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '0.875rem',
        padding: '1rem 1.125rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.3rem',
      }}
    >
      <p
        style={{
          fontSize: '1.875rem',
          fontWeight: 800,
          color: 'rgba(240,244,255,0.95)',
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontSize: '0.6875rem',
          fontWeight: 700,
          color: 'rgba(240,244,255,0.42)',
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </p>
      {sub && (
        <p
          style={{
            fontSize: '0.6875rem',
            fontWeight: subGreen ? 600 : 400,
            color: subGreen ? '#34d399' : 'rgba(240,244,255,0.32)',
            marginTop: '0.125rem',
          }}
        >
          {subGreen ? '↑ ' : ''}{sub}
        </p>
      )}
    </div>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export default function InsightsTab({ ready }: Props) {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<PeriodKey>('6m');

  useEffect(() => {
    if (!ready) return;
    setLoading(true);
    fetch('/api/insights', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { if (d.insights) setInsights(d.insights); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ready]);

  const activePeriod = PERIODS.find((p) => p.key === period) ?? PERIODS[0];
  const sliceCount = activePeriod.months;
  const chartMonths = ALL_MONTHS.slice(-sliceCount);
  const chartBars = ALL_BARS.slice(-sliceCount);
  const maxBar = Math.max(...chartBars);

  const interactions = insights
    ? extractMetric(insights, 'VIEWS_SEARCH') + extractMetric(insights, 'VIEWS_MAPS')
    : MOCK_INTERACTIONS;

  if (loading) return (
    <div className="flex justify-center py-20">
      <div
        className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#4f8ef7', borderTopColor: 'transparent' }}
      />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'rgba(240,244,255,0.95)' }}>
          Performance
        </h2>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as PeriodKey)}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.10)',
            color: 'rgba(240,244,255,0.75)',
            borderRadius: '0.5rem',
            padding: '0.3rem 0.625rem',
            fontSize: '0.8125rem',
            outline: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            appearance: 'none' as const,
          }}
        >
          {PERIODS.map((p) => (
            <option key={p.key} value={p.key} style={{ background: '#080d1a' }}>
              {buildPeriodLabel(p.months)}
            </option>
          ))}
        </select>
      </div>

      {/* 4 metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.625rem' }}>
        <MetricCard
          label="Interactions"
          value={interactions.toLocaleString()}
          sub="from last period"
          subGreen
        />
        <MetricCard label="Calls"          value="—" sub="API pending" />
        <MetricCard label="Directions"     value="—" sub="API pending" />
        <MetricCard label="Website Clicks" value="—" sub="API pending" />
      </div>

      {/* Bar chart */}
      <div
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '0.875rem',
          padding: '1.125rem 1.25rem 0.875rem',
        }}
      >
        <p
          style={{
            fontSize: '0.8125rem',
            fontWeight: 700,
            color: 'rgba(240,244,255,0.75)',
            marginBottom: '1.25rem',
          }}
        >
          Profile Interactions by Month
        </p>

        <div style={{ position: 'relative' }}>
          {/* Horizontal reference lines */}
          {[100, 66, 33].map((pct) => (
            <div
              key={pct}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: `calc(1.5rem + ${pct}% * (100% - 1.5rem) / 100)`,
                borderTop: '1px dashed rgba(255,255,255,0.05)',
                pointerEvents: 'none',
              }}
            />
          ))}

          {/* Bars + labels */}
          <div style={{ display: 'flex', alignItems: 'flex-end', height: '140px', gap: '0.5rem' }}>
            {chartMonths.map((month, i) => {
              const pct = (chartBars[i] / maxBar) * 100;
              return (
                <div
                  key={month}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end',
                    gap: '0.3rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.625rem',
                      color: 'rgba(240,244,255,0.38)',
                      lineHeight: 1,
                    }}
                  >
                    {chartBars[i]}
                  </span>
                  <div
                    style={{
                      width: '100%',
                      height: `${pct}%`,
                      minHeight: '3px',
                      borderRadius: '0.3rem 0.3rem 0 0',
                      background: 'linear-gradient(180deg, #4f8ef7 0%, rgba(79,142,247,0.55) 100%)',
                      transition: 'height 0.35s ease',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      color: 'rgba(240,244,255,0.38)',
                      lineHeight: 1,
                    }}
                  >
                    {month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* API pending note */}
      <p
        style={{
          fontSize: '0.75rem',
          color: 'rgba(240,244,255,0.30)',
          lineHeight: 1.5,
        }}
      >
        Full breakdowns for calls, chat clicks, direction requests, and website clicks will populate once the GBP API is approved.
      </p>
    </div>
  );
}
