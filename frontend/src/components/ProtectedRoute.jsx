import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  const userRole = user?.role;
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Enforce strict 1-to-1 RBAC mapping
    if (userRole === 'admin') return <Navigate to="/admin" replace />;
    if (userRole === 'manager') return <Navigate to="/manager" replace />;
    if (userRole === 'engineer') return <Navigate to="/engineer" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
