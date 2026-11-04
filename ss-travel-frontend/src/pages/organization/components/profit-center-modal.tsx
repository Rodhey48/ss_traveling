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
import { TrendingUp, Check, Loader2, Sparkles } from 'lucide-react';
import type { ProfitCenter, BusinessUnit } from '@/types';
import { toast } from 'sonner';

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
    if (!formData.code.trim()) {
      toast.error('Kode unik profit center wajib diisi');
      return;
    }
    if (!formData.name.trim()) {
      toast.error('Nama profit center wajib diisi');
      return;
    }

    await onSubmit({
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      businessUnitId: formData.businessUnitId || undefined,
      description: formData.description.trim() || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              {item ? 'Edit Pusat Laba (Profit Center)' : 'Tambah Pusat Laba (Profit Center)'}
            </div>
          </DialogTitle>
          <DialogDescription className="text-xs">
            {item
              ? 'Perbarui unit pertanggungjawaban laba kotor & margin kontribusi per lini bisnis.'
              : 'Daftarkan profit center baru untuk pelaporan kinerja finansial mandiri lini usaha.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-xs font-semibold">
                Kode Profit Center <span className="text-destructive">*</span>
              </Label>
              <Input
                id="code"
                placeholder="misal: PC-AKAP"
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
                Nama Profit Center <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="misal: Profit Center AKAP Reguler"
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
            <Label htmlFor="bu" className="text-xs font-semibold">
              Tautkan Unit Bisnis
            </Label>
            <Select
              value={formData.businessUnitId || 'NONE'}
              onValueChange={(val) =>
                setFormData((prev) => ({
                  ...prev,
                  businessUnitId: val === 'NONE' ? '' : val,
                }))
              }
              disabled={loading}
            >
              <SelectTrigger id="bu" className="text-xs h-9">
                <SelectValue placeholder="Pilih Unit Bisnis Terkait" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE" className="text-xs">
                  -- Tanpa Unit Bisnis Khusus --
                </SelectItem>
                {businessUnits.map((bu) => (
                  <SelectItem key={bu.id} value={bu.id} className="text-xs">
                    {bu.code} — {bu.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="desc" className="text-xs font-semibold">
              Deskripsi / Keterangan Analisis
            </Label>
            <Input
              id="desc"
              placeholder="misal: Menampung laba kotor & margin kontribusi divisi pariwisata"
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
                  <Sparkles className="h-3.5 w-3.5" /> Tambah Profit Center
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
