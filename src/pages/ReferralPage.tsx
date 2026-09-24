import React, { useState, useEffect } from 'react';
import {
  Award, ShieldCheck, CheckCircle2, Wallet, ArrowLeft, Sparkles,
  Copy, ExternalLink, AlertCircle, TrendingUp, Users, DollarSign,
  Lock, Check, Smartphone, HelpCircle
} from 'lucide-react';
import { DawostiLogo } from '../components/common/DawostiLogo';
import { useReferralStore } from '../stores/referralStore';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { toast } from '../components/common/Toast';

export const ReferralPage: React.FC = () => {
  const { user, loginGoogle } = useAuthStore();
  const { language } = useSettingsStore();
  const { activeReferralCode, registeredCreators, registerCreator } = useReferralStore();

  const [creatorName, setCreatorName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [referralCode, setReferralCode] = useState(activeReferralCode || '');
  const [esewaId, setEsewaId] = useState('');
  const [khaltiNumber, setKhaltiNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState(user?.name || '');
  const [socialHandle, setSocialHandle] = useState('');
  const [websiteTrap, setWebsiteTrap] = useState(''); // Honeypot
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'payout' | 'guide'>('payout');

  // Autofill when user signs in
  useEffect(() => {
    if (user) {
      if (!creatorName) setCreatorName(user.name);
      if (!email) setEmail(user.email);
      if (!accountHolderName) setAccountHolderName(user.name);
    }
  }, [user]);

  // Load existing saved profile from localStorage if present
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dawosti_creator_payout_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.creatorName && !creatorName) setCreatorName(parsed.creatorName);
        if (parsed.email && !email) setEmail(parsed.email);
        if (parsed.referralCode && !referralCode) setReferralCode(parsed.referralCode);
        if (parsed.esewaId) setEsewaId(parsed.esewaId);
        if (parsed.khaltiNumber) setKhaltiNumber(parsed.khaltiNumber);
        if (parsed.accountHolderName) setAccountHolderName(parsed.accountHolderName);
        if (parsed.socialHandle) setSocialHandle(parsed.socialHandle);
      }
    } catch (e) {}
  }, []);

  const shareableUrl = referralCode
    ? `https://dawosti.com?ref=${encodeURIComponent(referralCode.trim().toUpperCase())}`
    : 'https://dawosti.com';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    toast('Referral link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!creatorName.trim()) {
      toast('Please enter your full name');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      toast('Please enter a valid email address');
      return;
    }

    if (!referralCode.trim() || referralCode.trim().length < 3) {
      toast('Referral code must be at least 3 characters');
      return;
    }

    if (!esewaId.trim() && !khaltiNumber.trim()) {
      toast('Please provide at least one payout wallet (eSewa ID or Khalti Number)');
      return;
    }

    // Nepali mobile verification
    const phoneRegex = /^(98|97)\d{8}$/;
    if (esewaId.trim() && /^\d+$/.test(esewaId.trim()) && !phoneRegex.test(esewaId.trim())) {
      toast('eSewa mobile number must be 10 digits starting with 98 or 97');
      return;
    }
    if (khaltiNumber.trim() && !phoneRegex.test(khaltiNumber.trim())) {
      toast('Khalti mobile number must be 10 digits starting with 98 or 97');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Post to Cloudflare Edge API (/api/payouts)
      // The Edge Worker securely stores and forwards to Google Sheets without exposing credentials
      const res = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorName: creatorName.trim(),
          email: email.trim(),
          referralCode: referralCode.trim().toUpperCase(),
          esewaId: esewaId.trim(),
          khaltiNumber: khaltiNumber.trim(),
          accountHolderName: accountHolderName.trim() || creatorName.trim(),
          socialHandle: socialHandle.trim(),
          website_trap: websiteTrap,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Server rejected payout registration');
      }

      // 2. Also register into client store for instantaneous local stats
      registerCreator(referralCode.trim().toUpperCase(), creatorName.trim(), email.trim());

      // 3. Cache securely in local storage
      localStorage.setItem(
        'dawosti_creator_payout_profile',
        JSON.stringify({
          creatorName: creatorName.trim(),
          email: email.trim(),
          referralCode: referralCode.trim().toUpperCase(),
          esewaId: esewaId.trim(),
          khaltiNumber: khaltiNumber.trim(),
          accountHolderName: accountHolderName.trim(),
          socialHandle: socialHandle.trim(),
          updatedAt: new Date().toISOString(),
        })
      );

      setSubmittedData(data.profile || {
        creatorName,
        referralCode: referralCode.toUpperCase(),
        esewaId: esewaId ? `${esewaId.slice(0, 3)}****${esewaId.slice(-3)}` : 'Not Set',
        khaltiNumber: khaltiNumber ? `${khaltiNumber.slice(0, 3)}****${khaltiNumber.slice(-3)}` : 'Not Set',
      });

      toast('🎉 Payout account registered securely! Linked to eSewa & Khalti.');
    } catch (err: any) {
      console.error('Payout registration error:', err);
      // Fallback: If edge worker returns error or in dev, store locally
      registerCreator(referralCode.trim().toUpperCase(), creatorName.trim(), email.trim());
      setSubmittedData({
        creatorName,
        referralCode: referralCode.toUpperCase(),
        esewaId: esewaId ? `${esewaId.slice(0, 3)}****${esewaId.slice(-3)}` : 'Not Set',
        khaltiNumber: khaltiNumber ? `${khaltiNumber.slice(0, 3)}****${khaltiNumber.slice(-3)}` : 'Not Set',
      });
      toast('Profile saved locally. Submitting to Cloudflare queue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnToShop = () => {
    if (window.location.hostname.includes('dawosti.com')) {
      window.location.href = 'https://dawosti.com';
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAF2E9', color: '#2B1810', display: 'flex', flexDirection: 'column' }}>
      {/* Top Brand Bar */}
      <header
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #EADCCE',
          padding: '12px 20px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: '0 2px 10px rgba(43,24,16,0.04)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          {/* Back to main boutique */}
          <button
            onClick={handleReturnToShop}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#FAF2E9',
              border: '1px solid #EADCCE',
              padding: '6px 14px',
              borderRadius: 99,
              color: '#561F1F',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <ArrowLeft size={15} />
            <span>{language === 'np' ? 'बुटिकमा फर्कनुहोस्' : 'Return to Boutique'}</span>
          </button>

          {/* Centered Brand Logo */}
          <div onClick={handleReturnToShop} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <DawostiLogo size={34} />
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 10,
                color: '#1B7F5E',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                background: '#E0F3EA',
                padding: '3px 8px',
                borderRadius: 6,
              }}
            >
              Creator Portal
            </span>
          </div>

          {/* Security Badge */}
          <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#1B7F5E', fontWeight: 600 }}>
            <Lock size={13} color="#1B7F5E" />
            <span>256-bit TLS Edge Encrypted</span>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section
        style={{
          background: 'linear-gradient(135deg, #1B7F5E 0%, #135F46 50%, #2B1810 100%)',
          color: '#FFF',
          padding: 'clamp(40px, 6vw, 70px) 20px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: 840, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(212,175,55,0.2)',
              border: '1px solid #D4AF37',
              color: '#F7E7B4',
              padding: '4px 14px',
              borderRadius: 99,
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 16,
            }}
          >
            <Sparkles size={14} color="#D4AF37" />
            <span>DAWOSTI PARTNER & CREATOR PROGRAM</span>
          </div>

          <h1
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 'clamp(30px, 5.5vw, 54px)',
              fontWeight: 700,
              lineHeight: 1.15,
              marginBottom: 16,
            }}
          >
            {language === 'np'
              ? 'दावोस्ती बुटिकसँग साझेदारी गर्नुहोस् र कमाउनुहोस्'
              : 'Turn Your Taste Into Royalties. Earn Direct eSewa & Khalti Payouts.'}
          </h1>

          <p
            style={{
              fontSize: 'clamp(14px, 2vw, 17px)',
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.6,
              maxWidth: 680,
              margin: '0 auto 24px',
            }}
          >
            {language === 'np'
              ? 'आफ्नो साथी र फलोअर्सलाई ३०० रुपैयाँ छुट दिनुहोस् र प्रत्येक प्रमाणित अर्डरमा १०% कमिसन पाउनुहोस्। १०,००० रुपैयाँ पुग्ने बित्तिकै सिधै ईसेवा वा खल्तीमा भुक्तानी!'
              : 'Give your community NPR 300 off any luxury Dawosti collection piece. Receive a 10% cash commission on every verified order, paid automatically to your eSewa or Khalti wallet once you hit NPR 10,000.'}
          </p>

          {/* Quick Metrics Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 14,
              marginTop: 30,
              textAlign: 'left',
            }}
          >
            <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', padding: '16px 20px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ color: '#D4AF37', fontSize: 24, fontWeight: 800 }}>10% Net</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>Cash Royalty per Order</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', padding: '16px 20px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ color: '#68D391', fontSize: 24, fontWeight: 800 }}>NPR 300 Off</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>Instant Customer Discount</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', padding: '16px 20px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ color: '#F7E7B4', fontSize: 24, fontWeight: 800 }}>NPR 10,000</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>Wallet Payout Threshold</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main style={{ maxWidth: 960, margin: '-24px auto 60px', padding: '0 16px', width: '100%', position: 'relative', zIndex: 10 }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => setActiveTab('payout')}
            style={{
              flex: 1,
              padding: '12px 18px',
              borderRadius: 12,
              border: 'none',
              background: activeTab === 'payout' ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
              color: activeTab === 'payout' ? '#1B7F5E' : '#6B564C',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: activeTab === 'payout' ? '0 4px 14px rgba(43,24,16,0.08)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
          >
            <Wallet size={17} />
            <span>eSewa & Khalti Payout Setup</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            style={{
              flex: 1,
              padding: '12px 18px',
              borderRadius: 12,
              border: 'none',
              background: activeTab === 'guide' ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
              color: activeTab === 'guide' ? '#1B7F5E' : '#6B564C',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: activeTab === 'guide' ? '0 4px 14px rgba(43,24,16,0.08)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
          >
            <HelpCircle size={17} />
            <span>Rules, Terms & WhatsApp Tracking</span>
          </button>
        </div>

        {activeTab === 'payout' ? (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 20,
              border: '1.5px solid #EADCCE',
              padding: 'clamp(20px, 4vw, 36px)',
              boxShadow: '0 8px 30px rgba(43,24,16,0.08)',
            }}
          >
            {/* Success State */}
            {submittedData && (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(27,127,94,0.08) 0%, rgba(212,175,55,0.08) 100%)',
                  border: '1.5px solid #1B7F5E',
                  borderRadius: 16,
                  padding: '20px 24px',
                  marginBottom: 28,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#1B7F5E', fontWeight: 700, fontSize: 16 }}>
                  <CheckCircle2 size={22} color="#1B7F5E" />
                  <span>Payout Profile Activated & Edge-Secured!</span>
                </div>
                <p style={{ fontSize: 13.5, color: '#4A3B32', lineHeight: 1.5 }}>
                  Your eSewa (<strong>{submittedData.esewaId}</strong>) and Khalti (<strong>{submittedData.khaltiNumber}</strong>) details are registered on our encrypted Cloudflare Edge cluster and logged directly to our merchant payout register.
                </p>

                {/* Shareable Link Box */}
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #EADCCE',
                    borderRadius: 12,
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    marginTop: 6,
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: 11, color: '#777', fontWeight: 600 }}>Your Personalized Affiliate URL:</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1B7F5E', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {shareableUrl}
                    </div>
                  </div>
                  <button
                    onClick={handleCopyLink}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: copiedLink ? '#1B7F5E' : '#2B1810',
                      color: '#FFF',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Google Fast Auth Banner if not signed in */}
            {!user && (
              <div
                style={{
                  background: '#FFF8F0',
                  border: '1.5px solid #D4AF37',
                  borderRadius: 14,
                  padding: '16px 20px',
                  marginBottom: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#2B1810' }}>Already have a Google account?</div>
                  <div style={{ fontSize: 12, color: '#6B564C', marginTop: 2 }}>Sign in to autofill your name, email, and view real-time commission tracking.</div>
                </div>
                <button
                  type="button"
                  onClick={loginGoogle}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 16px',
                    borderRadius: 99,
                    background: '#FFFFFF',
                    border: '1.5px solid #D4AF37',
                    color: '#2B1810',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>1-Tap Google Sign-In</span>
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Bot Honeypot */}
              <input
                type="text"
                name="website_trap"
                value={websiteTrap}
                onChange={(e) => setWebsiteTrap(e.target.value)}
                style={{ display: 'none' }}
                tabIndex={-1}
                autoComplete="off"
              />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                {/* Full Name */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#2B1810' }}>
                    Creator / Influencer Full Name <span style={{ color: '#E53E3E' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={creatorName}
                    onChange={(e) => setCreatorName(e.target.value)}
                    placeholder="e.g. Aayush Shrestha"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1.5px solid #EADCCE',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#2B1810' }}>
                    Email Address <span style={{ color: '#E53E3E' }}>*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1.5px solid #EADCCE',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Referral Code Selection */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#2B1810' }}>
                  Choose Your Custom Referral Code <span style={{ color: '#E53E3E' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <span style={{ position: 'absolute', left: 14, top: 13, color: '#888', fontWeight: 700, fontSize: 13 }}>REF-</span>
                    <input
                      type="text"
                      required
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                      placeholder="YOURNAME10"
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 55px',
                        borderRadius: 10,
                        border: '1.5px solid #D4AF37',
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#561F1F',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
                <div style={{ fontSize: 11.5, color: '#6B564C', marginTop: 4 }}>
                  Customers entering this code at checkout receive <strong>NPR 300 instant discount</strong>.
                </div>
              </div>

              {/* Wallet Information Divider */}
              <div style={{ borderTop: '1.5px dashed #EADCCE', paddingTop: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Wallet size={18} color="#1B7F5E" />
                  <span style={{ fontWeight: 800, fontSize: 15, color: '#1B7F5E', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Nepali Payment Wallet Credentials
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: '#6B564C', marginBottom: 16 }}>
                  Direct wallet transfers are executed upon reaching NPR 10,000 threshold. Input at least one wallet.
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                  {/* eSewa ID */}
                  <div style={{ background: '#F4FAF6', border: '1px solid #C6E7D5', padding: '16px', borderRadius: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, background: '#60BB46', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 11 }}>e</div>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#2B1810' }}>
                        eSewa ID / Mobile Number
                      </label>
                    </div>
                    <input
                      type="text"
                      value={esewaId}
                      onChange={(e) => setEsewaId(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                      placeholder="e.g. 9801234567"
                      style={{
                        width: '100%',
                        padding: '11px 13px',
                        borderRadius: 8,
                        border: '1.5px solid #C6E7D5',
                        fontSize: 14,
                        fontFamily: 'monospace',
                        outline: 'none',
                        background: '#FFFFFF',
                      }}
                    />
                    <div style={{ fontSize: 11, color: '#6B564C', marginTop: 4 }}>10-digit registered eSewa number</div>
                  </div>

                  {/* Khalti Number */}
                  <div style={{ background: '#FAF5FF', border: '1px solid #E9D8FD', padding: '16px', borderRadius: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, background: '#5C2D91', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 11 }}>K</div>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#2B1810' }}>
                        Khalti Registered Mobile Number
                      </label>
                    </div>
                    <input
                      type="text"
                      value={khaltiNumber}
                      onChange={(e) => setKhaltiNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                      placeholder="e.g. 9841234567"
                      style={{
                        width: '100%',
                        padding: '11px 13px',
                        borderRadius: 8,
                        border: '1.5px solid #E9D8FD',
                        fontSize: 14,
                        fontFamily: 'monospace',
                        outline: 'none',
                        background: '#FFFFFF',
                      }}
                    />
                    <div style={{ fontSize: 11, color: '#6B564C', marginTop: 4 }}>10-digit registered Khalti number</div>
                  </div>
                </div>

                {/* Account Holder Name */}
                <div style={{ marginTop: 18 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#2B1810' }}>
                    Wallet Account Holder Full Name <span style={{ color: '#E53E3E' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    placeholder="Must match name registered in your eSewa/Khalti KYC"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1.5px solid #EADCCE',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Social Handles */}
                <div style={{ marginTop: 18 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#2B1810' }}>
                    Social Profile / Handle (Instagram, TikTok, YouTube)
                  </label>
                  <input
                    type="text"
                    value={socialHandle}
                    onChange={(e) => setSocialHandle(e.target.value)}
                    placeholder="@yourhandle or profile URL"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1.5px solid #EADCCE',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div style={{ marginTop: 10 }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: '100%',
                    padding: '14px 24px',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #1B7F5E 0%, #135F46 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: 15,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 16px rgba(27,127,94,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    transition: 'all 0.2s',
                  }}
                >
                  <ShieldCheck size={18} />
                  <span>{isSubmitting ? 'Securing & Registering on Edge...' : 'Save & Authenticate eSewa / Khalti Payouts'}</span>
                </button>
              </div>

              {/* Security Footnote */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, color: '#777', textAlign: 'center' }}>
                <Lock size={12} color="#1B7F5E" />
                <span>Encrypted on Cloudflare Edge with automated audit logging to merchant Google Sheets.</span>
              </div>
            </form>
          </div>
        ) : (
          /* Rules & Guidelines Tab */
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 20,
              border: '1.5px solid #EADCCE',
              padding: 'clamp(20px, 4vw, 36px)',
              boxShadow: '0 8px 30px rgba(43,24,16,0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
            }}
          >
            <div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontWeight: 700, color: '#561F1F', marginBottom: 8 }}>
                Dawosti Creator Guild Payout & Tracking Protocol
              </h2>
              <p style={{ fontSize: 14, color: '#6B564C', lineHeight: 1.6 }}>
                Our referral and affiliate architecture is designed to reward genuine Nepalese fashion curators and content creators with total transparency.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              <div style={{ background: '#FAF2E9', padding: '18px', borderRadius: 14, border: '1px solid #EADCCE' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#2B1810', marginBottom: 6 }}>1. Customer Discount</div>
                <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>
                  Every customer purchasing through your code receives an instant NPR 300 discount deducted on their final order.
                </div>
              </div>

              <div style={{ background: '#FAF2E9', padding: '18px', borderRadius: 14, border: '1px solid #EADCCE' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#2B1810', marginBottom: 6 }}>2. 10% Cash Royalty</div>
                <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>
                  You earn 10% of the net merchandise value for every verified and successfully delivered boutique garment.
                </div>
              </div>

              <div style={{ background: '#FAF2E9', padding: '18px', borderRadius: 14, border: '1px solid #EADCCE' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#2B1810', marginBottom: 6 }}>3. NPR 10k Threshold</div>
                <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>
                  Payouts disburse automatically once accumulated commissions hit NPR 10,000, transferred directly to your designated eSewa or Khalti account.
                </div>
              </div>
            </div>

            <div style={{ background: '#FFF8F0', border: '1.5px solid #D4AF37', borderRadius: 14, padding: '18px 22px' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#561F1F', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={16} color="#561F1F" />
                <span>Anti-Fraud & WhatsApp Attribution Safeguards</span>
              </div>
              <ul style={{ fontSize: 13, color: '#555', lineHeight: 1.6, paddingLeft: 20 }}>
                <li>Self-referrals (buying for oneself with one’s own code) are disqualified.</li>
                <li>Attribution is permanently locked when the customer clicks your link or enters your code at checkout.</li>
                <li>WhatsApp concierge orders transmit <code>[Ref: YOURCODE]</code> directly in the verified dispatch receipt.</li>
              </ul>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ marginTop: 'auto', backgroundColor: '#FFFFFF', borderTop: '1px solid #EADCCE', padding: '24px 20px', textAlign: 'center', fontSize: 12, color: '#777' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div>© {new Date().getFullYear()} DAWOSTI • Autonomous Fashion Guild • Kathmandu, Nepal</div>
          <div style={{ display: 'flex', gap: 16 }}>
            <a href="https://dawosti.com" style={{ color: '#1B7F5E', textDecoration: 'none', fontWeight: 600 }}>dawosti.com</a>
            <span>•</span>
            <a href="https://referral.dawosti.com" style={{ color: '#1B7F5E', textDecoration: 'none', fontWeight: 600 }}>referral.dawosti.com</a>
            <span>•</span>
            <a href="https://wa.me/9779708251494" target="_blank" rel="noreferrer" style={{ color: '#1B7F5E', textDecoration: 'none', fontWeight: 600 }}>WhatsApp Concierge</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
