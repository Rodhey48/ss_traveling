import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import type { UserLoginInfo, BackendMenu } from '@/types';
import { storage } from '@/lib/storage';
import { AuthService } from '@/services/auth.service';

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  user: UserLoginInfo | null;
  menus: BackendMenu[];
  setAuthData: (data: { 
    user: UserLoginInfo; 
    menus: BackendMenu[]; 
    token?: string; 
    refreshToken?: string 
  }) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  loading: true,
  user: null,
  menus: [],
  setAuthData: () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<UserLoginInfo | null>(null);
  const [menus, setMenus] = useState<BackendMenu[]>([]);

  const loadStoredData = useCallback(() => {
    const token = storage.get('token');
    const refreshToken = storage.get('refreshToken');
    const storedUser = storage.get('user');
    const storedMenus = storage.get('menus');

    // Pengguna terautentikasi jika terdapat sesi user & token/refresh token
    if (storedUser && (refreshToken || token)) {
      setIsAuthenticated(true);
      setUser(storedUser);
      if (storedMenus) {
        setMenus(storedMenus);
      }

      // Background synchronization: refresh user profile & latest dynamic menus
      AuthService.getMe()
        .then((res) => {
          if (res?.data) {
            if (res.data.user) {
              setUser(res.data.user);
              storage.set('user', res.data.user);
            }
            if (res.data.menus) {
              setMenus(res.data.menus);
              storage.set('menus', res.data.menus);
            }
          }
        })
        .catch((err) => {
          // Silent fallback on network error/offline
          console.warn('[Auth] Background menu/profile sync skipped:', err?.message);
        });
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
    
    // Simpan token jika disertakan dalam respons
    if (data.token) storage.set('token', data.token);
    if (data.refreshToken) storage.set('refreshToken', data.refreshToken);
    
    storage.set('user', data.user);
    storage.set('menus', data.menus);
  }, []);

  const logout = useCallback(async () => {
    setIsAuthenticated(false);
    setUser(null);
    setMenus([]);
    await AuthService.logout();
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
