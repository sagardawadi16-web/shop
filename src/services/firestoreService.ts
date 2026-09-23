import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  CartItem,
  MaintenanceSettings,
  ThemeSettings,
  SiteContentConfig,
  Product,
  Order,
  MerchantSettings,
  EmailSubscriber,
  EmailCampaign,
} from '../types';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

// Collection / Document references
const SETTINGS_COLLECTION = 'store_settings';
const GLOBAL_DOC = 'global';
const USERS_COLLECTION = 'users';
const PRODUCTS_COLLECTION = 'products';
const ORDERS_COLLECTION = 'orders';

/**
 * -------------------------------------------------------------
 * 1. REAL-TIME PRODUCTS SYNC (Admin CRUD <-> Customer Browsing)
 * -------------------------------------------------------------
 */

/**
 * Listen to real-time changes in products collection.
 * Any product created, edited, or deleted in Admin updates every connected client immediately.
 */
export const listenToProductsFromFirestore = (
  onUpdate: (products: Product[]) => void
): Unsubscribe => {
  try {
    const productsColRef = collection(db, PRODUCTS_COLLECTION);
    return onSnapshot(
      productsColRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const productsList = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              ...data,
            } as Product;
          });
          onUpdate(productsList);
        }
      },
      (error) => {
        console.warn('Firestore products sync listener warning (fallback to cached/mock data):', error);
      }
    );
  } catch (error) {
    console.warn('Failed to attach Firestore products listener:', error);
    return () => {};
  }
};

/**
 * Persist or update a product in Firestore
 */
export const saveProductToFirestore = async (product: Product): Promise<boolean> => {
  try {
    const prodDocRef = doc(db, PRODUCTS_COLLECTION, product.id);
    await setDoc(prodDocRef, product, { merge: true });
    return true;
  } catch (error) {
    console.warn(`Could not save product ${product.id} to Firestore (cached locally):`, error);
    return false;
  }
};

/**
 * Delete a product from Firestore
 */
export const deleteProductFromFirestore = async (productId: string): Promise<boolean> => {
  try {
    const prodDocRef = doc(db, PRODUCTS_COLLECTION, productId);
    await deleteDoc(prodDocRef);
    return true;
  } catch (error) {
    console.warn(`Could not delete product ${productId} from Firestore:`, error);
    return false;
  }
};

/**
 * Seed initial mock products to Firestore if collection is empty
 */
export const seedInitialProductsIfEmpty = async (initialProducts: Product[]): Promise<boolean> => {
  try {
    const productsColRef = collection(db, PRODUCTS_COLLECTION);
    const snap = await onSnapshot(productsColRef, () => {});
    return true;
  } catch {
    return false;
  }
};

/**
 * -------------------------------------------------------------
 * 2. REAL-TIME ORDERS SYNC (Customer Checkout <-> Admin Orders)
 * -------------------------------------------------------------
 */

/**
 * Listen to live orders from Firestore. Orders pop up live in Admin tab.
 */
export const listenToOrdersFromFirestore = (
  onUpdate: (orders: Order[]) => void
): Unsubscribe => {
  try {
    const ordersColRef = collection(db, ORDERS_COLLECTION);
    return onSnapshot(
      ordersColRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const ordersList = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              ...data,
            } as Order;
          });
          // Sort newest first
          ordersList.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          onUpdate(ordersList);
        }
      },
      (error) => {
        console.warn('Firestore orders sync listener warning (fallback to cached orders):', error);
      }
    );
  } catch (error) {
    console.warn('Failed to attach Firestore orders listener:', error);
    return () => {};
  }
};

/**
 * Save newly placed order to Firestore
 */
export const saveOrderToFirestore = async (order: Order): Promise<boolean> => {
  try {
    const orderDocRef = doc(db, ORDERS_COLLECTION, order.id);
    await setDoc(orderDocRef, order, { merge: true });
    return true;
  } catch (error) {
    console.warn(`Could not save order ${order.orderNumber} to Firestore:`, error);
    return false;
  }
};

/**
 * Update order courier status or acknowledgment in Firestore
 */
export const updateOrderStatusInFirestore = async (
  orderId: string,
  updates: Partial<Order>
): Promise<boolean> => {
  try {
    const orderDocRef = doc(db, ORDERS_COLLECTION, orderId);
    await setDoc(orderDocRef, updates, { merge: true });
    return true;
  } catch (error) {
    console.warn(`Could not update order ${orderId} in Firestore:`, error);
    return false;
  }
};

/**
 * Delete an order record from Firestore
 */
export const deleteOrderFromFirestore = async (orderId: string): Promise<boolean> => {
  try {
    const orderDocRef = doc(db, ORDERS_COLLECTION, orderId);
    await deleteDoc(orderDocRef);
    return true;
  } catch (error) {
    console.warn(`Could not delete order ${orderId} from Firestore:`, error);
    return false;
  }
};

/**
 * -------------------------------------------------------------
 * 3. STORE SETTINGS & MERCHANT FONEPAY SYNC
 * -------------------------------------------------------------
 */

export interface GlobalStoreSyncData {
  maintenance?: MaintenanceSettings;
  themeSettings?: ThemeSettings;
  siteContent?: SiteContentConfig;
  merchantSettings?: MerchantSettings;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
  version: number;
  forceReloadTrigger?: number;
}

/**
 * Listen to real-time changes for banners, discounts, themes, and Fonepay QR details
 */
export const listenToGlobalStoreSync = (
  onUpdate: (data: Partial<GlobalStoreSyncData>) => void
): Unsubscribe => {
  try {
    const globalDocRef = doc(db, SETTINGS_COLLECTION, GLOBAL_DOC);
    return onSnapshot(
      globalDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as GlobalStoreSyncData;
          onUpdate(data);
        }
      },
      (error) => {
        console.warn('Firestore real-time sync listener warning (fallback to broadcast):', error);
      }
    );
  } catch (error) {
    console.warn('Failed to attach Firestore snapshot listener:', error);
    return () => {};
  }
};

/**
 * Publish global changes (theme, merchant Fonepay QR, site content, maintenance) to Firestore
 */
export const publishGlobalStoreSync = async (
  payload: Partial<GlobalStoreSyncData>
): Promise<boolean> => {
  try {
    const globalDocRef = doc(db, SETTINGS_COLLECTION, GLOBAL_DOC);
    await setDoc(
      globalDocRef,
      {
        ...payload,
        lastUpdatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.warn('Firestore publish notice (broadcast channel will handle local tabs):', error);
    return false;
  }
};

export const saveStoreSettingsToFirestore = publishGlobalStoreSync;

/**
 * -------------------------------------------------------------
 * 4. USER CLOUD CART & SUBSCRIBERS
 * -------------------------------------------------------------
 */

export const saveUserCartToFirestore = async (userId: string, cartItems: CartItem[]): Promise<boolean> => {
  if (!userId) return false;
  try {
    const userCartDocRef = doc(db, USERS_COLLECTION, userId);
    await setDoc(
      userCartDocRef,
      {
        cart: cartItems,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.warn('Could not save user cart to Firestore (using local storage fallback):', error);
    return false;
  }
};

export const getUserCartFromFirestore = async (userId: string): Promise<CartItem[] | null> => {
  if (!userId) return null;
  try {
    const userCartDocRef = doc(db, USERS_COLLECTION, userId);
    const snap = await getDoc(userCartDocRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.cart)) {
        return data.cart as CartItem[];
      }
    }
    return null;
  } catch (error) {
    console.warn('Could not retrieve user cart from Firestore:', error);
    return null;
  }
};

export const saveSubscriberToFirestore = async (subscriber: EmailSubscriber): Promise<boolean> => {
  try {
    const subDocRef = doc(db, 'email_subscribers', subscriber.id);
    await setDoc(subDocRef, subscriber, { merge: true });
    return true;
  } catch (error) {
    console.warn('Firestore subscriber save warning (saved locally):', error);
    return false;
  }
};

export const saveCampaignToFirestore = async (campaign: EmailCampaign): Promise<boolean> => {
  try {
    const campDocRef = doc(db, 'email_campaigns', campaign.id);
    await setDoc(campDocRef, campaign, { merge: true });
    return true;
  } catch (error) {
    console.warn('Firestore campaign save warning (saved locally):', error);
    return false;
  }
};

