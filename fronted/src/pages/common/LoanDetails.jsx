// fronted/src/pages/common/LoanDetails.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { loanService } from '../../services/loanService';
import { paymentService } from '../../services/paymentService';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Loader';
import Modal from '../../components/Modal';
import { Calendar, Percent, Clock, Landmark, Receipt, AlertCircle, ShieldAlert } from 'lucide-react';

export const LoanDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { simulatedRole } = useAuth();

  const [loan, setLoan] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Payment Form Modal State
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedRepayment, setSelectedRepayment] = useState(null);
  const [payMethod, setPayMethod] = useState('stripe');
  const [payAmount, setPayAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [payError, setPayError] = useState('');
  const [paySuccess, setPaySuccess] = useState('');

  // Waive Form Modal State (Admin)
  const [waiveModalOpen, setWaiveModalOpen] = useState(false);
  const [waiveReason, setWaiveReason] = useState('');
  const [submittingWaive, setSubmittingWaive] = useState(false);

  const loadLoanDetails = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Check if it's a simulated mock loan from the lender marketplace
      if (id.startsWith('m-')) {
        const mockLoan = location.state?.simulatedMockLoan || {
          _id: id,
          amount: 50000,
          interestRate: 12,
          termMonths: 12,
          purpose: 'Simulated Loan Request',
          user: { name: 'Verified Borrower' },
          status: 'approved',
          createdAt: new Date().toISOString()
        };
        setLoan(mockLoan);
        
        // Build simulated schedule
        const P = mockLoan.amount;
        const r = mockLoan.interestRate / 100 / 12;
        const N = mockLoan.termMonths;
        const emiVal = +((P * r * Math.pow(1 + r, N)) / (Math.pow(1 + r, N) - 1)).toFixed(2);
        
        const simSchedule = [];
        for (let i = 1; i <= N; i++) {
          const dueDate = new Date();
          dueDate.setMonth(dueDate.getMonth() + i);
          simSchedule.push({
            _id: `mock-rep-${i}`,
            installmentNumber: i,
            amountDue: emiVal,
            amountPaid: 0,
            dueDate: dueDate.toISOString(),
            status: 'pending'
          });
        }
        setSchedule(simSchedule);
        setPayments([]);
        setLoading(false);
        return;
      }

      // Fetch real database loan
      const loanData = await loanService.getLoanById(id);
      setLoan(loanData.loan);

      // Fetch schedule/installments
      try {
        const scheduleData = await paymentService.getRepaymentsByLoan(id);
        setSchedule(scheduleData.repayments || []);
      } catch (err) {
        // Fallback: If no installments generated yet, get theoretical schedule
        const scheduleData = await loanService.getLoanSchedule(id);
        setSchedule(scheduleData.schedule || []);
      }

      // Fetch payments
      const paymentsData = await paymentService.getPaymentsByLoan(id);
      setPayments(paymentsData.payments || []);

    } catch (err) {
      setErrorMsg(err.message || 'Failed to load loan details.');
    } finally {
      setLoading(false);
    }
  }, [id, location.state]);

  useEffect(() => {
    loadLoanDetails();
  }, [loadLoanDetails]);

  const handleOpenPayModal = (repayment) => {
    setSelectedRepayment(repayment);
    setPayAmount(repayment.amountDue - repayment.amountPaid);
    setPayError('');
    setPaySuccess('');
    setPayModalOpen(true);
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setPayError('');
    setPaySuccess('');
    setSubmittingPayment(true);

    try {
      await paymentService.makePayment({
        loanId: loan._id,
        repaymentId: selectedRepayment._id,
        amount: Number(payAmount),
        method: payMethod,
        notes: notes,
      });

      setPaySuccess(
        payMethod === 'stripe'
          ? '✓ Stripe Payment Intent processed successfully.'
          : '✓ Wire details submitted. Awaiting manual staff reconciliation.'
      );

      setTimeout(async () => {
        setPayModalOpen(false);
        await loadLoanDetails();
      }, 2000);
    } catch (err) {
      setPayError(err.message || 'Payment submission failed.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleOpenWaiveModal = (repayment) => {
    setSelectedRepayment(repayment);
    setWaiveReason('');
    setWaiveModalOpen(true);
  };

  const handleProcessWaive = async (e) => {
    e.preventDefault();
    setSubmittingWaive(true);
    try {
      await paymentService.waiveRepayment(selectedRepayment._id, waiveReason);
      setWaiveModalOpen(false);
      await loadLoanDetails();
    } catch (err) {
      alert(err.message || 'Waive operation failed.');
    } finally {
      setSubmittingWaive(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return 'badge badge-pending';
      case 'approved': return 'badge badge-approved';
      case 'rejected': return 'badge badge-rejected';
      case 'disbursed': return 'badge badge-disbursed';
      case 'closed': return 'badge badge-closed';
      case 'paid': return 'badge badge-disbursed';
      case 'overdue': return 'badge badge-rejected';
      case 'waived': return 'badge badge-waived';
      default: return 'badge';
    }
  };

  if (loading) return <Loader message="Fetching loan file..." />;

  if (errorMsg) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--danger)' }}>
        <AlertCircle size={32} style={{ marginBottom: '1rem' }} />
        <h3>Error Loading Loan</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{errorMsg}</p>
        <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginTop: '1.5rem', borderRadius: '8px' }}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="fade-in">
      
      {/* File Info Card */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className={getStatusBadge(loan.status)}>{loan.status}</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem', fontFamily: 'var(--font-heading)' }}>
              ₹{loan.amount.toLocaleString('en-IN')}
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              File ID: <span style={{ fontFamily: 'monospace' }}>{loan._id}</span>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Percent size={18} style={{ color: 'var(--accent-primary)' }} />
              <div>
                <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)' }}>ANNUAL RATE</span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{loan.interestRate}%</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Clock size={18} style={{ color: 'var(--accent-secondary)' }} />
              <div>
                <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)' }}>TERM MONTHS</span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{loan.termMonths} Months</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '1.25rem' }}>
          <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>BORROWER PURPOSE</span>
          <p style={{ fontSize: '0.9rem', marginTop: '0.25rem', lineHeight: 1.5 }}>{loan.purpose}</p>
        </div>
      </div>

      {/* Installments Repayment Schedule */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Receipt size={18} style={{ color: 'var(--accent-primary)' }} />
          EMI Repayment Installments
        </h3>

        <div className="table-container">
          {schedule.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Repayment installments are auto-generated once the loan is marked as disbursed.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Installment #</th>
                  <th>Due Date</th>
                  <th>Amount Due</th>
                  <th>Amount Paid</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((item) => (
                  <tr key={item._id}>
                    <td style={{ fontWeight: 700 }}>#{item.installmentNumber}</td>
                    <td>{new Date(item.dueDate).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 600 }}>₹{item.amountDue.toLocaleString('en-IN')}</td>
                    <td style={{ color: item.amountPaid > 0 ? 'var(--success)' : 'var(--text-secondary)' }}>
                      ₹{item.amountPaid.toLocaleString('en-IN')}
                    </td>
                    <td>
                      <span className={getStatusBadge(item.status)}>{item.status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {simulatedRole === 'borrower' && (item.status === 'pending' || item.status === 'overdue') && (
                          <button
                            onClick={() => handleOpenPayModal(item)}
                            className="btn btn-primary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '4px' }}
                          >
                            Pay EMI
                          </button>
                        )}

                        {(simulatedRole === 'staff' || simulatedRole === 'admin') && (item.status === 'pending' || item.status === 'overdue') && (
                          <>
                            <button
                              onClick={() => handleOpenWaiveModal(item)}
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid rgba(139,92,246,0.3)' }}
                            >
                              Waive Installment
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Transaction History against this loan */}
      {payments.length > 0 && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Payments Ledger</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Payment ID</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id}>
                  <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{p._id}</td>
                  <td style={{ textTransform: 'capitalize' }}>{p.method}</td>
                  <td style={{ fontWeight: 700 }}>₹{p.amount.toLocaleString('en-IN')}</td>
                  <td>
                    <span className={getStatusBadge(p.status)}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pay Installment Modal */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => !submittingPayment && setPayModalOpen(false)}
        title={`Pay Installment #${selectedRepayment?.installmentNumber}`}
      >
        {paySuccess ? (
          <div style={{ textAlign: 'center', padding: '1rem 0', color: 'var(--success)', fontWeight: 600 }}>
            {paySuccess}
          </div>
        ) : (
          <form onSubmit={handleProcessPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {payError && (
              <div style={{ color: 'var(--danger)', fontSize: '0.85rem', backgroundColor: 'var(--danger-bg)', padding: '0.75rem', borderRadius: '4px' }}>
                {payError}
              </div>
            )}
            
            <div className="form-group">
              <label>Amount to Pay (INR)</label>
              <input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="input-field"
                min="1"
                required
                disabled={submittingPayment}
              />
            </div>

            <div className="form-group">
              <label>Payment Method</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="input-field"
                disabled={submittingPayment}
              >
                <option value="stripe">Stripe Instant Checkout (Credit Card)</option>
                <option value="bank_transfer">Bank Wire Transfer (Manual Reconciliation)</option>
                <option value="cash">Cash Settlement</option>
              </select>
            </div>

            {payMethod !== 'stripe' && (
              <div className="form-group">
                <label>Verification Notes / Bank Ref</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field"
                  rows="3"
                  placeholder="Paste bank transfer reference or cash deposit description..."
                  disabled={submittingPayment}
                />
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={submittingPayment}>
              {submittingPayment ? 'Processing Transaction...' : `Confirm Payment of ₹${Number(payAmount).toLocaleString('en-IN')}`}
            </button>
          </form>
        )}
      </Modal>

      {/* Waive Installment Modal */}
      <Modal
        isOpen={waiveModalOpen}
        onClose={() => !submittingWaive && setWaiveModalOpen(false)}
        title={`Waive Installment #${selectedRepayment?.installmentNumber}`}
      >
        <form onSubmit={handleProcessWaive} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--warning)', backgroundColor: 'var(--warning-bg)', padding: '0.75rem', borderRadius: '4px', fontSize: '0.8rem' }}>
            <ShieldAlert size={16} style={{ flexShrink: 0 }} />
            <span>Warning: Waiving this installment will write off the remaining due amount of ₹{(selectedRepayment?.amountDue - selectedRepayment?.amountPaid).toLocaleString('en-IN')} as forgiven.</span>
          </div>

          <div className="form-group">
            <label>Reason for Waiver</label>
            <textarea
              value={waiveReason}
              onChange={(e) => setWaiveReason(e.target.value)}
              placeholder="e.g. Borrower hardship settlement, write-off agreement..."
              className="input-field"
              rows="3"
              required
              disabled={submittingWaive}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', background: 'var(--accent-secondary)' }} disabled={submittingWaive}>
            {submittingWaive ? 'Processing Waiver...' : 'Confirm Forgiveness / Waiver'}
          </button>
        </form>
      </Modal>

    </div>
  );
};

export default LoanDetails;
