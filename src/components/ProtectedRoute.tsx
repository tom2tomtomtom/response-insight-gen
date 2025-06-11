import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = localStorage.getItem('qualicoding-auth') === 'authenticated';

  useEffect(() => {
    // Check authentication on mount and navigation
    if (!isAuthenticated) {
      // Clear any stale data
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('qualicoding-') && key !== 'qualicoding-auth') {
          localStorage.removeItem(key);
        }
      });
    }
  }, [isAuthenticated, location]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;