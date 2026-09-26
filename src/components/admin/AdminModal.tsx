import React, { useEffect, useState } from 'react';
import {
  X,
  Lock,
  ShieldAlert,
  LogOut,
  Calculator,
  ShoppingBag,
  Award,
  Users,
  ShieldCheck,
  QrCode,
  Crown,
  Shield,
  Briefcase,
  Scissors,
} from 'lucide-react';
import { useAdminStore, AdminTab, isTabAllowedForRole } from '../../stores/adminStore';
import { ProfitSimulatorTab } from './tabs/ProfitSimulatorTab';
import { OrdersTab } from './tabs/OrdersTab';
import { ReferralsTab } from './tabs/ReferralsTab';
import { WhitelistTab } from './tabs/WhitelistTab';
import { PaymentQRTab } from './tabs/PaymentQRTab';
import { AdminRole } from '../../types';

export const AdminModal: React.FC = () => {
  const {
    isAdminModalOpen,
    closeAdmin,
    adminActiveTab,
    setAdminTab,
    currentUser,
    currentRole,
    isAuthorizedAdmin,
    authError,
    isAuthLoading,
    loginGoogle,
    logout,
  } = useAdminStore();

  const [devEmailInput, setDevEmailInput] = useState('');
  const [showDevLogin, setShowDevLogin] = useState(false);

  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAdminModalOpen) closeAdmin();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdminModalOpen, closeAdmin]);

  if (!isAdminModalOpen) return null;

  const renderRoleBadge = (role: AdminRole | null) => {
    if (!role) return null;
    switch (role) {
      case 'owner':
        return (
          <span
            style={{
              background: '#FFF3CD',
              color: '#856404',
              border: '1px solid #FFEEBA',
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Crown size={12} color="#D4AF37" />
            OWNER
          </span>
        );
      case 'super_admin':
        return (
          <span
            style={{
              background: '#F8D7DA',
              color: '#721C24',
              border: '1px solid #F5C6CB',
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Shield size={12} color="#721C24" />
            SUPER ADMIN
          </span>
        );
      case 'manager':
        return (
          <span
            style={{
              background: '#CCE5FF',
              color: '#004085',
              border: '1px solid #B8DAFF',
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Briefcase size={12} color="#004085" />
            MANAGER
          </span>
        );
      case 'staff':
      default:
        return (
          <span
            style={{
              background: '#E0F3EA',
              color: '#1B7F5E',
              border: '1px solid #C3E6CB',
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Scissors size={12} color="#1B7F5E" />
            STAFF
          </span>
        );
    }
  };

  const allTabs: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'orders', label: 'Orders & Dispatch', icon: ShoppingBag },
    { id: 'referrals', label: 'Creator Payouts', icon: Award },
    { id: 'profit', label: 'Unit Economics & Margins', icon: Calculator },
    { id: 'payment-qr', label: 'Payment QR Terminal', icon: QrCode },
    { id: 'whitelist', label: 'Staff & Owner Roles', icon: Users },
  ];

  // Filter tabs strictly by user's assigned role
  const availableTabs = allTabs.filter((tab) => isTabAllowedForRole(tab.id, currentRole));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(43, 24, 16, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1060,
          maxHeight: '92vh',
          backgroundColor: '#FFF8F0',
          borderRadius: 12,
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          border: '2px solid #D4AF37',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Top Bar */}
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
            <span style={{ width: 8, height: 8, transform: 'rotate(45deg)', backgroundColor: '#D4AF37' }} />
            <h2
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              DAWOSTI Boutique Management Console
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {currentUser && isAuthorizedAdmin && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  style={{ width: 24, height: 24, borderRadius: '50%', border: '1.5px solid #D4AF37' }}
                />
                <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>{currentUser.email}</span>
                {renderRoleBadge(currentRole)}
                <button
                  onClick={logout}
                  title="Sign Out"
                  style={{ background: 'none', border: 'none', color: '#D4AF37', cursor: 'pointer', padding: 2 }}
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
            <button
              onClick={closeAdmin}
              style={{ background: 'none', border: 'none', color: '#FFF8F0', cursor: 'pointer', padding: 4 }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Auth Gate: Not Logged In */}
        {!currentUser ? (
          <div
            style={{
              padding: '60px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                backgroundColor: '#FAF2E9',
                border: '1px solid #EADCCE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Lock size={26} color="#8B3A3A" />
            </div>
            <div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: 20, fontWeight: 700, color: '#2B1810' }}>
                Store Staff & Owner Sign-In
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: '#666', maxWidth: 460 }}>
                Sign in with an authorized Google Workspace or Gmail account to access order management,
                payout dispatch, and catalog administration.
              </p>
            </div>

            {authError && (
              <div
                style={{
                  padding: '10px 18px',
                  background: '#FFF0F0',
                  border: '1px solid #F5C2C7',
                  color: '#B02A37',
                  borderRadius: 6,
                  fontSize: 13,
                  maxWidth: 500,
                }}
              >
                {authError}
              </div>
            )}

            <button
              onClick={() => loginGoogle()}
              disabled={isAuthLoading}
              style={{
                marginTop: 8,
                padding: '12px 28px',
                backgroundColor: '#8B3A3A',
                color: '#FFF',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 700,
                cursor: isAuthLoading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(139, 58, 58, 0.25)',
              }}
            >
              <ShieldCheck size={18} />
              <span>{isAuthLoading ? 'Authenticating...' : 'Sign In with Authorized Google Account'}</span>
            </button>

            {/* Quick manual email sign-in for dev testing / domain bypass */}
            <div style={{ marginTop: 8 }}>
              <button
                onClick={() => setShowDevLogin(!showDevLogin)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#888',
                  fontSize: 11,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                }}
              >
                {showDevLogin ? 'Hide quick email access' : 'Authorized email direct access'}
              </button>
              {showDevLogin && (
                <div style={{ marginTop: 10, display: 'flex', gap: 6, justifyContent: 'center' }}>
                  <input
                    type="email"
                    value={devEmailInput}
                    onChange={(e) => setDevEmailInput(e.target.value)}
                    placeholder="e.g. sagardawadi16@gmail.com"
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: '1px solid #D4C5B9',
                      fontSize: 12,
                      width: 220,
                    }}
                  />
                  <button
                    onClick={() => {
                      if (devEmailInput.trim()) loginGoogle(devEmailInput.trim());
                    }}
                    style={{
                      padding: '6px 12px',
                      background: '#8B3A3A',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Enter
                  </button>
                  <button
                    type="button"
                    onClick={() => loginGoogle('sagardawadi16@gmail.com')}
                    title="1-Click Owner Sign In"
                    style={{
                      padding: '6px 10px',
                      background: '#FFF3CD',
                      color: '#856404',
                      border: '1px solid #FFEEBA',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    👑 Sagar (Owner)
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : !isAuthorizedAdmin ? (
          /* Auth Gate: Logged In, but NOT on Whitelist (Strict 403 Lockout) */
          <div
            style={{
              padding: '60px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                backgroundColor: '#FFF0F0',
                border: '1px solid #F5C2C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldAlert size={26} color="#B02A37" />
            </div>
            <div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: 20, fontWeight: 700, color: '#B02A37' }}>
                403 Access Denied: Unauthorized Account
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: '#666', maxWidth: 450, lineHeight: 1.6 }}>
                Account <strong>{currentUser.email}</strong> is not assigned an active Staff or Owner role.
                Contact Sagar Dawadi to be granted access.
              </p>
            </div>

            <button
              onClick={logout}
              style={{
                marginTop: 8,
                padding: '10px 22px',
                backgroundColor: '#2B1810',
                color: '#FFF',
                border: 'none',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <LogOut size={15} />
              <span>Switch / Sign Out Account</span>
            </button>
          </div>
        ) : (
          /* Authorized Admin View */
          <>
            {/* Tabs Navigation */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid #EADCCE',
                backgroundColor: '#FAF2E9',
                overflowX: 'auto',
              }}
            >
              {availableTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = adminActiveTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setAdminTab(tab.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '14px 20px',
                      border: 'none',
                      backgroundColor: isActive ? '#FFF8F0' : 'transparent',
                      color: isActive ? '#8B3A3A' : '#666',
                      fontWeight: isActive ? 700 : 500,
                      borderBottom: isActive ? '3px solid #8B3A3A' : '3px solid transparent',
                      cursor: 'pointer',
                      fontSize: 13,
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Body */}
            <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
              {adminActiveTab === 'orders' && <OrdersTab />}
              {adminActiveTab === 'referrals' && <ReferralsTab />}
              {adminActiveTab === 'profit' && isTabAllowedForRole('profit', currentRole) && <ProfitSimulatorTab />}
              {adminActiveTab === 'payment-qr' && isTabAllowedForRole('payment-qr', currentRole) && <PaymentQRTab />}
              {adminActiveTab === 'whitelist' && isTabAllowedForRole('whitelist', currentRole) && <WhitelistTab />}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
