import { useRef, useState } from 'react';

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
  onPostGenerated: (post: Post) => void;
  onPostUpdated: (post: Post) => void;
  onPostDeleted: (id: number) => void;
}

const CTA_OPTIONS = ['Call now', 'Learn more', 'Book', 'Order online', 'Sign up'];
const MAX_TEXT = 1500;

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

// ─── Mock posts (guest / empty state preview) ─────────────────────────────────

export const MOCK_POSTS: Post[] = [
  {
    id: -1,
    photo_url: '',
    post_text: "🏡 Vacation rental owners — don't let a maintenance issue cost you a 5-star review. Our Property Care Plans include AC filter cleaning, one free plumbing issue per month, and customizable seasonal maintenance so your rental stays guest-ready year-round.",
    search_query: 'vacation rental maintenance cabo',
    posted_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    status: 'posted',
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
    post_text: '🔧 Garbage Disposal Not Working? We Install & Replace in Cabo San Lucas. Is your kitchen sink backing up?',
    search_query: 'garbage disposal repair cabo san lucas',
    posted_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    status: 'posted',
    cta_type: 'Call now',
  },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const STATUS_DOT: Record<string, string> = {
  posted:   '#34d399',
  approved: '#4f8ef7',
  pending:  '#fbbf24',
};

const STATUS_LABEL: Record<string, string> = {
  posted:   'Live',
  approved: 'Approved',
  pending:  'Pending',
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
  width: '100%',
  fontFamily: 'inherit',
};

const btnPrimary: React.CSSProperties = {
  background: '#4f8ef7',
  color: 'white',
  borderRadius: '0.5rem',
  padding: '0.4rem 0.875rem',
  fontSize: '0.8125rem',
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const btnGhost: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.12)',
  color: 'rgba(240,244,255,0.6)',
  borderRadius: '0.4rem',
  padding: '0.25rem 0.625rem',
  fontSize: '0.75rem',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const btnDanger: React.CSSProperties = {
  ...btnGhost,
  border: '1px solid rgba(248,113,113,0.18)',
  color: 'rgba(248,113,113,0.65)',
};

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '0.875rem',
  padding: '0.875rem',
};

let mockIdCounter = 9000;

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
  const [deleting, setDeleting] = useState(false);
  const [saveError, setSaveError] = useState('');

  const dotColor = STATUS_DOT[post.status] ?? STATUS_DOT.pending;
  const statusLabel = STATUS_LABEL[post.status] ?? 'Pending';
  const isMock = post.id < 0;

  const save = async () => {
    if (draft.trim() === post.post_text) { setEditing(false); return; }
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdated(data.post);
      setEditing(false);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      if (!isMock) {
        await fetch(`/api/posts/${post.id}`, { method: 'DELETE', credentials: 'include' });
      }
    } catch { /* optimistic */ } finally {
      onDeleted(post.id);
    }
  };

  const cancel = () => { setDraft(post.post_text); setEditing(false); setSaveError(''); };

  return (
    <div style={card}>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>

        {/* Thumbnail */}
        <div
          style={{
            width: '4.5rem', height: '4.5rem',
            borderRadius: '0.625rem',
            flexShrink: 0,
            overflow: 'hidden',
            background: post.photo_url
              ? 'transparent'
              : 'linear-gradient(135deg, rgba(79,142,247,0.18), rgba(124,90,247,0.18))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {post.photo_url ? (
            <img src={post.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <textarea
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(79,142,247,0.45)',
                  color: 'white',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                  resize: 'vertical',
                  width: '100%',
                  lineHeight: 1.5,
                  fontFamily: 'inherit',
                }}
                rows={4}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                autoFocus
              />
              {saveError && <p style={{ color: '#f87171', fontSize: '0.75rem' }}>{saveError}</p>}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.6875rem', color: 'rgba(240,244,255,0.35)', marginRight: 'auto' }}>
                  {draft.length} chars
                </span>
                <button onClick={cancel} style={btnGhost}>Cancel</button>
                <button
                  onClick={save}
                  disabled={saving || !draft.trim()}
                  style={{ ...btnPrimary, opacity: saving || !draft.trim() ? 0.5 : 1 }}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'rgba(240,244,255,0.88)',
                  lineHeight: 1.55,
                  display: '-webkit-box',
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                } as React.CSSProperties}
              >
                {post.post_text}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                {/* Status dot + label */}
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{
                    width: '5px', height: '5px', borderRadius: '9999px',
                    background: dotColor, display: 'inline-block', flexShrink: 0,
                  }} />
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: dotColor }}>
                    {statusLabel}
                  </span>
                </span>
                {/* CTA chip */}
                {post.cta_type && (
                  <span style={{
                    fontSize: '0.6875rem',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '9999px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    color: 'rgba(240,244,255,0.48)',
                  }}>
                    {post.cta_type}
                  </span>
                )}
                {/* Relative timestamp */}
                <span style={{ marginLeft: 'auto', fontSize: '0.6875rem', color: 'rgba(240,244,255,0.32)' }}>
                  {relativeTime(post.posted_at)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Action buttons */}
        {!editing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flexShrink: 0 }}>
            <button
              onClick={() => { setDraft(post.post_text); setEditing(true); }}
              style={btnGhost}
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{ ...btnDanger, opacity: deleting ? 0.45 : 1 }}
            >
              {deleting ? '…' : 'Delete'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export default function PostsTab({ posts, onPostGenerated, onPostUpdated, onPostDeleted }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [postText, setPostText] = useState('');
  const [ctaType, setCtaType] = useState('Call now');
  const [ctaUrl, setCtaUrl] = useState('');
  const [, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
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
      setTimeout(() => setGenerateError(''), 4000);
    } finally {
      setGenerating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoFile(f);
    setPhotoPreview(URL.createObjectURL(f));
  };

  const handlePublish = () => {
    const newPost: Post = {
      id: mockIdCounter++,
      photo_url: photoPreview || '',
      post_text: postText || 'New post',
      search_query: '',
      posted_at: new Date().toISOString(),
      status: 'pending',
      cta_type: ctaType,
      cta_url: ctaUrl,
    };
    onPostGenerated(newPost);
    setShowForm(false);
    setPostText('');
    setCtaType('Call now');
    setCtaUrl('');
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleCancel = () => {
    setShowForm(false);
    setPostText('');
    setCtaType('Call now');
    setCtaUrl('');
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'rgba(240,244,255,0.95)' }}>Posts</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {generateError && (
            <span style={{ fontSize: '0.75rem', color: '#f87171' }}>{generateError}</span>
          )}
          <button
            style={{
              ...btnPrimary,
              background: 'rgba(79,142,247,0.15)',
              color: '#4f8ef7',
              border: '1px solid rgba(79,142,247,0.30)',
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              opacity: generating ? 0.6 : 1,
              cursor: generating ? 'default' : 'pointer',
            }}
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <>
                <span style={{
                  width: '10px', height: '10px',
                  border: '2px solid rgba(79,142,247,0.4)',
                  borderTopColor: '#4f8ef7',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.8s linear infinite',
                }} />
                Generating…
              </>
            ) : (
              <>✦ Generate Post</>
            )}
          </button>
          <button style={btnPrimary} onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Close' : '+ Add Post'}
          </button>
        </div>
      </div>

      {/* Add post form */}
      {showForm && (
        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Post text */}
          <div style={{ position: 'relative' }}>
            <textarea
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.10)',
                color: 'white',
                borderRadius: '0.5rem',
                padding: '0.625rem 0.75rem',
                fontSize: '0.875rem',
                outline: 'none',
                resize: 'vertical',
                width: '100%',
                lineHeight: 1.6,
                minHeight: '6rem',
                fontFamily: 'inherit',
              }}
              rows={4}
              placeholder="Write your post…"
              value={postText}
              onChange={(e) => setPostText(e.target.value.slice(0, MAX_TEXT))}
            />
            <span style={{
              position: 'absolute', bottom: '0.5rem', right: '0.75rem',
              fontSize: '0.6875rem', color: 'rgba(240,244,255,0.32)', pointerEvents: 'none',
            }}>
              {postText.length} / {MAX_TEXT}
            </span>
          </div>

          {/* CTA + URL */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{
                fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(240,244,255,0.40)',
                display: 'block', marginBottom: '0.25rem', letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                CTA
              </label>
              <select
                style={{ ...inputStyle, appearance: 'none' as const }}
                value={ctaType}
                onChange={(e) => setCtaType(e.target.value)}
              >
                {CTA_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} style={{ background: '#080d1a' }}>{opt}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 2 }}>
              <label style={{
                fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(240,244,255,0.40)',
                display: 'block', marginBottom: '0.25rem', letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                URL
              </label>
              <input
                style={inputStyle}
                type="url"
                placeholder="https://…"
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
              />
            </div>
          </div>

          {/* Photo upload */}
          <div>
            <label style={{
              fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(240,244,255,0.40)',
              display: 'block', marginBottom: '0.25rem', letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              Photo (optional)
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: '1.5px dashed rgba(255,255,255,0.10)',
                borderRadius: '0.5rem',
                height: '68px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', overflow: 'hidden',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="" style={{ height: '100%', objectFit: 'cover', width: '100%' }} />
              ) : (
                <p style={{ fontSize: '0.8125rem', color: 'rgba(240,244,255,0.28)' }}>Click to upload</p>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button style={btnGhost} onClick={handleCancel}>Cancel</button>
            <button style={btnPrimary} onClick={handlePublish}>Publish Post</button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {posts.length === 0 && !showForm && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '0.875rem',
          padding: '3rem',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '0.875rem', color: 'rgba(240,244,255,0.32)' }}>
            No posts yet — click "+ Add Post" to get started.
          </p>
        </div>
      )}

      {/* Post list */}
      {posts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {posts.map((p) => (
            <PostCard key={p.id} post={p} onUpdated={onPostUpdated} onDeleted={onPostDeleted} />
          ))}
        </div>
      )}
    </div>
  );
}
