'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { setAccessToken } from '@/lib/api';

interface User {
  userId: string;
  orgId: string;
  role: 'ADMIN' | 'ACCOUNTANT' | 'USER';
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const decoded = jwtDecode(token) as User;
        setUser(decoded);
        setAccessToken(token);
      } catch (err) {
        localStorage.removeItem('accessToken');
        setAccessToken(null);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (token: string) => {
    localStorage.setItem('accessToken', token);
    setAccessToken(token);
    const decoded = jwtDecode(token) as User;
    setUser(decoded);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
