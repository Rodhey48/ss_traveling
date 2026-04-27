import api from '@/lib/axiosClient';
import type { BaseResponse, User, UserFormData, PaginatedData } from '@/types';

export const UserService = {
  findAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<BaseResponse<PaginatedData<User>>> => {
    const response = await api.get<BaseResponse<PaginatedData<User>>>(
      '/auth-api/users',
      { params }
    );
    return response.data;
  },

  findOne: async (id: string): Promise<BaseResponse<User>> => {
    const response = await api.get<BaseResponse<User>>(`/auth-api/users/${id}`);
    return response.data;
  },

  create: async (data: UserFormData): Promise<BaseResponse<User>> => {
    const response = await api.post<BaseResponse<User>>('/auth-api/users', data);
    return response.data;
  },

  update: async (
    id: string,
    data: UserFormData
  ): Promise<BaseResponse<User>> => {
    const response = await api.put<BaseResponse<User>>(
      `/auth-api/users/${id}`,
      data
    );
    return response.data;
  },

  remove: async (id: string): Promise<BaseResponse<void>> => {
    const response = await api.delete<BaseResponse<void>>(
      `/auth-api/users/${id}`
    );
    return response.data;
  },
};
