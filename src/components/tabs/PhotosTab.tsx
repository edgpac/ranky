import { useEffect, useRef, useState } from 'react';

interface GBPPhoto {
  name: string;
  mediaFormat: string;
  googleUrl?: string;
  thumbnailUrl?: string;
  sourceUrl?: string;
  locationAssociation?: { category: string };
  createTime?: string;
}

const CATEGORIES = [
  { value: 'EXTERIOR',      label: 'Exterior' },
  { value: 'INTERIOR',      label: 'Interior' },
  { value: 'PRODUCT',       label: 'Product' },
  { value: 'AT_WORK',       label: 'At Work' },
  { value: 'FOOD_AND_DRINK',label: 'Food & Drink' },
  { value: 'MENU',          label: 'Menu' },
  { value: 'COMMON_AREA',   label: 'Common Area' },
  { value: 'ROOMS',         label: 'Rooms' },
  { value: 'TEAMS',         label: 'Team' },
  { value: 'ADDITIONAL',    label: 'Additional' },
];

const card: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
};

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
};

export default function PhotosTab({ ready }: { ready: boolean }) {
  const [photos, setPhotos] = useState<GBPPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('INTERIOR');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ url: string; meta: any } | null>(null);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    fetch('/api/photos', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { if (d.error) throw new Error(d.error); setPhotos(d.photos || []); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [ready]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setFile(f); setPreview(URL.createObjectURL(f)); setUploadResult(null); setUploadError('');
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setUploadError(''); setUploadResult(null);
    const form = new FormData();
    form.append('photo', file); form.append('caption', caption); form.append('category', category);
    try {
      const res = await fetch('/api/photos/upload', { method: 'POST', credentials: 'include', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUploadResult(data); setFile(null); setPreview(null); setCaption('');
      if (fileRef.current) fileRef.current.value = '';
      fetch('/api/photos', { credentials: 'include' }).then((r) => r.json()).then((d) => setPhotos(d.photos || []));
    } catch (e: any) { setUploadError(e.message); }
    finally { setUploading(false); }
  };

  const handleDelete = async (photo: GBPPhoto) => {
    if (!confirm('Remove this photo from your Google Business Profile?')) return;
    setDeleting(photo.name);
    try {
      const res = await fetch(`/api/photos/${encodeURIComponent(photo.name)}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error((await res.json()).error);
      setPhotos((prev) => prev.filter((p) => p.name !== photo.name));
    } catch (e: any) { alert(`Delete failed: ${e.message}`); }
    finally { setDeleting(null); }
  };

  if (!ready || loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div className="flex flex-col gap-7">

      {/* Upload panel */}
      <div className="rounded-2xl p-5" style={card}>
        <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>Upload photo to Google Business Profile</h3>
        <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
          HayVista injects SEO metadata (title, description, keywords) into the image before uploading so Google can read exactly what the photo shows.
        </p>

        {uploadResult && (
          <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)' }}>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--success)' }}>Uploaded to Google ✓</p>
            <p className="text-xs" style={{ color: 'rgba(240,244,255,0.7)' }}><strong>Title:</strong> {uploadResult.meta.title}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(240,244,255,0.7)' }}><strong>Description:</strong> {uploadResult.meta.description}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(240,244,255,0.7)' }}><strong>Keywords:</strong> {uploadResult.meta.keywords?.join(', ')}</p>
          </div>
        )}

        {uploadError && (
          <div className="rounded-xl px-4 py-3 mb-4 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)' }}>{uploadError}</div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div
            onClick={() => fileRef.current?.click()}
            className="col-span-2 border-2 border-dashed rounded-xl h-36 flex flex-col items-center justify-center cursor-pointer transition-colors"
            style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.02)' }}
          >
            {preview ? (
              <img src={preview} alt="" className="h-full w-full object-cover rounded-xl" />
            ) : (
              <>
                <span className="text-3xl mb-2">📸</span>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Click to select a photo</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>JPEG or PNG, up to 15 MB</p>
              </>
            )}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Caption (optional)</label>
            <input
              className="h-10 px-3 rounded-lg text-sm outline-none"
              style={inputStyle}
              placeholder="e.g. Newly renovated bathroom"
              value={caption} onChange={(e) => setCaption(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Photo category</label>
            <select className="h-10 px-3 rounded-lg text-sm outline-none" style={inputStyle} value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        <button
          onClick={handleUpload} disabled={!file || uploading}
          className="mt-4 w-full text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          {uploading ? (
            <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Adding metadata &amp; uploading…</>
          ) : 'Upload to Google Business Profile'}
        </button>
      </div>

      {/* Photo grid */}
      {error && <div className="rounded-xl px-5 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)' }}>{error}</div>}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold" style={{ color: 'rgba(240,244,255,0.6)' }}>Your GBP photos ({photos.length})</h3>
        </div>

        {photos.length === 0 ? (
          <div className="rounded-2xl p-10 text-center text-sm" style={card}>
            <span style={{ color: 'var(--text-muted)' }}>No photos on your GBP yet. Upload your first one above.</span>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {photos.map((photo) => {
              const imgUrl = photo.thumbnailUrl || photo.googleUrl || photo.sourceUrl;
              return (
                <div key={photo.name} className="relative group rounded-xl overflow-hidden aspect-square" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  {imgUrl && <img src={imgUrl} alt="" className="w-full h-full object-cover" />}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-end justify-between p-2">
                    <button
                      onClick={() => handleDelete(photo)} disabled={deleting === photo.name}
                      className="text-white text-xs font-bold px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                      style={{ background: 'var(--danger)' }}
                    >
                      {deleting === photo.name ? '…' : 'Remove'}
                    </button>
                    {photo.locationAssociation?.category && (
                      <span className="text-[10px] text-white/70 bg-black/40 px-1.5 py-0.5 rounded">{photo.locationAssociation.category}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
