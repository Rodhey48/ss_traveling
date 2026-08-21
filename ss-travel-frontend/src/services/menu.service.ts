import axiosClient from '@/lib/axiosClient';
import type { MenuFormData } from '@/types';

export const MenuService = {
  getTree: async () => {
    const response = await axiosClient.get('api/menus/tree');
    return response.data;
  },

  create: async (data: MenuFormData) => {
    const response = await axiosClient.post('api/menus', data);
    return response.data;
  },

  update: async (id: string, data: MenuFormData) => {
    const response = await axiosClient.put(`api/menus/${id}`, data);
    return response.data;
  },

  remove: async (id: string) => {
    const response = await axiosClient.delete(`api/menus/${id}`);
    return response.data;
  },
};
