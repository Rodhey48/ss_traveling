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
  SelectGroup,
  SelectItem,
  SelectLabel,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePermission } from '@/hooks/use-permission';
import { JournalService } from '@/services/journal.service';
import { OrganizationService } from '@/services/organization.service';
import type {
  BusinessUnit,
  JournalEntry,
  JournalSourceType,
  JournalStatus,
} from '@/types';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  FilterX,
  Layers,
  Plus,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import CreateJournalModal from './components/create-journal-modal';
import JournalDetailModal from './components/journal-detail-modal';
import ReverseJournalModal from './components/reverse-journal-modal';

// Helper: Hitung rentang tanggal bulan & tahun berjalan
const getCurrentMonthRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const format = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  return {
    start: format(firstDay),
    end: format(lastDay),
    label: now.toLocaleString('id-ID', { month: 'long', year: 'numeric' }),
  };
};

// Helper: Penjelasan rute pembatalan/koreksi untuk jurnal non-manual (operasional)
export const getNonManualReversalInfo = (sourceType: JournalSourceType): string => {
  switch (sourceType) {
    case 'SPJ':
      return 'Jurnal otomatis perjalanan armada bus: Pembatalan atau koreksi nominal wajib diproses melalui menu Penyelesaian SPJ di Meja Kasir Pool agar status operasional bus tetap sinkron.';
    case 'AR_INVOICE':
      return 'Jurnal otomatis piutang/sewa: Pembatalan atau revisi tagihan wajib dilakukan melalui menu Tagihan Piutang Sewa (AR Invoices).';
    case 'AP_INVOICE':
      return 'Jurnal otomatis utang vendor/bengkel: Pembatalan faktur wajib dilakukan melalui menu Tagihan Vendor (AP Invoices).';
    case 'CASH_TRANSACTION':
    case 'BANK_TRANSACTION':
      return 'Jurnal otomatis mutasi kas/bank: Pembatalan wajib diproses melalui menu transaksi Kas/Bank terkait.';
    case 'SETTLEMENT':
      return 'Jurnal penyelesaian kasir pool: Pembatalan wajib dilakukan melalui menu Rekonsiliasi Kasir Pool.';
    case 'PERIOD_CLOSING':
      return 'Jurnal penutupan fiskal: Hanya dapat dibatalkan melalui prosedur Pembukaan Kembali Periode Fiskal (Reopen Period).';
    default:
      return 'Jurnal otomatis sistem: Pembatalan atau revisi harus diproses dari dokumen operasional sumbernya.';
  }
};

export default function JournalsPage() {
  const { isCreate, isUpdate } = usePermission();

  // Range default: Bulan berjalan
  const defaultRange = useMemo(() => getCurrentMonthRange(), []);

  // Data State
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  // Sorting State
  const [sortBy, setSortBy] = useState<'journalDate' | 'createdAt'>('journalDate');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // Filters State (Default: Bulan & Tahun Berjalan)
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>('ALL');
  const [businessUnitFilter, setBusinessUnitFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);

  // Modals State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedJournalForDetail, setSelectedJournalForDetail] = useState<JournalEntry | null>(null);
  const [selectedJournalForReverse, setSelectedJournalForReverse] = useState<JournalEntry | null>(null);

  // Debounced search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load Business Units on mount
  useEffect(() => {
    OrganizationService.getBusinessUnits()
      .then((res) => {
        if (res.data) setBusinessUnits(res.data);
      })
      .catch(() => {});
  }, []);

  // Fetch Journals
  const fetchJournals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await JournalService.getJournals({
        search: debouncedSearch || undefined,
        status: statusFilter !== 'ALL' ? (statusFilter as JournalStatus) : undefined,
        sourceType: sourceTypeFilter !== 'ALL' ? (sourceTypeFilter as JournalSourceType) : undefined,
        businessUnitId: businessUnitFilter !== 'ALL' ? businessUnitFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit,
        sortBy,
        sortOrder,
      });

      if (res.data) {
        setJournals(res.data.journals || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err: any) {
      toast.error('Gagal memuat daftar jurnal', {
        description: err.response?.data?.message || err.message,
      });
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearch,
    statusFilter,
    sourceTypeFilter,
    businessUnitFilter,
    startDate,
    endDate,
    page,
    limit,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    fetchJournals();
  }, [fetchJournals]);

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setStatusFilter('ALL');
    setSourceTypeFilter('ALL');
    setBusinessUnitFilter('ALL');
    const range = getCurrentMonthRange();
    setStartDate(range.start);
    setEndDate(range.end);
    setSortBy('journalDate');
    setSortOrder('DESC');
    setPage(1);
    toast.info('Filter disetel kembali ke bulan berjalan.');
  };

  const handleShowAllDates = () => {
    setStartDate('');
    setEndDate('');
    setPage(1);
    toast.info('Menampilkan seluruh periode transaksi.');
  };

  const handleToggleColumnSort = (field: 'journalDate' | 'createdAt') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'DESC' ? 'ASC' : 'DESC');
    } else {
      setSortBy(field);
      setSortOrder('DESC');
    }
    setPage(1);
  };

  const formatRupiah = (val: string | number) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Summary Metrics
  const { postedCount, reversedCount, totalDebitSum } = useMemo(() => {
    let pCount = 0;
    let rCount = 0;
    let dSum = 0;

    for (const j of journals) {
      if (j.status === 'POSTED') {
        pCount++;
        dSum += Number(j.totalDebit) || 0;
      } else if (j.status === 'REVERSED') {
        rCount++;
      }
    }

    return {
      postedCount: pCount,
      reversedCount: rCount,
      totalDebitSum: dSum,
    };
  }, [journals]);

  const getSourceBadgeColor = (sourceType: JournalSourceType) => {
    switch (sourceType) {
      case 'MANUAL':
        return 'bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-slate-300 border-slate-200 dark:border-white/10';
      case 'SPJ':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800/60';
      case 'AR_INVOICE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/60';
      case 'AP_INVOICE':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
      case 'CASH_TRANSACTION':
      case 'BANK_TRANSACTION':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
      case 'SETTLEMENT':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/60';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300 border-slate-200 dark:border-white/10';
    }
  };

  const isCurrentMonthActive = startDate === defaultRange.start && endDate === defaultRange.end;
  const activeBu = businessUnits.find((bu) => bu.id === businessUnitFilter);

  const hasActiveFilters = useMemo(() => {
    return (
      debouncedSearch !== '' ||
      statusFilter !== 'ALL' ||
      sourceTypeFilter !== 'ALL' ||
      businessUnitFilter !== 'ALL' ||
      startDate !== defaultRange.start ||
      endDate !== defaultRange.end
    );
  }, [debouncedSearch, statusFilter, sourceTypeFilter, businessUnitFilter, startDate, endDate, defaultRange]);

  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Heading
            title="Buku Jurnal Umum (General Journal)"
            description="Pencatatan dan audit transaksi akuntansi atomik terisolasi per unit bisnis (AKAP / Wisata)"
          />
          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Periode Aktif:</span>
            {isCurrentMonthActive ? (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900/40 text-[11px]">
                <Calendar className="h-3 w-3 mr-1" />
                Bulan Berjalan ({defaultRange.label})
              </Badge>
            ) : startDate || endDate ? (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/40 text-[11px]">
                <Calendar className="h-3 w-3 mr-1" />
                Kustom: {startDate || 'Awal'} s.d. {endDate || 'Sekarang'}
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300 border-slate-200 dark:border-white/10 text-[11px]">
                Semua Periode Transaksi
              </Badge>
            )}

            {activeBu && (
              <>
                <span className="text-slate-300 dark:text-zinc-700">|</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Unit Usaha:</span>
                <Badge
                  variant="outline"
                  className={`text-[11px] font-bold ${
                    activeBu.code === 'AKAP'
                      ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800/60'
                      : activeBu.code === 'WISATA'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                  }`}
                >
                  <Layers className="h-3 w-3 mr-1" />
                  {activeBu.code} ({activeBu.name})
                </Badge>
              </>
            )}

            <span className="text-slate-300 dark:text-zinc-700">|</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Urutan:</span>
            <Badge variant="outline" className="bg-slate-50 text-slate-700 dark:bg-white/5 dark:text-slate-300 border-slate-200 dark:border-white/10 text-[11px]">
              {sortBy === 'journalDate' ? 'Tanggal Transaksi' : 'Waktu Input'}{' '}
              ({sortOrder === 'DESC' ? 'Terbaru → Terlama' : 'Terlama → Terbaru'})
            </Badge>
          </div>
        </div>

        {isCreate && (
          <Button
            onClick={() => setIsCreateOpen(true)}
            size="sm"
            className="gap-1.5 font-semibold text-xs h-8.5 shadow-2xs"
          >
            <Plus className="h-4 w-4" />
            Entri Jurnal Memorial
          </Button>
        )}
      </div>

      {/* Summary Metrics */}
      {loading && journals.length === 0 ? (
        <MetricCardGridSkeleton count={3} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-blue-600">
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <CardDescription className="text-xs">
                Total Jurnal Terdata
              </CardDescription>
              <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
                <FileText className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <CardTitle className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {total} Jurnal
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {postedCount} aktif diposting pada filter terpilih
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-emerald-600">
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <CardDescription className="text-xs">
                Akumulasi Nominal Transaksi
              </CardDescription>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <CardTitle className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {formatRupiah(totalDebitSum)}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Total Debit = Total Kredit (Seimbang)
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-rose-600">
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <CardDescription className="text-xs">
                Jurnal Dibalik (Reversed)
              </CardDescription>
              <div className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg">
                <RotateCcw className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <CardTitle className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
                {reversedCount} Dibatalkan
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Koreksi transaksi melalui jurnal pembalik sah
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SOP & Guide Banner: Mencegah Salah Penggunaan Jurnal Manual */}
      <div className="bg-linear-to-r from-amber-50/90 via-amber-50/60 to-white dark:from-amber-950/30 dark:via-amber-950/20 dark:to-zinc-900/40 border border-amber-200/90 dark:border-amber-900/40 rounded-xl p-3.5 text-xs text-amber-950 dark:text-amber-200 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 rounded-lg">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                SOP Penggunaan Jurnal (Layar CCTV &amp; Audit Keuangan)
              </span>
              <span className="text-[11px] text-amber-700 dark:text-amber-300/80 ml-2 hidden sm:inline">
                Pahami batasan entri memorial agar tidak terjadi duplikasi pembukuan
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowGuide(!showGuide)}
            className="h-7 text-xs text-amber-800 dark:text-amber-300 hover:text-amber-950 hover:bg-amber-100/60 dark:hover:bg-amber-900/40 px-2"
          >
            {showGuide ? (
              <>
                Sembunyikan <ChevronUp className="h-3.5 w-3.5 ml-1" />
              </>
            ) : (
              <>
                Buka Panduan <ChevronDown className="h-3.5 w-3.5 ml-1" />
              </>
            )}
          </Button>
        </div>

        {showGuide && (
          <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/40 grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-700 dark:text-slate-300 leading-relaxed">
            <div className="space-y-1 bg-white/80 dark:bg-zinc-900/80 p-2.5 rounded-lg border border-amber-100 dark:border-amber-900/30">
              <div className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                1. 95% Jurnal Dibuat Otomatis oleh Sistem
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Seluruh biaya operasional bus (<strong>BBM Solar, Tol Trans Jawa, Uang Jalan Kru, Servis Restoran, Setoran Tiket Loket</strong>, dan <strong>Pelunasan Sewa Wisata</strong>)
                otomatis tercatat saat Kasir Garasi menyelesaikan SPJ atau saat Admin memproses invoice sewa.
              </p>
            </div>

            <div className="space-y-1 bg-white/80 dark:bg-zinc-900/80 p-2.5 rounded-lg border border-amber-100 dark:border-amber-900/30">
              <div className="font-bold text-rose-800 dark:text-rose-400 flex items-center gap-1.5 text-xs">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                2. Dilarang Input Biaya Bus via Jurnal Manual
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Tombol <span className="font-semibold text-emerald-700 dark:text-emerald-400">[+ Entri Jurnal Memorial]</span> <strong>HANYA</strong> untuk transaksi non-bus:
                <strong> Setoran Modal Pemilik, Biaya Administrasi Bank Bulanan (BCA), atau Penyesuaian Saldo Akhir Tahun</strong>.
                Menginput biaya bus di sini akan menyebabkan <em className="text-rose-700 dark:text-rose-400 font-semibold">pencatatan ganda</em>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Filter Bar & Sort Controls */}
      <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md p-4 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
        {/* Row 1: Search, Status, Sumber */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari nomor jurnal atau keterangan..."
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

          {/* Status Filter */}
          <div>
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8.5 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">Semua Status</SelectItem>
                <SelectItem value="POSTED" className="text-xs">POSTED (Aktif)</SelectItem>
                <SelectItem value="REVERSED" className="text-xs">REVERSED (Dibalik)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Source Type Filter */}
          <div>
            <Select
              value={sourceTypeFilter}
              onValueChange={(val) => {
                setSourceTypeFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8.5 text-xs">
                <SelectValue placeholder="Sumber" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">Semua Sumber</SelectItem>
                <SelectItem value="MANUAL" className="text-xs">MANUAL (Memorial)</SelectItem>
                <SelectItem value="SPJ" className="text-xs">SPJ (Operasional)</SelectItem>
                <SelectItem value="AR_INVOICE" className="text-xs">AR_INVOICE (Piutang)</SelectItem>
                <SelectItem value="AP_INVOICE" className="text-xs">AP_INVOICE (Utang)</SelectItem>
                <SelectItem value="CASH_TRANSACTION" className="text-xs">CASH_TRANSACTION</SelectItem>
                <SelectItem value="BANK_TRANSACTION" className="text-xs">BANK_TRANSACTION</SelectItem>
                <SelectItem value="SETTLEMENT" className="text-xs">SETTLEMENT</SelectItem>
                <SelectItem value="PERIOD_CLOSING" className="text-xs">PERIOD_CLOSING</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2: Unit Bisnis, Tanggal Awal, Tanggal Akhir, Sort Selector, Reset */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100 dark:border-white/5">
          {/* Unit Bisnis Filter */}
          <div>
            <Select
              value={businessUnitFilter}
              onValueChange={(val) => {
                setBusinessUnitFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8.5 text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Semua Unit Bisnis" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs font-semibold">
                  Semua Unit Bisnis
                </SelectItem>
                {businessUnits.map((bu) => (
                  <SelectItem key={bu.id} value={bu.id} className="text-xs">
                    <span className="font-bold text-blue-600 dark:text-blue-400">{bu.code}</span> — {bu.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="h-8.5 text-xs"
              placeholder="Dari Tanggal"
            />
          </div>

          {/* End Date */}
          <div>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="h-8.5 text-xs"
              placeholder="Sampai Tanggal"
            />
          </div>

          {/* Sort Selector Dropdown */}
          <div>
            <Select
              value={`${sortBy}_${sortOrder}`}
              onValueChange={(val) => {
                const [f, o] = val.split('_') as ['journalDate' | 'createdAt', 'ASC' | 'DESC'];
                setSortBy(f);
                setSortOrder(o);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8.5 text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Urutan Data" />
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectGroup>
                  <SelectLabel className="text-[11px] font-bold text-muted-foreground bg-slate-100 dark:bg-white/10 py-1 px-2 my-1">
                    Tanggal Transaksi (journalDate)
                  </SelectLabel>
                  <SelectItem value="journalDate_DESC" className="text-xs">
                    Tanggal Jurnal: Terbaru → Terlama (DESC)
                  </SelectItem>
                  <SelectItem value="journalDate_ASC" className="text-xs">
                    Tanggal Jurnal: Terlama → Terbaru (ASC)
                  </SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel className="text-[11px] font-bold text-muted-foreground bg-slate-100 dark:bg-white/10 py-1 px-2 my-1">
                    Waktu Input Sistem (createdAt)
                  </SelectLabel>
                  <SelectItem value="createdAt_DESC" className="text-xs">
                    Waktu Input: Terbaru → Terlama (DESC)
                  </SelectItem>
                  <SelectItem value="createdAt_ASC" className="text-xs">
                    Waktu Input: Terlama → Terbaru (ASC)
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Reset & Quick Range Action Buttons */}
          <div className="flex gap-1.5 items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="h-8.5 text-xs px-2.5 flex-1 gap-1"
              title="Kembali ke Bulan Berjalan & Reset Semua Filter"
            >
              <FilterX className="h-3.5 w-3.5" />
              Reset (Bulan Ini)
            </Button>
            {(!startDate && !endDate) ? null : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShowAllDates}
                className="h-8.5 text-xs px-2.5 text-muted-foreground hover:text-foreground text-[11px]"
                title="Lihat semua transaksi tanpa batasan tanggal"
              >
                Semua
              </Button>
            )}
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
            <span>Filter kustom aktif</span>
            <span className="font-medium text-foreground">
              Menampilkan <strong>{startItem} - {endItem}</strong> dari {total} entri jurnal
            </span>
          </div>
        )}
      </div>

      {/* Main Journal Data Table */}
      <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-xl overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-slate-50/80 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10">
            <TableRow className="text-xs">
              <TableHead className="font-bold text-foreground">Nomor Jurnal</TableHead>

              {/* Clickable Column: Tanggal Transaksi */}
              <TableHead
                onClick={() => handleToggleColumnSort('journalDate')}
                className="font-bold text-foreground cursor-pointer select-none hover:bg-slate-100/60 dark:hover:bg-white/10 transition-colors"
                title="Klik untuk mengubah urutan tanggal"
              >
                <div className="flex items-center gap-1.5">
                  <span>Tanggal Jurnal</span>
                  {sortBy === 'journalDate' ? (
                    sortOrder === 'DESC' ? (
                      <ArrowDown className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 font-bold" />
                    ) : (
                      <ArrowUp className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 font-bold" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
              </TableHead>

              {/* Dedicated Column: Unit Bisnis */}
              <TableHead className="font-bold text-foreground">Unit Bisnis</TableHead>
              <TableHead className="font-bold text-foreground">Sumber</TableHead>
              <TableHead className="font-bold text-foreground">Keterangan Transaksi</TableHead>
              <TableHead className="text-right font-bold text-foreground">Total Transaksi (Rp)</TableHead>
              <TableHead className="text-center font-bold text-foreground">Status</TableHead>

              {/* Clickable Column: Waktu Dibuat */}
              <TableHead
                onClick={() => handleToggleColumnSort('createdAt')}
                className="font-bold text-foreground cursor-pointer select-none hover:bg-slate-100/60 dark:hover:bg-white/10 transition-colors"
                title="Klik untuk mengubah urutan waktu input"
              >
                <div className="flex items-center gap-1.5 justify-center">
                  <span>Waktu Input</span>
                  {sortBy === 'createdAt' ? (
                    sortOrder === 'DESC' ? (
                      <ArrowDown className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 font-bold" />
                    ) : (
                      <ArrowUp className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 font-bold" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
              </TableHead>

              <TableHead className="text-center font-bold text-foreground w-24">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs divide-y divide-slate-100 dark:divide-white/5">
            {loading ? (
              <TableSkeletonRows
                rows={limit}
                colWidths={[
                  'w-32',
                  'w-24',
                  'w-28',
                  'w-24',
                  'w-48',
                  'w-28 ml-auto',
                  'w-20 mx-auto',
                  'w-24 mx-auto',
                  'w-20 mx-auto',
                ]}
              />
            ) : journals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-48 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                      <FileText className="h-8 w-8 opacity-60" />
                    </div>
                    <p className="font-semibold text-foreground">Tidak ada jurnal akuntansi ditemukan pada filter ini</p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      {isCurrentMonthActive ? (
                        <>
                          Tidak ada transaksi di bulan berjalan ({defaultRange.label}).{' '}
                          <button
                            onClick={handleShowAllDates}
                            className="text-blue-600 dark:text-blue-400 underline font-semibold hover:text-blue-800"
                          >
                            Klik di sini untuk melihat semua periode
                          </button>
                        </>
                      ) : (
                        'Coba ubah filter unit bisnis, kata kunci pencarian, atau rentang tanggal.'
                      )}
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
              journals.map((journal) => {
                const isReversed = journal.status === 'REVERSED';
                const isReversalEntry = Boolean(journal.reversalOfId);

                // Deteksi unit bisnis yang terdapat pada baris jurnal
                const lineBuCodes = Array.from(
                  new Set(
                    journal.lines
                      ?.map((l) => l.businessUnit?.code)
                      .filter(Boolean),
                  ),
                );

                return (
                  <TableRow key={journal.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                    <TableCell>
                      <div className="font-mono font-bold text-foreground">
                        {journal.journalNo}
                      </div>
                      {isReversalEntry && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium block">
                          ↳ Pembalik {journal.reversalOf?.journalNo}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {journal.journalDate}
                      </div>
                    </TableCell>

                    {/* Kolom Informasi Unit Bisnis */}
                    <TableCell className="whitespace-nowrap">
                      {lineBuCodes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {lineBuCodes.map((code) => (
                            <Badge
                              key={code}
                              className={`text-[10px] font-bold px-1.5 py-0.5 shadow-none ${
                                code === 'AKAP'
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60'
                                  : code === 'WISATA'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                              }`}
                            >
                              <Layers className="h-3 w-3 mr-1 inline-block" />
                              {code}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-medium text-muted-foreground bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10"
                        >
                          Kantor Pusat
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono border ${getSourceBadgeColor(
                          journal.sourceType,
                        )}`}
                      >
                        {journal.sourceType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-medium text-foreground line-clamp-2">
                        {journal.description}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {journal.lines?.length || 0} Baris Jurnal
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-foreground">
                      {formatRupiah(journal.totalDebit)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={`text-[10px] font-bold ${
                          isReversed
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-200'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-200'
                        }`}
                      >
                        {journal.status}
                      </Badge>
                    </TableCell>

                    {/* Created At Timestamp */}
                    <TableCell className="text-center font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                      {new Date(journal.createdAt).toLocaleString('id-ID', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedJournalForDetail(journal)}
                          className="h-7.5 w-7.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                          title="Lihat Rincian Baris Jurnal"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>

                        {journal.status === 'POSTED' && isUpdate && (
                          journal.sourceType === 'MANUAL' ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedJournalForReverse(journal)}
                              className="h-7.5 w-7.5 text-rose-600 dark:text-rose-400 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              title="Pembalik Jurnal (Reversal)"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <TooltipProvider delayDuration={150}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span tabIndex={0} className="inline-block cursor-not-allowed">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      disabled
                                      className="h-7.5 w-7.5 text-muted-foreground opacity-40 cursor-not-allowed hover:bg-transparent"
                                    >
                                      <RotateCcw className="h-3.5 w-3.5" />
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="left"
                                  className="max-w-xs text-xs bg-slate-900 text-white p-2.5 shadow-xl border border-slate-700"
                                >
                                  <p className="font-semibold text-amber-300 mb-1 flex items-center gap-1">
                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                                    Reversal Manual Dinonaktifkan
                                  </p>
                                  <p className="text-[11px] leading-relaxed text-slate-200">
                                    {getNonManualReversalInfo(journal.sourceType)}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Bar with Page Size / Limit Selector */}
        <div className="p-3.5 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-zinc-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>
            Menampilkan <span className="font-bold text-foreground">{startItem} - {endItem}</span> dari{' '}
            <span className="font-bold text-foreground">{total}</span> total transaksi jurnal
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Limit Selector */}
            <div className="flex items-center gap-1.5">
              <span>Tampilkan:</span>
              <Select
                value={String(limit)}
                onValueChange={(val) => {
                  setLimit(Number(val));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-7.5 w-16 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10" className="text-xs">10</SelectItem>
                  <SelectItem value="15" className="text-xs">15</SelectItem>
                  <SelectItem value="25" className="text-xs">25</SelectItem>
                  <SelectItem value="50" className="text-xs">50</SelectItem>
                  <SelectItem value="100" className="text-xs">100</SelectItem>
                </SelectContent>
              </Select>
              <span>baris</span>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1 || loading}
                className="h-7.5 w-7.5"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium text-foreground px-2">
                Halaman {page} dari {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages || loading}
                className="h-7.5 w-7.5"
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateJournalModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchJournals}
      />

      <JournalDetailModal
        isOpen={Boolean(selectedJournalForDetail)}
        onClose={() => setSelectedJournalForDetail(null)}
        journal={selectedJournalForDetail}
        onReverseClick={(j) => setSelectedJournalForReverse(j)}
        canReverse={isUpdate}
      />

      <ReverseJournalModal
        isOpen={Boolean(selectedJournalForReverse)}
        onClose={() => setSelectedJournalForReverse(null)}
        onSuccess={fetchJournals}
        journal={selectedJournalForReverse}
      />
    </div>
  );
}
