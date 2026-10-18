import api from '@/lib/axiosClient';
import type {
  TripSchedule,
  CreateTripScheduleFormData,
  UpdateTripScheduleFormData,
  ScheduleFilterParams,
  ConflictCheckResult,
  Spj,
} from '@/types';

export const TripScheduleService = {
  getSchedules: async (params?: ScheduleFilterParams): Promise<{ data: TripSchedule[]; total: number; page: number; limit: number }> => {
    const response = await api.get('api/v1/trip-schedules', { params });
    return response.data.data;
  },

  getCalendar: async (startDate?: string, endDate?: string): Promise<TripSchedule[]> => {
    const response = await api.get('api/v1/trip-schedules/calendar', {
      params: { startDate, endDate },
    });
    return response.data.data;
  },

  getSchedule: async (id: string): Promise<TripSchedule> => {
    const response = await api.get(`api/v1/trip-schedules/${id}`);
    return response.data.data;
  },

  checkConflict: async (data: {
    vehicleId?: string;
    crewIds?: string[];
    departureAt: string;
    returnAt: string;
    excludeScheduleId?: string;
  }): Promise<ConflictCheckResult> => {
    const response = await api.post('api/v1/trip-schedules/check-conflict', data);
    return response.data.data;
  },

  createSchedule: async (
    data: CreateTripScheduleFormData,
  ): Promise<{ schedule: TripSchedule; warnings: any[] }> => {
    const response = await api.post('api/v1/trip-schedules', data);
    return response.data.data;
  },

  updateSchedule: async (
    id: string,
    data: UpdateTripScheduleFormData,
  ): Promise<{ schedule: TripSchedule; warnings: any[] }> => {
    const response = await api.put(`api/v1/trip-schedules/${id}`, data);
    return response.data.data;
  },

  confirmSchedule: async (id: string): Promise<TripSchedule> => {
    const response = await api.post(`api/v1/trip-schedules/${id}/confirm`);
    return response.data.data;
  },

  cancelSchedule: async (id: string, reason?: string): Promise<TripSchedule> => {
    const response = await api.post(`api/v1/trip-schedules/${id}/cancel`, { reason });
    return response.data.data;
  },

  generateSpj: async (
    id: string,
    data?: {
      vehicleId?: string;
      driver1Id?: string;
      driver2Id?: string;
      conductorId?: string;
      notes?: string;
    },
  ): Promise<Spj> => {
    const response = await api.post(`api/v1/trip-schedules/${id}/generate-spj`, data);
    return response.data.data;
  },

  deleteSchedule: async (id: string): Promise<void> => {
    await api.delete(`api/v1/trip-schedules/${id}`);
  },
};
