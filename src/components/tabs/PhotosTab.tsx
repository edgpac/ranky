import { useEffect, useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PhotoItem {
  name: string;
  mediaFormat: string;
  googleUrl?: string;
  thumbnailUrl?: string;
  sourceUrl?: string;
  locationAssociation?: { category: string };
  createTime?: string;
  // Enriched display fields (populated from mock or extracted from GBP metadata)
  displayName?: string;
  description?: string;
}

// ─── Pagination constant ──────────────────────────────────────────────────────

const PHOTOS_PER_PAGE = 12;

// ─── Category options ─────────────────────────────────────────────────────────

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

// ─── Mock photos (guest / empty state preview) ────────────────────────────────

const MOCK_ICONS = ['🔨', '💡', '🚿', '🌊', '⚡', '🔩', '📺', '🏠', '🪚', '🎨', '🪛', '🏗️'];

const MOCK_PHOTOS: PhotoItem[] = [
  {
    name: 'mock-1', mediaFormat: 'PHOTO',
    displayName: 'Kitchen Backsplash Installation',
    description: 'Professional mosaic tile backsplash in a newly remodeled kitchen. Waterproof grout and custom edge cuts.',
  },
  {
    name: 'mock-2', mediaFormat: 'PHOTO',
    displayName: 'Ceiling Fan Replacement',
    description: '52-inch ceiling fan with remote control installed in master bedroom. Old fan removed and wiring updated.',
  },
  {
    name: 'mock-3', mediaFormat: 'PHOTO',
    displayName: 'Bathroom Vanity Install',
    description: 'Floating double vanity with undermount sinks, new faucets, and framed mirror in guest bathroom.',
  },
  {
    name: 'mock-4', mediaFormat: 'PHOTO',
    displayName: 'Deck Power Washing',
    description: 'Before-and-after pressure washing of a 400 sq ft composite deck, ready for staining season.',
  },
  {
    name: 'mock-5', mediaFormat: 'PHOTO',
    displayName: 'Electrical Panel Upgrade',
    description: '200-amp service panel upgrade with arc-fault breakers. Fully permitted and inspected.',
  },
  {
    name: 'mock-6', mediaFormat: 'PHOTO',
    displayName: 'Garbage Disposal Install',
    description: 'InSinkErator 1HP disposal installed under kitchen sink with new drain assembly and wall switch.',
  },
  {
    name: 'mock-7', mediaFormat: 'PHOTO',
    displayName: 'TV Wall Mount – 65"',
    description: '65-inch Samsung mounted on a concrete wall above the fireplace. Cables routed in-wall.',
  },
  {
    name: 'mock-8', mediaFormat: 'PHOTO',
    displayName: 'Drywall Repair & Patch',
    description: 'Seamless drywall repair on a water-damaged wall. Textured and primed to match the existing surface.',
  },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const btnPrimary: React.CSSProperties = {
  background: '#4f8ef7',
  color: 'white',
  borderRadius: '0.5rem',
  padding: '0.4rem 0.875rem',
  fontSize: '0.8125rem',
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const btnGhost: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.12)',
  color: 'rgba(240,244,255,0.6)',
  borderRadius: '0.4rem',
  padding: '0.25rem 0.625rem',
  fontSize: '0.75rem',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const btnDelete: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(248,113,113,0.18)',
  color: 'rgba(248,113,113,0.65)',
  borderRadius: '0.4rem',
  width: '1.875rem',
  height: '1.875rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.75rem',
  cursor: 'pointer',
  flexShrink: 0,
  fontFamily: 'inherit',
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
  fontFamily: 'inherit',
};

// ─── Photo card ───────────────────────────────────────────────────────────────

function PhotoCard({
  photo,
  index,
  isMock,
  deleting,
  onDelete,
}: {
  photo: PhotoItem;
  index: number;
  isMock: boolean;
  deleting: boolean;
  onDelete: () => void;
}) {
  const imgUrl = photo.thumbnailUrl || photo.googleUrl || photo.sourceUrl;
  const icon = MOCK_ICONS[index % MOCK_ICONS.length];
  const viewUrl = photo.googleUrl || photo.sourceUrl;
  const category = photo.locationAssociation?.category;

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '0.875rem',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.13)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
    >
      {/* Image area */}
      <div
        style={{
          height: '130px',
          position: 'relative',
          background: imgUrl
            ? undefined
            : 'linear-gradient(135deg, rgba(79,142,247,0.08) 0%, rgba(52,211,153,0.06) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.25rem',
          overflow: 'hidden',
        }}
      >
        {imgUrl ? (
          <img src={imgUrl} alt={photo.displayName || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          icon
        )}
        {/* Category badge */}
        {category && (
          <span
            style={{
              position: 'absolute',
              bottom: '0.4rem',
              left: '0.4rem',
              fontSize: '0.625rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'rgba(240,244,255,0.65)',
              background: 'rgba(0,0,0,0.55)',
              borderRadius: '0.25rem',
              padding: '0.1rem 0.35rem',
            }}
          >
            {category}
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '0.625rem 0.75rem 0', display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 }}>
        <p
          style={{
            fontSize: '0.8125rem',
            fontWeight: 700,
            color: 'rgba(240,244,255,0.90)',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
          }}
        >
          {photo.displayName || `Photo ${index + 1}`}
        </p>
        {photo.description && (
          <p
            style={{
              fontSize: '0.75rem',
              color: 'rgba(240,244,255,0.38)',
              lineHeight: 1.45,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const,
              overflow: 'hidden',
            }}
          >
            {photo.description}
          </p>
        )}
      </div>

      {/* Footer actions */}
      <div
        style={{
          padding: '0.5rem 0.75rem 0.625rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          marginTop: '0.25rem',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {!isMock && viewUrl ? (
          <a
            href={viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '0.75rem', color: '#4f8ef7', textDecoration: 'none', fontWeight: 500, marginRight: 'auto' }}
          >
            View ↗
          </a>
        ) : (
          <span style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.18)', fontStyle: 'italic', marginRight: 'auto' }}>
            View ↗
          </span>
        )}
        {!isMock && (
          <button
            style={{ ...btnDelete, opacity: deleting ? 0.5 : 1 }}
            onClick={onDelete}
            disabled={deleting}
            title="Remove photo"
          >
            {deleting ? '…' : '✕'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Upload panel ─────────────────────────────────────────────────────────────

function UploadPanel({ onClose, onUploaded }: { onClose: () => void; onUploaded: (photo: PhotoItem) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('AT_WORK');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ meta: { title: string; description: string; keywords: string[] } } | null>(null);
  const [uploadError, setUploadError] = useState('');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setUploadResult(null);
    setUploadError('');
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setUploadError(''); setUploadResult(null);
    const form = new FormData();
    form.append('photo', file);
    form.append('caption', caption);
    form.append('category', category);
    try {
      const res = await fetch('/api/photos/upload', { method: 'POST', credentials: 'include', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUploadResult(data);
      setFile(null); setPreview(null); setCaption('');
      if (fileRef.current) fileRef.current.value = '';
      // Re-fetch to get the new photo in the grid
      const photosRes = await fetch('/api/photos', { credentials: 'include' });
      const photosData = await photosRes.json();
      if (photosData.photos?.length) {
        onUploaded(photosData.photos[photosData.photos.length - 1]);
      }
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        background: 'rgba(79,142,247,0.05)',
        border: '1px solid rgba(79,142,247,0.22)',
        borderRadius: '0.875rem',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        marginBottom: '0.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'rgba(240,244,255,0.85)' }}>Upload Photo</p>
        <button style={btnGhost} onClick={onClose}>Cancel</button>
      </div>

      <p style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.38)', lineHeight: 1.5, marginTop: '-0.25rem' }}>
        HayVista injects SEO metadata (title, description, keywords) into the image before uploading so Google can index exactly what the photo shows.
      </p>

      {uploadResult && (
        <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: '0.625rem', padding: '0.75rem' }}>
          <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#34d399', marginBottom: '0.25rem' }}>Uploaded to Google ✓</p>
          <p style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.65)' }}><strong>Title:</strong> {uploadResult.meta.title}</p>
          <p style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.65)', marginTop: '0.2rem' }}><strong>Keywords:</strong> {uploadResult.meta.keywords?.join(', ')}</p>
        </div>
      )}

      {uploadError && (
        <div style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.625rem', padding: '0.625rem 0.875rem', fontSize: '0.8125rem', color: '#f87171' }}>
          {uploadError}
        </div>
      )}

      {/* Drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        style={{
          border: '2px dashed rgba(255,255,255,0.12)',
          borderRadius: '0.625rem',
          height: '120px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          background: 'rgba(255,255,255,0.02)',
          overflow: 'hidden',
        }}
      >
        {preview ? (
          <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <>
            <span style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>📸</span>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(240,244,255,0.45)' }}>Click to select photo</p>
            <p style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.25)', marginTop: '0.15rem' }}>JPEG · PNG · WebP · max 15 MB</p>
          </>
        )}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleFile} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
        <input style={inputStyle} placeholder="Caption (optional)" value={caption} onChange={(e) => setCaption(e.target.value)} />
        <select
          style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' as const, background: 'rgba(255,255,255,0.06)' }}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map((c) => <option key={c.value} value={c.value} style={{ background: '#080d1a' }}>{c.label}</option>)}
        </select>
      </div>

      <button
        style={{
          ...btnPrimary,
          width: '100%',
          justifyContent: 'center',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.6rem 1rem',
          opacity: !file || uploading ? 0.45 : 1,
          cursor: !file || uploading ? 'default' : 'pointer',
        }}
        onClick={handleUpload}
        disabled={!file || uploading}
      >
        {uploading ? (
          <>
            <span
              style={{
                width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)',
                borderTopColor: 'white', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                display: 'inline-block',
              }}
            />
            Adding metadata &amp; uploading…
          </>
        ) : 'Upload to Google Business Profile'}
      </button>
    </div>
  );
}

// ─── Pagination controls ──────────────────────────────────────────────────────

function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', paddingTop: '0.5rem' }}>
      <button
        style={{ ...btnGhost, opacity: page <= 1 ? 0.35 : 1, cursor: page <= 1 ? 'default' : 'pointer' }}
        onClick={() => page > 1 && onPage(page - 1)}
        disabled={page <= 1}
      >
        ← Prev
      </button>

      {/* Page number pills */}
      <div style={{ display: 'flex', gap: '0.3rem' }}>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
          // Show first, last, and pages ±1 around current; rest become "…"
          const show = p === 1 || p === totalPages || Math.abs(p - page) <= 1;
          const isDot = !show;
          if (isDot && (p === page - 2 || p === page + 2)) {
            return (
              <span key={p} style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.3)', lineHeight: '1.875rem', padding: '0 0.25rem' }}>…</span>
            );
          }
          if (isDot) return null;
          return (
            <button
              key={p}
              style={{
                width: '1.875rem',
                height: '1.875rem',
                borderRadius: '0.4rem',
                border: p === page ? '1px solid rgba(79,142,247,0.5)' : '1px solid rgba(255,255,255,0.10)',
                background: p === page ? 'rgba(79,142,247,0.15)' : 'transparent',
                color: p === page ? '#4f8ef7' : 'rgba(240,244,255,0.5)',
                fontSize: '0.8125rem',
                fontWeight: p === page ? 700 : 400,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              onClick={() => onPage(p)}
            >
              {p}
            </button>
          );
        })}
      </div>

      <button
        style={{ ...btnGhost, opacity: page >= totalPages ? 0.35 : 1, cursor: page >= totalPages ? 'default' : 'pointer' }}
        onClick={() => page < totalPages && onPage(page + 1)}
        disabled={page >= totalPages}
      >
        Next →
      </button>
    </div>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export default function PhotosTab({ ready }: { ready: boolean }) {
  const [photos, setPhotos] = useState<PhotoItem[]>(MOCK_PHOTOS);
  const [isMockMode, setIsMockMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!ready) return;
    setLoading(true);
    fetch('/api/photos', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        const fetched: PhotoItem[] = (d.photos || []).map((p: PhotoItem) => ({
          ...p,
          displayName: p.locationAssociation?.category
            ? p.locationAssociation.category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
            : 'Photo',
        }));
        setPhotos(fetched);
        setIsMockMode(false);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [ready]);

  const handleDelete = async (photo: PhotoItem) => {
    if (isMockMode) {
      setPhotos((prev) => prev.filter((p) => p.name !== photo.name));
      return;
    }
    setDeleting(photo.name);
    try {
      const res = await fetch(`/api/photos/${encodeURIComponent(photo.name)}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error((await res.json()).error);
      setPhotos((prev) => prev.filter((p) => p.name !== photo.name));
      // Reset to last valid page if current page becomes empty
      setPage((prev) => {
        const newTotal = Math.ceil((photos.length - 1) / PHOTOS_PER_PAGE);
        return prev > newTotal ? Math.max(1, newTotal) : prev;
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const handleUploaded = (photo: PhotoItem) => {
    setPhotos((prev) => [photo, ...prev]);
    setShowUpload(false);
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div
        className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#4f8ef7', borderTopColor: 'transparent' }}
      />
    </div>
  );

  const totalPages = Math.ceil(photos.length / PHOTOS_PER_PAGE);
  const pagePhotos = photos.slice((page - 1) * PHOTOS_PER_PAGE, page * PHOTOS_PER_PAGE);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'rgba(240,244,255,0.95)' }}>Photos &amp; Videos</h2>
        {!isMockMode && (
          <button style={btnPrimary} onClick={() => setShowUpload((v) => !v)}>
            {showUpload ? 'Cancel' : '+ Add Photo'}
          </button>
        )}
      </div>

      {/* Subtitle */}
      <p style={{ fontSize: '0.8125rem', color: 'rgba(240,244,255,0.38)', lineHeight: 1.5, marginTop: '-0.25rem' }}>
        {isMockMode
          ? 'Connect your GBP to manage photos. These appear on your Google listing in Search and Maps.'
          : 'Photos uploaded here are synced to your GBP listing and shown to customers on Google Search and Maps.'}
      </p>

      {/* Upload panel */}
      {showUpload && !isMockMode && (
        <UploadPanel onClose={() => setShowUpload(false)} onUploaded={handleUploaded} />
      )}

      {/* Error */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.28)', borderRadius: '0.625rem', padding: '0.625rem 0.875rem', fontSize: '0.8125rem', color: '#f87171' }}>
          {error}
        </div>
      )}

      {/* Count row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.28)' }}>
          {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
          {totalPages > 1 && ` · page ${page} of ${totalPages}`}
        </p>
      </div>

      {/* Photo grid */}
      {photos.length === 0 && !isMockMode ? (
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '0.875rem',
            padding: '3rem',
            textAlign: 'center',
          }}
        >
          <p style={{ color: 'rgba(240,244,255,0.32)', fontSize: '0.875rem' }}>
            No photos yet — click "+ Add Photo" to upload your first one.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
          {pagePhotos.map((photo, i) => (
            <PhotoCard
              key={photo.name}
              photo={photo}
              index={(page - 1) * PHOTOS_PER_PAGE + i}
              isMock={isMockMode}
              deleting={deleting === photo.name}
              onDelete={() => handleDelete(photo)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onPage={(p) => { setPage(p); }} />
    </div>
  );
}
