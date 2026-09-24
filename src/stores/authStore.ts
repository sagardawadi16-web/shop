import { create } from 'zustand';
import { GoogleUser } from '../types';
import { signInWithGoogle, signOutUser, onAuthChange } from '../services/firebaseAuth';

interface AuthState {
  user: GoogleUser | null;
  isLoading: boolean;
  isUserMenuOpen: boolean;

  // Actions
  initAuth: () => () => void;
  loginGoogle: () => Promise<GoogleUser | null>;
  logout: () => Promise<void>;
  setIsUserMenuOpen: (v: boolean) => void;
}

const STORAGE_USER_KEY = 'dawosti_customer_user_v1';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: (() => {
    try {
      const saved = localStorage.getItem(STORAGE_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })(),
  isLoading: false,
  isUserMenuOpen: false,

  setIsUserMenuOpen: (v) => set({ isUserMenuOpen: v }),

  initAuth: () => {
    const unsubscribe = onAuthChange(
      (firebaseUser) => {
        const email = firebaseUser.email || '';
        const userObj: GoogleUser = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || email.split('@')[0] || 'Customer',
          email,
          avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || email)}&background=8B3A3A&color=fff`,
          isLoggedIn: true,
        };
        try {
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userObj));
        } catch {}
        set({ user: userObj, isLoading: false });
      },
      () => {
        try {
          localStorage.removeItem(STORAGE_USER_KEY);
        } catch {}
        set({ user: null, isLoading: false });
      }
    );
    return unsubscribe;
  },

  loginGoogle: async () => {
    set({ isLoading: true });
    try {
      const firebaseUser = await signInWithGoogle();
      if (!firebaseUser) {
        set({ isLoading: false });
        return null;
      }
      const email = firebaseUser.email || '';
      const userObj: GoogleUser = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || email.split('@')[0] || 'Customer',
        email,
        avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || email)}&background=8B3A3A&color=fff`,
        isLoggedIn: true,
      };
      try {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userObj));
      } catch {}
      set({ user: userObj, isLoading: false });
      return userObj;
    } catch (err) {
      console.warn('[AuthStore] Login failed:', err);
      set({ isLoading: false });
      return null;
    }
  },

  logout: async () => {
    try {
      await signOutUser();
    } catch {}
    try {
      localStorage.removeItem(STORAGE_USER_KEY);
    } catch {}
    set({ user: null, isUserMenuOpen: false });
  },
}));
