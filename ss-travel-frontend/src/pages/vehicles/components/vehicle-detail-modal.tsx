import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Vehicle } from '@/types';
import {
  Armchair,
  Bus,
  Calendar,
  Copy,
  Edit,
  Globe,
  Layers,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface VehicleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  onEdit?: (vehicle: Vehicle) => void;
}

export default function VehicleDetailModal({
  isOpen,
  onClose,
  vehicle,
  onEdit,
}: VehicleDetailModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setActiveImageIndex(0);
    setImageError(false);
  }, [vehicle, isOpen]);

  if (!vehicle) return null;

  const images = vehicle.images || [];
  const currentImage = images[activeImageIndex];

  const handleCopyBusInfo = () => {
    const info = `Armada ${vehicle.code} (${vehicle.plateNumber}) - ${vehicle.nickname || vehicle.vehicleType} | Kapasitas: ${vehicle.capacity} Kursi | ${vehicle.ownershipStatus === 'OWNED_PAID_OFF' ? 'Lunas' : 'Leasing'}`;
    navigator.clipboard.writeText(info);
    toast.success('Spesifikasi armada berhasil disalin!', {
      description: info,
    });
  };

  const isBusActive = vehicle.isActive !== false;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Detail Armada Bus {vehicle.code}</DialogTitle>
        </DialogHeader>

        {/* Banner Galeri Foto Bus (Website Showcase Ready) */}
        <div className="relative aspect-video w-full bg-slate-950 overflow-hidden flex items-center justify-center">
          {currentImage?.imageUrl && !imageError ? (
            <img
              src={currentImage.imageUrl}
              alt={currentImage.caption || vehicle.nickname || vehicle.code}
              className="w-full h-full object-cover transition-all duration-300"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
              <Bus className="h-14 w-14 opacity-25" />
              <span className="text-xs text-slate-400 font-medium">
                Belum ada foto galeri untuk armada ini
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/25 to-black/35 pointer-events-none" />

          {/* Badge Atas Kiri: Kode Lambung & Nopol */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground font-mono font-black text-xs px-2.5 py-1 backdrop-blur-md shadow-md">
              {vehicle.code}
            </Badge>
            <Badge
              variant="outline"
              className="bg-black/60 text-white font-mono text-xs backdrop-blur-md border-white/20"
            >
              {vehicle.plateNumber}
            </Badge>
            <Badge
              className={
                isBusActive
                  ? 'bg-emerald-500/90 text-white text-[11px] gap-1 backdrop-blur-md'
                  : 'bg-amber-500/90 text-white text-[11px] gap-1 backdrop-blur-md'
              }
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              {isBusActive ? 'Siap Operasi' : 'Perawatan Garasi'}
            </Badge>
          </div>

          {/* Badge Atas Kanan: Website Catalog Ready */}
          <div className="absolute top-4 right-12 flex items-center gap-2">
            {images.length > 0 && (
              <Badge
                className="bg-emerald-600/90 text-white gap-1 text-[11px] backdrop-blur-md"
              >
                <Globe className="h-3 w-3" /> Website Catalog Ready
              </Badge>
            )}
          </div>

          {/* Keterangan Foto di Bawah Banner */}
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
            <div className="space-y-0.5">
              <span className="text-xs text-white/70 font-semibold tracking-wide uppercase">
                {vehicle.vehicleType.replace('_', ' ')}
              </span>
              <h2 className="text-xl font-black drop-shadow-md">
                {vehicle.nickname || `Armada Bus ${vehicle.code}`}
              </h2>
              {currentImage?.caption && (
                <p className="text-xs text-white/80 drop-shadow line-clamp-1">
                  {currentImage.caption}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <Badge
                className={
                  vehicle.ownershipStatus === 'OWNED_PAID_OFF'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-blue-600 text-white font-semibold'
                }
              >
                {vehicle.ownershipStatus === 'OWNED_PAID_OFF'
                  ? 'Aset Lunas'
                  : 'Cicilan Leasing'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Thumbnail Navigator Foto (jika foto > 1) */}
        {images.length > 1 && (
          <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10 overflow-x-auto">
            {images.map((img, idx) => (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => {
                  setActiveImageIndex(idx);
                  setImageError(false);
                }}
                className={`relative h-14 w-24 rounded-md overflow-hidden border-2 transition-all shrink-0 ${
                  activeImageIndex === idx
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={img.imageUrl}
                  alt={img.caption || `Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                {img.isPrimary && (
                  <span className="absolute bottom-0 inset-x-0 bg-primary/95 text-[9px] text-white text-center font-bold">
                    COVER
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Konten Rincian Spesifikasi & Kabin */}
        <div className="p-6 space-y-6">
          {/* Grid Spesifikasi Teknis */}
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-primary" /> Spesifikasi Fisik & Registrasi Armada
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/80 dark:border-white/10 space-y-0.5">
                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Bus className="h-3.5 w-3.5 text-primary" /> Tipe Bus
                </div>
                <div className="font-bold text-sm">
                  {vehicle.vehicleType.replace('_', ' ')}
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/80 dark:border-white/10 space-y-0.5">
                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-primary" /> Total Kapasitas
                </div>
                <div className="font-bold text-sm text-primary">
                  {vehicle.capacity} Kursi
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/80 dark:border-white/10 space-y-0.5">
                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-primary" /> Tahun Rakit
                </div>
                <div className="font-bold text-sm">{vehicle.year || '-'}</div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/80 dark:border-white/10 space-y-0.5">
                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Kepemilikan
                </div>
                <div className="font-bold text-sm">
                  {vehicle.ownershipStatus === 'OWNED_PAID_OFF'
                    ? 'Milik Sendiri'
                    : vehicle.ownershipStatus === 'LEASING'
                    ? 'Cicilan Leasing'
                    : 'Sewa Rental'}
                </div>
              </div>
            </div>
          </div>

          {/* Model Chasis & Karoseri */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/80 dark:border-white/10">
              <span className="text-xs font-semibold text-muted-foreground block">
                Model Chasis Mesin:
              </span>
              <span className="font-medium text-sm text-foreground">
                {vehicle.chassisModel || 'Chasis Standar Mercedes-Benz / Hino'}
              </span>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/80 dark:border-white/10">
              <span className="text-xs font-semibold text-muted-foreground block">
                Model Bodi / Karoseri:
              </span>
              <span className="font-medium text-sm text-foreground">
                {vehicle.bodyModel || 'Karoseri Adiputro / Laksana'}
              </span>
            </div>
          </div>

          {/* Zona Konfigurasi Multi-Class Kursi */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Armchair className="h-4 w-4 text-primary" /> Konfigurasi Zona Kabin (*Multi-Class*)
              </h4>
              <Badge variant="secondary" className="font-mono text-xs">
                {vehicle.seatClasses?.length || 0} Zona Kelas
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {vehicle.seatClasses && vehicle.seatClasses.length > 0 ? (
                vehicle.seatClasses.map((sc) => {
                  const master = sc.seatClass;
                  return (
                    <Card
                      key={sc.id}
                      className="border border-slate-200/80 dark:border-white/10 shadow-none bg-slate-50/70 dark:bg-white/5"
                    >
                      <CardContent className="p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {sc.className === 'SLEEPER' && (
                              <span className="text-lg">🛏️</span>
                            )}
                            {sc.className === 'LUXURY_2_1' && (
                              <span className="text-lg">👑</span>
                            )}
                            {sc.className === 'EXECUTIVE' && (
                              <span className="text-lg">⭐</span>
                            )}
                            {sc.className === 'STANDARD' && (
                              <span className="text-lg">🚌</span>
                            )}
                            <div>
                              <div className="font-bold text-sm">
                                {master?.name || sc.className}
                              </div>
                              <div className="text-[11px] font-mono text-muted-foreground">
                                Layout: {sc.seatLayout || master?.defaultLayout || '-'}
                              </div>
                            </div>
                          </div>
                          <Badge className="font-bold bg-primary/10 text-primary border-primary/20">
                            {sc.seatCapacity} Kursi
                          </Badge>
                        </div>
                        {master?.description && (
                          <p className="text-xs text-muted-foreground pt-1 border-t border-slate-200/60 dark:border-white/5">
                            <Sparkles className="h-3 w-3 inline mr-1 text-amber-500" />
                            {master.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="col-span-2 p-4 text-center text-xs text-muted-foreground border rounded-lg">
                  Konfigurasi kelas kursi tunggal: {vehicle.capacity} Kursi Standar
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyBusInfo}
            className="gap-1.5 text-xs h-8.5"
          >
            <Copy className="h-3.5 w-3.5" /> Salin Ringkasan
          </Button>

          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(vehicle);
              }}
              className="gap-1.5 text-xs h-8.5"
            >
              <Edit className="h-3.5 w-3.5" /> Edit Data Bus
            </Button>
          )}

          <Button size="sm" onClick={onClose} className="text-xs h-8.5">
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
