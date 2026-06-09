// fronted/src/services/paymentService.js
import { api } from './api';

export const paymentService = {
  // ─── PAYMENTS ───────────────────────────────────────────────────────────────
  makePayment: async (paymentData) => {
    return await api.post('/payments', paymentData);
  },

  getMyPayments: async (status, page = 1, limit = 10) => {
    const query = new URLSearchParams({ page, limit });
    if (status) query.append('status', status);
    return await api.get(`/payments/my?${query.toString()}`);
  },

  getPaymentsByLoan: async (loanId) => {
    return await api.get(`/payments/loan/${loanId}`);
  },

  getPaymentById: async (id) => {
    return await api.get(`/payments/${id}`);
  },

  getAllPayments: async (filters = {}) => {
    const query = new URLSearchParams(filters);
    return await api.get(`/payments?${query.toString()}`);
  },

  getPaymentSummary: async () => {
    return await api.get('/payments/summary');
  },

  verifyPayment: async (id) => {
    return await api.patch(`/payments/${id}/verify`);
  },

  refundPayment: async (id) => {
    return await api.patch(`/payments/${id}/refund`);
  },

  deletePayment: async (id) => {
    return await api.delete(`/payments/${id}`);
  },

  // ─── REPAYMENTS ─────────────────────────────────────────────────────────────
  getMyRepayments: async (status, page = 1, limit = 10) => {
    const query = new URLSearchParams({ page, limit });
    if (status) query.append('status', status);
    return await api.get(`/repayments/my?${query.toString()}`);
  },

  getUpcomingRepayments: async (days = 30) => {
    return await api.get(`/repayments/my/upcoming?days=${days}`);
  },

  getRepaymentsByLoan: async (loanId) => {
    return await api.get(`/repayments/loan/${loanId}`);
  },

  getRepaymentById: async (id) => {
    return await api.get(`/repayments/${id}`);
  },

  getAllRepayments: async (filters = {}) => {
    const query = new URLSearchParams(filters);
    return await api.get(`/repayments?${query.toString()}`);
  },

  getRepaymentSummary: async () => {
    return await api.get('/repayments/summary');
  },

  markRepaymentPaid: async (id, data = {}) => {
    return await api.patch(`/repayments/${id}/paid`, data);
  },

  markRepaymentOverdue: async (id, data = {}) => {
    return await api.patch(`/repayments/${id}/overdue`, data);
  },

  waiveRepayment: async (id, reason) => {
    return await api.patch(`/repayments/${id}/waive`, { reason });
  },

  deleteRepayment: async (id) => {
    return await api.delete(`/repayments/${id}`);
  },
};
export default paymentService;
