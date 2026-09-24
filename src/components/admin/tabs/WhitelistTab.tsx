import React, { useState } from 'react';
import { ShieldCheck, UserPlus, Trash2, Crown, Lock, Check } from 'lucide-react';
import { useAdminStore } from '../../../stores/adminStore';
import { MASTER_OWNER_EMAILS } from '../../../services/firestoreWhitelist';
import { AdminWhitelistEntry } from '../../../types';

export const WhitelistTab: React.FC = () => {
  const { whitelistEntries, addEmailToWhitelist, removeEmailFromWhitelist } = useAdminStore();

  const [emailInput, setEmailInput] = useState('');
  const [roleInput, setRoleInput] = useState<AdminWhitelistEntry['role']>('staff');
  const [notesInput, setNotesInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes('@')) {
      alert('Please enter a valid Gmail address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addEmailToWhitelist(emailInput, roleInput, notesInput);
      setEmailInput('');
      setNotesInput('');
      setToastMessage(`Granted Admin Access to: ${emailInput.toLowerCase()}`);
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (email: string) => {
    if (window.confirm(`Are you sure you want to revoke Admin access for ${email}?`)) {
      await removeEmailFromWhitelist(email);
      setToastMessage(`Revoked access for: ${email}`);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Info */}
      <div style={{ background: '#FAF2E9', padding: '16px 20px', borderRadius: 8, border: '1px solid #EADCCE' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <ShieldCheck size={20} color="#8B3A3A" />
          <h3 style={{ margin: 0, fontSize: 18, color: '#2B1810', fontWeight: 700 }}>
            Gmail Whitelist & Permissions Manager
          </h3>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: '#666', lineHeight: 1.5 }}>
          Admin is completely hidden from customers. Only accounts with verified Google logins listed below
          are permitted to access the store management console.
        </p>
      </div>

      {toastMessage && (
        <div style={{ padding: '10px 14px', background: '#E0F3EA', color: '#1B7F5E', borderRadius: 6, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Check size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Add New Whitelist Member Form */}
      <div style={{ background: '#FFF8F0', padding: 20, borderRadius: 8, border: '1px solid #EADCCE' }}>
        <h4 style={{ margin: '0 0 14px 0', fontSize: 15, fontWeight: 700, color: '#2B1810', display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserPlus size={16} color="#8B3A3A" />
          <span>Grant Access to a New Gmail Address</span>
        </h4>

        <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 }}>
              Google Email Address:
            </label>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="e.g. partner.dawosti@gmail.com"
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
              Permission Role:
            </label>
            <select
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value as AdminWhitelistEntry['role'])}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 6,
                border: '1px solid #D4C5B9',
                fontSize: 13,
                backgroundColor: '#FFF',
              }}
            >
              <option value="staff">Staff (Orders & Payouts)</option>
              <option value="manager">Manager (Catalog & Margins)</option>
              <option value="super_admin">Super Admin (Full Access)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4 }}>
              Notes / Designation:
            </label>
            <input
              type="text"
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="e.g. Boutique Assistant / Order Dispatch"
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
              }}
            >
              {isSubmitting ? 'Granting...' : 'Grant Access'}
            </button>
          </div>
        </form>
      </div>

      {/* Current Whitelist Table */}
      <div>
        <h4 style={{ margin: '0 0 12px 0', fontSize: 15, fontWeight: 700, color: '#2B1810' }}>
          Authorized Google Accounts ({MASTER_OWNER_EMAILS.length + whitelistEntries.length})
        </h4>

        <div style={{ border: '1px solid #EADCCE', borderRadius: 8, overflow: 'hidden', backgroundColor: '#FFF' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#FAF2E9', borderBottom: '1px solid #EADCCE', color: '#555' }}>
                <th style={{ padding: '12px 16px' }}>Email Address</th>
                <th style={{ padding: '12px 16px' }}>Role</th>
                <th style={{ padding: '12px 16px' }}>Added By</th>
                <th style={{ padding: '12px 16px' }}>Notes</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Permanent Master Owners */}
              {MASTER_OWNER_EMAILS.map((ownerEmail) => (
                <tr key={ownerEmail} style={{ borderBottom: '1px solid #F0E6D8', backgroundColor: '#FFFDF9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#2B1810', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Crown size={15} color="#D4AF37" />
                    <span>{ownerEmail}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: '#FFF3CD', color: '#856404', padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                      Master Owner
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#777' }}>System Root</td>
                  <td style={{ padding: '12px 16px', color: '#777' }}>Permanent Owner Access</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <span style={{ fontSize: 11, color: '#999', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Lock size={12} /> Immutable
                    </span>
                  </td>
                </tr>
              ))}

              {/* Dynamic Added Emails */}
              {whitelistEntries.map((entry) => (
                <tr key={entry.id} style={{ borderBottom: '1px solid #F0E6D8' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#2B1810' }}>
                    {entry.email}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: '#E0F3EA', color: '#1B7F5E', padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                      {entry.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#666', fontSize: 12 }}>
                    {entry.addedBy}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#666', fontSize: 12 }}>
                    {entry.notes || '—'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
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
