import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { Order } from '../types';

const COL = 'orders';

/** Listen to real-time order changes. Newest first. */
export const listenOrders = (onUpdate: (orders: Order[]) => void): Unsubscribe => {
  try {
    return onSnapshot(
      collection(db, COL),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onUpdate(list);
      },
      (err) => console.warn('[Firestore] Orders listener error:', err)
    );
  } catch (err) {
    console.warn('[Firestore] Failed to attach orders listener:', err);
    return () => {};
  }
};

/** One-shot fetch of all orders from Firestore. */
export const fetchOrdersFromFirestore = async (): Promise<Order[]> => {
  try {
    const snap = await getDocs(collection(db, COL));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (err) {
    console.warn('[Firestore] fetchOrdersFromFirestore error:', err);
    return [];
  }
};

/** Save a new or updated order to Firestore. */
export const saveOrder = async (order: Order): Promise<void> => {
  try {
    await setDoc(doc(db, COL, order.id), order, { merge: true });
  } catch (err) {
    console.warn('[Firestore] saveOrder failed:', err);
  }
};

/** Update specific fields on an existing order. */
export const updateOrder = async (orderId: string, updates: Partial<Order>): Promise<void> => {
  try {
    await setDoc(doc(db, COL, orderId), updates, { merge: true });
  } catch (err) {
    console.warn('[Firestore] updateOrder failed:', err);
  }
};

/** Delete an order from Firestore. */
export const deleteOrder = async (orderId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COL, orderId));
  } catch (err) {
    console.warn('[Firestore] deleteOrder failed:', err);
  }
};
