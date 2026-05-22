import axiosClient from '@/lib/axiosClient';
import type { BackendMenu, MenuFormData } from '@/types';

export const MenuService = {
  getTree: async () => {
    const response = await axiosClient.get('auth-api/menus/tree');
    return response.data;
  },

  create: async (data: MenuFormData) => {
    const response = await axiosClient.post('auth-api/menus', data);
    return response.data;
  },

  update: async (id: string, data: MenuFormData) => {
    const response = await axiosClient.put(`auth-api/menus/${id}`, data);
    return response.data;
  },

  remove: async (id: string) => {
    const response = await axiosClient.delete(`auth-api/menus/${id}`);
    return response.data;
  },
};
