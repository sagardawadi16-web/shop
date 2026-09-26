import React from 'react';
import { Sparkles, MapPin, Phone, Mail, MessageCircle, Building2, Award } from 'lucide-react';
import { DiscordIcon } from '../common/DiscordIcon';
import { useSettingsStore } from '../../stores/settingsStore';
import { useProductStore } from '../../stores/productStore';
import { useRetailerStore } from '../../stores/retailerStore';
import { useReferralStore } from '../../stores/referralStore';
import { useAdminStore } from '../../stores/adminStore';
import { CATEGORIES } from '../../mockData';

export const Footer: React.FC = () => {
  const { language, siteContent, merchant } = useSettingsStore();
  const { setSelectedCategory } = useProductStore();
  const { openWholesaleModal } = useRetailerStore();
  const { openCreatorPortal } = useReferralStore();
  const { openAdmin } = useAdminStore();

  const handleCategoryClick = (catId: string) => {
    setSelectedCategory(catId);
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  return (
    <footer
      id="main-footer"
      style={{
        backgroundColor: '#561F1F',
        color: '#FFF8F0',
        borderTop: '2px solid #D4AF37',
        paddingTop: 48,
        paddingBottom: 32,
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        {/* Main 4-Column Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 36,
            paddingBottom: 40,
            borderBottom: '1px solid rgba(212, 175, 55, 0.25)',
          }}
        >
          {/* Col 1: Brand & Craftsmanship */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, transform: 'rotate(45deg)', backgroundColor: '#D4AF37' }} />
              <span
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 26,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  color: '#FFF8F0',
                  textTransform: 'uppercase',
                }}
              >
                DAWOSTI
              </span>
              <span style={{ width: 8, height: 8, transform: 'rotate(45deg)', backgroundColor: '#D4AF37' }} />
            </div>

            <p style={{ fontSize: 13, color: 'rgba(255, 248, 240, 0.8)', lineHeight: 1.7, maxWidth: 320 }}>
              {language === 'np'
                ? 'काठमाडौँको ऐतिहासिक परम्परा र आधुनिक फेसनको अनुपम संगम। मौलिक ढाका, पश्मिना, कुर्था तथा लेहेंगाहरूको विशिष्ट संग्रह।'
                : siteContent.heroSubtext.en}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#D4AF37', fontWeight: 600 }}>
              <Sparkles size={16} />
              <span>
                {language === 'np' ? 'काठमाडौँमा हस्तनिर्मित बुटिक फेसन' : 'Handcrafted in Kathmandu, Nepal'}
              </span>
            </div>
          </div>

          {/* Col 2: Collections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h4
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 16,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#D4AF37',
              }}
            >
              {language === 'np' ? 'फेसन संग्रह' : 'Collections'}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 248, 240, 0.8)',
                    fontSize: 13,
                    textAlign: 'left',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#D4AF37')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 248, 240, 0.8)')}
                >
                  {language === 'np' ? cat.name.np : cat.name.en}
                </button>
              ))}
            </div>
          </div>

          {/* Col 3: Customer Care & Atelier */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h4
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 16,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#D4AF37',
              }}
            >
              {language === 'np' ? 'ग्राहक सेवा तथा साझेदारी' : 'Customer Care & Guild'}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'rgba(255, 248, 240, 0.8)' }}>
              <span>{language === 'np' ? 'साइज गाइड' : 'Boutique Size Guide'}</span>
              <span>{language === 'np' ? 'डेलिभरी र भुक्तानी' : 'Delivery & Payment Policy'}</span>
              <span>{language === 'np' ? 'पश्मिना तथा ढाका स्याहार' : 'Pashmina & Dhaka Care'}</span>
              
              {/* B2B Wholesale Stockist Modal Trigger */}
              <button
                onClick={openWholesaleModal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#D4AF37',
                  fontSize: 13,
                  textAlign: 'left',
                  cursor: 'pointer',
                  padding: 0,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'opacity 0.2s',
                }}
              >
                <Building2 size={14} color="#D4AF37" />
                <span>{language === 'np' ? 'थोक तथा खुद्रा साझेदार (B2B)' : 'B2B Wholesale & Stockists'}</span>
              </button>

              {/* Creator Affiliate & Earn Trigger */}
              <button
                onClick={openCreatorPortal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1B7F5E',
                  fontSize: 13,
                  textAlign: 'left',
                  cursor: 'pointer',
                  padding: 0,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'opacity 0.2s',
                }}
              >
                <Award size={14} color="#1B7F5E" />
                <span>{language === 'np' ? 'इन्फ्लुएन्सर पार्टनर (कमाउनुहोस्)' : 'Creator Affiliate (Earn 10k)'}</span>
              </button>

              <a
                href="https://discord.gg/9Z7CzTraET"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#D4AF37',
                  textDecoration: 'none',
                  fontWeight: 600,
                  marginTop: 2,
                  fontSize: 12.5,
                }}
              >
                <DiscordIcon size={18} withBurgundyBg />
                <span>{language === 'np' ? 'फेसन गिल्ड (Discord)' : 'Fashion Guild (Discord)'}</span>
                <span style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(138,28,46,0.35)', border: '1px solid #8A1C2E', borderRadius: 4, color: '#D4AF37', textTransform: 'uppercase', fontWeight: 800 }}>
                  Patrons
                </span>
              </a>
            </div>
          </div>


          {/* Col 4: Boutique Location & Contact */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h4
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 16,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#D4AF37',
              }}
            >
              {language === 'np' ? 'काठमाडौँ बुटिक' : 'Kathmandu Boutique'}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'rgba(255, 248, 240, 0.8)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <MapPin size={16} color="#D4AF37" style={{ flexShrink: 0, marginTop: 2 }} />
                <span>New Road (Opposite Bishal Bazar), Kathmandu, Nepal</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Phone size={16} color="#D4AF37" style={{ flexShrink: 0 }} />
                <a href={`tel:${merchant.shopPhone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                  {merchant.shopPhone}
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageCircle size={16} color="#25D366" style={{ flexShrink: 0 }} />
                <a
                  href={`https://wa.me/${merchant.whatsappNumber}?text=${encodeURIComponent('Namaste Dawosti Boutique! I have an inquiry about your collection.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#25D366', textDecoration: 'none', fontWeight: 600 }}
                >
                  WhatsApp: +977 9708251494
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail size={16} color="#D4AF37" style={{ flexShrink: 0 }} />
                <a href={`mailto:${merchant.shopEmail}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                  {merchant.shopEmail}
                </a>
              </div>
            </div>

            {/* Accepted Payments */}
            <div style={{ marginTop: 6 }}>
              <p style={{ fontSize: 11, color: 'rgba(255,248,240,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                {language === 'np' ? 'स्वीकृत भुक्तानी' : 'Accepted Payments'}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <span style={{ padding: '3px 8px', background: '#722E2E', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                  Cash on Delivery
                </span>
                <span style={{ padding: '3px 8px', background: '#4B9B48', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                  eSewa
                </span>
                <span style={{ padding: '3px 8px', background: '#5D2E8E', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                  Khalti
                </span>
                <span style={{ padding: '3px 8px', background: '#D4AF37', color: '#2B1810', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                  Fonepay QR
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Footer */}
        <div
          style={{
            paddingTop: 24,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            fontSize: 12,
            color: 'rgba(255, 248, 240, 0.7)',
          }}
        >
          <p>© {new Date().getFullYear()} DAWOSTI Nepal. {language === 'np' ? 'सर्वाधिकार सुरक्षित।' : 'All rights reserved.'}</p>
          <p style={{ fontSize: 11, color: 'rgba(255, 248, 240, 0.5)' }}>
            Kathmandu, Nepal •{' '}
            <span
              onClick={openAdmin}
              style={{ cursor: 'pointer', textDecoration: 'none' }}
              title="Dawosti Management Console"
            >
              dawosti.com
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
};
