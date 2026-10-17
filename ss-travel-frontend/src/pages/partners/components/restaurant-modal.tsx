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
import type { Restaurant, RestaurantFormData, RestaurantSettlementType } from '@/types';

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
        isActive: restaurant.isActive,
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
    await onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {restaurant ? 'Edit Rumah Makan Mitra' : 'Daftarkan Rumah Makan Mitra Baru'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Kode Rumah Makan</Label>
              <Input
                id="code"
                placeholder="misal: RM-04"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
                disabled={Boolean(restaurant)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nama Rumah Makan</Label>
              <Input
                id="name"
                placeholder="misal: RM Taman Selera"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Kota / Wilayah</Label>
              <Input
                id="city"
                placeholder="misal: SUBANG"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value.toUpperCase() })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ratePerPax">Tarif Kupon Makan per Pax (Rp)</Label>
              <Input
                id="ratePerPax"
                type="number"
                min={0}
                step={1000}
                value={formData.ratePerPax}
                onChange={(e) =>
                  setFormData({ ...formData, ratePerPax: Number(e.target.value) })
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="settlementType">Mekanisme Pembayaran</Label>
              <Select
                value={formData.settlementType}
                onValueChange={(val) =>
                  setFormData({
                    ...formData,
                    settlementType: val as RestaurantSettlementType,
                  })
                }
              >
                <SelectTrigger id="settlementType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INVOICED_MONTHLY_AP">
                    Invoice Bulanan Hutang Usaha (AP Kupon)
                  </SelectItem>
                  <SelectItem value="PAID_BY_CREW_UJ">
                    Tunai oleh Kru Lapangan (Kasir/UJ SPJ)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPerson">Nama PIC / Kasir RM</Label>
              <Input
                id="contactPerson"
                placeholder="misal: Ibu Haryati"
                value={formData.contactPerson}
                onChange={(e) =>
                  setFormData({ ...formData, contactPerson: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telepon / WhatsApp</Label>
              <Input
                id="phone"
                placeholder="08123456789"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Lokasi / Rest Area</Label>
              <Input
                id="address"
                placeholder="misal: Tol Cipali KM 102 A"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : restaurant ? 'Simpan Perubahan' : 'Daftarkan RM'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
