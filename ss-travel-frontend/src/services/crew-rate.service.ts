import api from '@/lib/axiosClient';
import type {
  BaseResponse,
  CrewRateRule,
  CrewRateRuleFormData,
  CrewRole,
  CrewServiceType,
  CrewRateType,
  CrewRateSnapshotQuery,
  CrewRateSnapshotResult,
} from '@/types';

export const CrewRateService = {
  findAll: async (params?: {
    role?: CrewRole;
    serviceType?: CrewServiceType;
    rateType?: CrewRateType;
  }): Promise<BaseResponse<CrewRateRule[]>> => {
    const response = await api.get<BaseResponse<CrewRateRule[]>>('api/v1/crew-rates', {
      params,
    });
    return response.data;
  },

  findOne: async (id: string): Promise<BaseResponse<CrewRateRule>> => {
    const response = await api.get<BaseResponse<CrewRateRule>>(`api/v1/crew-rates/${id}`);
    return response.data;
  },

  create: async (data: CrewRateRuleFormData): Promise<BaseResponse<CrewRateRule>> => {
    const response = await api.post<BaseResponse<CrewRateRule>>('api/v1/crew-rates', data);
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<CrewRateRuleFormData>,
  ): Promise<BaseResponse<CrewRateRule>> => {
    const response = await api.put<BaseResponse<CrewRateRule>>(
      `api/v1/crew-rates/${id}`,
      data,
    );
    return response.data;
  },

  delete: async (
    id: string,
  ): Promise<BaseResponse<{ success: boolean; message: string }>> => {
    const response = await api.delete<BaseResponse<{ success: boolean; message: string }>>(
      `api/v1/crew-rates/${id}`,
    );
    return response.data;
  },

  getRateSnapshot: async (
    params: CrewRateSnapshotQuery,
  ): Promise<BaseResponse<CrewRateSnapshotResult>> => {
    const response = await api.get<BaseResponse<CrewRateSnapshotResult>>(
      'api/v1/crew-rates/snapshot',
      { params },
    );
    return response.data;
  },
};
