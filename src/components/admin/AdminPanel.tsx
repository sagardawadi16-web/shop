import React, { useState } from 'react';
import {
  X, Sparkles, ShieldCheck, Package, Settings, Palette,
  Plus, Edit2, Trash2, Check, RotateCcw, ChevronDown, ChevronUp, Truck
} from 'lucide-react';
import { useAdminStore } from '../../stores/adminStore';
import { useProductStore } from '../../stores/productStore';
import { useOrderStore } from '../../stores/orderStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { Product, ProductSize, OrderStatus } from '../../types';
import { toast } from '../common/Toast';
import { MOCK_PRODUCTS } from '../../mockData';

type Tab = 'orders' | 'catalog' | 'theme' | 'settings';

const SIZES: ProductSize[] = ['XS', 'S', 'M', 'L', 'XL', 'Free Size'];

export const AdminPanel: React.FC = () => {
  const { isAdminOpen, closeAdmin, isAuthenticated, unlockAdmin, isOwner } = useAdminStore();
  const { products, addProduct, updateProduct, deleteProduct, resetProducts } = useProductStore();
  const { orders, updateOrderStatus, acknowledgeOrder, deleteOrder, clearAllOrders } = useOrderStore();
  const { language, theme, merchant, updateTheme, updateMerchant, formatPrice } = useSettingsStore();

  const [tab, setTab] = useState<Tab>('orders');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Catalog editor state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [productForm, setProductForm] = useState({ titleEn: '', titleNp: '', descEn: '', descNp: '', price: 3500, originalPrice: 0, categoryId: 'cat-kurthas', imageUrl: '', sizes: ['S', 'M', 'L'] as ProductSize[] });

  // Orders
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  if (!isAdminOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = unlockAdmin(pinInput);
    if (!ok) { setPinError('Incorrect passcode. Try: 1234'); return; }
    setPinInput(''); setPinError('');
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setIsCreating(true);
    setProductForm({
      titleEn: p.title.en, titleNp: p.title.np,
      descEn: p.description.en, descNp: p.description.np,
      price: p.price, originalPrice: p.originalPrice || 0,
      categoryId: p.categoryId, imageUrl: p.images[0] || '',
      sizes: [...p.availableSizes],
    });
  };

  const startNew = () => {
    setEditingId(null); setIsCreating(true);
    setProductForm({ titleEn: '', titleNp: '', descEn: '', descNp: '', price: 3500, originalPrice: 0, categoryId: 'cat-kurthas', imageUrl: '', sizes: ['S', 'M', 'L'] });
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.titleEn.trim()) { toast('Title (English) is required', 'error'); return; }
    const payload: Product = {
      id: editingId || `daw-custom-${Date.now()}`,
      slug: productForm.titleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: { en: productForm.titleEn.trim(), np: productForm.titleNp.trim() || productForm.titleEn.trim() },
      description: { en: productForm.descEn.trim() || 'Authentic Nepali handloom.', np: productForm.descNp.trim() || productForm.descEn.trim() || 'मौलिक नेपाली हातेतान।' },
      price: Number(productForm.price) || 3500,
      originalPrice: productForm.originalPrice ? Number(productForm.originalPrice) : undefined,
      categoryId: productForm.categoryId,
      categoryName: { en: productForm.categoryId.replace('cat-', '').replace(/-/g, ' '), np: productForm.categoryId.replace('cat-', '') },
      images: productForm.imageUrl ? [productForm.imageUrl] : ['https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80'],
      availableSizes: productForm.sizes,
      inStock: true, rating: 4.8, reviewCount: 0, tags: [productForm.categoryId],
    };
    if (editingId) { updateProduct(editingId, payload); toast('Product updated!'); }
    else { addProduct(payload); toast('Product added!'); }
    setIsCreating(false); setEditingId(null);
  };

  const toggleSize = (s: ProductSize) => {
    setProductForm((f) => ({ ...f, sizes: f.sizes.includes(s) ? f.sizes.filter((x) => x !== s) : [...f.sizes, s] }));
  };

  const statusColors: Record<OrderStatus, string> = {
    pending: '#D97706', confirmed: '#2563EB', shipped: '#7C3AED', delivered: '#059669', cancelled: '#DC2626',
  };

  const statusOptions: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

  const panelStyle: React.CSSProperties = {
    background: 'white', borderRadius: 24, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--cream)',
    width: '100%', maxWidth: 900, maxHeight: '94vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
  };

  return (
    <div className="modal-overlay animate-fadeIn" onClick={closeAdmin}>
      <div style={panelStyle} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ background: 'var(--brown)', color: 'var(--ivory)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--burgundy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={20} style={{ color: 'var(--gold)' }} />
            </div>
            <div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700 }}>Dawosti Admin Atelier</h2>
              <p style={{ fontSize: 12, color: 'rgba(250,242,233,0.6)' }}>Merchant Dashboard</p>
            </div>
            {isOwner && <span className="badge badge-gold" style={{ marginLeft: 8 }}>Store Owner</span>}
          </div>
          <button onClick={closeAdmin} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <X size={18} />
          </button>
        </div>

        {/* Lock screen */}
        {!isAuthenticated ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ivory)', padding: 40 }}>
            <div style={{ textAlign: 'center', maxWidth: 320 }}>
              <ShieldCheck size={48} style={{ color: 'var(--burgundy)', marginBottom: 16 }} />
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Admin Access Required</h3>
              <p style={{ fontSize: 13, color: 'var(--brown-light)', marginBottom: 24 }}>Enter your admin passcode to continue</p>
              <form onSubmit={handleUnlock} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)} placeholder="Enter passcode" className="input" style={{ textAlign: 'center', fontSize: 18, letterSpacing: 8 }} autoFocus />
                {pinError && <p style={{ fontSize: 12, color: '#DC2626' }}>{pinError}</p>}
                <button type="submit" className="btn btn-primary">Unlock Admin</button>
              </form>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--cream)', background: 'var(--ivory)', padding: '0 24px', flexShrink: 0, overflowX: 'auto' }}>
              {([['orders', 'Orders', <Truck size={15} />], ['catalog', 'Catalog', <Package size={15} />], ['theme', 'Theme', <Palette size={15} />], ['settings', 'Settings', <Settings size={15} />]] as [Tab, string, React.ReactNode][]).map(([id, label, icon]) => (
                <button key={id} onClick={() => setTab(id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '14px 18px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: tab === id ? 'var(--burgundy)' : 'var(--brown-light)', borderBottom: `2px solid ${tab === id ? 'var(--burgundy)' : 'transparent'}`, transition: 'var(--transition)', whiteSpace: 'nowrap' }}>
                  {icon} {label}
                  {id === 'orders' && orders.filter((o) => !o.acknowledgedByAdmin).length > 0 && (
                    <span style={{ background: 'var(--burgundy)', color: 'white', borderRadius: 99, fontSize: 10, fontWeight: 800, padding: '1px 6px' }}>
                      {orders.filter((o) => !o.acknowledgedByAdmin).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

              {/* ── ORDERS ── */}
              {tab === 'orders' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700 }}>Orders ({orders.length})</h3>
                    {orders.length > 0 && (
                      <button onClick={() => { if (confirm('Clear all orders?')) clearAllOrders(); }} style={{ fontSize: 12, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer' }}>Clear All</button>
                    )}
                  </div>
                  {orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--brown-light)' }}>
                      <Truck size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                      <p>No orders yet. Orders placed on the site appear here in real-time.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {orders.map((order) => (
                        <div key={order.id} style={{ border: `1.5px solid ${!order.acknowledgedByAdmin ? 'var(--burgundy)' : 'var(--cream)'}`, borderRadius: 14, overflow: 'hidden', background: !order.acknowledgedByAdmin ? 'rgba(139,58,58,0.02)' : 'white' }}>
                          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: 200 }}>
                              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--brown)' }}>{order.orderNumber}</div>
                              <div style={{ fontSize: 13, color: 'var(--brown-light)' }}>{order.shippingAddress.fullName} • {order.shippingAddress.phone}</div>
                              <div style={{ fontSize: 12, color: 'var(--brown-light)' }}>{new Date(order.createdAt).toLocaleDateString()}</div>
                            </div>
                            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--burgundy)' }}>{formatPrice(order.totalAmount)}</div>
                            <select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                              style={{ padding: '6px 10px', borderRadius: 8, border: `1.5px solid ${statusColors[order.status]}`, color: statusColors[order.status], fontWeight: 700, fontSize: 12, background: 'white', cursor: 'pointer' }}>
                              {statusOptions.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                            </select>
                            {!order.acknowledgedByAdmin && (
                              <button onClick={() => { acknowledgeOrder(order.id); toast('Order acknowledged!'); }}
                                className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 12 }}>
                                <Check size={13} /> Acknowledge
                              </button>
                            )}
                            <button onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brown-light)', display: 'flex' }}>
                              {expandedOrder === order.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                            <button onClick={() => { if (confirm('Delete this order?')) { deleteOrder(order.id); toast('Order deleted.'); } }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', display: 'flex' }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                          {expandedOrder === order.id && (
                            <div style={{ padding: '12px 18px 16px', borderTop: '1px solid var(--cream)', background: 'var(--ivory)', fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <div><strong>Address:</strong> {order.shippingAddress.addressLine}, {order.shippingAddress.city}</div>
                              <div><strong>Payment:</strong> {order.paymentMethod.toUpperCase()} {order.paymentDetails ? `(${order.paymentDetails})` : ''}</div>
                              <div><strong>Items:</strong></div>
                              {order.items.map((item) => (
                                <div key={`${item.product.id}_${item.selectedSize}`} style={{ paddingLeft: 12 }}>
                                  • {item.product.title.en} ({item.selectedSize}) × {item.quantity} — {formatPrice(item.product.price * item.quantity)}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── CATALOG ── */}
              {tab === 'catalog' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700 }}>Product Catalog ({products.length})</h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => { if (confirm('Reset to default products?')) { resetProducts(); toast('Products reset!'); } }}
                        className="btn btn-outline" style={{ fontSize: 12, padding: '6px 14px' }}>
                        <RotateCcw size={13} /> Reset
                      </button>
                      <button onClick={startNew} className="btn btn-primary" style={{ fontSize: 12, padding: '6px 14px' }}>
                        <Plus size={13} /> Add Product
                      </button>
                    </div>
                  </div>

                  {/* Product form */}
                  {isCreating && (
                    <div className="card animate-fadeInUp" style={{ padding: 24, marginBottom: 20, border: '2px solid var(--burgundy)' }}>
                      <h4 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{editingId ? 'Edit Product' : 'Add New Product'}</h4>
                      <form onSubmit={handleSaveProduct} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--brown)', marginBottom: 4 }}>Title (English) *</label>
                          <input className="input" value={productForm.titleEn} onChange={(e) => setProductForm((f) => ({ ...f, titleEn: e.target.value }))} placeholder="e.g. Crimson Silk Kurtha" />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--brown)', marginBottom: 4 }}>Title (Nepali)</label>
                          <input className="input" value={productForm.titleNp} onChange={(e) => setProductForm((f) => ({ ...f, titleNp: e.target.value }))} placeholder="e.g. रातो सिल्क कुर्ता" />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--brown)', marginBottom: 4 }}>Price (NPR) *</label>
                          <input className="input" type="number" value={productForm.price} onChange={(e) => setProductForm((f) => ({ ...f, price: Number(e.target.value) }))} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--brown)', marginBottom: 4 }}>Original Price (NPR)</label>
                          <input className="input" type="number" value={productForm.originalPrice || ''} onChange={(e) => setProductForm((f) => ({ ...f, originalPrice: Number(e.target.value) }))} placeholder="Leave blank if no discount" />
                        </div>
                        <div style={{ gridColumn: '1/-1' }}>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--brown)', marginBottom: 4 }}>Image URL</label>
                          <input className="input" value={productForm.imageUrl} onChange={(e) => setProductForm((f) => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." />
                        </div>
                        <div style={{ gridColumn: '1/-1' }}>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--brown)', marginBottom: 4 }}>Description (English)</label>
                          <textarea className="input" rows={2} value={productForm.descEn} onChange={(e) => setProductForm((f) => ({ ...f, descEn: e.target.value }))} placeholder="Product description..." style={{ resize: 'vertical' }} />
                        </div>
                        <div style={{ gridColumn: '1/-1' }}>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--brown)', marginBottom: 8 }}>Available Sizes</label>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {SIZES.map((s) => (
                              <button key={s} type="button" onClick={() => toggleSize(s)}
                                style={{ padding: '6px 14px', borderRadius: 8, border: `1.5px solid ${productForm.sizes.includes(s) ? 'var(--burgundy)' : 'var(--cream)'}`, background: productForm.sizes.includes(s) ? 'var(--burgundy)' : 'white', color: productForm.sizes.includes(s) ? 'white' : 'var(--brown)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div style={{ gridColumn: '1/-1', display: 'flex', gap: 10 }}>
                          <button type="submit" className="btn btn-primary">{editingId ? <><Check size={14} /> Update</> : <><Plus size={14} /> Add Product</>}</button>
                          <button type="button" onClick={() => { setIsCreating(false); setEditingId(null); }} className="btn btn-outline">Cancel</button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Product list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {products.map((p) => (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'var(--ivory)', borderRadius: 12, border: '1px solid var(--cream)' }}>
                        <img src={p.images[0]} alt={p.title.en} style={{ width: 52, height: 64, objectFit: 'cover', borderRadius: 8 }} onError={(e) => (e.currentTarget.src = 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=400&q=80')} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--brown)' }}>{p.title.en}</div>
                          <div style={{ fontSize: 12, color: 'var(--brown-light)' }}>{p.categoryId} • {p.availableSizes.join(', ')}</div>
                          <div style={{ fontWeight: 700, color: 'var(--burgundy)', fontSize: 14 }}>{formatPrice(p.price)}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => startEdit(p)} style={{ width: 32, height: 32, borderRadius: 8, background: 'white', border: '1px solid var(--cream)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brown)' }}><Edit2 size={14} /></button>
                          <button onClick={() => { if (confirm('Delete this product?')) { deleteProduct(p.id); toast('Product deleted.'); } }} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── THEME ── */}
              {tab === 'theme' && (
                <div>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Theme & Banner</h3>
                  <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                    {[
                      { key: 'bannerText.en', label: 'Banner Text (English)', value: theme.bannerText.en, onChange: (v: string) => updateTheme({ bannerText: { ...theme.bannerText, en: v } }) },
                      { key: 'bannerText.np', label: 'Banner Text (Nepali)', value: theme.bannerText.np, onChange: (v: string) => updateTheme({ bannerText: { ...theme.bannerText, np: v } }) },
                      { key: 'couponCode', label: 'Active Coupon Code', value: theme.couponCode, onChange: (v: string) => updateTheme({ couponCode: v }) },
                    ].map(({ key, label, value, onChange }) => (
                      <div key={key}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--brown)', marginBottom: 6 }}>{label}</label>
                        <input className="input" value={value} onChange={(e) => onChange(e.target.value)} onBlur={() => toast('Theme updated!')} />
                      </div>
                    ))}
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--brown)', marginBottom: 6 }}>Festive Discount (%)</label>
                      <input className="input" type="number" min={0} max={90} value={theme.discountPercentage} onChange={(e) => updateTheme({ discountPercentage: Number(e.target.value) })} onBlur={() => toast('Discount updated!')} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--ivory)', borderRadius: 12, border: '1px solid var(--cream)' }}>
                      <input type="checkbox" id="dashain-theme" checked={theme.isDashainTheme} onChange={(e) => { updateTheme({ isDashainTheme: e.target.checked }); toast(e.target.checked ? '🪔 Dashain theme ON!' : 'Theme reverted.'); }} style={{ width: 18, height: 18 }} />
                      <label htmlFor="dashain-theme" style={{ fontWeight: 700, fontSize: 14, color: 'var(--brown)', cursor: 'pointer' }}>Enable Dashain Festive Theme 🪔</label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--ivory)', borderRadius: 12, border: '1px solid var(--cream)' }}>
                      <input type="checkbox" id="banner-show" checked={theme.showAnnouncementBar} onChange={(e) => { updateTheme({ showAnnouncementBar: e.target.checked }); toast('Banner updated!'); }} style={{ width: 18, height: 18 }} />
                      <label htmlFor="banner-show" style={{ fontWeight: 700, fontSize: 14, color: 'var(--brown)', cursor: 'pointer' }}>Show Announcement Bar</label>
                    </div>
                  </div>
                </div>
              )}

              {/* ── SETTINGS ── */}
              {tab === 'settings' && (
                <div>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Store Settings</h3>
                  <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                    {[
                      { label: 'Store Name (EN)', value: merchant.shopName.en, onChange: (v: string) => updateMerchant({ shopName: { ...merchant.shopName, en: v } }) },
                      { label: 'Store Name (NP)', value: merchant.shopName.np, onChange: (v: string) => updateMerchant({ shopName: { ...merchant.shopName, np: v } }) },
                      { label: 'WhatsApp Number', value: merchant.whatsappNumber, onChange: (v: string) => updateMerchant({ whatsappNumber: v }) },
                      { label: 'Contact Phone', value: merchant.shopPhone, onChange: (v: string) => updateMerchant({ shopPhone: v }) },
                      { label: 'eSewa ID', value: merchant.esewaId || '', onChange: (v: string) => updateMerchant({ esewaId: v }) },
                      { label: 'Khalti ID', value: merchant.khaltiId || '', onChange: (v: string) => updateMerchant({ khaltiId: v }) },
                    ].map(({ label, value, onChange }) => (
                      <div key={label}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--brown)', marginBottom: 6 }}>{label}</label>
                        <input className="input" value={value} onChange={(e) => onChange(e.target.value)} onBlur={() => toast('Settings saved!')} />
                      </div>
                    ))}
                    <div style={{ gridColumn: '1/-1', padding: 16, background: 'rgba(16,185,129,0.06)', borderRadius: 12, border: '1px solid rgba(16,185,129,0.2)' }}>
                      <p style={{ fontSize: 13, color: '#059669', fontWeight: 600 }}>✅ All settings auto-save to Firestore and sync across all devices in real-time.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
