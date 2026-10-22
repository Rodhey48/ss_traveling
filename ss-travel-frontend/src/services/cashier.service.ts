import api from '@/lib/axiosClient';
import type {
  CrewCashSettlement,
  SettlementSummary,
  CrewCashDiscrepancy,
  CreateSettlementFormData,
  CreateDiscrepancyFormData,
  ResolveDiscrepancyFormData,
  CashierFilterParams,
  DiscrepancyFilterParams,
} from '@/types';

export const CashierService = {
  /**
   * Mengambil daftar SPJ kepulangan yang siap direkonsiliasi kasnya
   */
  getPendingSpjs: async (
    params?: CashierFilterParams,
  ): Promise<{ items: any[]; total: number }> => {
    const response = await api.get('api/v1/cashier/pending-spjs', { params });
    return response.data.data;
  },

  /**
   * Mengambil riwayat settlement kas kasir
   */
  getSettlements: async (
    params?: CashierFilterParams,
  ): Promise<{ items: CrewCashSettlement[]; total: number }> => {
    const response = await api.get('api/v1/cashier/settlements', { params });
    return response.data.data;
  },

  /**
   * Mengambil kalkulasi Dua Kantong Kas Kru (Anti-Netting) untuk satu SPJ
   */
  getSettlementSummary: async (spjId: string): Promise<SettlementSummary> => {
    const response = await api.get(`api/v1/cashier/spjs/${spjId}/summary`);
    return response.data.data;
  },

  /**
   * Memproses settlement rekonsiliasi kas kasir pool
   */
  processSettlement: async (
    data: CreateSettlementFormData,
  ): Promise<CrewCashSettlement> => {
    const response = await api.post('api/v1/cashier/settlements', data);
    return response.data.data;
  },

  /**
   * Unblock tutup buku bulanan via posting akun penampung 11999
   */
  unblockPeriodClosing: async (
    settlementId: string,
  ): Promise<CrewCashSettlement> => {
    const response = await api.post(
      `api/v1/cashier/settlements/${settlementId}/unblock-period-closing`,
    );
    return response.data.data;
  },

  /**
   * Mengambil daftar temuan selisih kas kasir
   */
  getDiscrepancies: async (
    params?: DiscrepancyFilterParams,
  ): Promise<{ items: CrewCashDiscrepancy[]; total: number }> => {
    const response = await api.get('api/v1/cashier/discrepancies', { params });
    return response.data.data;
  },

  /**
   * Mengambil detail satu temuan selisih kas kasir
   */
  getDiscrepancyById: async (id: string): Promise<CrewCashDiscrepancy> => {
    const response = await api.get(`api/v1/cashier/discrepancies/${id}`);
    return response.data.data;
  },

  /**
   * Mencatat temuan selisih kas (Lapis 2 Jalur Sistemik)
   */
  createDiscrepancy: async (
    data: CreateDiscrepancyFormData,
  ): Promise<CrewCashDiscrepancy> => {
    const response = await api.post('api/v1/cashier/discrepancies', data);
    return response.data.data;
  },

  /**
   * Otorisasi Keputusan Manajer Keuangan atas Selisih Kas
   */
  resolveDiscrepancy: async (
    id: string,
    data: ResolveDiscrepancyFormData,
  ): Promise<CrewCashDiscrepancy> => {
    const response = await api.put(
      `api/v1/cashier/discrepancies/${id}/resolve`,
      data,
    );
    return response.data.data;
  },
};
