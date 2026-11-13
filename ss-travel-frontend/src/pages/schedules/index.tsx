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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermission } from '@/hooks/use-permission';
import { TripScheduleService } from '@/services/trip-schedule.service';
import { VehicleService } from '@/services/vehicle.service';
import type {
  TripSchedule,
  TripScheduleStatus,
  TripServiceType,
  Vehicle,
} from '@/types';
import {
  Ban,
  Bus,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit,
  FileCheck,
  Info,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import ReviewPublishSpjModal from './components/review-publish-spj-modal';
import ScheduleModal from './components/schedule-modal';
import TimelineGantt, { type GanttViewMode } from './components/timeline-gantt';

export default function SchedulesPage() {
  const { isCreate, isUpdate, isDelete } = usePermission();
  const [activeTab, setActiveTab] = useState<'calendar' | 'table'>('calendar');
  const [schedules, setSchedules] = useState<TripSchedule[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter State
  const [serviceFilter, setServiceFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);

  // Gantt Timeline Range & View Mode
  const [ganttViewMode, setGanttViewMode] = useState<GanttViewMode>('7days');
  const [timelineVehicleFilter, setTimelineVehicleFilter] = useState<string>('ALL');
  const [timelineStart, setTimelineStart] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<TripSchedule | null>(null);

  // Review & Publish SPJ Modal State
  const [reviewSpjModalOpen, setReviewSpjModalOpen] = useState(false);
  const [scheduleForSpj, setScheduleForSpj] = useState<TripSchedule | null>(null);

  // Custom Confirm Dialog State
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    variant: 'danger' | 'warning' | 'info' | 'primary';
    confirmText?: string;
    promptInput?: {
      label: string;
      placeholder?: string;
      required?: boolean;
    };
    onConfirm: (val?: string) => void | Promise<void>;
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

  const loadVehicles = async () => {
    try {
      const res = await VehicleService.findAll({ limit: 50 });
      setVehicles(res.data?.data || []);
    } catch {
      toast.error('Gagal memuat master armada bus.');
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: activeTab === 'calendar' ? 1 : page,
        limit: activeTab === 'calendar' ? 200 : limit,
      };

      if (serviceFilter !== 'ALL') params.serviceType = serviceFilter as TripServiceType;
      if (statusFilter !== 'ALL') params.status = statusFilter as TripScheduleStatus;
      if (startDateFilter) params.startDate = startDateFilter;
      if (endDateFilter) params.endDate = endDateFilter;
      if (debouncedSearch) params.search = debouncedSearch;

      const res = await TripScheduleService.getSchedules(params);
      setSchedules(res.data || []);
      setTotal(res.total || 0);
    } catch {
      toast.error('Gagal memuat data jadwal operasional bus.');
    } finally {
      setLoading(false);
    }
  }, [serviceFilter, statusFilter, startDateFilter, endDateFilter, page, limit, activeTab, debouncedSearch]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const handleViewModeChange = (mode: GanttViewMode) => {
    setGanttViewMode(mode);
    if (mode === 'month') {
      const firstOfMonth = new Date(timelineStart.getFullYear(), timelineStart.getMonth(), 1);
      setTimelineStart(firstOfMonth);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(searchInput.trim());
    setPage(1);
  };

  const isFilterActive =
    serviceFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    startDateFilter !== '' ||
    endDateFilter !== '' ||
    searchInput.trim() !== '';

  const handleResetFilters = () => {
    setServiceFilter('ALL');
    setStatusFilter('ALL');
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
  const totalActiveSchedules = useMemo(
    () => schedules.filter((s) => s.status === 'CONFIRMED' || s.status === 'IN_PROGRESS').length,
    [schedules],
  );
  const totalAkap = useMemo(
    () => schedules.filter((s) => s.serviceType === 'AKAP').length,
    [schedules],
  );
  const totalWisata = useMemo(
    () => schedules.filter((s) => s.serviceType === 'WISATA').length,
    [schedules],
  );
  const totalReadyForSpj = useMemo(
    () => schedules.filter((s) => s.status === 'CONFIRMED' && !s.spjId).length,
    [schedules],
  );

  const handleConfirmSchedule = (id: string, no: string) => {
    setConfirmDialog({
      open: true,
      title: 'Konfirmasi & Kunci Jadwal Bus',
      description: `Apakah Anda yakin ingin mengonfirmasi jadwal '${no}'? Status akan berubah menjadi CONFIRMED dan armada bus serta personel kru akan terkunci untuk penugasan ini.`,
      variant: 'primary',
      confirmText: 'Kunci Jadwal',
      onConfirm: async () => {
        setIsConfirmLoading(true);
        try {
          await TripScheduleService.confirmSchedule(id);
          toast.success(`Jadwal '${no}' berhasil dikonfirmasi.`);
          setConfirmDialog((prev) => ({ ...prev, open: false }));
          loadSchedules();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Gagal mengonfirmasi jadwal.');
        } finally {
          setIsConfirmLoading(false);
        }
      },
    });
  };

  const handleCancelSchedule = (id: string, no: string) => {
    setConfirmDialog({
      open: true,
      title: 'Batalkan Jadwal Dinas Bus',
      description: `Masukkan alasan pembatalan dinas untuk jadwal '${no}'. Status jadwal akan diubah menjadi CANCELLED.`,
      variant: 'warning',
      confirmText: 'Batalkan Jadwal',
      promptInput: {
        label: 'Alasan Pembatalan Operasional',
        placeholder: 'Contoh: Pemesan membatalkan sewa / bus mengalami kendala teknis',
        required: true,
      },
      onConfirm: async (reason?: string) => {
        setIsConfirmLoading(true);
        try {
          await TripScheduleService.cancelSchedule(id, reason);
          toast.success(`Jadwal '${no}' telah dibatalkan.`);
          setConfirmDialog((prev) => ({ ...prev, open: false }));
          loadSchedules();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Gagal membatalkan jadwal.');
        } finally {
          setIsConfirmLoading(false);
        }
      },
    });
  };

  // Membuka modal review dokumen SPJ sebelum penerbitan resmi
  const handleGenerateSpj = (schedule: TripSchedule) => {
    setScheduleForSpj(schedule);
    setReviewSpjModalOpen(true);
  };

  const handleDeleteSchedule = (id: string, no: string) => {
    setConfirmDialog({
      open: true,
      title: 'Hapus Draf Jadwal Dinas',
      description: `Apakah Anda yakin ingin menghapus jadwal '${no}'? Jadwal berstatus DRAFT atau CANCELLED yang belum menerbitkan SPJ akan dihapus secara permanen.`,
      variant: 'danger',
      confirmText: 'Hapus Permanen',
      onConfirm: async () => {
        setIsConfirmLoading(true);
        try {
          await TripScheduleService.deleteSchedule(id);
          toast.success(`Jadwal '${no}' berhasil dihapus.`);
          setConfirmDialog((prev) => ({ ...prev, open: false }));
          loadSchedules();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Gagal menghapus jadwal.');
        } finally {
          setIsConfirmLoading(false);
        }
      },
    });
  };

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge className="bg-blue-600 text-white shadow-2xs text-[10px]">CONFIRMED (Terkunci)</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-emerald-600 text-white animate-pulse shadow-2xs text-[10px]">IN_PROGRESS (SPJ Jalan)</Badge>;
      case 'COMPLETED':
        return <Badge variant="secondary" className="text-[10px]">COMPLETED (Selesai)</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive" className="text-[10px]">CANCELLED (Batal)</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">DRAFT (Rencana)</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Heading
          title="Perencanaan Jadwal & Plotting Armada"
          description="Kelola jadwal dinas armada bus SS-01 s.d. SS-10, validasi anti-bentrok & jeda istirahat 3 jam, serta terbitkan SPJ resmi 1-klik."
        />

        {isCreate && (
          <Button
            onClick={() => {
              setSelectedSchedule(null);
              setModalOpen(true);
            }}
            className="h-9 text-xs gap-1.5"
          >
            <Plus className="w-4 h-4" /> Booking Jadwal Baru
          </Button>
        )}
      </div>

      {/* Kartu Ringkasan Metrik KPI */}
      {loading && schedules.length === 0 ? (
        <MetricCardGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-primary">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Jadwal Aktif &amp; Terencana</CardDescription>
              <CardTitle className="text-2xl font-black text-primary flex items-center justify-between">
                <span>{totalActiveSchedules} <span className="text-sm font-semibold text-muted-foreground">Jadwal</span></span>
                <Calendar className="h-5 w-5 opacity-40 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Perencanaan dinas armada aktif operasional
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-indigo-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Dinas AKAP Reguler</CardDescription>
              <CardTitle className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
                <span>{totalAkap} <span className="text-sm font-semibold text-muted-foreground">Jadwal</span></span>
                <Bus className="h-5 w-5 opacity-40 text-indigo-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Trayek reguler Tangerang - Yogya PP
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-amber-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Sewa Wisata / Charter</CardDescription>
              <CardTitle className="text-2xl font-bold text-amber-600 dark:text-amber-400 flex items-center justify-between">
                <span>{totalWisata} <span className="text-sm font-semibold text-muted-foreground">Jadwal</span></span>
                <Sparkles className="h-5 w-5 opacity-40 text-amber-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Kontrak sewa pariwisata &amp; tour rombongan
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-purple-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Siap Terbit SPJ</CardDescription>
              <CardTitle className="text-2xl font-bold text-purple-700 dark:text-purple-400 flex items-center justify-between">
                <span>{totalReadyForSpj} <span className="text-sm font-semibold text-muted-foreground">Siap Rilis</span></span>
                <FileCheck className="h-5 w-5 opacity-40 text-purple-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Jadwal terkunci menunggu SPJ 1-klik di Hari H
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Banner Edukasi Blueprint Addendum v1.16 */}
      <div className="p-4 rounded-xl border border-indigo-200/70 bg-indigo-50/50 dark:border-indigo-900/40 dark:bg-indigo-950/20 text-xs text-indigo-950 dark:text-indigo-200 flex items-start gap-3 shadow-2xs">
        <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-sm">Prinsip Pemisahan Perencanaan &amp; Eksekusi SPJ</p>
          <p>
            Surat Perintah Jalan (SPJ) tidak diterbitkan mendadak dari nol, melainkan bersumber dari dokumen <strong>Jadwal Dinas Terkonfirmasi (CONFIRMED)</strong>. Sistem otomatis menolak jadwal dinas yang saling bertabrakan (<em>overlap conflict</em>) dan memberikan peringatan jika sisa jeda istirahat supir/bus kurang dari 3 jam.
          </p>
        </div>
      </div>

      {/* Tabs & Toolbar */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'calendar' | 'table')} className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <TabsList className="bg-muted p-1">
            <TabsTrigger value="calendar" className="flex items-center gap-2 text-xs">
              <Calendar className="w-4 h-4" /> Kalender Timeline (Gantt)
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center gap-2 text-xs">
              <Bus className="w-4 h-4" /> Daftar Jadwal ({total})
            </TabsTrigger>
          </TabsList>

          {/* Filter Bar Global */}
          <div className="flex flex-wrap items-center gap-2">
            <Select value={serviceFilter} onValueChange={(val) => { setServiceFilter(val); setPage(1); }}>
              <SelectTrigger className="w-36 h-8.5 text-xs">
                <SelectValue placeholder="Semua Layanan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">Semua Layanan</SelectItem>
                <SelectItem value="AKAP" className="text-xs">AKAP Reguler</SelectItem>
                <SelectItem value="WISATA" className="text-xs">Sewa Wisata</SelectItem>
                <SelectItem value="SHUTTLE" className="text-xs">Shuttle</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
              <SelectTrigger className="w-36 h-8.5 text-xs">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">Semua Status</SelectItem>
                <SelectItem value="DRAFT" className="text-xs">DRAFT</SelectItem>
                <SelectItem value="CONFIRMED" className="text-xs">CONFIRMED</SelectItem>
                <SelectItem value="IN_PROGRESS" className="text-xs">IN_PROGRESS</SelectItem>
                <SelectItem value="COMPLETED" className="text-xs">COMPLETED</SelectItem>
                <SelectItem value="CANCELLED" className="text-xs">CANCELLED</SelectItem>
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

        {/* Tab 1: Kalender Timeline (Gantt Chart) */}
        <TabsContent value="calendar" className="space-y-4">
          <TimelineGantt
            vehicles={vehicles}
            schedules={schedules}
            startDate={timelineStart}
            viewMode={ganttViewMode}
            onViewModeChange={handleViewModeChange}
            onNavigate={(newDate) => setTimelineStart(newDate)}
            onSelectSchedule={(sched) => {
              setSelectedSchedule(sched);
              setModalOpen(true);
            }}
            onConfirmSchedule={handleConfirmSchedule}
            onGenerateSpj={handleGenerateSpj}
            vehicleFilter={timelineVehicleFilter}
            onVehicleFilterChange={setTimelineVehicleFilter}
          />
        </TabsContent>

        {/* Tab 2: Daftar Jadwal (Tabel View) */}
        <TabsContent value="table" className="space-y-4">
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
            <CardHeader className="p-3.5 border-b border-slate-200/80 dark:border-white/10 space-y-3 bg-muted/20">
              <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Cari nomor jadwal, rute, nama pemesan wisata, atau nomor lambung bus..."
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
                <div className="text-xs text-muted-foreground font-medium shrink-0 self-end sm:self-auto">
                  Menampilkan <strong className="text-foreground">{startItem} - {endItem}</strong> dari {total} jadwal
                </div>
              </form>

              {/* Filter Rentang Tanggal Keberangkatan */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-border/40">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Rentang Tanggal:
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
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10">
                    <TableHead className="w-36">No. Jadwal</TableHead>
                    <TableHead className="w-28">Layanan</TableHead>
                    <TableHead className="w-32">Armada Bus</TableHead>
                    <TableHead className="w-56">Rute &amp; Waktu Dinas</TableHead>
                    <TableHead className="w-44">Kru Bertugas</TableHead>
                    <TableHead className="w-36">Pemesan / Sewa</TableHead>
                    <TableHead className="w-32">Status</TableHead>
                    <TableHead className="text-right w-28">Aksi</TableHead>
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
                        'w-20',
                        'w-24 ml-auto',
                      ]}
                    />
                  ) : schedules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="p-3 rounded-full bg-primary/10 text-primary">
                            <Calendar className="h-8 w-8 opacity-60" />
                          </div>
                          <h4 className="text-sm font-semibold text-foreground">
                            Tidak ada jadwal dinas bus yang sesuai
                          </h4>
                          <p className="text-xs text-muted-foreground max-w-sm">
                            {isFilterActive
                              ? 'Tidak ada jadwal yang cocok dengan kriteria filter atau pencarian Anda.'
                              : 'Belum ada jadwal dinas armada bus yang terdaftar di sistem.'}
                          </p>
                          {isFilterActive ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleResetFilters}
                              className="text-xs gap-1.5 h-8 mt-1"
                            >
                              <RotateCcw className="h-3.5 w-3.5" /> Reset Filter
                            </Button>
                          ) : (
                            isCreate && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedSchedule(null);
                                  setModalOpen(true);
                                }}
                                className="text-xs gap-1.5 h-8 mt-1"
                              >
                                <Plus className="h-3.5 w-3.5" /> Booking Jadwal Baru
                              </Button>
                            )
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    schedules.map((s) => (
                      <TableRow key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                        <TableCell className="font-bold text-xs">
                          {s.scheduleNo}
                          {s.spj && (
                            <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                              SPJ: {s.spj.spjNo}
                            </div>
                          )}
                        </TableCell>

                        <TableCell>{getServiceBadge(s.serviceType)}</TableCell>

                        <TableCell>
                          {s.vehicle ? (
                            <div>
                              <div className="font-bold text-xs">{s.vehicle.code}</div>
                              <div className="text-[11px] text-muted-foreground">{s.vehicle.plateNumber}</div>
                            </div>
                          ) : (
                            <span className="text-xs text-amber-600 font-medium italic">Belum di-assign</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="text-xs font-semibold flex items-center gap-1.5 flex-wrap">
                            {s.route && (
                              <Badge
                                variant="outline"
                                className="text-[10px] font-mono px-1.5 py-0 h-4 bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300"
                              >
                                {s.route.code}
                              </Badge>
                            )}
                            <span>{s.origin} ➔ {s.destination}</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 shrink-0" />
                            {new Date(s.plannedDepartureAt).toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            s/d{' '}
                            {new Date(s.plannedReturnAt).toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="text-xs">
                            {s.plannedDriver1 && <div>👤 {s.plannedDriver1.name}</div>}
                            {s.plannedDriver2 && <div className="text-muted-foreground">👤 {s.plannedDriver2.name}</div>}
                            {s.plannedConductor && (
                              <div className="text-[11px] text-indigo-600 dark:text-indigo-400">🎫 {s.plannedConductor.name}</div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          {s.customer ? (
                            <div>
                              <div className="font-bold text-xs text-amber-700 dark:text-amber-400">
                                {s.customer.institutionName || s.customer.picName}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                Rp {Number(s.totalPackagePrice).toLocaleString('id-ID')}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        <TableCell>{getStatusBadge(s.status)}</TableCell>

                        <TableCell className="text-right space-x-1">
                          {s.status === 'DRAFT' && isUpdate && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleConfirmSchedule(s.id, s.scheduleNo)}
                              className="h-7 text-xs text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/40 hover:bg-blue-50 dark:hover:bg-blue-950/30 px-2"
                              title="Konfirmasi Jadwal"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Kunci
                            </Button>
                          )}

                          {s.status === 'CONFIRMED' && !s.spjId && isCreate && (
                            <Button
                              size="sm"
                              onClick={() => handleGenerateSpj(s)}
                              className="h-7 text-xs font-semibold px-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                              title="Review & Terbitkan SPJ Resmi"
                            >
                              <FileCheck className="w-3.5 h-3.5 mr-1" /> Rilis SPJ
                            </Button>
                          )}

                          {s.status === 'DRAFT' && isUpdate && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedSchedule(s);
                                setModalOpen(true);
                              }}
                              className="h-7 w-7 p-0"
                              title="Edit Jadwal"
                            >
                              <Edit className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                            </Button>
                          )}

                          {s.status === 'DRAFT' && isDelete && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteSchedule(s.id, s.scheduleNo)}
                              className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              title="Hapus Draf"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}

                          {(s.status === 'DRAFT' || s.status === 'CONFIRMED') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCancelSchedule(s.id, s.scheduleNo)}
                              className="h-7 w-7 p-0 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                              title="Batalkan Jadwal"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
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
        </TabsContent>
      </Tabs>

      {/* Modal Form Tambah / Edit Jadwal */}
      <ScheduleModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        schedule={selectedSchedule}
        onSuccess={loadSchedules}
        onConfirmSchedule={handleConfirmSchedule}
        onGenerateSpj={handleGenerateSpj}
      />

      {/* Modal Review & Terbitkan SPJ Resmi */}
      <ReviewPublishSpjModal
        open={reviewSpjModalOpen}
        onOpenChange={setReviewSpjModalOpen}
        schedule={scheduleForSpj}
        vehicles={vehicles}
        onSuccess={loadSchedules}
      />

      {/* Reusable Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant={confirmDialog.variant}
        confirmText={confirmDialog.confirmText}
        promptInput={confirmDialog.promptInput}
        onConfirm={confirmDialog.onConfirm}
        isLoading={isConfirmLoading}
      />
    </div>
  );
}
