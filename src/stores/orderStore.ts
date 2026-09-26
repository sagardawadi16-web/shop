import { create } from 'zustand';
import { Order, OrderStatus, CartItem, ShippingAddress, PaymentMethod, OrderVerificationStatus, OrderVerification } from '../types';
import { listenOrders, saveOrder, updateOrder, deleteOrder } from '../services/firestoreOrders';
import { creditAdvocateOrder } from '../services/firestoreReferrals';
import { MOCK_PRODUCTS } from '../mockData';

export const SEED_SHOWCASE_ORDERS: Order[] = [
  {
    id: 'seed_order_1',
    orderNumber: 'DAW-849201',
    items: [
      {
        product: MOCK_PRODUCTS[0], // Crimson Silk Kurtha
        quantity: 1,
        selectedSize: 'M',
        addedAt: '2026-09-22T10:00:00.000Z',
      },
    ],
    subtotalAmount: 5400,
    discountAmount: 300,
    deliveryFee: 0,
    totalAmount: 5100,
    shippingAddress: {
      fullName: 'Pooja Sharma',
      phone: '9841203948',
      addressLine: 'Lazimpat Embassy Road, House 14',
      city: 'Kathmandu',
      province: 'Bagmati Province',
    },
    paymentMethod: 'esewa',
    paymentDetails: 'ESW-9048123',
    status: 'delivered',
    createdAt: '2026-09-22T10:15:00.000Z',
    dispatchDate: '2026-09-23T08:30:00.000Z',
    acknowledgedByAdmin: true,
    customerLoginName: 'Pooja Sharma',
    courierPartner: 'Sundar Express Logistics',
    trackingNumber: 'SN-KTM-8492',
    referredByCode: 'SAGAR-82',
    referralDiscountAmount: 300,
    referralCommissionAmount: 510, // 10% of net 5,100
    costPriceTotal: 2268,
    shippingCostActual: 150,
    netProfitCalculated: 2172, // 5100 - 2268 - 150 - 510
    verification: {
      status: 'verified_genuine',
      fraudScore: 8,
      fraudRisk: 'low',
      verifiedAt: '2026-09-22T11:00:00.000Z',
      verifiedBy: 'Sagar Dawadi',
      verificationNotes: 'Verified genuine delivery to Lazimpat resident',
      method: 'phone_call',
    },
  },
  {
    id: 'seed_order_2',
    orderNumber: 'DAW-631892',
    items: [
      {
        product: MOCK_PRODUCTS[2], // Royal Banarasi Saree
        quantity: 1,
        selectedSize: 'Free Size',
        addedAt: '2026-09-23T14:00:00.000Z',
      },
    ],
    subtotalAmount: 12500,
    discountAmount: 300,
    deliveryFee: 0,
    totalAmount: 12200,
    shippingAddress: {
      fullName: 'Bikash Adhikari',
      phone: '9803847291',
      addressLine: 'Lakeside Ward 6, Near Peace Stupa Gate',
      city: 'Pokhara',
      province: 'Gandaki Province',
    },
    paymentMethod: 'khalti',
    paymentDetails: 'KHL-4491028',
    status: 'shipped',
    createdAt: '2026-09-23T14:30:00.000Z',
    dispatchDate: '2026-09-24T06:00:00.000Z',
    acknowledgedByAdmin: true,
    customerLoginName: 'Bikash Adhikari',
    courierPartner: 'Nepal Post EMS Express',
    trackingNumber: 'EMS-PKR-9042',
    referredByCode: 'PRASHANT-10',
    referralDiscountAmount: 300,
    referralCommissionAmount: 1220, // 10% of net 12,200
    costPriceTotal: 5250,
    shippingCostActual: 250,
    netProfitCalculated: 5480, // 12200 - 5250 - 250 - 1220
    verification: {
      status: 'verified_genuine',
      fraudScore: 12,
      fraudRisk: 'low',
      verifiedAt: '2026-09-23T15:00:00.000Z',
      verifiedBy: 'Sagar Dawadi',
      verificationNotes: 'Pokhara shipment confirmed via WhatsApp concierge',
      method: 'whatsapp',
    },
  },
  {
    id: 'seed_order_3',
    orderNumber: 'DAW-510943',
    items: [
      {
        product: MOCK_PRODUCTS[1], // Ivory Handloom Kurtha
        quantity: 2,
        selectedSize: 'S',
        addedAt: '2026-09-24T08:30:00.000Z',
      },
    ],
    subtotalAmount: 6400,
    discountAmount: 300,
    deliveryFee: 0,
    totalAmount: 6100,
    shippingAddress: {
      fullName: 'Srijana Gurung',
      phone: '9818937201',
      addressLine: 'Sanepa 2, Near British School',
      city: 'Lalitpur',
      province: 'Bagmati Province',
    },
    paymentMethod: 'cod',
    status: 'delivered',
    createdAt: '2026-09-24T09:00:00.000Z',
    dispatchDate: '2026-09-24T12:00:00.000Z',
    acknowledgedByAdmin: true,
    customerLoginName: 'Srijana Gurung',
    courierPartner: 'Sundar Express Logistics',
    trackingNumber: 'SN-LAL-5109',
    referredByCode: 'SAGAR-82',
    referralDiscountAmount: 300,
    referralCommissionAmount: 610,
    costPriceTotal: 2688,
    shippingCostActual: 150,
    netProfitCalculated: 2652,
    verification: {
      status: 'verified_genuine',
      fraudScore: 6,
      fraudRisk: 'low',
      verifiedAt: '2026-09-24T09:30:00.000Z',
      verifiedBy: 'Dawosti Merchant',
      verificationNotes: 'Confirmed address and delivery window',
      method: 'phone_call',
    },
  },
  {
    id: 'seed_order_4',
    orderNumber: 'DAW-902314',
    items: [
      {
        product: MOCK_PRODUCTS[3] || MOCK_PRODUCTS[0],
        quantity: 1,
        selectedSize: 'M',
        addedAt: '2026-09-24T16:00:00.000Z',
      },
    ],
    subtotalAmount: 4800,
    discountAmount: 300,
    deliveryFee: 150,
    totalAmount: 4650,
    shippingAddress: {
      fullName: 'Dikshya Malla',
      phone: '9860293847',
      addressLine: 'Suryabinayak Chowk',
      city: 'Bhaktapur',
      province: 'Bagmati Province',
    },
    paymentMethod: 'cod',
    status: 'confirmed',
    createdAt: '2026-09-24T16:20:00.000Z',
    acknowledgedByAdmin: true,
    customerLoginName: 'Dikshya Malla',
    courierPartner: 'Sundar Express Logistics',
    referredByCode: 'ANUSHA-24',
    referralDiscountAmount: 300,
    referralCommissionAmount: 450,
    costPriceTotal: 2016,
    shippingCostActual: 150,
    netProfitCalculated: 2034,
    verification: {
      status: 'verified_genuine',
      fraudScore: 10,
      fraudRisk: 'low',
      verifiedAt: '2026-09-24T16:45:00.000Z',
      verifiedBy: 'Dawosti Merchant',
      verificationNotes: 'Bhaktapur order verified by WhatsApp',
      method: 'whatsapp',
    },
  },
  {
    id: 'seed_order_5',
    orderNumber: 'DAW-472819',
    items: [
      {
        product: MOCK_PRODUCTS[0],
        quantity: 1,
        selectedSize: 'L',
        addedAt: '2026-09-24T18:00:00.000Z',
      },
    ],
    subtotalAmount: 5400,
    discountAmount: 300,
    deliveryFee: 250,
    totalAmount: 5350,
    shippingAddress: {
      fullName: 'Ankit Shrestha',
      phone: '9845019283',
      addressLine: 'Lions Chowk, Narayangarh',
      city: 'Chitwan',
      province: 'Bagmati Province',
    },
    paymentMethod: 'esewa',
    paymentDetails: 'ESW-1984201',
    status: 'delivered',
    createdAt: '2026-09-24T18:45:00.000Z',
    dispatchDate: '2026-09-24T20:00:00.000Z',
    acknowledgedByAdmin: true,
    customerLoginName: 'Ankit Shrestha',
    courierPartner: 'Nepal Post EMS Express',
    trackingNumber: 'EMS-NRY-4728',
    referredByCode: 'ANUSHA-24',
    referralDiscountAmount: 300,
    referralCommissionAmount: 510,
    costPriceTotal: 2268,
    shippingCostActual: 250,
    netProfitCalculated: 2322,
    verification: {
      status: 'verified_genuine',
      fraudScore: 5,
      fraudRisk: 'low',
      verifiedAt: '2026-09-24T19:00:00.000Z',
      verifiedBy: 'Sagar Dawadi',
      verificationNotes: 'Narayangarh delivery successfully completed',
      method: 'manual_review',
    },
  },
];

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

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: SEED_SHOWCASE_ORDERS,
  latestOrder: null,
  unacknowledgedCount: 0,

  initFirestoreSync: () => {
    const unsubscribe = listenOrders((remoteOrders) => {
      if (remoteOrders && remoteOrders.length > 0) {
        const unackCount = remoteOrders.filter((o) => !o.acknowledgedByAdmin).length;
        set({ orders: remoteOrders, unacknowledgedCount: unackCount });
      } else {
        set((state) => ({
          orders: state.orders.length > 0 ? state.orders : SEED_SHOWCASE_ORDERS,
          unacknowledgedCount: (state.orders.length > 0 ? state.orders : SEED_SHOWCASE_ORDERS).filter((o) => !o.acknowledgedByAdmin).length,
        }));
      }
    });
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
    // Buying price / COGS: sum of each product's costPrice or ~42% of retail price
    const costPriceTotal = params.items.reduce((acc, item) => {
      const unitCost = item.product.costPrice || Math.round(item.product.price * 0.42);
      return acc + unitCost * item.quantity;
    }, 0);

    const netMerchandise = Math.max(0, params.subtotal - (params.referralDiscountAmount || 0));
    const referralCommissionAmount = params.referredByCode ? Math.round(netMerchandise * 0.10) : 0;
    const shippingCostActual = params.deliveryFee || 150;
    // Formula: Net Profit = Total - Buying Cost - Actual Shipping - Creator Commission
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

    // Optimistic local update
    const updated = [newOrder, ...get().orders];
    set({ orders: updated, latestOrder: newOrder, unacknowledgedCount: get().unacknowledgedCount + 1 });

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
    set({ orders: updated });
    updateOrder(orderId, updates);

    // If order was delivered and was referred by an advocate, credit advocate exact 10% commission
    if (status === 'delivered' && target && target.referredByCode) {
      const commissionToCredit =
        target.referralCommissionAmount ||
        Math.round((target.subtotalAmount - (target.referralDiscountAmount || 0)) * 0.10) ||
        500;
      creditAdvocateOrder(target.referredByCode, commissionToCredit).catch(() => {});
    }
  },

  acknowledgeOrder: (orderId) => {
    const updates: Partial<Order> = { acknowledgedByAdmin: true, status: 'confirmed' };
    const updated = get().orders.map((o) =>
      o.id === orderId ? { ...o, ...updates } : o
    );
    const unackCount = updated.filter((o) => !o.acknowledgedByAdmin).length;
    set({ orders: updated, unacknowledgedCount: unackCount });
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

    const updated = get().orders.map((o) => (o.id === orderId || o.orderNumber === orderId ? { ...o, ...updates } : o));
    const unackCount = updated.filter((o) => !o.acknowledgedByAdmin).length;
    set({ orders: updated, unacknowledgedCount: unackCount });
    updateOrder(target.id, updates);
  },

  deleteOrder: (orderId) => {
    const updated = get().orders.filter((o) => o.id !== orderId && o.orderNumber !== orderId);
    const unackCount = updated.filter((o) => !o.acknowledgedByAdmin).length;
    set({ orders: updated, unacknowledgedCount: unackCount });
    deleteOrder(orderId);
  },

  clearAllOrders: () => set({ orders: [], unacknowledgedCount: 0 }),

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
