import React, { useState } from 'react';
import { Calculator, TrendingUp, AlertTriangle, CheckCircle, DollarSign, Package, LayoutTemplate, Eye, EyeOff } from 'lucide-react';
import { useProductStore } from '../../../stores/productStore';
import { calculateProfit, DEFAULT_SHIPPING_ESTIMATE } from '../../../services/profitCalculator';
import { useSettingsStore } from '../../../stores/settingsStore';

export const ProfitSimulatorTab: React.FC = () => {
  const { products, updateProduct } = useProductStore();
  const { theme, updateTheme } = useSettingsStore();

  // Active simulator parameters
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const [sellingPrice, setSellingPrice] = useState<number>(selectedProduct?.price || 3500);
  const [buyingPrice, setBuyingPrice] = useState<number>(selectedProduct?.costPrice || 1400);
  const [discount, setDiscount] = useState<number>(300);
  const [shippingCharge, setShippingCharge] = useState<number>(DEFAULT_SHIPPING_ESTIMATE.insideValley);
  const [referralFee, setReferralFee] = useState<number>(selectedProduct?.referralFee || 500);

  // Sync inputs when product selection changes
  const handleProductSelect = (id: string) => {
    setSelectedProductId(id);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setSellingPrice(prod.price);
      setBuyingPrice(prod.costPrice || Math.round(prod.price * 0.4)); // default ~40% cost if not set
      setReferralFee(prod.referralFee || 500);
    }
  };

  // Compute live profit
  const result = calculateProfit({
    sellingPrice,
    buyingPrice,
    discount,
    shippingCharge,
    referralFee,
  });

  const handleSaveToProduct = () => {
    if (!selectedProduct) return;
    updateProduct(selectedProduct.id, {
      costPrice: buyingPrice,
      referralFee,
    });
    alert(`Updated ${selectedProduct.title.en}: Buying Price = NPR ${buyingPrice}, Referral Fee = NPR ${referralFee}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Store Display Settings */}
      <div style={{ background: '#FFF8F0', padding: '16px 20px', borderRadius: 8, border: '1.5px solid #D4AF37' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <LayoutTemplate size={18} color="#8B3A3A" />
          <h3 style={{ margin: 0, fontSize: 16, color: '#2B1810', fontWeight: 700 }}>
            Store Display Settings
          </h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#FAF2E9', borderRadius: 8, border: '1px solid #EADCCE' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#2B1810' }}>
              Fashion Guild &amp; Discord Showcase
            </span>
            <span style={{ fontSize: 12, color: '#888', lineHeight: 1.4 }}>
              Show the Dawosti Fashion Guild section on the homepage (cards, Discord link, categories)
            </span>
          </div>
          <button
            onClick={() => updateTheme({ showGuildSection: !theme.showGuildSection })}
            title={theme.showGuildSection ? 'Click to hide Guild section' : 'Click to show Guild section'}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13,
              border: theme.showGuildSection ? '1.5px solid #1B7F5E' : '1.5px solid #EADCCE',
              background: theme.showGuildSection ? '#E8F5F0' : '#F0F0F0',
              color: theme.showGuildSection ? '#1B7F5E' : '#888',
              transition: 'all 0.2s',
            }}
          >
            {theme.showGuildSection ? <Eye size={15} /> : <EyeOff size={15} />}
            {theme.showGuildSection ? 'Visible' : 'Hidden'}
          </button>
        </div>
      </div>

      {/* Header Banner */}
      <div style={{ background: '#FAF2E9', padding: '16px 20px', borderRadius: 8, border: '1px solid #EADCCE' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Calculator size={20} color="#8B3A3A" />
          <h3 style={{ margin: 0, fontSize: 18, color: '#2B1810', fontWeight: 700 }}>
            Unit Economics &amp; Profit Margin Formula
          </h3>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: '#666', lineHeight: 1.5 }}>
          Formula: <strong style={{ color: '#8B3A3A' }}>Net Profit = Selling Price − Buying Price − Discount − Shipping Charge − Referral Fee</strong>.
          Adjust variables to ensure you maintain safe margins before authorizing affiliate commissions.
        </p>
      </div>


      {/* Simulator Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Left: Input Variables */}
        <div style={{ background: '#FFF8F0', padding: 20, borderRadius: 8, border: '1px solid #EADCCE' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 700, color: '#2B1810' }}>
            1. Select & Tune Product
          </h4>

          {/* Product Picker */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 }}>
              Select Catalog Garment:
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => handleProductSelect(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #D4C5B9',
                backgroundColor: '#FFF',
                fontSize: 13,
              }}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title.en} (Selling: NPR {p.price.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            {/* Selling Price */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 }}>
                Selling Price (NPR):
              </label>
              <input
                type="number"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D4C5B9', fontSize: 13 }}
              />
            </div>

            {/* Buying Price (Cost) */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8B3A3A', marginBottom: 4 }}>
                Buying Price / Cost (NPR):
              </label>
              <input
                type="number"
                value={buyingPrice}
                onChange={(e) => setBuyingPrice(Number(e.target.value))}
                placeholder="e.g. 1400"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1.5px solid #8B3A3A',
                  backgroundColor: '#FFF5F5',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            {/* Customer Discount */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 }}>
                Friend Welcome Discount:
              </label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D4C5B9', fontSize: 13 }}
              />
            </div>

            {/* Shipping Charge */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 }}>
                Shipping Cost (Courier):
              </label>
              <input
                type="number"
                value={shippingCharge}
                onChange={(e) => setShippingCharge(Number(e.target.value))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D4C5B9', fontSize: 13 }}
              />
            </div>
          </div>

          {/* Referral Fee */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#1B7F5E', marginBottom: 4 }}>
              Creator Referral Fee (NPR):
            </label>
            <input
              type="number"
              value={referralFee}
              onChange={(e) => setReferralFee(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 6,
                border: '1.5px solid #1B7F5E',
                backgroundColor: '#F0F9F5',
                fontSize: 13,
                fontWeight: 600,
              }}
            />
          </div>

          <button
            onClick={handleSaveToProduct}
            style={{
              width: '100%',
              padding: '10px 14px',
              backgroundColor: '#8B3A3A',
              color: '#FFF',
              border: 'none',
              borderRadius: 6,
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Save Buying Price & Referral Fee to Product
          </button>
        </div>

        {/* Right: Live Profit Breakdown & Health Score */}
        <div style={{ background: '#FFF8F0', padding: 20, borderRadius: 8, border: '1px solid #EADCCE', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h4 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 700, color: '#2B1810' }}>
              2. Real-Time Net Profit Result
            </h4>

            {/* Main Profit Stat Box */}
            <div
              style={{
                padding: 16,
                borderRadius: 8,
                backgroundColor: result.netProfit > 0 ? (result.marginPercent > 25 ? '#F0F9F5' : '#FFF9E6') : '#FFF0F0',
                border: `1px solid ${result.netProfit > 0 ? (result.marginPercent > 25 ? '#A7D7C5' : '#FFE08A') : '#F5C2C7'}`,
                marginBottom: 16,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666', marginBottom: 4 }}>
                Calculated Net Profit (Per Unit)
              </div>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: result.netProfit > 0 ? (result.marginPercent > 25 ? '#1B7F5E' : '#997300') : '#B02A37',
                }}
              >
                NPR {result.netProfit.toLocaleString()}
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 13, fontWeight: 700 }}>
                <span>Net Margin: {result.marginPercent}%</span>
                {result.marginPercent >= 25 ? (
                  <span style={{ color: '#1B7F5E', fontSize: 11, background: '#E0F3EA', padding: '2px 6px', borderRadius: 4 }}>
                    Healthy Luxury Margin
                  </span>
                ) : result.netProfit > 0 ? (
                  <span style={{ color: '#997300', fontSize: 11, background: '#FFF3CD', padding: '2px 6px', borderRadius: 4 }}>
                    Slim Margin (Tight)
                  </span>
                ) : (
                  <span style={{ color: '#B02A37', fontSize: 11, background: '#F8D7DA', padding: '2px 6px', borderRadius: 4 }}>
                    Loss Making! Reduce Referral Fee
                  </span>
                )}
              </div>
            </div>

            {/* Deductions Waterfall */}
            <div style={{ fontSize: 12, color: '#444', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Selling Price (Revenue):</span>
                <strong style={{ color: '#2B1810' }}>+ NPR {sellingPrice.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8B3A3A' }}>
                <span>− Buying Cost (Fabric/Tailoring):</span>
                <strong>− NPR {buyingPrice.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
                <span>− Customer Welcome Discount:</span>
                <strong>− NPR {discount.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
                <span>− Courier / Shipping Absorption:</span>
                <strong>− NPR {shippingCharge.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1B7F5E' }}>
                <span>− Creator Referral Commission:</span>
                <strong>− NPR {referralFee.toLocaleString()}</strong>
              </div>
              <div style={{ borderTop: '1px dashed #D4C5B9', paddingTop: 6, marginTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}>
                <span>Take-Home Cash:</span>
                <span style={{ color: result.netProfit > 0 ? '#1B7F5E' : '#B02A37' }}>
                  NPR {result.netProfit.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16, padding: 10, background: '#FFF', borderRadius: 6, border: '1px solid #EADCCE', fontSize: 11.5, color: '#777' }}>
            💡 <em>Rule of thumb:</em> Aim for minimum NPR 800 – 1,200 net profit per dress after paying all referral and delivery charges.
          </div>
        </div>
      </div>

      {/* Catalog Matrix */}
      <div>
        <h4 style={{ margin: '0 0 12px 0', fontSize: 15, fontWeight: 700, color: '#2B1810' }}>
          3. Entire Catalog Profit Table (Admin View Only)
        </h4>
        <div style={{ overflowX: 'auto', border: '1px solid #EADCCE', borderRadius: 8, backgroundColor: '#FFF' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#FAF2E9', borderBottom: '1px solid #EADCCE', color: '#555' }}>
                <th style={{ padding: '10px 14px' }}>Product</th>
                <th style={{ padding: '10px 14px' }}>Selling Price</th>
                <th style={{ padding: '10px 14px' }}>Buying Price (Cost)</th>
                <th style={{ padding: '10px 14px' }}>Referral Fee</th>
                <th style={{ padding: '10px 14px' }}>Est. Net Profit</th>
                <th style={{ padding: '10px 14px' }}>Margin</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const cost = p.costPrice || Math.round(p.price * 0.4);
                const ref = p.referralFee || 500;
                const pResult = calculateProfit({
                  sellingPrice: p.price,
                  buyingPrice: cost,
                  discount: 300,
                  shippingCharge: 150,
                  referralFee: ref,
                });
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #F0E6D8' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#2B1810' }}>
                      {p.title.en}
                    </td>
                    <td style={{ padding: '10px 14px' }}>NPR {p.price.toLocaleString()}</td>
                    <td style={{ padding: '10px 14px', color: '#8B3A3A', fontWeight: 600 }}>
                      NPR {cost.toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#1B7F5E', fontWeight: 600 }}>
                      NPR {ref.toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: pResult.netProfit > 0 ? '#1B7F5E' : '#B02A37' }}>
                      NPR {pResult.netProfit.toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          backgroundColor: pResult.marginPercent >= 25 ? '#E0F3EA' : '#FFF3CD',
                          color: pResult.marginPercent >= 25 ? '#1B7F5E' : '#997300',
                        }}
                      >
                        {pResult.marginPercent}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
