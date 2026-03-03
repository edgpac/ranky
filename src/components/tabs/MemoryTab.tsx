import { useEffect, useRef, useState } from 'react';
import { useAppT } from '../../contexts/LanguageContext';

interface MemoryData {
  memory: string | null;
  updatedAt: string | null;
  bootstrapping?: boolean;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '0.875rem',
  padding: '1.25rem',
};

const btnPrimary: React.CSSProperties = {
  background: '#4f8ef7',
  color: 'white',
  borderRadius: '0.5rem',
  padding: '0.375rem 0.875rem',
  fontSize: '0.8125rem',
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
  fontSize: '0.8125rem',
  cursor: 'pointer',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MemoryTab() {
  const dt = useAppT().memory;

  const [data, setData] = useState<MemoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchMemory() {
    try {
      const res = await fetch('/api/memory', { credentials: 'include' });
      if (!res.ok) throw new Error('fetch failed');
      const json: MemoryData = await res.json();
      setData(json);
      return json;
    } catch {
      setData({ memory: null, updatedAt: null });
      return null;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMemory().then((json) => {
      if (json?.bootstrapping) {
        pollRef.current = setInterval(async () => {
          const updated = await fetchMemory();
          if (updated?.memory) {
            clearInterval(pollRef.current!);
            pollRef.current = null;
          }
        }, 8000);
      }
    });
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function handleEdit() {
    setDraft(data?.memory ?? '');
    setEditing(true);
  }

  function handleCancel() {
    setEditing(false);
    setDraft('');
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/memory', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: draft }),
      });
      if (!res.ok) throw new Error('save failed');
      const updated: MemoryData = await res.json();
      setData(updated);
      setEditing(false);
      setDraft('');
    } catch {
      // silent fail — user can retry
    } finally {
      setSaving(false);
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ color: '#e8eeff' }}>{dt.heading}</h2>
        <p className="text-sm mb-6" style={{ color: 'rgba(232,238,255,0.50)' }}>{dt.subtitle}</p>
        <div style={card} className="flex items-center gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(232,238,255,0.4)" strokeWidth="2" className="animate-spin flex-shrink-0">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          <span className="text-sm" style={{ color: 'rgba(232,238,255,0.50)' }}>{dt.loading}</span>
        </div>
      </div>
    );
  }

  // ── Bootstrapping state ────────────────────────────────────────────────────
  if (data?.bootstrapping) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ color: '#e8eeff' }}>{dt.heading}</h2>
        <p className="text-sm mb-6" style={{ color: 'rgba(232,238,255,0.50)' }}>{dt.subtitle}</p>
        <div style={{ ...card, borderColor: 'rgba(79,142,247,0.30)', background: 'rgba(79,142,247,0.07)' }}>
          <div className="flex items-start gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f8ef7" strokeWidth="2" className="animate-spin flex-shrink-0 mt-0.5">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#4f8ef7' }}>{dt.bootstrapping}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(232,238,255,0.50)' }}>{dt.bootstrapSub}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Loaded state ───────────────────────────────────────────────────────────
  const content = data?.memory ?? '';

  return (
    <div>
      <div className="flex items-start justify-between mb-1">
        <h2 className="text-xl font-bold" style={{ color: '#e8eeff' }}>{dt.heading}</h2>
        {!editing && content && (
          <button style={btnGhost} onClick={handleEdit}>{dt.editBtn}</button>
        )}
      </div>
      <p className="text-sm mb-6" style={{ color: 'rgba(232,238,255,0.50)' }}>{dt.subtitle}</p>

      {!content && !editing ? (
        <div style={card}>
          <p className="text-sm" style={{ color: 'rgba(232,238,255,0.45)' }}>{dt.empty}</p>
        </div>
      ) : editing ? (
        <div style={card}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={20}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'vertical',
              color: 'rgba(240,244,255,0.85)',
              fontSize: '0.8125rem',
              lineHeight: 1.6,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            }}
          />
          <div className="flex items-center gap-2 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button style={btnPrimary} onClick={handleSave} disabled={saving}>
              {saving ? dt.saving : dt.saveBtn}
            </button>
            <button style={btnGhost} onClick={handleCancel} disabled={saving}>{dt.cancelBtn}</button>
          </div>
        </div>
      ) : (
        <div style={card}>
          <pre
            style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: 'rgba(240,244,255,0.80)',
              fontSize: '0.8125rem',
              lineHeight: 1.6,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            }}
          >
            {content}
          </pre>
          {data?.updatedAt && (
            <p className="text-xs mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', color: 'rgba(232,238,255,0.35)' }}>
              {dt.lastUpdated} {relativeTime(data.updatedAt)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
