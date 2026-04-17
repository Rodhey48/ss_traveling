import api from '@/lib/axiosClient';
import type { BaseResponse, LoginResponseData } from '@/types';

export const AuthService = {
  login: async (data: any): Promise<BaseResponse<LoginResponseData>> => {
    // Gateway points to auth-service via /auth-api prefix
    const response = await api.post<BaseResponse<LoginResponseData>>(
      '/auth-api/auth/login',
      data
    );
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
};
