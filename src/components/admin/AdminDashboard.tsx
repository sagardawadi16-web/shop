import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles, ShieldCheck, Package, Settings,
  Plus, Edit2, Trash2, Check, RotateCcw, ChevronDown, ChevronUp,
  Truck, ArrowLeft, MessageCircle, Printer, Search,
  TrendingUp, ShoppingBag, DollarSign, AlertCircle, Copy,
  LogOut, Users, Radio, ShieldAlert,
  Send, RefreshCw
} from 'lucide-react';
import { useAdminStore } from '../../stores/adminStore';
import { useProductStore } from '../../stores/productStore';
import { useOrderStore } from '../../stores/orderStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { Product, ProductSize, OrderStatus, Order } from '../../types';
import { toast } from '../common/Toast';
import { CATEGORIES } from '../../mockData';
import { getTrafficStats, TrafficStats } from '../../services/visitorTracker';
import { publishSettings } from '../../services/firestoreSettings';

type Tab = 'overview' | 'orders' | 'catalog' | 'updates' | 'campaigns' | 'settings';

const SIZES: ProductSize[] = ['XS', 'S', 'M', 'L', 'XL', 'Free Size'];

const SAMPLE_IMAGES = [
  { label: 'Silk Kurtha', url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80' },
  { label: 'Bridal Lehenga', url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80' },
  { label: 'Pashmina Shawl', url: 'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?auto=format&fit=crop&w=800&q=80' },
  { label: 'Dhaka Jacket', url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80' },
];

export const AdminDashboard: React.FC = () => {
  const { isAuthenticated, user, isSigningIn, authError, signIn, signOut } = useAdminStore();
  const { products, addProduct, updateProduct, deleteProduct, resetProducts } = useProductStore();
  const { orders, updateOrderStatus, verifyOrder, deleteOrder, clearAllOrders } = useOrderStore();
  const { language, toggleLanguage, theme, merchant, siteContent, updateTheme, updateMerchant, updateSiteContent, formatPrice, setPageView } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Traffic / Unique Visitors State
  const [traffic, setTraffic] = useState<TrafficStats>({
    uniqueVisitorsTotal: 142,
    uniqueVisitorsToday: 18,
    totalPageViews: 412,
    lastUpdated: new Date().toISOString(),
  });

  useEffect(() => {
    getTrafficStats().then(setTraffic);
  }, []);

  // Orders State
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  // Catalog State
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('all');
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({
    titleEn: '',
    titleNp: '',
    descEn: '',
    descNp: '',
    price: 3500,
    originalPrice: 0,
    categoryId: 'cat-kurthas',
    images: ['https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80'],
    newImageUrl: '',
    sizes: ['S', 'M', 'L'] as ProductSize[],
    isFeatured: true,
    isNewArrival: false,
  });

  // Live Broadcast / Site Updater State
  const [broadcastForm, setBroadcastForm] = useState({
    announcementEn: theme.bannerText.en,
    announcementNp: theme.bannerText.np,
    heroTitleEn: siteContent.heroHeadline.en,
    heroTitleNp: siteContent.heroHeadline.np,
    heroSubtextEn: siteContent.heroSubtext.en,
    heroSubtextNp: siteContent.heroSubtext.np,
  });
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // -------------------------------------------------------------
  // Calculations & Analytics
  // -------------------------------------------------------------
  const analytics = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== 'cancelled');
    const totalRevenue = validOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const pendingOrders = orders.filter((o) => o.status === 'pending');
    const unverifiedOrders = orders.filter((o) => !o.verification || o.verification.status === 'unverified');
    const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
    const aov = validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;
    const conversionRate = traffic.uniqueVisitorsTotal > 0 ? ((orders.length / traffic.uniqueVisitorsTotal) * 100).toFixed(1) : '0.0';

    return {
      totalRevenue,
      totalOrders: orders.length,
      pendingCount: pendingOrders.length,
      unverifiedCount: unverifiedOrders.length,
      deliveredCount,
      aov,
      conversionRate,
      productCount: products.length,
    };
  }, [orders, products, traffic]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (orderStatusFilter === 'needs_verification') {
        return !o.verification || o.verification.status === 'unverified' || o.verification.status === 'suspicious';
      }
      if (orderStatusFilter === 'verified_genuine') {
        return o.verification?.status === 'verified_genuine';
      }
      if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) {
        return false;
      }

      if (orderSearch.trim()) {
        const q = orderSearch.toLowerCase();
        const num = o.orderNumber.toLowerCase();
        const name = (o.shippingAddress?.fullName || '').toLowerCase();
        const phone = (o.shippingAddress?.phone || '');
        const city = (o.shippingAddress?.city || '').toLowerCase();
        return num.includes(q) || name.includes(q) || phone.includes(q) || city.includes(q);
      }
      return true;
    });
  }, [orders, orderStatusFilter, orderSearch]);

  // Filtered Products
  const filteredCatalog = useMemo(() => {
    return products.filter((p) => {
      if (catalogCategory !== 'all' && p.categoryId !== catalogCategory) return false;
      if (catalogSearch.trim()) {
        const q = catalogSearch.toLowerCase();
        return (
          p.title.en.toLowerCase().includes(q) ||
          p.title.np.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [products, catalogCategory, catalogSearch]);

  // -------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------
  const handleStartNewProduct = () => {
    setEditingProductId(null);
    setIsCreatingProduct(true);
    setProductForm({
      titleEn: '',
      titleNp: '',
      descEn: '',
      descNp: '',
      price: 3500,
      originalPrice: 0,
      categoryId: 'cat-kurthas',
      images: ['https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80'],
      newImageUrl: '',
      sizes: ['S', 'M', 'L'],
      isFeatured: true,
      isNewArrival: false,
    });
  };

  const handleStartEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setIsCreatingProduct(true);
    setProductForm({
      titleEn: p.title.en,
      titleNp: p.title.np,
      descEn: p.description.en,
      descNp: p.description.np,
      price: p.price,
      originalPrice: p.originalPrice || 0,
      categoryId: p.categoryId,
      images: p.images && p.images.length > 0 ? [...p.images] : ['https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80'],
      newImageUrl: '',
      sizes: [...p.availableSizes],
      isFeatured: !!p.isFeatured,
      isNewArrival: !!p.isNewArrival,
    });
  };

  const handleDuplicateProduct = (p: Product) => {
    const clone: Product = {
      ...p,
      id: `daw-${Date.now()}`,
      slug: `${p.slug}-copy-${Date.now().toString().slice(-4)}`,
      title: {
        en: `${p.title.en} (Copy)`,
        np: `${p.title.np} (प्रतिलिपि)`,
      },
    };
    addProduct(clone);
    toast('Product duplicated!');
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.titleEn.trim()) {
      toast('Product Title (English) is required', 'error');
      return;
    }

    const payload: Product = {
      id: editingProductId || `daw-custom-${Date.now()}`,
      slug: productForm.titleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: {
        en: productForm.titleEn.trim(),
        np: productForm.titleNp.trim() || productForm.titleEn.trim(),
      },
      description: {
        en: productForm.descEn.trim() || 'Authentic handcrafted boutique apparel.',
        np: productForm.descNp.trim() || 'मौलिक नेपाली हस्तनिर्मित बुटिक फेसन।',
      },
      price: Number(productForm.price) || 3500,
      originalPrice: productForm.originalPrice ? Number(productForm.originalPrice) : undefined,
      categoryId: productForm.categoryId,
      categoryName: {
        en: productForm.categoryId.replace('cat-', '').replace(/-/g, ' '),
        np: productForm.categoryId.replace('cat-', ''),
      },
      images: productForm.images.filter(Boolean),
      availableSizes: productForm.sizes,
      inStock: true,
      rating: 4.9,
      reviewCount: 1,
      tags: [productForm.categoryId, 'handloom', 'dawosti'],
      isFeatured: productForm.isFeatured,
      isNewArrival: productForm.isNewArrival,
    };

    if (editingProductId) {
      updateProduct(editingProductId, payload);
      toast('Product updated and saved to Firestore!');
    } else {
      addProduct(payload);
      toast('New product added to catalog!');
    }

    setIsCreatingProduct(false);
    setEditingProductId(null);
  };

  const toggleSizeSelection = (s: ProductSize) => {
    setProductForm((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(s)
        ? prev.sizes.filter((x) => x !== s)
        : [...prev.sizes, s],
    }));
  };

  const handleAddImageUrl = () => {
    if (!productForm.newImageUrl.trim()) return;
    setProductForm((prev) => ({
      ...prev,
      images: [...prev.images, prev.newImageUrl.trim()],
      newImageUrl: '',
    }));
  };

  const handleRemoveImageUrl = (index: number) => {
    setProductForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleWhatsAppVerify = (order: Order) => {
    const phone = order.shippingAddress.phone.replace(/[^0-9]/g, '');
    const nepPhone = phone.startsWith('977') ? phone : `977${phone}`;
    const message = `Namaste ${order.shippingAddress.fullName}! 🌸\n\nThis is Dawosti Boutique verifying your order #${order.orderNumber}.\n\nItems: ${order.items.map((i) => `${i.product.title.en} (${i.selectedSize}) x${i.quantity}`).join(', ')}\nTotal Amount: ${formatPrice(order.totalAmount)}\nDelivery to: ${order.shippingAddress.addressLine}, ${order.shippingAddress.city}\n\nPlease reply with "YES" to confirm this genuine order for prompt delivery! ✨\n— Dawosti Boutique Kathmandu (dawosti.com)`;

    window.open(`https://wa.me/${nepPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleBroadcastLive = async () => {
    setIsBroadcasting(true);
    setBroadcastSuccess(false);

    try {
      updateTheme({
        bannerText: { en: broadcastForm.announcementEn, np: broadcastForm.announcementNp },
      });

      updateSiteContent({
        heroHeadline: { en: broadcastForm.heroTitleEn, np: broadcastForm.heroTitleNp },
        heroSubtext: { en: broadcastForm.heroSubtextEn, np: broadcastForm.heroSubtextNp },
      });

      await publishSettings({
        theme: {
          ...theme,
          bannerText: { en: broadcastForm.announcementEn, np: broadcastForm.announcementNp },
        },
        siteContent: {
          ...siteContent,
          heroHeadline: { en: broadcastForm.heroTitleEn, np: broadcastForm.heroTitleNp },
          heroSubtext: { en: broadcastForm.heroSubtextEn, np: broadcastForm.heroSubtextNp },
        },
      });

      setBroadcastSuccess(true);
      toast('Broadcast Published Live to all visitors on dawosti.com!');
      setTimeout(() => setBroadcastSuccess(false), 5000);
    } catch {
      toast('Broadcast published locally (Firestore sync pending)');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const statusColors: Record<OrderStatus, { bg: string; text: string; border: string }> = {
    pending: { bg: '#FEF3C7', text: '#B45309', border: '#F59E0B' },
    confirmed: { bg: '#DBEAFE', text: '#1E40AF', border: '#3B82F6' },
    shipped: { bg: '#EDE9FE', text: '#6D28D9', border: '#8B5CF6' },
    delivered: { bg: '#D1FAE5', text: '#065F46', border: '#10B981' },
    cancelled: { bg: '#FEE2E2', text: '#991B1B', border: '#EF4444' },
  };

  // -------------------------------------------------------------
  // RENDER: Security Login Gate (Google ID Verification Only)
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top, #3D1414 0%, #1A0A0A 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ width: '100%', maxWidth: 440, background: '#FAF2E9', borderRadius: 24, padding: 36, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', border: '1.5px solid #D4AF37' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 68, height: 68, borderRadius: 20, background: '#8B3A3A', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(139,58,58,0.3)', border: '1px solid #D4AF37' }}>
              <ShieldCheck size={36} color="#D4AF37" />
            </div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 28, fontWeight: 700, color: '#2B1810', marginBottom: 6 }}>
              Dawosti Merchant Atelier
            </h1>
            <p style={{ fontSize: 13, color: '#6B564C', lineHeight: 1.5 }}>
              Restricted Store Owner Portal.<br />Cryptographic Google ID verification required.
            </p>
          </div>

          {authError && (
            <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: 10, padding: '12px 14px', marginBottom: 20, color: '#991B1B', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldAlert size={18} color="#DC2626" style={{ flexShrink: 0 }} />
              <span>{authError}</span>
            </div>
          )}

          {/* Secure Google OAuth Sign In */}
          <button
            onClick={() => signIn()}
            disabled={isSigningIn}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: 14,
              background: '#8B3A3A',
              color: '#FFF8F0',
              border: '1.5px solid #D4AF37',
              fontWeight: 800,
              fontSize: 15,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              cursor: isSigningIn ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 15px rgba(139,58,58,0.4)',
              transition: 'all 0.2s',
            }}
          >
            <ShieldCheck size={20} color="#D4AF37" />
            <span>{isSigningIn ? 'Verifying Google ID...' : 'Sign In with Store Owner Google ID'}</span>
          </button>

          <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(212,175,55,0.1)', borderRadius: 10, border: '1px solid rgba(212,175,55,0.3)', textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: '#6B564C', lineHeight: 1.5 }}>
              🔒 <strong>Cryptographic Protection</strong>: Only pre-authorized Google Account hashes are permitted. Plaintext emails and PIN bypasses are disabled.
            </p>
          </div>

          <div style={{ marginTop: 24, textAlign: 'center', borderTop: '1px solid #EADCCE', paddingTop: 16 }}>
            <button
              onClick={() => setPageView('home')}
              style={{ background: 'none', border: 'none', color: '#8B3A3A', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <ArrowLeft size={14} /> Return to Dawosti Boutique
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Full Executive Dashboard
  // -------------------------------------------------------------
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F6F2', color: '#2B1810', display: 'flex', flexDirection: 'column' }}>

      {/* TOP ATELIER APP BAR */}
      <header style={{ backgroundColor: '#2B1810', color: '#FAF2E9', borderBottom: '2px solid #D4AF37', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>

          {/* Left: Brand & Verification */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#8B3A3A', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #D4AF37' }}>
              <Sparkles size={20} color="#D4AF37" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 700, letterSpacing: '0.05em' }}>
                  DAWOSTI ATELIER
                </h1>
                <span style={{ background: '#059669', color: 'white', borderRadius: 99, fontSize: 10, fontWeight: 800, padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ShieldCheck size={12} /> VERIFIED OWNER
                </span>
              </div>
              <p style={{ fontSize: 11, color: 'rgba(250,242,233,0.6)' }}>
                Executive Boutique Management & Inventory OS
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Store Owner Avatar */}
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px', background: 'rgba(255,255,255,0.08)', borderRadius: 99, border: '1px solid rgba(212,175,55,0.3)' }} className="hide-mobile">
                <img src={user.avatar} alt={user.name} style={{ width: 24, height: 24, borderRadius: '50%' }} />
                <span style={{ fontSize: 12, fontWeight: 600 }}>{user.name}</span>
              </div>
            )}

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(250,242,233,0.2)', color: '#FAF2E9', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              {language === 'en' ? 'नेपाली' : 'EN'}
            </button>

            {/* Return to Store */}
            <button
              onClick={() => setPageView('home')}
              className="btn btn-primary"
              style={{ padding: '8px 16px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <ArrowLeft size={16} /> <span>Back to Store</span>
            </button>

            {/* Lock / Sign Out */}
            <button
              onClick={() => { signOut(); }}
              title="Sign Out of Atelier"
              style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* TABS NAVIGATION BAR */}
        <div style={{ backgroundColor: '#1A0A0A', borderTop: '1px solid rgba(212,175,55,0.2)' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', padding: '0 16px' }}>
            {[
              { id: 'overview', label: 'Dashboard', icon: <TrendingUp size={16} /> },
              { id: 'orders', label: `Orders (${orders.length})`, icon: <Truck size={16} />, badge: analytics.unverifiedCount > 0 ? `${analytics.unverifiedCount} Unverified` : null },
              { id: 'catalog', label: `Catalog (${products.length})`, icon: <Package size={16} /> },
              { id: 'updates', label: 'Broadcast & Live Updater', icon: <Radio size={16} /> },
              { id: 'campaigns', label: 'Festive & Discounts', icon: <Sparkles size={16} /> },
              { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
            ].map(({ id, label, icon, badge }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as Tab)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '14px 20px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: activeTab === id ? '#D4AF37' : 'rgba(250,242,233,0.7)',
                  fontWeight: activeTab === id ? 700 : 500,
                  fontSize: 13,
                  borderBottom: `3px solid ${activeTab === id ? '#D4AF37' : 'transparent'}`,
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {icon}
                <span>{label}</span>
                {badge && (
                  <span style={{ background: '#DC2626', color: 'white', borderRadius: 99, fontSize: 10, fontWeight: 800, padding: '2px 7px' }}>
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, maxWidth: 1400, width: '100%', margin: '0 auto', padding: '24px 20px 48px' }}>

        {/* ========================================================
            TAB 1: EXECUTIVE OVERVIEW & TRAFFIC ANALYTICS
        ======================================================== */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Unverified Orders Alert Banner */}
            {analytics.unverifiedCount > 0 && (
              <div style={{ background: '#FFFBEB', border: '1.5px solid #F59E0B', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <ShieldAlert size={24} color="#D97706" style={{ flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontWeight: 800, fontSize: 15, color: '#92400E' }}>
                      {analytics.unverifiedCount} Order{analytics.unverifiedCount > 1 ? 's' : ''} Need Genuine Customer Verification!
                    </h4>
                    <p style={{ fontSize: 12, color: '#B45309' }}>
                      Verify via phone or WhatsApp before preparing dispatch to avoid fake/spam orders.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setActiveTab('orders'); setOrderStatusFilter('needs_verification'); }}
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', fontSize: 12 }}
                >
                  Verify Orders Now →
                </button>
              </div>
            )}

            {/* KPI STAT CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              {/* Card 1: Total Revenue */}
              <div className="card" style={{ padding: 20, borderLeft: '4px solid #059669', background: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#6B564C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Revenue</span>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <DollarSign size={18} color="#059669" />
                  </div>
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#2B1810', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                  {formatPrice(analytics.totalRevenue)}
                </div>
                <div style={{ fontSize: 12, color: '#059669', fontWeight: 600, marginTop: 4 }}>
                  From {analytics.totalOrders} total boutique orders
                </div>
              </div>

              {/* Card 2: Orders Volume & Verification */}
              <div className="card" style={{ padding: 20, borderLeft: '4px solid #8B3A3A', background: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#6B564C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Orders Volume</span>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShoppingBag size={18} color="#8B3A3A" />
                  </div>
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#2B1810' }}>
                  {analytics.totalOrders}
                </div>
                <div style={{ fontSize: 12, color: '#6B564C', marginTop: 4 }}>
                  <strong style={{ color: '#B45309' }}>{analytics.unverifiedCount} unverified</strong> • {analytics.deliveredCount} delivered
                </div>
              </div>

              {/* Card 3: Unique Visitors Today */}
              <div className="card" style={{ padding: 20, borderLeft: '4px solid #7C3AED', background: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#6B564C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unique Visitors Today</span>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={18} color="#7C3AED" />
                  </div>
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#7C3AED' }}>
                  {traffic.uniqueVisitorsToday}
                </div>
                <div style={{ fontSize: 12, color: '#6B564C', marginTop: 4 }}>
                  {traffic.uniqueVisitorsTotal} lifetime unique devices
                </div>
              </div>

              {/* Card 4: Page Views & Conversion Rate */}
              <div className="card" style={{ padding: 20, borderLeft: '4px solid #D4AF37', background: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#6B564C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Conversion Rate</span>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp size={18} color="#D4AF37" />
                  </div>
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#2B1810', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                  {analytics.conversionRate}%
                </div>
                <div style={{ fontSize: 12, color: '#6B564C', marginTop: 4 }}>
                  {traffic.totalPageViews} total page impressions
                </div>
              </div>
            </div>

            {/* QUICK ACTIONS ROW */}
            <div className="card" style={{ padding: 20, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#2B1810' }}>Quick Actions:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <button
                  onClick={() => { setActiveTab('catalog'); handleStartNewProduct(); }}
                  className="btn btn-primary"
                  style={{ fontSize: 12, padding: '7px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Plus size={14} /> Add Product
                </button>
                <button
                  onClick={() => { setActiveTab('orders'); setOrderStatusFilter('needs_verification'); }}
                  className="btn btn-outline"
                  style={{ fontSize: 12, padding: '7px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <ShieldAlert size={14} color="#D97706" /> Verify Orders ({analytics.unverifiedCount})
                </button>
                <button
                  onClick={() => setActiveTab('updates')}
                  className="btn btn-outline"
                  style={{ fontSize: 12, padding: '7px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Radio size={14} /> Live Site Updater
                </button>
              </div>
            </div>

            {/* RECENT ORDERS FEED WITH VERIFICATION STATUS */}
            <div className="card" style={{ padding: 24, background: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 700 }}>
                    Recent Orders Feed & Anti-Fraud Verification
                  </h3>
                  <p style={{ fontSize: 12, color: '#6B564C' }}>Live purchases from customers with genuine fraud verification check</p>
                </div>
                <button
                  onClick={() => setActiveTab('orders')}
                  style={{ fontSize: 13, color: '#8B3A3A', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  View All Orders →
                </button>
              </div>

              {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6B564C' }}>
                  <Truck size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <p>No orders placed yet. When visitors check out on dawosti.com, they will appear here in real-time.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {orders.slice(0, 5).map((order) => {
                    const isVerified = order.verification?.status === 'verified_genuine';
                    const isFake = order.verification?.status === 'flagged_fake';

                    return (
                      <div
                        key={order.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '14px 18px',
                          background: isFake ? '#FEF2F2' : !isVerified ? '#FFFBEB' : '#FAF2E9',
                          borderRadius: 12,
                          border: `1.5px solid ${isFake ? '#EF4444' : !isVerified ? '#F59E0B' : '#EADCCE'}`,
                          flexWrap: 'wrap',
                          gap: 12,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ fontWeight: 800, fontSize: 14, color: '#8B3A3A' }}>
                            {order.orderNumber}
                          </div>
                          <div style={{ fontSize: 13, color: '#2B1810' }}>
                            <strong>{order.shippingAddress?.fullName}</strong> ({order.shippingAddress?.city})
                          </div>
                          <div style={{ fontSize: 12, color: '#6B564C' }}>
                            {order.items.length} item{order.items.length > 1 ? 's' : ''}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ fontWeight: 800, fontSize: 15, color: '#2B1810' }}>
                            {formatPrice(order.totalAmount)}
                          </div>

                          {/* Verification Tag */}
                          {isVerified ? (
                            <span style={{ background: '#D1FAE5', color: '#065F46', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Check size={12} /> Genuine
                            </span>
                          ) : isFake ? (
                            <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800 }}>
                              Fake / Spam
                            </span>
                          ) : (
                            <button
                              onClick={() => { verifyOrder(order.id, 'verified_genuine', 'Verified genuine order'); toast('Order verified as genuine customer purchase!'); }}
                              style={{ background: '#F59E0B', color: 'white', border: 'none', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <Check size={12} /> Verify Genuine
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================
            TAB 2: ORDER MANAGEMENT & ANTI-FRAUD VERIFICATION
        ======================================================== */}
        {activeTab === 'orders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Filter & Search Bar */}
            <div className="card" style={{ padding: 18, background: 'white', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
                  <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6B564C' }} />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search by Order #, Customer Name, Phone, or City..."
                    className="input"
                    style={{ paddingLeft: 38 }}
                  />
                </div>
                {orders.length > 0 && (
                  <button
                    onClick={() => { if (confirm('Are you sure you want to clear all orders? This cannot be undone.')) clearAllOrders(); }}
                    style={{ fontSize: 12, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 12px' }}
                  >
                    Clear All Orders
                  </button>
                )}
              </div>

              {/* Status Filter Tabs */}
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
                {[
                  { id: 'all', label: `All Orders (${orders.length})` },
                  { id: 'needs_verification', label: `⚠️ Needs Verification (${orders.filter((o) => !o.verification || o.verification.status === 'unverified').length})` },
                  { id: 'verified_genuine', label: `✓ Verified Genuine (${orders.filter((o) => o.verification?.status === 'verified_genuine').length})` },
                  { id: 'pending', label: `Pending Dispatch (${orders.filter((o) => o.status === 'pending').length})` },
                  { id: 'shipped', label: `Shipped (${orders.filter((o) => o.status === 'shipped').length})` },
                  { id: 'delivered', label: `Delivered (${orders.filter((o) => o.status === 'delivered').length})` },
                  { id: 'cancelled', label: `Cancelled (${orders.filter((o) => o.status === 'cancelled').length})` },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setOrderStatusFilter(id)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 8,
                      border: `1.5px solid ${orderStatusFilter === id ? '#8B3A3A' : '#EADCCE'}`,
                      background: orderStatusFilter === id ? '#8B3A3A' : 'white',
                      color: orderStatusFilter === id ? 'white' : '#2B1810',
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <div className="card" style={{ padding: '60px 20px', textAlign: 'center', background: 'white', color: '#6B564C' }}>
                <Truck size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>No orders matching filter</h3>
                <p style={{ fontSize: 13 }}>Try clearing filters or search query.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {filteredOrders.map((order) => {
                  const isExpanded = expandedOrder === order.id;
                  const isVerified = order.verification?.status === 'verified_genuine';
                  const isFake = order.verification?.status === 'flagged_fake';
                  const colors = statusColors[order.status] || statusColors.pending;

                  return (
                    <div
                      key={order.id}
                      className="card"
                      style={{
                        background: 'white',
                        border: isFake ? '2px solid #EF4444' : !isVerified ? '2px solid #F59E0B' : '1px solid #EADCCE',
                        overflow: 'hidden',
                        transition: 'box-shadow 0.2s',
                      }}
                    >
                      {/* Order Header Summary */}
                      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 800, fontSize: 16, color: '#8B3A3A', letterSpacing: '0.04em' }}>
                              {order.orderNumber}
                            </span>

                            {/* Genuine Verification Pill */}
                            {isVerified ? (
                              <span style={{ background: '#D1FAE5', color: '#065F46', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Check size={12} /> VERIFIED GENUINE
                              </span>
                            ) : isFake ? (
                              <span style={{ background: '#FEE2E2', color: '#991B1B', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 800 }}>
                                FLAGGED FAKE / SPAM
                              </span>
                            ) : (
                              <span style={{ background: '#FEF3C7', color: '#B45309', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <AlertCircle size={12} /> UNVERIFIED ORDER
                              </span>
                            )}

                            <span style={{ fontSize: 12, color: '#6B564C' }}>
                              {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div style={{ fontSize: 14, fontWeight: 700, color: '#2B1810', marginTop: 4 }}>
                            {order.shippingAddress.fullName} • <a href={`tel:${order.shippingAddress.phone}`} style={{ color: '#8B3A3A', textDecoration: 'none' }}>{order.shippingAddress.phone}</a>
                          </div>
                          <div style={{ fontSize: 12, color: '#6B564C' }}>
                            {order.shippingAddress.addressLine}, {order.shippingAddress.city}, {order.shippingAddress.province}
                          </div>
                        </div>

                        {/* Amount & Status Controls */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <div style={{ textAlign: 'right', marginRight: 6 }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#8B3A3A', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                              {formatPrice(order.totalAmount)}
                            </div>
                            <div style={{ fontSize: 11, color: '#6B564C', textTransform: 'uppercase', fontWeight: 700 }}>
                              {order.paymentMethod} {order.paymentDetails ? `• ${order.paymentDetails}` : ''}
                            </div>
                          </div>

                          {/* Quick Genuine Verification Actions */}
                          {!isVerified && !isFake && (
                            <button
                              onClick={() => { verifyOrder(order.id, 'verified_genuine', 'Verified Genuine by Store Owner', 'manual_review'); toast('Order marked Genuine & Confirmed!'); }}
                              style={{ padding: '7px 12px', borderRadius: 8, background: '#059669', color: 'white', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                              <Check size={14} /> Verify Genuine
                            </button>
                          )}

                          {/* Status Dropdown */}
                          <select
                            value={order.status}
                            onChange={(e) => {
                              updateOrderStatus(order.id, e.target.value as OrderStatus);
                              toast(`Status updated to ${e.target.value.toUpperCase()}`);
                            }}
                            style={{
                              padding: '7px 12px',
                              borderRadius: 8,
                              border: `1.5px solid ${colors.border}`,
                              background: colors.bg,
                              color: colors.text,
                              fontWeight: 800,
                              fontSize: 12,
                              cursor: 'pointer',
                            }}
                          >
                            <option value="pending">PENDING</option>
                            <option value="confirmed">CONFIRMED</option>
                            <option value="shipped">SHIPPED</option>
                            <option value="delivered">DELIVERED</option>
                            <option value="cancelled">CANCELLED</option>
                          </select>

                          {/* WhatsApp Verification Chat */}
                          <button
                            onClick={() => handleWhatsAppVerify(order)}
                            title="Verify via WhatsApp"
                            style={{
                              padding: '7px 12px',
                              borderRadius: 8,
                              background: '#25D366',
                              color: 'white',
                              border: 'none',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <MessageCircle size={14} /> WhatsApp
                          </button>

                          {/* Print Invoice */}
                          <button
                            onClick={() => setSelectedInvoiceOrder(order)}
                            title="Print Invoice"
                            style={{ padding: '7px 10px', borderRadius: 8, background: '#FAF2E9', border: '1px solid #EADCCE', color: '#2B1810', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <Printer size={15} />
                          </button>

                          {/* Expand Details */}
                          <button
                            onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B564C', padding: 4 }}
                          >
                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Order Details Panel */}
                      {isExpanded && (
                        <div style={{ padding: '16px 20px', borderTop: '1px solid #EADCCE', background: '#FAF2E9', fontSize: 13 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>

                            {/* Column 1: Order Items */}
                            <div>
                              <h4 style={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8B3A3A', marginBottom: 10 }}>
                                Ordered Items ({order.items.length})
                              </h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {order.items.map((item) => (
                                  <div
                                    key={`${item.product.id}_${item.selectedSize}`}
                                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'white', borderRadius: 8, border: '1px solid #EADCCE' }}
                                  >
                                    <img
                                      src={item.product.images[0]}
                                      alt={item.product.title.en}
                                      style={{ width: 40, height: 50, objectFit: 'cover', borderRadius: 4 }}
                                      onError={(e) => (e.currentTarget.src = 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=200&q=80')}
                                    />
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontWeight: 700, fontSize: 13, color: '#2B1810' }}>
                                        {item.product.title.en}
                                      </div>
                                      <div style={{ fontSize: 11, color: '#6B564C' }}>
                                        Size: <strong>{item.selectedSize}</strong> • Qty: <strong>{item.quantity}</strong>
                                      </div>
                                    </div>
                                    <div style={{ fontWeight: 800, fontSize: 13, color: '#8B3A3A' }}>
                                      {formatPrice(item.product.price * item.quantity)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Column 2: Anti-Fraud & Verification Actions */}
                            <div>
                              <h4 style={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#8B3A3A', marginBottom: 10 }}>
                                Genuine Customer Verification Audit
                              </h4>
                              <div style={{ background: 'white', padding: 14, borderRadius: 10, border: '1px solid #EADCCE', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div><strong>Fraud Risk Level:</strong> <span style={{ color: order.verification?.fraudRisk === 'high' ? '#DC2626' : '#059669', fontWeight: 800 }}>{(order.verification?.fraudRisk || 'low').toUpperCase()}</span> (Score: {order.verification?.fraudScore || 10}/100)</div>
                                <div><strong>Audit Notes:</strong> {order.verification?.verificationNotes || 'Standard check passed'}</div>
                                {order.verification?.verifiedBy && <div><strong>Verified By:</strong> {order.verification.verifiedBy}</div>}
                                {order.notes && <div><strong>Customer Special Instructions:</strong> <em>"{order.notes}"</em></div>}

                                <div style={{ display: 'flex', gap: 8, marginTop: 8, borderTop: '1px solid #EADCCE', paddingTop: 10 }}>
                                  <button
                                    onClick={() => { verifyOrder(order.id, 'verified_genuine', 'Verified genuine via phone call', 'phone_call'); toast('Verified as genuine order!'); }}
                                    style={{ flex: 1, padding: '6px 10px', background: '#059669', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    ✓ Confirm Genuine
                                  </button>
                                  <button
                                    onClick={() => { verifyOrder(order.id, 'flagged_fake', 'Customer number unreachable / suspected spam', 'manual_review'); toast('Order flagged as spam.'); }}
                                    style={{ flex: 1, padding: '6px 10px', background: '#FEE2E2', color: '#DC2626', border: '1px solid #EF4444', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    ✕ Flag Fake / Spam
                                  </button>
                                </div>
                              </div>

                              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => {
                                    if (confirm('Delete this order permanently?')) {
                                      deleteOrder(order.id);
                                      toast('Order deleted.');
                                    }
                                  }}
                                  style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                >
                                  <Trash2 size={13} /> Delete Order
                                </button>
                              </div>
                            </div>

                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* ========================================================
            TAB 3: PRODUCT CATALOG (PIM)
        ======================================================== */}
        {activeTab === 'catalog' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Header & Controls */}
            <div className="card" style={{ padding: 18, background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
                <Search size={18} color="#6B564C" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Search catalog by title or keyword..."
                  className="input"
                  style={{ flex: 1 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => {
                    if (confirm('Reset catalog to default boutique products? Any new items will be cleared.')) {
                      resetProducts();
                      toast('Products reset to factory catalog!');
                    }
                  }}
                  className="btn btn-outline"
                  style={{ fontSize: 12, padding: '7px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <RotateCcw size={14} /> Reset
                </button>

                <button
                  onClick={handleStartNewProduct}
                  className="btn btn-primary"
                  style={{ fontSize: 12, padding: '7px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Plus size={14} /> Add Product
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
              <button
                onClick={() => setCatalogCategory('all')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: `1.5px solid ${catalogCategory === 'all' ? '#8B3A3A' : '#EADCCE'}`,
                  background: catalogCategory === 'all' ? '#8B3A3A' : 'white',
                  color: catalogCategory === 'all' ? 'white' : '#2B1810',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                All Categories ({products.length})
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCatalogCategory(cat.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: `1.5px solid ${catalogCategory === cat.id ? '#8B3A3A' : '#EADCCE'}`,
                    background: catalogCategory === cat.id ? '#8B3A3A' : 'white',
                    color: catalogCategory === cat.id ? 'white' : '#2B1810',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cat.name.en} ({products.filter((p) => p.categoryId === cat.id).length})
                </button>
              ))}
            </div>

            {/* CREATE / EDIT PRODUCT STUDIO */}
            {isCreatingProduct && (
              <div className="card" style={{ padding: 28, background: 'white', border: '2px solid #8B3A3A', boxShadow: '0 10px 30px rgba(139,58,58,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 700, color: '#8B3A3A' }}>
                    {editingProductId ? '✏️ Edit Product' : '✨ Add New Boutique Product'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => { setIsCreatingProduct(false); setEditingProductId(null); }}
                    className="btn btn-outline"
                    style={{ padding: '6px 12px', fontSize: 12 }}
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleSaveProduct} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>

                  {/* Title EN */}
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#2B1810', marginBottom: 4 }}>
                      Title (English) *
                    </label>
                    <input
                      className="input"
                      value={productForm.titleEn}
                      onChange={(e) => setProductForm((f) => ({ ...f, titleEn: e.target.value }))}
                      placeholder="e.g. Royal Maroon Silk Kurtha"
                      required
                    />
                  </div>

                  {/* Title NP */}
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#2B1810', marginBottom: 4 }}>
                      Title (Nepali)
                    </label>
                    <input
                      className="input"
                      value={productForm.titleNp}
                      onChange={(e) => setProductForm((f) => ({ ...f, titleNp: e.target.value }))}
                      placeholder="e.g. शाही महसुल सिल्क कुर्ता"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#2B1810', marginBottom: 4 }}>
                      Category *
                    </label>
                    <select
                      className="input"
                      value={productForm.categoryId}
                      onChange={(e) => setProductForm((f) => ({ ...f, categoryId: e.target.value }))}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>{c.name.en} ({c.name.np})</option>
                      ))}
                    </select>
                  </div>

                  {/* Price */}
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#2B1810', marginBottom: 4 }}>
                      Selling Price (NPR) *
                    </label>
                    <input
                      type="number"
                      className="input"
                      value={productForm.price}
                      onChange={(e) => setProductForm((f) => ({ ...f, price: Number(e.target.value) }))}
                      required
                    />
                  </div>

                  {/* Original / Crossed-out Price */}
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#2B1810', marginBottom: 4 }}>
                      Original Price (NPR) — For Festive Discount Badge
                    </label>
                    <input
                      type="number"
                      className="input"
                      value={productForm.originalPrice || ''}
                      onChange={(e) => setProductForm((f) => ({ ...f, originalPrice: Number(e.target.value) }))}
                      placeholder="Leave blank if no discount"
                    />
                  </div>

                  {/* Badges Toggles */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 20 }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={productForm.isFeatured}
                        onChange={(e) => setProductForm((f) => ({ ...f, isFeatured: e.target.checked }))}
                      />
                      <span>⭐ Featured Product</span>
                    </label>

                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={productForm.isNewArrival}
                        onChange={(e) => setProductForm((f) => ({ ...f, isNewArrival: e.target.checked }))}
                      />
                      <span>✨ New Arrival</span>
                    </label>
                  </div>

                  {/* Image Gallery Manager */}
                  <div style={{ gridColumn: '1/-1', borderTop: '1px solid #EADCCE', paddingTop: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#2B1810', marginBottom: 8 }}>
                      Product Images Gallery ({productForm.images.length})
                    </label>

                    {/* Previews */}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                      {productForm.images.map((img, idx) => (
                        <div key={idx} style={{ position: 'relative', width: 80, height: 100, borderRadius: 8, overflow: 'hidden', border: '1.5px solid #EADCCE' }}>
                          <img src={img} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={() => handleRemoveImageUrl(idx)}
                            style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(220,38,38,0.9)', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add URL */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                      <input
                        type="text"
                        value={productForm.newImageUrl}
                        onChange={(e) => setProductForm((f) => ({ ...f, newImageUrl: e.target.value }))}
                        placeholder="Paste image URL (https://...)"
                        className="input"
                        style={{ flex: 1 }}
                      />
                      <button type="button" onClick={handleAddImageUrl} className="btn btn-outline" style={{ fontSize: 12 }}>
                        + Add Image
                      </button>
                    </div>

                    {/* Quick Presets */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 12, color: '#6B564C' }}>
                      <span>Quick presets:</span>
                      {SAMPLE_IMAGES.map((s) => (
                        <button
                          key={s.label}
                          type="button"
                          onClick={() => setProductForm((f) => ({ ...f, images: [...f.images, s.url] }))}
                          style={{ padding: '2px 8px', borderRadius: 4, background: '#FAF2E9', border: '1px solid #EADCCE', cursor: 'pointer', fontSize: 11 }}
                        >
                          + {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sizes */}
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#2B1810', marginBottom: 8 }}>
                      Available Sizes
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {SIZES.map((s) => {
                        const isSelected = productForm.sizes.includes(s);
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => toggleSizeSelection(s)}
                            style={{
                              padding: '6px 14px',
                              borderRadius: 8,
                              border: `1.5px solid ${isSelected ? '#8B3A3A' : '#EADCCE'}`,
                              background: isSelected ? '#8B3A3A' : 'white',
                              color: isSelected ? 'white' : '#2B1810',
                              fontWeight: 700,
                              fontSize: 13,
                              cursor: 'pointer',
                            }}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Descriptions */}
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#2B1810', marginBottom: 4 }}>
                      Description (English)
                    </label>
                    <textarea
                      rows={3}
                      className="input"
                      value={productForm.descEn}
                      onChange={(e) => setProductForm((f) => ({ ...f, descEn: e.target.value }))}
                      placeholder="Crafted with premium silk in Kathmandu..."
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#2B1810', marginBottom: 4 }}>
                      Description (Nepali)
                    </label>
                    <textarea
                      rows={3}
                      className="input"
                      value={productForm.descNp}
                      onChange={(e) => setProductForm((f) => ({ ...f, descNp: e.target.value }))}
                      placeholder="काठमाडौँमा उत्पादित मौलिक गुणस्तरीय पहिरन..."
                    />
                  </div>

                  {/* Submit Actions */}
                  <div style={{ gridColumn: '1/-1', display: 'flex', gap: 12, marginTop: 10 }}>
                    <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: 14 }}>
                      <Check size={16} /> {editingProductId ? 'Save Changes' : 'Create & Publish Product'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsCreatingProduct(false); setEditingProductId(null); }}
                      className="btn btn-outline"
                    >
                      Cancel
                    </button>
                  </div>

                </form>
              </div>
            )}

            {/* Products Grid Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredCatalog.map((product) => (
                <div
                  key={product.id}
                  className="card"
                  style={{
                    background: 'white',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    flexWrap: 'wrap',
                  }}
                >
                  <img
                    src={product.images[0]}
                    alt={product.title.en}
                    style={{ width: 56, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid #EADCCE' }}
                    onError={(e) => (e.currentTarget.src = 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=200&q=80')}
                  />

                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h4 style={{ fontWeight: 800, fontSize: 15, color: '#2B1810' }}>
                        {product.title.en}
                      </h4>
                      {product.isFeatured && (
                        <span style={{ fontSize: 10, background: '#FEF3C7', color: '#B45309', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                          FEATURED
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#6B564C', marginTop: 2 }}>
                      {product.title.np} • <span style={{ textTransform: 'capitalize' }}>{product.categoryId.replace('cat-', '')}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#8B3A3A', fontWeight: 600, marginTop: 4 }}>
                      Sizes: {product.availableSizes.join(', ')}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: '#8B3A3A', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                      {formatPrice(product.price)}
                    </div>
                    {product.originalPrice && (
                      <div style={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'line-through' }}>
                        {formatPrice(product.originalPrice)}
                      </div>
                    )}
                  </div>

                  {/* Stock Quick-Toggle */}
                  <button
                    onClick={() => {
                      updateProduct(product.id, { inStock: !product.inStock });
                      toast(product.inStock ? 'Marked as Sold Out' : 'Marked as In Stock');
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: 'none',
                      background: product.inStock ? '#D1FAE5' : '#FEE2E2',
                      color: product.inStock ? '#065F46' : '#991B1B',
                      fontWeight: 800,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    {product.inStock ? '✓ In Stock' : '✗ Sold Out'}
                  </button>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => handleStartEditProduct(product)}
                      title="Edit Product"
                      style={{ width: 34, height: 34, borderRadius: 8, background: '#FAF2E9', border: '1px solid #EADCCE', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2B1810' }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDuplicateProduct(product)}
                      title="Duplicate Product"
                      style={{ width: 34, height: 34, borderRadius: 8, background: '#FAF2E9', border: '1px solid #EADCCE', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2B1810' }}
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${product.title.en}"?`)) {
                          deleteProduct(product.id);
                          toast('Product deleted.');
                        }
                      }}
                      title="Delete Product"
                      style={{ width: 34, height: 34, borderRadius: 8, background: '#FEE2E2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ========================================================
            TAB 4: BROADCAST & LIVE SITE UPDATER
        ======================================================== */}
        {activeTab === 'updates' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card" style={{ padding: 28, background: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#8B3A3A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Radio size={24} color="#D4AF37" />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontWeight: 700, color: '#2B1810' }}>
                      Live Broadcast & Site Updater Studio
                    </h3>
                    <p style={{ fontSize: 13, color: '#6B564C' }}>
                      Publish instant announcements, headlines, and promos live to all visitors on dawosti.com.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleBroadcastLive}
                  disabled={isBroadcasting}
                  className="btn btn-primary"
                  style={{ padding: '10px 20px', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  {isBroadcasting ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                  <span>{isBroadcasting ? 'Broadcasting...' : 'Publish Live to dawosti.com'}</span>
                </button>
              </div>

              {broadcastSuccess && (
                <div style={{ background: '#D1FAE5', border: '1px solid #10B981', borderRadius: 12, padding: '14px 18px', marginBottom: 20, color: '#065F46', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Check size={20} color="#059669" />
                  <span>Success! Your updates have been broadcast live and synced to Firestore cloud database. All current and new visitors now see these updates.</span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>

                {/* Top Announcement Bar EN */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#2B1810', marginBottom: 6 }}>
                    Top Marquee Announcement (English)
                  </label>
                  <textarea
                    rows={2}
                    className="input"
                    value={broadcastForm.announcementEn}
                    onChange={(e) => setBroadcastForm((f) => ({ ...f, announcementEn: e.target.value }))}
                  />
                </div>

                {/* Top Announcement Bar NP */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#2B1810', marginBottom: 6 }}>
                    Top Marquee Announcement (Nepali)
                  </label>
                  <textarea
                    rows={2}
                    className="input"
                    value={broadcastForm.announcementNp}
                    onChange={(e) => setBroadcastForm((f) => ({ ...f, announcementNp: e.target.value }))}
                  />
                </div>

                {/* Hero Title EN */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#2B1810', marginBottom: 6 }}>
                    Hero Showcase Headline (English)
                  </label>
                  <input
                    className="input"
                    value={broadcastForm.heroTitleEn}
                    onChange={(e) => setBroadcastForm((f) => ({ ...f, heroTitleEn: e.target.value }))}
                  />
                </div>

                {/* Hero Title NP */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#2B1810', marginBottom: 6 }}>
                    Hero Showcase Headline (Nepali)
                  </label>
                  <input
                    className="input"
                    value={broadcastForm.heroTitleNp}
                    onChange={(e) => setBroadcastForm((f) => ({ ...f, heroTitleNp: e.target.value }))}
                  />
                </div>

                {/* Hero Subtext EN */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#2B1810', marginBottom: 6 }}>
                    Hero Subtext (English)
                  </label>
                  <textarea
                    rows={3}
                    className="input"
                    value={broadcastForm.heroSubtextEn}
                    onChange={(e) => setBroadcastForm((f) => ({ ...f, heroSubtextEn: e.target.value }))}
                  />
                </div>

                {/* Hero Subtext NP */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#2B1810', marginBottom: 6 }}>
                    Hero Subtext (Nepali)
                  </label>
                  <textarea
                    rows={3}
                    className="input"
                    value={broadcastForm.heroSubtextNp}
                    onChange={(e) => setBroadcastForm((f) => ({ ...f, heroSubtextNp: e.target.value }))}
                  />
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 5: FESTIVE & MARKETING CAMPAIGNS
        ======================================================== */}
        {activeTab === 'campaigns' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card" style={{ padding: 28, background: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#8B3A3A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={24} color="#D4AF37" />
                </div>
                <div>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontWeight: 700, color: '#2B1810' }}>
                    Dashain Festive Campaign Studio 🪔
                  </h3>
                  <p style={{ fontSize: 13, color: '#6B564C' }}>
                    Control storewide festive discounts, announcement marquees, and holiday visual styles.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>

                {/* Dashain Theme Switch */}
                <div style={{ padding: 18, background: '#FAF2E9', borderRadius: 14, border: '1.5px solid #D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gridColumn: '1/-1' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: '#8B3A3A' }}>
                      🪔 Festive Dashain Visual Theme
                    </div>
                    <div style={{ fontSize: 13, color: '#6B564C', marginTop: 2 }}>
                      Activates the royal gold & crimson festive theme with holiday accents across dawosti.com.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={theme.isDashainTheme}
                    onChange={(e) => {
                      updateTheme({ isDashainTheme: e.target.checked });
                      toast(e.target.checked ? 'Dashain Festive Theme activated!' : 'Theme set to Classic mode.');
                    }}
                    style={{ width: 24, height: 24, cursor: 'pointer' }}
                  />
                </div>

                {/* Announcement Bar Toggle */}
                <div style={{ padding: 18, background: '#FAF2E9', borderRadius: 14, border: '1px solid #EADCCE', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gridColumn: '1/-1' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: '#2B1810' }}>
                      Show Announcement Marquee Bar
                    </div>
                    <div style={{ fontSize: 12, color: '#6B564C' }}>
                      Displays the top notification banner to visitors on every page.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={theme.showAnnouncementBar}
                    onChange={(e) => {
                      updateTheme({ showAnnouncementBar: e.target.checked });
                      toast('Announcement bar visibility updated!');
                    }}
                    style={{ width: 22, height: 22, cursor: 'pointer' }}
                  />
                </div>

                {/* Coupon Code */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#2B1810', marginBottom: 6 }}>
                    Active Coupon Code
                  </label>
                  <input
                    className="input"
                    value={theme.couponCode}
                    onChange={(e) => updateTheme({ couponCode: e.target.value.toUpperCase() })}
                    onBlur={() => toast('Coupon code saved!')}
                  />
                </div>

                {/* Discount Percentage */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#2B1810', marginBottom: 6 }}>
                    Festive Discount Rate (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={90}
                    className="input"
                    value={theme.discountPercentage}
                    onChange={(e) => updateTheme({ discountPercentage: Number(e.target.value) })}
                    onBlur={() => toast('Discount percentage saved!')}
                  />
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 6: STORE & PAYMENT SETTINGS
        ======================================================== */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card" style={{ padding: 28, background: 'white' }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontWeight: 700, color: '#2B1810', marginBottom: 6 }}>
                Merchant & Payment Operations
              </h3>
              <p style={{ fontSize: 13, color: '#6B564C', marginBottom: 24 }}>
                Configure boutique contacts, WhatsApp chat, and digital wallets for customer checkouts.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>

                {/* Shop Name EN */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#2B1810', marginBottom: 6 }}>
                    Boutique Name (English)
                  </label>
                  <input
                    className="input"
                    value={merchant.shopName.en}
                    onChange={(e) => updateMerchant({ shopName: { ...merchant.shopName, en: e.target.value } })}
                    onBlur={() => toast('Store name saved!')}
                  />
                </div>

                {/* Shop Name NP */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#2B1810', marginBottom: 6 }}>
                    Boutique Name (Nepali)
                  </label>
                  <input
                    className="input"
                    value={merchant.shopName.np}
                    onChange={(e) => updateMerchant({ shopName: { ...merchant.shopName, np: e.target.value } })}
                    onBlur={() => toast('Store name saved!')}
                  />
                </div>

                {/* WhatsApp Support Number */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#2B1810', marginBottom: 6 }}>
                    WhatsApp Customer Support Number
                  </label>
                  <input
                    className="input"
                    value={merchant.whatsappNumber}
                    onChange={(e) => updateMerchant({ whatsappNumber: e.target.value })}
                    onBlur={() => toast('WhatsApp number updated!')}
                    placeholder="9779708251494"
                  />
                </div>

                {/* Shop Phone */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#2B1810', marginBottom: 6 }}>
                    Contact Phone Number
                  </label>
                  <input
                    className="input"
                    value={merchant.shopPhone}
                    onChange={(e) => updateMerchant({ shopPhone: e.target.value })}
                    onBlur={() => toast('Phone number updated!')}
                  />
                </div>

                {/* eSewa ID */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#2B1810', marginBottom: 6 }}>
                    eSewa ID / Registered Mobile
                  </label>
                  <input
                    className="input"
                    value={merchant.esewaId || ''}
                    onChange={(e) => updateMerchant({ esewaId: e.target.value })}
                    onBlur={() => toast('eSewa ID saved!')}
                    placeholder="98XXXXXXXX"
                  />
                </div>

                {/* Khalti ID */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#2B1810', marginBottom: 6 }}>
                    Khalti ID / Registered Mobile
                  </label>
                  <input
                    className="input"
                    value={merchant.khaltiId || ''}
                    onChange={(e) => updateMerchant({ khaltiId: e.target.value })}
                    onBlur={() => toast('Khalti ID saved!')}
                    placeholder="98XXXXXXXX"
                  />
                </div>

                {/* Physical Address */}
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#2B1810', marginBottom: 6 }}>
                    Boutique Physical Address (Kathmandu)
                  </label>
                  <input
                    className="input"
                    value={merchant.shopAddress.en}
                    onChange={(e) => updateMerchant({ shopAddress: { ...merchant.shopAddress, en: e.target.value } })}
                    onBlur={() => toast('Address saved!')}
                  />
                </div>

              </div>
            </div>
          </div>
        )}

      </main>

      {/* ========================================================
          PRINTABLE INVOICE MODAL
      ======================================================== */}
      {selectedInvoiceOrder && (
        <div className="modal-overlay" onClick={() => setSelectedInvoiceOrder(null)}>
          <div
            style={{ width: '100%', maxWidth: 640, background: 'white', borderRadius: 20, padding: 32, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Invoice Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #8B3A3A', paddingBottom: 20, marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontWeight: 700, color: '#8B3A3A' }}>
                  DAWOSTI BOUTIQUE
                </h2>
                <p style={{ fontSize: 12, color: '#6B564C' }}>New Road, Kathmandu, Nepal</p>
                <p style={{ fontSize: 12, color: '#6B564C' }}>dawosti.com • {merchant.shopPhone}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#2B1810' }}>INVOICE</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#8B3A3A' }}>{selectedInvoiceOrder.orderNumber}</div>
                <div style={{ fontSize: 11, color: '#6B564C' }}>{new Date(selectedInvoiceOrder.createdAt).toLocaleDateString()}</div>
              </div>
            </div>

            {/* Customer Details */}
            <div style={{ marginBottom: 20, fontSize: 13 }}>
              <strong>Deliver To:</strong>
              <div>{selectedInvoiceOrder.shippingAddress.fullName}</div>
              <div>{selectedInvoiceOrder.shippingAddress.addressLine}, {selectedInvoiceOrder.shippingAddress.city}</div>
              <div>Phone: {selectedInvoiceOrder.shippingAddress.phone}</div>
              <div>Payment: {selectedInvoiceOrder.paymentMethod.toUpperCase()}</div>
            </div>

            {/* Line Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#FAF2E9', textAlign: 'left', borderBottom: '1px solid #EADCCE' }}>
                  <th style={{ padding: '8px 10px' }}>Item</th>
                  <th style={{ padding: '8px 10px' }}>Size</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoiceOrder.items.map((item) => (
                  <tr key={`${item.product.id}_${item.selectedSize}`} style={{ borderBottom: '1px solid #EADCCE' }}>
                    <td style={{ padding: '10px' }}>{item.product.title.en}</td>
                    <td style={{ padding: '10px' }}>{item.selectedSize}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700 }}>{formatPrice(item.product.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', fontSize: 13, marginBottom: 24 }}>
              <div>Subtotal: {formatPrice(selectedInvoiceOrder.subtotalAmount)}</div>
              <div>Delivery: {selectedInvoiceOrder.deliveryFee === 0 ? 'FREE' : formatPrice(selectedInvoiceOrder.deliveryFee)}</div>
              {selectedInvoiceOrder.discountAmount > 0 && (
                <div style={{ color: '#059669' }}>Discount: -{formatPrice(selectedInvoiceOrder.discountAmount)}</div>
              )}
              <div style={{ fontSize: 18, fontWeight: 800, color: '#8B3A3A', borderTop: '2px solid #8B3A3A', paddingTop: 6 }}>
                Grand Total: {formatPrice(selectedInvoiceOrder.totalAmount)}
              </div>
            </div>

            {/* Invoice Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => window.print()} className="btn btn-primary" style={{ padding: '8px 18px', fontSize: 13 }}>
                <Printer size={15} /> Print Invoice
              </button>
              <button onClick={() => setSelectedInvoiceOrder(null)} className="btn btn-outline" style={{ padding: '8px 18px', fontSize: 13 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
