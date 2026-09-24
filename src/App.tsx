/**
 * Dawosti Boutique — Production E-Commerce Platform
 * dawosti.com | Cloudflare Pages | Firebase Firestore
 */
import React, { useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { CartDrawer } from './components/cart/CartDrawer';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ToastContainer } from './components/common/Toast';
import { HomePage } from './pages/HomePage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { useProductStore } from './stores/productStore';
import { useOrderStore } from './stores/orderStore';
import { useSettingsStore } from './stores/settingsStore';
import { useAdminStore } from './stores/adminStore';
import { useMobileHistory } from './hooks/useMobileHistory';

export default function App() {
  useMobileHistory();
  const { pageView, theme } = useSettingsStore();
  const { initFirestoreSync: initProducts } = useProductStore();
  const { initFirestoreSync: initOrders, latestOrder } = useOrderStore();
  const { initFirestoreSync: initSettings } = useSettingsStore();
  const { initAuth } = useAdminStore();

  // Initialize all Firestore listeners and Firebase auth on mount
  useEffect(() => {
    const unsub1 = initProducts();
    const unsub2 = initOrders();
    const unsub3 = initSettings();
    const unsub4 = initAuth();
    return () => {
      if (typeof unsub1 === 'function') unsub1();
      if (typeof unsub2 === 'function') unsub2();
      if (typeof unsub3 === 'function') unsub3();
      if (typeof unsub4 === 'function') unsub4();
    };
  }, []);

  // Apply Dashain theme class
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', theme.accentColor || '#8B3A3A');
    if (theme.isDashainTheme) document.body.classList.add('dashain-theme');
    else document.body.classList.remove('dashain-theme');
  }, [theme.isDashainTheme, theme.accentColor]);

  return (
    <>
      {/* Global header — hidden on order confirmation and admin for cleaner full-screen UX */}
      {pageView !== 'order-confirmation' && pageView !== 'admin' && <Header />}

      {/* Page views */}
      {pageView === 'home' && <HomePage />}
      {pageView === 'checkout' && <CheckoutPage />}
      {pageView === 'order-confirmation' && latestOrder && <OrderConfirmationPage order={latestOrder} />}
      {pageView === 'admin' && <AdminDashboard />}

      {/* Global footer — hidden during checkout and admin */}
      {pageView === 'home' && <Footer />}

      {/* Global overlays */}
      <CartDrawer />
      <ToastContainer />
    </>
  );
}
