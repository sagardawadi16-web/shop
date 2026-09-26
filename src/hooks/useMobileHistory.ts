import { useEffect, useRef } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { useProductStore } from '../stores/productStore';
import { useCartStore } from '../stores/cartStore';
import { toast } from '../components/common/Toast';

/**
 * useMobileHistory
 * 
 * Prevents mobile devices from navigating away to Google when the user
 * taps the phone's native hardware back button or swipe-to-back gesture.
 * 
 * Automatically captures back events and handles:
 * 1. Product Detail Modal -> closes modal, stays on home
 * 2. Cart Drawer -> closes cart, stays on home
 * 3. Checkout Page -> returns to home
 * 4. Order Confirmation Page -> returns to home
 * 5. Root Exit Guard -> protects against accidental exit with "Press back again to exit"
 */
export const useMobileHistory = () => {
  const { pageView, setPageView } = useSettingsStore();
  const { activeDetailProduct, setActiveDetailProduct } = useProductStore();
  const { isOpen: isCartOpen, setIsOpen: setCartOpen } = useCartStore();

  const lastBackPressTime = useRef<number>(0);
  const isNavigatingByPopState = useRef<boolean>(false);

  // Initialize history entry on mount so mobile back doesn't immediately leave site
  useEffect(() => {
    try {
      window.history.replaceState({ __dawosti: true, page: 'home', depth: 0 }, '', window.location.pathname);
      window.history.pushState({ __dawosti: true, page: 'home', depth: 1 }, '', window.location.pathname);
    } catch (e) {
      console.warn('[History] Init error:', e);
    }
  }, []);

  // Sync Product Modal with history
  useEffect(() => {
    if (isNavigatingByPopState.current) return;

    if (activeDetailProduct) {
      const hash = `#product-${activeDetailProduct.slug || activeDetailProduct.id}`;
      if (window.location.hash !== hash) {
        window.history.pushState(
          { __dawosti: true, type: 'product', id: activeDetailProduct.id },
          '',
          hash
        );
      }
    } else {
      if (window.location.hash.startsWith('#product-')) {
        // Clean URL hash without triggering an artificial back navigation
        const targetHash = pageView === 'checkout' ? '#checkout' : pageView === 'order-confirmation' ? '#order-confirmed' : '';
        window.history.replaceState(
          { __dawosti: true, page: pageView },
          '',
          window.location.pathname + targetHash
        );
      }
    }
  }, [activeDetailProduct, pageView]);

  // Sync Cart Drawer with history
  useEffect(() => {
    if (isNavigatingByPopState.current) return;

    if (isCartOpen) {
      if (window.location.hash !== '#cart') {
        window.history.pushState({ __dawosti: true, type: 'cart' }, '', '#cart');
      }
    } else {
      if (window.location.hash === '#cart') {
        // Clean URL hash without calling history.back(), avoiding race conditions with checkout
        const targetHash = pageView === 'checkout' ? '#checkout' : pageView === 'order-confirmation' ? '#order-confirmed' : '';
        window.history.replaceState(
          { __dawosti: true, page: pageView },
          '',
          window.location.pathname + targetHash
        );
      }
    }
  }, [isCartOpen, pageView]);

  // Sync PageView (checkout / order-confirmation) with history
  useEffect(() => {
    if (isNavigatingByPopState.current) return;

    if (pageView === 'checkout') {
      if (window.location.hash !== '#checkout') {
        window.history.pushState({ __dawosti: true, page: 'checkout' }, '', '#checkout');
      }
    } else if (pageView === 'order-confirmation') {
      if (window.location.hash !== '#order-confirmed') {
        window.history.pushState({ __dawosti: true, page: 'order-confirmation' }, '', '#order-confirmed');
      }
    } else if (pageView === 'home') {
      if (window.location.hash === '#checkout' || window.location.hash === '#order-confirmed') {
        window.history.replaceState({ __dawosti: true, page: 'home' }, '', window.location.pathname);
      }
    }
  }, [pageView]);

  // Listen for the native phone back button / swipe back gesture / browser back
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      isNavigatingByPopState.current = true;

      try {
        // 1. If product detail modal is open, close it
        if (useProductStore.getState().activeDetailProduct) {
          setActiveDetailProduct(null);
          return;
        }

        // 2. If cart drawer is open, close it
        if (useCartStore.getState().isOpen) {
          setCartOpen(false);
          return;
        }

        // 3. If on checkout or order confirmation, return smoothly to home view
        const currentView = useSettingsStore.getState().pageView;
        if (currentView === 'checkout' || currentView === 'order-confirmation') {
          setPageView('home');
          return;
        }

        // 4. User is at the root homepage with no modals open:
        const now = Date.now();
        if (now - lastBackPressTime.current < 2500) {
          // Second press within 2.5s: allow native browser exit
          window.history.back();
          return;
        }

        // First back press: protect against accidental tab closure / exiting to Google
        lastBackPressTime.current = now;
        toast('Press back again to exit Dawosti');
        // Push state back so next back press triggers popstate again
        window.history.pushState({ __dawosti: true, page: 'home', depth: 1 }, '', window.location.pathname);
      } finally {
        setTimeout(() => {
          isNavigatingByPopState.current = false;
        }, 120);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [setActiveDetailProduct, setCartOpen, setPageView]);
};
