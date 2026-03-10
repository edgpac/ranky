import { useState, useRef } from 'react';

const CATEGORIES = [
  { value: 'EXTERIOR',       label: 'Exterior' },
  { value: 'INTERIOR',       label: 'Interior' },
  { value: 'PRODUCT',        label: 'Product' },
  { value: 'AT_WORK',        label: 'At Work' },
  { value: 'FOOD_AND_DRINK', label: 'Food & Drink' },
  { value: 'MENU',           label: 'Menu' },
  { value: 'COMMON_AREA',    label: 'Common Area' },
  { value: 'ROOMS',          label: 'Rooms' },
  { value: 'TEAMS',          label: 'Team' },
  { value: 'ADDITIONAL',     label: 'Additional' },
];

interface ProcessedImage {
  filename: string;
  downloadUrl: string;
  meta: {
    title: string;
    description: string;
    keywords: string[];
    aiCaption: string;
    category: string;
    gpsInjected: boolean;
    lat: number | null;
    lng: number | null;
  };
}

// ─── Image Processor ──────────────────────────────────────────────────────────
function ImageProcessor() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [category, setCategory] = useState('EXTERIOR');
  const [caption, setCaption] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessedImage | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  }

  async function processImage() {
    if (!file) return;
    setProcessing(true);
    setError('');
    setResult(null);
    try {
      const form = new FormData();
      form.append('photo', file);
      form.append('category', category);
      form.append('caption', caption);
      const res = await fetch('/api/owner/process-image', { method: 'POST', credentials: 'include', body: form });
      if (!res.ok) throw new Error((await res.json()).error || 'Processing failed');
      setResult(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setProcessing(false);
    }
  }

  function copyMeta() {
    if (!result) return;
    const text = `Title: ${result.meta.title}\nDescription: ${result.meta.description}\nKeywords: ${result.meta.keywords.join(', ')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '0.625rem',
    color: 'rgba(240,244,255,0.9)',
    padding: '0.5rem 0.75rem',
    fontSize: '0.8125rem',
    width: '100%',
    outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'rgba(240,244,255,0.9)', marginBottom: '0.375rem' }}>
          Image Processor
        </p>
        <p style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.45)' }}>
          Upload a photo → AI captions it → GPS + EXIF injected → download ready for GBP
        </p>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          border: '2px dashed rgba(79,142,247,0.35)',
          borderRadius: '0.875rem',
          padding: '1.5rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: preview ? 'transparent' : 'rgba(79,142,247,0.04)',
          transition: 'border-color 0.15s',
          position: 'relative',
          overflow: 'hidden',
          minHeight: 140,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(79,142,247,0.6)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(79,142,247,0.35)'; }}
      >
        {preview ? (
          <img src={preview} alt="preview" style={{ maxHeight: 200, maxWidth: '100%', borderRadius: '0.5rem', objectFit: 'contain' }} />
        ) : (
          <>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📸</div>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(240,244,255,0.55)' }}>Click to select a photo</p>
            <p style={{ fontSize: '0.7rem', color: 'rgba(240,244,255,0.3)', marginTop: '0.25rem' }}>JPG or PNG, max 15MB</p>
          </>
        )}
        <input ref={inputRef} type="file" accept="image/jpeg,image/png" style={{ display: 'none' }} onChange={onFileChange} />
      </div>

      {file && (
        <>
          {/* Category */}
          <div>
            <label style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.55)', display: 'block', marginBottom: '0.375rem' }}>
              GBP Category
            </label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {/* Optional caption override */}
          <div>
            <label style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.55)', display: 'block', marginBottom: '0.375rem' }}>
              Caption hint (optional — overrides AI caption)
            </label>
            <input
              type="text"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="e.g. Kitchen remodel project in Cabo San Lucas"
              style={inputStyle}
            />
          </div>

          {/* Process button */}
          <button
            onClick={processImage}
            disabled={processing}
            style={{
              background: processing ? 'rgba(79,142,247,0.3)' : 'linear-gradient(135deg, #4f8ef7, #7c5af7)',
              color: '#fff',
              border: 'none',
              borderRadius: '0.625rem',
              padding: '0.65rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: processing ? 'default' : 'pointer',
              opacity: processing ? 0.7 : 1,
            }}
          >
            {processing ? 'Processing — AI vision + EXIF injection...' : 'Process Image'}
          </button>
        </>
      )}

      {error && (
        <p style={{ fontSize: '0.8125rem', color: '#f87171', padding: '0.625rem', background: 'rgba(239,68,68,0.08)', borderRadius: '0.5rem', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </p>
      )}

      {/* Result */}
      {result && (
        <div style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '0.875rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#34d399' }}>Image processed</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <MetaRow label="Filename" value={result.filename} />
            <MetaRow label="AI Caption" value={result.meta.aiCaption || '—'} />
            <MetaRow label="SEO Title" value={result.meta.title} />
            <MetaRow label="Description" value={result.meta.description} />
            <MetaRow label="Keywords" value={result.meta.keywords.join(', ')} />
            <MetaRow label="Category" value={result.meta.category} />
            <MetaRow
              label="GPS"
              value={result.meta.gpsInjected
                ? `${result.meta.lat?.toFixed(5)}, ${result.meta.lng?.toFixed(5)}`
                : 'Not yet (geocoding runs in background — reprocess in ~30s)'}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a
              href={result.downloadUrl}
              download={result.filename}
              style={{
                background: 'linear-gradient(135deg, #4f8ef7, #7c5af7)',
                color: '#fff',
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                fontSize: '0.8125rem',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Download processed photo
            </a>
            <button
              onClick={copyMeta}
              style={{
                background: 'rgba(255,255,255,0.07)',
                color: copied ? '#34d399' : 'rgba(240,244,255,0.7)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {copied ? 'Copied!' : 'Copy metadata'}
            </button>
          </div>

          <p style={{ fontSize: '0.7rem', color: 'rgba(240,244,255,0.35)' }}>
            Upload the downloaded file directly to GBP → it carries all SEO metadata inside.
          </p>
        </div>
      )}
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem' }}>
      <span style={{ color: 'rgba(240,244,255,0.4)', flexShrink: 0, width: 90 }}>{label}</span>
      <span style={{ color: 'rgba(240,244,255,0.8)', wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}

// ─── Post Clipboard ───────────────────────────────────────────────────────────
function PostClipboard() {
  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  async function generatePost() {
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/posts/generate-draft', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Generation failed');
      const data = await res.json();
      setDraft(data.text || '');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setGenerating(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '0.625rem',
    color: 'rgba(240,244,255,0.9)',
    padding: '0.5rem 0.75rem',
    fontSize: '0.8125rem',
    width: '100%',
    outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'rgba(240,244,255,0.9)', marginBottom: '0.375rem' }}>
          Post Clipboard
        </p>
        <p style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.45)' }}>
          Generate an AI post → copy → paste directly into GBP
        </p>
      </div>

      <div>
        <label style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.55)', display: 'block', marginBottom: '0.375rem' }}>
          Topic or focus (optional)
        </label>
        <input
          type="text"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="e.g. spring promotions, new kitchen photos, 5-star reviews"
          style={inputStyle}
        />
      </div>

      <button
        onClick={generatePost}
        disabled={generating}
        style={{
          background: generating ? 'rgba(79,142,247,0.3)' : 'linear-gradient(135deg, #4f8ef7, #7c5af7)',
          color: '#fff',
          border: 'none',
          borderRadius: '0.625rem',
          padding: '0.65rem 1.25rem',
          fontSize: '0.875rem',
          fontWeight: 700,
          cursor: generating ? 'default' : 'pointer',
          opacity: generating ? 0.7 : 1,
        }}
      >
        {generating ? 'Generating post...' : 'Generate Post'}
      </button>

      {error && (
        <p style={{ fontSize: '0.8125rem', color: '#f87171' }}>{error}</p>
      )}

      {draft && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={6}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
          />
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={copy}
              style={{
                background: copied ? 'rgba(52,211,153,0.15)' : 'rgba(79,142,247,0.15)',
                color: copied ? '#34d399' : '#4f8ef7',
                border: `1px solid ${copied ? 'rgba(52,211,153,0.3)' : 'rgba(79,142,247,0.3)'}`,
                borderRadius: '0.5rem',
                padding: '0.45rem 0.875rem',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {copied ? 'Copied!' : 'Copy to clipboard'}
            </button>
            <span style={{ fontSize: '0.7rem', color: 'rgba(240,244,255,0.35)' }}>
              Paste into GBP → Add update → paste → publish
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────
export default function OwnerStudioTab() {
  const [section, setSection] = useState<'images' | 'posts'>('images');

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '1rem',
    padding: '1.5rem',
  };

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: '0.4rem 1rem',
    borderRadius: '0.5rem',
    fontSize: '0.8125rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    background: active ? 'rgba(79,142,247,0.18)' : 'transparent',
    color: active ? '#4f8ef7' : 'rgba(240,244,255,0.45)',
    transition: 'all 0.15s',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <p style={{ fontSize: '1rem', fontWeight: 700, color: 'rgba(240,244,255,0.95)' }}>Owner Studio</p>
          <p style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.4)', marginTop: '0.2rem' }}>
            Prep content offline — ready to upload to GBP manually or via API when approved
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.375rem', background: 'rgba(255,255,255,0.04)', borderRadius: '0.625rem', padding: '0.25rem' }}>
          <button style={tabBtn(section === 'images')} onClick={() => setSection('images')}>Images</button>
          <button style={tabBtn(section === 'posts')} onClick={() => setSection('posts')}>Posts</button>
        </div>
      </div>

      {/* GBP checklist reminder */}
      <div style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '0.75rem', padding: '0.875rem 1rem' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fbbf24', marginBottom: '0.375rem' }}>GBP reapplication checklist</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {[
            { done: false, text: 'Build up Hay Vista GBP listing — add 10+ photos with good captions' },
            { done: false, text: 'Get 5+ reviews on the Hay Vista GBP listing' },
            { done: true,  text: 'Privacy policy updated with business.manage scope + Limited Use language' },
            { done: true,  text: 'About page has company section with compliance statement' },
            { done: false, text: 'Wait 2–3 months of active GBP posting before reapplying' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.75rem' }}>
              <span style={{ color: item.done ? '#34d399' : 'rgba(251,191,36,0.6)', flexShrink: 0, marginTop: 1 }}>
                {item.done ? '✓' : '○'}
              </span>
              <span style={{ color: item.done ? 'rgba(240,244,255,0.55)' : 'rgba(240,244,255,0.75)' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Active section */}
      <div style={cardStyle}>
        {section === 'images' ? <ImageProcessor /> : <PostClipboard />}
      </div>
    </div>
  );
}
