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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Bus, Image as ImageIcon, Check } from 'lucide-react';
import { VehicleService } from '@/services/vehicle.service';
import type {
  Vehicle,
  VehicleFormData,
  VehicleType,
  OwnershipStatus,
  SeatClassName,
  SeatClass,
} from '@/types';

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
    capacity: 0,
    year: new Date().getFullYear(),
    isActive: true,
    seatClasses: [
      {
        className: 'LUXURY_2_1',
        seatCapacity: 24,
        seatLayout: '2-1 Luxury',
      },
    ],
    images: [
      {
        imageUrl:
          'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
        caption: 'Foto Utama Eksterior',
        isPrimary: true,
        sequence: 0,
      },
    ],
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
        isActive: vehicle.isActive,
        seatClasses:
          vehicle.seatClasses?.map((sc) => ({
            seatClassId: sc.seatClassId || sc.seatClass?.id,
            className: sc.className,
            seatCapacity: sc.seatCapacity,
            seatLayout: sc.seatLayout || '',
          })) || [],
        images:
          vehicle.images && vehicle.images.length > 0
            ? vehicle.images.map((img) => ({
                imageUrl: img.imageUrl,
                caption: img.caption || '',
                isPrimary: img.isPrimary,
                sequence: img.sequence,
              }))
            : [
                {
                  imageUrl:
                    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
                  caption: 'Foto Eksterior',
                  isPrimary: true,
                  sequence: 0,
                },
              ],
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
          { className: 'SLEEPER', seatCapacity: 4, seatLayout: '1-1' },
          { className: 'LUXURY_2_1', seatCapacity: 20, seatLayout: '2-1' },
        ],
        images: [
          {
            imageUrl:
              'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
            caption: 'Eksterior Bus',
            isPrimary: true,
            sequence: 0,
          },
        ],
      });
    }
  }, [vehicle, isOpen]);

  const calculateTotalCapacity = (classes: any[]) => {
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
        seatCapacity: 28,
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

  const handleSeatClassCapacityChange = (index: number, value: any) => {
    const updated = [...(formData.seatClasses || [])];
    updated[index] = {
      ...updated[index],
      seatCapacity: Number(value) || 0,
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
    await onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Bus className="h-6 w-6 text-primary" />
            {vehicle
              ? `Edit Armada Bus: ${vehicle.code}`
              : 'Tambah Armada Bus Baru'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Baris 1: Kode Lambung & Plat Nomor */}
          <div className="grid grid-cols-2 gap-4">
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
                required
              />
            </div>
          </div>

          {/* Baris 2: Julukan Bus & Tipe Kendaraan */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="nickname" className="text-xs font-semibold">
                Julukan Armada (Nickname)
              </Label>
              <Input
                id="nickname"
                placeholder="Contoh: Executive Combi"
                value={formData.nickname}
                onChange={(e) =>
                  setFormData({ ...formData, nickname: e.target.value })
                }
              />
            </div>
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
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Tipe Kendaraan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BIG_BUS">Big Bus (Kapasitas Besar)</SelectItem>
                  <SelectItem value="MEDIUM_BUS">Medium Bus</SelectItem>
                  <SelectItem value="MINIBUS">Minibus / HiAce</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Baris 3: Model Chasis & Karoseri */}
          <div className="grid grid-cols-2 gap-4">
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
              />
            </div>
          </div>

          {/* Baris 4: Status Kepemilikan & Tahun Rakit */}
          <div className="grid grid-cols-2 gap-4">
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
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OWNED_PAID_OFF">
                    Milik Sendiri (Lunas)
                  </SelectItem>
                  <SelectItem value="LEASING">
                    Cicilan Bank / Leasing Armada
                  </SelectItem>
                  <SelectItem value="RENTAL">Sewa Mitra</SelectItem>
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
                value={formData.year}
                onChange={(e) =>
                  setFormData({ ...formData, year: Number(e.target.value) })
                }
              />
            </div>
          </div>

          {/* Konfigurasi Multi-Class Kursi dengan Master Data */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between mb-2">
              <div>
                <Label className="text-sm font-bold flex items-center gap-1.5">
                  Konfigurasi Kelas Kursi (*Multi-Class*)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Terintegrasi dengan Master Data Kelas Kursi. Total Kapasitas:{' '}
                  <strong className="text-primary font-bold">
                    {formData.capacity || 0} Kursi
                  </strong>
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSeatClass}
                className="gap-1 text-xs"
              >
                <Plus className="h-3.5 w-3.5" /> Tambah Kelas Kursi
              </Button>
            </div>

            <div className="space-y-2">
              {/* Header Kolom Konfigurasi Kursi */}
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-md text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <div className="w-1/3">Kelas Kursi</div>
                <div className="w-1/4">Kapasitas (Seat)</div>
                <div className="flex-1">Format Layout Denah</div>
                {(formData.seatClasses?.length || 0) > 1 ? (
                  <div className="w-9 text-center">Aksi</div>
                ) : null}
              </div>

              {formData.seatClasses?.map((sc, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2.5 bg-slate-50/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 rounded-lg text-sm"
                >
                  <div className="w-1/3">
                    <Select
                      value={sc.className}
                      onValueChange={(val: string) =>
                        handleSelectSeatClassMaster(index, val)
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Pilih Kelas Kursi" />
                      </SelectTrigger>
                      <SelectContent>
                        {masterSeatClasses.map((m) => (
                          <SelectItem key={m.id} value={m.code}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-1/4">
                    <Input
                      type="number"
                      min={1}
                      className="h-9"
                      placeholder="Jml Kursi"
                      value={sc.seatCapacity}
                      onChange={(e) =>
                        handleSeatClassCapacityChange(index, e.target.value)
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      className="h-9 font-mono text-xs"
                      placeholder="Layout (misal: 1-1 / 2-1)"
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
                      className="h-9 w-9 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Galeri Foto Armada (Landing Page Ready) */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between mb-2">
              <div>
                <Label className="text-sm font-bold flex items-center gap-1.5">
                  <ImageIcon className="h-4 w-4 text-primary" /> Galeri Foto Armada (*Landing Page Catalog*)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Foto bus akan ditampilkan di katalog publik / website SS Traveling.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddImage}
                className="gap-1 text-xs"
              >
                <Plus className="h-3.5 w-3.5" /> Tambah Foto
              </Button>
            </div>

            <div className="space-y-2">
              {/* Header Kolom Foto */}
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-muted/70 rounded-md text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <div className="w-1/2">URL Foto (HTTPS)</div>
                <div className="flex-1">Keterangan / Caption</div>
                <div className="w-16 text-center">Cover</div>
                <div className="w-9 text-center">Aksi</div>
              </div>

              {formData.images?.map((img, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border text-sm"
                >
                  <div className="w-1/2">
                    <Input
                      className="h-9 text-xs font-mono"
                      placeholder="https://..."
                      value={img.imageUrl}
                      onChange={(e) =>
                        handleImageChange(index, 'imageUrl', e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      className="h-9 text-xs"
                      placeholder="Contoh: Eksterior Depan"
                      value={img.caption || ''}
                      onChange={(e) =>
                        handleImageChange(index, 'caption', e.target.value)
                      }
                    />
                  </div>
                  <div className="w-16 flex justify-center">
                    <Button
                      type="button"
                      variant={img.isPrimary ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSetPrimaryImage(index)}
                      className="h-8 px-2 text-[10px] gap-1"
                      title={img.isPrimary ? 'Foto Sampul Utama' : 'Jadikan Sampul'}
                    >
                      {img.isPrimary ? <Check className="h-3 w-3" /> : 'Set'}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveImage(index)}
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-4 border-t gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? 'Menyimpan...'
                : vehicle
                ? 'Simpan Perubahan'
                : 'Tambahkan Armada'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
