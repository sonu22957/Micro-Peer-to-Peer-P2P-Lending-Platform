// fronted/src/pages/lender/FundLoan.jsx
import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CreditCard, Landmark, ShieldCheck, CheckCircle } from 'lucide-react';

export const FundLoan = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Try to retrieve loan details from redirect state, otherwise fallback
  const loan = location.state?.loan || {
    _id: id,
    amount: 50000,
    interestRate: 12,
    termMonths: 12,
    purpose: 'Funding request',
    user: { name: 'Applicant' }
  };

  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleFundSubmit = (e) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate Stripe payment processing delay
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);

      // Save to localStorage under funded_investments
      const saved = JSON.parse(localStorage.getItem('funded_investments') || '[]');
      
      // Prevent duplicates
      if (!saved.some((item) => item._id === loan._id)) {
        saved.push({
          _id: loan._id,
          amount: loan.amount,
          interestRate: loan.interestRate,
          termMonths: loan.termMonths,
          purpose: loan.purpose,
          borrowerName: loan.user?.name || 'Borrower',
          fundedAt: new Date().toISOString(),
        });
        localStorage.setItem('funded_investments', JSON.stringify(saved));
      }

      // Automatically navigate back after showing success message
      setTimeout(() => {
        navigate('/lender');
      }, 2500);
    }, 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '650px', margin: '0 auto' }} className="fade-in">
      <div className="page-header">
        <h2 className="page-title">Fund Loan Application</h2>
      </div>

      {isSuccess ? (
        <div
          className="glass-card"
          style={{
            textAlign: 'center',
            padding: '3rem 2rem',
            border: '1px solid var(--success)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <CheckCircle size={48} style={{ color: 'var(--success)' }} />
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Investment Confirmed!</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, maxWidth: '400px' }}>
            You have successfully funded ₹{loan.amount.toLocaleString('en-IN')} for "{loan.purpose}". Monthly yields will reflect on your Investor Dashboard.
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Redirecting to Portfolio...</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Loan Overview */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Project Investment Overview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid var(--card-border)', paddingTop: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>APPLICANT</span>
                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{loan.user?.name || 'Verified Borrower'}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>FUNDING AMOUNT</span>
                <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--accent-primary)' }}>
                  ₹{loan.amount.toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>INTEREST RATE</span>
                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{loan.interestRate}% per annum</p>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>LOAN REPAYMENT TERM</span>
                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{loan.termMonths} Months</p>
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '1rem' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>LOAN PURPOSE DESCRIPTION</span>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                {loan.purpose}
              </p>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={18} style={{ color: 'var(--accent-secondary)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Stripe Card Checkout</h3>
            </div>

            <form onSubmit={handleFundSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div className="form-group">
                <label>Cardholder Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="input-field"
                  required
                  disabled={isProcessing}
                />
              </div>

              <div className="form-group">
                <label>Card Number</label>
                <input
                  type="text"
                  placeholder="4242 4242 4242 4242"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="input-field"
                  maxLength="16"
                  required
                  disabled={isProcessing}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="input-field"
                    maxLength="5"
                    required
                    disabled={isProcessing}
                  />
                </div>
                <div className="form-group">
                  <label>CVC / CVV</label>
                  <input
                    type="password"
                    placeholder="•••"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="input-field"
                    maxLength="3"
                    required
                    disabled={isProcessing}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'rgba(16, 185, 129, 0.04)',
                  padding: '0.75rem',
                  borderRadius: 'var(--border-radius-sm)',
                  fontSize: '0.75rem',
                  color: 'var(--success)',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                }}
              >
                <ShieldCheck size={16} />
                <span>Secure payment. Your investment goes directly towards funding verified applicants.</span>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', background: 'linear-gradient(135deg, var(--accent-secondary) 0%, var(--accent-tertiary) 100%)' }} disabled={isProcessing}>
                {isProcessing ? 'Authorising Stripe Transaction...' : `Confirm Portfolio Funding: ₹${loan.amount.toLocaleString('en-IN')}`}
              </button>
            </form>
          </div>

        </div>
      )}
    </div>
  );
};

export default FundLoan;
