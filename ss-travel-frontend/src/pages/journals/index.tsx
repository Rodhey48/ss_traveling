import { useState, useEffect, useCallback, useMemo } from 'react';
import Heading from '@/components/shared/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  Plus,
  Search,
  RotateCcw,
  Eye,
  FileText,
  Calendar,
  CheckCircle2,
  Loader2,
  FilterX,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { JournalService } from '@/services/journal.service';
import { OrganizationService } from '@/services/organization.service';
import JournalDetailModal from './components/journal-detail-modal';
import CreateJournalModal from './components/create-journal-modal';
import ReverseJournalModal from './components/reverse-journal-modal';
import type {
  JournalEntry,
  JournalStatus,
  JournalSourceType,
  BusinessUnit,
} from '@/types';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/use-permission';

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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>('ALL');
  const [businessUnitFilter, setBusinessUnitFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);

  // Modals State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedJournalForDetail, setSelectedJournalForDetail] = useState<JournalEntry | null>(null);
  const [selectedJournalForReverse, setSelectedJournalForReverse] = useState<JournalEntry | null>(null);

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
        search: search.trim() || undefined,
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
    search,
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
    setSearch('');
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
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'SPJ':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'AR_INVOICE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'AP_INVOICE':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'CASH_TRANSACTION':
      case 'BANK_TRANSACTION':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'SETTLEMENT':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const isCurrentMonthActive = startDate === defaultRange.start && endDate === defaultRange.end;
  const activeBu = businessUnits.find((bu) => bu.id === businessUnitFilter);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Heading
            title="Buku Jurnal Umum (General Journal)"
            description="Pencatatan dan audit transaksi akuntansi atomik terisolasi per unit bisnis (AKAP / Wisata)"
          />
          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Periode Aktif:</span>
            {isCurrentMonthActive ? (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[11px]">
                <Calendar className="h-3 w-3 mr-1" />
                Bulan Berjalan ({defaultRange.label})
              </Badge>
            ) : startDate || endDate ? (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[11px]">
                <Calendar className="h-3 w-3 mr-1" />
                Kustom: {startDate || 'Awal'} s.d. {endDate || 'Sekarang'}
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 text-[11px]">
                Semua Periode Transaksi
              </Badge>
            )}

            {activeBu && (
              <>
                <span className="text-slate-300">|</span>
                <span className="font-semibold text-slate-700">Unit Usaha:</span>
                <Badge
                  variant="outline"
                  className={`text-[11px] font-bold ${
                    activeBu.code === 'AKAP'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : activeBu.code === 'WISATA'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  <Layers className="h-3 w-3 mr-1" />
                  {activeBu.code} ({activeBu.name})
                </Badge>
              </>
            )}

            <span className="text-slate-300">|</span>
            <span className="font-semibold text-slate-700">Urutan:</span>
            <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-[11px]">
              {sortBy === 'journalDate' ? 'Tanggal Transaksi' : 'Waktu Input'}{' '}
              ({sortOrder === 'DESC' ? 'Terbaru → Terlama' : 'Terlama → Terbaru'})
            </Badge>
          </div>
        </div>

        {isCreate && (
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-sm"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Entri Jurnal Memorial
          </Button>
        )}
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Jurnal Terdata
            </CardTitle>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileText className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{total} Jurnal</div>
            <p className="text-xs text-slate-500 mt-1">
              {postedCount} aktif diposting pada filter terpilih
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Akumulasi Nominal Transaksi
            </CardTitle>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-600">
              {formatRupiah(totalDebitSum)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Total Debit = Total Kredit (Seimbang)
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Jurnal Dibalik (Reversed)
            </CardTitle>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <RotateCcw className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">
              {reversedCount} Dibatalkan
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Koreksi transaksi melalui jurnal pembalik sah
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SOP & Guide Banner: Mencegah Salah Penggunaan Jurnal Manual */}
      <div className="bg-gradient-to-r from-amber-50/90 via-amber-50/60 to-white border border-amber-200/90 rounded-xl p-3.5 text-xs text-amber-950 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-amber-900 text-sm">
                SOP Penggunaan Jurnal (Layar CCTV & Audit Keuangan)
              </span>
              <span className="text-[11px] text-amber-700 ml-2 hidden sm:inline">
                Pahami batasan entri memorial agar tidak terjadi duplikasi pembukuan
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowGuide(!showGuide)}
            className="h-7 text-xs text-amber-800 hover:text-amber-950 hover:bg-amber-100/60 px-2"
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
          <div className="pt-2 border-t border-amber-200/60 grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-700 leading-relaxed">
            <div className="space-y-1 bg-white/80 p-2.5 rounded-lg border border-amber-100">
              <div className="font-bold text-emerald-800 flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                1. 95% Jurnal Dibuat Otomatis oleh Sistem
              </div>
              <p className="text-[11px] text-slate-600">
                Seluruh biaya operasional bus (<strong>BBM Solar, Tol Trans Jawa, Uang Jalan Kru, Servis Restoran, Setoran Tiket Loket</strong>, dan <strong>Pelunasan Sewa Wisata</strong>) 
                otomatis tercatat saat Kasir Garasi menyelesaikan SPJ atau saat Admin memproses invoice sewa.
              </p>
            </div>

            <div className="space-y-1 bg-white/80 p-2.5 rounded-lg border border-amber-100">
              <div className="font-bold text-rose-800 flex items-center gap-1.5 text-xs">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                2. Dilarang Input Biaya Bus via Jurnal Manual
              </div>
              <p className="text-[11px] text-slate-600">
                Tombol <span className="font-semibold text-emerald-700">[+ Entri Jurnal Memorial]</span> <strong>HANYA</strong> untuk transaksi non-bus: 
                <strong> Setoran Modal Pemilik, Biaya Administrasi Bank Bulanan (BCA), atau Penyesuaian Saldo Akhir Tahun</strong>. 
                Menginput biaya bus di sini akan menyebabkan <em className="text-rose-700 font-semibold">pencatatan ganda</em>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Filter Bar & Sort Controls */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="pt-4 space-y-3">
          {/* Row 1: Search, Status, Sumber */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari nomor jurnal atau keterangan..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-9 text-xs"
              />
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
                <SelectTrigger className="h-9 text-xs">
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
                <SelectTrigger className="h-9 text-xs">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1 border-t border-slate-100">
            {/* Unit Bisnis Filter */}
            <div>
              <Select
                value={businessUnitFilter}
                onValueChange={(val) => {
                  setBusinessUnitFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-white border-slate-200">
                  <div className="flex items-center gap-1.5 truncate">
                    <Layers className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <SelectValue placeholder="Semua Unit Bisnis" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs font-semibold">
                    Semua Unit Bisnis
                  </SelectItem>
                  {businessUnits.map((bu) => (
                    <SelectItem key={bu.id} value={bu.id} className="text-xs">
                      <span className="font-bold text-blue-700">{bu.code}</span> — {bu.name}
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
                className="h-9 text-xs"
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
                className="h-9 text-xs"
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
                <SelectTrigger className="h-9 text-xs bg-white border-slate-200">
                  <div className="flex items-center gap-1.5 truncate">
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <SelectValue placeholder="Urutan Data" />
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectGroup>
                    <SelectLabel className="text-[11px] font-bold text-slate-700 bg-slate-100 py-1 px-2 my-1">
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
                    <SelectLabel className="text-[11px] font-bold text-slate-700 bg-slate-100 py-1 px-2 my-1">
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
                className="h-9 text-xs px-2.5 text-slate-600 hover:text-blue-700 flex-1"
                title="Kembali ke Bulan Berjalan & Reset Semua Filter"
              >
                <FilterX className="h-3.5 w-3.5 mr-1" />
                Reset (Bulan Ini)
              </Button>
              {(!startDate && !endDate) ? null : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShowAllDates}
                  className="h-9 text-xs px-2.5 text-slate-500 hover:text-slate-800 text-[11px]"
                  title="Lihat semua transaksi tanpa batasan tanggal"
                >
                  Semua
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Journal Data Table */}
      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
        <div className="p-0">
          <Table>
            <TableHeader className="bg-slate-100/80">
              <TableRow>
                <TableHead className="font-bold text-slate-700">Nomor Jurnal</TableHead>

                {/* Clickable Column: Tanggal Transaksi */}
                <TableHead
                  onClick={() => handleToggleColumnSort('journalDate')}
                  className="font-bold text-slate-700 cursor-pointer select-none hover:bg-slate-200/60 transition-colors"
                  title="Klik untuk mengubah urutan tanggal"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Tanggal Jurnal</span>
                    {sortBy === 'journalDate' ? (
                      sortOrder === 'DESC' ? (
                        <ArrowDown className="h-3.5 w-3.5 text-blue-600 font-bold" />
                      ) : (
                        <ArrowUp className="h-3.5 w-3.5 text-blue-600 font-bold" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    )}
                  </div>
                </TableHead>

                {/* Dedicated Column: Unit Bisnis */}
                <TableHead className="font-bold text-slate-700">Unit Bisnis</TableHead>
                <TableHead className="font-bold text-slate-700">Sumber</TableHead>
                <TableHead className="font-bold text-slate-700">Keterangan Transaksi</TableHead>
                <TableHead className="text-right font-bold text-slate-700">Total Transaksi (Rp)</TableHead>
                <TableHead className="text-center font-bold text-slate-700">Status</TableHead>

                {/* Clickable Column: Waktu Dibuat */}
                <TableHead
                  onClick={() => handleToggleColumnSort('createdAt')}
                  className="font-bold text-slate-700 cursor-pointer select-none hover:bg-slate-200/60 transition-colors"
                  title="Klik untuk mengubah urutan waktu input"
                >
                  <div className="flex items-center gap-1.5 justify-center">
                    <span>Waktu Input</span>
                    {sortBy === 'createdAt' ? (
                      sortOrder === 'DESC' ? (
                        <ArrowDown className="h-3.5 w-3.5 text-blue-600 font-bold" />
                      ) : (
                        <ArrowUp className="h-3.5 w-3.5 text-blue-600 font-bold" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-slate-400" />
                    )}
                  </div>
                </TableHead>

                <TableHead className="text-center font-bold text-slate-700 w-24">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-48 text-center text-slate-500">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-2" />
                    <span>Memuat data jurnal umum...</span>
                  </TableCell>
                </TableRow>
              ) : journals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-48 text-center text-slate-500">
                    <FileText className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-700">Tidak ada jurnal akuntansi ditemukan pada filter ini</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {isCurrentMonthActive ? (
                        <>
                          Tidak ada transaksi di bulan berjalan ({defaultRange.label}).{' '}
                          <button
                            onClick={handleShowAllDates}
                            className="text-blue-600 underline font-semibold hover:text-blue-800"
                          >
                            Klik di sini untuk melihat semua periode
                          </button>
                        </>
                      ) : (
                        'Coba ubah filter unit bisnis, kata kunci pencarian, atau rentang tanggal.'
                      )}
                    </p>
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
                    <TableRow key={journal.id} className="hover:bg-slate-50/70">
                      <TableCell>
                        <div className="font-mono font-bold text-sm text-blue-700">
                          {journal.journalNo}
                        </div>
                        {isReversalEntry && (
                          <span className="text-[10px] text-amber-600 font-medium block">
                            ↳ Pembalik {journal.reversalOf?.journalNo}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
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
                                className={`text-[11px] font-bold px-2 py-0.5 shadow-none ${
                                  code === 'AKAP'
                                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                    : code === 'WISATA'
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
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
                            className="text-[11px] font-medium text-slate-500 bg-slate-50 border-slate-200"
                          >
                            Kantor Pusat
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[11px] font-mono border ${getSourceBadgeColor(
                            journal.sourceType,
                          )}`}
                        >
                          {journal.sourceType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-medium text-slate-800 line-clamp-2">
                          {journal.description}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {journal.lines?.length || 0} Baris Jurnal
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-sm text-slate-900">
                        {formatRupiah(journal.totalDebit)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={
                            isReversed
                              ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                              : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          }
                        >
                          {journal.status}
                        </Badge>
                      </TableCell>

                      {/* Created At Timestamp */}
                      <TableCell className="text-center font-mono text-[11px] text-slate-500 whitespace-nowrap">
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
                            className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            title="Lihat Rincian Baris Jurnal"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {journal.status === 'POSTED' && isUpdate && (
                            journal.sourceType === 'MANUAL' ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedJournalForReverse(journal)}
                                className="h-8 w-8 text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                                title="Pembalik Jurnal (Reversal)"
                              >
                                <RotateCcw className="h-4 w-4" />
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
                                        className="h-8 w-8 text-slate-300 opacity-50 cursor-not-allowed hover:bg-transparent"
                                      >
                                        <RotateCcw className="h-4 w-4 text-slate-400" />
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
        </div>

        {/* Pagination Bar with Page Size / Limit Selector */}
        <div className="p-3.5 border-t bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Menampilkan <span className="font-bold text-slate-800">{journals.length}</span> dari{' '}
            <span className="font-bold text-slate-800">{total}</span> total transaksi jurnal
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Limit Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Tampilkan:</span>
              <Select
                value={String(limit)}
                onValueChange={(val) => {
                  setLimit(Number(val));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-16 text-xs bg-white border-slate-200">
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
              <span className="text-slate-500">baris</span>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1 || loading}
                className="h-8 text-xs bg-white"
              >
                Sebelumnya
              </Button>
              <span className="font-medium text-slate-700 px-2">
                Halaman {page} dari {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages || loading}
                className="h-8 text-xs bg-white"
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        </div>
      </Card>

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
