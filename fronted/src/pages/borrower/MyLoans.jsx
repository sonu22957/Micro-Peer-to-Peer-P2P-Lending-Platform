// fronted/src/pages/borrower/MyLoans.jsx
import React, { useEffect, useState } from 'react';
import { useLoans } from '../../context/LoanContext';
import { loanService } from '../../services/loanService';
import LoanCard from '../../components/LoanCard';
import Loader from '../../components/Loader';
import Modal from '../../components/Modal';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MyLoans = () => {
  const navigate = useNavigate();
  const { loans, loading, fetchMyLoans } = useLoans();
  const [filterStatus, setFilterStatus] = useState('all');

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editTerm, setEditTerm] = useState('');
  const [editPurpose, setEditPurpose] = useState('');
  const [updating, setUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchMyLoans();
  }, [fetchMyLoans]);

  const handleAction = async (type, loan) => {
    if (type === 'delete') {
      if (window.confirm('Are you sure you want to delete this loan application?')) {
        try {
          await loanService.deleteLoan(loan._id);
          await fetchMyLoans();
        } catch (err) {
          alert(err.message || 'Delete failed.');
        }
      }
    } else if (type === 'update') {
      setSelectedLoan(loan);
      setEditAmount(loan.amount);
      setEditTerm(loan.termMonths);
      setEditPurpose(loan.purpose || '');
      setErrorMsg('');
      setEditModalOpen(true);
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setUpdating(true);

    try {
      await loanService.updateLoan(selectedLoan._id, {
        amount: Number(editAmount),
        termMonths: Number(editTerm),
        purpose: editPurpose,
      });
      setEditModalOpen(false);
      await fetchMyLoans();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update application.');
    } finally {
      setUpdating(false);
    }
  };

  const handleCardClick = (loan) => {
    navigate(`/loans/${loan._id}`);
  };

  const filteredLoans = loans.filter((l) => {
    if (filterStatus === 'all') return true;
    return l.status === filterStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="fade-in">
      {/* Header Actions */}
      <div className="page-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['all', 'pending', 'approved', 'disbursed', 'closed', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className="btn btn-secondary"
              style={{
                padding: '0.45rem 1rem',
                fontSize: '0.8rem',
                borderRadius: '20px',
                textTransform: 'capitalize',
                backgroundColor: filterStatus === status ? 'var(--bg-tertiary)' : 'transparent',
                borderColor: filterStatus === status ? 'var(--accent-primary)' : 'var(--card-border)',
                color: filterStatus === status ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {status}
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate('/borrower/apply')}
          className="btn btn-primary"
          style={{ borderRadius: '20px', padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
        >
          <Plus size={16} />
          <span>Apply Now</span>
        </button>
      </div>

      {loading ? (
        <Loader message="Fetching loans list..." />
      ) : filteredLoans.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <Plus size={48} className="icon" />
            <h4>No loans found</h4>
            <p>No loan applications match this status. Start by submitting a new application.</p>
            <button onClick={() => navigate('/borrower/apply')} className="btn btn-primary">
              Submit Application
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {filteredLoans.map((loan) => (
            <LoanCard
              key={loan._id}
              loan={loan}
              onAction={handleAction}
              onViewDetails={handleCardClick}
            />
          ))}
        </div>
      )}

      {/* Edit Loan Parameters Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => !updating && setEditModalOpen(false)}
        title="Edit Loan Application Parameters"
      >
        <form onSubmit={handleUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {errorMsg && (
            <div style={{ color: 'var(--danger)', fontSize: '0.85rem', backgroundColor: 'var(--danger-bg)', padding: '0.75rem', borderRadius: '4px' }}>
              {errorMsg}
            </div>
          )}

          <div className="form-group">
            <label>Amount (₹)</label>
            <input
              type="number"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              className="input-field"
              min="1000"
              required
              disabled={updating}
            />
          </div>

          <div className="form-group">
            <label>Repayment Term (Months)</label>
            <input
              type="number"
              value={editTerm}
              onChange={(e) => setEditTerm(e.target.value)}
              className="input-field"
              min="1"
              required
              disabled={updating}
            />
          </div>

          <div className="form-group">
            <label>Purpose</label>
            <textarea
              value={editPurpose}
              onChange={(e) => setEditPurpose(e.target.value)}
              className="input-field"
              rows="3"
              required
              disabled={updating}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={updating}>
            {updating ? 'Saving changes...' : 'Save Parameter Changes'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default MyLoans;
