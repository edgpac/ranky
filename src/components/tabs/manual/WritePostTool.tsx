import { useEffect, useRef, useState } from 'react';
import QualityScoreRing from '../../QualityScoreRing';
import CopyButton from '../../CopyButton';

type PostType = 'standard' | 'offer' | 'event' | 'seasonal';

interface Result {
  id: number;
  generatedText: string;
  qualityScore: number;
  tips: string[];
  strengths: string[];
  aiCaption: string;
  charCount: number;
}

interface Props {
  businessName?: string;
  isGuest?: boolean;
}

const POST_TYPES: { value: PostType; label: string; emoji: string }[] = [
  { value: 'standard', label: 'Update', emoji: '📢' },
  { value: 'offer', label: 'Offer', emoji: '🎁' },
  { value: 'event', label: 'Event', emoji: '📅' },
  { value: 'seasonal', label: 'Seasonal', emoji: '🌿' },
];

const CONTEXT_QUESTIONS = [
  'What is this post about? (recent job, service, promo, milestone…)',
  'What makes your business different or better here?',
  'What do you want customers to do after reading? (call, book, visit…)',
];

const CONTEXT_QUESTIONS_WITH_IMAGE = [
  'Describe the image in your own words — what does it show?',
  'What makes your business different or better here?',
  'What do you want customers to do after reading? (call, book, visit…)',
];

const DRAFT_KEY = 'hv_post_draft';

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.035)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '1rem',
  padding: '1.5rem',
};

const label: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'rgba(232,238,255,0.55)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: '0.5rem',
  display: 'block',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '0.5rem',
  padding: '0.625rem 0.875rem',
  color: 'rgba(232,238,255,0.9)',
  fontSize: '0.8125rem',
  outline: 'none',
  boxSizing: 'border-box',
};

export default function WritePostTool({ businessName, isGuest }: Props) {
  const [postType, setPostType] = useState<PostType>('standard');
  const [answers, setAnswers] = useState(['', '', '']);
  const [seoKeyword, setSeoKeyword] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [generating, setGenerating] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [editedText, setEditedText] = useState('');
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load draft on mount
  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
      if (d.answers) setAnswers(d.answers);
      if (d.seoKeyword) setSeoKeyword(d.seoKeyword);
      if (d.postType) setPostType(d.postType);
    } catch {
      // ignore malformed draft
    }
  }, []);

  // Auto-save draft with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ answers, seoKeyword, postType }));
      } catch {
        // ignore storage errors
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [answers, seoKeyword, postType]);

  // Window-level paste handler
  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      const item = e.clipboardData?.items?.[0];
      if (item?.type.startsWith('image/')) {
        const f = item.getAsFile();
        if (f) {
          setImageFile(f);
          setImagePreview(URL.createObjectURL(f));
        }
      }
    };
    window.addEventListener('paste', handler);
    return () => window.removeEventListener('paste', handler);
  }, []);

  function onImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }

  function onDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }

  function setAnswer(i: number, val: string) {
    setAnswers((prev) => prev.map((a, idx) => idx === i ? val : a));
  }

  function clearForm() {
    setPostType('standard');
    setAnswers(['', '', '']);
    setSeoKeyword('');
    setImageFile(null);
    setImagePreview('');
    setResult(null);
    setEditedText('');
    setError('');
    setShowPreview(false);
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
  }

  async function generate(isRegen = false) {
    if (!answers[0].trim() && !imageFile) {
      setError('Tell us what the post is about (question 1) or upload an image.');
      return;
    }
    if (isRegen) {
      setRegenerating(true);
    } else {
      setGenerating(true);
      setResult(null);
    }
    setError('');

    const form = new FormData();
    form.append('postType', postType);
    answers.forEach((a) => form.append('contextAnswers[]', a));
    if (seoKeyword) form.append('seoKeyword', seoKeyword);
    if (imageFile) form.append('image', imageFile);

    try {
      const res = await fetch('/api/manual/write-post', { method: 'POST', credentials: 'include', body: form });
      if (!res.ok) throw new Error((await res.json()).error || 'Generation failed');
      const data: Result = await res.json();
      setResult(data);
      setEditedText(data.generatedText);
      setShowPreview(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setGenerating(false);
      setRegenerating(false);
    }
  }

  const charCount = editedText.length;
  const wordCount = editedText.trim() ? editedText.trim().split(/\s+/).length : 0;
  const charColor = charCount > 1500 ? '#f87171' : charCount > 1200 ? '#fbbf24' : 'rgba(232,238,255,0.4)';
  const displayName = businessName || 'Your Business';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Post type */}
      <div style={card}>
        <span style={label}>Post type</span>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {POST_TYPES.map(({ value, label: l, emoji }) => (
            <button
              key={value}
              onClick={() => setPostType(value)}
              style={{
                padding: '0.4rem 0.875rem',
                borderRadius: '2rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: postType === value ? '1px solid #4f8ef7' : '1px solid rgba(255,255,255,0.1)',
                background: postType === value ? 'rgba(79,142,247,0.18)' : 'transparent',
                color: postType === value ? '#4f8ef7' : 'rgba(232,238,255,0.55)',
                transition: 'all 0.15s',
              }}
            >
              {emoji} {l}
            </button>
          ))}
        </div>
      </div>

      {/* Image upload */}
      <div style={card}>
        <span style={label}>Photo — upload to write a post about your work</span>
        {imagePreview ? (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <img src={imagePreview} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid rgba(79,142,247,0.3)' }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4f8ef7', marginBottom: '0.25rem' }}>
                ✓ Photo ready — Claude will write a post about what it shows
              </p>
              {result?.aiCaption && (
                <p style={{ fontSize: '0.72rem', color: 'rgba(232,238,255,0.5)', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                  AI saw: <em style={{ color: 'rgba(232,238,255,0.7)' }}>{result.aiCaption}</em>
                </p>
              )}
              <button onClick={() => { setImageFile(null); setImagePreview(''); }} style={{ fontSize: '0.72rem', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Remove photo
              </button>
            </div>
          </div>
        ) : (
          <div
            onDragOver={onDragOver}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              width: '100%',
              padding: '1.75rem 1.5rem',
              border: dragActive ? '2px dashed #4f8ef7' : '2px dashed rgba(255,255,255,0.12)',
              borderRadius: '0.75rem',
              background: dragActive ? 'rgba(79,142,247,0.07)' : 'rgba(255,255,255,0.02)',
              color: dragActive ? '#4f8ef7' : 'rgba(232,238,255,0.45)',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              textAlign: 'center',
              transition: 'all 0.15s',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{dragActive ? '⬇️' : '📸'}</div>
            <p style={{ fontWeight: 600, marginBottom: '0.25rem', color: dragActive ? '#4f8ef7' : 'rgba(232,238,255,0.7)' }}>
              {dragActive ? 'Drop photo here' : 'Upload a photo of your work'}
            </p>
            <p style={{ fontSize: '0.72rem', color: 'rgba(232,238,255,0.35)', lineHeight: 1.4 }}>
              Click · drag & drop · or paste from clipboard<br />
              Claude analyzes the image and writes a post about what it shows
            </p>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onImagePick} />
      </div>

      {/* Context questions */}
      <div style={card}>
        <span style={label}>
          {imageFile ? 'Your perspective — Claude combines this with the photo' : 'Context — 3 quick questions'}
        </span>
        {imageFile && (
          <p style={{ fontSize: '0.72rem', color: 'rgba(232,238,255,0.4)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
            Claude sees the photo <em>and</em> reads your answers — both shape the post equally.
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {(imageFile ? CONTEXT_QUESTIONS_WITH_IMAGE : CONTEXT_QUESTIONS).map((q, i) => (
            <div key={i}>
              <p style={{ fontSize: '0.8rem', color: 'rgba(232,238,255,0.65)', marginBottom: '0.375rem' }}>
                {i + 1}. {q}
              </p>
              <textarea
                value={answers[i]}
                onChange={(e) => setAnswer(i, e.target.value)}
                rows={2}
                placeholder={imageFile ? 'Optional…' : 'Your answer…'}
                style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* SEO keyword */}
      <div style={card}>
        <span style={label}>SEO keyword to rank for (optional)</span>
        <input
          type="text"
          value={seoKeyword}
          onChange={(e) => setSeoKeyword(e.target.value.slice(0, 60))}
          placeholder="e.g. kitchen remodel Los Cabos"
          style={inputStyle}
        />
        <p style={{ fontSize: '0.7rem', color: 'rgba(232,238,255,0.3)', marginTop: '0.375rem' }}>Claude weaves this in naturally — no keyword stuffing.</p>
      </div>

      {/* Generate button + clear */}
      {error && <p style={{ fontSize: '0.8rem', color: '#f87171', padding: '0 0.25rem' }}>{error}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
        {isGuest ? (
          <a
            href="/signup"
            style={{
              padding: '0.75rem 1.5rem', borderRadius: '0.625rem', border: 'none',
              background: '#4f8ef7', color: '#fff', fontWeight: 700, fontSize: '0.875rem',
              cursor: 'pointer', transition: 'background 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              textDecoration: 'none',
            }}
          >
            ✍️ Sign in to Generate Post
          </a>
        ) : (
        <button
          onClick={() => generate(false)}
          disabled={generating}
          style={{
            padding: '0.75rem 1.5rem', borderRadius: '0.625rem', border: 'none',
            background: generating ? 'rgba(79,142,247,0.4)' : '#4f8ef7',
            color: '#fff', fontWeight: 700, fontSize: '0.875rem',
            cursor: generating ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          }}
        >
          {generating ? (
            <>
              <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
              Writing your post…
            </>
          ) : imageFile ? '📸 Write Post from Photo' : '✍️ Generate Post'}
        </button>
        )}
        <button
          onClick={clearForm}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '0.75rem', color: 'rgba(232,238,255,0.3)',
            textAlign: 'center', textDecoration: 'underline', padding: '0.25rem',
          }}
        >
          Clear form
        </button>
      </div>

      {/* Result */}
      {result && (
        <div style={{ ...card, border: '1px solid rgba(79,142,247,0.2)' }}>
          {/* Top row: score + business name + controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <QualityScoreRing score={result.qualityScore} />
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(232,238,255,0.9)' }}>{displayName}</p>
                <p style={{ fontSize: '0.7rem', color: 'rgba(232,238,255,0.4)' }}>Quality score: {result.qualityScore}/100</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {/* Preview toggle */}
              <button
                onClick={() => setShowPreview((v) => !v)}
                style={{
                  padding: '0.375rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 600,
                  cursor: 'pointer', border: showPreview ? '1px solid #7c5af7' : '1px solid rgba(255,255,255,0.12)',
                  background: showPreview ? 'rgba(124,90,247,0.15)' : 'rgba(255,255,255,0.04)',
                  color: showPreview ? '#a78bfa' : 'rgba(232,238,255,0.6)',
                  transition: 'all 0.15s',
                }}
              >
                {showPreview ? '✏️ Edit' : '👁 Preview'}
              </button>
              {/* Regenerate */}
              <button
                onClick={() => generate(true)}
                disabled={regenerating}
                style={{
                  padding: '0.375rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 600,
                  cursor: regenerating ? 'not-allowed' : 'pointer',
                  border: '1px solid rgba(251,191,36,0.25)',
                  background: 'rgba(251,191,36,0.08)',
                  color: regenerating ? 'rgba(251,191,36,0.4)' : '#fbbf24',
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  transition: 'all 0.15s',
                }}
              >
                {regenerating ? (
                  <>
                    <span style={{ width: 10, height: 10, border: '1.5px solid rgba(251,191,36,0.3)', borderTopColor: '#fbbf24', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                    Rewriting…
                  </>
                ) : '🔄 Try different version'}
              </button>
              <CopyButton text={editedText} label="Copy Post" />
            </div>
          </div>

          {/* Strengths */}
          {result.strengths.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.75rem' }}>
              {result.strengths.map((s) => (
                <span key={s} style={{ fontSize: '0.7rem', padding: '0.2rem 0.625rem', borderRadius: '2rem', background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>
                  ✓ {s}
                </span>
              ))}
            </div>
          )}

          {/* Tips */}
          {result.tips.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.75rem' }}>
              {result.tips.map((t) => (
                <span key={t} style={{ fontSize: '0.7rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span>💡</span> {t}
                </span>
              ))}
            </div>
          )}

          {/* Textarea OR Preview card */}
          {showPreview ? (
            /* GBP-style preview card */
            <div style={{
              background: '#fff', borderRadius: '0.75rem',
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)', overflow: 'hidden',
              marginBottom: '0.5rem',
            }}>
              {imagePreview && (
                <img src={imagePreview} alt="" style={{ width: '100%', height: 150, objectFit: 'cover', display: 'block' }} />
              )}
              <div style={{ padding: '0.875rem 1rem' }}>
                <p style={{ fontSize: '0.6875rem', color: '#70757a', marginBottom: '0.25rem' }}>Google Business</p>
                <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#202124', marginBottom: '0.5rem' }}>{displayName}</p>
                <p style={{ fontSize: '0.8125rem', color: '#3c4043', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{editedText}</p>
                <p style={{ fontSize: '0.8125rem', color: '#1a73e8', marginTop: '0.75rem', fontWeight: 500 }}>Learn more</p>
              </div>
            </div>
          ) : (
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={10}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, marginBottom: '0.5rem' }}
            />
          )}

          {/* Word + char counts */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: charColor }}>{charCount}/1500 characters</span>
              <span style={{ fontSize: '0.7rem', color: 'rgba(232,238,255,0.3)' }}>{wordCount} words</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'rgba(232,238,255,0.3)' }}>Edit freely — then copy to GBP</span>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
