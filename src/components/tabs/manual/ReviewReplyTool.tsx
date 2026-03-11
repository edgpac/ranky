import { useState } from 'react';
import QualityScoreRing from '../../QualityScoreRing';
import CopyButton from '../../CopyButton';

interface Detection {
  sentiment: string;
  keyPhrases: string[];
  mentionedService: string;
}

interface Result {
  id: number;
  generatedText: string;
  qualityScore: number;
  tips: string[];
  strengths: string[];
  detection: Detection;
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: '#34d399',
  neutral: '#94a3b8',
  negative: '#f87171',
  mixed: '#fbbf24',
};

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

export default function ReviewReplyTool({ isGuest }: { isGuest?: boolean }) {
  const [reviewText, setReviewText] = useState('');
  const [stars, setStars] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [editedText, setEditedText] = useState('');
  const [error, setError] = useState('');

  async function generate() {
    if (!reviewText.trim()) { setError('Paste the review text first.'); return; }
    setGenerating(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/manual/write-reply', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewText, starRating: stars }),
      });
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Review input */}
      <div style={card}>
        <span style={label}>Paste the customer review</span>
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          rows={5}
          placeholder="Paste the full review text here…"
          style={{
            width: '100%', background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem',
            padding: '0.625rem 0.875rem', color: 'rgba(232,238,255,0.9)',
            fontSize: '0.8125rem', outline: 'none', resize: 'vertical',
            boxSizing: 'border-box', lineHeight: 1.6,
          }}
        />
      </div>

      {/* Star rating */}
      <div style={card}>
        <span style={label}>Star rating</span>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setStars(n)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '1.5rem', padding: '0.125rem',
                opacity: n <= stars ? 1 : 0.25,
                filter: n <= stars ? 'none' : 'grayscale(1)',
                transition: 'all 0.15s',
              }}
            >
              ⭐
            </button>
          ))}
          <span style={{ fontSize: '0.8rem', color: 'rgba(232,238,255,0.5)', marginLeft: '0.5rem', alignSelf: 'center' }}>
            {stars} star{stars !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Generate */}
      {error && <p style={{ fontSize: '0.8rem', color: '#f87171' }}>{error}</p>}
      {isGuest ? (
        <a
          href="/signup"
          style={{
            padding: '0.75rem 1.5rem', borderRadius: '0.625rem', border: 'none',
            background: '#fbbf24', color: '#1e293b', fontWeight: 700, fontSize: '0.875rem',
            cursor: 'pointer', transition: 'background 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            textDecoration: 'none',
          }}
        >
          ⭐ Sign in to Generate Reply
        </a>
      ) : (
      <button
        onClick={generate}
        disabled={generating}
        style={{
          padding: '0.75rem 1.5rem', borderRadius: '0.625rem', border: 'none',
          background: generating ? 'rgba(251,191,36,0.4)' : '#fbbf24',
          color: '#1e293b', fontWeight: 700, fontSize: '0.875rem',
          cursor: generating ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
        }}
      >
        {generating ? (
          <>
            <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#1e293b', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
            Crafting reply…
          </>
        ) : '⭐ Generate Reply'}
      </button>
      )}

      {/* Result */}
      {result && (
        <div style={{ ...card, border: '1px solid rgba(251,191,36,0.2)' }}>
          {/* Detection summary */}
          <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(232,238,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Claude detected</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.625rem', borderRadius: '2rem', background: `${SENTIMENT_COLORS[result.detection.sentiment] || '#94a3b8'}1a`, color: SENTIMENT_COLORS[result.detection.sentiment] || '#94a3b8', border: `1px solid ${SENTIMENT_COLORS[result.detection.sentiment] || '#94a3b8'}40` }}>
                {result.detection.sentiment} tone
              </span>
              {result.detection.mentionedService && (
                <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.625rem', borderRadius: '2rem', background: 'rgba(79,142,247,0.1)', color: '#4f8ef7', border: '1px solid rgba(79,142,247,0.2)' }}>
                  mentions: {result.detection.mentionedService}
                </span>
              )}
              {result.detection.keyPhrases.map((p) => (
                <span key={p} style={{ fontSize: '0.7rem', padding: '0.2rem 0.625rem', borderRadius: '2rem', background: 'rgba(255,255,255,0.05)', color: 'rgba(232,238,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  "{p}"
                </span>
              ))}
            </div>
          </div>

          {/* Score + Copy */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <QualityScoreRing score={result.qualityScore} />
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(232,238,255,0.9)' }}>Quality Score</p>
                <p style={{ fontSize: '0.7rem', color: 'rgba(232,238,255,0.4)' }}>out of 100</p>
              </div>
            </div>
            <CopyButton text={editedText} label="Copy Reply" />
          </div>

          {/* Strengths & tips */}
          {result.strengths.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.75rem' }}>
              {result.strengths.map((s) => (
                <span key={s} style={{ fontSize: '0.7rem', padding: '0.2rem 0.625rem', borderRadius: '2rem', background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>✓ {s}</span>
              ))}
            </div>
          )}
          {result.tips.map((t) => (
            <p key={t} style={{ fontSize: '0.7rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
              💡 {t}
            </p>
          ))}

          {/* Editable reply */}
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            rows={5}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.5rem', padding: '0.625rem 0.875rem', color: 'rgba(232,238,255,0.9)',
              fontSize: '0.8125rem', outline: 'none', resize: 'vertical', marginTop: '0.75rem',
              fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box',
            }}
          />
          <p style={{ fontSize: '0.7rem', color: 'rgba(232,238,255,0.3)', marginTop: '0.375rem' }}>Edit if needed — then copy and paste into Google Business Profile</p>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
