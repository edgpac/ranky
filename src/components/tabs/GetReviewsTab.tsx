import { useState } from 'react';

interface Props {
  reviewLink: string;
  onReviewLinkSaved: (link: string) => void;
}

// ─── Mock / placeholder data ──────────────────────────────────────────────────

const MOCK_LINK = 'https://g.page/r/CdBK5VC65bo9EBM/review';
const MOCK_RATING = 5.0;
const MOCK_REVIEW_COUNT = 12;

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'rgba(240,244,255,0.75)',
  fontSize: '0.8125rem',
  outline: 'none',
  flex: 1,
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
  minWidth: 0,
};

const btnCopy: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: 'rgba(240,244,255,0.75)',
  borderRadius: '0.4rem',
  padding: '0.3rem 0.75rem',
  fontSize: '0.8125rem',
  fontWeight: 600,
  cursor: 'pointer',
  flexShrink: 0,
  fontFamily: 'inherit',
  transition: 'background 0.15s',
};

// ─── Share button variants ────────────────────────────────────────────────────

function ShareBtn({
  label,
  icon,
  variant,
  onClick,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  variant: 'green' | 'ghost' | 'blue';
  onClick: () => void;
  disabled?: boolean;
}) {
  const base: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
    borderRadius: '0.5rem',
    padding: '0.5rem 1rem',
    fontSize: '0.8125rem',
    fontWeight: 600,
    cursor: disabled ? 'default' : 'pointer',
    border: 'none',
    fontFamily: 'inherit',
    opacity: disabled ? 0.45 : 1,
    transition: 'opacity 0.15s',
    flex: 1,
    justifyContent: 'center',
  };

  const variants: Record<string, React.CSSProperties> = {
    green: { background: '#22c55e', color: 'white' },
    ghost: { background: 'rgba(255,255,255,0.07)', color: 'rgba(240,244,255,0.75)', border: '1px solid rgba(255,255,255,0.12)' },
    blue:  { background: 'rgba(79,142,247,0.15)', color: '#4f8ef7', border: '1px solid rgba(79,142,247,0.28)' },
  };

  return (
    <button style={{ ...base, ...variants[variant] }} onClick={disabled ? undefined : onClick}>
      {icon}
      {label}
    </button>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const WhatsAppIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const EmailIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

const SmsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

// ─── QR placeholder ───────────────────────────────────────────────────────────

function QrPlaceholder() {
  return (
    <div
      style={{
        width: '60px',
        height: '60px',
        flexShrink: 0,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: '0.5rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gridTemplateRows: 'repeat(5, 1fr)',
        gap: '2px',
        padding: '6px',
      }}
    >
      {/* Simplified QR pattern using a grid of dots */}
      {Array.from({ length: 25 }).map((_, i) => {
        const qrPattern = [1,1,1,0,1, 1,0,1,0,0, 1,1,1,0,1, 0,1,0,1,0, 1,0,1,1,1];
        return (
          <div
            key={i}
            style={{
              borderRadius: '1px',
              background: qrPattern[i] ? 'rgba(240,244,255,0.55)' : 'transparent',
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export default function GetReviewsTab({ reviewLink, onReviewLinkSaved }: Props) {
  const [copied, setCopied] = useState(false);
  const [editingLink, setEditingLink] = useState(false);
  const [linkDraft, setLinkDraft] = useState(reviewLink);
  const [savingLink, setSavingLink] = useState(false);

  // Show mock link when none is set (guests or unconfigured accounts)
  const isMock = !reviewLink;
  const displayLink = reviewLink || MOCK_LINK;

  const copyLink = () => {
    if (isMock) return;
    navigator.clipboard.writeText(displayLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const saveLink = async () => {
    if (!linkDraft.trim()) return;
    setSavingLink(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_link: linkDraft.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onReviewLinkSaved(data.client.review_link || linkDraft.trim());
      setEditingLink(false);
    } catch { /* ignore */ }
    finally { setSavingLink(false); }
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`Leave us a review! ${displayLink}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareEmail = () => {
    const subject = encodeURIComponent("We'd love your review!");
    const body = encodeURIComponent(
      `Hi,\n\nThank you for your business! We'd really appreciate it if you left us a quick review on Google:\n\n${displayLink}\n\nIt only takes 30 seconds and means a lot to us.\n\nThank you!`,
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const shareSMS = () => {
    const body = encodeURIComponent(`Hey! Leave us a Google review here: ${displayLink}`);
    window.open(`sms:?body=${body}`, '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'rgba(240,244,255,0.95)' }}>
          Get Reviews
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'rgba(240,244,255,0.38)', lineHeight: 1.5, marginTop: '0.3rem' }}>
          Share your review link with customers to build your Google rating.{' '}
          Reviews are one of the strongest signals for local SEO.{' '}
          {!isMock && (
            <span>
              Your current rating is{' '}
              <span style={{ color: '#facc15', fontWeight: 700 }}>{MOCK_RATING.toFixed(1)} ★</span>
              {' '}across{' '}
              <span style={{ color: 'rgba(240,244,255,0.65)', fontWeight: 600 }}>{MOCK_REVIEW_COUNT} reviews</span>.
            </span>
          )}
        </p>
      </div>

      {/* Unified card */}
      <div
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '0.875rem',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {/* URL bar */}
        {editingLink ? (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'white',
                borderRadius: '0.5rem',
                height: '2.25rem',
                padding: '0 0.75rem',
                fontSize: '0.875rem',
                outline: 'none',
                flex: 1,
                fontFamily: 'inherit',
              }}
              placeholder="https://g.page/r/..."
              value={linkDraft}
              onChange={(e) => setLinkDraft(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && saveLink()}
            />
            <button
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(240,244,255,0.6)',
                borderRadius: '0.5rem',
                padding: '0 0.875rem',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              onClick={() => setEditingLink(false)}
            >
              Cancel
            </button>
            <button
              style={{
                background: '#4f8ef7',
                border: 'none',
                color: 'white',
                borderRadius: '0.5rem',
                padding: '0 0.875rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: savingLink || !linkDraft.trim() ? 'default' : 'pointer',
                opacity: savingLink || !linkDraft.trim() ? 0.5 : 1,
                fontFamily: 'inherit',
              }}
              onClick={saveLink}
              disabled={savingLink || !linkDraft.trim()}
            >
              {savingLink ? 'Saving…' : 'Save'}
            </button>
          </div>
        ) : (
          <div>
            <div
              style={{
                background: 'rgba(0,0,0,0.25)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '0.5rem',
                padding: '0 0.75rem',
                height: '2.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <input
                style={{ ...inputStyle, opacity: isMock ? 0.4 : 1 }}
                value={displayLink}
                readOnly
              />
              <button
                style={{
                  ...btnCopy,
                  background: copied ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.08)',
                  color: copied ? '#34d399' : 'rgba(240,244,255,0.75)',
                  opacity: isMock ? 0.4 : 1,
                  cursor: isMock ? 'default' : 'pointer',
                }}
                onClick={copyLink}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {/* Edit link affordance */}
            <button
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(240,244,255,0.32)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                padding: '0.3rem 0',
                fontFamily: 'inherit',
                textDecoration: 'underline',
                textDecorationColor: 'rgba(240,244,255,0.15)',
              }}
              onClick={() => { setEditingLink(true); setLinkDraft(reviewLink); }}
            >
              {isMock ? 'Set your review link' : 'Edit link'}
            </button>
          </div>
        )}

        {/* Share buttons */}
        <div style={{ display: 'flex', gap: '0.625rem' }}>
          <ShareBtn label="Share via WhatsApp" icon={<WhatsAppIcon />} variant="green"  onClick={shareWhatsApp} disabled={isMock} />
          <ShareBtn label="Share via Email"    icon={<EmailIcon />}    variant="ghost"  onClick={shareEmail}    disabled={isMock} />
          <ShareBtn label="Share via SMS"      icon={<SmsIcon />}      variant="blue"   onClick={shareSMS}      disabled={isMock} />
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

        {/* QR code row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <QrPlaceholder />
          <div>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(240,244,255,0.80)', marginBottom: '0.25rem' }}>
              Print or share your QR code
            </p>
            <p style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.38)', lineHeight: 1.55 }}>
              Right-click to save and add to invoices, flyers, or your WhatsApp signature so customers can leave a review instantly from their phone.
            </p>
          </div>
        </div>
      </div>

      {/* Tip */}
      {isMock && (
        <p style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.28)', lineHeight: 1.5 }}>
          Find your review link in Google Maps → your listing → "Get more reviews", then paste it using "Set your review link" above.
        </p>
      )}
    </div>
  );
}
