import { useState, useEffect } from 'react';
import Heading from '@/components/shared/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Calendar,
  Clock,
  Bus,
  Search,
  CheckCircle2,
  Edit,
  Trash2,
  FileCheck,
  Ban,
  Info,
  RotateCcw,
} from 'lucide-react';
import TimelineGantt, { type GanttViewMode } from './components/timeline-gantt';
import ScheduleModal from './components/schedule-modal';
import { TripScheduleService } from '@/services/trip-schedule.service';
import { VehicleService } from '@/services/vehicle.service';
import type {
  TripSchedule,
  Vehicle,
  TripServiceType,
  TripScheduleStatus,
} from '@/types';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/use-permission';

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
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
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

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [serviceFilter, statusFilter, startDateFilter, endDateFilter, page, limit, timelineStart, ganttViewMode, activeTab]);

  const handleViewModeChange = (mode: GanttViewMode) => {
    setGanttViewMode(mode);
    if (mode === 'month') {
      const firstOfMonth = new Date(timelineStart.getFullYear(), timelineStart.getMonth(), 1);
      setTimelineStart(firstOfMonth);
    }
  };

  const loadVehicles = async () => {
    try {
      const res = await VehicleService.findAll({ limit: 50 });
      setVehicles(res.data?.data || []);
    } catch {
      toast.error('Gagal memuat master armada bus.');
    }
  };

  const loadSchedules = async () => {
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
      if (search) params.search = search;

      const res = await TripScheduleService.getSchedules(params);
      setSchedules(res.data || []);
      setTotal(res.total || 0);
    } catch {
      toast.error('Gagal memuat data jadwal operasional bus.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadSchedules();
  };

  const handleConfirmSchedule = async (id: string, no: string) => {
    if (!confirm(`Konfirmasi jadwal '${no}'? Status akan berubah menjadi CONFIRMED dan armada/kru terkunci.`)) return;

    try {
      await TripScheduleService.confirmSchedule(id);
      toast.success(`Jadwal '${no}' berhasil dikonfirmasi.`);
      loadSchedules();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengonfirmasi jadwal.');
    }
  };

  const handleCancelSchedule = async (id: string, no: string) => {
    const reason = prompt(`Masukkan alasan pembatalan jadwal '${no}':`);
    if (reason === null) return;

    try {
      await TripScheduleService.cancelSchedule(id, reason);
      toast.success(`Jadwal '${no}' telah dibatalkan.`);
      loadSchedules();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal membatalkan jadwal.');
    }
  };

  const handleGenerateSpj = async (schedule: TripSchedule) => {
    if (!confirm(`Terbitkan Surat Perintah Jalan (SPJ) resmi untuk jadwal '${schedule.scheduleNo}'?`)) return;

    try {
      const spj = await TripScheduleService.generateSpj(schedule.id);
      toast.success(`SPJ '${spj.spjNo}' berhasil diterbitkan! Armada siap diberangkatkan.`);
      loadSchedules();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menerbitkan SPJ dari jadwal.');
    }
  };

  const handleDeleteSchedule = async (id: string, no: string) => {
    if (!confirm(`Hapus draf jadwal '${no}'? Aksi ini permanen.`)) return;

    try {
      await TripScheduleService.deleteSchedule(id);
      toast.success(`Jadwal '${no}' berhasil dihapus.`);
      loadSchedules();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus jadwal.');
    }
  };

  const getServiceBadge = (type: string) => {
    switch (type) {
      case 'AKAP':
        return <Badge className="bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300">AKAP Reguler</Badge>;
      case 'WISATA':
        return <Badge className="bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300">Sewa Wisata</Badge>;
      default:
        return <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300">Shuttle</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge className="bg-blue-600 text-white shadow-2xs">CONFIRMED (Terkunci)</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-emerald-600 text-white animate-pulse shadow-2xs">IN_PROGRESS (SPJ Jalan)</Badge>;
      case 'COMPLETED':
        return <Badge variant="secondary">COMPLETED (Selesai)</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">CANCELLED (Batal)</Badge>;
      default:
        return <Badge variant="outline">DRAFT (Rencana)</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Heading
          title="Perencanaan Jadwal & Plotting Armada"
          description="Kelola jadwal dinas armada bus SS-01 s.d. SS-10, validasi anti-bentrok, dan terbitkan SPJ resmi 1-klik."
        />

        {isCreate && (
          <Button
            onClick={() => {
              setSelectedSchedule(null);
              setModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
          >
            <Plus className="w-4 h-4 mr-2" /> Booking Jadwal Baru
          </Button>
        )}
      </div>

      {/* Banner Edukasi Blueprint Addendum v1.16 */}
      <div className="p-4 rounded-xl border border-indigo-200/70 bg-indigo-50/50 dark:border-indigo-900/40 dark:bg-indigo-950/20 text-xs text-indigo-950 dark:text-indigo-200 flex items-start gap-3 shadow-2xs">
        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-sm">Prinsip Pemisahan Perencanaan vs Eksekusi (Blueprint Addendum v1.16)</p>
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
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="Semua Layanan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Layanan</SelectItem>
                <SelectItem value="AKAP">AKAP Reguler</SelectItem>
                <SelectItem value="WISATA">Sewa Wisata</SelectItem>
                <SelectItem value="SHUTTLE">Shuttle</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="DRAFT">DRAFT</SelectItem>
                <SelectItem value="CONFIRMED">CONFIRMED</SelectItem>
                <SelectItem value="IN_PROGRESS">IN_PROGRESS</SelectItem>
                <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                <SelectItem value="CANCELLED">CANCELLED</SelectItem>
              </SelectContent>
            </Select>
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
          <Card className="border shadow-xs">
            <CardHeader className="p-4 border-b space-y-3 bg-muted/20">
              <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari nomor jadwal, rute, nama pemesan wisata, atau nomor lambung bus..."
                    className="pl-9 h-10 text-xs"
                  />
                </div>
                <Button type="submit" variant="secondary" size="sm" className="h-10 text-xs font-semibold px-4">
                  Cari Jadwal
                </Button>
              </form>

              {/* Filter Rentang Tanggal Keberangkatan */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-border/40">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Rentang Tanggal:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="date"
                      value={startDateFilter}
                      onChange={(e) => {
                        setStartDateFilter(e.target.value);
                        setPage(1);
                      }}
                      className="h-8 text-xs w-[135px] px-2.5 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
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
                      className="h-8 text-xs w-[135px] px-2.5 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
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
                      className="h-7 text-[11px] px-2 text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-1"
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
                  <TableRow className="bg-muted/40">
                    <TableHead className="w-[140px]">No. Jadwal</TableHead>
                    <TableHead>Layanan</TableHead>
                    <TableHead>Armada Bus</TableHead>
                    <TableHead>Rute & Waktu Dinas</TableHead>
                    <TableHead>Kru Bertugas</TableHead>
                    <TableHead>Pemesan / Sewa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs">
                        Memuat data jadwal bus...
                      </TableCell>
                    </TableRow>
                  ) : schedules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs">
                        Tidak ada jadwal dinas bus yang sesuai dengan filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    schedules.map((s) => (
                      <TableRow key={s.id} className="hover:bg-muted/30">
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
                          <div className="text-xs font-semibold">{s.origin} ➔ {s.destination}</div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
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
                              <div className="text-[11px] text-indigo-600">🎫 {s.plannedConductor.name}</div>
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
                              className="h-8 text-xs text-blue-700 border-blue-200 hover:bg-blue-50"
                              title="Konfirmasi Jadwal"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Kunci
                            </Button>
                          )}

                          {s.status === 'CONFIRMED' && !s.spjId && isCreate && (
                            <Button
                              size="sm"
                              onClick={() => handleGenerateSpj(s)}
                              className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                              title="Terbitkan SPJ Resmi"
                            >
                              <FileCheck className="w-3.5 h-3.5 mr-1" /> SPJ
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
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-4 h-4 text-slate-600" />
                            </Button>
                          )}

                          {s.status === 'DRAFT' && isDelete && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteSchedule(s.id, s.scheduleNo)}
                              className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}

                          {(s.status === 'DRAFT' || s.status === 'CONFIRMED') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCancelSchedule(s.id, s.scheduleNo)}
                              className="h-8 w-8 p-0 text-amber-600 hover:bg-amber-50"
                              title="Batalkan Jadwal"
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
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
      />
    </div>
  );
}
