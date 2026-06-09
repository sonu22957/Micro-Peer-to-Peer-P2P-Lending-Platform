// fronted/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, simulatedRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!isAuthenticated) {
    // Redirect to login page and remember original destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(simulatedRole)) {
    // Role not authorized, redirect to home or role-specific root
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
