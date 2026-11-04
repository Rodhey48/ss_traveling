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
import { Layers, Check, Loader2, Sparkles } from 'lucide-react';
import type { CostCenter } from '@/types';
import { toast } from 'sonner';

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
    if (!formData.code.trim()) {
      toast.error('Kode unik cost center wajib diisi');
      return;
    }
    if (!formData.name.trim()) {
      toast.error('Nama cost center wajib diisi');
      return;
    }

    await onSubmit({
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      parentId: formData.parentId || undefined,
      description: formData.description.trim() || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              {item ? 'Edit Pusat Biaya (Cost Center)' : 'Tambah Pusat Biaya (Cost Center)'}
            </div>
          </DialogTitle>
          <DialogDescription className="text-xs">
            {item
              ? 'Perbarui dimensi tempat terjadinya beban biaya operasional atau administratif.'
              : 'Konfigurasikan cost center baru untuk penampungan pos beban akuntansi dan operasional.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-xs font-semibold">
                Kode Cost Center <span className="text-destructive">*</span>
              </Label>
              <Input
                id="code"
                placeholder="misal: CC-OPS-POOL"
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    code: e.target.value.toUpperCase(),
                  }))
                }
                disabled={Boolean(item) || loading}
                className="font-mono text-xs font-bold uppercase h-8.5"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold">
                Nama Cost Center <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="misal: Operasional Pool Ciputat"
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

          <div className="space-y-1.5">
            <Label htmlFor="parentId" className="text-xs font-semibold">
              Induk Cost Center (Hierarki Parent)
            </Label>
            <Select
              value={formData.parentId || 'NONE'}
              onValueChange={(val) =>
                setFormData((prev) => ({
                  ...prev,
                  parentId: val === 'NONE' ? '' : val,
                }))
              }
              disabled={loading}
            >
              <SelectTrigger id="parentId" className="text-xs h-9">
                <SelectValue placeholder="Pilih Induk (Opsional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE" className="text-xs">
                  -- Tanpa Induk (Pusat / Root Level) --
                </SelectItem>
                {costCenters
                  .filter((cc) => cc.id !== item?.id)
                  .map((cc) => (
                    <SelectItem key={cc.id} value={cc.id} className="text-xs">
                      {cc.code} — {cc.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="desc" className="text-xs font-semibold">
              Deskripsi / Keterangan Alokasi
            </Label>
            <Input
              id="desc"
              placeholder="misal: Menampung biaya harian operasional kru, bensin, dan perlengkapan pool"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              className="text-xs h-8.5"
              disabled={loading}
            />
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
              ) : item ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Simpan Perubahan
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" /> Tambah Cost Center
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
