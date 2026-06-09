// fronted/src/components/TransactionTable.jsx
import React from 'react';
import { Calendar, CreditCard, ChevronRight, RefreshCcw } from 'lucide-react';

export const TransactionTable = ({ transactions = [], onAction, loading = false }) => {
  const getStatusClass = (status) => {
    switch (status) {
      case 'verified': return 'badge badge-disbursed';
      case 'pending': return 'badge badge-pending';
      case 'refunded': return 'badge badge-rejected';
      case 'paid': return 'badge badge-disbursed';
      case 'overdue': return 'badge badge-rejected';
      default: return 'badge';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Pending';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
        <RefreshCcw size={20} className="spin" style={{ animation: 'spin 1.5s linear infinite', marginBottom: '0.5rem' }} />
        <p>Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      {transactions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.01)', borderRadius: 'var(--border-radius-sm)', border: '1px dashed var(--card-border)' }}>
          <p>No recent transaction activity found.</p>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Transaction ID / Ref</th>
              <th>Method</th>
              <th>Loan / Purpose</th>
              <th>Amount</th>
              <th>Status</th>
              {onAction && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx._id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>{formatDate(tx.paidAt || tx.createdAt)}</span>
                  </div>
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {tx._id.substring(0, 12)}...
                </td>
                <td style={{ textTransform: 'capitalize' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CreditCard size={14} style={{ color: 'var(--accent-primary)' }} />
                    <span>{tx.method === 'stripe' ? 'Stripe Card' : tx.method ? tx.method.replace('_', ' ') : 'N/A'}</span>
                  </div>
                </td>
                <td>
                  {tx.loan?.purpose || 'Loan Repayment'}
                </td>
                <td style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  ₹{(tx.amount || 0).toLocaleString('en-IN')}
                </td>
                <td>
                  <span className={getStatusClass(tx.status)}>{tx.status}</span>
                </td>
                {onAction && (
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {tx.status === 'pending' && (
                        <button
                          onClick={() => onAction('verify', tx)}
                          className="btn btn-primary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', borderRadius: '4px' }}
                        >
                          Verify
                        </button>
                      )}
                      {tx.status === 'verified' && (
                        <button
                          onClick={() => onAction('refund', tx)}
                          className="btn btn-danger"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', borderRadius: '4px' }}
                        >
                          Refund
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TransactionTable;
