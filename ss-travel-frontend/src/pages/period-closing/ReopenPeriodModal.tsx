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
import { Unlock, Loader2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { PeriodClosingService } from '@/services/period-closing.service';

interface ReopenPeriodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  periodId: string;
  periodName: string;
  onSuccess: () => void;
}

export function ReopenPeriodModal({
  open,
  onOpenChange,
  periodId,
  periodName,
  onSuccess,
}: ReopenPeriodModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReopenPeriod = async () => {
    if (!reason.trim()) {
      toast.error('Alasan pembukaan kembali periode fiskal wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await PeriodClosingService.reopenPeriod(periodId, { reason });
      toast.success(res.message || `Periode '${periodName}' berhasil dibuka kembali.`);
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Gagal membuka kembali periode fiskal.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-700">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Unlock className="h-5 w-5" />
            </div>
            <DialogTitle className="text-lg font-bold">Otorisasi Pembukaan Periode (Reopen)</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-gray-500 pt-1">
            Membuka kembali periode fiskal <strong>{periodName}</strong> yang sebelumnya telah berstatus CLOSED.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-900 flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Perhatian Audit:</strong> Tindakan ini hanya boleh dilakukan atas otorisasi Finance Manager
              atau Super Admin dan akan dicatat dalam jejak audit kepatuhan akuntansi.
            </span>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reopen-reason" className="text-xs font-semibold">
              Alasan Pembukaan Kembali (Wajib Diisi) *
            </Label>
            <Textarea
              id="reopen-reason"
              placeholder="Contoh: Koreksi penyesuaian invoice servis makan RM mitra yang tertinggal pada audit akhir bulan."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="text-xs h-24"
              required
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
            onClick={handleReopenPeriod}
            disabled={isSubmitting || !reason.trim()}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlock className="h-4 w-4" />}
            Buka Kembali Periode
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
