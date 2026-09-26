import React, { useState } from 'react';
import { Star, Heart, Eye, ShoppingBag, Zap, Plus } from 'lucide-react';
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
  const { addItem, setIsOpen: setCartOpen } = useCartStore();
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
    toast(`Added "${language === 'np' ? product.title.np : product.title.en}" (${defaultSize}) to cart!`);
    setCartOpen(true);
  };

  return (
    <div
      className="card product-card"
      style={{ overflow: 'hidden', cursor: 'pointer', position: 'relative', display: 'flex', flexDirection: 'column' }}
      onClick={() => setActiveDetailProduct(product)}
    >
      {/* Image Container */}
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
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexDirection: 'column', gap: 4, zIndex: 2 }}>
          {product.isNewArrival && <span className="badge badge-gold">New</span>}
          {discountPct > 0 && <span className="badge badge-burgundy">-{discountPct}%</span>}
          {!product.inStock && <span className="badge badge-red">Sold Out</span>}
        </div>

        {/* Wishlist Button (Always visible on mobile, subtle on desktop) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsWishlisted((v) => !v);
            toast(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist ❤️');
          }}
          className="wishlist-btn-badge"
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 3,
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(4px)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            transition: 'var(--transition)',
          }}
          aria-label="Wishlist"
        >
          <Heart
            size={16}
            fill={isWishlisted ? 'var(--burgundy)' : 'none'}
            color={isWishlisted ? 'var(--burgundy)' : 'var(--brown-light)'}
          />
        </button>

        {/* Floating Quick-Add / Size badge on mobile */}
        {product.inStock && (
          <button
            onClick={handleQuickAdd}
            className="mobile-quick-add-bubble"
            style={{
              position: 'absolute',
              bottom: 10,
              right: 10,
              zIndex: 3,
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #8B3A3A 0%, #682626 100%)',
              color: 'white',
              border: '1.5px solid #D4AF37',
              boxShadow: '0 4px 12px rgba(139,58,58,0.4)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Quick add to cart"
            aria-label="Quick add"
          >
            <Plus size={20} strokeWidth={2.5} />
          </button>
        )}

        {/* Desktop Quick add slide-up banner */}
        {product.inStock && (
          <button
            onClick={handleQuickAdd}
            className="desktop-quick-add-banner"
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '11px',
              background: 'linear-gradient(135deg, #2B1810 0%, #1A0E09 100%)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transform: 'translateY(100%)',
              transition: 'transform 0.25s ease',
              zIndex: 2,
            }}
          >
            <Zap size={14} style={{ color: 'var(--gold)' }} />
            <span>{language === 'np' ? 'सिधै कार्टमा थप्नुहोस्' : 'Quick Add to Cart'}</span>
          </button>
        )}
      </div>

      {/* Info Details */}
      <div className="card-content" style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 10, color: 'var(--burgundy)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
          {language === 'np' ? product.categoryName.np : product.categoryName.en}
        </div>
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16.5, fontWeight: 700, color: 'var(--brown)', lineHeight: 1.3, marginBottom: 6 }}>
          {language === 'np' ? product.title.np : product.title.en}
        </h3>

        {/* Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <div className="stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                size={11}
                fill={n <= Math.round(product.rating) ? 'var(--gold)' : 'none'}
                color={n <= Math.round(product.rating) ? 'var(--gold)' : 'var(--cream)'}
              />
            ))}
          </div>
          <span style={{ fontSize: 11, color: 'var(--brown-light)' }}>({product.reviewCount})</span>
        </div>

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto', paddingTop: 4 }}>
          <span className="price-tag" style={{ fontWeight: 800, fontSize: 17, color: 'var(--burgundy)' }}>
            {formatPrice(product.price)}
          </span>
          {product.originalPrice && (
            <span style={{ fontSize: 12, color: 'var(--brown-light)', textDecoration: 'line-through' }}>
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .mobile-quick-add-bubble { display: none !important; }
          .product-card:hover .desktop-quick-add-banner { transform: translateY(0) !important; }
        }
        @media (max-width: 767px) {
          .desktop-quick-add-banner { display: none !important; }
        }
        .product-card:hover img { transform: scale(1.05); }
      `}</style>
    </div>
  );
};
