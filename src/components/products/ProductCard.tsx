import React, { useState } from 'react';
import { Star, Heart, Eye, ShoppingBag, Zap } from 'lucide-react';
import { Product, ProductSize } from '../../types';
import { useCartStore } from '../../stores/cartStore';
import { useProductStore } from '../../stores/productStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { toast } from '../common/Toast';

interface Props {
  product: Product;
}

export const ProductCard: React.FC<Props> = ({ product }) => {
  const { language, formatPrice } = useSettingsStore();
  const { addItem } = useCartStore();
  const { setActiveDetailProduct, setActiveQuickViewProduct } = useProductStore();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const discountPct = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const defaultSize: ProductSize = product.availableSizes[0] || 'Free Size';

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product, defaultSize, 1);
    toast(`Added "${language === 'np' ? product.title.np : product.title.en}" to cart!`);
  };

  return (
    <div
      className="card product-card"
      style={{ overflow: 'hidden', cursor: 'pointer' }}
      onClick={() => setActiveDetailProduct(product)}
    >
      {/* Image */}
      <div style={{ position: 'relative', aspectRatio: '3/4', background: 'var(--ivory-dark)', overflow: 'hidden' }}>
        {!imgLoaded && <div className="skeleton" style={{ position: 'absolute', inset: 0 }} />}
        {!imgError ? (
          <img
            src={product.images[0]}
            alt={language === 'np' ? product.title.np : product.title.en}
            onLoad={() => setImgLoaded(true)}
            onError={() => { setImgError(true); setImgLoaded(true); }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease', display: imgLoaded ? 'block' : 'none' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brown-light)', fontSize: 40 }}>🪡</div>
        )}

        {/* Badges */}
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {product.isNewArrival && <span className="badge badge-gold">New</span>}
          {discountPct > 0 && <span className="badge badge-burgundy">-{discountPct}%</span>}
          {!product.inStock && <span className="badge badge-red">Sold Out</span>}
        </div>

        {/* Action buttons overlay */}
        <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', flexDirection: 'column', gap: 6, opacity: 0, transition: 'var(--transition)' }}
          className="product-card-actions"
        >
          <button
            onClick={(e) => { e.stopPropagation(); setIsWishlisted((v) => !v); }}
            style={{ width: 36, height: 36, borderRadius: 99, background: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}
          >
            <Heart size={16} fill={isWishlisted ? 'var(--burgundy)' : 'none'} color={isWishlisted ? 'var(--burgundy)' : 'var(--brown-light)'} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setActiveQuickViewProduct(product); }}
            style={{ width: 36, height: 36, borderRadius: 99, background: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}
          >
            <Eye size={16} color="var(--brown-light)" />
          </button>
        </div>

        {/* Quick add button */}
        {product.inStock && (
          <button
            onClick={handleQuickAdd}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px', background: 'var(--brown)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transform: 'translateY(100%)', transition: 'transform 0.25s ease' }}
            className="quick-add-btn"
          >
            <Zap size={14} style={{ color: 'var(--gold)' }} /> Quick Add
          </button>
        )}
      </div>

      {/* Info */}
      <div className="card-content" style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 10, color: 'var(--burgundy)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
          {language === 'np' ? product.categoryName.np : product.categoryName.en}
        </div>
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontWeight: 600, color: 'var(--brown)', lineHeight: 1.3, marginBottom: 6 }}>
          {language === 'np' ? product.title.np : product.title.en}
        </h3>

        {/* Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <div className="stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} size={11} fill={n <= Math.round(product.rating) ? 'var(--gold)' : 'none'} color={n <= Math.round(product.rating) ? 'var(--gold)' : 'var(--cream)'} />
            ))}
          </div>
          <span style={{ fontSize: 11, color: 'var(--brown-light)' }}>({product.reviewCount})</span>
        </div>

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="price-tag" style={{ fontWeight: 700, fontSize: 16, color: 'var(--burgundy)' }}>{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <span style={{ fontSize: 12, color: 'var(--brown-light)', textDecoration: 'line-through' }}>{formatPrice(product.originalPrice)}</span>
          )}
        </div>
      </div>

      <style>{`
        .product-card:hover .product-card-actions { opacity: 1; }
        .product-card:hover .quick-add-btn { transform: translateY(0) !important; }
        .product-card:hover img { transform: scale(1.06); }
      `}</style>
    </div>
  );
};
