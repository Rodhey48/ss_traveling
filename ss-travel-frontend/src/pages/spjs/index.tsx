import { useState, useEffect } from 'react';
import Heading from '@/components/shared/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bus,
  Search,
  Clock,
  Play,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Wrench,
  Info,
  Calendar,
  RotateCcw,
  Wallet,
} from 'lucide-react';
import SpjDetailModal from './components/spj-detail-modal';
import SpjFinanceModal from './components/spj-finance-modal';
import ReplaceCrewModal from './components/replace-crew-modal';
import EmergencyReplaceBusModal from './components/emergency-replace-bus-modal';
import ConfirmDialog from '@/components/shared/confirm-dialog';
import { SpjService } from '@/services/spj.service';
import type {
  Spj,
  TripServiceType,
  SpjOperationalStatus,
  SpjFinancialStatus,
} from '@/types';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/use-permission';

export default function SpjsPage() {
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
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Modals state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [financeModalOpen, setFinanceModalOpen] = useState(false);
  const [replaceCrewModalOpen, setReplaceCrewModalOpen] = useState(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [selectedSpj, setSelectedSpj] = useState<Spj | null>(null);

  // Custom Confirm Dialog State
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

  useEffect(() => {
    loadSpjs();
  }, [serviceFilter, opStatusFilter, finStatusFilter, startDateFilter, endDateFilter, page, limit]);

  const loadSpjs = async () => {
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
      if (search) params.search = search;

      const res = await SpjService.getSpjs(params);
      setSpjs(res.data || []);
      setTotal(res.total || 0);
    } catch {
      toast.error('Gagal memuat data Surat Perintah Jalan (SPJ).');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadSpjs();
  };

  const handleStart = (spj: Spj) => {
    setConfirmDialog({
      open: true,
      title: 'Berangkatkan Armada Bus',
      description: `Apakah Anda yakin ingin memberangkatkan armada bus '${spj.vehicle?.code}' (${spj.vehicle?.plateNumber})? Dokumen SPJ '${spj.spjNo}' akan aktif di rute perjalanan dan kru resmi bertugas.`,
      variant: 'primary',
      confirmText: 'Berangkatkan Bus',
      onConfirm: async () => {
        try {
          await SpjService.startSpj(spj.id);
          toast.success(`Armada '${spj.vehicle?.code}' resmi aktif di perjalanan.`);
          setConfirmDialog((prev) => ({ ...prev, open: false }));
          loadSpjs();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Gagal memberangkatkan bus.');
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
        try {
          await SpjService.completeSpj(spj.id);
          toast.success(`Operasional SPJ '${spj.spjNo}' tuntas.`);
          setConfirmDialog((prev) => ({ ...prev, open: false }));
          loadSpjs();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Gagal menyelesaikan SPJ.');
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

  // Metrik Ringkasan Operasional
  const activeCount = spjs.filter((s) => s.operationalStatus === 'IN_PROGRESS').length;
  const issuedCount = spjs.filter((s) => s.operationalStatus === 'ISSUED').length;
  const reviewCount = spjs.filter((s) => s.financialStatus === 'UNDER_REVIEW').length;
  const settledCount = spjs.filter((s) => s.financialStatus === 'SETTLED').length;

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Heading
          title="Operasional Surat Perintah Jalan (SPJ)"
          description="Monitoring perjalanan armada bus, penugasan kru dinas, manifes leg, serta manajemen darurat di jalan."
        />
      </div>

      {/* Kartu Metrik Ringkasan Operasional (Clean & Balanced Contrast) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="border shadow-2xs bg-card">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs font-semibold flex items-center justify-between text-muted-foreground">
              <span>Aktif di Rute</span>
              <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Bus className="w-4 h-4" />
              </div>
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-foreground mt-1">
              {activeCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            Armada sedang dinas di trayek/wisata
          </CardContent>
        </Card>

        <Card className="border shadow-2xs bg-card">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs font-semibold flex items-center justify-between text-muted-foreground">
              <span>Siap Berangkat (ISSUED)</span>
              <div className="p-1 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <Play className="w-4 h-4" />
              </div>
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-foreground mt-1">
              {issuedCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            SPJ terbit, menunggu jam keberangkatan
          </CardContent>
        </Card>

        <Card className="border shadow-2xs bg-card">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs font-semibold flex items-center justify-between text-muted-foreground">
              <span>Menunggu Kasir (UNDER_REVIEW)</span>
              <div className="p-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-foreground mt-1">
              {reviewCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            Bus tiba di pool, kru belum setor kas
          </CardContent>
        </Card>

        <Card className="border shadow-2xs bg-card">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs font-semibold flex items-center justify-between text-muted-foreground">
              <span>Finansial Selesai (SETTLED)</span>
              <div className="p-1 rounded-md bg-primary/10 text-primary">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-foreground mt-1">
              {settledCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            Rekonsiliasi kas & UJ tuntas 100%
          </CardContent>
        </Card>
      </div>

      {/* Banner Edukasi Status Ganda Independen (Blueprint Bab 8.2) */}
      <div className="p-3.5 rounded-xl border bg-muted/40 text-xs text-foreground flex items-start gap-3 shadow-2xs">
        <div className="p-1 rounded-md bg-primary/10 text-primary shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <p className="font-bold text-xs text-foreground">
            Prinsip Status Ganda Independen SPJ (Blueprint Bab 8.2)
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Sistem memisahkan secara independen antara <strong>Status Operasional</strong> (<code>DRAFT</code> ➔ <code>ISSUED</code> ➔ <code>IN_PROGRESS</code> ➔ <code>COMPLETED</code>) dan <strong>Status Finansial</strong> (<code>PENDING_SETTLEMENT</code> ➔ <code>UNDER_REVIEW</code> ➔ <code>SETTLED</code>). Armada yang telah tiba di pool tidak otomatis lunas sebelum kasir memverifikasi nota pengeluaran dan setoran kas bruto tiket/kargo.
          </p>
        </div>
      </div>

      {/* Filter & Toolbar */}
      <Card className="border shadow-xs">
        <CardHeader className="p-4 border-b space-y-3 bg-muted/20">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Form Cari */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nomor SPJ (SPJ/...), nomor lambung bus, atau nopol..."
                  className="pl-9 h-10 text-xs"
                />
              </div>
              <Button type="submit" variant="secondary" size="sm" className="h-10 text-xs font-semibold px-4">
                Cari SPJ
              </Button>
            </form>

            {/* Filter Dropdown */}
            <div className="flex flex-wrap items-center gap-2">
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger className="w-[130px] h-9 text-xs bg-background">
                  <SelectValue placeholder="Semua Layanan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Layanan</SelectItem>
                  <SelectItem value="AKAP">AKAP Reguler</SelectItem>
                  <SelectItem value="WISATA">Sewa Wisata</SelectItem>
                  <SelectItem value="SHUTTLE">Shuttle</SelectItem>
                </SelectContent>
              </Select>

              <Select value={opStatusFilter} onValueChange={setOpStatusFilter}>
                <SelectTrigger className="w-[145px] h-9 text-xs bg-background">
                  <SelectValue placeholder="Status Ops" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Status Ops</SelectItem>
                  <SelectItem value="DRAFT">DRAFT</SelectItem>
                  <SelectItem value="ISSUED">ISSUED</SelectItem>
                  <SelectItem value="IN_PROGRESS">IN_PROGRESS</SelectItem>
                  <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                  <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                </SelectContent>
              </Select>

              <Select value={finStatusFilter} onValueChange={setFinStatusFilter}>
                <SelectTrigger className="w-[150px] h-9 text-xs bg-background">
                  <SelectValue placeholder="Status Finansial" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Status Fin</SelectItem>
                  <SelectItem value="PENDING_SETTLEMENT">PENDING</SelectItem>
                  <SelectItem value="UNDER_REVIEW">UNDER_REVIEW</SelectItem>
                  <SelectItem value="DISCREPANCY">DISCREPANCY</SelectItem>
                  <SelectItem value="SETTLED">SETTLED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Baris Filter Rentang Tanggal SPJ */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-border/40">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Rentang Tanggal Terbit:
              </span>
              <div className="flex items-center gap-1.5">
                <Input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => {
                    setStartDateFilter(e.target.value);
                    setPage(1);
                  }}
                  className="h-8 text-xs w-[135px] px-2.5 bg-background [&::-webkit-calendar-picker-indicator]:cursor-pointer"
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
                  className="h-8 text-xs w-[135px] px-2.5 bg-background [&::-webkit-calendar-picker-indicator]:cursor-pointer"
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
                <TableHead className="w-[160px]">No. SPJ</TableHead>
                <TableHead>Layanan</TableHead>
                <TableHead>Armada Bus</TableHead>
                <TableHead>Rute & Penugasan</TableHead>
                <TableHead>Kru Bertugas</TableHead>
                <TableHead>Status Operasional</TableHead>
                <TableHead>Status Finansial</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs">
                    Memuat data dokumen SPJ...
                  </TableCell>
                </TableRow>
              ) : spjs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs">
                    Tidak ada dokumen SPJ yang sesuai dengan filter ({total} total).
                  </TableCell>
                </TableRow>
              ) : (
                spjs.map((s) => {
                  const driver1 = s.crewAssignments?.find((c) => c.role === 'DRIVER');
                  const driver2 = s.crewAssignments?.find((c) => c.role === 'CO_DRIVER');
                  const conductor = s.crewAssignments?.find((c) => c.role === 'CONDUCTOR');

                  return (
                    <TableRow key={s.id} className="hover:bg-muted/30">
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
                          className="h-8 text-xs font-medium"
                          title="Lihat Detail SPJ & Legs"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> Rincian
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedSpj(s);
                            setFinanceModalOpen(true);
                          }}
                          className="h-8 text-xs font-semibold bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50 border-emerald-300 dark:border-emerald-800 shadow-2xs"
                          title="Kelola Keuangan SPJ (Uang Jalan, Biaya BBM/Tol, Kas Kru)"
                        >
                          <Wallet className="w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-emerald-400" /> Keuangan & UJ
                        </Button>

                        {s.operationalStatus === 'ISSUED' && isUpdate && (
                          <Button
                            size="sm"
                            onClick={() => handleStart(s)}
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-2xs"
                            title="Berangkatkan Bus"
                          >
                            <Play className="w-3.5 h-3.5 mr-1" /> Jalan
                          </Button>
                        )}

                        {s.operationalStatus === 'IN_PROGRESS' && isUpdate && (
                          <Button
                            size="sm"
                            onClick={() => handleComplete(s)}
                            className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-2xs"
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
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                            title="Emergency Breakdown di Tol (Skenario 3)"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
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
          setFinanceModalOpen(true);
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
      />
    </div>
  );
}
