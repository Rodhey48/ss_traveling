import api from '@/lib/axiosClient';
import type {
  BaseResponse,
  PaginatedData,
  Customer,
  CustomerFormData,
} from '@/types';

export const CustomerService = {
  findAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    customerType?: string;
    leadSource?: string;
    customerTier?: string;
    isActive?: boolean;
  }): Promise<BaseResponse<PaginatedData<Customer>>> => {
    const response = await api.get<BaseResponse<PaginatedData<Customer>>>(
      'api/v1/customers',
      { params },
    );
    return response.data;
  },

  autocomplete: async (search?: string): Promise<BaseResponse<Customer[]>> => {
    const response = await api.get<BaseResponse<Customer[]>>(
      'api/v1/customers/autocomplete',
      { params: { search } },
    );
    return response.data;
  },

  findOne: async (id: string): Promise<BaseResponse<Customer>> => {
    const response = await api.get<BaseResponse<Customer>>(
      `api/v1/customers/${id}`,
    );
    return response.data;
  },

  create: async (data: CustomerFormData): Promise<BaseResponse<Customer>> => {
    const response = await api.post<BaseResponse<Customer>>(
      'api/v1/customers',
      data,
    );
    return response.data;
  },

  update: async (
    id: string,
    data: CustomerFormData,
  ): Promise<BaseResponse<Customer>> => {
    const response = await api.put<BaseResponse<Customer>>(
      `api/v1/customers/${id}`,
      data,
    );
    return response.data;
  },

  remove: async (id: string): Promise<BaseResponse<void>> => {
    const response = await api.delete<BaseResponse<void>>(
      `api/v1/customers/${id}`,
    );
    return response.data;
  },
};
