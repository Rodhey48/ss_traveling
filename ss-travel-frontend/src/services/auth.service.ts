import api from '@/lib/axiosClient';
import type { BaseResponse, LoginResponseData } from '@/types';
import { storage } from '@/lib/storage';

export const AuthService = {
  login: async (data: any): Promise<BaseResponse<LoginResponseData>> => {
    // Gateway points to auth-service via /auth-api prefix
    const response = await api.post<BaseResponse<LoginResponseData>>(
      '/auth-api/auth/login',
      data
    );
    return response.data;
  },
  getMe: async (): Promise<BaseResponse<LoginResponseData>> => {
    const response = await api.get<BaseResponse<LoginResponseData>>(
      '/auth-api/auth/me',
      { silent: true } // Don't show global error toast if background sync fails
    );
    return response.data;
  },
  logout: () => {
    storage.remove('token');
    storage.remove('refreshToken');
    storage.remove('user');
    storage.remove('menus');
    window.location.href = '/login';
  }
};
