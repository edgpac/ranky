import type { ProfileTemplate } from './profileTemplates';

// Inline shimmer animation injected once
const SHIMMER_STYLE = `
@keyframes _gbp_shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position:  400px 0; }
}
`;

const shimmer: React.CSSProperties = {
  background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.05) 75%)',
  backgroundSize: '400px 100%',
  animation: '_gbp_shimmer 1.4s infinite linear',
  borderRadius: '4px',
};

function Sk({ w, h = 12 }: { w: number | string; h?: number }) {
  return <div style={{ ...shimmer, width: typeof w === 'number' ? `${w}px` : w, height: `${h}px`, flexShrink: 0 }} />;
}

function LabelValue({ valueWidth = 160 }: { valueWidth?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <Sk w={64} h={8} />
      <Sk w={valueWidth} h={14} />
    </div>
  );
}

function Row2({ w1 = 160, w2 = 160 }: { w1?: number; w2?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 2rem' }}>
      <LabelValue valueWidth={w1} />
      <LabelValue valueWidth={w2} />
    </div>
  );
}

function FullRow({ valueWidth = '80%' }: { valueWidth?: string | number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <Sk w={64} h={8} />
      <Sk w={valueWidth} h={14} />
    </div>
  );
}

function AttributeGrid({ cols, rows = 1 }: { cols: number; rows?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '8px' }}>
      {Array.from({ length: cols * rows }).map((_, i) => (
        <div key={i} style={{ ...shimmer, height: '32px', borderRadius: '8px' }} />
      ))}
    </div>
  );
}

function Divider() {
  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <Sk w={140} h={8} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 2rem', marginTop: '0.75rem' }}>
        <LabelValue valueWidth={80} />
        <LabelValue valueWidth={100} />
      </div>
    </div>
  );
}

// ─── Per-template skeleton shapes ────────────────────────────────────────────

function ContractorSkeleton() {
  return (
    <>
      <Row2 />
      <Row2 />
      <FullRow />
      <Row2 w1={180} w2={140} />
      <Divider />
    </>
  );
}

function RestaurantSkeleton() {
  return (
    <>
      <Row2 />
      <Row2 />
      <FullRow />
      <FullRow />
      <Row2 w1={200} w2={160} />
      <Row2 w1={160} w2={160} />
      <AttributeGrid cols={3} rows={2} />
      <Row2 w1={200} w2={200} />
      <Divider />
    </>
  );
}

function StoreSkeleton() {
  return (
    <>
      <Row2 />
      <Row2 />
      <FullRow />
      <FullRow />
      <Row2 />
      <AttributeGrid cols={4} />
      <Divider />
    </>
  );
}

function SalonSkeleton() {
  return (
    <>
      <Row2 />
      <Row2 />
      <FullRow />
      <FullRow />
      <Row2 />
      <FullRow valueWidth="60%" />
      <AttributeGrid cols={2} />
      <Divider />
    </>
  );
}

function HotelSkeleton() {
  return (
    <>
      <Row2 />
      <Row2 />
      <FullRow />
      <FullRow />
      <Row2 />
      <Row2 w1={100} w2={100} />
      <AttributeGrid cols={3} rows={2} />
      <Divider />
    </>
  );
}

function DoctorSkeleton() {
  return (
    <>
      <Row2 />
      <Row2 />
      <FullRow />
      <FullRow />
      <Row2 />
      <FullRow valueWidth="55%" />
      <AttributeGrid cols={3} />
      <Divider />
    </>
  );
}

function RealEstateSkeleton() {
  return (
    <>
      <Row2 />
      <Row2 />
      <FullRow />
      <Row2 />
      <FullRow valueWidth="70%" />
      <Divider />
    </>
  );
}

const SKELETON_MAP: Record<string, () => React.ReactElement> = {
  contractor:  ContractorSkeleton,
  restaurant:  RestaurantSkeleton,
  store:       StoreSkeleton,
  salon:       SalonSkeleton,
  hotel:       HotelSkeleton,
  doctor:      DoctorSkeleton,
  real_estate: RealEstateSkeleton,
};

// ─── Public component ─────────────────────────────────────────────────────────

export default function ProfileSkeleton({ template }: { template: ProfileTemplate }) {
  const SkeletonBody = SKELETON_MAP[template.key] ?? ContractorSkeleton;
  return (
    <>
      <style>{SHIMMER_STYLE}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <SkeletonBody />
      </div>
    </>
  );
}
