import React, { useState } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  Truck,
  MessageCircle,
  PhoneCall,
  Search,
  ShieldAlert,
  Trash2,
  UserCheck,
  PackageCheck,
  Sparkles,
  Filter,
  Building2,
  Copy,
  Send,
  FileText,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useOrderStore } from '../../../stores/orderStore';
import { useProductStore } from '../../../stores/productStore';
import { calculateProfit } from '../../../services/profitCalculator';
import { DropshipSupplier, Order } from '../../../types';
import { toast } from '../../common/Toast';

const PRESET_SUPPLIERS: DropshipSupplier[] = [
  { id: 'sup-ktm-atelier', name: 'Kathmandu Central Atelier', phone: '9801234567', location: 'New Road, Kathmandu' },
  { id: 'sup-patan-weavers', name: 'Patan Handloom Weavers', phone: '9812345678', location: 'Mangal Bazar, Lalitpur' },
  { id: 'sup-bhaktapur-dhaka', name: 'Bhaktapur Heritage Guild', phone: '9841234567', location: 'Durbar Square, Bhaktapur' },
  { id: 'sup-pokhara-silk', name: 'Pokhara Silk & Pashmina Works', phone: '9856012345', location: 'Lakeside, Pokhara' },
];

type FilterTab = 'all' | 'unverified' | 'real_user' | 'verified_genuine' | 'flagged_fake' | 'wholesale';

export const OrdersTab: React.FC = () => {
  const { orders, verifyOrder, updateOrderStatus, deleteOrder, assignSupplier, wipeAllDemoOrders } = useOrderStore();
  const { products } = useProductStore();

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customSupplierForms, setCustomSupplierForms] = useState<Record<string, { name: string; phone: string; location: string }>>({});
  const [activeDropdownOrder, setActiveDropdownOrder] = useState<string | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  const buildDispatchSlipText = (order: Order, supplier: DropshipSupplier, buyCost: number) => {
    const customerName = order.shippingAddress?.fullName || 'Customer';
    const customerPhone = order.shippingAddress?.phone || 'N/A';
    const fullAddress = `${order.shippingAddress?.addressLine || ''}, ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.province || ''}`.trim();

    const paymentInstruction =
      order.paymentMethod === 'cod'
        ? `CASH ON DELIVERY (COD)\n👉 PLEASE COLLECT: NPR ${(order.totalAmount || 0).toLocaleString()} from customer upon delivery.`
        : `PREPAID ONLINE / QR\n👉 DO NOT COLLECT ANY CASH (Customer already paid NPR ${(order.totalAmount || 0).toLocaleString()} to Dawosti).`;

    const itemsList = (order.items || [])
      .map((item, idx) => {
        const title = item.product?.title?.en || item.product?.title?.np || 'Garment';
        const size = item.selectedSize || 'Free Size';
        const qty = item.quantity || 1;
        return `${idx + 1}. *${title}*\n   • Size: ${size} | Qty: ${qty} | SKU: ${item.product?.id || 'N/A'}`;
      })
      .join('\n');

    return `📦 *DAWOSTI SUPPLIER BUY ORDER & DISPATCH SLIP*
*Order Ref:* #${order.orderNumber}
*Date:* ${new Date(order.createdAt).toLocaleDateString('en-GB')}
*Assigned Supplier:* ${supplier.name} (${supplier.location})

📍 *CUSTOMER DELIVERY LOCATION:*
• *Recipient Name:* ${customerName}
• *Mobile Number:* ${customerPhone}
• *Exact Address:* ${fullAddress}
${order.notes ? `• *Customer Note:* ${order.notes}\n` : ''}
👗 *GARMENTS TO DISPATCH:*
${itemsList}

💰 *PAYMENT & COLLECTION INSTRUCTIONS:*
• *Payment Mode:* ${paymentInstruction}
• *Supplier Agreed Cost:* NPR ${buyCost.toLocaleString()} (Direct Dawosti Settlement)

⚠️ *DISPATCH PROTOCOL:*
1. Inspect stitching, buttons, and finish.
2. Pack in Dawosti craft packaging.
3. Affix recipient shipping label above.
4. Notify Dawosti once handed over to delivery courier.`;
  };

  const handleCopySlip = (order: Order, supplier: DropshipSupplier, buyCost: number) => {
    const text = buildDispatchSlipText(order, supplier, buyCost);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => {
          setCopiedOrderId(order.id);
          toast('Supplier dispatch slip copied to clipboard!', 'success');
          setTimeout(() => setCopiedOrderId(null), 3000);
        },
        () => {
          const textArea = document.createElement('textarea');
          textArea.value = text;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          setCopiedOrderId(order.id);
          toast('Supplier dispatch slip copied to clipboard!', 'success');
          setTimeout(() => setCopiedOrderId(null), 3000);
        }
      );
    }
  };

  const handleSendSupplierWhatsApp = (order: Order, supplier: DropshipSupplier, buyCost: number) => {
    const cleanPhone = (supplier.phone || '').replace(/[^0-9]/g, '');
    const text = buildDispatchSlipText(order, supplier, buyCost);
    const waUrl = `https://wa.me/977${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    assignSupplier(order.id, {
      ...supplier,
      status: 'dispatched',
      assignedAt: new Date().toISOString(),
    });
    toast(`Dispatch slip routed to ${supplier.name} via WhatsApp!`, 'success');
  };

  // Counts
  const realOrders = orders.filter((o) => !o.id.startsWith('seed_order_'));
  const seedOrders = orders.filter((o) => o.id.startsWith('seed_order_'));
  const unverifiedOrders = orders.filter((o) => !o.verification || o.verification.status === 'unverified' || !o.acknowledgedByAdmin);
  const verifiedOrders = orders.filter((o) => o.verification?.status === 'verified_genuine');
  const flaggedOrders = orders.filter((o) => o.verification?.status === 'flagged_fake' || o.verification?.status === 'suspicious');
  const wholesaleOrders = orders.filter((o) => o.isWholesaleLead);

  // Apply Filter & Search
  const filteredOrders = orders.filter((order) => {
    // 1. Filter Tab
    if (activeFilter === 'unverified') {
      const isUnver = !order.verification || order.verification.status === 'unverified' || !order.acknowledgedByAdmin;
      if (!isUnver) return false;
    } else if (activeFilter === 'real_user') {
      if (order.id.startsWith('seed_order_')) return false;
    } else if (activeFilter === 'verified_genuine') {
      if (order.verification?.status !== 'verified_genuine') return false;
    } else if (activeFilter === 'flagged_fake') {
      if (order.verification?.status !== 'flagged_fake' && order.verification?.status !== 'suspicious') return false;
    } else if (activeFilter === 'wholesale') {
      if (!order.isWholesaleLead) return false;
    }

    // 2. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchNum = (order.orderNumber || '').toLowerCase().includes(q);
      const matchName = (order.shippingAddress?.fullName || '').toLowerCase().includes(q);
      const matchPhone = (order.shippingAddress?.phone || '').includes(q);
      const matchCity = (order.shippingAddress?.city || '').toLowerCase().includes(q);
      const matchAddr = (order.shippingAddress?.addressLine || '').toLowerCase().includes(q);
      const matchRef = (order.referredByCode || '').toLowerCase().includes(q);
      if (!matchNum && !matchName && !matchPhone && !matchCity && !matchAddr && !matchRef) return false;
    }

    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Overview Stat Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <div style={{ background: '#FFF8F0', padding: 14, borderRadius: 8, border: '1px solid #EADCCE' }}>
          <div style={{ fontSize: 11, color: '#777', textTransform: 'uppercase', fontWeight: 600 }}>Total Store Orders</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#2B1810' }}>{orders.length}</div>
          <div style={{ fontSize: 11, color: '#1B7F5E', fontWeight: 700, marginTop: 2 }}>
            Live Customer Orders
          </div>
        </div>

        <div
          onClick={() => setActiveFilter('unverified')}
          style={{
            background: unverifiedOrders.length > 0 ? '#FFF3CD' : '#FFF8F0',
            padding: 14,
            borderRadius: 8,
            border: `1.5px solid ${unverifiedOrders.length > 0 ? '#FFE08A' : '#EADCCE'}`,
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: 11, color: '#856404', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertTriangle size={13} />
            Pending Verification
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#856404' }}>{unverifiedOrders.length}</div>
          <div style={{ fontSize: 11, color: '#856404', marginTop: 2 }}>Action required before dispatch</div>
        </div>

        <div
          onClick={() => setActiveFilter('real_user')}
          style={{ background: '#E0F3EA', padding: 14, borderRadius: 8, border: '1.5px solid #A3E2C3', cursor: 'pointer' }}
        >
          <div style={{ fontSize: 11, color: '#1B7F5E', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Sparkles size={13} />
            Real Customer Orders
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1B7F5E' }}>{realOrders.length}</div>
          <div style={{ fontSize: 11, color: '#1B7F5E', marginTop: 2 }}>Submitted via dawosti.com</div>
        </div>

        <div
          onClick={() => setActiveFilter('wholesale')}
          style={{ background: '#FFF8F0', padding: 14, borderRadius: 8, border: '1px solid #EADCCE', cursor: 'pointer' }}
        >
          <div style={{ fontSize: 11, color: '#777', textTransform: 'uppercase', fontWeight: 600 }}>Wholesale Leads</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#D4AF37' }}>{wholesaleOrders.length}</div>
          <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>Bulk quantity / high value</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#FFF', padding: 14, borderRadius: 8, border: '1px solid #EADCCE' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
            <Search size={16} color="#777" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order #, Customer Name, Phone, City..."
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: 6,
                border: '1px solid #D4C5B9',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 12 }}
              >
                Clear
              </button>
            )}
          </div>

          <div style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>
            Showing <strong>{filteredOrders.length}</strong> of {orders.length} orders
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#777', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, marginRight: 4 }}>
            <Filter size={12} />
            FILTER:
          </span>
          {[
            { id: 'all', label: `All Orders (${orders.length})` },
            { id: 'unverified', label: `🚨 Pending Verification (${unverifiedOrders.length})` },
            { id: 'real_user', label: `🛍️ Real Customer Orders (${realOrders.length})` },
            { id: 'verified_genuine', label: `✅ Verified Genuine (${verifiedOrders.length})` },
            { id: 'flagged_fake', label: `🚩 Flagged Fake / Suspicious (${flaggedOrders.length})` },
            { id: 'wholesale', label: `👑 Wholesale Leads (${wholesaleOrders.length})` },
          ].map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as FilterTab)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 500,
                  border: `1px solid ${isActive ? '#8B3A3A' : '#EADCCE'}`,
                  backgroundColor: isActive ? '#8B3A3A' : '#FAF2E9',
                  color: isActive ? '#FFF' : '#2B1810',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filteredOrders.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#777', background: '#FFF8F0', borderRadius: 8, border: '1px solid #EADCCE' }}>
            <ShieldCheck size={36} color="#8B3A3A" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <h4 style={{ margin: '0 0 6px', color: '#2B1810', fontSize: 16 }}>No customer orders found</h4>
            <p style={{ margin: 0, fontSize: 13, color: '#666' }}>
              {searchQuery ? `No orders matched search query "${searchQuery}"` : 'Real customer orders placed on dawosti.com will automatically appear here in real time.'}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isRealOrder = !order.id.startsWith('seed_order_');
            const verificationStatus = order.verification?.status || 'unverified';
            const fraudRisk = order.verification?.fraudRisk || 'low';
            const fraudScore = order.verification?.fraudScore || 5;

            // Calculate Buying cost & Net Profit for this specific order
            let orderBuyingCost = 0;
            let orderTargetReferralFee = order.referredByCode ? Math.round(order.totalAmount * 0.1) : 0;

            for (const item of (order.items || [])) {
              if (!item) continue;
              const matchedProd = products.find((p) => p.id === item.product?.id);
              const unitCost = matchedProd?.costPrice || (item.product?.price ? Math.round(item.product.price * 0.42) : 1000);
              orderBuyingCost += unitCost * (item.quantity || 1);
            }

            const profitResult = calculateProfit({
              sellingPrice: order.totalAmount,
              buyingPrice: orderBuyingCost,
              discount: order.discountAmount || 0,
              shippingCharge: order.deliveryFee || 150,
              referralFee: orderTargetReferralFee,
            });

            const cleanPhone = (order.shippingAddress?.phone || '').replace(/[^0-9]/g, '');
            const waMsg = encodeURIComponent(
              `Namaste ${order.shippingAddress?.fullName || 'Customer'}! This is Dawosti Boutique Operations regarding your order #${order.orderNumber}. We are preparing your parcel for dispatch.`
            );

            return (
              <div
                key={order.id}
                style={{
                  background: '#FFF',
                  padding: 18,
                  borderRadius: 10,
                  border: `2px solid ${
                    verificationStatus === 'unverified'
                      ? '#D4AF37'
                      : verificationStatus === 'verified_genuine'
                      ? '#A3E2C3'
                      : '#F5C2C7'
                  }`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  boxShadow: isRealOrder ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                {/* Order Badges Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: 17, color: '#2B1810' }}>
                        #{order.orderNumber}
                      </span>

                      {/* Real vs Seed Badge */}
                      {isRealOrder ? (
                        <span style={{ fontSize: 11, background: '#E0F3EA', color: '#1B7F5E', padding: '2px 8px', borderRadius: 4, fontWeight: 800, border: '1px solid #A3E2C3' }}>
                          🛍️ REAL CUSTOMER ORDER
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, background: '#F0E6D8', color: '#777', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                          📜 DEMO SHOWCASE
                        </span>
                      )}

                      {/* Verification Status Badge */}
                      {verificationStatus === 'verified_genuine' ? (
                        <span style={{ fontSize: 11, background: '#E0F3EA', color: '#1B7F5E', padding: '2px 8px', borderRadius: 4, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle size={12} />
                          VERIFIED GENUINE
                        </span>
                      ) : verificationStatus === 'flagged_fake' ? (
                        <span style={{ fontSize: 11, background: '#FFF0F0', color: '#B02A37', padding: '2px 8px', borderRadius: 4, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <ShieldAlert size={12} />
                          FLAGGED FAKE
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, background: '#FFF3CD', color: '#856404', padding: '2px 8px', borderRadius: 4, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <AlertTriangle size={12} />
                          UNVERIFIED (REQUIRES CHECK)
                        </span>
                      )}

                      {/* Order Status Badge */}
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 4,
                          textTransform: 'uppercase',
                          backgroundColor:
                            order.status === 'delivered' ? '#E0F3EA' : order.status === 'confirmed' ? '#E8F0FE' : '#FFF3CD',
                          color:
                            order.status === 'delivered' ? '#1B7F5E' : order.status === 'confirmed' ? '#1A73E8' : '#856404',
                        }}
                      >
                        {order.status}
                      </span>

                      {order.referredByCode && (
                        <span style={{ fontSize: 11, background: '#FAF2E9', color: '#1B7F5E', border: '1px solid #D4AF37', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                          Ref: {order.referredByCode}
                        </span>
                      )}

                      {order.isWholesaleLead && (
                        <span style={{ fontSize: 11, background: '#FFE08A', color: '#856404', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                          👑 Wholesale Lead ({order.wholesaleReason})
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 12.5, color: '#555', marginTop: 4 }}>
                      Placed: <strong>{new Date(order.createdAt).toLocaleString()}</strong> • Customer: <strong style={{ color: '#2B1810' }}>{order.shippingAddress?.fullName}</strong> ({order.shippingAddress?.phone})
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#8B3A3A' }}>
                      NPR {(order.totalAmount || 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', fontWeight: 600 }}>
                      Payment: <strong>{(order.paymentMethod || 'cod').toUpperCase()}</strong> {order.paymentDetails ? `(${order.paymentDetails})` : ''}
                    </div>
                  </div>
                </div>

                {/* Fraud Verification & Concierge Shield Banner */}
                <div
                  style={{
                    background: fraudRisk === 'high' ? '#FFF0F0' : fraudRisk === 'medium' ? '#FFFDF0' : '#FAF9F6',
                    border: `1px solid ${fraudRisk === 'high' ? '#F5C2C7' : fraudRisk === 'medium' ? '#FFE08A' : '#EADCCE'}`,
                    padding: '8px 12px',
                    borderRadius: 6,
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: fraudRisk === 'high' ? '#B02A37' : '#2B1810' }}>
                    <ShieldCheck size={14} color={fraudRisk === 'high' ? '#B02A37' : '#1B7F5E'} />
                    <span>
                      <strong>Fraud Risk Assessment:</strong>{' '}
                      <span
                        style={{
                          fontWeight: 700,
                          color: fraudRisk === 'high' ? '#B02A37' : fraudRisk === 'medium' ? '#856404' : '#1B7F5E',
                          textTransform: 'uppercase',
                        }}
                      >
                        {fraudRisk} risk (Score: {fraudScore}/100)
                      </span>
                    </span>
                    <span style={{ color: '#777' }}>• {order.verification?.verificationNotes || 'Address & Phone format checked'}</span>
                  </div>

                  {order.verification?.verifiedBy && (
                    <div style={{ fontSize: 11, color: '#666' }}>
                      Verified by {order.verification.verifiedBy} at {new Date(order.verification.verifiedAt || '').toLocaleTimeString()}
                    </div>
                  )}
                </div>

                {/* Shipping & Items Summary */}
                <div style={{ background: '#FAF2E9', padding: '12px 14px', borderRadius: 8, fontSize: 12.5, color: '#333' }}>
                  <div style={{ marginBottom: 6 }}>
                    <strong>Ordered Items:</strong>{' '}
                    {order.items && order.items.length > 0
                      ? order.items
                          .map((i) => `${i.product?.title?.en || i.product?.title?.np || 'Garment'} (${i.selectedSize || 'Free'} × ${i.quantity || 1})`)
                          .join(', ')
                      : 'No items detailed'}
                  </div>
                  <div>
                    <strong>Shipping Address:</strong> {order.shippingAddress?.addressLine}, {order.shippingAddress?.city}, {order.shippingAddress?.province}
                    {order.notes && <span style={{ color: '#8B3A3A', fontWeight: 600, marginLeft: 8 }}>[Note: {order.notes}]</span>}
                  </div>
                </div>

                {/* Profit Formula Breakdown for this Order */}
                <div
                  style={{
                    background: '#FFFDF9',
                    border: '1px dashed #D4C5B9',
                    padding: '8px 12px',
                    borderRadius: 6,
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', color: '#555' }}>
                    <span>Revenue: <strong>NPR {(order.totalAmount || 0).toLocaleString()}</strong></span>
                    <span>Cost: <strong style={{ color: '#8B3A3A' }}>−NPR {orderBuyingCost.toLocaleString()}</strong></span>
                    {order.referredByCode && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: order.referralCommissionCredited ? '#E0F3EA' : '#FFF3CD', color: order.referralCommissionCredited ? '#1B7F5E' : '#856404', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                        🛍️ Creator {order.referredByCode}: NPR {orderTargetReferralFee} {order.referralCommissionCredited ? '(✓ Cut Credited)' : '(Auto-Credits on Verify)'}
                      </span>
                    )}
                    <span>Est. Courier: <strong>−NPR 150</strong></span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: profitResult.netProfit > 0 ? '#1B7F5E' : '#B02A37' }}>
                    Calculated Net Profit: NPR {profitResult.netProfit.toLocaleString()} ({profitResult.marginPercent}%)
                  </div>
                </div>

                {/* Dropshipping Supplier Routing & Fulfillment Section */}
                <div
                  style={{
                    background: order.assignedSupplier ? '#F0F9F5' : '#FCF8F4',
                    border: `1.5px solid ${order.assignedSupplier ? '#A3E2C3' : '#E8D9CD'}`,
                    borderRadius: 8,
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Building2 size={16} color={order.assignedSupplier ? '#1B7F5E' : '#8B3A3A'} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#2B1810' }}>
                        Dropshipping Supplier Routing:
                      </span>
                      {order.assignedSupplier ? (
                        <span
                          style={{
                            fontSize: 11,
                            background: order.assignedSupplier.status === 'dispatched' ? '#E0F3EA' : '#FFF3CD',
                            color: order.assignedSupplier.status === 'dispatched' ? '#1B7F5E' : '#856404',
                            border: `1px solid ${order.assignedSupplier.status === 'dispatched' ? '#A3E2C3' : '#FFE08A'}`,
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontWeight: 800,
                          }}
                        >
                          {order.assignedSupplier.status === 'dispatched' ? 'DISPATCH SLIP ROUTED ✓' : 'SUPPLIER ASSIGNED'}
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, background: '#FFF3CD', color: '#856404', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                          PENDING SUPPLIER ALLOCATION
                        </span>
                      )}
                    </div>

                    {order.assignedSupplier && (
                      <div style={{ fontSize: 12, color: '#555' }}>
                        Assigned: <strong style={{ color: '#2B1810' }}>{order.assignedSupplier.name}</strong> ({order.assignedSupplier.location}) • Tel: <strong>{order.assignedSupplier.phone}</strong>
                      </div>
                    )}
                  </div>

                  {/* If assigned, show 1-click WhatsApp Dispatch slip generator and copy buttons */}
                  {order.assignedSupplier ? (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <button
                        onClick={() => handleSendSupplierWhatsApp(order, order.assignedSupplier!, orderBuyingCost)}
                        style={{
                          padding: '7px 14px',
                          backgroundColor: '#25D366',
                          color: '#FFF',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: '0 2px 6px rgba(37,211,102,0.25)',
                        }}
                      >
                        <Send size={13} />
                        <span>1-Click WhatsApp Seller Dispatch</span>
                      </button>

                      <button
                        onClick={() => handleCopySlip(order, order.assignedSupplier!, orderBuyingCost)}
                        style={{
                          padding: '7px 12px',
                          backgroundColor: '#FFF',
                          color: '#2B1810',
                          border: '1px solid #D4C5B9',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        {copiedOrderId === order.id ? <Check size={13} color="#1B7F5E" /> : <Copy size={13} />}
                        <span>{copiedOrderId === order.id ? 'Copied Slip!' : 'Copy Dispatch Slip'}</span>
                      </button>

                      <button
                        onClick={() => {
                          const nextStatus = order.assignedSupplier!.status === 'dispatched' ? 'assigned' : 'dispatched';
                          assignSupplier(order.id, {
                            ...order.assignedSupplier!,
                            status: nextStatus,
                          });
                          toast(`Supplier status updated to ${nextStatus}`, 'success');
                        }}
                        style={{
                          padding: '7px 12px',
                          backgroundColor: '#FAF2E9',
                          color: '#666',
                          border: '1px solid #D4C5B9',
                          borderRadius: 6,
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        Toggle Status ({order.assignedSupplier.status || 'assigned'})
                      </button>

                      <button
                        onClick={() => setActiveDropdownOrder(activeDropdownOrder === order.id ? null : order.id)}
                        style={{
                          padding: '7px 10px',
                          background: 'transparent',
                          color: '#8B3A3A',
                          border: 'none',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                      >
                        {activeDropdownOrder === order.id ? 'Cancel Change' : 'Change Supplier'}
                      </button>
                    </div>
                  ) : null}

                  {/* Supplier Selector Dropdown & Custom Form (shown if unassigned OR user clicked Change Supplier) */}
                  {(!order.assignedSupplier || activeDropdownOrder === order.id) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#FFF', padding: 10, borderRadius: 6, border: '1px solid #EADCCE' }}>
                      <div style={{ fontSize: 12, color: '#555', fontWeight: 600 }}>
                        Select verified supplier/atelier to receive customer delivery location and fulfill order #{order.orderNumber}:
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'custom') {
                              setCustomSupplierForms((prev) => ({
                                ...prev,
                                [order.id]: prev[order.id] || { name: '', phone: '', location: '' },
                              }));
                            } else if (val) {
                              const matched = PRESET_SUPPLIERS.find((s) => s.id === val);
                              if (matched) {
                                assignSupplier(order.id, {
                                  ...matched,
                                  assignedAt: new Date().toISOString(),
                                  status: 'assigned',
                                });
                                setActiveDropdownOrder(null);
                                toast(`Assigned ${matched.name} to order #${order.orderNumber}`, 'success');
                              }
                            }
                          }}
                          style={{
                            padding: '7px 10px',
                            borderRadius: 6,
                            border: '1px solid #D4C5B9',
                            fontSize: 12,
                            backgroundColor: '#FFF',
                            color: '#2B1810',
                            outline: 'none',
                            minWidth: 260,
                          }}
                        >
                          <option value="" disabled>-- Select Verified Dropship Supplier --</option>
                          {PRESET_SUPPLIERS.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.location}) — +977 {s.phone}
                            </option>
                          ))}
                          <option value="custom">➕ Enter Custom Supplier / Local Shop...</option>
                        </select>
                      </div>

                      {/* Custom Supplier Inline Form */}
                      {customSupplierForms[order.id] && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 4 }}>
                          <input
                            type="text"
                            placeholder="Supplier / Atelier Name"
                            value={customSupplierForms[order.id]?.name || ''}
                            onChange={(e) =>
                              setCustomSupplierForms((prev) => ({
                                ...prev,
                                [order.id]: { ...prev[order.id], name: e.target.value },
                              }))
                            }
                            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #D4C5B9', fontSize: 12, flex: 1, minWidth: 150 }}
                          />
                          <input
                            type="text"
                            placeholder="Phone (e.g. 9801234567)"
                            value={customSupplierForms[order.id]?.phone || ''}
                            onChange={(e) =>
                              setCustomSupplierForms((prev) => ({
                                ...prev,
                                [order.id]: { ...prev[order.id], phone: e.target.value },
                              }))
                            }
                            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #D4C5B9', fontSize: 12, width: 150 }}
                          />
                          <input
                            type="text"
                            placeholder="Location (e.g. Asan, Kathmandu)"
                            value={customSupplierForms[order.id]?.location || ''}
                            onChange={(e) =>
                              setCustomSupplierForms((prev) => ({
                                ...prev,
                                [order.id]: { ...prev[order.id], location: e.target.value },
                              }))
                            }
                            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #D4C5B9', fontSize: 12, flex: 1, minWidth: 140 }}
                          />
                          <button
                            onClick={() => {
                              const f = customSupplierForms[order.id];
                              if (!f || !f.name.trim() || !f.phone.trim()) {
                                toast('Please enter supplier name and phone number', 'error');
                                return;
                              }
                              assignSupplier(order.id, {
                                id: `custom-${Date.now()}`,
                                name: f.name.trim(),
                                phone: f.phone.trim(),
                                location: f.location.trim() || 'Nepal',
                                assignedAt: new Date().toISOString(),
                                status: 'assigned',
                              });
                              setActiveDropdownOrder(null);
                              toast(`Custom supplier "${f.name}" assigned to order #${order.orderNumber}`, 'success');
                            }}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#8B3A3A',
                              color: '#FFF',
                              border: 'none',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Save & Assign
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions Row */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', borderTop: '1px solid #F0E6D8', paddingTop: 12 }}>
                  {/* Verify Genuine */}
                  <button
                    onClick={() => verifyOrder(order.id, 'verified_genuine', 'Verified genuine customer by Admin', 'phone_call')}
                    style={{
                      padding: '7px 14px',
                      backgroundColor: verificationStatus === 'verified_genuine' ? '#135F46' : '#1B7F5E',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      boxShadow: '0 2px 6px rgba(27,127,94,0.2)',
                    }}
                  >
                    <CheckCircle size={14} />
                    <span>{verificationStatus === 'verified_genuine' ? 'Verified Genuine ✓' : 'Verify Genuine'}</span>
                  </button>

                  {/* Flag Fake / Suspicious */}
                  {verificationStatus !== 'flagged_fake' && (
                    <button
                      onClick={() => verifyOrder(order.id, 'flagged_fake', 'Flagged suspicious/fake by Admin', 'manual_review')}
                      style={{
                        padding: '7px 12px',
                        backgroundColor: '#FFF0F0',
                        color: '#B02A37',
                        border: '1px solid #F5C2C7',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <ShieldAlert size={14} />
                      <span>Flag Fake</span>
                    </button>
                  )}

                  {/* Mark Shipped */}
                  <button
                    onClick={() => updateOrderStatus(order.id, 'shipped')}
                    style={{
                      padding: '7px 12px',
                      backgroundColor: order.status === 'shipped' ? '#5A2424' : '#8B3A3A',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Truck size={14} />
                    <span>Mark Shipped</span>
                  </button>

                  {/* Mark Delivered */}
                  <button
                    onClick={() => updateOrderStatus(order.id, 'delivered')}
                    style={{
                      padding: '7px 12px',
                      backgroundColor: order.status === 'delivered' ? '#1A100B' : '#2B1810',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <PackageCheck size={14} />
                    <span>Mark Delivered</span>
                  </button>

                  {/* WhatsApp Customer */}
                  <a
                    href={`https://wa.me/977${cleanPhone}?text=${waMsg}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '7px 12px',
                      backgroundColor: '#25D366',
                      color: '#FFF',
                      textDecoration: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <MessageCircle size={14} />
                    <span>WhatsApp</span>
                  </a>

                  {/* Direct Phone Call */}
                  {cleanPhone && (
                    <a
                      href={`tel:+977${cleanPhone}`}
                      style={{
                        padding: '7px 12px',
                        backgroundColor: '#FAF2E9',
                        color: '#2B1810',
                        border: '1px solid #D4C5B9',
                        textDecoration: 'none',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <PhoneCall size={14} color="#8B3A3A" />
                      <span>Call {cleanPhone}</span>
                    </a>
                  )}

                  {/* Delete Order */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOrderToDelete(order);
                    }}
                    title="Delete Order"
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#FFF0F0',
                      color: '#B02A37',
                      border: '1.5px solid #F5C2C7',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      marginLeft: 'auto',
                      minHeight: '34px',
                      touchAction: 'manipulation',
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Touch-Friendly Order Delete Confirmation Modal */}
      {orderToDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 999999,
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              maxWidth: 420,
              width: '100%',
              padding: 22,
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              border: '2px solid #F5C2C7',
              animation: 'fadeIn 0.15s ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: '#FEE2E2',
                  color: '#DC2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Trash2 size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#2B1810' }}>
                  Delete Order #{orderToDelete.orderNumber}?
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6B564C' }}>
                  यो अर्डर स्टोर डेटाबेसबाट सधैंका लागि हट्नेछ।
                </p>
              </div>
            </div>

            <div
              style={{
                padding: '12px 14px',
                background: '#FAF2E9',
                borderRadius: 10,
                border: '1px solid #EADCCE',
                marginBottom: 16,
                fontSize: 12.5,
                color: '#2B1810',
                lineHeight: 1.5,
              }}
            >
              <div><strong>ग्राहक:</strong> {(orderToDelete as any).customerName || orderToDelete.customerLoginName || orderToDelete.shippingAddress?.fullName || 'N/A'} ({orderToDelete.shippingAddress?.phone || 'No phone'})</div>
              <div><strong>रकम:</strong> NPR {(orderToDelete.totalAmount || 0).toLocaleString()} • {orderToDelete.items?.length || 0} items</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  deleteOrder(orderToDelete.id);
                  setOrderToDelete(null);
                }}
                style={{
                  width: '100%',
                  height: 46,
                  borderRadius: 10,
                  background: '#DC2626',
                  color: '#FFF',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  touchAction: 'manipulation',
                }}
              >
                <Trash2 size={16} />
                <span>Permanently Delete Order</span>
              </button>

              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                style={{
                  width: '100%',
                  height: 42,
                  borderRadius: 10,
                  background: '#FFF',
                  color: '#6B564C',
                  border: '1.5px solid #D1D5DB',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
