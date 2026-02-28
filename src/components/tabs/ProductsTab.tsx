import { useEffect, useState } from 'react';

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
}

interface Props {
  initialProducts: Product[];
}

const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.10)',
  backdropFilter: 'blur(8px)',
  borderRadius: '1rem',
  padding: '1.25rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.75rem',
};

const btnPrimary: React.CSSProperties = {
  background: '#4f8ef7',
  color: 'white',
  borderRadius: '0.5rem',
  padding: '0.5rem 1rem',
  fontSize: '0.875rem',
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
};

const btnGhost: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.15)',
  color: 'rgba(240,244,255,0.7)',
  borderRadius: '0.5rem',
  padding: '0.3125rem 0.625rem',
  fontSize: '0.75rem',
  cursor: 'pointer',
};

const btnDanger: React.CSSProperties = {
  background: 'rgba(239,68,68,0.15)',
  border: '1px solid rgba(239,68,68,0.3)',
  color: '#f87171',
  borderRadius: '0.5rem',
  padding: '0.3125rem 0.625rem',
  fontSize: '0.75rem',
  cursor: 'pointer',
};

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: 'white',
  borderRadius: '0.5rem',
  height: '2.25rem',
  padding: '0 0.75rem',
  fontSize: '0.8125rem',
  outline: 'none',
  width: '100%',
  textAlign: 'center',
};

interface Draft { name: string; price: string; }

export default function ProductsTab({ initialProducts }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>({ name: '', price: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>({ name: '', price: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Keep in sync if parent re-fetches
  useEffect(() => { setProducts(initialProducts); }, [initialProducts]);

  const handleAdd = async () => {
    if (!draft.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: draft.name, price: draft.price }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProducts((prev) => [...prev, data.product]);
      setDraft({ name: '', price: '' });
      setAdding(false);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const handleSaveEdit = async (id: number) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editDraft.name, price: editDraft.price }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProducts((prev) => prev.map((p) => p.id === id ? data.product : p));
      setEditingId(null);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE', credentials: 'include' });
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch { /* ignore */ }
    finally { setDeleting(null); }
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setEditDraft({ name: p.name, price: p.price });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'rgba(240,244,255,0.95)' }}>
          Products{' '}
          <span style={{ color: 'rgba(240,244,255,0.4)', fontWeight: 400, fontSize: '0.875rem' }}>
            ({products.length})
          </span>
        </h2>
        <button style={btnPrimary} onClick={() => setAdding(true)} disabled={adding}>+ Add Product</button>
      </div>

      {/* Add form */}
      {adding && (
        <div
          className="rounded-2xl p-4 mb-4 flex flex-col gap-3"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}
        >
          <div className="grid grid-cols-2 gap-3">
            <input
              style={inputStyle}
              placeholder="Product name"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <input
              style={inputStyle}
              placeholder="Price (e.g. $45)"
              value={draft.price}
              onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button style={btnGhost} onClick={() => { setAdding(false); setDraft({ name: '', price: '' }); }}>Cancel</button>
            <button
              style={{ ...btnPrimary, opacity: saving || !draft.name.trim() ? 0.5 : 1 }}
              onClick={handleAdd}
              disabled={saving || !draft.name.trim()}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {products.length === 0 && !adding ? (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p style={{ color: 'rgba(240,244,255,0.4)', fontSize: '0.875rem' }}>
            No products yet. Click "+ Add Product" to get started.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {products.map((product) => (
            <div key={product.id} style={glassCard}>
              <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>📦</span>

              {editingId === product.id ? (
                <>
                  <input
                    style={inputStyle}
                    placeholder="Product name"
                    value={editDraft.name}
                    onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                    autoFocus
                  />
                  <input
                    style={inputStyle}
                    placeholder="Price"
                    value={editDraft.price}
                    onChange={(e) => setEditDraft((d) => ({ ...d, price: e.target.value }))}
                  />
                  <div className="flex gap-1.5">
                    <button style={btnGhost} onClick={() => setEditingId(null)}>Cancel</button>
                    <button
                      style={{ ...btnPrimary, fontSize: '0.75rem', padding: '0.3125rem 0.625rem', opacity: saving ? 0.6 : 1 }}
                      onClick={() => handleSaveEdit(product.id)}
                      disabled={saving}
                    >
                      Save
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'rgba(240,244,255,0.85)', textAlign: 'center', wordBreak: 'break-word' }}>
                    {product.name}
                  </p>
                  {product.price && (
                    <p style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>{product.price}</p>
                  )}
                  <div className="flex gap-1.5">
                    <button style={btnGhost} onClick={() => startEdit(product)}>Edit</button>
                    <button
                      style={{ ...btnDanger, opacity: deleting === product.id ? 0.5 : 1 }}
                      onClick={() => handleDelete(product.id)}
                      disabled={deleting === product.id}
                    >
                      {deleting === product.id ? '…' : 'Delete'}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
