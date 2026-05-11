'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api, { setAccessToken } from '@/lib/api';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Try to refresh token on load
        const { data } = await api.post('/auth/refresh');
        if (data.success && data.data.accessToken) {
          const token = data.data.accessToken;
          const decoded = jwtDecode(token) as User;
          setUser(decoded);
          setAccessToken(token);
        }
      } catch (err) {
        // No valid refresh token, user is not logged in
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (token: string) => {
    setAccessToken(token);
    const decoded = jwtDecode(token) as User;
    setUser(decoded);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      setAccessToken(null);
      setUser(null);
      router.push('/login');
    }
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
