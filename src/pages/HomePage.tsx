import React, { useEffect, useRef, useState } from 'react';
import { Filter, Grid3X3, LayoutList, SlidersHorizontal, X } from 'lucide-react';
import { ProductCard } from '../products/ProductCard';
import { ProductDetailModal } from '../products/ProductDetailModal';
import { useProductStore } from '../../stores/productStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { CATEGORIES } from '../../mockData';

export const HomePage: React.FC = () => {
  const { language, theme, merchant, siteContent } = useSettingsStore();
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
        color: 'white', padding: 'clamp(60px, 10vw, 100px) 24px',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        {/* decorative circles */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(212,175,55,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 400, height: 400, borderRadius: '50%', background: 'rgba(212,175,55,0.05)' }} />

        <div style={{ position: 'relative', maxWidth: 700, margin: '0 auto' }}>
          <div style={{ fontSize: 12, letterSpacing: '0.3em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 16, fontWeight: 700 }}>
            {language === 'np' ? 'स्वागत छ • DAWOSTI बुटिक' : 'Welcome to • DAWOSTI Boutique'}
          </div>
          <h1 className="section-title" style={{ color: 'white', fontSize: 'clamp(36px, 7vw, 72px)', marginBottom: 20, lineHeight: 1.1 }}>
            {heroHeadline}
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2.5vw, 19px)', color: 'rgba(255,255,255,0.75)', marginBottom: 36, lineHeight: 1.7 }}>
            {heroSubtext}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => { setSelectedCategory('all'); productsRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
              className="btn btn-gold"
              style={{ fontSize: 15, padding: '12px 28px' }}
            >
              Shop Collection
            </button>
            <button
              onClick={() => { setSelectedCategory('cat-festive'); productsRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
              className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'white', fontSize: 15, padding: '12px 28px' }}
            >
              🪔 Festive Picks
            </button>
          </div>
        </div>
      </section>

      {/* Category chips */}
      <section style={{ padding: '28px 24px 0', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
          {CATEGORIES.map((cat) => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
              className={`chip ${selectedCategory === cat.id ? 'active' : ''}`}
              style={{ flexShrink: 0 }}>
              {language === 'np' ? cat.name.np : cat.name.en}
            </button>
          ))}
        </div>
      </section>

      {/* Products section */}
      <section ref={productsRef} style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px 60px' }}>
        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 className="section-title" style={{ fontSize: 'clamp(24px, 4vw, 36px)' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: isGridView ? 'repeat(auto-fill, minmax(240px, 1fr))' : '1fr', gap: 20 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: isGridView ? 380 : 100, borderRadius: 16 }} />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--brown-light)' }}>
            <Filter size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24 }}>No products found</h3>
            <p style={{ fontSize: 14, marginTop: 8 }}>Try adjusting your filters or search query</p>
            <button onClick={() => { setSelectedCategory('all'); setInStockOnly(false); }} className="btn btn-primary" style={{ marginTop: 20 }}>
              <X size={14} /> Clear All Filters
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isGridView ? 'repeat(auto-fill, minmax(240px, 1fr))' : '1fr',
            gap: isGridView ? 20 : 12,
          }}>
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
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
