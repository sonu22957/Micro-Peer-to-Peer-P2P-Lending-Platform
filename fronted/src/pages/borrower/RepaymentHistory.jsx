// fronted/src/pages/borrower/RepaymentHistory.jsx
import React, { useEffect, useState } from 'react';
import { useLoans } from '../../context/LoanContext';
import Loader from '../../components/Loader';
import {
  Receipt, CheckCircle2, Clock, AlertTriangle,
  CreditCard, Building2, Banknote, Calendar, Search
} from 'lucide-react';

const methodIcon = {
  stripe: <CreditCard size={14} />,
  bank_transfer: <Building2 size={14} />,
  cash: <Banknote size={14} />,
};

const StatusBadge = ({ status }) => {
  const map = {
    verified:  { cls: 'badge badge-disbursed', icon: <CheckCircle2 size={11} /> },
    pending:   { cls: 'badge badge-pending',   icon: <Clock size={11} /> },
    refunded:  { cls: 'badge badge-rejected',  icon: <AlertTriangle size={11} /> },
  };
  const cfg = map[status] || { cls: 'badge', icon: null };
  return (
    <span className={cfg.cls} style={{ gap: '0.3rem' }}>
      {cfg.icon} {status}
    </span>
  );
};

export const RepaymentHistory = () => {
  const { payments, loading, fetchMyPayments } = useLoans();
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchMyPayments();
  }, [fetchMyPayments]);

  const filtered = payments.filter((p) => {
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchSearch = !search || (p.loan?.purpose || '').toLowerCase().includes(search.toLowerCase()) || p._id?.includes(search);
    return matchStatus && matchSearch;
  });

  const totalPaid = payments.filter((p) => p.status === 'verified').reduce((s, p) => s + (p.amount || 0), 0);
  const pendingCount = payments.filter((p) => p.status === 'pending').length;
  const verifiedCount = payments.filter((p) => p.status === 'verified').length;

  const FILTERS = ['all', 'pending', 'verified', 'refunded'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="fade-in">

      {/* Summary Strips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Total Paid',        value: `₹${totalPaid.toLocaleString('en-IN')}`, color: 'var(--success)',         bg: 'var(--success-bg)' },
          { label: 'Verified Payments', value: verifiedCount,                            color: 'var(--info)',           bg: 'var(--info-bg)' },
          { label: 'Pending Review',    value: pendingCount,                             color: 'var(--warning)',        bg: 'var(--warning-bg)' },
          { label: 'Total Transactions',value: payments.length,                          color: 'var(--accent-primary)', bg: 'rgba(79,142,247,0.08)' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="glass-card" style={{ padding: '1.1rem 1.25rem', borderTop: `2px solid ${color}` }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>{label}</p>
            <p style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Controls Row */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="btn btn-secondary"
              style={{
                padding: '0.4rem 0.9rem', fontSize: '0.78rem',
                borderRadius: 'var(--radius-full)', textTransform: 'capitalize',
                borderColor: filterStatus === s ? 'var(--accent-primary)' : 'var(--card-border)',
                color: filterStatus === s ? '#fff' : 'var(--text-secondary)',
                background: filterStatus === s ? 'rgba(79,142,247,0.12)' : 'transparent',
              }}
            >
              {s === 'all' ? 'All Transactions' : s}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input-field"
            placeholder="Search by purpose or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2rem', width: '220px', fontSize: '0.85rem', padding: '0.55rem 0.9rem 0.55rem 2rem' }}
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <Loader message="Loading payment history..." />
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Receipt size={48} className="icon" />
            <h4>No transactions found</h4>
            <p>Once you make repayments on your loans, they'll show up here.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Transaction Ref</th>
                  <th>Purpose</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => (
                  <tr key={tx._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                        <div>
                          <div style={{ fontSize: '0.85rem' }}>
                            {new Date(tx.paidAt || tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {new Date(tx.paidAt || tx.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                        #{tx._id?.substring(0, 10)}
                      </code>
                    </td>
                    <td style={{ maxWidth: '200px' }}>
                      <span className="truncate" style={{ display: 'block', fontSize: '0.88rem' }}>
                        {tx.loan?.purpose || 'Loan Repayment'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--accent-primary)' }}>{methodIcon[tx.method] || <CreditCard size={14} />}</span>
                        <span style={{ textTransform: 'capitalize' }}>
                          {tx.method === 'stripe' ? 'Stripe Card' : tx.method?.replace('_', ' ') || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--success)' }}>
                        +₹{(tx.amount || 0).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={tx.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepaymentHistory;
