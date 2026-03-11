import { useRef, useState } from 'react';
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

const input: React.CSSProperties = {
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

export default function WritePostTool() {
  const [postType, setPostType] = useState<PostType>('standard');
  const [answers, setAnswers] = useState(['', '', '']);
  const [seoKeyword, setSeoKeyword] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [editedText, setEditedText] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function onImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function setAnswer(i: number, val: string) {
    setAnswers((prev) => prev.map((a, idx) => idx === i ? val : a));
  }

  async function generate() {
    if (!answers[0].trim() && !imageFile) {
      setError('Tell us what the post is about (question 1) or upload an image.');
      return;
    }
    setGenerating(true);
    setError('');
    setResult(null);

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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setGenerating(false);
    }
  }

  const charCount = editedText.length;
  const charColor = charCount > 1500 ? '#f87171' : charCount > 1200 ? '#fbbf24' : 'rgba(232,238,255,0.4)';

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
        <span style={label}>Photo (optional — Claude reads it for context)</span>
        {imagePreview ? (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <img src={imagePreview} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: '0.5rem' }} />
            <div>
              {result?.aiCaption && (
                <p style={{ fontSize: '0.75rem', color: 'rgba(232,238,255,0.6)', marginBottom: '0.5rem' }}>
                  AI saw: <em>{result.aiCaption}</em>
                </p>
              )}
              <button onClick={() => { setImageFile(null); setImagePreview(''); }} style={{ fontSize: '0.75rem', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}>
                Remove photo
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              width: '100%', padding: '1.5rem', border: '2px dashed rgba(255,255,255,0.12)',
              borderRadius: '0.75rem', background: 'transparent', color: 'rgba(232,238,255,0.45)',
              cursor: 'pointer', fontSize: '0.8125rem', textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📸</div>
            Click to upload a photo
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onImagePick} />
      </div>

      {/* Context questions */}
      <div style={card}>
        <span style={label}>Context — 3 quick questions</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {CONTEXT_QUESTIONS.map((q, i) => (
            <div key={i}>
              <p style={{ fontSize: '0.8rem', color: 'rgba(232,238,255,0.65)', marginBottom: '0.375rem' }}>
                {i + 1}. {q}
              </p>
              <textarea
                value={answers[i]}
                onChange={(e) => setAnswer(i, e.target.value)}
                rows={2}
                placeholder="Your answer…"
                style={{ ...input, resize: 'vertical', minHeight: 60 }}
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
          style={input}
        />
        <p style={{ fontSize: '0.7rem', color: 'rgba(232,238,255,0.3)', marginTop: '0.375rem' }}>Claude weaves this in naturally — no keyword stuffing.</p>
      </div>

      {/* Generate button */}
      {error && <p style={{ fontSize: '0.8rem', color: '#f87171', padding: '0 0.25rem' }}>{error}</p>}
      <button
        onClick={generate}
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
        ) : '✍️ Generate Post'}
      </button>

      {/* Result */}
      {result && (
        <div style={{ ...card, border: '1px solid rgba(79,142,247,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <QualityScoreRing score={result.qualityScore} />
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(232,238,255,0.9)' }}>Quality Score</p>
                <p style={{ fontSize: '0.7rem', color: 'rgba(232,238,255,0.4)' }}>out of 100</p>
              </div>
            </div>
            <CopyButton text={editedText} label="Copy Post" />
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

          {/* Editable text */}
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            rows={10}
            style={{ ...input, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, marginBottom: '0.5rem' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: charColor }}>{charCount}/1500 characters</span>
            <span style={{ fontSize: '0.7rem', color: 'rgba(232,238,255,0.3)' }}>Edit freely — then copy to GBP</span>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
