// fronted/src/context/LoanContext.jsx
import React, { createContext, useState, useContext, useCallback } from 'react';
import { loanService } from '../services/loanService';
import { paymentService } from '../services/paymentService';

const LoanContext = createContext(null);

export const LoanProvider = ({ children }) => {
  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [repayments, setRepayments] = useState([]);
  const [loanSummary, setLoanSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch borrower (current user) loans
  const fetchMyLoans = useCallback(async (status) => {
    setLoading(true);
    setError(null);
    try {
      const data = await loanService.getMyLoans(status, 1, 100);
      setLoans(data.loans || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch loans.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all loans (for staff/admin review or marketplace)
  const fetchAllLoans = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await loanService.getAllLoans(filters);
      setLoans(data.loans || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch all loans.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch borrower (current user) repayments
  const fetchMyRepayments = useCallback(async (status) => {
    setLoading(true);
    setError(null);
    try {
      const data = await paymentService.getMyRepayments(status, 1, 100);
      setRepayments(data.repayments || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch repayments.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch borrower (current user) payments
  const fetchMyPayments = useCallback(async (status) => {
    setLoading(true);
    setError(null);
    try {
      const data = await paymentService.getMyPayments(status, 1, 100);
      setPayments(data.payments || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch payments.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Submit loan application
  const applyForLoan = async (amount, interestRate, termMonths, purpose) => {
    setLoading(true);
    setError(null);
    try {
      const data = await loanService.applyForLoan({ amount, interestRate, termMonths, purpose });
      setLoans((prev) => [data.loan, ...prev]);
      return data.loan;
    } catch (err) {
      setError(err.message || 'Failed to apply for loan.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Pay an installment
  const payInstallment = async (loanId, repaymentId, amount, method, notes) => {
    setLoading(true);
    setError(null);
    try {
      const data = await paymentService.makePayment({ loanId, repaymentId, amount, method, notes });
      // Refresh repayments and payments
      await fetchMyRepayments();
      await fetchMyPayments();
      return data;
    } catch (err) {
      setError(err.message || 'Payment failed.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Admin approval / rejection / disbursement
  const approveLoan = async (id) => {
    try {
      await loanService.approveLoan(id);
      setLoans((prev) => prev.map((l) => (l._id === id ? { ...l, status: 'approved' } : l)));
    } catch (err) {
      throw new Error(err.message || 'Approve failed.');
    }
  };

  const rejectLoan = async (id, reason) => {
    try {
      await loanService.rejectLoan(id, reason);
      setLoans((prev) => prev.map((l) => (l._id === id ? { ...l, status: 'rejected', rejectionReason: reason } : l)));
    } catch (err) {
      throw new Error(err.message || 'Reject failed.');
    }
  };

  const disburseLoan = async (id) => {
    try {
      await loanService.disburseLoan(id);
      setLoans((prev) => prev.map((l) => (l._id === id ? { ...l, status: 'disbursed' } : l)));
    } catch (err) {
      throw new Error(err.message || 'Disburse failed.');
    }
  };

  const value = {
    loans,
    payments,
    repayments,
    loanSummary,
    loading,
    error,
    fetchMyLoans,
    fetchAllLoans,
    fetchMyRepayments,
    fetchMyPayments,
    applyForLoan,
    payInstallment,
    approveLoan,
    rejectLoan,
    disburseLoan,
  };

  return <LoanContext.Provider value={value}>{children}</LoanContext.Provider>;
};

export const useLoans = () => {
  const context = useContext(LoanContext);
  if (!context) {
    throw new Error('useLoans must be used within a LoanProvider');
  }
  return context;
};
export default LoanContext;
