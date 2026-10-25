import { useState, useEffect, useCallback } from 'react';
import {
  Receipt,
  ArrowDownCircle,
  Plus,
  Search,
  Wallet,
  TrendingDown,
  Clock,
  CheckCircle2,
  Eye,
  Trash2,
  Truck,
} from 'lucide-react';
import type {
  CashTransaction,
  PettyCashSummary,
  CashAccount,
  BankAccount,
  Account,
  Vehicle,
  PettyCashCategory,
  CashTransactionStatus,
} from '@/types';
import { PettyCashService } from '@/services/petty-cash.service';
import { CashBankService } from '@/services/cash-bank.service';
import { VehicleService } from '@/services/vehicle.service';
import CreatePettyCashModal from './components/CreatePettyCashModal';
import ReplenishPettyCashModal from './components/ReplenishPettyCashModal';
import PettyCashDetailModal from './components/PettyCashDetailModal';
import { toast } from 'sonner';

export default function PettyCashPage() {
  const [summary, setSummary] = useState<PettyCashSummary | null>(null);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<Account[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [selectedCashAccountId, setSelectedCashAccountId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [startDate] = useState<string>('');
  const [endDate] = useState<string>('');

  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReplenishModalOpen, setIsReplenishModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<CashTransaction | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Load Reference Masters
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [cashRes, bankRes, expRes, vehRes] = await Promise.all([
          CashBankService.findAllCashAccounts({ includeInactive: false }),
          CashBankService.findAllBankAccounts({ includeInactive: false }),
          PettyCashService.getExpenseAccounts(),
          VehicleService.findAll(),
        ]);

        if (cashRes?.data) {
          setCashAccounts(cashRes.data);
          const petty = cashRes.data.find((c) => c.code === 'CASH-PETTY-GARASI');
          if (petty) setSelectedCashAccountId(petty.id);
          else if (cashRes.data.length > 0) setSelectedCashAccountId(cashRes.data[0].id);
        }
        if (bankRes?.data) setBankAccounts(bankRes.data);
        if (expRes?.data) setExpenseAccounts(expRes.data);
        if (vehRes?.data) {
          const vehList = Array.isArray(vehRes.data)
            ? vehRes.data
            : (vehRes.data as any)?.data || [];
          setVehicles(vehList);
        }
      } catch (err) {
        console.error('Failed to load masters for petty cash', err);
      }
    };
    fetchMasters();
  }, []);

  // Fetch Transactions and Summary
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [sumRes, transRes] = await Promise.all([
        PettyCashService.getSummary(selectedCashAccountId || undefined),
        PettyCashService.getTransactions({
          cashAccountId: selectedCashAccountId || undefined,
          status: (statusFilter as CashTransactionStatus) || undefined,
          category: (categoryFilter as PettyCashCategory) || undefined,
          search: search.trim() || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      ]);

      if (sumRes?.data) setSummary(sumRes.data);
      if (transRes?.data) setTransactions(transRes.data);
    } catch {
      toast.error('Gagal memuat data kas kecil pool.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCashAccountId, statusFilter, categoryFilter, search, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Quick Verify from table row
  const handleQuickVerify = async (trans: CashTransaction) => {
    try {
      const res = await PettyCashService.verifyTransaction(trans.id);
      toast.success(res.message || 'Transaksi berhasil diverifikasi & diposting ke GL!');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memverifikasi transaksi.');
    }
  };

  // Handle Delete
  const handleDelete = async (trans: CashTransaction) => {
    if (!window.confirm(`Yakin ingin menghapus pengeluaran kas kecil '${trans.transactionNo}'?`)) {
      return;
    }
    try {
      const res = await PettyCashService.deleteTransaction(trans.id);
      toast.success(res.message || 'Transaksi berhasil dihapus.');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus transaksi.');
    }
  };

  const getCategoryLabel = (cat: PettyCashCategory): { label: string; bg: string; text: string } => {
    switch (cat) {
      case 'STANDBY_CREW':
        return { label: 'Standby Driver', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800' };
      case 'DEADHEAD_INSENTIF':
        return { label: 'Insentif Langsir', bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-800' };
      case 'FACILITY_SNACK':
        return { label: 'Snack & Amenity', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800' };
      case 'POOL_SUPPLIES':
        return { label: 'Cuci Bus & ATK', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800' };
      case 'OVERTIME_MEKANIK':
        return { label: 'Lembur Mekanik', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-800' };
      case 'OFFICE_CONSUMPTION':
        return { label: 'Kopi & Piket', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-800' };
      case 'OFFICE_TRAVEL':
        return { label: 'Transport Dinas', bg: 'bg-cyan-50 border-cyan-200', text: 'text-cyan-800' };
      case 'WORKSHOP_EMERGENCY':
        return { label: 'Sparepart Bengkel', bg: 'bg-orange-50 border-orange-200', text: 'text-orange-800' };
      default:
        return { label: 'Operasional Pool', bg: 'bg-slate-50 border-slate-200', text: 'text-slate-800' };
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Kas Kecil Pool (Petty Cash)
          </h1>
          <p className="text-sm text-slate-500">
            Pengelolaan dana taktis pool garasi, snack kabin, uang makan standby kru, dan insentif langsir armada
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsReplenishModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50/80 px-4 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 shadow-sm transition-all"
          >
            <ArrowDownCircle className="h-4 w-4 text-emerald-600" />
            Isi Kas (Replenishment)
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-amber-600/20 hover:bg-amber-700 transition-all"
          >
            <Plus className="h-4 w-4" />
            Pengeluaran Kas (BKK)
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Sisa Saldo Kas Kecil */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Sisa Saldo Kas Kecil
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              Rp {Number(summary?.currentBalance || 0).toLocaleString('id-ID')}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700">
                {summary?.cashAccount.code || 'CASH-PETTY'}
              </span>
              <span>{summary?.cashAccount.name}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Pengeluaran Bulan Ini */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Pengeluaran Bulan Ini
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-600">
              Rp {Number(summary?.thisMonthExpenses || 0).toLocaleString('id-ID')}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Beban operasional non-SPJ terverifikasi
            </p>
          </div>
        </div>

        {/* Card 3: Menunggu Verifikasi */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Menunggu Verifikasi Akuntan
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-600">
              {summary?.pendingVerificationCount || 0}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Nota/bon kasir siap diverifikasi ke GL
            </p>
          </div>
        </div>

        {/* Card 4: Transaksi Hari Ini */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Aktivitas Hari Ini
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {summary?.todayTransactionsCount || 0}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Transaksi BKK/BKM dicatat hari ini
            </p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5">
          {/* Cash Account Selector */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500">
              Rekening Kas
            </label>
            <select
              value={selectedCashAccountId}
              onChange={(e) => setSelectedCashAccountId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="">-- Semua Kas --</option>
              {cashAccounts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} ({c.name})
                </option>
              ))}
            </select>
          </div>

          {/* Kategori Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500">
              Kategori Pengeluaran
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="">-- Semua Kategori --</option>
              <option value="STANDBY_CREW">Standby Driver (53105)</option>
              <option value="DEADHEAD_INSENTIF">Insentif Langsir (53106)</option>
              <option value="FACILITY_SNACK">Snack Kabin Onboard (52104)</option>
              <option value="POOL_SUPPLIES">Cuci Bus & ATK (57102)</option>
              <option value="OVERTIME_MEKANIK">Lembur Mekanik (57107)</option>
              <option value="OFFICE_CONSUMPTION">Konsumsi & Kopi (57108)</option>
              <option value="OFFICE_TRAVEL">Transport Dinas (57109)</option>
              <option value="WORKSHOP_EMERGENCY">Sparepart Bengkel (55102)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500">
              Status Verifikasi
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="">-- Semua Status --</option>
              <option value="SUBMITTED">SUBMITTED (Menunggu)</option>
              <option value="VERIFIED">VERIFIED (Terposting GL)</option>
              <option value="REJECTED">REJECTED (Ditolak)</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="md:col-span-2">
            <label className="text-[11px] font-semibold text-slate-500">
              Cari No. Bukti / Keterangan / Penerima
            </label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari BKK-KAS, nama supir, toko, nomor nota..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">No. Dokumen</th>
                <th className="py-3 px-4 font-semibold">Tanggal</th>
                <th className="py-3 px-4 font-semibold">Kategori & Uraian</th>
                <th className="py-3 px-4 font-semibold">Penerima / Sumber</th>
                <th className="py-3 px-4 font-semibold">Armada Bus</th>
                <th className="py-3 px-4 font-semibold text-right">Nominal</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Memuat data kas kecil pool...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Belum ada transaksi kas kecil yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => {
                  const catStyle = getCategoryLabel(t.category);
                  const isDisb = t.type === 'DISBURSEMENT';

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* No Dokumen */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                              isDisb
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-emerald-50 text-emerald-600'
                            }`}
                          >
                            <Receipt className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">
                              {t.transactionNo}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {t.receiptNo ? `Nota: ${t.receiptNo}` : isDisb ? 'BKK' : 'BKM'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Tanggal */}
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {new Date(t.transactionDate).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Kategori & Uraian */}
                      <td className="py-3 px-4 max-w-xs">
                        {isDisb ? (
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex items-center w-fit px-2 py-0.5 rounded-full text-[10px] font-bold border ${catStyle.bg} ${catStyle.text}`}
                            >
                              {catStyle.label}
                            </span>
                            <div className="font-medium text-slate-800 line-clamp-1">
                              {t.description}
                            </div>
                            {t.expenseAccount && (
                              <div className="text-[10px] text-slate-400">
                                {t.expenseAccount.code} - {t.expenseAccount.name}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center w-fit px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 border-emerald-200 text-emerald-800">
                              Replenishment Kas
                            </span>
                            <div className="font-medium text-slate-800 line-clamp-1 mt-0.5">
                              {t.description}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Penerima / Sumber */}
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {t.recipient}
                      </td>

                      {/* Armada Bus */}
                      <td className="py-3 px-4">
                        {t.vehicle ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700 border border-indigo-200/50">
                            <Truck className="h-3 w-3" />
                            {t.vehicle.code}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Nominal */}
                      <td className="py-3 px-4 text-right">
                        <div
                          className={`font-black text-sm ${
                            isDisb ? 'text-slate-900' : 'text-emerald-700'
                          }`}
                        >
                          {isDisb ? '-' : '+'} Rp{' '}
                          {Number(t.amount).toLocaleString('id-ID')}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                            t.status === 'VERIFIED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : t.status === 'SUBMITTED'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            title="Detail & Cetak Voucher"
                            onClick={() => {
                              setSelectedTransaction(t);
                              setIsDetailModalOpen(true);
                            }}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {t.status === 'SUBMITTED' && (
                            <button
                              type="button"
                              title="Verifikasi & Posting GL"
                              onClick={() => handleQuickVerify(t)}
                              className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}

                          {t.status !== 'VERIFIED' && (
                            <button
                              type="button"
                              title="Hapus"
                              onClick={() => handleDelete(t)}
                              className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CreatePettyCashModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchData}
        cashAccounts={cashAccounts}
        expenseAccounts={expenseAccounts}
        vehicles={vehicles}
        defaultCashAccountId={selectedCashAccountId}
      />

      <ReplenishPettyCashModal
        isOpen={isReplenishModalOpen}
        onClose={() => setIsReplenishModalOpen(false)}
        onSuccess={fetchData}
        cashAccounts={cashAccounts}
        bankAccounts={bankAccounts}
        defaultCashAccountId={selectedCashAccountId}
      />

      <PettyCashDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onSuccess={fetchData}
        transaction={selectedTransaction}
      />
    </div>
  );
}
