import { useState } from 'react';

// ─── Styles ───────────────────────────────────────────────────────────────────

const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
  backdropFilter: 'blur(8px)',
  borderRadius: '1rem',
  padding: '1.5rem',
};

const sectionTitle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 700,
  color: 'rgba(240,244,255,0.95)',
  margin: 0,
};

const sectionSub: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'rgba(240,244,255,0.35)',
  margin: '0.2rem 0 0',
};

const linkBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.375rem',
  padding: '0.4rem 0.875rem',
  borderRadius: '0.5rem',
  fontSize: '0.8125rem',
  fontWeight: 600,
  textDecoration: 'none',
  color: '#4f8ef7',
  background: 'rgba(79,142,247,0.10)',
  border: '1px solid rgba(79,142,247,0.25)',
  cursor: 'pointer',
};

const btnSave: React.CSSProperties = {
  background: '#25D366',
  color: 'white',
  borderRadius: '0.5rem',
  padding: '0.4rem 0.875rem',
  fontSize: '0.8125rem',
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
  whiteSpace: 'nowrap',
};

// ─── Integration tile ─────────────────────────────────────────────────────────

interface IntegrationProps {
  icon: string;
  label: string;
  desc: string;
  href: string;
  btnLabel: string;
}

function IntegrationTile({ icon, label, desc, href, btnLabel }: IntegrationProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      padding: '0.875rem 0',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.5rem', lineHeight: 1, flexShrink: 0 }}>{icon}</span>
        <div>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(240,244,255,0.88)', margin: 0 }}>{label}</p>
          <p style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.35)', margin: '0.15rem 0 0', lineHeight: 1.4 }}>{desc}</p>
        </div>
      </div>
      <a href={href} target="_blank" rel="noreferrer" style={{ ...linkBtn, whiteSpace: 'nowrap', flexShrink: 0 }}>
        {btnLabel} ↗
      </a>
    </div>
  );
}

// ─── WhatsApp row ─────────────────────────────────────────────────────────────

function WhatsAppRow({ whatsapp, onSaved }: { whatsapp: string; onSaved: (phone: string) => void }) {
  const [draft, setDraft] = useState(whatsapp);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const digits = draft.replace(/\D/g, '');
  const waUrl = digits ? `https://wa.me/${digits}` : null;
  const isDirty = draft !== whatsapp;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp: draft }),
      });
      if (!res.ok) throw new Error('Save failed');
      onSaved(draft);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { /* non-fatal */ } finally { setSaving(false); }
  };

  return (
    <div style={{ paddingTop: '0.875rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.5rem', lineHeight: 1, flexShrink: 0, marginTop: '0.1rem' }}>💬</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(240,244,255,0.88)', margin: 0 }}>
            WhatsApp
          </p>
          <p style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.35)', margin: '0.15rem 0 0.625rem', lineHeight: 1.4 }}>
            Enter your number — customers get a direct wa.me link to message you instantly.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input
              type="tel"
              placeholder="+52 123 456 7890"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'white',
                borderRadius: '0.5rem',
                height: '2.25rem',
                padding: '0 0.75rem',
                fontSize: '0.875rem',
                width: '11rem',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />

            {isDirty && (
              <button
                style={{ ...btnSave, opacity: saving ? 0.6 : 1 }}
                onClick={handleSave}
                disabled={saving || !draft.trim()}
              >
                {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
              </button>
            )}

            {!isDirty && saved && (
              <span style={{ fontSize: '0.75rem', color: '#25D366' }}>Saved ✓</span>
            )}

            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  ...linkBtn,
                  color: '#25D366',
                  background: 'rgba(37,211,102,0.08)',
                  border: '1px solid rgba(37,211,102,0.22)',
                  whiteSpace: 'nowrap',
                }}
              >
                wa.me/{digits} ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  whatsapp: string;
  onSaved: (phone: string) => void;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BookingsTab({ whatsapp, onSaved }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'rgba(240,244,255,0.95)', margin: 0 }}>
          Messaging &amp; Scheduling
        </h1>
        <p style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.35)', margin: '0.2rem 0 0' }}>
          Let customers reach you directly from Google Search and Maps.
        </p>
      </div>

      {/* Google Messaging card */}
      <div style={glassCard}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <p style={sectionTitle}>Google Business Messaging</p>
            <p style={sectionSub}>
              When enabled, customers see a "Message" button on your Google listing and can chat with you directly.
            </p>
          </div>
          <span style={{
            flexShrink: 0,
            padding: '0.2rem 0.65rem',
            borderRadius: '9999px',
            fontSize: '0.6875rem',
            fontWeight: 700,
            background: 'rgba(251,191,36,0.10)',
            border: '1px solid rgba(251,191,36,0.25)',
            color: '#fbbf24',
            whiteSpace: 'nowrap',
          }}>
            Not verified
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
          <a
            href="https://business.google.com"
            target="_blank"
            rel="noreferrer"
            style={{ ...linkBtn, background: 'rgba(79,142,247,0.12)', border: '1px solid rgba(79,142,247,0.28)' }}
          >
            Enable Messaging ↗
          </a>
          <a
            href="https://business.google.com/messages"
            target="_blank"
            rel="noreferrer"
            style={{ ...linkBtn, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(240,244,255,0.6)' }}
          >
            Open Inbox ↗
          </a>
        </div>

        <div style={{
          marginTop: '1rem',
          padding: '0.625rem 0.875rem',
          background: 'rgba(79,142,247,0.05)',
          border: '1px solid rgba(79,142,247,0.12)',
          borderRadius: '0.5rem',
          fontSize: '0.75rem',
          color: 'rgba(240,244,255,0.45)',
          lineHeight: 1.5,
        }}>
          💡 Enable messaging in Google Business Profile Manager. Once active, you'll see a "Message" button on your Search and Maps listing.
        </div>
      </div>

      {/* Scheduling integrations card */}
      <div style={glassCard}>
        <p style={{ ...sectionTitle, marginBottom: '0.2rem' }}>Scheduling Integrations</p>
        <p style={{ ...sectionSub, marginBottom: '0.25rem' }}>
          Connect a booking link to your GBP so customers can schedule directly from Google.
        </p>

        <div>
          <IntegrationTile
            icon="📅"
            label="Cal.com"
            desc="Open-source scheduling. Free plan available — ideal for solo operators."
            href="https://cal.com"
            btnLabel="Set up Cal.com"
          />
          <IntegrationTile
            icon="🗓️"
            label="Calendly"
            desc="Simple booking pages. Free tier supports one event type."
            href="https://calendly.com"
            btnLabel="Set up Calendly"
          />
          <WhatsAppRow whatsapp={whatsapp} onSaved={onSaved} />
        </div>
      </div>
    </div>
  );
}
