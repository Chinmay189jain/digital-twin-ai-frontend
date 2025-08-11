import React, {useEffect, useMemo} from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { decodeToken } from '../utils/jwtUtils';

export const PrivateRoute: React.FC = () => {
  const { user, setUser } = useAuth();
  const token = localStorage.getItem('token') || '';

  // Decode info from token & Memoize to avoid re-decoding on every render
  const decoded = useMemo(() => decodeToken(token), [token]);

  // Decide expired / invalid up-front
  const isExpired = !token || !decoded || decoded.exp * 1000 < Date.now(); 

  // Now the hook runs unconditionally, every render
  useEffect(() => {
    if (isExpired) {
      // clear out any stale state
      localStorage.removeItem('token');
      setUser(null);
    } else if (!user && decoded) {
      // populate context from a new valid token
      setUser({
        email: decoded.sub,
        name: decoded.username ?? '',
      });
    }
  }, [isExpired, user, decoded, setUser]);

  // Redirect to login if expired
  if (isExpired) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};