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
  { value: 'EXTERIOR',   label: 'Exterior' },
  { value: 'INTERIOR',   label: 'Interior' },
  { value: 'PRODUCT',    label: 'Product' },
  { value: 'AT_WORK',    label: 'At Work' },
  { value: 'FOOD_AND_DRINK', label: 'Food & Drink' },
  { value: 'MENU',       label: 'Menu' },
  { value: 'COMMON_AREA',label: 'Common Area' },
  { value: 'ROOMS',      label: 'Rooms' },
  { value: 'TEAMS',      label: 'Team' },
  { value: 'ADDITIONAL', label: 'Additional' },
];

export default function PhotosTab({ ready }: { ready: boolean }) {
  const [photos, setPhotos] = useState<GBPPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('INTERIOR');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ url: string; meta: any } | null>(null);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Delete state
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    fetch('/api/photos', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setPhotos(d.photos || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [ready]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setUploadResult(null);
    setUploadError('');
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadError('');
    setUploadResult(null);
    const form = new FormData();
    form.append('photo', file);
    form.append('caption', caption);
    form.append('category', category);
    try {
      const res = await fetch('/api/photos/upload', { method: 'POST', credentials: 'include', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUploadResult(data);
      setFile(null);
      setPreview(null);
      setCaption('');
      if (fileRef.current) fileRef.current.value = '';
      // Refresh photos list
      fetch('/api/photos', { credentials: 'include' }).then((r) => r.json()).then((d) => setPhotos(d.photos || []));
    } catch (e: any) {
      setUploadError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photo: GBPPhoto) => {
    if (!confirm('Remove this photo from your Google Business Profile?')) return;
    setDeleting(photo.name);
    try {
      const res = await fetch(`/api/photos/${encodeURIComponent(photo.name)}`, {
        method: 'DELETE', credentials: 'include',
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setPhotos((prev) => prev.filter((p) => p.name !== photo.name));
    } catch (e: any) {
      alert(`Delete failed: ${e.message}`);
    } finally {
      setDeleting(null);
    }
  };

  if (!ready) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-9 h-9 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">Pulling your business data from Google</p>
        <p className="text-xs text-slate-400 mt-1">Connecting to your Business Profile — this only takes a moment on first load.</p>
      </div>
    </div>
  );

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="flex flex-col gap-8">

      {/* Upload panel */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="text-sm font-bold text-slate-700 mb-1">Upload photo to Google Business Profile</h3>
        <p className="text-xs text-slate-400 mb-5">
          Ranky automatically injects SEO metadata (title, description, keywords) into the image file before uploading so Google can read exactly what the photo shows.
        </p>

        {uploadResult && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
            <p className="text-sm font-semibold text-green-700 mb-1">Uploaded to Google ✓</p>
            <p className="text-xs text-slate-600"><strong>Title:</strong> {uploadResult.meta.title}</p>
            <p className="text-xs text-slate-600 mt-0.5"><strong>Description:</strong> {uploadResult.meta.description}</p>
            <p className="text-xs text-slate-600 mt-0.5"><strong>Keywords:</strong> {uploadResult.meta.keywords?.join(', ')}</p>
          </div>
        )}

        {uploadError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{uploadError}</div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* File drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            className="col-span-2 border-2 border-dashed border-gray-200 rounded-xl h-36 flex flex-col items-center justify-center cursor-pointer hover:border-brand/40 transition-colors bg-gray-50"
          >
            {preview ? (
              <img src={preview} alt="" className="h-full w-full object-cover rounded-xl" />
            ) : (
              <>
                <span className="text-3xl mb-2">📸</span>
                <p className="text-sm text-slate-500">Click to select a photo</p>
                <p className="text-xs text-slate-400 mt-1">JPEG or PNG, up to 15 MB</p>
              </>
            )}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
          </div>

          {/* Caption */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700">Caption (optional)</label>
            <input
              className="h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
              placeholder="e.g. Our newly renovated dining room"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700">Photo category</label>
            <select
              className="h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="mt-4 w-full bg-brand text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-brand-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {uploading ? (
            <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Adding metadata &amp; uploading to Google…</>
          ) : 'Upload to Google Business Profile'}
        </button>
      </div>

      {/* Photo grid */}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-5 py-3">{error}</div>}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-600">Your GBP photos ({photos.length})</h3>
        </div>

        {photos.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-slate-400 text-sm">No photos on your GBP yet. Upload your first one above.</div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {photos.map((photo) => {
              const imgUrl = photo.thumbnailUrl || photo.googleUrl || photo.sourceUrl;
              return (
                <div key={photo.name} className="relative group rounded-xl overflow-hidden bg-gray-100 aspect-square">
                  {imgUrl && <img src={imgUrl} alt="" className="w-full h-full object-cover" />}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-end justify-between p-2">
                    <button
                      onClick={() => handleDelete(photo)}
                      disabled={deleting === photo.name}
                      className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {deleting === photo.name ? '…' : 'Remove'}
                    </button>
                    {photo.locationAssociation?.category && (
                      <span className="text-[10px] text-white/80 bg-black/40 px-1.5 py-0.5 rounded">
                        {photo.locationAssociation.category}
                      </span>
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
