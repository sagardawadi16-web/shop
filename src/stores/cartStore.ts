import { create } from 'zustand';
import { CartItem, Product, ProductSize } from '../types';

const LS_KEY = 'dawosti_cart_v3';

const loadCart = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as CartItem[];
  } catch {}
  return [];
};

const persistCart = (items: CartItem[]) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  } catch {}
};

interface CartState {
  items: CartItem[];
  isOpen: boolean;

  // Derived
  count: number;
  subtotal: number;

  // Actions
  addItem: (product: Product, size: ProductSize, qty?: number) => void;
  removeItem: (productId: string, size: ProductSize) => void;
  updateQty: (productId: string, size: ProductSize, delta: number) => void;
  clearCart: () => void;
  setIsOpen: (open: boolean) => void;
  toggleCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => {
  const initial = loadCart();
  return {
    items: initial,
    isOpen: false,
    count: initial.reduce((s, i) => s + i.quantity, 0),
    subtotal: initial.reduce((s, i) => s + i.product.price * i.quantity, 0),

    addItem: (product, size, qty = 1) => {
      const prev = get().items;
      const idx = prev.findIndex((i) => i.product.id === product.id && i.selectedSize === size);
      let next: CartItem[];
      if (idx > -1) {
        next = prev.map((i, n) => (n === idx ? { ...i, quantity: i.quantity + qty } : i));
      } else {
        next = [...prev, { product, selectedSize: size, quantity: qty, addedAt: new Date().toISOString() }];
      }
      persistCart(next);
      set({
        items: next,
        isOpen: true,
        count: next.reduce((s, i) => s + i.quantity, 0),
        subtotal: next.reduce((s, i) => s + i.product.price * i.quantity, 0),
      });
    },

    removeItem: (productId, size) => {
      const next = get().items.filter((i) => !(i.product.id === productId && i.selectedSize === size));
      persistCart(next);
      set({ items: next, count: next.reduce((s, i) => s + i.quantity, 0), subtotal: next.reduce((s, i) => s + i.product.price * i.quantity, 0) });
    },

    updateQty: (productId, size, delta) => {
      const next = get().items
        .map((i) => {
          if (i.product.id === productId && i.selectedSize === size) {
            const q = i.quantity + delta;
            return q > 0 ? { ...i, quantity: q } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[];
      persistCart(next);
      set({ items: next, count: next.reduce((s, i) => s + i.quantity, 0), subtotal: next.reduce((s, i) => s + i.product.price * i.quantity, 0) });
    },

    clearCart: () => {
      persistCart([]);
      set({ items: [], count: 0, subtotal: 0 });
    },

    setIsOpen: (open) => set({ isOpen: open }),
    toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
  };
});
