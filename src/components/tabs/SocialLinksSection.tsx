import { useEffect, useState } from 'react';

// ─── Platform definitions ─────────────────────────────────────────────────────

interface Platform {
  id: string;
  label: string;
  color: string;
  placeholder: string;
}

const PLATFORMS: Platform[] = [
  { id: 'instagram', label: 'Instagram', color: '#E1306C', placeholder: 'https://instagram.com/yourbusiness' },
  { id: 'facebook',  label: 'Facebook',  color: '#1877F2', placeholder: 'https://facebook.com/yourbusiness' },
  { id: 'tiktok',    label: 'TikTok',    color: '#EE1D52', placeholder: 'https://tiktok.com/@yourbusiness' },
  { id: 'youtube',   label: 'YouTube',   color: '#FF0000', placeholder: 'https://youtube.com/@yourchannel' },
  { id: 'linkedin',  label: 'LinkedIn',  color: '#0A66C2', placeholder: 'https://linkedin.com/company/yourbusiness' },
  { id: 'x',         label: 'X',         color: '#e7e9ea', placeholder: 'https://x.com/yourbusiness' },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
  backdropFilter: 'blur(8px)',
  borderRadius: '1rem',
  padding: '1.5rem',
  marginTop: '1rem',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.6875rem',
  fontWeight: 600,
  color: 'rgba(240,244,255,0.45)',
  marginBottom: '0.3rem',
  display: 'block',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: 'white',
  borderRadius: '0.5rem',
  height: '2.25rem',
  padding: '0 0.75rem',
  fontSize: '0.875rem',
  width: '100%',
  outline: 'none',
};

const btnPrimary: React.CSSProperties = {
  background: '#4f8ef7',
  color: 'white',
  borderRadius: '0.5rem',
  padding: '0.5rem 1rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
};

const btnGhost: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.15)',
  color: 'rgba(240,244,255,0.7)',
  borderRadius: '0.5rem',
  padding: '0.375rem 0.75rem',
  fontSize: '0.875rem',
  cursor: 'pointer',
};

// ─── Platform badge (view mode) ───────────────────────────────────────────────

function PlatformBadge({ platform, url }: { platform: Platform; url?: string }) {
  const linked = Boolean(url);
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      onClick={!linked ? (e) => e.preventDefault() : undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.3rem 0.7rem',
        borderRadius: '9999px',
        background: linked ? `${platform.color}15` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${linked ? `${platform.color}40` : 'rgba(255,255,255,0.08)'}`,
        cursor: linked ? 'pointer' : 'default',
        textDecoration: 'none',
        transition: 'border-color 0.15s',
      }}
    >
      <span
        style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: linked ? platform.color : 'rgba(255,255,255,0.18)',
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: '0.75rem',
          fontWeight: 500,
          color: linked ? 'rgba(240,244,255,0.85)' : 'rgba(240,244,255,0.3)',
        }}
      >
        {platform.label}
      </span>
    </a>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  ready: boolean;
}

export default function SocialLinksSection({ ready }: Props) {
  const [links, setLinks] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ready) return;
    setLoading(true);
    fetch('/api/social-links', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { if (d.links) setLinks(d.links); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ready]);

  const startEdit = () => {
    setDraft({ ...links });
    setSaveMsg('');
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setSaveMsg('');
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch('/api/social-links', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ links: draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setLinks(data.links);
      setEditing(false);
      setSaveMsg(data.gbpSynced ? 'Synced to Google ✓' : 'Saved — will sync to GBP automatically');
      setTimeout(() => setSaveMsg(''), 4000);
    } catch (e: unknown) {
      setSaveMsg(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const linkedCount = PLATFORMS.filter((p) => links[p.id]).length;

  return (
    <div style={glassCard}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'rgba(240,244,255,0.95)' }}>
            Social Media
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.35)', marginTop: '0.2rem' }}>
            Linked to your Google Business Profile so Google can connect your content
          </p>
        </div>
        {!editing && (
          <button style={btnGhost} onClick={startEdit} disabled={loading}>
            {loading ? 'Loading…' : 'Edit'}
          </button>
        )}
        {editing && (
          <div className="flex items-center gap-2">
            <button style={btnGhost} onClick={cancelEdit}>Cancel</button>
            <button
              style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Save message */}
      {saveMsg && (
        <p style={{
          fontSize: '0.75rem',
          color: saveMsg.includes('✓') ? '#34d399' : saveMsg.includes('will sync') ? '#facc15' : '#f87171',
          marginBottom: '1rem',
        }}>
          {saveMsg}
        </p>
      )}

      {/* View mode */}
      {!editing && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {PLATFORMS.map((p) => (
              <PlatformBadge key={p.id} platform={p} url={links[p.id]} />
            ))}
          </div>
          {linkedCount === 0 && ready && !loading && (
            <p style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.25)', marginTop: '0.875rem', fontStyle: 'italic' }}>
              No social profiles linked yet — add them so Google can connect your content to your business.
            </p>
          )}
          {!ready && (
            <p style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.25)', marginTop: '0.875rem', fontStyle: 'italic' }}>
              Connect your Google Business Profile to enable social media syncing.
            </p>
          )}
        </>
      )}

      {/* Edit mode */}
      {editing && (
        <div className="grid grid-cols-2 gap-4">
          {PLATFORMS.map((p) => (
            <div key={p.id}>
              <label style={labelStyle}>{p.label}</label>
              <input
                style={inputStyle}
                type="url"
                placeholder={p.placeholder}
                value={draft[p.id] || ''}
                onChange={(e) => setDraft({ ...draft, [p.id]: e.target.value })}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
