import { useEffect, useState } from 'react';
import QualityScoreRing from '../../QualityScoreRing';
import CopyButton from '../../CopyButton';

type ContentType = 'post' | 'reply' | 'answer' | 'image';

interface LibraryItem {
  id: number;
  type: ContentType;
  input_data: Record<string, unknown>;
  generated_text: string | null;
  quality_score: number | null;
  quality_tips: string[];
  quality_strengths: string[];
  filename: string | null;
  downloadUrl: string | null;
  posted_at: string | null;
  created_at: string;
}

const TYPE_COLORS: Record<ContentType, { bg: string; border: string; color: string; emoji: string; label: string }> = {
  post: { bg: 'rgba(79,142,247,0.1)', border: 'rgba(79,142,247,0.25)', color: '#4f8ef7', emoji: '✍️', label: 'Post' },
  reply: { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)', color: '#fbbf24', emoji: '⭐', label: 'Reply' },
  answer: { bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.25)', color: '#34d399', emoji: '❓', label: 'Answer' },
  image: { bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.25)', color: '#a78bfa', emoji: '🖼️', label: 'Image' },
};

const FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'post', label: 'Posts' },
  { value: 'reply', label: 'Replies' },
  { value: 'answer', label: 'Answers' },
  { value: 'image', label: 'Images' },
];

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function ContentLibrary({ isGuest }: { isGuest?: boolean }) {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [markingId, setMarkingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  async function load(p = 1) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '15' });
      if (typeFilter) params.set('type', typeFilter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/manual/library?${params}`, { credentials: 'include' });
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(1); }, [typeFilter]);

  async function markPosted(id: number) {
    setMarkingId(id);
    try {
      await fetch(`/api/manual/library/${id}/posted`, { method: 'PATCH', credentials: 'include' });
      setItems((prev) => prev.map((item) => item.id === id ? { ...item, posted_at: new Date().toISOString() } : item));
    } finally {
      setMarkingId(null);
    }
  }

  async function deleteItem(id: number) {
    setDeletingId(id);
    try {
      await fetch(`/api/manual/library/${id}`, { method: 'DELETE', credentials: 'include' });
      setItems((prev) => prev.filter((item) => item.id !== id));
      setTotal((t) => t - 1);
    } finally {
      setDeletingId(null);
    }
  }

  if (isGuest) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📚</p>
        <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'rgba(232,238,255,0.85)', marginBottom: '0.5rem' }}>Your content library lives here</p>
        <p style={{ fontSize: '0.8125rem', color: 'rgba(232,238,255,0.4)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          Sign in to generate posts, replies, and answers — they'll all be saved here.
        </p>
        <a
          href="/signup"
          style={{
            display: 'inline-block', padding: '0.625rem 1.5rem',
            background: '#4f8ef7', color: '#fff', borderRadius: '0.5rem',
            fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none',
          }}
        >
          Sign in free
        </a>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => { setTypeFilter(value); setPage(1); }}
              style={{
                padding: '0.35rem 0.75rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s',
                border: typeFilter === value ? '1px solid #4f8ef7' : '1px solid rgba(255,255,255,0.1)',
                background: typeFilter === value ? 'rgba(79,142,247,0.15)' : 'transparent',
                color: typeFilter === value ? '#4f8ef7' : 'rgba(232,238,255,0.5)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(1)}
          placeholder="Search content…"
          style={{
            flex: 1, minWidth: 160, background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem',
            padding: '0.375rem 0.75rem', color: 'rgba(232,238,255,0.85)',
            fontSize: '0.8rem', outline: 'none',
          }}
        />
        <button onClick={() => load(1)} style={{ fontSize: '0.75rem', color: '#4f8ef7', background: 'none', border: 'none', cursor: 'pointer' }}>Search</button>
        <span style={{ fontSize: '0.7rem', color: 'rgba(232,238,255,0.3)', marginLeft: 'auto' }}>{total} item{total !== 1 ? 's' : ''}</span>
      </div>

      {/* Items */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(232,238,255,0.3)', fontSize: '0.875rem' }}>Loading…</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(232,238,255,0.3)' }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</p>
          <p style={{ fontSize: '0.875rem' }}>No content yet — generate your first post, reply, or answer above.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {items.map((item) => {
            const tc = TYPE_COLORS[item.type];
            const isExpanded = expandedId === item.id;
            return (
              <div key={item.id} style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${item.posted_at ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: '0.875rem', padding: '1rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  {/* Type badge + score */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem',
                      borderRadius: '2rem', background: tc.bg, color: tc.color, border: `1px solid ${tc.border}`,
                    }}>
                      {tc.emoji} {tc.label}
                    </span>
                    {item.quality_score != null && item.type !== 'image' && (
                      <QualityScoreRing score={item.quality_score} size={36} strokeWidth={3} />
                    )}
                  </div>

                  {/* Content preview */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {item.type !== 'image' && item.generated_text && (
                      <p
                        style={{ fontSize: '0.8rem', color: 'rgba(232,238,255,0.75)', lineHeight: 1.5, cursor: 'pointer', marginBottom: '0.375rem' }}
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      >
                        {isExpanded ? item.generated_text : item.generated_text.slice(0, 120) + (item.generated_text.length > 120 ? '…' : '')}
                      </p>
                    )}
                    {item.type === 'image' && (
                      <p style={{ fontSize: '0.8rem', color: 'rgba(232,238,255,0.55)' }}>
                        📁 {item.filename || 'Processed image'}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.68rem', color: 'rgba(232,238,255,0.3)' }}>{timeAgo(item.created_at)}</span>
                      {item.posted_at && (
                        <span style={{ fontSize: '0.68rem', color: '#34d399', fontWeight: 600 }}>✓ Posted {timeAgo(item.posted_at)}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', flexShrink: 0 }}>
                    {item.generated_text && <CopyButton text={item.generated_text} size="sm" />}
                    {item.downloadUrl && (
                      <a href={item.downloadUrl} download={item.filename || 'photo.jpg'} style={{ fontSize: '0.7rem', color: '#a78bfa', textDecoration: 'none', textAlign: 'center', padding: '0.375rem 0.5rem', border: '1px solid rgba(167,139,250,0.2)', borderRadius: '0.375rem', background: 'rgba(167,139,250,0.07)' }}>
                        ⬇ Download
                      </a>
                    )}
                    {!item.posted_at && item.type !== 'image' && (
                      <button
                        onClick={() => markPosted(item.id)}
                        disabled={markingId === item.id}
                        style={{
                          fontSize: '0.7rem', padding: '0.375rem 0.5rem', borderRadius: '0.375rem',
                          border: '1px solid rgba(52,211,153,0.25)', background: 'rgba(52,211,153,0.07)',
                          color: '#34d399', cursor: 'pointer',
                        }}
                      >
                        {markingId === item.id ? '…' : '✓ Mark posted'}
                      </button>
                    )}
                    <button
                      onClick={() => { if (window.confirm('Delete this item?')) deleteItem(item.id); }}
                      disabled={deletingId === item.id}
                      style={{ fontSize: '0.7rem', padding: '0.375rem 0.5rem', borderRadius: '0.375rem', border: '1px solid rgba(248,113,113,0.15)', background: 'transparent', color: 'rgba(248,113,113,0.6)', cursor: 'pointer' }}
                    >
                      {deletingId === item.id ? '…' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.375rem', paddingTop: '0.5rem' }}>
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => load(p)}
              style={{
                width: 32, height: 32, borderRadius: '0.375rem', fontSize: '0.8rem', fontWeight: 600,
                border: p === page ? '1px solid #4f8ef7' : '1px solid rgba(255,255,255,0.1)',
                background: p === page ? 'rgba(79,142,247,0.15)' : 'transparent',
                color: p === page ? '#4f8ef7' : 'rgba(232,238,255,0.5)', cursor: 'pointer',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
