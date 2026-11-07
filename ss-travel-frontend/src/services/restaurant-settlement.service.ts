import api from '@/lib/axiosClient';
import type {
  SpjMealRecord,
  RestaurantSettlementBatch,
  CreateRestaurantSettlementBatchFormData,
  Restaurant,
} from '@/types';

export const RestaurantSettlementService = {
  getPendingRecords: async (query?: {
    restaurantId?: string;
    search?: string;
  }): Promise<SpjMealRecord[]> => {
    const response = await api.get(
      'api/v1/finance/restaurant-settlements/pending',
      { params: query },
    );
    return response.data.data;
  },

  createBatch: async (
    data: CreateRestaurantSettlementBatchFormData,
  ): Promise<RestaurantSettlementBatch> => {
    const response = await api.post(
      'api/v1/finance/restaurant-settlements/batches',
      data,
    );
    return response.data.data;
  },

  getBatches: async (): Promise<RestaurantSettlementBatch[]> => {
    const response = await api.get(
      'api/v1/finance/restaurant-settlements/batches',
    );
    return response.data.data;
  },

  getBatchDetail: async (
    batchId: string,
  ): Promise<RestaurantSettlementBatch> => {
    const response = await api.get(
      `api/v1/finance/restaurant-settlements/batches/${batchId}`,
    );
    return response.data.data;
  },

  getRestaurants: async (): Promise<Restaurant[]> => {
    const response = await api.get(
      'api/v1/finance/restaurant-settlements/restaurants',
    );
    return response.data.data;
  },

  recordSpjMeal: async (
    spjId: string,
    data: {
      restaurantId: string;
      spjLegId?: string;
      actualPax: number;
      ratePerPax?: string;
      discrepancyNotes?: string;
    },
  ): Promise<SpjMealRecord> => {
    const response = await api.post(
      `api/v1/finance/restaurant-settlements/spj/${spjId}/record`,
      data,
    );
    return response.data.data;
  },

  getSpjMealRecords: async (spjId: string): Promise<SpjMealRecord[]> => {
    const response = await api.get(
      `api/v1/finance/restaurant-settlements/spj/${spjId}`,
    );
    return response.data.data;
  },

  deleteMealRecord: async (recordId: string): Promise<void> => {
    await api.delete(`api/v1/finance/restaurant-settlements/${recordId}`);
  },
};
