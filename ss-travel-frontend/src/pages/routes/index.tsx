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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePermission } from '@/hooks/use-permission';
import { RouteService } from '@/services/route.service';
import type { Route, RouteFormData, TripServiceType } from '@/types';
import {
  Clock,
  Compass,
  Edit,
  MapPin,
  Milestone,
  Plus,
  RotateCcw,
  Route as RouteIcon,
  Search,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function RoutesPage() {
  const { isCreate, isUpdate, isDelete } = usePermission();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);

  // Search & Filters
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedServiceType, setSelectedServiceType] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState<RouteFormData>({
    code: '',
    name: '',
    origin: '',
    destination: '',
    via: '',
    distanceKm: undefined,
    estimatedHours: undefined,
    serviceType: 'AKAP',
    isActive: true,
  });

  // Confirm delete
  const [routeToDelete, setRouteToDelete] = useState<Route | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const res = await RouteService.findAll();
      if (res.status && Array.isArray(res.data)) {
        setRoutes(res.data);
      }
    } catch {
      toast.error('Gagal mengambil daftar master rute trayek.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  // Filtered list
  const filteredRoutes = useMemo(() => {
    return routes.filter((r) => {
      // Search match
      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase();
        const matchCode = r.code?.toLowerCase().includes(query);
        const matchName = r.name?.toLowerCase().includes(query);
        const matchOrigin = r.origin?.toLowerCase().includes(query);
        const matchDest = r.destination?.toLowerCase().includes(query);
        const matchVia = r.via?.toLowerCase().includes(query);
        if (!matchCode && !matchName && !matchOrigin && !matchDest && !matchVia) {
          return false;
        }
      }

      // Service type match
      if (selectedServiceType !== 'ALL' && r.serviceType !== selectedServiceType) {
        return false;
      }

      // Status match
      if (statusFilter === 'ACTIVE' && !r.isActive) return false;
      if (statusFilter === 'INACTIVE' && r.isActive) return false;

      return true;
    });
  }, [routes, debouncedSearch, selectedServiceType, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = routes.length;
    const active = routes.filter((r) => r.isActive).length;
    const akap = routes.filter((r) => r.serviceType === 'AKAP').length;
    const wisata = routes.filter((r) => r.serviceType === 'WISATA').length;

    const distances = routes
      .map((r) => Number(r.distanceKm) || 0)
      .filter((d) => d > 0);
    const avgDistance = distances.length > 0
      ? Math.round(distances.reduce((a, b) => a + b, 0) / distances.length)
      : 0;

    return { total, active, akap, wisata, avgDistance };
  }, [routes]);

  const handleOpenCreateModal = () => {
    setSelectedRoute(null);
    setFormData({
      code: '',
      name: '',
      origin: '',
      destination: '',
      via: '',
      distanceKm: undefined,
      estimatedHours: undefined,
      serviceType: 'AKAP',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (route: Route) => {
    setSelectedRoute(route);
    setFormData({
      code: route.code,
      name: route.name,
      origin: route.origin,
      destination: route.destination,
      via: route.via || '',
      distanceKm: route.distanceKm ? Number(route.distanceKm) : undefined,
      estimatedHours: route.estimatedHours ? Number(route.estimatedHours) : undefined,
      serviceType: route.serviceType,
      isActive: route.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error('Kode rute wajib diisi.');
      return;
    }
    if (!formData.name.trim()) {
      toast.error('Nama rute wajib diisi.');
      return;
    }
    if (!formData.origin.trim() || !formData.destination.trim()) {
      toast.error('Kota Asal dan Kota Tujuan wajib diisi.');
      return;
    }

    try {
      setModalLoading(true);
      if (selectedRoute) {
        await RouteService.update(selectedRoute.id, formData);
        toast.success(`Rute trayek '${formData.name}' berhasil diperbarui.`);
      } else {
        await RouteService.create(formData);
        toast.success(`Rute trayek '${formData.name}' berhasil ditambahkan.`);
      }
      setIsModalOpen(false);
      fetchRoutes();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan data rute.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!routeToDelete) return;
    try {
      setIsDeleting(true);
      await RouteService.delete(routeToDelete.id);
      toast.success(`Rute '${routeToDelete.name}' berhasil dihapus.`);
      setRouteToDelete(null);
      fetchRoutes();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus rute.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Heading */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <Heading
          title="Master Rute & Trayek"
          description="Pusat konfigurasi rute lintasan operasional bus, checkpoint via, estimasi jarak tempuh, dan basis tarif otomatis."
        />
        {isCreate && (
          <Button
            onClick={handleOpenCreateModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Tambah Rute Trayek
          </Button>
        )}
      </div>

      {/* Metrics Cards */}
      {loading ? (
        <MetricCardGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-indigo-500">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Total Rute Aktif</CardDescription>
              <CardTitle className="text-2xl font-black text-indigo-600 dark:text-indigo-400 flex items-center justify-between font-mono">
                <span>{stats.active} / {stats.total}</span>
                <RouteIcon className="h-5 w-5 opacity-40 text-indigo-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Trayek terdaftar dalam sistem
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-sky-500">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Trayek AKAP Reguler</CardDescription>
              <CardTitle className="text-2xl font-bold text-sky-600 dark:text-sky-400 flex items-center justify-between font-mono">
                <span>{stats.akap} <span className="text-sm font-semibold text-muted-foreground">Trayek</span></span>
                <Milestone className="h-5 w-5 opacity-40 text-sky-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Rute trayek berjadwal tetap
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-emerald-500">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Rute Pariwisata / Charter</CardDescription>
              <CardTitle className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between font-mono">
                <span>{stats.wisata} <span className="text-sm font-semibold text-muted-foreground">Rute</span></span>
                <Compass className="h-5 w-5 opacity-40 text-emerald-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Destinasi wisata khusus
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-amber-500">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Rata-rata Jarak Tempuh</CardDescription>
              <CardTitle className="text-2xl font-bold text-amber-600 dark:text-amber-400 flex items-center justify-between font-mono">
                <span>{stats.avgDistance.toLocaleString('id-ID')} km</span>
                <Clock className="h-5 w-5 opacity-40 text-amber-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Estimasi jarak tempuh lintasan
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Table Card */}
      <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
        <CardHeader className="p-4 pb-3 border-b border-slate-200/80 dark:border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-bold text-foreground">Daftar Rute Operasional</CardTitle>
              <CardDescription className="text-xs">
                Kelola trayek resmi yang digunakan dalam Penjadwalan SPJ, Matriks Tarif, dan Fee Korlap
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchRoutes}
                className="h-8.5 text-xs gap-1.5"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Segarkan
              </Button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari kode, nama, kota, via..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-8 h-8.5 text-xs font-mono"
              />
            </div>

            <Select
              value={selectedServiceType}
              onValueChange={(val) => setSelectedServiceType(val)}
            >
              <SelectTrigger className="h-8.5 text-xs">
                <SelectValue placeholder="Layanan: Semua" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">Semua Layanan</SelectItem>
                <SelectItem value="AKAP" className="text-xs">AKAP (Antar Kota Antar Provinsi)</SelectItem>
                <SelectItem value="WISATA" className="text-xs">Pariwisata / Sewa Bus</SelectItem>
                <SelectItem value="SHUTTLE" className="text-xs">Shuttle / Antar Jemput</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(val: any) => setStatusFilter(val)}
            >
              <SelectTrigger className="h-8.5 text-xs">
                <SelectValue placeholder="Status: Semua" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">Semua Status</SelectItem>
                <SelectItem value="ACTIVE" className="text-xs">Aktif Operasional</SelectItem>
                <SelectItem value="INACTIVE" className="text-xs">Non-Aktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/75 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10">
                  <TableHead className="w-[140px] text-xs font-bold text-foreground">Kode Trayek</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">Nama Trayek</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">Asal ➔ Tujuan</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">Lintasan (Via)</TableHead>
                  <TableHead className="text-right text-xs font-bold text-foreground">Jarak / Estimasi</TableHead>
                  <TableHead className="text-center text-xs font-bold text-foreground">Layanan</TableHead>
                  <TableHead className="text-center text-xs font-bold text-foreground">Status</TableHead>
                  <TableHead className="text-right w-[100px] text-xs font-bold text-foreground">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
                {loading ? (
                  <TableSkeletonRows rows={5} />
                ) : filteredRoutes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-xs">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <RouteIcon className="h-8 w-8 text-muted-foreground/40" />
                        <p className="font-semibold text-foreground text-sm">Tidak ada master rute yang ditemukan.</p>
                        <p className="text-xs text-muted-foreground">Ubah filter pencarian atau daftarkan rute baru.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRoutes.map((r) => (
                    <TableRow key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                      <TableCell className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {r.code}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-xs text-foreground">{r.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 font-semibold text-xs">
                          <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-mono text-[11px]">
                            {r.origin}
                          </span>
                          <span className="text-muted-foreground">➔</span>
                          <span className="text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 font-mono text-[11px]">
                            {r.destination}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {r.via || '-'}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {r.distanceKm ? (
                          <span className="font-mono font-semibold">{Number(r.distanceKm).toLocaleString('id-ID')} km</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                        {r.estimatedHours && (
                          <span className="text-muted-foreground text-[11px] block font-mono">
                            ~{r.estimatedHours} Jam
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={r.serviceType === 'AKAP' ? 'default' : 'secondary'}
                          className="text-[10px]"
                        >
                          {r.serviceType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={
                            r.isActive
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]'
                              : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20 text-[10px]'
                          }
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current mr-1 inline-block" />
                          {r.isActive ? 'Aktif' : 'Non-Aktif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isUpdate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-indigo-600"
                              onClick={() => handleOpenEditModal(r)}
                              title="Edit Rute"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {isDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-red-600"
                              onClick={() => setRouteToDelete(r)}
                              title="Hapus Rute"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Create / Edit */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {selectedRoute ? 'Perbarui Rute Trayek' : 'Daftarkan Rute Trayek Baru'}
              </DialogTitle>
              <DialogDescription>
                Tentukan kode identitas trayek operasional, lintasan kota, dan estimasi waktu perjalanan.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="route-code" className="text-xs font-semibold">
                    Kode Rute <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="route-code"
                    placeholder="mis. RUT-JKT-YOG-MGL"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    className="font-mono"
                    disabled={!!selectedRoute}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="service-type" className="text-xs font-semibold">
                    Layanan Operasional <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.serviceType}
                    onValueChange={(val: TripServiceType) =>
                      setFormData({ ...formData, serviceType: val })
                    }
                  >
                    <SelectTrigger id="service-type">
                      <SelectValue placeholder="Pilih Layanan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AKAP">AKAP (Bus Reguler)</SelectItem>
                      <SelectItem value="WISATA">Pariwisata / Sewa</SelectItem>
                      <SelectItem value="SHUTTLE">Shuttle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="route-name" className="text-xs font-semibold">
                  Nama Trayek Perjalanan <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="route-name"
                  placeholder="mis. Jakarta / Tangerang - Yogyakarta (Via Magelang)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="route-origin" className="text-xs font-semibold">
                    Kota Asal Keberangkatan <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-emerald-600" />
                    <Input
                      id="route-origin"
                      placeholder="mis. JAKARTA"
                      value={formData.origin}
                      onChange={(e) =>
                        setFormData({ ...formData, origin: e.target.value.toUpperCase() })
                      }
                      className="pl-8 uppercase"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="route-destination" className="text-xs font-semibold">
                    Kota Tujuan Kepulangan <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-blue-600" />
                    <Input
                      id="route-destination"
                      placeholder="mis. YOGYAKARTA"
                      value={formData.destination}
                      onChange={(e) =>
                        setFormData({ ...formData, destination: e.target.value.toUpperCase() })
                      }
                      className="pl-8 uppercase"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="route-via" className="text-xs font-semibold">
                  Lintasan / Checkpoint Via (Opsional)
                </Label>
                <Input
                  id="route-via"
                  placeholder="mis. Bawen - Magelang - Jombor"
                  value={formData.via || ''}
                  onChange={(e) => setFormData({ ...formData, via: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="distance-km" className="text-xs font-semibold">
                    Estimasi Jarak Tempuh (KM)
                  </Label>
                  <Input
                    id="distance-km"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="mis. 540"
                    value={formData.distanceKm ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        distanceKm: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="estimated-hours" className="text-xs font-semibold">
                    Estimasi Waktu Tempuh (Jam)
                  </Label>
                  <Input
                    id="estimated-hours"
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="mis. 9.5"
                    value={formData.estimatedHours ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimatedHours: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border rounded-lg p-3 bg-muted/20">
                <div className="space-y-0.5">
                  <Label htmlFor="is-active" className="text-sm font-medium">
                    Status Rute Aktif
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Rute aktif akan muncul dalam pemilihan jadwal perjalanan dan SPJ operasional.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is-active"
                    checked={formData.isActive}
                    onCheckedChange={(checked: boolean) =>
                      setFormData({ ...formData, isActive: !!checked })
                    }
                  />
                  <Label htmlFor="is-active" className="text-xs font-semibold cursor-pointer">
                    {formData.isActive ? 'Aktif' : 'Non-Aktif'}
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={modalLoading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={modalLoading}
              >
                {modalLoading ? 'Menyimpan...' : selectedRoute ? 'Simpan Perubahan' : 'Buat Rute'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!routeToDelete}
        onOpenChange={(open) => !open && setRouteToDelete(null)}
        title="Hapus Rute Trayek?"
        description={`Apakah Anda yakin ingin menghapus rute trayek '${routeToDelete?.name}' (${routeToDelete?.code})? Tindakan ini tidak dapat dibatalkan jika rute sudah terikat dengan jadwal SPJ.`}
        confirmText="Hapus Rute"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
