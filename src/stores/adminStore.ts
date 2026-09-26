import { create } from 'zustand';
import { AdminRole, AdminWhitelistEntry, GoogleUser } from '../types';
import { signInWithGoogle, signOutUser, onAuthChange } from '../services/firebaseAuth';
import {
  listenWhitelist,
  addWhitelistEntry,
  updateWhitelistRole,
  removeWhitelistEntry,
  checkIsEmailWhitelisted,
  getUserRole,
  getLocalWhitelist,
  MASTER_OWNER_EMAILS,
} from '../services/firestoreWhitelist';
import { toast } from '../components/common/Toast';
import { useSettingsStore } from './settingsStore';

export type AdminTab = 'profit' | 'orders' | 'referrals' | 'retailers' | 'whitelist' | 'payment-qr' | 'catalog';

interface AdminState {
  isAdminModalOpen: boolean;
  adminActiveTab: AdminTab;
  currentUser: GoogleUser | null;
  currentRole: AdminRole | null;
  isAuthorizedAdmin: boolean;
  whitelistEntries: AdminWhitelistEntry[];
  authError: string | null;
  isAuthLoading: boolean;

  // Actions
  openAdmin: () => void;
  closeAdmin: () => void;
  setAdminTab: (tab: AdminTab) => void;
  initWhitelistSync: () => () => void;
  loginGoogle: (preferredEmail?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  addEmailToWhitelist: (email: string, role?: AdminRole, notes?: string) => Promise<void>;
  updateEmailRole: (email: string, role: AdminRole) => Promise<void>;
  removeEmailFromWhitelist: (emailOrId: string) => Promise<void>;
}

/** Check if a given role is allowed to view a specific tab */
export const isTabAllowedForRole = (tab: AdminTab, role: AdminRole | null): boolean => {
  if (!role) return false;
  if (role === 'owner' || role === 'super_admin') return true;
  if (role === 'manager') return tab !== 'whitelist';
  if (role === 'staff') return tab === 'orders' || tab === 'referrals' || tab === 'payment-qr' || tab === 'retailers' || tab === 'catalog';
  return false;
};

export const useAdminStore = create<AdminState>((set, get) => ({
  isAdminModalOpen: false,
  adminActiveTab: 'orders',
  currentUser: null,
  currentRole: null,
  isAuthorizedAdmin: false,
  whitelistEntries: getLocalWhitelist(),
  authError: null,
  isAuthLoading: false,

  openAdmin: () => {
    const role = get().currentRole;
    // Auto-direct staff to orders tab instead of profit
    if (role === 'staff') {
      set({ isAdminModalOpen: true, adminActiveTab: 'orders' });
    } else {
      set({ isAdminModalOpen: true });
    }

    // Sync settingsStore pageView and URL
    if (useSettingsStore.getState().pageView !== 'admin') {
      useSettingsStore.getState().setPageView('admin');
    }
  },

  closeAdmin: () => {
    set({ isAdminModalOpen: false });
    if (useSettingsStore.getState().pageView === 'admin') {
      useSettingsStore.getState().setPageView('home');
    }
    if (typeof window !== 'undefined' && (window.location.hash === '#admin' || window.location.pathname === '/admin')) {
      try {
        window.history.replaceState(null, '', '/');
      } catch {}
    }
  },

  setAdminTab: (tab) => {
    const role = get().currentRole;
    if (!isTabAllowedForRole(tab, role)) {
      console.warn(`Tab '${tab}' is not accessible for role '${role}'`);
      return;
    }
    set({ adminActiveTab: tab });
  },

  initWhitelistSync: () => {
    // 1. Listen to real-time whitelist from Firestore (with immediate local cache emission)
    const unsubWhitelist = listenWhitelist((entries) => {
      set({ whitelistEntries: entries });

      // Re-verify current logged-in user against fresh whitelist
      const user = get().currentUser;
      if (user && user.email) {
        const isAuth = checkIsEmailWhitelisted(user.email, entries);
        const role = getUserRole(user.email, entries);

        let activeTab = get().adminActiveTab;
        if (role === 'staff' && (activeTab === 'profit' || activeTab === 'whitelist')) {
          activeTab = 'orders';
        } else if (role === 'manager' && activeTab === 'whitelist') {
          activeTab = 'profit';
        }

        set({
          isAuthorizedAdmin: isAuth,
          currentRole: role,
          adminActiveTab: activeTab,
          currentUser: { ...user, role: role || undefined },
          authError: isAuth ? null : get().authError,
        });
      }
    });

    // 2. Listen to Firebase Auth state
    const unsubAuth = onAuthChange(
      (firebaseUser) => {
        const email = (firebaseUser.email || '').trim().toLowerCase();
        const currentList = get().whitelistEntries;
        const isAuth = checkIsEmailWhitelisted(email, currentList);
        const role = getUserRole(email, currentList);

        let activeTab = get().adminActiveTab;
        if (role === 'staff' && (activeTab === 'profit' || activeTab === 'whitelist')) {
          activeTab = 'orders';
        } else if (role === 'manager' && activeTab === 'whitelist') {
          activeTab = 'profit';
        }

        const userObj: GoogleUser = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || email.split('@')[0],
          email,
          avatar:
            firebaseUser.photoURL ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=8B3A3A&color=fff`,
          isLoggedIn: true,
          role: role || undefined,
        };

        set({
          currentUser: userObj,
          currentRole: role,
          isAuthorizedAdmin: isAuth,
          adminActiveTab: activeTab,
          authError: isAuth ? null : `Access Denied: ${email} is not authorized to access Dawosti Admin.`,
        });
      },
      () => {
        set({ currentUser: null, currentRole: null, isAuthorizedAdmin: false, authError: null });
      }
    );

    return () => {
      unsubWhitelist();
      unsubAuth();
    };
  },

  loginGoogle: async (preferredEmail?: string) => {
    set({ isAuthLoading: true, authError: null });
    try {
      const user = await signInWithGoogle(preferredEmail);
      if (!user || !user.email) {
        set({ isAuthLoading: false });
        return false;
      }

      const email = user.email.trim().toLowerCase();
      const currentList = get().whitelistEntries;
      const isWhitelisted = checkIsEmailWhitelisted(email, currentList);
      const role = getUserRole(email, currentList);

      if (!isWhitelisted || !role) {
        set({
          isAuthorizedAdmin: false,
          currentRole: null,
          authError: `Access Denied: Account '${email}' is not on the Dawosti Admin Whitelist. Contact Store Administrator to grant permission.`,
          isAuthLoading: false,
        });
        return false;
      }

      let activeTab: AdminTab = get().adminActiveTab;
      if (role === 'staff') {
        activeTab = 'orders';
      } else if (role === 'manager' && activeTab === 'whitelist') {
        activeTab = 'profit';
      }

      set({
        currentUser: {
          id: user.uid,
          name: user.displayName || email.split('@')[0],
          email,
          avatar:
            user.photoURL ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=8B3A3A&color=fff`,
          isLoggedIn: true,
          role,
        },
        currentRole: role,
        adminActiveTab: activeTab,
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
    set({ currentUser: null, currentRole: null, isAuthorizedAdmin: false, authError: null });
  },

  addEmailToWhitelist: async (email, role = 'staff', notes = '') => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) return;

    const author = get().currentUser?.email || 'Master Owner';
    const newEntry = await addWhitelistEntry({
      email: cleanEmail,
      role,
      addedBy: author,
      addedAt: new Date().toISOString(),
      notes,
    });

    // Immediately update local store entries
    const updatedEntries = [
      newEntry,
      ...get().whitelistEntries.filter((e) => e.email.toLowerCase() !== cleanEmail),
    ];
    set({ whitelistEntries: updatedEntries });

    // If current logged-in user updated their own role
    const current = get().currentUser;
    if (current && current.email.toLowerCase() === cleanEmail) {
      set({
        currentRole: role,
        isAuthorizedAdmin: true,
        currentUser: { ...current, role },
      });
    }
  },

  updateEmailRole: async (email, role) => {
    const cleanEmail = email.trim().toLowerCase();
    // Cannot alter permanent master owners
    if (MASTER_OWNER_EMAILS.some((m) => m.toLowerCase() === cleanEmail)) {
      toast('Master Owners always retain Owner role.', 'error');
      return;
    }

    await updateWhitelistRole(cleanEmail, role);

    const updatedEntries = get().whitelistEntries.map((e) =>
      e.email.toLowerCase() === cleanEmail ? { ...e, role } : e
    );
    set({ whitelistEntries: updatedEntries });

    // If updating current user
    const current = get().currentUser;
    if (current && current.email.toLowerCase() === cleanEmail) {
      let activeTab = get().adminActiveTab;
      if (role === 'staff' && (activeTab === 'profit' || activeTab === 'whitelist')) {
        activeTab = 'orders';
      }
      set({
        currentRole: role,
        currentUser: { ...current, role },
        adminActiveTab: activeTab,
      });
    }
  },

  removeEmailFromWhitelist: async (emailOrId) => {
    const clean = emailOrId.trim().toLowerCase();
    // Prevent removing master owners
    if (MASTER_OWNER_EMAILS.some((m) => m.toLowerCase() === clean)) {
      toast('Cannot remove Master Owner email.', 'error');
      return;
    }

    await removeWhitelistEntry(clean);

    const filtered = get().whitelistEntries.filter(
      (e) => e.email.toLowerCase() !== clean && e.id !== clean
    );
    set({ whitelistEntries: filtered });

    // If current user removed themselves
    const current = get().currentUser;
    if (current && current.email.toLowerCase() === clean) {
      set({
        isAuthorizedAdmin: false,
        currentRole: null,
        currentUser: { ...current, role: undefined },
      });
    }
  },
}));
