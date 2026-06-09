// fronted/src/services/authService.js
import { api } from './api';

export const authService = {
  login: async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  register: async (name, email, password, role = 'user') => {
    const data = await api.post('/auth/register', { name, email, password, role });
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout API request failed, clearing local state anyway');
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { success: true };
  },

  getProfile: async () => {
    const data = await api.get('/auth/me');
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  updateProfile: async (name, email) => {
    const data = await api.put('/auth/me', { name, email });
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  changePassword: async (currentPassword, newPassword) => {
    return await api.put('/auth/change-password', { currentPassword, newPassword });
  },
};
export default authService;
