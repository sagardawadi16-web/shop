import { create } from 'zustand';
import { GoogleUser } from '../types';
import { signInWithGoogle, signOutUser, onAuthChange } from '../services/firebaseAuth';

const OWNER_EMAILS = ['sagardawadi10@gmail.com', 'sagardawadi16@gmail.com'];
const LS_KEY = 'dawosti_user_v3';

const loadUser = (): GoogleUser | null => {
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

  // Admin panel
  isAdminOpen: boolean;
  isAuthenticated: boolean; // true if owner OR correct passcode entered
  requirePasscode: boolean;
  passcode: string;

  // Actions
  initAuth: () => () => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  openAdmin: () => void;
  closeAdmin: () => void;
  unlockAdmin: (pin: string) => boolean;
  lockAdmin: () => void;
  setRequirePasscode: (v: boolean) => void;
  setPasscode: (p: string) => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  user: loadUser(),
  isOwner: OWNER_EMAILS.includes(loadUser()?.email?.toLowerCase() || ''),
  isSigningIn: false,
  authError: null,
  isAdminOpen: false,
  isAuthenticated: true, // Default: open access (owner can lock with passcode if desired)
  requirePasscode: false,
  passcode: '1234',

  initAuth: () => {
    return onAuthChange(
      (firebaseUser) => {
        const user: GoogleUser = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Customer',
          email: firebaseUser.email || '',
          avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || 'U')}&background=8B3A3A&color=fff`,
          isLoggedIn: true,
        };
        const isOwner = OWNER_EMAILS.includes(user.email.toLowerCase());
        try { localStorage.setItem(LS_KEY, JSON.stringify(user)); } catch {}
        set({ user, isOwner, isAuthenticated: isOwner ? true : get().isAuthenticated });
      },
      () => {
        // Firebase session ended — only clear if localStorage is also empty
        const saved = loadUser();
        if (!saved) set({ user: null, isOwner: false });
      }
    );
  },

  signIn: async () => {
    set({ isSigningIn: true, authError: null });
    const firebaseUser = await signInWithGoogle();
    if (!firebaseUser) {
      set({ isSigningIn: false, authError: 'Sign-in was cancelled or failed. Please try again.' });
      setTimeout(() => set({ authError: null }), 4000);
      return;
    }
    // onAuthChange will handle setting user state
    set({ isSigningIn: false });
  },

  signOut: async () => {
    await signOutUser();
    try { localStorage.removeItem(LS_KEY); } catch {}
    set({ user: null, isOwner: false, isAuthenticated: true });
  },

  openAdmin: () => set({ isAdminOpen: true }),
  closeAdmin: () => set({ isAdminOpen: false }),

  unlockAdmin: (pin) => {
    const { requirePasscode, passcode, isOwner } = get();
    if (isOwner || !requirePasscode) { set({ isAuthenticated: true }); return true; }
    if (pin.trim() === passcode.trim()) { set({ isAuthenticated: true }); return true; }
    return false;
  },

  lockAdmin: () => set({ isAuthenticated: false }),
  setRequirePasscode: (v) => set({ requirePasscode: v }),
  setPasscode: (p) => set({ passcode: p }),
}));
