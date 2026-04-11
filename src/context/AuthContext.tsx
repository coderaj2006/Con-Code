import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:8002';

interface AuthUser {
  farmer_id: number;
  name: string;
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  signup: (name: string, phone: string, password: string, crop?: string) => Promise<void>;
  logout: () => void;
  getAuthHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('kisaan_auth');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { localStorage.removeItem('kisaan_auth'); }
    }
    setIsLoading(false);
  }, []);

  const login = async (phone: string, password: string) => {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Login failed');
    }
    const data = await res.json();
    const authUser: AuthUser = { farmer_id: data.farmer_id, name: data.name, token: data.access_token };
    setUser(authUser);
    localStorage.setItem('kisaan_auth', JSON.stringify(authUser));
  };

  const signup = async (name: string, phone: string, password: string, crop = 'Wheat') => {
    const res = await fetch(`${API_BASE}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, password, primary_crop: crop }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Signup failed');
    }
    const data = await res.json();
    const authUser: AuthUser = { farmer_id: data.farmer_id, name: data.name, token: data.access_token };
    setUser(authUser);
    localStorage.setItem('kisaan_auth', JSON.stringify(authUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('kisaan_auth');
  };

  const getAuthHeaders = (): Record<string, string> => {
    if (!user) return {};
    return { Authorization: `Bearer ${user.token}` };
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, getAuthHeaders }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
