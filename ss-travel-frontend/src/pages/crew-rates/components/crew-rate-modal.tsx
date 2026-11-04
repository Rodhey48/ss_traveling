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
import { Coins, Check, Sparkles, Loader2 } from 'lucide-react';
import type {
  CrewRateRule,
  CrewRateRuleFormData,
  CrewRole,
  CrewServiceType,
  CrewRateType,
} from '@/types';
import { toast } from 'sonner';

interface CrewRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CrewRateRuleFormData) => Promise<void>;
  rule: CrewRateRule | null;
  loading: boolean;
}

export default function CrewRateModal({
  isOpen,
  onClose,
  onSubmit,
  rule,
  loading,
}: CrewRateModalProps) {
  const [formData, setFormData] = useState<CrewRateRuleFormData>({
    role: 'DRIVER',
    serviceType: 'AKAP',
    origin: 'ALL',
    destination: 'ALL',
    rateType: 'PER_TRIP',
    mealAllowance: 150000,
    tripIncentive: 250000,
    fullSeatBonus: 50000,
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
    if (rule) {
      setFormData({
        role: rule.role,
        serviceType: rule.serviceType,
        origin: rule.origin || 'ALL',
        destination: rule.destination || 'ALL',
        rateType: rule.rateType,
        mealAllowance: Number(rule.mealAllowance),
        tripIncentive: Number(rule.tripIncentive),
        fullSeatBonus: Number(rule.fullSeatBonus),
        isActive: rule.isActive ?? true,
      });
    } else {
      setFormData({
        role: 'DRIVER',
        serviceType: 'AKAP',
        origin: 'ALL',
        destination: 'ALL',
        rateType: 'PER_TRIP',
        mealAllowance: 150000,
        tripIncentive: 250000,
        fullSeatBonus: 50000,
        isActive: true,
      });
    }
  }, [rule, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.mealAllowance < 0 || formData.tripIncentive < 0) {
      toast.error('Uang makan dan premi tidak boleh bernilai negatif');
      return;
    }

    await onSubmit({
      ...formData,
      mealAllowance: Number(formData.mealAllowance),
      tripIncentive: Number(formData.tripIncentive),
      fullSeatBonus:
        formData.serviceType === 'AKAP' ? Number(formData.fullSeatBonus || 0) : 0,
    });
  };

  const totalAcuan = Number(formData.mealAllowance || 0) + Number(formData.tripIncentive || 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              {rule
                ? 'Edit Standar Kompensasi & Tarif Kru'
                : 'Tambah Standar Tarif Acuan Kru'}
            </div>
          </DialogTitle>
          <DialogDescription className="text-xs">
            {rule
              ? 'Perbarui standar acuan dasar uang makan, premi, dan bonus full seat kru bus.'
              : 'Konfigurasikan standar acuan dasar baru untuk penugasan SPJ AKAP maupun Pariwisata.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Baris 1: Jabatan Kru & Jenis Layanan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="role" className="text-xs font-semibold">
                Jabatan / Peran Kru <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.role}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, role: val as CrewRole }))
                }
                disabled={loading}
              >
                <SelectTrigger id="role" className="text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRIVER" className="text-xs">Driver Utama (Sopir 1)</SelectItem>
                  <SelectItem value="CO_DRIVER" className="text-xs">Co-Driver (Sopir 2)</SelectItem>
                  <SelectItem value="CONDUCTOR" className="text-xs">Kondektur / Kernet</SelectItem>
                  <SelectItem value="STEWARDESS" className="text-xs">Pramugari / Stewardess</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="serviceType" className="text-xs font-semibold">
                Jenis Layanan SPJ <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.serviceType}
                onValueChange={(val) => {
                  const sType = val as CrewServiceType;
                  setFormData((prev) => ({
                    ...prev,
                    serviceType: sType,
                    rateType: sType === 'AKAP' ? 'PER_TRIP' : 'PER_DAY',
                    fullSeatBonus: sType === 'AKAP' ? (prev.fullSeatBonus || 50000) : 0,
                  }));
                }}
                disabled={loading}
              >
                <SelectTrigger id="serviceType" className="text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AKAP" className="text-xs">AKAP Reguler (Trayek PP)</SelectItem>
                  <SelectItem value="TOURISM" className="text-xs">Pariwisata / Sewa Wisata</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Baris 2: Basis Perhitungan & Cakupan Rute */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rateType" className="text-xs font-semibold">
                Basis Perhitungan Rate
              </Label>
              <Select
                value={formData.rateType}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, rateType: val as CrewRateType }))
                }
                disabled={loading}
              >
                <SelectTrigger id="rateType" className="text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PER_TRIP" className="text-xs">Per Ritase PP (2 Leg - AKAP)</SelectItem>
                  <SelectItem value="PER_DAY" className="text-xs">Per Hari Kalender (Wisata)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="isActive" className="text-xs font-semibold">
                Status Keaktifan
              </Label>
              <Select
                value={formData.isActive ? 'ACTIVE' : 'INACTIVE'}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, isActive: val === 'ACTIVE' }))
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

          {/* Section Nilai Finansial */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-bold text-foreground">
                Rincian Nominal Kompensasi Acuan
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                Satuan: {formData.rateType === 'PER_DAY' ? 'Per Hari' : 'Per Rit PP'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Uang Makan */}
              <div className="space-y-1">
                <Label htmlFor="meal" className="text-xs font-semibold flex items-center justify-between">
                  <span>Uang Makan Standar <span className="text-destructive">*</span></span>
                  <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(formData.mealAllowance || 0)}
                  </span>
                </Label>
                <Input
                  id="meal"
                  type="number"
                  min={0}
                  step={5000}
                  value={formData.mealAllowance}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      mealAllowance: Number(e.target.value) || 0,
                    }))
                  }
                  className="font-mono text-xs font-bold h-8.5"
                  required
                  disabled={loading}
                />
              </div>

              {/* Premi Ritase */}
              <div className="space-y-1">
                <Label htmlFor="incentive" className="text-xs font-semibold flex items-center justify-between">
                  <span>Premi Ritase / Harian <span className="text-destructive">*</span></span>
                  <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(formData.tripIncentive || 0)}
                  </span>
                </Label>
                <Input
                  id="incentive"
                  type="number"
                  min={0}
                  step={5000}
                  value={formData.tripIncentive}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      tripIncentive: Number(e.target.value) || 0,
                    }))
                  }
                  className="font-mono text-xs font-bold h-8.5"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Bonus Full Seat (Hanya AKAP) */}
            <div className="space-y-1 pt-1">
              <Label htmlFor="fullSeatBonus" className="text-xs font-semibold flex items-center justify-between">
                <span>
                  Bonus Full Seat 100% {formData.serviceType === 'TOURISM' && '(Tidak Berlaku Wisata)'}
                </span>
                <span className="font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  {formData.serviceType === 'AKAP' ? formatCurrency(formData.fullSeatBonus || 0) : '-'}
                </span>
              </Label>
              <Input
                id="fullSeatBonus"
                type="number"
                min={0}
                step={5000}
                value={formData.fullSeatBonus || 0}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    fullSeatBonus: Number(e.target.value) || 0,
                  }))
                }
                disabled={formData.serviceType === 'TOURISM' || loading}
                className="font-mono text-xs font-bold h-8.5"
              />
              <p className="text-[10px] text-muted-foreground">
                {formData.serviceType === 'AKAP'
                  ? 'Insentif tambahan kru jika seluruh kursi bus terisi penuh 100% pada rute trayek.'
                  : 'Bonus full seat dinonaktifkan untuk layanan sewa wisata / charter.'}
              </p>
            </div>

            {/* Live Total Standar Acuan */}
            <div className="pt-2 border-t flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                Total Standar Acuan Dasar (Uang Makan + Premi):
              </span>
              <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalAcuan)}{' '}
                <span className="text-[11px] font-normal text-muted-foreground">
                  {formData.rateType === 'PER_DAY' ? '/hari' : '/rit'}
                </span>
              </span>
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
              ) : rule ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Simpan Perubahan
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" /> Buat Standar Tarif
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
