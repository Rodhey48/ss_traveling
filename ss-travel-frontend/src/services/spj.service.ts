import api from '@/lib/axiosClient';
import type {
  Spj,
  SpjLeg,
  CreateSpjFormData,
  SpjFilterParams,
  ReplaceCrewFormData,
  EmergencyReplaceBusFormData,
} from '@/types';

export const SpjService = {
  getSpjs: async (params?: SpjFilterParams): Promise<{ data: Spj[]; total: number; page: number; limit: number }> => {
    const response = await api.get('api/v1/spjs', { params });
    return response.data.data;
  },

  getSpj: async (id: string): Promise<Spj> => {
    const response = await api.get(`api/v1/spjs/${id}`);
    return response.data.data;
  },

  createSpj: async (data: CreateSpjFormData): Promise<Spj> => {
    const response = await api.post('api/v1/spjs', data);
    return response.data.data;
  },

  issueSpj: async (id: string): Promise<Spj> => {
    const response = await api.post(`api/v1/spjs/${id}/issue`);
    return response.data.data;
  },

  startSpj: async (id: string): Promise<Spj> => {
    const response = await api.post(`api/v1/spjs/${id}/start`);
    return response.data.data;
  },

  completeSpj: async (id: string): Promise<Spj> => {
    const response = await api.post(`api/v1/spjs/${id}/complete`);
    return response.data.data;
  },

  cancelSpj: async (id: string, reason?: string): Promise<Spj> => {
    const response = await api.post(`api/v1/spjs/${id}/cancel`, { reason });
    return response.data.data;
  },

  updateLeg: async (
    legId: string,
    data: {
      status?: string;
      departureAt?: string;
      arrivalAt?: string;
      passengerCount?: number;
      mealPaxCount?: number;
      mealDiscrepancyNotes?: string;
    },
  ): Promise<SpjLeg> => {
    const response = await api.patch(`api/v1/spjs/legs/${legId}`, data);
    return response.data.data;
  },

  replaceCrew: async (id: string, data: ReplaceCrewFormData): Promise<Spj> => {
    const response = await api.post(`api/v1/spjs/${id}/replace-crew`, data);
    return response.data.data;
  },

  emergencyReplaceBus: async (
    id: string,
    data: EmergencyReplaceBusFormData,
  ): Promise<{ oldSpj: Spj; newSpj: Spj }> => {
    const response = await api.post(`api/v1/spjs/${id}/emergency-replace-bus`, data);
    return response.data.data;
  },
};
