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
import { UserCheck, Loader2, Route as RouteIcon, Landmark } from 'lucide-react';
import type {
  CoordinatorFeeRule,
  CoordinatorFeeRuleFormData,
  Coordinator,
  Route,
} from '@/types';
import { RouteService } from '@/services/route.service';
import { toast } from 'sonner';

interface CoordinatorFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CoordinatorFeeRuleFormData) => Promise<void>;
  rule: CoordinatorFeeRule | null;
  coordinators?: Coordinator[];
  loading: boolean;
}

export default function CoordinatorFeeModal({
  isOpen,
  onClose,
  onSubmit,
  rule,
  coordinators = [],
  loading,
}: CoordinatorFeeModalProps) {
  const [availableRoutes, setAvailableRoutes] = useState<Route[]>([]);
  const [formData, setFormData] = useState<CoordinatorFeeRuleFormData>({
    routeId: '',
    origin: 'ALL',
    destination: 'ALL',
    coordinatorId: '',
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
        coordinatorId: rule.coordinatorId || '',
        coordinatorUserId: rule.coordinatorUserId || '',
        feePerPax: Number(rule.feePerPax),
        isActive: rule.isActive ?? true,
      });
    } else {
      setFormData({
        routeId: '',
        origin: 'ALL',
        destination: 'ALL',
        coordinatorId: '',
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
    if (!formData.origin.trim() || !formData.destination.trim()) {
      toast.error('Kota Asal dan Kota Tujuan wajib diisi');
      return;
    }
    if (formData.feePerPax <= 0) {
      toast.error('Tarif fee korlap per penumpang harus lebih dari Rp 0');
      return;
    }

    await onSubmit({
      routeId: formData.routeId || undefined,
      origin: formData.origin.trim().toUpperCase(),
      destination: formData.destination.trim().toUpperCase(),
      coordinatorId: formData.coordinatorId || undefined,
      coordinatorUserId: formData.coordinatorUserId || undefined,
      feePerPax: Number(formData.feePerPax),
      isActive: formData.isActive,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                {rule ? 'Edit Aturan Fee Korlap' : 'Tambah Aturan Fee Korlap'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Tentukan besaran fee per pax untuk koordinator lapangan berdasarkan rute perjalanan.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Pilih Master Rute */}
          <div className="space-y-1.5 p-3 rounded-lg border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2">
              <RouteIcon className="w-4 h-4 text-primary" />
              <Label htmlFor="masterRouteSelect" className="text-xs font-semibold text-primary">
                Pilih Dari Master Rute (Trayek)
              </Label>
            </div>
            <Select
              value={formData.routeId || (formData.origin === 'ALL' && formData.destination === 'ALL' ? 'ALL' : 'CUSTOM')}
              onValueChange={(val) => {
                if (val === 'ALL') {
                  setFormData((prev) => ({ ...prev, routeId: '', origin: 'ALL', destination: 'ALL' }));
                } else {
                  handleRouteChange(val);
                }
              }}
              disabled={Boolean(rule) || loading}
            >
              <SelectTrigger id="masterRouteSelect" className="text-xs h-9 bg-white dark:bg-slate-900">
                <SelectValue placeholder="-- Pilih Master Rute Trayek --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs font-medium">
                  🌐 Semua Rute (Default Fallback: ALL ➔ ALL)
                </SelectItem>
                <SelectItem value="CUSTOM" className="text-xs font-medium">
                  ✏️ Input Manual Asal - Tujuan
                </SelectItem>
                {availableRoutes.map((r) => (
                  <SelectItem key={r.id} value={r.id} className="text-xs">
                    [{r.code}] {r.name} ({r.origin} ➔ {r.destination})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Memilih master rute akan otomatis mengunci nama rute, asal, dan tujuan.
            </p>
          </div>

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

          {/* Master Koordinator Lapangan Eksternal */}
          <div className="space-y-1.5">
            <Label htmlFor="coordinatorSelect" className="text-xs font-semibold flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-amber-500" /> Koordinator Lapangan / Pengurus Jalur
            </Label>
            <Select
              value={formData.coordinatorId || 'NONE'}
              onValueChange={(val) =>
                setFormData((prev) => ({
                  ...prev,
                  coordinatorId: val === 'NONE' ? '' : val,
                }))
              }
              disabled={loading}
            >
              <SelectTrigger id="coordinatorSelect" className="text-xs h-9">
                <SelectValue placeholder="Pilih Koordinator Lapangan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE" className="text-xs text-muted-foreground">
                  -- Tanpa Koordinator Spesifik (Umum) --
                </SelectItem>
                {coordinators.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    {c.code} - {c.name} {c.organizationName ? `(${c.organizationName})` : ''} [{c.bankName}]
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Koordinator eksternal yang akan menerima pencairan transfer settlement fee ini.
            </p>
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
              min={0}
              step={500}
              placeholder="Contoh: 10000"
              value={formData.feePerPax || ''}
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
          </div>

          {/* Status Aturan */}
          <div className="space-y-1.5">
            <Label htmlFor="status" className="text-xs font-semibold">
              Status Aturan
            </Label>
            <Select
              value={formData.isActive ? 'true' : 'false'}
              onValueChange={(val) =>
                setFormData((prev) => ({
                  ...prev,
                  isActive: val === 'true',
                }))
              }
              disabled={loading}
            >
              <SelectTrigger id="status" className="text-xs h-9">
                <SelectValue placeholder="Pilih Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true" className="text-xs text-emerald-600 font-medium">
                  Aktif Digunakan
                </SelectItem>
                <SelectItem value="false" className="text-xs text-muted-foreground">
                  Non-Aktif (Diarsipkan)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
              className="text-xs h-9"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="text-xs h-9"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
              {rule ? 'Simpan Perubahan' : 'Buat Aturan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
