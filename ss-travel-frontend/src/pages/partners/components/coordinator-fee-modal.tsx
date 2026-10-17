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
import type {
  CoordinatorFeeRule,
  CoordinatorFeeRuleFormData,
  CoordinatorZone,
  User,
} from '@/types';

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

  useEffect(() => {
    if (rule) {
      setFormData({
        zone: rule.zone,
        coordinatorUserId: rule.coordinatorUserId || '',
        feePerPax: Number(rule.feePerPax),
        isActive: rule.isActive,
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
    await onSubmit({
      ...formData,
      coordinatorUserId:
        formData.coordinatorUserId && formData.coordinatorUserId !== 'NONE'
          ? formData.coordinatorUserId
          : undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {rule ? 'Edit Aturan Fee Korlap' : 'Tambah Aturan Fee Korlap'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="zone">Zona Wilayah Korlap</Label>
            <Select
              value={formData.zone}
              onValueChange={(val) =>
                setFormData({ ...formData, zone: val as CoordinatorZone })
              }
              disabled={Boolean(rule)}
            >
              <SelectTrigger id="zone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WEST">
                  Zona Barat (Jabodetabek / Pool Ciputat)
                </SelectItem>
                <SelectItem value="EAST">
                  Zona Timur (Jateng &amp; DIY / Terminal Yogya)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="coordinatorUser">Personel Korlap Lapangan (Opsional)</Label>
            <Select
              value={formData.coordinatorUserId || 'NONE'}
              onValueChange={(val) =>
                setFormData({
                  ...formData,
                  coordinatorUserId: val === 'NONE' ? '' : val,
                })
              }
            >
              <SelectTrigger id="coordinatorUser">
                <SelectValue placeholder="Pilih User Korlap" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">-- Umum / Tanpa Personel Khusus --</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feePerPax">Besaran Fee Jasa per Penumpang (Rp / Pax)</Label>
            <Input
              id="feePerPax"
              type="number"
              min={0}
              step={1000}
              value={formData.feePerPax}
              onChange={(e) =>
                setFormData({ ...formData, feePerPax: Number(e.target.value) })
              }
              required
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : rule ? 'Simpan Perubahan' : 'Buat Aturan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
