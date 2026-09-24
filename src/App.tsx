import React, { useEffect, useState } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { CartDrawer } from './components/cart/CartDrawer';
import { RetailerInquiryModal } from './components/wholesale/RetailerInquiryModal';
import { AdminModal } from './components/admin/AdminModal';
import { CreatorPortalModal } from './components/referral/CreatorPortalModal';
import { ToastContainer } from './components/common/Toast';
import { HomePage } from './pages/HomePage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { useProductStore } from './stores/productStore';
import { useOrderStore } from './stores/orderStore';
import { useSettingsStore } from './stores/settingsStore';
import { useRetailerStore } from './stores/retailerStore';
import { useReferralStore } from './stores/referralStore';
import { useAdminStore } from './stores/adminStore';
import { useAuthStore } from './stores/authStore';
import { useMobileHistory } from './hooks/useMobileHistory';
import { recordVisit } from './services/visitorTracker';
import { Sparkles, X } from 'lucide-react';

export default function App() {
  useMobileHistory();
  const { pageView, theme } = useSettingsStore();
  const { initFirestoreSync: initProducts } = useProductStore();
  const { initFirestoreSync: initOrders, latestOrder } = useOrderStore();
  const { initFirestoreSync: initSettings } = useSettingsStore();
  const { initFirestoreSync: initRetailers } = useRetailerStore();
  const { initAttribution, initAdminSync, activeReferralCode, hasShownWelcomeToast, markWelcomeToastShown } = useReferralStore();
  const { initWhitelistSync, openAdmin } = useAdminStore();
  const { initAuth } = useAuthStore();

  const [showReferralWelcome, setShowReferralWelcome] = useState(false);

  // Initialize all Firestore listeners, referral attribution, and visitor tracking on mount
  useEffect(() => {
    recordVisit();
    initAttribution();

    const unsub0 = initAuth();
    const unsub1 = initProducts();
    const unsub2 = initOrders();
    const unsub3 = initSettings();
    const unsub4 = initRetailers();
    const unsub5 = initAdminSync();
    const unsub6 = initWhitelistSync();

    // Check for stealth #admin route in URL
    const checkHash = () => {
      if (window.location.hash === '#admin') {
        openAdmin();
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);

    // Stealth keyboard shortcut for Sagar: Ctrl+Shift+A or Cmd+Shift+A
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        openAdmin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (typeof unsub0 === 'function') unsub0();
      if (typeof unsub1 === 'function') unsub1();
      if (typeof unsub2 === 'function') unsub2();
      if (typeof unsub3 === 'function') unsub3();
      if (typeof unsub4 === 'function') unsub4();
      if (typeof unsub5 === 'function') unsub5();
      if (typeof unsub6 === 'function') unsub6();
      window.removeEventListener('hashchange', checkHash);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Display referral welcome banner on entry if arriving via referral
  useEffect(() => {
    if (activeReferralCode && !hasShownWelcomeToast) {
      setShowReferralWelcome(true);
      const timer = setTimeout(() => {
        setShowReferralWelcome(false);
        markWelcomeToastShown();
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [activeReferralCode, hasShownWelcomeToast]);

  // Apply Dashain theme class
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', theme.accentColor || '#8B3A3A');
    if (theme.isDashainTheme) document.body.classList.add('dashain-theme');
    else document.body.classList.remove('dashain-theme');
  }, [theme.isDashainTheme, theme.accentColor]);

  return (
    <>
      {/* Referral Welcome Notification Banner */}
      {showReferralWelcome && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 80,
            background: 'linear-gradient(135deg, #1B7F5E 0%, #135F46 100%)',
            color: '#FFF',
            padding: '10px 16px',
            borderRadius: 99,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            fontSize: 12.5,
            fontWeight: 600,
            maxWidth: 'calc(100vw - 24px)',
            boxSizing: 'border-box',
          }}
        >
          <Sparkles size={16} color="#D4AF37" />
          <span>
            Welcome to Dawosti! <strong>NPR 300 discount</strong> courtesy of {activeReferralCode} has been applied to your checkout.
          </span>
          <button
            onClick={() => setShowReferralWelcome(false)}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: 2 }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Global header — hidden on order confirmation for cleaner full-screen UX */}
      {pageView !== 'order-confirmation' && <Header />}

      {/* Page views */}
      {pageView === 'home' && <HomePage />}
      {pageView === 'checkout' && <CheckoutPage />}
      {pageView === 'order-confirmation' && latestOrder && <OrderConfirmationPage order={latestOrder} />}

      {/* Global footer — shown on home page */}
      {pageView === 'home' && <Footer />}

      {/* Global overlays */}
      <CartDrawer />
      <RetailerInquiryModal />
      <CreatorPortalModal />
      <AdminModal />
      <ToastContainer />
    </>
  );
}

