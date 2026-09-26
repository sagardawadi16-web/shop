import React, { useState, useEffect } from 'react';
import { X, Copy, Check, MessageCircle, DollarSign, Award, TrendingUp, ShieldCheck, Lock, ExternalLink, HelpCircle } from 'lucide-react';
import { useReferralStore, PAYOUT_MINIMUM_THRESHOLD } from '../../stores/referralStore';
import { useAuthStore } from '../../stores/authStore';
import { TermsOfServiceModal } from './TermsOfServiceModal';
import { toast } from '../common/Toast';

export const CreatorPortalModal: React.FC = () => {
  const {
    isCreatorPortalOpen,
    closeCreatorPortal,
    currentAdvocate,
    registerOrLoginAdvocate,
    recordShare,
    submitPayout,
    openTosModal,
  } = useReferralStore();
  const { user } = useAuthStore();

  // Form State for Registration
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState('');
  const [social, setSocial] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Sync user name from Google account
  useEffect(() => {
    if (user?.name && !name) {
      setName(user.name);
    }
  }, [user]);

  // Form State for Payout Submission
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'esewa' | 'khalti' | 'bank'>('esewa');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);

  if (!isCreatorPortalOpen) return null;

  const referralUrl = currentAdvocate
    ? `https://dawosti.com/?ref=${currentAdvocate.code}`
    : '';

  const handleCopyLink = () => {
    if (!referralUrl) return;
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    recordShare();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    if (!referralUrl) return;
    const msg = encodeURIComponent(
      `Namaste! ✨ Check out Dawosti Boutique for authentic Nepali fusion wear and handcrafted couture in Kathmandu. Use my link for NPR 300 off your first order: ${referralUrl}`
    );
    recordShare();
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast('Please fill in your name and phone number.', 'error');
      return;
    }
    setIsRegistering(true);
    try {
      await registerOrLoginAdvocate({
        fullName: name,
        phone,
        socialHandle: social,
        email: user?.email,
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentDetails.trim()) {
      toast('Please enter your eSewa ID or Bank account details.', 'error');
      return;
    }
    setIsSubmittingPayout(true);
    try {
      const res = await submitPayout({ paymentMethod, paymentDetails });
      setPayoutMessage(res.message);
      if (res.success) {
        setShowPayoutForm(false);
      }
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  // Progress towards 10k calculation
  const currentBalance = currentAdvocate?.withdrawableBalance || 0;
  const progressPercent = Math.min(100, Math.round((currentBalance / PAYOUT_MINIMUM_THRESHOLD) * 100));
  const remainingForPayout = Math.max(0, PAYOUT_MINIMUM_THRESHOLD - currentBalance);
  const canWithdraw = currentBalance >= PAYOUT_MINIMUM_THRESHOLD;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(43, 24, 16, 0.75)',
          backdropFilter: 'blur(5px)',
          zIndex: 90,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 680,
            maxHeight: '90vh',
            backgroundColor: '#FFF8F0',
            borderRadius: 12,
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            border: '2px solid #D4AF37',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              backgroundColor: '#561F1F',
              color: '#FFF8F0',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #D4AF37',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Award size={20} color="#D4AF37" />
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Dawosti Creator & Referral Hub
              </h2>
            </div>
            <button
              onClick={closeCreatorPortal}
              style={{ background: 'none', border: 'none', color: '#FFF8F0', cursor: 'pointer', padding: 4 }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ padding: 24, overflowY: 'auto' }}>
            {!currentAdvocate ? (
              /* Registration Flow */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ textAlign: 'center', marginBottom: 6 }}>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: 22, fontWeight: 800, color: '#2B1810' }}>
                    Earn Cash With Dawosti Fashion
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, color: '#666', lineHeight: 1.5 }}>
                    Share your aesthetic with friends and followers. Your audience unlocks <strong>NPR 300 off</strong>,
                    and you make direct cash commissions on every delivered dress.
                  </p>
                </div>

                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 }}>
                      Full Name:
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Riya Shrestha"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #D4C5B9', fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 }}>
                      Mobile / WhatsApp Phone Number:
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="98XXXXXXXX"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #D4C5B9', fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 }}>
                      Instagram / TikTok Handle (Optional):
                    </label>
                    <input
                      type="text"
                      value={social}
                      onChange={(e) => setSocial(e.target.value)}
                      placeholder="@yourhandle"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #D4C5B9', fontSize: 13 }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isRegistering}
                    style={{
                      marginTop: 8,
                      padding: '12px',
                      backgroundColor: '#8B3A3A',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: isRegistering ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isRegistering ? 'Generating Unique Code...' : 'Get My Instant Referral Link & Dashboard'}
                  </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11.5, color: '#777' }}>
                  By joining, you agree to the{' '}
                  <button
                    onClick={openTosModal}
                    style={{ background: 'none', border: 'none', color: '#8B3A3A', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
                  >
                    Affiliate Terms of Service
                  </button>{' '}
                  (minimum NPR 10k payout threshold applies).
                </div>
              </div>
            ) : (
              /* Logged In Advocate Dashboard */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Welcome Card & Active Code */}
                <div style={{ background: '#FAF2E9', padding: '16px 20px', borderRadius: 8, border: '1px solid #EADCCE' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#777' }}>Welcome back,</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#2B1810' }}>
                        {currentAdvocate.fullName}
                      </div>
                    </div>
                    <div style={{ background: '#FFF8F0', padding: '6px 14px', borderRadius: 6, border: '1px solid #D4AF37', textAlign: 'center' }}>
                      <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#777' }}>Your Invite Code</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#8B3A3A' }}>
                        {currentAdvocate.code}
                      </div>
                    </div>
                  </div>

                  {/* Share Link Row */}
                  <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      readOnly
                      value={referralUrl}
                      style={{
                        flex: 1,
                        minWidth: 220,
                        padding: '9px 12px',
                        borderRadius: 6,
                        border: '1px solid #D4C5B9',
                        fontSize: 12.5,
                        backgroundColor: '#FFF',
                        color: '#444',
                      }}
                    />
                    <button
                      onClick={handleCopyLink}
                      style={{
                        padding: '9px 16px',
                        backgroundColor: copied ? '#1B7F5E' : '#8B3A3A',
                        color: '#FFF',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 12.5,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                    <button
                      onClick={handleWhatsAppShare}
                      style={{
                        padding: '9px 16px',
                        backgroundColor: '#25D366',
                        color: '#FFF',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 12.5,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <MessageCircle size={14} />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>

                {/* Live Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  <div style={{ background: '#FFF', padding: 12, borderRadius: 6, border: '1px solid #EADCCE', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#777' }}>Total Shares</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#2B1810' }}>{currentAdvocate.sharesCount}</div>
                  </div>
                  <div style={{ background: '#FFF', padding: 12, borderRadius: 6, border: '1px solid #EADCCE', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#777' }}>Link Clicks</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#2B1810' }}>{currentAdvocate.clicksCount}</div>
                  </div>
                  <div style={{ background: '#FFF', padding: 12, borderRadius: 6, border: '1px solid #EADCCE', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#777' }}>Delivered Sales</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#1B7F5E' }}>{currentAdvocate.ordersDeliveredCount}</div>
                  </div>
                </div>

                {/* NPR 10,000 Milestone Progress Card */}
                <div style={{ background: '#FFF', padding: 20, borderRadius: 8, border: '1px solid #EADCCE' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#2B1810' }}>
                      eSewa / Khalti Payout Progress
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: canWithdraw ? '#1B7F5E' : '#8B3A3A' }}>
                      NPR {currentBalance.toLocaleString()} / NPR {PAYOUT_MINIMUM_THRESHOLD.toLocaleString()}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: '100%', height: 12, backgroundColor: '#EADCCE', borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
                    <div
                      style={{
                        width: `${progressPercent}%`,
                        height: '100%',
                        backgroundColor: canWithdraw ? '#1B7F5E' : '#D4AF37',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>

                  <div style={{ fontSize: 12, color: '#666', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{progressPercent}% Complete</span>
                    {!canWithdraw ? (
                      <span>NPR {remainingForPayout.toLocaleString()} left to unlock payout</span>
                    ) : (
                      <span style={{ color: '#1B7F5E', fontWeight: 700 }}>🎉 NPR 10,000 Milestone Unlocked!</span>
                    )}
                  </div>

                  {payoutMessage && (
                    <div style={{ marginTop: 12, padding: 10, background: '#E0F3EA', color: '#1B7F5E', borderRadius: 6, fontSize: 12.5 }}>
                      {payoutMessage}
                    </div>
                  )}

                  {/* Redeem Button / Trigger */}
                  {!showPayoutForm ? (
                    <button
                      disabled={!canWithdraw}
                      onClick={() => setShowPayoutForm(true)}
                      style={{
                        marginTop: 16,
                        width: '100%',
                        padding: '12px',
                        backgroundColor: canWithdraw ? '#1B7F5E' : '#D4C5B9',
                        color: '#FFF',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: canWithdraw ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                      }}
                    >
                      {!canWithdraw && <Lock size={15} />}
                      <span>
                        {canWithdraw
                          ? 'Claim NPR 10,000 Cashout via eSewa / Bank'
                          : `Locked: Payout Unlocks at NPR ${PAYOUT_MINIMUM_THRESHOLD.toLocaleString()}`}
                      </span>
                    </button>
                  ) : (
                    /* Payout Details Form */
                    <form onSubmit={handleRequestPayout} style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px dashed #D4C5B9', paddingTop: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#2B1810' }}>
                        Submit Payout Destination:
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        {(['esewa', 'khalti', 'bank'] as const).map((method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setPaymentMethod(method)}
                            style={{
                              flex: 1,
                              padding: '8px',
                              borderRadius: 4,
                              border: paymentMethod === method ? '2px solid #1B7F5E' : '1px solid #D4C5B9',
                              backgroundColor: paymentMethod === method ? '#E0F3EA' : '#FFF',
                              fontWeight: 700,
                              fontSize: 12,
                              textTransform: 'uppercase',
                              cursor: 'pointer',
                            }}
                          >
                            {method}
                          </button>
                        ))}
                      </div>

                      <input
                        type="text"
                        required
                        placeholder={
                          paymentMethod === 'bank'
                            ? 'Bank Name, Account Holder Name, Account Number'
                            : `Enter your ${paymentMethod.toUpperCase()} ID (e.g. 98XXXXXXXX)`
                        }
                        value={paymentDetails}
                        onChange={(e) => setPaymentDetails(e.target.value)}
                        style={{ padding: '9px 12px', borderRadius: 6, border: '1px solid #D4C5B9', fontSize: 13 }}
                      />

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="submit"
                          disabled={isSubmittingPayout}
                          style={{
                            flex: 1,
                            padding: '10px',
                            backgroundColor: '#1B7F5E',
                            color: '#FFF',
                            border: 'none',
                            borderRadius: 6,
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: 'pointer',
                          }}
                        >
                          {isSubmittingPayout ? 'Submitting...' : 'Submit Cashout Request'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPayoutForm(false)}
                          style={{ padding: '10px 14px', background: '#FFF', border: '1px solid #D4C5B9', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                <div style={{ textAlign: 'center', fontSize: 11.5, color: '#777' }}>
                  Orders are verified following courier delivery & 7-day return grace period.{' '}
                  <button
                    onClick={openTosModal}
                    style={{ background: 'none', border: 'none', color: '#8B3A3A', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
                  >
                    View Terms of Service
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Built-In Terms of Service Modal */}
      <TermsOfServiceModal />
    </>
  );
};
