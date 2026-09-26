import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { AdminRole, AdminWhitelistEntry } from '../types';

const COL = 'admin_whitelist';
const STORAGE_WHITELIST_KEY = 'dawosti_admin_whitelist_v2';

// Master immutable owner emails (always authorized as Owner)
export const MASTER_OWNER_EMAILS = [
  'sagardawadi16@gmail.com',
  'sagardawadi10@gmail.com',
];

/** Read locally cached whitelist entries */
export const getLocalWhitelist = (): AdminWhitelistEntry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(STORAGE_WHITELIST_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/** Save whitelist entries to local cache for resilient offline/auth fallback */
export const saveLocalWhitelist = (entries: AdminWhitelistEntry[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_WHITELIST_KEY, JSON.stringify(entries));
  } catch {}
};

/**
 * Determine the exact role of an email ('owner' | 'super_admin' | 'manager' | 'staff' | null)
 */
export const getUserRole = (
  email: string | null | undefined,
  dynamicList: AdminWhitelistEntry[] = []
): AdminRole | null => {
  if (!email) return null;
  const clean = email.trim().toLowerCase();

  // 1. Master immutable owners are always 'owner'
  if (MASTER_OWNER_EMAILS.some((owner) => owner.toLowerCase() === clean)) {
    return 'owner';
  }

  // 2. Check dynamic list passed in
  const foundDynamic = dynamicList.find((entry) => entry.email.trim().toLowerCase() === clean);
  if (foundDynamic) {
    return foundDynamic.role;
  }

  // 3. Fallback to local cache in case Firestore snapshot is still loading or unavailable
  const cachedList = getLocalWhitelist();
  const foundCached = cachedList.find((entry) => entry.email.trim().toLowerCase() === clean);
  if (foundCached) {
    return foundCached.role;
  }

  return null;
};

/**
 * Check if a given email is whitelisted with any administrative role
 */
export const checkIsEmailWhitelisted = (
  email: string | null | undefined,
  dynamicList: AdminWhitelistEntry[] = []
): boolean => {
  return getUserRole(email, dynamicList) !== null;
};

/** Listen to real-time whitelist changes with immediate local cache emission */
export const listenWhitelist = (onUpdate: (entries: AdminWhitelistEntry[]) => void): Unsubscribe => {
  // 1. Immediately emit local cache so callers don't face an empty list on auth state change
  const initialCache = getLocalWhitelist();
  if (initialCache.length > 0) {
    onUpdate(initialCache);
  }

  // 2. Attach real-time Firestore listener
  try {
    return onSnapshot(
      collection(db, COL),
      (snap) => {
        const firestoreList = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            email: (data.email || '').trim().toLowerCase(),
            role: (data.role || 'staff') as AdminRole,
            addedBy: data.addedBy || 'System Root',
            addedAt: data.addedAt || new Date().toISOString(),
            notes: data.notes || '',
          } as AdminWhitelistEntry;
        });

        // Merge Firestore entries with existing local cache (Firestore takes priority)
        const mergedMap = new Map<string, AdminWhitelistEntry>();
        getLocalWhitelist().forEach((item) => mergedMap.set(item.email.toLowerCase(), item));
        firestoreList.forEach((item) => mergedMap.set(item.email.toLowerCase(), item));

        const finalEntries = Array.from(mergedMap.values());
        saveLocalWhitelist(finalEntries);
        onUpdate(finalEntries);
      },
      (err) => {
        console.warn('[Firestore] Whitelist listener error (using local cache fallback):', err);
        // On error, re-emit cached entries
        onUpdate(getLocalWhitelist());
      }
    );
  } catch (err) {
    console.warn('[Firestore] Failed to attach whitelist listener:', err);
    onUpdate(getLocalWhitelist());
    return () => {};
  }
};

/** Add or update an email in the admin whitelist with immediate local update */
export const addWhitelistEntry = async (entry: Omit<AdminWhitelistEntry, 'id'>): Promise<AdminWhitelistEntry> => {
  const cleanEmail = entry.email.trim().toLowerCase();
  const docId = cleanEmail.replace(/[^a-z0-9]/g, '_');
  const fullEntry: AdminWhitelistEntry = {
    id: docId,
    email: cleanEmail,
    role: entry.role || 'staff',
    addedBy: entry.addedBy || 'Admin',
    addedAt: entry.addedAt || new Date().toISOString(),
    notes: entry.notes || '',
  };

  // 1. Immediately persist to localStorage for instant local reliability
  const current = getLocalWhitelist().filter((e) => e.email.toLowerCase() !== cleanEmail);
  current.unshift(fullEntry);
  saveLocalWhitelist(current);

  // 2. Persist to Firestore
  try {
    await setDoc(doc(db, COL, docId), fullEntry, { merge: true });
  } catch (err) {
    console.warn('[Firestore] addWhitelistEntry Firestore sync failed (cached locally):', err);
  }

  // 3. Sync to Edge API in background if online
  try {
    fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'whitelist_add',
        entry: fullEntry,
      }),
    }).catch(() => {});
  } catch {}

  return fullEntry;
};

/** Update role of an existing whitelisted email */
export const updateWhitelistRole = async (email: string, role: AdminRole): Promise<void> => {
  const cleanEmail = email.trim().toLowerCase();
  const docId = cleanEmail.replace(/[^a-z0-9]/g, '_');

  const current = getLocalWhitelist();
  const index = current.findIndex((e) => e.email.toLowerCase() === cleanEmail);
  if (index > -1) {
    current[index].role = role;
    saveLocalWhitelist(current);
  }

  try {
    await setDoc(doc(db, COL, docId), { role }, { merge: true });
  } catch (err) {
    console.warn('[Firestore] updateWhitelistRole Firestore sync failed:', err);
  }
};

/** Remove an email from admin whitelist with immediate local update */
export const removeWhitelistEntry = async (idOrEmail: string): Promise<void> => {
  const clean = idOrEmail.trim().toLowerCase();
  const docId = clean.replace(/[^a-z0-9]/g, '_');

  // 1. Immediately remove from local cache
  const filtered = getLocalWhitelist().filter(
    (e) => e.email.toLowerCase() !== clean && e.id !== clean && e.id !== docId
  );
  saveLocalWhitelist(filtered);

  // 2. Remove from Firestore
  try {
    await deleteDoc(doc(db, COL, docId));
  } catch (err) {
    console.warn('[Firestore] removeWhitelistEntry Firestore sync failed:', err);
  }

  // 3. Edge API sync
  try {
    fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'whitelist_remove',
        email: clean,
      }),
    }).catch(() => {});
  } catch {}
};
