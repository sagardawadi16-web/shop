import React, { useRef, useEffect } from 'react';
import { User, LogOut, PackageCheck, Award, ShieldCheck, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useReferralStore } from '../../stores/referralStore';
import { useAdminStore } from '../../stores/adminStore';
import { checkIsEmailWhitelisted } from '../../services/firestoreWhitelist';

export const UserAuthButton: React.FC<{ isMobile?: boolean }> = ({ isMobile = false }) => {
  const { user, isLoading, loginGoogle, logout, isUserMenuOpen, setIsUserMenuOpen } = useAuthStore();
  const { language, setIsOrderTrackingOpen } = useSettingsStore();
  const { openCreatorPortal } = useReferralStore();
  const { openAdmin, whitelistEntries } = useAdminStore();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isUserMenuOpen, setIsUserMenuOpen]);

  const isWhitelisted = user ? checkIsEmailWhitelisted(user.email, whitelistEntries) : false;

  if (isMobile) {
    if (!user) {
      return (
        <button
          onClick={loginGoogle}
          disabled={isLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '12px 16px',
            borderRadius: 12,
            background: '#FFFFFF',
            border: '1.5px solid #D4AF37',
            color: '#2B1810',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            width: '100%',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>{isLoading ? 'Signing In...' : language === 'np' ? 'गुगलबाट लगइन गर्नुहोस्' : 'Sign in with Google'}</span>
        </button>
      );
    }

    return (
      <div style={{ background: '#FFF', borderRadius: 12, border: '1px solid #EADCCE', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={user.avatar} alt={user.name} style={{ width: 34, height: 34, borderRadius: '50%', border: '1.5px solid #D4AF37' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#2B1810', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name}
            </div>
            <div style={{ fontSize: 11, color: '#777', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, borderTop: '1px dashed #EADCCE', paddingTop: 8 }}>
          {isWhitelisted && (
            <button
              onClick={openAdmin}
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: 6,
                background: '#8B3A3A',
                color: '#FFF',
                border: 'none',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Admin
            </button>
          )}
          <button
            onClick={logout}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: 6,
              background: '#FAF2E9',
              color: '#8B3A3A',
              border: '1px solid #EADCCE',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    );
  }

  // Desktop Header View
  if (!user) {
    return (
      <button
        onClick={loginGoogle}
        disabled={isLoading}
        title="Sign in with Google"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: 99,
          background: '#FFFFFF',
          border: '1px solid #EADCCE',
          color: '#2B1810',
          fontSize: 12,
          fontWeight: 700,
          cursor: isLoading ? 'not-allowed' : 'pointer',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          transition: 'all 0.2s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#8B3A3A';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#EADCCE';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
        <span>{isLoading ? '...' : language === 'np' ? 'साइन इन' : 'Sign In'}</span>
      </button>
    );
  }

  // Desktop Signed-In View with Dropdown
  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px 4px 5px',
          borderRadius: 99,
          background: '#FFFFFF',
          border: '1.5px solid #D4AF37',
          color: '#2B1810',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 700,
          boxShadow: '0 2px 6px rgba(212,175,55,0.15)',
        }}
      >
        <img
          src={user.avatar}
          alt={user.name}
          style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}
        />
        <span style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.name.split(' ')[0]}
        </span>
        <ChevronDown size={13} color="#666" />
      </button>

      {/* Luxury User Dropdown */}
      {isUserMenuOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 220,
            background: '#FFF8F0',
            border: '1.5px solid #D4AF37',
            borderRadius: 12,
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            padding: 8,
            zIndex: 60,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {/* User Details */}
          <div style={{ padding: '8px 10px', borderBottom: '1px solid #EADCCE', marginBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#2B1810' }}>{user.name}</div>
            <div style={{ fontSize: 11, color: '#777', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
          </div>

          {/* Quick Links */}
          <button
            onClick={() => {
              setIsOrderTrackingOpen(true);
              setIsUserMenuOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              border: 'none',
              background: 'transparent',
              borderRadius: 6,
              fontSize: 12.5,
              color: '#2B1810',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#FAF2E9')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <PackageCheck size={15} color="#8B3A3A" />
            <span>Track My Orders</span>
          </button>

          <button
            onClick={() => {
              openCreatorPortal();
              setIsUserMenuOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              border: 'none',
              background: 'transparent',
              borderRadius: 6,
              fontSize: 12.5,
              color: '#1B7F5E',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#E0F3EA')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <Award size={15} color="#1B7F5E" />
            <span>Creator Hub / Referrals</span>
          </button>

          {isWhitelisted && (
            <button
              onClick={() => {
                openAdmin();
                setIsUserMenuOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                border: 'none',
                background: '#FAF2E9',
                borderRadius: 6,
                fontSize: 12.5,
                color: '#8B3A3A',
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <ShieldCheck size={15} color="#8B3A3A" />
              <span>Admin Management</span>
            </button>
          )}

          <div style={{ borderTop: '1px solid #EADCCE', marginTop: 4, paddingTop: 4 }}>
            <button
              onClick={logout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                border: 'none',
                background: 'transparent',
                borderRadius: 6,
                fontSize: 12.5,
                color: '#B02A37',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#FFF0F0')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
