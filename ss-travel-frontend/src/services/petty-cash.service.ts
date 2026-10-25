import axiosClient from '@/lib/axiosClient';
import type {
  BaseResponse,
  CashTransaction,
  PettyCashSummary,
  Account,
  CreatePettyCashDisbursementFormData,
  CreatePettyCashReplenishmentFormData,
  VerifyPettyCashFormData,
  RejectPettyCashFormData,
  PettyCashFilterParams,
} from '@/types';

export const PettyCashService = {
  /**
   * Mengambil Ringkasan Saldo dan Aktivitas Kas Kecil Pool Garasi
   */
  async getSummary(cashAccountId?: string): Promise<BaseResponse<PettyCashSummary>> {
    const params = cashAccountId ? { cashAccountId } : {};
    const res = await axiosClient.get('api/v1/petty-cash/summary', { params });
    return res.data;
  },

  /**
   * Mengambil Rekomendasi Akun Beban COA untuk Pengeluaran Kas Kecil
   */
  async getExpenseAccounts(): Promise<BaseResponse<Account[]>> {
    const res = await axiosClient.get('api/v1/petty-cash/expense-accounts');
    return res.data;
  },

  /**
   * Mengambil Daftar Transaksi Kas Kecil Pool dengan Filter
   */
  async getTransactions(
    params?: PettyCashFilterParams,
  ): Promise<BaseResponse<CashTransaction[]>> {
    const res = await axiosClient.get('api/v1/petty-cash', { params });
    return res.data;
  },

  /**
   * Detail Transaksi Kas Kecil beserta Baris Jurnal GL Terkait
   */
  async getTransactionDetail(id: string): Promise<BaseResponse<CashTransaction>> {
    const res = await axiosClient.get(`api/v1/petty-cash/${id}`);
    return res.data;
  },

  /**
   * Input Pengeluaran Kas Kecil Pool (BKK)
   */
  async createDisbursement(
    data: CreatePettyCashDisbursementFormData,
  ): Promise<BaseResponse<CashTransaction>> {
    const res = await axiosClient.post('api/v1/petty-cash/disbursement', data);
    return res.data;
  },

  /**
   * Input Pengisian Kembali Dana Kas Kecil / Replenishment (BKM)
   */
  async createReplenishment(
    data: CreatePettyCashReplenishmentFormData,
  ): Promise<BaseResponse<CashTransaction>> {
    const res = await axiosClient.post('api/v1/petty-cash/replenishment', data);
    return res.data;
  },

  /**
   * Verifikasi & Approval Pengeluaran Kas Kecil oleh Akuntan (Otomatis Posting Jurnal GL)
   */
  async verifyTransaction(
    id: string,
    data?: VerifyPettyCashFormData,
  ): Promise<BaseResponse<CashTransaction>> {
    const res = await axiosClient.put(`api/v1/petty-cash/${id}/verify`, data || {});
    return res.data;
  },

  /**
   * Tolak Pengeluaran Kas Kecil
   */
  async rejectTransaction(
    id: string,
    data: RejectPettyCashFormData,
  ): Promise<BaseResponse<CashTransaction>> {
    const res = await axiosClient.put(`api/v1/petty-cash/${id}/reject`, data);
    return res.data;
  },

  /**
   * Hapus Transaksi Kas Kecil (Hanya jika belum diverifikasi)
   */
  async deleteTransaction(id: string): Promise<BaseResponse<{ success: boolean; message: string }>> {
    const res = await axiosClient.delete(`api/v1/petty-cash/${id}`);
    return res.data;
  },
};
