import { useEffect, useRef, useState } from 'react';
import { useAppT } from '../../contexts/LanguageContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PhotoItem {
  name: string;
  mediaFormat: string;
  googleUrl?: string;
  thumbnailUrl?: string;
  sourceUrl?: string;
  locationAssociation?: { category: string };
  createTime?: string;
  // Enriched display fields
  displayName?: string;
  description?: string;
  // AI Vision label + user-edited label from photo_labels DB
  aiDescription?: string | null;
  userDescription?: string | null;
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

const MOCK_GRADIENTS = [
  'linear-gradient(135deg, rgba(79,142,247,0.18) 0%, rgba(52,211,153,0.10) 100%)',
  'linear-gradient(135deg, rgba(251,191,36,0.16) 0%, rgba(249,115,22,0.10) 100%)',
  'linear-gradient(135deg, rgba(167,139,250,0.18) 0%, rgba(79,142,247,0.10) 100%)',
  'linear-gradient(135deg, rgba(52,211,153,0.16) 0%, rgba(79,142,247,0.10) 100%)',
  'linear-gradient(135deg, rgba(249,115,22,0.16) 0%, rgba(251,191,36,0.10) 100%)',
  'linear-gradient(135deg, rgba(236,72,153,0.14) 0%, rgba(167,139,250,0.10) 100%)',
  'linear-gradient(135deg, rgba(79,142,247,0.14) 0%, rgba(236,72,153,0.10) 100%)',
  'linear-gradient(135deg, rgba(52,211,153,0.18) 0%, rgba(167,139,250,0.10) 100%)',
];

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
  onLabelSaved,
}: {
  photo: PhotoItem;
  index: number;
  isMock: boolean;
  deleting: boolean;
  onDelete: () => void;
  onLabelSaved: (url: string, description: string) => void;
}) {
  const imgUrl = photo.thumbnailUrl || photo.googleUrl || photo.sourceUrl;
  const viewUrl = photo.googleUrl || photo.sourceUrl;
  const category = photo.locationAssociation?.category;

  // Label state
  const effectiveLabel = photo.userDescription || photo.aiDescription || null;
  const labelSource: 'user' | 'ai' | null = photo.userDescription ? 'user' : photo.aiDescription ? 'ai' : null;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setDraft(photo.userDescription || photo.aiDescription || '');
    setEditing(true);
  };

  const saveLabel = async () => {
    if (!viewUrl) return;
    setSaving(true);
    try {
      await fetch('/api/photos/label', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_url: viewUrl, media_name: photo.name, description: draft }),
      });
      onLabelSaved(viewUrl, draft);
      setEditing(false);
    } catch (e) {
      // Non-fatal: close anyway
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

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
            : MOCK_GRADIENTS[index % MOCK_GRADIENTS.length],
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {imgUrl ? (
          <img src={imgUrl} alt={photo.displayName || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          /* Camera icon placeholder — matches the polish of Posts/Reviews tabs */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', opacity: 0.45 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
        )}
        {/* Sample badge for mocks */}
        {isMock && (
          <span style={{
            position: 'absolute', top: '0.4rem', right: '0.4rem',
            fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.05em',
            textTransform: 'uppercase', color: 'rgba(240,244,255,0.55)',
            background: 'rgba(0,0,0,0.40)', borderRadius: '0.25rem',
            padding: '0.1rem 0.35rem',
          }}>
            Sample
          </span>
        )}
        {/* Category badge for real photos */}
        {category && !isMock && (
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

        {/* Mock description text (shown instead of AI label section) */}
        {isMock && photo.description && (
          <p style={{
            fontSize: '0.72rem',
            color: 'rgba(240,244,255,0.38)',
            lineHeight: 1.45,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
          }}>
            {photo.description}
          </p>
        )}

        {/* AI / user description label section (real photos only) */}
        {!isMock && (
          <div style={{ marginTop: '0.15rem' }}>
            {editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <textarea
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Describe this photo for Claude — e.g. MLS #4821, 3 bed 2 bath lot on Mesa Rd"
                  rows={3}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(79,142,247,0.35)',
                    borderRadius: '0.4rem',
                    color: 'rgba(240,244,255,0.9)',
                    fontSize: '0.75rem',
                    padding: '0.35rem 0.5rem',
                    resize: 'vertical' as const,
                    fontFamily: 'inherit',
                    lineHeight: 1.45,
                    width: '100%',
                    outline: 'none',
                    boxSizing: 'border-box' as const,
                  }}
                />
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    style={{ ...btnPrimary, fontSize: '0.7rem', padding: '0.2rem 0.6rem', opacity: saving ? 0.55 : 1 }}
                    onClick={saveLabel}
                    disabled={saving}
                  >
                    {saving ? '…' : 'Save'}
                  </button>
                  <button
                    style={{ ...btnGhost, fontSize: '0.7rem', padding: '0.2rem 0.6rem' }}
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.35rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {effectiveLabel ? (
                    <p
                      style={{
                        fontSize: '0.72rem',
                        color: labelSource === 'user' ? 'rgba(52,211,153,0.75)' : 'rgba(240,244,255,0.32)',
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical' as const,
                        overflow: 'hidden',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          marginRight: '0.3rem',
                          color: labelSource === 'user' ? '#34d399' : '#4f8ef7',
                          background: labelSource === 'user' ? 'rgba(52,211,153,0.10)' : 'rgba(79,142,247,0.12)',
                          borderRadius: '0.2rem',
                          padding: '0.05rem 0.3rem',
                        }}
                      >
                        {labelSource === 'user' ? 'Custom' : 'AI'}
                      </span>
                      {effectiveLabel}
                    </p>
                  ) : (
                    <p style={{ fontSize: '0.72rem', color: 'rgba(240,244,255,0.2)', fontStyle: 'italic' }}>
                      No description yet
                    </p>
                  )}
                </div>
                <button
                  onClick={startEdit}
                  title="Edit description"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(240,244,255,0.28)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    padding: '0.1rem 0.2rem',
                    flexShrink: 0,
                    lineHeight: 1,
                  }}
                >
                  ✏️
                </button>
              </div>
            )}
          </div>
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
  const tp = useAppT().photos;
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
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
    setDescription('');
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setUploadError(''); setUploadResult(null);
    const form = new FormData();
    form.append('photo', file);
    form.append('caption', description);
    form.append('category', category);
    try {
      const res = await fetch('/api/photos/upload', { method: 'POST', credentials: 'include', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUploadResult(data);
      setFile(null); setPreview(null); setDescription('');
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
        <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'rgba(240,244,255,0.85)' }}>{tp.uploadHeading}</p>
        <button style={btnGhost} onClick={onClose}>{tp.cancel}</button>
      </div>

      <p style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.38)', lineHeight: 1.5, marginTop: '-0.25rem' }}>
        {tp.uploadSubtitle}
      </p>

      {uploadResult && (
        <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: '0.625rem', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#34d399' }}>{tp.uploadSuccess}</p>
          <p style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.65)' }}>
            <strong style={{ color: 'rgba(240,244,255,0.85)' }}>{tp.uploadSuccessDesc}</strong> {uploadResult.meta.description}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.45)' }}>
            <strong>{tp.uploadSuccessKw}</strong> {uploadResult.meta.keywords?.join(', ')}
          </p>
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
            <p style={{ fontSize: '0.8125rem', color: 'rgba(240,244,255,0.45)' }}>{tp.dropClick}</p>
            <p style={{ fontSize: '0.75rem', color: 'rgba(240,244,255,0.25)', marginTop: '0.15rem' }}>{tp.dropFormats}</p>
          </>
        )}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleFile} />
      </div>

      {/* Description field */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(240,244,255,0.55)', letterSpacing: '0.01em' }}>
          {tp.descriptionLabel}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={tp.descriptionPlaceholder}
          rows={3}
          style={{
            ...inputStyle,
            height: 'auto',
            padding: '0.5rem 0.75rem',
            resize: 'vertical' as const,
            lineHeight: 1.5,
          }}
        />
      </div>

      {/* Category */}
      <select
        style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' as const, background: 'rgba(255,255,255,0.06)' }}
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        {CATEGORIES.map((c) => <option key={c.value} value={c.value} style={{ background: '#080d1a' }}>{c.label}</option>)}
      </select>

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
            {tp.uploading}
          </>
        ) : tp.uploadBtn}
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
  const tp = useAppT().photos;
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
          aiDescription: p.aiDescription ?? null,
          userDescription: p.userDescription ?? null,
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

  const handleLabelSaved = (url: string, description: string) => {
    setPhotos((prev) => prev.map((p) => {
      const photoUrl = p.googleUrl || p.sourceUrl;
      if (photoUrl !== url) return p;
      return { ...p, userDescription: description || null };
    }));
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
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'rgba(240,244,255,0.95)' }}>{tp.heading}</h2>
        {!isMockMode && (
          <button style={btnPrimary} onClick={() => setShowUpload((v) => !v)}>
            {showUpload ? tp.cancel : tp.addPhoto}
          </button>
        )}
      </div>

      {/* Subtitle */}
      <p style={{ fontSize: '0.8125rem', color: 'rgba(240,244,255,0.38)', lineHeight: 1.5, marginTop: '-0.25rem' }}>
        {isMockMode ? tp.subtitleMock : tp.subtitleReal}
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
          {photos.length} {photos.length === 1 ? tp.photo : tp.photos}
          {totalPages > 1 && ` · ${tp.page} ${page} ${tp.of} ${totalPages}`}
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
            {tp.noPhotos}
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
              onLabelSaved={handleLabelSaved}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onPage={(p) => { setPage(p); }} />
    </div>
  );
}
