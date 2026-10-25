import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bus,
  FileText,
  Wallet,
  FileUp,
  FileDown,
  Clock,
  ArrowRight,
  TrendingUp,
  Building2,
  Calendar,
  Sparkles,
  AlertTriangle,
  RotateCw,
  Plus,
} from 'lucide-react';
import type { DashboardSummary } from '@/types';
import { DashboardService } from '@/services/dashboard.service';
import { toast } from 'sonner';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await DashboardService.getSummary();
      if (res?.data) {
        setSummary(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard summary', err);
      toast.error('Gagal memuat data ringkasan dashboard.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <div className="space-y-6 p-6">
      {/* Top Banner & Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300 backdrop-blur-sm border border-amber-500/30">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                SS Traveling ERP • Bus Akuntansi v1.3
              </span>
              <span className="text-xs text-slate-400">
                {new Date().toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-white md:text-3xl">
              Pusat Kendali Operasional & Finansial
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              Monitoring real-time armada bus Tangerang–Yogyakarta, pergerakan SPJ, meja kasir pool, dan likuiditas kas
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchSummary}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/20 transition-all border border-white/10"
            >
              <RotateCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
            <button
              type="button"
              onClick={() => navigate('/schedules')}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition-all"
            >
              <Plus className="h-4 w-4" />
              Booking Jadwal
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-10 right-40 h-48 w-48 rounded-full bg-amber-500/10 blur-2xl" />
      </div>

      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Armada Bus */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Status Armada Bus
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Bus className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">
                {summary?.fleet.activeOnRoute ?? 0}
              </span>
              <span className="text-sm font-semibold text-slate-400">
                / {summary?.fleet.total ?? 10} Bus
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Aktif di Rute
              </span>
              <span className="text-slate-500">
                {summary?.fleet.standbyPool ?? 0} Standby Garasi
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: Perjalanan SPJ */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Perjalanan SPJ Aktif
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-600">
                {summary?.trips.inProgress ?? 0}
              </span>
              <span className="text-xs text-slate-400">Sedang di Jalan</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-slate-600">
                Menunggu Kasir: <strong>{summary?.trips.pendingCashierSettlement ?? 0}</strong>
              </span>
              <span className="text-emerald-600 font-semibold">
                {summary?.trips.completedThisMonth ?? 0} Selesai
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Likuiditas Kas & Bank */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Total Kas & Bank GL
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-700 truncate">
              Rp {Number(summary?.cashAndBank.totalLiquidity || 0).toLocaleString('id-ID')}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Saldo fisik pool + kas kecil + rekening bank
            </p>
          </div>
        </div>

        {/* KPI 4: Piutang Terbuka (AR) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Piutang Sewa (AR)
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <FileUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-purple-700 truncate">
              Rp {Number(summary?.financeAlerts.openArInvoicesAmount || 0).toLocaleString('id-ID')}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {summary?.financeAlerts.openArCount ?? 0} tagihan piutang penyewa belum lunas
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
          Pintas Operasional Cepat
        </span>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <button
            type="button"
            onClick={() => navigate('/schedules')}
            className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition-all hover:bg-slate-100 hover:border-slate-300"
          >
            <Calendar className="h-4 w-4 text-indigo-600 shrink-0" />
            <div className="truncate">
              <div className="text-xs font-bold text-slate-800">Plotting Bus</div>
              <div className="text-[10px] text-slate-500">Jadwal & Armada</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/spjs')}
            className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition-all hover:bg-slate-100 hover:border-slate-300"
          >
            <FileText className="h-4 w-4 text-amber-600 shrink-0" />
            <div className="truncate">
              <div className="text-xs font-bold text-slate-800">SPJ Lapangan</div>
              <div className="text-[10px] text-slate-500">Surat Perintah Jalan</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/cashier')}
            className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition-all hover:bg-slate-100 hover:border-slate-300"
          >
            <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
            <div className="truncate">
              <div className="text-xs font-bold text-slate-800">Meja Kasir Pool</div>
              <div className="text-[10px] text-slate-500">Settlement Kas Kru</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/petty-cash')}
            className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition-all hover:bg-slate-100 hover:border-slate-300"
          >
            <Wallet className="h-4 w-4 text-rose-600 shrink-0" />
            <div className="truncate">
              <div className="text-xs font-bold text-slate-800">Kas Kecil (BKK)</div>
              <div className="text-[10px] text-slate-500">Beban Harian Garasi</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/reports/trip-profitability')}
            className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition-all hover:bg-slate-100 hover:border-slate-300"
          >
            <TrendingUp className="h-4 w-4 text-blue-600 shrink-0" />
            <div className="truncate">
              <div className="text-xs font-bold text-slate-800">Profit Trip</div>
              <div className="text-[10px] text-slate-500">Margin Kontribusi</div>
            </div>
          </button>
        </div>
      </div>

      {/* Middle Section: 2 Columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column: Posisi Saldo Kas & Bank */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900">
                Posisi Kas Operasional & Rekening Bank
              </h3>
            </div>
            <button
              type="button"
              onClick={() => navigate('/cash-bank')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Kelola Kas <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {summary?.cashAndBank.accounts.map((acc) => (
              <div key={acc.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                      acc.type === 'BANK'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {acc.type === 'BANK' ? 'BANK' : 'KAS'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      {acc.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {acc.code}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-extrabold text-slate-900">
                  Rp {Number(acc.balance).toLocaleString('id-ID')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Alert Keuangan & Pengendalian Internal */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h3 className="font-bold text-slate-900">
                Pengendalian Internal & Alert Jatuh Tempo
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              Audit Otomatis
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {/* Alert 1: AP Invoices */}
            <div
              onClick={() => navigate('/ap-invoices')}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3 hover:bg-slate-100/60 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                  <FileDown className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Tagihan Vendor Terbuka (AP)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {summary?.financeAlerts.openApCount ?? 0} faktur rumah makan & bengkel
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-900">
                  Rp {Number(summary?.financeAlerts.openApInvoicesAmount || 0).toLocaleString('id-ID')}
                </div>
                <span className="text-[10px] text-slate-400">Belum dibayar</span>
              </div>
            </div>

            {/* Alert 2: AR Invoices */}
            <div
              onClick={() => navigate('/ar-invoices')}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3 hover:bg-slate-100/60 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  <FileUp className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Piutang Pelanggan Wisata (AR)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {summary?.financeAlerts.openArCount ?? 0} invoice sewa wisata menunggu pelunasan
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-900">
                  Rp {Number(summary?.financeAlerts.openArInvoicesAmount || 0).toLocaleString('id-ID')}
                </div>
                <span className="text-[10px] text-purple-600 font-semibold">Outstanding</span>
              </div>
            </div>

            {/* Alert 3: Selisih Kasir Akun 11999 */}
            <div
              onClick={() => navigate('/cashier')}
              className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/40 p-3 hover:bg-amber-50 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Selisih Kasir dalam Investigasi FM
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {summary?.financeAlerts.pendingDiscrepancyCount ?? 0} kasus sengketa nota/tiket (Skenario 4)
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-amber-700">
                  Rp {Number(summary?.financeAlerts.unresolvedDiscrepancyAmount || 0).toLocaleString('id-ID')}
                </div>
                <span className="text-[10px] text-amber-600 font-medium">Akun 11999</span>
              </div>
            </div>

            {/* Alert 4: Bon Kas Kecil Menunggu Approval */}
            <div
              onClick={() => navigate('/petty-cash')}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3 hover:bg-slate-100/60 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Kas Kecil Garasi Menunggu Verifikasi
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Nota pengeluaran garasi non-SPJ siap diposting ke GL
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-blue-700">
                  {summary?.financeAlerts.pendingPettyCashCount ?? 0} BKK
                </div>
                <span className="text-[10px] text-slate-400">Status Submitted</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Trips & Operations Monitor */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900">
              Monitoring Operasional SPJ Terbaru
            </h3>
            <p className="text-xs text-slate-500">
              Pergerakan dinas armada bus dan status penyelesaian kasir pool
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/spjs')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            Lihat Semua SPJ <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Nomor SPJ</th>
                <th className="py-2.5 px-3 font-semibold">Layanan</th>
                <th className="py-2.5 px-3 font-semibold">Armada Bus</th>
                <th className="py-2.5 px-3 font-semibold">Pengemudi (Driver)</th>
                <th className="py-2.5 px-3 font-semibold">Rute Perjalanan</th>
                <th className="py-2.5 px-3 font-semibold">Tgl Berangkat</th>
                <th className="py-2.5 px-3 font-semibold text-center">Status Operasional</th>
                <th className="py-2.5 px-3 font-semibold text-center">Status Finansial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary?.recentSpjs && summary.recentSpjs.length > 0 ? (
                summary.recentSpjs.map((spj) => (
                  <tr
                    key={spj.id}
                    onClick={() => navigate('/spjs')}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {spj.spjNo}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          spj.serviceType === 'AKAP'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {spj.serviceType}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">
                      {spj.vehicleCode} ({spj.vehiclePlate})
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      {spj.driverName}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {spj.route}
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {spj.departureDate}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          spj.operationalStatus === 'IN_PROGRESS'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse'
                            : spj.operationalStatus === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {spj.operationalStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          spj.financialStatus === 'SETTLED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : spj.financialStatus === 'UNDER_REVIEW'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : spj.financialStatus === 'DISCREPANCY'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {spj.financialStatus}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400">
                    Belum ada data perjalanan SPJ.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
