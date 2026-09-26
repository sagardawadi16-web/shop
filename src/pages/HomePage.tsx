import React, { useEffect, useRef, useState } from 'react';
import { Filter, Grid3X3, LayoutList, SlidersHorizontal, X, Building2, Sparkles, ArrowRight } from 'lucide-react';
import { ProductCard } from '../components/products/ProductCard';
import { ProductDetailModal } from '../components/products/ProductDetailModal';
import { DiscordIcon } from '../components/common/DiscordIcon';
import { GuildCategoryShowcase } from '../components/home/GuildCategoryShowcase';
import { useProductStore } from '../stores/productStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useRetailerStore } from '../stores/retailerStore';
import { CATEGORIES } from '../mockData';

export const HomePage: React.FC = () => {
  const { language, theme, merchant, siteContent } = useSettingsStore();
  const { openWholesaleModal } = useRetailerStore();
  const {
    filteredProducts, selectedCategory, setSelectedCategory,
    searchQuery, sortBy, setSortBy, inStockOnly, setInStockOnly,
    isProductGridLoading, activeDetailProduct, setActiveDetailProduct,
    activeQuickViewProduct, setActiveQuickViewProduct,
  } = useProductStore();

  const [isGridView, setIsGridView] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const productsRef = useRef<HTMLDivElement>(null);

  // Announcement bar
  const bannerText = language === 'np' ? theme.bannerText.np : theme.bannerText.en;
  const heroHeadline = language === 'np' ? siteContent.heroHeadline.np : siteContent.heroHeadline.en;
  const heroSubtext = language === 'np' ? siteContent.heroSubtext.np : siteContent.heroSubtext.en;

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Announcement bar */}
      {theme.showAnnouncementBar && (
        <div className="announcement-bar" style={{ background: theme.isDashainTheme ? '#5B1A00' : 'var(--brown)' }}>
          <span>{theme.isDashainTheme ? '🪔 ' : ''}{bannerText}</span>
        </div>
      )}

      {/* Hero */}
      <section style={{
        background: `linear-gradient(135deg, #2B1810 0%, #8B3A3A 50%, #5C1F1F 100%)`,
        color: 'white', padding: 'clamp(44px, 8vw, 90px) 16px',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        {/* decorative circles */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(212,175,55,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 400, height: 400, borderRadius: '50%', background: 'rgba(212,175,55,0.05)' }} />

        <div style={{ position: 'relative', maxWidth: 700, margin: '0 auto' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.25em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 14, fontWeight: 700 }}>
            {language === 'np' ? 'स्वागत छ • DAWOSTI बुटिक' : 'Welcome to • DAWOSTI Boutique'}
          </div>
          <h1 className="section-title" style={{ color: 'white', fontSize: 'clamp(26px, 6vw, 64px)', marginBottom: 16, lineHeight: 1.15 }}>
            {heroHeadline}
          </h1>
          <p style={{ fontSize: 'clamp(14px, 2.2vw, 18px)', color: 'rgba(255,255,255,0.8)', marginBottom: 28, lineHeight: 1.6 }}>
            {heroSubtext}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => { setSelectedCategory('all'); productsRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
              className="btn btn-gold"
              style={{ fontSize: 14, padding: '10px 24px' }}
            >
              Shop Collection
            </button>
            <button
              onClick={() => { setSelectedCategory('cat-festive'); productsRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
              className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'white', fontSize: 14, padding: '10px 24px' }}
            >
              🪔 Festive Picks
            </button>
          </div>
        </div>
      </section>

      {/* Dawosti Fashion Guild & AI Art Category Section */}
      {theme.showGuildSection && <GuildCategoryShowcase />}

      {/* Products section */}
      <section id="product-catalog" ref={productsRef} style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px 60px' }}>
        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 className="section-title" style={{ fontSize: 'clamp(20px, 3.5vw, 32px)' }}>
              {selectedCategory === 'all'
                ? (language === 'np' ? 'सबै संग्रह' : 'Full Collection')
                : (language === 'np' ? CATEGORIES.find((c) => c.id === selectedCategory)?.name.np : CATEGORIES.find((c) => c.id === selectedCategory)?.name.en)}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--brown-light)', marginTop: 2 }}>
              {filteredProducts.length} {language === 'np' ? 'उत्पादन' : 'products'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Sort */}
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
              style={{ padding: '8px 12px', borderRadius: 10, border: '1.5px solid var(--cream)', fontFamily: 'Inter', fontSize: 13, color: 'var(--brown)', background: 'white', cursor: 'pointer', outline: 'none' }}>
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low → High</option>
              <option value="price-high">Price: High → Low</option>
              <option value="rating">Highest Rated</option>
            </select>

            {/* Filter toggle */}
            <button onClick={() => setShowFilters((v) => !v)}
              className={`btn ${showFilters ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '8px 14px', fontSize: 13 }}>
              <SlidersHorizontal size={14} /> Filters
              {inStockOnly && <span style={{ background: 'var(--gold)', color: 'var(--brown)', borderRadius: 99, padding: '0 6px', fontSize: 10, fontWeight: 800 }}>1</span>}
            </button>

            {/* View toggle */}
            <div style={{ display: 'flex', background: 'var(--ivory-dark)', borderRadius: 10, padding: 3, border: '1px solid var(--cream)' }}>
              <button onClick={() => setIsGridView(true)} style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: isGridView ? 'white' : 'transparent', cursor: 'pointer', color: isGridView ? 'var(--burgundy)' : 'var(--brown-light)', display: 'flex', boxShadow: isGridView ? 'var(--shadow-sm)' : 'none', transition: 'var(--transition)' }}>
                <Grid3X3 size={16} />
              </button>
              <button onClick={() => setIsGridView(false)} style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: !isGridView ? 'white' : 'transparent', cursor: 'pointer', color: !isGridView ? 'var(--burgundy)' : 'var(--brown-light)', display: 'flex', boxShadow: !isGridView ? 'var(--shadow-sm)' : 'none', transition: 'var(--transition)' }}>
                <LayoutList size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Category Quick-Filter Bar (1-tap on mobile & desktop) */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 10,
            marginBottom: 20,
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
          className="no-scrollbar"
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '7px 16px',
                  borderRadius: 99,
                  fontSize: 13,
                  fontWeight: isSelected ? 700 : 500,
                  whiteSpace: 'nowrap',
                  border: isSelected ? '1.5px solid #8B3A3A' : '1px solid #EADCCE',
                  background: isSelected ? '#8B3A3A' : 'white',
                  color: isSelected ? 'white' : '#2B1810',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 2px 8px rgba(139, 58, 58, 0.25)' : 'none',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
              >
                {language === 'np' ? cat.name.np : cat.name.en}
              </button>
            );
          })}
        </div>

        {/* Filter bar */}
        {showFilters && (
          <div className="card animate-fadeInDown" style={{ padding: '14px 20px', marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, color: 'var(--brown)' }}>
              <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} style={{ width: 16, height: 16 }} />
              In Stock Only
            </label>
            <button onClick={() => { setInStockOnly(false); }} style={{ background: 'none', border: 'none', color: 'var(--burgundy)', fontSize: 13, cursor: 'pointer', fontWeight: 600, marginLeft: 'auto' }}>
              Clear Filters
            </button>
          </div>
        )}

        {/* Product grid */}
        {isProductGridLoading ? (
          <div className={`products-grid-layout ${!isGridView ? 'list-view' : ''}`}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: isGridView ? 320 : 100, borderRadius: 16 }} />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 16px', color: 'var(--brown-light)' }}>
            <Filter size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24 }}>No products found</h3>
            <p style={{ fontSize: 14, marginTop: 8 }}>Try adjusting your filters or search query</p>
            <button onClick={() => { setSelectedCategory('all'); setInStockOnly(false); }} className="btn btn-primary" style={{ marginTop: 20 }}>
              <X size={14} /> Clear All Filters
            </button>
          </div>
        ) : (
          <div className={`products-grid-layout ${!isGridView ? 'list-view' : ''}`}>
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Editorial B2B Stockist & Guild Spotlight Section */}
      <section
        style={{
          background: 'linear-gradient(135deg, #2B1810 0%, #561F1F 50%, #2B1810 100%)',
          borderTop: '2px solid #D4AF37',
          borderBottom: '2px solid #D4AF37',
          color: '#FFF8F0',
          padding: 'clamp(48px, 6vw, 72px) 20px',
          position: 'relative',
          overflow: 'hidden',
          marginTop: 20,
        }}
      >
        <div style={{ position: 'absolute', top: -100, right: -100, width: 350, height: 350, borderRadius: '50%', background: 'rgba(212,175,55,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(212,175,55,0.04)' }} />

        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 14px', borderRadius: 99, background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.4)', marginBottom: 16 }}>
            <Sparkles size={14} color="#D4AF37" />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#D4AF37' }}>
              {language === 'np' ? 'बुटिक तथा खुद्रा साझेदारी' : 'Atelier Stockist & Retail Guild'}
            </span>
          </div>

          <h2
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 'clamp(28px, 4.5vw, 46px)',
              fontWeight: 700,
              color: '#FFF8F0',
              lineHeight: 1.2,
              marginBottom: 16,
              letterSpacing: '0.02em',
            }}
          >
            {language === 'np'
              ? 'तपाईंको बुटिकमा डावोस्तीका विशिष्ट फेसन संग्रह प्रदर्शन गर्नुहोस्'
              : 'Bring Kathmandu’s Finest Heritage & Contemporary Couture to Your Store'}
          </h2>

          <p
            style={{
              fontSize: 'clamp(14px, 2vw, 16px)',
              color: 'rgba(255, 248, 240, 0.82)',
              maxWidth: 680,
              margin: '0 auto 28px',
              lineHeight: 1.7,
            }}
          >
            {language === 'np'
              ? 'नेपाल, अष्ट्रेलिया, बेलायत तथा अमेरिकाका बहु-ब्रान्ड बुटिकहरूका लागि विशेष थोक दर (३५%–४५% छुट), १५ थानको सुरुवाती MOQ र डिजिटल लाइन सिट उपलब्ध छ।'
              : 'Partner with Dawosti Boutique. Curated wholesale access for concept stores, multi-brand boutiques, and diaspora stockists with low 15-piece MOQs, generous wholesale margins, and reliable worldwide express shipping.'}
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={openWholesaleModal}
              className="btn btn-gold"
              style={{
                fontSize: 14,
                padding: '12px 28px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                boxShadow: '0 4px 18px rgba(212,175,55,0.35)',
              }}
            >
              <Building2 size={16} />
              <span>{language === 'np' ? 'थोक साझेदार बन्न आवेदन दिनुहोस्' : 'Apply as Retail Stockist'}</span>
            </button>

            <a
              href="https://discord.gg/9Z7CzTraET"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
              style={{
                borderColor: '#D4AF37',
                color: '#FFF8F0',
                fontSize: 14,
                padding: '12px 24px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <DiscordIcon size={18} color="#D4AF37" />
              <span>{language === 'np' ? 'फेसन गिल्ड हेर्नुहोस्' : 'Visit Fashion Guild'}</span>
              <ArrowRight size={15} color="#D4AF37" />
            </a>
          </div>
        </div>
      </section>

      {/* Product detail modal */}
      {activeDetailProduct && (
        <ProductDetailModal
          product={activeDetailProduct}
          onClose={() => setActiveDetailProduct(null)}
        />
      )}

      {/* Quick view modal (same as detail for now) */}
      {activeQuickViewProduct && !activeDetailProduct && (
        <ProductDetailModal
          product={activeQuickViewProduct}
          onClose={() => setActiveQuickViewProduct(null)}
        />
      )}
    </div>
  );
};
