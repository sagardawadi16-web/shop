import React, { useState } from 'react';
import {
  Search, ShoppingBag, Menu, X, Globe, User as UserIcon,
  ShieldCheck, LogOut, PackageCheck, Sparkles
} from 'lucide-react';
import { DawostiLogo } from '../common/DawostiLogo';
import { useCartStore } from '../../stores/cartStore';
import { useProductStore } from '../../stores/productStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useAdminStore } from '../../stores/adminStore';
import { CATEGORIES } from '../../mockData';

export const Header: React.FC = () => {
  const { count, toggleCart } = useCartStore();
  const { searchQuery, setSearchQuery, selectedCategory, setSelectedCategory } = useProductStore();
  const { language, toggleLanguage, pageView, setPageView, setIsOrderTrackingOpen } = useSettingsStore();
  const { user, isOwner, isSigningIn, signIn, signOut, openAdmin } = useAdminStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
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

          {/* Admin Atelier Button */}
          <button
            onClick={openAdmin}
            title="Merchant Admin Atelier"
            className="hide-mobile"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 99,
              background: isOwner ? 'rgba(139, 58, 58, 0.1)' : 'white',
              border: isOwner ? '1px solid #8B3A3A' : '1px solid #EADCCE',
              color: isOwner ? '#8B3A3A' : '#6B564C',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <ShieldCheck size={16} color={isOwner ? '#8B3A3A' : '#D4AF37'} />
            <span className="hidden sm:inline">
              {isOwner ? 'Admin Atelier' : 'Admin'}
            </span>
          </button>

          {/* User Sign In / Profile */}
          <div className="hide-mobile" style={{ position: 'relative' }}>
            {user ? (
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: 3,
                  borderRadius: 99,
                  border: '1.5px solid #D4AF37',
                  background: 'white',
                  cursor: 'pointer',
                }}
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                />
              </button>
            ) : (
              <button
                onClick={() => signIn()}
                disabled={isSigningIn}
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
                }}
              >
                <UserIcon size={16} color="#8B3A3A" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            {/* User Dropdown */}
            {userDropdownOpen && user && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 8,
                  width: 220,
                  background: 'white',
                  borderRadius: 14,
                  boxShadow: '0 8px 30px rgba(43,24,16,0.15)',
                  border: '1px solid #EADCCE',
                  padding: '12px 14px',
                  zIndex: 50,
                }}
              >
                <div style={{ borderBottom: '1px solid #FAF2E9', paddingBottom: 8, marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#2B1810' }}>{user.name}</div>
                  <div style={{ fontSize: 11, color: '#6B564C', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.email}
                  </div>
                  {isOwner && (
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: 4,
                        fontSize: 10,
                        fontWeight: 800,
                        background: '#8B3A3A',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: 99,
                      }}
                    >
                      Store Owner
                    </span>
                  )}
                </div>

                <button
                  onClick={() => {
                    openAdmin();
                    setUserDropdownOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '8px 6px',
                    border: 'none',
                    background: 'none',
                    color: '#2B1810',
                    fontSize: 13,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <ShieldCheck size={16} color="#8B3A3A" /> Admin Atelier
                </button>

                <button
                  onClick={() => {
                    signOut();
                    setUserDropdownOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '8px 6px',
                    border: 'none',
                    background: 'none',
                    color: '#8B3A3A',
                    fontSize: 13,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            )}
          </div>

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
            {/* User Account Card */}
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'white', borderRadius: 12, border: '1px solid #EADCCE' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                  <img src={user.avatar} alt={user.name} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#2B1810', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{user.name}</div>
                    <div style={{ fontSize: 10, color: '#8B3A3A', fontWeight: 600 }}>{isOwner ? 'Store Owner' : 'Customer'}</div>
                  </div>
                </div>
                <button onClick={() => { signOut(); setMobileMenuOpen(false); }} title="Sign Out" style={{ background: 'none', border: 'none', color: '#8B3A3A', cursor: 'pointer', padding: 4 }}>
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { signIn(); setMobileMenuOpen(false); }}
                className="btn btn-primary"
                style={{ width: '100%', fontSize: 13 }}
              >
                <UserIcon size={16} /> Sign In with Google
              </button>
            )}

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
                onClick={() => {
                  openAdmin();
                  setMobileMenuOpen(false);
                }}
                className="btn btn-outline"
                style={{ width: '100%', fontSize: 13 }}
              >
                <ShieldCheck size={16} /> Admin Atelier
              </button>

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
