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
import { XCircle } from 'lucide-react';
import { CashBankService } from '@/services/cash-bank.service';
import type { FundTransfer } from '@/types';
import { toast } from 'sonner';

interface RejectTransferModalProps {
  transfer: FundTransfer | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RejectTransferModal({
  transfer,
  isOpen,
  onClose,
  onSuccess,
}: RejectTransferModalProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transfer) return;

    if (!reason.trim()) {
      toast.error('Alasan penolakan wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      await CashBankService.rejectFundTransfer(transfer.id, {
        rejectionReason: reason.trim(),
      });
      toast.success('Pengajuan pemindahan dana telah ditolak');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Gagal menolak pengajuan', {
        description: err?.response?.data?.message || err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Tolak Pengajuan Pemindahan Dana</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Nomor Transfer: <strong className="font-mono text-foreground">{transfer?.transferNo}</strong>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Alasan Penolakan</Label>
            <Input
              placeholder="Contoh: Nominal tidak sesuai dengan SPJ / Dokumen lampiran kurang lengkap"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="text-xs h-9"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting} className="text-xs h-9">
              Batal
            </Button>
            <Button type="submit" variant="destructive" disabled={submitting} className="text-xs h-9">
              {submitting ? 'Menolak...' : 'Konfirmasi Tolak'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
