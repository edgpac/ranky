import { useState } from 'react';

interface Props {
  reviewLink: string;
  onReviewLinkSaved: (link: string) => void;
}

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

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: 'white',
  borderRadius: '0.5rem',
  height: '2.25rem',
  padding: '0 0.75rem',
  fontSize: '0.875rem',
  outline: 'none',
  flex: 1,
};

export default function GetReviewsTab({ reviewLink, onReviewLinkSaved }: Props) {
  const [copied, setCopied] = useState(false);
  const [editingLink, setEditingLink] = useState(false);
  const [linkDraft, setLinkDraft] = useState(reviewLink);
  const [savingLink, setSavingLink] = useState(false);

  const activeLink = reviewLink || '';

  const copyLink = () => {
    if (!activeLink) return;
    navigator.clipboard.writeText(activeLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const saveLink = async () => {
    if (!linkDraft.trim()) return;
    setSavingLink(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH', credentials: 'include',
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
    if (!activeLink) return;
    const text = encodeURIComponent(`Leave us a review! ${activeLink}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareEmail = () => {
    if (!activeLink) return;
    const subject = encodeURIComponent("We'd love your review!");
    const body = encodeURIComponent(
      `Hi,\n\nThank you for your business! We'd really appreciate it if you left us a quick review on Google:\n\n${activeLink}\n\nIt only takes 30 seconds and means a lot to us.\n\nThank you!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const shareSMS = () => {
    if (!activeLink) return;
    const body = encodeURIComponent(`Hey! Leave us a Google review here: ${activeLink}`);
    window.open(`sms:?body=${body}`, '_blank');
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Section description */}
      <p style={{ fontSize: '0.8125rem', color: 'rgba(232,238,255,0.45)' }}>
        Share your review link and grow your star rating — send it to customers after a job is done.
      </p>

      {/* Review link */}
      <div style={glassCard}>
        <div className="flex items-center justify-between mb-3">
          <p style={sectionTitle}>Your Review Link</p>
          <button
            style={{ ...btnGhost, fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
            onClick={() => { setEditingLink((v) => !v); setLinkDraft(reviewLink); }}
          >
            {editingLink ? 'Cancel' : 'Edit Link'}
          </button>
        </div>

        {editingLink ? (
          <div className="flex gap-2">
            <input
              style={inputStyle}
              placeholder="https://g.page/r/..."
              value={linkDraft}
              onChange={(e) => setLinkDraft(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && saveLink()}
            />
            <button
              style={{ ...btnPrimary, opacity: savingLink || !linkDraft.trim() ? 0.5 : 1 }}
              onClick={saveLink}
              disabled={savingLink || !linkDraft.trim()}
            >
              {savingLink ? 'Saving…' : 'Save'}
            </button>
          </div>
        ) : activeLink ? (
          <div style={codeBox}>
            <span style={{ flex: 1 }}>{activeLink}</span>
            <button
              style={{ ...btnPrimary, background: copied ? '#34d399' : '#4f8ef7', transition: 'background 0.2s' }}
              onClick={copyLink}
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        ) : (
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)' }}
          >
            <p style={{ fontSize: '0.875rem', color: 'rgba(240,244,255,0.7)', marginBottom: '0.5rem' }}>
              No review link set yet.
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(240,244,255,0.4)' }}>
              Find your link in Google Maps → your listing → "Get more reviews", then paste it above.
            </p>
          </div>
        )}
      </div>

      {/* Share */}
      <div style={{ ...glassCard, opacity: activeLink ? 1 : 0.4, pointerEvents: activeLink ? 'auto' : 'none' }}>
        <p style={sectionTitle}>Share Your Link</p>
        <div className="flex gap-3">
          <button
            style={{ background: '#25D366', color: 'white', borderRadius: '0.5rem', padding: '0.5rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={shareWhatsApp}
          >
            <span>📱</span> WhatsApp
          </button>
          <button style={btnGhost} onClick={shareEmail}><span>📧</span> Email</button>
          <button style={btnGhost} onClick={shareSMS}><span>💬</span> SMS</button>
        </div>
      </div>

      {/* QR placeholder */}
      <div style={{ ...glassCard, opacity: activeLink ? 1 : 0.4 }}>
        <p style={sectionTitle}>QR Code</p>
        <div
          style={{ width: '200px', height: '200px', border: '2px dashed rgba(255,255,255,0.18)', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto', background: 'rgba(255,255,255,0.02)', gap: '0.5rem' }}
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
