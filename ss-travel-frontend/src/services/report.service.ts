import api from '@/lib/axiosClient';
import type {
  BaseResponse,
  GeneralLedgerResponse,
  TrialBalanceResponse,
  IncomeStatementResponse,
  BalanceSheetResponse,
  TripProfitabilityResponse,
  TripProfitabilityDetailResponse,
  GeneralLedgerFilterParams,
  TripProfitabilityFilterParams,
  TripProfitabilityViewMode,
} from '@/types';

export const ReportService = {
  getGeneralLedger: async (
    params?: GeneralLedgerFilterParams,
  ): Promise<BaseResponse<GeneralLedgerResponse>> => {
    const response = await api.get<BaseResponse<GeneralLedgerResponse>>(
      'api/v1/reports/general-ledger',
      { params },
    );
    return response.data;
  },

  getTrialBalance: async (params?: {
    startDate?: string;
    endDate?: string;
    periodId?: string;
    businessUnitId?: string;
  }): Promise<BaseResponse<TrialBalanceResponse>> => {
    const response = await api.get<BaseResponse<TrialBalanceResponse>>(
      'api/v1/reports/trial-balance',
      { params },
    );
    return response.data;
  },

  getIncomeStatement: async (params?: {
    startDate?: string;
    endDate?: string;
    periodId?: string;
    businessUnitId?: string;
  }): Promise<BaseResponse<IncomeStatementResponse>> => {
    const response = await api.get<BaseResponse<IncomeStatementResponse>>(
      'api/v1/reports/income-statement',
      { params },
    );
    return response.data;
  },

  getBalanceSheet: async (params?: {
    asOfDate?: string;
    periodId?: string;
    businessUnitId?: string;
  }): Promise<BaseResponse<BalanceSheetResponse>> => {
    const response = await api.get<BaseResponse<BalanceSheetResponse>>(
      'api/v1/reports/balance-sheet',
      { params },
    );
    return response.data;
  },

  getTripProfitability: async (
    params?: TripProfitabilityFilterParams,
  ): Promise<BaseResponse<TripProfitabilityResponse>> => {
    const response = await api.get<BaseResponse<TripProfitabilityResponse>>(
      'api/v1/reports/trip-profitability',
      { params },
    );
    return response.data;
  },

  getTripProfitabilityDetail: async (
    id: string,
    mode?: TripProfitabilityViewMode,
  ): Promise<BaseResponse<TripProfitabilityDetailResponse>> => {
    const response = await api.get<BaseResponse<TripProfitabilityDetailResponse>>(
      `api/v1/reports/trip-profitability/${id}`,
      { params: { mode } },
    );
    return response.data;
  },
};
