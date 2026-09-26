import React, { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Star,
  Truck,
  Shield,
  MessageCircle,
  Zap,
  Ruler,
  RotateCcw,
  Check,
  Flame,
} from 'lucide-react';
import { Product, ProductSize } from '../../types';
import { useCartStore } from '../../stores/cartStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { toast } from '../common/Toast';

interface Props {
  product: Product;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<Props> = ({ product, onClose }) => {
  const { language, formatPrice, merchant, setPageView } = useSettingsStore();
  const { addItem, setIsOpen: setCartOpen } = useCartStore();
  const [selectedSize, setSelectedSize] = useState<ProductSize>(product.availableSizes[0] || 'Free Size');
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  const title = language === 'np' ? product.title.np : product.title.en;
  const desc = language === 'np' ? product.description.np : product.description.en;
  const discountPct = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    addItem(product, selectedSize, qty);
    toast(`Added "${title}" (${selectedSize}) to cart!`);
    onClose();
    setCartOpen(true);
  };

  const handleBuyNow = () => {
    addItem(product, selectedSize, qty);
    onClose();
    setPageView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const waUrl = `https://wa.me/${merchant.whatsappNumber}?text=${encodeURIComponent(
    `🛍️ *Boutique Order Inquiry — DAWOSTI Kathmandu*\n\n📦 *${product.title.en}*\n💰 Price: NPR ${product.price.toLocaleString()}\n📏 Size: ${selectedSize}\n🔢 Qty: ${qty}\n\nI want to confirm order details and delivery to my address. Please guide me!`
  )}`;

  return (
    <div className="modal-overlay animate-fadeIn" onClick={onClose} style={{ zIndex: 60 }}>
      <div
        className="card animate-scaleUp"
        style={{
          width: '100%',
          maxWidth: 920,
          maxHeight: '92vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            zIndex: 20,
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'white',
            border: '1px solid var(--cream)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)',
          }}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 0 }}>
          {/* Images Gallery */}
          <div style={{ background: 'var(--ivory-dark)', position: 'relative', minHeight: 'clamp(280px, 45vw, 440px)' }}>
            <img
              src={product.images[imgIdx]}
              alt={title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                minHeight: 'clamp(280px, 45vw, 440px)',
                maxHeight: 500,
              }}
            />

            {product.images.length > 1 && (
              <>
                <button
                  onClick={() => setImgIdx((v) => (v - 1 + product.images.length) % product.images.length)}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setImgIdx((v) => (v + 1) % product.images.length)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <ChevronRight size={18} />
                </button>

                {/* Thumbnails */}
                <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIdx(i)}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 8,
                        overflow: 'hidden',
                        border: `2px solid ${i === imgIdx ? 'var(--burgundy)' : 'transparent'}`,
                        cursor: 'pointer',
                        padding: 0,
                        background: 'none',
                      }}
                    >
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              </>
            )}

            <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {discountPct > 0 && (
                <span className="badge badge-burgundy" style={{ fontWeight: 800, padding: '4px 10px' }}>
                  -{discountPct}% OFF
                </span>
              )}
              {product.isFeatured && (
                <span
                  style={{
                    background: 'rgba(27, 127, 94, 0.95)',
                    color: 'white',
                    padding: '3px 8px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Flame size={12} color="#D4AF37" /> Hot Festive Item
                </span>
              )}
            </div>
          </div>

          {/* Details & Actions */}
          <div style={{ padding: 'clamp(20px, 4vw, 32px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--burgundy)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
                {language === 'np' ? product.categoryName.np : product.categoryName.en}
              </div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: 'var(--brown)', lineHeight: 1.2, marginBottom: 8 }}>
                {title}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="stars">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={14}
                      fill={n <= Math.round(product.rating) ? 'var(--gold)' : 'none'}
                      color={n <= Math.round(product.rating) ? 'var(--gold)' : 'var(--cream)'}
                    />
                  ))}
                </div>
                <span style={{ fontSize: 13, color: 'var(--brown-light)' }}>
                  {product.rating} ({product.reviewCount} verified reviews)
                </span>
              </div>
            </div>

            {/* Price & Scarcity */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 34, fontWeight: 700, color: 'var(--burgundy)' }}>
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span style={{ fontSize: 16, color: 'var(--brown-light)', textDecoration: 'line-through' }}>
                  {formatPrice(product.originalPrice)}
                </span>
              )}
              {discountPct > 0 && (
                <span style={{ color: '#059669', fontSize: 13, fontWeight: 700 }}>
                  Save {formatPrice(product.originalPrice! - product.price)}
                </span>
              )}
            </div>

            <p style={{ fontSize: 14, color: 'var(--brown-light)', lineHeight: 1.65, margin: 0 }}>
              {desc}
            </p>

            {product.fabric && (
              <div style={{ fontSize: 13, color: 'var(--brown-light)', background: '#FAF2E9', padding: '8px 12px', borderRadius: 8 }}>
                <strong style={{ color: 'var(--brown)' }}>Fabric & Craft:</strong> {language === 'np' ? product.fabric.np : product.fabric.en} ({product.origin ? (language === 'np' ? product.origin.np : product.origin.en) : 'Kathmandu Atelier'})
              </div>
            )}

            {/* Size Picker with Size Guide Link */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brown)' }}>
                  {language === 'np' ? 'साइज छान्नुहोस्' : 'Select Size'}:{' '}
                  <span style={{ color: 'var(--burgundy)' }}>{selectedSize}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSizeGuide(!showSizeGuide)}
                  style={{
                    background: 'none',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--burgundy)',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  <Ruler size={14} />
                  <span>{language === 'np' ? 'साइज गाइड' : 'Size Guide'}</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {product.availableSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: 10,
                      border: `1.5px solid ${selectedSize === size ? 'var(--burgundy)' : 'var(--cream)'}`,
                      background: selectedSize === size ? 'var(--burgundy)' : 'white',
                      color: selectedSize === size ? 'white' : 'var(--brown)',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                      transition: 'var(--transition)',
                      boxShadow: selectedSize === size ? '0 2px 6px rgba(139,58,58,0.2)' : 'none',
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>

              {/* Sizing popup chart */}
              {showSizeGuide && (
                <div
                  style={{
                    marginTop: 12,
                    background: '#FFFFFF',
                    border: '1.5px solid #EADCCE',
                    borderRadius: 12,
                    padding: 14,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#2B1810', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Standard Size Chart (Inches)
                    </span>
                    <button onClick={() => setShowSizeGuide(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                      <X size={14} />
                    </button>
                  </div>
                  <table style={{ width: '100%', fontSize: 11.5, borderCollapse: 'collapse', textAlign: 'center' }}>
                    <thead>
                      <tr style={{ background: '#FAF2E9', color: '#2B1810' }}>
                        <th style={{ padding: '6px 8px', border: '1px solid #EADCCE' }}>Size</th>
                        <th style={{ padding: '6px 8px', border: '1px solid #EADCCE' }}>Bust</th>
                        <th style={{ padding: '6px 8px', border: '1px solid #EADCCE' }}>Waist</th>
                        <th style={{ padding: '6px 8px', border: '1px solid #EADCCE' }}>Hip</th>
                        <th style={{ padding: '6px 8px', border: '1px solid #EADCCE' }}>Length</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '5px', border: '1px solid #EADCCE', fontWeight: 700 }}>S</td>
                        <td style={{ padding: '5px', border: '1px solid #EADCCE' }}>34" - 36"</td>
                        <td style={{ padding: '5px', border: '1px solid #EADCCE' }}>28" - 30"</td>
                        <td style={{ padding: '5px', border: '1px solid #EADCCE' }}>38"</td>
                        <td style={{ padding: '5px', border: '1px solid #EADCCE' }}>42"</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '5px', border: '1px solid #EADCCE', fontWeight: 700 }}>M</td>
                        <td style={{ padding: '5px', border: '1px solid #EADCCE' }}>38"</td>
                        <td style={{ padding: '5px', border: '1px solid #EADCCE' }}>32"</td>
                        <td style={{ padding: '5px', border: '1px solid #EADCCE' }}>40"</td>
                        <td style={{ padding: '5px', border: '1px solid #EADCCE' }}>43"</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '5px', border: '1px solid #EADCCE', fontWeight: 700 }}>L</td>
                        <td style={{ padding: '5px', border: '1px solid #EADCCE' }}>40"</td>
                        <td style={{ padding: '5px', border: '1px solid #EADCCE' }}>34"</td>
                        <td style={{ padding: '5px', border: '1px solid #EADCCE' }}>42"</td>
                        <td style={{ padding: '5px', border: '1px solid #EADCCE' }}>44"</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '5px', border: '1px solid #EADCCE', fontWeight: 700 }}>XL</td>
                        <td style={{ padding: '5px', border: '1px solid #EADCCE' }}>42"</td>
                        <td style={{ padding: '5px', border: '1px solid #EADCCE' }}>36"</td>
                        <td style={{ padding: '5px', border: '1px solid #EADCCE' }}>44"</td>
                        <td style={{ padding: '5px', border: '1px solid #EADCCE' }}>45"</td>
                      </tr>
                    </tbody>
                  </table>
                  <p style={{ margin: '8px 0 0', fontSize: 11, color: '#6B564C', textAlign: 'left' }}>
                    💡 <em>Free size adjustment and custom tailoring advice available via WhatsApp concierge!</em>
                  </p>
                </div>
              )}
            </div>

            {/* Quantity Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brown)' }}>
                {language === 'np' ? 'संख्या' : 'Quantity'}:
              </span>
              <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--cream)', borderRadius: 10, overflow: 'hidden', background: 'white' }}>
                <button
                  onClick={() => setQty((v) => Math.max(1, v - 1))}
                  style={{ padding: '6px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, fontWeight: 700, color: 'var(--brown)' }}
                >
                  −
                </button>
                <span style={{ padding: '6px 14px', fontWeight: 700, minWidth: 36, textAlign: 'center', fontSize: 15 }}>
                  {qty}
                </span>
                <button
                  onClick={() => setQty((v) => v + 1)}
                  style={{ padding: '6px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, fontWeight: 700, color: 'var(--brown)' }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Dual CTA: Buy Now (Instant Checkout) + Add to Cart */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                {/* ⚡ High-Conversion Buy Now Button */}
                <button
                  onClick={handleBuyNow}
                  disabled={!product.inStock}
                  style={{
                    flex: 1.2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '13px 20px',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #D4AF37 0%, #B89628 100%)',
                    color: '#2B1810',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: 15,
                    cursor: product.inStock ? 'pointer' : 'not-allowed',
                    boxShadow: '0 4px 14px rgba(212,175,55,0.4)',
                    transition: 'var(--transition)',
                  }}
                >
                  <Zap size={18} fill="#2B1810" />
                  <span>{language === 'np' ? '⚡ सिधै किन्नुहोस् (Buy Now)' : '⚡ Buy Now (Instant Checkout)'}</span>
                </button>

                {/* Add to Cart */}
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '13px 18px',
                    borderRadius: 12,
                    background: 'var(--burgundy)',
                    color: 'white',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: product.inStock ? 'pointer' : 'not-allowed',
                    transition: 'var(--transition)',
                  }}
                >
                  <ShoppingBag size={16} />
                  <span>{product.inStock ? (language === 'np' ? 'कार्टमा थप्नुहोस्' : 'Add to Cart') : 'Out of Stock'}</span>
                </button>
              </div>

              {/* Direct WhatsApp Concierge Order Button */}
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '11px 18px',
                  borderRadius: 12,
                  background: '#25D366',
                  color: 'white',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: 13.5,
                  boxShadow: '0 2px 8px rgba(37,211,102,0.3)',
                }}
              >
                <MessageCircle size={18} />
                <span>{language === 'np' ? 'ह्वाट्सएपमा अर्डर गर्नुहोस् (WhatsApp Order)' : 'Order via WhatsApp Concierge'}</span>
              </a>
            </div>

            {/* Trust & Guarantee Badges */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 10,
                paddingTop: 14,
                borderTop: '1px solid var(--cream)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--brown-light)' }}>
                <Truck size={16} color="var(--burgundy)" />
                <span>
                  <strong>Kathmandu:</strong> 24–48h Delivery
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--brown-light)' }}>
                <Shield size={16} color="#059669" />
                <span>
                  <strong>Cash on Delivery (COD)</strong> Available
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--brown-light)' }}>
                <RotateCcw size={16} color="var(--gold)" />
                <span>
                  <strong>7-Day</strong> Easy Size Exchange
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
