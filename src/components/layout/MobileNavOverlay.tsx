import React from 'react';
import {
  X,
  Search,
  ShoppingBag,
  MapPin,
  Phone,
  Sparkles,
  ChevronRight,
  Truck,
  Check,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { useShopStore } from '../../store/shopStore';

export const MobileNavOverlay: React.FC = () => {
  const {
    language,
    setLanguage,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    categories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    cartCount,
    setIsCartOpen,
    setIsAdminOpen,
    unacknowledgedOrdersCount,
  } = useShopStore();

  if (!isMobileMenuOpen) return null;

  const handleCategoryClick = (slug: string) => {
    setSelectedCategory(slug);
    setIsMobileMenuOpen(false);
    const productSection = document.getElementById('products-section');
    if (productSection) {
      productSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenCart = () => {
    setIsMobileMenuOpen(false);
    setIsCartOpen(true);
  };

  const handleOpenAdmin = () => {
    setIsMobileMenuOpen(false);
    setIsAdminOpen(true);
  };

  return (
    <div
      id="mobile-nav-overlay"
      className="fixed inset-0 z-50 flex md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Drawer Content Panel (Optimized for mobile screens) */}
      <div className="relative w-full max-w-xs sm:max-w-sm bg-[#FFF8F0] h-full shadow-2xl flex flex-col justify-between overflow-y-auto border-r border-[#EADCCE] z-10 animate-slideRight">
        {/* Top Header of Drawer */}
        <div>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#EADCCE] bg-[#FAF2E9]">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rotate-45 bg-[#D4AF37]" />
                <span className="font-serif-luxury text-xl font-bold tracking-widest text-[#8B3A3A]">
                  DAWOSTI
                </span>
              </div>
              <span className="text-[10px] tracking-wider text-[#6B564C] uppercase font-devanagari">
                {language === 'np' ? 'काठमाडौँ, नेपाल' : 'Kathmandu, Nepal'}
              </span>
            </div>

            <button
              id="close-mobile-nav-btn"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close navigation menu"
              className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-full text-[#6B564C] hover:text-[#8B3A3A] hover:bg-white/80 active:scale-[0.97] transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Language Switcher inside Mobile Drawer */}
          <div className="px-5 pt-4 pb-2">
            <div className="bg-white p-1 rounded-xl border border-[#EADCCE] flex items-center shadow-2xs">
              <button
                id="mobile-lang-np-btn"
                onClick={() => setLanguage('np')}
                className={`flex-1 min-h-[44px] py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all active:scale-[0.97] ${
                  language === 'np'
                    ? 'bg-[#8B3A3A] text-white shadow-xs'
                    : 'text-[#6B564C] hover:text-[#2B1810]'
                }`}
              >
                <span>नेपाली</span>
                {language === 'np' && <Check className="w-3.5 h-3.5" />}
              </button>
              <button
                id="mobile-lang-en-btn"
                onClick={() => setLanguage('en')}
                className={`flex-1 min-h-[44px] py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all active:scale-[0.97] ${
                  language === 'en'
                    ? 'bg-[#8B3A3A] text-white shadow-xs'
                    : 'text-[#6B564C] hover:text-[#2B1810]'
                }`}
              >
                <span>English</span>
                {language === 'en' && <Check className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Search Box in Mobile Menu */}
          <div className="px-5 py-2">
            <div className="relative">
              <input
                id="mobile-drawer-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  language === 'np'
                    ? 'साडी, सिल्क, पश्मिना खोज्नुहोस्...'
                    : 'Search sarees, silks, pashmina...'
                }
                className="w-full bg-white text-sm text-[#2B1810] placeholder-[#6B564C]/70 rounded-xl pl-9 pr-8 py-2.5 border border-[#EADCCE] focus:border-[#8B3A3A] focus:outline-hidden"
              />
              <Search className="w-4 h-4 text-[#8B3A3A] absolute left-3 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6B564C] p-2 min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-[0.97]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Navigation Category Links */}
          <div className="px-3 py-3">
            <p className="px-3 text-[11px] font-semibold text-[#6B564C] uppercase tracking-wider mb-2">
              {language === 'np' ? 'फेसन संग्रहहरू' : 'Fashion Collections'}
            </p>
            <nav className="space-y-1">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.slug;
                return (
                  <button
                    key={cat.id}
                    id={`mobile-category-link-${cat.slug}`}
                    onClick={() => handleCategoryClick(cat.slug)}
                    className={`w-full min-h-[48px] flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.97] ${
                      isActive
                        ? 'bg-[#8B3A3A] text-white font-semibold shadow-xs'
                        : 'text-[#2B1810] hover:bg-[#FAF2E9]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActive ? 'bg-[#D4AF37]' : 'bg-[#8B3A3A]/40'
                        }`}
                      />
                      <span>{cat.name[language]}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {cat.productCount && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-[#561F1F] text-[#D4AF37]'
                              : 'bg-[#FAF2E9] text-[#6B564C] border border-[#EADCCE]'
                          }`}
                        >
                          {cat.productCount}
                        </span>
                      )}
                      <ChevronRight
                        className={`w-4 h-4 ${
                          isActive ? 'text-[#D4AF37]' : 'text-[#6B564C]'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Bag Button */}
          <div className="px-5 py-2 space-y-2">
            <button
              id="mobile-drawer-cart-btn"
              onClick={handleOpenCart}
              className="w-full min-h-[48px] flex items-center justify-between p-3 rounded-xl bg-[#FAF2E9] border border-[#EADCCE] text-[#2B1810] hover:border-[#8B3A3A] transition-all active:scale-[0.97]"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#8B3A3A] text-white rounded-lg">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">
                    {language === 'np' ? 'सपिङ झोला' : 'Shopping Bag'}
                  </p>
                  <p className="text-xs text-[#6B564C]">
                    {cartCount} {language === 'np' ? 'वटा सामान' : 'items added'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#8B3A3A]" />
            </button>

            {/* Dedicated Permanent Store Admin Atelier Button */}
            <button
              id="mobile-drawer-admin-btn"
              onClick={handleOpenAdmin}
              className="w-full min-h-[50px] flex items-center justify-between p-3 px-4 rounded-xl bg-[#8B3A3A] hover:bg-[#722E2E] text-white shadow-md transition-all active:scale-[0.97] cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
                <div className="text-left">
                  <span className="text-xs font-bold tracking-wide block">
                    {language === 'np' ? 'व्यवस्थापक प्यानल (Admin Atelier)' : 'Admin Atelier'}
                  </span>
                  <span className="text-[10px] text-white/80 block">
                    {language === 'np' ? 'उत्पादन, अर्डर र QR व्यवस्थापन' : 'Live Catalog, Orders & QR'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {unacknowledgedOrdersCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-white text-red-600 text-[10px] flex items-center justify-center font-extrabold animate-pulse">
                    {unacknowledgedOrdersCount}
                  </span>
                )}
                <span className="text-[10px] bg-white text-[#8B3A3A] px-2.5 py-1 rounded-full font-extrabold shadow-2xs">
                  Atelier
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Bottom Drawer Footer: Authenticity, Address & Phone */}
        <div className="p-5 border-t border-[#EADCCE] bg-[#FAF2E9] space-y-3">
          <div className="flex items-center gap-2 text-xs text-[#8B3A3A] font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>
              {language === 'np'
                ? '१००% नेपाली हस्तकला तथा च्याङ्ग्रा पश्मिना'
                : '100% Nepali Craftsmanship & Pashmina'}
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-[#6B564C]">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#8B3A3A] shrink-0" />
              <span>New Road, Kathmandu (Opposite Bishal Bazar)</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-[#8B3A3A] shrink-0" />
              <a href="tel:+9779708251494" className="font-bold text-[#2B1810] hover:underline">
                +977 9708251494
              </a>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs">💬</span>
              <a
                href="https://wa.me/9779708251494"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#25D366] hover:underline"
              >
                WhatsApp: +977 9708251494
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-3.5 h-3.5 text-[#8B3A3A] shrink-0" />
              <span>
                {language === 'np'
                  ? 'नेपालभर क्यास अन डेलिभरी उपलब्ध'
                  : 'Cash on Delivery in all 77 districts'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
