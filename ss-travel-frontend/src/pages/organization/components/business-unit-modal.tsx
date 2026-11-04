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
import { Briefcase, Check, Loader2, Sparkles } from 'lucide-react';
import type { BusinessUnit } from '@/types';
import { toast } from 'sonner';

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
    if (!formData.code.trim()) {
      toast.error('Kode unik unit bisnis wajib diisi');
      return;
    }
    if (!formData.name.trim()) {
      toast.error('Nama unit bisnis wajib diisi');
      return;
    }

    await onSubmit({
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              {item ? 'Edit Unit Bisnis Operasional' : 'Tambah Unit Bisnis Operasional'}
            </div>
          </DialogTitle>
          <DialogDescription className="text-xs">
            {item
              ? 'Perbarui data lini bisnis atau klasifikasi layanan armada bus.'
              : 'Daftarkan klasifikasi unit bisnis baru (misal: AKAP, Wisata, atau Shuttle).'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-xs font-semibold">
                Kode Unit Bisnis <span className="text-destructive">*</span>
              </Label>
              <Input
                id="code"
                placeholder="misal: AKAP / WISATA"
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
                Nama Unit Bisnis <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="misal: AKAP Reguler"
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
            <Label htmlFor="desc" className="text-xs font-semibold">
              Deskripsi / Cakupan Layanan
            </Label>
            <Input
              id="desc"
              placeholder="misal: Trayek reguler bus antarkota antarprovinsi rute Tangerang - Yogya"
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
                  <Sparkles className="h-3.5 w-3.5" /> Tambah Unit Bisnis
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
