import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { RetailerInquiry } from '../types';

const COL = 'retailer_inquiries';

/** Listen to incoming retailer inquiries in real-time. Newest first. */
export const listenRetailerInquiries = (
  onUpdate: (inquiries: RetailerInquiry[]) => void
): Unsubscribe => {
  try {
    return onSnapshot(
      collection(db, COL),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as RetailerInquiry));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onUpdate(list);
      },
      (err) => console.warn('[Firestore] Retailer inquiries listener error:', err)
    );
  } catch (err) {
    console.warn('[Firestore] Failed to attach retailer inquiries listener:', err);
    return () => {};
  }
};

/** Save a new or updated retailer inquiry to Firestore and edge API. */
export const saveRetailerInquiry = async (inquiry: RetailerInquiry): Promise<RetailerInquiry> => {
  const id = inquiry.id || `ret_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const record: RetailerInquiry = {
    ...inquiry,
    id,
    createdAt: inquiry.createdAt || new Date().toISOString(),
    status: inquiry.status || 'new',
  };

  // 1. Save to Firestore
  try {
    await setDoc(doc(db, COL, id), record, { merge: true });
  } catch (err) {
    console.warn('[Firestore] saveRetailerInquiry failed, falling back to local/edge:', err);
  }

  // 2. Best-effort mirror to Cloudflare Edge API
  try {
    fetch('/api/retailers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    }).catch(() => {});
  } catch {}

  return record;
};

/** Update specific fields of a retailer inquiry (e.g., status, notes). */
export const updateRetailerInquiry = async (
  inquiryId: string,
  updates: Partial<RetailerInquiry>
): Promise<void> => {
  try {
    await setDoc(doc(db, COL, inquiryId), updates, { merge: true });
  } catch (err) {
    console.warn('[Firestore] updateRetailerInquiry failed:', err);
  }
};

/** Delete a retailer inquiry from Firestore. */
export const deleteRetailerInquiry = async (inquiryId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COL, inquiryId));
  } catch (err) {
    console.warn('[Firestore] deleteRetailerInquiry failed:', err);
  }
};
