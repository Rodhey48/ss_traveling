import { useState, useEffect } from 'react';
import Heading from '@/components/shared/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
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
  Plus,
  Search,
  Bus,
  Edit,
  Trash2,
  LayoutGrid,
  List,
  Sparkles,
  Users,
  CheckCircle2,
  Clock,
  Armchair,
  Images,
  Eye,
} from 'lucide-react';
import VehicleModal from './components/vehicle-modal';
import SeatClassMasterModal from './components/seat-class-master-modal';
import VehicleDetailModal from './components/vehicle-detail-modal';
import { VehicleService } from '@/services/vehicle.service';
import type { Vehicle, VehicleFormData } from '@/types';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/use-permission';

export default function VehiclesPage() {
  const { isCreate, isUpdate, isDelete } = usePermission();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSeatClassMasterOpen, setIsSeatClassMasterOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [detailVehicle, setDetailVehicle] = useState<Vehicle | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const response = await VehicleService.findAll({
        search,
        vehicleType: vehicleTypeFilter === 'ALL' ? undefined : vehicleTypeFilter,
        limit: 50,
      });
      if (response.status) {
        setVehicles(response.data.data);
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
  }, [search, vehicleTypeFilter]);

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

  const handleDelete = async (vehicle: Vehicle) => {
    if (
      !confirm(
        `Yakin ingin menghapus data bus ${vehicle.code} (${vehicle.plateNumber})?`,
      )
    ) {
      return;
    }
    try {
      await VehicleService.remove(vehicle.id);
      toast.success(`Armada ${vehicle.code} berhasil dihapus`);
      fetchVehicles();
    } catch (error: any) {
      toast.error('Gagal menghapus armada', {
        description: error.response?.data?.message,
      });
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
        toast.success(`Armada baru ${data.code} berhasil ditambahkan`);
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

  // Metrik Ringkas
  const totalBus = vehicles.length;
  const totalBigBus = vehicles.filter((v) => v.vehicleType === 'BIG_BUS').length;
  const totalOwned = vehicles.filter((v) => v.ownershipStatus === 'OWNED_PAID_OFF').length;
  const totalLeasing = vehicles.filter((v) => v.ownershipStatus === 'LEASING').length;

  return (
    <div className="space-y-6 p-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Heading
          title="Manajemen Armada Bus (Fleet & Website Catalog)"
          description="Kelola data fisik armada SS-01 s.d. SS-10, foto landing page, dan konfigurasi kelas kursi multi-class."
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsSeatClassMasterOpen(true)}
            className="gap-2"
          >
            <Armchair className="h-4 w-4 text-primary" /> Master Kelas Kursi
          </Button>
          {isCreate && (
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Tambah Armada
            </Button>
          )}
        </div>
      </div>

      {/* Kartu Statistik */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Total Unit Armada</CardDescription>
            <CardTitle className="text-2xl font-black text-primary flex items-center justify-between">
              {totalBus} Bus
              <Bus className="h-6 w-6 opacity-40" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Big Bus Executive/Combi</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between">
              {totalBigBus} Unit
              <Sparkles className="h-6 w-6 text-amber-500 opacity-60" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Aset Milik Sendiri (Lunas)</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600 flex items-center justify-between">
              {totalOwned} Unit
              <CheckCircle2 className="h-6 w-6 opacity-60" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Cicilan Bank / Leasing</CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-600 flex items-center justify-between">
              {totalLeasing} Unit
              <Clock className="h-6 w-6 opacity-60" />
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filter & Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari kode lambung, nopol, julukan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={vehicleTypeFilter} onValueChange={setVehicleTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Semua Tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Tipe Bus</SelectItem>
              <SelectItem value="BIG_BUS">Big Bus</SelectItem>
              <SelectItem value="MEDIUM_BUS">Medium Bus</SelectItem>
              <SelectItem value="MINIBUS">Minibus</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1 border rounded-lg p-1 bg-muted/40">
          <Button
            variant={viewMode === 'card' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('card')}
            className="h-8 px-2 gap-1.5 text-xs"
          >
            <LayoutGrid className="h-4 w-4" /> Kartu
          </Button>
          <Button
            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
            className="h-8 px-2 gap-1.5 text-xs"
          >
            <List className="h-4 w-4" /> Tabel
          </Button>
        </div>
      </div>

      {/* Tampilan Konten: Card vs Table */}
      {loading ? (
        <div className="p-12 text-center text-sm text-muted-foreground border rounded-xl bg-card">
          Memuat data armada bus...
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {vehicles.map((v) => {
            const primaryImage =
              v.images?.find((img) => img.isPrimary) || v.images?.[0];

            return (
              <Card
                key={v.id}
                onClick={() => handleViewDetail(v)}
                className="group overflow-hidden border hover:border-primary/60 transition-all hover:shadow-lg cursor-pointer bg-card flex flex-col justify-between"
              >
                <div>
                  {/* Foto Sampul Bus (Landing Page Ready) */}
                  <div className="relative h-44 w-full bg-muted/50 overflow-hidden">
                    {primaryImage ? (
                      <img
                        src={primaryImage.imageUrl}
                        alt={primaryImage.caption || v.nickname || v.code}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/20">
                        <Bus className="h-10 w-10 opacity-30 mb-1" />
                        <span className="text-[11px]">Belum ada foto</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

                    {/* Badge Nomor Lambung & Nopol */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <Badge className="bg-primary/95 text-primary-foreground font-mono font-bold text-xs backdrop-blur-sm">
                        {v.code}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-black/60 text-white font-mono text-[11px] border-white/20 backdrop-blur-sm"
                      >
                        {v.plateNumber}
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

                    {/* Julukan Bus di atas gradien foto */}
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between text-white">
                      <div>
                        <p className="text-xs text-white/80 font-medium">
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
                    {/* Spesifikasi Chasis & Bodi */}
                    <div className="bg-muted/40 p-2.5 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Chasis:</span>
                        <span
                          className="font-medium truncate max-w-[170px]"
                          title={v.chassisModel}
                        >
                          {v.chassisModel || '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Karoseri:</span>
                        <span
                          className="font-medium truncate max-w-[170px]"
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
                          <Users className="h-3.5 w-3.5 text-primary" /> Kapasitas
                        </span>
                        <span className="font-bold text-sm text-primary">
                          {v.capacity} Kursi
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {v.seatClasses?.map((sc) => (
                          <Badge
                            key={sc.id}
                            variant="secondary"
                            className="text-[10px] font-medium py-0.5 px-1.5 bg-background border"
                          >
                            {sc.className === 'SLEEPER' && '🛏️ Sleeper: '}
                            {sc.className === 'LUXURY_2_1' && '👑 Luxury: '}
                            {sc.className === 'EXECUTIVE' && '⭐ Exec: '}
                            {sc.className === 'STANDARD' && 'Std: '}
                            <strong className="ml-0.5">{sc.seatCapacity}</strong>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Kartu & Aksi */}
                <div className="p-4 pt-2 border-t flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Eye className="h-3 w-3" /> Klik untuk rincian
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
                          handleDelete(v);
                        }}
                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
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
        /* Tabel View */
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomor Lambung</TableHead>
                <TableHead>Plat Nomor</TableHead>
                <TableHead>Julukan</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Chasis & Karoseri</TableHead>
                <TableHead>Kapasitas & Kelas Kursi</TableHead>
                <TableHead>Kepemilikan</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((v) => (
                <TableRow
                  key={v.id}
                  onClick={() => handleViewDetail(v)}
                  className="cursor-pointer hover:bg-muted/40"
                >
                  <TableCell className="font-bold flex items-center gap-2">
                    {v.code}
                    {v.images && v.images.length > 0 && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0">
                        {v.images.length} Foto
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono">{v.plateNumber}</TableCell>
                  <TableCell>{v.nickname || '-'}</TableCell>
                  <TableCell>{v.vehicleType}</TableCell>
                  <TableCell className="text-xs">
                    <div>{v.chassisModel}</div>
                    <div className="text-muted-foreground">{v.bodyModel}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-sm text-primary mb-1">
                      {v.capacity} Kursi
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {v.seatClasses?.map((sc) => (
                        <Badge
                          key={sc.id}
                          variant="secondary"
                          className="text-[10px]"
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
                          ? 'text-emerald-600 bg-emerald-50'
                          : 'text-blue-600 bg-blue-50'
                      }
                    >
                      {v.ownershipStatus === 'OWNED_PAID_OFF'
                        ? 'Lunas'
                        : 'Leasing'}
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
                        className="h-8 w-8"
                        title="Lihat Detail"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {isUpdate && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(v);
                          }}
                          className="h-8 w-8"
                          title="Edit Armada"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {isDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(v);
                          }}
                          className="h-8 w-8 text-destructive"
                          title="Hapus Armada"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
    </div>
  );
}
