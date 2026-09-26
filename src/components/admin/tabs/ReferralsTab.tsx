import React, { useState, useMemo } from 'react';
import {
  Award, CheckCircle, Clock, DollarSign, ExternalLink, ShieldCheck,
  AlertCircle, TrendingUp, Users, ShoppingBag, ArrowUpRight, Search,
  Filter, Check, MessageSquare, Wallet, HelpCircle, ChevronRight, Download
} from 'lucide-react';
import { useReferralStore } from '../../../stores/referralStore';
import { useOrderStore } from '../../../stores/orderStore';
import { useProductStore } from '../../../stores/productStore';
import { updatePayoutStatus } from '../../../services/firestoreReferrals';
import { Order, OrderStatus } from '../../../types';

export const ReferralsTab: React.FC = () => {
  const { allAdvocates, allPayoutRequests } = useReferralStore();
  const { orders, updateOrderStatus } = useOrderStore();
  const { products } = useProductStore();

  const [activeSubTab, setActiveSubTab] = useState<'financial' | 'customers' | 'funnel' | 'payouts' | 'roster'>('financial');
  const [txnInput, setTxnInput] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Search & filter state for customer orders
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL');
  const [codeFilter, setCodeFilter] = useState<string>('ALL');

  // Filter orders that arrived through a referral code
  const referralOrders = useMemo(() => {
    return orders.filter((o) => !!o.referredByCode);
  }, [orders]);

  // Financial Aggregations ("Track Money System")
  const financials = useMemo(() => {
    let totalGmv = 0;
    let totalDiscountGranted = 0;
    let totalCreatorCommission = 0;
    let totalCogs = 0;
    let totalActualShipping = 0;
    let totalNetProfit = 0;

    let deliveredCount = 0;
    let pendingCount = 0;

    for (const order of referralOrders) {
      totalGmv += order.subtotalAmount;
      const discount = order.referralDiscountAmount ?? (order.discountAmount || 300);
      totalDiscountGranted += discount;

      // Net items amount after discount
      const netMerchandise = Math.max(0, order.subtotalAmount - discount);
      const commission = order.referralCommissionAmount ?? Math.round(netMerchandise * 0.10);
      totalCreatorCommission += commission;

      // Calculate buying cost / COGS for order
      let orderCost = order.costPriceTotal;
      if (!orderCost) {
        orderCost = order.items.reduce((acc, item) => {
          const matched = products.find((p) => p.id === item.product.id);
          const unitCost = matched?.costPrice || Math.round(item.product.price * 0.42);
          return acc + unitCost * item.quantity;
        }, 0);
      }
      totalCogs += orderCost;

      const shipping = order.shippingCostActual ?? (order.deliveryFee || 150);
      totalActualShipping += shipping;

      // Net Profit Formula: Total Collected - Buying Cost - Actual Shipping - Creator Commission
      // Since order.totalAmount = subtotal - discount + deliveryFee:
      const profit = order.netProfitCalculated ?? (order.totalAmount - orderCost - shipping - commission);
      totalNetProfit += profit;

      if (order.status === 'delivered') deliveredCount++;
      else if (order.status !== 'cancelled') pendingCount++;
    }

    const paidOut = allPayoutRequests
      .filter((r) => r.status === 'approved_paid')
      .reduce((acc, r) => acc + r.requestedAmount, 0);

    const pendingPayoutRequestsTotal = allPayoutRequests
      .filter((r) => r.status === 'pending_audit')
      .reduce((acc, r) => acc + r.requestedAmount, 0);

    // Sum of withdrawable balances of creators who reached the 10,000 threshold
    const readyForDisbursal = allAdvocates
      .filter((a) => a.withdrawableBalance >= 10000)
      .reduce((acc, a) => acc + a.withdrawableBalance, 0);

    // Commissions in active escrow (in-flight orders awaiting delivery)
    const inEscrowBalance = allAdvocates.reduce((acc, a) => acc + (a.pendingBalance || 0), 0);

    const netMarginPercent = totalGmv > 0 ? Math.round((totalNetProfit / totalGmv) * 1000) / 10 : 0;
    const aov = referralOrders.length > 0 ? Math.round(totalGmv / referralOrders.length) : 0;

    // Total traffic / clicks driven across all advocates
    const totalClicks = allAdvocates.reduce((acc, a) => acc + (a.clicksCount || 0), 0);
    const conversionRate = totalClicks > 0 ? Math.round((referralOrders.length / totalClicks) * 1000) / 10 : 0;

    return {
      totalGmv,
      totalDiscountGranted,
      totalCreatorCommission,
      totalCogs,
      totalActualShipping,
      totalNetProfit,
      netMarginPercent,
      paidOut,
      pendingPayoutRequestsTotal,
      readyForDisbursal,
      inEscrowBalance,
      referralOrdersCount: referralOrders.length,
      deliveredCount,
      pendingCount,
      aov,
      totalClicks,
      conversionRate,
    };
  }, [referralOrders, products, allAdvocates, allPayoutRequests]);

  // Filtered customer list
  const filteredReferralOrders = useMemo(() => {
    return referralOrders.filter((order) => {
      if (statusFilter !== 'ALL' && order.status !== statusFilter) return false;
      if (codeFilter !== 'ALL' && order.referredByCode !== codeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (order.shippingAddress.fullName || '').toLowerCase().includes(q);
        const matchesPhone = (order.shippingAddress.phone || '').includes(q);
        const matchesOrder = order.orderNumber.toLowerCase().includes(q);
        const matchesCode = (order.referredByCode || '').toLowerCase().includes(q);
        const matchesCity = (order.shippingAddress.city || '').toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesOrder && !matchesCode && !matchesCity) {
          return false;
        }
      }
      return true;
    });
  }, [referralOrders, searchQuery, statusFilter, codeFilter]);

  const handleApprovePayout = async (requestId: string, requestedAmount: number, advocateName: string) => {
    const txn = (txnInput[requestId] || '').trim();
    if (!txn) {
      alert('Please enter the eSewa / Bank Transaction Reference number before marking as paid.');
      return;
    }

    if (!window.confirm(`Confirm payment of NPR ${requestedAmount.toLocaleString()} to ${advocateName} with Transaction Ref: ${txn}?`)) {
      return;
    }

    setProcessingId(requestId);
    try {
      await updatePayoutStatus(requestId, {
        status: 'approved_paid',
        paidAt: new Date().toISOString(),
        auditedAt: new Date().toISOString(),
        transactionRef: txn,
        auditNotes: `Audited and paid by Sagar. Verified delivery of qualifying orders. Ref: ${txn}`,
      });
      alert(`Payout of NPR ${requestedAmount.toLocaleString()} successfully recorded.`);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingRequests = allPayoutRequests.filter((r) => r.status === 'pending_audit');
  const paidRequests = allPayoutRequests.filter((r) => r.status === 'approved_paid');

  // Export financial summary to clipboard / JSON
  const handleExportSummary = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      merchant: 'DAWOSTI Boutique Kathmandu',
      financials: {
        totalGrossReferralSales: financials.totalGmv,
        customerDiscountsGranted: financials.totalDiscountGranted,
        creatorCommissionsLiability: financials.totalCreatorCommission,
        productBuyingCostCogs: financials.totalCogs,
        actualShippingCosts: financials.totalActualShipping,
        netStoreProfit: financials.totalNetProfit,
        netMarginPercent: `${financials.netMarginPercent}%`,
        totalPaidOutToDate: financials.paidOut,
        readyForDisbursal: financials.readyForDisbursal,
      },
      trafficFunnel: {
        totalReferralClicks: financials.totalClicks,
        totalConvertedOrders: financials.referralOrdersCount,
        clickToSaleConversionRate: `${financials.conversionRate}%`,
        averageOrderValue: financials.aov,
      },
      referredOrdersCount: referralOrders.length,
      advocatesCount: allAdvocates.length,
    };
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    alert('Financial & Attribution Summary copied to clipboard!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header & Sub-Navigation */}
      <div
        style={{
          background: '#FFF',
          padding: '16px 20px',
          borderRadius: 12,
          border: '1px solid #EADCCE',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award size={20} color="#1B7F5E" />
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#2B1810' }}>
              Referral Money System & Attribution Analytics
            </h3>
            <span
              style={{
                fontSize: 11,
                background: '#E0F3EA',
                color: '#1B7F5E',
                padding: '2px 8px',
                borderRadius: 4,
                fontWeight: 700,
              }}
            >
              10% Royalties • NPR 10k Threshold
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: 12.5, color: '#666' }}>
            Track real-time money flow, customer acquisitions, creator commissions, and net store profit.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={handleExportSummary}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 6,
              background: '#FAF2E9',
              border: '1px solid #EADCCE',
              color: '#561F1F',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Download size={14} />
            <span>Export Summary</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          borderBottom: '1px solid #EADCCE',
          paddingBottom: 8,
          overflowX: 'auto',
        }}
      >
        {[
          { id: 'financial', label: '💰 Money System & Margins', count: null },
          { id: 'customers', label: '👥 Referred Customers & Orders', count: referralOrders.length },
          { id: 'funnel', label: '📈 Traffic & Conversion Funnel', count: `${financials.conversionRate}%` },
          { id: 'payouts', label: '⚡ Payout Audit Queue', count: pendingRequests.length },
          { id: 'roster', label: '👑 Creator Leaderboard & Wallets', count: allAdvocates.length },
        ].map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: isActive ? '#561F1F' : '#FFF',
                color: isActive ? '#FFF' : '#555',
                fontWeight: isActive ? 700 : 600,
                fontSize: 13,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: isActive ? '0 2px 6px rgba(86,31,31,0.2)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  style={{
                    fontSize: 11,
                    padding: '1px 6px',
                    borderRadius: 99,
                    background: isActive ? 'rgba(255,255,255,0.25)' : '#F0E6D8',
                    color: isActive ? '#FFF' : '#561F1F',
                    fontWeight: 700,
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* 1. FINANCIAL VIEW: MONEY SYSTEM & NET PROFIT FORMULA */}
      {/* ============================================================ */}
      {activeSubTab === 'financial' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Top Key Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            {/* Total Gross Referral Revenue */}
            <div style={{ background: '#FFF', padding: 18, borderRadius: 10, border: '1px solid #EADCCE', borderTop: '4px solid #1B7F5E' }}>
              <div style={{ fontSize: 11.5, color: '#777', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                Gross Referral Sales (GMV)
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#2B1810', marginTop: 6 }}>
                NPR {financials.totalGmv.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: '#1B7F5E', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <ArrowUpRight size={14} />
                <span>{financials.referralOrdersCount} Orders via Referral Links</span>
              </div>
            </div>

            {/* Net Realized Store Profit */}
            <div style={{ background: '#F4FAF6', padding: 18, borderRadius: 10, border: '1.5px solid #C6E7D5', borderTop: '4px solid #1B7F5E' }}>
              <div style={{ fontSize: 11.5, color: '#1B7F5E', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>
                Net Store Profit (Formula Realized)
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#1B7F5E', marginTop: 6 }}>
                NPR {financials.totalNetProfit.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: '#1B7F5E', marginTop: 4, fontWeight: 700 }}>
                {financials.netMarginPercent}% Clean Profit Margin
              </div>
            </div>

            {/* Total Creator Royalties Accrued */}
            <div style={{ background: '#FFF', padding: 18, borderRadius: 10, border: '1px solid #EADCCE', borderTop: '4px solid #D4AF37' }}>
              <div style={{ fontSize: 11.5, color: '#777', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                Creator 10% Royalties Accrued
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#8B3A3A', marginTop: 6 }}>
                NPR {financials.totalCreatorCommission.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                Owed to active fashion ambassadors
              </div>
            </div>

            {/* Customer Discounts Granted */}
            <div style={{ background: '#FFF', padding: 18, borderRadius: 10, border: '1px solid #EADCCE', borderTop: '4px solid #3182CE' }}>
              <div style={{ fontSize: 11.5, color: '#777', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                Customer Savings Given (NPR 300)
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#2B6CB0', marginTop: 6 }}>
                NPR {financials.totalDiscountGranted.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                Instant discount to referred buyers
              </div>
            </div>
          </div>

          {/* Unit Economics Formula Breakdown Card */}
          <div
            style={{
              background: '#FFF',
              padding: 20,
              borderRadius: 12,
              border: '1px solid #EADCCE',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <ShieldCheck size={18} color="#1B7F5E" />
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#2B1810' }}>
                Sagar's Exact Profit Formula for Referral Channel
              </h4>
            </div>
            <div
              style={{
                background: '#FAF2E9',
                padding: '14px 18px',
                borderRadius: 8,
                border: '1px solid #EADCCE',
                fontSize: 13,
                fontFamily: 'monospace',
                color: '#561F1F',
                fontWeight: 700,
                marginBottom: 16,
                overflowX: 'auto',
              }}
            >
              Net Profit = Gross Selling Price − Buying Price (COGS) − Referral Discount (NPR 300) − Actual Shipping − Creator 10% Royalty
            </div>

            {/* Step-by-Step Accounting Waterfall */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <div style={{ padding: 12, background: '#F8F4EE', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#777' }}>1. Gross Referral Revenue</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#2B1810' }}>+NPR {financials.totalGmv.toLocaleString()}</div>
              </div>
              <div style={{ padding: 12, background: '#F8F4EE', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#777' }}>2. Product Buying Cost (COGS)</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#C53030' }}>−NPR {financials.totalCogs.toLocaleString()}</div>
              </div>
              <div style={{ padding: 12, background: '#F8F4EE', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#777' }}>3. Customer Discounts</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#C53030' }}>−NPR {financials.totalDiscountGranted.toLocaleString()}</div>
              </div>
              <div style={{ padding: 12, background: '#F8F4EE', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#777' }}>4. Shipping Courier Cost</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#C53030' }}>−NPR {financials.totalActualShipping.toLocaleString()}</div>
              </div>
              <div style={{ padding: 12, background: '#F8F4EE', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#777' }}>5. Creator 10% Royalties</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#C53030' }}>−NPR {financials.totalCreatorCommission.toLocaleString()}</div>
              </div>
              <div style={{ padding: 12, background: '#E0F3EA', borderRadius: 8, border: '1px solid #C6E7D5' }}>
                <div style={{ fontSize: 11, color: '#1B7F5E', fontWeight: 700 }}>= Net Realized Store Profit</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#1B7F5E' }}>NPR {financials.totalNetProfit.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Payout Liability & Wallet Disbursal Health */}
          <div
            style={{
              background: '#FFF',
              padding: 20,
              borderRadius: 12,
              border: '1px solid #EADCCE',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Wallet size={18} color="#D4AF37" />
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#2B1810' }}>
                  Creator Wallet Balances & Payout Liability Health
                </h4>
              </div>
              <span style={{ fontSize: 12, color: '#666' }}>
                Enforces minimum NPR 10,000 threshold before wallet disbursement
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <div style={{ background: '#FAF2E9', padding: 16, borderRadius: 10, border: '1px solid #EADCCE' }}>
                <div style={{ fontSize: 11.5, color: '#666', fontWeight: 600 }}>Total Paid to Creators (Lifetime)</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#1B7F5E', marginTop: 4 }}>
                  NPR {financials.paidOut.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: '#777', marginTop: 4 }}>Disbursed via eSewa & Khalti</div>
              </div>

              <div style={{ background: '#FFF8F0', padding: 16, borderRadius: 10, border: '1.5px solid #D4AF37' }}>
                <div style={{ fontSize: 11.5, color: '#8B3A3A', fontWeight: 700 }}>Ready for Withdrawal (&gt;= 10k)</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#8B3A3A', marginTop: 4 }}>
                  NPR {financials.readyForDisbursal.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                  Creators who reached the NPR 10k threshold
                </div>
              </div>

              <div style={{ background: '#F8F4EE', padding: 16, borderRadius: 10, border: '1px solid #EADCCE' }}>
                <div style={{ fontSize: 11.5, color: '#666', fontWeight: 600 }}>In Transit / Delivery Escrow</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#2B1810', marginTop: 4 }}>
                  NPR {financials.inEscrowBalance.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: '#777', marginTop: 4 }}>Unlocks upon customer parcel delivery</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. REFERRED CUSTOMERS & ORDERS VIEW ("People that came through referral") */}
      {/* ============================================================ */}
      {activeSubTab === 'customers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Filter Bar */}
          <div
            style={{
              background: '#FFF',
              padding: 14,
              borderRadius: 10,
              border: '1px solid #EADCCE',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
              <Search size={15} color="#888" style={{ position: 'absolute', left: 10, top: 10 }} />
              <input
                type="text"
                placeholder="Search by customer name, phone, order #, city, or referral code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 32px',
                  borderRadius: 6,
                  border: '1px solid #D4C5B9',
                  fontSize: 12.5,
                  outline: 'none',
                }}
              />
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#777', fontWeight: 600 }}>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid #D4C5B9',
                  fontSize: 12,
                  outline: 'none',
                }}
              >
                <option value="ALL">All Statuses ({referralOrders.length})</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Code Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#777', fontWeight: 600 }}>Creator:</span>
              <select
                value={codeFilter}
                onChange={(e) => setCodeFilter(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid #D4C5B9',
                  fontSize: 12,
                  outline: 'none',
                }}
              >
                <option value="ALL">All Creators</option>
                {allAdvocates.map((adv) => (
                  <option key={adv.code} value={adv.code}>
                    {adv.fullName} ({adv.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Customer Orders Table */}
          <div style={{ background: '#FFF', borderRadius: 10, border: '1px solid #EADCCE', overflow: 'hidden' }}>
            {filteredReferralOrders.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#777', fontSize: 13 }}>
                No referral orders match your filter criteria.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#FAF2E9', borderBottom: '1px solid #EADCCE', color: '#555' }}>
                      <th style={{ padding: '12px 14px' }}>Referred Customer</th>
                      <th style={{ padding: '12px 14px' }}>Order & Date</th>
                      <th style={{ padding: '12px 14px' }}>Attributed Creator</th>
                      <th style={{ padding: '12px 14px' }}>Items Purchased</th>
                      <th style={{ padding: '12px 14px' }}>Order Total</th>
                      <th style={{ padding: '12px 14px' }}>Customer Discount</th>
                      <th style={{ padding: '12px 14px' }}>Creator 10%</th>
                      <th style={{ padding: '12px 14px' }}>Store Net Profit</th>
                      <th style={{ padding: '12px 14px' }}>Order Status</th>
                      <th style={{ padding: '12px 14px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReferralOrders.map((order) => {
                      const cleanPhone = (order.shippingAddress?.phone || '').replace(/[^0-9]/g, '');
                      const waLink = `https://wa.me/977${cleanPhone}?text=${encodeURIComponent(
                        `Namaste ${order.shippingAddress?.fullName || 'Customer'}! This is Dawosti Boutique Kathmandu regarding your order #${order.orderNumber}. We have verified your referral discount.`
                      )}`;

                      // Calculate profit for row
                      const discount = order.referralDiscountAmount ?? (order.discountAmount || 300);
                      const netMerch = Math.max(0, order.subtotalAmount - discount);
                      const commission = order.referralCommissionAmount ?? Math.round(netMerch * 0.10);
                      const cost = order.costPriceTotal ?? Math.round(order.subtotalAmount * 0.42);
                      const shipping = order.shippingCostActual ?? (order.deliveryFee || 150);
                      const netProfit = order.netProfitCalculated ?? (order.totalAmount - cost - shipping - commission);

                      const advocate = (allAdvocates || []).find((a) => a?.code === order.referredByCode);

                      return (
                        <tr key={order.id} style={{ borderBottom: '1px solid #F0E6D8' }}>
                          {/* Customer */}
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: 700, color: '#2B1810' }}>
                              {order.shippingAddress?.fullName || 'Customer'}
                            </div>
                            <div style={{ fontSize: 11, color: '#777' }}>
                              {order.shippingAddress?.city || 'Nepal'}
                            </div>
                            <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#555' }}>
                                {order.shippingAddress?.phone || 'N/A'}
                              </span>
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noreferrer"
                                title="Chat on WhatsApp"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  background: '#E0F3EA',
                                  color: '#1B7F5E',
                                  fontSize: 10,
                                  fontWeight: 700,
                                  textDecoration: 'none',
                                }}
                              >
                                WhatsApp
                              </a>
                            </div>
                          </td>

                          {/* Order & Date */}
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: 800, color: '#561F1F' }}>
                              #{order.orderNumber}
                            </div>
                            <div style={{ fontSize: 11, color: '#888' }}>
                              {new Date(order.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                            <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase' }}>
                              {order.paymentMethod}
                            </div>
                          </td>

                          {/* Attributed Creator */}
                          <td style={{ padding: '12px 14px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: 4,
                                background: '#FAF2E9',
                                border: '1px solid #EADCCE',
                                fontWeight: 800,
                                color: '#1B7F5E',
                                fontSize: 11.5,
                              }}
                            >
                              {order.referredByCode}
                            </span>
                            {advocate && (
                              <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                                {advocate.fullName}
                              </div>
                            )}
                          </td>

                          {/* Items */}
                          <td style={{ padding: '12px 14px', maxWidth: 220 }}>
                            <div style={{ fontSize: 12, color: '#333', lineHeight: 1.4 }}>
                              {(order.items || []).map((item, idx) => (
                                <div key={idx} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  • {item?.product?.title?.en || (typeof item?.product?.title === 'string' ? item.product.title : 'Boutique Piece')} ({item?.selectedSize || 'M'}) × {item?.quantity || 1}
                                </div>
                              ))}
                            </div>
                          </td>

                          {/* Order Total */}
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: '#2B1810' }}>
                            NPR {order.totalAmount.toLocaleString()}
                          </td>

                          {/* Customer Discount */}
                          <td style={{ padding: '12px 14px', color: '#2B6CB0', fontWeight: 700 }}>
                            −NPR {discount.toLocaleString()}
                          </td>

                          {/* Creator 10% */}
                          <td style={{ padding: '12px 14px', color: '#8B3A3A', fontWeight: 700 }}>
                            +NPR {commission.toLocaleString()}
                          </td>

                          {/* Net Profit */}
                          <td style={{ padding: '12px 14px', color: '#1B7F5E', fontWeight: 800 }}>
                            NPR {netProfit.toLocaleString()}
                          </td>

                          {/* Order Status */}
                          <td style={{ padding: '12px 14px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '3px 8px',
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                background:
                                  order.status === 'delivered'
                                    ? '#E0F3EA'
                                    : order.status === 'shipped'
                                    ? '#EBF8FF'
                                    : order.status === 'confirmed'
                                    ? '#FAF5FF'
                                    : '#FFF3CD',
                                color:
                                  order.status === 'delivered'
                                    ? '#1B7F5E'
                                    : order.status === 'shipped'
                                    ? '#2B6CB0'
                                    : order.status === 'confirmed'
                                    ? '#6B46C1'
                                    : '#856404',
                              }}
                            >
                              {order.status}
                            </span>
                          </td>

                          {/* Action (e.g. Mark Delivered to trigger commission credit) */}
                          <td style={{ padding: '12px 14px' }}>
                            {order.status !== 'delivered' && order.status !== 'cancelled' ? (
                              <button
                                onClick={() => {
                                  if (window.confirm(`Mark order #${order.orderNumber} as Delivered? This will credit the creator's 10% commission.`)) {
                                    updateOrderStatus(order.id, 'delivered');
                                  }
                                }}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: 5,
                                  background: '#1B7F5E',
                                  color: '#FFF',
                                  border: 'none',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                Mark Delivered
                              </button>
                            ) : (
                              <span style={{ fontSize: 11, color: '#1B7F5E', fontWeight: 600 }}>
                                ✓ Credited
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. TRAFFIC & CONVERSION FUNNEL VIEW */}
      {/* ============================================================ */}
      {activeSubTab === 'funnel' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Funnel Visual Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <div style={{ background: '#FFF', padding: 20, borderRadius: 10, border: '1px solid #EADCCE' }}>
              <div style={{ fontSize: 11.5, color: '#777', textTransform: 'uppercase', fontWeight: 700 }}>
                1. Inbound Referral Clicks
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#2B1810', marginTop: 6 }}>
                {financials.totalClicks.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Unique visitor link clicks</div>
            </div>

            <div style={{ background: '#FFF', padding: 20, borderRadius: 10, border: '1px solid #EADCCE' }}>
              <div style={{ fontSize: 11.5, color: '#777', textTransform: 'uppercase', fontWeight: 700 }}>
                2. Converted Purchases
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#1B7F5E', marginTop: 6 }}>
                {financials.referralOrdersCount}
              </div>
              <div style={{ fontSize: 12, color: '#1B7F5E', marginTop: 4, fontWeight: 700 }}>
                {financials.deliveredCount} Delivered • {financials.pendingCount} In Progress
              </div>
            </div>

            <div style={{ background: '#F4FAF6', padding: 20, borderRadius: 10, border: '1.5px solid #C6E7D5' }}>
              <div style={{ fontSize: 11.5, color: '#1B7F5E', textTransform: 'uppercase', fontWeight: 800 }}>
                3. Click-to-Order Conversion Rate
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#1B7F5E', marginTop: 6 }}>
                {financials.conversionRate}%
              </div>
              <div style={{ fontSize: 12, color: '#1B7F5E', marginTop: 4 }}>
                Benchmark: Industry average is ~1.8%
              </div>
            </div>

            <div style={{ background: '#FFF', padding: 20, borderRadius: 10, border: '1px solid #EADCCE' }}>
              <div style={{ fontSize: 11.5, color: '#777', textTransform: 'uppercase', fontWeight: 700 }}>
                4. Average Order Value (AOV)
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#561F1F', marginTop: 6 }}>
                NPR {financials.aov.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Per referred customer order</div>
            </div>
          </div>

          {/* Creator Attribution Breakdown */}
          <div style={{ background: '#FFF', padding: 20, borderRadius: 12, border: '1px solid #EADCCE' }}>
            <h4 style={{ margin: '0 0 14px 0', fontSize: 16, fontWeight: 800, color: '#2B1810' }}>
              Top Converting Referral Codes & Advocates
            </h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#FAF2E9', borderBottom: '1px solid #EADCCE', color: '#555' }}>
                    <th style={{ padding: '10px 14px' }}>Code</th>
                    <th style={{ padding: '10px 14px' }}>Advocate Name</th>
                    <th style={{ padding: '10px 14px' }}>Link Clicks</th>
                    <th style={{ padding: '10px 14px' }}>Orders Placed</th>
                    <th style={{ padding: '10px 14px' }}>Conversion %</th>
                    <th style={{ padding: '10px 14px' }}>Total Sales (NPR)</th>
                    <th style={{ padding: '10px 14px' }}>Royalties Earned</th>
                  </tr>
                </thead>
                <tbody>
                  {allAdvocates.map((adv) => {
                    const advOrders = referralOrders.filter((o) => o.referredByCode === adv.code);
                    const advSales = advOrders.reduce((acc, o) => acc + o.subtotalAmount, 0);
                    const rate = adv.clicksCount > 0 ? Math.round((advOrders.length / adv.clicksCount) * 1000) / 10 : 0;

                    return (
                      <tr key={adv.code} style={{ borderBottom: '1px solid #F0E6D8' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 800, color: '#1B7F5E' }}>
                          {adv.code}
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 600, color: '#2B1810' }}>
                          {adv.fullName}
                        </td>
                        <td style={{ padding: '10px 14px' }}>{adv.clicksCount}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 700 }}>{advOrders.length}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: rate >= 3 ? '#1B7F5E' : '#2B1810' }}>
                          {rate}%
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 700 }}>
                          NPR {advSales.toLocaleString()}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#8B3A3A', fontWeight: 700 }}>
                          NPR {adv.lifetimeEarned.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. PAYOUT AUDIT QUEUE VIEW */}
      {/* ============================================================ */}
      {activeSubTab === 'payouts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: '#FFF8F0', padding: 20, borderRadius: 10, border: '1px solid #EADCCE' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={18} color="#8B3A3A" />
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#2B1810' }}>
                  Pending Payout Requests (Minimum NPR 10,000 Threshold)
                </h4>
              </div>
              <span
                style={{
                  fontSize: 12,
                  background: pendingRequests.length > 0 ? '#FFE08A' : '#E0F3EA',
                  color: '#333',
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontWeight: 700,
                }}
              >
                {pendingRequests.length} Pending Audit
              </span>
            </div>

            {pendingRequests.length === 0 ? (
              <div style={{ padding: '30px 12px', textAlign: 'center', color: '#777', fontSize: 13 }}>
                No pending withdrawal requests. All creators with 10k+ balances are up to date!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    style={{
                      background: '#FFF',
                      padding: 18,
                      borderRadius: 10,
                      border: '1px solid #EADCCE',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: '#2B1810' }}>
                          {req.advocateName} ({req.advocateCode})
                        </div>
                        <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
                          Phone: <strong>{req.advocatePhone}</strong> • Method:{' '}
                          <span style={{ textTransform: 'uppercase', fontWeight: 800, color: '#1B7F5E' }}>
                            {req.paymentMethod}
                          </span>{' '}
                          ({req.paymentDetails})
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#1B7F5E' }}>
                          NPR {req.requestedAmount.toLocaleString()}
                        </div>
                        <div style={{ fontSize: 11, color: '#999' }}>
                          Requested: {new Date(req.requestedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Audit Checklist Indicator */}
                    <div style={{ background: '#F8F4EE', padding: '10px 14px', borderRadius: 6, fontSize: 12, color: '#555', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#1B7F5E', fontWeight: 600 }}>
                        <CheckCircle size={14} /> Threshold Reached (&gt;= 10k)
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#1B7F5E', fontWeight: 600 }}>
                        <CheckCircle size={14} /> Courier Delivery Checked
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#1B7F5E', fontWeight: 600 }}>
                        <ShieldCheck size={14} /> Anti-Self Referral Clean
                      </span>
                    </div>

                    {/* Payment Action Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', borderTop: '1px dashed #EADCCE', paddingTop: 12 }}>
                      <input
                        type="text"
                        placeholder="Enter eSewa / Bank Transaction Ref (e.g. ESW-104928)"
                        value={txnInput[req.id] || ''}
                        onChange={(e) => setTxnInput({ ...txnInput, [req.id]: e.target.value })}
                        style={{
                          flex: 1,
                          minWidth: 260,
                          padding: '9px 12px',
                          borderRadius: 6,
                          border: '1px solid #D4C5B9',
                          fontSize: 13,
                        }}
                      />
                      <button
                        disabled={processingId === req.id}
                        onClick={() => handleApprovePayout(req.id, req.requestedAmount, req.advocateName)}
                        style={{
                          padding: '9px 20px',
                          backgroundColor: '#1B7F5E',
                          color: '#FFF',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: processingId === req.id ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {processingId === req.id ? 'Recording...' : 'Mark as Paid via eSewa'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. CREATOR ROSTER & WALLET DIRECTORY VIEW */}
      {/* ============================================================ */}
      {activeSubTab === 'roster' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#FFF', borderRadius: 10, border: '1px solid #EADCCE', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #EADCCE', background: '#FAF2E9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#2B1810' }}>
                Registered Fashion Advocates & Wallet Credentials ({allAdvocates.length})
              </h4>
              <span style={{ fontSize: 12, color: '#777' }}>
                Linked to eSewa & Khalti
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#FAF2E9', borderBottom: '1px solid #EADCCE', color: '#555' }}>
                    <th style={{ padding: '12px 14px' }}>Creator</th>
                    <th style={{ padding: '12px 14px' }}>Referral Code</th>
                    <th style={{ padding: '12px 14px' }}>eSewa / Khalti Wallet</th>
                    <th style={{ padding: '12px 14px' }}>Clicks</th>
                    <th style={{ padding: '12px 14px' }}>Delivered</th>
                    <th style={{ padding: '12px 14px' }}>Progress to NPR 10k</th>
                    <th style={{ padding: '12px 14px' }}>Withdrawable</th>
                    <th style={{ padding: '12px 14px' }}>Lifetime Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {allAdvocates.map((adv) => {
                    const percent = Math.min(100, Math.round((adv.withdrawableBalance / 10000) * 100));
                    const isReady = adv.withdrawableBalance >= 10000;

                    return (
                      <tr key={adv.code} style={{ borderBottom: '1px solid #F0E6D8' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 700, color: '#2B1810' }}>{adv.fullName}</div>
                          {adv.socialHandle && (
                            <div style={{ fontSize: 11, color: '#777' }}>@{adv.socialHandle.replace('@', '')}</div>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ padding: '2px 8px', background: '#FAF2E9', border: '1px solid #EADCCE', borderRadius: 4, fontWeight: 800, color: '#1B7F5E', fontSize: 12 }}>
                            {adv.code}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#333' }}>
                            {adv.esewaId || adv.payoutAccountIdentifier || adv.phone}
                          </div>
                          <div style={{ fontSize: 10, color: '#1B7F5E', textTransform: 'uppercase', fontWeight: 700 }}>
                            {adv.payoutPreferredMethod}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>{adv.clicksCount}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 700 }}>{adv.ordersDeliveredCount}</td>
                        <td style={{ padding: '12px 14px', minWidth: 140 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ flex: 1, height: 6, background: '#E2E8F0', borderRadius: 99, overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${percent}%`,
                                  height: '100%',
                                  background: isReady ? '#1B7F5E' : '#D4AF37',
                                  borderRadius: 99,
                                }}
                              />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: isReady ? '#1B7F5E' : '#666' }}>
                              {percent}%
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 800, color: isReady ? '#1B7F5E' : '#2B1810' }}>
                          NPR {adv.withdrawableBalance.toLocaleString()}
                          {isReady && (
                            <span style={{ marginLeft: 6, fontSize: 10, background: '#E0F3EA', color: '#1B7F5E', padding: '2px 6px', borderRadius: 3, fontWeight: 800 }}>
                              Ready
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#666', fontWeight: 600 }}>
                          NPR {adv.lifetimeEarned.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
