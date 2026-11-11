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
import { Skeleton } from '@/components/ui/skeleton';
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
import { FareService } from '@/services/fare.service';
import { RouteService } from '@/services/route.service';
import { VehicleService } from '@/services/vehicle.service';
import type {
  CalculatedFareResult,
  FareMatrix,
  FareMatrixFormData,
  FareSeason,
  FareSeasonFormData,
  Route,
  SeatClass,
} from '@/types';
import {
  ArrowRight,
  Calculator,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit,
  Plus,
  RotateCcw,
  Route as RouteIcon,
  Search,
  Sparkles,
  Ticket,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import FareMatrixModal from './components/fare-matrix-modal';
import FareSeasonModal from './components/fare-season-modal';

export default function FaresPage() {
  const { isCreate, isUpdate, isDelete } = usePermission();
  const [activeTab, setActiveTab] = useState<'matrix' | 'seasons'>('matrix');
  const [seasons, setSeasons] = useState<FareSeason[]>([]);
  const [matrices, setMatrices] = useState<FareMatrix[]>([]);
  const [seatClasses, setSeatClasses] = useState<SeatClass[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);

  // Search & Debounce
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Filters
  const [selectedSeasonFilter, setSelectedSeasonFilter] = useState<string>('ALL');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Modals state
  const [isSeasonModalOpen, setIsSeasonModalOpen] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<FareSeason | null>(null);

  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);
  const [selectedMatrix, setSelectedMatrix] = useState<FareMatrix | null>(null);

  const [modalLoading, setModalLoading] = useState(false);

  // Confirm Dialog state
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'season' | 'matrix';
    item: FareSeason | FareMatrix;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Simulation calculator state
  const [simRouteId, setSimRouteId] = useState('CUSTOM');
  const [simOrigin, setSimOrigin] = useState('TANGERANG');
  const [simDestination, setSimDestination] = useState('YOGYAKARTA');
  const [simSeatClassId, setSimSeatClassId] = useState('');
  const [simTravelDate, setSimTravelDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [calcResult, setCalcResult] = useState<CalculatedFareResult | null>(null);
  const [calculating, setCalculating] = useState(false);

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  // Debounce search effect (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim().toUpperCase());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchDependencies = async () => {
    try {
      const [scRes, routeRes] = await Promise.all([
        VehicleService.getSeatClasses(),
        RouteService.findAll(),
      ]);
      if (scRes?.data) {
        setSeatClasses(scRes.data);
        if (scRes.data.length > 0 && !simSeatClassId) {
          setSimSeatClassId(scRes.data[0].id);
        }
      }
      if (routeRes?.data && Array.isArray(routeRes.data)) {
        setRoutes(routeRes.data);
      }
    } catch (err: unknown) {
      console.error('Failed fetching dependencies', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [seasonRes, matrixRes] = await Promise.all([
        FareService.findAllSeasons(),
        FareService.findAllMatrix(),
      ]);

      if (seasonRes?.data) setSeasons(seasonRes.data);
      if (matrixRes?.data) setMatrices(matrixRes.data);
    } catch (err: any) {
      toast.error('Gagal memuat data matriks tarif tiket', {
        description: err?.response?.data?.message || err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
    fetchData();
  }, []);

  const isFilterActive =
    searchInput.trim() !== '' ||
    selectedSeasonFilter !== 'ALL' ||
    selectedClassFilter !== 'ALL' ||
    statusFilter !== 'ALL';

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setSelectedSeasonFilter('ALL');
    setSelectedClassFilter('ALL');
    setStatusFilter('ALL');
    setPage(1);
  };

  // Handle Season CRUD
  const handleSeasonSubmit = async (formData: FareSeasonFormData) => {
    setModalLoading(true);
    try {
      if (selectedSeason) {
        await FareService.updateSeason(selectedSeason.id, formData);
        toast.success(`Kalender musim '${formData.name}' berhasil diperbarui`);
      } else {
        await FareService.createSeason(formData);
        toast.success(`Musim tarif baru '${formData.name}' berhasil dibuat`);
      }
      setIsSeasonModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan musim tarif');
    } finally {
      setModalLoading(false);
    }
  };

  // Handle Matrix CRUD
  const handleMatrixSubmit = async (formData: FareMatrixFormData) => {
    setModalLoading(true);
    try {
      if (selectedMatrix) {
        const { fareSeasonId: _sId, seatClassId: _scId, ...updatePayload } = formData;
        await FareService.updateMatrix(selectedMatrix.id, updatePayload);
        toast.success('Matriks tarif tiket berhasil diperbarui');
      } else {
        await FareService.createMatrix(formData);
        toast.success('Matriks tarif tiket baru berhasil ditambahkan');
      }
      setIsMatrixModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan matriks tarif');
    } finally {
      setModalLoading(false);
    }
  };

  // Confirm Delete Handler
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      if (itemToDelete.type === 'season') {
        const season = itemToDelete.item as FareSeason;
        if (season.code === 'REGULER') {
          toast.error('Musim tarif REGULER tidak boleh dihapus.');
          return;
        }
        await FareService.deleteSeason(season.id);
        toast.success(`Musim tarif '${season.name}' berhasil dihapus`);
      } else {
        const matrix = itemToDelete.item as FareMatrix;
        await FareService.deleteMatrix(matrix.id);
        toast.success(
          `Tarif rute ${matrix.origin} -> ${matrix.destination} berhasil dihapus`,
        );
      }
      setItemToDelete(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus entri');
    } finally {
      setIsDeleting(false);
    }
  };

  // Live Simulation Calculation
  const handleSimulateCalculation = async () => {
    if (!simSeatClassId) {
      toast.error('Pilih kelas kursi terlebih dahulu');
      return;
    }
    setCalculating(true);
    try {
      const res = await FareService.calculateFare({
        routeId: simRouteId && simRouteId !== 'CUSTOM' ? simRouteId : undefined,
        origin: simOrigin,
        destination: simDestination,
        seatClassId: simSeatClassId,
        travelDate: simTravelDate,
      });
      if (res?.data) {
        setCalcResult(res.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Kalkulasi tarif tidak ditemukan');
      setCalcResult(null);
    } finally {
      setCalculating(false);
    }
  };

  // Filtered Matrices Logic
  const filteredMatrices = useMemo(() => {
    return matrices.filter((m) => {
      if (selectedSeasonFilter !== 'ALL' && m.fareSeasonId !== selectedSeasonFilter) {
        return false;
      }
      if (selectedClassFilter !== 'ALL' && m.seatClassId !== selectedClassFilter) {
        return false;
      }
      if (statusFilter === 'ACTIVE' && !m.isActive) {
        return false;
      }
      if (statusFilter === 'INACTIVE' && m.isActive) {
        return false;
      }
      if (debouncedSearch) {
        const matchOrigin = m.origin.toUpperCase().includes(debouncedSearch);
        const matchDestination = m.destination.toUpperCase().includes(debouncedSearch);
        const matchSeason = (m.fareSeason?.name || '').toUpperCase().includes(debouncedSearch);
        const matchClass = (m.seatClass?.name || '').toUpperCase().includes(debouncedSearch);
        const matchRoute = m.route?.name
          ? m.route.name.toUpperCase().includes(debouncedSearch)
          : false;
        const matchRouteCode = m.route?.code
          ? m.route.code.toUpperCase().includes(debouncedSearch)
          : false;
        if (
          !matchOrigin &&
          !matchDestination &&
          !matchSeason &&
          !matchClass &&
          !matchRoute &&
          !matchRouteCode
        ) {
          return false;
        }
      }
      return true;
    });
  }, [matrices, selectedSeasonFilter, selectedClassFilter, statusFilter, debouncedSearch]);

  // Pagination calculation
  const totalMatrices = filteredMatrices.length;
  const totalPages = Math.ceil(totalMatrices / limit) || 1;
  const paginatedMatrices = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredMatrices.slice(start, start + limit);
  }, [filteredMatrices, page, limit]);

  const startItem = totalMatrices === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalMatrices);

  // Auto-reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedSeasonFilter, selectedClassFilter, statusFilter]);

  // Statistik Ringkas
  const regulerMatrices = useMemo(
    () => matrices.filter((m) => m.fareSeason?.code === 'REGULER'),
    [matrices],
  );
  const avgRegulerFare = useMemo(() => {
    if (regulerMatrices.length === 0) return 0;
    const total = regulerMatrices.reduce((sum, m) => sum + Number(m.amount), 0);
    return Math.round(total / regulerMatrices.length);
  }, [regulerMatrices]);

  const seasonalMatrices = useMemo(
    () => matrices.filter((m) => m.fareSeason?.code !== 'REGULER'),
    [matrices],
  );
  const avgSeasonalFare = useMemo(() => {
    if (seasonalMatrices.length === 0) return 0;
    const total = seasonalMatrices.reduce((sum, m) => sum + Number(m.amount), 0);
    return Math.round(total / seasonalMatrices.length);
  }, [seasonalMatrices]);

  return (
    <div className="space-y-6 p-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Heading
          title="Matriks Tarif & Kalender Musim Tiket"
          description="Konfigurasi kalender musim dinamis (Reguler, Tuslah Lebaran, Libur Sekolah) & matriks tarif per kelas kursi bus."
        />
        <div className="flex items-center gap-2">
          {activeTab === 'seasons' && isCreate && (
            <Button
              onClick={() => {
                setSelectedSeason(null);
                setIsSeasonModalOpen(true);
              }}
              className="h-9 text-xs gap-1.5"
            >
              <Plus className="h-4 w-4" /> Tambah Musim Tarif
            </Button>
          )}
          {activeTab === 'matrix' && isCreate && (
            <Button
              onClick={() => {
                setSelectedMatrix(null);
                setIsMatrixModalOpen(true);
              }}
              className="h-9 text-xs gap-1.5"
            >
              <Plus className="h-4 w-4" /> Tambah Matriks Tarif
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <MetricCardGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-primary">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Kalender Musim Tarif</CardDescription>
              <CardTitle className="text-2xl font-black text-primary flex items-center justify-between">
                <span>{seasons.length} <span className="text-sm font-semibold text-muted-foreground">Musim</span></span>
                <Calendar className="h-5 w-5 opacity-40 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {seasons.filter((s) => s.isActive).length} musim aktif
                </span>{' '}
                termasuk REGULER
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-blue-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Matriks Terkonfigurasi</CardDescription>
              <CardTitle className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between">
                <span>{matrices.length} <span className="text-sm font-semibold text-muted-foreground">Entri</span></span>
                <Ticket className="h-5 w-5 opacity-40 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Kombinasi rute AKAP & kelas kabin
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-emerald-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Rata-Rata Tarif Reguler</CardDescription>
              <CardTitle className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                <span>{formatCurrency(avgRegulerFare)}</span>
                <Sparkles className="h-5 w-5 opacity-40 text-emerald-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Dari {regulerMatrices.length} entri tarif standar harian
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-amber-500">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Rata-Rata Tarif Peak / Tuslah</CardDescription>
              <CardTitle className="text-2xl font-bold text-amber-600 dark:text-amber-400 flex items-center justify-between">
                <span>{formatCurrency(avgSeasonalFare)}</span>
                <Ticket className="h-5 w-5 opacity-40 text-amber-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Dari {seasonalMatrices.length} entri kalender musim khusus
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'matrix' | 'seasons')}
        className="space-y-4"
      >
        <div className="flex justify-start">
          <TabsList className="bg-muted/70 p-1 rounded-xl h-auto flex flex-wrap gap-1 justify-start">
            <TabsTrigger
              value="matrix"
              className="gap-2 py-1.5 px-3.5 text-xs font-semibold"
            >
              <Ticket className="h-4 w-4" /> Matriks Tarif Tiket ({matrices.length})
            </TabsTrigger>
            <TabsTrigger
              value="seasons"
              className="gap-2 py-1.5 px-3.5 text-xs font-semibold"
            >
              <Calendar className="h-4 w-4" /> Kalender Musim Tarif ({seasons.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ==================== TAB 1: MATRIKS TARIF TIKET ==================== */}
        <TabsContent value="matrix" className="space-y-6 pt-1">
          {/* Kalkulator Simulasi Dinamis Widget */}
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Calculator className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Simulator Engine Dynamic Pricing (Formula Addendum v1.6 & v1.17)
                  </CardTitle>
                  <CardDescription className="text-[11px]">
                    Uji perhitungan tarif tiket real-time: f(Rute, Tanggal Musim, Kelas Kursi)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                    <RouteIcon className="h-3 w-3 text-indigo-500" />
                    Pilih Rute Trayek
                  </label>
                  <Select
                    value={simRouteId}
                    onValueChange={(val) => {
                      setSimRouteId(val);
                      if (val !== 'CUSTOM') {
                        const r = routes.find((item) => item.id === val);
                        if (r) {
                          setSimOrigin(r.origin);
                          setSimDestination(r.destination);
                        }
                      }
                    }}
                  >
                    <SelectTrigger className="h-8.5 text-xs">
                      <SelectValue placeholder="Pilih Rute..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CUSTOM" className="text-xs">
                        -- Manual Asal-Tujuan --
                      </SelectItem>
                      {routes.map((r) => (
                        <SelectItem key={r.id} value={r.id} className="text-xs">
                          {r.code} ({r.origin} ➔ {r.destination})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Kota Asal</label>
                  <Input
                    value={simOrigin}
                    onChange={(e) => {
                      setSimRouteId('CUSTOM');
                      setSimOrigin(e.target.value.toUpperCase());
                    }}
                    placeholder="TANGERANG"
                    className="h-8.5 text-xs font-mono font-bold uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Kota Tujuan</label>
                  <Input
                    value={simDestination}
                    onChange={(e) => {
                      setSimRouteId('CUSTOM');
                      setSimDestination(e.target.value.toUpperCase());
                    }}
                    placeholder="YOGYAKARTA"
                    className="h-8.5 text-xs font-mono font-bold uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Kelas Kursi Bus</label>
                  <Select value={simSeatClassId} onValueChange={setSimSeatClassId}>
                    <SelectTrigger className="h-8.5 text-xs">
                      <SelectValue placeholder="Pilih Kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      {seatClasses.map((sc) => (
                        <SelectItem key={sc.id} value={sc.id} className="text-xs">
                          {sc.name} ({sc.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    Tanggal Perjalanan
                  </label>
                  <Input
                    type="date"
                    value={simTravelDate}
                    onChange={(e) => setSimTravelDate(e.target.value)}
                    className="h-8.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <Button
                    onClick={handleSimulateCalculation}
                    disabled={calculating}
                    className="w-full h-8.5 text-xs gap-1.5"
                  >
                    {calculating ? 'Menghitung...' : 'Hitung Tarif'}
                  </Button>
                </div>
              </div>

              {calcResult && (
                <div className="mt-3.5 p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        {calcResult.origin} <ArrowRight className="h-3 w-3 text-muted-foreground" /> {calcResult.destination}
                      </span>
                      {calcResult.routeCode && (
                        <Badge variant="outline" className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 border-indigo-200">
                          {calcResult.routeCode}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {calcResult.seatClass.name}
                      </Badge>
                      {calcResult.isSeasonal ? (
                        <Badge className="bg-amber-600/15 text-amber-700 dark:text-amber-400 border-amber-200 text-[10px]">
                          Musim: {calcResult.seasonName}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          Tarif Reguler Harian
                        </Badge>
                      )}
                    </div>
                    {calcResult.routeName && (
                      <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1">
                        <RouteIcon className="h-3 w-3" /> Trayek Terpilih: {calcResult.routeName}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      Tanggal Keberangkatan Terpilih: <strong className="text-foreground">{calcResult.travelDate}</strong>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[11px] text-muted-foreground font-medium">Harga Tiket Final</div>
                    <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(calcResult.amount)}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Filter & Live Search Toolbar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              {/* Input Search Debounced */}
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari rute, musim, kelas..."
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

              {/* Filter Musim */}
              <Select
                value={selectedSeasonFilter}
                onValueChange={setSelectedSeasonFilter}
              >
                <SelectTrigger className="w-full sm:w-48 h-8.5 text-xs">
                  <SelectValue placeholder="Semua Musim" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">Semua Musim Tarif</SelectItem>
                  {seasons.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.name} ({s.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filter Kelas */}
              <Select
                value={selectedClassFilter}
                onValueChange={setSelectedClassFilter}
              >
                <SelectTrigger className="w-full sm:w-44 h-8.5 text-xs">
                  <SelectValue placeholder="Semua Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">Semua Kelas Kursi</SelectItem>
                  {seatClasses.map((sc) => (
                    <SelectItem key={sc.id} value={sc.id} className="text-xs">
                      {sc.name} ({sc.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filter Status */}
              <Select
                value={statusFilter}
                onValueChange={(val: 'ALL' | 'ACTIVE' | 'INACTIVE') =>
                  setStatusFilter(val)
                }
              >
                <SelectTrigger className="w-full sm:w-36 h-8.5 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">Semua Status</SelectItem>
                  <SelectItem value="ACTIVE" className="text-xs">Hanya Aktif</SelectItem>
                  <SelectItem value="INACTIVE" className="text-xs">Non-Aktif</SelectItem>
                </SelectContent>
              </Select>

              {/* Reset Filter Button */}
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

            <div className="text-xs text-muted-foreground font-medium shrink-0 self-end lg:self-auto">
              Menampilkan <strong className="text-foreground">{filteredMatrices.length}</strong> dari {matrices.length} entri tarif
            </div>
          </div>

          {/* Matrix Table */}
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/80 dark:bg-white/5">
                <TableRow className="border-b border-slate-200/80 dark:border-white/10">
                  <TableHead className="w-52">Rute Perjalanan</TableHead>
                  <TableHead className="w-48">Musim Tarif</TableHead>
                  <TableHead className="w-40">Kelas Kursi Bus</TableHead>
                  <TableHead className="text-right w-40">Tarif Dasar Tiket</TableHead>
                  <TableHead className="w-32">Mulai Berlaku</TableHead>
                  <TableHead className="w-24 text-center">Status</TableHead>
                  <TableHead className="text-right w-24">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
                {loading ? (
                  <TableSkeletonRows
                    rows={6}
                    colWidths={[
                      'w-36',
                      'w-28',
                      'w-24',
                      'w-24 ml-auto',
                      'w-24',
                      'w-16 mx-auto',
                      'w-16 ml-auto',
                    ]}
                  />
                ) : filteredMatrices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="p-3 rounded-full bg-primary/10 text-primary">
                          <Ticket className="h-8 w-8 opacity-60" />
                        </div>
                        <h4 className="text-sm font-semibold text-foreground">
                          Tidak ada tarif tiket yang cocok
                        </h4>
                        <p className="text-xs text-muted-foreground max-w-sm">
                          {isFilterActive
                            ? 'Tidak ada entri matriks tarif yang cocok dengan kombinasi filter atau kata kunci rute.'
                            : 'Belum ada konfigurasi matriks tarif tiket yang terdaftar.'}
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
                                setSelectedMatrix(null);
                                setIsMatrixModalOpen(true);
                              }}
                              className="text-xs gap-1.5 h-8 mt-1"
                            >
                              <Plus className="h-3.5 w-3.5" /> Tambah Matriks Tarif Baru
                            </Button>
                          )
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedMatrices.map((m) => (
                    <TableRow
                      key={m.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors"
                    >
                      <TableCell className="font-semibold text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-foreground">{m.origin}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="font-mono font-bold text-foreground">{m.destination}</span>
                        </div>
                        {m.route && (
                          <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono flex items-center gap-1 mt-0.5">
                            <RouteIcon className="h-2.5 w-2.5" />
                            {m.route.name} ({m.route.code})
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            m.fareSeason?.code === 'REGULER' ? 'secondary' : 'default'
                          }
                          className={
                            m.fareSeason?.code === 'LEBARAN_2026'
                              ? 'bg-amber-600/15 text-amber-700 dark:text-amber-400 border-amber-200 text-[10px]'
                              : 'text-[10px]'
                          }
                        >
                          {m.fareSeason?.name || m.fareSeasonId}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {m.seatClass?.name || 'Kelas Kursi'}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right font-mono font-black text-sm text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(m.amount)}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {m.effectiveFrom ? m.effectiveFrom.split('T')[0] : '-'}
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge
                          className={
                            m.isActive
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]'
                              : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20 text-[10px]'
                          }
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current mr-1 inline-block" />
                          {m.isActive ? 'Aktif' : 'Non-Aktif'}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isUpdate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                setSelectedMatrix(m);
                                setIsMatrixModalOpen(true);
                              }}
                              title="Edit Matriks Tarif"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {isDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              onClick={() =>
                                setItemToDelete({ type: 'matrix', item: m })
                              }
                              title="Hapus Matriks Tarif"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Paginasi Table */}
            {filteredMatrices.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 border-t border-slate-200/80 dark:border-white/10 text-xs">
                <div className="text-muted-foreground">
                  Menampilkan <strong className="text-foreground">{startItem} - {endItem}</strong> dari <strong className="text-foreground">{totalMatrices}</strong> entri tarif
                </div>

                <div className="flex items-center gap-4">
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
                        <SelectItem value="25" className="text-xs">25</SelectItem>
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
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ==================== TAB 2: KALENDER MUSIM TARIF ==================== */}
        <TabsContent value="seasons" className="space-y-4 pt-1">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="shadow-xs bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-20 rounded" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-6 w-36 rounded mt-2" />
                    <Skeleton className="h-4 w-48 rounded" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-4 w-28 rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : seasons.length === 0 ? (
            <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-dashed border-slate-300 dark:border-white/15 p-12 text-center flex flex-col items-center justify-center space-y-2">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <Calendar className="h-8 w-8 opacity-60" />
              </div>
              <h4 className="text-sm font-semibold text-foreground">
                Belum ada kalender musim tarif
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm">
                Tambahkan kalender musim seperti Tuslah Lebaran atau Libur Sekolah untuk penyesuaian tarif musiman.
              </p>
              {isCreate && (
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedSeason(null);
                    setIsSeasonModalOpen(true);
                  }}
                  className="text-xs gap-1.5 h-8 mt-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Buat Kalender Musim Baru
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {seasons.map((s) => (
                <Card
                  key={s.id}
                  className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="font-mono text-[10px] bg-background">
                        {s.code}
                      </Badge>
                      <Badge
                        className={
                          s.isActive
                            ? 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 text-[10px]'
                            : 'bg-muted text-muted-foreground text-[10px]'
                        }
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current mr-1 inline-block" />
                        {s.isActive ? 'Aktif Berlaku' : 'Non-Aktif'}
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-bold mt-2 text-foreground">
                      {s.name}
                    </CardTitle>
                    <CardDescription className="text-xs line-clamp-2">
                      {s.description || 'Tidak ada keterangan tambahan.'}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3 pt-2">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-xs space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Tanggal Mulai:
                        </span>
                        <span className="font-mono font-semibold">
                          {s.startDate ? s.startDate.split('T')[0] : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Tanggal Selesai:
                        </span>
                        <span className="font-mono font-semibold">
                          {s.endDate ? s.endDate.split('T')[0] : '-'}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground flex items-center justify-between">
                      <span>Jumlah Matriks Terkait:</span>
                      <strong className="text-foreground font-mono">{s.matrices?.length || 0} Entri</strong>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-200/60 dark:border-white/10">
                      {isUpdate && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSeason(s);
                            setIsSeasonModalOpen(true);
                          }}
                          className="h-7 text-xs gap-1"
                          title="Edit Kalender Musim"
                        >
                          <Edit className="h-3.5 w-3.5" /> Edit
                        </Button>
                      )}
                      {isDelete && s.code !== 'REGULER' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setItemToDelete({ type: 'season', item: s })
                          }
                          className="h-7 text-xs text-destructive hover:bg-destructive/10 gap-1"
                          title="Hapus Musim Tarif"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Hapus
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal Kalender Musim Tarif */}
      <FareSeasonModal
        isOpen={isSeasonModalOpen}
        onClose={() => setIsSeasonModalOpen(false)}
        onSubmit={handleSeasonSubmit}
        season={selectedSeason}
        loading={modalLoading}
      />

      {/* Modal Matriks Tarif Tiket */}
      <FareMatrixModal
        isOpen={isMatrixModalOpen}
        onClose={() => setIsMatrixModalOpen(false)}
        onSubmit={handleMatrixSubmit}
        matrix={selectedMatrix}
        seasons={seasons}
        seatClasses={seatClasses}
        loading={modalLoading}
      />

      {/* Confirm Dialog Hapus Musim / Matriks */}
      <ConfirmDialog
        open={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
        title={
          itemToDelete?.type === 'season'
            ? 'Hapus Kalender Musim Tarif'
            : 'Hapus Entri Matriks Tarif Tiket'
        }
        description={
          itemToDelete?.type === 'season'
            ? `Apakah Anda yakin ingin menghapus musim tarif '${(itemToDelete?.item as FareSeason)?.name}'? Seluruh matriks tarif yang terikat dengan musim ini akan ikut terhapus.`
            : `Apakah Anda yakin ingin menghapus tarif rute ${(itemToDelete?.item as FareMatrix)?.origin} -> ${(itemToDelete?.item as FareMatrix)?.destination}? Tindakan ini akan menghapus acuan harga dinamis rute terkait.`
        }
        variant="danger"
        confirmText={
          itemToDelete?.type === 'season' ? 'Hapus Musim' : 'Hapus Tarif'
        }
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
