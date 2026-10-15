import api from '@/lib/axiosClient';
import type { BaseResponse, Role, RoleFormData, BackendMenu } from '@/types';

export const RoleService = {
  findAll: async (): Promise<BaseResponse<Role[]>> => {
    const response = await api.get<BaseResponse<Role[]>>('api/v1/roles');
    return response.data;
  },

  findOne: async (id: string): Promise<BaseResponse<Role>> => {
    const response = await api.get<BaseResponse<Role>>(`api/v1/roles/${id}`);
    return response.data;
  },

  getMenus: async (): Promise<BaseResponse<BackendMenu[]>> => {
    const response = await api.get<BaseResponse<BackendMenu[]>>(
      'api/v1/roles/menus'
    );
    return response.data;
  },

  create: async (data: RoleFormData): Promise<BaseResponse<Role>> => {
    const response = await api.post<BaseResponse<Role>>('api/v1/roles', data);
    return response.data;
  },

  update: async (
    id: string,
    data: RoleFormData
  ): Promise<BaseResponse<Role>> => {
    const response = await api.put<BaseResponse<Role>>(
      `api/v1/roles/${id}`,
      data
    );
    return response.data;
  },
};
