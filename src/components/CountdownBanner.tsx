import { useEffect, useState } from 'react';

// ─── Shared countdown hook (used by Posts, Q&A, Reviews) ──────────────────────

export function useCountdown(target: string | null | undefined): string | null {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!target) { setLabel(null); return; }

    const tick = () => {
      const ms = new Date(target).getTime() - Date.now();
      if (ms <= 0) { setLabel('Posting soon…'); return; }
      const totalMins = Math.floor(ms / 60000);
      const h = Math.floor(totalMins / 60);
      const m = totalMins % 60;
      const s = Math.floor((ms % 60000) / 1000);
      if (h > 0) setLabel(`${h}h ${m}m`);
      else if (m > 0) setLabel(`${m}m ${s}s`);
      else setLabel(`${s}s`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return label;
}

// ─── Full countdown banner with draining progress bar ─────────────────────────

interface CountdownBannerProps {
  autoPostAt: string;
  label?: string;       // e.g. "Auto-posting in" | "Auto-approving in"
  totalHours?: number;  // total window in hours (default 24)
}

export function CountdownBanner({ autoPostAt, label = 'Auto-posting in', totalHours = 24 }: CountdownBannerProps) {
  const [msLeft, setMsLeft] = useState(() => new Date(autoPostAt).getTime() - Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setMsLeft(new Date(autoPostAt).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [autoPostAt]);

  const total = totalHours * 3600000;
  const progress = Math.max(0, Math.min(1, msLeft / total));

  function format(ms: number): string {
    if (ms <= 0) return 'Posting soon…';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  return (
    <div
      style={{
        background: 'rgba(251,191,36,0.07)',
        border: '1px solid rgba(251,191,36,0.22)',
        borderRadius: '0.5rem',
        padding: '0.5rem 0.75rem',
        marginBottom: '0.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
        <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(251,191,36,0.85)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          ⏱ {label}
        </span>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(251,191,36,0.9)', fontVariantNumeric: 'tabular-nums' }}>
          {format(msLeft)}
        </span>
      </div>
      <div style={{ height: '3px', background: 'rgba(251,191,36,0.15)', borderRadius: '9999px', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${progress * 100}%`,
            background: 'rgba(251,191,36,0.6)',
            borderRadius: '9999px',
            transition: 'width 1s linear',
          }}
        />
      </div>
    </div>
  );
}
