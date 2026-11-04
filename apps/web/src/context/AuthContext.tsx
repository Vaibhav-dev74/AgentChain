import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'OPERATOR' | 'AUDITOR' | 'USER';
  wallet_address?: string | null;
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  register: (data: { username: string; email: string; password: string; wallet_address?: string }) => Promise<void>;
  logout: () => void;
  updateUserWallet: (address: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('agentchain_jwt'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = async () => {
      const storedToken = localStorage.getItem('agentchain_jwt');
      if (storedToken) {
        try {
          const userData = await api.getMe();
          setUser(userData);
        } catch (err) {
          console.error('Session expired or invalid:', err);
          api.clearToken();
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    fetchUser();
  }, []);

  const login = async (credentials: { username: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await api.login(credentials);
      setUser(res.user);
      setToken(res.access_token);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { username: string; email: string; password: string; wallet_address?: string }) => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      setUser(res.user);
      setToken(res.access_token);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
    setToken(null);
  };

  const updateUserWallet = async (address: string) => {
    if (!user) return;
    const updated = await api.connectWallet(address);
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateUserWallet }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
