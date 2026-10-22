import api from '@/lib/axiosClient';
import type {
  ArInvoice,
  ArReceipt,
  CharterContractStatus,
  CreateArInvoiceFormData,
  CreateCharterPelunasanFormData,
  CreateArReceiptFormData,
  CreateDownPaymentFormData,
  ArInvoiceFilterParams,
  ArReceiptFilterParams,
  PaginatedData,
} from '@/types';

export const ArService = {
  /**
   * Penerimaan Uang Muka (DP) Sewa Wisata 30% via Bank/Kas (Skenario 2)
   */
  createDownPayment: async (data: CreateDownPaymentFormData): Promise<ArReceipt> => {
    const response = await api.post('api/v1/ar/down-payment', data);
    return response.data.data;
  },

  /**
   * Penerbitan Invoice Pelunasan Sewa Wisata 70% (Skenario 2)
   */
  createCharterPelunasanInvoice: async (
    data: CreateCharterPelunasanFormData,
  ): Promise<ArInvoice> => {
    const response = await api.post('api/v1/ar/charter-pelunasan', data);
    return response.data.data;
  },

  /**
   * Pembuatan Invoice AR umum
   */
  createInvoice: async (data: CreateArInvoiceFormData): Promise<ArInvoice> => {
    const response = await api.post('api/v1/ar/invoices', data);
    return response.data.data;
  },

  /**
   * Mengambil daftar invoice AR dengan filter dan paginasi
   */
  getInvoices: async (params?: ArInvoiceFilterParams): Promise<PaginatedData<ArInvoice>> => {
    const response = await api.get('api/v1/ar/invoices', { params });
    return response.data.data;
  },

  /**
   * Mengambil detail satu invoice AR
   */
  getInvoiceById: async (id: string): Promise<ArInvoice> => {
    const response = await api.get(`api/v1/ar/invoices/${id}`);
    return response.data.data;
  },

  /**
   * Persetujuan invoice AR
   */
  approveInvoice: async (id: string): Promise<ArInvoice> => {
    const response = await api.put(`api/v1/ar/invoices/${id}/approve`);
    return response.data.data;
  },

  /**
   * Penerimaan pembayaran pelunasan piutang AR (Alokasi ke invoice)
   */
  createReceipt: async (data: CreateArReceiptFormData): Promise<ArReceipt> => {
    const response = await api.post('api/v1/ar/receipts', data);
    return response.data.data;
  },

  /**
   * Mengambil riwayat penerimaan pembayaran piutang / DP
   */
  getReceipts: async (params?: ArReceiptFilterParams): Promise<PaginatedData<ArReceipt>> => {
    const response = await api.get('api/v1/ar/receipts', { params });
    return response.data.data;
  },

  /**
   * Status finansial kontrak sewa wisata (DP, Invoice Pelunasan, Saldo Piutang)
   */
  getCharterStatus: async (tripId: string): Promise<CharterContractStatus> => {
    const response = await api.get(`api/v1/ar/charter-status/${tripId}`);
    return response.data.data;
  },
};
