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

const detectLanguage = (): Language => {
  try {
    const saved = localStorage.getItem('dawosti_lang_v3');
    if (saved === 'en' || saved === 'np') return saved;
    const browserLang = navigator.language?.toLowerCase() || '';
    if (browserLang.includes('ne') || browserLang.includes('np')) return 'np';
  } catch {}
  return 'en';
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  language: detectLanguage(),
  merchant: DEFAULT_MERCHANT,
  theme: DEFAULT_THEME,
  siteContent: DEFAULT_SITE_CONTENT,
  pageView: 'home',
  isOrderTrackingOpen: false,

  initFirestoreSync: () => {
    const unsubscribe = listenSettings((data) => {
      set((s) => ({
        merchant: data.merchant ? { ...s.merchant, ...data.merchant } : s.merchant,
        theme: data.theme ? { ...s.theme, ...data.theme } : s.theme,
        siteContent: data.siteContent ? { ...s.siteContent, ...data.siteContent } : s.siteContent,
      }));
    });
    return unsubscribe;
  },

  setLanguage: (lang) => {
    try { localStorage.setItem('dawosti_lang_v3', lang); } catch {}
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
