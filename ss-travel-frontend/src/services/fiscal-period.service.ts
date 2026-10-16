import api from '@/lib/axiosClient';
import type {
  BaseResponse,
  FiscalYear,
  FiscalPeriod,
  CreateFiscalYearFormData,
  UpdatePeriodStatusFormData,
  FiscalPeriodStatus,
} from '@/types';

export const FiscalPeriodService = {
  findAllYears: async (): Promise<BaseResponse<FiscalYear[]>> => {
    const response = await api.get<BaseResponse<FiscalYear[]>>(
      'api/v1/fiscal-periods/years',
    );
    return response.data;
  },

  findOneYear: async (id: string): Promise<BaseResponse<FiscalYear>> => {
    const response = await api.get<BaseResponse<FiscalYear>>(
      `api/v1/fiscal-periods/years/${id}`,
    );
    return response.data;
  },

  createYear: async (
    data: CreateFiscalYearFormData,
  ): Promise<BaseResponse<FiscalYear>> => {
    const response = await api.post<BaseResponse<FiscalYear>>(
      'api/v1/fiscal-periods/years',
      data,
    );
    return response.data;
  },

  findAllPeriods: async (params?: {
    year?: number;
    status?: FiscalPeriodStatus;
  }): Promise<BaseResponse<FiscalPeriod[]>> => {
    const response = await api.get<BaseResponse<FiscalPeriod[]>>(
      'api/v1/fiscal-periods',
      { params },
    );
    return response.data;
  },

  findOnePeriod: async (id: string): Promise<BaseResponse<FiscalPeriod>> => {
    const response = await api.get<BaseResponse<FiscalPeriod>>(
      `api/v1/fiscal-periods/${id}`,
    );
    return response.data;
  },

  updatePeriodStatus: async (
    id: string,
    data: UpdatePeriodStatusFormData,
  ): Promise<BaseResponse<FiscalPeriod>> => {
    const response = await api.patch<BaseResponse<FiscalPeriod>>(
      `api/v1/fiscal-periods/${id}/status`,
      data,
    );
    return response.data;
  },
};
