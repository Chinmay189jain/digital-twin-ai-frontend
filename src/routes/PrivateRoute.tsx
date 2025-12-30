import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const PrivateRoute: React.FC = () => {
  const { user } = useAuth();
  localStorage.removeItem("twin-email-verification");

  if (!user) {
    // Redirect to login if user not found
    return <Navigate to="/" replace />;
  } else if(!user.verified){
    // redirect to account verfiy page
    return <Navigate to="/user/email" replace />;
  }
  return <Outlet />;
};