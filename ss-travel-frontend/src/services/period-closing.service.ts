import api from '@/lib/axiosClient';
import type {
  BaseResponse,
  FiscalPeriod,
  PeriodClosingChecklistResponse,
  ClosePeriodFormData,
  ReopenPeriodFormData,
  PeriodClosingFilterParams,
} from '@/types';

export const PeriodClosingService = {
  getPeriods: async (
    params?: PeriodClosingFilterParams,
  ): Promise<BaseResponse<FiscalPeriod[]>> => {
    const response = await api.get<BaseResponse<FiscalPeriod[]>>(
      'api/v1/period-closing/periods',
      { params },
    );
    return response.data;
  },

  getChecklist: async (
    periodId: string,
  ): Promise<BaseResponse<PeriodClosingChecklistResponse>> => {
    const response = await api.get<BaseResponse<PeriodClosingChecklistResponse>>(
      `api/v1/period-closing/${periodId}/checklist`,
    );
    return response.data;
  },

  runChecklist: async (
    periodId: string,
  ): Promise<BaseResponse<PeriodClosingChecklistResponse>> => {
    const response = await api.post<BaseResponse<PeriodClosingChecklistResponse>>(
      `api/v1/period-closing/${periodId}/run-checklist`,
      {},
    );
    return response.data;
  },

  closePeriod: async (
    periodId: string,
    data: ClosePeriodFormData,
  ): Promise<BaseResponse<FiscalPeriod>> => {
    const response = await api.post<BaseResponse<FiscalPeriod>>(
      `api/v1/period-closing/${periodId}/close`,
      data,
    );
    return response.data;
  },

  reopenPeriod: async (
    periodId: string,
    data: ReopenPeriodFormData,
  ): Promise<BaseResponse<FiscalPeriod>> => {
    const response = await api.post<BaseResponse<FiscalPeriod>>(
      `api/v1/period-closing/${periodId}/reopen`,
      data,
    );
    return response.data;
  },
};
