import React, { useState, useEffect } from 'react';
import {
  Award, ShieldCheck, CheckCircle2, Wallet, ArrowLeft, Sparkles,
  Copy, ExternalLink, AlertCircle, TrendingUp, Users, DollarSign,
  Lock, Check, Smartphone, HelpCircle, ArrowUpRight
} from 'lucide-react';
import { DawostiLogo } from '../components/common/DawostiLogo';
import { useReferralStore } from '../stores/referralStore';
import { useOrderStore } from '../stores/orderStore';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { toast } from '../components/common/Toast';
import { saveAdvocate } from '../services/firestoreReferrals';
import { ReferralAdvocate } from '../types';

export const ReferralPage: React.FC = () => {
  const { user, loginGoogle } = useAuthStore();
  const { language, setLanguage, toggleLanguage } = useSettingsStore();
  const { activeReferralCode, registeredCreators, registerCreator, allAdvocates, submitPayout } = useReferralStore();
  const { orders } = useOrderStore();

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
  const [activeTab, setActiveTab] = useState<'payout' | 'analytics' | 'guide'>('payout');
  const [analyticsCode, setAnalyticsCode] = useState(referralCode || activeReferralCode || '');
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);

  // Synchronize analytics code when user fills referralCode
  useEffect(() => {
    if (referralCode && referralCode.trim().length >= 3) {
      setAnalyticsCode(referralCode.trim().toUpperCase());
    }
  }, [referralCode]);

  // Match advocate by email if user is signed in with Google, or by analyticsCode/referralCode
  const advocateByEmail = user?.email
    ? (allAdvocates || []).find(
        (a) => a?.email && a.email.toLowerCase() === user.email.toLowerCase()
      )
    : null;

  const currentMatchedAdvocate =
    advocateByEmail ||
    (allAdvocates || []).find(
      (a) => a?.code && a.code.toUpperCase() === (analyticsCode || '').toUpperCase()
    );

  const matchedCreatorOrders = (orders || []).filter(
    (o) => o?.referredByCode && o.referredByCode.toUpperCase() === (analyticsCode || '').toUpperCase()
  );

  const totalCreatorEarned = currentMatchedAdvocate?.lifetimeEarned ||
    matchedCreatorOrders.reduce((sum, o) => {
      const discount = o?.referralDiscountAmount ?? (o?.discountAmount || 300);
      const subtotal = o?.subtotalAmount || 0;
      const commission = o?.referralCommissionAmount ?? Math.round(Math.max(0, subtotal - discount) * 0.10);
      return sum + commission;
    }, 0);

  const withdrawableCash = currentMatchedAdvocate?.withdrawableBalance ||
    (totalCreatorEarned >= 10000 ? totalCreatorEarned : 0);

  const isThresholdReached = withdrawableCash >= 10000;
  const thresholdPercent = Math.min(100, Math.round((withdrawableCash / 10000) * 100));

  const totalClicksCount = currentMatchedAdvocate?.clicksCount || 0;
  const computedRate = totalClicksCount > 0
    ? Math.round((matchedCreatorOrders.length / totalClicksCount) * 1000) / 10
    : 0;

  const handleRequestPayout = async (amount: number, method: 'esewa' | 'khalti', details: string) => {
    setIsRequestingPayout(true);
    try {
      const res = await submitPayout({
        paymentMethod: method,
        paymentDetails: details,
      });
      toast(res.message);
    } finally {
      setIsRequestingPayout(false);
    }
  };

  // Synchronize Google user with Creator profile automatically (No need to sign in twice!)
  useEffect(() => {
    if (advocateByEmail) {
      if (!referralCode || referralCode !== advocateByEmail.code) {
        setReferralCode(advocateByEmail.code);
        setAnalyticsCode(advocateByEmail.code);
      }
      if (advocateByEmail.fullName && !creatorName) setCreatorName(advocateByEmail.fullName);
      if (advocateByEmail.email && !email) setEmail(advocateByEmail.email);
      if (advocateByEmail.esewaId && !esewaId) setEsewaId(advocateByEmail.esewaId);
      if (advocateByEmail.khaltiNumber && !khaltiNumber) setKhaltiNumber(advocateByEmail.khaltiNumber);
      if (advocateByEmail.socialHandle && !socialHandle) setSocialHandle(advocateByEmail.socialHandle);
      if (advocateByEmail.fullName && !accountHolderName) setAccountHolderName(advocateByEmail.fullName);
    } else if (user) {
      if (!creatorName) setCreatorName(user.name);
      if (!email) setEmail(user.email);
      if (!accountHolderName) setAccountHolderName(user.name);
      if (!referralCode) {
        const cleanName = user.name.trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6) || 'CREATOR';
        const suffix = Math.floor(10 + Math.random() * 89);
        setReferralCode(`${cleanName}-${suffix}`);
        setAnalyticsCode(`${cleanName}-${suffix}`);
      }
    }
  }, [user, advocateByEmail]);

  // Load existing saved profile from localStorage if present
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dawosti_creator_payout_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.creatorName && !creatorName) setCreatorName(parsed.creatorName);
        if (parsed.email && !email) setEmail(parsed.email);
        if (parsed.referralCode && !referralCode) setReferralCode(parsed.referralCode);
        if (parsed.esewaId && !esewaId) setEsewaId(parsed.esewaId);
        if (parsed.khaltiNumber && !khaltiNumber) setKhaltiNumber(parsed.khaltiNumber);
        if (parsed.accountHolderName && !accountHolderName) setAccountHolderName(parsed.accountHolderName);
        if (parsed.socialHandle && !socialHandle) setSocialHandle(parsed.socialHandle);
      }
    } catch (e) {}
  }, []);

  const hostOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://dawosti.com';
  const effectiveCode = referralCode || currentMatchedAdvocate?.code || '';
  const shareableUrl = effectiveCode
    ? `${hostOrigin}?ref=${encodeURIComponent(effectiveCode.trim().toUpperCase())}`
    : hostOrigin;

  const handleCopyLink = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareableUrl);
      } else {
        const input = document.createElement('textarea');
        input.value = shareableUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopiedLink(true);
      toast('Referral link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      toast('Could not copy link automatically. Please copy the URL from the bar.', 'info');
    }
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
    // Enforce referral code uniqueness: two people cannot use the same reference code
    const cleanCode = referralCode.trim().toUpperCase();
    const userPhone = (esewaId.trim() || khaltiNumber.trim() || '').replace(/[^0-9]/g, '');
    const existingWithCode = (allAdvocates || []).find((a) => a.code.toUpperCase() === cleanCode);
    if (
      existingWithCode &&
      existingWithCode.phone !== userPhone &&
      existingWithCode.email?.toLowerCase() !== email.trim().toLowerCase()
    ) {
      toast(`⚠️ Referral code "${cleanCode}" is already taken by another creator. Two people cannot use the same reference code. Please pick a different unique code.`, 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Post to Cloudflare Edge API (/api/payouts) if available
      try {
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

        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data?.profile) {
            setSubmittedData(data.profile);
          }
        }
      } catch (edgeErr) {
        console.warn('Edge payout proxy notice:', edgeErr);
      }

      // 4. Save to Firestore referral_advocates collection
      const cleanCode = referralCode.trim().toUpperCase();
      const advocateObj: ReferralAdvocate = {
        id: currentMatchedAdvocate?.id || `adv_${Date.now()}_${cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        code: cleanCode,
        fullName: creatorName.trim(),
        phone: esewaId.trim() || khaltiNumber.trim() || '9800000000',
        email: email.trim(),
        socialHandle: socialHandle.trim(),
        clicksCount: currentMatchedAdvocate?.clicksCount || 0,
        sharesCount: currentMatchedAdvocate?.sharesCount || 0,
        ordersDeliveredCount: currentMatchedAdvocate?.ordersDeliveredCount || 0,
        pendingBalance: currentMatchedAdvocate?.pendingBalance || 0,
        withdrawableBalance: currentMatchedAdvocate?.withdrawableBalance || 0,
        lifetimeEarned: currentMatchedAdvocate?.lifetimeEarned || 0,
        createdAt: currentMatchedAdvocate?.createdAt || new Date().toISOString(),
        status: 'active',
        payoutPreferredMethod: esewaId.trim() ? 'esewa' : 'khalti',
        payoutAccountIdentifier: esewaId.trim() || khaltiNumber.trim(),
        esewaId: esewaId.trim(),
        khaltiNumber: khaltiNumber.trim(),
      };
      await saveAdvocate(advocateObj);

      // 5. Update local Zustand state
      try {
        const existingList = useReferralStore.getState().allAdvocates || [];
        const idx = existingList.findIndex((a) => a.code.toUpperCase() === cleanCode);
        const updated = idx >= 0
          ? existingList.map((a, i) => (i === idx ? advocateObj : a))
          : [advocateObj, ...existingList];
        useReferralStore.setState({ allAdvocates: updated, currentAdvocate: advocateObj });
      } catch {}

      toast('🎉 Payout account registered securely! Linked to eSewa & Khalti.');
    } catch (err: any) {
      console.error('Payout registration error:', err);
      toast('Registration encountered an issue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnToShop = () => {
    const langParam = `lang=${language}`;
    if (window.location.hostname.includes('dawosti.com')) {
      window.location.href = `https://dawosti.com?${langParam}`;
    } else {
      window.location.href = `/?${langParam}`;
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
              {language === 'np' ? 'सिर्जनाकर्ता पोर्टल' : 'Creator Portal'}
            </span>
          </div>

          {/* Language Toggle & Security Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={toggleLanguage}
              title={language === 'np' ? 'Switch to English' : 'नेपाली भाषामा हेर्नुहोस्'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: '#FFF8F0',
                border: '1.5px solid #EADCCE',
                padding: '5px 12px',
                borderRadius: 99,
                color: '#8B3A3A',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 1px 4px rgba(43,24,16,0.06)',
              }}
            >
              <span>{language === 'np' ? '🇳🇵 नेपाली' : '🇬🇧 EN'}</span>
            </button>
            <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#1B7F5E', fontWeight: 600 }}>
              <Lock size={13} color="#1B7F5E" />
              <span>{language === 'np' ? '२५६-बिट सुरक्षित' : '256-bit TLS Edge Encrypted'}</span>
            </div>
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
            <span>{language === 'np' ? 'डावोस्ती साझेदार तथा सिर्जनाकर्ता कार्यक्रम' : 'DAWOSTI PARTNER & CREATOR PROGRAM'}</span>
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
              <div style={{ color: '#D4AF37', fontSize: 24, fontWeight: 800 }}>{language === 'np' ? '१०% नगद' : '10% Net'}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{language === 'np' ? 'प्रति अर्डर नगद रोयल्टी' : 'Cash Royalty per Order'}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', padding: '16px 20px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ color: '#68D391', fontSize: 24, fontWeight: 800 }}>{language === 'np' ? 'रु. ३०० छुट' : 'NPR 300 Off'}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{language === 'np' ? 'ग्राहकलाई तत्काल छुट' : 'Instant Customer Discount'}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', padding: '16px 20px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ color: '#F7E7B4', fontSize: 24, fontWeight: 800 }}>{language === 'np' ? 'रु. १०,०००' : 'NPR 10,000'}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{language === 'np' ? 'वालेट भुक्तानी सीमा' : 'Wallet Payout Threshold'}</div>
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
            <span>{language === 'np' ? 'ईसेवा र खल्ती खाता' : 'eSewa & Khalti Setup'}</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            style={{
              flex: 1,
              padding: '12px 18px',
              borderRadius: 12,
              border: 'none',
              background: activeTab === 'analytics' ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
              color: activeTab === 'analytics' ? '#1B7F5E' : '#6B564C',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: activeTab === 'analytics' ? '0 4px 14px rgba(43,24,16,0.08)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
          >
            <TrendingUp size={17} />
            <span>{language === 'np' ? '📊 मेरो कमाई तथा विवरण' : '📊 My Performance & Earnings'}</span>
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
            <span>{language === 'np' ? 'नियम तथा दिशानिर्देश' : 'Rules, Terms & WhatsApp Tracking'}</span>
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
            {/* Active Creator Card & Referral Link Box */}
            {(submittedData || currentMatchedAdvocate) && (
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#1B7F5E', fontWeight: 700, fontSize: 16 }}>
                    <CheckCircle2 size={22} color="#1B7F5E" />
                    <span>
                      {language === 'np'
                        ? `सिर्जनाकर्ता खाता सक्रिय: ${effectiveCode}`
                        : `Creator Account Active: ${effectiveCode}`}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1B7F5E', background: '#D8F3E5', padding: '4px 12px', borderRadius: 99 }}>
                    {language === 'np' ? 'प्रत्यक्ष भुक्तानी सुरक्षित' : 'Edge-Secured'}
                  </div>
                </div>

                <p style={{ fontSize: 13.5, color: '#4A3B32', lineHeight: 1.5, margin: 0 }}>
                  {language === 'np' ? (
                    <>ईसेवा: <strong>{submittedData?.esewaId || currentMatchedAdvocate?.esewaId || esewaId || '९८०१२३४५६७'}</strong> • खल्ती: <strong>{submittedData?.khaltiNumber || currentMatchedAdvocate?.khaltiNumber || khaltiNumber || '९८०१२३४५६७'}</strong>। ग्राहकले अर्डर प्रमाणित गर्नासाथ कमिसन स्वतः जम्मा हुनेछ।</>
                  ) : (
                    <>eSewa: <strong>{submittedData?.esewaId || currentMatchedAdvocate?.esewaId || esewaId || '9801234567'}</strong> • Khalti: <strong>{submittedData?.khaltiNumber || currentMatchedAdvocate?.khaltiNumber || khaltiNumber || '9801234567'}</strong>. Creator commission is credited automatically upon admin order verification.</>
                  )}
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
                    marginTop: 4,
                  }}
                >
                  <div style={{ overflow: 'hidden', minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: '#777', fontWeight: 600 }}>
                      {language === 'np' ? 'तपाईंको व्यक्तिगत सिफारिस लिङ्क (ग्राहकले रु. ३०० छुट पाउनेछन्):' : 'Your Personalized Referral Link (Buyers get NPR 300 Off):'}
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1B7F5E', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
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
                    <span>{copiedLink ? (language === 'np' ? 'प्रतिलिपि गरियो!' : 'Copied!') : (language === 'np' ? 'लिङ्क प्रतिलिपि' : 'Copy Link')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Google Authentication Status */}
            {user ? (
              <div
                style={{
                  background: '#F0F9F5',
                  border: '1.5px solid #1B7F5E',
                  borderRadius: 14,
                  padding: '14px 20px',
                  marginBottom: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img
                    src={user.avatar}
                    alt={user.name}
                    style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid #1B7F5E' }}
                  />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 13.5, color: '#1B7F5E', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={16} />
                      <span>{language === 'np' ? 'गुगल खाता जोडिएको छ' : 'Linked with Google'}</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: '#2B1810', marginTop: 1 }}>
                      <strong>{user.name}</strong> • {user.email}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1B7F5E', background: '#D8F3E5', padding: '4px 12px', borderRadius: 99 }}>
                  {currentMatchedAdvocate
                    ? (language === 'np' ? 'सक्रिय सिर्जनाकर्ता प्रोफाइल' : 'Active Creator Account')
                    : (language === 'np' ? '१-ट्याप दर्ता तयार' : 'Ready to Activate')}
                </div>
              </div>
            ) : (
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
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#2B1810' }}>
                    {language === 'np' ? 'पहिले नै गुगल खाता छ?' : 'Already have a Google account?'}
                  </div>
                  <div style={{ fontSize: 12, color: '#6B564C', marginTop: 2 }}>
                    {language === 'np'
                      ? 'आफ्नो नाम, इमेल स्वतः भर्न र प्रत्यक्ष कमिसन हेर्न गुगलबाट लगइन गर्नुहोस्।'
                      : 'Sign in with Google to link your creator account across the entire shop.'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => loginGoogle()}
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
                  <span>{language === 'np' ? 'गुगलबाट तुरुन्त लगइन' : '1-Tap Google Sign-In'}</span>
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
                    {language === 'np' ? 'सिर्जनाकर्ताको पूरा नाम' : 'Creator / Influencer Full Name'} <span style={{ color: '#E53E3E' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={creatorName}
                    onChange={(e) => setCreatorName(e.target.value)}
                    placeholder={language === 'np' ? 'उदा: आयुष श्रेष्ठ' : 'e.g. Aayush Shrestha'}
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
                    {language === 'np' ? 'इमेल ठेगाना' : 'Email Address'} <span style={{ color: '#E53E3E' }}>*</span>
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
                  {language === 'np' ? 'आफ्नो अनुकूलित सिफारिस कोड छान्नुहोस्' : 'Choose Your Custom Referral Code'} <span style={{ color: '#E53E3E' }}>*</span>
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
                  {language === 'np' ? (
                    <>चेकआउटमा यो कोड प्रयोग गर्दा ग्राहकले <strong>रु. ३०० तत्काल छुट</strong> पाउनेछन्।</>
                  ) : (
                    <>Customers entering this code at checkout receive <strong>NPR 300 instant discount</strong>.</>
                  )}
                </div>
              </div>

              {/* Wallet Information Divider */}
              <div style={{ borderTop: '1.5px dashed #EADCCE', paddingTop: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Wallet size={18} color="#1B7F5E" />
                  <span style={{ fontWeight: 800, fontSize: 15, color: '#1B7F5E', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {language === 'np' ? 'नेपाली भुक्तानी वालेट विवरण' : 'Nepali Payment Wallet Credentials'}
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: '#6B564C', marginBottom: 16 }}>
                  {language === 'np'
                    ? 'रु. १०,००० पुग्ने बित्तिकै सिधै ईसेवा वा खल्तीमा भुक्तानी पठाइन्छ। कम्तीमा एउटा वालेट विवरण राख्नुहोस्।'
                    : 'Direct wallet transfers are executed upon reaching NPR 10,000 threshold. Input at least one wallet.'}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                  {/* eSewa ID */}
                  <div style={{ background: '#F4FAF6', border: '1px solid #C6E7D5', padding: '16px', borderRadius: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, background: '#60BB46', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 11 }}>e</div>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#2B1810' }}>
                        {language === 'np' ? 'ईसेवा आइडी / मोबाइल नम्बर' : 'eSewa ID / Mobile Number'}
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
                    <div style={{ fontSize: 11, color: '#6B564C', marginTop: 4 }}>
                      {language === 'np' ? '१० अंकको दर्ता भएको ईसेवा नम्बर' : '10-digit registered eSewa number'}
                    </div>
                  </div>

                  {/* Khalti Number */}
                  <div style={{ background: '#FAF5FF', border: '1px solid #E9D8FD', padding: '16px', borderRadius: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, background: '#5C2D91', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 11 }}>K</div>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#2B1810' }}>
                        {language === 'np' ? 'खल्ती दर्ता भएको मोबाइल नम्बर' : 'Khalti Registered Mobile Number'}
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
                    <div style={{ fontSize: 11, color: '#6B564C', marginTop: 4 }}>
                      {language === 'np' ? '१० अंकको दर्ता भएको खल्ती नम्बर' : '10-digit registered Khalti number'}
                    </div>
                  </div>
                </div>

                {/* Account Holder Name */}
                <div style={{ marginTop: 18 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#2B1810' }}>
                    {language === 'np' ? 'वालेट खातावालाको पूरा नाम' : 'Wallet Account Holder Full Name'} <span style={{ color: '#E53E3E' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    placeholder={language === 'np' ? 'तपाईंको ईसेवा वा खल्ती केवाइसी (KYC) मा भएको नाम' : 'Must match name registered in your eSewa/Khalti KYC'}
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
                    {language === 'np' ? 'सामाजिक सञ्जाल प्रोफाइल (इन्स्टाग्राम, टिकटक, युट्युब)' : 'Social Profile / Handle (Instagram, TikTok, YouTube)'}
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
                  <span>
                    {isSubmitting
                      ? (language === 'np' ? 'सुरक्षित गर्दै र दर्ता गर्दै...' : 'Securing & Registering on Edge...')
                      : (language === 'np' ? 'eSewa / Khalti भुक्तानी सुरक्षित र प्रमाणीकरण गर्नुहोस्' : 'Save & Authenticate eSewa / Khalti Payouts')}
                  </span>
                </button>
              </div>

              {/* Security Footnote */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, color: '#777', textAlign: 'center' }}>
                <Lock size={12} color="#1B7F5E" />
                <span>
                  {language === 'np'
                    ? 'क्लाउडफ्लेयर एजमा इन्क्रिप्टेड र मर्चेन्ट अडिट लग सुरक्षित गरिएको।'
                    : 'Encrypted on Cloudflare Edge with automated audit logging to merchant Google Sheets.'}
                </span>
              </div>
            </form>
          </div>
        ) : activeTab === 'analytics' ? (
          /* Live Creator Analytics & Money System Tab */
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
            {/* Header & Code Selection Strip */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 14,
                borderBottom: '1px solid #EADCCE',
                paddingBottom: 18,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={20} color="#1B7F5E" />
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#2B1810' }}>
                    {language === 'np' ? 'मेरो लाइभ सिफारिस तथ्यांक र आम्दानी' : 'My Live Referral Stats & Money Earned'}
                  </h2>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#6B564C' }}>
                  {language === 'np'
                    ? 'तपाईंको कस्टम सम्बद्ध लिङ्क र समुदायका अर्डरहरूको वास्तविक समय तथ्यांक।'
                    : 'Real-time analytics for your custom affiliate link and community orders.'}
                </p>
              </div>

              {/* Code selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#555' }}>
                  {language === 'np' ? 'हेरिएको कोड:' : 'Viewing Code:'}
                </span>
                <input
                  type="text"
                  value={analyticsCode}
                  onChange={(e) => setAnalyticsCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                  placeholder="CODE"
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1.5px solid #D4AF37',
                    fontWeight: 800,
                    fontSize: 13,
                    color: '#1B7F5E',
                    width: 140,
                    textAlign: 'center',
                    textTransform: 'uppercase',
                  }}
                />
              </div>
            </div>

            {/* Quick Chips to toggle known codes */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: '#888' }}>
                {language === 'np' ? 'द्रुत चयन:' : 'Quick Select:'}
              </span>
              {Array.from(
                new Set([(allAdvocates || []).map((a) => a.code), referralCode, activeReferralCode].flat())
              )
                .filter(Boolean)
                .map((code) => (
                <button
                  key={code}
                  onClick={() => setAnalyticsCode(code)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 99,
                    border: analyticsCode === code ? '1.5px solid #1B7F5E' : '1px solid #D4C5B9',
                    background: analyticsCode === code ? '#E0F3EA' : '#FAF2E9',
                    color: analyticsCode === code ? '#1B7F5E' : '#555',
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {code}
                </button>
              ))}
            </div>

            {/* Metric KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              {/* Clicks */}
              <div style={{ background: '#FAF2E9', padding: '16px 20px', borderRadius: 14, border: '1px solid #EADCCE' }}>
                <div style={{ fontSize: 12, color: '#777', textTransform: 'uppercase', fontWeight: 700 }}>
                  {language === 'np' ? 'लिङ्क क्लिक / आगन्तुकहरू' : 'Link Clicks / Visitors'}
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#2B1810', marginTop: 4 }}>
                  {totalClicksCount}
                </div>
                <div style={{ fontSize: 11.5, color: '#1B7F5E', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ArrowUpRight size={13} />
                  <span>
                    {language === 'np' ? 'जना तपाईंको लिङ्कबाट आए' : 'People came through your link'}
                  </span>
                </div>
              </div>

              {/* Orders Placed */}
              <div style={{ background: '#FAF2E9', padding: '16px 20px', borderRadius: 14, border: '1px solid #EADCCE' }}>
                <div style={{ fontSize: 12, color: '#777', textTransform: 'uppercase', fontWeight: 700 }}>
                  {language === 'np' ? 'सफल सिफारिस अर्डरहरू' : 'Referred Orders Converted'}
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#1B7F5E', marginTop: 4 }}>
                  {matchedCreatorOrders.length}
                </div>
                <div style={{ fontSize: 11.5, color: '#666', marginTop: 4 }}>
                  {currentMatchedAdvocate?.ordersDeliveredCount || matchedCreatorOrders.filter(o => o.status === 'delivered').length} {language === 'np' ? 'डेलिभर भइसकेको' : 'Delivered'}
                </div>
              </div>

              {/* Conversion Rate */}
              <div style={{ background: '#FAF2E9', padding: '16px 20px', borderRadius: 14, border: '1px solid #EADCCE' }}>
                <div style={{ fontSize: 12, color: '#777', textTransform: 'uppercase', fontWeight: 700 }}>
                  {language === 'np' ? 'रूपान्तरण दर (Conversion Rate)' : 'Conversion Rate'}
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#561F1F', marginTop: 4 }}>
                  {computedRate}%
                </div>
                <div style={{ fontSize: 11.5, color: '#1B7F5E', marginTop: 4 }}>
                  {language === 'np' ? 'क्लिकबाट सामान खरिद गर्ने ग्राहकहरू' : 'Clicks converted to buying customers'}
                </div>
              </div>

              {/* Total Royalties Accrued (10%) */}
              <div style={{ background: '#F4FAF6', padding: '16px 20px', borderRadius: 14, border: '1.5px solid #C6E7D5' }}>
                <div style={{ fontSize: 12, color: '#1B7F5E', textTransform: 'uppercase', fontWeight: 800 }}>
                  {language === 'np' ? 'कुल १०% कमाएको रोयल्टी' : 'Total 10% Royalties Earned'}
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#1B7F5E', marginTop: 4 }}>
                  NPR {totalCreatorEarned.toLocaleString()}
                </div>
                <div style={{ fontSize: 11.5, color: '#1B7F5E', marginTop: 4, fontWeight: 700 }}>
                  {language === 'np' ? 'प्रत्येक प्रमाणित अर्डरमा १०% नगद' : '10% cash on every verified order'}
                </div>
              </div>
            </div>

            {/* NPR 10,000 Threshold Progress Banner */}
            <div
              style={{
                background: isThresholdReached
                  ? 'linear-gradient(135deg, rgba(27,127,94,0.08) 0%, rgba(212,175,55,0.12) 100%)'
                  : '#FFF8F0',
                border: isThresholdReached ? '2px solid #1B7F5E' : '1.5px solid #D4AF37',
                borderRadius: 16,
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Wallet size={20} color={isThresholdReached ? '#1B7F5E' : '#D4AF37'} />
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#2B1810' }}>
                      {language === 'np' ? 'रु १०,००० भुक्तानी माइलस्टोन प्रगति' : 'NPR 10,000 Payout Milestone Progress'}
                    </h3>
                  </div>
                  <div style={{ fontSize: 13, color: '#6B564C', marginTop: 4 }}>
                    {language === 'np' ? 'झिक्न मिल्ने मौज्दात: ' : 'Withdrawable Balance: '}
                    <strong style={{ color: '#1B7F5E', fontSize: 15 }}>NPR {withdrawableCash.toLocaleString()}</strong>
                    {language === 'np' ? ' (रु १०,००० को लक्ष्य मध्ये)' : ' of NPR 10,000 threshold'}
                  </div>
                </div>

                {isThresholdReached ? (
                  <button
                    onClick={() => handleRequestPayout(withdrawableCash, (esewaId ? 'esewa' : 'khalti'), (esewaId || khaltiNumber || '9801234567'))}
                    disabled={isRequestingPayout}
                    style={{
                      padding: '10px 22px',
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #1B7F5E 0%, #135F46 100%)',
                      color: '#FFF',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: isRequestingPayout ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 14px rgba(27,127,94,0.3)',
                    }}
                  >
                    {isRequestingPayout
                      ? (language === 'np' ? 'प्रक्रियामा छ...' : 'Submitting to Queue...')
                      : (language === 'np' ? '🎉 सिधै वालेटमा भुक्तानी अनुरोध गर्नुहोस्' : '🎉 Request Direct Wallet Payout')}
                  </button>
                ) : (
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#8B3A3A', background: '#FFEBEB', padding: '6px 12px', borderRadius: 6 }}>
                    {language === 'np'
                      ? `भुक्तानी खोल्न रु ${(10000 - withdrawableCash).toLocaleString()} बाँकी छ`
                      : `NPR ${(10000 - withdrawableCash).toLocaleString()} remaining to unlock payout`}
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: 10, background: '#E2E8F0', borderRadius: 99, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${thresholdPercent}%`,
                    height: '100%',
                    background: isThresholdReached ? 'linear-gradient(90deg, #1B7F5E, #D4AF37)' : '#1B7F5E',
                    borderRadius: 99,
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#777' }}>
                <span>NPR 0</span>
                <span>{thresholdPercent}% {language === 'np' ? 'पुग्यो' : 'Reached'}</span>
                <span>{language === 'np' ? 'रु १०,००० लक्ष्य' : 'NPR 10,000 Milestone'}</span>
              </div>
            </div>

            {/* Recent Orders Feeds Attributed to this Code */}
            <div>
              <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 800, color: '#2B1810' }}>
                {language === 'np'
                  ? `तपाईंको कोड प्रयोग गर्ने हालका ग्राहकहरू (${matchedCreatorOrders.length})`
                  : `Recent Customers Who Used Your Code (${matchedCreatorOrders.length})`}
              </h3>
              {matchedCreatorOrders.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: '#777', background: '#FAF2E9', borderRadius: 12, fontSize: 13 }}>
                  {language === 'np' ? (
                    <><strong>{analyticsCode}</strong> कोड प्रयोग गरेर अहिलेसम्म कुनै अर्डर भएको छैन। प्रत्येक अर्डरमा १०% कमाउन आफ्नो लिङ्क सेयर गर्नुहोस्!</>
                  ) : (
                    <>No orders placed yet using code <strong>{analyticsCode}</strong>. Share your affiliate link to earn 10% on every order!</>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {matchedCreatorOrders.map((order) => {
                    const discount = order.referralDiscountAmount || 300;
                    const commission = order.referralCommissionAmount || Math.round((order.subtotalAmount - discount) * 0.10);

                    return (
                      <div
                        key={order.id}
                        style={{
                          background: '#FAF2E9',
                          padding: '14px 18px',
                          borderRadius: 12,
                          border: '1px solid #EADCCE',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 10,
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 800, fontSize: 14, color: '#2B1810' }}>
                              #{order?.orderNumber ? order.orderNumber.slice(0, 5) : 'DAW-0'}***
                            </span>
                            <span style={{ fontSize: 11, color: '#666' }}>
                              {language === 'np'
                                ? `• ग्राहक: ${order?.shippingAddress?.city || 'नेपाल'}`
                                : `• Customer in ${order?.shippingAddress?.city || 'Nepal'}`}
                            </span>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: 4,
                                textTransform: 'uppercase',
                                background: order.status === 'delivered' ? '#E0F3EA' : '#FFF3CD',
                                color: order.status === 'delivered' ? '#1B7F5E' : '#856404',
                              }}
                            >
                              {order.status === 'delivered'
                                ? (language === 'np' ? '✓ भुक्तान योग्य' : '✓ Credited')
                                : order.status}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>
                            {(order.items || []).map((it, idx) => (
                              <span key={idx}>
                                {it?.product?.title?.en || (typeof it?.product?.title === 'string' ? it.product.title : 'Boutique Collection')} ({it?.selectedSize || 'Standard'}) × {it?.quantity || 1}
                                {idx < (order.items?.length || 0) - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 14, fontWeight: 900, color: '#1B7F5E' }}>
                            +NPR {commission.toLocaleString()} ({language === 'np' ? '१०% रोयल्टी' : '10% Royalty'})
                          </div>
                          <div style={{ fontSize: 11, color: '#2B6CB0' }}>
                            {language === 'np' ? 'ग्राहकले छुट पाए: ' : 'Customer Saved: '}NPR {discount.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Linked Wallet Info */}
            <div style={{ background: '#F8F4EE', padding: '16px 20px', borderRadius: 12, border: '1px solid #EADCCE', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#666', textTransform: 'uppercase' }}>
                  {language === 'np' ? 'जोडिएको भुक्तानी वालेट' : 'Linked Payout Wallet'}
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#2B1810', marginTop: 2 }}>
                  eSewa: {currentMatchedAdvocate?.esewaId || esewaId || '9801234567'} • Khalti: {currentMatchedAdvocate?.khaltiNumber || khaltiNumber || '9801234567'}
                </div>
              </div>
              <button
                onClick={() => setActiveTab('payout')}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: '#FFF',
                  border: '1px solid #D4C5B9',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#561F1F',
                  cursor: 'pointer',
                }}
              >
                {language === 'np' ? 'वालेट नम्बरहरू अपडेट गर्नुहोस्' : 'Update Wallet Numbers'}
              </button>
            </div>
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
                {language === 'np'
                  ? 'दावोस्ती क्रिएटर गिल्ड भुक्तानी र ट्र्याकिङ नियमहरू'
                  : 'Dawosti Creator Guild Payout & Tracking Protocol'}
              </h2>
              <p style={{ fontSize: 14, color: '#6B564C', lineHeight: 1.6 }}>
                {language === 'np'
                  ? 'हाम्रो सिफारिस र सम्बद्ध प्रणाली नेपाली फेसन पारखीहरू र कन्टेन्ट क्रिएटरहरूलाई पूर्ण पारदर्शिताका साथ पुरस्कृत गर्न डिजाइन गरिएको हो।'
                  : 'Our referral and affiliate architecture is designed to reward genuine Nepalese fashion curators and content creators with total transparency.'}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              <div style={{ background: '#FAF2E9', padding: '18px', borderRadius: 14, border: '1px solid #EADCCE' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#2B1810', marginBottom: 6 }}>
                  {language === 'np' ? '१. ग्राहक छुट' : '1. Customer Discount'}
                </div>
                <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>
                  {language === 'np'
                    ? 'तपाईंको कोड मार्फत खरिद गर्ने प्रत्येक ग्राहकले उनीहरूको अन्तिम अर्डरमा तत्काल रु ३०० छुट पाउनेछन्।'
                    : 'Every customer purchasing through your code receives an instant NPR 300 discount deducted on their final order.'}
                </div>
              </div>

              <div style={{ background: '#FAF2E9', padding: '18px', borderRadius: 14, border: '1px solid #EADCCE' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#2B1810', marginBottom: 6 }}>
                  {language === 'np' ? '२. १०% नगद रोयल्टी' : '2. 10% Cash Royalty'}
                </div>
                <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>
                  {language === 'np'
                    ? 'प्रत्येक प्रमाणित र सफलतापूर्वक डेलिभर भएको बुटिक पोशाकमा तपाईंले शुद्ध मूल्यको १०% कमाउनुहुनेछ।'
                    : 'You earn 10% of the net merchandise value for every verified and successfully delivered boutique garment.'}
                </div>
              </div>

              <div style={{ background: '#FAF2E9', padding: '18px', borderRadius: 14, border: '1px solid #EADCCE' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#2B1810', marginBottom: 6 }}>
                  {language === 'np' ? '३. रु १०,००० भुक्तानी सीमा' : '3. NPR 10k Threshold'}
                </div>
                <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>
                  {language === 'np'
                    ? 'जम्मा भएको कमिसन रु १०,००० पुगेपछि भुक्तानी स्वतः प्रक्रियामा जान्छ, र सिधै तपाईंको eSewa वा Khalti खातामा पठाइन्छ।'
                    : 'Payouts disburse automatically once accumulated commissions hit NPR 10,000, transferred directly to your designated eSewa or Khalti account.'}
                </div>
              </div>
            </div>

            <div style={{ background: '#FFF8F0', border: '1.5px solid #D4AF37', borderRadius: 14, padding: '18px 22px' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#561F1F', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={16} color="#561F1F" />
                <span>
                  {language === 'np'
                    ? 'धोखाधडी रोकथाम र ह्वाट्सएप एट्रिब्युसन सुरक्षा'
                    : 'Anti-Fraud & WhatsApp Attribution Safeguards'}
                </span>
              </div>
              <ul style={{ fontSize: 13, color: '#555', lineHeight: 1.6, paddingLeft: 20 }}>
                <li>
                  {language === 'np'
                    ? 'आफ्नै कोड प्रयोग गरेर आफ्नै लागि खरिद गर्दा (Self-referral) कमिसन मान्य हुने छैन।'
                    : 'Self-referrals (buying for oneself with one’s own code) are disqualified.'}
                </li>
                <li>
                  {language === 'np'
                    ? 'ग्राहकले तपाईंको लिङ्क क्लिक गर्दा वा चेकआउटमा कोड प्रविष्ट गर्दा सिफारिस स्थायी रूपमा लक हुन्छ।'
                    : 'Attribution is permanently locked when the customer clicks your link or enters your code at checkout.'}
                </li>
                <li>
                  {language === 'np' ? (
                    <>ह्वाट्सएप कन्सिएर्ज अर्डरहरूमा प्रमाणित रसिदमा सिधै <code>[Ref: YOURCODE]</code> समावेश गरिन्छ।</>
                  ) : (
                    <>WhatsApp concierge orders transmit <code>[Ref: YOURCODE]</code> directly in the verified dispatch receipt.</>
                  )}
                </li>
              </ul>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ marginTop: 'auto', backgroundColor: '#FFFFFF', borderTop: '1px solid #EADCCE', padding: '24px 20px', textAlign: 'center', fontSize: 12, color: '#777' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div>© {new Date().getFullYear()} DAWOSTI • Fashion Guild • Kathmandu, Nepal</div>
          <div style={{ display: 'flex', gap: 16 }}>
            <a href="https://dawosti.com" style={{ color: '#1B7F5E', textDecoration: 'none', fontWeight: 600 }}>dawosti.com</a>
            <span>•</span>
            <a href="https://referral.dawosti.com" style={{ color: '#1B7F5E', textDecoration: 'none', fontWeight: 600 }}>referral.dawosti.com</a>
            <span>•</span>
            <a href="https://wa.me/9779808251494" target="_blank" rel="noreferrer" style={{ color: '#1B7F5E', textDecoration: 'none', fontWeight: 600 }}>
              {language === 'np' ? 'ह्वाट्सएप कन्सिएर्ज' : 'WhatsApp Concierge'}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
