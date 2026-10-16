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
import type { CreateFiscalYearFormData } from '@/types';

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
  isLoading,
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
    await onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Buka Tahun Fiskal Baru</DialogTitle>
          <DialogDescription>
            Sistem akan secara otomatis menghasilkan 12 periode bulanan standar (Januari s.d. Desember) untuk tahun fiskal ini.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="year">
              Tahun Kalender <span className="text-destructive">*</span>
            </Label>
            <Input
              id="year"
              type="number"
              min={2020}
              max={2100}
              value={formData.year}
              onChange={(e) => handleYearChange(parseInt(e.target.value, 10) || currentYear)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Tanggal Mulai</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Tanggal Akhir</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                }
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Membuat...' : 'Buka Tahun Fiskal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
