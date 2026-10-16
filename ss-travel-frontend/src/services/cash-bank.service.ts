import api from '@/lib/axiosClient';
import type {
  BaseResponse,
  CashAccount,
  CashAccountFormData,
  BankAccount,
  BankAccountFormData,
} from '@/types';

export const CashBankService = {
  // Cash Accounts
  findAllCashAccounts: async (params?: {
    search?: string;
    costCenterId?: string;
    includeInactive?: boolean;
  }): Promise<BaseResponse<CashAccount[]>> => {
    const response = await api.get<BaseResponse<CashAccount[]>>(
      'api/v1/cash-accounts',
      { params },
    );
    return response.data;
  },

  findOneCashAccount: async (id: string): Promise<BaseResponse<CashAccount>> => {
    const response = await api.get<BaseResponse<CashAccount>>(
      `api/v1/cash-accounts/${id}`,
    );
    return response.data;
  },

  createCashAccount: async (
    data: CashAccountFormData,
  ): Promise<BaseResponse<CashAccount>> => {
    const response = await api.post<BaseResponse<CashAccount>>(
      'api/v1/cash-accounts',
      data,
    );
    return response.data;
  },

  updateCashAccount: async (
    id: string,
    data: Partial<CashAccountFormData>,
  ): Promise<BaseResponse<CashAccount>> => {
    const response = await api.put<BaseResponse<CashAccount>>(
      `api/v1/cash-accounts/${id}`,
      data,
    );
    return response.data;
  },

  removeCashAccount: async (id: string): Promise<BaseResponse<void>> => {
    const response = await api.delete<BaseResponse<void>>(
      `api/v1/cash-accounts/${id}`,
    );
    return response.data;
  },

  // Bank Accounts
  findAllBankAccounts: async (params?: {
    search?: string;
    bankName?: string;
    includeInactive?: boolean;
  }): Promise<BaseResponse<BankAccount[]>> => {
    const response = await api.get<BaseResponse<BankAccount[]>>(
      'api/v1/bank-accounts',
      { params },
    );
    return response.data;
  },

  findOneBankAccount: async (id: string): Promise<BaseResponse<BankAccount>> => {
    const response = await api.get<BaseResponse<BankAccount>>(
      `api/v1/bank-accounts/${id}`,
    );
    return response.data;
  },

  createBankAccount: async (
    data: BankAccountFormData,
  ): Promise<BaseResponse<BankAccount>> => {
    const response = await api.post<BaseResponse<BankAccount>>(
      'api/v1/bank-accounts',
      data,
    );
    return response.data;
  },

  updateBankAccount: async (
    id: string,
    data: Partial<BankAccountFormData>,
  ): Promise<BaseResponse<BankAccount>> => {
    const response = await api.put<BaseResponse<BankAccount>>(
      `api/v1/bank-accounts/${id}`,
      data,
    );
    return response.data;
  },

  removeBankAccount: async (id: string): Promise<BaseResponse<void>> => {
    const response = await api.delete<BaseResponse<void>>(
      `api/v1/bank-accounts/${id}`,
    );
    return response.data;
  },
};
