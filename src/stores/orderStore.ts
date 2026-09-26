import { create } from 'zustand';
import { Order, OrderStatus, CartItem, ShippingAddress, PaymentMethod, OrderVerificationStatus, OrderVerification } from '../types';
import { listenOrders, saveOrder, updateOrder, deleteOrder } from '../services/firestoreOrders';
import { creditAdvocateOrder } from '../services/firestoreReferrals';
import { useReferralStore } from './referralStore';

interface OrderState {
  orders: Order[];
  latestOrder: Order | null;
  unacknowledgedCount: number;

  // Actions
  initFirestoreSync: () => () => void;
  placeOrder: (params: {
    items: CartItem[];
    subtotal: number;
    deliveryFee: number;
    discountAmount: number;
    totalAmount: number;
    shippingAddress: ShippingAddress;
    paymentMethod: PaymentMethod;
    paymentDetails?: string;
    notes?: string;
    customerName?: string;
    referredByCode?: string;
    referralDiscountAmount?: number;
  }) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus, trackingInfo?: { courierName?: string; trackingNumber?: string; logisticsNotes?: string }) => void;
  acknowledgeOrder: (orderId: string) => void;
  verifyOrder: (orderId: string, status: OrderVerificationStatus, notes?: string, method?: OrderVerification['method']) => void;
  deleteOrder: (orderId: string) => void;
  clearAllOrders: () => void;
  setLatestOrder: (order: Order | null) => void;
  trackByNumber: (search: string) => Order | null;
}

const LOCAL_STORAGE_KEY = 'dawosti_local_orders_v2';

const loadLocalOrders = (): Order[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalOrders = (orders: Order[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(orders));
  } catch {}
};

const mergeOrdersLists = (...lists: Order[][]): Order[] => {
  const map = new Map<string, Order>();

  // Merge all lists — later arrays override earlier entries
  lists.forEach((list) => {
    (list || []).forEach((o) => {
      if (o && o.id) {
        map.set(o.id, o);
      }
    });
  });

  const merged = Array.from(map.values());
  merged.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  return merged;
};

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: loadLocalOrders(),
  latestOrder: null,
  unacknowledgedCount: 0,

  initFirestoreSync: () => {
    // 1. Initial hydration from local cache
    const initialLocal = loadLocalOrders();
    const initialUnack = initialLocal.filter((o) => !o.acknowledgedByAdmin).length;
    set({ orders: initialLocal, unacknowledgedCount: initialUnack });

    // 2. Real-time Firestore sync
    const unsubscribe = listenOrders((remoteOrders) => {
      const currentLocal = loadLocalOrders();
      const currentOrders = get().orders;
      const updated = mergeOrdersLists(currentOrders, currentLocal, remoteOrders);
      const unackCount = updated.filter((o) => !o.acknowledgedByAdmin).length;
      set({ orders: updated, unacknowledgedCount: unackCount });
      saveLocalOrders(updated);
    });

    // 3. One-shot Edge API /api/orders fallback sync for real orders recorded at edge
    if (typeof window !== 'undefined') {
      fetch('/api/orders')
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.orders) && data.orders.length > 0) {
            const edgeOrders: Order[] = data.orders;
            const currentLocal = loadLocalOrders();
            const currentOrders = get().orders;
            const updated = mergeOrdersLists(currentOrders, currentLocal, edgeOrders);
            const unackCount = updated.filter((o) => !o.acknowledgedByAdmin).length;
            set({ orders: updated, unacknowledgedCount: unackCount });
            saveLocalOrders(updated);
          }
        })
        .catch(() => {});
    }

    return unsubscribe;
  },

  placeOrder: (params) => {
    const orderNumber = `DAW-${Math.floor(100000 + Math.random() * 900000)}`;
    const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    // Calculate Fraud Risk Score (0-100)
    const phoneClean = (params.shippingAddress.phone || '').replace(/[^0-9]/g, '');
    const isStandardNepalPhone = /^(98|97|96)[0-9]{8}$/.test(phoneClean);
    const hasSufficientAddress = (params.shippingAddress.addressLine || '').length >= 5;
    let fraudScore = 5;
    if (!isStandardNepalPhone) fraudScore += 40;
    if (!hasSufficientAddress) fraudScore += 30;
    if (params.paymentMethod === 'cod' && params.totalAmount > 20000) fraudScore += 25; // Large COD
    const fraudRisk: 'low' | 'medium' | 'high' = fraudScore >= 60 ? 'high' : fraudScore >= 35 ? 'medium' : 'low';

    // Calculate Wholesale / Bulk Buyer Potential
    const totalQty = params.items.reduce((acc, item) => acc + item.quantity, 0);
    const wholesaleReasons: string[] = [];
    if (totalQty >= 5) wholesaleReasons.push(`Bulk Quantity (${totalQty} pcs)`);
    if (params.totalAmount >= 25000) wholesaleReasons.push(`High Basket (NPR ${params.totalAmount.toLocaleString()})`);

    const productSizeMap: Record<string, Set<string>> = {};
    for (const item of params.items) {
      const pid = item.product.id;
      if (!productSizeMap[pid]) productSizeMap[pid] = new Set();
      productSizeMap[pid].add(item.selectedSize);
    }
    for (const sizes of Object.values(productSizeMap)) {
      if (sizes.size >= 3) {
        wholesaleReasons.push(`Multi-size SKU Pack (${sizes.size} sizes)`);
        break;
      }
    }

    const addrLower = `${params.shippingAddress.addressLine} ${params.shippingAddress.city}`.toLowerCase();
    const commercialKeywords = ['new road', 'bishal bazar', 'labim', 'durbar marg', 'lakeside', 'narayangarh', 'boutique', 'collection', 'thamel', 'civil mall'];
    const matchedKeyword = commercialKeywords.find((kw) => addrLower.includes(kw));
    if (matchedKeyword) wholesaleReasons.push(`Commercial Hub (${matchedKeyword})`);

    const isWholesaleLead = wholesaleReasons.length > 0;
    const wholesaleReason = wholesaleReasons.join(' • ');

    // Calculate Unit Economics & Referral Profit Margin Formula
    const costPriceTotal = params.items.reduce((acc, item) => {
      const unitCost = item.product.costPrice || Math.round(item.product.price * 0.42);
      return acc + unitCost * item.quantity;
    }, 0);

    const netMerchandise = Math.max(0, params.subtotal - (params.referralDiscountAmount || 0));
    const referralCommissionAmount = params.referredByCode ? Math.round(netMerchandise * 0.10) : 0;
    const shippingCostActual = params.deliveryFee || 150;
    const netProfitCalculated = params.totalAmount - costPriceTotal - shippingCostActual - referralCommissionAmount;

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      items: params.items,
      subtotalAmount: params.subtotal,
      discountAmount: params.discountAmount,
      deliveryFee: params.deliveryFee,
      totalAmount: params.totalAmount,
      shippingAddress: params.shippingAddress,
      paymentMethod: params.paymentMethod,
      paymentDetails: params.paymentDetails,
      status: 'pending',
      createdAt: new Date().toISOString(),
      notes: params.notes,
      acknowledgedByAdmin: false,
      customerLoginName: params.customerName || 'Guest',
      courierPartner: 'Sundar Express Logistics',
      isWholesaleLead,
      wholesaleReason: isWholesaleLead ? wholesaleReason : undefined,
      referredByCode: params.referredByCode,
      referralDiscountAmount: params.referralDiscountAmount || 0,
      referralCommissionAmount,
      costPriceTotal,
      shippingCostActual,
      netProfitCalculated,
      verification: {
        status: 'unverified',
        fraudScore,
        fraudRisk,
        verificationNotes: isStandardNepalPhone ? 'Valid Nepal mobile format detected' : 'Warning: Non-standard phone number format',
      },
    };

    // Optimistic local update & LocalStorage save
    const updated = mergeOrdersLists(get().orders, [newOrder]);
    const unackCount = updated.filter((o) => !o.acknowledgedByAdmin).length;
    set({ orders: updated, latestOrder: newOrder, unacknowledgedCount: unackCount });
    saveLocalOrders(updated);

    // Persist to Firestore (source of truth)
    saveOrder(newOrder);

    return newOrder;
  },

  updateOrderStatus: (orderId, status, trackingInfo = {}) => {
    const target = get().orders.find((o) => o.id === orderId || o.orderNumber === orderId);
    const updates: Partial<Order> = {
      status,
      ...trackingInfo,
      ...(status === 'shipped' ? { dispatchDate: new Date().toISOString() } : {}),
    };
    const updated = get().orders.map((o) =>
      o.id === orderId || o.orderNumber === orderId ? { ...o, ...updates } : o
    );
    const unackCount = updated.filter((o) => !o.acknowledgedByAdmin).length;
    set({ orders: updated, unacknowledgedCount: unackCount });
    saveLocalOrders(updated);
    if (target) updateOrder(target.id, updates);

    // If order was delivered and was referred by an advocate, credit advocate exact 10% commission (if not already credited)
    if (status === 'delivered' && target && target.referredByCode && !target.referralCommissionCredited) {
      const commissionToCredit =
        target.referralCommissionAmount ||
        Math.round((target.subtotalAmount - (target.referralDiscountAmount || 0)) * 0.10) ||
        500;
      updates.referralCommissionCredited = true;
      updates.referralCommissionCreditedAt = new Date().toISOString();
      updates.referralCommissionAmount = commissionToCredit;

      creditAdvocateOrder(target.referredByCode, commissionToCredit).catch(() => {});

      try {
        const { allAdvocates } = useReferralStore.getState();
        const updatedAdvocates = (allAdvocates || []).map((adv) => {
          if (adv.code.toUpperCase() === target.referredByCode!.toUpperCase()) {
            return {
              ...adv,
              ordersDeliveredCount: (adv.ordersDeliveredCount || 0) + 1,
              withdrawableBalance: (adv.withdrawableBalance || 0) + commissionToCredit,
              lifetimeEarned: (adv.lifetimeEarned || 0) + commissionToCredit,
            };
          }
          return adv;
        });
        useReferralStore.setState({ allAdvocates: updatedAdvocates });
      } catch {}
    }
  },

  acknowledgeOrder: (orderId) => {
    const updates: Partial<Order> = { acknowledgedByAdmin: true, status: 'confirmed' };
    const updated = get().orders.map((o) =>
      o.id === orderId ? { ...o, ...updates } : o
    );
    const unackCount = updated.filter((o) => !o.acknowledgedByAdmin).length;
    set({ orders: updated, unacknowledgedCount: unackCount });
    saveLocalOrders(updated);
    updateOrder(orderId, updates);
  },

  verifyOrder: (orderId, verificationStatus, notes = '', method = 'manual_review') => {
    const target = get().orders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (!target) return;

    const updates: Partial<Order> = {
      verification: {
        ...(target.verification || { fraudScore: 10, fraudRisk: 'low' }),
        status: verificationStatus,
        verifiedAt: new Date().toISOString(),
        verifiedBy: 'Dawosti Merchant',
        verificationNotes: notes || (verificationStatus === 'verified_genuine' ? 'Verified as Genuine Customer Order' : 'Flagged as Fake / Suspicious Order'),
        method,
      },
      ...(verificationStatus === 'verified_genuine' ? { acknowledgedByAdmin: true, status: 'confirmed' } : {}),
      ...(verificationStatus === 'flagged_fake' ? { status: 'cancelled' } : {}),
    };

    // If order was verified genuine and was referred by an advocate, automatically credit creator cut
    if (
      verificationStatus === 'verified_genuine' &&
      target.referredByCode &&
      !target.referralCommissionCredited
    ) {
      const commissionToCredit =
        target.referralCommissionAmount ||
        Math.round((target.subtotalAmount - (target.referralDiscountAmount || 0)) * 0.10) ||
        500;

      updates.referralCommissionCredited = true;
      updates.referralCommissionCreditedAt = new Date().toISOString();
      updates.referralCommissionAmount = commissionToCredit;

      // Credit advocate in Firestore
      creditAdvocateOrder(target.referredByCode, commissionToCredit).catch(() => {});

      // Synchronize in-memory referralStore so creator dashboard immediately updates
      try {
        const { allAdvocates } = useReferralStore.getState();
        const updatedAdvocates = (allAdvocates || []).map((adv) => {
          if (adv.code.toUpperCase() === target.referredByCode!.toUpperCase()) {
            return {
              ...adv,
              ordersDeliveredCount: (adv.ordersDeliveredCount || 0) + 1,
              withdrawableBalance: (adv.withdrawableBalance || 0) + commissionToCredit,
              lifetimeEarned: (adv.lifetimeEarned || 0) + commissionToCredit,
            };
          }
          return adv;
        });
        useReferralStore.setState({ allAdvocates: updatedAdvocates });
      } catch {}
    }

    const updated = get().orders.map((o) => (o.id === orderId || o.orderNumber === orderId ? { ...o, ...updates } : o));
    const unackCount = updated.filter((o) => !o.acknowledgedByAdmin).length;
    set({ orders: updated, unacknowledgedCount: unackCount });
    saveLocalOrders(updated);
    updateOrder(target.id, updates);
  },

  deleteOrder: (orderId) => {
    const target = get().orders.find((o) => o.id === orderId || o.orderNumber === orderId);
    const updated = get().orders.filter((o) => o.id !== orderId && o.orderNumber !== orderId);
    const unackCount = updated.filter((o) => !o.acknowledgedByAdmin).length;
    set({ orders: updated, unacknowledgedCount: unackCount });
    saveLocalOrders(updated);
    if (target) deleteOrder(target.id);
  },

  clearAllOrders: () => {
    set({ orders: [], unacknowledgedCount: 0 });
    saveLocalOrders([]);
  },

  setLatestOrder: (order) => set({ latestOrder: order }),

  trackByNumber: (search) => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return (
      get().orders.find(
        (o) =>
          o.orderNumber.toLowerCase() === q ||
          o.id.toLowerCase() === q ||
          o.shippingAddress.phone.includes(q)
      ) || null
    );
  },
}));
