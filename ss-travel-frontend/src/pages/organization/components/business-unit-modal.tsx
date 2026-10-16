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
import { Briefcase } from 'lucide-react';
import type { BusinessUnit } from '@/types';

interface BusinessUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<BusinessUnit>) => Promise<void>;
  item?: BusinessUnit | null;
  loading?: boolean;
}

export default function BusinessUnitModal({
  isOpen,
  onClose,
  onSubmit,
  item,
  loading = false,
}: BusinessUnitModalProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
  });

  useEffect(() => {
    if (item) {
      setFormData({
        code: item.code,
        name: item.name,
        description: item.description || '',
      });
    } else {
      setFormData({ code: '', name: '', description: '' });
    }
  }, [item, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Briefcase className="h-5 w-5 text-primary" />
            {item ? 'Edit Unit Bisnis' : 'Tambah Unit Bisnis'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="code" className="text-xs font-semibold">
              Kode Unit Bisnis <span className="text-destructive">*</span>
            </Label>
            <Input
              id="code"
              placeholder="Contoh: AKAP / WISATA"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="name" className="text-xs font-semibold">
              Nama Unit Bisnis <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Contoh: AKAP Reguler"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="desc" className="text-xs font-semibold">
              Deskripsi / Keterangan
            </Label>
            <Input
              id="desc"
              placeholder="Keterangan lini bisnis"
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
