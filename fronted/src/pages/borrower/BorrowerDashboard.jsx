// fronted/src/pages/borrower/BorrowerDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useLoans } from '../../context/LoanContext';
import { paymentService } from '../../services/paymentService';
import StatsCard from '../../components/StatsCard';
import TransactionTable from '../../components/TransactionTable';
import Modal from '../../components/Modal';
import Loader from '../../components/Loader';
import { Landmark, AlertTriangle, CalendarDays, Receipt, ExternalLink, Coins, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const BorrowerDashboard = () => {
  const navigate = useNavigate();
  const { loans, fetchMyLoans, payInstallment } = useLoans();
  const [upcoming, setUpcoming] = useState([]);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({ activeAmount: 0, pendingCount: 0, upcomingDue: 0, overdueCount: 0 });
  const [loading, setLoading] = useState(true);

  // Pay Modal State
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedRepayment, setSelectedRepayment] = useState(null);
  const [payMethod, setPayMethod] = useState('stripe');
  const [payAmount, setPayAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [payError, setPayError] = useState('');
  const [paySuccessMsg, setPaySuccessMsg] = useState('');

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch loans
      await fetchMyLoans();
      
      // Fetch upcoming repayments
      const upcomingData = await paymentService.getUpcomingRepayments(30);
      setUpcoming(upcomingData.repayments || []);
      
      // Fetch recent payments
      const paymentsData = await paymentService.getMyPayments(null, 1, 5);
      setPayments(paymentsData.payments || []);
    } catch (err) {
      console.error('Error loading borrower dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [fetchMyLoans]);

  // Recalculate stats when lists update
  useEffect(() => {
    const active = loans.filter((l) => l.status === 'disbursed');
    const activeAmount = active.reduce((sum, l) => sum + l.amount, 0);
    const pendingCount = loans.filter((l) => l.status === 'pending').length;
    
    const upcomingDue = upcoming.reduce((sum, r) => sum + r.amountDue, 0);
    const overdueCount = upcoming.filter((r) => r.status === 'overdue').length;

    setStats({ activeAmount, pendingCount, upcomingDue, overdueCount });
  }, [loans, upcoming]);

  const handleOpenPayModal = (repayment) => {
    setSelectedRepayment(repayment);
    setPayAmount(repayment.amountDue - repayment.amountPaid);
    setPayError('');
    setPaySuccessMsg('');
    setPayModalOpen(true);
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setPayError('');
    setPaySuccessMsg('');
    setPaymentProcessing(true);

    try {
      const response = await payInstallment(
        selectedRepayment.loan._id,
        selectedRepayment._id,
        Number(payAmount),
        payMethod,
        notes
      );

      setPaySuccessMsg(
        payMethod === 'stripe'
          ? '✓ Stripe Payment Intent created successfully (Simulated Verification).'
          : '✓ Bank transfer submitted. Awaiting staff audit verification.'
      );

      // Refresh dashboard data
      setTimeout(async () => {
        setPayModalOpen(false);
        await loadDashboardData();
      }, 2000);
    } catch (err) {
      setPayError(err.message || 'Payment processing failed.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  if (loading) return <Loader message="Loading Borrower Dashboard..." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="fade-in">
      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.5rem',
      }}>
        <StatsCard
          title="Active Borrowed"
          value={`₹${stats.activeAmount.toLocaleString('en-IN')}`}
          icon={<Landmark size={20} />}
          color="primary"
        />
        <StatsCard
          title="Pending Requests"
          value={stats.pendingCount}
          icon={<Receipt size={20} />}
          color="warning"
        />
        <StatsCard
          title="30-Day Due Amount"
          value={`₹${stats.upcomingDue.toLocaleString('en-IN')}`}
          icon={<CalendarDays size={20} />}
          color="secondary"
        />
        <StatsCard
          title="Overdue Installments"
          value={stats.overdueCount}
          icon={<AlertTriangle size={20} />}
          color={stats.overdueCount > 0 ? 'danger' : 'success'}
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '2rem',
      }}>
        
        {/* Upcoming Repayments Column */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarDays size={18} style={{ color: 'var(--accent-primary)' }} />
            Upcoming Repayments
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: '320px', paddingRight: '0.25rem' }}>
            {upcoming.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                No repayment installments due in the next 30 days.
              </div>
            ) : (
              upcoming.map((item) => (
                <div
                  key={item._id}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--card-border)',
                    borderRadius: 'var(--border-radius-sm)',
                    padding: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      INSTALLMENT #{item.installmentNumber}
                    </span>
                    <h5 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0.15rem 0' }}>
                      ₹{item.amountDue.toLocaleString('en-IN')}
                    </h5>
                    <span style={{ fontSize: '0.75rem', color: item.status === 'overdue' ? 'var(--danger)' : 'var(--text-secondary)' }}>
                      Due Date: {new Date(item.dueDate).toLocaleDateString()} {item.status === 'overdue' && '(Overdue)'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleOpenPayModal(item)}
                    className="btn btn-primary"
                    style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', borderRadius: '8px' }}
                  >
                    Pay EMI
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Nav / Apply Card */}
        <div
          className="glass-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%), var(--card-bg)',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            padding: '2rem',
          }}
        >
          <Coins size={40} style={{ color: 'var(--accent-primary)' }} />
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Need More Capital?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '300px', margin: '0 auto', lineHeight: 1.5 }}>
              Apply for another customized loan instantly. Calculate your interest schedule as you configure your options.
            </p>
          </div>
          <button
            onClick={() => navigate('/borrower/apply')}
            className="btn btn-primary"
            style={{ width: '100%', maxWidth: '200px' }}
          >
            <span>Apply Now</span>
            <ExternalLink size={14} />
          </button>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Recent Repayment Activities</h3>
        <TransactionTable transactions={payments} />
      </div>

      {/* Pay Installment Modal */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => !paymentProcessing && setPayModalOpen(false)}
        title={`Repay Installment #${selectedRepayment?.installmentNumber}`}
      >
        {paySuccessMsg ? (
          <div style={{ textAlign: 'center', padding: '1rem 0', color: 'var(--success)', fontWeight: 600 }}>
            {paySuccessMsg}
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
                disabled={paymentProcessing}
              />
            </div>

            <div className="form-group">
              <label>Payment Method</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="input-field"
                disabled={paymentProcessing}
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
                  disabled={paymentProcessing}
                />
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={paymentProcessing}>
              {paymentProcessing ? 'Processing Transaction...' : `Confirm Payment of ₹${Number(payAmount).toLocaleString('en-IN')}`}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default BorrowerDashboard;
