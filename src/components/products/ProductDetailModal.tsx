import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, ShoppingBag, Star, Truck, Shield, MessageCircle } from 'lucide-react';
import { Product, ProductSize } from '../../types';
import { useCartStore } from '../../stores/cartStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { toast } from '../common/Toast';

interface Props {
  product: Product;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<Props> = ({ product, onClose }) => {
  const { language, formatPrice, merchant } = useSettingsStore();
  const { addItem } = useCartStore();
  const [selectedSize, setSelectedSize] = useState<ProductSize>(product.availableSizes[0] || 'Free Size');
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);

  const title = language === 'np' ? product.title.np : product.title.en;
  const desc = language === 'np' ? product.description.np : product.description.en;
  const discountPct = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

  const handleAdd = () => {
    addItem(product, selectedSize, qty);
    toast(`Added "${title}" to cart!`);
    onClose();
  };

  const waUrl = `https://wa.me/${merchant.whatsappNumber}?text=${encodeURIComponent(
    `🛍️ *Product Inquiry — DAWOSTI Boutique*\n\n📦 *${product.title.en}*\n💰 Price: NPR ${product.price.toLocaleString()}\n📏 Size: ${selectedSize}\n🔢 Qty: ${qty}\n\nI would like to order this item. Please confirm availability.`
  )}`;

  return (
    <div className="modal-overlay animate-fadeIn" onClick={onClose}>
      <div
        className="card animate-scaleUp"
        style={{ width: '100%', maxWidth: 900, maxHeight: '92vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, width: 36, height: 36, borderRadius: 99, background: 'white', border: '1px solid var(--cream)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
          <X size={18} />
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 0 }}>
          {/* Images */}
          <div style={{ background: 'var(--ivory-dark)', position: 'relative', minHeight: 'clamp(260px, 45vw, 420px)' }}>
            <img src={product.images[imgIdx]} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 'clamp(260px, 45vw, 420px)', maxHeight: 460 }} />

            {product.images.length > 1 && (
              <>
                <button onClick={() => setImgIdx((v) => (v - 1 + product.images.length) % product.images.length)}
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: 99, background: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
                  <ChevronLeft size={18} />
                </button>
                <button onClick={() => setImgIdx((v) => (v + 1) % product.images.length)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: 99, background: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
                  <ChevronRight size={18} />
                </button>

                {/* Thumbnails */}
                <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>
                  {product.images.map((img, i) => (
                    <button key={i} onClick={() => setImgIdx(i)}
                      style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', border: `2px solid ${i === imgIdx ? 'var(--burgundy)' : 'transparent'}`, cursor: 'pointer', padding: 0, background: 'none' }}>
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              </>
            )}

            {discountPct > 0 && <span className="badge badge-burgundy" style={{ position: 'absolute', top: 12, left: 12 }}>-{discountPct}% OFF</span>}
          </div>

          {/* Details */}
          <div style={{ padding: 'clamp(18px, 4vw, 32px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--burgundy)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
                {language === 'np' ? product.categoryName.np : product.categoryName.en}
              </div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: 'var(--brown)', lineHeight: 1.2, marginBottom: 10 }}>
                {title}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="stars">
                  {[1,2,3,4,5].map((n) => <Star key={n} size={14} fill={n <= Math.round(product.rating) ? 'var(--gold)' : 'none'} color={n <= Math.round(product.rating) ? 'var(--gold)' : 'var(--cream)'} />)}
                </div>
                <span style={{ fontSize: 13, color: 'var(--brown-light)' }}>{product.rating} ({product.reviewCount} reviews)</span>
              </div>
            </div>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: 'var(--burgundy)' }}>{formatPrice(product.price)}</span>
              {product.originalPrice && <span style={{ fontSize: 16, color: 'var(--brown-light)', textDecoration: 'line-through' }}>{formatPrice(product.originalPrice)}</span>}
            </div>

            <p style={{ fontSize: 14, color: 'var(--brown-light)', lineHeight: 1.7 }}>{desc}</p>

            {product.fabric && (
              <div style={{ fontSize: 13, color: 'var(--brown-light)' }}>
                <strong style={{ color: 'var(--brown)' }}>Fabric:</strong> {language === 'np' ? product.fabric.np : product.fabric.en}
              </div>
            )}

            {/* Size picker */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brown)', marginBottom: 10 }}>
                Select Size: <span style={{ color: 'var(--burgundy)' }}>{selectedSize}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {product.availableSizes.map((size) => (
                  <button key={size} onClick={() => setSelectedSize(size)}
                    style={{ padding: '8px 18px', borderRadius: 10, border: `1.5px solid ${selectedSize === size ? 'var(--burgundy)' : 'var(--cream)'}`, background: selectedSize === size ? 'var(--burgundy)' : 'white', color: selectedSize === size ? 'white' : 'var(--brown)', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'var(--transition)' }}>
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Qty */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brown)' }}>Quantity:</span>
              <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--cream)', borderRadius: 10, overflow: 'hidden' }}>
                <button onClick={() => setQty((v) => Math.max(1, v - 1))} style={{ padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, fontWeight: 700, color: 'var(--brown)' }}>−</button>
                <span style={{ padding: '8px 16px', fontWeight: 700, minWidth: 40, textAlign: 'center', fontSize: 15 }}>{qty}</span>
                <button onClick={() => setQty((v) => v + 1)} style={{ padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, fontWeight: 700, color: 'var(--brown)' }}>+</button>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleAdd} className="btn btn-primary" style={{ flex: 1 }} disabled={!product.inStock}>
                <ShoppingBag size={16} /> {product.inStock ? 'Add to Cart' : 'Out of Stock'}
              </button>
              <a href={waUrl} target="_blank" rel="noopener noreferrer"
                className="btn" style={{ background: '#25D366', color: 'white', textDecoration: 'none', gap: 6, padding: '10px 16px', borderRadius: 99, fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', minHeight: 44 }}>
                <MessageCircle size={16} />
              </a>
            </div>

            {/* Trust badges */}
            <div style={{ display: 'flex', gap: 20, paddingTop: 12, borderTop: '1px solid var(--cream)' }}>
              {[{ icon: <Truck size={14} />, text: 'Free delivery above NPR 3,000' }, { icon: <Shield size={14} />, text: '100% authentic handloom' }].map(({ icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--brown-light)' }}>
                  <span style={{ color: 'var(--burgundy)' }}>{icon}</span> {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
