import { useEffect, useState } from 'react';

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  url?: string;
}

interface Draft {
  name: string;
  description: string;
  price: string;
  url: string;
}

// ─── Mock products (guest / empty state preview) ──────────────────────────────

export const MOCK_PRODUCTS: Product[] = [
  {
    id: -1,
    name: 'Custom Door Fabrication & Installation',
    description: 'Custom exterior and interior door fabrication with professional installation. We handle framing, weatherstripping, and hardware.',
    price: 'From $450',
  },
  {
    id: -2,
    name: 'Kitchen Cabinet Installation',
    description: 'Full kitchen cabinet installation including upper, lower, and island cabinets. IKEA, Home Depot, and custom builds welcome.',
    price: 'From $600',
  },
  {
    id: -3,
    name: 'Garbage Disposal Installation & Replacement',
    description: 'Same-day garbage disposal installation or replacement with full leak inspection and warranty.',
    price: 'From $150',
  },
  {
    id: -4,
    name: 'Low Water Pressure Diagnosis & Repair',
    description: 'Full diagnostic of water pressure issues across fixtures, valves, and supply lines — with same-visit repair.',
    price: 'From $95',
  },
  {
    id: -5,
    name: 'Stop Toilet Leaks – Wax Ring Replacement',
    description: 'Professional wax ring and flange replacement to stop toilet base leaks and rocking. Includes re-seal and bolt tightening.',
    price: 'From $120',
  },
  {
    id: -6,
    name: 'Art, Mirror & Picture Hanging',
    description: 'Expert hanging of artwork, mirrors, and gallery walls on drywall, tile, brick, and concrete — level and anchored.',
    price: 'From $65',
  },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

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

const textareaStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: 'white',
  borderRadius: '0.5rem',
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  outline: 'none',
  width: '100%',
  resize: 'vertical',
  minHeight: '4rem',
  fontFamily: 'inherit',
  lineHeight: 1.5,
};

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

// ─── Product card ─────────────────────────────────────────────────────────────

const PRODUCT_ICONS = ['🔨', '🪚', '🔧', '🪛', '🚿', '🔌', '🪟', '🛁', '🏠', '🪴'];

function getIcon(id: number): string {
  return PRODUCT_ICONS[Math.abs(id) % PRODUCT_ICONS.length];
}

function ProductCard({
  product,
  isMock,
  onEdit,
  onDelete,
}: {
  product: Product;
  isMock: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
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
      {/* Image placeholder */}
      <div
        style={{
          height: '120px',
          background: 'linear-gradient(135deg, rgba(79,142,247,0.08) 0%, rgba(52,211,153,0.06) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.25rem',
        }}
      >
        {getIcon(product.id)}
      </div>

      {/* Content */}
      <div
        style={{
          padding: '0.75rem 0.875rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
          flex: 1,
        }}
      >
        <p
          style={{
            fontSize: '0.8125rem',
            fontWeight: 700,
            color: 'rgba(240,244,255,0.92)',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
          }}
        >
          {product.name}
        </p>

        {product.description && (
          <p
            style={{
              fontSize: '0.75rem',
              color: 'rgba(240,244,255,0.40)',
              lineHeight: 1.45,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const,
              overflow: 'hidden',
            }}
          >
            {product.description}
          </p>
        )}

        {/* Price chip */}
        {product.price && (
          <span
            style={{
              alignSelf: 'flex-start',
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: '#34d399',
              background: 'rgba(52,211,153,0.08)',
              border: '1px solid rgba(52,211,153,0.18)',
              borderRadius: '9999px',
              padding: '0.1rem 0.5rem',
              marginTop: '0.1rem',
              whiteSpace: 'nowrap',
            }}
          >
            {product.price}
          </span>
        )}
      </div>

      {/* Footer actions */}
      {!isMock && (
        <div
          style={{
            padding: '0.5rem 0.875rem 0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            borderTop: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {product.url && (
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '0.75rem',
                color: '#4f8ef7',
                textDecoration: 'none',
                fontWeight: 500,
                marginRight: 'auto',
              }}
            >
              View ↗
            </a>
          )}
          {!product.url && <span style={{ flex: 1 }} />}
          <button style={btnGhost} onClick={onEdit}>Edit</button>
          <button style={btnDelete} onClick={onDelete} title="Remove product">✕</button>
        </div>
      )}

      {/* Mock footer — shows "View" placeholder only */}
      {isMock && (
        <div
          style={{
            padding: '0.5rem 0.875rem 0.75rem',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              color: 'rgba(240,244,255,0.2)',
              fontStyle: 'italic',
            }}
          >
            View ↗
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Edit form overlay ────────────────────────────────────────────────────────

function EditProductForm({
  product,
  onSave,
  onCancel,
}: {
  product: Product;
  onSave: (draft: Draft) => Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Draft>({
    name: product.name,
    description: product.description,
    price: product.price,
    url: product.url ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
  };

  return (
    <div
      style={{
        background: 'rgba(79,142,247,0.05)',
        border: '1px solid rgba(79,142,247,0.28)',
        borderRadius: '0.875rem',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.625rem',
        gridColumn: '1 / -1',
      }}
    >
      <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'rgba(240,244,255,0.85)', marginBottom: '0.25rem' }}>
        Edit Product
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
        <input style={inputStyle} placeholder="Product name" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} autoFocus />
        <input style={inputStyle} placeholder="Price (e.g. From $150)" value={draft.price} onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))} />
      </div>
      <textarea style={textareaStyle} placeholder="Short description" value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
      <input style={inputStyle} placeholder="Landing page URL (optional)" value={draft.url} onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))} />
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button style={btnGhost} onClick={onCancel}>Cancel</button>
        <button style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

// ─── Add form ─────────────────────────────────────────────────────────────────

function AddProductForm({
  onSave,
  onCancel,
}: {
  onSave: (draft: Draft) => Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Draft>({ name: '', description: '', price: '', url: '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!draft.name.trim()) return;
    setSaving(true);
    await onSave(draft);
    setSaving(false);
  };

  return (
    <div
      style={{
        background: 'rgba(79,142,247,0.05)',
        border: '1px solid rgba(79,142,247,0.28)',
        borderRadius: '0.875rem',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.625rem',
        gridColumn: '1 / -1',
        marginBottom: '0.5rem',
      }}
    >
      <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'rgba(240,244,255,0.85)', marginBottom: '0.25rem' }}>
        Add Product
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
        <input style={inputStyle} placeholder="Product name" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} autoFocus />
        <input style={inputStyle} placeholder="Price (e.g. From $150)" value={draft.price} onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))} />
      </div>
      <textarea style={textareaStyle} placeholder="Short description" value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
      <input style={inputStyle} placeholder="Landing page URL (optional)" value={draft.url} onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))} />
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button style={btnGhost} onClick={onCancel}>Cancel</button>
        <button style={{ ...btnPrimary, opacity: saving || !draft.name.trim() ? 0.5 : 1 }} onClick={handleSave} disabled={saving || !draft.name.trim()}>
          {saving ? 'Saving…' : 'Add Product'}
        </button>
      </div>
    </div>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

let nextId = 300;

export default function ProductsTab({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(
    initialProducts.length > 0 ? initialProducts : MOCK_PRODUCTS,
  );
  const [isMockMode, setIsMockMode] = useState(initialProducts.length === 0);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Sync when parent fetches real data
  useEffect(() => {
    if (initialProducts.length > 0) {
      setProducts(initialProducts);
      setIsMockMode(false);
    }
  }, [initialProducts]);

  const handleAdd = async (draft: Draft) => {
    try {
      // TODO: POST /api/products once GBP write scope is approved
      const newProduct: Product = {
        id: nextId++,
        name: draft.name,
        description: draft.description,
        price: draft.price,
        url: draft.url || undefined,
      };
      setProducts((prev) => [...prev, newProduct]);
      setAdding(false);
    } catch { /* ignore */ }
  };

  const handleSaveEdit = async (id: number, draft: Draft) => {
    try {
      // TODO: PATCH /api/products/:id once GBP write scope is approved
      setProducts((prev) =>
        prev.map((p) => p.id === id
          ? { ...p, name: draft.name, description: draft.description, price: draft.price, url: draft.url || undefined }
          : p,
        ),
      );
      setEditingId(null);
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      // TODO: DELETE /api/products/:id once GBP write scope is approved
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch { /* ignore */ }
    finally { setDeleting(null); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'rgba(240,244,255,0.95)' }}>Products</h2>
        {!isMockMode && (
          <button style={btnPrimary} onClick={() => setAdding(true)} disabled={adding}>+ Add Product</button>
        )}
      </div>

      {/* Subtitle */}
      <p style={{ fontSize: '0.8125rem', color: 'rgba(240,244,255,0.38)', lineHeight: 1.5, marginTop: '-0.25rem' }}>
        {isMockMode
          ? 'Connect your GBP to manage products. These appear on your Google listing.'
          : 'These products appear on your GBP listing. Edit them here and Ranky will sync to Google.'}
      </p>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>

        {/* Add form spans full width */}
        {adding && (
          <AddProductForm
            onSave={handleAdd}
            onCancel={() => setAdding(false)}
          />
        )}

        {/* Edit form spans full width, inline above the card being edited */}
        {editingId !== null && (() => {
          const editing = products.find((p) => p.id === editingId);
          if (!editing) return null;
          return (
            <EditProductForm
              product={editing}
              onSave={(draft) => handleSaveEdit(editingId, draft)}
              onCancel={() => setEditingId(null)}
            />
          );
        })()}

        {/* Product cards */}
        {products.map((product) => (
          product.id !== editingId && (
            <ProductCard
              key={product.id}
              product={product}
              isMock={isMockMode}
              onEdit={() => setEditingId(product.id)}
              onDelete={() => { if (deleting === null) handleDelete(product.id); }}
            />
          )
        ))}

        {/* Empty state */}
        {products.length === 0 && !adding && !isMockMode && (
          <div
            style={{
              gridColumn: '1 / -1',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '0.875rem',
              padding: '3rem',
              textAlign: 'center',
            }}
          >
            <p style={{ color: 'rgba(240,244,255,0.32)', fontSize: '0.875rem' }}>
              No products yet — click "+ Add Product" to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
