import api from '@/lib/axiosClient';
import type {
  BaseResponse,
  Account,
  AccountTreeNode,
  AccountFormData,
  AccountType,
} from '@/types';

export const AccountService = {
  findAll: async (params?: {
    type?: AccountType;
    isPostable?: boolean;
    search?: string;
    parentId?: string;
    includeInactive?: boolean;
    tree?: boolean;
  }): Promise<BaseResponse<Account[] | AccountTreeNode[]>> => {
    const response = await api.get<BaseResponse<Account[] | AccountTreeNode[]>>(
      'api/v1/accounts',
      { params },
    );
    return response.data;
  },

  findOne: async (id: string): Promise<BaseResponse<Account>> => {
    const response = await api.get<BaseResponse<Account>>(`api/v1/accounts/${id}`);
    return response.data;
  },

  create: async (data: AccountFormData): Promise<BaseResponse<Account>> => {
    const response = await api.post<BaseResponse<Account>>('api/v1/accounts', data);
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<AccountFormData>,
  ): Promise<BaseResponse<Account>> => {
    const response = await api.put<BaseResponse<Account>>(
      `api/v1/accounts/${id}`,
      data,
    );
    return response.data;
  },

  remove: async (id: string): Promise<BaseResponse<{ success: boolean; message: string }>> => {
    const response = await api.delete<BaseResponse<{ success: boolean; message: string }>>(
      `api/v1/accounts/${id}`,
    );
    return response.data;
  },
};
