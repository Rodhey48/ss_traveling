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
  ChevronLeft,
  ChevronRight,
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

  const images = vehicle?.images || [];
  const currentImage = images[activeImageIndex];

  // Keyboard navigation for image gallery
  useEffect(() => {
    if (!isOpen || images.length <= 1) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
        setImageError(false);
      } else if (e.key === 'ArrowRight') {
        setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
        setImageError(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, images.length]);

  if (!vehicle) return null;

  const handleCopyBusInfo = () => {
    const info = `Armada ${vehicle.code} (${vehicle.plateNumber}) - ${vehicle.nickname || vehicle.vehicleType} | Kapasitas: ${vehicle.capacity} Kursi | ${vehicle.ownershipStatus === 'OWNED_PAID_OFF' ? 'Lunas' : 'Leasing'}`;
    navigator.clipboard.writeText(info);
    toast.success('Spesifikasi armada berhasil disalin!', {
      description: info,
    });
  };

  const handlePrevImage = () => {
    if (images.length <= 1) return;
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setImageError(false);
  };

  const handleNextImage = () => {
    if (images.length <= 1) return;
    setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setImageError(false);
  };

  const isBusActive = vehicle.isActive !== false;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-full sm:max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl gap-0 border border-slate-200/80 dark:border-white/10 shadow-2xl [&>button]:z-50 [&>button]:bg-black/60 [&>button]:text-white [&>button]:hover:bg-black/80 [&>button]:rounded-full [&>button]:p-1.5 [&>button]:backdrop-blur-md [&>button]:border [&>button]:border-white/20 [&>button]:shadow-lg [&>button]:top-3 [&>button]:right-3">
        <DialogHeader className="sr-only">
          <DialogTitle>Detail Armada Bus {vehicle.code}</DialogTitle>
        </DialogHeader>

        {/* Gallery / Hero Image Banner */}
        <div className="relative w-full aspect-16/10 sm:aspect-16/8 md:aspect-21/9 min-h-[190px] max-h-[320px] bg-slate-950 overflow-hidden flex items-center justify-center shrink-0">
          {currentImage?.imageUrl && !imageError ? (
            <img
              src={currentImage.imageUrl}
              alt={currentImage.caption || vehicle.nickname || vehicle.code}
              className="w-full h-full object-cover transition-all duration-300 select-none"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 gap-2 p-6 text-center">
              <Bus className="h-12 w-12 sm:h-14 sm:w-14 opacity-25" />
              <span className="text-xs text-slate-400 font-medium">
                Belum ada foto galeri untuk armada ini
              </span>
            </div>
          )}

          {/* Subtle Bottom Vignette / Shadow */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

          {/* Badges on image: ONLY media badges (Photo Counter & Cover Badge) */}
          <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
            {currentImage?.isPrimary && (
              <Badge className="bg-primary/90 text-primary-foreground text-[10px] sm:text-xs font-bold px-2 py-0.5 backdrop-blur-md border border-white/20 shadow-md">
                FOTO UTAMA
              </Badge>
            )}
            {images.length > 1 && (
              <Badge
                variant="outline"
                className="bg-black/60 text-white text-[10px] sm:text-xs font-mono backdrop-blur-md border-white/20 px-2 py-0.5"
              >
                {activeImageIndex + 1} / {images.length} Foto
              </Badge>
            )}
          </div>

          {/* Navigasi Prev / Next Foto (jika foto > 1) */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevImage}
                aria-label="Foto sebelumnya"
                className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-all shadow-lg active:scale-95"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button
                type="button"
                onClick={handleNextImage}
                aria-label="Foto selanjutnya"
                className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-all shadow-lg active:scale-95"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </>
          )}

          {/* Caption Foto di Bagian Bawah Image (jika ada) */}
          {currentImage?.caption && (
            <div className="absolute bottom-2.5 sm:bottom-3 left-3 right-3 pointer-events-none">
              <p className="text-[11px] sm:text-xs text-white/90 drop-shadow line-clamp-1 font-medium bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 w-fit max-w-full">
                {currentImage.caption}
              </p>
            </div>
          )}
        </div>

        {/* Thumbnail Navigator Foto (jika foto > 1) */}
        {images.length > 1 && (
          <div className="flex items-center gap-2 p-2 sm:p-2.5 bg-slate-100/90 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10 overflow-x-auto shrink-0">
            {images.map((img, idx) => (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => {
                  setActiveImageIndex(idx);
                  setImageError(false);
                }}
                className={`relative h-11 w-18 sm:h-13 sm:w-22 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                  activeImageIndex === idx
                    ? 'border-primary ring-2 ring-primary/30 scale-[1.02]'
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
                  <span className="absolute bottom-0 inset-x-0 bg-primary/95 text-[8px] text-white text-center font-bold py-0.2">
                    COVER
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Konten Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Header Identitas Armada (In Normal Document Flow - Immune to Zoom/Mobile Overlapping) */}
          <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-slate-200/70 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02]">
            {/* Badges Bar - Flex Wrap: Adapts smoothly to all screens & zoom levels without collision */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-2.5">
              <Badge className="bg-primary text-primary-foreground font-mono font-black text-xs px-2.5 py-1 shadow-xs">
                {vehicle.code}
              </Badge>
              <Badge
                variant="outline"
                className="bg-background text-foreground font-mono text-xs font-bold border-slate-300 dark:border-white/20 shadow-xs"
              >
                {vehicle.plateNumber}
              </Badge>
              <Badge
                className={
                  isBusActive
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[11px] sm:text-xs font-semibold'
                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[11px] sm:text-xs font-semibold'
                }
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                    isBusActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                {isBusActive ? 'Siap Operasi' : 'Perawatan Garasi'}
              </Badge>
              <Badge
                className={
                  vehicle.ownershipStatus === 'OWNED_PAID_OFF'
                    ? 'bg-emerald-600 text-white font-semibold text-[11px] sm:text-xs'
                    : 'bg-blue-600 text-white font-semibold text-[11px] sm:text-xs'
                }
              >
                {vehicle.ownershipStatus === 'OWNED_PAID_OFF'
                  ? 'Aset Lunas'
                  : 'Cicilan Leasing'}
              </Badge>
              {images.length > 0 && (
                <Badge
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1 text-[11px] font-medium"
                >
                  <Globe className="h-3 w-3" /> Website Catalog Ready
                </Badge>
              )}
            </div>

            {/* Nama & Tipe Armada */}
            <div className="space-y-0.5">
              <span className="text-[10px] sm:text-xs text-muted-foreground font-bold tracking-wider uppercase block">
                {vehicle.vehicleType.replace(/_/g, ' ')}
              </span>
              <h2 className="text-lg sm:text-2xl font-black text-foreground tracking-tight break-words">
                {vehicle.nickname || `Armada Bus ${vehicle.code}`}
              </h2>
            </div>
          </div>

          {/* Rincian Spesifikasi & Kabin */}
          <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
            {/* Grid Spesifikasi Fisik */}
            <div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 sm:mb-3 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-primary shrink-0" /> Spesifikasi Fisik & Registrasi Armada
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                <div className="p-2.5 sm:p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/80 dark:border-white/10 space-y-0.5 min-w-0">
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium truncate">
                    <Bus className="h-3.5 w-3.5 text-primary shrink-0" /> Tipe Bus
                  </div>
                  <div className="font-bold text-xs sm:text-sm text-foreground break-words">
                    {vehicle.vehicleType.replace(/_/g, ' ')}
                  </div>
                </div>

                <div className="p-2.5 sm:p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/80 dark:border-white/10 space-y-0.5 min-w-0">
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium truncate">
                    <Users className="h-3.5 w-3.5 text-primary shrink-0" /> Total Kapasitas
                  </div>
                  <div className="font-bold text-xs sm:text-sm text-primary break-words">
                    {vehicle.capacity} Kursi
                  </div>
                </div>

                <div className="p-2.5 sm:p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/80 dark:border-white/10 space-y-0.5 min-w-0">
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium truncate">
                    <Calendar className="h-3.5 w-3.5 text-primary shrink-0" /> Tahun Rakit
                  </div>
                  <div className="font-bold text-xs sm:text-sm text-foreground break-words">
                    {vehicle.year || '-'}
                  </div>
                </div>

                <div className="p-2.5 sm:p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/80 dark:border-white/10 space-y-0.5 min-w-0">
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium truncate">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" /> Kepemilikan
                  </div>
                  <div className="font-bold text-xs sm:text-sm text-foreground break-words">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <div className="p-3 sm:p-3.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/80 dark:border-white/10 space-y-0.5 min-w-0">
                <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground block">
                  Model Chasis Mesin:
                </span>
                <span className="font-medium text-xs sm:text-sm text-foreground break-words">
                  {vehicle.chassisModel || 'Chasis Standar Mercedes-Benz / Hino'}
                </span>
              </div>
              <div className="p-3 sm:p-3.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/80 dark:border-white/10 space-y-0.5 min-w-0">
                <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground block">
                  Model Bodi / Karoseri:
                </span>
                <span className="font-medium text-xs sm:text-sm text-foreground break-words">
                  {vehicle.bodyModel || 'Karoseri Adiputro / Laksana'}
                </span>
              </div>
            </div>

            {/* Zona Konfigurasi Multi-Class Kursi */}
            <div>
              <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Armchair className="h-4 w-4 text-primary shrink-0" /> Konfigurasi Zona Kabin (*Multi-Class*)
                </h4>
                <Badge variant="secondary" className="font-mono text-[11px] sm:text-xs">
                  {vehicle.seatClasses?.length || 0} Zona Kelas
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {vehicle.seatClasses && vehicle.seatClasses.length > 0 ? (
                  vehicle.seatClasses.map((sc) => {
                    const master = sc.seatClass;
                    return (
                      <Card
                        key={sc.id}
                        className="border border-slate-200/80 dark:border-white/10 shadow-none bg-slate-50/70 dark:bg-white/5"
                      >
                        <CardContent className="p-3 sm:p-3.5 space-y-2">
                          <div className="flex items-start sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-lg shrink-0">
                                {sc.className === 'SLEEPER' ? '🛏️' :
                                 sc.className === 'LUXURY_2_1' ? '👑' :
                                 sc.className === 'EXECUTIVE' ? '⭐' :
                                 sc.className === 'STANDARD' ? '🚌' : '💺'}
                              </span>
                              <div className="min-w-0">
                                <div className="font-bold text-xs sm:text-sm text-foreground truncate">
                                  {master?.name || sc.className}
                                </div>
                                <div className="text-[11px] font-mono text-muted-foreground truncate">
                                  Layout: {sc.seatLayout || master?.defaultLayout || '-'}
                                </div>
                              </div>
                            </div>
                            <Badge className="font-bold bg-primary/10 text-primary border-primary/20 shrink-0 text-xs">
                              {sc.seatCapacity} Kursi
                            </Badge>
                          </div>
                          {master?.description && (
                            <p className="text-xs text-muted-foreground pt-1.5 border-t border-slate-200/60 dark:border-white/5 break-words">
                              <Sparkles className="h-3 w-3 inline mr-1 text-amber-500 shrink-0" />
                              {master.description}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <div className="col-span-1 sm:col-span-2 p-4 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                    Konfigurasi kelas kursi tunggal: {vehicle.capacity} Kursi Standar
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer - Fixed at bottom, responsive flex */}
        <DialogFooter className="p-3 sm:p-4 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 backdrop-blur-md shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyBusInfo}
            className="gap-1.5 text-xs h-9 w-full sm:w-auto"
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
              className="gap-1.5 text-xs h-9 w-full sm:w-auto text-primary hover:text-primary"
            >
              <Edit className="h-3.5 w-3.5" /> Edit Data Bus
            </Button>
          )}

          <Button size="sm" onClick={onClose} className="text-xs h-9 w-full sm:w-auto">
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
