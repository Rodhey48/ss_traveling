import Heading from '@/components/shared/heading';
import ConfirmDialog from '@/components/shared/confirm-dialog';
import {
  MetricCardGridSkeleton,
  TableSkeletonRows,
  VehicleCardGridSkeleton,
} from '@/components/shared/skeleton-loaders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
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
import { VehicleService } from '@/services/vehicle.service';
import type { Vehicle, VehicleFormData } from '@/types';
import {
  Armchair,
  Bus,
  CheckCircle2,
  Clock,
  Edit,
  Eye,
  Images,
  LayoutGrid,
  List,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Users,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import SeatClassMasterModal from './components/seat-class-master-modal';
import VehicleDetailModal from './components/vehicle-detail-modal';
import VehicleModal from './components/vehicle-modal';

export default function VehiclesPage() {
  const { isCreate, isUpdate, isDelete } = usePermission();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);

  // Search & Debounce
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Filters
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('ALL');
  const [ownershipFilter, setOwnershipFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Pagination & Display
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSeatClassMasterOpen, setIsSeatClassMasterOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [detailVehicle, setDetailVehicle] = useState<Vehicle | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Delete confirm dialog
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Track image load failures per vehicle ID
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // Debounce search effect (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const response = await VehicleService.findAll({
        search: debouncedSearch || undefined,
        vehicleType: vehicleTypeFilter === 'ALL' ? undefined : vehicleTypeFilter,
        ownershipStatus: ownershipFilter === 'ALL' ? undefined : ownershipFilter,
        isActive:
          statusFilter === 'ALL'
            ? undefined
            : statusFilter === 'ACTIVE'
            ? true
            : false,
        page,
        limit,
      });

      if (response.status && response.data) {
        setVehicles(response.data.data);
        setTotal(response.data.total);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (error: any) {
      toast.error('Gagal memuat data armada bus', {
        description: error.response?.data?.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [
    debouncedSearch,
    vehicleTypeFilter,
    ownershipFilter,
    statusFilter,
    page,
    limit,
  ]);

  const isFilterActive =
    searchInput.trim() !== '' ||
    vehicleTypeFilter !== 'ALL' ||
    ownershipFilter !== 'ALL' ||
    statusFilter !== 'ALL';

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setVehicleTypeFilter('ALL');
    setOwnershipFilter('ALL');
    setStatusFilter('ALL');
    setPage(1);
  };

  const handleCreate = () => {
    setSelectedVehicle(null);
    setIsModalOpen(true);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsModalOpen(true);
  };

  const handleViewDetail = (vehicle: Vehicle) => {
    setDetailVehicle(vehicle);
    setIsDetailOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!vehicleToDelete) return;
    setIsDeleting(true);
    try {
      await VehicleService.remove(vehicleToDelete.id);
      toast.success(
        `Armada ${vehicleToDelete.code} (${vehicleToDelete.plateNumber}) berhasil dihapus`,
      );
      setVehicleToDelete(null);
      fetchVehicles();
    } catch (error: any) {
      toast.error('Gagal menghapus armada', {
        description: error.response?.data?.message,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (data: VehicleFormData) => {
    setSubmitting(true);
    try {
      if (selectedVehicle) {
        await VehicleService.update(selectedVehicle.id, data);
        toast.success(`Data armada ${data.code} berhasil diperbarui`);
      } else {
        await VehicleService.create(data);
        toast.success(`Armada baru ${data.code} berhasil didaftarkan`);
      }
      setIsModalOpen(false);
      fetchVehicles();
    } catch (error: any) {
      toast.error('Gagal menyimpan armada bus', {
        description: error.response?.data?.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Metrik Ringkas Armada
  const totalBus = total || vehicles.length;
  const activeCount = useMemo(
    () => vehicles.filter((v) => v.isActive !== false).length,
    [vehicles],
  );
  const totalSeats = useMemo(
    () =>
      vehicles.reduce((acc, v) => acc + (v.capacity || 0), 0),
    [vehicles],
  );
  const totalOwned = useMemo(
    () => vehicles.filter((v) => v.ownershipStatus === 'OWNED_PAID_OFF').length,
    [vehicles],
  );
  const totalLeasing = useMemo(
    () => vehicles.filter((v) => v.ownershipStatus === 'LEASING').length,
    [vehicles],
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Heading
          title="Manajemen Armada Bus (Fleet & Website Catalog)"
          description="Kelola data fisik armada SS-01 s.d. SS-10, foto showcase landing page, dan konfigurasi kelas kursi kabin multi-class."
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsSeatClassMasterOpen(true)}
            className="gap-2 h-9 text-xs"
          >
            <Armchair className="h-4 w-4 text-primary" /> Master Kelas Kursi
          </Button>
          {isCreate && (
            <Button onClick={handleCreate} className="gap-2 h-9 text-xs">
              <Plus className="h-4 w-4" /> Tambah Armada
            </Button>
          )}
        </div>
      </div>

      {/* Kartu Statistik Armada */}
      {loading && vehicles.length === 0 ? (
        <MetricCardGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">
                Total Unit Armada Terdata
              </CardDescription>
              <CardTitle className="text-2xl font-black text-primary flex items-center justify-between">
                <span>{totalBus} <span className="text-sm font-semibold text-muted-foreground">Bus</span></span>
                <Bus className="h-6 w-6 opacity-40 text-primary" />
              </CardTitle>
              <p className="text-[11px] text-muted-foreground mt-1">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {activeCount} unit
                </span>{' '}
                siap operasi dinas
              </p>
            </CardHeader>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">
                Total Kapasitas Angkut
              </CardDescription>
              <CardTitle className="text-2xl font-bold flex items-center justify-between text-foreground">
                <span>{totalSeats} <span className="text-sm font-semibold text-muted-foreground">Kursi</span></span>
                <Users className="h-6 w-6 text-amber-500 opacity-60" />
              </CardTitle>
              <p className="text-[11px] text-muted-foreground mt-1">
                Akumulasi kursi penumpang armada
              </p>
            </CardHeader>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">
                Aset Milik Sendiri (Lunas)
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                <span>{totalOwned} <span className="text-sm font-semibold text-muted-foreground">Unit</span></span>
                <CheckCircle2 className="h-6 w-6 opacity-60" />
              </CardTitle>
              <p className="text-[11px] text-muted-foreground mt-1">
                Bebas beban cicilan pembiayaan
              </p>
            </CardHeader>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">
                Cicilan Bank / Leasing
              </CardDescription>
              <CardTitle className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between">
                <span>{totalLeasing} <span className="text-sm font-semibold text-muted-foreground">Unit</span></span>
                <Clock className="h-6 w-6 opacity-60" />
              </CardTitle>
              <p className="text-[11px] text-muted-foreground mt-1">
                Dalam jadwal amortisasi pembiayaan
              </p>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Filter & Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs">
        {/* Search Bar & Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Input Search dengan Debounce & Reset Button */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari lambung, nopol, julukan..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 pr-8 h-9 text-xs"
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

          {/* Filter Tipe Bus */}
          <Select
            value={vehicleTypeFilter}
            onValueChange={(val) => {
              setVehicleTypeFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-40 h-9 text-xs">
              <SelectValue placeholder="Semua Tipe Bus" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">
                Semua Tipe Bus
              </SelectItem>
              <SelectItem value="BIG_BUS" className="text-xs">
                Big Bus (Besar)
              </SelectItem>
              <SelectItem value="MEDIUM_BUS" className="text-xs">
                Medium Bus
              </SelectItem>
              <SelectItem value="MINIBUS" className="text-xs">
                Minibus / HiAce
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Filter Status Kepemilikan */}
          <Select
            value={ownershipFilter}
            onValueChange={(val) => {
              setOwnershipFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-42 h-9 text-xs">
              <SelectValue placeholder="Semua Kepemilikan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">
                Semua Kepemilikan
              </SelectItem>
              <SelectItem value="OWNED_PAID_OFF" className="text-xs">
                Milik Sendiri (Lunas)
              </SelectItem>
              <SelectItem value="LEASING" className="text-xs">
                Cicilan Leasing
              </SelectItem>
              <SelectItem value="RENTAL" className="text-xs">
                Sewa Mitra (Rental)
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Filter Status Operasional */}
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-40 h-9 text-xs">
              <SelectValue placeholder="Status Operasional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">
                Semua Status
              </SelectItem>
              <SelectItem value="ACTIVE" className="text-xs">
                Siap Operasi
              </SelectItem>
              <SelectItem value="INACTIVE" className="text-xs">
                Perawatan Garasi
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Tombol Reset Filter */}
          {isFilterActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5"
              title="Reset seluruh filter"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          )}
        </div>

        {/* View Mode Pill Toggle */}
        <div className="tabs-container-pill shrink-0 self-end lg:self-auto">
          <Button
            variant={viewMode === 'card' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('card')}
            className="h-8 px-3 gap-1.5 text-xs"
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Kartu
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
            className="h-8 px-3 gap-1.5 text-xs"
          >
            <List className="h-3.5 w-3.5" /> Tabel
          </Button>
        </div>
      </div>

      {/* Konten Halaman: Card vs Table */}
      {loading ? (
        viewMode === 'card' ? (
          <VehicleCardGridSkeleton count={limit} />
        ) : (
          <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md overflow-hidden shadow-xs">
            <Table>
              <TableHeader className="bg-slate-50/80 dark:bg-white/5">
                <TableRow className="border-b border-slate-200/80 dark:border-white/10">
                  <TableHead className="w-28">No. Lambung</TableHead>
                  <TableHead className="w-32">Plat Nomor</TableHead>
                  <TableHead>Julukan</TableHead>
                  <TableHead className="w-32">Tipe</TableHead>
                  <TableHead>Chasis & Karoseri</TableHead>
                  <TableHead>Kapasitas & Kelas Kursi</TableHead>
                  <TableHead className="w-28">Kepemilikan</TableHead>
                  <TableHead className="w-32">Kesiapan</TableHead>
                  <TableHead className="text-right w-24">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
                <TableSkeletonRows
                  rows={6}
                  colWidths={[
                    'w-20',
                    'w-24',
                    'w-28',
                    'w-20',
                    'w-36',
                    'w-32',
                    'w-20',
                    'w-24',
                    'w-20 ml-auto',
                  ]}
                />
              </TableBody>
            </Table>
          </div>
        )
      ) : vehicles.length === 0 ? (
        /* Empty State Komprehensif */
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/15 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-md p-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="p-4 rounded-full bg-primary/10 text-primary">
            <Bus className="h-10 w-10 opacity-60" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">
              Tidak ada armada bus ditemukan
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {isFilterActive
                ? 'Tidak ada armada yang cocok dengan kata kunci pencarian atau kombinasi filter terpilih.'
                : 'Belum ada data armada bus yang terdaftar di dalam sistem.'}
            </p>
          </div>
          {isFilterActive ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs gap-1.5 h-8.5 mt-2"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset Semua Filter
            </Button>
          ) : (
            isCreate && (
              <Button
                size="sm"
                onClick={handleCreate}
                className="text-xs gap-1.5 h-8.5 mt-2"
              >
                <Plus className="h-3.5 w-3.5" /> Tambah Armada Baru
              </Button>
            )
          )}
        </div>
      ) : viewMode === 'card' ? (
        /* CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {vehicles.map((v) => {
            const primaryImage =
              v.images?.find((img) => img.isPrimary) || v.images?.[0];
            const isBroken = brokenImages[v.id];
            const isBusActive = v.isActive !== false;

            return (
              <Card
                key={v.id}
                onClick={() => handleViewDetail(v)}
                className="group overflow-hidden border border-slate-200/80 dark:border-white/10 hover:border-primary/60 transition-all hover:shadow-lg cursor-pointer bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md flex flex-col justify-between shadow-xs"
              >
                <div>
                  {/* Foto Sampul Bus (Landing Page Ready) */}
                  <div className="relative h-44 w-full bg-slate-950 overflow-hidden">
                    {primaryImage && !isBroken ? (
                      <img
                        src={primaryImage.imageUrl}
                        alt={primaryImage.caption || v.nickname || v.code}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={() =>
                          setBrokenImages((prev) => ({ ...prev, [v.id]: true }))
                        }
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-900/80">
                        <Bus className="h-10 w-10 opacity-30 mb-1" />
                        <span className="text-[11px] text-slate-400">
                          Belum ada foto galeri
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                    {/* Badge Nomor Lambung, Nopol, & Kesiapan */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <Badge className="bg-primary text-primary-foreground font-mono font-bold text-xs backdrop-blur-sm shadow-xs">
                        {v.code}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-black/60 text-white font-mono text-[11px] border-white/20 backdrop-blur-sm"
                      >
                        {v.plateNumber}
                      </Badge>
                      <Badge
                        className={
                          isBusActive
                            ? 'bg-emerald-500/90 text-white text-[10px] backdrop-blur-sm'
                            : 'bg-amber-500/90 text-white text-[10px] backdrop-blur-sm'
                        }
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-white mr-1 inline-block animate-pulse" />
                        {isBusActive ? 'Siap Operasi' : 'Garasi'}
                      </Badge>
                    </div>

                    {/* Badge Jumlah Foto Galeri */}
                    {v.images && v.images.length > 0 && (
                      <div className="absolute top-3 right-3">
                        <Badge
                          variant="secondary"
                          className="bg-black/60 text-white border-white/20 text-[10px] gap-1 backdrop-blur-sm"
                        >
                          <Images className="h-3 w-3" /> {v.images.length} Foto
                        </Badge>
                      </div>
                    )}

                    {/* Julukan Bus & Status Kepemilikan di atas gradien foto */}
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between text-white">
                      <div className="space-y-0.5">
                        <p className="text-[11px] text-white/80 font-semibold tracking-wide uppercase">
                          {v.vehicleType.replace('_', ' ')}
                        </p>
                        <h3 className="text-base font-black tracking-tight drop-shadow-sm truncate">
                          {v.nickname || `Armada SS ${v.code}`}
                        </h3>
                      </div>
                      <Badge
                        className={
                          v.ownershipStatus === 'OWNED_PAID_OFF'
                            ? 'bg-emerald-500/90 text-white text-[10px]'
                            : 'bg-blue-500/90 text-white text-[10px]'
                        }
                      >
                        {v.ownershipStatus === 'OWNED_PAID_OFF'
                          ? 'Lunas'
                          : 'Leasing'}
                      </Badge>
                    </div>
                  </div>

                  {/* Body Kartu */}
                  <div className="p-4 space-y-3">
                    {/* Spesifikasi Chasis & Karoseri */}
                    <div className="bg-slate-50 dark:bg-white/5 p-2.5 rounded-lg text-xs space-y-1 border border-slate-200/60 dark:border-white/5">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Chasis:</span>
                        <span
                          className="font-medium truncate max-w-44 text-right"
                          title={v.chassisModel}
                        >
                          {v.chassisModel || '-'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Karoseri:</span>
                        <span
                          className="font-medium truncate max-w-44 text-right"
                          title={v.bodyModel}
                        >
                          {v.bodyModel || '-'}
                        </span>
                      </div>
                    </div>

                    {/* Konfigurasi Multi-Class Kursi */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-muted-foreground flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-primary" /> Kapasitas Kabin
                        </span>
                        <span className="font-bold text-sm text-primary">
                          {v.capacity} Kursi
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {v.seatClasses && v.seatClasses.length > 0 ? (
                          v.seatClasses.map((sc) => (
                            <Badge
                              key={sc.id}
                              variant="secondary"
                              className="text-[10px] font-medium py-0.5 px-1.5 bg-background dark:bg-white/10 border border-slate-200/60 dark:border-white/10"
                            >
                              {sc.className === 'SLEEPER' && '🛏️ Sleeper: '}
                              {sc.className === 'LUXURY_2_1' && '👑 Luxury: '}
                              {sc.className === 'EXECUTIVE' && '⭐ Exec: '}
                              {sc.className === 'STANDARD' && 'Std: '}
                              <strong className="ml-0.5">{sc.seatCapacity}</strong>
                            </Badge>
                          ))
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">
                            Standar tunggal ({v.capacity} seat)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Kartu & Tombol Aksi */}
                <div className="p-4 pt-2 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Eye className="h-3 w-3" /> Klik untuk spesifikasi
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isUpdate && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(v);
                        }}
                        className="h-7 text-xs px-2.5 gap-1"
                        title="Edit Data Armada"
                      >
                        <Edit className="h-3 w-3" /> Edit
                      </Button>
                    )}
                    {isDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setVehicleToDelete(v);
                        }}
                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                        title="Hapus Armada"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-slate-50/80 dark:bg-white/5">
              <TableRow className="border-b border-slate-200/80 dark:border-white/10">
                <TableHead className="w-28">No. Lambung</TableHead>
                <TableHead className="w-32">Plat Nomor</TableHead>
                <TableHead>Julukan</TableHead>
                <TableHead className="w-28">Tipe Bus</TableHead>
                <TableHead>Chasis & Karoseri</TableHead>
                <TableHead>Kapasitas & Kelas Kursi</TableHead>
                <TableHead className="w-28">Kepemilikan</TableHead>
                <TableHead className="w-32">Kesiapan</TableHead>
                <TableHead className="text-right w-24">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
              {vehicles.map((v) => {
                const isBusActive = v.isActive !== false;

                return (
                  <TableRow
                    key={v.id}
                    onClick={() => handleViewDetail(v)}
                    className="cursor-pointer hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors"
                  >
                    <TableCell className="font-bold flex items-center gap-2">
                      <span className="font-mono">{v.code}</span>
                      {v.images && v.images.length > 0 && (
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1 py-0 gap-0.5 bg-background font-mono"
                        >
                          <Images className="h-2.5 w-2.5" /> {v.images.length}
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="font-mono text-xs font-semibold">
                      {v.plateNumber}
                    </TableCell>

                    <TableCell className="font-medium text-xs">
                      {v.nickname || '-'}
                    </TableCell>

                    <TableCell className="text-xs">
                      <Badge variant="outline" className="text-[10px]">
                        {v.vehicleType.replace('_', ' ')}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs">
                      <div className="font-medium">{v.chassisModel || '-'}</div>
                      <div className="text-muted-foreground">{v.bodyModel || '-'}</div>
                    </TableCell>

                    <TableCell>
                      <div className="font-bold text-xs text-primary mb-1">
                        {v.capacity} Kursi
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {v.seatClasses?.map((sc) => (
                          <Badge
                            key={sc.id}
                            variant="secondary"
                            className="text-[9px] px-1 py-0 font-mono"
                          >
                            {sc.className}: {sc.seatCapacity}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          v.ownershipStatus === 'OWNED_PAID_OFF'
                            ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-[10px]'
                            : 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60 text-[10px]'
                        }
                      >
                        {v.ownershipStatus === 'OWNED_PAID_OFF'
                          ? 'Lunas'
                          : 'Leasing'}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Badge
                        className={
                          isBusActive
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] gap-1'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] gap-1'
                        }
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {isBusActive ? 'Siap Operasi' : 'Perawatan'}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetail(v);
                          }}
                          className="h-7 w-7"
                          title="Lihat Detail Armada"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {isUpdate && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(v);
                            }}
                            className="h-7 w-7"
                            title="Edit Data Armada"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {isDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setVehicleToDelete(v);
                            }}
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            title="Hapus Armada"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Paginasi Footer */}
      {!loading && vehicles.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground pt-2">
          <div>
            Menampilkan{' '}
            <strong className="text-foreground">
              {(page - 1) * limit + 1}
            </strong>{' '}
            -{' '}
            <strong className="text-foreground">
              {Math.min(page * limit, total)}
            </strong>{' '}
            dari <strong className="text-foreground">{total}</strong> armada bus
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span>Tampilkan:</span>
              <Select
                value={String(limit)}
                onValueChange={(val) => {
                  setLimit(Number(val));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-18 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6" className="text-xs">
                    6
                  </SelectItem>
                  <SelectItem value="12" className="text-xs">
                    12
                  </SelectItem>
                  <SelectItem value="24" className="text-xs">
                    24
                  </SelectItem>
                  <SelectItem value="48" className="text-xs">
                    48
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="h-8 px-2.5 text-xs gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Sebelumnya
              </Button>
              <span className="font-semibold px-2 text-foreground">
                Halaman {page} dari {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="h-8 px-2.5 text-xs gap-1"
              >
                Selanjutnya <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog Form Tambah / Edit */}
      <VehicleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        vehicle={selectedVehicle}
        loading={submitting}
      />

      {/* Modal Detail & Galeri Foto Armada Bus */}
      <VehicleDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        vehicle={detailVehicle}
        onEdit={handleEdit}
      />

      {/* Modal Master Kelas Kursi */}
      <SeatClassMasterModal
        isOpen={isSeatClassMasterOpen}
        onClose={() => setIsSeatClassMasterOpen(false)}
        onUpdated={fetchVehicles}
      />

      {/* Confirm Dialog Hapus Armada Bus (Prod Standard) */}
      <ConfirmDialog
        open={!!vehicleToDelete}
        onOpenChange={(open) => !open && setVehicleToDelete(null)}
        title="Hapus Data Armada Bus"
        description={`Apakah Anda yakin ingin menghapus armada bus ${vehicleToDelete?.code} (${vehicleToDelete?.plateNumber})? Tindakan ini akan menghapus data spesifikasi dan konfigurasi kursi bus terkait.`}
        variant="danger"
        confirmText="Hapus Armada"
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
