import React, { useEffect } from 'react';
import { X, Lock, ShieldAlert, LogOut, Calculator, ShoppingBag, Award, Users, ShieldCheck } from 'lucide-react';
import { useAdminStore, AdminTab } from '../../stores/adminStore';
import { ProfitSimulatorTab } from './tabs/ProfitSimulatorTab';
import { OrdersTab } from './tabs/OrdersTab';
import { ReferralsTab } from './tabs/ReferralsTab';
import { WhitelistTab } from './tabs/WhitelistTab';

export const AdminModal: React.FC = () => {
  const {
    isAdminModalOpen,
    closeAdmin,
    adminActiveTab,
    setAdminTab,
    currentUser,
    isAuthorizedAdmin,
    authError,
    isAuthLoading,
    loginGoogle,
    logout,
  } = useAdminStore();

  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAdminModalOpen) closeAdmin();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdminModalOpen, closeAdmin]);

  if (!isAdminModalOpen) return null;

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
          maxWidth: 1040,
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
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              DAWOSTI Admin & Profit Operations
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {currentUser && isAuthorizedAdmin && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid #D4AF37' }}
                />
                <span style={{ color: 'rgba(255,255,255,0.85)' }}>{currentUser.email}</span>
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
          <div style={{ padding: '60px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#FAF2E9', border: '1px solid #EADCCE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={26} color="#8B3A3A" />
            </div>
            <div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: 20, fontWeight: 700, color: '#2B1810' }}>
                Dawosti Store Management Console
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: '#666', maxWidth: 420 }}>
                Sign in with an authorized Google Workspace / Gmail account to access unit economics, order approvals, and creator payouts.
              </p>
            </div>

            {authError && (
              <div style={{ padding: '8px 16px', background: '#FFF0F0', border: '1px solid #F5C2C7', color: '#B02A37', borderRadius: 6, fontSize: 13 }}>
                {authError}
              </div>
            )}

            <button
              onClick={loginGoogle}
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
          </div>
        ) : !isAuthorizedAdmin ? (
          /* Auth Gate: Logged In, but NOT on Whitelist (Strict 403 Lockout) */
          <div style={{ padding: '60px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#FFF0F0', border: '1px solid #F5C2C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={26} color="#B02A37" />
            </div>
            <div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: 20, fontWeight: 700, color: '#B02A37' }}>
                403 Access Denied: Unauthorized Account
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: '#666', maxWidth: 450, lineHeight: 1.6 }}>
                Account <strong>{currentUser.email}</strong> is not present on the Dawosti Admin Whitelist.
                To access this console, contact Sagar to grant whitelist privileges.
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
              {[
                { id: 'profit' as AdminTab, label: 'Profit Formula Engine', icon: Calculator },
                { id: 'orders' as AdminTab, label: 'Orders & Verification', icon: ShoppingBag },
                { id: 'referrals' as AdminTab, label: 'Creator Referrals & Payouts', icon: Award },
                { id: 'whitelist' as AdminTab, label: 'Gmail Access Whitelist', icon: Users },
              ].map((tab) => {
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
              {adminActiveTab === 'profit' && <ProfitSimulatorTab />}
              {adminActiveTab === 'orders' && <OrdersTab />}
              {adminActiveTab === 'referrals' && <ReferralsTab />}
              {adminActiveTab === 'whitelist' && <WhitelistTab />}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
