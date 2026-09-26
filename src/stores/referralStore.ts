import { create } from 'zustand';
import { ReferralAdvocate, PayoutRequest } from '../types';
import { useSettingsStore } from './settingsStore';
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
    requestedCode?: string;
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

export const useReferralStore = create<ReferralState>((set, get) => ({
  activeReferralCode: null,
  referralDiscountAmount: 0,
  hasShownWelcomeToast: false,
  isCreatorPortalOpen: false,
  isTosModalOpen: false,
  currentAdvocate: null,
  allAdvocates: [],
  allPayoutRequests: [],
  registeredCreators: {},

  registerCreator: (code: string, name: string, email: string) => {
    const upper = code.trim().toUpperCase();
    const existing = get().allAdvocates.find((a) => a.code.toUpperCase() === upper);
    if (existing && existing.email?.toLowerCase() !== email.toLowerCase()) {
      throw new Error(`Referral code "${upper}" is already owned by another creator.`);
    }
    const current = get().registeredCreators;
    if (current[upper] && current[upper].email.toLowerCase() !== email.toLowerCase()) {
      throw new Error(`Referral code "${upper}" is already registered by another creator.`);
    }
    set((state) => ({
      registeredCreators: {
        ...state.registeredCreators,
        [upper]: { code: upper, name, email },
      },
    }));
  },

  initAttribution: () => {
    try {
      // 1. Check URL parameters (?ref=CODE, ?invite=CODE, ?creator=CODE, ?code=CODE, or hash / path)
      const urlParams = new URLSearchParams(window.location.search);
      let refParam = urlParams.get('ref') || urlParams.get('invite') || urlParams.get('creator') || urlParams.get('code');

      // Check hash parameters (e.g., #ref=SAGAR-82)
      if (!refParam && window.location.hash.includes('ref=')) {
        const hashMatch = window.location.hash.match(/[#&]ref=([^&]+)/);
        if (hashMatch) refParam = decodeURIComponent(hashMatch[1]);
      }

      // Check URL path (e.g. /r/SAGAR-82 or /ref/SAGAR-82)
      if (!refParam) {
        const segments = window.location.pathname.split('/').filter(Boolean);
        if ((segments[0] === 'r' || segments[0] === 'c' || segments[0] === 'ref') && segments[1]) {
          refParam = decodeURIComponent(segments[1]);
        }
      }

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
          urlParams.delete('creator');
          urlParams.delete('code');
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
    // Open in-app referral view without external subdomain redirects so auth session is preserved
    try {
      useSettingsStore.getState().setPageView('referral');
      if (typeof window !== 'undefined' && window.location.hash !== '#referral') {
        window.history.pushState({ page: 'referral' }, '', '#referral');
      }
    } catch {}
    set({ isCreatorPortalOpen: false });
  },
  closeCreatorPortal: () => set({ isCreatorPortalOpen: false }),
  openTosModal: () => set({ isTosModalOpen: true }),
  closeTosModal: () => set({ isTosModalOpen: false }),
  markWelcomeToastShown: () => set({ hasShownWelcomeToast: true }),

  registerOrLoginAdvocate: async ({ fullName, phone, socialHandle, email, requestedCode }) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const cleanName = fullName.trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8) || 'DAWOSTI';

    // 1. Check if an advocate with this phone number is already registered (existing user logging in)
    const existingByPhone = get().allAdvocates.find((a) => a.phone === cleanPhone);
    if (existingByPhone) {
      localStorage.setItem(STORAGE_ADVOCATE_KEY, JSON.stringify(existingByPhone));
      set({ currentAdvocate: existingByPhone });
      return existingByPhone;
    }

    // 2. Validate custom requestedCode OR auto-generate a guaranteed unique code
    let targetCode = (requestedCode ? requestedCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '') : '').slice(0, 16);

    if (targetCode) {
      // Uniqueness rule: Two people CANNOT have the same code!
      const existingWithCode =
        (await getAdvocateByCode(targetCode)) ||
        get().allAdvocates.find((a) => a.code.toUpperCase() === targetCode.toUpperCase());
      if (existingWithCode && existingWithCode.phone !== cleanPhone) {
        throw new Error(`Referral code "${targetCode}" is already claimed by another creator. Two people cannot use the same reference code.`);
      }
    } else {
      // Auto-generate code and loop until guaranteed strictly unique across all creators
      const codeSuffix = cleanPhone.slice(-4) || Math.floor(1000 + Math.random() * 9000).toString();
      targetCode = `${cleanName}-${codeSuffix}`;
      let attempts = 0;
      while (
        attempts < 20 &&
        ((await getAdvocateByCode(targetCode)) ||
          get().allAdvocates.some((a) => a.code.toUpperCase() === targetCode.toUpperCase()))
      ) {
        attempts++;
        targetCode = `${cleanName}-${Math.floor(1000 + Math.random() * 9000)}`;
      }
    }

    // Double check that targetCode is unique
    const collisionCheck =
      (await getAdvocateByCode(targetCode)) ||
      get().allAdvocates.find((a) => a.code.toUpperCase() === targetCode.toUpperCase());
    if (collisionCheck && collisionCheck.phone !== cleanPhone) {
      throw new Error(`Referral code "${targetCode}" is already taken by another creator.`);
    }

    const newAdvocate: ReferralAdvocate = {
      id: `adv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      code: targetCode,
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
    set((state) => ({
      currentAdvocate: newAdvocate,
      allAdvocates: [...state.allAdvocates.filter((a) => a.id !== newAdvocate.id), newAdvocate],
    }));
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
      set({ allAdvocates: list || [] });
    });
    const unsub2 = listenPayoutRequests((list) => {
      set({ allPayoutRequests: list || [] });
    });
    return () => {
      unsub1();
      unsub2();
    };
  },
}));
