import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Trash2,
  Crown,
  Lock,
  Check,
  Search,
  Shield,
  Briefcase,
  Scissors,
  AlertTriangle,
} from 'lucide-react';
import { useAdminStore } from '../../../stores/adminStore';
import { MASTER_OWNER_EMAILS } from '../../../services/firestoreWhitelist';
import { AdminRole, AdminWhitelistEntry } from '../../../types';

export const WhitelistTab: React.FC = () => {
  const {
    whitelistEntries,
    currentRole,
    currentUser,
    addEmailToWhitelist,
    updateEmailRole,
    removeEmailFromWhitelist,
  } = useAdminStore();

  const [emailInput, setEmailInput] = useState('');
  const [roleInput, setRoleInput] = useState<AdminRole>('staff');
  const [notesInput, setNotesInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const canManageWhitelist = currentRole === 'owner' || currentRole === 'super_admin';

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = emailInput.trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      setToastMessage('Please enter a valid Gmail address.');
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    setIsSubmitting(true);
    try {
      await addEmailToWhitelist(clean, roleInput, notesInput.trim());
      setEmailInput('');
      setNotesInput('');
      setToastMessage(`Assigned ${roleInput.toUpperCase()} role to: ${clean}`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setToastMessage(`Failed to add: ${err?.message || err}`);
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (email: string, newRole: AdminRole) => {
    try {
      await updateEmailRole(email, newRole);
      setToastMessage(`Updated ${email} to ${newRole.toUpperCase()}`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: any) {
      setToastMessage(`Failed to update role: ${err?.message || err}`);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleRevoke = async (email: string) => {
    if (window.confirm(`Are you sure you want to revoke access for ${email}?`)) {
      await removeEmailFromWhitelist(email);
      setToastMessage(`Revoked access for: ${email}`);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  // Filtered list
  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return whitelistEntries;
    return whitelistEntries.filter(
      (e) =>
        e.email.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q) ||
        (e.notes && e.notes.toLowerCase().includes(q))
    );
  }, [whitelistEntries, searchQuery]);

  const renderRoleBadge = (role: AdminRole) => {
    switch (role) {
      case 'owner':
        return (
          <span
            style={{
              background: '#FFF3CD',
              color: '#856404',
              border: '1px solid #FFEEBA',
              padding: '3px 8px',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 700,
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
              padding: '3px 8px',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Shield size={12} color="#8A1C2E" />
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
              padding: '3px 8px',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 700,
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
              padding: '3px 8px',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 700,
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Info */}
      <div
        style={{
          background: '#FAF2E9',
          padding: '16px 20px',
          borderRadius: 8,
          border: '1px solid #EADCCE',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <ShieldCheck size={20} color="#8B3A3A" />
            <h3 style={{ margin: 0, fontSize: 18, color: '#2B1810', fontWeight: 700 }}>
              Gmail Access & Staff/Owner Permissions Manager
            </h3>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: '#666', lineHeight: 1.5 }}>
            Assign roles (Owner, Super Admin, Manager, Staff) to Gmail accounts. Changes take effect
            immediately and persist across edge deployments.
          </p>
        </div>

        {currentUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, background: '#FFF', padding: '6px 12px', borderRadius: 6, border: '1px solid #EADCCE' }}>
            <span style={{ color: '#666' }}>Your Role:</span>
            {renderRoleBadge(currentRole || 'staff')}
          </div>
        )}
      </div>

      {toastMessage && (
        <div
          style={{
            padding: '10px 14px',
            background: '#E0F3EA',
            color: '#1B7F5E',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 2px 8px rgba(27, 127, 94, 0.15)',
          }}
        >
          <Check size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Access Permission Warning for Non-Owners */}
      {!canManageWhitelist && (
        <div
          style={{
            padding: '12px 16px',
            background: '#FFF3CD',
            border: '1px solid #FFEEBA',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#856404',
            fontSize: 13,
          }}
        >
          <AlertTriangle size={18} />
          <span>
            You are currently signed in as <strong>{currentRole?.toUpperCase() || 'STAFF'}</strong>. Only{' '}
            <strong>Store Owners</strong> and <strong>Super Admins</strong> can add, edit, or revoke whitelist accounts.
          </span>
        </div>
      )}

      {/* Add New Member Form (Restricted to Owner / Super Admin) */}
      {canManageWhitelist && (
        <div style={{ background: '#FFF8F0', padding: 20, borderRadius: 8, border: '1px solid #EADCCE' }}>
          <h4
            style={{
              margin: '0 0 14px 0',
              fontSize: 15,
              fontWeight: 700,
              color: '#2B1810',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <UserPlus size={16} color="#8B3A3A" />
            <span>Grant Role & Access to a Google / Gmail Account</span>
          </h4>

          <form
            onSubmit={handleAdd}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
              alignItems: 'flex-end',
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 }}>
                Google Email Address:
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="e.g. staff.member@gmail.com"
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 6,
                  border: '1px solid #D4C5B9',
                  fontSize: 13,
                  backgroundColor: '#FFF',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 }}>
                Role & Scope:
              </label>
              <select
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value as AdminRole)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 6,
                  border: '1px solid #D4C5B9',
                  fontSize: 13,
                  backgroundColor: '#FFF',
                  fontWeight: 600,
                }}
              >
                <option value="owner">👑 Store Owner (Master Admin & Whitelist)</option>
                <option value="super_admin">⚡ Super Admin (Full Store Access)</option>
                <option value="manager">🏛️ Store Manager (Catalog & Margins)</option>
                <option value="staff">✂️ Boutique Staff (Orders & Dispatch Payouts)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 }}>
                Notes / Full Name:
              </label>
              <input
                type="text"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="e.g. Lead Dispatcher / Boutique Partner"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 6,
                  border: '1px solid #D4C5B9',
                  fontSize: 13,
                  backgroundColor: '#FFF',
                }}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  backgroundColor: '#8B3A3A',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <UserPlus size={15} />
                <span>{isSubmitting ? 'Assigning...' : 'Assign Role'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Whitelist Directory Table */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#2B1810' }}>
            Authorized Accounts ({MASTER_OWNER_EMAILS.length + whitelistEntries.length})
          </h4>

          {/* Quick Search */}
          <div style={{ position: 'relative', width: 240 }}>
            <Search size={14} color="#999" style={{ position: 'absolute', left: 10, top: 10 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by email or role..."
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                borderRadius: 6,
                border: '1px solid #D4C5B9',
                fontSize: 12,
                backgroundColor: '#FFF',
              }}
            />
          </div>
        </div>

        <div style={{ border: '1px solid #EADCCE', borderRadius: 8, overflow: 'hidden', backgroundColor: '#FFF' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#FAF2E9', borderBottom: '1px solid #EADCCE', color: '#555' }}>
                <th style={{ padding: '12px 16px' }}>Email Address</th>
                <th style={{ padding: '12px 16px' }}>Assigned Role</th>
                <th style={{ padding: '12px 16px' }}>Granted By</th>
                <th style={{ padding: '12px 16px' }}>Notes</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Permanent Master Owners */}
              {MASTER_OWNER_EMAILS.filter((e) => !searchQuery || e.includes(searchQuery.toLowerCase())).map(
                (ownerEmail) => (
                  <tr key={ownerEmail} style={{ borderBottom: '1px solid #F0E6D8', backgroundColor: '#FFFDF9' }}>
                    <td
                      style={{
                        padding: '12px 16px',
                        fontWeight: 700,
                        color: '#2B1810',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <Crown size={15} color="#D4AF37" />
                      <span>{ownerEmail}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          background: '#FFF3CD',
                          color: '#856404',
                          border: '1px solid #FFEEBA',
                          padding: '3px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Crown size={11} color="#D4AF37" />
                        MASTER OWNER
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#777' }}>System Root</td>
                    <td style={{ padding: '12px 16px', color: '#777' }}>Permanent Owner Access</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <span style={{ fontSize: 11, color: '#999', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Lock size={12} /> Permanent
                      </span>
                    </td>
                  </tr>
                )
              )}

              {/* Dynamic Assigned Staff & Owners */}
              {filteredEntries.map((entry) => (
                <tr key={entry.id} style={{ borderBottom: '1px solid #F0E6D8' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#2B1810' }}>
                    {entry.email}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {canManageWhitelist ? (
                      <select
                        value={entry.role}
                        onChange={(e) => handleRoleChange(entry.email, e.target.value as AdminRole)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 4,
                          border: '1px solid #D4C5B9',
                          fontSize: 12,
                          fontWeight: 600,
                          backgroundColor: '#FAF2E9',
                          color: '#2B1810',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="owner">👑 Owner</option>
                        <option value="super_admin">⚡ Super Admin</option>
                        <option value="manager">🏛️ Manager</option>
                        <option value="staff">✂️ Staff</option>
                      </select>
                    ) : (
                      renderRoleBadge(entry.role)
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#666', fontSize: 12 }}>
                    {entry.addedBy}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#666', fontSize: 12 }}>
                    {entry.notes || '—'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    {canManageWhitelist ? (
                      <button
                        onClick={() => handleRevoke(entry.email)}
                        style={{
                          padding: '5px 10px',
                          background: '#FFF0F0',
                          color: '#B02A37',
                          border: '1px solid #F5C2C7',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Trash2 size={13} />
                        <span>Revoke</span>
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, color: '#999' }}>Read Only</span>
                    )}
                  </td>
                </tr>
              ))}

              {filteredEntries.length === 0 && searchQuery && (
                <tr>
                  <td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#888' }}>
                    No whitelist records found matching "{searchQuery}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
