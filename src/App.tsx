import React, { useEffect, useState, lazy, Suspense } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { CartDrawer } from './components/cart/CartDrawer';
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

// Lazy load heavy admin & secondary views to shrink initial 4G bundle
const ReferralPage = lazy(() =>
  import('./pages/ReferralPage').then((m) => ({ default: m.ReferralPage }))
);
const RetailerInquiryModal = lazy(() =>
  import('./components/wholesale/RetailerInquiryModal').then((m) => ({ default: m.RetailerInquiryModal }))
);
const AdminModal = lazy(() =>
  import('./components/admin/AdminModal').then((m) => ({ default: m.AdminModal }))
);
const CreatorPortalModal = lazy(() =>
  import('./components/referral/CreatorPortalModal').then((m) => ({ default: m.CreatorPortalModal }))
);
const OrderTrackingModal = lazy(() =>
  import('./components/orders/OrderTrackingModal').then((m) => ({ default: m.OrderTrackingModal }))
);

export default function App() {
  useMobileHistory();
  const { pageView, setPageView, theme } = useSettingsStore();
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

    // Check for referral subdomain (referral.dawosti.com), path, or hash
    const checkSubdomain = () => {
      const host = window.location.hostname;
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (
        host.startsWith('referral.') ||
        host.startsWith('creator.') ||
        path.startsWith('/referral') ||
        path.startsWith('/creator') ||
        hash === '#referral' ||
        hash === '#creator'
      ) {
        setPageView('referral');
      }
    };
    checkSubdomain();
    window.addEventListener('hashchange', checkSubdomain);

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
      window.removeEventListener('hashchange', checkSubdomain);
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
            दावोस्तीमा स्वागत छ! <strong>NPR ३०० छुट</strong> ({activeReferralCode}) तपाईंको अर्डरमा लागू भएको छ।
          </span>
          <button
            onClick={() => setShowReferralWelcome(false)}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: 2 }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Global header — hidden on order confirmation and dedicated referral subdomain */}
      {pageView !== 'order-confirmation' && pageView !== 'referral' && <Header />}

      {/* Page views */}
      {pageView === 'home' && <HomePage />}
      {pageView === 'checkout' && <CheckoutPage />}
      {pageView === 'order-confirmation' && (
        latestOrder ? (
          <OrderConfirmationPage order={latestOrder} />
        ) : (
          <div style={{ minHeight: '65vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', textAlign: 'center' }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontWeight: 700, marginBottom: 8, color: '#2B1810' }}>
              No recent order found in this session
            </h2>
            <p style={{ color: '#6B564C', marginBottom: 24, fontSize: 14, maxWidth: 440 }}>
              If you recently placed an order, you can look up its live delivery status anytime with our Order Tracking tool.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setPageView('home')} className="btn btn-primary" style={{ padding: '10px 24px' }}>
                ← Return to Boutique
              </button>
              <button onClick={() => useSettingsStore.getState().setIsOrderTrackingOpen(true)} className="btn btn-outline" style={{ padding: '10px 20px', borderColor: '#8B3A3A', color: '#8B3A3A' }}>
                🔍 Track Past Order
              </button>
            </div>
          </div>
        )
      )}
      {pageView === 'referral' && (
        <Suspense fallback={<div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Portal...</div>}>
          <ReferralPage />
        </Suspense>
      )}

      {/* Global footer — shown on home page */}
      {pageView === 'home' && <Footer />}

      {/* Global cart overlay */}
      <CartDrawer />

      {/* Lazy Overlays */}
      <Suspense fallback={null}>
        <RetailerInquiryModal />
        <CreatorPortalModal />
        <AdminModal />
        <OrderTrackingModal />
      </Suspense>

      <ToastContainer />
    </>
  );
}
