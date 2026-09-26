import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ShieldCheck,
  MessageCircle,
  ExternalLink,
  MapPin,
  Calendar,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useOrderStore } from '../../stores/orderStore';
import { Order, OrderStatus } from '../../types';

export const OrderTrackingModal: React.FC = () => {
  const { isOrderTrackingOpen, setIsOrderTrackingOpen, language, formatPrice, merchant } = useSettingsStore();
  const { trackByNumber, orders } = useOrderStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOrderTrackingOpen) {
        setIsOrderTrackingOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOrderTrackingOpen, setIsOrderTrackingOpen]);

  // If user opens the tracking modal and has a recent order, auto-show the latest one
  useEffect(() => {
    if (isOrderTrackingOpen && !trackedOrder && !hasSearched) {
      if (orders && orders.length > 0) {
        setTrackedOrder(orders[0]);
        setSearchQuery(orders[0].orderNumber);
      }
    }
  }, [isOrderTrackingOpen, orders, trackedOrder, hasSearched]);

  if (!isOrderTrackingOpen) return null;

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    setIsLoading(true);
    setHasSearched(true);

    // 1. Check local orderStore
    const found = trackByNumber(q);
    if (found) {
      setTrackedOrder(found);
      setIsLoading(false);
      return;
    }

    // 2. Query edge API /api/orders?orderNumber=...
    fetch(`/api/orders?orderNumber=${encodeURIComponent(q)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.query && data.query.orderNumber) {
          // Check if any matching order exists in store or synthesize
          const matched = orders.find(
            (o) =>
              o.orderNumber.toLowerCase() === q.toLowerCase() ||
              o.shippingAddress.phone.includes(q)
          );
          setTrackedOrder(matched || null);
        } else {
          setTrackedOrder(null);
        }
      })
      .catch(() => {
        setTrackedOrder(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const getStatusSteps = (status: OrderStatus) => {
    const steps = [
      {
        id: 'pending',
        titleEn: 'Order Placed',
        titleNp: 'अर्डर दर्ता भयो',
        descEn: 'Received at Dawosti Atelier',
        descNp: 'काठमाडौँ बुटिकमा प्राप्त भयो',
      },
      {
        id: 'confirmed',
        titleEn: 'Confirmed & Tailored',
        titleNp: 'प्रमाणीकरण तथा तयारी',
        descEn: 'Inspected and packaged',
        descNp: 'सफा गरी प्याक गरियो',
      },
      {
        id: 'shipped',
        titleEn: 'Handed to Courier',
        titleNp: 'डेलिभरीमा हिँड्यो',
        descEn: 'In transit to your doorstep',
        descNp: 'डेलिभरी पार्टनरमार्फत पठाइयो',
      },
      {
        id: 'delivered',
        titleEn: 'Delivered',
        titleNp: 'सामान डेलिभर भयो',
        descEn: 'Successfully handed over',
        descNp: 'सफलतापूर्वक डेलिभरी सम्पन्न',
      },
    ];

    const statusHierarchy: Record<OrderStatus, number> = {
      pending: 0,
      confirmed: 1,
      shipped: 2,
      delivered: 3,
      cancelled: -1,
    };

    const currentRank = statusHierarchy[status] ?? 0;
    return { steps, currentRank, isCancelled: status === 'cancelled' };
  };

  const { steps, currentRank, isCancelled } = trackedOrder
    ? getStatusSteps(trackedOrder.status)
    : { steps: [], currentRank: 0, isCancelled: false };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        backgroundColor: 'rgba(43, 24, 16, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={() => setIsOrderTrackingOpen(false)}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 640,
          backgroundColor: '#FFF8F0',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(43, 24, 16, 0.45)',
          border: '1.5px solid #D4AF37',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          style={{
            background: 'linear-gradient(135deg, #561F1F 0%, #2B1810 100%)',
            color: '#FFF8F0',
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #D4AF37',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'rgba(212,175,55,0.2)',
                border: '1px solid #D4AF37',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Truck size={18} color="#D4AF37" />
            </div>
            <div>
              <h2
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 20,
                  fontWeight: 700,
                  margin: 0,
                  letterSpacing: '0.04em',
                }}
              >
                {language === 'np' ? 'अर्डर ट्र्याक तथा डेलिभरी स्थिति' : 'Order Tracking & Delivery Status'}
              </h2>
              <p style={{ margin: 0, fontSize: 11.5, color: 'rgba(255,248,240,0.8)' }}>
                {language === 'np'
                  ? 'अर्डर नम्बर वा दर्ता फोन नम्बर राखेर खोज्नुहोस्'
                  : 'Track using your Order Number (e.g. DAW-849201) or Phone'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsOrderTrackingOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#FFF8F0',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Close tracking modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Input Box */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #EADCCE', background: '#FAF2E9' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={18}
                color="#8B3A3A"
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  language === 'np'
                    ? 'अर्डर कोड (उदा: DAW-849201) वा १०-अंकको फोन नम्बर'
                    : 'Order # (e.g. DAW-849201) or phone number'
                }
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 40px',
                  borderRadius: 10,
                  border: '1.5px solid #D4C5B9',
                  background: '#FFFFFF',
                  fontSize: 14,
                  color: '#2B1810',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !searchQuery.trim()}
              style={{
                padding: '0 20px',
                backgroundColor: '#8B3A3A',
                color: '#FFF',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: isLoading || !searchQuery.trim() ? 'not-allowed' : 'pointer',
                opacity: isLoading || !searchQuery.trim() ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 8px rgba(139, 58, 58, 0.25)',
              }}
            >
              <span>{isLoading ? '...' : language === 'np' ? 'खोज्नुहोस्' : 'Track'}</span>
            </button>
          </form>
        </div>

        {/* Modal Body / Results */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {trackedOrder ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Order Meta Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 10,
                  padding: '12px 16px',
                  background: 'white',
                  borderRadius: 12,
                  border: '1px solid #EADCCE',
                }}
              >
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#8B3A3A', textTransform: 'uppercase' }}>
                    {language === 'np' ? 'अर्डर नम्बर' : 'Order Reference'}
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: '#2B1810', letterSpacing: '0.05em' }}>
                    {trackedOrder.orderNumber}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#6B564C' }}>
                    {new Date(trackedOrder.createdAt).toLocaleDateString(language === 'np' ? 'ne-NP' : 'en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#8B3A3A' }}>
                    {formatPrice(trackedOrder.totalAmount)}
                  </div>
                </div>
              </div>

              {/* Progress Milestones */}
              {isCancelled ? (
                <div
                  style={{
                    padding: '16px',
                    background: '#FEE2E2',
                    border: '1px solid #FCA5A5',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    color: '#991B1B',
                  }}
                >
                  <AlertCircle size={24} />
                  <div>
                    <strong style={{ display: 'block', fontSize: 14 }}>
                      {language === 'np' ? 'अर्डर रद्द गरिएको छ' : 'Order Cancelled'}
                    </strong>
                    <span style={{ fontSize: 12 }}>
                      {language === 'np'
                        ? 'यो अर्डर ग्राहक वा स्टोर प्रशासनद्वारा रद्द गरिएको छ।'
                        : 'This order was cancelled. Please contact concierge for details.'}
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: 'white',
                    padding: '18px 20px',
                    borderRadius: 12,
                    border: '1px solid #EADCCE',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#6B564C', marginBottom: 16 }}>
                    {language === 'np' ? 'डेलिभरी यात्रा' : 'Delivery Progress'}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {steps.map((step, idx) => {
                      const isCompleted = idx <= currentRank;
                      const isCurrent = idx === currentRank;

                      return (
                        <div key={step.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          {/* Step Marker */}
                          <div
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              backgroundColor: isCompleted ? '#10B981' : '#E5D6C7',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              fontWeight: 800,
                              flexShrink: 0,
                              marginTop: 2,
                              boxShadow: isCurrent ? '0 0 0 4px rgba(16, 185, 129, 0.2)' : 'none',
                            }}
                          >
                            {isCompleted ? <CheckCircle2 size={15} /> : idx + 1}
                          </div>

                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: isCompleted ? 700 : 500,
                                color: isCompleted ? '#2B1810' : '#8C7A70',
                              }}
                            >
                              {language === 'np' ? step.titleNp : step.titleEn}
                              {isCurrent && (
                                <span
                                  style={{
                                    marginLeft: 8,
                                    fontSize: 10.5,
                                    padding: '2px 8px',
                                    borderRadius: 99,
                                    background: '#ECFDF5',
                                    color: '#065F46',
                                    border: '1px solid #A7F3D0',
                                    fontWeight: 700,
                                  }}
                                >
                                  {language === 'np' ? 'हालको अवस्था' : 'Active Status'}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 12, color: '#6B564C', marginTop: 1 }}>
                              {language === 'np' ? step.descNp : step.descEn}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Courier Partner & Dispatch Info */}
              <div
                style={{
                  background: 'white',
                  padding: '14px 18px',
                  borderRadius: 12,
                  border: '1px solid #EADCCE',
                  fontSize: 13,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 11, color: '#6B564C', textTransform: 'uppercase', fontWeight: 600 }}>
                    {language === 'np' ? 'डेलिभरी पार्टनर (Courier)' : 'Courier Partner'}
                  </div>
                  <div style={{ fontWeight: 700, color: '#2B1810', marginTop: 2 }}>
                    {trackedOrder.courierPartner || 'Sundar Express Logistics'}
                  </div>
                </div>

                {trackedOrder.trackingNumber && (
                  <div>
                    <div style={{ fontSize: 11, color: '#6B564C', textTransform: 'uppercase', fontWeight: 600 }}>
                      {language === 'np' ? 'ट्र्याकिङ कोड' : 'Tracking Code'}
                    </div>
                    <div style={{ fontWeight: 800, color: '#8B3A3A', marginTop: 2 }}>
                      <code>{trackedOrder.trackingNumber}</code>
                    </div>
                  </div>
                )}

                <div>
                  <div style={{ fontSize: 11, color: '#6B564C', textTransform: 'uppercase', fontWeight: 600 }}>
                    {language === 'np' ? 'डेलिभरी ठेगाना' : 'Delivery Address'}
                  </div>
                  <div style={{ color: '#2B1810', marginTop: 2 }}>
                    {trackedOrder.shippingAddress.addressLine}, {trackedOrder.shippingAddress.city}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: '#6B564C', textTransform: 'uppercase', fontWeight: 600 }}>
                    {language === 'np' ? 'भुक्तानी माध्यम' : 'Payment Method'}
                  </div>
                  <div style={{ fontWeight: 700, color: '#2B1810', marginTop: 2 }}>
                    {trackedOrder.paymentMethod.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Items in this order */}
              <div
                style={{
                  background: 'white',
                  padding: '14px 18px',
                  borderRadius: 12,
                  border: '1px solid #EADCCE',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6B564C', marginBottom: 10 }}>
                  {language === 'np' ? 'अर्डर गरिएका वस्त्रहरू' : 'Ordered Garments'} ({trackedOrder.items.length})
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {trackedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: 13,
                        borderBottom: idx < trackedOrder.items.length - 1 ? '1px solid #F4ECE4' : 'none',
                        paddingBottom: idx < trackedOrder.items.length - 1 ? 8 : 0,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {item.product?.images?.[0] && (
                          <img
                            src={item.product.images[0]}
                            alt="product"
                            style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6 }}
                          />
                        )}
                        <div>
                          <div style={{ fontWeight: 600, color: '#2B1810' }}>
                            {(language === 'np' ? item.product?.title?.np : item.product?.title?.en) ||
                              item.product?.title?.en ||
                              'पोशाक'}
                          </div>
                          <div style={{ fontSize: 11, color: '#6B564C' }}>
                            {language === 'np' ? 'साइज' : 'Size'}: {item.selectedSize} × {item.quantity}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, color: '#8B3A3A' }}>
                        {formatPrice((item.product?.price || 0) * (item.quantity || 1))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* WhatsApp Support CTA */}
              <a
                href={`https://wa.me/9779808251494?text=${encodeURIComponent(
                  `Namaste Dawosti Support! I am tracking order #${trackedOrder.orderNumber} for ${trackedOrder.shippingAddress.fullName}. Could you please give me a delivery update?`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px 18px',
                  background: '#25D366',
                  color: 'white',
                  borderRadius: 10,
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: 13.5,
                  boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)',
                }}
              >
                <MessageCircle size={18} />
                <span>{language === 'np' ? 'अर्डरबारे ह्वाट्सएपमा सोध्नुहोस् (+977 9808251494)' : 'Inquire via WhatsApp Concierge (+977 9808251494)'}</span>
              </a>
            </div>
          ) : hasSearched ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: '#6B564C' }}>
              <Package size={44} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: 18, color: '#2B1810', margin: '0 0 6px 0' }}>
                {language === 'np' ? 'कुनै अर्डर भेटिएन' : 'No Order Found'}
              </h3>
              <p style={{ fontSize: 13, margin: '0 0 16px 0', maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
                {language === 'np'
                  ? 'कृपया तपाईंको अर्डर नम्बर (उदा: DAW-849201) वा चेकआउट गर्दा राखेको १० अंकको फोन नम्बर ठीक छ भनी जाँच्नुहोस्।'
                  : 'Please check that your Order Number or phone matches the details entered during checkout.'}
              </p>
              <a
                href="https://wa.me/9779808251494?text=Namaste%20Dawosti!%20I%20need%20help%20tracking%20my%20recent%20order."
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#25D366',
                  fontWeight: 700,
                  textDecoration: 'none',
                  fontSize: 13,
                }}
              >
                <MessageCircle size={16} />
                <span>Contact WhatsApp Concierge</span>
              </a>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: '#6B564C' }}>
              <Truck size={44} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
              <p style={{ fontSize: 13.5, margin: 0 }}>
                {language === 'np'
                  ? 'तपाईंको अर्डर नम्बर वा सम्पर्क फोन नम्बर माथिको बाकसमा लेखी ट्र्याक गर्नुहोस्।'
                  : 'Enter your order reference code or registered phone number above.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
