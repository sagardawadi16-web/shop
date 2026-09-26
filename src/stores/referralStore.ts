import { create } from 'zustand';
import { ReferralAdvocate, PayoutRequest } from '../types';
import {
  saveAdvocate,
  getAdvocateByCode,
  recordAdvocateClick,
  recordAdvocateShare,
  submitPayoutRequest,
  listenAdvocates,
  listenPayoutRequests,
} from '../services/firestoreReferrals';

interface AttributionToken {
  code: string;
  capturedAt: number;
  expiresAt: number;
}

interface ReferralState {
  // Attribution for current buyer
  activeReferralCode: string | null;
  referralDiscountAmount: number; // Welcome discount for friend (NPR 300)
  hasShownWelcomeToast: boolean;

  // Creator / Advocate Portal UI
  isCreatorPortalOpen: boolean;
  isTosModalOpen: boolean;
  currentAdvocate: ReferralAdvocate | null;

  // Admin view
  allAdvocates: ReferralAdvocate[];
  allPayoutRequests: PayoutRequest[];

  // Actions
  initAttribution: () => void;
  openCreatorPortal: () => void;
  closeCreatorPortal: () => void;
  openTosModal: () => void;
  closeTosModal: () => void;
  markWelcomeToastShown: () => void;

  // Advocate Actions
  registerOrLoginAdvocate: (params: {
    fullName: string;
    phone: string;
    socialHandle?: string;
    email?: string;
  }) => Promise<ReferralAdvocate>;
  recordShare: (platform?: string) => Promise<void>;
  submitPayout: (params: {
    paymentMethod: 'esewa' | 'khalti' | 'bank';
    paymentDetails: string;
  }) => Promise<{ success: boolean; message: string }>;

  // Admin Sync
  initAdminSync: () => () => void;

  registeredCreators: Record<string, { code: string; name: string; email: string }>;
  registerCreator: (code: string, name: string, email: string) => void;
}

const STORAGE_ATTR_KEY = 'dawosti_ref_token_v1';
const STORAGE_ADVOCATE_KEY = 'dawosti_active_advocate_v1';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
export const PAYOUT_MINIMUM_THRESHOLD = 10000; // NPR 10,000
export const FRIEND_WELCOME_DISCOUNT = 300; // NPR 300 discount for the invited friend

export const SEED_ADVOCATES: ReferralAdvocate[] = [
  {
    id: 'adv_sagar_82',
    code: 'SAGAR-82',
    fullName: 'Sagar Dawadi',
    phone: '9801234567',
    email: 'contact.dawosti@gmail.com',
    socialHandle: '@sagardawadi',
    clicksCount: 248,
    sharesCount: 42,
    ordersDeliveredCount: 14,
    pendingBalance: 1120,
    withdrawableBalance: 12400,
    lifetimeEarned: 18600,
    createdAt: '2026-08-15T00:00:00.000Z',
    status: 'active',
    payoutPreferredMethod: 'esewa',
    payoutAccountIdentifier: '9801234567',
    esewaId: '9801234567',
    khaltiNumber: '9801234567',
    totalSalesVolume: 124000,
  },
  {
    id: 'adv_anusha_24',
    code: 'ANUSHA-24',
    fullName: 'Anusha Shrestha',
    phone: '9812345678',
    email: 'anusha.fashion@gmail.com',
    socialHandle: '@anusha.curates',
    clicksCount: 310,
    sharesCount: 65,
    ordersDeliveredCount: 19,
    pendingBalance: 960,
    withdrawableBalance: 15200,
    lifetimeEarned: 22800,
    createdAt: '2026-08-20T00:00:00.000Z',
    status: 'active',
    payoutPreferredMethod: 'esewa',
    payoutAccountIdentifier: '9812345678',
    esewaId: '9812345678',
    khaltiNumber: '9812345678',
    totalSalesVolume: 152000,
  },
  {
    id: 'adv_prashant_10',
    code: 'PRASHANT-10',
    fullName: 'Prashant Thapa',
    phone: '9841987654',
    email: 'prashant.thapa@gmail.com',
    socialHandle: '@prashant_looks',
    clicksCount: 142,
    sharesCount: 28,
    ordersDeliveredCount: 7,
    pendingBalance: 1220,
    withdrawableBalance: 6800,
    lifetimeEarned: 16800,
    createdAt: '2026-09-01T00:00:00.000Z',
    status: 'active',
    payoutPreferredMethod: 'khalti',
    payoutAccountIdentifier: '9841987654',
    esewaId: '9841987654',
    khaltiNumber: '9841987654',
    totalSalesVolume: 68000,
  },
  {
    id: 'adv_dawosti_vip',
    code: 'DAWOSTI-VIP',
    fullName: 'Guild Atelier Ambassador',
    phone: '9860112233',
    email: 'atelier@dawosti.com',
    socialHandle: '@dawosti_guild',
    clicksCount: 88,
    sharesCount: 15,
    ordersDeliveredCount: 4,
    pendingBalance: 480,
    withdrawableBalance: 3600,
    lifetimeEarned: 3600,
    createdAt: '2026-09-10T00:00:00.000Z',
    status: 'active',
    payoutPreferredMethod: 'esewa',
    payoutAccountIdentifier: '9860112233',
    esewaId: '9860112233',
    totalSalesVolume: 36000,
  },
];

export const SEED_PAYOUT_REQUESTS: PayoutRequest[] = [
  {
    id: 'payout_req_1',
    advocateId: 'adv_sagar_82',
    advocateCode: 'SAGAR-82',
    advocateName: 'Sagar Dawadi',
    advocatePhone: '9801234567',
    requestedAmount: 12400,
    paymentMethod: 'esewa',
    paymentDetails: '9801234567 (Sagar Dawadi)',
    status: 'pending_audit',
    requestedAt: '2026-09-24T12:00:00.000Z',
    auditNotes: 'Auto-submitted via Creator Portal. Balance exceeds NPR 10k threshold.',
  },
  {
    id: 'payout_req_2',
    advocateId: 'adv_anusha_24',
    advocateCode: 'ANUSHA-24',
    advocateName: 'Anusha Shrestha',
    advocatePhone: '9812345678',
    requestedAmount: 15200,
    paymentMethod: 'esewa',
    paymentDetails: '9812345678 (Anusha Shrestha)',
    status: 'pending_audit',
    requestedAt: '2026-09-24T14:30:00.000Z',
    auditNotes: 'Auto-submitted via Creator Portal. Verified 19 delivered orders.',
  },
  {
    id: 'payout_req_3',
    advocateId: 'adv_prashant_10',
    advocateCode: 'PRASHANT-10',
    advocateName: 'Prashant Thapa',
    advocatePhone: '9841987654',
    requestedAmount: 10000,
    paymentMethod: 'khalti',
    paymentDetails: '9841987654 (Prashant Thapa)',
    status: 'approved_paid',
    requestedAt: '2026-09-18T10:00:00.000Z',
    auditedAt: '2026-09-19T09:00:00.000Z',
    paidAt: '2026-09-19T09:15:00.000Z',
    transactionRef: 'KHL-9928174',
    auditNotes: 'Audited and paid via Khalti. Ref: KHL-9928174',
  },
];

export const useReferralStore = create<ReferralState>((set, get) => ({
  activeReferralCode: null,
  referralDiscountAmount: 0,
  hasShownWelcomeToast: false,
  isCreatorPortalOpen: false,
  isTosModalOpen: false,
  currentAdvocate: null,
  allAdvocates: SEED_ADVOCATES,
  allPayoutRequests: SEED_PAYOUT_REQUESTS,
  registeredCreators: {},

  registerCreator: (code: string, name: string, email: string) => {
    set((state) => ({
      registeredCreators: {
        ...state.registeredCreators,
        [code]: { code, name, email },
      },
    }));
  },

  initAttribution: () => {
    try {
      // 1. Check URL parameters (?ref=CODE or ?invite=CODE)
      const urlParams = new URLSearchParams(window.location.search);
      const refParam = urlParams.get('ref') || urlParams.get('invite');

      if (refParam && refParam.trim().length >= 3) {
        const cleanCode = refParam.trim().toUpperCase();
        const token: AttributionToken = {
          code: cleanCode,
          capturedAt: Date.now(),
          expiresAt: Date.now() + THIRTY_DAYS_MS,
        };
        localStorage.setItem(STORAGE_ATTR_KEY, JSON.stringify(token));
        set({
          activeReferralCode: cleanCode,
          referralDiscountAmount: FRIEND_WELCOME_DISCOUNT,
        });

        // Record click analytics asynchronously
        recordAdvocateClick(cleanCode).catch(() => {});

        // Clean query parameters from address bar cleanly without page reload
        try {
          urlParams.delete('ref');
          urlParams.delete('invite');
          const cleanQuery = urlParams.toString() ? `?${urlParams.toString()}` : '';
          const newUrl = `${window.location.pathname}${cleanQuery}${window.location.hash}`;
          window.history.replaceState({}, document.title, newUrl);
        } catch {}
      } else {
        // 2. Check local storage for existing active token within 30-day window
        const saved = localStorage.getItem(STORAGE_ATTR_KEY);
        if (saved) {
          const token: AttributionToken = JSON.parse(saved);
          if (token.expiresAt > Date.now() && token.code) {
            set({
              activeReferralCode: token.code,
              referralDiscountAmount: FRIEND_WELCOME_DISCOUNT,
            });
          } else {
            localStorage.removeItem(STORAGE_ATTR_KEY);
          }
        }
      }

      // 3. Restore current advocate profile if previously saved in session
      const savedAdvocate = localStorage.getItem(STORAGE_ADVOCATE_KEY);
      if (savedAdvocate) {
        set({ currentAdvocate: JSON.parse(savedAdvocate) });
      }
    } catch (err) {
      console.warn('[ReferralStore] initAttribution error:', err);
    }
  },

  openCreatorPortal: () => {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host.endsWith('dawosti.com') && !host.startsWith('referral.') && !host.startsWith('creator.')) {
        const savedLang = localStorage.getItem('dawosti_lang') || 'en';
        window.location.href = `https://referral.dawosti.com?lang=${savedLang}`;
        return;
      }
    }
    set({ isCreatorPortalOpen: true });
  },
  closeCreatorPortal: () => set({ isCreatorPortalOpen: false }),
  openTosModal: () => set({ isTosModalOpen: true }),
  closeTosModal: () => set({ isTosModalOpen: false }),
  markWelcomeToastShown: () => set({ hasShownWelcomeToast: true }),

  registerOrLoginAdvocate: async ({ fullName, phone, socialHandle, email }) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const cleanName = fullName.trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8) || 'DAWOSTI';
    const codeSuffix = cleanPhone.slice(-4) || Math.floor(1000 + Math.random() * 9000).toString();
    const generatedCode = `${cleanName}-${codeSuffix}`;

    // Check if advocate already exists with this code or phone
    const existing = await getAdvocateByCode(generatedCode);
    if (existing) {
      localStorage.setItem(STORAGE_ADVOCATE_KEY, JSON.stringify(existing));
      set({ currentAdvocate: existing });
      return existing;
    }

    const newAdvocate: ReferralAdvocate = {
      id: `adv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      code: generatedCode,
      fullName: fullName.trim(),
      phone: cleanPhone,
      email: email?.trim(),
      socialHandle: socialHandle?.trim(),
      clicksCount: 0,
      sharesCount: 0,
      ordersDeliveredCount: 0,
      pendingBalance: 0,
      withdrawableBalance: 0,
      lifetimeEarned: 0,
      createdAt: new Date().toISOString(),
      status: 'active',
      payoutPreferredMethod: 'esewa',
      payoutAccountIdentifier: cleanPhone,
    };

    await saveAdvocate(newAdvocate);
    localStorage.setItem(STORAGE_ADVOCATE_KEY, JSON.stringify(newAdvocate));
    set({ currentAdvocate: newAdvocate });
    return newAdvocate;
  },

  recordShare: async () => {
    const advocate = get().currentAdvocate;
    if (!advocate) return;
    const updated = {
      ...advocate,
      sharesCount: advocate.sharesCount + 1,
    };
    set({ currentAdvocate: updated });
    localStorage.setItem(STORAGE_ADVOCATE_KEY, JSON.stringify(updated));
    await recordAdvocateShare(advocate.code);
  },

  submitPayout: async ({ paymentMethod, paymentDetails }) => {
    const advocate = get().currentAdvocate;
    if (!advocate) {
      return { success: false, message: 'Please sign in to your Creator Account.' };
    }

    if (advocate.withdrawableBalance < PAYOUT_MINIMUM_THRESHOLD) {
      return {
        success: false,
        message: `Minimum withdrawal requirement is NPR ${PAYOUT_MINIMUM_THRESHOLD.toLocaleString()}. Your current withdrawable balance is NPR ${advocate.withdrawableBalance.toLocaleString()}.`,
      };
    }

    const newRequest: PayoutRequest = {
      id: `payout_${Date.now()}_${advocate.code}`,
      advocateId: advocate.id,
      advocateCode: advocate.code,
      advocateName: advocate.fullName,
      advocatePhone: advocate.phone,
      requestedAmount: advocate.withdrawableBalance,
      paymentMethod,
      paymentDetails,
      status: 'pending_audit',
      requestedAt: new Date().toISOString(),
      auditNotes: 'Auto-submitted via Creator Portal. Pending delivery & 7-day return verification.',
    };

    await submitPayoutRequest(newRequest);

    // Optimistically update advocate withdrawable balance
    const updated = {
      ...advocate,
      withdrawableBalance: 0,
    };
    set({ currentAdvocate: updated });
    localStorage.setItem(STORAGE_ADVOCATE_KEY, JSON.stringify(updated));
    await saveAdvocate(updated);

    return {
      success: true,
      message: `Withdrawal request for NPR ${newRequest.requestedAmount.toLocaleString()} submitted successfully. Our merchant desk will audit and process your eSewa/Bank transfer.`,
    };
  },

  initAdminSync: () => {
    const unsub1 = listenAdvocates((list) => {
      if (list && list.length > 0) {
        set({ allAdvocates: list });
      } else {
        set((state) => ({
          allAdvocates: state.allAdvocates.length > 0 ? state.allAdvocates : SEED_ADVOCATES,
        }));
      }
    });
    const unsub2 = listenPayoutRequests((list) => {
      if (list && list.length > 0) {
        set({ allPayoutRequests: list });
      } else {
        set((state) => ({
          allPayoutRequests: state.allPayoutRequests.length > 0 ? state.allPayoutRequests : SEED_PAYOUT_REQUESTS,
        }));
      }
    });
    return () => {
      unsub1();
      unsub2();
    };
  },
}));
