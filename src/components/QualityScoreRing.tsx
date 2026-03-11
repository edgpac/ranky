interface Props {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export default function QualityScoreRing({ score, size = 52, strokeWidth = 4 }: Props) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score)) / 100;
  const color = score >= 75 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171';

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={`${circ * pct} ${circ * (1 - pct)}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <span style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size < 44 ? 10 : 12, fontWeight: 700, color,
      }}>
        {score}
      </span>
    </div>
  );
}
