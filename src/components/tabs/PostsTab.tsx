import { useRef, useState } from 'react';

// ─── AI capability bullets ─────────────────────────────────────────────────────
const AI_POST_BULLETS = [
  { icon: '◎', text: 'Targets your top local Google search queries — post copy is written around what people nearby are already searching for' },
  { icon: '◇', text: 'Pulls real photos from your GBP gallery and matches the image to the post topic automatically' },
  { icon: '◈', text: 'Spotlights your services and products — each post can feature a specific offering with its name and price' },
  { icon: '✦', text: 'Mines your existing reviews for authentic language and proof points to weave into post copy' },
  { icon: '⊙', text: 'Angles vary every post: seasonal promotions, before/after results, tips, FAQs, product highlights, and more' },
  { icon: '⊞', text: 'Writes in your configured tone, includes a matched CTA, and publishes on your 1–4× per week schedule automatically' },
];

function AiBanner() {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        background: 'rgba(79,142,247,0.07)',
        border: '1px solid rgba(79,142,247,0.20)',
        backdropFilter: 'blur(12px)',
        borderRadius: '0.875rem',
        padding: '0.875rem 1.125rem',
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span style={{ fontSize: '1rem' }}>🤖</span>
          <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(232,238,255,0.88)' }}>
            AI Post Generator — powered by Claude
          </p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            fontSize: '0.75rem',
            color: '#4f8ef7',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            flexShrink: 0,
            fontWeight: 600,
          }}
        >
          {open ? 'Hide' : 'How it works'}
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-2 mt-3 pt-3" style={{ borderTop: '1px solid rgba(79,142,247,0.15)' }}>
          {AI_POST_BULLETS.map((b) => (
            <div key={b.icon} className="flex items-start gap-2.5">
              <span style={{ fontSize: '0.625rem', color: '#4f8ef7', marginTop: '0.2rem', flexShrink: 0 }}>{b.icon}</span>
              <p style={{ fontSize: '0.8125rem', color: 'rgba(232,238,255,0.70)', lineHeight: 1.5 }}>{b.text}</p>
            </div>
          ))}
          <p style={{ fontSize: '0.75rem', color: 'rgba(232,238,255,0.38)', marginTop: '0.25rem' }}>
            Posts are generated automatically on your schedule. You can edit any draft before it goes live.
          </p>
        </div>
      )}
    </div>
  );
}

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
}

const CTA_OPTIONS = ['Call now', 'Learn more', 'Book', 'Order online', 'Sign up'];

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  posted:   { background: 'rgba(52,211,153,0.12)',  color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' },
  approved: { background: 'rgba(79,142,247,0.12)',  color: '#4f8ef7', border: '1px solid rgba(79,142,247,0.25)' },
  pending:  { background: 'rgba(251,191,36,0.12)',  color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' },
};

const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
  backdropFilter: 'blur(8px)',
  borderRadius: '1rem',
  padding: '1.25rem',
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

let mockIdCounter = 9000;

function PostCard({ post, onUpdated }: { post: Post; onUpdated: (p: Post) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(post.post_text);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const save = async () => {
    if (draft.trim() === post.post_text) { setEditing(false); return; }
    setSaving(true); setSaveError('');
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdated(data.post); setEditing(false);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Save failed');
    } finally { setSaving(false); }
  };

  const cancel = () => { setDraft(post.post_text); setEditing(false); setSaveError(''); };
  const statusLabel = post.status === 'posted' ? 'Live' : post.status === 'approved' ? 'Approved' : 'Pending';

  return (
    <div style={glassCard}>
      <div className="flex gap-4">
        {/* Image placeholder */}
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '0.75rem',
            flexShrink: 0,
            overflow: 'hidden',
            background: post.photo_url ? 'transparent' : 'linear-gradient(135deg, #4f8ef7, #7c5af7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {post.photo_url ? (
            <img src={post.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '1.5rem' }}>📷</span>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {editing ? (
            <>
              <textarea
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid #4f8ef7',
                  color: 'white',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                  resize: 'vertical',
                  width: '100%',
                  lineHeight: 1.5,
                }}
                rows={4}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                autoFocus
              />
              {saveError && <p style={{ color: '#f87171', fontSize: '0.75rem' }}>{saveError}</p>}
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.5)', marginRight: 'auto' }}>{draft.length} chars</span>
                <button onClick={cancel} style={btnGhost}>Cancel</button>
                <button
                  onClick={save}
                  disabled={saving || !draft.trim()}
                  style={{ ...btnPrimary, opacity: saving || !draft.trim() ? 0.5 : 1 }}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </>
          ) : (
            <>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'rgba(240,244,255,0.85)',
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                } as React.CSSProperties}
              >
                {post.post_text}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    padding: '0.125rem 0.5rem',
                    borderRadius: '9999px',
                    ...(STATUS_STYLE[post.status] || STATUS_STYLE.pending),
                  }}
                >
                  {statusLabel}
                </span>
                {post.cta_type && (
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '9999px',
                      background: 'rgba(255,255,255,0.07)',
                      color: 'rgba(240,244,255,0.6)',
                      border: '1px solid rgba(255,255,255,0.10)',
                    }}
                  >
                    {post.cta_type}
                  </span>
                )}
                <span style={{ fontSize: '0.6875rem', color: 'rgba(240,244,255,0.4)' }}>
                  {new Date(post.posted_at).toLocaleDateString()}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Edit button */}
        {!editing && (
          <button
            onClick={() => { setDraft(post.post_text); setEditing(true); }}
            style={{ ...btnGhost, alignSelf: 'flex-start', flexShrink: 0, fontSize: '0.8125rem' }}
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
}

export default function PostsTab({ posts, onPostGenerated, onPostUpdated }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [postText, setPostText] = useState('');
  const [ctaType, setCtaType] = useState('Call now');
  const [ctaUrl, setCtaUrl] = useState('');
  const [, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const MAX_TEXT = 1500;

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
    <div className="flex flex-col gap-5">
      <AiBanner />

      {/* Top action row */}
      <div className="flex items-center justify-between">
        <p style={{ fontSize: '0.875rem', color: 'rgba(240,244,255,0.5)' }}>
          AI writes from your photos, services, products, reviews & top local search queries.
        </p>
        <button
          style={{ ...btnPrimary, flexShrink: 0 }}
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? 'Close' : '+ Add Post'}
        </button>
      </div>

      {/* Inline add post form */}
      {showForm && (
        <div style={glassCard}>
          <div className="flex flex-col gap-4">
            {/* Text area */}
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
                  minHeight: '100px',
                }}
                rows={5}
                placeholder="Write your post..."
                value={postText}
                onChange={(e) => setPostText(e.target.value.slice(0, MAX_TEXT))}
              />
              <span
                style={{
                  position: 'absolute',
                  bottom: '0.5rem',
                  right: '0.75rem',
                  fontSize: '0.6875rem',
                  color: 'rgba(240,244,255,0.4)',
                  pointerEvents: 'none',
                }}
              >
                {postText.length} / {MAX_TEXT}
              </span>
            </div>

            {/* CTA + URL row */}
            <div className="flex gap-3">
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(240,244,255,0.5)', display: 'block', marginBottom: '0.25rem' }}>
                  CTA Type
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
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(240,244,255,0.5)', display: 'block', marginBottom: '0.25rem' }}>
                  URL
                </label>
                <input
                  style={inputStyle}
                  type="url"
                  placeholder="https://..."
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                />
              </div>
            </div>

            {/* Photo upload */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(240,244,255,0.5)', display: 'block', marginBottom: '0.25rem' }}>
                Photo (optional)
              </label>
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  border: '2px dashed rgba(255,255,255,0.15)',
                  borderRadius: '0.5rem',
                  height: '80px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="" style={{ height: '100%', objectFit: 'cover', width: '100%' }} />
                ) : (
                  <p style={{ fontSize: '0.8125rem', color: 'rgba(240,244,255,0.4)' }}>Drop photo or click to upload</p>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 justify-end">
              <button style={btnGhost} onClick={handleCancel}>Cancel</button>
              <button style={btnPrimary} onClick={handlePublish}>Publish Post</button>
            </div>
          </div>
        </div>
      )}

      {/* Post list */}
      {posts.length === 0 && !showForm && (
        <div style={{ ...glassCard, textAlign: 'center', padding: '3rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'rgba(240,244,255,0.4)' }}>No posts yet. Click "Add Post" to create your first post.</p>
        </div>
      )}

      {posts.length > 0 && (
        <div className="flex flex-col gap-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} onUpdated={onPostUpdated} />
          ))}
        </div>
      )}
    </div>
  );
}
