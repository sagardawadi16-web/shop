import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { Product } from '../types';

const COL = 'products';

/** Listen to real-time product changes. Always fires, even when collection is empty. */
export const listenProducts = (onUpdate: (products: Product[]) => void): Unsubscribe => {
  try {
    return onSnapshot(
      collection(db, COL),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
        onUpdate(list);
      },
      (err) => console.warn('[Firestore] Products listener error:', err)
    );
  } catch (err) {
    console.warn('[Firestore] Failed to attach products listener:', err);
    return () => {};
  }
};

/** Save (create or update) a product in Firestore. */
export const saveProduct = async (product: Product): Promise<void> => {
  try {
    await setDoc(doc(db, COL, product.id), product, { merge: true });
  } catch (err) {
    console.warn('[Firestore] saveProduct failed:', err);
  }
};

/** Delete a product from Firestore. */
export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COL, productId));
  } catch (err) {
    console.warn('[Firestore] deleteProduct failed:', err);
  }
};

/** Seed initial products if collection is empty. */
export const seedProductsIfEmpty = async (initialProducts: Product[]): Promise<void> => {
  try {
    const snap = await getDocs(collection(db, COL));
    if (!snap.empty) return; // Already has products

    const batch = writeBatch(db);
    initialProducts.forEach((p) => {
      batch.set(doc(db, COL, p.id), p);
    });
    await batch.commit();
    console.info(`[Firestore] Seeded ${initialProducts.length} products.`);
  } catch (err) {
    console.warn('[Firestore] seedProductsIfEmpty failed:', err);
  }
};

/** Delete all known demo / mock products from Firestore (daw-001 to daw-008). */
export const deleteAllDemoProducts = async (): Promise<number> => {
  const DEMO_IDS = [
    'daw-001', 'daw-002', 'daw-003', 'daw-004',
    'daw-005', 'daw-006', 'daw-007', 'daw-008',
  ];
  let deleted = 0;
  const batch = writeBatch(db);
  // Also scan the collection for any remaining demo-style IDs
  try {
    const snap = await getDocs(collection(db, COL));
    snap.docs.forEach((d) => {
      if (DEMO_IDS.includes(d.id) || d.id.startsWith('daw-0')) {
        batch.delete(doc(db, COL, d.id));
        deleted++;
      }
    });
    if (deleted > 0) await batch.commit();
  } catch (err) {
    console.warn('[Firestore] deleteAllDemoProducts failed:', err);
  }
  return deleted;
};
