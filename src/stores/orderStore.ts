import { create } from 'zustand';
import { Order, OrderStatus, CartItem, ShippingAddress, PaymentMethod } from '../types';
import { listenOrders, saveOrder, updateOrder, deleteOrder } from '../services/firestoreOrders';

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
  }) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus, trackingInfo?: { courierName?: string; trackingNumber?: string; logisticsNotes?: string }) => void;
  acknowledgeOrder: (orderId: string) => void;
  deleteOrder: (orderId: string) => void;
  clearAllOrders: () => void;
  setLatestOrder: (order: Order | null) => void;
  trackByNumber: (search: string) => Order | null;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  latestOrder: null,
  unacknowledgedCount: 0,

  initFirestoreSync: () => {
    const unsubscribe = listenOrders((remoteOrders) => {
      const unackCount = remoteOrders.filter((o) => !o.acknowledgedByAdmin).length;
      set({ orders: remoteOrders, unacknowledgedCount: unackCount });
    });
    return unsubscribe;
  },

  placeOrder: (params) => {
    const orderNumber = `DAW-${Math.floor(100000 + Math.random() * 900000)}`;
    const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

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
      courierPartner: 'Nepal Post EMS / Sundar Express',
    };

    // Optimistic local update
    const updated = [newOrder, ...get().orders];
    set({ orders: updated, latestOrder: newOrder, unacknowledgedCount: get().unacknowledgedCount + 1 });

    // Persist to Firestore (source of truth)
    saveOrder(newOrder);

    return newOrder;
  },

  updateOrderStatus: (orderId, status, trackingInfo = {}) => {
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
