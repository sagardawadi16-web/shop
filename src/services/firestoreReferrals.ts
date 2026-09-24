import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  Unsubscribe,
  increment,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { ReferralAdvocate, PayoutRequest } from '../types';

const ADVOCATES_COL = 'referral_advocates';
const PAYOUTS_COL = 'payout_requests';

/** Listen to real-time advocates list (for Admin) */
export const listenAdvocates = (onUpdate: (advocates: ReferralAdvocate[]) => void): Unsubscribe => {
  try {
    return onSnapshot(
      collection(db, ADVOCATES_COL),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ReferralAdvocate));
        list.sort((a, b) => b.lifetimeEarned - a.lifetimeEarned);
        onUpdate(list);
      },
      (err) => console.warn('[Firestore] Advocates listener error:', err)
    );
  } catch (err) {
    console.warn('[Firestore] Failed to attach advocates listener:', err);
    return () => {};
  }
};

/** Save or update an advocate */
export const saveAdvocate = async (advocate: ReferralAdvocate): Promise<void> => {
  try {
    await setDoc(doc(db, ADVOCATES_COL, advocate.code), advocate, { merge: true });
  } catch (err) {
    console.warn('[Firestore] saveAdvocate failed:', err);
  }
};

/** Get advocate by code */
export const getAdvocateByCode = async (code: string): Promise<ReferralAdvocate | null> => {
  try {
    const snap = await getDoc(doc(db, ADVOCATES_COL, code.toUpperCase()));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as ReferralAdvocate;
    }
  } catch (err) {
    console.warn('[Firestore] getAdvocateByCode failed:', err);
  }
  return null;
};

/** Increment advocate shares counter */
export const recordAdvocateShare = async (code: string): Promise<void> => {
  try {
    const ref = doc(db, ADVOCATES_COL, code.toUpperCase());
    await updateDoc(ref, {
      sharesCount: increment(1),
    });
  } catch {}
};

/** Increment advocate link clicks counter */
export const recordAdvocateClick = async (code: string): Promise<void> => {
  try {
    const ref = doc(db, ADVOCATES_COL, code.toUpperCase());
    await updateDoc(ref, {
      clicksCount: increment(1),
    });
  } catch {}
};

/** Listen to payout requests (for Admin & Creator) */
export const listenPayoutRequests = (onUpdate: (requests: PayoutRequest[]) => void): Unsubscribe => {
  try {
    return onSnapshot(
      collection(db, PAYOUTS_COL),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PayoutRequest));
        list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
        onUpdate(list);
      },
      (err) => console.warn('[Firestore] Payout requests listener error:', err)
    );
  } catch (err) {
    console.warn('[Firestore] Failed to attach payout listener:', err);
    return () => {};
  }
};

/** Submit a new payout request (minimum NPR 10,000 threshold enforced) */
export const submitPayoutRequest = async (request: PayoutRequest): Promise<void> => {
  try {
    await setDoc(doc(db, PAYOUTS_COL, request.id), request, { merge: true });
  } catch (err) {
    console.warn('[Firestore] submitPayoutRequest failed:', err);
  }
};

/** Admin updates payout status (e.g. approve with eSewa transaction ref) */
export const updatePayoutStatus = async (
  requestId: string,
  updates: Partial<PayoutRequest>
): Promise<void> => {
  try {
    await setDoc(doc(db, PAYOUTS_COL, requestId), updates, { merge: true });
  } catch (err) {
    console.warn('[Firestore] updatePayoutStatus failed:', err);
  }
};

/** Credit commission to advocate upon successful delivery */
export const creditAdvocateOrder = async (code: string, commissionAmount: number): Promise<void> => {
  try {
    const cleanCode = code.toUpperCase().trim();
    const ref = doc(db, ADVOCATES_COL, cleanCode);
    await updateDoc(ref, {
      ordersDeliveredCount: increment(1),
      withdrawableBalance: increment(commissionAmount),
      lifetimeEarned: increment(commissionAmount),
    });
  } catch (err) {
    console.warn('[Firestore] creditAdvocateOrder error:', err);
  }
};

