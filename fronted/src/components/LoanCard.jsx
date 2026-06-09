// fronted/src/components/LoanCard.jsx
import React from 'react';
import { Calendar, Percent, Clock, ArrowRight, Trash2, Edit2, Play, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoanCard = ({ loan, onAction, onViewDetails }) => {
  const { simulatedRole } = useAuth();
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return 'badge badge-pending';
      case 'approved': return 'badge badge-approved';
      case 'rejected': return 'badge badge-rejected';
      case 'disbursed': return 'badge badge-disbursed';
      case 'closed': return 'badge badge-closed';
      default: return 'badge';
    }
  };

  // Safe checks for amount fields
  const amount = loan.amount || 0;
  const interestRate = loan.interestRate || 0;
  const termMonths = loan.termMonths || 0;
  const purpose = loan.purpose || 'Personal Use';
  const status = loan.status || 'pending';

  return (
    <div className="glass-card hoverable fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Section: Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span className={getStatusClass(status)}>{status}</span>
          <h4 style={{ fontSize: '1.45rem', fontWeight: 700, marginTop: '0.5rem', fontFamily: 'var(--font-heading)' }}>
            ₹{amount.toLocaleString('en-IN')}
          </h4>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Applied on {formatDate(loan.createdAt)}
          </span>
        </div>
        
        {/* Simple visual indicator */}
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.02)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)'
        }}>
          {simulatedRole === 'borrower' ? <CoinsIcon /> : <BadgeCentIcon />}
        </div>
      </div>

      {/* Details Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.5rem',
        padding: '0.75rem 0.5rem',
        backgroundColor: 'rgba(0,0,0,0.15)',
        borderRadius: 'var(--border-radius-sm)',
        border: '1px solid var(--card-border)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            <Percent size={10} /> RATE
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{interestRate}% p.a.</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', borderLeft: '1px solid var(--card-border)', borderRight: '1px solid var(--card-border)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            <Clock size={10} /> TENURE
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{termMonths} Mos</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            <Calendar size={10} /> PURPOSE
          </span>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }} title={purpose}>
            {purpose}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
        
        {/* Borrower specific actions */}
        {simulatedRole === 'borrower' && (
          <>
            {status === 'pending' && (
              <>
                <button
                  onClick={() => onAction('update', loan)}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', fontSize: '0.85rem' }}
                >
                  <Edit2 size={14} /> Edit
                </button>
                <button
                  onClick={() => onAction('delete', loan)}
                  className="btn btn-danger"
                  style={{ padding: '0.5rem', borderRadius: '8px' }}
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
            
            {(status === 'disbursed' || status === 'closed') && (
              <button
                onClick={() => onViewDetails(loan)}
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem' }}
              >
                <span>View Details & Schedule</span>
                <ArrowRight size={14} />
              </button>
            )}

            {status === 'approved' && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', width: '100%', fontStyle: 'italic', padding: '0.5rem' }}>
                Awaiting disbursement by staff...
              </div>
            )}

            {status === 'rejected' && (
              <button
                onClick={() => onAction('delete', loan)}
                className="btn btn-danger"
                style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', fontSize: '0.85rem' }}
              >
                <Trash2 size={14} /> Delete Rejected Application
              </button>
            )}
          </>
        )}

        {/* Lender specific actions */}
        {simulatedRole === 'lender' && (
          <>
            {status === 'approved' ? (
              <button
                onClick={() => onAction('fund', loan)}
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', fontSize: '0.85rem' }}
              >
                <Play size={14} fill="white" /> Fund Loan (Invest)
              </button>
            ) : status === 'disbursed' ? (
              <div style={{ color: 'var(--success)', fontSize: '0.8rem', fontWeight: 600, textAlign: 'center', width: '100%' }}>
                ✓ Active Investment (Funded)
              </div>
            ) : (
              <button
                onClick={() => onViewDetails(loan)}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', fontSize: '0.85rem' }}
              >
                View Details
              </button>
            )}
          </>
        )}

        {/* Staff / Admin actions */}
        {(simulatedRole === 'staff' || simulatedRole === 'admin') && (
          <>
            {status === 'pending' && (
              <>
                <button
                  onClick={() => onAction('approve', loan)}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', fontSize: '0.85rem', background: 'var(--success)' }}
                >
                  <CheckCircle size={14} /> Approve
                </button>
                <button
                  onClick={() => onAction('reject', loan)}
                  className="btn btn-danger"
                  style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', fontSize: '0.85rem' }}
                >
                  <XCircle size={14} /> Reject
                </button>
              </>
            )}

            {status === 'approved' && (
              <button
                onClick={() => onAction('disburse', loan)}
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', fontSize: '0.85rem', background: 'var(--info)' }}
              >
                <Play size={14} fill="currentColor" /> Disburse Funds
              </button>
            )}

            {status === 'disbursed' && (
              <button
                onClick={() => onAction('close', loan)}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-primary)' }}
              >
                Close Loan File
              </button>
            )}
            
            {(status === 'closed' || status === 'rejected') && (
              <button
                onClick={() => onViewDetails(loan)}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', fontSize: '0.85rem' }}
              >
                View Details
              </button>
            )}
          </>
        )}

      </div>
    </div>
  );
};

// Inline minimal icons to keep package dependencies low
const CoinsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6"/>
    <circle cx="18" cy="18" r="4"/>
    <path d="M12 18a6 6 0 0 0-6-6"/>
  </svg>
);

const BadgeCentIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 6v12"/>
    <path d="M17 12H7"/>
  </svg>
);

export default LoanCard;
