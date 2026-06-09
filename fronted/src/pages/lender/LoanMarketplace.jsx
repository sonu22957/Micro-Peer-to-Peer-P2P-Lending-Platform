// fronted/src/pages/lender/LoanMarketplace.jsx
import React, { useEffect, useState } from 'react';
import { useLoans } from '../../context/LoanContext';
import LoanCard from '../../components/LoanCard';
import Loader from '../../components/Loader';
import { useNavigate } from 'react-router-dom';

// Pre-defined high-fidelity mock loan applications for P2P marketplace simulation
const MOCK_MARKPLACE_LOANS = [
  {
    _id: 'm-loan-101',
    user: { name: 'Priya Sharma', email: 'priya@gmail.com' },
    amount: 75000,
    interestRate: 12,
    termMonths: 12,
    purpose: 'Academic Tuition Fees (Masters Degree)',
    status: 'approved',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    _id: 'm-loan-102',
    user: { name: 'Rajesh Kumar', email: 'rajesh@outlook.com' },
    amount: 150000,
    interestRate: 15,
    termMonths: 24,
    purpose: 'Inventory and POS upgrades for Retail Store',
    status: 'approved',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    _id: 'm-loan-103',
    user: { name: 'Dr. Amit Patel', email: 'amit@patelclinic.com' },
    amount: 300000,
    interestRate: 10,
    termMonths: 36,
    purpose: 'Medical Clinic Diagnostic Equipment purchase',
    status: 'approved',
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    _id: 'm-loan-104',
    user: { name: 'Neha Gupta', email: 'neha@gmail.com' },
    amount: 25000,
    interestRate: 18,
    termMonths: 6,
    purpose: 'Emergency Family Hospitalisation coverage',
    status: 'approved',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  }
];

export const LoanMarketplace = () => {
  const navigate = useNavigate();
  const { loans, fetchMyLoans } = useLoans();
  const [loading, setLoading] = useState(true);
  const [allLoans, setAllLoans] = useState([]);
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    const mergeLoans = async () => {
      setLoading(true);
      try {
        // Fetch current user's loans if they registered any borrower applications
        await fetchMyLoans();
      } catch (err) {
        console.warn('Could not load user specific loans, displaying marketplace mocks.');
      }

      // Combine user's approved loans with our mock database
      const userApprovedLoans = loans.filter((l) => l.status === 'approved' || l.status === 'disbursed');
      
      // Filter out mock loans that have already been funded by checking localstorage
      const fundedIds = new Set(
        JSON.parse(localStorage.getItem('funded_investments') || '[]').map((f) => f._id)
      );

      const combined = [
        ...userApprovedLoans,
        ...MOCK_MARKPLACE_LOANS
      ].map(loan => {
        // If it was already funded locally, mark its status as disbursed
        if (fundedIds.has(loan._id)) {
          return { ...loan, status: 'disbursed' };
        }
        return loan;
      });

      setAllLoans(combined);
      setLoading(false);
    };

    mergeLoans();
  }, [fetchMyLoans]);

  const handleAction = (type, loan) => {
    if (type === 'fund') {
      navigate(`/lender/fund/${loan._id}`, { state: { loan } });
    }
  };

  const handleCardClick = (loan) => {
    navigate(`/loans/${loan._id}`, { state: { simulatedMockLoan: loan._id.startsWith('m-') ? loan : null } });
  };

  const filtered = allLoans.filter((l) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'high-yield') return l.interestRate >= 15;
    if (filterCategory === 'large-cap') return l.amount >= 100000;
    return true;
  });

  if (loading) return <Loader message="Opening marketplace boards..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Loan Marketplace</h1>
          <p className="page-subtitle">Browse verified loan applications and fund to earn competitive returns.</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Open Listings' },
            { id: 'high-yield', label: 'High Yield (≥15% Interest)' },
            { id: 'large-cap', label: 'Large Cap (≥₹1L Amount)' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className="btn btn-secondary"
              style={{
                padding: '0.45rem 1rem',
                fontSize: '0.8rem',
                borderRadius: '20px',
                backgroundColor: filterCategory === cat.id ? 'var(--bg-tertiary)' : 'transparent',
                borderColor: filterCategory === cat.id ? 'var(--accent-primary)' : 'var(--card-border)',
                color: filterCategory === cat.id ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

      {filtered.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <Search size={48} className="icon" />
            <h4>No listings found</h4>
            <p>No active investment projects match your current filter. Try changing the category.</p>
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
          {filtered.map((loan) => (
            <LoanCard
              key={loan._id}
              loan={loan}
              onAction={handleAction}
              onViewDetails={handleCardClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LoanMarketplace;
