import axiosClient from '@/lib/axiosClient';
import type { BackendMenu, MenuFormData } from '@/types';

export const MenuService = {
  getTree: async () => {
    const response = await axiosClient.get('menus/tree');
    return response.data;
  },

  create: async (data: MenuFormData) => {
    const response = await axiosClient.post('menus', data);
    return response.data;
  },

  update: async (id: string, data: MenuFormData) => {
    const response = await axiosClient.put(`menus/${id}`, data);
    return response.data;
  },

  remove: async (id: string) => {
    const response = await axiosClient.delete(`menus/${id}`);
    return response.data;
  },
};
