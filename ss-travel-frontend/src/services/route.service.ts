import api from '@/lib/axiosClient';
import type {
  BaseResponse,
  Route,
  RouteFormData,
  TripServiceType,
} from '@/types';

export const RouteService = {
  findAll: async (serviceType?: TripServiceType): Promise<BaseResponse<Route[]>> => {
    const params = serviceType ? { serviceType } : undefined;
    const response = await api.get<BaseResponse<Route[]>>('api/v1/routes', { params });
    return response.data;
  },

  findOne: async (id: string): Promise<BaseResponse<Route>> => {
    const response = await api.get<BaseResponse<Route>>(`api/v1/routes/${id}`);
    return response.data;
  },

  create: async (data: RouteFormData): Promise<BaseResponse<Route>> => {
    const response = await api.post<BaseResponse<Route>>('api/v1/routes', data);
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<RouteFormData>,
  ): Promise<BaseResponse<Route>> => {
    const response = await api.put<BaseResponse<Route>>(`api/v1/routes/${id}`, data);
    return response.data;
  },

  delete: async (
    id: string,
  ): Promise<BaseResponse<{ success: boolean; message: string }>> => {
    const response = await api.delete<BaseResponse<{ success: boolean; message: string }>>(
      `api/v1/routes/${id}`,
    );
    return response.data;
  },
};
