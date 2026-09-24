import React, { useState } from 'react';
import {
  Search, ShoppingBag, Menu, X, Globe, PackageCheck, Sparkles
} from 'lucide-react';
import { DawostiLogo } from '../common/DawostiLogo';
import { useCartStore } from '../../stores/cartStore';
import { useProductStore } from '../../stores/productStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { CATEGORIES } from '../../mockData';

export const Header: React.FC = () => {
  const { count, toggleCart } = useCartStore();
  const { searchQuery, setSearchQuery, selectedCategory, setSelectedCategory } = useProductStore();
  const { language, toggleLanguage, pageView, setPageView, setIsOrderTrackingOpen } = useSettingsStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleCategoryClick = (catId: string) => {
    setSelectedCategory(catId);
    if (pageView !== 'home') {
      setPageView('home');
    }
    setMobileMenuOpen(false);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const handleLogoClick = () => {
    setPageView('home');
    setSelectedCategory('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header
      id="main-header"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        backgroundColor: '#FAF2E9',
        borderBottom: '1px solid #EADCCE',
        boxShadow: '0 2px 10px rgba(43, 24, 16, 0.05)',
      }}
    >
      {/* Top Main Navigation Bar */}
      <div className="main-header-nav">
        {/* Left: Mobile hamburger & Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-only-btn"
            style={{
              background: 'none',
              border: 'none',
              padding: 4,
              cursor: 'pointer',
              color: '#2B1810',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
            <DawostiLogo size={36} />
          </div>
        </div>

        {/* Center: Search input */}
        <div
          style={{
            flex: 1,
            maxWidth: 460,
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
          }}
          className="desktop-search-container"
        >
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: 14,
              color: '#6B564C',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'np'
                ? 'कुर्था, पश्मिना, ढाका वा लेहेंगा खोज्नुहोस्...'
                : 'Search Kurthas, Pashmina, Dhaka, Lehengas...'
            }
            style={{
              width: '100%',
              padding: '9px 16px 9px 40px',
              borderRadius: 99,
              border: '1.5px solid #EADCCE',
              background: '#FFFFFF',
              fontSize: 13,
              fontFamily: 'Inter, sans-serif',
              color: '#2B1810',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#8B3A3A')}
            onBlur={(e) => (e.target.style.borderColor = '#EADCCE')}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: 12,
                background: 'none',
                border: 'none',
                color: '#6B564C',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Right Action Icons: Language, Tracking, Admin, User, Cart */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* Mobile search toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="mobile-search-btn"
            style={{
              background: 'none',
              border: 'none',
              padding: 6,
              cursor: 'pointer',
              color: '#2B1810',
              borderRadius: '50%',
            }}
            aria-label="Search"
          >
            <Search size={19} />
          </button>

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            title={language === 'en' ? 'Switch to Nepali' : 'Switch to English'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '5px 10px',
              borderRadius: 99,
              background: 'white',
              border: '1px solid #EADCCE',
              color: '#2B1810',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            <Globe size={14} color="#8B3A3A" />
            <span>{language === 'en' ? 'नेपाली' : 'EN'}</span>
          </button>


          {/* Track Order Button */}
          <button
            onClick={() => setIsOrderTrackingOpen(true)}
            className="hide-mobile"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 99,
              background: 'white',
              border: '1px solid #EADCCE',
              color: '#2B1810',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <PackageCheck size={15} color="#8B3A3A" />
            <span>{language === 'np' ? 'अर्डर ट्र्याक' : 'Track Order'}</span>
          </button>

          {/* Cart Drawer Trigger */}
          <button
            id="cart-drawer-trigger-btn"
            onClick={toggleCart}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '7px 11px',
              borderRadius: 99,
              background: '#8B3A3A',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 13,
              boxShadow: '0 2px 8px rgba(139,58,58,0.3)',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
          >
            <ShoppingBag size={17} />
            <span style={{ marginLeft: 5 }}>{count}</span>
          </button>
        </div>
      </div>

      {/* Mobile search expander */}
      {searchOpen && (
        <div style={{ padding: '0 16px 12px', display: 'flex' }} className="mobile-search-bar">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'np' ? 'खोज्नुहोस्...' : 'Search collection...'}
            autoFocus
            style={{
              width: '100%',
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid #EADCCE',
              fontSize: 13,
            }}
          />
        </div>
      )}

      {/* Bottom Sub-Nav: Categories Bar */}
      <nav
        style={{
          borderTop: '1px solid #EADCCE',
          backgroundColor: '#FFFFFF',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 20px',
            whiteSpace: 'nowrap',
          }}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                style={{
                  border: 'none',
                  background: isActive ? 'rgba(139, 58, 58, 0.08)' : 'transparent',
                  color: isActive ? '#8B3A3A' : '#6B564C',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 13,
                  padding: '6px 14px',
                  borderRadius: 99,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
              >
                {cat.id === 'cat-festive' && <Sparkles size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: '-1px' }} />}
                {language === 'np' ? cat.name.np : cat.name.en}
                {isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: -2,
                      left: '20%',
                      right: '20%',
                      height: 2,
                      backgroundColor: '#8B3A3A',
                      borderRadius: 2,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            top: 60,
            zIndex: 45,
            backgroundColor: 'rgba(43,24,16,0.6)',
            display: 'flex',
          }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            style={{
              width: 280,
              backgroundColor: '#FAF2E9',
              height: '100%',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxShadow: '4px 0 20px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Track Order CTA in mobile drawer */}
            <button
              onClick={() => {
                setIsOrderTrackingOpen(true);
                setMobileMenuOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '11px 14px',
                borderRadius: 12,
                background: 'white',
                border: '1px solid #EADCCE',
                color: '#2B1810',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(43,24,16,0.05)',
              }}
            >
              <PackageCheck size={16} color="#8B3A3A" />
              <span>{language === 'np' ? 'आफ्नो अर्डर ट्र्याक गर्नुहोस्' : 'Track Your Order'}</span>
            </button>

            <div style={{ fontWeight: 700, fontSize: 13, color: '#8B3A3A', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {language === 'np' ? 'फेसन संग्रह' : 'Collections'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  style={{
                    border: 'none',
                    background: selectedCategory === cat.id ? '#8B3A3A' : 'white',
                    color: selectedCategory === cat.id ? 'white' : '#2B1810',
                    padding: '10px 14px',
                    borderRadius: 10,
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  {language === 'np' ? cat.name.np : cat.name.en}
                </button>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #EADCCE', paddingTop: 16, marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>

              <button
                onClick={toggleLanguage}
                className="btn btn-outline"
                style={{ width: '100%', fontSize: 13 }}
              >
                <Globe size={16} /> {language === 'en' ? 'नेपाली भाषा' : 'English'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
