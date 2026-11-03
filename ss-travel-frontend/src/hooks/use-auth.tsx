import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import type { UserLoginInfo, BackendMenu, Company } from '@/types';
import { storage } from '@/lib/storage';
import { AuthService } from '@/services/auth.service';

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  user: UserLoginInfo | null;
  menus: BackendMenu[];
  company: Company | null;
  setAuthData: (data: { 
    user: UserLoginInfo; 
    menus: BackendMenu[]; 
    company?: Company;
    token?: string; 
    refreshToken?: string 
  }) => void;
  setCompany: (company: Company) => void;
  refreshCompany: () => Promise<Company | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  loading: true,
  user: null,
  menus: [],
  company: null,
  setAuthData: () => {},
  setCompany: () => {},
  refreshCompany: async () => null,
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<UserLoginInfo | null>(null);
  const [menus, setMenus] = useState<BackendMenu[]>([]);
  const [company, setCompanyState] = useState<Company | null>(() => {
    return storage.get('company') || null;
  });

  const setCompany = useCallback((comp: Company) => {
    setCompanyState(comp);
    storage.set('company', comp);
  }, []);

  const refreshCompany = useCallback(async (): Promise<Company | null> => {
    try {
      const res = await AuthService.getPublicCompany();
      if (res?.data) {
        setCompanyState(res.data);
        storage.set('company', res.data);
        return res.data;
      }
    } catch (err: any) {
      console.warn('[Auth] Company fetch skipped:', err?.message);
    }
    return null;
  }, []);

  const loadStoredData = useCallback(() => {
    const token = storage.get('token');
    const refreshToken = storage.get('refreshToken');
    const storedUser = storage.get('user');
    const storedMenus = storage.get('menus');
    const storedCompany = storage.get('company');

    if (storedCompany) {
      setCompanyState(storedCompany);
    } else {
      // Fetch public company info immediately on boot if not stored yet
      refreshCompany();
    }

    // Pengguna terautentikasi jika terdapat sesi user & token/refresh token
    if (storedUser && (refreshToken || token)) {
      setIsAuthenticated(true);
      setUser(storedUser);
      if (storedMenus) {
        setMenus(storedMenus);
      }

      // Background synchronization: refresh user profile & latest dynamic menus & company
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
            if (res.data.company) {
              setCompanyState(res.data.company);
              storage.set('company', res.data.company);
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
  }, [refreshCompany]);

  useEffect(() => {
    loadStoredData();
  }, [loadStoredData]);

  const setAuthData = useCallback((data: { 
    user: UserLoginInfo; 
    menus: BackendMenu[]; 
    company?: Company;
    token?: string; 
    refreshToken?: string 
  }) => {
    setUser(data.user);
    setMenus(data.menus);
    if (data.company) {
      setCompanyState(data.company);
      storage.set('company', data.company);
    }
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
      company,
      setAuthData,
      setCompany,
      refreshCompany,
      logout,
    }),
    [isAuthenticated, loading, user, menus, company, setAuthData, setCompany, refreshCompany, logout]
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

