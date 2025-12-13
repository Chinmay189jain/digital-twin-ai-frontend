import React, { createContext, useContext, useState } from 'react';
import { decodeToken } from '../utils/jwtUtils';
interface AuthUser {
  email?: string;
  name?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  // Start as null; set after login/register
  const [user, setUser] = useState<AuthUser | null>(() => buildInitialUser());

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// build initial user from token synchronously
const buildInitialUser = (): AuthUser | null => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const decoded: any = decodeToken(token);

    const isExpired =
      !decoded || !decoded.exp || decoded.exp * 1000 < Date.now();

    if (isExpired) {
      localStorage.removeItem("token");
      return null;
    }

    return {
      email: decoded.sub,
      name: decoded.username ?? "",
    };
  } catch (e) {
    console.error("Failed to decode token", e);
    localStorage.removeItem("token");
    return null;
  }
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
