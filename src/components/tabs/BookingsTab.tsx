const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
  backdropFilter: 'blur(8px)',
  borderRadius: '1rem',
  padding: '3rem',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1rem',
};

export default function BookingsTab() {
  return (
    <div style={glassCard}>
      <span style={{ fontSize: '3rem', lineHeight: 1 }}>📅</span>

      <div>
        <p style={{ fontSize: '1rem', fontWeight: 700, color: 'rgba(240,244,255,0.9)', marginBottom: '0.375rem' }}>
          Bookings coming soon
        </p>
        <p style={{ fontSize: '0.875rem', color: 'rgba(240,244,255,0.5)', maxWidth: '28rem', lineHeight: 1.6 }}>
          Connect your booking system to manage appointments here.
        </p>
      </div>

      <span
        style={{
          display: 'inline-block',
          padding: '0.25rem 0.875rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 700,
          background: 'rgba(79,142,247,0.15)',
          border: '1px solid rgba(79,142,247,0.35)',
          color: '#4f8ef7',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        Coming Soon
      </span>
    </div>
  );
}
