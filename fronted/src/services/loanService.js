// fronted/src/services/loanService.js
import { api } from './api';

export const loanService = {
  applyForLoan: async (loanData) => {
    return await api.post('/loans/apply', loanData);
  },

  getMyLoans: async (status, page = 1, limit = 10) => {
    const query = new URLSearchParams({ page, limit });
    if (status) query.append('status', status);
    return await api.get(`/loans/my?${query.toString()}`);
  },

  getAllLoans: async (filters = {}) => {
    const query = new URLSearchParams(filters);
    return await api.get(`/loans?${query.toString()}`);
  },

  getLoanById: async (id) => {
    return await api.get(`/loans/${id}`);
  },

  getLoanSchedule: async (id) => {
    return await api.get(`/loans/${id}/schedule`);
  },

  updateLoan: async (id, loanData) => {
    return await api.put(`/loans/${id}`, loanData);
  },

  approveLoan: async (id) => {
    return await api.patch(`/loans/${id}/approve`);
  },

  rejectLoan: async (id, reason) => {
    return await api.patch(`/loans/${id}/reject`, { reason });
  },

  disburseLoan: async (id) => {
    return await api.patch(`/loans/${id}/disburse`);
  },

  closeLoan: async (id) => {
    return await api.patch(`/loans/${id}/close`);
  },

  deleteLoan: async (id) => {
    return await api.delete(`/loans/${id}`);
  },

  getLoanSummary: async () => {
    return await api.get('/loans/summary');
  },
};
export default loanService;
