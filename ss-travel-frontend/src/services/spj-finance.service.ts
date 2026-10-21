import api from '@/lib/axiosClient';
import type {
  SpjUj,
  SpjExpense,
  SpjRevenueDeclaration,
  CrewMealPayment,
  CreateSpjUjDisbursementFormData,
  CreateSpjUjReturnFormData,
  CreateSpjUjAdditionalRequestFormData,
  ProcessAdditionalRequestFormData,
  UjRolloverFormData,
  CreateSpjExpenseFormData,
  CreateSpjRevenueDeclarationFormData,
  DisburseEarlyMealPaymentFormData,
} from '@/types';

export const SpjFinanceService = {
  // -------------------------------------------------------------
  // 1. UANG JALAN (UJ)
  // -------------------------------------------------------------
  getUj: async (spjId: string): Promise<SpjUj> => {
    const response = await api.get(`api/v1/spjs/${spjId}/uj`);
    return response.data.data;
  },

  disburseUj: async (
    spjId: string,
    data: CreateSpjUjDisbursementFormData,
  ): Promise<SpjUj> => {
    const response = await api.post(`api/v1/spjs/${spjId}/uj/disburse`, data);
    return response.data.data;
  },

  returnUj: async (
    spjId: string,
    data: CreateSpjUjReturnFormData,
  ): Promise<SpjUj> => {
    const response = await api.post(`api/v1/spjs/${spjId}/uj/return`, data);
    return response.data.data;
  },

  requestAdditionalUj: async (
    spjId: string,
    data: CreateSpjUjAdditionalRequestFormData,
  ): Promise<any> => {
    const response = await api.post(
      `api/v1/spjs/${spjId}/uj/additional-request`,
      data,
    );
    return response.data.data;
  },

  processAdditionalRequest: async (
    requestId: string,
    data: ProcessAdditionalRequestFormData,
  ): Promise<any> => {
    const response = await api.put(
      `api/v1/spjs/uj/additional-requests/${requestId}/process`,
      data,
    );
    return response.data.data;
  },

  rolloverUj: async (
    spjId: string,
    data: UjRolloverFormData,
  ): Promise<{ sourceUj: SpjUj; targetUj: SpjUj }> => {
    const response = await api.post(`api/v1/spjs/${spjId}/uj/rollover`, data);
    return response.data.data;
  },

  // -------------------------------------------------------------
  // 2. PENGELUARAN OPERASIONAL SPJ (EXPENSES)
  // -------------------------------------------------------------
  getExpenses: async (spjId: string): Promise<SpjExpense[]> => {
    const response = await api.get(`api/v1/spjs/${spjId}/expenses`);
    return response.data.data;
  },

  createExpense: async (
    spjId: string,
    data: CreateSpjExpenseFormData,
  ): Promise<SpjExpense> => {
    const response = await api.post(`api/v1/spjs/${spjId}/expenses`, data);
    return response.data.data;
  },

  verifyExpense: async (
    expenseId: string,
    status: 'APPROVED' | 'REJECTED',
    notes?: string,
  ): Promise<SpjExpense> => {
    const response = await api.put(`api/v1/spjs/expenses/${expenseId}/verify`, {
      status,
      notes,
    });
    return response.data.data;
  },

  deleteExpense: async (expenseId: string): Promise<void> => {
    await api.delete(`api/v1/spjs/expenses/${expenseId}`);
  },

  // -------------------------------------------------------------
  // 3. DEKLARASI PENERIMAAN OPERASIONAL (REVENUES)
  // -------------------------------------------------------------
  getRevenues: async (spjId: string): Promise<SpjRevenueDeclaration[]> => {
    const response = await api.get(`api/v1/spjs/${spjId}/revenues`);
    return response.data.data;
  },

  createRevenue: async (
    spjId: string,
    data: CreateSpjRevenueDeclarationFormData,
  ): Promise<SpjRevenueDeclaration> => {
    const response = await api.post(`api/v1/spjs/${spjId}/revenues`, data);
    return response.data.data;
  },

  verifyRevenue: async (
    revenueId: string,
    status: 'VERIFIED' | 'DISCREPANCY',
    notes?: string,
  ): Promise<SpjRevenueDeclaration> => {
    const response = await api.put(`api/v1/spjs/revenues/${revenueId}/verify`, {
      status,
      notes,
    });
    return response.data.data;
  },

  deleteRevenue: async (revenueId: string): Promise<void> => {
    await api.delete(`api/v1/spjs/revenues/${revenueId}`);
  },

  // -------------------------------------------------------------
  // 4. HAK KOMPENSASI KRU (CREW MEAL PAYMENTS & EARLY PAYOUT)
  // -------------------------------------------------------------
  getCrewPayments: async (spjId: string): Promise<CrewMealPayment[]> => {
    const response = await api.get(`api/v1/spjs/${spjId}/crew-payments`);
    return response.data.data;
  },

  syncCrewPayments: async (spjId: string): Promise<CrewMealPayment[]> => {
    const response = await api.post(`api/v1/spjs/${spjId}/crew-payments/sync`);
    return response.data.data;
  },

  disburseEarlyPayment: async (
    paymentId: string,
    data: DisburseEarlyMealPaymentFormData,
  ): Promise<CrewMealPayment> => {
    const response = await api.post(
      `api/v1/spjs/crew-payments/${paymentId}/early-disburse`,
      data,
    );
    return response.data.data;
  },
};
