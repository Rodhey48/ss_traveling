import api from '@/lib/axiosClient';
import type {
  BaseResponse,
  FareSeason,
  FareSeasonFormData,
  FareMatrix,
  FareMatrixFormData,
  FareCalculationQuery,
  CalculatedFareResult,
} from '@/types';

export const FareService = {
  // Seasons
  findAllSeasons: async (): Promise<BaseResponse<FareSeason[]>> => {
    const response = await api.get<BaseResponse<FareSeason[]>>('api/v1/fares/seasons');
    return response.data;
  },

  findOneSeason: async (id: string): Promise<BaseResponse<FareSeason>> => {
    const response = await api.get<BaseResponse<FareSeason>>(`api/v1/fares/seasons/${id}`);
    return response.data;
  },

  createSeason: async (data: FareSeasonFormData): Promise<BaseResponse<FareSeason>> => {
    const response = await api.post<BaseResponse<FareSeason>>('api/v1/fares/seasons', data);
    return response.data;
  },

  updateSeason: async (
    id: string,
    data: Partial<FareSeasonFormData>,
  ): Promise<BaseResponse<FareSeason>> => {
    const response = await api.put<BaseResponse<FareSeason>>(
      `api/v1/fares/seasons/${id}`,
      data,
    );
    return response.data;
  },

  deleteSeason: async (
    id: string,
  ): Promise<BaseResponse<{ success: boolean; message: string }>> => {
    const response = await api.delete<BaseResponse<{ success: boolean; message: string }>>(
      `api/v1/fares/seasons/${id}`,
    );
    return response.data;
  },

  // Matrices
  findAllMatrix: async (seasonId?: string): Promise<BaseResponse<FareMatrix[]>> => {
    const response = await api.get<BaseResponse<FareMatrix[]>>('api/v1/fares/matrix', {
      params: { seasonId },
    });
    return response.data;
  },

  findOneMatrix: async (id: string): Promise<BaseResponse<FareMatrix>> => {
    const response = await api.get<BaseResponse<FareMatrix>>(`api/v1/fares/matrix/${id}`);
    return response.data;
  },

  createMatrix: async (data: FareMatrixFormData): Promise<BaseResponse<FareMatrix>> => {
    const response = await api.post<BaseResponse<FareMatrix>>('api/v1/fares/matrix', data);
    return response.data;
  },

  updateMatrix: async (
    id: string,
    data: Partial<FareMatrixFormData>,
  ): Promise<BaseResponse<FareMatrix>> => {
    const response = await api.put<BaseResponse<FareMatrix>>(
      `api/v1/fares/matrix/${id}`,
      data,
    );
    return response.data;
  },

  deleteMatrix: async (
    id: string,
  ): Promise<BaseResponse<{ success: boolean; message: string }>> => {
    const response = await api.delete<BaseResponse<{ success: boolean; message: string }>>(
      `api/v1/fares/matrix/${id}`,
    );
    return response.data;
  },

  // Dynamic Calculation
  calculateFare: async (
    params: FareCalculationQuery,
  ): Promise<BaseResponse<CalculatedFareResult>> => {
    const response = await api.get<BaseResponse<CalculatedFareResult>>(
      'api/v1/fares/calculate',
      { params },
    );
    return response.data;
  },
};
