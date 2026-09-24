import { create } from 'zustand';
import { AdminWhitelistEntry, GoogleUser } from '../types';
import { signInWithGoogle, signOutUser, onAuthChange } from '../services/firebaseAuth';
import {
  listenWhitelist,
  addWhitelistEntry,
  removeWhitelistEntry,
  checkIsEmailWhitelisted,
  MASTER_OWNER_EMAILS,
} from '../services/firestoreWhitelist';

export type AdminTab = 'profit' | 'orders' | 'referrals' | 'whitelist' | 'catalog';

interface AdminState {
  isAdminModalOpen: boolean;
  adminActiveTab: AdminTab;
  currentUser: GoogleUser | null;
  isAuthorizedAdmin: boolean;
  whitelistEntries: AdminWhitelistEntry[];
  authError: string | null;
  isAuthLoading: boolean;

  // Actions
  openAdmin: () => void;
  closeAdmin: () => void;
  setAdminTab: (tab: AdminTab) => void;
  initWhitelistSync: () => () => void;
  loginGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  addEmailToWhitelist: (email: string, role?: AdminWhitelistEntry['role'], notes?: string) => Promise<void>;
  removeEmailFromWhitelist: (emailOrId: string) => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  isAdminModalOpen: false,
  adminActiveTab: 'profit',
  currentUser: null,
  isAuthorizedAdmin: false,
  whitelistEntries: [],
  authError: null,
  isAuthLoading: false,

  openAdmin: () => {
    set({ isAdminModalOpen: true });
    // Check current hash
    if (window.location.hash !== '#admin') {
      try {
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#admin`);
      } catch {}
    }
  },

  closeAdmin: () => {
    set({ isAdminModalOpen: false });
    if (window.location.hash === '#admin') {
      try {
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
      } catch {}
    }
  },

  setAdminTab: (tab) => set({ adminActiveTab: tab }),

  initWhitelistSync: () => {
    // 1. Listen to real-time whitelist from Firestore
    const unsubWhitelist = listenWhitelist((entries) => {
      set({ whitelistEntries: entries });

      // Re-verify current logged-in user against fresh whitelist
      const user = get().currentUser;
      if (user && user.email) {
        const isAuth = checkIsEmailWhitelisted(user.email, entries);
        set({ isAuthorizedAdmin: isAuth });
      }
    });

    // 2. Listen to Firebase Auth state
    const unsubAuth = onAuthChange(
      (firebaseUser) => {
        const email = firebaseUser.email || '';
        const isAuth = checkIsEmailWhitelisted(email, get().whitelistEntries);
        set({
          currentUser: {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || email.split('@')[0],
            email,
            avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=8B3A3A&color=fff`,
            isLoggedIn: true,
          },
          isAuthorizedAdmin: isAuth,
          authError: isAuth ? null : `Access Denied: ${email} is not authorized to access Dawosti Admin.`,
        });
      },
      () => {
        set({ currentUser: null, isAuthorizedAdmin: false, authError: null });
      }
    );

    return () => {
      unsubWhitelist();
      unsubAuth();
    };
  },

  loginGoogle: async () => {
    set({ isAuthLoading: true, authError: null });
    try {
      const user = await signInWithGoogle();
      if (!user || !user.email) {
        set({ isAuthLoading: false });
        return false;
      }

      const isWhitelisted = checkIsEmailWhitelisted(user.email, get().whitelistEntries);
      if (!isWhitelisted) {
        set({
          isAuthorizedAdmin: false,
          authError: `Access Denied: Account '${user.email}' is not on the Dawosti Admin Whitelist. Contact Sagar to grant permission.`,
          isAuthLoading: false,
        });
        return false;
      }

      set({
        currentUser: {
          id: user.uid,
          name: user.displayName || user.email.split('@')[0],
          email: user.email,
          avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=8B3A3A&color=fff`,
          isLoggedIn: true,
        },
        isAuthorizedAdmin: true,
        authError: null,
        isAuthLoading: false,
      });
      return true;
    } catch (err: any) {
      set({
        authError: err?.message || 'Authentication failed. Please retry.',
        isAuthLoading: false,
      });
      return false;
    }
  },

  logout: async () => {
    await signOutUser();
    set({ currentUser: null, isAuthorizedAdmin: false, authError: null });
  },

  addEmailToWhitelist: async (email, role = 'staff', notes = '') => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) return;
    const author = get().currentUser?.email || 'Master Owner';
    await addWhitelistEntry({
      email: cleanEmail,
      role,
      addedBy: author,
      addedAt: new Date().toISOString(),
      notes,
    });
  },

  removeEmailFromWhitelist: async (emailOrId) => {
    const clean = emailOrId.trim().toLowerCase();
    // Prevent removing master owners
    if (MASTER_OWNER_EMAILS.some((m) => m.toLowerCase() === clean)) {
      alert('Cannot remove Master Owner email.');
      return;
    }
    await removeWhitelistEntry(clean);
  },
}));
