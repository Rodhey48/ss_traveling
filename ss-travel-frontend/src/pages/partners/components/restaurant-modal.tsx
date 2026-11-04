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
import { Utensils, Check, Sparkles, Loader2 } from 'lucide-react';
import type { Restaurant, RestaurantFormData, RestaurantSettlementType } from '@/types';
import { toast } from 'sonner';

interface RestaurantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RestaurantFormData) => Promise<void>;
  restaurant: Restaurant | null;
  loading: boolean;
}

export default function RestaurantModal({
  isOpen,
  onClose,
  onSubmit,
  restaurant,
  loading,
}: RestaurantModalProps) {
  const [formData, setFormData] = useState<RestaurantFormData>({
    code: '',
    name: '',
    city: 'SUBANG',
    address: '',
    phone: '',
    ratePerPax: 25000,
    settlementType: 'INVOICED_MONTHLY_AP',
    contactPerson: '',
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
    if (restaurant) {
      setFormData({
        code: restaurant.code,
        name: restaurant.name,
        city: restaurant.city,
        address: restaurant.address || '',
        phone: restaurant.phone || '',
        ratePerPax: Number(restaurant.ratePerPax),
        settlementType: restaurant.settlementType,
        contactPerson: restaurant.contactPerson || '',
        isActive: restaurant.isActive ?? true,
      });
    } else {
      setFormData({
        code: '',
        name: '',
        city: 'SUBANG',
        address: '',
        phone: '',
        ratePerPax: 25000,
        settlementType: 'INVOICED_MONTHLY_AP',
        contactPerson: '',
        isActive: true,
      });
    }
  }, [restaurant, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error('Kode unik rumah makan wajib diisi');
      return;
    }
    if (!formData.name.trim()) {
      toast.error('Nama rumah makan mitra wajib diisi');
      return;
    }
    if (!formData.city.trim()) {
      toast.error('Kota / lokasi rumah makan wajib diisi');
      return;
    }
    if (formData.ratePerPax <= 0) {
      toast.error('Tarif kupon makan per pax harus lebih dari Rp 0');
      return;
    }

    await onSubmit({
      ...formData,
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      city: formData.city.trim().toUpperCase(),
      address: formData.address?.trim() || undefined,
      phone: formData.phone?.trim() || undefined,
      contactPerson: formData.contactPerson?.trim() || undefined,
      ratePerPax: Number(formData.ratePerPax),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Utensils className="h-5 w-5" />
            </div>
            <div>
              {restaurant
                ? 'Edit Rumah Makan Rekanan Servis Makan'
                : 'Daftarkan Rumah Makan Mitra Baru'}
            </div>
          </DialogTitle>
          <DialogDescription className="text-xs">
            {restaurant
              ? 'Perbarui tarif kupon makan penumpang dan mekanisme settlement akuntansinya.'
              : 'Daftarkan restoran rekanan untuk tempat singgah servis makan penumpang bus AKAP.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Identitas RM */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-xs font-semibold">
                Kode Rumah Makan <span className="text-destructive">*</span>
              </Label>
              <Input
                id="code"
                placeholder="misal: RM-04"
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    code: e.target.value.toUpperCase(),
                  }))
                }
                disabled={Boolean(restaurant) || loading}
                className="font-mono text-xs font-bold uppercase h-8.5"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold">
                Nama Rumah Makan <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="misal: RM Taman Selera Cipali"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="text-xs h-8.5 font-medium"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Kota Lokasi & Tarif Kupon per Pax */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="city" className="text-xs font-semibold">
                Kota / Wilayah Operasional <span className="text-destructive">*</span>
              </Label>
              <Input
                id="city"
                placeholder="misal: SUBANG"
                value={formData.city}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    city: e.target.value.toUpperCase(),
                  }))
                }
                className="font-mono text-xs uppercase h-8.5"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ratePerPax" className="text-xs font-semibold flex items-center justify-between">
                <span>Tarif Kupon per Pax (Rp) <span className="text-destructive">*</span></span>
                <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(formData.ratePerPax || 0)}
                </span>
              </Label>
              <Input
                id="ratePerPax"
                type="number"
                min={0}
                step={1000}
                value={formData.ratePerPax}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    ratePerPax: Number(e.target.value) || 0,
                  }))
                }
                className="font-mono text-xs font-bold h-8.5"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Mekanisme Pembayaran & Status Keaktifan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="settlementType" className="text-xs font-semibold">
                Mekanisme Pembayaran <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.settlementType}
                onValueChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    settlementType: val as RestaurantSettlementType,
                  }))
                }
                disabled={loading}
              >
                <SelectTrigger id="settlementType" className="text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INVOICED_MONTHLY_AP" className="text-xs">
                    Tagihan Hutang AP Bulanan (Kupon)
                  </SelectItem>
                  <SelectItem value="PAID_BY_CREW_UJ" className="text-xs">
                    Tunai oleh Kru Lapangan (Kasir / UJ)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="isActive" className="text-xs font-semibold">
                Status Operasional
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
                      Aktif Operasional
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

          {/* Kontak & Lokasi Rest Area */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="contactPerson" className="text-xs font-semibold">
                PIC / Kasir RM
              </Label>
              <Input
                id="contactPerson"
                placeholder="misal: Ibu Haryati"
                value={formData.contactPerson || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    contactPerson: e.target.value,
                  }))
                }
                className="text-xs h-8.5"
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-semibold">
                Telepon / WhatsApp
              </Label>
              <Input
                id="phone"
                placeholder="08123456789"
                value={formData.phone || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                className="text-xs h-8.5 font-mono"
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-xs font-semibold">
                Lokasi / Rest Area
              </Label>
              <Input
                id="address"
                placeholder="misal: Rest Area KM 102 A"
                value={formData.address || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
                className="text-xs h-8.5"
                disabled={loading}
              />
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
              ) : restaurant ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Simpan Perubahan
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" /> Daftarkan Rumah Makan
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
