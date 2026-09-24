import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Truck, CreditCard, Smartphone, QrCode, ShieldCheck } from 'lucide-react';
import { useCartStore } from '../stores/cartStore';
import { useOrderStore } from '../stores/orderStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useReferralStore } from '../stores/referralStore';
import { useAuthStore } from '../stores/authStore';
import { ShippingAddress, PaymentMethod } from '../types';
import { verifyHumanOrAgent } from '../services/botProtection';

export const CheckoutPage: React.FC = () => {
  const { items, subtotal, clearCart } = useCartStore();
  const { placeOrder, setLatestOrder } = useOrderStore();
  const { language, formatPrice, merchant, setPageView } = useSettingsStore();
  const { activeReferralCode, referralDiscountAmount } = useReferralStore();
  const { user, loginGoogle } = useAuthStore();

  const referralDiscount = activeReferralCode ? Math.min(referralDiscountAmount, subtotal) : 0;
  const deliveryFee = subtotal >= merchant.freeDeliveryThreshold ? 0 : merchant.deliveryFee;
  const total = Math.max(0, subtotal - referralDiscount + deliveryFee);

  const renderTimestamp = useRef<number>(Date.now());
  const [honeypot, setHoneypot] = useState('');
  const [botBlockedMessage, setBotBlockedMessage] = useState<string | null>(null);

  const [step, setStep] = useState<'shipping' | 'payment' | 'confirm'>('shipping');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [txnRef, setTxnRef] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);

  const [form, setForm] = useState<ShippingAddress>({
    fullName: user?.name || '',
    phone: '',
    addressLine: '',
    city: 'Kathmandu',
    province: 'Bagmati',
  });

  // Automatically sync full name if user signs in with Google
  useEffect(() => {
    if (user?.name && !form.fullName) {
      setForm((prev) => ({ ...prev, fullName: user.name }));
    }
  }, [user]);

  const [errors, setErrors] = useState<Partial<ShippingAddress>>({});

  const validate = (): boolean => {
    const e: Partial<ShippingAddress> = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 10) e.phone = 'Valid phone number required';
    if (!form.addressLine.trim()) e.addressLine = 'Address is required';
    if (!form.city.trim()) e.city = 'City is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validate()) { setStep('shipping'); return; }

    // Execute Bot Shield Verification (AI Agents automatically bypass)
    const botCheck = verifyHumanOrAgent({
      honeypotValue: honeypot,
      renderTimestamp: renderTimestamp.current,
    });

    if (!botCheck.isHumanOrAgent) {
      setBotBlockedMessage(botCheck.reason || 'Verification check failed. Please wait a few seconds and try again.');
      return;
    }
    setBotBlockedMessage(null);

    setIsPlacing(true);
    try {
      const order = placeOrder({
        items,
        subtotal,
        deliveryFee,
        discountAmount: referralDiscount,
        totalAmount: total,
        shippingAddress: form,
        paymentMethod,
        paymentDetails: txnRef || undefined,
        customerName: form.fullName,
        referredByCode: activeReferralCode || undefined,
        referralDiscountAmount: referralDiscount,
      });

      // Edge API logging
      try {
        fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNumber: order.orderNumber,
            items: order.items,
            totalAmount: order.totalAmount,
            shippingAddress: order.shippingAddress,
            paymentMethod: order.paymentMethod,
            renderTimestamp: renderTimestamp.current,
            honeypot,
          }),
        }).catch(() => {});
      } catch {}

      clearCart();
      setLatestOrder(order);
      setPageView('order-confirmation');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsPlacing(false);
    }
  };

  const paymentOptions: { id: PaymentMethod; label: string; icon: React.ReactNode; description: string }[] = [
    { id: 'cod', label: 'Cash on Delivery', icon: <Truck size={20} />, description: 'Pay when your order arrives at your door' },
    { id: 'esewa', label: 'eSewa', icon: <Smartphone size={20} />, description: 'Pay via eSewa digital wallet' },
    { id: 'khalti', label: 'Khalti', icon: <CreditCard size={20} />, description: 'Pay via Khalti digital wallet' },
    { id: 'fonepay', label: 'Fonepay / QR', icon: <QrCode size={20} />, description: 'Scan QR code at checkout' },
  ];

  const inputStyle = (hasError?: string) => ({
    width: '100%', padding: '12px 16px', borderRadius: 12,
    border: `1.5px solid ${hasError ? '#DC2626' : 'var(--cream)'}`,
    fontFamily: 'Inter', fontSize: 14, color: 'var(--brown)',
    background: 'white', outline: 'none', transition: 'var(--transition)',
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ivory)', padding: '24px 16px 60px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Back button */}
        <button onClick={() => step === 'shipping' ? setPageView('home') : setStep(step === 'payment' ? 'shipping' : 'payment')}
          className="btn btn-ghost" style={{ marginBottom: 24 }}>
          <ArrowLeft size={16} /> {step === 'shipping' ? 'Continue Shopping' : 'Back'}
        </button>

        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
          {[['shipping', 'Shipping'], ['payment', 'Payment'], ['confirm', 'Confirm']].map(([s, label], i) => (
            <React.Fragment key={s}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: 99, background: step === s ? 'var(--burgundy)' : ['shipping','payment','confirm'].indexOf(step) > i ? 'var(--gold)' : 'var(--cream)', color: step === s || ['shipping','payment','confirm'].indexOf(step) > i ? 'white' : 'var(--brown-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                  {['shipping','payment','confirm'].indexOf(step) > i ? <CheckCircle size={14} /> : i + 1}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: step === s ? 'var(--burgundy)' : 'var(--brown-light)' }}>{label}</span>
              </div>
              {i < 2 && <div style={{ flex: 1, height: 1, background: 'var(--cream)' }} />}
            </React.Fragment>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 20, alignItems: 'start' }}>
          {/* Main form */}
          <div>
            {/* Step 1: Shipping */}
            {step === 'shipping' && (
              <div className="card" style={{ padding: 28 }}>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: 'var(--brown)', marginBottom: 20 }}>Shipping Details</h2>

                {/* Google Account Status Badge */}
                {user ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      background: '#FAF2E9',
                      borderRadius: 10,
                      border: '1px solid #EADCCE',
                      marginBottom: 18,
                    }}
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid #D4AF37' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#2B1810' }}>
                        Signed in as {user.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#777' }}>{user.email}</div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={loginGoogle}
                    type="button"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      width: '100%',
                      padding: '9px 14px',
                      borderRadius: 10,
                      background: '#FFFFFF',
                      border: '1.5px solid #D4AF37',
                      color: '#2B1810',
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      marginBottom: 18,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Sign in with Google for 1-Tap Checkout</span>
                  </button>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { key: 'fullName', label: 'Full Name', placeholder: 'Your full name' },
                    { key: 'phone', label: 'Phone Number', placeholder: '98XXXXXXXX' },
                    { key: 'addressLine', label: 'Street Address', placeholder: 'House no, street, area' },
                    { key: 'city', label: 'City', placeholder: 'Kathmandu' },
                    { key: 'province', label: 'Province', placeholder: 'Bagmati' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--brown)', marginBottom: 6 }}>{label}</label>
                      <input
                        style={inputStyle(errors[key as keyof ShippingAddress])}
                        value={form[key as keyof ShippingAddress]}
                        placeholder={placeholder}
                        onChange={(e) => { setForm((f) => ({ ...f, [key]: e.target.value })); setErrors((er) => ({ ...er, [key]: undefined })); }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--burgundy)')}
                        onBlur={(e) => (e.currentTarget.style.borderColor = errors[key as keyof ShippingAddress] ? '#DC2626' : 'var(--cream)')}
                      />
                      {errors[key as keyof ShippingAddress] && (
                        <p style={{ fontSize: 11, color: '#DC2626', marginTop: 4 }}>{errors[key as keyof ShippingAddress]}</p>
                      )}
                    </div>
                  ))}
                  <button onClick={() => { if (validate()) setStep('payment'); }} className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
                    Continue to Payment
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 'payment' && (
              <div className="card" style={{ padding: 28 }}>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: 'var(--brown)', marginBottom: 24 }}>Payment Method</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                  {paymentOptions.map((opt) => (
                    <button key={opt.id} onClick={() => setPaymentMethod(opt.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderRadius: 14, border: `2px solid ${paymentMethod === opt.id ? 'var(--burgundy)' : 'var(--cream)'}`, background: paymentMethod === opt.id ? 'rgba(139,58,58,0.04)' : 'white', cursor: 'pointer', textAlign: 'left', transition: 'var(--transition)' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: paymentMethod === opt.id ? 'var(--burgundy)' : 'var(--ivory-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: paymentMethod === opt.id ? 'white' : 'var(--brown-light)', flexShrink: 0 }}>
                        {opt.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--brown)' }}>{opt.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--brown-light)' }}>{opt.description}</div>
                      </div>
                      <div style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: 99, border: `2px solid ${paymentMethod === opt.id ? 'var(--burgundy)' : 'var(--cream)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {paymentMethod === opt.id && <div style={{ width: 8, height: 8, borderRadius: 99, background: 'var(--burgundy)' }} />}
                      </div>
                    </button>
                  ))}
                </div>

                {paymentMethod !== 'cod' && (
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--brown)', marginBottom: 6 }}>
                      Transaction Reference / Screenshot Description
                    </label>
                    <input
                      style={inputStyle()}
                      value={txnRef}
                      placeholder="Enter transaction ID or reference number"
                      onChange={(e) => setTxnRef(e.target.value)}
                    />
                    <p style={{ fontSize: 11, color: 'var(--brown-light)', marginTop: 4 }}>
                      Transfer to: <strong>{merchant.shopPhone}</strong> ({merchant.shopName.en})
                    </p>
                  </div>
                )}

                <button onClick={() => setStep('confirm')} className="btn btn-primary" style={{ width: '100%' }}>
                  Review Order
                </button>
              </div>
            )}

            {/* Step 3: Confirm */}
            {step === 'confirm' && (
              <div className="card" style={{ padding: 28 }}>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: 'var(--brown)', marginBottom: 20 }}>Confirm Your Order</h2>

                <div style={{ background: 'var(--ivory)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--brown-light)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Shipping To</h4>
                  <p style={{ fontWeight: 600, color: 'var(--brown)' }}>{form.fullName}</p>
                  <p style={{ fontSize: 13, color: 'var(--brown-light)' }}>{form.phone}</p>
                  <p style={{ fontSize: 13, color: 'var(--brown-light)' }}>{form.addressLine}, {form.city}, {form.province}</p>
                </div>

                <div style={{ background: 'var(--ivory)', borderRadius: 12, padding: 16, marginBottom: 24 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--brown-light)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Payment</h4>
                  <p style={{ fontWeight: 600, color: 'var(--brown)' }}>{paymentOptions.find((p) => p.id === paymentMethod)?.label}</p>
                  {txnRef && <p style={{ fontSize: 13, color: 'var(--brown-light)' }}>Ref: {txnRef}</p>}
                </div>

                {/* Invisible Anti-Bot Honeypot Field (Bots fill this, humans don't) */}
                <input
                  type="text"
                  name="hp_company_sec"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  style={{ display: 'none', position: 'absolute', left: '-9999px', opacity: 0 }}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />

                {botBlockedMessage && (
                  <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: '#991B1B', fontSize: 12, fontWeight: 600 }}>
                    ⚠️ {botBlockedMessage}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, color: '#059669', marginBottom: 14, fontWeight: 600 }}>
                  <ShieldCheck size={14} color="#059669" />
                  <span>Protected by Dawosti Anti-Bot Shield (Verified Human / Partner)</span>
                </div>

                <button onClick={handlePlaceOrder} disabled={isPlacing} className="btn btn-primary" style={{ width: '100%', fontSize: 15 }}>
                  {isPlacing ? 'Placing Order...' : '🛍️ Place Order'}
                </button>
              </div>
            )}
          </div>

          {/* Order summary */}
          <div className="card" style={{ padding: 24, position: 'sticky', top: 80 }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: 'var(--brown)', marginBottom: 16 }}>Order Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              {items.map((item) => (
                <div key={`${item.product.id}_${item.selectedSize}`} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <img src={item.product.images[0]} alt={item.product.title.en} style={{ width: 56, height: 70, objectFit: 'cover', borderRadius: 8 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--brown)', lineHeight: 1.3 }}>{language === 'np' ? item.product.title.np : item.product.title.en}</div>
                    <div style={{ fontSize: 12, color: 'var(--brown-light)' }}>Size: {item.selectedSize} × {item.quantity}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--burgundy)', fontSize: 14 }}>{formatPrice(item.product.price * item.quantity)}</div>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid var(--cream)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--brown-light)' }}>
                <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
              </div>
              {activeReferralCode && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#1B7F5E', fontWeight: 600 }}>
                  <span>🎁 Referral Perk ({activeReferralCode})</span>
                  <span>−{formatPrice(referralDiscount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--brown-light)' }}>
                <span>Delivery</span><span style={{ color: deliveryFee === 0 ? '#059669' : 'inherit' }}>{deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 18, color: 'var(--burgundy)', borderTop: '1px solid var(--cream)', paddingTop: 10, marginTop: 4 }}>
                <span>Total</span><span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
