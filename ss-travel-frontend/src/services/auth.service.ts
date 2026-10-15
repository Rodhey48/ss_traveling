import api from '@/lib/axiosClient';
import type { BaseResponse, LoginResponseData } from '@/types';
import { storage } from '@/lib/storage';

export const AuthService = {
  login: async (data: any): Promise<BaseResponse<LoginResponseData>> => {
    const response = await api.post<BaseResponse<LoginResponseData>>(
      'api/v1/auth/login',
      data
    );
    return response.data;
  },

  getMe: async (): Promise<BaseResponse<LoginResponseData>> => {
    const response = await api.get<BaseResponse<LoginResponseData>>(
      'api/v1/auth/me',
      { silent: true } // Jangan tampilkan toast error jika background sync gagal sementara
    );
    return response.data;
  },

  logout: async () => {
    try {
      // Panggil backend untuk membatalkan sessionToken di database & membersihkan HttpOnly cookie
      await api.post('api/v1/auth/logout', {}, { silent: true });
    } catch (error) {
      console.warn('[Auth] Backend logout request failed or network offline:', error);
    } finally {
      // Bersihkan seluruh data lokal pengguna
      storage.remove('token');
      storage.remove('refreshToken');
      storage.remove('user');
      storage.remove('menus');
      window.location.href = '/login';
    }
  },
};
