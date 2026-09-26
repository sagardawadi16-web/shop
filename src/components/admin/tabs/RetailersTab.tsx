import React, { useState } from 'react';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Copy,
  Check,
  CheckCircle,
  Clock,
  Trash2,
  ExternalLink,
  Search,
  Filter,
  Layers,
  Sparkles,
  Tag,
  DollarSign,
} from 'lucide-react';
import { useRetailerStore } from '../../../stores/retailerStore';
import { RetailerInquiry, RetailerInquiryStatus, RetailerStoreType } from '../../../types';
import { toast } from '../../common/Toast';

export const RetailersTab: React.FC = () => {
  const { inquiries, updateStatus, deleteInquiry } = useRetailerStore();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredInquiries = inquiries.filter((inq) => {
    if (filterStatus !== 'all' && inq.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (inq.storeName || '').toLowerCase().includes(q);
      const matchPerson = (inq.contactPerson || '').toLowerCase().includes(q);
      const matchCity = (inq.city || '').toLowerCase().includes(q);
      const matchPhone = (inq.phone || '').includes(q);
      return matchName || matchPerson || matchCity || matchPhone;
    }
    return true;
  });

  const getStatusBadge = (status: RetailerInquiryStatus) => {
    switch (status) {
      case 'new':
        return { label: 'New Lead', bg: '#FFF3CD', color: '#856404', border: '#FFEEBA' };
      case 'contacted':
        return { label: 'In Negotiation', bg: '#CCE5FF', color: '#004085', border: '#B8DAFF' };
      case 'approved_wholesale':
        return { label: 'Approved Stockist', bg: '#D4EDDA', color: '#155724', border: '#C3E6CB' };
      case 'declined':
        return { label: 'Declined', bg: '#E2E3E5', color: '#383D41', border: '#D6D8DB' };
      default:
        return { label: status, bg: '#F8F9FA', color: '#333', border: '#DDD' };
    }
  };

  const getStoreTypeLabel = (type: RetailerStoreType): string => {
    switch (type) {
      case 'physical_boutique':
        return 'Physical Boutique';
      case 'online_store':
        return 'Online Store / Social Seller';
      case 'diaspora_store':
        return 'Diaspora Boutique (Global)';
      case 'departmental':
        return 'Departmental Store';
      case 'distributor':
        return 'Wholesale Distributor';
      default:
        return type;
    }
  };

  const handleCopyLineSheet = (inquiry: RetailerInquiry) => {
    const text = `Namaste ${inquiry.contactPerson}! Thank you for your wholesale interest in Dawosti Boutique Kathmandu. Review our digital line sheet (MOQ 15 pcs, 35-45% margin): https://dawosti.com/catalog?b2b=true`;
    navigator.clipboard.writeText(text);
    setCopiedId(inquiry.id || 'all');
    toast('Wholesale line sheet invite copied!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleOpenWhatsApp = (inquiry: RetailerInquiry) => {
    const cleanPhone = (inquiry.whatsappNumber || inquiry.phone || '').replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.startsWith('977') ? cleanPhone : `977${cleanPhone}`;
    const msg = encodeURIComponent(
      `Namaste ${inquiry.contactPerson}! 🙏\nThis is Sagar Dawodi from Dawosti Boutique Kathmandu.\nWe received your retail wholesale partnership inquiry for *${inquiry.storeName}* (${inquiry.city}). We are pleased to offer our Kathmandu handloom collections at stockist pricing.`
    );
    window.open(`https://wa.me/${phoneWithCountry}?text=${msg}`, '_blank');
  };

  const handleSaveNotes = async (id: string) => {
    await updateStatus(id, (inquiries.find((i) => i.id === id)?.status || 'new') as any, notesDraft);
    setEditingNotesId(null);
    toast('Stockist notes updated');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Banner & Metrics */}
      <div
        style={{
          background: 'linear-gradient(135deg, #2B1810 0%, #561F1F 100%)',
          color: '#FFF8F0',
          borderRadius: 12,
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Building2 size={20} color="#D4AF37" />
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#FFF' }}>
              Boutique Stockist & Wholesale CRM
            </h3>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,248,240,0.75)' }}>
            Turn domestic boutiques & global diaspora retailers into verified Dawosti stockists
          </p>
        </div>

        <div style={{ display: 'flex', gap: 14 }}>
          <div
            style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              padding: '10px 16px',
              borderRadius: 8,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 800, color: '#D4AF37' }}>{inquiries.length}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,248,240,0.7)' }}>Total Leads</div>
          </div>
          <div
            style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              padding: '10px 16px',
              borderRadius: 8,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 800, color: '#10B981' }}>
              {inquiries.filter((i) => i.status === 'approved_wholesale').length}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,248,240,0.7)' }}>Active Partners</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(['all', 'new', 'contacted', 'approved_wholesale', 'declined'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              style={{
                padding: '6px 14px',
                borderRadius: 99,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                border: filterStatus === st ? '1.5px solid #8B3A3A' : '1px solid #EADCCE',
                backgroundColor: filterStatus === st ? '#8B3A3A' : '#FFF',
                color: filterStatus === st ? '#FFF' : '#2B1810',
                transition: 'all 0.15s ease',
              }}
            >
              {st === 'all'
                ? 'All Inquiries'
                : st === 'new'
                ? 'New Leads'
                : st === 'contacted'
                ? 'In Negotiation'
                : st === 'approved_wholesale'
                ? 'Approved'
                : 'Declined'}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', minWidth: 240 }}>
          <Search
            size={15}
            color="#888"
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search store, person, city..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              borderRadius: 8,
              border: '1px solid #EADCCE',
              fontSize: 12.5,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Inquiries List */}
      {filteredInquiries.length === 0 ? (
        <div
          style={{
            backgroundColor: '#FFF',
            border: '1px solid #EADCCE',
            borderRadius: 12,
            padding: '48px 20px',
            textAlign: 'center',
            color: '#666',
          }}
        >
          <Building2 size={36} color="#C4B5A5" style={{ margin: '0 auto 12px' }} />
          <h4 style={{ margin: '0 0 6px 0', fontSize: 16, color: '#2B1810' }}>No Retail Inquiries Found</h4>
          <p style={{ margin: 0, fontSize: 13, color: '#888' }}>
            New applications from the homepage or footer wholesale link will appear here in real time.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredInquiries.map((inq) => {
            const badge = getStatusBadge(inq.status);
            const isEditingNotes = editingNotesId === inq.id;

            return (
              <div
                key={inq.id}
                style={{
                  backgroundColor: '#FFF',
                  border: '1px solid #EADCCE',
                  borderRadius: 12,
                  padding: '18px 20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  transition: 'box-shadow 0.2s ease',
                }}
              >
                {/* Header row */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 12,
                    flexWrap: 'wrap',
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#2B1810' }}>
                        {inq.storeName}
                      </h4>
                      <span
                        style={{
                          backgroundColor: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <div style={{ fontSize: 12.5, color: '#6B564C', marginTop: 3 }}>
                      <strong>{inq.contactPerson}</strong> • {getStoreTypeLabel(inq.storeType)} •{' '}
                      <span style={{ color: '#888' }}>
                        Applied {new Date(inq.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      onClick={() => handleOpenWhatsApp(inq)}
                      title="Open WhatsApp Chat"
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#E8F5E9',
                        color: '#2E7D32',
                        border: '1px solid #C8E6C9',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <MessageCircle size={14} />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      onClick={() => handleCopyLineSheet(inq)}
                      title="Copy Wholesale Lookbook Message"
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#FFF8F0',
                        color: '#8B3A3A',
                        border: '1px solid #EADCCE',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      {copiedId === inq.id ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                      <span>Lookbook Link</span>
                    </button>

                    {/* Status Changer Dropdown */}
                    <select
                      value={inq.status}
                      onChange={(e) => inq.id && updateStatus(inq.id, e.target.value as RetailerInquiryStatus)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: '1px solid #EADCCE',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#2B1810',
                        backgroundColor: '#FFF',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="new">Mark New</option>
                      <option value="contacted">Mark In Negotiation</option>
                      <option value="approved_wholesale">Approve Stockist</option>
                      <option value="declined">Decline</option>
                    </select>

                    <button
                      onClick={() => {
                        if (inq.id && confirm(`Delete inquiry from ${inq.storeName}?`)) {
                          deleteInquiry(inq.id);
                        }
                      }}
                      title="Delete Record"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#999',
                        cursor: 'pointer',
                        padding: 4,
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Details Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 10,
                    padding: '12px 14px',
                    backgroundColor: '#FAF2E9',
                    borderRadius: 8,
                    fontSize: 12,
                    color: '#444',
                    marginBottom: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Phone size={13} color="#8B3A3A" />
                    <span>Phone: {inq.phone}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Mail size={13} color="#8B3A3A" />
                    <span>Email: {inq.email || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={13} color="#8B3A3A" />
                    <span>
                      Location: {inq.city}, {inq.country}
                    </span>
                  </div>
                  {inq.estimatedMonthlyBudgetNpr && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <DollarSign size={13} color="#10B981" />
                      <span>Est. Monthly: NPR {inq.estimatedMonthlyBudgetNpr.toLocaleString()}</span>
                    </div>
                  )}
                  {inq.panVatNumber && (
                    <div>
                      PAN/VAT: <code>{inq.panVatNumber}</code>
                    </div>
                  )}
                </div>

                {/* Categories of Interest */}
                {inq.categoriesOfInterest && inq.categoriesOfInterest.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                    <Tag size={13} color="#8B3A3A" />
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: '#666' }}>Interested Lines:</span>
                    {inq.categoriesOfInterest.map((cat, idx) => (
                      <span
                        key={idx}
                        style={{
                          backgroundColor: '#FFF8F0',
                          border: '1px solid #EADCCE',
                          padding: '2px 8px',
                          borderRadius: 99,
                          fontSize: 11,
                          color: '#8B3A3A',
                        }}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}

                {/* Custom Message if provided */}
                {inq.message && (
                  <div
                    style={{
                      fontSize: 12,
                      fontStyle: 'italic',
                      color: '#555',
                      padding: '8px 12px',
                      borderLeft: '3px solid #D4AF37',
                      backgroundColor: '#FFFDF9',
                      marginBottom: 10,
                    }}
                  >
                    "{inq.message}"
                  </div>
                )}

                {/* Admin Notes Section */}
                <div style={{ fontSize: 12, borderTop: '1px dashed #EADCCE', paddingTop: 8 }}>
                  {isEditingNotes ? (
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <input
                        type="text"
                        value={notesDraft}
                        onChange={(e) => setNotesDraft(e.target.value)}
                        placeholder="Add stockist notes (e.g. sent catalogue on Sep 26, requested 20 pcs Dhaka set)..."
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          borderRadius: 6,
                          border: '1px solid #EADCCE',
                          fontSize: 12,
                        }}
                      />
                      <button
                        onClick={() => inq.id && handleSaveNotes(inq.id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#1B7F5E',
                          color: '#FFF',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingNotesId(null)}
                        style={{
                          padding: '6px 10px',
                          backgroundColor: '#EEE',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 11.5,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: inq.adminNotes ? '#2B1810' : '#888' }}>
                        <strong>Notes:</strong> {inq.adminNotes || 'No notes added.'}
                      </span>
                      <button
                        onClick={() => {
                          setEditingNotesId(inq.id || null);
                          setNotesDraft(inq.adminNotes || '');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#8B3A3A',
                          cursor: 'pointer',
                          fontSize: 11.5,
                          fontWeight: 600,
                        }}
                      >
                        Edit Notes
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
