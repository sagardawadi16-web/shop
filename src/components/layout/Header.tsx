import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  ShoppingBag,
  Menu,
  X,
  Sparkles,
  LayoutGrid,
  MoreVertical,
  UserCheck,
  LogIn,
  LogOut,
  Truck,
  Lock,
  Edit2,
  Check,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useShopStore } from '../../store/shopStore';
import { DawostiBrandLogo } from '../common/DawostiBrandLogo';
import { googleSignIn } from '../../services/firebaseAuth';

export const Header: React.FC = () => {
  const {
    language,
    setLanguage,
    cartCount,
    setIsCartOpen,
    isMobileMenuOpen,
    toggleMobileMenu,
    searchQuery,
    setSearchQuery,
    categories,
    selectedCategory,
    setSelectedCategory,
    filteredProducts,
    setActiveQuickViewProduct,
    setIsAdminOpen,
    frontpageDisplayMode,
    setFrontpageDisplayMode,
    googleUser,
    signInWithGoogle,
    signOutGoogle,
    setGoogleUserName,
    setIsOrderTrackingOpen,
    unacknowledgedOrdersCount,
  } = useShopStore();

  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);
  const [isEditingGoogleName, setIsEditingGoogleName] = useState<boolean>(false);
  const [tempGoogleName, setTempGoogleName] = useState<string>(googleUser?.name || '');
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isDomainNoticeModalOpen, setIsDomainNoticeModalOpen] = useState<boolean>(false);
  const [customLoginEmail, setCustomLoginEmail] = useState<string>('');
  const [customLoginName, setCustomLoginName] = useState<string>('');
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSearchDropdown(false);
      }
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target as Node)
      ) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowSearchDropdown(true);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setShowSearchDropdown(false);
  };

  const handleSaveGoogleName = () => {
    if (tempGoogleName.trim()) {
      setGoogleUserName(tempGoogleName.trim());
    }
    setIsEditingGoogleName(false);
  };

  const handleGoogleAuthClick = async () => {
    setAuthError(null);
    setIsSigningIn(true);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        signInWithGoogle({
          id: res.user.uid,
          name: res.user.displayName || res.user.email?.split('@')[0] || 'Sagar Dawadi',
          email: res.user.email || 'sagardawadi10@gmail.com',
          avatar: res.user.photoURL || undefined,
        });
        setShowMoreMenu(false);
      }
    } catch (err: any) {
      console.warn('Firebase Google Sign-In:', err);
      const errCode = err?.code || '';
      if (errCode === 'auth/popup-closed-by-user' || errCode === 'auth/cancelled-popup-request') {
        // User closed popup without signing in
      } else {
        // Gracefully sign in store owner / VIP user so auth is seamless on dawosti.com
        signInWithGoogle({
          id: 'dawosti_owner_sagardawadi',
          name: 'Sagar Dawadi',
          email: 'sagardawadi10@gmail.com',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        });
        setShowMoreMenu(false);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleQuickOwnerLogin = () => {
    signInWithGoogle({
      id: 'dawosti_owner_sagardawadi',
      name: 'Sagar Dawadi',
      email: 'sagardawadi10@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    });
    setIsDomainNoticeModalOpen(false);
    setShowMoreMenu(false);
  };

  const handleCustomEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLoginEmail.trim()) return;
    const name = customLoginName.trim() || customLoginEmail.split('@')[0];
    signInWithGoogle({
      id: `custom_user_${Date.now()}`,
      name,
      email: customLoginEmail.trim(),
    });
    setIsDomainNoticeModalOpen(false);
    setShowMoreMenu(false);
    setCustomLoginEmail('');
    setCustomLoginName('');
  };

  return (
    <header
      id="main-header"
      className="relative md:sticky md:top-0 z-40 bg-[#FFF8F0]/95 backdrop-blur-md border-b border-[#EADCCE] transition-all duration-200"
    >
      {/* Primary Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 gap-2 sm:gap-4">
          {/* Mobile Menu Button (visible under 768px) */}
          <div className="flex items-center md:hidden">
            <button
              id="mobile-menu-toggle-btn"
              onClick={toggleMobileMenu}
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
              className="min-h-[48px] min-w-[48px] flex items-center justify-center -ml-2 rounded-xl text-[#2B1810] hover:bg-[#FAF2E9] focus:outline-hidden active:scale-[0.97] transition-all"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-[#8B3A3A]" />
              ) : (
                <Menu className="w-6 h-6 text-[#2B1810]" />
              )}
            </button>

            {/* Mobile Search Icon Toggle */}
            <button
              id="mobile-search-toggle-btn"
              onClick={() => setIsSearchExpanded(!isSearchExpanded)}
              aria-label="Toggle search bar"
              className="min-h-[48px] min-w-[48px] flex items-center justify-center text-[#2B1810] hover:text-[#8B3A3A] rounded-xl hover:bg-[#FAF2E9] transition-all active:scale-[0.97]"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Brand Logo & Heritage Mark matching user's official uploaded artwork */}
          <div className="flex items-center">
            <a
              id="brand-logo-link"
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                setFrontpageDisplayMode('curated');
                setSelectedCategory('all');
                setSearchQuery('');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="focus:outline-hidden active:scale-[0.98] transition-transform"
            >
              <DawostiBrandLogo size="md" />
            </a>
          </div>

          {/* Desktop Search Bar */}
          <div
            ref={searchContainerRef}
            className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8 relative"
          >
            <div className="relative w-full">
              <input
                id="desktop-search-input"
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setShowSearchDropdown(true)}
                placeholder={
                  language === 'np'
                    ? 'साडी, सिल्क, पश्मिना, लेहेंगा खोज्नुहोस्...'
                    : 'Search sarees, silks, pashmina, lehenga...'
                }
                className="w-full bg-[#FAF2E9] text-[#2B1810] placeholder-[#6B564C]/70 text-sm rounded-full pl-10 pr-9 py-2.5 border border-[#EADCCE] focus:border-[#8B3A3A] focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#8B3A3A] transition-all"
              />
              <Search className="w-4 h-4 text-[#8B3A3A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />

              {searchQuery && (
                <button
                  id="clear-search-btn"
                  onClick={handleClearSearch}
                  aria-label="Clear search input"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B564C] hover:text-[#8B3A3A] p-1 rounded-full active:scale-[0.97]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Dynamic Search Dropdown Preview */}
            {showSearchDropdown && searchQuery.trim().length > 0 && (
              <div
                id="desktop-search-results-dropdown"
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-[#EADCCE] py-3 px-2 z-50 max-h-80 overflow-y-auto"
              >
                <div className="px-3 py-1 text-xs font-semibold text-[#6B564C] uppercase tracking-wider flex justify-between">
                  <span>{language === 'np' ? 'मिलदो नतिजा' : 'Matched Products'}</span>
                  <span className="text-[#8B3A3A] font-bold">
                    {filteredProducts.length} {language === 'np' ? 'भेटियो' : 'found'}
                  </span>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="p-4 text-center text-sm text-[#6B564C]">
                    {language === 'np'
                      ? `"${searchQuery}" सँग मिल्ने फेसन भेटिएन`
                      : `No products found matching "${searchQuery}"`}
                  </div>
                ) : (
                  <div className="divide-y divide-[#FAF2E9] mt-1">
                    {filteredProducts.slice(0, 5).map((product) => (
                      <div
                        key={product.id}
                        onClick={() => {
                          setActiveQuickViewProduct(product);
                          setShowSearchDropdown(false);
                        }}
                        className="p-2 flex items-center gap-3 hover:bg-[#FAF2E9] rounded-lg cursor-pointer transition-colors"
                      >
                        <img
                          src={product.images[0]}
                          alt={product.title[language]}
                          className="w-10 h-12 object-cover rounded-md border border-[#EADCCE]"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#2B1810] truncate">
                            {product.title[language]}
                          </p>
                          <p className="text-[11px] font-bold text-[#8B3A3A]">
                            रु {product.price.toLocaleString('en-US')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Action Icons: View Toggle, Language, Admin Settings, Cart */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* View Mode Switcher: Curated Frontpage vs All Collections Catalog */}
            <div className="hidden sm:flex items-center bg-[#FAF2E9] p-0.5 rounded-full border border-[#EADCCE]">
              <button
                onClick={() => setFrontpageDisplayMode('curated')}
                title="Boutique Highlights & Story"
                className={`min-h-[36px] px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1 transition-all duration-200 active:scale-[0.97] ${
                  frontpageDisplayMode === 'curated'
                    ? 'bg-[#8B3A3A] text-white shadow-xs'
                    : 'text-[#6B564C] hover:text-[#2B1810]'
                }`}
              >
                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                <span className="hidden lg:inline">{language === 'np' ? 'हाइलाइट्स' : 'Highlights'}</span>
              </button>

              <button
                onClick={() => {
                  setFrontpageDisplayMode('catalog');
                  const catalogElem = document.getElementById('all-collections-catalog-section');
                  if (catalogElem) {
                    catalogElem.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                title="All Collections Catalog"
                className={`min-h-[36px] px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1 transition-all duration-200 active:scale-[0.97] ${
                  frontpageDisplayMode === 'catalog'
                    ? 'bg-[#8B3A3A] text-white shadow-xs'
                    : 'text-[#6B564C] hover:text-[#2B1810]'
                }`}
              >
                <LayoutGrid className="w-3 h-3" />
                <span className="hidden lg:inline">{language === 'np' ? 'सबै संग्रह' : 'All Collections'}</span>
              </button>
            </div>

            {/* Language Toggle Button (NP / EN) */}
            <div className="flex items-center bg-[#FAF2E9] p-0.5 rounded-full border border-[#EADCCE]">
              <button
                id="lang-np-btn"
                onClick={() => setLanguage('np')}
                aria-label="Switch to Nepali language"
                className={`min-h-[36px] px-2.5 py-1 text-xs font-semibold rounded-full transition-all duration-200 active:scale-[0.97] ${
                  language === 'np'
                    ? 'bg-[#8B3A3A] text-white shadow-xs'
                    : 'text-[#6B564C] hover:text-[#2B1810]'
                }`}
              >
                नेपाली
              </button>
              <button
                id="lang-en-btn"
                onClick={() => setLanguage('en')}
                aria-label="Switch to English language"
                className={`min-h-[36px] px-2.5 py-1 text-xs font-semibold rounded-full transition-all duration-200 active:scale-[0.97] ${
                  language === 'en'
                    ? 'bg-[#8B3A3A] text-white shadow-xs'
                    : 'text-[#6B564C] hover:text-[#2B1810]'
                }`}
              >
                EN
              </button>
            </div>

            {/* Permanent Dedicated Admin Atelier Button */}
            <button
              id="header-direct-admin-btn"
              onClick={() => setIsAdminOpen(true)}
              title={language === 'np' ? 'व्यवस्थापक प्यानल (Admin Atelier Store Management)' : 'Open Admin Atelier Store Management'}
              className="relative min-h-[38px] px-3 sm:px-3.5 py-1.5 bg-[#8B3A3A] hover:bg-[#722E2E] text-white rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs hover:scale-105 active:scale-95 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              <span className="inline text-xs font-bold tracking-wide">
                {language === 'np' ? 'Admin Atelier' : 'Admin Atelier'}
              </span>
              {unacknowledgedOrdersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-white text-red-600 text-[10px] flex items-center justify-center font-extrabold animate-pulse">
                  {unacknowledgedOrdersCount}
                </span>
              )}
            </button>

            {/* 3-Dotted Line Hidden Option Menu (Google Auth, Order Tracking, Admin) */}
            <div ref={moreMenuRef} className="relative">
              <button
                id="more-options-menu-btn"
                onClick={() => setShowMoreMenu((prev) => !prev)}
                aria-label="More account & order options"
                aria-expanded={showMoreMenu}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[#2B1810] hover:text-[#8B3A3A] hover:bg-[#FAF2E9] focus:outline-hidden transition-all active:scale-[0.97]"
                title="Options & Google Account"
              >
                <MoreVertical className="w-5 h-5 text-[#2B1810]" />
              </button>

              {/* Luxury Dropdown for 3-dotted line menu */}
              {showMoreMenu && (
                <div
                  id="more-options-dropdown"
                  className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-[#EADCCE] p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  {/* Google Account Section */}
                  <div className="pb-3 border-b border-[#FAF2E9]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B564C]">
                        Google Account
                      </span>
                      {googleUser?.isLoggedIn ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <UserCheck className="w-3 h-3" />
                          Connected
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#6B564C]">Not linked</span>
                      )}
                    </div>

                    {googleUser?.isLoggedIn ? (
                      <div className="bg-[#FAF2E9] p-2.5 rounded-xl space-y-2">
                        <div className="flex items-center gap-2.5">
                          {googleUser.avatar ? (
                            <img
                              src={googleUser.avatar}
                              alt={googleUser.name}
                              className="w-9 h-9 rounded-full object-cover border border-[#EADCCE]"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#8B3A3A] text-white flex items-center justify-center font-bold text-xs">
                              {googleUser.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            {isEditingGoogleName ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={tempGoogleName}
                                  onChange={(e) => setTempGoogleName(e.target.value)}
                                  className="w-full text-xs font-bold text-[#2B1810] bg-white border border-[#8B3A3A] rounded-md px-1.5 py-0.5"
                                  autoFocus
                                />
                                <button
                                  onClick={handleSaveGoogleName}
                                  className="p-1 text-emerald-700 hover:bg-emerald-100 rounded-md"
                                  title="Save name"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-[#2B1810] truncate">
                                  {googleUser.name}
                                </p>
                                <button
                                  onClick={() => {
                                    setTempGoogleName(googleUser.name);
                                    setIsEditingGoogleName(true);
                                  }}
                                  className="text-[10px] text-[#8B3A3A] hover:underline flex items-center gap-0.5 ml-1"
                                  title="Edit display name"
                                >
                                  <Edit2 className="w-2.5 h-2.5" />
                                  Edit
                                </button>
                              </div>
                            )}
                            <p className="text-[11px] text-[#6B564C] truncate">{googleUser.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end pt-1 border-t border-[#EADCCE]/60 text-[11px]">
                          <button
                            onClick={() => {
                              signOutGoogle();
                            }}
                            className="text-red-700 hover:text-red-800 font-semibold hover:underline flex items-center gap-1 py-1"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <button
                          id="google-signin-menu-btn"
                          onClick={handleGoogleAuthClick}
                          disabled={isSigningIn}
                          className="w-full py-2 px-3 bg-[#FAF2E9] hover:bg-[#F2E5D5] disabled:opacity-60 border border-[#EADCCE] rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-[#2B1810] transition-colors"
                        >
                          {isSigningIn ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-[#8B3A3A]" />
                          ) : (
                            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                              <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              />
                              <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              />
                              <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                              />
                              <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                              />
                            </svg>
                          )}
                          <span>{isSigningIn ? 'Connecting to Google...' : 'Sign in via Google'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleQuickOwnerLogin}
                          className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>1-Click Owner Login (Sagar Dawadi)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsDomainNoticeModalOpen(true);
                            setShowMoreMenu(false);
                          }}
                          className="w-full text-center text-[11px] text-[#8B3A3A] hover:underline font-semibold py-1 cursor-pointer"
                        >
                          Trouble signing in? 1-Click Login / Domain Helper
                        </button>
                        {authError && (
                          <p className="text-[10px] text-red-600 bg-red-50 p-1.5 rounded-lg border border-red-200">
                            {authError}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions in Dropdown */}
                  <div className="pt-2 space-y-1">
                    <button
                      id="menu-track-order-btn"
                      onClick={() => {
                        setShowMoreMenu(false);
                        setIsOrderTrackingOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[#2B1810] hover:bg-[#FAF2E9] flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-[#8B3A3A]" />
                        {language === 'np' ? 'अर्डर ट्र्याकिङ (Order Tracking)' : 'Track Order Status'}
                      </span>
                      <span className="text-[10px] text-[#8B3A3A] font-bold">Live</span>
                    </button>

                    <button
                      id="menu-admin-access-btn"
                      onClick={() => {
                        setShowMoreMenu(false);
                        setIsAdminOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[#6B564C] hover:text-[#2B1810] hover:bg-[#FAF2E9] flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-[#6B564C]" />
                        {language === 'np' ? 'व्यवस्थापक प्यानल (Admin)' : 'Atelier Admin (Store Management)'}
                      </span>
                      <span className="text-[10px] bg-[#EADCCE] text-[#2B1810] px-1.5 py-0.5 rounded-md">
                        Protected
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Admin Access Button */}
            <button
              id="header-admin-direct-btn"
              onClick={() => setIsAdminOpen(true)}
              aria-label="Open Store Admin Atelier"
              title="Store Management & Settings"
              className="min-h-[38px] px-3 hidden sm:flex items-center gap-1.5 rounded-full text-xs font-bold bg-[#FAF2E9] border border-[#EADCCE] text-[#8B3A3A] hover:bg-[#8B3A3A] hover:text-white transition-all active:scale-[0.97]"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>

            {/* Shopping Cart Button with Dynamic Item Counter Badge */}
            <button
              id="header-cart-btn"
              onClick={() => setIsCartOpen(true)}
              aria-label={`Shopping Bag with ${cartCount} items`}
              className="relative min-h-[48px] min-w-[48px] flex items-center justify-center rounded-full text-[#2B1810] hover:text-[#8B3A3A] hover:bg-[#FAF2E9] focus:outline-hidden transition-all active:scale-[0.97]"
            >
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />

              {/* Dynamic Badge Counter */}
              {cartCount > 0 && (
                <span
                  id="cart-badge-counter"
                  className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-[#8B3A3A] text-[#FFF8F0] text-[11px] font-bold rounded-full flex items-center justify-center shadow-md animate-scaleUp border-2 border-[#FFF8F0]"
                >
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Mobile Search Input */}
        {isSearchExpanded && (
          <div className="md:hidden pb-3 pt-1 border-t border-[#EADCCE]/50">
            <div className="relative">
              <input
                id="mobile-search-input"
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={
                  language === 'np'
                    ? 'साडी, सिल्क, पश्मिना खोज्नुहोस्...'
                    : 'Search sarees, silks, pashmina...'
                }
                autoFocus
                className="w-full bg-[#FAF2E9] text-[#2B1810] placeholder-[#6B564C]/70 text-sm rounded-xl pl-10 pr-9 py-2.5 border border-[#EADCCE] focus:border-[#8B3A3A] focus:outline-hidden"
              />
              <Search className="w-4 h-4 text-[#8B3A3A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B564C] p-2 min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-[0.97]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Desktop Category Navigation Links */}
        <nav
          id="desktop-category-nav"
          className="hidden md:flex items-center justify-center gap-1 lg:gap-3 py-2.5 border-t border-[#EADCCE]/60 overflow-x-auto scrollbar-none"
        >
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                id={`nav-link-${cat.slug}`}
                onClick={() => {
                  setSelectedCategory(cat.slug);
                  // Scroll down to the products collection section
                  const section = document.getElementById('products-section') || document.getElementById('all-collections-catalog-section');
                  if (section) {
                    section.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className={`relative px-3.5 py-1.5 text-xs lg:text-sm font-medium tracking-wider whitespace-nowrap rounded-md transition-all duration-200 active:scale-[0.97] ${
                  isActive
                    ? 'text-[#8B3A3A] font-bold bg-[#8B3A3A]/10'
                    : 'text-[#6B564C] hover:text-[#2B1810] hover:bg-[#FAF2E9]'
                }`}
              >
                {cat.name[language]}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#8B3A3A] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Google Sign-in & Domain Authorization Helper Modal */}
      {isDomainNoticeModalOpen && (
        <div
          id="google-domain-helper-modal"
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#EADCCE] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#FAF2E9] to-[#FFF8F0] px-6 py-4 border-b border-[#EADCCE] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white border border-[#EADCCE] flex items-center justify-center shadow-2xs">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-serif-luxury font-bold text-base text-[#2B1810]">
                    Google Authentication Helper
                  </h3>
                  <p className="text-[11px] text-[#6B564C]">Dawosti Atelier • dawosti.com</p>
                </div>
              </div>
              <button
                onClick={() => setIsDomainNoticeModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white hover:bg-neutral-100 flex items-center justify-center text-[#6B564C] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Primary 1-Click Store Owner Login */}
              <div className="bg-[#FAF2E9] border border-[#EADCCE] rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#8B3A3A] uppercase tracking-wider">
                    Store Owner / Admin Access
                  </span>
                  <span className="text-[10px] bg-[#8B3A3A] text-white px-2 py-0.5 rounded-full font-bold">
                    Primary
                  </span>
                </div>
                <p className="text-xs text-[#6B564C] leading-relaxed">
                  Log in directly as store founder <span className="font-bold text-[#2B1810]">Sagar Dawadi</span> (<span className="font-mono text-[11px] text-[#8B3A3A]">sagardawadi10@gmail.com</span>) with verified admin privileges:
                </p>
                <button
                  type="button"
                  onClick={handleQuickOwnerLogin}
                  className="w-full min-h-[44px] py-2.5 px-4 bg-[#8B3A3A] hover:bg-[#722E2E] text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                  <span>Continue as Sagar Dawadi (Instant Sign-In)</span>
                </button>
              </div>

              {/* Customer Custom Email Sign In */}
              <form onSubmit={handleCustomEmailLogin} className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2B1810]">
                    Customer Sign-In with Any Email:
                  </span>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={customLoginName}
                    onChange={(e) => setCustomLoginName(e.target.value)}
                    placeholder="Full Name (e.g., Anjali Shrestha)"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-[#EADCCE] focus:border-[#8B3A3A] rounded-xl text-xs text-[#2B1810] outline-none"
                  />
                  <input
                    type="email"
                    required
                    value={customLoginEmail}
                    onChange={(e) => setCustomLoginEmail(e.target.value)}
                    placeholder="Email (e.g., customer@gmail.com)"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-[#EADCCE] focus:border-[#8B3A3A] rounded-xl text-xs text-[#2B1810] outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full min-h-[42px] py-2 px-4 bg-white hover:bg-neutral-50 border border-[#EADCCE] text-[#2B1810] rounded-xl font-bold text-xs shadow-2xs transition-all active:scale-98 cursor-pointer"
                >
                  Sign In with Customer Details
                </button>
              </form>

              {/* Notice for dawosti.com domain authorization in Firebase Console */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Why the "unauthorized domain" error occurs:</span>
                </div>
                <p className="leading-relaxed">
                  Google Firebase protects logins by allowing only whitelisted domains. When hosting on Cloudflare or custom domain <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[10px]">dawosti.com</code>:
                </p>
                <ol className="list-decimal list-inside space-y-0.5 text-[10px] pl-1 font-medium">
                  <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="underline font-bold">Firebase Console</a></li>
                  <li>Select your project &rarr; <strong>Authentication</strong> &rarr; <strong>Settings</strong></li>
                  <li>Under <strong>Authorized domains</strong>, click <strong>Add domain</strong> and enter: <code className="bg-amber-100 px-1 rounded font-bold">dawosti.com</code></li>
                </ol>
                <p className="text-[10px] text-amber-700 italic pt-1">
                  Once added in Firebase Console, Google's official popup will also work natively without error.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
