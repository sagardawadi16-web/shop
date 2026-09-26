import React, { useState } from 'react';
import { ArrowUpRight, Sparkles, MessageSquare, Compass, Eye, ShieldCheck, ChevronRight } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';

interface GuildCategory {
  id: string;
  badge: string;
  name: { en: string; np: string };
  tagline: { en: string; np: string };
  image: string;
  channels: string[];
  themeColor: string;
  roleTitle: string;
}

const GUILD_CATEGORIES: GuildCategory[] = [
  {
    id: 'atelier',
    badge: '🏛️ ATELIER',
    name: {
      en: 'Craft & Haute Couture Critique',
      np: 'शिल्प तथा हाउते कुतुर समालोचना',
    },
    tagline: {
      en: 'Original sketches, Dhaka reimagination, Himalayan raw silks & physical garment prototyping.',
      np: 'मौलिक स्केच, पाल्पाली ढाका पुनर्कल्पना, हिमाली सिल्क र भौतिक पोशाक निर्माण।',
    },
    image: '/images/guild/atelier_heritage_couture.jpg',
    channels: ['#design-submissions', '#peer-critique', '#heritage-and-textile'],
    themeColor: '#8A1C2E', // Velvet Burgundy
    roleTitle: '🏛️ Couturier',
  },
  {
    id: 'salon',
    badge: '👁️ THE SALON',
    name: {
      en: 'Streetwear & Avant-Garde',
      np: 'स्ट्रिटवेयर तथा आधुनिक फेसन',
    },
    tagline: {
      en: 'Kathmandu cyberpunk subcultures, oversized technical drapes, and global runway editorial analysis.',
      np: 'काठमाडौँ आधुनिक स्ट्रिट संस्कृति, समकालीन आउटरवेयर र विश्वव्यापी रनवे विश्लेषण।',
    },
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
    channels: ['#streetwear-and-avant-garde', '#runway-and-editorial', '#curated-moodboards'],
    themeColor: '#1B7F5E', // Emerald Jade
    roleTitle: '✂️ Artisan',
  },
  {
    id: 'vanguard',
    badge: '👑 VANGUARD',
    name: {
      en: 'Tastemakers & Council drops',
      np: 'काउन्सिल तथा विशेष संग्रह',
    },
    tagline: {
      en: 'Curated by community consensus. Elevated pieces that transition from Discord concept to Dawosti.com drop.',
      np: 'सामुदायिक सहमतिबाट छानिएका उत्कृष्ट डिजाइनहरू, सिधै दावोस्ती संग्रहमा प्रस्तुत हुने।',
    },
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80',
    channels: ['#announcements-drops', '#guild-roster', '#evolution-log'],
    themeColor: '#D4AF37', // Rich Gold
    roleTitle: '👑 Vanguard',
  },
  {
    id: 'archive',
    badge: '📜 DAWOSTI ARCHIVE',
    name: {
      en: 'Heritage Weaves & Timeless Roots',
      np: 'मौलिक बुनाई र ऐतिहासिक धरोहर',
    },
    tagline: {
      en: 'Ethically sourced Himalayan hemp, wild nettle yarn, and centuries-old Newari master tailoring.',
      np: 'वातावरणमैत्री हिमाली गाँजा र अल्लो धागो, ऐतिहासिक नेवारी परम्परागत बुनाई।',
    },
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80',
    channels: ['#manifesto-and-rules', '#heritage-archive', '#ethical-sourcing'],
    themeColor: '#4A1521', // Deep Burgundy Crimson
    roleTitle: '🪡 Atelier',
  },
];

export const GuildCategoryShowcase: React.FC = () => {
  const { language } = useSettingsStore();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <section
      style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: 'clamp(32px, 5vw, 64px) 16px 20px',
      }}
    >
      {/* Header Banner with Discord Guild Branding */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 28,
          borderBottom: '1.5px solid #EADCCE',
          paddingBottom: 16,
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#8A1C2E',
              color: '#FFF8F0',
              padding: '5px 14px',
              borderRadius: 99,
              fontSize: 11.5,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 10,
              boxShadow: '0 2px 10px rgba(138,28,46,0.25)',
            }}
          >
            <img
              src="/discord_logo_burgundy.png"
              alt="Dawosti Guild"
              style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover', border: '1px solid #D4AF37' }}
            />
            <span>DAWOSTI GUILD • DISCORD REALM</span>
          </div>

          <h2
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 'clamp(24px, 4vw, 38px)',
              fontWeight: 700,
              color: '#2B1810',
              lineHeight: 1.15,
              margin: 0,
            }}
          >
            {language === 'np'
              ? 'दावोस्ती फेसन गिल्ड तथा एआई-आर्ट क्याटागोरी'
              : 'Dawosti Fashion Guild & Aesthetic Categories'}
          </h2>
          <p
            style={{
              fontSize: 'clamp(13px, 1.8vw, 15px)',
              color: '#6B564C',
              marginTop: 6,
              maxWidth: 720,
              lineHeight: 1.5,
              margin: '6px 0 0 0',
            }}
          >
            {language === 'np'
              ? 'नेपालको मौलिक सम्पदा र आधुनिक स्ट्रिटवेयरलाई जोड्ने खुला डिजाइनर समुदाय। डिस्कर्डमा आफ्नो डिजाइन पेश गर्नुहोस् वा समालोचनामा सामेल हुनुहोस्।'
              : 'Merging Himalayan textile heritage with avant-garde streetwear. Discover design concepts cultivated by verified creators in our Discord Guild.'}
          </p>
        </div>

        <a
          href="https://discord.gg/9Z7CzTraET"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            background: 'linear-gradient(135deg, #8A1C2E 0%, #5C121E 100%)',
            color: '#FFF8F0',
            padding: '10px 20px',
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 700,
            textDecoration: 'none',
            border: '1px solid #D4AF37',
            boxShadow: '0 4px 16px rgba(138,28,46,0.3)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(138,28,46,0.45)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(138,28,46,0.3)';
          }}
        >
          <img
            src="/discord_logo_burgundy.png"
            alt="Discord"
            style={{ width: 22, height: 22, borderRadius: '50%', border: '1px solid #D4AF37' }}
          />
          <span>{language === 'np' ? 'गिल्डमा जोडिनुहोस्' : 'Join Discord Guild'}</span>
          <ArrowUpRight size={15} color="#D4AF37" />
        </a>
      </div>

      {/* Grid of 4 Curated Category Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 270px), 1fr))',
          gap: 20,
        }}
      >
        {GUILD_CATEGORIES.map((cat) => {
          const isHovered = hoveredCard === cat.id;

          return (
            <div
              key={cat.id}
              onMouseEnter={() => setHoveredCard(cat.id)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                position: 'relative',
                borderRadius: 18,
                overflow: 'hidden',
                background: '#2B1810',
                border: isHovered ? `2px solid ${cat.themeColor}` : '1.5px solid #EADCCE',
                boxShadow: isHovered
                  ? '0 16px 36px rgba(43,24,16,0.22)'
                  : '0 4px 14px rgba(43,24,16,0.06)',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 390,
                transform: isHovered ? 'translateY(-4px)' : 'none',
              }}
            >
              {/* Background Artwork */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 0,
                }}
              >
                <img
                  src={cat.image}
                  alt={cat.name.en}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: isHovered ? 'brightness(0.9) contrast(1.05)' : 'brightness(0.72) contrast(1.02)',
                    transition: 'transform 0.5s ease, filter 0.3s ease',
                    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                  }}
                />
                {/* Gradient scrim for high readability */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(180deg, rgba(20,8,6,0.3) 0%, rgba(20,8,6,0.6) 45%, rgba(15,5,4,0.94) 100%)',
                  }}
                />
              </div>

              {/* Card Header Content */}
              <div style={{ position: 'relative', zIndex: 1, padding: 20 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      background: 'rgba(255, 248, 240, 0.92)',
                      color: cat.themeColor,
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      padding: '4px 10px',
                      borderRadius: 99,
                      border: `1px solid ${cat.themeColor}`,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                    }}
                  >
                    {cat.badge}
                  </span>

                  <span
                    style={{
                      fontSize: 11,
                      color: '#D4AF37',
                      fontWeight: 700,
                      background: 'rgba(0,0,0,0.5)',
                      padding: '3px 8px',
                      borderRadius: 6,
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    {cat.roleTitle}
                  </span>
                </div>
              </div>

              {/* Card Footer Content */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 1,
                  padding: 20,
                  marginTop: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <h3
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#FFF8F0',
                    lineHeight: 1.2,
                    margin: 0,
                    textShadow: '0 2px 8px rgba(0,0,0,0.6)',
                  }}
                >
                  {language === 'np' ? cat.name.np : cat.name.en}
                </h3>

                <p
                  style={{
                    fontSize: 12.5,
                    color: 'rgba(255, 248, 240, 0.82)',
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {language === 'np' ? cat.tagline.np : cat.tagline.en}
                </p>

                {/* Channel Chips */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                  {cat.channels.map((ch) => (
                    <span
                      key={ch}
                      style={{
                        fontSize: 10.5,
                        fontFamily: 'monospace',
                        color: 'rgba(255, 248, 240, 0.9)',
                        background: 'rgba(255, 255, 255, 0.12)',
                        backdropFilter: 'blur(4px)',
                        padding: '3px 8px',
                        borderRadius: 6,
                        border: '1px solid rgba(255, 255, 255, 0.16)',
                      }}
                    >
                      {ch}
                    </span>
                  ))}
                </div>

                {/* Direct Action Link to Discord */}
                <a
                  href="https://discord.gg/9Z7CzTraET"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    marginTop: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 10,
                    background: isHovered ? cat.themeColor : 'rgba(255, 255, 255, 0.1)',
                    color: '#FFF8F0',
                    textDecoration: 'none',
                    fontSize: 12,
                    fontWeight: 700,
                    transition: 'all 0.2s',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  <span>{language === 'np' ? 'च्यानलमा प्रवेश गर्नुहोस्' : 'Enter Guild Category'}</span>
                  <ChevronRight size={14} />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
