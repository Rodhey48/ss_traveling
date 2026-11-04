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
import { Calendar, Check, Sparkles, Loader2 } from 'lucide-react';
import type { FareSeason, FareSeasonFormData } from '@/types';
import { toast } from 'sonner';

interface FareSeasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FareSeasonFormData) => Promise<void>;
  season: FareSeason | null;
  loading: boolean;
}

export default function FareSeasonModal({
  isOpen,
  onClose,
  onSubmit,
  season,
  loading,
}: FareSeasonModalProps) {
  const [formData, setFormData] = useState<FareSeasonFormData>({
    code: '',
    name: '',
    startDate: '',
    endDate: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    if (season) {
      setFormData({
        code: season.code,
        name: season.name,
        startDate: season.startDate ? season.startDate.split('T')[0] : '',
        endDate: season.endDate ? season.endDate.split('T')[0] : '',
        description: season.description || '',
        isActive: season.isActive ?? true,
      });
    } else {
      setFormData({
        code: '',
        name: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        description: '',
        isActive: true,
      });
    }
  }, [season, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error('Kode musim tarif wajib diisi');
      return;
    }
    if (!formData.name.trim()) {
      toast.error('Nama musim tarif wajib diisi');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      toast.error('Tanggal mulai dan selesai musim wajib ditentukan');
      return;
    }
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      toast.error('Tanggal selesai musim tidak boleh lebih awal dari tanggal mulai');
      return;
    }

    await onSubmit({
      ...formData,
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      description: formData.description?.trim(),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              {season ? 'Edit Kalender Musim Tarif' : 'Tambah Kalender Musim Tarif'}
            </div>
          </DialogTitle>
          <DialogDescription className="text-xs">
            {season
              ? 'Perbarui rentang tanggal dan parameter musim tarif dinamis.'
              : 'Daftarkan kalender musim baru (Tuslah Lebaran, Libur Sekolah, dsb.) untuk penyesuaian tarif dinamis.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-xs font-semibold">
                Kode Musim <span className="text-destructive">*</span>
              </Label>
              <Input
                id="code"
                placeholder="misal: LEBARAN_2026"
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                disabled={Boolean(season) || loading}
                className="font-mono text-xs font-bold uppercase h-8.5"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold">
                Nama Musim / Tuslah <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="misal: Tuslah Lebaran 1447H"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="text-xs h-8.5"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startDate" className="text-xs font-semibold">
                Tanggal Mulai Berlaku <span className="text-destructive">*</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="text-xs h-8.5 font-mono"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endDate" className="text-xs font-semibold">
                Tanggal Selesai Berlaku <span className="text-destructive">*</span>
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="text-xs h-8.5 font-mono"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="description" className="text-xs font-semibold">
                Keterangan / Alasan Penetapan Tarif
              </Label>
              <Input
                id="description"
                placeholder="misal: Penyesuaian tarif angkutan mudik & arus balik Idul Fitri"
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="text-xs h-9"
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="isActive" className="text-xs font-semibold">
                Status Kalender
              </Label>
              <Select
                value={formData.isActive ? 'ACTIVE' : 'INACTIVE'}
                onValueChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    isActive: val === 'ACTIVE',
                  }))
                }
                disabled={loading || (season?.code === 'REGULER')}
              >
                <SelectTrigger id="isActive" className="text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE" className="text-xs">
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Aktif Berlaku
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
              ) : season ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Simpan Perubahan
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" /> Buat Musim Tarif
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
