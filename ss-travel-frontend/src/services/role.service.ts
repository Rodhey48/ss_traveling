import api from '@/lib/axiosClient';
import type { BaseResponse, Role, RoleFormData, BackendMenu } from '@/types';

export const RoleService = {
  findAll: async (): Promise<BaseResponse<Role[]>> => {
    const response = await api.get<BaseResponse<Role[]>>('/auth-api/roles');
    return response.data;
  },

  findOne: async (id: string): Promise<BaseResponse<Role>> => {
    const response = await api.get<BaseResponse<Role>>(`/auth-api/roles/${id}`);
    return response.data;
  },

  getMenus: async (): Promise<BaseResponse<BackendMenu[]>> => {
    const response = await api.get<BaseResponse<BackendMenu[]>>(
      '/auth-api/roles/menus'
    );
    return response.data;
  },

  create: async (data: RoleFormData): Promise<BaseResponse<Role>> => {
    const response = await api.post<BaseResponse<Role>>('/auth-api/roles', data);
    return response.data;
  },

  update: async (
    id: string,
    data: RoleFormData
  ): Promise<BaseResponse<Role>> => {
    const response = await api.put<BaseResponse<Role>>(
      `/auth-api/roles/${id}`,
      data
    );
    return response.data;
  },
};
