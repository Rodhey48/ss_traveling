import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Ticket, Check, Sparkles, Loader2 } from 'lucide-react';
import type { FareMatrix, FareMatrixFormData, FareSeason, SeatClass } from '@/types';
import { toast } from 'sonner';

interface FareMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FareMatrixFormData) => Promise<void>;
  matrix: FareMatrix | null;
  seasons: FareSeason[];
  seatClasses: SeatClass[];
  loading: boolean;
}

export default function FareMatrixModal({
  isOpen,
  onClose,
  onSubmit,
  matrix,
  seasons,
  seatClasses,
  loading,
}: FareMatrixModalProps) {
  const [formData, setFormData] = useState<FareMatrixFormData>({
    fareSeasonId: '',
    origin: 'TANGERANG',
    destination: 'YOGYAKARTA',
    seatClassId: '',
    amount: 350000,
    isActive: true,
  });

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  useEffect(() => {
    if (matrix) {
      setFormData({
        fareSeasonId: matrix.fareSeasonId,
        origin: matrix.origin,
        destination: matrix.destination,
        seatClassId: matrix.seatClassId,
        amount: Number(matrix.amount),
        isActive: matrix.isActive ?? true,
      });
    } else {
      setFormData({
        fareSeasonId: seasons[0]?.id || '',
        origin: 'TANGERANG',
        destination: 'YOGYAKARTA',
        seatClassId: seatClasses[0]?.id || '',
        amount: 350000,
        isActive: true,
      });
    }
  }, [matrix, seasons, seatClasses, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fareSeasonId) {
      toast.error('Pilih musim tarif terlebih dahulu');
      return;
    }
    if (!formData.origin.trim() || !formData.destination.trim()) {
      toast.error('Kota asal dan tujuan wajib diisi');
      return;
    }
    if (!formData.seatClassId) {
      toast.error('Pilih kelas kursi terlebih dahulu');
      return;
    }
    if (formData.amount <= 0) {
      toast.error('Tarif tiket dasar harus lebih besar dari Rp 0');
      return;
    }

    await onSubmit({
      ...formData,
      origin: formData.origin.trim().toUpperCase(),
      destination: formData.destination.trim().toUpperCase(),
      amount: Number(formData.amount),
    });
  };

  const setPresetRoute = (origin: string, destination: string) => {
    setFormData((prev) => ({
      ...prev,
      origin,
      destination,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              {matrix ? 'Edit Entri Matriks Tarif Tiket' : 'Tambah Entri Matriks Tarif Baru'}
            </div>
          </DialogTitle>
          <DialogDescription className="text-xs">
            {matrix
              ? 'Perbarui harga tiket dasar untuk kombinasi rute, musim, dan kelas kabin bus.'
              : 'Konfigurasikan harga tiket dasar baru berdasarkan rute, kalender musim, dan kelas kursi.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Musim Tarif Selector */}
          <div className="space-y-1.5">
            <Label htmlFor="fareSeasonId" className="text-xs font-semibold">
              Musim Tarif (Kalender Tuslah/Reguler) <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.fareSeasonId}
              onValueChange={(val) =>
                setFormData((prev) => ({ ...prev, fareSeasonId: val }))
              }
              disabled={Boolean(matrix) || loading}
            >
              <SelectTrigger id="fareSeasonId" className="text-xs h-9">
                <SelectValue placeholder="Pilih Musim Tarif" />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    <span className="font-semibold">{s.name}</span>{' '}
                    <span className="font-mono text-muted-foreground text-[11px]">({s.code})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rute Perjalanan */}
          <div className="space-y-2 p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/80 dark:border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                Rute Perjalanan Bus AKAP <span className="text-destructive">*</span>
              </span>
              {!matrix && (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">Pintas:</span>
                  <button
                    type="button"
                    onClick={() => setPresetRoute('TANGERANG', 'YOGYAKARTA')}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 font-mono transition-colors"
                  >
                    TNG&rarr;YOG
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetRoute('YOGYAKARTA', 'TANGERANG')}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 font-mono transition-colors"
                  >
                    YOG&rarr;TNG
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetRoute('JAKARTA', 'YOGYAKARTA')}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 font-mono transition-colors"
                  >
                    JKT&rarr;YOG
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div className="space-y-1">
                <Label htmlFor="origin" className="text-[11px] text-muted-foreground">
                  Kota / Terminal Keberangkatan
                </Label>
                <Input
                  id="origin"
                  placeholder="Contoh: TANGERANG"
                  value={formData.origin}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      origin: e.target.value.toUpperCase(),
                    }))
                  }
                  disabled={Boolean(matrix) || loading}
                  className="font-mono text-xs font-bold uppercase h-8.5"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="destination" className="text-[11px] text-muted-foreground">
                  Kota / Terminal Kedatangan
                </Label>
                <Input
                  id="destination"
                  placeholder="Contoh: YOGYAKARTA"
                  value={formData.destination}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      destination: e.target.value.toUpperCase(),
                    }))
                  }
                  disabled={Boolean(matrix) || loading}
                  className="font-mono text-xs font-bold uppercase h-8.5"
                  required
                />
              </div>
            </div>
          </div>

          {/* Kelas Kursi Bus */}
          <div className="space-y-1.5">
            <Label htmlFor="seatClassId" className="text-xs font-semibold">
              Kelas Kursi Bus (*Cabin Class*) <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.seatClassId}
              onValueChange={(val) =>
                setFormData((prev) => ({ ...prev, seatClassId: val }))
              }
              disabled={Boolean(matrix) || loading}
            >
              <SelectTrigger id="seatClassId" className="text-xs h-9">
                <SelectValue placeholder="Pilih Kelas Kursi" />
              </SelectTrigger>
              <SelectContent>
                {seatClasses.map((sc) => (
                  <SelectItem key={sc.id} value={sc.id} className="text-xs">
                    <span className="font-semibold">{sc.name}</span>{' '}
                    <span className="font-mono text-muted-foreground text-[11px]">({sc.code})</span>
                    {sc.defaultLayout && ` • Layout ${sc.defaultLayout}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tarif Dasar Tiket & Status Keaktifan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="amount" className="text-xs font-semibold flex items-center justify-between">
                <span>Tarif Tiket Dasar (Rp) <span className="text-destructive">*</span></span>
                <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(formData.amount || 0)}
                </span>
              </Label>
              <Input
                id="amount"
                type="number"
                min={0}
                step={5000}
                placeholder="Contoh: 350000"
                value={formData.amount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    amount: Math.max(0, Number(e.target.value) || 0),
                  }))
                }
                className="font-mono text-xs font-bold h-9"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="isActive" className="text-xs font-semibold">
                Status Matriks
              </Label>
              <Select
                value={formData.isActive ? 'ACTIVE' : 'INACTIVE'}
                onValueChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    isActive: val === 'ACTIVE',
                  }))
                }
                disabled={loading}
              >
                <SelectTrigger id="isActive" className="text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE" className="text-xs">
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Aktif Berlaku
                    </span>
                  </SelectItem>
                  <SelectItem value="INACTIVE" className="text-xs">
                    <span className="flex items-center gap-1.5 text-zinc-500 font-medium">
                      <span className="h-2 w-2 rounded-full bg-zinc-400" />
                      Non-Aktif
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-200/80 dark:border-white/10 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="text-xs h-8.5"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="text-xs h-8.5 gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Menyimpan...
                </>
              ) : matrix ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Simpan Perubahan
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" /> Tambah Matriks Tarif
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
