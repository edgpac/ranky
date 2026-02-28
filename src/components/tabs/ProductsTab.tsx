import { useState } from 'react';

interface Product {
  id: number;
  name: string;
  emoji: string;
  adding?: boolean;
  editName?: string;
}

const MOCK_PRODUCTS: Product[] = [
  { id: 1, name: 'Drywall Patch Kit', emoji: '📦' },
  { id: 2, name: 'Paint Set',          emoji: '📦' },
  { id: 3, name: 'Tile Grout',         emoji: '📦' },
  { id: 4, name: 'Wood Stain',         emoji: '📦' },
  { id: 5, name: 'Caulk Sealant',      emoji: '📦' },
];

let nextId = 100;

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

export default function ProductsTab() {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);

  const addProduct = () => {
    const id = nextId++;
    setProducts((prev) => [...prev, { id, name: '', emoji: '📦', adding: true, editName: '' }]);
  };

  const saveProduct = (id: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, name: p.editName || 'New Product', adding: false, editName: undefined } : p
      )
    );
  };

  const deleteProduct = (id: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const editName = (id: number, value: string) => {
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, editName: value } : p));
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'rgba(240,244,255,0.95)' }}>
          Products <span style={{ color: 'rgba(240,244,255,0.4)', fontWeight: 400, fontSize: '0.875rem' }}>({products.length})</span>
        </h2>
        <button style={btnPrimary} onClick={addProduct}>+ Add Product</button>
      </div>

      {/* 4-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {products.map((product) => (
          <div key={product.id} style={glassCard}>
            <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>{product.emoji}</span>

            {product.adding ? (
              <>
                <input
                  style={inputStyle}
                  placeholder="Product name"
                  value={product.editName ?? ''}
                  onChange={(e) => editName(product.id, e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && saveProduct(product.id)}
                />
                <button style={{ ...btnPrimary, width: '100%', fontSize: '0.8125rem' }} onClick={() => saveProduct(product.id)}>
                  Save
                </button>
              </>
            ) : (
              <>
                <p
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    color: 'rgba(240,244,255,0.85)',
                    textAlign: 'center',
                    wordBreak: 'break-word',
                  }}
                >
                  {product.name}
                </p>
                <div className="flex gap-1.5">
                  <button style={btnGhost}>Edit</button>
                  <button style={btnDanger} onClick={() => deleteProduct(product.id)}>Delete</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
