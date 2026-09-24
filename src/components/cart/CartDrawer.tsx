import React from 'react';
import { X, ShoppingBag, Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';
import { useSettingsStore } from '../../stores/settingsStore';

export const CartDrawer: React.FC = () => {
  const { items, count, subtotal, isOpen, setIsOpen, removeItem, updateQty, clearCart } = useCartStore();
  const { language, formatPrice, merchant, setPageView } = useSettingsStore();

  if (!isOpen) return null;

  const deliveryFee = subtotal >= merchant.freeDeliveryThreshold ? 0 : merchant.deliveryFee;
  const total = subtotal + deliveryFee;

  const handleCheckout = () => {
    setIsOpen(false);
    setPageView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <div className="drawer-overlay animate-fadeIn" onClick={() => setIsOpen(false)} />
      <div
        className="drawer-panel animate-slideInRight"
        style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 420, zIndex: 50, background: 'white', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)' }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--ivory)' }}>
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: 'var(--brown)' }}>
              {language === 'np' ? 'मेरो कार्ट' : 'My Cart'}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--brown-light)' }}>{count} {count === 1 ? 'item' : 'items'}</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="btn btn-ghost btn-icon" aria-label="Close cart">
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--brown-light)' }}>
              <ShoppingBag size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
              <p style={{ fontSize: 16, fontWeight: 600 }}>{language === 'np' ? 'कार्ट खाली छ' : 'Your cart is empty'}</p>
              <p style={{ fontSize: 13, marginTop: 6 }}>{language === 'np' ? 'उत्पादन थप्नुहोस्' : 'Add some beautiful pieces'}</p>
              <button onClick={() => setIsOpen(false)} className="btn btn-primary" style={{ marginTop: 20 }}>Continue Shopping</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {items.map((item) => (
                <div key={`${item.product.id}_${item.selectedSize}`}
                  style={{ display: 'flex', gap: 14, padding: '14px', background: 'var(--ivory)', borderRadius: 16, border: '1px solid var(--cream)' }}>
                  <img src={item.product.images[0]} alt={item.product.title.en}
                    style={{ width: 72, height: 90, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <h4 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontWeight: 600, color: 'var(--brown)', lineHeight: 1.3 }}>
                      {language === 'np' ? item.product.title.np : item.product.title.en}
                    </h4>
                    <span className="badge badge-burgundy" style={{ alignSelf: 'flex-start' }}>Size: {item.selectedSize}</span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                      {/* Qty control */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--cream)', borderRadius: 8, background: 'white' }}>
                        <button onClick={() => updateQty(item.product.id, item.selectedSize, -1)} style={{ padding: '4px 10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brown)', fontWeight: 700 }}><Minus size={12} /></button>
                        <span style={{ fontSize: 14, fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                        <button onClick={() => updateQty(item.product.id, item.selectedSize, 1)} style={{ padding: '4px 10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brown)', fontWeight: 700 }}><Plus size={12} /></button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, color: 'var(--burgundy)', fontSize: 15 }}>{formatPrice(item.product.price * item.quantity)}</span>
                        <button onClick={() => removeItem(item.product.id, item.selectedSize)}
                          style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ borderTop: '1px solid var(--cream)', padding: '20px 24px', background: 'var(--ivory)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--brown-light)' }}>
                <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--brown-light)' }}>
                <span>Delivery</span>
                <span style={{ color: deliveryFee === 0 ? '#059669' : 'var(--brown-light)' }}>
                  {deliveryFee === 0 ? '🎉 FREE' : formatPrice(deliveryFee)}
                </span>
              </div>
              {deliveryFee > 0 && (
                <p style={{ fontSize: 11, color: 'var(--brown-light)', background: 'var(--ivory-dark)', padding: '6px 10px', borderRadius: 8 }}>
                  Add {formatPrice(merchant.freeDeliveryThreshold - subtotal)} more for free delivery!
                </p>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 18, color: 'var(--brown)', borderTop: '1px solid var(--cream)', paddingTop: 8, marginTop: 4 }}>
                <span>Total</span><span style={{ color: 'var(--burgundy)' }}>{formatPrice(total)}</span>
              </div>
            </div>

            <button onClick={handleCheckout} className="btn btn-primary" style={{ width: '100%', fontSize: 15 }}>
              Proceed to Checkout <ArrowRight size={16} />
            </button>
            <button onClick={clearCart} style={{ width: '100%', marginTop: 8, background: 'none', border: 'none', color: 'var(--brown-light)', fontSize: 13, cursor: 'pointer', padding: '8px' }}>
              Clear cart
            </button>
          </div>
        )}
      </div>
    </>
  );
};
