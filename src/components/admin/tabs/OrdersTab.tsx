import React from 'react';
import { CheckCircle, AlertTriangle, ShieldCheck, Truck, MessageCircle, DollarSign, Clock } from 'lucide-react';
import { useOrderStore } from '../../../stores/orderStore';
import { useProductStore } from '../../../stores/productStore';
import { calculateProfit } from '../../../services/profitCalculator';

export const OrdersTab: React.FC = () => {
  const { orders, verifyOrder, updateOrderStatus } = useOrderStore();
  const { products } = useProductStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Overview Stat Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <div style={{ background: '#FFF8F0', padding: 14, borderRadius: 8, border: '1px solid #EADCCE' }}>
          <div style={{ fontSize: 11, color: '#777', textTransform: 'uppercase' }}>Total Orders</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#2B1810' }}>{orders.length}</div>
        </div>
        <div style={{ background: '#FFF8F0', padding: 14, borderRadius: 8, border: '1px solid #EADCCE' }}>
          <div style={{ fontSize: 11, color: '#777', textTransform: 'uppercase' }}>Pending Verification</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#8B3A3A' }}>
            {orders.filter((o) => !o.acknowledgedByAdmin || o.status === 'pending').length}
          </div>
        </div>
        <div style={{ background: '#FFF8F0', padding: 14, borderRadius: 8, border: '1px solid #EADCCE' }}>
          <div style={{ fontSize: 11, color: '#777', textTransform: 'uppercase' }}>Referral Orders</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1B7F5E' }}>
            {orders.filter((o) => o.referredByCode).length}
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {orders.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#777', background: '#FFF8F0', borderRadius: 8 }}>
            No orders placed yet. Test orders will appear here automatically in real time.
          </div>
        ) : (
          orders.map((order) => {
            // Calculate Buying cost & Net Profit for this specific order
            let orderBuyingCost = 0;
            let orderTargetReferralFee = order.referredByCode ? 500 : 0;

            for (const item of order.items) {
              const matchedProd = products.find((p) => p.id === item.product.id);
              const unitCost = matchedProd?.costPrice || Math.round(item.product.price * 0.4);
              orderBuyingCost += unitCost * item.quantity;
            }

            const profitResult = calculateProfit({
              sellingPrice: order.totalAmount,
              buyingPrice: orderBuyingCost,
              discount: order.discountAmount,
              shippingCharge: 150,
              referralFee: orderTargetReferralFee,
            });

            const cleanPhone = (order.shippingAddress.phone || '').replace(/[^0-9]/g, '');
            const waMsg = encodeURIComponent(
              `Namaste ${order.shippingAddress.fullName}! This is Sagar from Dawosti Boutique regarding your order #${order.orderNumber}. We are preparing your parcel for dispatch.`
            );

            return (
              <div
                key={order.id}
                style={{
                  background: '#FFF',
                  padding: 16,
                  borderRadius: 8,
                  border: '1px solid #EADCCE',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: 16, color: '#2B1810' }}>
                        #{order.orderNumber}
                      </span>
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
                        <span style={{ fontSize: 11, background: '#F0E6D8', color: '#1B7F5E', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                          Ref: {order.referredByCode}
                        </span>
                      )}
                      {order.isWholesaleLead && (
                        <span style={{ fontSize: 11, background: '#FFE08A', color: '#856404', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                          Wholesale Lead
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#777', marginTop: 2 }}>
                      Placed: {new Date(order.createdAt).toLocaleString()} • Customer: <strong>{order.shippingAddress.fullName}</strong> ({order.shippingAddress.phone})
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#2B1810' }}>
                      NPR {order.totalAmount.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase' }}>
                      {order.paymentMethod}
                    </div>
                  </div>
                </div>

                {/* Shipping & Items summary */}
                <div style={{ background: '#FAF2E9', padding: '10px 14px', borderRadius: 6, fontSize: 12.5, color: '#444' }}>
                  <div style={{ marginBottom: 4 }}>
                    <strong>Items:</strong> {order.items.map((i) => `${i.product.title.en} (${i.selectedSize} × ${i.quantity})`).join(', ')}
                  </div>
                  <div>
                    <strong>Shipping Address:</strong> {order.shippingAddress.addressLine}, {order.shippingAddress.city}, {order.shippingAddress.province}
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
                    <span>Revenue: <strong>NPR {order.totalAmount.toLocaleString()}</strong></span>
                    <span>Cost: <strong style={{ color: '#8B3A3A' }}>−NPR {orderBuyingCost.toLocaleString()}</strong></span>
                    {order.referredByCode && (
                      <span>Referral: <strong style={{ color: '#1B7F5E' }}>−NPR {orderTargetReferralFee}</strong></span>
                    )}
                    <span>Est. Courier: <strong>−NPR 150</strong></span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: profitResult.netProfit > 0 ? '#1B7F5E' : '#B02A37' }}>
                    Calculated Net Profit: NPR {profitResult.netProfit.toLocaleString()} ({profitResult.marginPercent}%)
                  </div>
                </div>

                {/* Actions Row */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', borderTop: '1px solid #F0E6D8', paddingTop: 10 }}>
                  <button
                    onClick={() => verifyOrder(order.id, 'verified_genuine', 'Verified genuine customer via Admin', 'phone_call')}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#1B7F5E',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <CheckCircle size={13} />
                    <span>Verify Genuine</span>
                  </button>

                  <button
                    onClick={() => updateOrderStatus(order.id, 'shipped')}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#8B3A3A',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Truck size={13} />
                    <span>Mark Shipped</span>
                  </button>

                  <button
                    onClick={() => updateOrderStatus(order.id, 'delivered')}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#2B1810',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <CheckCircle size={13} />
                    <span>Mark Delivered</span>
                  </button>

                  <a
                    href={`https://wa.me/977${cleanPhone}?text=${waMsg}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#25D366',
                      color: '#FFF',
                      textDecoration: 'none',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <MessageCircle size={13} />
                    <span>WhatsApp Customer</span>
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
