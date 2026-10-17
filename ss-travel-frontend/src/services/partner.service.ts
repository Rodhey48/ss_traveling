import api from '@/lib/axiosClient';
import type {
  BaseResponse,
  Restaurant,
  RestaurantFormData,
  CalculatedMealResult,
  CoordinatorFeeRule,
  CoordinatorFeeRuleFormData,
  CalculatedCoordinatorFeeResult,
} from '@/types';

export const PartnerService = {
  // Restaurants
  findAllRestaurants: async (): Promise<BaseResponse<Restaurant[]>> => {
    const response = await api.get<BaseResponse<Restaurant[]>>('api/v1/partners/restaurants');
    return response.data;
  },

  findOneRestaurant: async (id: string): Promise<BaseResponse<Restaurant>> => {
    const response = await api.get<BaseResponse<Restaurant>>(`api/v1/partners/restaurants/${id}`);
    return response.data;
  },

  createRestaurant: async (data: RestaurantFormData): Promise<BaseResponse<Restaurant>> => {
    const response = await api.post<BaseResponse<Restaurant>>('api/v1/partners/restaurants', data);
    return response.data;
  },

  updateRestaurant: async (
    id: string,
    data: Partial<RestaurantFormData>,
  ): Promise<BaseResponse<Restaurant>> => {
    const response = await api.put<BaseResponse<Restaurant>>(
      `api/v1/partners/restaurants/${id}`,
      data,
    );
    return response.data;
  },

  deleteRestaurant: async (
    id: string,
  ): Promise<BaseResponse<{ success: boolean; message: string }>> => {
    const response = await api.delete<BaseResponse<{ success: boolean; message: string }>>(
      `api/v1/partners/restaurants/${id}`,
    );
    return response.data;
  },

  calculateMealExpense: async (params: {
    restaurantId: string;
    paxCount: number;
  }): Promise<BaseResponse<CalculatedMealResult>> => {
    const response = await api.get<BaseResponse<CalculatedMealResult>>(
      'api/v1/partners/restaurants/calculate-meal',
      { params },
    );
    return response.data;
  },

  // Coordinator Fees
  findAllCoordinatorFees: async (): Promise<BaseResponse<CoordinatorFeeRule[]>> => {
    const response = await api.get<BaseResponse<CoordinatorFeeRule[]>>(
      'api/v1/partners/coordinator-fees',
    );
    return response.data;
  },

  findOneCoordinatorFee: async (id: string): Promise<BaseResponse<CoordinatorFeeRule>> => {
    const response = await api.get<BaseResponse<CoordinatorFeeRule>>(
      `api/v1/partners/coordinator-fees/${id}`,
    );
    return response.data;
  },

  createCoordinatorFee: async (
    data: CoordinatorFeeRuleFormData,
  ): Promise<BaseResponse<CoordinatorFeeRule>> => {
    const response = await api.post<BaseResponse<CoordinatorFeeRule>>(
      'api/v1/partners/coordinator-fees',
      data,
    );
    return response.data;
  },

  updateCoordinatorFee: async (
    id: string,
    data: Partial<CoordinatorFeeRuleFormData>,
  ): Promise<BaseResponse<CoordinatorFeeRule>> => {
    const response = await api.put<BaseResponse<CoordinatorFeeRule>>(
      `api/v1/partners/coordinator-fees/${id}`,
      data,
    );
    return response.data;
  },

  deleteCoordinatorFee: async (
    id: string,
  ): Promise<BaseResponse<{ success: boolean; message: string }>> => {
    const response = await api.delete<BaseResponse<{ success: boolean; message: string }>>(
      `api/v1/partners/coordinator-fees/${id}`,
    );
    return response.data;
  },

  getFeeForRoute: async (params: {
    legDirection: string;
    paxCount: number;
  }): Promise<BaseResponse<CalculatedCoordinatorFeeResult>> => {
    const response = await api.get<BaseResponse<CalculatedCoordinatorFeeResult>>(
      'api/v1/partners/coordinator-fees/by-route',
      { params },
    );
    return response.data;
  },
};
