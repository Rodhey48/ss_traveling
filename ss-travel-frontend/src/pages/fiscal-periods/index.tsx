import { useState, useEffect, useMemo } from 'react';
import Heading from '@/components/shared/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { FiscalPeriodService } from '@/services/fiscal-period.service';
import {
  MetricCardGridSkeleton,
  TableSkeletonRows,
} from '@/components/shared/skeleton-loaders';
import type {
  CreateFiscalYearFormData,
  FiscalPeriod,
  FiscalPeriodStatus,
  FiscalYear,
  UpdatePeriodStatusFormData,
} from '@/types';
import {
  CalendarRange,
  CheckCircle2,
  Clock,
  Lock,
  Plus,
  Unlock,
  Search,
  X,
  RotateCcw,
  Edit,
  ArrowRight,
  ShieldAlert,
  CalendarCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import FiscalYearModal from './components/fiscal-year-modal';
import UpdateStatusModal from './components/update-status-modal';

export default function FiscalPeriodsPage() {
  const { isCreate, isUpdate } = usePermission();
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<FiscalYear | null>(null);
  const [loading, setLoading] = useState(false);

  // Search & Filter States
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | FiscalPeriodStatus>('ALL');

  // Modals
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [periodToUpdate, setPeriodToUpdate] = useState<FiscalPeriod | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Debounced search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim().toUpperCase());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchYears = async () => {
    setLoading(true);
    try {
      const res = await FiscalPeriodService.findAllYears();
      if (res?.data && res.data.length > 0) {
        setFiscalYears(res.data);
        const currentYearId = selectedYearId || res.data[0].id;
        setSelectedYearId(currentYearId);
        await fetchYearDetail(currentYearId);
      }
    } catch (err: any) {
      toast.error('Gagal memuat kalender tahun fiskal', {
        description: err?.response?.data?.message || err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchYearDetail = async (yearId: string) => {
    try {
      const res = await FiscalPeriodService.findOneYear(yearId);
      if (res?.data) {
        setSelectedYear(res.data);
      }
    } catch (err: any) {
      console.error('Failed fetching year details', err);
    }
  };

  useEffect(() => {
    fetchYears();
  }, []);

  const handleYearChange = async (yearId: string) => {
    setSelectedYearId(yearId);
    await fetchYearDetail(yearId);
  };

  const handleCreateYear = async (data: CreateFiscalYearFormData) => {
    setSubmitting(true);
    try {
      const res = await FiscalPeriodService.createYear(data);
      toast.success(`Tahun fiskal '${data.year}' berhasil dibuat dengan 12 periode.`);
      setIsYearModalOpen(false);
      await fetchYears();
      if (res?.data) {
        setSelectedYearId(res.data.id);
        setSelectedYear(res.data);
      }
    } catch (err: any) {
      toast.error('Gagal membuat tahun fiskal baru', {
        description: err?.response?.data?.message || err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenStatusModal = (period: FiscalPeriod) => {
    setPeriodToUpdate(period);
    setIsStatusModalOpen(true);
  };

  const handleUpdateStatus = async (data: UpdatePeriodStatusFormData) => {
    if (!periodToUpdate) return;
    setSubmitting(true);
    try {
      await FiscalPeriodService.updatePeriodStatus(periodToUpdate.id, data);
      toast.success(`Status periode '${periodToUpdate.name}' berhasil diperbarui.`);
      setIsStatusModalOpen(false);
      if (selectedYearId) {
        await fetchYearDetail(selectedYearId);
      }
    } catch (err: any) {
      toast.error('Gagal memperbarui status periode', {
        description: err?.response?.data?.message || err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isFilterActive = searchInput.trim() !== '' || statusFilter !== 'ALL';

  const handleResetFilters = () => {
    setSearchInput('');
    setStatusFilter('ALL');
  };

  // Filtered Periods
  const filteredPeriods = useMemo(() => {
    if (!selectedYear?.periods) return [];
    return selectedYear.periods.filter((p) => {
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (debouncedSearch) {
        const matchName = p.name.toUpperCase().includes(debouncedSearch);
        const matchCode = `P-${String(p.periodNo).padStart(2, '0')}`.includes(debouncedSearch);
        const matchReason = (p.closeReason || '').toUpperCase().includes(debouncedSearch);
        if (!matchName && !matchCode && !matchReason) return false;
      }
      return true;
    });
  }, [selectedYear, statusFilter, debouncedSearch]);

  // KPI Dynamic Calculations
  const openPeriodsCount = useMemo(() => {
    if (!selectedYear?.periods) return 0;
    return selectedYear.periods.filter((p) => p.status === 'OPEN').length;
  }, [selectedYear]);

  const closedPeriodsCount = useMemo(() => {
    if (!selectedYear?.periods) return 0;
    return selectedYear.periods.filter((p) => p.status === 'CLOSED').length;
  }, [selectedYear]);

  const auditPeriodsCount = useMemo(() => {
    if (!selectedYear?.periods) return 0;
    return selectedYear.periods.filter(
      (p) => p.status === 'CLOSING' || p.status === 'REOPENED',
    ).length;
  }, [selectedYear]);

  const getStatusBadge = (status: FiscalPeriodStatus) => {
    switch (status) {
      case 'OPEN':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]">
            <CheckCircle2 className="h-3 w-3 mr-1" /> OPEN
          </Badge>
        );
      case 'CLOSING':
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px]">
            <Clock className="h-3 w-3 mr-1" /> CLOSING
          </Badge>
        );
      case 'CLOSED':
        return (
          <Badge className="bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20 text-[10px]">
            <Lock className="h-3 w-3 mr-1" /> CLOSED
          </Badge>
        );
      case 'REOPENED':
        return (
          <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20 text-[10px]">
            <Unlock className="h-3 w-3 mr-1" /> REOPENED
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Heading
          title="Periode Fiskal Akuntansi"
          description="Kalender penutupan buku bulanan dan tahun fiskal PT SS Travelink Official (Blueprint Bab 8.4)."
        />
        {isCreate && (
          <Button onClick={() => setIsYearModalOpen(true)} className="h-9 text-xs gap-1.5">
            <Plus className="h-4 w-4" /> Buka Tahun Fiskal Baru
          </Button>
        )}
      </div>

      {/* Dynamic Summary Cards */}
      {loading ? (
        <MetricCardGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-primary">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Tahun Fiskal Aktif</CardDescription>
              <CardTitle className="text-2xl font-black text-primary flex items-center justify-between">
                <span>{selectedYear?.year || 2026}</span>
                <CalendarRange className="h-5 w-5 opacity-40 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground font-mono">
                Status: <strong>Tahun {selectedYear?.status || 'OPEN'}</strong>
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-emerald-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Periode Terbuka (OPEN)</CardDescription>
              <CardTitle className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                <span>{openPeriodsCount} <span className="text-sm font-semibold text-muted-foreground">Bulan</span></span>
                <CheckCircle2 className="h-5 w-5 opacity-40 text-emerald-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Aktif menerima transaksi posting jurnal GL
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-slate-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Periode Ditutup (CLOSED)</CardDescription>
              <CardTitle className="text-2xl font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>{closedPeriodsCount} <span className="text-sm font-semibold text-muted-foreground">Bulan</span></span>
                <Lock className="h-5 w-5 opacity-40 text-slate-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Terkunci rapat dari perubahan transaksi
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-purple-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Dalam Audit / Penutupan</CardDescription>
              <CardTitle className="text-2xl font-bold text-purple-700 dark:text-purple-400 flex items-center justify-between">
                <span>{auditPeriodsCount} <span className="text-sm font-semibold text-muted-foreground">Bulan</span></span>
                <Clock className="h-5 w-5 opacity-40 text-purple-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Proses CLOSING atau REOPENED audit
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SOP Banner Akuntansi Bus & Pintasan ke /period-closing */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl border border-blue-200/80 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-600/10 text-blue-700 dark:text-blue-400 shrink-0">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-blue-900 dark:text-blue-200">
              SOP Pengendalian Fiskal &amp; Proteksi Integritas Jurnal
            </div>
            <div className="text-[11px] text-blue-800/80 dark:text-blue-300/80 max-w-2xl">
              Posting jurnal akuntansi dari seluruh modul (SPJ Kru, Meja Kasir Pool, Invoice AP/AR, Kas Kecil) otomatis <strong>DITOLAK</strong> pada periode yang telah berstatus <code>CLOSED</code>. Untuk menjalankan audit komprehensif 6-point checklist penutupan buku, gunakan Meja Tutup Buku Bulanan.
            </div>
          </div>
        </div>

        <Link to="/period-closing">
          <Button variant="outline" size="sm" className="h-8.5 text-xs gap-1.5 shrink-0 bg-white dark:bg-zinc-900">
            <CalendarCheck className="h-3.5 w-3.5 text-primary" /> Meja Tutup Buku Bulanan <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {/* Year Selection & Multi-Filter Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Selector Tahun */}
          <div className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-primary shrink-0" />
            <Select value={selectedYearId} onValueChange={handleYearChange}>
              <SelectTrigger className="w-44 h-8.5 text-xs font-bold">
                <SelectValue placeholder="Pilih Tahun Fiskal" />
              </SelectTrigger>
              <SelectContent>
                {fiscalYears.map((fy) => (
                  <SelectItem key={fy.id} value={fy.id} className="text-xs">
                    Tahun {fy.year} ({fy.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Periode */}
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama bulan, P-01..."
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

          {/* Filter Status */}
          <Select
            value={statusFilter}
            onValueChange={(val: 'ALL' | FiscalPeriodStatus) => setStatusFilter(val)}
          >
            <SelectTrigger className="w-full sm:w-40 h-8.5 text-xs">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">Semua Status</SelectItem>
              <SelectItem value="OPEN" className="text-xs">Hanya OPEN</SelectItem>
              <SelectItem value="CLOSING" className="text-xs">Hanya CLOSING</SelectItem>
              <SelectItem value="CLOSED" className="text-xs">Hanya CLOSED</SelectItem>
              <SelectItem value="REOPENED" className="text-xs">Hanya REOPENED</SelectItem>
            </SelectContent>
          </Select>

          {isFilterActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-8.5 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground font-medium shrink-0 self-end lg:self-auto">
          Menampilkan <strong className="text-foreground">{filteredPeriods.length}</strong> dari 12 periode bulanan ({selectedYear?.startDate} s.d. {selectedYear?.endDate})
        </div>
      </div>

      {/* Monthly Periods Table */}
      <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80 dark:bg-white/5">
            <TableRow className="border-b border-slate-200/80 dark:border-white/10">
              <TableHead className="w-24">Periode</TableHead>
              <TableHead className="w-48">Nama Periode</TableHead>
              <TableHead className="w-60">Rentang Tanggal Fiskal</TableHead>
              <TableHead className="w-28 text-center">Status</TableHead>
              <TableHead className="min-w-64">Catatan &amp; Alasan Penutupan</TableHead>
              <TableHead className="text-right w-24">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
            {loading ? (
              <TableSkeletonRows
                rows={6}
                colWidths={[
                  'w-16',
                  'w-36',
                  'w-48',
                  'w-20 mx-auto',
                  'w-64',
                  'w-16 ml-auto',
                ]}
              />
            ) : filteredPeriods.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                      <CalendarRange className="h-8 w-8 opacity-60" />
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">
                      Tidak ada periode yang cocok
                    </h4>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      {isFilterActive
                        ? 'Tidak ada periode bulanan yang sesuai dengan filter atau kata kunci pencarian.'
                        : 'Belum ada kalender periode bulanan pada tahun fiskal ini.'}
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
              filteredPeriods.map((period) => (
                <TableRow key={period.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                  <TableCell className="font-mono font-bold text-xs text-primary">
                    P-{String(period.periodNo).padStart(2, '0')}
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-foreground">
                    {period.name}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {period.startDate} &rarr; {period.endDate}
                  </TableCell>
                  <TableCell className="text-center">{getStatusBadge(period.status)}</TableCell>
                  <TableCell className="text-xs">
                    {period.closeReason ? (
                      <div className="text-muted-foreground italic truncate max-w-sm">
                        {period.closeReason}
                      </div>
                    ) : period.status === 'CLOSED' ? (
                      <span className="text-muted-foreground italic">Periode terkunci rapat</span>
                    ) : (
                      <span className="text-muted-foreground">Siap menerima jurnal transaksi</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isUpdate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2.5 text-xs text-primary hover:bg-primary/10 gap-1"
                        onClick={() => handleOpenStatusModal(period)}
                      >
                        <Edit className="h-3.5 w-3.5" /> Ubah Status
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Modals */}
      <FiscalYearModal
        isOpen={isYearModalOpen}
        onClose={() => setIsYearModalOpen(false)}
        onSubmit={handleCreateYear}
        isLoading={submitting}
      />

      <UpdateStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onSubmit={handleUpdateStatus}
        period={periodToUpdate}
        isLoading={submitting}
      />
    </div>
  );
}
