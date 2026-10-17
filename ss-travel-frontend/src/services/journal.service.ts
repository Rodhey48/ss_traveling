import api from '@/lib/axiosClient';
import type {
  BaseResponse,
  JournalEntry,
  CreateManualJournalFormData,
  ReverseJournalFormData,
  JournalFilterParams,
} from '@/types';

export const JournalService = {
  getJournals: async (
    params?: JournalFilterParams,
  ): Promise<
    BaseResponse<{
      journals: JournalEntry[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>
  > => {
    const response = await api.get<
      BaseResponse<{
        journals: JournalEntry[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>
    >('api/v1/journals', { params });
    return response.data;
  },

  getJournalById: async (id: string): Promise<BaseResponse<JournalEntry>> => {
    const response = await api.get<BaseResponse<JournalEntry>>(
      `api/v1/journals/${id}`,
    );
    return response.data;
  },

  createManualJournal: async (
    data: CreateManualJournalFormData,
  ): Promise<BaseResponse<JournalEntry>> => {
    const response = await api.post<BaseResponse<JournalEntry>>(
      'api/v1/journals/manual',
      data,
    );
    return response.data;
  },

  reverseJournal: async (
    id: string,
    data: ReverseJournalFormData,
  ): Promise<BaseResponse<JournalEntry>> => {
    const response = await api.post<BaseResponse<JournalEntry>>(
      `api/v1/journals/${id}/reverse`,
      data,
    );
    return response.data;
  },
};
