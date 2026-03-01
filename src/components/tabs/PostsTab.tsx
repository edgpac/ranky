import { useState } from 'react';

interface Post {
  id: number;
  photo_url: string;
  post_text: string;
  search_query: string;
  posted_at: string;
  status: 'posted' | 'pending' | 'approved';
  cta_type?: string;
  cta_url?: string;
}

interface Props {
  posts: Post[];
  postsPerWeek: number;
  tone: string;
  onPostGenerated: (post: Post) => void;
  onPostUpdated: (post: Post) => void;
  onPostDeleted: (id: number) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 2) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  const days = Math.floor(diff / 86400000);
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return 'Last week';
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

// Next Mon/Wed/Fri at 9am
function nextCronRun(): string {
  const RUN_DAYS = [1, 3, 5];
  const now = new Date();
  for (let i = 0; i <= 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    d.setHours(9, 0, 0, 0);
    if (d > now && RUN_DAYS.includes(d.getDay())) {
      if (i === 0) return 'Today at 9 AM';
      if (i === 1) return 'Tomorrow at 9 AM';
      return d.toLocaleDateString('en-US', { weekday: 'long' }) + ' at 9 AM';
    }
  }
  return 'Monday at 9 AM';
}

// ─── Mock posts (guest preview) ───────────────────────────────────────────────

export const MOCK_POSTS: Post[] = [
  {
    id: -1,
    photo_url: '',
    post_text: "🏡 Vacation rental owners — don't let a maintenance issue cost you a 5-star review. Our Property Care Plans include AC filter cleaning, one free plumbing issue per month, and customizable seasonal maintenance so your rental stays guest-ready year-round.",
    search_query: 'vacation rental maintenance cabo',
    posted_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    status: 'pending',
    cta_type: 'Learn more',
  },
  {
    id: -2,
    photo_url: '',
    post_text: 'Custom Door Fabrication & Professional Installation — Modern Designs for Cabo Homes. Transform your entrance with a custom-built door that reflects your style.',
    search_query: 'custom door installation cabo san lucas',
    posted_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    status: 'posted',
    cta_type: 'Call now',
  },
  {
    id: -3,
    photo_url: '',
    post_text: 'Expert Kitchen Cabinet Fabrication and Installation. Transform your kitchen with professional cabinet installation — made to measure for your Cabo home.',
    search_query: 'kitchen cabinet installation cabo',
    posted_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    status: 'posted',
    cta_type: 'Call now',
  },
  {
    id: -4,
    photo_url: '',
    post_text: '🔧 Garbage Disposal Not Working? We Install & Replace in Cabo San Lucas. Is your kitchen sink backing up? We repair and replace all major brands same-day.',
    search_query: 'garbage disposal repair cabo san lucas',
    posted_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    status: 'posted',
    cta_type: 'Call now',
  },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '0.875rem',
  padding: '1rem',
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
  fontFamily: 'inherit',
};

const btnGhost: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.15)',
  color: 'rgba(240,244,255,0.7)',
  borderRadius: '0.5rem',
  padding: '0.3rem 0.75rem',
  fontSize: '0.8125rem',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const btnDanger: React.CSSProperties = {
  ...btnGhost,
  border: '1px solid rgba(248,113,113,0.18)',
  color: 'rgba(248,113,113,0.65)',
};

const btnApprove: React.CSSProperties = {
  background: 'rgba(52,211,153,0.12)',
  border: '1px solid rgba(52,211,153,0.30)',
  color: '#34d399',
  borderRadius: '0.5rem',
  padding: '0.3rem 0.875rem',
  fontSize: '0.8125rem',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

// ─── Automation status card ───────────────────────────────────────────────────

function AutomationCard({
  postsPerWeek,
  tone,
  generating,
  onGenerate,
}: {
  postsPerWeek: number;
  tone: string;
  generating: boolean;
  onGenerate: () => void;
}) {
  return (
    <div style={{
      background: 'rgba(52,211,153,0.04)',
      border: '1px solid rgba(52,211,153,0.14)',
      borderRadius: '0.875rem',
      padding: '1rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          {/* Active pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <span style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: '#34d399', display: 'inline-block', flexShrink: 0,
              boxShadow: '0 0 6px rgba(52,211,153,0.6)',
            }} />
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
              Active
            </span>
          </div>

          {/* Schedule */}
          <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'rgba(240,244,255,0.92)', marginBottom: '0.2rem' }}>
            Mon · Wed · Fri at 9 AM
          </p>
          <p style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.38)' }}>
            Next run: {nextCronRun()}
          </p>

          {/* Settings pills */}
          <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            {[`${postsPerWeek}×/week`, `${tone} tone`].map((label) => (
              <span key={label} style={{
                fontSize: '0.6875rem', fontWeight: 600,
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.09)',
                color: 'rgba(240,244,255,0.5)',
              }}>
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Generate Now */}
        <button
          onClick={onGenerate}
          disabled={generating}
          style={{
            ...btnPrimary,
            background: generating ? 'rgba(79,142,247,0.2)' : '#4f8ef7',
            opacity: generating ? 0.7 : 1,
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          {generating ? (
            <>
              <div className="animate-spin" style={{
                width: '10px', height: '10px', borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white',
              }} />
              Generating…
            </>
          ) : (
            'Generate Now'
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(240,244,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </span>
      <span style={{
        fontSize: '0.6875rem', fontWeight: 700,
        padding: '0.1rem 0.4rem', borderRadius: '9999px',
        background: 'rgba(255,255,255,0.07)',
        color: 'rgba(240,244,255,0.4)',
      }}>
        {count}
      </span>
      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
    </div>
  );
}

// ─── Post card ────────────────────────────────────────────────────────────────

function PostCard({
  post,
  onUpdated,
  onDeleted,
}: {
  post: Post;
  onUpdated: (p: Post) => void;
  onDeleted: (id: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(post.post_text);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveError, setSaveError] = useState('');

  const isMock = post.id < 0;
  const isPending = post.status === 'pending';

  const patchPost = async (payload: { text?: string; status?: string }) => {
    if (isMock) {
      onUpdated({ ...post, ...(payload.text ? { post_text: payload.text } : {}), ...(payload.status ? { status: payload.status as Post['status'] } : {}) });
      return;
    }
    const res = await fetch(`/api/posts/${post.id}`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    onUpdated(data.post);
  };

  const save = async () => {
    if (draft.trim() === post.post_text) { setEditing(false); return; }
    setSaving(true); setSaveError('');
    try {
      await patchPost({ text: draft });
      setEditing(false);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Save failed');
    } finally { setSaving(false); }
  };

  const approve = async () => {
    setApproving(true);
    try { await patchPost({ status: 'approved' }); }
    catch { /* optimistic — post is still in list */ }
    finally { setApproving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      if (!isMock) await fetch(`/api/posts/${post.id}`, { method: 'DELETE', credentials: 'include' });
    } catch { /* optimistic */ } finally { onDeleted(post.id); }
  };

  const cancel = () => { setDraft(post.post_text); setEditing(false); setSaveError(''); };

  return (
    <div style={card}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', marginBottom: '0.75rem' }}>
        {/* Gradient circle */}
        <div style={{
          width: '2.125rem', height: '2.125rem', borderRadius: '9999px', flexShrink: 0,
          background: isPending
            ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
            : 'linear-gradient(135deg, #4f8ef7, #34d399)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(240,244,255,0.92)', lineHeight: 1.2 }}>
            {isPending ? 'Pending Review' : post.status === 'approved' ? 'Approved' : 'Published'}
          </p>
          {/* Keyword chip */}
          {post.search_query && (
            <span style={{
              display: 'inline-block', marginTop: '0.25rem',
              fontSize: '0.6875rem', padding: '0.1rem 0.5rem',
              borderRadius: '9999px',
              background: isPending ? 'rgba(251,191,36,0.10)' : 'rgba(79,142,247,0.10)',
              border: `1px solid ${isPending ? 'rgba(251,191,36,0.22)' : 'rgba(79,142,247,0.20)'}`,
              color: isPending ? 'rgba(251,191,36,0.8)' : 'rgba(79,142,247,0.75)',
              maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              🔍 {post.search_query}
            </span>
          )}
        </div>

        <span style={{ fontSize: '0.6875rem', color: 'rgba(240,244,255,0.35)', flexShrink: 0 }}>
          {relativeTime(post.posted_at)}
        </span>
      </div>

      {/* Photo */}
      {post.photo_url && (
        <img src={post.photo_url} alt="" style={{ width: '100%', borderRadius: '0.5rem', marginBottom: '0.625rem', maxHeight: '200px', objectFit: 'cover' }} />
      )}

      {/* Post text or edit */}
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <textarea
            autoFocus
            rows={6}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(79,142,247,0.45)',
              color: 'white', borderRadius: '0.5rem',
              padding: '0.5rem 0.75rem', fontSize: '0.875rem',
              outline: 'none', resize: 'vertical', width: '100%',
              lineHeight: 1.55, fontFamily: 'inherit',
            }}
          />
          {saveError && <p style={{ color: '#f87171', fontSize: '0.75rem' }}>{saveError}</p>}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.6875rem', color: 'rgba(240,244,255,0.32)', marginRight: 'auto' }}>{draft.length} chars</span>
            <button onClick={cancel} style={btnGhost}>Cancel</button>
            <button
              onClick={save}
              disabled={saving || !draft.trim()}
              style={{ ...btnPrimary, padding: '0.3rem 0.875rem', opacity: saving || !draft.trim() ? 0.5 : 1 }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <p style={{
            fontSize: '0.875rem', lineHeight: 1.6, color: 'rgba(240,244,255,0.82)',
            marginBottom: '0.75rem',
            ...(isPending ? {} : {
              display: '-webkit-box', WebkitLineClamp: 5,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }),
          } as React.CSSProperties}>
            {post.post_text}
          </p>

          {/* Footer actions */}
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '0.5rem',
            display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem',
          }}>
            {isPending ? (
              <>
                <button onClick={handleDelete} disabled={deleting} style={{ ...btnDanger, opacity: deleting ? 0.4 : 1 }}>
                  Discard
                </button>
                <button onClick={() => { setDraft(post.post_text); setEditing(true); }} style={btnGhost}>
                  Edit
                </button>
                <button onClick={approve} disabled={approving} style={{ ...btnApprove, opacity: approving ? 0.5 : 1 }}>
                  {approving ? 'Approving…' : 'Approve ✓'}
                </button>
              </>
            ) : (
              <button onClick={() => { setDraft(post.post_text); setEditing(true); }} style={btnGhost}>
                Edit
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export default function PostsTab({ posts, postsPerWeek, tone, onPostGenerated, onPostUpdated, onPostDeleted }: Props) {
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerateError('');
    try {
      const res = await fetch('/api/generate-post', { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      onPostGenerated(data.post);
    } catch (e: unknown) {
      setGenerateError(e instanceof Error ? e.message : 'Generation failed');
      setTimeout(() => setGenerateError(''), 5000);
    } finally {
      setGenerating(false);
    }
  };

  const pending   = posts.filter((p) => p.status === 'pending');
  const published = posts.filter((p) => p.status !== 'pending');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'rgba(240,244,255,0.95)' }}>Posts</h2>
        {generateError && (
          <span style={{ fontSize: '0.75rem', color: '#f87171' }}>{generateError}</span>
        )}
      </div>

      {/* Automation status */}
      <AutomationCard
        postsPerWeek={postsPerWeek}
        tone={tone}
        generating={generating}
        onGenerate={handleGenerate}
      />

      {/* Pending approval queue */}
      {pending.length > 0 && (
        <>
          <SectionLabel label="Pending Review" count={pending.length} color="#fbbf24" />
          {pending.map((p) => (
            <PostCard key={p.id} post={p} onUpdated={onPostUpdated} onDeleted={onPostDeleted} />
          ))}
        </>
      )}

      {/* Published history */}
      {published.length > 0 && (
        <>
          <SectionLabel label="Published" count={published.length} color="#34d399" />
          {published.map((p) => (
            <PostCard key={p.id} post={p} onUpdated={onPostUpdated} onDeleted={onPostDeleted} />
          ))}
        </>
      )}

      {/* Empty state */}
      {posts.length === 0 && (
        <div style={{ ...card, textAlign: 'center', padding: '3rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'rgba(240,244,255,0.32)' }}>
            No posts yet — the automation will generate your first post on the next scheduled run.
          </p>
        </div>
      )}

    </div>
  );
}
