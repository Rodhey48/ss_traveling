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
import { UserCheck, Check, Sparkles, Loader2 } from 'lucide-react';
import type {
  CoordinatorFeeRule,
  CoordinatorFeeRuleFormData,
  CoordinatorZone,
  User,
} from '@/types';
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
  const [formData, setFormData] = useState<CoordinatorFeeRuleFormData>({
    zone: 'WEST',
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
    if (rule) {
      setFormData({
        zone: rule.zone,
        coordinatorUserId: rule.coordinatorUserId || '',
        feePerPax: Number(rule.feePerPax),
        isActive: rule.isActive ?? true,
      });
    } else {
      setFormData({
        zone: 'WEST',
        coordinatorUserId: '',
        feePerPax: 10000,
        isActive: true,
      });
    }
  }, [rule, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.feePerPax <= 0) {
      toast.error('Besaran fee korlap per penumpang harus lebih dari Rp 0');
      return;
    }

    await onSubmit({
      ...formData,
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
              ? 'Perbarui standar fee jasa penanganan penumpang wilayah barat atau timur.'
              : 'Konfigurasikan besaran fee korlap per penumpang berdasarkan zonasi operasional rute dinas.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Zona Wilayah Korlap */}
          <div className="space-y-1.5">
            <Label htmlFor="zone" className="text-xs font-semibold">
              Zona Wilayah Penanganan <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.zone}
              onValueChange={(val) =>
                setFormData((prev) => ({
                  ...prev,
                  zone: val as CoordinatorZone,
                }))
              }
              disabled={Boolean(rule) || loading}
            >
              <SelectTrigger id="zone" className="text-xs h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WEST" className="text-xs">
                  Zona Barat (Jabodetabek / Pool Ciputat) — Leg Keberangkatan
                </SelectItem>
                <SelectItem value="EAST" className="text-xs">
                  Zona Timur (Jateng &amp; DIY / Terminal Yogya) — Leg Kepulangan
                </SelectItem>
              </SelectContent>
            </Select>
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
                <SelectValue placeholder="Pilih User Korlap" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE" className="text-xs">
                  -- Umum / Tanpa Pengikatan User Khusus (Berlaku Semua Korlap) --
                </SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id} className="text-xs">
                    {u.name} ({u.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              Jika dikosongkan, aturan fee berlaku umum untuk seluruh SPJ pada zona tersebut.
            </p>
          </div>

          {/* Besaran Fee & Status Keaktifan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
            <div className="space-y-1.5">
              <Label htmlFor="feePerPax" className="text-xs font-semibold flex items-center justify-between">
                <span>Fee per Pax (Rp) <span className="text-destructive">*</span></span>
                <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(formData.feePerPax || 0)}
                </span>
              </Label>
              <Input
                id="feePerPax"
                type="number"
                min={0}
                step={500}
                value={formData.feePerPax}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    feePerPax: Number(e.target.value) || 0,
                  }))
                }
                className="font-mono text-xs font-bold h-9"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="isActive" className="text-xs font-semibold">
                Status Aturan
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
              ) : rule ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Simpan Perubahan
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" /> Buat Aturan Fee
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
