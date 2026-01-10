import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const GuestOnlyRoute: React.FC = () => {
  const { user } = useAuth();

  // If user is authenticated, redirect to home page
  if (user) {
    if(user.verified) 
      return <Navigate to="/chat" replace />;
    else
      return <Navigate to="/user/email" replace />;
  }
  return <Outlet />;
};