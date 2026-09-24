import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { AdminWhitelistEntry } from '../types';

const COL = 'admin_whitelist';

// Master immutable owner emails (always authorized)
export const MASTER_OWNER_EMAILS = [
  'sagardawadi16@gmail.com',
  'sagardawadi10@gmail.com',
];

/**
 * Check if a given email is whitelisted as Admin
 */
export const checkIsEmailWhitelisted = (
  email: string | null | undefined,
  dynamicList: AdminWhitelistEntry[] = []
): boolean => {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  if (MASTER_OWNER_EMAILS.some((owner) => owner.toLowerCase() === clean)) {
    return true;
  }
  return dynamicList.some((entry) => entry.email.trim().toLowerCase() === clean);
};

/** Listen to real-time whitelist changes */
export const listenWhitelist = (onUpdate: (entries: AdminWhitelistEntry[]) => void): Unsubscribe => {
  try {
    return onSnapshot(
      collection(db, COL),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AdminWhitelistEntry));
        onUpdate(list);
      },
      (err) => console.warn('[Firestore] Whitelist listener error:', err)
    );
  } catch (err) {
    console.warn('[Firestore] Failed to attach whitelist listener:', err);
    return () => {};
  }
};

/** Add a new email to admin whitelist */
export const addWhitelistEntry = async (entry: Omit<AdminWhitelistEntry, 'id'>): Promise<string> => {
  const docId = entry.email.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const fullEntry: AdminWhitelistEntry = { id: docId, ...entry };
  try {
    await setDoc(doc(db, COL, docId), fullEntry, { merge: true });
    return docId;
  } catch (err) {
    console.warn('[Firestore] addWhitelistEntry failed:', err);
    return docId;
  }
};

/** Remove an email from admin whitelist */
export const removeWhitelistEntry = async (idOrEmail: string): Promise<void> => {
  const docId = idOrEmail.toLowerCase().replace(/[^a-z0-9]/g, '_');
  try {
    await deleteDoc(doc(db, COL, docId));
  } catch (err) {
    console.warn('[Firestore] removeWhitelistEntry failed:', err);
  }
};
