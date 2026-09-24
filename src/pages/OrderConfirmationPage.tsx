import React from 'react';
import { CheckCircle, MessageCircle, ArrowLeft, Package, Truck } from 'lucide-react';
import { Order } from '../types';
import { useSettingsStore } from '../stores/settingsStore';

interface Props { order: Order; }

export const OrderConfirmationPage: React.FC<Props> = ({ order }) => {
  const { language, formatPrice, merchant, setPageView } = useSettingsStore();

  const paymentLabels: Record<string, string> = {
    cod: 'Cash on Delivery', esewa: 'eSewa', khalti: 'Khalti', fonepay: 'Fonepay / QR'
  };

  const whatsappMsg = encodeURIComponent(
    `🛍️ *New Order Confirmed — DAWOSTI Boutique*\n\n` +
    `📋 Order No: *${order.orderNumber}*\n` +
    `👤 Customer: ${order.shippingAddress.fullName}\n` +
    `📞 Phone: ${order.shippingAddress.phone}\n` +
    `📍 Address: ${order.shippingAddress.addressLine}, ${order.shippingAddress.city}\n\n` +
    `📦 *Items:*\n` +
    order.items.map((i) => `• ${i.product.title.en} (${i.selectedSize}) × ${i.quantity} = NPR ${(i.product.price * i.quantity).toLocaleString()}`).join('\n') +
    `\n\n💰 Total: NPR ${order.totalAmount.toLocaleString()}\n` +
    `💳 Payment: ${paymentLabels[order.paymentMethod] || order.paymentMethod}\n` +
    `${order.paymentDetails ? `🧾 Ref: ${order.paymentDetails}\n` : ''}` +
    `\nKindly confirm this order. Thank you! 🙏`
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ivory)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div className="card animate-scaleUp" style={{ maxWidth: 540, width: '100%', padding: 40, textAlign: 'center' }}>
        {/* Success icon */}
        <div style={{ width: 80, height: 80, borderRadius: 99, background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle size={40} style={{ color: '#059669' }} />
        </div>

        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: 'var(--brown)', marginBottom: 8 }}>
          {language === 'np' ? 'धन्यवाद!' : 'Order Placed!'}
        </h1>
        <p style={{ fontSize: 15, color: 'var(--brown-light)', marginBottom: 4 }}>
          {language === 'np' ? 'तपाईंको अर्डर सफलतापूर्वक राखिएको छ।' : 'Your order has been successfully placed.'}
        </p>
        <p style={{ fontSize: 13, color: 'var(--brown-light)', marginBottom: 28 }}>
          Our team will contact you at <strong>{order.shippingAddress.phone}</strong> to confirm.
        </p>

        {/* Order card */}
        <div style={{ background: 'var(--ivory)', borderRadius: 16, padding: 20, marginBottom: 24, textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: 'var(--brown-light)' }}>Order Number</span>
            <span style={{ fontWeight: 800, color: 'var(--burgundy)', fontSize: 16 }}>{order.orderNumber}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {order.items.map((item) => (
              <div key={`${item.product.id}_${item.selectedSize}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--brown)' }}>{item.product.title.en} ({item.selectedSize}) × {item.quantity}</span>
                <span style={{ fontWeight: 600, color: 'var(--brown)' }}>{formatPrice(item.product.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--cream)', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16, color: 'var(--burgundy)' }}>
            <span>Total</span><span>{formatPrice(order.totalAmount)}</span>
          </div>
        </div>

        {/* Status steps */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 28 }}>
          {[{ icon: <CheckCircle size={18} />, label: 'Order Placed' }, { icon: <Package size={18} />, label: 'Packing' }, { icon: <Truck size={18} />, label: 'Delivery' }].map(({ icon, label }, i) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 40, height: 40, borderRadius: 99, background: i === 0 ? 'rgba(16,185,129,0.1)' : 'var(--ivory-dark)', border: `1.5px solid ${i === 0 ? 'rgba(16,185,129,0.4)' : 'var(--cream)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: i === 0 ? '#059669' : 'var(--brown-light)' }}>
                {icon}
              </div>
              <span style={{ fontSize: 11, color: i === 0 ? '#059669' : 'var(--brown-light)', fontWeight: 600 }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Genuine Verification Notice */}
        <div style={{ background: '#ECFDF5', border: '1.5px solid #A7F3D0', borderRadius: 14, padding: '14px 18px', marginBottom: 20, textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#065F46', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
            <span>⚡ {language === 'np' ? 'छिटो प्रमाणीकरण र डेलिभरी' : 'Fast Genuine Verification & Priority Dispatch'}</span>
          </div>
          <p style={{ fontSize: 12, color: '#047857', margin: 0, lineHeight: 1.5 }}>
            {language === 'np'
              ? 'तपाईंको अर्डर तुरुन्तै दर्ता र डेलिभरी गर्नका लागि तलको हरियो बटन थिचेर हाम्रो आधिकारिक ह्वाट्सएप (+९७७ ९७०८२५१४९४) मा अर्डर विवरण पठाउनुहोस्।'
              : 'To verify your order immediately and guarantee priority express dispatch, tap the button below to send your order details directly to our Kathmandu boutique.'}
          </p>
        </div>

        {/* Exclusive Patron Guild Invitation (Only for Real Customers) */}
        <div
          style={{
            background: 'linear-gradient(145deg, #2B1810 0%, #4A1A24 100%)',
            border: '2px solid #D4AF37',
            borderRadius: 16,
            padding: '20px 22px',
            marginBottom: 20,
            textAlign: 'left',
            color: '#FFF8F0',
            boxShadow: '0 8px 24px rgba(43, 24, 16, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src="/logo.png" alt="Dawosti" style={{ width: 36, height: 36, objectFit: 'contain' }} />
              <div>
                <div style={{ fontSize: 11, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800 }}>
                  VIP Patron Access
                </div>
                <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, fontWeight: 700, color: '#FFF8F0', lineHeight: 1.2 }}>
                  Autonomous Fashion Guild
                </div>
              </div>
            </div>
            <span style={{ fontSize: 10, background: 'rgba(212, 175, 55, 0.2)', border: '1px solid #D4AF37', color: '#D4AF37', padding: '3px 8px', borderRadius: 99, fontWeight: 700 }}>
              Customers Only
            </span>
          </div>

          <p style={{ fontSize: 12.5, color: 'rgba(255, 248, 240, 0.85)', lineHeight: 1.5, marginBottom: 12 }}>
            {language === 'np'
              ? 'दावोस्तीको वास्तविक ग्राहकको रूपमा तपाईंले हाम्रो निजी फेसन गिल्डमा पहुँच प्राप्त गर्नुभएको छ। सीमित एडिसन ड्रप्स, विशेष अफरहरू र काठमाडौँका फेसन डिजाइनरहरूसँग सिधा संवाद गर्नुहोस्।'
              : 'As a verified customer, you hold exclusive entry to our private Discord Guild. Access unreleased collections, private patron lounges, and direct bespoke tailoring concierge.'}
          </p>

          <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px dashed rgba(212, 175, 55, 0.5)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'rgba(255, 248, 240, 0.7)' }}>Your Patron Verification Code:</span>
            <code style={{ fontSize: 14, fontWeight: 800, color: '#D4AF37', letterSpacing: '0.05em' }}>{order.orderNumber}</code>
          </div>

          <a
            href="https://discord.gg/9Z7CzTraET"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              padding: '12px 18px',
              background: '#D4AF37',
              color: '#2B1810',
              borderRadius: 99,
              textDecoration: 'none',
              fontWeight: 800,
              fontSize: 13.5,
              transition: 'transform 0.15s ease',
              boxShadow: '0 4px 14px rgba(212, 175, 55, 0.3)',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <span>Claim Patron Access (Discord)</span>
          </a>
          <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255, 248, 240, 0.6)', marginTop: 8 }}>
            Type <code style={{ color: '#D4AF37' }}>/verify {order.orderNumber}</code> inside Discord to authenticate
          </div>
        </div>

        {/* Actions */}
        <a
          href={`https://wa.me/${merchant.whatsappNumber}?text=${whatsappMsg}`}
          target="_blank" rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            width: '100%',
            padding: '15px 24px',
            background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
            color: 'white',
            borderRadius: 99,
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: 15,
            marginBottom: 12,
            boxShadow: '0 4px 15px rgba(37,211,102,0.35)',
            transition: 'transform 0.15s ease',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <MessageCircle size={20} />
          <span>{language === 'np' ? 'ह्वाट्सएपमा अर्डर पठाउनुहोस् (+९७७ ९७०८२५१४९४)' : 'Confirm & Send to WhatsApp (+977 9708251494)'}</span>
        </a>

        <button onClick={() => setPageView('home')} className="btn btn-outline" style={{ width: '100%' }}>
          <ArrowLeft size={16} /> Continue Shopping
        </button>
      </div>
    </div>
  );
};
