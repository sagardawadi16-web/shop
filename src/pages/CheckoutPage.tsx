import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle,
  Truck,
  CreditCard,
  Smartphone,
  QrCode,
  ShieldCheck,
  Building,
  RotateCcw,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
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
    if (!form.fullName.trim()) e.fullName = language === 'np' ? 'कृपया पूरा नाम लेख्नुहोस्' : 'Full name is required';
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 10) {
      e.phone = language === 'np' ? '१० अंकको वैध फोन नम्बर आवश्यक छ (उदा: 98XXXXXXXX)' : '10-digit valid phone required (e.g. 98XXXXXXXX)';
    }
    if (!form.addressLine.trim()) e.addressLine = language === 'np' ? 'डेलिभरी ठेगाना लेख्नुहोस्' : 'Street address / area required';
    if (!form.city.trim()) e.city = language === 'np' ? 'सहर आवश्यक छ' : 'City is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validate()) {
      window.scrollTo({ top: 180, behavior: 'smooth' });
      return;
    }

    // Execute Bot Shield Verification
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

  const paymentOptions: { id: PaymentMethod; label: string; badge?: string; icon: React.ReactNode; description: string }[] = [
    {
      id: 'cod',
      label: language === 'np' ? 'कैश अन डेलिभरी (Cash on Delivery)' : 'Cash on Delivery (COD)',
      badge: language === 'np' ? 'सबैभन्दा लोकप्रिय' : 'Most Popular',
      icon: <Truck size={20} />,
      description: language === 'np' ? 'सामान हातमा परेर जाँच गरेपछि मात्र पैसा तिर्नुहोस्' : 'Pay in cash after receiving and inspecting your package',
    },
    {
      id: 'fonepay',
      label: 'Fonepay / Mobile Banking QR',
      badge: 'Instant QR',
      icon: <QrCode size={20} />,
      description: language === 'np' ? 'कुनै पनि नेपाली बैंक वा वालेट एपबाट QR स्क्यान गर्नुहोस्' : 'Scan & pay with any Nepal banking or wallet app',
    },
    {
      id: 'esewa',
      label: 'eSewa Digital Wallet',
      icon: <Smartphone size={20} />,
      description: language === 'np' ? 'eSewa वालेट मार्फत भुक्तानी' : 'Pay via official eSewa wallet',
    },
    {
      id: 'khalti',
      label: 'Khalti Digital Wallet',
      icon: <CreditCard size={20} />,
      description: language === 'np' ? 'Khalti वालेट मार्फत भुक्तानी' : 'Pay via Khalti digital wallet',
    },
  ];

  const popularCities = ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Butwal', 'Chitwan', 'Dharan', 'Biratnagar', 'Hetauda', 'Nepalgunj'];

  const inputStyle = (hasError?: string) => ({
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: `1.5px solid ${hasError ? '#DC2626' : '#EADCCE'}`,
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#2B1810',
    background: 'white',
    outline: 'none',
    boxSizing: 'border-box' as const,
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ivory)', padding: '24px 16px 60px' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        {/* Back button */}
        <button
          onClick={() => setPageView('home')}
          className="btn btn-ghost"
          style={{ marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px' }}
        >
          <ArrowLeft size={16} />
          <span>{language === 'np' ? 'किनमेल जारी राख्नुहोस्' : 'Continue Shopping'}</span>
        </button>

        {/* Page Title & Fast Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 700, color: '#2B1810', margin: 0 }}>
              {language === 'np' ? 'द्रुत चेकआउट (1-Step Fast Checkout)' : 'Single-Page Fast Checkout'}
            </h1>
            <p style={{ fontSize: 13.5, color: '#6B564C', margin: '4px 0 0' }}>
              {language === 'np' ? 'कृपया डेलिभरी विवरण भर्नुहोस् र अर्डर निश्चित गर्नुहोस्' : 'Complete your shipping address and confirm your order in one step.'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '6px 12px', borderRadius: 99, color: '#065F46', fontSize: 12, fontWeight: 700 }}>
            <ShieldCheck size={16} />
            <span>{language === 'np' ? '१००% सुरक्षित भुक्तानी' : '100% Verified Secure Checkout'}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 24, alignItems: 'start' }}>
          {/* Left Column: Form & Payment in 1 Page */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* 1. Customer & Shipping Form */}
            <div className="card" style={{ padding: 'clamp(18px, 3vw, 28px)', background: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#8B3A3A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>
                  1
                </div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: '#2B1810', margin: 0 }}>
                  {language === 'np' ? 'डेलिभरी ठेगाना' : 'Delivery Address & Contact'}
                </h2>
              </div>

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
                    marginBottom: 16,
                  }}
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid #D4AF37' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#2B1810' }}>
                      {language === 'np' ? 'साइन इन गरिएको खाता' : 'Signed in as'} {user.name}
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
                    marginBottom: 16,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>{language === 'np' ? 'गुगलबाट १-ट्याप अटो-फिल' : 'Sign in with Google for 1-Tap Auto-fill'}</span>
                </button>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Full Name & Phone */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#2B1810', marginBottom: 5 }}>
                      {language === 'np' ? 'पूरा नाम' : 'Full Name'} *
                    </label>
                    <input
                      style={inputStyle(errors.fullName)}
                      value={form.fullName}
                      placeholder={language === 'np' ? 'तपाईंको पूरा नाम' : 'e.g. Pooja Sharma'}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, fullName: e.target.value }));
                        setErrors((er) => ({ ...er, fullName: undefined }));
                      }}
                    />
                    {errors.fullName && <p style={{ fontSize: 11, color: '#DC2626', margin: '4px 0 0' }}>{errors.fullName}</p>}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#2B1810', marginBottom: 5 }}>
                      {language === 'np' ? 'फोन नम्बर (१० अंक)' : 'Phone Number'} *
                    </label>
                    <input
                      style={inputStyle(errors.phone)}
                      value={form.phone}
                      type="tel"
                      placeholder="98XXXXXXXX"
                      onChange={(e) => {
                        setForm((f) => ({ ...f, phone: e.target.value }));
                        setErrors((er) => ({ ...er, phone: undefined }));
                      }}
                    />
                    {errors.phone && <p style={{ fontSize: 11, color: '#DC2626', margin: '4px 0 0' }}>{errors.phone}</p>}
                  </div>
                </div>

                {/* City Quick Select & Custom input */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#2B1810', marginBottom: 5 }}>
                    {language === 'np' ? 'सहर / जिल्ला' : 'City / District'} *
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {popularCities.map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => {
                          setForm((f) => ({ ...f, city: c }));
                          setErrors((er) => ({ ...er, city: undefined }));
                        }}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: form.city === c ? 700 : 500,
                          border: `1.5px solid ${form.city === c ? '#8B3A3A' : '#EADCCE'}`,
                          background: form.city === c ? '#FAF2E9' : 'white',
                          color: form.city === c ? '#8B3A3A' : '#2B1810',
                          cursor: 'pointer',
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <input
                    style={inputStyle(errors.city)}
                    value={form.city}
                    placeholder="Enter your city / town"
                    onChange={(e) => {
                      setForm((f) => ({ ...f, city: e.target.value }));
                      setErrors((er) => ({ ...er, city: undefined }));
                    }}
                  />
                  {errors.city && <p style={{ fontSize: 11, color: '#DC2626', margin: '4px 0 0' }}>{errors.city}</p>}
                </div>

                {/* Detailed Street Address */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#2B1810', marginBottom: 5 }}>
                    {language === 'np' ? 'टोल, सडक वा घर नम्बर' : 'Street Address / Landmark'} *
                  </label>
                  <input
                    style={inputStyle(errors.addressLine)}
                    value={form.addressLine}
                    placeholder={language === 'np' ? 'उदा: नयाँ सडक, विशाल बजार अगाडि' : 'e.g. Lazimpat, Near Embassy gate'}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, addressLine: e.target.value }));
                      setErrors((er) => ({ ...er, addressLine: undefined }));
                    }}
                  />
                  {errors.addressLine && <p style={{ fontSize: 11, color: '#DC2626', margin: '4px 0 0' }}>{errors.addressLine}</p>}
                </div>
              </div>
            </div>

            {/* 2. Payment Method Selector */}
            <div className="card" style={{ padding: 'clamp(18px, 3vw, 28px)', background: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#8B3A3A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>
                  2
                </div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: '#2B1810', margin: 0 }}>
                  {language === 'np' ? 'भुक्तानी विधि' : 'Payment Method'}
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {paymentOptions.map((opt) => {
                  const isSelected = paymentMethod === opt.id;
                  return (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setPaymentMethod(opt.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: '14px 16px',
                        borderRadius: 12,
                        border: `2px solid ${isSelected ? '#8B3A3A' : '#EADCCE'}`,
                        background: isSelected ? '#FAF2E9' : 'white',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'var(--transition)',
                      }}
                    >
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          background: isSelected ? '#8B3A3A' : '#F4ECE4',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isSelected ? 'white' : '#6B564C',
                          flexShrink: 0,
                        }}
                      >
                        {opt.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 14.5, color: '#2B1810' }}>{opt.label}</span>
                          {opt.badge && (
                            <span style={{ background: '#10B981', color: 'white', fontSize: 10, padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: '#6B564C', marginTop: 2 }}>{opt.description}</div>
                      </div>
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          border: `2px solid ${isSelected ? '#8B3A3A' : '#C4B5A5'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {isSelected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#8B3A3A' }} />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic QR Code Card if Digital Wallet is Chosen */}
              {paymentMethod !== 'cod' && (
                <div
                  style={{
                    background: '#FAF2E9',
                    border: '1.5px solid #D4AF37',
                    borderRadius: 14,
                    padding: '16px',
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <QrCode size={18} color="#8B3A3A" />
                    <span style={{ fontWeight: 800, fontSize: 13.5, color: '#2B1810' }}>
                      Official Dawosti Digital Payment Terminal
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, alignItems: 'center' }}>
                    {/* Visual QR Card */}
                    <div style={{ background: 'white', padding: 12, borderRadius: 10, textAlign: 'center', border: '1px solid #EADCCE', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#8B3A3A', textTransform: 'uppercase', marginBottom: 6 }}>
                        Scan & Pay: NPR {total.toLocaleString()}
                      </div>
                      {/* Stylized QR placeholder with merchant logo */}
                      <div style={{ width: 140, height: 140, margin: '0 auto', background: '#FFFFFF', border: '2px solid #2B1810', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 6, left: 6, width: 22, height: 22, border: '3px solid #2B1810' }} />
                        <div style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, border: '3px solid #2B1810' }} />
                        <div style={{ position: 'absolute', bottom: 6, left: 6, width: 22, height: 22, border: '3px solid #2B1810' }} />
                        <QrCode size={64} color="#2B1810" />
                        <span style={{ fontSize: 9, fontWeight: 800, color: '#8B3A3A', marginTop: 4 }}>DAWOSTI BOUTIQUE</span>
                      </div>
                      <p style={{ fontSize: 10.5, color: '#666', margin: '6px 0 0' }}>
                        Supports Fonepay • eSewa • Khalti • Banking
                      </p>
                    </div>

                    {/* Merchant Transfer Info */}
                    <div style={{ fontSize: 12.5, color: '#2B1810' }}>
                      <p style={{ margin: '0 0 6px' }}>
                        <strong>Account / Wallet ID:</strong>{' '}
                        <code style={{ background: '#FFF', padding: '2px 6px', borderRadius: 4, color: '#8B3A3A', fontWeight: 800 }}>
                          {merchant.shopPhone}
                        </code>
                      </p>
                      <p style={{ margin: '0 0 6px' }}>
                        <strong>Merchant Name:</strong> {merchant.shopName.en}
                      </p>
                      <p style={{ margin: '0 0 10px', fontSize: 11.5, color: '#6B564C' }}>
                        Transfer total amount <strong>NPR {total.toLocaleString()}</strong>, then enter your transaction code or screenshot reference below.
                      </p>

                      <input
                        style={inputStyle()}
                        value={txnRef}
                        placeholder="Enter Transaction ID (e.g. 192847291)"
                        onChange={(e) => setTxnRef(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Order Summary & Place Order CTA */}
          <div style={{ position: 'sticky', top: 80 }}>
            <div className="card" style={{ padding: 24, background: 'white' }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: '#2B1810', marginBottom: 16 }}>
                {language === 'np' ? 'तपाईंको अर्डर सारांश' : 'Order Summary'}
              </h3>

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16, maxHeight: 260, overflowY: 'auto' }}>
                {items.map((item) => (
                  <div key={`${item.product.id}_${item.selectedSize}`} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <img
                      src={item.product.images[0]}
                      alt={item.product.title.en}
                      style={{ width: 52, height: 65, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#2B1810', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {language === 'np' ? item.product.title.np : item.product.title.en}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#6B564C' }}>
                        Size: {item.selectedSize} × {item.quantity}
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, color: '#8B3A3A', fontSize: 13.5 }}>
                      {formatPrice(item.product.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Calculations */}
              <div style={{ borderTop: '1px solid #EADCCE', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6B564C' }}>
                  <span>{language === 'np' ? 'उप-कुल' : 'Subtotal'}</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>

                {activeReferralCode && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#10B981', fontWeight: 700 }}>
                    <span>🎁 Referral Discount ({activeReferralCode})</span>
                    <span>−{formatPrice(referralDiscount)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6B564C' }}>
                  <span>{language === 'np' ? 'डेलिभरी शुल्क' : 'Delivery Fee'}</span>
                  <span style={{ color: deliveryFee === 0 ? '#10B981' : 'inherit', fontWeight: deliveryFee === 0 ? 800 : 500 }}>
                    {deliveryFee === 0 ? (language === 'np' ? 'निःशुल्क (FREE)' : 'FREE') : formatPrice(deliveryFee)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 20, color: '#8B3A3A', borderTop: '1.5px solid #EADCCE', paddingTop: 12, marginTop: 4 }}>
                  <span>{language === 'np' ? 'कुल रकम' : 'Total Amount'}</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              {/* Anti-Bot Honeypot */}
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
                <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: 8, padding: '10px 14px', marginTop: 14, color: '#991B1B', fontSize: 12, fontWeight: 600 }}>
                  ⚠️ {botBlockedMessage}
                </div>
              )}

              {/* Single Place Order CTA */}
              <button
                onClick={handlePlaceOrder}
                disabled={isPlacing || items.length === 0}
                style={{
                  width: '100%',
                  marginTop: 18,
                  padding: '14px 20px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #8B3A3A 0%, #682626 100%)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: 16,
                  cursor: isPlacing ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(139,58,58,0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <span>{isPlacing ? (language === 'np' ? 'अर्डर राखिँदैछ...' : 'Placing Order...') : (language === 'np' ? '🛍️ अर्डर निश्चित गर्नुहोस् (Confirm Order)' : '🛍️ Place & Confirm Order')}</span>
              </button>

              {/* Trust signals */}
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11.5, color: '#6B564C' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669', fontWeight: 700 }}>
                  <ShieldCheck size={14} />
                  <span>{language === 'np' ? 'डेलिभरीमा सामान हेरेर मात्र पैसा तिर्नुहोस्' : 'Pay when you inspect the parcel at your door'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <RotateCcw size={14} color="#8B3A3A" />
                  <span>7-Day Hassle-Free Size Exchange Guarantee</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
