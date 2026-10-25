import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Lock, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { PeriodClosingService } from '@/services/period-closing.service';

interface ClosePeriodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  periodId: string;
  periodName: string;
  onSuccess: () => void;
}

export function ClosePeriodModal({
  open,
  onOpenChange,
  periodId,
  periodName,
  onSuccess,
}: ClosePeriodModalProps) {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClosePeriod = async () => {
    setIsSubmitting(true);
    try {
      const res = await PeriodClosingService.closePeriod(periodId, { notes });
      toast.success(res.message || `Periode '${periodName}' berhasil ditutup.`);
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          'Gagal menutup periode fiskal. Pastikan tidak ada pemeriksaan berstatus BLOCKED.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-rose-700">
            <div className="p-2 bg-rose-100 rounded-lg">
              <Lock className="h-5 w-5" />
            </div>
            <DialogTitle className="text-lg font-bold">Kunci & Tutup Buku Periode</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-gray-500 pt-1">
            Anda akan mengunci periode fiskal <strong>{periodName}</strong>. Setelah ditutup, sistem akan menolak
            semua posting transaksi baru pada tanggal periode ini.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Snapshot hasil audit checklist akan disimpan secara permanen sebagai riwayat audit kepatuhan keuangan.
            </span>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="closing-notes" className="text-xs font-semibold">
              Catatan Penutupan Buku (Opsional)
            </Label>
            <Textarea
              id="closing-notes"
              placeholder="Misal: Seluruh rekonsiliasi kas bank & meja pool telah tuntas diverifikasi."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs h-20"
            />
          </div>
        </div>

        <DialogFooter className="border-t pt-3 flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs"
          >
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleClosePeriod}
            disabled={isSubmitting}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            Kunci & Tutup Sekarang
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
