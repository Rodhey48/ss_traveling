import ConfirmDialog from '@/components/shared/confirm-dialog';
import Heading from '@/components/shared/heading';
import {
  MetricCardGridSkeleton,
  TableSkeletonRows,
} from '@/components/shared/skeleton-loaders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CashBankService } from '@/services/cash-bank.service';
import { PettyCashService } from '@/services/petty-cash.service';
import { VehicleService } from '@/services/vehicle.service';
import type {
  Account,
  BankAccount,
  CashAccount,
  CashTransaction,
  CashTransactionStatus,
  PettyCashCategory,
  PettyCashSummary,
  Vehicle,
} from '@/types';
import {
  ArrowDownCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Info,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  Trash2,
  TrendingDown,
  Truck,
  Wallet,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import CreatePettyCashModal from './components/CreatePettyCashModal';
import PettyCashDetailModal from './components/PettyCashDetailModal';
import ReplenishPettyCashModal from './components/ReplenishPettyCashModal';

export default function PettyCashPage() {
  const [summary, setSummary] = useState<PettyCashSummary | null>(null);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<Account[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Filter states
  const [selectedCashAccountId, setSelectedCashAccountId] = useState<string>('');
  const [defaultCashId, setDefaultCashId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [startDate] = useState<string>('');
  const [endDate] = useState<string>('');

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReplenishModalOpen, setIsReplenishModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<CashTransaction | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Confirm dialog state (Zero Native Alert)
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    variant: 'danger' | 'warning' | 'info' | 'primary';
    confirmText?: string;
    onConfirm: () => void | Promise<void>;
  }>({
    open: false,
    title: '',
    description: '',
    variant: 'primary',
    onConfirm: () => { },
  });

  // Debounce search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

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
          if (petty) {
            setSelectedCashAccountId(petty.id);
            setDefaultCashId(petty.id);
          } else if (cashRes.data.length > 0) {
            setSelectedCashAccountId(cashRes.data[0].id);
            setDefaultCashId(cashRes.data[0].id);
          }
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
          status: statusFilter !== 'ALL' ? (statusFilter as CashTransactionStatus) : undefined,
          category: categoryFilter !== 'ALL' ? (categoryFilter as PettyCashCategory) : undefined,
          search: debouncedSearch || undefined,
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
  }, [selectedCashAccountId, statusFilter, categoryFilter, debouncedSearch, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Quick Verify from table row
  const handleQuickVerify = (trans: CashTransaction) => {
    setConfirmDialog({
      open: true,
      title: 'Verifikasi & Posting GL Transaksi Kas Kecil',
      description: `Apakah Anda yakin ingin memverifikasi pengeluaran kas kecil '${trans.transactionNo}' sebesar Rp ${Number(trans.amount).toLocaleString('id-ID')} untuk '${trans.recipient}'? Jurnal GL otomatis diposting.`,
      variant: 'primary',
      confirmText: 'Verifikasi & Posting GL',
      onConfirm: async () => {
        setIsConfirmLoading(true);
        try {
          const res = await PettyCashService.verifyTransaction(trans.id);
          toast.success(res.message || 'Transaksi berhasil diverifikasi & diposting ke GL!');
          setConfirmDialog((prev) => ({ ...prev, open: false }));
          fetchData();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Gagal memverifikasi transaksi.');
        } finally {
          setIsConfirmLoading(false);
        }
      },
    });
  };

  // Handle Delete with ConfirmDialog
  const handleDelete = (trans: CashTransaction) => {
    setConfirmDialog({
      open: true,
      title: 'Hapus Transaksi Kas Kecil',
      description: `Apakah Anda yakin ingin menghapus transaksi kas kecil '${trans.transactionNo}' (${trans.description}) sebesar Rp ${Number(trans.amount).toLocaleString('id-ID')}? Tindakan ini tidak dapat dibatalkan.`,
      variant: 'danger',
      confirmText: 'Hapus Transaksi',
      onConfirm: async () => {
        setIsConfirmLoading(true);
        try {
          const res = await PettyCashService.deleteTransaction(trans.id);
          toast.success(res.message || 'Transaksi berhasil dihapus.');
          setConfirmDialog((prev) => ({ ...prev, open: false }));
          fetchData();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Gagal menghapus transaksi.');
        } finally {
          setIsConfirmLoading(false);
        }
      },
    });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
    if (defaultCashId) {
      setSelectedCashAccountId(defaultCashId);
    }
    setPage(1);
  };

  const hasActiveFilters = useMemo(() => {
    return (
      debouncedSearch !== '' ||
      statusFilter !== 'ALL' ||
      categoryFilter !== 'ALL' ||
      (selectedCashAccountId !== '' && selectedCashAccountId !== defaultCashId)
    );
  }, [debouncedSearch, statusFilter, categoryFilter, selectedCashAccountId, defaultCashId]);

  // Client-side pagination on fetched transactions
  const total = transactions.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (page - 1) * limit;
    return transactions.slice(start, start + limit);
  }, [transactions, page, limit]);

  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  const getCategoryLabel = (cat: PettyCashCategory): { label: string; bg: string; text: string } => {
    switch (cat) {
      case 'STANDBY_CREW':
        return { label: 'Standby Driver (53105)', bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-800 dark:text-amber-300' };
      case 'DEADHEAD_INSENTIF':
        return { label: 'Insentif Langsir (53106)', bg: 'bg-indigo-500/10 border-indigo-500/20', text: 'text-indigo-800 dark:text-indigo-300' };
      case 'FACILITY_SNACK':
        return { label: 'Snack & Amenity (52104)', bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-800 dark:text-emerald-300' };
      case 'POOL_SUPPLIES':
        return { label: 'Cuci Bus & ATK (57102)', bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-800 dark:text-blue-300' };
      case 'OVERTIME_MEKANIK':
        return { label: 'Lembur Mekanik (57107)', bg: 'bg-purple-500/10 border-purple-500/20', text: 'text-purple-800 dark:text-purple-300' };
      case 'OFFICE_CONSUMPTION':
        return { label: 'Kopi & Piket (57108)', bg: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-800 dark:text-rose-300' };
      case 'OFFICE_TRAVEL':
        return { label: 'Transport Dinas (57109)', bg: 'bg-cyan-500/10 border-cyan-200/20', text: 'text-cyan-800 dark:text-cyan-300' };
      case 'WORKSHOP_EMERGENCY':
        return { label: 'Sparepart Bengkel (55102)', bg: 'bg-orange-500/10 border-orange-500/20', text: 'text-orange-800 dark:text-orange-300' };
      default:
        return { label: 'Operasional Pool', bg: 'bg-slate-500/10 border-slate-500/20', text: 'text-slate-800 dark:text-slate-300' };
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Heading
          title="Kas Kecil Pool (Petty Cash)"
          description="Pengelolaan dana taktis pool garasi, snack kabin, uang makan standby kru, insentif langsir, dan perbekalan pool."
        />

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsReplenishModalOpen(true)}
            className="text-xs h-8.5 gap-1.5 border-emerald-300 bg-emerald-50/80 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/50"
          >
            <ArrowDownCircle className="h-4 w-4 text-emerald-600" />
            Isi Kas (Replenishment)
          </Button>
          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold h-8.5 gap-1.5 shadow-2xs"
          >
            <Plus className="h-4 w-4" />
            Pengeluaran Kas (BKK)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="text-xs h-8.5 gap-1.5"
            title="Muat ulang data"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* 4 Metric Cards Header */}
      {isLoading && transactions.length === 0 ? (
        <MetricCardGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Sisa Saldo Kas Kecil */}
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-emerald-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Sisa Saldo Kas Kecil</CardDescription>
              <CardTitle className="text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-between font-mono">
                <span>Rp {Number(summary?.currentBalance || 0).toLocaleString('id-ID')}</span>
                <Wallet className="h-5 w-5 opacity-40 text-emerald-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 truncate">
                <span className="font-semibold text-foreground">
                  {summary?.cashAccount.code || 'CASH-PETTY'}
                </span>
                <span>• {summary?.cashAccount.name}</span>
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Pengeluaran Bulan Ini */}
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-rose-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Pengeluaran Bulan Ini</CardDescription>
              <CardTitle className="text-2xl font-black text-rose-600 dark:text-rose-400 flex items-center justify-between font-mono">
                <span>Rp {Number(summary?.thisMonthExpenses || 0).toLocaleString('id-ID')}</span>
                <TrendingDown className="h-5 w-5 opacity-40 text-rose-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Beban operasional non-SPJ terverifikasi
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Menunggu Verifikasi */}
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-amber-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Menunggu Verifikasi Akuntan</CardDescription>
              <CardTitle className="text-2xl font-bold text-amber-600 dark:text-amber-400 flex items-center justify-between">
                <span>{summary?.pendingVerificationCount || 0} <span className="text-sm font-semibold text-muted-foreground">Nota</span></span>
                <Clock className="h-5 w-5 opacity-40 text-amber-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Nota/bon kasir siap diverifikasi ke GL
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Transaksi Hari Ini */}
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-blue-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Aktivitas Hari Ini</CardDescription>
              <CardTitle className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between">
                <span>{summary?.todayTransactionsCount || 0} <span className="text-sm font-semibold text-muted-foreground">Transaksi</span></span>
                <Receipt className="h-5 w-5 opacity-40 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Transaksi BKK/BKM dicatat hari ini
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Banner SOP Kas Kecil Pool Garasi (Blueprint Addendum v1.14 &amp; v1.15) */}
      <div className="p-4 rounded-xl border border-indigo-200/70 bg-indigo-50/50 dark:border-indigo-900/40 dark:bg-indigo-950/20 text-xs text-indigo-950 dark:text-indigo-200 flex items-start gap-3 shadow-2xs">
        <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <p className="font-bold text-sm">
            Tata Kelola Beban Non-SPJ Garasi Pool
          </p>
          <p className="leading-relaxed">
            Kas kecil pool khusus untuk biaya operasional garasi non-SPJ: <strong>Uang makan standby driver (53105)</strong>, <strong>insentif langsir ke bengkel (53106)</strong>, <strong>snack ameniti kabin (52104)</strong>, dan <strong>cuci bus/ATK (57102)</strong>. Dilarang mencampur biaya Uang Jalan (UJ) perjalanan bus ke kas kecil agar tidak mendistorsi margin ritase trip SPJ.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md p-4 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5">
          {/* Rekening Kas Selector */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground">
              Rekening Kas
            </label>
            <Select
              value={selectedCashAccountId}
              onValueChange={(val) => {
                setSelectedCashAccountId(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full h-8.5 text-xs mt-1">
                <SelectValue placeholder="Pilih Rekening Kas" />
              </SelectTrigger>
              <SelectContent>
                {cashAccounts.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    {c.code} ({c.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Kategori Pengeluaran Filter */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground">
              Kategori Pengeluaran
            </label>
            <Select
              value={categoryFilter}
              onValueChange={(val) => {
                setCategoryFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full h-8.5 text-xs mt-1">
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">Semua Kategori</SelectItem>
                <SelectItem value="STANDBY_CREW" className="text-xs">Standby Driver (53105)</SelectItem>
                <SelectItem value="DEADHEAD_INSENTIF" className="text-xs">Insentif Langsir (53106)</SelectItem>
                <SelectItem value="FACILITY_SNACK" className="text-xs">Snack Kabin Onboard (52104)</SelectItem>
                <SelectItem value="POOL_SUPPLIES" className="text-xs">Cuci Bus &amp; ATK (57102)</SelectItem>
                <SelectItem value="OVERTIME_MEKANIK" className="text-xs">Lembur Mekanik (57107)</SelectItem>
                <SelectItem value="OFFICE_CONSUMPTION" className="text-xs">Konsumsi &amp; Kopi (57108)</SelectItem>
                <SelectItem value="OFFICE_TRAVEL" className="text-xs">Transport Dinas (57109)</SelectItem>
                <SelectItem value="WORKSHOP_EMERGENCY" className="text-xs">Sparepart Bengkel (55102)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Verifikasi Filter */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground">
              Status Verifikasi
            </label>
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full h-8.5 text-xs mt-1">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">Semua Status</SelectItem>
                <SelectItem value="SUBMITTED" className="text-xs">SUBMITTED (Menunggu)</SelectItem>
                <SelectItem value="VERIFIED" className="text-xs">VERIFIED (Terposting GL)</SelectItem>
                <SelectItem value="REJECTED" className="text-xs">REJECTED (Ditolak)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search Input */}
          <div className="md:col-span-2">
            <label className="text-[11px] font-semibold text-muted-foreground">
              Cari Transaksi
            </label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari BKK-KAS, nama supir, toko, nomor nota..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 pr-8 h-8.5 text-xs uppercase"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  title="Hapus pencarian"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Summary Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-slate-200/80 dark:border-white/10 text-xs">
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1.5"
              >
                <RotateCcw className="h-3 w-3" /> Reset Semua Filter
              </Button>
            )}
          </div>
          <span className="text-muted-foreground font-medium self-end sm:self-auto">
            Menampilkan <strong className="text-foreground">{startItem} - {endItem}</strong> dari {total} transaksi
          </span>
        </div>
      </div>

      {/* Main Table */}
      <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10">
            <TableRow className="text-xs">
              <TableHead className="w-40 font-bold">No. Dokumen</TableHead>
              <TableHead className="w-28 font-bold">Tanggal</TableHead>
              <TableHead className="font-bold">Kategori &amp; Uraian</TableHead>
              <TableHead className="w-44 font-bold">Penerima / Sumber</TableHead>
              <TableHead className="w-28 font-bold">Armada Bus</TableHead>
              <TableHead className="w-36 font-bold text-right">Nominal</TableHead>
              <TableHead className="w-28 font-bold text-center">Status</TableHead>
              <TableHead className="w-28 font-bold text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs divide-y divide-slate-100 dark:divide-white/5">
            {isLoading ? (
              <TableSkeletonRows
                rows={limit}
                colWidths={[
                  'w-28',
                  'w-24',
                  'w-40',
                  'w-28',
                  'w-20',
                  'w-24 ml-auto',
                  'w-20 mx-auto',
                  'w-24 mx-auto',
                ]}
              />
            ) : paginatedTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                      <Receipt className="h-8 w-8 opacity-60" />
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">
                      Belum ada transaksi kas kecil yang sesuai
                    </h4>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      {hasActiveFilters
                        ? 'Tidak ada transaksi kas kecil yang cocok dengan kriteria filter Anda.'
                        : 'Belum ada bukti kas keluar (BKK) atau bukti kas masuk (BKM) kas kecil yang tercatat.'}
                    </p>
                    {hasActiveFilters && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetFilters}
                        className="text-xs gap-1.5 h-8 mt-1"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Reset Filter
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedTransactions.map((t) => {
                const catStyle = getCategoryLabel(t.category);
                const isDisb = t.type === 'DISBURSEMENT';

                return (
                  <TableRow
                    key={t.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors"
                  >
                    {/* No Dokumen */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 ${isDisb
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            }`}
                        >
                          <Receipt className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div className="font-mono font-bold text-foreground">
                            {t.transactionNo}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {t.receiptNo ? `Nota: ${t.receiptNo}` : isDisb ? 'BKK' : 'BKM'}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Tanggal */}
                    <TableCell className="text-foreground whitespace-nowrap font-medium">
                      {new Date(t.transactionDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>

                    {/* Kategori & Uraian */}
                    <TableCell className="max-w-xs">
                      {isDisb ? (
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex items-center w-fit px-2 py-0.5 rounded-full text-[10px] font-bold border ${catStyle.bg} ${catStyle.text}`}
                          >
                            {catStyle.label}
                          </span>
                          <div className="font-medium text-foreground line-clamp-1">
                            {t.description}
                          </div>
                          {t.expenseAccount && (
                            <div className="text-[10px] text-muted-foreground font-mono">
                              {t.expenseAccount.code} - {t.expenseAccount.name}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <span className="inline-flex items-center w-fit px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                            Replenishment Kas
                          </span>
                          <div className="font-medium text-foreground line-clamp-1 mt-0.5">
                            {t.description}
                          </div>
                        </div>
                      )}
                    </TableCell>

                    {/* Penerima / Sumber */}
                    <TableCell className="font-medium text-foreground">
                      {t.recipient}
                    </TableCell>

                    {/* Armada Bus */}
                    <TableCell>
                      {t.vehicle ? (
                        <Badge variant="outline" className="gap-1 border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-mono text-[11px]">
                          <Truck className="h-3 w-3" />
                          {t.vehicle.code}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">-</span>
                      )}
                    </TableCell>

                    {/* Nominal */}
                    <TableCell className="text-right">
                      <div
                        className={`font-mono font-bold text-sm ${isDisb ? 'text-foreground' : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                      >
                        {isDisb ? '-' : '+'} Rp {Number(t.amount).toLocaleString('id-ID')}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${t.status === 'VERIFIED'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                            : t.status === 'SUBMITTED'
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
                          }`}
                      >
                        {t.status}
                      </Badge>
                    </TableCell>

                    {/* Aksi */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Detail & Cetak Voucher"
                          onClick={() => {
                            setSelectedTransaction(t);
                            setIsDetailModalOpen(true);
                          }}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {t.status === 'SUBMITTED' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Verifikasi & Posting GL"
                            onClick={() => handleQuickVerify(t)}
                            className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}

                        {t.status !== 'VERIFIED' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Hapus"
                            onClick={() => handleDelete(t)}
                            className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Paginasi Table */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 border-t border-slate-200/80 dark:border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Baris per halaman:</span>
            <Select
              value={String(limit)}
              onValueChange={(val) => {
                setLimit(Number(val));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-18 h-7.5 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10" className="text-xs">10</SelectItem>
                <SelectItem value="20" className="text-xs">20</SelectItem>
                <SelectItem value="50" className="text-xs">50</SelectItem>
                <SelectItem value="100" className="text-xs">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              Halaman {page} dari {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-7.5 w-7.5"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-7.5 w-7.5"
                title="Halaman Berikutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

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

      {/* Reusable Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant={confirmDialog.variant}
        confirmText={confirmDialog.confirmText}
        onConfirm={confirmDialog.onConfirm}
        isLoading={isConfirmLoading}
      />
    </div>
  );
}
