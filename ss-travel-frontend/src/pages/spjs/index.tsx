import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { usePermission } from '@/hooks/use-permission';
import { SpjService } from '@/services/spj.service';
import type {
  Spj,
  SpjFinancialStatus,
  SpjOperationalStatus,
  TripServiceType,
} from '@/types';
import {
  AlertTriangle,
  Bus,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Info,
  Play,
  RotateCcw,
  Search,
  Wallet,
  Wrench,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import EmergencyReplaceBusModal from './components/emergency-replace-bus-modal';
import ReplaceCrewModal from './components/replace-crew-modal';
import SpjDetailModal from './components/spj-detail-modal';
import SpjFinanceModal from './components/spj-finance-modal';

export default function SpjsPage() {
  const navigate = useNavigate();
  const { isUpdate } = usePermission();
  const [spjs, setSpjs] = useState<Spj[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // Filter state
  const [serviceFilter, setServiceFilter] = useState<string>('ALL');
  const [opStatusFilter, setOpStatusFilter] = useState<string>('ALL');
  const [finStatusFilter, setFinStatusFilter] = useState<string>('ALL');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Modals state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [financeModalOpen, setFinanceModalOpen] = useState(false);
  const [replaceCrewModalOpen, setReplaceCrewModalOpen] = useState(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [selectedSpj, setSelectedSpj] = useState<Spj | null>(null);

  // Custom Confirm Dialog State
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
    onConfirm: () => {},
  });

  // Debounced search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadSpjs = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit,
      };

      if (serviceFilter !== 'ALL') params.serviceType = serviceFilter as TripServiceType;
      if (opStatusFilter !== 'ALL') params.operationalStatus = opStatusFilter as SpjOperationalStatus;
      if (finStatusFilter !== 'ALL') params.financialStatus = finStatusFilter as SpjFinancialStatus;
      if (startDateFilter) params.startDate = startDateFilter;
      if (endDateFilter) params.endDate = endDateFilter;
      if (debouncedSearch) params.search = debouncedSearch;

      const res = await SpjService.getSpjs(params);
      setSpjs(res.data || []);
      setTotal(res.total || 0);
    } catch {
      toast.error('Gagal memuat data Surat Perintah Jalan (SPJ).');
    } finally {
      setLoading(false);
    }
  }, [serviceFilter, opStatusFilter, finStatusFilter, startDateFilter, endDateFilter, page, limit, debouncedSearch]);

  useEffect(() => {
    loadSpjs();
  }, [loadSpjs]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(searchInput.trim());
    setPage(1);
  };

  const isFilterActive =
    serviceFilter !== 'ALL' ||
    opStatusFilter !== 'ALL' ||
    finStatusFilter !== 'ALL' ||
    startDateFilter !== '' ||
    endDateFilter !== '' ||
    searchInput.trim() !== '';

  const handleResetFilters = () => {
    setServiceFilter('ALL');
    setOpStatusFilter('ALL');
    setFinStatusFilter('ALL');
    setStartDateFilter('');
    setEndDateFilter('');
    setSearchInput('');
    setDebouncedSearch('');
    setPage(1);
  };

  // Pagination metrics
  const totalPages = Math.ceil(total / limit) || 1;
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  // Dynamic KPI Calculations from loaded set
  const activeCount = useMemo(
    () => spjs.filter((s) => s.operationalStatus === 'IN_PROGRESS').length,
    [spjs],
  );
  const issuedCount = useMemo(
    () => spjs.filter((s) => s.operationalStatus === 'ISSUED').length,
    [spjs],
  );
  const reviewCount = useMemo(
    () => spjs.filter((s) => s.financialStatus === 'UNDER_REVIEW').length,
    [spjs],
  );
  const settledCount = useMemo(
    () => spjs.filter((s) => s.financialStatus === 'SETTLED').length,
    [spjs],
  );

  const handleStart = (spj: Spj) => {
    setConfirmDialog({
      open: true,
      title: 'Berangkatkan Armada Bus',
      description: `Apakah Anda yakin ingin memberangkatkan armada bus '${spj.vehicle?.code}' (${spj.vehicle?.plateNumber})? Dokumen SPJ '${spj.spjNo}' akan aktif di rute perjalanan dan kru resmi bertugas.`,
      variant: 'primary',
      confirmText: 'Berangkatkan Bus',
      onConfirm: async () => {
        setIsConfirmLoading(true);
        try {
          await SpjService.startSpj(spj.id);
          toast.success(`Armada '${spj.vehicle?.code}' resmi aktif di perjalanan.`);
          setConfirmDialog((prev) => ({ ...prev, open: false }));
          loadSpjs();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Gagal memberangkatkan bus.');
        } finally {
          setIsConfirmLoading(false);
        }
      },
    });
  };

  const handleComplete = (spj: Spj) => {
    setConfirmDialog({
      open: true,
      title: 'Konfirmasi Kepulangan di Pool Garasi',
      description: `Konfirmasi kedatangan armada '${spj.vehicle?.code}' di pool garasi? Status operasional SPJ akan selesai (COMPLETED), dan status finansial otomatis beralih ke UNDER_REVIEW untuk rekonsiliasi kasir pool.`,
      variant: 'info',
      confirmText: 'Konfirmasi Tiba Pool',
      onConfirm: async () => {
        setIsConfirmLoading(true);
        try {
          await SpjService.completeSpj(spj.id);
          toast.success(`Operasional SPJ '${spj.spjNo}' tuntas.`);
          setConfirmDialog((prev) => ({ ...prev, open: false }));
          loadSpjs();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Gagal menyelesaikan SPJ.');
        } finally {
          setIsConfirmLoading(false);
        }
      },
    });
  };

  // Badge Status Operasional (Warna Lembut & Kontras Nyaman)
  const getOperationalStatusBadge = (status: string) => {
    switch (status) {
      case 'ISSUED':
        return (
          <Badge className="bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-50 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800 font-semibold text-[10px]">
            ISSUED (Siap Jalan)
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-semibold text-[10px] shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping mr-1" /> IN_PROGRESS
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge variant="secondary" className="font-semibold text-[10px] border border-border">
            COMPLETED (Tiba Pool)
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="destructive" className="font-semibold text-[10px]">
            CANCELLED
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="font-medium text-[10px]">
            {status || 'DRAFT'}
          </Badge>
        );
    }
  };

  // Badge Status Finansial (Sesuai Blueprint Dual-Status)
  const getFinancialStatusBadge = (status: string) => {
    switch (status) {
      case 'SETTLED':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 font-semibold text-[10px]">
            SETTLED (Lunas)
          </Badge>
        );
      case 'UNDER_REVIEW':
        return (
          <Badge className="bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-50 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800 font-semibold text-[10px]">
            UNDER_REVIEW (Kasir)
          </Badge>
        );
      case 'DISCREPANCY':
        return (
          <Badge variant="destructive" className="font-semibold text-[10px]">
            DISCREPANCY (Selisih)
          </Badge>
        );
      case 'PENDING_SETTLEMENT':
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 font-semibold text-[10px]">
            PENDING SETTLEMENT
          </Badge>
        );
    }
  };

  // Badge Layanan Bus
  const getServiceBadge = (type: string) => {
    switch (type) {
      case 'AKAP':
        return (
          <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 font-semibold text-[10px]">
            AKAP Reguler
          </Badge>
        );
      case 'WISATA':
        return (
          <Badge className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 font-semibold text-[10px]">
            Sewa Wisata
          </Badge>
        );
      default:
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 font-semibold text-[10px]">
            Shuttle
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Heading
          title="Operasional Surat Perintah Jalan (SPJ)"
          description="Monitoring perjalanan armada bus, penugasan kru dinas, manifes leg, serta manajemen darurat di jalan."
        />
      </div>

      {/* Kartu Metrik Ringkasan Operasional (Clean Glassmorphism) */}
      {loading && spjs.length === 0 ? (
        <MetricCardGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-emerald-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Aktif di Rute (Jalan)</CardDescription>
              <CardTitle className="text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                <span>{activeCount} <span className="text-sm font-semibold text-muted-foreground">Armada</span></span>
                <Bus className="w-5 h-5 opacity-40 text-emerald-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Armada sedang dinas di trayek / wisata
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-sky-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Siap Berangkat (ISSUED)</CardDescription>
              <CardTitle className="text-2xl font-bold text-sky-600 dark:text-sky-400 flex items-center justify-between">
                <span>{issuedCount} <span className="text-sm font-semibold text-muted-foreground">Rilis</span></span>
                <Play className="w-5 h-5 opacity-40 text-sky-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                SPJ terbit, menunggu jam keberangkatan
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-amber-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Menunggu Kasir (UNDER_REVIEW)</CardDescription>
              <CardTitle className="text-2xl font-bold text-amber-600 dark:text-amber-400 flex items-center justify-between">
                <span>{reviewCount} <span className="text-sm font-semibold text-muted-foreground">SPJ</span></span>
                <Clock className="w-5 h-5 opacity-40 text-amber-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Bus tiba di pool, kru siap rekonsiliasi
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-purple-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Finansial Selesai (SETTLED)</CardDescription>
              <CardTitle className="text-2xl font-bold text-purple-700 dark:text-purple-400 flex items-center justify-between">
                <span>{settledCount} <span className="text-sm font-semibold text-muted-foreground">Tuntas</span></span>
                <CheckCircle2 className="w-5 h-5 opacity-40 text-purple-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Rekonsiliasi kas &amp; UJ tuntas 100%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Banner Edukasi Status Ganda Independen (Blueprint Bab 8.2) */}
      <div className="p-4 rounded-xl border border-indigo-200/70 bg-indigo-50/50 dark:border-indigo-900/40 dark:bg-indigo-950/20 text-xs text-indigo-950 dark:text-indigo-200 flex items-start gap-3 shadow-2xs">
        <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <p className="font-bold text-sm">
            Prinsip Status Ganda Independen SPJ (Blueprint Bab 8.2)
          </p>
          <p className="leading-relaxed">
            Sistem memisahkan secara independen antara <strong>Status Operasional</strong> (<code>DRAFT</code> ➔ <code>ISSUED</code> ➔ <code>IN_PROGRESS</code> ➔ <code>COMPLETED</code>) dan <strong>Status Finansial</strong> (<code>PENDING_SETTLEMENT</code> ➔ <code>UNDER_REVIEW</code> ➔ <code>SETTLED</code>). Armada yang telah tiba di pool tidak otomatis lunas sebelum kasir memverifikasi nota pengeluaran dan setoran kas bruto tiket/kargo.
          </p>
        </div>
      </div>

      {/* Filter & Toolbar */}
      <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
        <CardHeader className="p-3.5 border-b border-slate-200/80 dark:border-white/10 space-y-3 bg-muted/20">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Form Cari */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Cari nomor SPJ (SPJ/...), nomor lambung bus, atau nopol..."
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
            </form>

            {/* Filter Dropdown */}
            <div className="flex flex-wrap items-center gap-2">
              <Select value={serviceFilter} onValueChange={(val) => { setServiceFilter(val); setPage(1); }}>
                <SelectTrigger className="w-34 h-8.5 text-xs">
                  <SelectValue placeholder="Semua Layanan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">Semua Layanan</SelectItem>
                  <SelectItem value="AKAP" className="text-xs">AKAP Reguler</SelectItem>
                  <SelectItem value="WISATA" className="text-xs">Sewa Wisata</SelectItem>
                  <SelectItem value="SHUTTLE" className="text-xs">Shuttle</SelectItem>
                </SelectContent>
              </Select>

              <Select value={opStatusFilter} onValueChange={(val) => { setOpStatusFilter(val); setPage(1); }}>
                <SelectTrigger className="w-36 h-8.5 text-xs">
                  <SelectValue placeholder="Status Ops" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">Semua Status Ops</SelectItem>
                  <SelectItem value="DRAFT" className="text-xs">DRAFT</SelectItem>
                  <SelectItem value="ISSUED" className="text-xs">ISSUED</SelectItem>
                  <SelectItem value="IN_PROGRESS" className="text-xs">IN_PROGRESS</SelectItem>
                  <SelectItem value="COMPLETED" className="text-xs">COMPLETED</SelectItem>
                  <SelectItem value="CANCELLED" className="text-xs">CANCELLED</SelectItem>
                </SelectContent>
              </Select>

              <Select value={finStatusFilter} onValueChange={(val) => { setFinStatusFilter(val); setPage(1); }}>
                <SelectTrigger className="w-36 h-8.5 text-xs">
                  <SelectValue placeholder="Status Finansial" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">Semua Status Fin</SelectItem>
                  <SelectItem value="PENDING_SETTLEMENT" className="text-xs">PENDING</SelectItem>
                  <SelectItem value="UNDER_REVIEW" className="text-xs">UNDER_REVIEW</SelectItem>
                  <SelectItem value="DISCREPANCY" className="text-xs">DISCREPANCY</SelectItem>
                  <SelectItem value="SETTLED" className="text-xs">SETTLED</SelectItem>
                </SelectContent>
              </Select>

              {isFilterActive && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-8.5 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                  title="Reset seluruh filter"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reset
                </Button>
              )}
            </div>
          </div>

          {/* Baris Filter Rentang Tanggal SPJ */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-border/40">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Rentang Tanggal Terbit:
              </span>
              <div className="flex items-center gap-1.5">
                <Input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => {
                    setStartDateFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-8 text-xs w-33.75 px-2.5 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  placeholder="Dari Tanggal"
                />
                <span className="text-xs text-muted-foreground">s/d</span>
                <Input
                  type="date"
                  min={startDateFilter}
                  value={endDateFilter}
                  onChange={(e) => {
                    setEndDateFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-8 text-xs w-33.75 px-2.5 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  placeholder="Sampai Tanggal"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-muted-foreground font-medium">Preset:</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  setStartDateFilter(todayStr);
                  setEndDateFilter(todayStr);
                  setPage(1);
                }}
                className="h-7 text-[11px] px-2 font-medium"
              >
                Hari Ini
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const now = new Date();
                  const y = now.getFullYear();
                  const m = String(now.getMonth() + 1).padStart(2, '0');
                  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
                  setStartDateFilter(`${y}-${m}-01`);
                  setEndDateFilter(`${y}-${m}-${String(lastDay).padStart(2, '0')}`);
                  setPage(1);
                }}
                className="h-7 text-[11px] px-2 font-medium"
              >
                Bulan Ini
              </Button>
              {(startDateFilter || endDateFilter) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStartDateFilter('');
                    setEndDateFilter('');
                    setPage(1);
                  }}
                  className="h-7 text-[11px] px-2 text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reset Tanggal
                </Button>
              )}
            </div>

            <div className="text-xs text-muted-foreground font-medium shrink-0 self-end sm:self-auto">
              Menampilkan <strong className="text-foreground">{startItem} - {endItem}</strong> dari {total} dokumen SPJ
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10">
                <TableHead className="w-40">No. SPJ</TableHead>
                <TableHead className="w-28">Layanan</TableHead>
                <TableHead className="w-32">Armada Bus</TableHead>
                <TableHead className="w-56">Rute &amp; Penugasan</TableHead>
                <TableHead className="w-44">Kru Bertugas</TableHead>
                <TableHead className="w-36">Status Operasional</TableHead>
                <TableHead className="w-36">Status Finansial</TableHead>
                <TableHead className="text-right w-48">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
              {loading ? (
                <TableSkeletonRows
                  rows={limit}
                  colWidths={[
                    'w-28',
                    'w-20',
                    'w-24',
                    'w-36',
                    'w-32',
                    'w-24',
                    'w-28',
                    'w-20 ml-auto',
                  ]}
                />
              ) : spjs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="p-3 rounded-full bg-primary/10 text-primary">
                        <FileText className="h-8 w-8 opacity-60" />
                      </div>
                      <h4 className="text-sm font-semibold text-foreground">
                        Tidak ada dokumen SPJ yang sesuai
                      </h4>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {isFilterActive
                          ? 'Tidak ada dokumen SPJ yang cocok dengan kriteria filter atau pencarian Anda.'
                          : 'Belum ada dokumen SPJ yang diterbitkan dari jadwal dinas bus.'}
                      </p>
                      {isFilterActive && (
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
                spjs.map((s) => {
                  const driver1 = s.crewAssignments?.find((c) => c.role === 'DRIVER');
                  const driver2 = s.crewAssignments?.find((c) => c.role === 'CO_DRIVER');
                  const conductor = s.crewAssignments?.find((c) => c.role === 'CONDUCTOR');

                  return (
                    <TableRow key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                      <TableCell className="font-bold text-xs">
                        {s.spjNo}
                        {s.parentSpj && (
                          <div className="text-[10px] text-amber-700 dark:text-amber-400 flex items-center gap-1 font-semibold mt-0.5">
                            <Wrench className="w-3 h-3" /> Ganti {s.parentSpj.vehicle?.code}
                          </div>
                        )}
                      </TableCell>

                      <TableCell>{getServiceBadge(s.serviceType)}</TableCell>

                      <TableCell>
                        <div className="font-bold text-xs">{s.vehicle?.code}</div>
                        <div className="text-[11px] text-muted-foreground">{s.vehicle?.plateNumber}</div>
                      </TableCell>

                      <TableCell>
                        <div className="text-xs font-semibold">
                          {s.legs && s.legs.length > 0 ? (
                            <span>{s.legs[0].origin.split('/')[0].trim()} ➔ {s.legs[s.legs.length - 1].destination}</span>
                          ) : (
                            <span>Rute Belum Ditentukan</span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {s.legs?.length || 0} Segmen Leg Perjalanan
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-xs">
                          {driver1 && <div>👤 {driver1.crew?.name}</div>}
                          {driver2 && <div className="text-muted-foreground">👤 {driver2.crew?.name}</div>}
                          {conductor && (
                            <div className="text-[11px] text-indigo-700 dark:text-indigo-400 font-medium">
                              🎫 {conductor.crew?.name}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>{getOperationalStatusBadge(s.operationalStatus)}</TableCell>

                      <TableCell>{getFinancialStatusBadge(s.financialStatus)}</TableCell>

                      <TableCell className="text-right space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedSpj(s);
                            setDetailModalOpen(true);
                          }}
                          className="h-7 text-xs font-medium px-2"
                          title="Lihat Detail SPJ & Legs"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> Rincian
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/spjs/${s.id}/finance`)}
                          className="h-7 text-xs font-semibold px-2 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50 border-emerald-300 dark:border-emerald-800 shadow-2xs"
                          title="Kelola Keuangan SPJ (Uang Jalan, Biaya BBM/Tol, Kas Kru, Tiket Agen)"
                        >
                          <Wallet className="w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-emerald-400" /> Keuangan &amp; UJ
                        </Button>

                        {s.operationalStatus === 'ISSUED' && isUpdate && (
                          <Button
                            size="sm"
                            onClick={() => handleStart(s)}
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-2xs px-2"
                            title="Berangkatkan Bus"
                          >
                            <Play className="w-3.5 h-3.5 mr-1" /> Jalan
                          </Button>
                        )}

                        {s.operationalStatus === 'IN_PROGRESS' && isUpdate && (
                          <Button
                            size="sm"
                            onClick={() => handleComplete(s)}
                            className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-2xs px-2"
                            title="Tiba di Pool / Selesai Operasional"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Selesai
                          </Button>
                        )}

                        {s.operationalStatus === 'IN_PROGRESS' && isUpdate && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedSpj(s);
                              setEmergencyModalOpen(true);
                            }}
                            className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                            title="Emergency Breakdown di Tol (Skenario 3)"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Paginasi Server-Side */}
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
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-7.5 w-7.5"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7.5 w-7.5"
                  title="Halaman Berikutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal Detail SPJ */}
      <SpjDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        spj={selectedSpj}
        onSuccess={() => {
          loadSpjs();
          if (selectedSpj) {
            SpjService.getSpj(selectedSpj.id).then(setSelectedSpj);
          }
        }}
        onOpenReplaceCrew={() => {
          setReplaceCrewModalOpen(true);
        }}
        onOpenEmergencyReplace={() => {
          setEmergencyModalOpen(true);
        }}
        onOpenFinance={() => {
          if (selectedSpj) {
            navigate(`/spjs/${selectedSpj.id}/finance`);
          }
        }}
      />

      {/* Modal Keuangan SPJ (Tahap 6: UJ, Biaya BBM/Tol, Kas Kru) */}
      <SpjFinanceModal
        open={financeModalOpen}
        onOpenChange={setFinanceModalOpen}
        spj={selectedSpj}
        onSuccess={() => {
          loadSpjs();
          if (selectedSpj) {
            SpjService.getSpj(selectedSpj.id).then(setSelectedSpj);
          }
        }}
      />

      {/* Modal Pergantian Kru Mid-Trip */}
      <ReplaceCrewModal
        open={replaceCrewModalOpen}
        onOpenChange={setReplaceCrewModalOpen}
        spj={selectedSpj}
        onSuccess={() => {
          loadSpjs();
          if (selectedSpj) {
            SpjService.getSpj(selectedSpj.id).then(setSelectedSpj);
          }
        }}
      />

      {/* Modal Emergency Breakdown di Tol (Skenario 3) */}
      <EmergencyReplaceBusModal
        open={emergencyModalOpen}
        onOpenChange={setEmergencyModalOpen}
        spj={selectedSpj}
        onSuccess={() => {
          loadSpjs();
          setDetailModalOpen(false);
        }}
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
