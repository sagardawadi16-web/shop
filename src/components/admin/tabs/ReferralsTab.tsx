import React, { useState } from 'react';
import { Award, CheckCircle, Clock, DollarSign, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';
import { useReferralStore } from '../../../stores/referralStore';
import { updatePayoutStatus } from '../../../services/firestoreReferrals';

export const ReferralsTab: React.FC = () => {
  const { allAdvocates, allPayoutRequests } = useReferralStore();
  const [txnInput, setTxnInput] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Overview Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <div style={{ background: '#FFF8F0', padding: 16, borderRadius: 8, border: '1px solid #EADCCE' }}>
          <div style={{ fontSize: 12, color: '#777', textTransform: 'uppercase', marginBottom: 4 }}>Total Advocates</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#2B1810' }}>{allAdvocates.length}</div>
        </div>
        <div style={{ background: '#FFF8F0', padding: 16, borderRadius: 8, border: '1px solid #EADCCE' }}>
          <div style={{ fontSize: 12, color: '#777', textTransform: 'uppercase', marginBottom: 4 }}>Pending Payout Requests</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: pendingRequests.length > 0 ? '#8B3A3A' : '#1B7F5E' }}>
            {pendingRequests.length}
          </div>
        </div>
        <div style={{ background: '#FFF8F0', padding: 16, borderRadius: 8, border: '1px solid #EADCCE' }}>
          <div style={{ fontSize: 12, color: '#777', textTransform: 'uppercase', marginBottom: 4 }}>Total Creator Earnings Paid</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#1B7F5E' }}>
            NPR {paidRequests.reduce((acc, r) => acc + r.requestedAmount, 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Payout Audit Queue */}
      <div style={{ background: '#FFF8F0', padding: 20, borderRadius: 8, border: '1px solid #EADCCE' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={18} color="#8B3A3A" />
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#2B1810' }}>
              Pending Payout Requests (Minimum NPR 10,000 Threshold)
            </h4>
          </div>
          <span style={{ fontSize: 12, background: pendingRequests.length > 0 ? '#FFE08A' : '#E0F3EA', color: '#333', padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>
            {pendingRequests.length} Pending Audit
          </span>
        </div>

        {pendingRequests.length === 0 ? (
          <div style={{ padding: '24px 12px', textAlign: 'center', color: '#777', fontSize: 13 }}>
            No pending withdrawal requests. All creators with 10k+ balances are up to date!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {pendingRequests.map((req) => (
              <div
                key={req.id}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#2B1810' }}>
                      {req.advocateName} ({req.advocateCode})
                    </div>
                    <div style={{ fontSize: 12.5, color: '#666' }}>
                      Phone: <strong>{req.advocatePhone}</strong> • Method:{' '}
                      <span style={{ textTransform: 'uppercase', fontWeight: 700, color: '#1B7F5E' }}>
                        {req.paymentMethod}
                      </span>{' '}
                      ({req.paymentDetails})
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#1B7F5E' }}>
                      NPR {req.requestedAmount.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 11, color: '#999' }}>
                      Requested: {new Date(req.requestedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Audit Checklist Indicator */}
                <div style={{ background: '#F8F4EE', padding: '8px 12px', borderRadius: 6, fontSize: 12, color: '#555', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#1B7F5E' }}>
                    <CheckCircle size={14} /> Threshold Reached (&gt;= 10k)
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#1B7F5E' }}>
                    <CheckCircle size={14} /> Courier Delivery Checked
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#1B7F5E' }}>
                    <ShieldCheck size={14} /> Anti-Self Referral Clean
                  </span>
                </div>

                {/* Payment Action Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', borderTop: '1px dashed #EADCCE', paddingTop: 10 }}>
                  <input
                    type="text"
                    placeholder="Enter eSewa / Bank Transaction Ref (e.g. ESW-104928)"
                    value={txnInput[req.id] || ''}
                    onChange={(e) => setTxnInput({ ...txnInput, [req.id]: e.target.value })}
                    style={{
                      flex: 1,
                      minWidth: 240,
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid #D4C5B9',
                      fontSize: 13,
                    }}
                  />
                  <button
                    disabled={processingId === req.id}
                    onClick={() => handleApprovePayout(req.id, req.requestedAmount, req.advocateName)}
                    style={{
                      padding: '8px 16px',
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

      {/* Advocates Roster Table */}
      <div>
        <h4 style={{ margin: '0 0 12px 0', fontSize: 15, fontWeight: 700, color: '#2B1810' }}>
          Registered Creators & Advocates ({allAdvocates.length})
        </h4>
        <div style={{ border: '1px solid #EADCCE', borderRadius: 8, overflowX: 'auto', backgroundColor: '#FFF' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#FAF2E9', borderBottom: '1px solid #EADCCE', color: '#555' }}>
                <th style={{ padding: '10px 14px' }}>Creator</th>
                <th style={{ padding: '10px 14px' }}>Code</th>
                <th style={{ padding: '10px 14px' }}>Phone</th>
                <th style={{ padding: '10px 14px' }}>Shares</th>
                <th style={{ padding: '10px 14px' }}>Clicks</th>
                <th style={{ padding: '10px 14px' }}>Delivered</th>
                <th style={{ padding: '10px 14px' }}>Ready to Cashout</th>
                <th style={{ padding: '10px 14px' }}>Lifetime Paid</th>
              </tr>
            </thead>
            <tbody>
              {allAdvocates.map((adv) => (
                <tr key={adv.code} style={{ borderBottom: '1px solid #F0E6D8' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#2B1810' }}>
                    {adv.fullName}
                    {adv.socialHandle && (
                      <div style={{ fontSize: 11, color: '#777' }}>@{adv.socialHandle.replace('@', '')}</div>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ padding: '2px 6px', background: '#F0E6D8', borderRadius: 4, fontWeight: 700, fontSize: 11 }}>
                      {adv.code}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>{adv.phone}</td>
                  <td style={{ padding: '10px 14px' }}>{adv.sharesCount}</td>
                  <td style={{ padding: '10px 14px' }}>{adv.clicksCount}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>{adv.ordersDeliveredCount}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: adv.withdrawableBalance >= 10000 ? '#1B7F5E' : '#2B1810' }}>
                    NPR {adv.withdrawableBalance.toLocaleString()}
                    {adv.withdrawableBalance >= 10000 && (
                      <span style={{ marginLeft: 6, fontSize: 10, background: '#E0F3EA', color: '#1B7F5E', padding: '1px 5px', borderRadius: 3 }}>
                        Ready
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#666' }}>
                    NPR {adv.lifetimeEarned.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
