import api from '@/lib/axiosClient';
import type {
  BaseResponse,
  Company,
  BusinessUnit,
  CostCenter,
  ProfitCenter,
} from '@/types';

export const OrganizationService = {
  getCompany: async (): Promise<BaseResponse<Company>> => {
    const response = await api.get<BaseResponse<Company>>('api/v1/company');
    return response.data;
  },

  updateCompany: async (
    id: string,
    data: Partial<Company>,
  ): Promise<BaseResponse<Company>> => {
    const response = await api.put<BaseResponse<Company>>(
      `api/v1/company/${id}`,
      data,
    );
    return response.data;
  },

  getBusinessUnits: async (): Promise<BaseResponse<BusinessUnit[]>> => {
    const response = await api.get<BaseResponse<BusinessUnit[]>>(
      'api/v1/business-units',
    );
    return response.data;
  },

  createBusinessUnit: async (
    data: Partial<BusinessUnit>,
  ): Promise<BaseResponse<BusinessUnit>> => {
    const response = await api.post<BaseResponse<BusinessUnit>>(
      'api/v1/business-units',
      data,
    );
    return response.data;
  },

  updateBusinessUnit: async (
    id: string,
    data: Partial<BusinessUnit>,
  ): Promise<BaseResponse<BusinessUnit>> => {
    const response = await api.put<BaseResponse<BusinessUnit>>(
      `api/v1/business-units/${id}`,
      data,
    );
    return response.data;
  },

  removeBusinessUnit: async (id: string): Promise<BaseResponse<void>> => {
    const response = await api.delete<BaseResponse<void>>(
      `api/v1/business-units/${id}`,
    );
    return response.data;
  },

  getCostCenters: async (): Promise<BaseResponse<CostCenter[]>> => {
    const response = await api.get<BaseResponse<CostCenter[]>>(
      'api/v1/cost-centers',
    );
    return response.data;
  },

  createCostCenter: async (
    data: Partial<CostCenter>,
  ): Promise<BaseResponse<CostCenter>> => {
    const response = await api.post<BaseResponse<CostCenter>>(
      'api/v1/cost-centers',
      data,
    );
    return response.data;
  },

  updateCostCenter: async (
    id: string,
    data: Partial<CostCenter>,
  ): Promise<BaseResponse<CostCenter>> => {
    const response = await api.put<BaseResponse<CostCenter>>(
      `api/v1/cost-centers/${id}`,
      data,
    );
    return response.data;
  },

  removeCostCenter: async (id: string): Promise<BaseResponse<void>> => {
    const response = await api.delete<BaseResponse<void>>(
      `api/v1/cost-centers/${id}`,
    );
    return response.data;
  },

  getProfitCenters: async (): Promise<BaseResponse<ProfitCenter[]>> => {
    const response = await api.get<BaseResponse<ProfitCenter[]>>(
      'api/v1/profit-centers',
    );
    return response.data;
  },

  createProfitCenter: async (
    data: Partial<ProfitCenter>,
  ): Promise<BaseResponse<ProfitCenter>> => {
    const response = await api.post<BaseResponse<ProfitCenter>>(
      'api/v1/profit-centers',
      data,
    );
    return response.data;
  },

  updateProfitCenter: async (
    id: string,
    data: Partial<ProfitCenter>,
  ): Promise<BaseResponse<ProfitCenter>> => {
    const response = await api.put<BaseResponse<ProfitCenter>>(
      `api/v1/profit-centers/${id}`,
      data,
    );
    return response.data;
  },

  removeProfitCenter: async (id: string): Promise<BaseResponse<void>> => {
    const response = await api.delete<BaseResponse<void>>(
      `api/v1/profit-centers/${id}`,
    );
    return response.data;
  },
};
