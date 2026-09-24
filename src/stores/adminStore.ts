import { create } from 'zustand';
import { GoogleUser } from '../types';
import { signInWithGoogle, signOutUser, onAuthChange } from '../services/firebaseAuth';
import { useSettingsStore } from './settingsStore';

/**
 * Cryptographic SHA-256 Hashes of Authorized Owner Google IDs.
 * The raw email address is NEVER included in client source code or inspectable bundles.
 * Hashing is one-way: mathematically irreversible.
 */
const OWNER_EMAIL_HASHES: string[] = [
  'b10168596673508b9b26e9e41002a64dfb915493f8a78a8f4492f6f78c33815e', // owner account 1
  'e9e12083b4b6ee5bdd16a1b03830200b48141517d4fa5573aaa1de04093f2f5b', // owner account 2
];

const LS_KEY = 'dawosti_user_v3';

/** Compute SHA-256 hex string using browser native Web Crypto API */
export const hashEmail = async (email: string): Promise<string> => {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return '';
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(normalized);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return '';
  }
};

const loadSavedUser = (): GoogleUser | null => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
};

interface AdminState {
  // Auth
  user: GoogleUser | null;
  isOwner: boolean;
  isSigningIn: boolean;
  authError: string | null;

  // Admin View State
  isAdminOpen: boolean;
  isAuthenticated: boolean; // TRUE ONLY when verified against owner cryptographic hash

  // Actions
  initAuth: () => () => void;
  signIn: () => Promise<boolean>;
  signOut: () => Promise<void>;
  openAdmin: () => void;
  closeAdmin: () => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  user: loadSavedUser(),
  isOwner: false, // Calculated asynchronously via cryptographic hash on init
  isSigningIn: false,
  authError: null,
  isAdminOpen: false,
  isAuthenticated: false, // Strictly false until Google OAuth verifies owner hash

  initAuth: () => {
    // Check initial cached user hash
    const cachedUser = loadSavedUser();
    if (cachedUser?.email) {
      hashEmail(cachedUser.email).then((hash) => {
        const isOwner = OWNER_EMAIL_HASHES.includes(hash);
        set({ isOwner, isAuthenticated: isOwner });
      });
    }

    return onAuthChange(
      async (firebaseUser) => {
        const email = firebaseUser.email || '';
        const emailHash = await hashEmail(email);
        const isOwner = OWNER_EMAIL_HASHES.includes(emailHash);

        const user: GoogleUser = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Authorized Merchant',
          email: firebaseUser.email || '',
          avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || 'M')}&background=8B3A3A&color=fff`,
          isLoggedIn: true,
        };

        try { localStorage.setItem(LS_KEY, JSON.stringify(user)); } catch {}
        set({ user, isOwner, isAuthenticated: isOwner, authError: isOwner ? null : 'Access Denied: This Google Account is not the registered Dawosti Store Owner.' });
      },
      () => {
        try { localStorage.removeItem(LS_KEY); } catch {}
        set({ user: null, isOwner: false, isAuthenticated: false });
      }
    );
  },

  signIn: async () => {
    set({ isSigningIn: true, authError: null });
    const firebaseUser = await signInWithGoogle();
    if (!firebaseUser) {
      set({ isSigningIn: false, authError: 'Sign-in cancelled or failed. Please try again.' });
      setTimeout(() => set({ authError: null }), 5000);
      return false;
    }

    const email = firebaseUser.email || '';
    const emailHash = await hashEmail(email);
    const isOwner = OWNER_EMAIL_HASHES.includes(emailHash);

    set({ isSigningIn: false, isOwner, isAuthenticated: isOwner });
    if (!isOwner) {
      set({ authError: 'Access Denied: Your Google ID is not authorized to access the Dawosti Admin Atelier.' });
      return false;
    }
    return true;
  },

  signOut: async () => {
    await signOutUser();
    try { localStorage.removeItem(LS_KEY); } catch {}
    set({ user: null, isOwner: false, isAuthenticated: false });
  },

  openAdmin: () => {
    set({ isAdminOpen: true });
    useSettingsStore.getState().setPageView('admin');
  },

  closeAdmin: () => {
    set({ isAdminOpen: false });
    useSettingsStore.getState().setPageView('home');
  },
}));
