import { useAuth } from '@/hooks/use-auth';
import { DashboardService } from '@/services/dashboard.service';
import type { BackendMenu, DashboardSummary } from '@/types';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Bus,
  Calendar,
  Clock,
  Compass,
  FileDown,
  FileText,
  FileUp,
  Plus,
  RotateCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, menus } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Live running clock timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = useMemo(() => {
    return currentTime.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [currentTime]);

  const formattedTime = useMemo(() => {
    return currentTime
      .toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
      .replace(/\./g, ':');
  }, [currentTime]);

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

  // Helper untuk mengecek akses menu sidebar pengguna
  const hasMenuAccess = useCallback(
    (targetUrl: string): boolean => {
      if (!menus || menus.length === 0) return false;
      const check = (list: BackendMenu[]): boolean => {
        for (const item of list) {
          if (item?.url === targetUrl && item?.isRead) return true;
          if (item?.children && item.children.length > 0 && check(item.children)) {
            return true;
          }
        }
        return false;
      };
      return check(menus);
    },
    [menus],
  );

  // Daftar seluruh kemungkinan pintasan operasional
  const allQuickActions = useMemo(
    () => [
      {
        url: '/schedules',
        label: 'Plotting Bus',
        sub: 'Jadwal & Armada',
        icon: Calendar,
        color: 'text-indigo-600',
      },
      {
        url: '/spjs',
        label: 'SPJ Lapangan',
        sub: 'Surat Perintah Jalan',
        icon: FileText,
        color: 'text-amber-600',
      },
      {
        url: '/cashier',
        label: 'Meja Kasir Pool',
        sub: 'Settlement Kas Kru',
        icon: Clock,
        color: 'text-emerald-600',
      },
      {
        url: '/petty-cash',
        label: 'Kas Kecil (BKK)',
        sub: 'Beban Harian Garasi',
        icon: Wallet,
        color: 'text-rose-600',
      },
      {
        url: '/reports/trip-profitability',
        label: 'Profit Trip',
        sub: 'Margin Kontribusi',
        icon: TrendingUp,
        color: 'text-blue-600',
      },
      {
        url: '/vehicles',
        label: 'Armada Bus',
        sub: 'Manajemen Unit',
        icon: Bus,
        color: 'text-teal-600',
      },
      {
        url: '/customers',
        label: 'Pelanggan CRM',
        sub: 'Database Wisata',
        icon: Users,
        color: 'text-purple-600',
      },
    ],
    [],
  );

  // Filter pintasan operasional sesuai menu yang didapat user
  const permittedActions = useMemo(() => {
    return allQuickActions.filter((action) => hasMenuAccess(action.url));
  }, [allQuickActions, hasMenuAccess]);

  const canViewFinance = summary?.canViewFinance ?? false;

  return (
    <div className="space-y-6 p-1">
      {/* Top Banner & Header */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-slate-950 via-[#0c1829] to-[#042e1f] p-6 text-white shadow-2xl border border-emerald-500/20">
        {/* Decorative background glow & orbs */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 right-48 h-56 w-56 rounded-full bg-teal-500/10 blur-2xl" />
        <div className="pointer-events-none absolute left-1/3 -top-12 h-44 w-44 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400 backdrop-blur-md border border-emerald-500/30 shadow-xs">
                <Sparkles className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
                SS Traveling ERP
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300 backdrop-blur-sm border border-white/10">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Monitoring
              </span>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">
              Pusat Kendali Operasional {canViewFinance ? '& Finansial' : 'Armada & Kru'}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Selamat bertugas, <strong className="text-white font-semibold">{user?.name}</strong>. Sistem terintegrasi pemantauan jadwal dinas armada bus dan pengendalian kasir pool.
            </p>
          </div>

          {/* Right Section: Jam Berjalan (Live Clock) & Quick Actions (Rata Kanan) */}
          <div className="flex flex-col items-start lg:items-end justify-center gap-2.5 shrink-0">
            {/* Live Clock Card */}
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 border border-white/15 px-4 py-2 backdrop-blur-md shadow-inner">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Clock className="h-4.5 w-4.5 animate-pulse" />
              </div>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-2 font-mono text-lg font-black tracking-wider text-emerald-300">
                  <span>{formattedTime}</span>
                  <span className="text-[10px] font-extrabold uppercase text-emerald-300 px-1.5 py-0.5 rounded-md bg-emerald-500/25 border border-emerald-400/30">
                    WIB
                  </span>
                </div>
                <span className="text-[11px] text-slate-300 font-medium">
                  {formattedDate}
                </span>
              </div>
            </div>

            {/* Actions Buttons (Rata Kanan) */}
            <div className="flex items-center justify-start lg:justify-end gap-2 w-full">
              <button
                type="button"
                onClick={fetchSummary}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/20 transition-all border border-white/15 shadow-sm active:scale-95"
              >
                <RotateCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Data</span>
              </button>
              {hasMenuAccess('/schedules') && (
                <button
                  type="button"
                  onClick={() => navigate('/schedules')}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  <span>Booking Jadwal</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Main KPI Cards (Role-Based Dynamic) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 (All Roles): Status Armada Bus */}
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

        {/* KPI 2 (All Roles): Pengemudi (Driver) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Pengemudi (Driver)
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-teal-700">
                {summary?.crew.activeDrivers ?? 0}
              </span>
              <span className="text-sm font-semibold text-slate-400">
                / {summary?.crew.totalDrivers ?? 6} Driver
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-teal-700 font-semibold">Berdinas Jalan</span>
              <span className="text-slate-500">
                {summary?.crew.standbyDrivers ?? 0} Standby Pool
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3 (All Roles): Perjalanan SPJ Aktif */}
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

        {/* KPI 4: Role-Based Differentiated */}
        {canViewFinance ? (
          /* Role Keuangan/Direksi: Likuiditas Kas & Bank */
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
                Rp {Number(summary?.cashAndBank?.totalLiquidity || 0).toLocaleString('id-ID')}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Kas pool + kas kecil + rekening bank
              </p>
            </div>
          </div>
        ) : (
          /* Role Operasional/Kru: Pelayanan Kabin (Kondektur & Pramugari) */
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Pelayanan Kabin (Kru)
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-purple-700">
                  {summary?.crew.activeConductors ?? 0}
                </span>
                <span className="text-sm font-semibold text-slate-400">
                  / {summary?.crew.totalConductors ?? 4} Kru
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-purple-700 font-semibold">Aktif di Rute</span>
                <span className="text-slate-500">Kondektur & Pramugari</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Shortcuts Bar (Hanya menampilkan menu yang diizinkan) */}
      {permittedActions.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Pintas Operasional Cepat
          </span>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {permittedActions.map((action) => {
              const IconComp = action.icon;
              return (
                <button
                  key={action.url}
                  type="button"
                  onClick={() => navigate(action.url)}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition-all hover:bg-slate-100 hover:border-slate-300"
                >
                  <IconComp className={`h-4 w-4 ${action.color} shrink-0`} />
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-800">{action.label}</div>
                    <div className="text-[10px] text-slate-500">{action.sub}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Middle Section: Disesuaikan Berdasarkan Izin Akses Finansial */}
      {canViewFinance ? (
        /* TAMPILAN KHUSUS DIREKSI & KEUANGAN */
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
              {hasMenuAccess('/cash-bank') && (
                <button
                  type="button"
                  onClick={() => navigate('/cash-bank')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  Kelola Kas <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {summary?.cashAndBank?.accounts && summary.cashAndBank.accounts.length > 0 ? (
                summary.cashAndBank.accounts.map((acc) => (
                  <div key={acc.id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 min-w-11 px-2 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold tracking-tight ${acc.type === 'BANK'
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
                ))
              ) : (
                <p className="py-4 text-xs text-slate-400 text-center">
                  Belum ada akun kas atau rekening bank terdaftar.
                </p>
              )}
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
                onClick={() => hasMenuAccess('/ap-invoices') && navigate('/ap-invoices')}
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
                      {summary?.financeAlerts?.openApCount ?? 0} faktur rumah makan & bengkel
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-900">
                    Rp {Number(summary?.financeAlerts?.openApInvoicesAmount || 0).toLocaleString('id-ID')}
                  </div>
                  <span className="text-[10px] text-slate-400">Belum dibayar</span>
                </div>
              </div>

              {/* Alert 2: AR Invoices */}
              <div
                onClick={() => hasMenuAccess('/ar-invoices') && navigate('/ar-invoices')}
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
                      {summary?.financeAlerts?.openArCount ?? 0} invoice sewa wisata menunggu pelunasan
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-900">
                    Rp {Number(summary?.financeAlerts?.openArInvoicesAmount || 0).toLocaleString('id-ID')}
                  </div>
                  <span className="text-[10px] text-purple-600 font-semibold">Outstanding</span>
                </div>
              </div>

              {/* Alert 3: Selisih Kasir Akun 11999 */}
              <div
                onClick={() => hasMenuAccess('/cashier') && navigate('/cashier')}
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
                      {summary?.financeAlerts?.pendingDiscrepancyCount ?? 0} kasus sengketa nota/tiket (Skenario 4)
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-amber-700">
                    Rp {Number(summary?.financeAlerts?.unresolvedDiscrepancyAmount || 0).toLocaleString('id-ID')}
                  </div>
                  <span className="text-[10px] text-amber-600 font-medium">Akun 11999</span>
                </div>
              </div>

              {/* Alert 4: Bon Kas Kecil Menunggu Approval */}
              <div
                onClick={() => hasMenuAccess('/petty-cash') && navigate('/petty-cash')}
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
                    {summary?.financeAlerts?.pendingPettyCashCount ?? 0} BKK
                  </div>
                  <span className="text-[10px] text-slate-400">Status Submitted</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* TAMPILAN OPERASIONAL UNTUK KRU & DISPATCHER */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left Column: Kesiapan Armada & Garasi Pool */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Bus className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900">
                  Kesiapan Armada Bus Garasi Pool
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                Unit Operasional
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold">
                    <Compass className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Armada Sedang Dinas di Rute
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Bus beroperasi aktif melayani penumpang rute PP / tour
                    </div>
                  </div>
                </div>
                <div className="text-lg font-black text-emerald-700">
                  {summary?.fleet.activeOnRoute ?? 0} Unit
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-200 text-slate-700 font-bold">
                    <Bus className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Armada Standby di Pool Ciputat
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Unit bersih, siap plotting jadwal dinas berikutnya
                    </div>
                  </div>
                </div>
                <div className="text-lg font-black text-slate-800">
                  {summary?.fleet.standbyPool ?? 0} Unit
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: SOP Keselamatan & Kepatuhan Lapangan */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900">
                  Panduan Keselamatan & Prosedur Kru
                </h3>
              </div>
              <span className="text-xs font-semibold text-amber-600">
                SOP Resmi
              </span>
            </div>

            <div className="mt-4 space-y-2.5 text-xs text-slate-700 leading-relaxed">
              <div className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50/60 p-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">
                  1
                </span>
                <div>
                  <strong>Batas Waktu Mengemudi:</strong> Pengemudi wajib bertukar supir di Rest Area Tol Cipali KM 228 / Kota Transit. Dilarang mengemudi lebih dari 4 jam berturut-turut.
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50/60 p-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">
                  2
                </span>
                <div>
                  <strong>Setoran Bruto Anti-Netting:</strong> Uang penerimaan tiket fisik pool dan titipan setoran kargo diserahkan 100% utuh ke meja kasir pool saat tiba di garasi.
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50/60 p-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">
                  3
                </span>
                <div>
                  <strong>Nota BBM Solar Resmi:</strong> Wajib meminta struk print dispenser SPBU yang mencantumkan volume liter dan mencatat odometer KM bus.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Section: Recent Trips & Operations Monitor (Aman untuk Semua Role) */}
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
          {hasMenuAccess('/spjs') && (
            <button
              type="button"
              onClick={() => navigate('/spjs')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Lihat Semua SPJ <ArrowRight className="h-3 w-3" />
            </button>
          )}
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
                    onClick={() => hasMenuAccess('/spjs') && navigate('/spjs')}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {spj.spjNo}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${spj.serviceType === 'AKAP'
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
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${spj.operationalStatus === 'IN_PROGRESS'
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
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${spj.financialStatus === 'SETTLED'
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
