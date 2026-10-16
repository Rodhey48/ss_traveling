import api from '@/lib/axiosClient';
import type {
  BaseResponse,
  PaginatedData,
  Vehicle,
  VehicleFormData,
  VehicleSeatClass,
  SeatClass,
  SeatClassName,
} from '@/types';

export const VehicleService = {
  // --- MASTER SEAT CLASSES ---
  getSeatClasses: async (): Promise<BaseResponse<SeatClass[]>> => {
    const response = await api.get<BaseResponse<SeatClass[]>>(
      'api/v1/seat-classes',
    );
    return response.data;
  },

  createSeatClass: async (
    data: Partial<SeatClass>,
  ): Promise<BaseResponse<SeatClass>> => {
    const response = await api.post<BaseResponse<SeatClass>>(
      'api/v1/seat-classes',
      data,
    );
    return response.data;
  },

  updateSeatClass: async (
    id: string,
    data: Partial<SeatClass>,
  ): Promise<BaseResponse<SeatClass>> => {
    const response = await api.put<BaseResponse<SeatClass>>(
      `api/v1/seat-classes/${id}`,
      data,
    );
    return response.data;
  },

  removeSeatClassMaster: async (id: string): Promise<BaseResponse<void>> => {
    const response = await api.delete<BaseResponse<void>>(
      `api/v1/seat-classes/${id}`,
    );
    return response.data;
  },

  // --- VEHICLES ---
  findAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    vehicleType?: string;
    ownershipStatus?: string;
    isActive?: boolean;
  }): Promise<BaseResponse<PaginatedData<Vehicle>>> => {
    const response = await api.get<BaseResponse<PaginatedData<Vehicle>>>(
      'api/v1/vehicles',
      { params },
    );
    return response.data;
  },

  findOne: async (id: string): Promise<BaseResponse<Vehicle>> => {
    const response = await api.get<BaseResponse<Vehicle>>(
      `api/v1/vehicles/${id}`,
    );
    return response.data;
  },

  create: async (data: VehicleFormData): Promise<BaseResponse<Vehicle>> => {
    const response = await api.post<BaseResponse<Vehicle>>(
      'api/v1/vehicles',
      data,
    );
    return response.data;
  },

  update: async (
    id: string,
    data: VehicleFormData,
  ): Promise<BaseResponse<Vehicle>> => {
    const response = await api.put<BaseResponse<Vehicle>>(
      `api/v1/vehicles/${id}`,
      data,
    );
    return response.data;
  },

  remove: async (id: string): Promise<BaseResponse<void>> => {
    const response = await api.delete<BaseResponse<void>>(
      `api/v1/vehicles/${id}`,
    );
    return response.data;
  },

  addSeatClass: async (
    vehicleId: string,
    data: {
      seatClassId?: string;
      className: SeatClassName;
      seatCapacity: number;
      seatLayout?: string;
    },
  ): Promise<BaseResponse<VehicleSeatClass>> => {
    const response = await api.post<BaseResponse<VehicleSeatClass>>(
      `api/v1/vehicles/${vehicleId}/seat-classes`,
      data,
    );
    return response.data;
  },

  removeSeatClass: async (
    vehicleId: string,
    seatClassId: string,
  ): Promise<BaseResponse<void>> => {
    const response = await api.delete<BaseResponse<void>>(
      `api/v1/vehicles/${vehicleId}/seat-classes/${seatClassId}`,
    );
    return response.data;
  },

  addImage: async (
    vehicleId: string,
    data: {
      imageUrl: string;
      caption?: string;
      isPrimary?: boolean;
      sequence?: number;
    },
  ): Promise<BaseResponse<any>> => {
    const response = await api.post<BaseResponse<any>>(
      `api/v1/vehicles/${vehicleId}/images`,
      data,
    );
    return response.data;
  },

  removeImage: async (
    vehicleId: string,
    imageId: string,
  ): Promise<BaseResponse<void>> => {
    const response = await api.delete<BaseResponse<void>>(
      `api/v1/vehicles/${vehicleId}/images/${imageId}`,
    );
    return response.data;
  },
};
