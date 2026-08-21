import api from '@/lib/axiosClient';
import type { BaseResponse, LoginResponseData } from '@/types';
import { storage } from '@/lib/storage';

export const AuthService = {
  login: async (data: any): Promise<BaseResponse<LoginResponseData>> => {
    // Points to monolith auth endpoint under /api prefix
    const response = await api.post<BaseResponse<LoginResponseData>>(
      '/api/auth/login',
      data
    );
    return response.data;
  },
  getMe: async (): Promise<BaseResponse<LoginResponseData>> => {
    const response = await api.get<BaseResponse<LoginResponseData>>(
      '/api/auth/me',
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
