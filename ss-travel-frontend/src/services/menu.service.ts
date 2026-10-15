import axiosClient from '@/lib/axiosClient';
import type { MenuFormData } from '@/types';

export const MenuService = {
  getTree: async () => {
    const response = await axiosClient.get('api/v1/menus/tree');
    return response.data;
  },

  create: async (data: MenuFormData) => {
    const response = await axiosClient.post('api/v1/menus', data);
    return response.data;
  },

  update: async (id: string, data: MenuFormData) => {
    const response = await axiosClient.put(`api/v1/menus/${id}`, data);
    return response.data;
  },

  remove: async (id: string) => {
    const response = await axiosClient.delete(`api/v1/menus/${id}`);
    return response.data;
  },
};
