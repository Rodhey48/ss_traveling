import api from '@/lib/axiosClient';
import type {
  ApInvoice,
  ApPayment,
  UnbilledSpjItem,
  CreateApInvoiceFormData,
  CreateRestaurantBillFormData,
  CreateApPaymentFormData,
  ApInvoiceFilterParams,
  ApPaymentFilterParams,
  PaginatedData,
} from '@/types';

export const ApService = {
  /**
   * Tarik daftar SPJ AKAP yang belum pernah ditagihkan oleh restoran mitra tertentu (Anti-Double Billing)
   */
  getUnbilledSpjs: async (restaurantId: string): Promise<UnbilledSpjItem[]> => {
    const response = await api.get(`api/v1/ap/unbilled-spjs/${restaurantId}`);
    return response.data.data;
  },

  /**
   * Buat tagihan berkala servis makan restoran mitra (Skenario 1)
   */
  createRestaurantBill: async (data: CreateRestaurantBillFormData): Promise<ApInvoice> => {
    const response = await api.post('api/v1/ap/restaurant-bill', data);
    return response.data.data;
  },

  /**
   * Buat tagihan AP umum (Bengkel, Derek, Komisi Agen, dll)
   */
  createInvoice: async (data: CreateApInvoiceFormData): Promise<ApInvoice> => {
    const response = await api.post('api/v1/ap/invoices', data);
    return response.data.data;
  },

  /**
   * Mengambil daftar tagihan AP dengan filter dan paginasi
   */
  getInvoices: async (params?: ApInvoiceFilterParams): Promise<PaginatedData<ApInvoice>> => {
    const response = await api.get('api/v1/ap/invoices', { params });
    return response.data.data;
  },

  /**
   * Mengambil detail satu tagihan AP
   */
  getInvoiceById: async (id: string): Promise<ApInvoice> => {
    const response = await api.get(`api/v1/ap/invoices/${id}`);
    return response.data.data;
  },

  /**
   * Persetujuan tagihan AP & posting jurnal utang usaha atomik
   */
  approveInvoice: async (id: string): Promise<ApInvoice> => {
    const response = await api.put(`api/v1/ap/invoices/${id}/approve`);
    return response.data.data;
  },

  /**
   * Pembatalan tagihan AP
   */
  cancelInvoice: async (id: string, reason?: string): Promise<ApInvoice> => {
    const response = await api.put(`api/v1/ap/invoices/${id}/cancel`, { reason });
    return response.data.data;
  },

  /**
   * Pembayaran tagihan AP via Bank/Kas dengan alokasi otomatis
   */
  createPayment: async (data: CreateApPaymentFormData): Promise<ApPayment> => {
    const response = await api.post('api/v1/ap/payments', data);
    return response.data.data;
  },

  /**
   * Mengambil riwayat pembayaran tagihan AP
   */
  getPayments: async (params?: ApPaymentFilterParams): Promise<PaginatedData<ApPayment>> => {
    const response = await api.get('api/v1/ap/payments', { params });
    return response.data.data;
  },
};
