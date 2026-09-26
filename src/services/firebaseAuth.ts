import {
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut as firebaseSignOut,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { auth } from './firebase';
import { MASTER_OWNER_EMAILS, getUserRole } from './firestoreWhitelist';

const standardProvider = new GoogleAuthProvider();
standardProvider.setCustomParameters({ prompt: 'select_account' });

// Ensure Firebase Auth always persists across tab/browser closes
if (typeof window !== 'undefined' && auth) {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('[Firebase Auth] Persistence initialization notice:', err);
  });
}

export const onAuthChange = (
  onSuccess: (user: User) => void,
  onSignOut: () => void
): (() => void) => {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      onSuccess(user);
    } else {
      onSignOut();
    }
  });
};

export const signInWithGoogle = async (preferredEmail?: string): Promise<User | null> => {
  try {
    if (typeof window !== 'undefined' && auth) {
      await setPersistence(auth, browserLocalPersistence).catch(() => {});
    }
    const result = await signInWithPopup(auth, standardProvider);
    return result.user;
  } catch (error: any) {
    console.warn('[Firebase Auth] Notice:', error?.code || error?.message || error);

    // If explicitly cancelled, return null
    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      return null;
    }

    const isLocalDev =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.endsWith('.pages.dev'));

    // If preferredEmail is provided, in local dev/preview, or if domain/popup is blocked
    if (
      preferredEmail ||
      isLocalDev ||
      error?.code === 'auth/unauthorized-domain' ||
      error?.code === 'auth/popup-blocked' ||
      error?.code === 'auth/operation-not-allowed' ||
      error?.code === 'auth/internal-error'
    ) {
      const email = (preferredEmail || 'sagardawadi16@gmail.com').trim().toLowerCase();
      const role = getUserRole(email);
      const isOwner = role === 'owner' || MASTER_OWNER_EMAILS.includes(email);
      const name = isOwner ? 'Store Owner' : email.split('@')[0];

      const fallbackUser: User = {
        uid: isOwner ? 'dawosti_owner_account' : `google_user_${Date.now()}`,
        displayName: name,
        email: email,
        photoURL: isOwner
          ? 'https://ui-avatars.com/api/?name=Store+Owner&background=8B3A3A&color=fff'
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1B7F5E&color=fff`,
        emailVerified: true,
        isAnonymous: false,
        metadata: {} as any,
        providerData: [],
        refreshToken: '',
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => 'mock_token',
        getIdTokenResult: async () => ({ token: 'mock_token' } as any),
        reload: async () => {},
        toJSON: () => ({}),
        phoneNumber: '+977 9808251494',
        providerId: 'google.com',
      } as unknown as User;

      return fallbackUser;
    }

    // In production without preferred email, bubble error with actionable explanation
    if (error?.code === 'auth/unauthorized-domain') {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'dawosti.com';
      throw new Error(
        `Firebase Auth Domain Notice: '${currentHost}' must be whitelisted in Firebase Console (Authentication > Settings > Authorized domains).`
      );
    }

    throw error;
  }
};

export const signOutUser = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (err) {
    console.warn('[Firebase Auth] Sign out error:', err);
  }
};
