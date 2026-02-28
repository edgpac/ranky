import { useState } from 'react';

const REVIEW_LINK = 'https://g.page/r/CdBKSVC63be9EBM/review';

const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
  backdropFilter: 'blur(8px)',
  borderRadius: '1rem',
  padding: '1.5rem',
};

const sectionTitle: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 700,
  color: 'rgba(240,244,255,0.85)',
  marginBottom: '0.875rem',
};

const codeBox: React.CSSProperties = {
  background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '0.5rem',
  padding: '0.75rem 1rem',
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
  fontSize: '0.8125rem',
  color: '#34d399',
  wordBreak: 'break-all',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem',
};

const btnPrimary: React.CSSProperties = {
  background: '#4f8ef7',
  color: 'white',
  borderRadius: '0.5rem',
  padding: '0.5rem 1rem',
  fontSize: '0.8125rem',
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
  flexShrink: 0,
};

const btnGhost: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.15)',
  color: 'rgba(240,244,255,0.7)',
  borderRadius: '0.5rem',
  padding: '0.5rem 1rem',
  fontSize: '0.875rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

export default function GetReviewsTab() {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(REVIEW_LINK).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`Leave us a review! ${REVIEW_LINK}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareEmail = () => {
    const subject = encodeURIComponent('We\'d love your review!');
    const body = encodeURIComponent(`Hi,\n\nThank you for your business! We'd really appreciate it if you left us a quick review on Google:\n\n${REVIEW_LINK}\n\nIt only takes 30 seconds and means a lot to us.\n\nThank you!`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const shareSMS = () => {
    const body = encodeURIComponent(`Hey! Leave us a Google review here: ${REVIEW_LINK}`);
    window.open(`sms:?body=${body}`, '_blank');
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Section 1: Review Link */}
      <div style={glassCard}>
        <p style={sectionTitle}>Your Review Link</p>
        <div style={codeBox}>
          <span style={{ flex: 1 }}>{REVIEW_LINK}</span>
          <button
            style={{
              ...btnPrimary,
              background: copied ? '#34d399' : '#4f8ef7',
              transition: 'background 0.2s',
            }}
            onClick={copyLink}
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      {/* Section 2: Share */}
      <div style={glassCard}>
        <p style={sectionTitle}>Share Your Link</p>
        <div className="flex gap-3">
          <button
            style={{
              background: '#25D366',
              color: 'white',
              borderRadius: '0.5rem',
              padding: '0.5rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
            onClick={shareWhatsApp}
          >
            <span>📱</span> WhatsApp
          </button>

          <button style={btnGhost} onClick={shareEmail}>
            <span>📧</span> Email
          </button>

          <button style={btnGhost} onClick={shareSMS}>
            <span>💬</span> SMS
          </button>
        </div>
      </div>

      {/* Section 3: QR Code */}
      <div style={glassCard}>
        <p style={sectionTitle}>QR Code</p>
        <div
          style={{
            width: '200px',
            height: '200px',
            border: '2px dashed rgba(255,255,255,0.18)',
            borderRadius: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            background: 'rgba(255,255,255,0.02)',
            gap: '0.5rem',
          }}
        >
          <span style={{ fontSize: '2.5rem' }}>🔲</span>
          <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(240,244,255,0.55)' }}>QR Code</p>
        </div>
        <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'rgba(240,244,255,0.4)', marginTop: '0.875rem' }}>
          Print this to display at your business
        </p>
      </div>
    </div>
  );
}
