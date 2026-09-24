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

        {/* Actions */}
        <a
          href={`https://wa.me/${merchant.whatsappNumber}?text=${whatsappMsg}`}
          target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '13px 24px', background: '#25D366', color: 'white', borderRadius: 99, textDecoration: 'none', fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
          <MessageCircle size={18} /> Send Order via WhatsApp
        </a>

        <button onClick={() => setPageView('home')} className="btn btn-outline" style={{ width: '100%' }}>
          <ArrowLeft size={16} /> Continue Shopping
        </button>
      </div>
    </div>
  );
};
