import React from 'react';
import { X, ShoppingBag, Minus, Plus, Trash2, ArrowRight, Truck, ShieldCheck, MessageCircle } from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';
import { useSettingsStore } from '../../stores/settingsStore';

export const CartDrawer: React.FC = () => {
  const { items, count, subtotal, isOpen, setIsOpen, removeItem, updateQty, clearCart } = useCartStore();
  const { language, formatPrice, merchant, setPageView } = useSettingsStore();

  if (!isOpen) return null;

  const deliveryFee = subtotal >= merchant.freeDeliveryThreshold ? 0 : merchant.deliveryFee;
  const total = subtotal + deliveryFee;
  const progress = Math.min(100, Math.round((subtotal / merchant.freeDeliveryThreshold) * 100));

  const handleCheckout = () => {
    setIsOpen(false);
    setPageView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const waCartMsg = encodeURIComponent(
    `🛍️ *Boutique Order Inquiry via Cart — DAWOSTI*\n\n` +
    items.map((it) => `• ${it.product.title.en} (${it.selectedSize}) × ${it.quantity} = NPR ${(it.product.price * it.quantity).toLocaleString()}`).join('\n') +
    `\n\n💰 Total: NPR ${total.toLocaleString()}\n📍 Please confirm delivery options to my address!`
  );

  return (
    <>
      <div className="drawer-overlay animate-fadeIn" onClick={() => setIsOpen(false)} style={{ zIndex: 70 }} />
      <div
        className="drawer-panel animate-slideInRight"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: 440,
          zIndex: 75,
          background: 'white',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--ivory)' }}>
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: 'var(--brown)', margin: 0 }}>
              {language === 'np' ? 'मेरो सपिङ झोला' : 'My Shopping Bag'}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--brown-light)', margin: '2px 0 0' }}>
              {count} {count === 1 ? 'item' : 'items'}
            </p>
          </div>
          <button onClick={() => setIsOpen(false)} className="btn btn-ghost btn-icon" aria-label="Close cart">
            <X size={20} />
          </button>
        </div>

        {/* Free Delivery Gamified Progress Bar */}
        {items.length > 0 && (
          <div style={{ padding: '12px 20px', background: '#FAF2E9', borderBottom: '1px solid #EADCCE' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: '#2B1810', marginBottom: 6 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Truck size={14} color="#8B3A3A" />
                {progress >= 100
                  ? (language === 'np' ? '🎉 निःशुल्क डेलिभरी अनलक भयो!' : '🎉 You unlocked FREE Delivery across Nepal!')
                  : (language === 'np'
                      ? `निःशुल्क डेलिभरीको लागि थप ${formatPrice(merchant.freeDeliveryThreshold - subtotal)} थप्नुहोस्`
                      : `Add ${formatPrice(merchant.freeDeliveryThreshold - subtotal)} more for FREE delivery`)}
              </span>
              <span>{progress}%</span>
            </div>
            <div style={{ width: '100%', height: 6, background: '#E5D6C7', borderRadius: 99, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: progress >= 100 ? '#10B981' : 'linear-gradient(90deg, #D4AF37, #8B3A3A)',
                  borderRadius: 99,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        )}

        {/* Items List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--brown-light)' }}>
              <ShoppingBag size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
              <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--brown)' }}>
                {language === 'np' ? 'तपाईंको कार्ट खाली छ' : 'Your cart is empty'}
              </p>
              <p style={{ fontSize: 13, marginTop: 6 }}>
                {language === 'np' ? 'हाम्रा मौलिक नेपाली वस्त्रहरू हेर्नुहोस्' : 'Discover authentic Kathmandu handlooms'}
              </p>
              <button onClick={() => setIsOpen(false)} className="btn btn-primary" style={{ marginTop: 20 }}>
                Explore Collection
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {items.map((item) => (
                <div
                  key={`${item.product.id}_${item.selectedSize}`}
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: '12px',
                    background: 'var(--ivory)',
                    borderRadius: 14,
                    border: '1px solid var(--cream)',
                  }}
                >
                  <img
                    src={item.product.images[0]}
                    alt={item.product.title.en}
                    style={{ width: 68, height: 86, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <h4 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontWeight: 700, color: 'var(--brown)', lineHeight: 1.25, margin: 0 }}>
                      {language === 'np' ? item.product.title.np : item.product.title.en}
                    </h4>
                    <span className="badge badge-burgundy" style={{ alignSelf: 'flex-start', fontSize: 11, padding: '2px 8px' }}>
                      Size: {item.selectedSize}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 6 }}>
                      {/* Qty control */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, border: '1px solid var(--cream)', borderRadius: 8, background: 'white' }}>
                        <button
                          onClick={() => updateQty(item.product.id, item.selectedSize, -1)}
                          style={{ padding: '3px 8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brown)', fontWeight: 700 }}
                        >
                          <Minus size={11} />
                        </button>
                        <span style={{ fontSize: 13, fontWeight: 700, minWidth: 18, textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.product.id, item.selectedSize, 1)}
                          style={{ padding: '3px 8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brown)', fontWeight: 700 }}
                        >
                          <Plus size={11} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 800, color: 'var(--burgundy)', fontSize: 15 }}>
                          {formatPrice(item.product.price * item.quantity)}
                        </span>
                        <button
                          onClick={() => removeItem(item.product.id, item.selectedSize)}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            background: 'rgba(239,68,68,0.08)',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#DC2626',
                          }}
                          aria-label="Remove item"
                        >
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

        {/* Footer Checkout Summary */}
        {items.length > 0 && (
          <div style={{ borderTop: '1px solid var(--cream)', padding: '16px 20px', background: 'var(--ivory)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: 'var(--brown-light)' }}>
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, color: 'var(--brown-light)' }}>
                <span>Delivery Charge</span>
                <span style={{ color: deliveryFee === 0 ? '#059669' : 'inherit', fontWeight: deliveryFee === 0 ? 700 : 500 }}>
                  {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 18, color: 'var(--brown)', borderTop: '1px solid var(--cream)', paddingTop: 8, marginTop: 2 }}>
                <span>Total Amount</span>
                <span style={{ color: 'var(--burgundy)' }}>{formatPrice(total)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Primary Checkout Button */}
              <button
                onClick={handleCheckout}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  fontSize: 15,
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <span>{language === 'np' ? 'अर्डर अगाडि बढाउनुहोस्' : 'Proceed to Checkout'}</span>
                <ArrowRight size={16} />
              </button>

              {/* WhatsApp Fast Order */}
              <a
                href={`https://wa.me/${merchant.whatsappNumber}?text=${waCartMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '10px 16px',
                  borderRadius: 10,
                  background: '#25D366',
                  color: 'white',
                  textDecoration: 'none',
                  fontSize: 12.5,
                  fontWeight: 700,
                }}
              >
                <MessageCircle size={15} />
                <span>{language === 'np' ? 'ह्वाट्सएप मार्फत सिधै अर्डर' : 'Quick Order via WhatsApp'}</span>
              </a>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 10, fontSize: 11, color: '#059669', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <ShieldCheck size={13} /> Cash on Delivery (COD) Available
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
