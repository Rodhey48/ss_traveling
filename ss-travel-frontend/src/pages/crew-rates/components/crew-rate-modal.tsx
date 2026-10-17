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
  CrewRateRule,
  CrewRateRuleFormData,
  CrewRole,
  CrewServiceType,
  CrewRateType,
} from '@/types';

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

  useEffect(() => {
    if (rule) {
      setFormData({
        role: rule.role,
        serviceType: rule.serviceType,
        origin: rule.origin,
        destination: rule.destination,
        rateType: rule.rateType,
        mealAllowance: Number(rule.mealAllowance),
        tripIncentive: Number(rule.tripIncentive),
        fullSeatBonus: Number(rule.fullSeatBonus),
        isActive: rule.isActive,
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
    await onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {rule ? 'Edit Standar Kompensasi Kru' : 'Tambah Standar Tarif Kru'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Jabatan Kru</Label>
              <Select
                value={formData.role}
                onValueChange={(val) =>
                  setFormData({ ...formData, role: val as CrewRole })
                }
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRIVER">Driver Utama (Sopir 1)</SelectItem>
                  <SelectItem value="CO_DRIVER">Co-Driver (Sopir 2)</SelectItem>
                  <SelectItem value="CONDUCTOR">Kondektur / Kernet</SelectItem>
                  <SelectItem value="STEWARDESS">Pramugari / Pramugara</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceType">Jenis Layanan</Label>
              <Select
                value={formData.serviceType}
                onValueChange={(val) => {
                  const sType = val as CrewServiceType;
                  setFormData({
                    ...formData,
                    serviceType: sType,
                    rateType: sType === 'AKAP' ? 'PER_TRIP' : 'PER_DAY',
                    fullSeatBonus: sType === 'AKAP' ? 50000 : 0,
                  });
                }}
              >
                <SelectTrigger id="serviceType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AKAP">AKAP Reguler (Trayek)</SelectItem>
                  <SelectItem value="TOURISM">Pariwisata / Sewa Bus</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rateType">Basis Perhitungan Rate</Label>
              <Select
                value={formData.rateType}
                onValueChange={(val) =>
                  setFormData({ ...formData, rateType: val as CrewRateType })
                }
              >
                <SelectTrigger id="rateType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PER_TRIP">Per Ritase PP (AKAP)</SelectItem>
                  <SelectItem value="PER_DAY">Per Hari Jalan (Wisata)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullSeatBonus">Bonus Full Seat (Rp)</Label>
              <Input
                id="fullSeatBonus"
                type="number"
                min={0}
                step={5000}
                value={formData.fullSeatBonus}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    fullSeatBonus: Number(e.target.value),
                  })
                }
                disabled={formData.serviceType === 'TOURISM'}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="meal">
                Uang Makan Standar ({formData.rateType === 'PER_DAY' ? 'Rp / Hari' : 'Rp / Rit'})
              </Label>
              <Input
                id="meal"
                type="number"
                min={0}
                step={5000}
                value={formData.mealAllowance}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    mealAllowance: Number(e.target.value),
                  })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="incentive">
                Premi Ritase ({formData.rateType === 'PER_DAY' ? 'Rp / Hari' : 'Rp / Rit'})
              </Label>
              <Input
                id="incentive"
                type="number"
                min={0}
                step={5000}
                value={formData.tripIncentive}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tripIncentive: Number(e.target.value),
                  })
                }
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : rule ? 'Simpan Perubahan' : 'Buat Standar Tarif'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
