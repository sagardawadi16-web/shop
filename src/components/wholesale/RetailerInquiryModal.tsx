import React, { useState } from 'react';
import { X, Building2, Phone, Mail, MapPin, CheckCircle2, MessageCircle, Sparkles, Download, Layers } from 'lucide-react';
import { useRetailerStore } from '../../stores/retailerStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { RetailerStoreType } from '../../types';

export const RetailerInquiryModal: React.FC = () => {
  const { isWholesaleModalOpen, closeWholesaleModal, submitInquiry, isSubmitting } = useRetailerStore();
  const { language, merchant } = useSettingsStore();

  const [submitted, setSubmitted] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Nepal');
  const [storeType, setStoreType] = useState<RetailerStoreType>('physical_boutique');
  const [estimatedBudget, setEstimatedBudget] = useState('50000');
  const [categories, setCategories] = useState<string[]>(['dhaka_fusion', 'pashmina']);
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');

  if (!isWholesaleModalOpen) return null;

  const handleCategoryToggle = (catId: string) => {
    setCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return; // Silent reject for spam bots

    try {
      await submitInquiry({
        storeName,
        contactPerson,
        phone,
        whatsappNumber: phone,
        email,
        city: city || 'Kathmandu',
        country: country || 'Nepal',
        storeType,
        estimatedMonthlyBudgetNpr: Number(estimatedBudget) || 0,
        categoriesOfInterest: categories,
        message,
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit retailer inquiry:', err);
    }
  };

  const getWhatsAppDeepLink = () => {
    const text = encodeURIComponent(
      `Namaste Sagar! I submitted a Retailer / Stockist inquiry for "${storeName}" (${city}, ${country}). We are interested in stocking Dawosti collections. Let's discuss wholesale terms!`
    );
    return `https://wa.me/${merchant.whatsappNumber || '9779708251494'}?text=${text}`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        backgroundColor: 'rgba(43, 24, 16, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={closeWholesaleModal}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 680,
          backgroundColor: '#FAF2E9',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(43, 24, 16, 0.4)',
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
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid #D4AF37',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'rgba(212, 175, 55, 0.2)',
                border: '1px solid #D4AF37',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Building2 size={20} color="#D4AF37" />
            </span>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 700,
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  letterSpacing: '0.04em',
                }}
              >
                {language === 'np' ? 'थोक तथा खुद्रा साझेदार नेटवर्क' : 'Dawosti Stockist & Wholesale Network'}
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255, 248, 240, 0.75)' }}>
                {language === 'np'
                  ? 'नेपाल तथा विदेशमा डावोस्ती फेसन संग्रह प्रदर्शन गर्नुहोस्'
                  : 'Stock handcrafted Nepali haute couture & heritage wear in your store'}
              </p>
            </div>
          </div>

          <button
            onClick={closeWholesaleModal}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF8F0',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto' }}>
          {submitted ? (
            /* Success Screen */
            <div style={{ textAlign: 'center', padding: '24px 8px' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(75, 155, 72, 0.15)',
                  border: '2px solid #4B9B48',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <CheckCircle2 size={36} color="#4B9B48" />
              </div>

              <h4
                style={{
                  fontSize: 22,
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontWeight: 700,
                  color: '#2B1810',
                  marginBottom: 8,
                }}
              >
                {language === 'np' ? 'धन्यवाद! तपाईंको आवेदन प्राप्त भयो।' : 'Inquiry Received Successfully!'}
              </h4>

              <p style={{ fontSize: 14, color: '#6B564C', maxWidth: 480, margin: '0 auto 24px', lineHeight: 1.6 }}>
                {language === 'np'
                  ? `हाम्रो फेसन टोलीले "${storeName}" का लागि थोक मूल्य, क्याटलग र MOQ विवरणसहित २४ घण्टाभित्र सम्पर्क गर्नेछ।`
                  : `Thank you for choosing Dawosti. Our atelier team will review ${storeName}'s profile and contact you within 24 hours with our complete line sheet and wholesale margins.`}
              </p>

              {/* Instant WhatsApp Action */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360, margin: '0 auto' }}>
                <a
                  href={getWhatsAppDeepLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    padding: '12px 20px',
                    borderRadius: 99,
                    backgroundColor: '#25D366',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: 14,
                    boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
                  }}
                >
                  <MessageCircle size={18} />
                  <span>{language === 'np' ? 'ह्वाट्सएपमा सिधै कुरा गर्नुहोस्' : 'Connect on WhatsApp Now'}</span>
                </a>

                <button
                  onClick={closeWholesaleModal}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 99,
                    backgroundColor: 'transparent',
                    border: '1.5px solid #EADCCE',
                    color: '#6B564C',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  {language === 'np' ? 'बन्द गर्नुहोस्' : 'Return to Store'}
                </button>
              </div>
            </div>
          ) : (
            /* Inquiry Form */
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Partner Benefits Banner */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(86,31,31,0.06) 0%, rgba(212,175,55,0.12) 100%)',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 12,
                  fontSize: 12,
                  color: '#561F1F',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={16} color="#D4AF37" />
                  <span><strong>MOQ:</strong> {language === 'np' ? 'मात्र १५ थानबाट सुरु' : 'Low MOQ (15 pcs starter)'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Layers size={16} color="#D4AF37" />
                  <span><strong>Margins:</strong> 35% – 45% {language === 'np' ? 'थोक छुट' : 'Wholesale Margin'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Download size={16} color="#D4AF37" />
                  <span>{language === 'np' ? 'निःशुल्क डिजिटल क्याटलग' : 'Digital Lookbook Included'}</span>
                </div>
              </div>

              {/* Bot Honeypot */}
              <div style={{ display: 'none' }}>
                <input
                  type="text"
                  name="website_trap"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {/* Form Grid Row 1: Store Name & Contact Person */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#2B1810', marginBottom: 6 }}>
                    {language === 'np' ? 'पसल वा बुटिकको नाम *' : 'Boutique / Store Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g. Maya Concept Store / Himalayan Silks"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1.5px solid #EADCCE',
                      background: '#FFFFFF',
                      fontSize: 13,
                      color: '#2B1810',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#2B1810', marginBottom: 6 }}>
                    {language === 'np' ? 'सम्पर्क व्यक्ति *' : 'Contact Person / Buyer *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Sagar Shrestha (Store Director)"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1.5px solid #EADCCE',
                      background: '#FFFFFF',
                      fontSize: 13,
                      color: '#2B1810',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Form Grid Row 2: WhatsApp Phone & Email */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#2B1810', marginBottom: 6 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Phone size={13} color="#8B3A3A" />
                      {language === 'np' ? 'ह्वाट्सएप / फोन नम्बर *' : 'WhatsApp / Mobile Number *'}
                    </span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +977 98XXXXXXXX or +61 4XXXXXXXX"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1.5px solid #EADCCE',
                      background: '#FFFFFF',
                      fontSize: 13,
                      color: '#2B1810',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#2B1810', marginBottom: 6 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Mail size={13} color="#8B3A3A" />
                      {language === 'np' ? 'व्यावसायिक इमेल ठेगाना' : 'Business Email'}
                    </span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. buyer@boutique.com"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1.5px solid #EADCCE',
                      background: '#FFFFFF',
                      fontSize: 13,
                      color: '#2B1810',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Form Grid Row 3: City, Country & Store Type */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#2B1810', marginBottom: 6 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={13} color="#8B3A3A" />
                      {language === 'np' ? 'सहर' : 'City'}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Kathmandu / Sydney / London"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1.5px solid #EADCCE',
                      background: '#FFFFFF',
                      fontSize: 13,
                      color: '#2B1810',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#2B1810', marginBottom: 6 }}>
                    {language === 'np' ? 'देश' : 'Country'}
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1.5px solid #EADCCE',
                      background: '#FFFFFF',
                      fontSize: 13,
                      color: '#2B1810',
                      outline: 'none',
                    }}
                  >
                    <option value="Nepal">Nepal</option>
                    <option value="Australia">Australia</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="United States">United States</option>
                    <option value="Japan">Japan</option>
                    <option value="Canada">Canada</option>
                    <option value="India">India</option>
                    <option value="Other">Other International</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#2B1810', marginBottom: 6 }}>
                    {language === 'np' ? 'व्यवसाय प्रकार' : 'Store Type'}
                  </label>
                  <select
                    value={storeType}
                    onChange={(e) => setStoreType(e.target.value as RetailerStoreType)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1.5px solid #EADCCE',
                      background: '#FFFFFF',
                      fontSize: 13,
                      color: '#2B1810',
                      outline: 'none',
                    }}
                  >
                    <option value="physical_boutique">Physical Boutique / Concept Store</option>
                    <option value="online_store">Online Fashion Store</option>
                    <option value="diaspora_store">Nepali Diaspora Boutique (Abroad)</option>
                    <option value="departmental">Departmental / Multi-brand Chain</option>
                    <option value="distributor">Regional Wholesaler / Distributor</option>
                  </select>
                </div>
              </div>

              {/* Collections of Interest */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#2B1810', marginBottom: 8 }}>
                  {language === 'np' ? 'रुचि भएको संग्रहहरू (कुनै एक वा बढी चयन गर्नुहोस्)' : 'Collections of Interest'}
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    { id: 'dhaka_fusion', label: '🇳🇵 Dhaka Fusion & Heritage' },
                    { id: 'pashmina', label: '🧣 Luxury Himalayan Pashmina' },
                    { id: 'festive_kurtha', label: '🪔 Festive & Boutique Kurthas' },
                    { id: 'bridal_lehenga', label: '👑 Bridal & Bespoke Occasion' },
                    { id: 'mens_fusion', label: '👔 Men\'s Traditional & Modern Cuts' },
                  ].map((cat) => {
                    const isSelected = categories.includes(cat.id);
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => handleCategoryToggle(cat.id)}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 99,
                          border: isSelected ? '1.5px solid #8B3A3A' : '1.5px solid #EADCCE',
                          backgroundColor: isSelected ? '#8B3A3A' : '#FFFFFF',
                          color: isSelected ? '#FFFFFF' : '#2B1810',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message / Additional Information */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#2B1810', marginBottom: 6 }}>
                  {language === 'np' ? 'सन्देश वा थप विवरण' : 'Message / Specific Requirements'}
                </label>
                <textarea
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    language === 'np'
                      ? 'तपाईंको पसलको स्थान, अनुमानित अर्डर मात्रा वा विशेष माग...'
                      : 'Tell us about your boutique location, estimated opening order, or specific product lines...'
                  }
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1.5px solid #EADCCE',
                    background: '#FFFFFF',
                    fontSize: 13,
                    color: '#2B1810',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '13px 24px',
                  borderRadius: 99,
                  backgroundColor: '#8B3A3A',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(139, 58, 58, 0.3)',
                  transition: 'background 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 6,
                }}
              >
                {isSubmitting ? (
                  <span>{language === 'np' ? 'पठाउँदैछ...' : 'Submitting Application...'}</span>
                ) : (
                  <>
                    <Building2 size={16} />
                    <span>{language === 'np' ? 'थोक साझेदारी आवेदन पठाउनुहोस्' : 'Submit Retailer Application'}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
