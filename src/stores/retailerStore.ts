import { create } from 'zustand';
import { RetailerInquiry } from '../types';
import {
  listenRetailerInquiries,
  saveRetailerInquiry,
  updateRetailerInquiry,
  deleteRetailerInquiry,
} from '../services/firestoreRetailers';

interface RetailerState {
  isWholesaleModalOpen: boolean;
  inquiries: RetailerInquiry[];
  isSubmitting: boolean;
  lastSubmittedInquiry: RetailerInquiry | null;

  // Actions
  openWholesaleModal: () => void;
  closeWholesaleModal: () => void;
  initFirestoreSync: () => () => void;
  submitInquiry: (
    inquiryData: Omit<RetailerInquiry, 'id' | 'createdAt' | 'status'>
  ) => Promise<RetailerInquiry>;
  updateStatus: (inquiryId: string, status: RetailerInquiry['status'], notes?: string) => Promise<void>;
  deleteInquiry: (inquiryId: string) => Promise<void>;
}

export const useRetailerStore = create<RetailerState>((set, get) => ({
  isWholesaleModalOpen: false,
  inquiries: [],
  isSubmitting: false,
  lastSubmittedInquiry: null,

  openWholesaleModal: () => set({ isWholesaleModalOpen: true }),
  closeWholesaleModal: () => set({ isWholesaleModalOpen: false }),

  initFirestoreSync: () => {
    return listenRetailerInquiries((remoteInquiries) => {
      set({ inquiries: remoteInquiries });
    });
  },

  submitInquiry: async (inquiryData) => {
    set({ isSubmitting: true });
    try {
      const fullRecord: RetailerInquiry = {
        ...inquiryData,
        status: 'new',
        createdAt: new Date().toISOString(),
      };
      const saved = await saveRetailerInquiry(fullRecord);
      set({ lastSubmittedInquiry: saved, isSubmitting: false });
      return saved;
    } catch (err) {
      set({ isSubmitting: false });
      throw err;
    }
  },

  updateStatus: async (inquiryId, status, notes) => {
    const updates: Partial<RetailerInquiry> = {
      status,
      ...(notes ? { adminNotes: notes } : {}),
    };
    await updateRetailerInquiry(inquiryId, updates);
    set((state) => ({
      inquiries: state.inquiries.map((inq) =>
        inq.id === inquiryId ? { ...inq, ...updates } : inq
      ),
    }));
  },

  deleteInquiry: async (inquiryId) => {
    await deleteRetailerInquiry(inquiryId);
    set((state) => ({
      inquiries: state.inquiries.filter((inq) => inq.id !== inquiryId),
    }));
  },
}));
