import { create } from 'zustand';
import { Language, MerchantSettings, ThemeSettings, SiteContent, PageView } from '../types';
import { DEFAULT_MERCHANT, DEFAULT_THEME, DEFAULT_SITE_CONTENT } from '../mockData';
import { listenSettings, publishSettings } from '../services/firestoreSettings';

interface SettingsState {
  language: Language;
  merchant: MerchantSettings;
  theme: ThemeSettings;
  siteContent: SiteContent;
  pageView: PageView;
  isOrderTrackingOpen: boolean;

  // Actions
  initFirestoreSync: () => () => void;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  updateMerchant: (updates: Partial<MerchantSettings>) => void;
  updateTheme: (updates: Partial<ThemeSettings>) => void;
  updateSiteContent: (updates: Partial<SiteContent>) => void;
  resetMerchant: () => void;
  resetTheme: () => void;
  setPageView: (view: PageView) => void;
  setIsOrderTrackingOpen: (v: boolean) => void;
  formatPrice: (amount: number) => string;
}

const NEPALI_DIGITS: Record<string, string> = {
  '0': '०', '1': '१', '2': '२', '3': '३', '4': '४',
  '5': '५', '6': '६', '7': '७', '8': '८', '9': '९',
};

const getRootDomainCookie = (): string => {
  if (typeof window === 'undefined') return '';
  return window.location.hostname.includes('dawosti.com') ? '; domain=.dawosti.com' : '';
};

const detectLanguage = (): Language => {
  try {
    if (typeof window !== 'undefined') {
      // 1. URL Query Parameter ?lang=np or ?lang=en
      const params = new URLSearchParams(window.location.search);
      const urlLang = params.get('lang');
      if (urlLang === 'en' || urlLang === 'np') return urlLang;

      // 2. Cross-Subdomain Root Cookie (.dawosti.com)
      const match = document.cookie.match(/dawosti_lang_v3=(en|np)/);
      if (match && (match[1] === 'en' || match[1] === 'np')) {
        return match[1] as Language;
      }

      // 3. LocalStorage
      const saved = localStorage.getItem('dawosti_lang_v3');
      if (saved === 'en' || saved === 'np') return saved;

      // 4. Browser Locale
      const browserLang = navigator.language?.toLowerCase() || '';
      if (browserLang.includes('ne') || browserLang.includes('np')) return 'np';
    }
  } catch {}
  return 'en';
};

const detectInitialPageView = (): PageView => {
  try {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname || '';
      const path = window.location.pathname || '';
      const hash = window.location.hash || '';
      if (
        host.startsWith('referral.') ||
        host.startsWith('creator.') ||
        path.startsWith('/referral') ||
        path.startsWith('/creator') ||
        hash === '#referral' ||
        hash === '#creator'
      ) {
        return 'referral';
      }
    }
  } catch {}
  return 'home';
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  language: detectLanguage(),
  merchant: DEFAULT_MERCHANT,
  theme: DEFAULT_THEME,
  siteContent: DEFAULT_SITE_CONTENT,
  pageView: detectInitialPageView(),
  isOrderTrackingOpen: false,

  initFirestoreSync: () => {
    // Cross-tab and Cross-window live sync
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'dawosti_lang_v3' && (e.newValue === 'en' || e.newValue === 'np')) {
        set({ language: e.newValue as Language });
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
    }

    const unsubscribe = listenSettings((data) => {
      set((s) => ({
        merchant: data.merchant ? { ...s.merchant, ...data.merchant } : s.merchant,
        theme: data.theme ? { ...s.theme, ...data.theme } : s.theme,
        siteContent: data.siteContent ? { ...s.siteContent, ...data.siteContent } : s.siteContent,
      }));
    });

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange);
      }
      unsubscribe();
    };
  },

  setLanguage: (lang) => {
    try {
      localStorage.setItem('dawosti_lang_v3', lang);
      // Persist across dawosti.com and all subdomains (referral.dawosti.com, creator.dawosti.com)
      document.cookie = `dawosti_lang_v3=${lang}${getRootDomainCookie()}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {}
    set({ language: lang });
  },
  toggleLanguage: () => {
    const next = get().language === 'en' ? 'np' : 'en';
    get().setLanguage(next);
  },

  updateMerchant: (updates) => {
    set((s) => ({ merchant: { ...s.merchant, ...updates } }));
    publishSettings({ merchant: { ...get().merchant, ...updates } });
  },

  updateTheme: (updates) => {
    set((s) => ({ theme: { ...s.theme, ...updates } }));
    publishSettings({ theme: { ...get().theme, ...updates } });
  },

  updateSiteContent: (updates) => {
    set((s) => ({ siteContent: { ...s.siteContent, ...updates } }));
    publishSettings({ siteContent: { ...get().siteContent, ...updates } });
  },

  resetMerchant: () => {
    set({ merchant: DEFAULT_MERCHANT });
    publishSettings({ merchant: DEFAULT_MERCHANT });
  },
  resetTheme: () => {
    set({ theme: DEFAULT_THEME });
    publishSettings({ theme: DEFAULT_THEME });
  },

  setPageView: (view) => set({ pageView: view }),
  setIsOrderTrackingOpen: (v) => set({ isOrderTrackingOpen: v }),

  formatPrice: (amount) => {
    const formatted = amount.toLocaleString('en-US');
    if (get().language === 'np') {
      return `रु ${formatted.replace(/[0-9]/g, (d) => NEPALI_DIGITS[d] || d)}`;
    }
    return `NPR ${formatted}`;
  },
}));
