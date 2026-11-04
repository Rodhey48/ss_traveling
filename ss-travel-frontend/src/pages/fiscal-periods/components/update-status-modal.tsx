import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Lock, Unlock, Clock, CheckCircle2, Loader2, Save } from 'lucide-react';
import type {
  FiscalPeriod,
  UpdatePeriodStatusFormData,
  FiscalPeriodStatus,
} from '@/types';
import { toast } from 'sonner';

interface UpdateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UpdatePeriodStatusFormData) => Promise<void>;
  period?: FiscalPeriod | null;
  isLoading?: boolean;
}

export default function UpdateStatusModal({
  isOpen,
  onClose,
  onSubmit,
  period,
  isLoading = false,
}: UpdateStatusModalProps) {
  const [status, setStatus] = useState<FiscalPeriodStatus>('CLOSED');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (period) {
      if (period.status === 'CLOSED') {
        setStatus('REOPENED');
        setReason('');
      } else if (period.status === 'OPEN') {
        setStatus('CLOSING');
        setReason('');
      } else {
        setStatus('CLOSED');
        setReason('');
      }
    }
  }, [period, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'REOPENED' && !reason.trim()) {
      toast.error('Alasan pembukaan kembali periode wajib diisi');
      return;
    }

    await onSubmit({
      status,
      reason: reason.trim() || undefined,
    });
  };

  const isReasonRequired = status === 'REOPENED';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {status === 'CLOSED' ? (
                <Lock className="h-5 w-5 text-rose-600" />
              ) : status === 'REOPENED' ? (
                <Unlock className="h-5 w-5 text-purple-600" />
              ) : (
                <Clock className="h-5 w-5 text-amber-600" />
              )}
            </div>
            <div>Ubah Status Periode: {period?.name}</div>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Atur status penutupan atau pembukaan kembali periode akuntansi bulanan (SOP Blueprint Bab 8.4).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="status" className="text-xs font-semibold">
              Status Periode Akuntansi <span className="text-destructive">*</span>
            </Label>
            <Select
              value={status}
              onValueChange={(val: FiscalPeriodStatus) => setStatus(val)}
              disabled={isLoading}
            >
              <SelectTrigger id="status" className="text-xs h-9">
                <SelectValue placeholder="Pilih Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN" className="text-xs">
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" /> OPEN (Periode Terbuka — Menerima Jurnal)
                  </span>
                </SelectItem>
                <SelectItem value="CLOSING" className="text-xs">
                  <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                    <Clock className="h-3.5 w-3.5" /> CLOSING (Proses Audit Tutup Buku)
                  </span>
                </SelectItem>
                <SelectItem value="CLOSED" className="text-xs">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                    <Lock className="h-3.5 w-3.5" /> CLOSED (Periode Terkunci — Tolak Posting Jurnal)
                  </span>
                </SelectItem>
                <SelectItem value="REOPENED" className="text-xs">
                  <span className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 font-medium">
                    <Unlock className="h-3.5 w-3.5" /> REOPENED (Buka Kembali Khusus Audit)
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {status === 'CLOSED' && (
            <div className="rounded-xl border border-rose-200/80 bg-rose-50/50 dark:bg-rose-950/20 p-3 text-xs text-rose-800 dark:text-rose-300">
              ⚠️ <strong>Peringatan Penguncian:</strong> Setelah periode berstatus <code>CLOSED</code>, seluruh aksi posting jurnal akuntansi GL dengan tanggal di bulan ini akan <strong>DITOLAK OTOMATIS</strong> oleh backend engine.
            </div>
          )}

          {status === 'REOPENED' && (
            <div className="rounded-xl border border-purple-200/80 bg-purple-50/50 dark:bg-purple-950/20 p-3 text-xs text-purple-800 dark:text-purple-300">
              ℹ️ <strong>Otorisasi Buka Kembali:</strong> Sesuai SOP Blueprint Bab 8.4, pembukaan kembali periode tertutup membutuhkan catatan alasan bisnis yang wajib diisi untuk rekam jejak audit keuangan.
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="reason" className="text-xs font-semibold">
              Alasan Perubahan Status {isReasonRequired && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="reason"
              placeholder={
                status === 'REOPENED'
                  ? 'Contoh: Koreksi penyesuaian audit pajak tahunan atas persetujuan Finance Manager...'
                  : 'Catatan tambahan (opsional)...'
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required={isReasonRequired}
              className="text-xs h-8.5"
              disabled={isLoading}
            />
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
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" /> Perbarui Status Periode
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
