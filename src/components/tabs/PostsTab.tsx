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
  padding: '0.375rem 0.75rem',
  fontSize: '0.8125rem',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const btnDanger: React.CSSProperties = {
  ...btnGhost,
  border: '1px solid rgba(248,113,113,0.18)',
  color: 'rgba(248,113,113,0.65)',
};

const generateBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.375rem',
  width: '100%',
  background: 'rgba(79,142,247,0.09)',
  border: '1px solid rgba(79,142,247,0.25)',
  borderRadius: '0.5rem',
  color: 'rgba(79,142,247,0.9)',
  fontSize: '0.8125rem',
  fontWeight: 600,
  padding: '0.5rem 0.75rem',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

let mockIdCounter = 9000;

// ─── Compose card (always at top) ────────────────────────────────────────────

function ComposeCard({ onPostGenerated }: { onPostGenerated: (post: Post) => void }) {
  const [postText, setPostText] = useState('');
  const [ctaType, setCtaType] = useState('Call now');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [aiDraft, setAiDraft] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoPreview(URL.createObjectURL(f));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setAiDraft(null);
    setGenerateError('');
    try {
      const res = await fetch('/api/generate-post', { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setAiDraft(data.post?.post_text || data.text || '');
    } catch (e: unknown) {
      setGenerateError(e instanceof Error ? e.message : 'Generation failed');
      setTimeout(() => setGenerateError(''), 4000);
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = (text: string) => {
    setPublishing(true);
    onPostGenerated({
      id: mockIdCounter++,
      photo_url: photoPreview || '',
      post_text: text,
      search_query: '',
      posted_at: new Date().toISOString(),
      status: 'pending',
      cta_type: ctaType,
    });
    setPostText('');
    setAiDraft(null);
    setPhotoPreview(null);
    if (fileRef.current) fileRef.current.value = '';
    setPublishing(false);
  };

  return (
    <div style={card}>
      {/* Image drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        style={{
          border: '1.5px dashed rgba(255,255,255,0.10)',
          borderRadius: '0.625rem',
          height: '88px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
          overflow: 'hidden',
          background: photoPreview ? 'transparent' : 'rgba(255,255,255,0.02)',
          marginBottom: '0.75rem',
        }}
      >
        {photoPreview ? (
          <img src={photoPreview} alt="" style={{ height: '100%', objectFit: 'cover', width: '100%' }} />
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span style={{ fontSize: '0.8125rem', color: 'rgba(240,244,255,0.28)' }}>Add photo (optional)</span>
          </>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

      {/* State machine: spinning / ai draft / compose */}
      {generating ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.625rem',
          background: 'rgba(79,142,247,0.07)', border: '1px solid rgba(79,142,247,0.18)',
          borderRadius: '0.5rem', padding: '0.625rem 0.75rem',
        }}>
          <div
            className="animate-spin"
            style={{
              width: '0.875rem', height: '0.875rem', borderRadius: '9999px',
              border: '2px solid rgba(79,142,247,0.4)', borderTopColor: 'transparent', flexShrink: 0,
            }}
          />
          <p style={{ fontSize: '0.8125rem', color: 'rgba(232,238,255,0.55)' }}>Claude is writing a post…</p>
        </div>
      ) : aiDraft ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{
            background: 'rgba(79,142,247,0.07)', border: '1px solid rgba(79,142,247,0.22)',
            borderRadius: '0.5rem', padding: '0.625rem 0.75rem',
          }}>
            <p style={{
              fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(79,142,247,0.75)',
              letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.375rem',
            }}>
              ✦ AI Draft
            </p>
            <p style={{ fontSize: '0.8125rem', lineHeight: 1.55, color: 'rgba(240,244,255,0.82)' }}>{aiDraft}</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem' }}>
            <button style={{ ...btnGhost, padding: '0.3rem 0.75rem' }} onClick={() => setAiDraft(null)}>Discard</button>
            <button
              style={{ ...btnGhost, padding: '0.3rem 0.75rem' }}
              onClick={() => { setPostText(aiDraft); setAiDraft(null); }}
            >
              Edit
            </button>
            <button
              style={{ ...btnPrimary, padding: '0.3rem 0.875rem', opacity: publishing ? 0.45 : 1 }}
              onClick={() => handlePublish(aiDraft)}
              disabled={publishing}
            >
              {publishing ? 'Publishing…' : 'Publish Post'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {/* Textarea */}
          <div style={{ position: 'relative' }}>
            <textarea
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: '0.5rem',
                color: 'white',
                fontSize: '0.8125rem',
                padding: '0.5rem 0.75rem',
                resize: 'none',
                outline: 'none',
                width: '100%',
                lineHeight: 1.5,
                fontFamily: 'inherit',
                minHeight: '4.5rem',
              }}
              rows={3}
              placeholder="Write your post… or let AI write it"
              value={postText}
              onChange={(e) => setPostText(e.target.value.slice(0, MAX_TEXT))}
            />
            {postText.length > 0 && (
              <span style={{
                position: 'absolute', bottom: '0.4rem', right: '0.5rem',
                fontSize: '0.6875rem', color: 'rgba(240,244,255,0.32)', pointerEvents: 'none',
              }}>
                {postText.length}/{MAX_TEXT}
              </span>
            )}
          </div>

          {/* CTA select (only when composing text) */}
          {postText.trim() && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.6875rem', color: 'rgba(240,244,255,0.40)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>CTA</span>
              <select
                value={ctaType}
                onChange={(e) => setCtaType(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: 'rgba(240,244,255,0.7)',
                  borderRadius: '0.4rem',
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.75rem',
                  outline: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  appearance: 'none' as const,
                }}
              >
                {CTA_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} style={{ background: '#080d1a' }}>{opt}</option>
                ))}
              </select>
            </div>
          )}

          {generateError && (
            <p style={{ color: '#f87171', fontSize: '0.75rem', margin: 0 }}>{generateError}</p>
          )}

          {/* Full-width generate button */}
          <button onClick={handleGenerate} disabled={generating} style={generateBtn}>
            ✦ Generate Post with AI
          </button>

          {/* Publish only shown when user has typed something */}
          {postText.trim() && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem' }}>
              <button style={{ ...btnGhost, padding: '0.3rem 0.75rem' }} onClick={() => setPostText('')}>Clear</button>
              <button style={{ ...btnPrimary, padding: '0.3rem 0.875rem' }} onClick={() => handlePublish(postText)}>
                Publish Post
              </button>
            </div>
          )}
        </div>
      )}
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
      if (!isMock) {
        const res = await fetch(`/api/posts/${post.id}`, {
          method: 'PATCH', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: draft }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        onUpdated(data.post);
      } else {
        onUpdated({ ...post, post_text: draft });
      }
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
      {/* Header — mirrors ReviewCard layout */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.625rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          {/* Gradient circle with doc icon */}
          <div style={{
            width: '2.125rem', height: '2.125rem', borderRadius: '9999px',
            background: 'linear-gradient(135deg, #4f8ef7, #34d399)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div>
            {/* Status + CTA chip row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '9999px', background: dotColor, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(240,244,255,0.95)', lineHeight: 1.2 }}>{statusLabel}</span>
              {post.cta_type && (
                <span style={{
                  fontSize: '0.6875rem', padding: '0.1rem 0.45rem', borderRadius: '9999px',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)',
                  color: 'rgba(240,244,255,0.48)',
                }}>
                  {post.cta_type}
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.6875rem', color: 'rgba(240,244,255,0.45)', marginTop: '0.125rem' }}>
              {relativeTime(post.posted_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Post image */}
      {post.photo_url && (
        <img
          src={post.photo_url}
          alt=""
          style={{ width: '100%', borderRadius: '0.5rem', marginBottom: '0.625rem', maxHeight: '200px', objectFit: 'cover' }}
        />
      )}

      {/* Post text or edit mode */}
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
            rows={5}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
          />
          {saveError && <p style={{ color: '#f87171', fontSize: '0.75rem' }}>{saveError}</p>}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.6875rem', color: 'rgba(240,244,255,0.35)', marginRight: 'auto' }}>
              {draft.length} chars
            </span>
            <button onClick={cancel} style={{ ...btnGhost, padding: '0.3rem 0.75rem' }}>Cancel</button>
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
          <p
            style={{
              fontSize: '0.875rem', lineHeight: 1.6, color: 'rgba(240,244,255,0.82)', marginBottom: '0.75rem',
              display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            } as React.CSSProperties}
          >
            {post.post_text}
          </p>
          {/* Footer with Edit / Delete */}
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '0.5rem',
            display: 'flex', justifyContent: 'flex-end', gap: '0.5rem',
          }}>
            <button
              onClick={() => { setDraft(post.post_text); setEditing(true); }}
              style={{ ...btnGhost, padding: '0.3rem 0.75rem' }}
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{ ...btnDanger, padding: '0.3rem 0.75rem', opacity: deleting ? 0.45 : 1 }}
            >
              {deleting ? '…' : 'Delete'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export default function PostsTab({ posts, onPostGenerated, onPostUpdated, onPostDeleted }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'rgba(240,244,255,0.95)' }}>Posts</h2>
      </div>

      {/* Compose card — always visible at top */}
      <ComposeCard onPostGenerated={onPostGenerated} />

      {/* Existing posts */}
      {posts.map((p) => (
        <PostCard key={p.id} post={p} onUpdated={onPostUpdated} onDeleted={onPostDeleted} />
      ))}

    </div>
  );
}
