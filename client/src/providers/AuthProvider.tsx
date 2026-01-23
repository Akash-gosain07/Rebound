import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';
import type { User } from '../lib/types';

interface AuthContextValue {
  user: (User & { isAdmin?: boolean }) | null;
  accessToken: string | null;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  continueAsGuest: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ACCESS_KEY = 'rebound_access_token';
const REFRESH_KEY = 'rebound_refresh_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthContextValue['user']>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_KEY);
    const refresh = localStorage.getItem(REFRESH_KEY);
    if (token && refresh) {
      setAccessToken(token);
      api
        .get('/auth/me')
        .then((res) => setUser(res.data.user))
        .catch((err) => {
          console.warn('Auth check failed:', err);
          localStorage.removeItem(ACCESS_KEY);
          localStorage.removeItem(REFRESH_KEY);
        });
    }
  }, []);

  const handleAuthResponse = (data: any) => {
    const { accessToken: at, refreshToken: rt, user: u } = data;
    setUser(u);
    setAccessToken(at);
    localStorage.setItem(ACCESS_KEY, at);
    localStorage.setItem(REFRESH_KEY, rt);
  };

  const loginWithEmail = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    handleAuthResponse(res.data);
  };

  const signup = async (name: string, email: string, password: string) => {
    const res = await api.post('/auth/signup', { name, email, password });
    handleAuthResponse(res.data);
  };

  const continueAsGuest = async () => {
    const res = await api.post('/auth/guest');
    handleAuthResponse(res.data);
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loginWithEmail, signup, continueAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
