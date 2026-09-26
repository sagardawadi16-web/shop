import { Product, Category, MerchantSettings, ThemeSettings, SiteContent } from './types';

// ─── Categories ─────────────────────────────────────────────────────────────

export const CATEGORIES: Category[] = [
  { id: 'all', slug: 'all', name: { en: 'All Products', np: 'सबै उत्पादन' } },
  { id: 'cat-kurthas', slug: 'cat-kurthas', name: { en: 'Kurthas & Sets', np: 'कुर्ता तथा सेट' } },
  { id: 'cat-sarees', slug: 'cat-sarees', name: { en: 'Sarees', np: 'साडी' } },
  { id: 'cat-lehengas', slug: 'cat-lehengas', name: { en: 'Lehengas', np: 'लहेंगा' } },
  { id: 'cat-accessories', slug: 'cat-accessories', name: { en: 'Accessories', np: 'गहना तथा एक्सेसरिज' } },
  { id: 'cat-festive', slug: 'cat-festive', name: { en: 'Festive Collection', np: 'चाड पर्व संग्रह' } },
];

// ─── Products ────────────────────────────────────────────────────────────────
// All products are managed via Firestore through the Admin panel.
// Add real products via the Admin → Products tab or Firestore console.

export const MOCK_PRODUCTS: Product[] = [];

// ─── Default Store Settings ──────────────────────────────────────────────────

export const DEFAULT_MERCHANT: MerchantSettings = {
  shopName: { en: 'DAWOSTI Boutique', np: 'दावोस्ती बुटिक' },
  shopTagline: { en: 'Authentic Nepali Fashion', np: 'मौलिक नेपाली फेसन' },
  shopPhone: '9808251494',
  shopEmail: 'contact.dawosti@gmail.com',
  shopAddress: { en: 'Kathmandu, Nepal', np: 'काठमाडौँ, नेपाल' },
  whatsappNumber: '9779808251494',
  freeDeliveryThreshold: 3000,
  deliveryFee: 150,
};

export const DEFAULT_THEME: ThemeSettings = {
  isDashainTheme: false,
  discountPercentage: 0,
  couponCode: '',
  bannerText: {
    en: '🎉 Free delivery on orders above NPR 3,000 | Handcrafted in Nepal',
    np: '🎉 NPR ३,०००  माथिको अर्डरमा निःशुल्क डेलिभरी | नेपालमा हस्तनिर्मित',
  },
  accentColor: '#8B3A3A',
  showAnnouncementBar: true,
  showGuildSection: false,
};

export const DEFAULT_SITE_CONTENT: SiteContent = {
  heroHeadline: { en: 'Wear the Soul of Nepal', np: 'नेपालको आत्मा लगाउनुहोस्' },
  heroSubtext: {
    en: 'Handcrafted luxury fashion from the heart of Kathmandu',
    np: 'काठमाडौँको मुटुबाट हस्तनिर्मित लक्जरी फेसन',
  },
  aboutText: {
    en: 'DAWOSTI is a boutique fashion house celebrating authentic Nepali craftsmanship.',
    np: 'दावोस्ती एक बुटिक फेसन घर हो जसले मौलिक नेपाली शिल्पकारिता मनाउँछ।',
  },
};
