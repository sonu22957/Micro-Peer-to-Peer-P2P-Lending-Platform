// fronted/src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Simulated role is used to support Lender UI since the backend treats them as standard 'user'
  const [simulatedRole, setSimulatedRole] = useState(localStorage.getItem('simulatedRole') || null);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const data = await authService.getProfile();
          setUser(data.user);
          // If no simulated role has been set yet, fall back to backend role
          if (!simulatedRole) {
            setSimulatedRole(data.user.role);
            localStorage.setItem('simulatedRole', data.user.role);
          }
        } catch (err) {
          console.error('Failed to restore session:', err);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.login(email, password);
      setToken(data.token);
      setUser(data.user);
      
      // Look at the backend role. If they login as a staff or admin, role is staff/admin.
      // Otherwise, check if they had a previously selected simulated role, or default to borrower ('user')
      const backendRole = data.user.role;
      let sRole = backendRole;
      if (backendRole === 'user') {
        // Retrieve if they had a stored preference
        sRole = localStorage.getItem('simulatedRole') || 'borrower';
      }
      setSimulatedRole(sRole);
      localStorage.setItem('simulatedRole', sRole);
      
      setLoading(false);
      return data.user;
    } catch (err) {
      setError(err.message || 'Login failed.');
      setLoading(false);
      throw err;
    }
  };

  const register = async (name, email, password, requestedRole = 'borrower') => {
    setLoading(true);
    setError(null);
    try {
      // Backend only accepts 'user', 'staff', 'admin'. 
      // If requestedRole is 'lender' or 'borrower', register as 'user' on the backend.
      const backendReqRole = requestedRole === 'staff' ? 'staff' : 'user';
      const data = await authService.register(name, email, password, backendReqRole);
      setToken(data.token);
      setUser(data.user);
      
      setSimulatedRole(requestedRole);
      localStorage.setItem('simulatedRole', requestedRole);
      
      setLoading(false);
      return data.user;
    } catch (err) {
      setError(err.message || 'Registration failed.');
      setLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Logout API failed:', err);
    }
    setToken(null);
    setUser(null);
    setSimulatedRole(null);
    localStorage.removeItem('simulatedRole');
    setLoading(false);
  };

  const updateSimulatedRole = (role) => {
    setSimulatedRole(role);
    localStorage.setItem('simulatedRole', role);
  };

  const refreshUser = async () => {
    try {
      const data = await authService.getProfile();
      setUser(data.user);
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    simulatedRole,
    login,
    register,
    logout,
    updateSimulatedRole,
    refreshUser,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export default AuthContext;
