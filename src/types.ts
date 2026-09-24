// ============================================================
// Dawosti Boutique — Global TypeScript Types
// ============================================================

export type Language = 'en' | 'np';
export type ProductSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'Free Size';
export type SortOption = 'featured' | 'price-low' | 'price-high' | 'newest' | 'rating';
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentMethod = 'cod' | 'esewa' | 'khalti' | 'fonepay';
export type PageView = 'home' | 'checkout' | 'order-confirmation';

export interface BilingualText {
  en: string;
  np: string;
}

export interface Product {
  id: string;
  slug: string;
  title: BilingualText;
  description: BilingualText;
  price: number;
  originalPrice?: number;
  categoryId: string;
  categoryName: BilingualText;
  images: string[];
  availableSizes: ProductSize[];
  sizeStock?: Partial<Record<ProductSize, number>>;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  tags: string[];
  fabric?: BilingualText;
  origin?: BilingualText;
  isNewArrival?: boolean;
  isFeatured?: boolean;
}

export interface Category {
  id: string;
  slug: string;
  name: BilingualText;
  icon?: string;
  productCount?: number;
}

export interface CartItem {
  product: Product;
  selectedSize: ProductSize;
  quantity: number;
  addedAt: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  province: string;
}

export type OrderVerificationStatus = 'unverified' | 'verified_genuine' | 'suspicious' | 'flagged_fake';

export interface OrderVerification {
  status: OrderVerificationStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  method?: 'phone_call' | 'whatsapp' | 'prepaid_gateway' | 'manual_review';
  fraudScore?: number; // 0 - 100
  fraudRisk?: 'low' | 'medium' | 'high';
  verificationNotes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: CartItem[];
  subtotalAmount: number;
  discountAmount: number;
  deliveryFee: number;
  totalAmount: number;
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  paymentDetails?: string;
  status: OrderStatus;
  createdAt: string;
  dispatchDate?: string;
  notes?: string;
  trackingNumber?: string;
  courierName?: string;
  courierPartner?: string;
  logisticsNotes?: string;
  acknowledgedByAdmin: boolean;
  customerLoginName?: string;
  verification?: OrderVerification;
}

export interface GoogleUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isLoggedIn: boolean;
}

export interface MerchantSettings {
  shopName: BilingualText;
  shopTagline: BilingualText;
  shopPhone: string;
  shopEmail: string;
  shopAddress: BilingualText;
  whatsappNumber: string;
  fonepayMerchantId?: string;
  fonepayQrDataUri?: string;
  esewaId?: string;
  khaltiId?: string;
  freeDeliveryThreshold: number;
  deliveryFee: number;
}

export interface ThemeSettings {
  isDashainTheme: boolean;
  discountPercentage: number;
  couponCode: string;
  bannerText: BilingualText;
  accentColor: string;
  showAnnouncementBar: boolean;
}

export interface SiteContent {
  heroHeadline: BilingualText;
  heroSubtext: BilingualText;
  aboutText: BilingualText;
}

export interface MaintenanceSettings {
  isActive: boolean;
  messageEn: string;
  messageNp: string;
}

export interface AdminSettings {
  requirePasscode: boolean;
  passcode: string;
}

export interface PriceRange {
  min: number;
  max: number;
}
