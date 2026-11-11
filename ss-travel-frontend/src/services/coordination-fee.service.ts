import api from '@/lib/axiosClient';
import type {
  SpjCoordinationFee,
  CoordinationFeeBatch,
  CoordinatorFeeRule,
  CreateCoordinationFeeBatchFormData,
} from '@/types';

export const CoordinationFeeService = {
  getPendingFees: async (query?: {
    origin?: string;
    destination?: string;
    search?: string;
  }): Promise<SpjCoordinationFee[]> => {
    const response = await api.get('api/v1/finance/coordination-fees/pending', {
      params: query,
    });
    return response.data.data;
  },

  createBatch: async (
    data: CreateCoordinationFeeBatchFormData,
  ): Promise<CoordinationFeeBatch> => {
    const response = await api.post(
      'api/v1/finance/coordination-fees/batches',
      data,
    );
    return response.data.data;
  },

  getBatches: async (): Promise<CoordinationFeeBatch[]> => {
    const response = await api.get('api/v1/finance/coordination-fees/batches');
    return response.data.data;
  },

  getBatchDetail: async (batchId: string): Promise<CoordinationFeeBatch> => {
    const response = await api.get(
      `api/v1/finance/coordination-fees/batches/${batchId}`,
    );
    return response.data.data;
  },

  getRules: async (): Promise<CoordinatorFeeRule[]> => {
    const response = await api.get('api/v1/finance/coordination-fees/rules');
    return response.data.data;
  },

  updateRule: async (
    ruleId: string,
    data: { feePerPax: string; coordinatorUserId?: string },
  ): Promise<CoordinatorFeeRule> => {
    const response = await api.put(
      `api/v1/finance/coordination-fees/rules/${ruleId}`,
      data,
    );
    return response.data.data;
  },

  deleteFee: async (feeId: string): Promise<void> => {
    await api.delete(`api/v1/finance/coordination-fees/${feeId}`);
  },

  syncSpjFee: async (spjId: string): Promise<SpjCoordinationFee[]> => {
    const response = await api.post(
      `api/v1/finance/coordination-fees/spj/${spjId}/sync`,
    );
    return response.data.data;
  },

  getSpjFees: async (spjId: string): Promise<SpjCoordinationFee[]> => {
    const response = await api.get(
      `api/v1/finance/coordination-fees/spj/${spjId}`,
    );
    return response.data.data;
  },
};
