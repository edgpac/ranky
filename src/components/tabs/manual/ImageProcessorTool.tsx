import { useReducer, useState, useCallback } from 'react';
import CopyButton from '../../CopyButton';

const CATEGORIES = ['EXTERIOR', 'INTERIOR', 'PRODUCT', 'AT_WORK', 'FOOD_AND_DRINK', 'MENU', 'COMMON_AREA', 'ROOMS', 'TEAMS', 'ADDITIONAL'];

interface ImageItem {
  file: File;
  preview: string;
  category: string;
  caption: string;
  processing: boolean;
  done: boolean;
  error: string;
  result: {
    filename: string;
    downloadUrl: string;
    meta: {
      title: string;
      description: string;
      keywords: string[];
      aiCaption: string;
      category: string;
      gpsInjected: boolean;
    };
  } | null;
}

const IMAGE_INPUT_ID = 'image-processor-input';

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type Action =
  | { type: 'ADD'; items: { file: File; preview: string }[] }
  | { type: 'REMOVE'; index: number }
  | { type: 'SET_CATEGORY'; index: number; value: string }
  | { type: 'SET_CAPTION'; index: number; value: string }
  | { type: 'SET_PROCESSING'; index: number; value: boolean }
  | { type: 'SET_RESULT'; index: number; result: ImageItem['result'] }
  | { type: 'SET_ERROR'; index: number; error: string }
  | { type: 'CLEAR' };

function reducer(state: ImageItem[], action: Action): ImageItem[] {
  switch (action.type) {
    case 'ADD': {
      const next = action.items.slice(0, 10 - state.length).map(({ file, preview }) => ({
        file, preview,
        category: 'EXTERIOR', caption: '',
        processing: false, done: false, error: '', result: null,
      }));
      return [...state, ...next];
    }
    case 'REMOVE': return state.filter((_, i) => i !== action.index);
    case 'SET_CATEGORY': return state.map((item, i) => i === action.index ? { ...item, category: action.value } : item);
    case 'SET_CAPTION': return state.map((item, i) => i === action.index ? { ...item, caption: action.value } : item);
    case 'SET_PROCESSING': return state.map((item, i) => i === action.index ? { ...item, processing: action.value } : item);
    case 'SET_RESULT': return state.map((item, i) => i === action.index ? { ...item, result: action.result, processing: false, done: true, error: '' } : item);
    case 'SET_ERROR': return state.map((item, i) => i === action.index ? { ...item, error: action.error, processing: false } : item);
    case 'CLEAR': return [];
    default: return state;
  }
}

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.035)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '1rem',
  padding: '1.5rem',
};

export default function ImageProcessorTool({ isGuest }: { isGuest?: boolean }) {
  const [images, dispatch] = useReducer(reducer, []);
  const [processing, setProcessing] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  async function addFiles(rawFiles: File[]) {
    const files = rawFiles.filter((f) => f.type.startsWith('image/')).slice(0, 10 - images.length);
    if (!files.length) return;
    const previews = await Promise.all(files.map(readFileAsDataUrl));
    dispatch({ type: 'ADD', items: files.map((file, i) => ({ file, preview: previews[i] })) });
  }

  function onFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(e.target.files || []));
    e.target.value = '';
  }

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    addFiles(Array.from(e.dataTransfer.files));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length]);

  async function processAll() {
    if (!images.length) return;
    setProcessing(true);

    const form = new FormData();
    images.forEach((img) => form.append('photos', img.file));
    images.forEach((img) => form.append('categories', img.category));
    images.forEach((img) => form.append('captions', img.caption));

    // Mark all as processing
    images.forEach((_, i) => dispatch({ type: 'SET_PROCESSING', index: i, value: true }));

    try {
      const res = await fetch('/api/images/process', { method: 'POST', credentials: 'include', body: form });
      if (!res.ok) throw new Error((await res.json()).error || 'Processing failed');
      type ResultMeta = { title: string; description: string; keywords: string[]; aiCaption: string; category: string; gpsInjected: boolean };
      const data: { results: Array<{ index: number; ok: boolean; filename: string; downloadUrl: string; meta: ResultMeta; error?: string }> } = await res.json();
      data.results.forEach((r) => {
        if (r.ok) {
          dispatch({ type: 'SET_RESULT', index: r.index, result: { filename: r.filename, downloadUrl: r.downloadUrl, meta: r.meta } });
        } else {
          dispatch({ type: 'SET_ERROR', index: r.index, error: r.error || 'Failed' });
        }
      });
    } catch (e: unknown) {
      images.forEach((_, i) => dispatch({ type: 'SET_ERROR', index: i, error: e instanceof Error ? e.message : 'Failed' }));
    } finally {
      setProcessing(false);
    }
  }

  async function downloadZip() {
    const filenames = images.filter((img) => img.result).map((img) => img.result!.filename);
    if (!filenames.length) return;
    setZipping(true);
    try {
      const res = await fetch('/api/images/download-zip', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filenames }),
      });
      if (!res.ok) throw new Error('ZIP failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hayvista-photos-${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setZipping(false);
    }
  }

  const processedCount = images.filter((img) => img.done).length;
  const allDone = images.length > 0 && processedCount === images.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Upload zone */}
      {images.length < 10 && (
        <div style={card}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(232,238,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
            Upload photos ({images.length}/10)
          </p>
          <label
            htmlFor={IMAGE_INPUT_ID}
            onDragOver={onDragOver}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            style={{
              display: 'block', width: '100%', padding: '2rem',
              border: dragActive ? '2px dashed #4f8ef7' : '2px dashed rgba(255,255,255,0.12)',
              borderRadius: '0.75rem',
              background: dragActive ? 'rgba(79,142,247,0.07)' : 'transparent',
              color: dragActive ? '#4f8ef7' : 'rgba(232,238,255,0.45)',
              cursor: 'pointer', fontSize: '0.8125rem', textAlign: 'center',
              transition: 'all 0.15s', boxSizing: 'border-box',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{dragActive ? '⬇️' : '🖼️'}</div>
            {dragActive
              ? 'Drop photos here'
              : `Click to select photos (up to ${10 - images.length} more)`}
            <p style={{ fontSize: '0.7rem', marginTop: '0.25rem', opacity: 0.6 }}>Drag & drop · click to browse · Claude Vision auto-captions · GPS + EXIF injected</p>
          </label>
          <input id={IMAGE_INPUT_ID} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={onFilePick} />
        </div>
      )}

      {/* Image cards */}
      {images.map((img, i) => (
        <div key={i} style={{ ...card, padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {/* Preview */}
            <div style={{ flexShrink: 0 }}>
              <img src={img.preview} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: '0.5rem' }} />
            </div>

            {/* Controls */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'rgba(232,238,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{img.file.name}</p>
                {!img.done && !img.processing && (
                  <button onClick={() => dispatch({ type: 'REMOVE', index: i })} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.7rem' }}>Remove</button>
                )}
                {img.done && (
                  <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 600 }}>✓ Processed</span>
                )}
                {img.error && (
                  <span style={{ fontSize: '0.7rem', color: '#f87171' }}>⚠ Failed</span>
                )}
                {img.processing && (
                  <span style={{ fontSize: '0.7rem', color: '#4f8ef7', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span style={{ width: 10, height: 10, border: '1.5px solid rgba(79,142,247,0.3)', borderTopColor: '#4f8ef7', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                    Processing…
                  </span>
                )}
              </div>

              {!img.done ? (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select
                    value={img.category}
                    onChange={(e) => dispatch({ type: 'SET_CATEGORY', index: i, value: e.target.value })}
                    style={{
                      flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '0.375rem', padding: '0.375rem 0.5rem', color: 'rgba(232,238,255,0.85)',
                      fontSize: '0.75rem', outline: 'none',
                    }}
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c} style={{ background: '#1e293b' }}>{c.replace(/_/g, ' ')}</option>)}
                  </select>
                  <input
                    type="text"
                    value={img.caption}
                    onChange={(e) => dispatch({ type: 'SET_CAPTION', index: i, value: e.target.value })}
                    placeholder="Caption hint (optional)"
                    style={{
                      flex: 2, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '0.375rem', padding: '0.375rem 0.5rem', color: 'rgba(232,238,255,0.85)',
                      fontSize: '0.75rem', outline: 'none',
                    }}
                  />
                </div>
              ) : img.result ? (
                <div style={{ fontSize: '0.72rem', color: 'rgba(232,238,255,0.6)' }}>
                  <p style={{ marginBottom: '0.125rem' }}>📝 {img.result.meta.title}</p>
                  <p style={{ marginBottom: '0.125rem' }}>🔑 {img.result.meta.keywords.join(' · ')}</p>
                  {img.result.meta.gpsInjected && <p>📍 GPS embedded</p>}
                  {img.result.meta.aiCaption && <p style={{ marginTop: '0.125rem', fontStyle: 'italic' }}>"{img.result.meta.aiCaption}"</p>}
                </div>
              ) : null}
            </div>

            {/* Download */}
            {img.result && (
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <a
                  href={img.result.downloadUrl}
                  download={img.result.filename}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.25rem',
                    fontSize: '0.7rem', color: '#4f8ef7', textDecoration: 'none',
                    padding: '0.375rem 0.625rem', borderRadius: '0.375rem',
                    border: '1px solid rgba(79,142,247,0.25)',
                    background: 'rgba(79,142,247,0.08)', whiteSpace: 'nowrap',
                  }}
                >
                  ⬇ Download
                </a>
                <CopyButton text={JSON.stringify(img.result.meta, null, 2)} label="Meta" size="sm" />
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Actions */}
      {images.length > 0 && (
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {!allDone && (
            isGuest ? (
              <a
                href="/signup"
                style={{
                  flex: 1, padding: '0.75rem', borderRadius: '0.625rem', border: 'none',
                  background: '#4f8ef7', color: '#fff', fontWeight: 700, fontSize: '0.875rem',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '0.5rem', textDecoration: 'none',
                }}
              >
                🛠 Sign in to Process Photos
              </a>
            ) : (
            <button
              onClick={processAll}
              disabled={processing}
              style={{
                flex: 1, padding: '0.75rem', borderRadius: '0.625rem', border: 'none',
                background: processing ? 'rgba(79,142,247,0.4)' : '#4f8ef7',
                color: '#fff', fontWeight: 700, fontSize: '0.875rem',
                cursor: processing ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              }}
            >
              {processing ? (
                <>
                  <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  Processing {processedCount}/{images.length}…
                </>
              ) : `🛠 Process All ${images.length} Photo${images.length !== 1 ? 's' : ''}`}
            </button>
            )
          )}

          {allDone && (
            <button
              onClick={downloadZip}
              disabled={zipping}
              style={{
                flex: 1, padding: '0.75rem', borderRadius: '0.625rem', border: 'none',
                background: zipping ? 'rgba(52,211,153,0.4)' : '#34d399',
                color: '#0f172a', fontWeight: 700, fontSize: '0.875rem',
                cursor: zipping ? 'not-allowed' : 'pointer',
              }}
            >
              {zipping ? 'Creating ZIP…' : `📦 Download All as ZIP (${processedCount} photos)`}
            </button>
          )}

          <button
            onClick={() => dispatch({ type: 'CLEAR' })}
            style={{
              padding: '0.75rem 1rem', borderRadius: '0.625rem',
              border: '1px solid rgba(248,113,113,0.25)', background: 'transparent',
              color: '#f87171', fontSize: '0.8125rem', cursor: 'pointer',
            }}
          >
            Clear all
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
