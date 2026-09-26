import React, { useState, useRef, useEffect } from 'react';
import {
  QrCode,
  Upload,
  Link,
  Trash2,
  CheckCircle,
  Eye,
  AlertCircle,
  Sparkles,
  Smartphone,
  CreditCard,
  Building,
  RefreshCw,
  ExternalLink,
  Check,
} from 'lucide-react';
import { useSettingsStore } from '../../../stores/settingsStore';

// Helper to downscale and compress images client-side before storing as data URI
const compressImageToDataUri = (file: File, maxDim = 600, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const PaymentQRTab: React.FC = () => {
  const { merchant, updateMerchant } = useSettingsStore();

  // Local draft state for quick editing & confirmation
  const [fonepayQr, setFonepayQr] = useState<string>(merchant.fonepayQrDataUri || '');
  const [esewaQr, setEsewaQr] = useState<string>(merchant.esewaQrDataUri || '');
  const [khaltiQr, setKhaltiQr] = useState<string>(merchant.khaltiQrDataUri || '');

  const [shopPhone, setShopPhone] = useState<string>(merchant.shopPhone || '9808251494');
  const [shopNameEn, setShopNameEn] = useState<string>(merchant.shopName?.en || 'DAWOSTI Boutique');
  const [shopNameNp, setShopNameNp] = useState<string>(merchant.shopName?.np || 'दावोस्ती बुटिक');
  const [fonepayMerchantId, setFonepayMerchantId] = useState<string>(merchant.fonepayMerchantId || '');
  const [esewaId, setEsewaId] = useState<string>(merchant.esewaId || '');
  const [khaltiId, setKhaltiId] = useState<string>(merchant.khaltiId || '');

  // Synchronize draft state whenever merchant settings update from Firestore or LocalStorage
  useEffect(() => {
    if (merchant.fonepayQrDataUri !== undefined) setFonepayQr(merchant.fonepayQrDataUri || '');
    if (merchant.esewaQrDataUri !== undefined) setEsewaQr(merchant.esewaQrDataUri || '');
    if (merchant.khaltiQrDataUri !== undefined) setKhaltiQr(merchant.khaltiQrDataUri || '');
    if (merchant.shopPhone) setShopPhone(merchant.shopPhone);
    if (merchant.shopName?.en) setShopNameEn(merchant.shopName.en);
    if (merchant.shopName?.np) setShopNameNp(merchant.shopName.np);
    if (merchant.fonepayMerchantId !== undefined) setFonepayMerchantId(merchant.fonepayMerchantId || '');
    if (merchant.esewaId !== undefined) setEsewaId(merchant.esewaId || '');
    if (merchant.khaltiId !== undefined) setKhaltiId(merchant.khaltiId || '');
  }, [merchant]);

  // Preview simulator selection
  const [simulatedMethod, setSimulatedMethod] = useState<'fonepay' | 'esewa' | 'khalti'>('fonepay');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'fonepay' | 'esewa' | 'khalti'>('fonepay');
  const [urlInput, setUrlInput] = useState('');
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'fonepay' | 'esewa' | 'khalti') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedDataUri = await compressImageToDataUri(file);
      if (target === 'fonepay') setFonepayQr(compressedDataUri);
      if (target === 'esewa') setEsewaQr(compressedDataUri);
      if (target === 'khalti') setKhaltiQr(compressedDataUri);
      setSaveSuccess(false);
    } catch (err) {
      console.error('Failed to process image:', err);
      alert('Failed to process image. Please try another file.');
    }
    // reset input
    if (e.target) e.target.value = '';
  };

  const handleUrlApply = (target: 'fonepay' | 'esewa' | 'khalti') => {
    if (!urlInput.trim()) return;
    if (target === 'fonepay') setFonepayQr(urlInput.trim());
    if (target === 'esewa') setEsewaQr(urlInput.trim());
    if (target === 'khalti') setKhaltiQr(urlInput.trim());
    setUrlInput('');
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      updateMerchant({
        fonepayQrDataUri: fonepayQr.trim() || undefined,
        esewaQrDataUri: esewaQr.trim() || undefined,
        khaltiQrDataUri: khaltiQr.trim() || undefined,
        shopPhone: shopPhone.trim() || '9808251494',
        shopName: {
          en: shopNameEn.trim() || 'DAWOSTI Boutique',
          np: shopNameNp.trim() || 'दावोस्ती बुटिक',
        },
        fonepayMerchantId: fonepayMerchantId.trim() || undefined,
        esewaId: esewaId.trim() || undefined,
        khaltiId: khaltiId.trim() || undefined,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Error saving QR code:', err);
      alert('Could not save QR settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // Determine current active preview image based on simulated method
  const getActiveQrPreview = () => {
    if (simulatedMethod === 'esewa' && esewaQr) return esewaQr;
    if (simulatedMethod === 'khalti' && khaltiQr) return khaltiQr;
    return fonepayQr;
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1.5px solid #EADCCE',
    fontFamily: 'Inter, sans-serif',
    fontSize: 13.5,
    color: '#2B1810',
    backgroundColor: '#FFFFFF',
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #FAF2E9 0%, #F5E6D3 100%)',
          border: '1.5px solid #D4AF37',
          borderRadius: 12,
          padding: '18px 22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 10,
              background: '#8B3A3A',
              color: '#FFF8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(139, 58, 58, 0.25)',
            }}
          >
            <QrCode size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#2B1810' }}>
              Payment QR & Terminal Management
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#6B564C' }}>
              Upload your official Fonepay, eSewa, or Khalti QR codes. Customers can scan to pay directly at checkout.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            padding: '10px 22px',
            backgroundColor: saveSuccess ? '#059669' : '#8B3A3A',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            fontSize: 13.5,
            fontWeight: 700,
            cursor: isSaving ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(139, 58, 58, 0.2)',
            transition: 'all 0.2s ease',
          }}
        >
          {saveSuccess ? (
            <>
              <Check size={16} />
              <span>Saved & Live on Store!</span>
            </>
          ) : (
            <>
              <RefreshCw size={16} className={isSaving ? 'animate-spin' : ''} />
              <span>{isSaving ? 'Saving...' : 'Save & Publish QR Changes'}</span>
            </>
          )}
        </button>
      </div>

      {saveSuccess && (
        <div
          style={{
            background: '#ECFDF5',
            border: '1.5px solid #10B981',
            borderRadius: 8,
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#065F46',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <CheckCircle size={18} color="#059669" />
          <span>QR settings updated successfully! Live checkout terminals will reflect the new QR code immediately.</span>
        </div>
      )}

      {/* Main Grid: QR Uploaders + Live Checkout Simulator */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
        {/* Left Column: QR Management */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Provider Tabs */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#FAF2E9',
              borderRadius: 10,
              padding: 4,
              border: '1px solid #EADCCE',
              gap: 4,
            }}
          >
            {[
              { id: 'fonepay' as const, label: 'Fonepay (Universal)', badge: 'Recommended', icon: QrCode },
              { id: 'esewa' as const, label: 'eSewa QR', badge: esewaQr ? 'Configured' : undefined, icon: Smartphone },
              { id: 'khalti' as const, label: 'Khalti QR', badge: khaltiQr ? 'Configured' : undefined, icon: CreditCard },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSimulatedMethod(tab.id);
                  }}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: isSelected ? '#FFFFFF' : 'transparent',
                    color: isSelected ? '#8B3A3A' : '#6B564C',
                    fontWeight: isSelected ? 700 : 500,
                    boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                    cursor: 'pointer',
                    fontSize: 12.5,
                  }}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active QR Upload Card */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #EADCCE',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#2B1810' }}>
                  {activeTab === 'fonepay' && 'Universal Fonepay / Banking QR'}
                  {activeTab === 'esewa' && 'eSewa Direct Wallet QR (Optional)'}
                  {activeTab === 'khalti' && 'Khalti Direct Wallet QR (Optional)'}
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#6B564C' }}>
                  {activeTab === 'fonepay' && 'Interoperable QR scannable by all Nepali bank apps and digital wallets.'}
                  {activeTab === 'esewa' && 'If set, users choosing eSewa see this QR. Otherwise falls back to Fonepay.'}
                  {activeTab === 'khalti' && 'If set, users choosing Khalti see this QR. Otherwise falls back to Fonepay.'}
                </p>
              </div>

              {((activeTab === 'fonepay' && fonepayQr) ||
                (activeTab === 'esewa' && esewaQr) ||
                (activeTab === 'khalti' && khaltiQr)) && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to remove this QR image?')) {
                      if (activeTab === 'fonepay') setFonepayQr('');
                      if (activeTab === 'esewa') setEsewaQr('');
                      if (activeTab === 'khalti') setKhaltiQr('');
                      setSaveSuccess(false);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 10px',
                    backgroundColor: '#FFF0F0',
                    border: '1px solid #F5C2C7',
                    borderRadius: 6,
                    color: '#B02A37',
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={13} />
                  <span>Remove QR</span>
                </button>
              )}
            </div>

            {/* Current QR Display or Placeholder */}
            {(() => {
              const currentQr =
                activeTab === 'fonepay' ? fonepayQr : activeTab === 'esewa' ? esewaQr : khaltiQr;

              return currentQr ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: 16,
                    backgroundColor: '#FAF2E9',
                    borderRadius: 10,
                    border: '1.5px dashed #D4AF37',
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      background: '#FFF',
                      padding: 10,
                      borderRadius: 10,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      maxWidth: 220,
                      maxHeight: 220,
                    }}
                  >
                    <img
                      src={currentQr}
                      alt="Payment QR Code"
                      style={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: 200,
                        objectFit: 'contain',
                        borderRadius: 6,
                        display: 'block',
                      }}
                    />
                    <button
                      onClick={() => setZoomImage(currentQr)}
                      title="Zoom QR"
                      style={{
                        position: 'absolute',
                        bottom: 6,
                        right: 6,
                        backgroundColor: 'rgba(43, 24, 16, 0.75)',
                        color: '#FFF',
                        border: 'none',
                        borderRadius: 4,
                        padding: 4,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 11.5, color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle size={14} />
                    <span>Custom QR image active</span>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px 16px',
                    backgroundColor: '#FAF2E9',
                    borderRadius: 10,
                    border: '1.5px dashed #C4B5A5',
                    marginBottom: 16,
                    color: '#6B564C',
                  }}
                >
                  <QrCode size={42} color="#C4B5A5" style={{ marginBottom: 8 }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>No custom QR image uploaded</span>
                  <span style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                    {activeTab === 'fonepay'
                      ? 'Checkout is using the default styled merchant terminal.'
                      : 'Will fall back to Universal Fonepay QR.'}
                  </span>
                </div>
              );
            })()}

            {/* Upload & URL Input Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#2B1810', marginBottom: 6 }}>
                  Upload New QR Image (PNG, JPG, WebP)
                </label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileUpload(e, activeTab)}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    backgroundColor: '#FAF2E9',
                    border: '1.5px solid #D4AF37',
                    borderRadius: 8,
                    color: '#8B3A3A',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <Upload size={16} />
                  <span>Choose Image File from Computer / Phone</span>
                </button>
                <div style={{ fontSize: 10.5, color: '#888', marginTop: 4 }}>
                  ⚡ Images are automatically optimized and compressed for instant loading.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ height: 1, backgroundColor: '#EADCCE', flex: 1 }} />
                <span style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>OR PASTE IMAGE URL</span>
                <div style={{ height: 1, backgroundColor: '#EADCCE', flex: 1 }} />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="https://example.com/my-fonepay-qr.png"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
                <button
                  onClick={() => handleUrlApply(activeTab)}
                  disabled={!urlInput.trim()}
                  style={{
                    padding: '0 16px',
                    backgroundColor: urlInput.trim() ? '#2B1810' : '#DDD',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: urlInput.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Link size={14} />
                  <span>Apply</span>
                </button>
              </div>
            </div>
          </div>

          {/* Merchant Transfer Info Configuration */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #EADCCE',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <h4 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#2B1810' }}>
              Merchant Terminal Credentials
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#2B1810', marginBottom: 4 }}>
                  Account / Primary Phone (Shown at Checkout)
                </label>
                <input
                  style={inputStyle}
                  value={shopPhone}
                  placeholder="9808251494"
                  onChange={(e) => {
                    setShopPhone(e.target.value);
                    setSaveSuccess(false);
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#2B1810', marginBottom: 4 }}>
                    Merchant Name (English)
                  </label>
                  <input
                    style={inputStyle}
                    value={shopNameEn}
                    placeholder="DAWOSTI Boutique"
                    onChange={(e) => {
                      setShopNameEn(e.target.value);
                      setSaveSuccess(false);
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#2B1810', marginBottom: 4 }}>
                    Merchant Name (Nepali)
                  </label>
                  <input
                    style={inputStyle}
                    value={shopNameNp}
                    placeholder="दावोस्ती बुटिक"
                    onChange={(e) => {
                      setShopNameNp(e.target.value);
                      setSaveSuccess(false);
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#6B564C', marginBottom: 4 }}>
                    Fonepay Merchant ID (Optional)
                  </label>
                  <input
                    style={inputStyle}
                    value={fonepayMerchantId}
                    placeholder="FP-9808251494"
                    onChange={(e) => {
                      setFonepayMerchantId(e.target.value);
                      setSaveSuccess(false);
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#6B564C', marginBottom: 4 }}>
                    eSewa ID (Optional)
                  </label>
                  <input
                    style={inputStyle}
                    value={esewaId}
                    placeholder="9808251494"
                    onChange={(e) => {
                      setEsewaId(e.target.value);
                      setSaveSuccess(false);
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#6B564C', marginBottom: 4 }}>
                    Khalti ID (Optional)
                  </label>
                  <input
                    style={inputStyle}
                    value={khaltiId}
                    placeholder="9808251494"
                    onChange={(e) => {
                      setKhaltiId(e.target.value);
                      setSaveSuccess(false);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Customer Terminal Simulator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '2px solid #D4AF37',
              borderRadius: 14,
              padding: 20,
              boxShadow: '0 8px 24px rgba(43, 24, 16, 0.08)',
              position: 'sticky',
              top: 20,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={16} color="#D4AF37" />
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#2B1810', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Live Customer Checkout View
                </h4>
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 99,
                  backgroundColor: '#ECFDF5',
                  color: '#065F46',
                  border: '1px solid #A7F3D0',
                }}
              >
                Simulated Preview
              </span>
            </div>

            <p style={{ margin: '0 0 14px', fontSize: 12, color: '#6B564C' }}>
              This is how your digital QR terminal will appear to buyers when they checkout:
            </p>

            {/* Payment method selector inside preview */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {[
                { id: 'fonepay' as const, label: 'Fonepay' },
                { id: 'esewa' as const, label: 'eSewa' },
                { id: 'khalti' as const, label: 'Khalti' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSimulatedMethod(m.id)}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: 6,
                    border: `1.5px solid ${simulatedMethod === m.id ? '#8B3A3A' : '#EADCCE'}`,
                    backgroundColor: simulatedMethod === m.id ? '#FAF2E9' : '#FFF',
                    color: simulatedMethod === m.id ? '#8B3A3A' : '#666',
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* The Actual Terminal Card as Rendered in Checkout */}
            <div
              style={{
                background: '#FAF2E9',
                border: '1.5px solid #D4AF37',
                borderRadius: 14,
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <QrCode size={18} color="#8B3A3A" />
                <span style={{ fontWeight: 800, fontSize: 13, color: '#2B1810' }}>
                  Official Dawosti Digital Payment Terminal
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
                {/* Visual QR Card */}
                <div
                  style={{
                    background: 'white',
                    padding: 12,
                    borderRadius: 10,
                    textAlign: 'center',
                    border: '1px solid #EADCCE',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    width: '100%',
                    maxWidth: 240,
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#8B3A3A', textTransform: 'uppercase', marginBottom: 8 }}>
                    Scan & Pay: NPR 4,500
                  </div>

                  {getActiveQrPreview() ? (
                    <div
                      style={{
                        position: 'relative',
                        width: 170,
                        height: 170,
                        margin: '0 auto',
                        background: '#FFFFFF',
                        border: '2px solid #2B1810',
                        borderRadius: 8,
                        padding: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                      onClick={() => setZoomImage(getActiveQrPreview())}
                      title="Click to zoom QR"
                    >
                      <img
                        src={getActiveQrPreview()}
                        alt="Merchant Payment QR"
                        style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 4 }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: 160,
                        height: 160,
                        margin: '0 auto',
                        background: '#FFFFFF',
                        border: '2px solid #2B1810',
                        borderRadius: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                      }}
                    >
                      <div style={{ position: 'absolute', top: 6, left: 6, width: 20, height: 20, border: '3px solid #2B1810' }} />
                      <div style={{ position: 'absolute', top: 6, right: 6, width: 20, height: 20, border: '3px solid #2B1810' }} />
                      <div style={{ position: 'absolute', bottom: 6, left: 6, width: 20, height: 20, border: '3px solid #2B1810' }} />
                      <QrCode size={60} color="#2B1810" />
                      <span style={{ fontSize: 9, fontWeight: 800, color: '#8B3A3A', marginTop: 4 }}>
                        {shopPhone || '9808251494'}
                      </span>
                    </div>
                  )}

                  <p style={{ fontSize: 10, color: '#666', margin: '8px 0 0' }}>
                    Supports Fonepay • eSewa • Khalti • Banking
                  </p>
                </div>

                {/* Merchant Transfer Info */}
                <div style={{ fontSize: 12, color: '#2B1810', width: '100%' }}>
                  <p style={{ margin: '0 0 6px' }}>
                    <strong>Account / Wallet ID:</strong>{' '}
                    <code style={{ background: '#FFF', padding: '2px 6px', borderRadius: 4, color: '#8B3A3A', fontWeight: 800 }}>
                      {shopPhone || '9808251494'}
                    </code>
                  </p>
                  <p style={{ margin: '0 0 6px' }}>
                    <strong>Merchant Name:</strong> {shopNameEn || 'DAWOSTI Boutique'}
                  </p>
                  {fonepayMerchantId && (
                    <p style={{ margin: '0 0 6px' }}>
                      <strong>Terminal Code:</strong> {fonepayMerchantId}
                    </p>
                  )}
                  <p style={{ margin: '0 0 10px', fontSize: 11, color: '#6B564C' }}>
                    Transfer total amount, then enter your transaction code or screenshot reference below.
                  </p>

                  <input
                    readOnly
                    disabled
                    style={{ ...inputStyle, backgroundColor: '#FAF7F2', cursor: 'not-allowed', fontSize: 12 }}
                    placeholder="Customer enters Transaction ID here"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Save Trigger */}
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <button
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  backgroundColor: '#8B3A3A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Check size={16} />
                <span>Save All Changes</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Zoom Modal */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            cursor: 'zoom-out',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFF',
              padding: 24,
              borderRadius: 16,
              maxWidth: 420,
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={zoomImage}
              alt="Enlarged QR"
              style={{ width: '100%', height: 'auto', maxHeight: 380, objectFit: 'contain' }}
            />
            <p style={{ fontSize: 13, fontWeight: 700, color: '#2B1810', margin: '14px 0 6px' }}>
              Scan with any Nepal Banking or Wallet App
            </p>
            <button
              onClick={() => setZoomImage(null)}
              style={{
                marginTop: 8,
                padding: '8px 20px',
                backgroundColor: '#8B3A3A',
                color: '#FFF',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
