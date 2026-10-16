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
import { Layers } from 'lucide-react';
import type { CostCenter } from '@/types';

interface CostCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<CostCenter>) => Promise<void>;
  item?: CostCenter | null;
  costCenters: CostCenter[];
  loading?: boolean;
}

export default function CostCenterModal({
  isOpen,
  onClose,
  onSubmit,
  item,
  costCenters,
  loading = false,
}: CostCenterModalProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    parentId: '',
    description: '',
  });

  useEffect(() => {
    if (item) {
      setFormData({
        code: item.code,
        name: item.name,
        parentId: item.parentId || '',
        description: item.description || '',
      });
    } else {
      setFormData({ code: '', name: '', parentId: '', description: '' });
    }
  }, [item, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      ...formData,
      parentId: formData.parentId || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Layers className="h-5 w-5 text-primary" />
            {item ? 'Edit Cost Center' : 'Tambah Cost Center'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="code" className="text-xs font-semibold">
              Kode Cost Center <span className="text-destructive">*</span>
            </Label>
            <Input
              id="code"
              placeholder="Contoh: CC-OPS-POOL"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="name" className="text-xs font-semibold">
              Nama Cost Center <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Contoh: Operasional Pool Ciputat"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="parentId" className="text-xs font-semibold">
              Induk Cost Center (Parent)
            </Label>
            <Select
              value={formData.parentId || 'NONE'}
              onValueChange={(val) =>
                setFormData({ ...formData, parentId: val === 'NONE' ? '' : val })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Induk (Opsional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Tanpa Induk (Pusat / Root)</SelectItem>
                {costCenters
                  .filter((cc) => cc.id !== item?.id)
                  .map((cc) => (
                    <SelectItem key={cc.id} value={cc.id}>
                      {cc.code} - {cc.name}
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
              placeholder="Keterangan alokasi biaya"
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
