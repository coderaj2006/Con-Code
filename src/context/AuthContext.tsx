import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthUser {
  name: string;
  crop: string;
  farmer_id: number;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  setProfile: (name: string, crop: string) => void;
  logout: () => void;
  getAuthHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('kisaan_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { localStorage.removeItem('kisaan_user'); }
    }
    setIsLoading(false);
  }, []);

  const setProfile = (name: string, crop: string) => {
    const u: AuthUser = { name, crop, farmer_id: 1 };
    setUser(u);
    localStorage.setItem('kisaan_user', JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('kisaan_user');
  };

  // No JWT — kept for API compatibility, returns empty headers
  const getAuthHeaders = (): Record<string, string> => ({});

  return (
    <AuthContext.Provider value={{ user, isLoading, setProfile, logout, getAuthHeaders }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
