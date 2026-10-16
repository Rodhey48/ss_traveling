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
import { TrendingUp } from 'lucide-react';
import type { ProfitCenter, BusinessUnit } from '@/types';

interface ProfitCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<ProfitCenter>) => Promise<void>;
  item?: ProfitCenter | null;
  businessUnits: BusinessUnit[];
  loading?: boolean;
}

export default function ProfitCenterModal({
  isOpen,
  onClose,
  onSubmit,
  item,
  businessUnits,
  loading = false,
}: ProfitCenterModalProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    businessUnitId: '',
    description: '',
  });

  useEffect(() => {
    if (item) {
      setFormData({
        code: item.code,
        name: item.name,
        businessUnitId: item.businessUnitId || '',
        description: item.description || '',
      });
    } else {
      setFormData({ code: '', name: '', businessUnitId: '', description: '' });
    }
  }, [item, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      ...formData,
      businessUnitId: formData.businessUnitId || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <TrendingUp className="h-5 w-5 text-primary" />
            {item ? 'Edit Profit Center' : 'Tambah Profit Center'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="code" className="text-xs font-semibold">
              Kode Profit Center <span className="text-destructive">*</span>
            </Label>
            <Input
              id="code"
              placeholder="Contoh: PC-AKAP"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="name" className="text-xs font-semibold">
              Nama Profit Center <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Contoh: Profit Center AKAP Reguler"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bu" className="text-xs font-semibold">
              Tautkan Unit Bisnis
            </Label>
            <Select
              value={formData.businessUnitId || 'NONE'}
              onValueChange={(val) =>
                setFormData({
                  ...formData,
                  businessUnitId: val === 'NONE' ? '' : val,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Unit Bisnis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Tanpa Unit Bisnis Khusus</SelectItem>
                {businessUnits.map((bu) => (
                  <SelectItem key={bu.id} value={bu.id}>
                    {bu.code} - {bu.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="desc" className="text-xs font-semibold">
              Keterangan
            </Label>
            <Input
              id="desc"
              placeholder="Analisis laba / margin pendapatan"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
