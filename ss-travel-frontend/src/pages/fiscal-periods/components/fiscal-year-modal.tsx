import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarRange, Sparkles, Loader2 } from 'lucide-react';
import type { CreateFiscalYearFormData } from '@/types';
import { toast } from 'sonner';

interface FiscalYearModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateFiscalYearFormData) => Promise<void>;
  isLoading?: boolean;
}

export default function FiscalYearModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: FiscalYearModalProps) {
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  const [formData, setFormData] = useState<CreateFiscalYearFormData>({
    year: nextYear,
    startDate: `${nextYear}-01-01`,
    endDate: `${nextYear}-12-31`,
  });

  const handleYearChange = (yearVal: number) => {
    setFormData({
      year: yearVal,
      startDate: `${yearVal}-01-01`,
      endDate: `${yearVal}-12-31`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.year || formData.year < 2020 || formData.year > 2100) {
      toast.error('Masukkan tahun kalender yang valid (2020 - 2100)');
      return;
    }
    if (formData.startDate > formData.endDate) {
      toast.error('Tanggal mulai tidak boleh melebihi tanggal akhir');
      return;
    }

    await onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <CalendarRange className="h-5 w-5" />
            </div>
            <div>Buka Tahun Fiskal Kalender Baru</div>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Sistem akuntansi akan secara otomatis menginisialisasi 12 periode bulanan standar (P-01 s.d. P-12) dengan status aktif <strong>OPEN</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="year" className="text-xs font-semibold">
              Tahun Kalender Fiskal <span className="text-destructive">*</span>
            </Label>
            <Input
              id="year"
              type="number"
              min={2020}
              max={2100}
              value={formData.year}
              onChange={(e) =>
                handleYearChange(parseInt(e.target.value, 10) || currentYear)
              }
              className="font-mono text-sm font-bold h-9"
              required
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="startDate" className="text-xs font-semibold">
                Tanggal Mulai Fiskal
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="font-mono text-xs h-8.5"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="endDate" className="text-xs font-semibold">
                Tanggal Akhir Fiskal
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className="font-mono text-xs h-8.5"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="rounded-xl border border-blue-200/80 bg-blue-50/50 dark:bg-blue-950/20 p-3 text-xs text-blue-800 dark:text-blue-300">
            ℹ️ <strong>Otomasi Periode:</strong> 12 periode bulanan (Januari s.d. Desember {formData.year}) akan langsung terhubung ke entitas perusahaan PT SS Travelink Official untuk menerima posting jurnal.
          </div>

          <DialogFooter className="pt-3 border-t border-slate-200/80 dark:border-white/10 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="text-xs h-8.5"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="text-xs h-8.5 gap-1.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Menghasilkan 12 Periode...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" /> Buka Tahun Fiskal {formData.year}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
