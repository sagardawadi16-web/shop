import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Truck,
  CreditCard,
  Smartphone,
  QrCode,
  ShieldCheck,
  RotateCcw,
  MessageCircle,
  ShoppingBag,
  Send,
  PhoneCall,
  MapPin,
  FileText,
  ZoomIn,
  X,
} from 'lucide-react';
import { useCartStore } from '../stores/cartStore';
import { useOrderStore } from '../stores/orderStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useReferralStore } from '../stores/referralStore';
import { useAuthStore } from '../stores/authStore';
import { ShippingAddress, PaymentMethod } from '../types';
import { verifyHumanOrAgent } from '../services/botProtection';
import { DynamicLocationSelector } from '../components/checkout/DynamicLocationSelector';

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
  const [deliveryNote, setDeliveryNote] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);
  const [zoomedQr, setZoomedQr] = useState<string | null>(null);

  const [form, setForm] = useState<ShippingAddress>({
    fullName: user?.name || '',
    phone: '',
    addressLine: '',
    city: 'Chitwan',
    province: 'Bagmati Province',
    district: 'Chitwan',
    municipality: 'Bharatpur Metropolitan',
    ward: '10',
    tole: 'Lions Chowk',
    landmark: '',
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
    if (!form.fullName.trim()) {
      e.fullName = language === 'np' ? 'कृपया तपाईंको पूरा नाम लेख्नुहोस्' : 'Full name is required';
    }
    const cleanPhone = form.phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      e.phone = language === 'np' ? '१० अंकको वैध फोन नम्बर आवश्यक छ (उदा: 9808251494)' : '10-digit valid phone required (e.g. 9808251494)';
    }
    if (!form.addressLine.trim() && !form.tole?.trim()) {
      e.addressLine = language === 'np' ? 'डेलिभरीको लागि टोल वा सडकको नाम लेख्नुहोस्' : 'Street address / area required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildWhatsAppMessage = (orderNumber: string) => {
    const paymentNepali =
      paymentMethod === 'cod'
        ? 'सामान पाएपछि पैसा दिने (Cash on Delivery)'
        : paymentMethod === 'fonepay'
        ? 'Fonepay / QR भुक्तानी'
        : paymentMethod === 'esewa'
        ? 'eSewa वालेट'
        : 'Khalti वालेट';

    const itemsSummary = items
      .map(
        (i, idx) =>
          `• ${i.product?.title ? (language === 'np' ? i.product.title.np : i.product.title.en) : 'पोशाक'} (${i.selectedSize}) × ${i.quantity} = रु ${((i.product?.price || 0) * (i.quantity || 1)).toLocaleString()}`
      )
      .join('\n');

    const detailedAddress = [
      form.tole,
      form.landmark ? `(ल्यान्डमार्क: ${form.landmark})` : '',
      form.ward ? `वडा-${form.ward}` : '',
      form.municipality,
      form.district || form.city,
      form.province,
    ].filter(Boolean).join(', ') || form.addressLine;

    return encodeURIComponent(
      `🛍️ *दावोस्ती फेसन — नयाँ अनलाइन अर्डर #${orderNumber}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *ग्राहकको नाम (Customer):* ${form.fullName}\n` +
      `📞 *सम्पर्क फोन (Phone):* ${form.phone}\n` +
      `📍 *डेलिभरी ठेगाना:* ${detailedAddress}\n` +
      `${form.mapUrl ? `🗺️ *Google Maps GPS पिन:* ${form.mapUrl}\n` : ''}` +
      `${deliveryNote ? `📝 *डेलिभरी निर्देशन:* ${deliveryNote}\n` : ''}` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📦 *अर्डर गरिएका वस्त्रहरू (Items):*\n${itemsSummary}\n\n` +
      `💵 *उप-कुल (Subtotal):* NPR ${subtotal.toLocaleString()}\n` +
      `🚚 *डेलिभरी खर्च:* ${deliveryFee === 0 ? 'निःशुल्क (FREE)' : `NPR ${deliveryFee.toLocaleString()}`}\n` +
      `${referralDiscount > 0 ? `🎁 *छुट (Discount):* -NPR ${referralDiscount.toLocaleString()} (${activeReferralCode})\n` : ''}` +
      `💰 *जम्मा रकम (Total):* NPR ${total.toLocaleString()}\n` +
      `💳 *भुक्तानी रोजाइ:* ${paymentNepali}\n` +
      `${txnRef ? `🧾 *कारोबार कोड (Txn Ref):* ${txnRef}\n` : ''}` +
      `${activeReferralCode ? `🎁 *रेफरल कोड:* ${activeReferralCode}\n` : ''}` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🙏 *कृपया मेरो यो अर्डर प्रमाणीकरण गरी डेलिभरी व्यवस्था गरिदिनुहोला। धन्यवाद!*`
    );
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
      setBotBlockedMessage(botCheck.reason || 'सुरक्षा जाँच असफल भयो। कृपया केही सेकेन्ड पर्खेर फेरि प्रयास गर्नुहोस्।');
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

      // Prepare auto WhatsApp dispatch URL to 9808251494
      const clientWaMsg = buildWhatsAppMessage(order.orderNumber);
      let targetWhatsappUrl = `https://wa.me/9779808251494?text=${clientWaMsg}`;

      // Edge API logging & WhatsApp Handshake
      try {
        const edgeRes = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNumber: order.orderNumber,
            items: order.items,
            subtotalAmount: order.subtotalAmount,
            deliveryFee: order.deliveryFee,
            discountAmount: order.discountAmount,
            totalAmount: order.totalAmount,
            shippingAddress: order.shippingAddress,
            paymentMethod: order.paymentMethod,
            paymentDetails: txnRef || undefined,
            deliveryNote: deliveryNote || undefined,
            referredByCode: activeReferralCode || undefined,
            renderTimestamp: renderTimestamp.current,
            honeypot,
          }),
        });

        if (edgeRes.ok) {
          const edgeData = await edgeRes.json();
          if (edgeData?.whatsappUrl) {
            targetWhatsappUrl = edgeData.whatsappUrl;
          }
        }
      } catch (err) {
        console.warn('Edge order logging note:', err);
      }

      clearCart();
      setLatestOrder(order);
      setPageView('order-confirmation');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsPlacing(false);
    }
  };

  const handleDirectWhatsAppOrder = async () => {
    if (!validate()) {
      window.scrollTo({ top: 180, behavior: 'smooth' });
      return;
    }

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

      setLatestOrder(order);

      // Best-effort Edge API logging
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: order.id,
          orderNumber: order.orderNumber,
          items: order.items,
          subtotalAmount: order.subtotalAmount,
          deliveryFee: order.deliveryFee,
          discountAmount: order.discountAmount,
          totalAmount: order.totalAmount,
          shippingAddress: order.shippingAddress,
          paymentMethod: order.paymentMethod,
          paymentDetails: txnRef || undefined,
          deliveryNote: deliveryNote || undefined,
          referredByCode: activeReferralCode || undefined,
          renderTimestamp: renderTimestamp.current,
          honeypot,
        }),
      }).catch(() => {});

      const waText = buildWhatsAppMessage(order.orderNumber);
      try {
        window.open(`https://wa.me/9779808251494?text=${waText}`, '_blank');
      } catch {}

      clearCart();
      setPageView('order-confirmation');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsPlacing(false);
    }
  };

  const paymentOptions: { id: PaymentMethod; label: string; badge?: string; icon: React.ReactNode; description: string }[] = [
    {
      id: 'cod',
      label: language === 'np' ? 'सामान हातमा परेपछि पैसा दिने (Cash on Delivery)' : 'Cash on Delivery (सामान हातमा परेपछि)',
      badge: language === 'np' ? 'सबैभन्दा लोकप्रिय र सजिलो' : 'Most Popular (सजिलो)',
      icon: <Truck size={20} />,
      description: language === 'np' ? 'सामान घरमै पाएर खोलेर हेरेपछि मात्र पैसा बुझाउनुहोस्' : 'Pay in cash after receiving and inspecting your package',
    },
    {
      id: 'fonepay',
      label: 'Fonepay / मोबाइल बैंकिङ QR कोड',
      badge: language === 'np' ? 'तुरुन्त स्क्यान' : 'Instant QR',
      icon: <QrCode size={20} />,
      description: language === 'np' ? 'कुनै पनि नेपाली बैंक वा वालेट एपबाट QR स्क्यान गरी तिर्नुहोस्' : 'Scan & pay with any Nepal banking or wallet app',
    },
    {
      id: 'esewa',
      label: 'eSewa (इसेवा डिजिटल वालेट)',
      icon: <Smartphone size={20} />,
      description: language === 'np' ? 'आफ्नो eSewa वालेटबाट सहज र सुरक्षित भुक्तानी' : 'Pay via official eSewa wallet',
    },
    {
      id: 'khalti',
      label: 'Khalti (खल्ती डिजिटल वालेट)',
      icon: <CreditCard size={20} />,
      description: language === 'np' ? 'आफ्नो Khalti वालेटबाट सहज भुक्तानी' : 'Pay via Khalti digital wallet',
    },
  ];

  const popularCities = ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Butwal', 'Chitwan', 'Dharan', 'Biratnagar', 'Hetauda', 'Nepalgunj', 'Dhangadhi', 'Birtamode'];

  const inputStyle = (hasError?: string) => ({
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: `1.5px solid ${hasError ? '#DC2626' : '#EADCCE'}`,
    fontFamily: 'Inter, sans-serif',
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
          <span>{language === 'np' ? '← पसलमा फर्किनुहोस्' : '← Continue Shopping (पसलमा फर्किनुहोस्)'}</span>
        </button>

        {/* Page Title & Fast Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 700, color: '#2B1810', margin: 0 }}>
              {language === 'np' ? '🛍️ डेलिभरी ठेगाना तथा अर्डर पुष्टि फारम' : '🛍️ Delivery & Order Form (सजिलो खरिद)'}
            </h1>
            <p style={{ fontSize: 13.5, color: '#6B564C', margin: '4px 0 0' }}>
              {language === 'np'
                ? 'तपाईंको डेलिभरी ठेगाना र सम्पर्क नम्बर लेख्नुहोस्, दावोस्तीले सामान सुरक्षित तपाईंको घरमै पुर्‍याउनेछ।'
                : 'Fill your shipping address and contact info. We deliver to your doorstep across Nepal.'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '6px 12px', borderRadius: 99, color: '#065F46', fontSize: 12, fontWeight: 700 }}>
            <ShieldCheck size={16} />
            <span>{language === 'np' ? '१००% सुरक्षित सेवा | नेपालभर डेलिभरी' : '100% Verified Secure Service'}</span>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="card" style={{ padding: '48px 24px', textAlign: 'center', background: 'white', maxWidth: 480, margin: '40px auto' }}>
            <ShoppingBag size={52} style={{ margin: '0 auto 16px', opacity: 0.3, color: '#8B3A3A' }} />
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: '#2B1810', marginBottom: 8 }}>
              {language === 'np' ? 'तपाईंको किनमेल झोला खाली छ' : 'Your Shopping Bag is Empty'}
            </h2>
            <p style={{ fontSize: 14, color: '#6B564C', marginBottom: 24 }}>
              {language === 'np' ? 'कृपया अर्डर अगाडि बढाउन पहिले कुनै पोशाक झोलामा थप्नुहोस्।' : 'Please add an authentic garment to your bag before placing your order.'}
            </p>
            <button
              onClick={() => setPageView('home')}
              className="btn btn-primary"
              style={{ padding: '12px 28px', fontSize: 15 }}
            >
              {language === 'np' ? 'मौलिक वस्त्रहरू हेर्नुहोस्' : 'Explore Collections'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 24, alignItems: 'start' }}>
            {/* Left Column: Form & Payment in 1 Page */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* 1. Customer & Shipping Form */}
              <div className="card" style={{ padding: 'clamp(18px, 3vw, 28px)', background: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#8B3A3A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>
                    १
                  </div>
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: '#2B1810', margin: 0 }}>
                    {language === 'np' ? 'ग्राहक तथा डेलिभरी ठेगाना' : 'Delivery Address & Contact (डेलिभरी विवरण)'}
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
                    onClick={() => loginGoogle()}
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
                    <span>{language === 'np' ? 'गुगलबाट नाम र इमेल १-ट्यापमा भर्नुहोस्' : 'Sign in with Google for 1-Tap Auto-fill'}</span>
                  </button>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Full Name & Phone */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#2B1810', marginBottom: 5 }}>
                        {language === 'np' ? 'तपाईंको पूरा नाम' : 'Full Name (पूरा नाम)'} *
                      </label>
                      <input
                        style={inputStyle(errors.fullName)}
                        value={form.fullName}
                        placeholder={language === 'np' ? 'तपाईंको पूरा नाम (उदा: पूजा शर्मा)' : 'e.g. Pooja Sharma'}
                        onChange={(e) => {
                          setForm((f) => ({ ...f, fullName: e.target.value }));
                          setErrors((er) => ({ ...er, fullName: undefined }));
                        }}
                      />
                      {errors.fullName && <p style={{ fontSize: 11, color: '#DC2626', margin: '4px 0 0' }}>{errors.fullName}</p>}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#2B1810', marginBottom: 5 }}>
                        {language === 'np' ? 'सम्पर्क फोन नम्बर (१० अंक)' : 'Phone Number (सम्पर्क नम्बर)'} *
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

                  {/* Dynamic Cascade Nepal Location & GPS Component */}
                  <DynamicLocationSelector
                    value={form}
                    onChange={(updated) => {
                      setForm(updated);
                      setErrors((er) => ({
                        ...er,
                        addressLine: undefined,
                        city: undefined,
                        province: undefined,
                      }));
                    }}
                    errors={errors}
                    language={language}
                  />

                  {/* Optional Delivery Instructions */}
                  <div>
                    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#6B564C', marginBottom: 5 }}>
                      {language === 'np' ? 'डेलिभरी सम्बन्धी केही विशेष भन्नु छ? (ऐच्छिक)' : 'Delivery note / Special instructions (Optional)'}
                    </label>
                    <input
                      style={inputStyle()}
                      value={deliveryNote}
                      placeholder={language === 'np' ? 'उदा: दिउँसो २ बजेपछि ल्याइदिनुहोला वा आउनुअघि फोन गर्नुहोला' : 'e.g. Please call before arriving or deliver after 2 PM'}
                      onChange={(e) => setDeliveryNote(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Payment Method Selector */}
              <div className="card" style={{ padding: 'clamp(18px, 3vw, 28px)', background: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#8B3A3A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>
                    २
                  </div>
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: '#2B1810', margin: 0 }}>
                    {language === 'np' ? 'भुक्तानी गर्ने सजिलो तरिका' : 'Payment Method (भुक्तानी छनोट)'}
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: 14.5, color: '#2B1810' }}>{opt.label}</span>
                            {opt.badge && (
                              <span style={{ background: '#10B981', color: 'white', fontSize: 10.5, padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>
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
                {paymentMethod !== 'cod' && (() => {
                  const activeQrImage =
                    paymentMethod === 'esewa'
                      ? (merchant.esewaQrDataUri || merchant.fonepayQrDataUri)
                      : paymentMethod === 'khalti'
                      ? (merchant.khaltiQrDataUri || merchant.fonepayQrDataUri)
                      : merchant.fonepayQrDataUri;

                  const activeWalletId =
                    paymentMethod === 'esewa' && merchant.esewaId
                      ? merchant.esewaId
                      : paymentMethod === 'khalti' && merchant.khaltiId
                      ? merchant.khaltiId
                      : (merchant.shopPhone || '9808251494');

                  const activeMerchantName =
                    (language === 'np' ? merchant.shopName?.np : merchant.shopName?.en) ||
                    merchant.shopName?.en ||
                    'DAWOSTI Boutique';

                  return (
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
                          {language === 'np' ? 'दावोस्ती आधिकारिक डिजिटल भुक्तानी टर्मिनल' : 'Official Dawosti Digital Payment Terminal'}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, alignItems: 'center' }}>
                        {/* Visual QR Card */}
                        <div style={{ background: 'white', padding: 12, borderRadius: 10, textAlign: 'center', border: '1px solid #EADCCE', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#8B3A3A', textTransform: 'uppercase', marginBottom: 6 }}>
                            {language === 'np' ? `स्क्यान गरी तिर्नुहोस्: NPR ${total.toLocaleString()}` : `Scan & Pay: NPR ${total.toLocaleString()}`}
                          </div>

                          {activeQrImage ? (
                            <div
                              style={{
                                position: 'relative',
                                width: 140,
                                height: 140,
                                margin: '0 auto',
                                background: '#FFFFFF',
                                border: '2px solid #2B1810',
                                borderRadius: 8,
                                padding: 4,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                              }}
                              onClick={() => setZoomedQr(activeQrImage)}
                              title={language === 'np' ? 'ठूलो गरी हेर्न थिच्नुहोस्' : 'Click to zoom QR'}
                            >
                              <img
                                src={activeQrImage}
                                alt="Payment QR Code"
                                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 4 }}
                              />
                              <div
                                style={{
                                  position: 'absolute',
                                  bottom: 4,
                                  right: 4,
                                  background: 'rgba(43,24,16,0.7)',
                                  color: '#FFF',
                                  borderRadius: 4,
                                  padding: 2,
                                  display: 'flex',
                                  alignItems: 'center',
                                }}
                              >
                                <ZoomIn size={12} />
                              </div>
                            </div>
                          ) : (
                            /* Stylized QR placeholder */
                            <div style={{ width: 140, height: 140, margin: '0 auto', background: '#FFFFFF', border: '2px solid #2B1810', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                              <div style={{ position: 'absolute', top: 6, left: 6, width: 22, height: 22, border: '3px solid #2B1810' }} />
                              <div style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, border: '3px solid #2B1810' }} />
                              <div style={{ position: 'absolute', bottom: 6, left: 6, width: 22, height: 22, border: '3px solid #2B1810' }} />
                              <QrCode size={64} color="#2B1810" />
                              <span style={{ fontSize: 9, fontWeight: 800, color: '#8B3A3A', marginTop: 4 }}>
                                {activeWalletId}
                              </span>
                            </div>
                          )}

                          <p style={{ fontSize: 10.5, color: '#666', margin: '6px 0 0' }}>
                            Fonepay • eSewa • Khalti • Mobile Banking
                          </p>
                        </div>

                        {/* Merchant Transfer Info */}
                        <div style={{ fontSize: 12.5, color: '#2B1810' }}>
                          <p style={{ margin: '0 0 6px' }}>
                            <strong>{language === 'np' ? 'खाता / फोन नम्बर:' : 'Account / Wallet ID:'}</strong>{' '}
                            <code style={{ background: '#FFF', padding: '2px 8px', borderRadius: 4, color: '#8B3A3A', fontWeight: 800, fontSize: 14 }}>
                              {activeWalletId}
                            </code>
                          </p>
                          <p style={{ margin: '0 0 6px' }}>
                            <strong>{language === 'np' ? 'खाताको नाम:' : 'Merchant Name:'}</strong> {activeMerchantName}
                          </p>
                          <p style={{ margin: '0 0 10px', fontSize: 11.5, color: '#6B564C' }}>
                            {language === 'np'
                              ? `जम्मा रकम रु ${total.toLocaleString()} भुक्तानी गरिसकेपछि प्राप्त भएको ट्रान्ज्याक्सन नम्बर तल लेख्नुहोस्:`
                              : `Transfer NPR ${total.toLocaleString()}, then enter your transaction ID or reference below:`}
                          </p>

                          <input
                            style={inputStyle()}
                            value={txnRef}
                            placeholder={language === 'np' ? 'भुक्तानी ट्रान्ज्याक्सन कोड (उदा: 192847291)' : 'Enter Transaction ID (e.g. 192847291)'}
                            onChange={(e) => setTxnRef(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Right Column: Order Summary & Place Order CTA */}
            <div style={{ position: 'sticky', top: 80 }}>
              <div className="card" style={{ padding: 24, background: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#8B3A3A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>
                    ३
                  </div>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: '#2B1810', margin: 0 }}>
                    {language === 'np' ? 'तपाईंको अर्डर सारांश' : 'Order Summary (अर्डर विवरण)'}
                  </h3>
                </div>

                {/* Items List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16, maxHeight: 260, overflowY: 'auto' }}>
                  {items.map((item) => {
                    const imageSrc = item.product?.images?.[0] || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80';
                    const title = item.product?.title ? (language === 'np' ? item.product.title.np : item.product.title.en) : 'पोशाक';
                    const itemTotal = (item.product?.price || 0) * (item.quantity || 1);
                    return (
                      <div key={`${item.product?.id || 'item'}_${item.selectedSize}`} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <img
                          src={imageSrc}
                          alt={title}
                          style={{ width: 52, height: 65, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#2B1810', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {title}
                          </div>
                          <div style={{ fontSize: 11.5, color: '#6B564C' }}>
                            {language === 'np' ? 'साइज' : 'Size'}: {item.selectedSize} × {item.quantity}
                          </div>
                        </div>
                        <div style={{ fontWeight: 800, color: '#8B3A3A', fontSize: 13.5 }}>
                          {formatPrice(itemTotal)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Calculations */}
                <div style={{ borderTop: '1px solid #EADCCE', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6B564C' }}>
                    <span>{language === 'np' ? 'सामानको जम्मा मूल्य (Subtotal)' : 'Subtotal'}</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>

                  {activeReferralCode && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#10B981', fontWeight: 700 }}>
                      <span>🎁 {language === 'np' ? 'रेफरल छुट' : 'Referral Discount'} ({activeReferralCode})</span>
                      <span>−{formatPrice(referralDiscount)}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6B564C' }}>
                    <span>{language === 'np' ? 'डेलिभरी खर्च' : 'Delivery Fee'}</span>
                    <span style={{ color: deliveryFee === 0 ? '#10B981' : 'inherit', fontWeight: deliveryFee === 0 ? 800 : 500 }}>
                      {deliveryFee === 0 ? (language === 'np' ? 'निःशुल्क (FREE)' : 'FREE') : formatPrice(deliveryFee)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 20, color: '#8B3A3A', borderTop: '1.5px solid #EADCCE', paddingTop: 12, marginTop: 4 }}>
                    <span>{language === 'np' ? 'कुल तिर्नुपर्ने रकम' : 'Total Amount'}</span>
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
                    padding: '14px 18px',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #8B3A3A 0%, #682626 100%)',
                    color: 'white',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: 15,
                    cursor: isPlacing ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(139,58,58,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <Send size={18} />
                  <span>
                    {isPlacing
                      ? (language === 'np' ? 'अर्डर दर्ता हुँदैछ...' : 'Placing Order...')
                      : (language === 'np' ? '🛍️ अर्डर निश्चित गर्नुहोस् (WhatsApp ९८०८२५१४९४ मा अटो-पठाइनेछ)' : '🛍️ Confirm Order & Send Details to WhatsApp 9808251494')}
                  </span>
                </button>

                {/* Direct 1-Tap WhatsApp Order Button */}
                <button
                  type="button"
                  onClick={handleDirectWhatsAppOrder}
                  disabled={items.length === 0}
                  style={{
                    width: '100%',
                    marginTop: 10,
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: '#25D366',
                    color: 'white',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    boxShadow: '0 3px 10px rgba(37,211,102,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <MessageCircle size={18} />
                  <span>{language === 'np' ? '💬 ह्वाट्सएप (९८०८२५१४९४) बाट सिधै १-ट्याप अर्डर' : '💬 1-Tap Quick Order via WhatsApp (9808251494)'}</span>
                </button>

                <p style={{ fontSize: 11, color: '#6B564C', textAlign: 'center', margin: '8px 0 0', lineHeight: 1.4 }}>
                  {language === 'np'
                    ? '🔒 अर्डर बटन थिचेपछि तपाईंको नाम, फोन र ठेगाना हाम्रो आधिकारिक ह्वाट्सएप ९८०८२५१४९४ मा तुरुन्त अटो-पठाइनेछ।'
                    : '🔒 Your order details will be automatically formatted and dispatched to WhatsApp 9808251494.'}
                </p>

                {/* Trust signals */}
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11.5, color: '#6B564C' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669', fontWeight: 700 }}>
                    <ShieldCheck size={14} />
                    <span>{language === 'np' ? 'डेलिभरीमा सामान हेरेर ढुक्क भई पैसा तिर्नुहोस् (COD)' : 'Pay when you inspect the parcel at your door'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <RotateCcw size={14} color="#8B3A3A" />
                    <span>{language === 'np' ? '७ दिनभित्र सजिलो साइज साट्न पाइने ग्यारेन्टी' : '7-Day Hassle-Free Size Exchange Guarantee'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#2B1810', fontWeight: 600 }}>
                    <PhoneCall size={14} color="#8B3A3A" />
                    <span>{language === 'np' ? 'सोधपुछ वा सहयोगका लागि: ९८०८२५१४९४' : 'Helpline & WhatsApp Support: +977 9808251494'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Zoomed QR Lightbox Modal */}
      {zoomedQr && (
        <div
          onClick={() => setZoomedQr(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            cursor: 'zoom-out',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFF',
              padding: 24,
              borderRadius: 16,
              maxWidth: 380,
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setZoomedQr(null)}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: '#FAF2E9',
                border: 'none',
                borderRadius: '50%',
                color: '#2B1810',
                cursor: 'pointer',
                padding: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#8B3A3A', textTransform: 'uppercase', marginBottom: 14 }}>
              {language === 'np' ? `स्क्यान गरी तिर्नुहोस्: NPR ${total.toLocaleString()}` : `Scan & Pay: NPR ${total.toLocaleString()}`}
            </div>
            <img
              src={zoomedQr}
              alt="Enlarged QR"
              style={{ width: '100%', height: 'auto', maxHeight: 340, objectFit: 'contain', borderRadius: 8, display: 'block', margin: '0 auto' }}
            />
            <p style={{ marginTop: 14, fontSize: 12.5, color: '#2B1810', margin: '14px 0 6px' }}>
              <strong>{(language === 'np' ? merchant.shopName?.np : merchant.shopName?.en) || merchant.shopName?.en || 'DAWOSTI Boutique'}</strong>
            </p>
            <p style={{ fontSize: 11.5, color: '#6B564C', margin: 0 }}>
              {language === 'np' ? 'कुनै पनि नेपाली मोबाइल बैंकिङ वा वालेट एपबाट स्क्यान गर्नुहोस्।' : 'Scan with any Nepal mobile banking or wallet app.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
