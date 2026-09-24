import React from 'react';
import { X, ShieldAlert, Check } from 'lucide-react';
import { useReferralStore } from '../../stores/referralStore';

export const TermsOfServiceModal: React.FC = () => {
  const { isTosModalOpen, closeTosModal } = useReferralStore();

  if (!isTosModalOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(43, 24, 16, 0.85)',
        backdropFilter: 'blur(6px)',
        zIndex: 110,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 620,
          maxHeight: '88vh',
          backgroundColor: '#FFF8F0',
          borderRadius: 12,
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
          border: '2px solid #8B3A3A',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: '#8B3A3A',
            color: '#FFF8F0',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldAlert size={18} color="#D4AF37" />
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Dawosti Creator & Referral Terms of Service
            </h3>
          </div>
          <button
            onClick={closeTosModal}
            style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Legal Text Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', fontSize: 13, color: '#333', lineHeight: 1.6 }}>
          <p style={{ marginTop: 0, fontWeight: 600, color: '#8B3A3A' }}>
            Please read these terms carefully before enrolling in or sharing through the Dawosti Boutique Creator & Affiliate Network.
          </p>

          <ol style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <li>
              <strong>1. Sole Discretion & Verification Authority:</strong> Dawosti Boutique reserves the exclusive, unilateral right to audit, verify, approve, decline, or adjust any referral commission. No commission is considered earned until an order has been verified by the merchant management desk as a genuine retail customer purchase.
            </li>
            <li>
              <strong>2. Settled Funds & 7-Day Return Lockout:</strong> Commissions remain in a non-withdrawable "Pending" status until: (a) full payment is completed by the customer (cash or digital); (b) physical parcel delivery is confirmed by the courier partner; and (c) the standard 7-day customer exchange/return grace period has elapsed. Any cancelled, fake, or refused Cash-on-Delivery (COD) orders automatically void the associated commission.
            </li>
            <li>
              <strong>3. Strict Prohibition of Self-Referral:</strong> Creators and advocates are strictly prohibited from using their own referral links for personal purchases or coordinating simulated orders through direct family members or aliases. Any detected self-referral or collusive behavior results in immediate account disqualification and permanent forfeiture of all accumulated balances.
            </li>
            <li>
              <strong>4. Mandatory NPR 10,000 Milestone & Expiration:</strong> Payout withdrawals may only be requested once the creator’s verified, settled balance meets or exceeds the minimum threshold of NPR 10,000. Balances do not earn interest. In the event of account inactivity exceeding 180 consecutive days without any qualified sales, Dawosti Boutique reserves the right to retire the code and expire dormant balances.
            </li>
            <li>
              <strong>5. Independent Brand Advocate Relationship:</strong> All creators operate as independent contractors and brand advocates. Nothing in this program creates an employment, agency, or partnership relationship. Creators are solely responsible for any applicable local taxes or declarations under the laws of Nepal.
            </li>
            <li>
              <strong>6. Anti-Spam & Brand Conduct:</strong> Promoters agree to represent Dawosti Boutique with aesthetic rigor. Unsolicited spamming across WhatsApp/Viber groups, unsolicited Direct Messages, deceptive pricing claims, or derogatory conduct will result in instant termination without payout.
            </li>
          </ol>

          <div style={{ marginTop: 16, padding: '12px 16px', background: '#FAF2E9', borderRadius: 6, border: '1px solid #EADCCE', fontSize: 12, color: '#555' }}>
            Dawosti Boutique reserves the right to adjust commission structures, bonus milestones, or program rules at any time with prior notice.
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #EADCCE', backgroundColor: '#FAF2E9', textAlign: 'right' }}>
          <button
            onClick={closeTosModal}
            style={{
              padding: '8px 18px',
              backgroundColor: '#8B3A3A',
              color: '#FFF',
              border: 'none',
              borderRadius: 6,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
