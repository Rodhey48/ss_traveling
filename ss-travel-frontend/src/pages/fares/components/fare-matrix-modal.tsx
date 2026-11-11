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
import { Checkbox } from '@/components/ui/checkbox';
import { Ticket, Loader2, Route as RouteIcon, Calendar } from 'lucide-react';
import type { FareMatrix, FareMatrixFormData, FareSeason, SeatClass, Route } from '@/types';
import { RouteService } from '@/services/route.service';
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
  const [availableRoutes, setAvailableRoutes] = useState<Route[]>([]);
  const [formData, setFormData] = useState<FareMatrixFormData>({
    fareSeasonId: '',
    routeId: '',
    origin: 'TANGERANG',
    destination: 'YOGYAKARTA',
    seatClassId: '',
    amount: 350000,
    effectiveFrom: new Date().toISOString().split('T')[0],
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
    if (isOpen) {
      RouteService.findAll()
        .then((res) => {
          if (res.status && Array.isArray(res.data)) {
            setAvailableRoutes(res.data);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (matrix) {
      setFormData({
        fareSeasonId: matrix.fareSeasonId,
        routeId: matrix.routeId || '',
        origin: matrix.origin,
        destination: matrix.destination,
        seatClassId: matrix.seatClassId,
        amount: Number(matrix.amount),
        effectiveFrom: matrix.effectiveFrom
          ? matrix.effectiveFrom.split('T')[0]
          : new Date().toISOString().split('T')[0],
        effectiveUntil: matrix.effectiveUntil
          ? matrix.effectiveUntil.split('T')[0]
          : undefined,
        isActive: matrix.isActive ?? true,
      });
    } else {
      setFormData({
        fareSeasonId: seasons[0]?.id || '',
        routeId: '',
        origin: 'TANGERANG',
        destination: 'YOGYAKARTA',
        seatClassId: seatClasses[0]?.id || '',
        amount: 350000,
        effectiveFrom: new Date().toISOString().split('T')[0],
        isActive: true,
      });
    }
  }, [matrix, seasons, seatClasses, isOpen]);

  const handleRouteChange = (selectedRouteId: string) => {
    if (selectedRouteId === 'CUSTOM') {
      setFormData((prev) => ({
        ...prev,
        routeId: '',
      }));
      return;
    }

    const r = availableRoutes.find((item) => item.id === selectedRouteId);
    if (r) {
      setFormData((prev) => ({
        ...prev,
        routeId: r.id,
        origin: r.origin,
        destination: r.destination,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fareSeasonId) {
      toast.error('Pilih musim tarif terlebih dahulu');
      return;
    }
    if (!formData.origin?.trim() || !formData.destination?.trim()) {
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
      routeId: formData.routeId || undefined,
      origin: formData.origin?.trim().toUpperCase(),
      destination: formData.destination?.trim().toUpperCase(),
      amount: Number(formData.amount),
    });
  };

  const setPresetRoute = (origin: string, destination: string) => {
    setFormData((prev) => ({
      ...prev,
      routeId: '',
      origin,
      destination,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              {matrix ? 'Edit Entri Matriks Tarif Tiket' : 'Tambah Entri Matriks Tarif Baru'}
            </div>
          </DialogTitle>
          <DialogDescription className="text-xs">
            {matrix
              ? 'Perbarui harga tiket dasar, tautan master rute, dan status keaktifan tarif.'
              : 'Konfigurasikan harga tiket dasar baru berdasarkan rute trayek, kalender musim, dan kelas kabin bus.'}
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
            {matrix && (
              <p className="text-[10px] text-muted-foreground">
                Musim tarif tidak dapat diubah pada entri yang sudah tersimpan.
              </p>
            )}
          </div>

          {/* Master Rute Trayek Selector (Tersedia baik pada Tambah maupun Edit) */}
          <div className="space-y-1.5 p-3 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold flex items-center gap-1.5 text-indigo-950 dark:text-indigo-200">
                <RouteIcon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                Master Rute Trayek (Tautan Entitas)
              </Label>
              {formData.routeId && (
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-600 text-white">
                  Terhubung ke Trayek
                </span>
              )}
            </div>
            <Select
              value={formData.routeId || 'CUSTOM'}
              onValueChange={handleRouteChange}
              disabled={loading}
            >
              <SelectTrigger className="h-9 text-xs bg-background">
                <SelectValue placeholder="Pilih rute trayek resmi..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CUSTOM" className="text-xs">
                  -- Masukkan Manual Kota Asal & Tujuan --
                </SelectItem>
                {availableRoutes.map((r) => (
                  <SelectItem key={r.id} value={r.id} className="text-xs">
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{r.code}</span> - {r.name} ({r.origin} ➔ {r.destination})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              {formData.routeId
                ? 'Tarif ini diprioritaskan saat bus beroperasi pada rute trayek terpilih.'
                : 'Pilih master rute untuk menghubungkan tarif ke trayek resmi, atau ketik nama kota manual.'}
            </p>
          </div>

          {/* Rute Perjalanan (Asal & Tujuan) */}
          <div className="space-y-2 p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/80 dark:border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                Kota Keberangkatan & Kedatangan <span className="text-destructive">*</span>
              </span>
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div className="space-y-1">
                <Label htmlFor="origin" className="text-[11px] text-muted-foreground">
                  Kota / Terminal Keberangkatan
                </Label>
                <Input
                  id="origin"
                  placeholder="Contoh: TANGERANG"
                  value={formData.origin || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      origin: e.target.value.toUpperCase(),
                    }))
                  }
                  disabled={loading}
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
                  value={formData.destination || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      destination: e.target.value.toUpperCase(),
                    }))
                  }
                  disabled={loading}
                  className="font-mono text-xs font-bold uppercase h-8.5"
                  required
                />
              </div>
            </div>
          </div>

          {/* Kelas Kursi Bus */}
          <div className="space-y-1.5">
            <Label htmlFor="seatClassId" className="text-xs font-semibold">
              Kelas Kabin Armada Bus <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.seatClassId}
              onValueChange={(val) =>
                setFormData((prev) => ({ ...prev, seatClassId: val }))
              }
              disabled={Boolean(matrix) || loading}
            >
              <SelectTrigger id="seatClassId" className="text-xs h-9">
                <SelectValue placeholder="Pilih Kelas Kursi / Kabin" />
              </SelectTrigger>
              <SelectContent>
                {seatClasses.map((sc) => (
                  <SelectItem key={sc.id} value={sc.id} className="text-xs">
                    <span className="font-semibold">{sc.name}</span>{' '}
                    <span className="font-mono text-muted-foreground text-[11px]">({sc.code})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {matrix && (
              <p className="text-[10px] text-muted-foreground">
                Kelas kursi dikunci untuk menjaga integritas matriks tarif.
              </p>
            )}
          </div>

          {/* Harga Tiket Dasar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="amount" className="text-xs font-semibold">
                Harga Tiket Dasar (Rp) <span className="text-destructive">*</span>
              </Label>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {formatCurrency(formData.amount)}
              </span>
            </div>
            <Input
              id="amount"
              type="number"
              step="5000"
              min="0"
              value={formData.amount}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  amount: Number(e.target.value),
                }))
              }
              className="text-xs h-9 font-mono font-bold"
              required
              disabled={loading}
            />
            <p className="text-[11px] text-muted-foreground">
              Nominal dasar per kursi sebelum potongan diskon atau komisi agen loket.
            </p>
          </div>

          {/* Tanggal Efektif & Status Aktif */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="effectiveFrom" className="text-xs font-semibold flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                Mulai Berlaku
              </Label>
              <Input
                id="effectiveFrom"
                type="date"
                value={formData.effectiveFrom || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    effectiveFrom: e.target.value,
                  }))
                }
                className="text-xs h-9 font-mono"
                disabled={loading}
              />
            </div>

            {/* Checkbox Status Aktif */}
            <div className="flex items-center space-x-2 h-9 px-3 rounded-lg border bg-slate-50 dark:bg-white/5">
              <Checkbox
                id="matrix-is-active"
                checked={formData.isActive}
                onCheckedChange={(checked: boolean) =>
                  setFormData((prev) => ({ ...prev, isActive: !!checked }))
                }
                disabled={loading}
              />
              <Label
                htmlFor="matrix-is-active"
                className="text-xs font-semibold cursor-pointer select-none"
              >
                {formData.isActive ? 'Status: Aktif Berlaku' : 'Status: Non-Aktif'}
              </Label>
            </div>
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {matrix ? 'Simpan Perubahan' : 'Buat Entri Matriks'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
