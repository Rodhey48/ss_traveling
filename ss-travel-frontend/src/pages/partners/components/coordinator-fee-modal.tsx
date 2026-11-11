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
import { UserCheck, Loader2, Route as RouteIcon } from 'lucide-react';
import type {
  CoordinatorFeeRule,
  CoordinatorFeeRuleFormData,
  User,
  Route,
} from '@/types';
import { RouteService } from '@/services/route.service';
import { toast } from 'sonner';

interface CoordinatorFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CoordinatorFeeRuleFormData) => Promise<void>;
  rule: CoordinatorFeeRule | null;
  users: User[];
  loading: boolean;
}

export default function CoordinatorFeeModal({
  isOpen,
  onClose,
  onSubmit,
  rule,
  users,
  loading,
}: CoordinatorFeeModalProps) {
  const [availableRoutes, setAvailableRoutes] = useState<Route[]>([]);
  const [formData, setFormData] = useState<CoordinatorFeeRuleFormData>({
    routeId: '',
    origin: 'ALL',
    destination: 'ALL',
    coordinatorUserId: '',
    feePerPax: 10000,
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
    if (rule) {
      setFormData({
        routeId: rule.routeId || '',
        origin: rule.origin,
        destination: rule.destination,
        coordinatorUserId: rule.coordinatorUserId || '',
        feePerPax: Number(rule.feePerPax),
        isActive: rule.isActive ?? true,
      });
    } else {
      setFormData({
        routeId: '',
        origin: 'ALL',
        destination: 'ALL',
        coordinatorUserId: '',
        feePerPax: 10000,
        isActive: true,
      });
    }
  }, [rule, isOpen]);

  const handleRouteChange = (selectedRouteId: string) => {
    if (selectedRouteId === 'CUSTOM') {
      setFormData((prev) => ({
        ...prev,
        routeId: '',
        origin: 'ALL',
        destination: 'ALL',
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
    if (formData.feePerPax <= 0) {
      toast.error('Besaran fee korlap per penumpang harus lebih dari Rp 0');
      return;
    }

    if (!formData.origin || !formData.destination) {
      toast.error('Kota asal dan kota tujuan wajib diisi');
      return;
    }

    await onSubmit({
      ...formData,
      routeId: formData.routeId || undefined,
      origin: formData.origin.toUpperCase().trim(),
      destination: formData.destination.toUpperCase().trim(),
      feePerPax: Number(formData.feePerPax),
      coordinatorUserId:
        formData.coordinatorUserId && formData.coordinatorUserId !== 'NONE'
          ? formData.coordinatorUserId
          : undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              {rule ? 'Edit Aturan Fee Jasa Korlap' : 'Tambah Aturan Fee Jasa Korlap'}
            </div>
          </DialogTitle>
          <DialogDescription className="text-xs">
            {rule
              ? 'Perbarui standar fee jasa penanganan penumpang untuk rute operasional ini.'
              : 'Konfigurasikan besaran fee korlap per penumpang berdasarkan master rute trayek atau titik rute umum.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Pilihan Master Rute */}
          {!rule && availableRoutes.length > 0 && (
            <div className="space-y-1.5 p-3 rounded-lg border bg-muted/20">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <RouteIcon className="h-3.5 w-3.5 text-indigo-600" />
                Pilih Dari Master Rute Trayek (Otomatis)
              </Label>
              <Select
                value={formData.routeId || 'CUSTOM'}
                onValueChange={handleRouteChange}
                disabled={loading}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Pilih rute trayek..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CUSTOM">
                    -- Masukkan Manual / Rute Umum (ALL - ALL) --
                  </SelectItem>
                  {availableRoutes.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.code} - {r.name} ({r.origin} ➔ {r.destination})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Memilih master rute akan langsung mengaitkan aturan tarif dan mengisi kota asal/tujuan secara otomatis.
              </p>
            </div>
          )}

          {/* Kota Asal (Origin) */}
          <div className="space-y-1.5">
            <Label htmlFor="origin" className="text-xs font-semibold">
              Kota Asal / Titik Keberangkatan <span className="text-destructive">*</span>
            </Label>
            <Input
              id="origin"
              placeholder="Contoh: JAKARTA, TANGERANG, SURABAYA, atau ALL"
              value={formData.origin}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  origin: e.target.value,
                }))
              }
              className="text-xs h-9 uppercase"
              required
              disabled={Boolean(rule) || loading}
            />
          </div>

          {/* Kota Tujuan (Destination) */}
          <div className="space-y-1.5">
            <Label htmlFor="destination" className="text-xs font-semibold">
              Kota Tujuan / Titik Akhir <span className="text-destructive">*</span>
            </Label>
            <Input
              id="destination"
              placeholder="Contoh: SURABAYA, YOGYAKARTA, atau ALL"
              value={formData.destination}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  destination: e.target.value,
                }))
              }
              className="text-xs h-9 uppercase"
              required
              disabled={Boolean(rule) || loading}
            />
          </div>

          {/* Personel Korlap Lapangan */}
          <div className="space-y-1.5">
            <Label htmlFor="coordinatorUser" className="text-xs font-semibold">
              Personel Korlap Lapangan (Opsional)
            </Label>
            <Select
              value={formData.coordinatorUserId || 'NONE'}
              onValueChange={(val) =>
                setFormData((prev) => ({
                  ...prev,
                  coordinatorUserId: val === 'NONE' ? '' : val,
                }))
              }
              disabled={loading}
            >
              <SelectTrigger id="coordinatorUser" className="text-xs h-9">
                <SelectValue placeholder="Pilih Korlap Penanggung Jawab" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE" className="text-xs text-muted-foreground">
                  -- Tanpa Korlap Spesifik (Umum) --
                </SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id} className="text-xs">
                    {u.name} {u.phone ? `(${u.phone})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Besaran Fee Per Pax */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="feePerPax" className="text-xs font-semibold">
                Tarif Fee per Pax (Rp) <span className="text-destructive">*</span>
              </Label>
              <span className="text-xs font-bold text-primary font-mono">
                {formatCurrency(formData.feePerPax)} / Penumpang
              </span>
            </div>
            <Input
              id="feePerPax"
              type="number"
              step="500"
              min="0"
              value={formData.feePerPax}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  feePerPax: Number(e.target.value),
                }))
              }
              className="text-xs h-9 font-mono"
              required
              disabled={loading}
            />
            <p className="text-[11px] text-muted-foreground">
              Tarif standar perintis: Rp 10.000 / tiket. Nilai ini menjadi dasar otomatisasi utang jasa pada SPJ.
            </p>
          </div>

          <DialogFooter className="pt-2 gap-2">
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
            <Button type="submit" size="sm" disabled={loading} className="text-xs gap-1.5">
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {rule ? 'Simpan Perubahan' : 'Buat Aturan Fee'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
