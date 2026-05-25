import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import type { UserLoginInfo, BackendMenu } from '@/types';

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  user: UserLoginInfo | null;
  menus: BackendMenu[];
  setAuthData: (data: { user: UserLoginInfo; menus: BackendMenu[] }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  loading: true,
  user: null,
  menus: [],
  setAuthData: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<UserLoginInfo | null>(null);
  const [menus, setMenus] = useState<BackendMenu[]>([]);

  const loadStoredData = useCallback(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedMenus = localStorage.getItem('menus');

    if (token) {
      setIsAuthenticated(true);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error('Failed to parse user from localStorage', e);
        }
      }
      if (storedMenus) {
        try {
          setMenus(JSON.parse(storedMenus));
        } catch (e) {
          console.error('Failed to parse menus from localStorage', e);
        }
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
      setMenus([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStoredData();
  }, [loadStoredData]);

  const setAuthData = useCallback((data: { user: UserLoginInfo; menus: BackendMenu[] }) => {
    setUser(data.user);
    setMenus(data.menus);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('menus', JSON.stringify(data.menus));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('menus');
    setIsAuthenticated(false);
    setUser(null);
    setMenus([]);
    window.location.href = '/login';
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      loading,
      user,
      menus,
      setAuthData,
      logout,
    }),
    [isAuthenticated, loading, user, menus, setAuthData, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
