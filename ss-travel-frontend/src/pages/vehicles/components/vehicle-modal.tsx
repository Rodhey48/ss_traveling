import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  Bus,
  Image as ImageIcon,
  Check,
  Star,
  Users,
  Sparkles,
  Layers,
  Loader2,
} from 'lucide-react';
import { VehicleService } from '@/services/vehicle.service';
import type {
  Vehicle,
  VehicleFormData,
  VehicleType,
  OwnershipStatus,
  SeatClassName,
  SeatClass,
} from '@/types';
import { toast } from 'sonner';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: VehicleFormData) => Promise<void>;
  vehicle?: Vehicle | null;
  loading?: boolean;
}

export default function VehicleModal({
  isOpen,
  onClose,
  onSubmit,
  vehicle,
  loading = false,
}: VehicleModalProps) {
  const [masterSeatClasses, setMasterSeatClasses] = useState<SeatClass[]>([]);
  const [formData, setFormData] = useState<VehicleFormData>({
    code: '',
    nickname: '',
    plateNumber: '',
    vehicleType: 'BIG_BUS',
    chassisModel: '',
    bodyModel: '',
    ownershipStatus: 'OWNED_PAID_OFF',
    capacity: 24,
    year: new Date().getFullYear(),
    isActive: true,
    seatClasses: [
      {
        className: 'LUXURY_2_1',
        seatCapacity: 24,
        seatLayout: '2-1 Luxury',
      },
    ],
    images: [],
  });

  // Fetch Master Kelas Kursi saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      VehicleService.getSeatClasses()
        .then((res) => {
          if (res.status && res.data) {
            setMasterSeatClasses(res.data);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (vehicle) {
      setFormData({
        code: vehicle.code,
        nickname: vehicle.nickname || '',
        plateNumber: vehicle.plateNumber,
        vehicleType: vehicle.vehicleType,
        chassisModel: vehicle.chassisModel || '',
        bodyModel: vehicle.bodyModel || '',
        ownershipStatus: vehicle.ownershipStatus,
        capacity: vehicle.capacity,
        year: vehicle.year || new Date().getFullYear(),
        isActive: vehicle.isActive ?? true,
        seatClasses:
          vehicle.seatClasses && vehicle.seatClasses.length > 0
            ? vehicle.seatClasses.map((sc) => ({
                seatClassId: sc.seatClassId || sc.seatClass?.id,
                className: sc.className,
                seatCapacity: sc.seatCapacity,
                seatLayout: sc.seatLayout || '',
              }))
            : [
                {
                  className: 'LUXURY_2_1',
                  seatCapacity: vehicle.capacity || 24,
                  seatLayout: '2-1',
                },
              ],
        images:
          vehicle.images && vehicle.images.length > 0
            ? vehicle.images.map((img) => ({
                imageUrl: img.imageUrl,
                caption: img.caption || '',
                isPrimary: img.isPrimary,
                sequence: img.sequence,
              }))
            : [],
      });
    } else {
      setFormData({
        code: '',
        nickname: '',
        plateNumber: '',
        vehicleType: 'BIG_BUS',
        chassisModel: '',
        bodyModel: '',
        ownershipStatus: 'OWNED_PAID_OFF',
        capacity: 24,
        year: new Date().getFullYear(),
        isActive: true,
        seatClasses: [
          { className: 'SLEEPER', seatCapacity: 4, seatLayout: '1-1 Sleeper' },
          { className: 'LUXURY_2_1', seatCapacity: 20, seatLayout: '2-1 Luxury' },
        ],
        images: [
          {
            imageUrl:
              'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
            caption: 'Foto Utama Eksterior Depan',
            isPrimary: true,
            sequence: 0,
          },
        ],
      });
    }
  }, [vehicle, isOpen]);

  const calculateTotalCapacity = (
    classes: Array<{ seatCapacity?: number }>,
  ) => {
    return classes.reduce(
      (sum, item) => sum + (Number(item.seatCapacity) || 0),
      0,
    );
  };

  const handleAddSeatClass = () => {
    const defaultMaster = masterSeatClasses[0];
    const updated = [
      ...(formData.seatClasses || []),
      {
        seatClassId: defaultMaster?.id,
        className:
          ((defaultMaster?.code as unknown) as SeatClassName) || 'EXECUTIVE',
        seatCapacity: 20,
        seatLayout: defaultMaster?.defaultLayout || '2-2',
      },
    ];
    setFormData({
      ...formData,
      seatClasses: updated,
      capacity: calculateTotalCapacity(updated),
    });
  };

  const handleRemoveSeatClass = (index: number) => {
    const updated = (formData.seatClasses || []).filter(
      (_, idx) => idx !== index,
    );
    setFormData({
      ...formData,
      seatClasses: updated,
      capacity: calculateTotalCapacity(updated),
    });
  };

  const handleSelectSeatClassMaster = (
    index: number,
    selectedCode: string,
  ) => {
    const master = masterSeatClasses.find((m) => m.code === selectedCode);
    const updated = [...(formData.seatClasses || [])];
    updated[index] = {
      ...updated[index],
      seatClassId: master?.id,
      className: selectedCode as SeatClassName,
      seatLayout: master?.defaultLayout || updated[index].seatLayout || '',
    };
    setFormData({
      ...formData,
      seatClasses: updated,
      capacity: calculateTotalCapacity(updated),
    });
  };

  const handleSeatClassCapacityChange = (
    index: number,
    value: string | number,
  ) => {
    const updated = [...(formData.seatClasses || [])];
    updated[index] = {
      ...updated[index],
      seatCapacity: Math.max(0, Number(value) || 0),
    };
    setFormData({
      ...formData,
      seatClasses: updated,
      capacity: calculateTotalCapacity(updated),
    });
  };

  const handleSeatClassLayoutChange = (index: number, value: string) => {
    const updated = [...(formData.seatClasses || [])];
    updated[index] = {
      ...updated[index],
      seatLayout: value,
    };
    setFormData({
      ...formData,
      seatClasses: updated,
    });
  };

  // --- IMAGES HANDLERS ---
  const handleAddImage = () => {
    const updated = [
      ...(formData.images || []),
      {
        imageUrl: '',
        caption: '',
        isPrimary: (formData.images || []).length === 0,
        sequence: (formData.images || []).length,
      },
    ];
    setFormData({ ...formData, images: updated });
  };

  const handleRemoveImage = (index: number) => {
    const updated = (formData.images || []).filter((_, idx) => idx !== index);
    if (updated.length > 0 && !updated.some((img) => img.isPrimary)) {
      updated[0].isPrimary = true;
    }
    setFormData({ ...formData, images: updated });
  };

  const handleImageChange = (
    index: number,
    field: 'imageUrl' | 'caption',
    value: string,
  ) => {
    const updated = [...(formData.images || [])];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, images: updated });
  };

  const handleSetPrimaryImage = (index: number) => {
    const updated = (formData.images || []).map((img, idx) => ({
      ...img,
      isPrimary: idx === index,
    }));
    setFormData({ ...formData, images: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim()) {
      toast.error('Nomor lambung bus wajib diisi (misal: SS-01)');
      return;
    }
    if (!formData.plateNumber.trim()) {
      toast.error('Plat nomor kendaraan wajib diisi (misal: B 7123 SS)');
      return;
    }

    // Filter gambar kosong
    const validImages = (formData.images || []).filter((img) =>
      img.imageUrl.trim().startsWith('http'),
    );

    const payload: VehicleFormData = {
      ...formData,
      code: formData.code.trim().toUpperCase(),
      plateNumber: formData.plateNumber.trim().toUpperCase(),
      nickname: formData.nickname?.trim(),
      chassisModel: formData.chassisModel?.trim(),
      bodyModel: formData.bodyModel?.trim(),
      capacity: calculateTotalCapacity(formData.seatClasses || []),
      images: validImages,
    };

    await onSubmit(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-xl font-bold">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Bus className="h-5 w-5" />
            </div>
            <div>
              <div>{vehicle ? `Edit Armada Bus: ${vehicle.code}` : 'Tambah Armada Bus Baru'}</div>
              <p className="text-xs text-muted-foreground font-normal mt-0.5">
                Kelola data registrasi fisik armada, zona kabin multi-class, dan katalog foto showcase.
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* SECTION 1: Identitas & Spesifikasi Fisik */}
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-white/5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-2">
              <div className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-primary" /> 1. Data Identitas & Fisik Kendaraan
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">
                Wajib Lengkap
              </Badge>
            </div>

            {/* Baris 1: Kode Lambung, Plat Nomor & Julukan */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="code" className="text-xs font-semibold">
                  Nomor Lambung <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="code"
                  placeholder="Contoh: SS-01"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  className="font-mono font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="plateNumber" className="text-xs font-semibold">
                  Plat Nomor Kendaraan <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="plateNumber"
                  placeholder="Contoh: B 7123 SS"
                  value={formData.plateNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      plateNumber: e.target.value.toUpperCase(),
                    })
                  }
                  className="font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="nickname" className="text-xs font-semibold">
                  Julukan Armada (Nickname)
                </Label>
                <Input
                  id="nickname"
                  placeholder="Contoh: Executive Combi / Royal Sleeper"
                  value={formData.nickname}
                  onChange={(e) =>
                    setFormData({ ...formData, nickname: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Baris 2: Tipe Bus, Chasis & Karoseri */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="vehicleType" className="text-xs font-semibold">
                  Tipe Kendaraan
                </Label>
                <Select
                  value={formData.vehicleType}
                  onValueChange={(val: VehicleType) =>
                    setFormData({ ...formData, vehicleType: val })
                  }
                >
                  <SelectTrigger id="vehicleType" className="h-9">
                    <SelectValue placeholder="Pilih Tipe Kendaraan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BIG_BUS">Big Bus (Kapasitas Besar)</SelectItem>
                    <SelectItem value="MEDIUM_BUS">Medium Bus</SelectItem>
                    <SelectItem value="MINIBUS">Minibus / HiAce</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="chassisModel" className="text-xs font-semibold">
                  Model Chasis Mesin
                </Label>
                <Input
                  id="chassisModel"
                  placeholder="Contoh: Mercedes-Benz OH 1626 / Hino RK8"
                  value={formData.chassisModel}
                  onChange={(e) =>
                    setFormData({ ...formData, chassisModel: e.target.value })
                  }
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="bodyModel" className="text-xs font-semibold">
                  Model Bodi / Karoseri
                </Label>
                <Input
                  id="bodyModel"
                  placeholder="Contoh: Jetbus 5 Combi / Avante H8"
                  value={formData.bodyModel}
                  onChange={(e) =>
                    setFormData({ ...formData, bodyModel: e.target.value })
                  }
                  className="text-xs"
                />
              </div>
            </div>

            {/* Baris 3: Status Kepemilikan, Tahun Rakit & Status Operasional */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="ownershipStatus" className="text-xs font-semibold">
                  Status Kepemilikan Aset
                </Label>
                <Select
                  value={formData.ownershipStatus}
                  onValueChange={(val: OwnershipStatus) =>
                    setFormData({ ...formData, ownershipStatus: val })
                  }
                >
                  <SelectTrigger id="ownershipStatus" className="h-9">
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OWNED_PAID_OFF">
                      Milik Sendiri (Lunas)
                    </SelectItem>
                    <SelectItem value="LEASING">
                      Cicilan Bank / Leasing Armada
                    </SelectItem>
                    <SelectItem value="RENTAL">Sewa Mitra (Rental)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="year" className="text-xs font-semibold">
                  Tahun Pembuatan / Registrasi
                </Label>
                <Input
                  id="year"
                  type="number"
                  min={1990}
                  max={new Date().getFullYear() + 1}
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: Number(e.target.value) })
                  }
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="isActive" className="text-xs font-semibold">
                  Status Kesiapan Operasional
                </Label>
                <Select
                  value={formData.isActive ? 'ACTIVE' : 'INACTIVE'}
                  onValueChange={(val) =>
                    setFormData({ ...formData, isActive: val === 'ACTIVE' })
                  }
                >
                  <SelectTrigger id="isActive" className="h-9">
                    <SelectValue placeholder="Pilih Status Operasional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Aktif Beroperasi
                      </span>
                    </SelectItem>
                    <SelectItem value="INACTIVE">
                      <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        Non-Aktif / Perawatan Garasi
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* SECTION 2: Konfigurasi Multi-Class Kursi */}
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-white/5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-2">
              <div>
                <div className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-primary" /> 2. Konfigurasi Zona Kabin (*Multi-Class*)
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Kapasitas total kursi dihitung otomatis dari akumulasi zona kelas kursi bus.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/10 text-primary hover:bg-primary/15 border-primary/20 text-xs px-2.5 py-1">
                  Total: {formData.capacity || 0} Kursi
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddSeatClass}
                  className="gap-1 text-xs h-7.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Tambah Zona
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {/* Header Kolom */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-white/10 rounded-lg text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <div className="w-1/3">Standar Kelas Kursi</div>
                <div className="w-1/4">Jumlah Kursi</div>
                <div className="flex-1">Format Layout Denah</div>
                {(formData.seatClasses?.length || 0) > 1 && (
                  <div className="w-8 text-center">Hapus</div>
                )}
              </div>

              {formData.seatClasses?.map((sc, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-white dark:bg-zinc-900/60 border border-slate-200/80 dark:border-white/10 rounded-lg text-sm shadow-2xs"
                >
                  <div className="w-1/3">
                    <Select
                      value={sc.className}
                      onValueChange={(val: string) =>
                        handleSelectSeatClassMaster(index, val)
                      }
                    >
                      <SelectTrigger className="h-8.5 text-xs">
                        <SelectValue placeholder="Pilih Kelas Kursi" />
                      </SelectTrigger>
                      <SelectContent>
                        {masterSeatClasses.map((m) => (
                          <SelectItem key={m.id} value={m.code} className="text-xs">
                            {m.name} ({m.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-1/4">
                    <Input
                      type="number"
                      min={1}
                      className="h-8.5 text-xs font-bold text-primary"
                      placeholder="Jml Kursi"
                      value={sc.seatCapacity}
                      onChange={(e) =>
                        handleSeatClassCapacityChange(index, e.target.value)
                      }
                    />
                  </div>

                  <div className="flex-1">
                    <Input
                      className="h-8.5 font-mono text-xs"
                      placeholder="Format (misal: 1-1 / 2-1 / 2-2)"
                      value={sc.seatLayout || ''}
                      onChange={(e) =>
                        handleSeatClassLayoutChange(index, e.target.value)
                      }
                    />
                  </div>

                  {(formData.seatClasses?.length || 0) > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveSeatClass(index)}
                      className="h-8.5 w-8 text-destructive hover:bg-destructive/10"
                      title="Hapus baris kelas kursi"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: Galeri Foto Armada Bus */}
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/60 dark:bg-white/5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-2">
              <div>
                <div className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="h-4 w-4 text-primary" /> 3. Galeri Foto Armada (*Website & Katalog*)
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Foto resolusi tinggi untuk katalog publik dan identifikasi operasional armada bus.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddImage}
                className="gap-1 text-xs h-7.5"
              >
                <Plus className="h-3.5 w-3.5" /> Tambah Foto
              </Button>
            </div>

            {(!formData.images || formData.images.length === 0) ? (
              <div className="p-6 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-xl bg-white/40 dark:bg-zinc-900/40">
                <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground opacity-30 mb-2" />
                <p className="text-xs font-medium text-foreground">
                  Belum ada foto armada ditambahkan
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 mb-3">
                  Tambahkan tautan gambar eksterior atau interior bus agar tampil di katalog.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddImage}
                  className="text-xs gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Tambahkan Foto Pertama
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {formData.images.map((img, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row sm:items-center gap-2.5 p-2.5 bg-white dark:bg-zinc-900/60 border border-slate-200/80 dark:border-white/10 rounded-xl shadow-2xs"
                  >
                    {/* Live Image Preview Thumbnail */}
                    <div className="relative h-12 w-20 rounded-lg overflow-hidden bg-muted/60 shrink-0 border border-slate-200/60 dark:border-white/10 flex items-center justify-center">
                      {img.imageUrl ? (
                        <img
                          src={img.imageUrl}
                          alt={img.caption || 'Thumbnail'}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Bus className="h-5 w-5 text-muted-foreground opacity-40" />
                      )}
                      {img.isPrimary && (
                        <div className="absolute top-0.5 right-0.5 bg-primary text-[8px] text-white px-1 py-0.2 rounded-xs font-bold">
                          COVER
                        </div>
                      )}
                    </div>

                    {/* URL Input */}
                    <div className="flex-1 space-y-1">
                      <Input
                        className="h-8 text-xs font-mono"
                        placeholder="https://..."
                        value={img.imageUrl}
                        onChange={(e) =>
                          handleImageChange(index, 'imageUrl', e.target.value)
                        }
                        required
                      />
                    </div>

                    {/* Caption Input */}
                    <div className="w-full sm:w-56 space-y-1">
                      <Input
                        className="h-8 text-xs"
                        placeholder="Keterangan (misal: Eksterior Depan)"
                        value={img.caption || ''}
                        onChange={(e) =>
                          handleImageChange(index, 'caption', e.target.value)
                        }
                      />
                    </div>

                    {/* Actions: Primary toggle & Delete */}
                    <div className="flex items-center gap-1.5 shrink-0 justify-end">
                      <Button
                        type="button"
                        variant={img.isPrimary ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSetPrimaryImage(index)}
                        className="h-8 px-2.5 text-[11px] gap-1"
                        title={img.isPrimary ? 'Foto Sampul Utama' : 'Jadikan Sampul Utama'}
                      >
                        {img.isPrimary ? (
                          <>
                            <Star className="h-3 w-3 fill-current" /> Cover
                          </>
                        ) : (
                          'Jadikan Cover'
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveImage(index)}
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        title="Hapus Foto"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="pt-3 border-t border-slate-200/80 dark:border-white/10 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="text-xs h-9"
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading} className="text-xs h-9 gap-1.5">
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Menyimpan Data Armada...
                </>
              ) : vehicle ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Simpan Perubahan Armada
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" /> Daftarkan Armada Baru
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
