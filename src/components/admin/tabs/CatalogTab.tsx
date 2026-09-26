import React, { useState } from 'react';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle,
  X,
  Sparkles,
  Tag,
  DollarSign,
  Layers,
  Image as ImageIcon,
  Save,
  Check,
  Star,
} from 'lucide-react';
import { useProductStore } from '../../../stores/productStore';
import { Product, Category } from '../../../types';
import { toast } from '../../common/Toast';

export const CatalogTab: React.FC = () => {
  const { products, categories, addProduct, updateProduct, deleteProduct, clearAllProducts } = useProductStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const filtered = products.filter((p) => {
    if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchEn = p.title.en.toLowerCase().includes(q);
      const matchNp = p.title.np.toLowerCase().includes(q);
      const matchSlug = p.slug.toLowerCase().includes(q);
      return matchEn || matchNp || matchSlug;
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditingProduct({
      id: `daw-${Date.now().toString().slice(-4)}`,
      slug: '',
      title: { en: '', np: '' },
      description: { en: '', np: '' },
      price: 3500,
      originalPrice: 4500,
      costPrice: 1500,
      categoryId: categories[0]?.id || 'cat-kurthas',
      categoryName: categories[0]?.name || { en: 'Kurthas', np: 'कुर्ता' },
      images: ['https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80'],
      availableSizes: ['S', 'M', 'L', 'XL'],
      inStock: true,
      rating: 4.8,
      reviewCount: 1,
      tags: ['fashion', 'nepal'],
      fabric: { en: 'Pure Cotton', np: 'सुती कटन' },
      origin: { en: 'Kathmandu Atelier, Nepal', np: 'काठमाडौँ, नेपाल' },
      isNewArrival: true,
      isFeatured: false,
    });
    setIsEditing(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct({ ...p });
    setIsEditing(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.title?.en.trim()) {
      toast('Please enter a product title in English', 'error');
      return;
    }

    if (!editingProduct.price || editingProduct.price <= 0) {
      toast('Please enter a valid price', 'error');
      return;
    }

    const slug =
      editingProduct.slug?.trim() ||
      editingProduct.title.en
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    const cat = categories.find((c) => c.id === editingProduct.categoryId) || categories[0];

    const finalProduct: Product = {
      id: editingProduct.id || `daw-${Date.now().toString().slice(-4)}`,
      slug,
      title: {
        en: editingProduct.title.en.trim(),
        np: editingProduct.title.np?.trim() || editingProduct.title.en.trim(),
      },
      description: {
        en: editingProduct.description?.en?.trim() || '',
        np: editingProduct.description?.np?.trim() || editingProduct.description?.en?.trim() || '',
      },
      price: Number(editingProduct.price),
      originalPrice: editingProduct.originalPrice ? Number(editingProduct.originalPrice) : undefined,
      costPrice: editingProduct.costPrice ? Number(editingProduct.costPrice) : Math.round(Number(editingProduct.price) * 0.45),
      categoryId: cat?.id || 'cat-kurthas',
      categoryName: cat?.name || { en: 'Kurthas', np: 'कुर्ता' },
      images: editingProduct.images && editingProduct.images.length > 0 ? editingProduct.images : ['https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80'],
      availableSizes: editingProduct.availableSizes || ['S', 'M', 'L'],
      inStock: editingProduct.inStock ?? true,
      rating: editingProduct.rating || 4.8,
      reviewCount: editingProduct.reviewCount || 1,
      tags: editingProduct.tags || ['fashion'],
      fabric: editingProduct.fabric || { en: 'Silk & Cotton', np: 'सिल्क र कटन' },
      origin: editingProduct.origin || { en: 'Kathmandu, Nepal', np: 'काठमाडौँ, नेपाल' },
      isNewArrival: editingProduct.isNewArrival ?? false,
      isFeatured: editingProduct.isFeatured ?? false,
    };

    const exists = products.some((p) => p.id === finalProduct.id);
    if (exists) {
      updateProduct(finalProduct.id, finalProduct);
      toast(`Updated product: ${finalProduct.title.en}`);
    } else {
      addProduct(finalProduct);
      toast(`Added new product: ${finalProduct.title.en}`);
    }

    setIsEditing(false);
    setEditingProduct(null);
  };

  const handleRequestDelete = (product: Product) => {
    setProductToDelete(product);
  };

  const executeDeleteProduct = () => {
    if (!productToDelete) return;
    const name = productToDelete.title.en;
    deleteProduct(productToDelete.id);
    toast(`Permanently deleted: "${name}"`, 'success');
    setProductToDelete(null);
  };

  const handleToggleStock = (product: Product) => {
    updateProduct(product.id, { inStock: !product.inStock });
    toast(`${product.title.en} marked as ${!product.inStock ? 'In Stock' : 'Out of Stock'}`);
  };

  const handleToggleFeatured = (product: Product) => {
    updateProduct(product.id, { isFeatured: !product.isFeatured });
    toast(`${product.title.en} ${!product.isFeatured ? 'featured on homepage' : 'unfeatured'}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header bar */}
      <div
        style={{
          background: 'linear-gradient(135deg, #FAF2E9 0%, #F5E6D3 100%)',
          border: '1.5px solid #D4AF37',
          borderRadius: 12,
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: '#8B3A3A',
              color: '#FFF8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Package size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#2B1810' }}>
              Store Catalog & Garment Inventory
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6B564C' }}>
              Manage dresses, prices, buying cost (COGS), sizes, and real-time live availability.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {products.length > 0 && (
            <button
              onClick={async () => {
                if (
                  window.confirm(
                    `Are you sure you want to permanently delete all ${products.length} garments from the store catalog? This will completely empty the catalog and cannot be undone.`
                  )
                ) {
                  await clearAllProducts();
                  toast('All garments deleted from catalog. The catalog is now empty.', 'success');
                }
              }}
              style={{
                padding: '9px 14px',
                backgroundColor: '#FFF0F0',
                color: '#B02A37',
                border: '1px solid #F5C2C7',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Trash2 size={15} />
              <span>Delete Entire Catalog ({products.length})</span>
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            style={{
              padding: '9px 18px',
              backgroundColor: '#8B3A3A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 3px 10px rgba(139,58,58,0.25)',
            }}
          >
            <Plus size={16} />
            <span>Add New Garment</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          background: '#FFF',
          padding: 14,
          borderRadius: 10,
          border: '1px solid #EADCCE',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: 10, flex: 1, minWidth: 260 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={15}
              color="#888"
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Search by title (English or Nepali)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 32px',
                borderRadius: 6,
                border: '1px solid #D4C5B9',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #D4C5B9',
              fontSize: 13,
              backgroundColor: '#FFF',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Categories ({products.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name.en} ({products.filter((p) => p.categoryId === c.id).length})
              </option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: 12.5, color: '#6B564C', fontWeight: 600 }}>
          Showing <strong>{filtered.length}</strong> garments
        </div>
      </div>

      {/* Product List Grid */}
      {filtered.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', background: '#FFF8F0', borderRadius: 12, border: '1px solid #EADCCE' }}>
          <Package size={42} color="#8B3A3A" style={{ opacity: 0.35, margin: '0 auto 12px' }} />
          <h4 style={{ margin: '0 0 6px', color: '#2B1810', fontSize: 16, fontWeight: 700 }}>Store Catalog is Empty</h4>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#666', maxWidth: 450, marginInline: 'auto' }}>
            {products.length === 0
              ? 'There are currently no products in the catalog. Click "Add New Garment" to list your first authentic collection item.'
              : 'No garments match your current search or category filter.'}
          </p>
          <button
            onClick={handleOpenAdd}
            style={{
              padding: '9px 18px',
              backgroundColor: '#8B3A3A',
              color: '#FFF',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Plus size={15} /> Add New Garment
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map((product) => {
          const margin = product.costPrice
            ? Math.round(((product.price - product.costPrice) / product.price) * 100)
            : 50;

          return (
            <div
              key={product.id}
              style={{
                background: '#FFFFFF',
                borderRadius: 10,
                border: `1.5px solid ${product.inStock ? '#EADCCE' : '#F5C2C7'}`,
                padding: 14,
                display: 'flex',
                gap: 14,
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                position: 'relative',
              }}
            >
              {/* Product Thumbnail */}
              <div
                style={{
                  width: 90,
                  height: 110,
                  borderRadius: 8,
                  overflow: 'hidden',
                  flexShrink: 0,
                  background: '#FAF2E9',
                  position: 'relative',
                }}
              >
                <img
                  src={product.images[0] || 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=400&q=80'}
                  alt={product.title.en}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {!product.inStock && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFF',
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    Out of Stock
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#2B1810', lineHeight: 1.3 }}>
                      {product.title.en}
                    </h4>
                    <button
                      onClick={() => handleToggleFeatured(product)}
                      title={product.isFeatured ? 'Featured on Homepage' : 'Not featured'}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: product.isFeatured ? '#D4AF37' : '#CCC' }}
                    >
                      <Star size={16} fill={product.isFeatured ? '#D4AF37' : 'none'} />
                    </button>
                  </div>

                  <p style={{ margin: '2px 0 6px', fontSize: 11.5, color: '#6B564C' }}>
                    {product.title.np} • <span style={{ color: '#8B3A3A', fontWeight: 600 }}>{product.categoryName?.en || 'Fashion'}</span>
                  </p>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#8B3A3A' }}>
                      NPR {product.price.toLocaleString()}
                    </span>
                    {product.originalPrice && (
                      <span style={{ fontSize: 11, color: '#888', textDecoration: 'line-through' }}>
                        NPR {product.originalPrice.toLocaleString()}
                      </span>
                    )}
                    {product.costPrice && (
                      <span
                        style={{
                          fontSize: 10.5,
                          background: margin >= 40 ? '#E0F3EA' : '#FFF3CD',
                          color: margin >= 40 ? '#1B7F5E' : '#856404',
                          padding: '1px 6px',
                          borderRadius: 4,
                          fontWeight: 700,
                        }}
                      >
                        COGS: NPR {product.costPrice.toLocaleString()} ({margin}%)
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: 11, color: '#666' }}>
                    Sizes: <strong>{product.availableSizes.join(', ')}</strong>
                  </div>
                </div>

                {/* Actions Bottom Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, borderTop: '1px solid #F0E6D8', paddingTop: 8 }}>
                  <button
                    onClick={() => handleToggleStock(product)}
                    style={{
                      background: product.inStock ? '#E0F3EA' : '#FFF0F0',
                      color: product.inStock ? '#1B7F5E' : '#B02A37',
                      border: `1px solid ${product.inStock ? '#A3E2C3' : '#F5C2C7'}`,
                      borderRadius: 4,
                      padding: '3px 8px',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {product.inStock ? '✓ In Stock' : '✗ Out of Stock'}
                  </button>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => handleOpenEdit(product)}
                      title="Edit Product"
                      style={{
                        padding: '4px 8px',
                        background: '#FAF2E9',
                        border: '1px solid #D4AF37',
                        borderRadius: 4,
                        color: '#8B3A3A',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRequestDelete(product);
                      }}
                      title="Delete Product"
                      style={{
                        padding: '6px 12px',
                        background: '#FFF0F0',
                        border: '1.5px solid #F5C2C7',
                        borderRadius: 6,
                        color: '#B02A37',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 12,
                        fontWeight: 700,
                        minHeight: '34px',
                        touchAction: 'manipulation',
                        boxShadow: '0 1px 3px rgba(176,42,55,0.08)',
                      }}
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Add / Edit Product Modal */}
      {isEditing && editingProduct && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(43, 24, 16, 0.75)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setIsEditing(false)}
        >
          <div
            style={{
              backgroundColor: '#FFF8F0',
              borderRadius: 12,
              border: '2px solid #D4AF37',
              maxWidth: 620,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 24,
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#2B1810' }}>
                {products.some((p) => p.id === editingProduct.id) ? 'Edit Garment Details' : 'Add New Garment to Catalog'}
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#2B1810', marginBottom: 4 }}>
                    Title (English) *
                  </label>
                  <input
                    required
                    value={editingProduct.title?.en || ''}
                    onChange={(e) =>
                      setEditingProduct((prev) => ({
                        ...prev,
                        title: { en: e.target.value, np: prev?.title?.np || e.target.value },
                      }))
                    }
                    placeholder="e.g. Royal Crimson Zardozi Lehenga"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #D4C5B9', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#2B1810', marginBottom: 4 }}>
                    Title (Nepali)
                  </label>
                  <input
                    value={editingProduct.title?.np || ''}
                    onChange={(e) =>
                      setEditingProduct((prev) => ({
                        ...prev,
                        title: { en: prev?.title?.en || '', np: e.target.value },
                      }))
                    }
                    placeholder="उदा: शाही रातो जर्दोजी लहेंगा"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #D4C5B9', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#2B1810', marginBottom: 4 }}>
                    Selling Price (NPR) *
                  </label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price || ''}
                    onChange={(e) => setEditingProduct((prev) => ({ ...prev, price: Number(e.target.value) }))}
                    placeholder="3500"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #D4C5B9', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#2B1810', marginBottom: 4 }}>
                    Original / Strikethrough
                  </label>
                  <input
                    type="number"
                    value={editingProduct.originalPrice || ''}
                    onChange={(e) => setEditingProduct((prev) => ({ ...prev, originalPrice: Number(e.target.value) }))}
                    placeholder="4500"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #D4C5B9', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#2B1810', marginBottom: 4 }}>
                    Buying Cost (COGS)
                  </label>
                  <input
                    type="number"
                    value={editingProduct.costPrice || ''}
                    onChange={(e) => setEditingProduct((prev) => ({ ...prev, costPrice: Number(e.target.value) }))}
                    placeholder="1500"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #D4C5B9', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#2B1810', marginBottom: 4 }}>
                    Category
                  </label>
                  <select
                    value={editingProduct.categoryId}
                    onChange={(e) => setEditingProduct((prev) => ({ ...prev, categoryId: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #D4C5B9', fontSize: 13, backgroundColor: '#FFF', boxSizing: 'border-box' }}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name.en}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#2B1810', marginBottom: 4 }}>
                    Fabric / Material
                  </label>
                  <input
                    value={editingProduct.fabric?.en || ''}
                    onChange={(e) =>
                      setEditingProduct((prev) => ({
                        ...prev,
                        fabric: { en: e.target.value, np: e.target.value },
                      }))
                    }
                    placeholder="e.g. Pure Georgette & Raw Silk"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #D4C5B9', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#2B1810', marginBottom: 4 }}>
                  Main Image URL *
                </label>
                <input
                  required
                  value={editingProduct.images?.[0] || ''}
                  onChange={(e) => setEditingProduct((prev) => ({ ...prev, images: [e.target.value] }))}
                  placeholder="https://images.unsplash.com/..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #D4C5B9', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#2B1810', marginBottom: 4 }}>
                  Description (English)
                </label>
                <textarea
                  rows={3}
                  value={editingProduct.description?.en || ''}
                  onChange={(e) =>
                    setEditingProduct((prev) => ({
                      ...prev,
                      description: { en: e.target.value, np: prev?.description?.np || e.target.value },
                    }))
                  }
                  placeholder="Garment details, styling notes, occasion..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #D4C5B9', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editingProduct.inStock ?? true}
                    onChange={(e) => setEditingProduct((prev) => ({ ...prev, inStock: e.target.checked }))}
                  />
                  <span>In Stock</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editingProduct.isFeatured ?? false}
                    onChange={(e) => setEditingProduct((prev) => ({ ...prev, isFeatured: e.target.checked }))}
                  />
                  <span>Feature on Homepage</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editingProduct.isNewArrival ?? false}
                    onChange={(e) => setEditingProduct((prev) => ({ ...prev, isNewArrival: e.target.checked }))}
                  />
                  <span>New Arrival Badge</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{ padding: '8px 16px', background: '#EEE', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 20px',
                    background: '#8B3A3A',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Save size={15} /> Save Garment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Touch-Friendly Delete Confirmation Modal */}
      {productToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 999999,
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              maxWidth: 440,
              width: '100%',
              padding: 22,
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              border: '2px solid #F5C2C7',
              animation: 'fadeIn 0.15s ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: '50%',
                  background: '#FEE2E2',
                  color: '#DC2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Trash2 size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#2B1810' }}>
                  Delete Garment from Catalog?
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: '#6B564C' }}>
                  हटाएपछि यो पोशाक स्टोर र ग्राहकको दृश्यबाट सधैंका लागि हट्नेछ।
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 12,
                padding: 12,
                background: '#FAF2E9',
                borderRadius: 10,
                border: '1px solid #EADCCE',
                marginBottom: 18,
                alignItems: 'center',
              }}
            >
              <img
                src={productToDelete.images[0] || 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=400&q=80'}
                alt={productToDelete.title.en}
                style={{ width: 50, height: 60, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#2B1810', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {productToDelete.title.en}
                </div>
                <div style={{ fontSize: 12, color: '#8B3A3A', fontWeight: 600 }}>
                  {productToDelete.title.np} • NPR {productToDelete.price.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: '#888' }}>
                  ID: {productToDelete.id}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                type="button"
                onClick={executeDeleteProduct}
                style={{
                  width: '100%',
                  height: 48,
                  borderRadius: 10,
                  background: '#DC2626',
                  color: '#FFF',
                  border: 'none',
                  fontSize: 14.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
                  touchAction: 'manipulation',
                }}
              >
                <Trash2 size={18} />
                <span>Permanently Delete (सधैंका लागि हटाउनुहोस्)</span>
              </button>

              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                style={{
                  width: '100%',
                  height: 44,
                  borderRadius: 10,
                  background: '#FFF',
                  color: '#6B564C',
                  border: '1.5px solid #D1D5DB',
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                }}
              >
                Cancel (रद्द गर्नुहोस्)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
