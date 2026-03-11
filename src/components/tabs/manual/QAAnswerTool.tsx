import { useState } from 'react';
import QualityScoreRing from '../../QualityScoreRing';
import CopyButton from '../../CopyButton';

type Style = 'brief' | 'detailed' | 'conversational';

interface Result {
  id: number;
  generatedText: string;
  qualityScore: number;
  tips: string[];
  strengths: string[];
}

const STYLES: { value: Style; label: string; desc: string }[] = [
  { value: 'brief', label: 'Brief', desc: '2-3 sentences' },
  { value: 'detailed', label: 'Detailed', desc: 'Full paragraph' },
  { value: 'conversational', label: 'Conversational', desc: 'Warm & direct' },
];

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.035)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '1rem',
  padding: '1.5rem',
};

const label: React.CSSProperties = {
  fontSize: '0.75rem', fontWeight: 600, color: 'rgba(232,238,255,0.55)',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem', display: 'block',
};

export default function QAAnswerTool({ isGuest }: { isGuest?: boolean }) {
  const [question, setQuestion] = useState('');
  const [style, setStyle] = useState<Style>('brief');
  const [seoMode, setSeoMode] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [editedText, setEditedText] = useState('');
  const [error, setError] = useState('');

  async function generate() {
    if (!question.trim()) { setError('Paste the customer question first.'); return; }
    setGenerating(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/manual/write-answer', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, style, seoMode }),
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
      {/* Question input */}
      <div style={card}>
        <span style={label}>Paste the customer question</span>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          placeholder="e.g. Do you offer free estimates for kitchen remodels?"
          style={{
            width: '100%', background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem',
            padding: '0.625rem 0.875rem', color: 'rgba(232,238,255,0.9)',
            fontSize: '0.8125rem', outline: 'none', resize: 'vertical',
            boxSizing: 'border-box', lineHeight: 1.6, fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Answer style */}
      <div style={card}>
        <span style={label}>Answer style</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {STYLES.map(({ value, label: l, desc }) => (
            <button
              key={value}
              onClick={() => setStyle(value)}
              style={{
                flex: 1, padding: '0.625rem 0.5rem', borderRadius: '0.625rem', cursor: 'pointer',
                border: style === value ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
                background: style === value ? 'rgba(52,211,153,0.1)' : 'transparent',
                color: style === value ? '#34d399' : 'rgba(232,238,255,0.55)',
                textAlign: 'center', transition: 'all 0.15s',
              }}
            >
              <p style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.125rem' }}>{l}</p>
              <p style={{ fontSize: '0.7rem', opacity: 0.7 }}>{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* SEO toggle */}
      <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(232,238,255,0.85)' }}>SEO Mode</p>
          <p style={{ fontSize: '0.7rem', color: 'rgba(232,238,255,0.4)' }}>Injects your city + service keywords naturally</p>
        </div>
        <button
          onClick={() => setSeoMode((v) => !v)}
          style={{
            width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
            background: seoMode ? '#4f8ef7' : 'rgba(255,255,255,0.12)',
            position: 'relative', transition: 'background 0.2s', flexShrink: 0,
          }}
        >
          <span style={{
            position: 'absolute', top: 2, left: seoMode ? 22 : 2,
            width: 20, height: 20, borderRadius: '50%', background: '#fff',
            transition: 'left 0.2s',
          }} />
        </button>
      </div>

      {/* Generate */}
      {error && <p style={{ fontSize: '0.8rem', color: '#f87171' }}>{error}</p>}
      {isGuest ? (
        <a
          href="/signup"
          style={{
            padding: '0.75rem 1.5rem', borderRadius: '0.625rem', border: 'none',
            background: '#34d399', color: '#0f172a', fontWeight: 700, fontSize: '0.875rem',
            cursor: 'pointer', transition: 'background 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            textDecoration: 'none',
          }}
        >
          ❓ Sign in to Generate Answer
        </a>
      ) : (
      <button
        onClick={generate}
        disabled={generating}
        style={{
          padding: '0.75rem 1.5rem', borderRadius: '0.625rem', border: 'none',
          background: generating ? 'rgba(52,211,153,0.4)' : '#34d399',
          color: '#0f172a', fontWeight: 700, fontSize: '0.875rem',
          cursor: generating ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
        }}
      >
        {generating ? (
          <>
            <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#0f172a', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
            Writing answer…
          </>
        ) : '❓ Generate Answer'}
      </button>
      )}

      {/* Result */}
      {result && (
        <div style={{ ...card, border: '1px solid rgba(52,211,153,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <QualityScoreRing score={result.qualityScore} />
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(232,238,255,0.9)' }}>Quality Score</p>
                <p style={{ fontSize: '0.7rem', color: 'rgba(232,238,255,0.4)' }}>out of 100</p>
              </div>
            </div>
            <CopyButton text={editedText} label="Copy Answer" />
          </div>

          {result.strengths.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.75rem' }}>
              {result.strengths.map((s) => (
                <span key={s} style={{ fontSize: '0.7rem', padding: '0.2rem 0.625rem', borderRadius: '2rem', background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>✓ {s}</span>
              ))}
            </div>
          )}
          {result.tips.map((t) => (
            <p key={t} style={{ fontSize: '0.7rem', color: '#fbbf24', display: 'flex', gap: '0.375rem', marginBottom: '0.25rem' }}>💡 {t}</p>
          ))}

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
          <p style={{ fontSize: '0.7rem', color: 'rgba(232,238,255,0.3)', marginTop: '0.375rem' }}>Edit if needed — then copy and paste into Google Business Profile Q&A</p>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
