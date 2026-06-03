import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import type { UserLoginInfo, BackendMenu } from '@/types';
import { storage } from '@/lib/storage';

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  user: UserLoginInfo | null;
  menus: BackendMenu[];
  setAuthData: (data: { user: UserLoginInfo; menus: BackendMenu[]; token: string; refreshToken: string }) => void;
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
    const token = storage.get('token');
    const storedUser = storage.get('user');
    const storedMenus = storage.get('menus');

    if (token) {
      setIsAuthenticated(true);
      if (storedUser) {
        setUser(storedUser);
      }
      if (storedMenus) {
        setMenus(storedMenus);
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

  const setAuthData = useCallback((data: { 
    user: UserLoginInfo; 
    menus: BackendMenu[]; 
    token?: string; 
    refreshToken?: string 
  }) => {
    setUser(data.user);
    setMenus(data.menus);
    setIsAuthenticated(true);
    
    // Only store tokens if they are actually provided in the payload
    if (data.token) storage.set('token', data.token);
    if (data.refreshToken) storage.set('refreshToken', data.refreshToken);
    
    storage.set('user', data.user);
    storage.set('menus', data.menus);
  }, []);

  const logout = useCallback(() => {
    storage.remove('token');
    storage.remove('refreshToken');
    storage.remove('user');
    storage.remove('menus');
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
