import React, { useState, useEffect, useRef } from 'react';
import {
  Search, ShoppingBag, Menu, X, Globe, PackageCheck, Sparkles, Building2, Award
} from 'lucide-react';
import { DawostiLogo } from '../common/DawostiLogo';
import { UserAuthButton } from './UserAuthButton';
import { useCartStore } from '../../stores/cartStore';
import { useProductStore } from '../../stores/productStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useRetailerStore } from '../../stores/retailerStore';
import { useReferralStore } from '../../stores/referralStore';
import { CATEGORIES } from '../../mockData';

export const Header: React.FC = () => {
  const { count, toggleCart } = useCartStore();
  const { searchQuery, setSearchQuery, selectedCategory, setSelectedCategory } = useProductStore();
  const { language, toggleLanguage, pageView, setPageView, setIsOrderTrackingOpen } = useSettingsStore();
  const { openWholesaleModal } = useRetailerStore();
  const { openCreatorPortal } = useReferralStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isCategoryHidden, setIsCategoryHidden] = useState(false);
  const isCategoryHiddenRef = useRef(false);
  const isTransitioningRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);

  // Lock background scroll and handle Escape/back when mobile menu is open
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    const handlePopState = () => {
      setMobileMenuOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [mobileMenuOpen]);

  // Jitter-proof, butter-smooth category subnav scroll listener
  useEffect(() => {
    let lastScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    let accumulatedDelta = 0;
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;

      ticking = true;
      window.requestAnimationFrame(() => {
        const currentScrollY = Math.max(0, window.scrollY);
        const delta = currentScrollY - lastScrollY;
        lastScrollY = currentScrollY;
        ticking = false;

        // Ignore while programmatic smooth scrolling is running
        if (isProgrammaticScrollRef.current) return;

        // Ignore during active CSS transition to prevent layout shift feedback loops
        if (isTransitioningRef.current) return;

        // Near top of page: always reveal category bar
        if (currentScrollY <= 60) {
          if (isCategoryHiddenRef.current) {
            isCategoryHiddenRef.current = false;
            setIsCategoryHidden(false);
            isTransitioningRef.current = true;
            setTimeout(() => { isTransitioningRef.current = false; }, 350);
          }
          accumulatedDelta = 0;
          return;
        }

        // Reset accumulator on scroll direction change
        if ((delta > 0 && accumulatedDelta < 0) || (delta < 0 && accumulatedDelta > 0)) {
          accumulatedDelta = 0;
        }
        accumulatedDelta += delta;

        // Sustained DOWNWARD scroll (>65px past 150px depth): smoothly hide category distraction
        if (accumulatedDelta > 65 && currentScrollY > 150 && !isCategoryHiddenRef.current) {
          isCategoryHiddenRef.current = true;
          setIsCategoryHidden(true);
          accumulatedDelta = 0;
          isTransitioningRef.current = true;
          setTimeout(() => { isTransitioningRef.current = false; }, 350);
        }
        // Sustained UPWARD scroll (<-45px): smoothly reveal categories for easy navigation
        else if (accumulatedDelta < -45 && isCategoryHiddenRef.current) {
          isCategoryHiddenRef.current = false;
          setIsCategoryHidden(false);
          accumulatedDelta = 0;
          isTransitioningRef.current = true;
          setTimeout(() => { isTransitioningRef.current = false; }, 350);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCategoryClick = (catId: string) => {
    setSelectedCategory(catId);
    if (pageView !== 'home') {
      setPageView('home');
    }
    setMobileMenuOpen(false);

    // Lock scroll listener during smooth programmatic scroll
    isProgrammaticScrollRef.current = true;
    setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 850);

    requestAnimationFrame(() => {
      const catalogEl = document.getElementById('product-catalog');
      if (catalogEl) {
        const headerEl = document.getElementById('main-header');
        const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 90;
        const targetY = catalogEl.getBoundingClientRect().top + window.pageYOffset - headerHeight - 12;
        window.scrollTo({
          top: Math.max(0, targetY),
          behavior: 'smooth',
        });
      }
    });
  };

  const handleLogoClick = () => {
    setPageView('home');
    setSelectedCategory('all');
    isProgrammaticScrollRef.current = true;
    setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 600);
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
      {/* Top Main Navigation Bar (Luxury Centered Brand Architecture) */}
      <div className="main-header-nav" style={{ position: 'relative' }}>
        {/* Left Column: Menu & Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
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

          {/* Desktop Search Bar */}
          <div
            style={{
              width: '100%',
              maxWidth: 300,
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
            }}
            className="desktop-search-container"
          >
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 12,
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
                  ? 'खोज्नुहोस्...'
                  : 'Search boutique...'
              }
              style={{
                width: '100%',
                padding: '7px 14px 7px 34px',
                borderRadius: 99,
                border: '1.5px solid #EADCCE',
                background: '#FFFFFF',
                fontSize: 12.5,
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
                  right: 10,
                  background: 'none',
                  border: 'none',
                  color: '#6B564C',
                  cursor: 'pointer',
                  fontSize: 11,
                }}
              >
                ✕
              </button>
            )}
          </div>

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
        </div>

        {/* Center Column: Perfectly Centered Brand Logo */}
        <div
          onClick={handleLogoClick}
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            padding: '2px 8px',
          }}
        >
          <DawostiLogo size={38} centered />
        </div>

        {/* Right Column: Actions (Language, Tracking, Cart) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flex: 1 }}>

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="hide-mobile"
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
              flexShrink: 0,
            }}
          >
            <Globe size={14} color="#8B3A3A" />
            <span>{language === 'en' ? 'नेपाली' : 'EN'}</span>
          </button>


          {/* Wholesale / B2B Button */}
          <button
            onClick={openWholesaleModal}
            className="hide-mobile"
            title={language === 'np' ? 'थोक तथा खुद्रा साझेदार बन्नुहोस्' : 'Become a Dawosti Wholesale Stockist'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 13px',
              borderRadius: 99,
              background: 'linear-gradient(135deg, rgba(212,175,55,0.18) 0%, rgba(139,58,58,0.08) 100%)',
              border: '1.5px solid #D4AF37',
              color: '#561F1F',
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(212,175,55,0.15)',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(212,175,55,0.3)';
              e.currentTarget.style.background = 'linear-gradient(135deg, #D4AF37 0%, #E5A93C 100%)';
              e.currentTarget.style.color = '#2B1810';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(212,175,55,0.15)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212,175,55,0.18) 0%, rgba(139,58,58,0.08) 100%)';
              e.currentTarget.style.color = '#561F1F';
            }}
          >
            <Building2 size={13} color="currentColor" />
            <span>{language === 'np' ? 'थोक साझेदार' : 'Wholesale / B2B'}</span>
          </button>

          {/* Creator / Referral Hub */}
          <button
            onClick={openCreatorPortal}
            className="hide-mobile"
            title={language === 'np' ? 'इन्फ्लुएन्सर पार्टनर बन्नुहोस् र कमाउनुहोस्' : 'Earn With Dawosti (Creator Hub)'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 12px',
              borderRadius: 99,
              background: '#FAF2E9',
              border: '1.5px solid #1B7F5E',
              color: '#1B7F5E',
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <Award size={13} color="#1B7F5E" />
            <span>{language === 'np' ? 'कमाउनुहोस्' : 'Earn / Refer'}</span>
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

          {/* Customer Google Auth Button */}
          <UserAuthButton />

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

      {/* Bottom Sub-Nav: Categories Bar (Smooth hide on scroll down, reveal on scroll up) */}
      <nav
        style={{
          borderTop: isCategoryHidden ? '1px solid transparent' : '1px solid #EADCCE',
          backgroundColor: '#FFFFFF',
          maxHeight: isCategoryHidden ? 0 : 44,
          opacity: isCategoryHidden ? 0 : 1,
          transform: isCategoryHidden ? 'translateY(-8px)' : 'translateY(0)',
          overflow: 'hidden',
          transition: 'max-height 0.28s cubic-bezier(0.25, 1, 0.5, 1), transform 0.28s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s ease, border-color 0.2s ease',
          pointerEvents: isCategoryHidden ? 'none' : 'auto',
          willChange: 'max-height, transform, opacity',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 16px',
            whiteSpace: 'nowrap',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
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

      {/* Mobile Drawer Navigation (3-Dash Hamburger Menu) */}
      {mobileMenuOpen && (
        <div
          className="drawer-overlay animate-fadeIn"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 70,
            backgroundColor: 'rgba(43, 24, 16, 0.55)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
          }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="animate-slideInLeft"
            style={{
              width: 'min(85vw, 320px)',
              backgroundColor: '#FAF2E9',
              height: '100%',
              maxHeight: '100dvh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '4px 0 25px rgba(0, 0, 0, 0.25)',
              position: 'relative',
              zIndex: 75,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Top Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #EADCCE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#FAF2E9',
                flexShrink: 0,
              }}
            >
              <div
                onClick={() => {
                  handleLogoClick();
                  setMobileMenuOpen(false);
                }}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: '#2B1810', letterSpacing: '0.08em' }}>
                  DAWOSTI
                </div>
                <div style={{ fontSize: 9, letterSpacing: '0.18em', color: '#8B3A3A', fontWeight: 600 }}>
                  {language === 'np' ? 'काठमाडौं मौलिक फेसन' : 'HERITAGE COUTURE'}
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-ghost btn-icon"
                style={{ width: 38, height: 38, padding: 8 }}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Drawer Content */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                padding: '18px 20px 36px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              {/* Google Account Sign-In / Profile */}
              <UserAuthButton isMobile />

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

              {/* Wholesale B2B in mobile drawer */}
              <button
                onClick={() => {
                  openWholesaleModal();
                  setMobileMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '11px 14px',
                  borderRadius: 12,
                  background: 'rgba(212, 175, 55, 0.15)',
                  border: '1.5px solid rgba(212, 175, 55, 0.5)',
                  color: '#561F1F',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <Building2 size={16} color="#8B3A3A" />
                <span>{language === 'np' ? 'थोक तथा खुद्रा साझेदार बन्नुहोस्' : 'Become a Retail Stockist (B2B)'}</span>
              </button>

              {/* Creator / Referral Hub in mobile drawer */}
              <button
                onClick={() => {
                  openCreatorPortal();
                  setMobileMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '11px 14px',
                  borderRadius: 12,
                  background: '#E0F3EA',
                  border: '1.5px solid #1B7F5E',
                  color: '#1B7F5E',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <Award size={16} color="#1B7F5E" />
                <span>{language === 'np' ? 'इन्फ्लुएन्सर पार्टनर (कमाउनुहोस्)' : 'Creator Hub (Earn NPR 10k)'}</span>
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
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 1px 3px rgba(43,24,16,0.04)',
                    }}
                  >
                    {cat.id === 'cat-festive' && <Sparkles size={14} color={selectedCategory === cat.id ? '#FFD700' : '#8B3A3A'} />}
                    <span>{language === 'np' ? cat.name.np : cat.name.en}</span>
                  </button>
                ))}
              </div>

              <div style={{ borderTop: '1px solid #EADCCE', paddingTop: 16, marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={toggleLanguage}
                  className="btn btn-outline"
                  style={{ width: '100%', fontSize: 13, background: 'white' }}
                >
                  <Globe size={16} /> {language === 'en' ? 'नेपाली भाषा' : 'English'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
