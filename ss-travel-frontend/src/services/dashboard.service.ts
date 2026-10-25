import axiosClient from '@/lib/axiosClient';
import type { BaseResponse, DashboardSummary } from '@/types';

export const DashboardService = {
  /**
   * Mengambil Ringkasan KPI Eksekutif, Operasional Armada, Likuiditas Kas/Bank, dan Alert Finansial
   */
  async getSummary(): Promise<BaseResponse<DashboardSummary>> {
    const res = await axiosClient.get('api/v1/dashboard/summary');
    return res.data;
  },
};
