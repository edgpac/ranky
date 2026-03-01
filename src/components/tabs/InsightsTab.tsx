import { useEffect, useState } from 'react';

interface MetricValue {
  metric: string;
  totalValue?: { metricOption: string; value: string };
}

interface InsightsData {
  locationMetrics?: Array<{ metricValues: MetricValue[] }>;
}

interface AuditItem {
  id: string;
  status: 'ok' | 'warn' | 'error';
  title: string;
  message: string;
  tab: string;
}

interface Props {
  businessName: string;
  ready: boolean;
  onNavigate: (tab: string) => void;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const ALL_MONTHS = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
const ALL_BARS   = [45, 62, 78, 180, 89, 95];
const MOCK_INTERACTIONS = 180;

const MOCK_AUDIT: AuditItem[] = [
  { id: 'photos',       status: 'error', title: 'Only 3 photos',               message: 'Critical: AI needs 10+ photos to generate varied, visual posts. Add photos now.',                          tab: 'photos' },
  { id: 'review_count', status: 'warn',  title: '6 reviews',                   message: 'Getting there — aim for 10+ to build trust with new customers.',                                            tab: 'getreviews' },
  { id: 'avg_rating',   status: 'ok',    title: '4.8 star average',            message: 'Above average for your category — well done.',                                                               tab: 'reviews' },
  { id: 'unanswered',   status: 'warn',  title: '2 unanswered reviews',        message: 'Reply soon — Google rewards businesses that respond to reviews.',                                            tab: 'reviews' },
  { id: 'description',  status: 'ok',    title: 'Business description set',    message: 'Good — your description helps Google match you to relevant searches.',                                       tab: 'profile' },
  { id: 'website',      status: 'error', title: 'No website on your GBP',      message: 'Add your website URL — businesses with websites rank higher in local search.',                              tab: 'profile' },
  { id: 'hours',        status: 'ok',    title: 'Business hours set',          message: "Hours are set — customers can see when you're open.",                                                        tab: 'profile' },
  { id: 'posts_week',   status: 'ok',    title: '3 posts this week',           message: 'Automation is working — regular posts keep your profile active and visible.',                               tab: 'posts' },
];

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

const TAB_LABELS: Record<string, string> = {
  photos:     'Photos',
  reviews:    'Reviews',
  getreviews: 'Get Reviews',
  profile:    'Edit Profile',
  posts:      'Posts',
};

// ─── Metric card ─────────────────────────────────────────────────────────────

function MetricCard({ label, value, sub, subGreen }: {
  label: string; value: string | number; sub?: string; subGreen?: boolean;
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '0.875rem', padding: '1rem 1.125rem',
      display: 'flex', flexDirection: 'column', gap: '0.3rem',
    }}>
      <p style={{ fontSize: '1.875rem', fontWeight: 800, color: 'rgba(240,244,255,0.95)', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(240,244,255,0.42)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{label}</p>
      {sub && (
        <p style={{ fontSize: '0.6875rem', fontWeight: subGreen ? 600 : 400, color: subGreen ? '#34d399' : 'rgba(240,244,255,0.32)', marginTop: '0.125rem' }}>
          {subGreen ? '↑ ' : ''}{sub}
        </p>
      )}
    </div>
  );
}

// ─── Audit item row ───────────────────────────────────────────────────────────

const STATUS_ICON: Record<string, string>  = { ok: '✓', warn: '!', error: '✕' };
const STATUS_COLOR: Record<string, string> = { ok: '#34d399', warn: '#fbbf24', error: '#f87171' };
const STATUS_BG: Record<string, string>    = {
  ok:    'rgba(52,211,153,0.08)',
  warn:  'rgba(251,191,36,0.08)',
  error: 'rgba(248,113,113,0.08)',
};
const STATUS_BORDER: Record<string, string> = {
  ok:    'rgba(52,211,153,0.16)',
  warn:  'rgba(251,191,36,0.16)',
  error: 'rgba(248,113,113,0.16)',
};

function AuditRow({ item, onNavigate }: { item: AuditItem; onNavigate: (tab: string) => void }) {
  const color  = STATUS_COLOR[item.status];
  const icon   = STATUS_ICON[item.status];
  const tabLabel = TAB_LABELS[item.tab] ?? item.tab;

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
      padding: '0.75rem 0.875rem',
      background: STATUS_BG[item.status],
      border: `1px solid ${STATUS_BORDER[item.status]}`,
      borderRadius: '0.75rem',
    }}>
      {/* Status icon */}
      <div style={{
        width: '1.5rem', height: '1.5rem', borderRadius: '50%', flexShrink: 0,
        background: `${color}22`,
        border: `1.5px solid ${color}55`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.6875rem', fontWeight: 800, color,
      }}>
        {icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'rgba(240,244,255,0.90)', marginBottom: '0.2rem' }}>
          {item.title}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.50)', lineHeight: 1.5 }}>
          {item.message}
        </p>
      </div>

      {/* Tab chip — only shown for non-ok or actionable items */}
      {item.status !== 'ok' && (
        <button
          onClick={() => onNavigate(item.tab)}
          style={{
            flexShrink: 0,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: '9999px',
            color: 'rgba(240,244,255,0.55)',
            fontSize: '0.6875rem', fontWeight: 600,
            padding: '0.2rem 0.625rem',
            cursor: 'pointer',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
          }}
        >
          {tabLabel} →
        </button>
      )}
    </div>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export default function InsightsTab({ ready, onNavigate }: Props) {
  const [insights, setInsights]   = useState<InsightsData | null>(null);
  const [auditItems, setAuditItems] = useState<AuditItem[]>(MOCK_AUDIT);
  const [auditLoading, setAuditLoading] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [period, setPeriod]       = useState<PeriodKey>('6m');

  useEffect(() => {
    if (!ready) return;
    setLoading(true);
    fetch('/api/insights', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { if (d.insights) setInsights(d.insights); })
      .catch(() => {})
      .finally(() => setLoading(false));

    setAuditLoading(true);
    fetch('/api/audit', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { if (d.items?.length) setAuditItems(d.items); })
      .catch(() => {})
      .finally(() => setAuditLoading(false));
  }, [ready]);

  const activePeriod  = PERIODS.find((p) => p.key === period) ?? PERIODS[0];
  const sliceCount    = activePeriod.months;
  const chartMonths   = ALL_MONTHS.slice(-sliceCount);
  const chartBars     = ALL_BARS.slice(-sliceCount);
  const maxBar        = Math.max(...chartBars);
  const interactions  = insights
    ? extractMetric(insights, 'VIEWS_SEARCH') + extractMetric(insights, 'VIEWS_MAPS')
    : MOCK_INTERACTIONS;

  const errorCount = auditItems.filter((i) => i.status === 'error').length;
  const warnCount  = auditItems.filter((i) => i.status === 'warn').length;

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#4f8ef7', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'rgba(240,244,255,0.95)' }}>Performance</h2>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as PeriodKey)}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
            color: 'rgba(240,244,255,0.75)', borderRadius: '0.5rem',
            padding: '0.3rem 0.625rem', fontSize: '0.8125rem',
            outline: 'none', cursor: 'pointer', fontFamily: 'inherit',
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
        <MetricCard label="Interactions"  value={interactions.toLocaleString()} sub="from last period" subGreen />
        <MetricCard label="Calls"          value="—" sub="API pending" />
        <MetricCard label="Directions"     value="—" sub="API pending" />
        <MetricCard label="Website Clicks" value="—" sub="API pending" />
      </div>

      {/* Bar chart */}
      <div style={{
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '0.875rem', padding: '1.125rem 1.25rem 0.875rem',
      }}>
        <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'rgba(240,244,255,0.75)', marginBottom: '1.25rem' }}>
          Profile Interactions by Month
        </p>
        <div style={{ position: 'relative' }}>
          {[100, 66, 33].map((pct) => (
            <div key={pct} style={{
              position: 'absolute', left: 0, right: 0,
              bottom: `calc(1.5rem + ${pct}% * (100% - 1.5rem) / 100)`,
              borderTop: '1px dashed rgba(255,255,255,0.05)', pointerEvents: 'none',
            }} />
          ))}
          <div style={{ display: 'flex', alignItems: 'flex-end', height: '140px', gap: '0.5rem' }}>
            {chartMonths.map((month, i) => {
              const pct = (chartBars[i] / maxBar) * 100;
              return (
                <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '0.3rem' }}>
                  <span style={{ fontSize: '0.625rem', color: 'rgba(240,244,255,0.38)', lineHeight: 1 }}>{chartBars[i]}</span>
                  <div style={{
                    width: '100%', height: `${pct}%`, minHeight: '3px',
                    borderRadius: '0.3rem 0.3rem 0 0',
                    background: 'linear-gradient(180deg, #4f8ef7 0%, rgba(79,142,247,0.55) 100%)',
                    transition: 'height 0.35s ease',
                  }} />
                  <span style={{ fontSize: '0.6875rem', color: 'rgba(240,244,255,0.38)', lineHeight: 1 }}>{month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Profile Health Audit ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>

        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(240,244,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Profile Health
            </span>
            {/* Summary chips */}
            {errorCount > 0 && (
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '9999px', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.22)', color: '#f87171' }}>
                {errorCount} critical
              </span>
            )}
            {warnCount > 0 && (
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '9999px', background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.20)', color: '#fbbf24' }}>
                {warnCount} warnings
              </span>
            )}
            {errorCount === 0 && warnCount === 0 && (
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '9999px', background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.20)', color: '#34d399' }}>
                All good
              </span>
            )}
          </div>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
          {auditLoading && (
            <div className="animate-spin" style={{ width: '12px', height: '12px', border: '2px solid rgba(79,142,247,0.3)', borderTopColor: '#4f8ef7', borderRadius: '50%' }} />
          )}
        </div>

        {/* Audit items */}
        {auditItems.map((item) => (
          <AuditRow key={item.id} item={item} onNavigate={onNavigate} />
        ))}
      </div>

      {/* Footer note */}
      <p style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.30)', lineHeight: 1.5 }}>
        Full breakdowns for calls, direction requests, and website clicks will populate once the GBP API is approved.
      </p>

    </div>
  );
}
