import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiresAgent?: boolean;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, requiresAgent = false }) => {
  const { userData, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!userData) {
    return <Navigate to="/login" />;
  }

  if (requiresAgent && !userData.isVerifiedAgent) {
    return <Navigate to="/rentals" />;
  }

  return <>{children}</>;
};

export default PrivateRoute;