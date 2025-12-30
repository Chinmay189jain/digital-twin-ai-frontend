import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute: React.FC = () => {
  const { user } = useAuth();
  const openVerificationPage = localStorage.getItem("twin-email-verification") === "true";

  if (user && user?.email && openVerificationPage) {
    return <Outlet />;
  }

  // Redirect to home page
  return <Navigate to="/" replace />;

};