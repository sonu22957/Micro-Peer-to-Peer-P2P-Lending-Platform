// fronted/src/pages/borrower/CreateLoan.jsx
import React, { useState, useEffect } from 'react';
import { useLoans } from '../../context/LoanContext';
import { useNavigate } from 'react-router-dom';
import { Landmark, ArrowRight, Percent, Calendar } from 'lucide-react';

export const CreateLoan = () => {
  const navigate = useNavigate();
  const { applyForLoan } = useLoans();

  // Form states
  const [amount, setAmount] = useState(10000);
  const [interestRate, setInterestRate] = useState(12); // Default to 12% p.a.
  const [termMonths, setTermMonths] = useState(12); // Default to 12 months
  const [purpose, setPurpose] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Live EMI states
  const [emi, setEmi] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [totalRepay, setTotalRepay] = useState(0);
  const [schedule, setSchedule] = useState([]);

  // Calculate live estimations whenever parameters change
  useEffect(() => {
    const P = Number(amount);
    const annualRate = Number(interestRate);
    const N = Number(termMonths);

    if (P > 0 && annualRate >= 0 && N > 0) {
      const r = annualRate / 100 / 12; // Monthly rate
      let emiVal = 0;
      if (r === 0) {
        emiVal = +(P / N).toFixed(2);
      } else {
        emiVal = +((P * r * Math.pow(1 + r, N)) / (Math.pow(1 + r, N) - 1)).toFixed(2);
      }

      const totalRepayVal = +(emiVal * N).toFixed(2);
      const totalInterestVal = +(totalRepayVal - P).toFixed(2);

      setEmi(emiVal);
      setTotalRepay(totalRepayVal);
      setTotalInterest(totalInterestVal);

      // Build simulated schedule
      const simulatedSchedule = [];
      let balance = P;
      for (let i = 1; i <= N; i++) {
        const interest = +(balance * r).toFixed(2);
        const principalPart = +(emiVal - interest).toFixed(2);
        balance = +(balance - principalPart).toFixed(2);
        
        simulatedSchedule.push({
          installmentNumber: i,
          emi: emiVal,
          interest,
          principal: principalPart,
          balance: balance < 0 ? 0 : balance
        });
      }
      setSchedule(simulatedSchedule);
    }
  }, [amount, interestRate, termMonths]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (amount < 1000) {
      setErrorMsg('Minimum loan amount is ₹1,000.');
      return;
    }
    if (termMonths < 1) {
      setErrorMsg('Minimum term duration is 1 month.');
      return;
    }

    setIsSubmitting(true);
    try {
      await applyForLoan(amount, interestRate, termMonths, purpose);
      navigate('/borrower/loans');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit loan application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="fade-in">
      <div className="page-header">
        <h2 className="page-title">Apply for a New Loan</h2>
      </div>

      {errorMsg && (
        <div style={{
          backgroundColor: 'var(--danger-bg)',
          border: '1px solid rgba(239,68,68,0.2)',
          color: 'var(--danger)',
          padding: '1rem',
          borderRadius: 'var(--border-radius-sm)',
          fontSize: '0.9rem'
        }}>
          {errorMsg}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '2rem'
      }}>
        
        {/* Loan Config Form */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Loan Parameters</h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Amount Slider & Input */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Loan Amount (₹)</label>
                <span style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '1.15rem' }}>
                  ₹{Number(amount).toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="range"
                min="1000"
                max="500000"
                step="1000"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer', margin: '0.5rem 0' }}
                disabled={isSubmitting}
              />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="input-field"
                min="1000"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Interest Rate */}
            <div className="form-group">
              <label>Interest Rate (% p.a.)</label>
              <div style={{ position: 'relative' }}>
                <Percent size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <select
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="input-field"
                  disabled={isSubmitting}
                >
                  <option value="8">8% p.a. (Prime Grade)</option>
                  <option value="10">10% p.a. (A Grade)</option>
                  <option value="12">12% p.a. (B Grade - Standard)</option>
                  <option value="15">15% p.a. (C Grade - Medium Risk)</option>
                  <option value="18">18% p.a. (High Yield)</option>
                </select>
              </div>
            </div>

            {/* Tenure months slider & select */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Repayment Term</label>
                <span style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>
                  {termMonths} Months
                </span>
              </div>
              <input
                type="range"
                min="3"
                max="60"
                step="3"
                value={termMonths}
                onChange={(e) => setTermMonths(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer', margin: '0.5rem 0' }}
                disabled={isSubmitting}
              />
            </div>

            {/* Loan Purpose */}
            <div className="form-group">
              <label>Purpose of Loan</label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Describe why you need the funds (e.g., Medical expenses, Business growth, Education...)"
                className="input-field"
                rows="4"
                required
                disabled={isSubmitting}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting Application...' : 'Submit Loan Application'}
            </button>
          </form>
        </div>

        {/* Live EMI Calculator Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Summary Card */}
          <div className="glass-card" style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%), var(--card-bg)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Estimated Repayment Summary</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Monthly Installment (EMI)
              </span>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                ₹{emi.toLocaleString('en-IN')}
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid var(--card-border)', paddingTop: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TOTAL INTEREST</span>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>
                  ₹{totalInterest.toLocaleString('en-IN')}
                </h4>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TOTAL REPAYMENT</span>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  ₹{totalRepay.toLocaleString('en-IN')}
                </h4>
              </div>
            </div>
          </div>

          {/* Dynamic Schedule Preview */}
          <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '250px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Simulated Amortization Schedule</h3>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem' }}>Month</th>
                    <th style={{ padding: '0.5rem' }}>Installment</th>
                    <th style={{ padding: '0.5rem' }}>Interest</th>
                    <th style={{ padding: '0.5rem' }}>Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.slice(0, 12).map((item) => (
                    <tr key={item.installmentNumber}>
                      <td style={{ padding: '0.5rem' }}>Month {item.installmentNumber}</td>
                      <td style={{ padding: '0.5rem', fontWeight: 600 }}>₹{item.emi.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '0.5rem', color: 'var(--accent-secondary)' }}>₹{item.interest.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>₹{Math.round(item.balance).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                  {schedule.length > 12 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '0.5rem' }}>
                        ... and {schedule.length - 12} more installments
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default CreateLoan;
