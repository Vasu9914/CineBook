import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Allow admin users or demo fallback user
  if (user?.role !== 'ADMIN' && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};
