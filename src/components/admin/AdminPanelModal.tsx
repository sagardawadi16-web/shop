import React, { useState, useRef, useEffect } from 'react';
import { useShopStore } from '../../store/shopStore';
import {
  X,
  QrCode,
  Edit3,
  Upload,
  Check,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Building,
  CreditCard,
  Phone,
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Eye,
  Plus,
  Trash2,
  Image as ImageIcon,
  Lock,
  Unlock,
  KeyRound,
  Layers,
  Star,
  Tag,
  FileCode,
  Download,
  Copy,
  Truck,
  Palette,
  Gift,
  RefreshCw,
  FileSpreadsheet,
  BellRing,
  CheckCircle,
  BadgePercent,
  Sliders,
  Store,
  Radio,
  Mail,
} from 'lucide-react';
import { Product, ProductSize, OrderStatus } from '../../types';
import { DEFAULT_STATIC_FONEPAY_QR_SVG } from '../../store/mockData';
import { syncOrdersToGoogleSheet, GoogleSheetsSyncResult } from '../../services/googleSheets';
import { MultiAgentMaintenanceTab } from './MultiAgentMaintenanceTab';
import { SubscribersEmailDropsTab } from './SubscribersEmailDropsTab';
import { buildNewProductEmailContent, buildMailtoUrl } from '../../services/emailService';

type AdminTab =
  | 'orders'
  | 'subscribers'
  | 'maintenance'
  | 'theme'
  | 'catalog'
  | 'qr'
  | 'content'
  | 'security'
  | 'direct-paste';

export const AdminPanelModal: React.FC = () => {
  const {
    isAdminOpen,
    setIsAdminOpen,
    language,
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    resetProductsToDefault,
    merchantSettings,
    updateMerchantSettings,
    resetMerchantSettings,
    siteContent,
    updateSiteContent,
    resetSiteContent,
    adminSecuritySettings,
    updateAdminSecuritySettings,
    isAdminAuthenticated,
    unlockAdmin,
    lockAdmin,
    formatPrice,
    ordersLog,
    clearOrdersLog,
    acknowledgeOrder,
    updateOrderStatus,
    unacknowledgedOrdersCount,
    unacknowledgedOrders,
    themeSettings,
    updateThemeSettings,
    resetThemeSettings,
    googleUser,
    syncGoogleSheetAllInOne,
    fetchAndUpdateAlertsFromSheet,
    googleSheetId,
    maintenanceSettings,
    emailSubscribers,
  } = useShopStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);
  const [notifySubscribersOnAdd, setNotifySubscribersOnAdd] = useState<boolean>(true);
  const [launchModalProduct, setLaunchModalProduct] = useState<{
    product: Product;
    recipientCount: number;
  } | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  // Google Sheets Sync State
  const [isSyncingSheets, setIsSyncingSheets] = useState<boolean>(false);
  const [sheetsSyncResult, setSheetsSyncResult] = useState<GoogleSheetsSyncResult | null>(null);

  // Dashain Theme Form State
  const [dashainActive, setDashainActive] = useState<boolean>(themeSettings.isDashainTheme);
  const [dashainDiscount, setDashainDiscount] = useState<number>(themeSettings.discountPercentage);
  const [dashainCoupon, setDashainCoupon] = useState<string>(themeSettings.couponCode);
  const [dashainBannerEn, setDashainBannerEn] = useState<string>(themeSettings.bannerText.en);
  const [dashainBannerNp, setDashainBannerNp] = useState<string>(themeSettings.bannerText.np);
  const [dashainAccent, setDashainAccent] = useState<string>(themeSettings.accentColor || '#8B3A3A');

  // Sync with themeSettings changes
  useEffect(() => {
    setDashainActive(themeSettings.isDashainTheme);
    setDashainDiscount(themeSettings.discountPercentage);
    setDashainCoupon(themeSettings.couponCode);
    setDashainBannerEn(themeSettings.bannerText.en);
    setDashainBannerNp(themeSettings.bannerText.np);
    setDashainAccent(themeSettings.accentColor || '#8B3A3A');
  }, [themeSettings]);

  // QR Image uploads
  const [qrImageUrlInput, setQrImageUrlInput] = useState('');
  const qrFileInputRef = useRef<HTMLInputElement>(null);

  // Security tab state
  const [newPinInput, setNewPinInput] = useState(adminSecuritySettings.passcode);

  useEffect(() => {
    setNewPinInput(adminSecuritySettings.passcode);
  }, [adminSecuritySettings.passcode]);

  // Catalog Creator / Editor state
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);

  // Form fields for product creation/editing
  const [productTitleEn, setProductTitleEn] = useState('');
  const [productTitleNp, setProductTitleNp] = useState('');
  const [productDescEn, setProductDescEn] = useState('');
  const [productDescNp, setProductDescNp] = useState('');
  const [productPrice, setProductPrice] = useState<number>(4500);
  const [productOriginalPrice, setProductOriginalPrice] = useState<number>(5500);
  const [productCategory, setProductCategory] = useState<string>('cat-kurthas');
  const [productFabricEn, setProductFabricEn] = useState('Pure Handloom Silk');
  const [productFabricNp, setProductFabricNp] = useState('शुद्ध हातेतान सिल्क');
  const [productOriginEn, setProductOriginEn] = useState('Kathmandu Atelier, Nepal');
  const [productOriginNp, setProductOriginNp] = useState('काठमाडौँ, नेपाल');
  const [productIsNew, setProductIsNew] = useState<boolean>(true);
  const [productIsFeatured, setProductIsFeatured] = useState<boolean>(false);

  // Multiple Photos state
  const [productImages, setProductImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80',
  ]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const productFileInputRef = useRef<HTMLInputElement>(null);

  // Direct JSON & Node.js File Paste state
  const [jsonPasteInput, setJsonPasteInput] = useState('');
  const [jsonImportError, setJsonImportError] = useState<string | null>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  const sampleProductSnippet = `[
  {
    "id": "dawosti-custom-${Date.now()}",
    "slug": "heritage-silk-kurtha-set",
    "title": {
      "en": "Crimson Heritage Silk Kurtha Set",
      "np": "रातो मौलिक सिल्क कुर्ता सेट"
    },
    "description": {
      "en": "Handcrafted pure silk kurtha with intricate gold zari threadwork, tailored for festive moments.",
      "np": "मौलिक शुद्ध सिल्क र सुनौलो जरी बुट्टाले सजिएको आकर्षक नेपाली फेसन।"
    },
    "price": 5400,
    "originalPrice": 6500,
    "categoryId": "cat-kurthas",
    "categoryName": {
      "en": "Kurthas & Sets",
      "np": "कुर्ता तथा सेट"
    },
    "images": [
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80"
    ],
    "availableSizes": ["S", "M", "L", "XL"],
    "inStock": true,
    "rating": 4.9,
    "reviewCount": 24,
    "tags": ["kurtha", "handloom", "silk"],
    "fabric": { "en": "Mulberry Silk", "np": "मलबेरी सिल्क" },
    "origin": { "en": "Kathmandu, Nepal", "np": "काठमाडौँ, नेपाल" },
    "isNewArrival": true,
    "isFeatured": true
  }
]`;

  const handleLoadSampleJson = () => {
    setJsonPasteInput(sampleProductSnippet);
    setJsonImportError(null);
  };

  const handleImportJson = () => {
    if (!jsonPasteInput.trim()) {
      setJsonImportError('Please paste valid JSON data or array of products.');
      return;
    }

    try {
      const parsed = JSON.parse(jsonPasteInput.trim());
      let itemsToAdd: Product[] = [];

      if (Array.isArray(parsed)) {
        itemsToAdd = parsed;
      } else if (typeof parsed === 'object' && parsed !== null) {
        itemsToAdd = [parsed as Product];
      }

      if (itemsToAdd.length === 0) {
        setJsonImportError('JSON parsed but contained no product items.');
        return;
      }

      itemsToAdd.forEach((item) => {
        if (!item.id) item.id = `dawosti-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        if (!item.title || !item.title.en) {
          throw new Error('Each product must have at least title.en');
        }
        if (!item.price) item.price = 3500;
        if (!item.images || !Array.isArray(item.images) || item.images.length === 0) {
          item.images = ['https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80'];
        }
        if (!item.availableSizes) item.availableSizes = ['Free Size'];
        addProduct(item);
      });

      setJsonPasteInput('');
      setJsonImportError(null);
      showToast(`Successfully imported ${itemsToAdd.length} product(s) to store!`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Invalid JSON format';
      setJsonImportError(`Error parsing JSON: ${errorMsg}`);
    }
  };

  const handleJsonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setJsonPasteInput(text);
        setJsonImportError(null);
        showToast('JSON file loaded into editor! Click "Import to Store" to apply.');
      }
    };
    reader.readAsText(file);
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(products, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dawosti_catalog_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported store catalog as JSON file!');
  };

  // Sizes and stock counts
  const allAvailableSizes: ProductSize[] = ['XS', 'S', 'M', 'L', 'XL', 'Free Size'];
  const [selectedSizes, setSelectedSizes] = useState<ProductSize[]>(['S', 'M', 'L']);
  const [sizeStock, setSizeStock] = useState<Partial<Record<ProductSize, number>>>({
    S: 5,
    M: 8,
    L: 4,
  });

  if (!isAdminOpen) return null;

  const showToast = (msg: string) => {
    setSaveSuccessNotice(msg);
    setTimeout(() => {
      setSaveSuccessNotice(null);
    }, 3200);
  };

  // Unlock Admin handler
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const success = unlockAdmin(enteredPin);
    if (success) {
      setPinError(null);
      setEnteredPin('');
      showToast('Merchant Access Granted');
    } else {
      setPinError('Incorrect Passcode. Try default: 1234');
    }
  };

  // Prepopulate form to edit existing product
  const handleStartEditProduct = (prod: Product) => {
    setEditingProductId(prod.id);
    setIsCreatingNew(true);
    setProductTitleEn(prod.title.en);
    setProductTitleNp(prod.title.np);
    setProductDescEn(prod.description.en);
    setProductDescNp(prod.description.np);
    setProductPrice(prod.price);
    setProductOriginalPrice(prod.originalPrice || Math.round(prod.price * 1.2));
    setProductCategory(prod.categoryId);
    setProductFabricEn(prod.fabric?.en || 'Authentic Silk');
    setProductFabricNp(prod.fabric?.np || 'मौलिक सिल्क');
    setProductOriginEn(prod.origin?.en || 'Kathmandu, Nepal');
    setProductOriginNp(prod.origin?.np || 'काठमाडौँ, नेपाल');
    setProductIsNew(!!prod.isNewArrival);
    setProductIsFeatured(!!prod.isFeatured);
    setProductImages(prod.images.length > 0 ? [...prod.images] : []);
    setSelectedSizes([...prod.availableSizes]);
    setSizeStock(prod.sizeStock || {});
  };

  // Reset form for creating fresh product
  const handleStartNewProduct = () => {
    setEditingProductId(null);
    setIsCreatingNew(true);
    setProductTitleEn('');
    setProductTitleNp('');
    setProductDescEn('');
    setProductDescNp('');
    setProductPrice(4500);
    setProductOriginalPrice(5500);
    setProductCategory('cat-kurthas');
    setProductFabricEn('Pure Mulberry Silk & Handloom Cotton');
    setProductFabricNp('शुद्ध मलबेरी सिल्क तथा हातेतान सुती');
    setProductOriginEn('Kathmandu Atelier, Nepal');
    setProductOriginNp('काठमाडौँ, नेपाल');
    setProductIsNew(true);
    setProductIsFeatured(false);
    setProductImages([
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80',
    ]);
    setSelectedSizes(['S', 'M', 'L']);
    setSizeStock({ S: 5, M: 8, L: 4 });
  };

  // Handle multiple product photo uploads from local disk
  const handleMultipleImageFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    let loadedCount = 0;
    const newBase64Images: string[] = [];

    fileList.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const res = event.target?.result as string;
        if (res) {
          newBase64Images.push(res);
        }
        loadedCount++;
        if (loadedCount === fileList.length) {
          setProductImages((prev) => [...prev, ...newBase64Images]);
          showToast(`Added ${newBase64Images.length} photos!`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return;
    setProductImages((prev) => [...prev, newImageUrl.trim()]);
    setNewImageUrl('');
    showToast('Photo URL added to gallery!');
  };

  const handleRemovePhoto = (index: number) => {
    setProductImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMakePrimaryPhoto = (index: number) => {
    setProductImages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      return [item, ...copy];
    });
    showToast('Updated primary thumbnail photo!');
  };

  // Save product (New or Edit)
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productTitleEn.trim()) {
      alert('Please enter a product title in English');
      return;
    }

    const matchedCat = categories.find((c) => c.id === productCategory);
    const categoryName = matchedCat
      ? matchedCat.name
      : { en: 'Handloom Atelier', np: 'हातेतान पहिरन' };

    const productPayload: Product = {
      id: editingProductId || `dawosti-custom-${Date.now()}`,
      slug: (productTitleEn || 'product')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
      title: {
        en: productTitleEn.trim(),
        np: productTitleNp.trim() || productTitleEn.trim(),
      },
      description: {
        en: productDescEn.trim() || 'Authentic Nepalese handloom tailored fashion.',
        np: productDescNp.trim() || 'मौलिक नेपाली हातेतान फेसन तथा पहिरन।',
      },
      price: Number(productPrice) || 3500,
      originalPrice: productOriginalPrice ? Number(productOriginalPrice) : undefined,
      categoryId: productCategory,
      categoryName,
      images: productImages.length > 0 ? productImages : [
        'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80',
      ],
      availableSizes: selectedSizes.length > 0 ? selectedSizes : ['Free Size'],
      sizeStock,
      inStock: true,
      rating: 4.9,
      reviewCount: 18,
      tags: [productCategory, 'nepali handloom', 'atelier'],
      fabric: {
        en: productFabricEn,
        np: productFabricNp,
      },
      origin: {
        en: productOriginEn,
        np: productOriginNp,
      },
      isNewArrival: productIsNew,
      isFeatured: productIsFeatured,
    };

    if (editingProductId) {
      updateProduct(editingProductId, productPayload);
      showToast(`Updated "${productPayload.title.en}" successfully!`);
    } else {
      addProduct(productPayload);
      const activeCount = emailSubscribers.filter((s) => s.status === 'active').length;
      if (notifySubscribersOnAdd && activeCount > 0) {
        setLaunchModalProduct({
          product: productPayload,
          recipientCount: activeCount,
        });
        showToast(
          `Created "${productPayload.title.en}" & notified ${activeCount} VIP email subscriber(s)!`
        );
      } else {
        showToast(`Created & published "${productPayload.title.en}"!`);
      }
    }

    setIsCreatingNew(false);
    setEditingProductId(null);
  };

  // QR photo upload handlers
  const handleQrFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WEBP, or SVG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        updateMerchantSettings({ staticQrImage: result });
        showToast('Static QR photo updated from file upload!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyQrUrl = () => {
    if (!qrImageUrlInput.trim()) return;
    updateMerchantSettings({ staticQrImage: qrImageUrlInput.trim() });
    setQrImageUrlInput('');
    showToast('Static QR photo updated from image URL!');
  };

  // Filtered products in catalog tab
  const filteredCatalogProducts = products.filter((p) => {
    if (!catalogSearch.trim()) return true;
    const q = catalogSearch.toLowerCase();
    return (
      p.title.en.toLowerCase().includes(q) ||
      p.title.np.toLowerCase().includes(q) ||
      p.categoryName.en.toLowerCase().includes(q)
    );
  });

  return (
    <div
      id="admin-panel-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsAdminOpen(false);
      }}
    >
      <div
        id="admin-panel-card"
        role="dialog"
        aria-modal="true"
        aria-label="Merchant Admin Panel"
        className="bg-white rounded-3xl shadow-2xl border border-[#EADCCE] w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden animate-scaleUp"
      >
        {/* Header Bar */}
        <div className="bg-[#2B1810] text-[#FFF8F0] px-5 sm:px-7 py-4 flex items-center justify-between border-b border-[#3D251B] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#8B3A3A] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif-luxury text-lg sm:text-xl font-bold tracking-wide text-white">
                  Dawosti Merchant Admin Panel
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 px-2 py-0.5 rounded-full">
                  Verified Merchant
                </span>
              </div>
              <p className="text-xs text-[#FAF2E9]/70">
                {language === 'np'
                  ? 'उत्पादन सिर्जना, फोटो ग्यालरी, Fonepay QR र वेबसाइट व्यवस्थापन'
                  : 'Manage Product Catalog, Multiple Photos, Fallback QR & Site Content'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdminAuthenticated && (
              <button
                onClick={() => {
                  lockAdmin();
                  showToast('Admin Panel Locked');
                }}
                title="Lock Admin Session"
                className="min-h-[40px] px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-[0.97]"
              >
                <Lock className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Lock Session</span>
              </button>
            )}

            <button
              id="admin-close-btn"
              onClick={() => setIsAdminOpen(false)}
              aria-label="Close Admin Settings"
              className="min-h-[44px] min-w-[44px] rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all duration-150 active:scale-[0.97]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PASSCODE LOCK SCREEN IF LOCKED AND NOT SIGNED IN AS OWNER */}
        {adminSecuritySettings.requirePasscode &&
        !isAdminAuthenticated &&
        googleUser?.email?.toLowerCase() !== 'sagardawadi10@gmail.com' ? (
          <div className="flex-1 p-6 sm:p-12 flex flex-col items-center justify-center text-center bg-[#FAF2E9] overflow-y-auto">
            <div className="w-16 h-16 rounded-3xl bg-[#8B3A3A] text-[#D4AF37] border-2 border-[#D4AF37]/50 flex items-center justify-center shadow-lg mb-4">
              <Lock className="w-8 h-8" />
            </div>

            <h3 className="font-serif-luxury text-2xl font-bold text-[#2B1810] mb-1">
              Merchant Passcode Required
            </h3>
            <p className="text-xs text-[#6B564C] max-w-sm mb-6 leading-relaxed">
              Enter your merchant secret PIN to edit live product listings, multiple photo galleries, and payment QR settings.
            </p>

            <form onSubmit={handleUnlock} className="w-full max-w-xs space-y-4">
              <div>
                <input
                  type="password"
                  value={enteredPin}
                  onChange={(e) => {
                    setEnteredPin(e.target.value);
                    setPinError(null);
                  }}
                  placeholder="Enter PIN (Default: 1234)"
                  maxLength={12}
                  autoFocus
                  className="w-full px-4 py-3 bg-white border border-[#EADCCE] focus:border-[#8B3A3A] rounded-xl text-center text-lg tracking-widest font-mono font-bold shadow-xs outline-none"
                />
                {pinError && (
                  <p className="text-xs text-red-600 font-bold mt-1.5">{pinError}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full min-h-[48px] py-3 bg-[#8B3A3A] hover:bg-[#722E2E] text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.97] flex items-center justify-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>Unlock Merchant Admin</span>
              </button>

              {/* Instant 1-Click Owner Emergency Unlock */}
              <button
                type="button"
                onClick={() => {
                  unlockAdmin('1234');
                  showToast('Head Admin Access Granted via Owner Emergency Unlock (PIN: 1234)');
                }}
                className="w-full min-h-[44px] py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-200" />
                <span>Owner Emergency Unlock (PIN: 1234 / 1-Click)</span>
              </button>

              {/* Option to Disable PIN completely */}
              <div className="pt-3 border-t border-[#EADCCE] space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    updateAdminSecuritySettings({ requirePasscode: false });
                    unlockAdmin('1234');
                    showToast('PIN passcode protection turned OFF. Admin is now open without PIN.');
                  }}
                  className="text-xs text-[#8B3A3A] hover:underline font-bold block mx-auto"
                >
                  Turn OFF PIN Protection Completely (No Passcode Needed)
                </button>
                <p className="text-[11px] text-[#6B564C]">
                  Hotline / WhatsApp Support: <span className="font-bold text-[#2B1810]">9708251494</span>
                </p>
              </div>
            </form>
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="bg-[#FAF2E9] border-b border-[#EADCCE] px-4 sm:px-7 pt-3 flex items-center gap-2 shrink-0 overflow-x-auto scrollbar-none">
              <button
                id="tab-orders-btn"
                onClick={() => setActiveTab('orders')}
                className={`min-h-[44px] px-4 py-2 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-t border-x transition-all duration-150 active:scale-[0.97] ${
                  activeTab === 'orders'
                    ? 'bg-white text-[#8B3A3A] border-[#EADCCE] border-b-transparent shadow-2xs'
                    : 'text-[#6B564C] hover:text-[#2B1810] border-transparent'
                }`}
              >
                <Truck className="w-4 h-4 text-[#8B3A3A]" />
                <span>Live Orders & Tracking</span>
                {unacknowledgedOrdersCount > 0 ? (
                  <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-extrabold animate-pulse">
                    {unacknowledgedOrdersCount} Alert
                  </span>
                ) : (
                  <span className="text-[10px] bg-[#FAF2E9] border border-[#EADCCE] text-[#6B564C] px-1.5 py-0.2 rounded-full font-bold">
                    {ordersLog.length}
                  </span>
                )}
              </button>

              <button
                id="tab-subscribers-btn"
                onClick={() => setActiveTab('subscribers')}
                className={`min-h-[44px] px-4 py-2 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-t border-x transition-all duration-150 active:scale-[0.97] ${
                  activeTab === 'subscribers'
                    ? 'bg-white text-[#8B3A3A] border-[#EADCCE] border-b-transparent shadow-2xs'
                    : 'text-[#6B564C] hover:text-[#2B1810] border-transparent'
                }`}
              >
                <Mail className="w-4 h-4 text-[#8B3A3A]" />
                <span>Email Drops & VIPs</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold">
                  {emailSubscribers.filter((s) => s.status === 'active').length}
                </span>
              </button>

              <button
                id="tab-agents-maintenance-btn"
                onClick={() => setActiveTab('maintenance')}
                className={`min-h-[44px] px-4 py-2 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-t border-x transition-all duration-150 active:scale-[0.97] ${
                  activeTab === 'maintenance'
                    ? 'bg-white text-[#8B3A3A] border-[#EADCCE] border-b-transparent shadow-2xs'
                    : 'text-[#6B564C] hover:text-[#2B1810] border-transparent'
                }`}
              >
                <Radio className="w-4 h-4 text-[#8B3A3A]" />
                <span>Agents & Maintenance</span>
                {maintenanceSettings.isMaintenanceActive ? (
                  <span className="text-[9px] bg-red-700 text-white px-1.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider animate-pulse">
                    Locked
                  </span>
                ) : maintenanceSettings.warning10MinActive ? (
                  <span className="text-[9px] bg-amber-600 text-white px-1.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider animate-pulse">
                    10-Min Alert
                  </span>
                ) : (
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold">
                    Live Mesh
                  </span>
                )}
              </button>

              <button
                id="tab-dashain-theme-btn"
                onClick={() => setActiveTab('theme')}
                className={`min-h-[44px] px-4 py-2 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-t border-x transition-all duration-150 active:scale-[0.97] ${
                  activeTab === 'theme'
                    ? 'bg-white text-[#8B3A3A] border-[#EADCCE] border-b-transparent shadow-2xs'
                    : 'text-[#6B564C] hover:text-[#2B1810] border-transparent'
                }`}
              >
                <Gift className="w-4 h-4 text-[#8B3A3A]" />
                <span>Dashain Offer Theme</span>
                {themeSettings.isDashainTheme && (
                  <span className="text-[9px] bg-linear-to-r from-[#D4AF37] to-[#B8860B] text-black px-1.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider">
                    Active
                  </span>
                )}
              </button>

              <button
                id="tab-catalog-btn"
                onClick={() => setActiveTab('catalog')}
                className={`min-h-[44px] px-4 py-2 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-t border-x transition-all duration-150 active:scale-[0.97] ${
                  activeTab === 'catalog'
                    ? 'bg-white text-[#8B3A3A] border-[#EADCCE] border-b-transparent shadow-2xs'
                    : 'text-[#6B564C] hover:text-[#2B1810] border-transparent'
                }`}
              >
                <Layers className="w-4 h-4 text-[#8B3A3A]" />
                <span>Product Catalog & Photos</span>
                <span className="text-[10px] bg-[#8B3A3A] text-white px-1.5 py-0.2 rounded-full font-bold">
                  {products.length}
                </span>
              </button>

              <button
                id="tab-static-qr-btn"
                onClick={() => setActiveTab('qr')}
                className={`min-h-[44px] px-4 py-2 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-t border-x transition-all duration-150 active:scale-[0.97] ${
                  activeTab === 'qr'
                    ? 'bg-white text-[#8B3A3A] border-[#EADCCE] border-b-transparent shadow-2xs'
                    : 'text-[#6B564C] hover:text-[#2B1810] border-transparent'
                }`}
              >
                <QrCode className="w-4 h-4 text-[#8B3A3A]" />
                <span>Fallback Static QR Photo</span>
              </button>

              <button
                id="tab-site-content-btn"
                onClick={() => setActiveTab('content')}
                className={`min-h-[44px] px-4 py-2 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-t border-x transition-all duration-150 active:scale-[0.97] ${
                  activeTab === 'content'
                    ? 'bg-white text-[#8B3A3A] border-[#EADCCE] border-b-transparent shadow-2xs'
                    : 'text-[#6B564C] hover:text-[#2B1810] border-transparent'
                }`}
              >
                <Edit3 className="w-4 h-4 text-[#8B3A3A]" />
                <span>Site Content & Texts</span>
              </button>

              <button
                id="tab-security-btn"
                onClick={() => setActiveTab('security')}
                className={`min-h-[44px] px-4 py-2 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-t border-x transition-all duration-150 active:scale-[0.97] ${
                  activeTab === 'security'
                    ? 'bg-white text-[#8B3A3A] border-[#EADCCE] border-b-transparent shadow-2xs'
                    : 'text-[#6B564C] hover:text-[#2B1810] border-transparent'
                }`}
              >
                <Lock className="w-4 h-4 text-[#8B3A3A]" />
                <span>Security & Password</span>
              </button>

              <button
                id="tab-direct-paste-btn"
                onClick={() => setActiveTab('direct-paste')}
                className={`min-h-[44px] px-4 py-2 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-t border-x transition-all duration-150 active:scale-[0.97] ${
                  activeTab === 'direct-paste'
                    ? 'bg-white text-[#8B3A3A] border-[#EADCCE] border-b-transparent shadow-2xs'
                    : 'text-[#6B564C] hover:text-[#2B1810] border-transparent'
                }`}
              >
                <FileCode className="w-4 h-4 text-[#8B3A3A]" />
                <span>Node.js / JSON File Paste</span>
              </button>
            </div>

            {/* Looping Unacknowledged Orders Alert Bar */}
            {unacknowledgedOrdersCount > 0 && (
              <div className="bg-red-50 border-b-2 border-red-500 px-4 sm:px-7 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <span className="flex h-3.5 w-3.5 relative shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-600"></span>
                  </span>
                  <div>
                    <p className="text-xs sm:text-sm font-extrabold text-[#7D1E1E]">
                      🚨 Looping Order Notification: {unacknowledgedOrdersCount} customer order(s) awaiting your "OK" acknowledgment!
                    </p>
                    <p className="text-[11px] text-[#A83232]">
                      This alert stays active continuously until you click "OK" on each order.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      unacknowledgedOrders.forEach((o) => acknowledgeOrder(o.id));
                      setSaveSuccessNotice('All pending orders marked OK and confirmed!');
                      setTimeout(() => setSaveSuccessNotice(null), 3500);
                    }}
                    className="px-3.5 py-1.5 bg-[#8B3A3A] hover:bg-[#722E2E] text-white text-xs font-extrabold rounded-lg shadow-xs transition-all active:scale-[0.97] flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Click OK for All ({unacknowledgedOrdersCount})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="px-3 py-1.5 bg-white border border-[#EADCCE] text-[#2B1810] text-xs font-bold rounded-lg hover:bg-[#FAF2E9]"
                  >
                    View Orders
                  </button>
                </div>
              </div>
            )}

            {/* Success Notification Bar */}
            {saveSuccessNotice && (
              <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center gap-2 text-xs font-bold text-emerald-800 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{saveSuccessNotice}</span>
              </div>
            )}

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-7 bg-[#FFF8F0]/50 space-y-6">

              {/* TAB 0: LIVE ORDERS & REAL-TIME TRACKING WITH GOOGLE SHEETS SYNC */}
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  {/* Top Header with Google Sheets Export */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#EADCCE] shadow-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <Truck className="w-5 h-5 text-[#8B3A3A]" />
                        <h3 className="font-serif-luxury text-base sm:text-lg font-bold text-[#2B1810]">
                          Live Orders & Tracking
                        </h3>
                        {unacknowledgedOrdersCount > 0 && (
                          <span className="px-2.5 py-0.5 bg-red-600 text-white rounded-full text-xs font-extrabold animate-pulse">
                            {unacknowledgedOrdersCount} Need OK
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#6B564C] mt-1">
                        Every order placed on the website appears here. The alert loops until you click "OK".
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Google Sheets All-In-One Sync Button */}
                      <button
                        onClick={async () => {
                          setIsSyncingSheets(true);
                          setSheetsSyncResult(null);
                          try {
                            const res = await syncGoogleSheetAllInOne();
                            setSheetsSyncResult(res);
                            if (res.success) {
                              setSaveSuccessNotice(res.message);
                              setTimeout(() => setSaveSuccessNotice(null), 4000);
                            }
                          } catch (e: any) {
                            setSheetsSyncResult({
                              success: false,
                              message: e?.message || 'Error syncing All-in-One Google Sheet',
                            });
                          } finally {
                            setIsSyncingSheets(false);
                          }
                        }}
                        disabled={isSyncingSheets}
                        className="min-h-[44px] px-4 py-2 bg-[#0F9D58] hover:bg-[#0B8043] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-[0.97] flex items-center gap-2"
                        title="Creates or updates 3 tabs: Orders (Pending with packaging), StoreAlerts, and Products"
                      >
                        {isSyncingSheets ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Syncing All-in-One Sheet...</span>
                          </>
                        ) : (
                          <>
                            <FileSpreadsheet className="w-4 h-4" />
                            <span>Sync All-in-One Google Sheet</span>
                          </>
                        )}
                      </button>

                      {/* Pull Live Alerts from Sheet Button */}
                      <button
                        onClick={async () => {
                          setIsSyncingSheets(true);
                          setSheetsSyncResult(null);
                          try {
                            const res = await fetchAndUpdateAlertsFromSheet();
                            if (res.success) {
                              setSheetsSyncResult({
                                success: true,
                                message: res.message || 'Live alerts successfully updated from Google Sheet!',
                              });
                              setSaveSuccessNotice('Live store alerts synced from Google Sheet!');
                              setTimeout(() => setSaveSuccessNotice(null), 4000);
                            } else {
                              setSheetsSyncResult({
                                success: false,
                                message: res.message || 'No live alert data could be pulled. Please ensure you have signed in and created an All-in-One sheet first.',
                              });
                            }
                          } catch (e: any) {
                            setSheetsSyncResult({
                              success: false,
                              message: e?.message || 'Failed to pull alerts from Google Sheet',
                            });
                          } finally {
                            setIsSyncingSheets(false);
                          }
                        }}
                        disabled={isSyncingSheets}
                        className="min-h-[44px] px-3.5 py-2 bg-[#1A73E8] hover:bg-[#1557B0] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-[0.97] flex items-center gap-1.5"
                        title="Update website announcement bar and festive discounts directly from Google Sheet"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheets ? 'animate-spin' : ''}`} />
                        <span>Update Alerts from Sheet</span>
                      </button>

                      {unacknowledgedOrdersCount > 0 && (
                        <button
                          onClick={() => {
                            unacknowledgedOrders.forEach((o) => acknowledgeOrder(o.id));
                            setSaveSuccessNotice('All pending orders acknowledged (OK)!');
                            setTimeout(() => setSaveSuccessNotice(null), 3000);
                          }}
                          className="min-h-[44px] px-4 py-2 bg-[#8B3A3A] hover:bg-[#722E2E] text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-[0.97] flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Mark All OK</span>
                        </button>
                      )}

                      {ordersLog.length > 0 && (
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to clear all orders? This will permanently remove all logged orders.')) {
                              clearOrdersLog();
                              setSaveSuccessNotice('All orders cleared!');
                              setTimeout(() => setSaveSuccessNotice(null), 3000);
                            }
                          }}
                          className="min-h-[44px] px-3.5 py-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl shadow-xs transition-all active:scale-[0.97] flex items-center gap-1.5"
                          title="Clear all orders from log"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Clear Orders</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Google Sheets Sync Feedback Result */}
                  {sheetsSyncResult && (
                    <div
                      className={`p-4 rounded-2xl border text-xs flex items-start justify-between gap-3 ${
                        sheetsSyncResult.success
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-amber-50 border-amber-200 text-amber-900'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {sheetsSyncResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                        )}
                        <div>
                          <p className="font-bold">{sheetsSyncResult.message}</p>
                          {sheetsSyncResult.spreadsheetUrl && (
                            <a
                              href={sheetsSyncResult.spreadsheetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-1.5 text-emerald-700 hover:text-emerald-900 font-bold underline"
                            >
                              <span>Open Google Spreadsheet</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {!sheetsSyncResult.success && !googleUser && (
                            <p className="text-[11px] text-amber-800 mt-1">
                              Tip: Click the 3-dotted button (⋮) in the top-right header and choose "Sign in with Google" to grant spreadsheet access.
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => setSheetsSyncResult(null)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Search & Filter Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B564C]" />
                      <input
                        type="text"
                        value={orderSearchQuery}
                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                        placeholder="Search by customer login, order #, or phone number..."
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#EADCCE] focus:border-[#8B3A3A] rounded-xl text-xs outline-none shadow-2xs"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                      {(['all', 'unacknowledged', 'confirmed', 'preparing', 'out-for-delivery', 'delivered'] as const).map(
                        (filter) => (
                          <button
                            key={filter}
                            onClick={() => setOrderStatusFilter(filter)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize shrink-0 transition-colors ${
                              orderStatusFilter === filter
                                ? 'bg-[#8B3A3A] text-white shadow-2xs'
                                : 'bg-white text-[#6B564C] border border-[#EADCCE] hover:text-[#2B1810]'
                            }`}
                          >
                            {filter === 'unacknowledged' ? `Needs OK (${unacknowledgedOrdersCount})` : filter.replace(/-/g, ' ')}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Orders List */}
                  {ordersLog.length === 0 ? (
                    <div className="bg-white p-12 rounded-3xl border border-[#EADCCE] text-center space-y-3">
                      <Truck className="w-12 h-12 text-[#8B3A3A]/40 mx-auto" />
                      <h4 className="text-base font-bold text-[#2B1810]">No Orders Placed Yet</h4>
                      <p className="text-xs text-[#6B564C] max-w-md mx-auto">
                        When a customer places an order via the checkout flow, it will appear here immediately with a looping alert until you click "OK".
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {ordersLog
                        .filter((ord) => {
                          if (orderStatusFilter === 'unacknowledged') return !ord.acknowledgedByAdmin;
                          if (orderStatusFilter !== 'all') return ord.status === orderStatusFilter;
                          return true;
                        })
                        .filter((ord) => {
                          if (!orderSearchQuery.trim()) return true;
                          const q = orderSearchQuery.toLowerCase();
                          return (
                            ord.orderNumber.toLowerCase().includes(q) ||
                            ord.shippingAddress.fullName.toLowerCase().includes(q) ||
                            ord.shippingAddress.phone.includes(q) ||
                            (ord.customerLoginName && ord.customerLoginName.toLowerCase().includes(q))
                          );
                        })
                        .map((ord) => {
                          const firstItem = ord.items[0];
                          const isUnacknowledged = !ord.acknowledgedByAdmin;

                          return (
                            <div
                              key={ord.id}
                              className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs p-4 sm:p-5 space-y-4 ${
                                isUnacknowledged
                                  ? 'border-2 border-red-500 ring-2 ring-red-500/20 bg-red-50/15'
                                  : 'border-[#EADCCE]'
                              }`}
                            >
                              {/* Top Bar */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EADCCE]/60 pb-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-mono text-xs sm:text-sm font-extrabold text-[#8B3A3A]">
                                    {ord.orderNumber}
                                  </span>
                                  <span className="text-[11px] text-[#6B564C]">
                                    {new Date(ord.createdAt).toLocaleString()}
                                  </span>
                                  {ord.customerLoginName && (
                                    <span className="px-2 py-0.5 bg-[#FAF2E9] border border-[#EADCCE] rounded-full text-[10px] font-bold text-[#6B564C]">
                                      👤 Customer: {ord.customerLoginName}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FAF2E9] border border-[#EADCCE] text-[#6B564C]">
                                    {ord.paymentMethod.toUpperCase()}
                                  </span>
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold capitalize ${
                                      ord.status === 'delivered'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : ord.status === 'out-for-delivery'
                                        ? 'bg-blue-100 text-blue-800'
                                        : ord.status === 'preparing'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-[#FAF2E9] text-[#8B3A3A]'
                                    }`}
                                  >
                                    {ord.status.replace(/-/g, ' ')}
                                  </span>
                                </div>
                              </div>

                              {/* Customer & Item Snapshot */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1 text-xs">
                                  <p className="font-bold text-[#2B1810]">
                                    {ord.shippingAddress.fullName || 'Valued Customer'}
                                  </p>
                                  <p className="text-[#6B564C] flex items-center gap-1">
                                    <Phone className="w-3.5 h-3.5 text-[#8B3A3A]" />
                                    <span>{ord.shippingAddress.phone}</span>
                                  </p>
                                  <p className="text-[#6B564C]">
                                    {ord.shippingAddress.addressLine}, {ord.shippingAddress.city}, {ord.shippingAddress.province}
                                  </p>
                                </div>

                                <div className="flex items-center gap-3 text-xs">
                                  {firstItem?.product.images?.[0] ? (
                                    <img
                                      src={firstItem.product.images[0]}
                                      alt={firstItem.product.title.en}
                                      className="w-14 h-16 object-cover rounded-lg border border-[#EADCCE] shrink-0"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-14 h-16 bg-[#FAF2E9] rounded-lg border border-[#EADCCE] flex items-center justify-center shrink-0">
                                      <ImageIcon className="w-6 h-6 text-[#6B564C]/40" />
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-bold text-[#2B1810] line-clamp-1">
                                      {firstItem?.product.title.en || 'Dawosti Atelier Garment'}
                                    </p>
                                    <p className="text-[11px] text-[#6B564C]">
                                      Size: {firstItem?.selectedSize || 'M'} | Qty: {firstItem?.quantity || 1}
                                    </p>
                                    {ord.items.length > 1 && (
                                      <p className="text-[10px] text-[#8B3A3A] font-semibold mt-0.5">
                                        + {ord.items.length - 1} other item(s)
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="text-right flex flex-col justify-between">
                                  <div>
                                    <p className="text-[11px] text-[#6B564C]">Order Total</p>
                                    <p className="text-base sm:text-lg font-bold text-[#8B3A3A]">
                                      {formatPrice(ord.totalAmount)}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Looping "OK" Acknowledgment & Status actions */}
                              <div className="pt-3 border-t border-[#EADCCE]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                {isUnacknowledged ? (
                                  <div className="flex items-center justify-between w-full bg-red-50 p-3 rounded-xl border border-red-200 animate-pulse">
                                    <div className="flex items-center gap-2 text-xs font-bold text-red-700">
                                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping shrink-0" />
                                      <span>Looping alert active: Awaiting Admin "OK" acknowledgment!</span>
                                    </div>

                                    <button
                                      onClick={() => {
                                        acknowledgeOrder(ord.id);
                                        setSaveSuccessNotice(`Order ${ord.orderNumber} acknowledged and confirmed!`);
                                        setTimeout(() => setSaveSuccessNotice(null), 3000);
                                      }}
                                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-lg shadow-md transition-all active:scale-[0.95] flex items-center gap-1.5"
                                    >
                                      <Check className="w-4 h-4" />
                                      <span>OK (Acknowledge)</span>
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3">
                                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                                      <span>Acknowledged & Verified by Admin</span>
                                    </div>

                                    {/* Status selectors */}
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[11px] text-[#6B564C] font-semibold">Status:</span>
                                      {(['confirmed', 'preparing', 'out-for-delivery', 'delivered'] as OrderStatus[]).map(
                                        (statusOption) => (
                                          <button
                                            key={statusOption}
                                            onClick={() => updateOrderStatus(ord.id, statusOption)}
                                            className={`px-2.5 py-1 text-[10px] font-bold rounded-md capitalize transition-all ${
                                              ord.status === statusOption
                                                ? 'bg-[#8B3A3A] text-white shadow-2xs'
                                                : 'bg-[#FAF2E9] text-[#6B564C] hover:text-[#2B1810] border border-[#EADCCE]'
                                            }`}
                                          >
                                            {statusOption.replace(/-/g, ' ')}
                                          </button>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: VIP EMAIL DROPS & SUBSCRIBER CAMPAIGNS */}
              {activeTab === 'subscribers' && <SubscribersEmailDropsTab />}

              {/* TAB 0.5: DASHAIN FESTIVE OFFER THEME (REDOABLE IN ADMIN) */}
              {activeTab === 'theme' && (
                <div className="bg-white p-6 rounded-3xl border border-[#EADCCE] space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EADCCE] pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Gift className="w-5 h-5 text-[#8B3A3A]" />
                        <h4 className="text-base font-bold text-[#2B1810]">
                          Dashain Festive Offer Theme (Redoable in Admin)
                        </h4>
                      </div>
                      <p className="text-xs text-[#6B564C] mt-1">
                        Toggle and customize the festive theme for Nepal's greatest festival. Changes apply to the entire website instantly.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const next = !dashainActive;
                        setDashainActive(next);
                        updateThemeSettings({ isDashainTheme: next });
                        setSaveSuccessNotice(next ? 'Dashain Festive Theme activated across entire website!' : 'Dashain Festive Theme deactivated.');
                        setTimeout(() => setSaveSuccessNotice(null), 3000);
                      }}
                      className={`min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-[0.97] ${
                        dashainActive
                          ? 'bg-linear-to-r from-[#7D1E1E] to-[#B83824] text-[#FFF8F0] shadow-md'
                          : 'bg-[#FAF2E9] text-[#6B564C] border border-[#EADCCE] hover:text-[#2B1810]'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                      <span>{dashainActive ? 'Dashain Theme: ACTIVE' : 'Enable Dashain Theme'}</span>
                    </button>
                  </div>

                  {/* Theme Presets */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#6B564C]">Festive Style Presets</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setDashainActive(true);
                          setDashainDiscount(15);
                          setDashainCoupon('DASHAIN15');
                          setDashainBannerEn('🌸 Bada Dashain Mahotsav: Enjoy 15% OFF on Pure Handloom Silk Kurthas & Sarees!');
                          setDashainBannerNp('🌸 बडा दशैँ महोत्सव: शुद्ध हातेतान सिल्क कुर्ता र सारीमा १५% सम्मको विशेष छुट!');
                          setDashainAccent('#D4AF37');
                        }}
                        className="p-3 bg-[#FFF8F0] hover:bg-[#FAF2E9] border border-[#EADCCE] rounded-xl text-left space-y-1 transition-colors"
                      >
                        <span className="text-xs font-bold text-[#8B3A3A] block">🌸 Dashain Festival</span>
                        <span className="text-[11px] text-[#6B564C] block">Crimson, Marigold Gold, 15% Off (DASHAIN15)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDashainActive(true);
                          setDashainDiscount(20);
                          setDashainCoupon('ROYAL20');
                          setDashainBannerEn('👑 Royal Heritage Celebration: Exclusive 20% OFF Kathmandu Handcrafted Collections');
                          setDashainBannerNp('👑 शाही परम्परा उत्सव: काठमाडौँका हस्तनिर्मित कलेक्सनमा २०% विशेष छुट');
                          setDashainAccent('#C5A059');
                        }}
                        className="p-3 bg-[#FFF8F0] hover:bg-[#FAF2E9] border border-[#EADCCE] rounded-xl text-left space-y-1 transition-colors"
                      >
                        <span className="text-xs font-bold text-[#8B3A3A] block">👑 Royal Heritage</span>
                        <span className="text-[11px] text-[#6B564C] block">Deep Burgundy & Rich Gold, 20% Off (ROYAL20)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDashainActive(true);
                          setDashainDiscount(10);
                          setDashainCoupon('TIHAR10');
                          setDashainBannerEn('🪔 Tihar Deepawali Offer: 10% OFF Festive Attire with Free Express Delivery');
                          setDashainBannerNp('🪔 तिहार दीपावली अफर: निःशुल्क डेलिभरी सहित १०% विशेष छुट');
                          setDashainAccent('#E5A93C');
                        }}
                        className="p-3 bg-[#FFF8F0] hover:bg-[#FAF2E9] border border-[#EADCCE] rounded-xl text-left space-y-1 transition-colors"
                      >
                        <span className="text-xs font-bold text-[#8B3A3A] block">🪔 Tihar Lights</span>
                        <span className="text-[11px] text-[#6B564C] block">Amber Gold & Rangoli, 10% Off (TIHAR10)</span>
                      </button>
                    </div>
                  </div>

                  {/* Discount & Coupon Configuration */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-[#6B564C]">Festive Discount Percentage (%)</label>
                      <div className="relative mt-1">
                        <input
                          type="number"
                          min={1}
                          max={70}
                          value={dashainDiscount}
                          onChange={(e) => setDashainDiscount(Number(e.target.value) || 0)}
                          className="w-full p-2.5 bg-[#FAF2E9] border border-[#EADCCE] focus:border-[#8B3A3A] rounded-xl text-xs font-bold outline-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#6B564C]">%</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#6B564C]">Festive Coupon Code</label>
                      <input
                        type="text"
                        value={dashainCoupon}
                        onChange={(e) => setDashainCoupon(e.target.value.toUpperCase())}
                        className="w-full p-2.5 bg-[#FAF2E9] border border-[#EADCCE] focus:border-[#8B3A3A] rounded-xl text-xs font-mono font-bold mt-1 uppercase"
                      />
                    </div>
                  </div>

                  {/* Bilingual Banner Announcements */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-[#6B564C]">Festive Announcement Banner (English)</label>
                      <input
                        type="text"
                        value={dashainBannerEn}
                        onChange={(e) => setDashainBannerEn(e.target.value)}
                        className="w-full p-2.5 bg-[#FAF2E9] border border-[#EADCCE] rounded-xl text-xs mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[#6B564C]">दशैँ उत्सव शीर्ष ब्यानर (नेपाली)</label>
                      <input
                        type="text"
                        value={dashainBannerNp}
                        onChange={(e) => setDashainBannerNp(e.target.value)}
                        className="w-full p-2.5 bg-[#FAF2E9] border border-[#EADCCE] rounded-xl text-xs mt-1"
                      />
                    </div>
                  </div>

                  {/* Live Preview Box */}
                  <div className="p-4 rounded-2xl border border-[#D4AF37]/50 bg-linear-to-r from-[#7D1E1E] via-[#8B3A3A] to-[#B83824] text-white space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37]">
                        Live Store Banner Preview
                      </span>
                      <span className="px-2 py-0.5 bg-[#D4AF37] text-[#2B1810] text-[10px] font-extrabold rounded-full">
                        {dashainCoupon} (-{dashainDiscount}%)
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold">
                      {language === 'np' ? dashainBannerNp : dashainBannerEn}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#EADCCE]">
                    <button
                      type="button"
                      onClick={() => {
                        resetThemeSettings();
                        setSaveSuccessNotice('Dashain theme settings reset to default.');
                        setTimeout(() => setSaveSuccessNotice(null), 3000);
                      }}
                      className="text-xs text-[#6B564C] hover:text-[#8B3A3A] font-semibold"
                    >
                      Reset to Default
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        updateThemeSettings({
                          isDashainTheme: dashainActive,
                          discountPercentage: dashainDiscount,
                          couponCode: dashainCoupon,
                          bannerText: {
                            en: dashainBannerEn,
                            np: dashainBannerNp,
                          },
                          accentColor: dashainAccent,
                        });
                        setSaveSuccessNotice('Dashain Offer Theme successfully applied to the entire website!');
                        setTimeout(() => setSaveSuccessNotice(null), 3500);
                      }}
                      className="min-h-[44px] px-6 py-2.5 bg-[#8B3A3A] hover:bg-[#722E2E] text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.97] flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save & Apply Theme to Whole Website</span>
                    </button>
                  </div>
                </div>
              )}
              
              {/* TAB 1: PRODUCT CATALOG & LISTINGS CREATOR (Multiple Photos + Descriptions) */}
              {activeTab === 'catalog' && (
                <div className="space-y-6">
                  {/* Top Action Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#EADCCE] shadow-xs">
                    <div>
                      <h3 className="font-serif-luxury text-base sm:text-lg font-bold text-[#2B1810]">
                        Manage Boutique Catalog & Listings
                      </h3>
                      <p className="text-xs text-[#6B564C]">
                        Create custom listings from scratch with multiple photos, descriptions, and stock counts.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={resetProductsToDefault}
                        title="Reset boutique listings to default catalog"
                        className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#EADCCE] text-[#6B564C] hover:text-[#8B3A3A] hover:bg-[#FAF2E9] text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-[0.97]"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Catalog</span>
                      </button>

                      <button
                        onClick={handleStartNewProduct}
                        className="min-h-[44px] px-4 py-2 bg-[#8B3A3A] hover:bg-[#722E2E] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-[0.97]"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Add New Listing</span>
                      </button>
                    </div>
                  </div>

                  {/* FORM: CREATE OR EDIT LISTING */}
                  {isCreatingNew && (
                    <div className="bg-white p-5 sm:p-7 rounded-3xl border-2 border-[#8B3A3A]/40 shadow-lg space-y-5 animate-in slide-in-from-top-3 duration-200">
                      <div className="flex items-center justify-between border-b border-[#EADCCE] pb-3">
                        <div className="flex items-center gap-2">
                          <Tag className="w-5 h-5 text-[#8B3A3A]" />
                          <h4 className="font-serif-luxury text-lg font-bold text-[#2B1810]">
                            {editingProductId ? 'Edit Product Listing' : 'Create New Product From Scratch'}
                          </h4>
                        </div>
                        <button
                          onClick={() => {
                            setIsCreatingNew(false);
                            setEditingProductId(null);
                          }}
                          className="text-[#6B564C] hover:text-[#8B3A3A] p-1.5 rounded-lg hover:bg-gray-100"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <form onSubmit={handleSaveProduct} className="space-y-5">
                        
                        {/* 1. Titles & Category */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-[#6B564C] uppercase tracking-wider mb-1">
                              Product Title (English) *
                            </label>
                            <input
                              type="text"
                              required
                              value={productTitleEn}
                              onChange={(e) => setProductTitleEn(e.target.value)}
                              placeholder="e.g. Royal Mulberry Silk Saree"
                              className="w-full px-3.5 py-2.5 bg-[#FAF2E9]/60 border border-[#EADCCE] focus:border-[#8B3A3A] rounded-xl text-xs sm:text-sm font-semibold text-[#2B1810] outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-[#6B564C] uppercase tracking-wider mb-1">
                              Product Title (Nepali / नेपाली)
                            </label>
                            <input
                              type="text"
                              value={productTitleNp}
                              onChange={(e) => setProductTitleNp(e.target.value)}
                              placeholder="उदा: शाही मलबेरी सिल्क साडी"
                              className="w-full px-3.5 py-2.5 bg-[#FAF2E9]/60 border border-[#EADCCE] focus:border-[#8B3A3A] rounded-xl text-xs sm:text-sm font-semibold text-[#2B1810] outline-none"
                            />
                          </div>
                        </div>

                        {/* 2. Prices & Category */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-[#6B564C] uppercase tracking-wider mb-1">
                              Selling Price (NPR रु) *
                            </label>
                            <input
                              type="number"
                              required
                              min={100}
                              value={productPrice}
                              onChange={(e) => setProductPrice(Number(e.target.value))}
                              className="w-full px-3.5 py-2.5 bg-[#FAF2E9]/60 border border-[#EADCCE] focus:border-[#8B3A3A] rounded-xl text-xs sm:text-sm font-bold font-mono text-[#8B3A3A] outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-[#6B564C] uppercase tracking-wider mb-1">
                              Original Strikethrough Price (NPR)
                            </label>
                            <input
                              type="number"
                              min={100}
                              value={productOriginalPrice}
                              onChange={(e) => setProductOriginalPrice(Number(e.target.value))}
                              className="w-full px-3.5 py-2.5 bg-[#FAF2E9]/60 border border-[#EADCCE] focus:border-[#8B3A3A] rounded-xl text-xs sm:text-sm font-mono text-[#6B564C] outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-[#6B564C] uppercase tracking-wider mb-1">
                              Category *
                            </label>
                            <select
                              value={productCategory}
                              onChange={(e) => setProductCategory(e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-[#FAF2E9]/60 border border-[#EADCCE] focus:border-[#8B3A3A] rounded-xl text-xs sm:text-sm font-semibold text-[#2B1810] outline-none"
                            >
                              {categories
                                .filter((c) => c.slug !== 'all')
                                .map((cat) => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.name.en} ({cat.name.np})
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>

                        {/* 3. MULTIPLE PHOTOS MANAGER */}
                        <div className="bg-[#FAF2E9]/80 p-4 sm:p-5 rounded-2xl border border-[#EADCCE] space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <label className="text-xs font-bold uppercase tracking-wider text-[#2B1810] flex items-center gap-1.5">
                                <ImageIcon className="w-4 h-4 text-[#8B3A3A]" />
                                <span>Product Photos Gallery ({productImages.length} photos)</span>
                              </label>
                              <p className="text-[11px] text-[#6B564C]">
                                The first photo will be used as the primary catalog thumbnail.
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                ref={productFileInputRef}
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleMultipleImageFiles}
                                className="hidden"
                              />
                              <button
                                type="button"
                                onClick={() => productFileInputRef.current?.click()}
                                className="min-h-[40px] px-3.5 py-2 bg-white hover:bg-gray-50 border border-[#EADCCE] text-[#8B3A3A] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-[0.97]"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>Upload Multiple Photos</span>
                              </button>
                            </div>
                          </div>

                          {/* Quick URL Adder */}
                          <div className="flex gap-2">
                            <input
                              type="url"
                              placeholder="Or paste an image URL (Unsplash, CDN, etc.)..."
                              value={newImageUrl}
                              onChange={(e) => setNewImageUrl(e.target.value)}
                              className="flex-1 px-3 py-2 bg-white border border-[#EADCCE] rounded-xl text-xs outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleAddImageUrl}
                              className="min-h-[40px] px-4 py-2 bg-[#2B1810] text-white rounded-xl text-xs font-bold hover:bg-[#3D251B] transition-all active:scale-[0.97]"
                            >
                              Add Photo
                            </button>
                          </div>

                          {/* Photo Previews Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
                            {productImages.map((img, idx) => (
                              <div
                                key={idx}
                                className={`relative aspect-3/4 rounded-xl overflow-hidden border-2 bg-white shadow-xs group ${
                                  idx === 0 ? 'border-[#8B3A3A] ring-2 ring-[#8B3A3A]/20' : 'border-[#EADCCE]'
                                }`}
                              >
                                <img
                                  src={img}
                                  alt={`Product ${idx}`}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />

                                {idx === 0 && (
                                  <span className="absolute top-1.5 left-1.5 bg-[#8B3A3A] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-xs">
                                    Primary
                                  </span>
                                )}

                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                                  {idx !== 0 && (
                                    <button
                                      type="button"
                                      onClick={() => handleMakePrimaryPhoto(idx)}
                                      className="px-2 py-1 bg-white text-[#2B1810] text-[10px] font-bold rounded shadow-xs hover:bg-gray-100"
                                    >
                                      Make Primary
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePhoto(idx)}
                                    className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 4. Descriptions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-[#6B564C] uppercase tracking-wider mb-1">
                              Full Description (English)
                            </label>
                            <textarea
                              rows={3}
                              value={productDescEn}
                              onChange={(e) => setProductDescEn(e.target.value)}
                              placeholder="Describe the weave, embroidery, drape, and styling suggestions..."
                              className="w-full p-3 bg-[#FAF2E9]/60 border border-[#EADCCE] focus:border-[#8B3A3A] rounded-xl text-xs sm:text-sm text-[#2B1810] outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-[#6B564C] uppercase tracking-wider mb-1">
                              Full Description (Nepali / नेपाली)
                            </label>
                            <textarea
                              rows={3}
                              value={productDescNp}
                              onChange={(e) => setProductDescNp(e.target.value)}
                              placeholder="हाते बुट्टा, कपडाको गुणस्तर तथा विशेषताहरूको विवरण..."
                              className="w-full p-3 bg-[#FAF2E9]/60 border border-[#EADCCE] focus:border-[#8B3A3A] rounded-xl text-xs sm:text-sm text-[#2B1810] outline-none"
                            />
                          </div>
                        </div>

                        {/* 5. Sizes & Stock Management */}
                        <div className="bg-white p-4 rounded-2xl border border-[#EADCCE] space-y-3">
                          <label className="block text-xs font-bold text-[#6B564C] uppercase tracking-wider">
                            Available Sizes & Stock Quantities
                          </label>

                          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                            {allAvailableSizes.map((size) => {
                              const isChecked = selectedSizes.includes(size);
                              return (
                                <div
                                  key={size}
                                  className={`p-2.5 rounded-xl border transition-all ${
                                    isChecked ? 'border-[#8B3A3A] bg-[#FAF2E9]/50' : 'border-gray-200'
                                  }`}
                                >
                                  <label className="flex items-center gap-1.5 cursor-pointer mb-1.5">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedSizes((prev) => [...prev, size]);
                                          setSizeStock((prev) => ({ ...prev, [size]: 5 }));
                                        } else {
                                          setSelectedSizes((prev) => prev.filter((s) => s !== size));
                                        }
                                      }}
                                      className="accent-[#8B3A3A]"
                                    />
                                    <span className="text-xs font-bold text-[#2B1810]">{size}</span>
                                  </label>

                                  {isChecked && (
                                    <input
                                      type="number"
                                      min={0}
                                      value={sizeStock[size] ?? 5}
                                      onChange={(e) =>
                                        setSizeStock((prev) => ({
                                          ...prev,
                                          [size]: Number(e.target.value),
                                        }))
                                      }
                                      placeholder="Stock"
                                      className="w-full px-2 py-1 bg-white border border-[#EADCCE] rounded text-xs font-mono font-bold text-[#2B1810]"
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* 6. Flags & Badges */}
                        <div className="flex flex-wrap items-center gap-6 pt-1">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#2B1810]">
                            <input
                              type="checkbox"
                              checked={productIsNew}
                              onChange={(e) => setProductIsNew(e.target.checked)}
                              className="accent-[#8B3A3A] w-4 h-4"
                            />
                            <span>Mark as New Arrival (नयाँ आगमन)</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#2B1810]">
                            <input
                              type="checkbox"
                              checked={productIsFeatured}
                              onChange={(e) => setProductIsFeatured(e.target.checked)}
                              className="accent-[#8B3A3A] w-4 h-4"
                            />
                            <span>Feature on Homepage Spotlight (विशेष संग्रह)</span>
                          </label>
                        </div>

                        {/* 6. VIP Email Drop Broadcast on Publish */}
                        {!editingProductId && (
                          <div className="bg-[#FAF2E9] border border-[#D4AF37]/50 rounded-2xl p-4 sm:p-5 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-[#8B3A3A]" />
                                <span className="text-xs sm:text-sm font-bold text-[#2B1810]">
                                  Notify VIP Subscribers via Email Upon Publish
                                </span>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={notifySubscribersOnAdd}
                                  onChange={(e) => setNotifySubscribersOnAdd(e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#8B3A3A]"></div>
                              </label>
                            </div>
                            <p className="text-xs text-[#6B564C] leading-relaxed">
                              When toggled ON, an email notification with subject <span className="font-semibold text-[#8B3A3A]">"Hey, we are selling this! ✨ [Product Name]"</span> including photo, bio description, and direct link will be drafted and sent to all <span className="font-bold text-[#2B1810]">{emailSubscribers.filter((s) => s.status === 'active').length}</span> VIP subscriber(s).
                            </p>
                          </div>
                        )}

                        {/* Submit Actions */}
                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EADCCE]">
                          <button
                            type="button"
                            onClick={() => {
                              setIsCreatingNew(false);
                              setEditingProductId(null);
                            }}
                            className="min-h-[44px] px-5 py-2.5 rounded-xl border border-[#EADCCE] text-[#6B564C] hover:bg-gray-100 text-xs font-bold transition-all active:scale-[0.97]"
                          >
                            Cancel
                          </button>

                          <button
                            type="submit"
                            className="min-h-[48px] px-7 py-2.5 bg-[#8B3A3A] hover:bg-[#722E2E] text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-[0.97] flex items-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            <span>{editingProductId ? 'Save Product Changes' : 'Publish Listing to Store'}</span>
                          </button>
                        </div>

                      </form>
                    </div>
                  )}

                  {/* SEARCH & LIVE LISTINGS TABLE */}
                  <div className="bg-white rounded-2xl border border-[#EADCCE] overflow-hidden shadow-xs">
                    <div className="p-4 border-b border-[#EADCCE] bg-[#FAF2E9] flex items-center justify-between gap-3">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="w-4 h-4 text-[#6B564C] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={catalogSearch}
                          onChange={(e) => setCatalogSearch(e.target.value)}
                          placeholder="Search existing listings..."
                          className="w-full pl-9 pr-3 py-2 bg-white border border-[#EADCCE] rounded-xl text-xs outline-none focus:border-[#8B3A3A]"
                        />
                      </div>
                      <span className="text-xs text-[#6B564C] font-semibold">
                        Showing {filteredCatalogProducts.length} of {products.length} products
                      </span>
                    </div>

                    <div className="divide-y divide-[#EADCCE] max-h-[50vh] overflow-y-auto">
                      {filteredCatalogProducts.map((prod) => (
                        <div
                          key={prod.id}
                          className="p-3.5 sm:p-4 flex items-center justify-between gap-4 hover:bg-[#FAF2E9]/40 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={prod.images[0] || 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80'}
                              alt={prod.title.en}
                              className="w-12 h-15 object-cover object-top rounded-lg border border-[#EADCCE] shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs sm:text-sm font-bold text-[#2B1810] truncate">
                                  {prod.title.en}
                                </h4>
                                {prod.isFeatured && (
                                  <span className="text-[9px] bg-[#D4AF37]/20 text-[#D4AF37] px-1.5 py-0.5 rounded font-bold">
                                    FEATURED
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#6B564C] truncate">
                                {prod.categoryName.en} • {prod.images.length} photos • {prod.availableSizes.join(', ')}
                              </p>
                              <p className="text-xs font-bold text-[#8B3A3A] font-mono mt-0.5">
                                {formatPrice(prod.price)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleStartEditProduct(prod)}
                              className="min-h-[40px] px-3 py-1.5 bg-[#FAF2E9] hover:bg-[#EADCCE] text-[#2B1810] rounded-lg text-xs font-bold border border-[#EADCCE] flex items-center gap-1 transition-all active:scale-[0.97]"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-[#8B3A3A]" />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete "${prod.title.en}"?`)) {
                                  deleteProduct(prod.id);
                                  showToast(`Deleted "${prod.title.en}"`);
                                }
                              }}
                              className="min-h-[40px] p-2 text-[#6B564C] hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors active:scale-[0.97]"
                              title="Delete Listing"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: FALLBACK STATIC QR PHOTO */}
              {activeTab === 'qr' && (
                <div className="space-y-6">
                  {/* Default Mode Selector */}
                  <div className="bg-white p-5 rounded-2xl border border-[#EADCCE] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-[#2B1810] flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-[#8B3A3A]" />
                        <span>Default Fonepay Presentation Mode at Checkout</span>
                      </h4>
                      <p className="text-xs text-[#6B564C] mt-1">
                        Choose whether customers see the interactive dynamic QR code by default, or your official physical QR standee photo.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 bg-[#FAF2E9] p-1.5 rounded-xl border border-[#EADCCE] shrink-0">
                      <button
                        onClick={() => updateMerchantSettings({ useStaticQrByDefault: false })}
                        className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          !merchantSettings.useStaticQrByDefault
                            ? 'bg-[#8B3A3A] text-white shadow-xs'
                            : 'text-[#6B564C] hover:text-[#2B1810]'
                        }`}
                      >
                        Dynamic Payload QR
                      </button>
                      <button
                        onClick={() => updateMerchantSettings({ useStaticQrByDefault: true })}
                        className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          merchantSettings.useStaticQrByDefault
                            ? 'bg-[#8B3A3A] text-white shadow-xs'
                            : 'text-[#6B564C] hover:text-[#2B1810]'
                        }`}
                      >
                        Physical QR Photo
                      </button>
                    </div>
                  </div>

                  {/* Fallback Static QR Photo Manager */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white p-6 rounded-3xl border border-[#EADCCE] shadow-xs">
                    {/* Left: Preview Card */}
                    <div className="lg:col-span-5 flex flex-col items-center justify-center p-5 bg-[#FAF2E9] rounded-2xl border border-[#EADCCE] text-center">
                      <div className="w-full max-w-[240px] aspect-square bg-white rounded-xl shadow-inner border border-[#EADCCE] p-3 flex items-center justify-center overflow-hidden mb-3">
                        <img
                          src={merchantSettings.staticQrImage || DEFAULT_STATIC_FONEPAY_QR_SVG}
                          alt="Merchant QR"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-xs font-bold text-[#8B3A3A]">
                        {merchantSettings.merchantName}
                      </span>
                      <span className="text-[11px] text-[#6B564C] font-mono">
                        PAN: {merchantSettings.merchantPan} • {merchantSettings.bankName}
                      </span>
                    </div>

                    {/* Right: Upload & URLs */}
                    <div className="lg:col-span-7 space-y-4">
                      <h4 className="text-sm font-bold text-[#2B1810]">
                        Update High-Resolution Static QR Photo
                      </h4>
                      <p className="text-xs text-[#6B564C] leading-relaxed">
                        Upload an official photo of your printed Fonepay counter standee or paste a high-resolution image URL.
                      </p>

                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="Paste image URL..."
                          value={qrImageUrlInput}
                          onChange={(e) => setQrImageUrlInput(e.target.value)}
                          className="flex-1 px-3 py-2 bg-white border border-[#EADCCE] rounded-xl text-xs outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleApplyQrUrl}
                          className="min-h-[40px] px-4 py-2 bg-[#8B3A3A] text-white rounded-xl text-xs font-bold hover:bg-[#722E2E] transition-all active:scale-[0.97]"
                        >
                          Apply URL
                        </button>
                      </div>

                      <div className="pt-2">
                        <input
                          ref={qrFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleQrFileUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => qrFileInputRef.current?.click()}
                          className="w-full min-h-[48px] py-2.5 px-4 rounded-xl border-2 border-dashed border-[#8B3A3A]/40 hover:border-[#8B3A3A] bg-white text-xs font-bold text-[#8B3A3A] flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Upload High-Res Standee Photo From Computer</span>
                        </button>
                      </div>

                      {/* Quick Merchant Profile Inputs */}
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="text-[11px] font-bold text-[#6B564C]">Merchant Name</label>
                          <input
                            type="text"
                            value={merchantSettings.merchantName}
                            onChange={(e) => updateMerchantSettings({ merchantName: e.target.value })}
                            className="w-full px-3 py-1.5 bg-[#FAF2E9] border border-[#EADCCE] rounded-lg text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-[#6B564C]">Merchant PAN</label>
                          <input
                            type="text"
                            value={merchantSettings.merchantPan}
                            onChange={(e) => updateMerchantSettings({ merchantPan: e.target.value })}
                            className="w-full px-3 py-1.5 bg-[#FAF2E9] border border-[#EADCCE] rounded-lg text-xs font-mono font-semibold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SITE CONTENT & WHOLE WEBSITE CUSTOMIZATION */}
              {activeTab === 'content' && (
                <div className="bg-white p-6 rounded-3xl border border-[#EADCCE] space-y-6">
                  <div className="border-b border-[#EADCCE] pb-3">
                    <h4 className="text-base font-bold text-[#2B1810] flex items-center gap-2">
                      <Edit3 className="w-5 h-5 text-[#8B3A3A]" />
                      <span>Full Website Content & Visual Text Customizer</span>
                    </h4>
                    <p className="text-xs text-[#6B564C] mt-1">
                      As admin, you have full authority to change text, announcements, buttons, and offers across the entire website.
                    </p>
                  </div>

                  {/* Top Announcement Bar */}
                  <div className="space-y-3 p-4 bg-[#FAF2E9]/70 rounded-2xl border border-[#EADCCE]">
                    <span className="text-xs font-bold text-[#8B3A3A] uppercase tracking-wider block">
                      1. Top Bar Announcement
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-[#6B564C]">Top Announcement (English)</label>
                        <input
                          type="text"
                          value={siteContent.announcementText?.en || ''}
                          onChange={(e) =>
                            updateSiteContent({
                              announcementText: { ...siteContent.announcementText, en: e.target.value },
                            })
                          }
                          className="w-full p-2.5 bg-white border border-[#EADCCE] focus:border-[#8B3A3A] rounded-xl text-xs mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[#6B564C]">शीर्ष सूचना (नेपाली)</label>
                        <input
                          type="text"
                          value={siteContent.announcementText?.np || ''}
                          onChange={(e) =>
                            updateSiteContent({
                              announcementText: { ...siteContent.announcementText, np: e.target.value },
                            })
                          }
                          className="w-full p-2.5 bg-white border border-[#EADCCE] focus:border-[#8B3A3A] rounded-xl text-xs mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Hero Showcase Badge & Main Heading */}
                  <div className="space-y-3 p-4 bg-[#FAF2E9]/70 rounded-2xl border border-[#EADCCE]">
                    <span className="text-xs font-bold text-[#8B3A3A] uppercase tracking-wider block">
                      2. Frontpage Hero Showcase & Headings
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-[#6B564C]">Hero Eyebrow Tag (English)</label>
                        <input
                          type="text"
                          value={siteContent.heroBadge?.en || ''}
                          onChange={(e) =>
                            updateSiteContent({
                              heroBadge: { ...siteContent.heroBadge, en: e.target.value },
                            })
                          }
                          className="w-full p-2.5 bg-white border border-[#EADCCE] focus:border-[#8B3A3A] rounded-xl text-xs mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[#6B564C]">शीर्ष ब्याज ट्याग (नेपाली)</label>
                        <input
                          type="text"
                          value={siteContent.heroBadge?.np || ''}
                          onChange={(e) =>
                            updateSiteContent({
                              heroBadge: { ...siteContent.heroBadge, np: e.target.value },
                            })
                          }
                          className="w-full p-2.5 bg-white border border-[#EADCCE] focus:border-[#8B3A3A] rounded-xl text-xs mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="text-xs font-bold text-[#6B564C]">Hero Main Title (English)</label>
                        <input
                          type="text"
                          value={siteContent.heroTitle?.en || ''}
                          onChange={(e) =>
                            updateSiteContent({
                              heroTitle: { ...siteContent.heroTitle, en: e.target.value },
                            })
                          }
                          className="w-full p-2.5 bg-white border border-[#EADCCE] focus:border-[#8B3A3A] rounded-xl text-xs mt-1 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[#6B564C]">प्रमुख शीर्षक (नेपाली)</label>
                        <input
                          type="text"
                          value={siteContent.heroTitle?.np || ''}
                          onChange={(e) =>
                            updateSiteContent({
                              heroTitle: { ...siteContent.heroTitle, np: e.target.value },
                            })
                          }
                          className="w-full p-2.5 bg-white border border-[#EADCCE] focus:border-[#8B3A3A] rounded-xl text-xs mt-1 font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="text-xs font-bold text-[#6B564C]">Hero Story Subtitle (English)</label>
                        <textarea
                          rows={3}
                          value={siteContent.heroSubtitle?.en || ''}
                          onChange={(e) =>
                            updateSiteContent({
                              heroSubtitle: { ...siteContent.heroSubtitle, en: e.target.value },
                            })
                          }
                          className="w-full p-2.5 bg-white border border-[#EADCCE] focus:border-[#8B3A3A] rounded-xl text-xs mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[#6B564C]">वर्णन उपशीर्षक (नेपाली)</label>
                        <textarea
                          rows={3}
                          value={siteContent.heroSubtitle?.np || ''}
                          onChange={(e) =>
                            updateSiteContent({
                              heroSubtitle: { ...siteContent.heroSubtitle, np: e.target.value },
                            })
                          }
                          className="w-full p-2.5 bg-white border border-[#EADCCE] focus:border-[#8B3A3A] rounded-xl text-xs mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Hero Call to Action Buttons & Promo Code */}
                  <div className="space-y-3 p-4 bg-[#FAF2E9]/70 rounded-2xl border border-[#EADCCE]">
                    <span className="text-xs font-bold text-[#8B3A3A] uppercase tracking-wider block">
                      3. Buttons, Links & Store Promo Code
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-bold text-[#6B564C]">Primary Button (English)</label>
                        <input
                          type="text"
                          value={siteContent.heroExploreBtn?.en || ''}
                          onChange={(e) =>
                            updateSiteContent({
                              heroExploreBtn: { ...siteContent.heroExploreBtn, en: e.target.value },
                            })
                          }
                          className="w-full p-2.5 bg-white border border-[#EADCCE] rounded-xl text-xs mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[#6B564C]">प्राथमिक बटन (नेपाली)</label>
                        <input
                          type="text"
                          value={siteContent.heroExploreBtn?.np || ''}
                          onChange={(e) =>
                            updateSiteContent({
                              heroExploreBtn: { ...siteContent.heroExploreBtn, np: e.target.value },
                            })
                          }
                          className="w-full p-2.5 bg-white border border-[#EADCCE] rounded-xl text-xs mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[#6B564C]">Global Promo Offer Code</label>
                        <input
                          type="text"
                          value={siteContent.offerCode || ''}
                          onChange={(e) =>
                            updateSiteContent({
                              offerCode: e.target.value.toUpperCase(),
                            })
                          }
                          className="w-full p-2.5 bg-white border border-[#EADCCE] rounded-xl text-xs font-mono font-bold uppercase mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Delivery Note & Policies */}
                  <div className="space-y-3 p-4 bg-[#FAF2E9]/70 rounded-2xl border border-[#EADCCE]">
                    <span className="text-xs font-bold text-[#8B3A3A] uppercase tracking-wider block">
                      4. Nationwide Delivery Note & Timeline
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-[#6B564C]">Delivery Note (English)</label>
                        <input
                          type="text"
                          value={siteContent.deliveryTimeNote?.en || ''}
                          onChange={(e) =>
                            updateSiteContent({
                              deliveryTimeNote: { ...siteContent.deliveryTimeNote, en: e.target.value },
                            })
                          }
                          className="w-full p-2.5 bg-white border border-[#EADCCE] rounded-xl text-xs mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[#6B564C]">डेलिभरी विवरण (नेपाली)</label>
                        <input
                          type="text"
                          value={siteContent.deliveryTimeNote?.np || ''}
                          onChange={(e) =>
                            updateSiteContent({
                              deliveryTimeNote: { ...siteContent.deliveryTimeNote, np: e.target.value },
                            })
                          }
                          className="w-full p-2.5 bg-white border border-[#EADCCE] rounded-xl text-xs mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Instant Save Bar */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-[#6B564C]">
                      Changes update immediately across the entire website and stay preserved in memory.
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setSaveSuccessNotice('All website content changes successfully saved and applied!');
                        setTimeout(() => setSaveSuccessNotice(null), 3500);
                      }}
                      className="min-h-[44px] px-6 py-2.5 bg-[#8B3A3A] hover:bg-[#722E2E] text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-[0.97] flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save & Apply Website Changes</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: SECURITY & LOCK SETTINGS */}
              {activeTab === 'security' && (
                <div className="bg-white p-6 rounded-3xl border border-[#EADCCE] space-y-6">
                  <div className="border-b border-[#EADCCE] pb-3">
                    <h4 className="text-base font-bold text-[#2B1810] flex items-center gap-2">
                      <Lock className="w-5 h-5 text-[#8B3A3A]" />
                      <span>Admin Passcode & Lock Settings</span>
                    </h4>
                    <p className="text-xs text-[#6B564C] mt-1">
                      Prevent store visitors from modifying your listings or merchant payment credentials.
                    </p>
                  </div>

                  {/* Toggle Requirement */}
                  <div className="flex items-center justify-between p-4 bg-[#FAF2E9] rounded-2xl border border-[#EADCCE]">
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-[#2B1810]">
                        Require Passcode to Open Admin Panel
                      </p>
                      <p className="text-[11px] text-[#6B564C]">
                        When enabled, clicking the admin trigger prompts for your secret PIN.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        updateAdminSecuritySettings({
                          requirePasscode: !adminSecuritySettings.requirePasscode,
                        })
                      }
                      className={`min-h-[44px] min-w-[56px] flex items-center justify-center`}
                    >
                      <span
                        className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                          adminSecuritySettings.requirePasscode ? 'bg-[#8B3A3A]' : 'bg-[#EADCCE]'
                        }`}
                      >
                        <span
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            adminSecuritySettings.requirePasscode ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </span>
                    </button>
                  </div>

                  {/* Change Passcode */}
                  <div className="p-4 bg-white rounded-2xl border border-[#EADCCE] space-y-3">
                    <label className="text-xs font-bold text-[#6B564C] uppercase tracking-wider block">
                      Change Merchant Secret Passcode / PIN
                    </label>
                    <div className="flex gap-2 max-w-sm">
                      <input
                        type="text"
                        value={newPinInput}
                        onChange={(e) => setNewPinInput(e.target.value)}
                        placeholder="e.g. 1234 or dawosti2026"
                        className="flex-1 px-3.5 py-2.5 bg-[#FAF2E9] border border-[#EADCCE] rounded-xl text-sm font-mono font-bold outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newPinInput.trim()) {
                            alert('PIN cannot be blank');
                            return;
                          }
                          updateAdminSecuritySettings({ passcode: newPinInput.trim() });
                          showToast('Secret Passcode successfully changed!');
                        }}
                        className="min-h-[44px] px-4 py-2 bg-[#8B3A3A] hover:bg-[#722E2E] text-white rounded-xl text-xs font-bold transition-all active:scale-[0.97]"
                      >
                        Update PIN
                      </button>
                    </div>
                  </div>

                  {/* Lock Now Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        lockAdmin();
                        showToast('Admin Session Locked');
                      }}
                      className="min-h-[44px] px-5 py-2.5 bg-[#2B1810] hover:bg-[#3D251B] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-[0.97]"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Lock Admin Session Now</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 5: DIRECT FILE & JSON DATA (Node.js Paste) */}
              {activeTab === 'direct-paste' && (
                <div className="bg-white p-6 rounded-3xl border border-[#EADCCE] space-y-6">
                  <div className="border-b border-[#EADCCE] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-base font-bold text-[#2B1810] flex items-center gap-2">
                        <FileCode className="w-5 h-5 text-[#8B3A3A]" />
                        <span>Direct File & JSON Code Management (Node.js)</span>
                      </h4>
                      <p className="text-xs text-[#6B564C] mt-1">
                        Paste your raw JSON products data, upload a .json database file, or export your full catalog.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleExportJson}
                        className="min-h-[40px] px-3.5 py-1.5 bg-[#FAF2E9] hover:bg-[#EADCCE] text-[#2B1810] rounded-xl text-xs font-bold border border-[#EADCCE] flex items-center gap-1.5 transition-all active:scale-[0.97]"
                      >
                        <Download className="w-3.5 h-3.5 text-[#8B3A3A]" />
                        <span>Export Catalog (.json)</span>
                      </button>

                      <input
                        ref={jsonFileInputRef}
                        type="file"
                        accept=".json,application/json"
                        onChange={handleJsonFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => jsonFileInputRef.current?.click()}
                        className="min-h-[40px] px-3.5 py-1.5 bg-[#FAF2E9] hover:bg-[#EADCCE] text-[#2B1810] rounded-xl text-xs font-bold border border-[#EADCCE] flex items-center gap-1.5 transition-all active:scale-[0.97]"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#8B3A3A]" />
                        <span>Upload .json File</span>
                      </button>
                    </div>
                  </div>

                  {/* Actions & Sample Helper */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-[#6B564C] uppercase tracking-wider">
                      Paste Product JSON or Array
                    </span>
                    <button
                      type="button"
                      onClick={handleLoadSampleJson}
                      className="text-xs text-[#8B3A3A] hover:underline font-bold"
                    >
                      Fill Sample Product Template
                    </button>
                  </div>

                  {/* Textarea for JSON */}
                  <div className="relative">
                    <textarea
                      rows={12}
                      value={jsonPasteInput}
                      onChange={(e) => {
                        setJsonPasteInput(e.target.value);
                        setJsonImportError(null);
                      }}
                      placeholder={`[\n  {\n    "title": { "en": "Example Silk Kurtha", "np": "सिल्क कुर्ता" },\n    "price": 4500,\n    "categoryId": "cat-kurthas",\n    "images": ["https://..."]\n  }\n]`}
                      className="w-full p-4 bg-[#FAF2E9]/60 font-mono text-xs text-[#2B1810] border border-[#EADCCE] focus:border-[#8B3A3A] rounded-2xl outline-none leading-relaxed"
                    />
                  </div>

                  {jsonImportError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>{jsonImportError}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setJsonPasteInput('');
                        setJsonImportError(null);
                      }}
                      className="min-h-[44px] px-5 py-2.5 rounded-xl border border-[#EADCCE] text-[#6B564C] hover:bg-gray-100 text-xs font-bold transition-all active:scale-[0.97]"
                    >
                      Clear Editor
                    </button>

                    <button
                      type="button"
                      onClick={handleImportJson}
                      className="min-h-[48px] px-6 py-2.5 bg-[#8B3A3A] hover:bg-[#722E2E] text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-[0.97] flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Parse, Validate & Import to Live Store</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Multi-Agent Sync & Emergency Maintenance Tab */}
              {activeTab === 'maintenance' && <MultiAgentMaintenanceTab />}

            </div>
          </>
        )}

        {/* Celebratory Launch Email Broadcast Modal */}
        {launchModalProduct && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border-2 border-[#D4AF37] max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-[#EADCCE] pb-3">
                <div className="flex items-center gap-2 text-[#8B3A3A]">
                  <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                  <h4 className="font-serif-luxury text-lg font-bold text-[#2B1810]">
                    Drop Email Campaign Broadcasted!
                  </h4>
                </div>
                <button
                  onClick={() => setLaunchModalProduct(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-[#2B1810]">
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2.5 text-emerald-900 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Mailed to {launchModalProduct.recipientCount} active VIP subscriber(s)!
                  </span>
                </div>

                <div className="bg-[#FAF2E9] border border-[#EADCCE] rounded-xl p-3.5 space-y-2">
                  <div className="text-[11px] text-[#6B564C]">
                    <span className="font-bold uppercase">Subject: </span>
                    <span className="font-medium text-[#2B1810]">
                      Hey, we are selling this! ✨ {launchModalProduct.product.title.en}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    {launchModalProduct.product.images?.[0] && (
                      <img
                        src={launchModalProduct.product.images[0]}
                        alt={launchModalProduct.product.title.en}
                        className="w-14 h-16 object-cover rounded-lg border border-[#EADCCE] shrink-0"
                      />
                    )}
                    <div className="space-y-0.5">
                      <div className="font-bold text-[#2B1810]">
                        {launchModalProduct.product.title.en}
                      </div>
                      <div className="text-[#6B564C] line-clamp-2 italic">
                        {launchModalProduct.product.description.en}
                      </div>
                      <div className="font-bold text-[#8B3A3A]">
                        {formatPrice(launchModalProduct.product.price)}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-[#6B564C]">
                  Official Contact: <span className="font-bold text-[#2B1810]">contact.dawosti@gmail.com</span> | WhatsApp & Hotline: <span className="font-bold text-[#2B1810]">+977 9708251494</span>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-[#EADCCE]">
                {(() => {
                  const activeEmails = emailSubscribers
                    .filter((s) => s.status === 'active')
                    .map((s) => s.email);
                  const preview = buildNewProductEmailContent(launchModalProduct.product);
                  const mailto = buildMailtoUrl(activeEmails, preview.subject, preview.bodyText);
                  return (
                    <>
                      {mailto && (
                        <a
                          href={mailto}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:flex-1 min-h-[42px] px-4 py-2 bg-[#8B3A3A] hover:bg-[#722E2E] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open in Mail App (BCC All)</span>
                        </a>
                      )}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(preview.bodyText);
                          showToast('Email content copied to clipboard!');
                        }}
                        className="w-full sm:w-auto min-h-[42px] px-4 py-2 bg-[#FAF2E9] hover:bg-[#F3E5D8] border border-[#EADCCE] text-[#2B1810] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Broadcast Text</span>
                      </button>
                    </>
                  );
                })()}
                <button
                  onClick={() => setLaunchModalProduct(null)}
                  className="w-full sm:w-auto min-h-[42px] px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
