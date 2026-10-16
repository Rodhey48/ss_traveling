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
import type {
  FiscalPeriod,
  UpdatePeriodStatusFormData,
  FiscalPeriodStatus,
} from '@/types';

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
  isLoading,
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
    await onSubmit({
      status,
      reason: reason || undefined,
    });
  };

  const isReasonRequired = status === 'REOPENED';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Ubah Status Periode: {period?.name}</DialogTitle>
          <DialogDescription>
            Atur status penutupan atau pembukaan kembali periode akuntansi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="status">Status Baru</Label>
            <Select
              value={status}
              onValueChange={(val: FiscalPeriodStatus) => setStatus(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN">OPEN (Periode Terbuka)</SelectItem>
                <SelectItem value="CLOSING">CLOSING (Proses Tutup Buku)</SelectItem>
                <SelectItem value="CLOSED">CLOSED (Periode Terkunci / Ditutup)</SelectItem>
                <SelectItem value="REOPENED">REOPENED (Buka Kembali Khusus)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {status === 'CLOSED' && (
            <div className="rounded-lg border border-rose-200 bg-rose-50/50 dark:bg-rose-950/20 p-3 text-xs text-rose-800 dark:text-rose-300">
              ⚠️ <strong>Peringatan Penguncian:</strong> Setelah periode berstatus <code>CLOSED</code>, seluruh aksi posting jurnal akuntansi dengan tanggal di bulan ini akan <strong>DITOLAK</strong> secara ketat oleh sistem backend.
            </div>
          )}

          {status === 'REOPENED' && (
            <div className="rounded-lg border border-purple-200 bg-purple-50/50 dark:bg-purple-950/20 p-3 text-xs text-purple-800 dark:text-purple-300">
              ℹ️ <strong>Otorisasi Buka Kembali:</strong> Sesuai SOP Blueprint Bab 8.4, pembukaan kembali periode tertutup membutuhkan catatan alasan bisnis yang wajib diisi untuk rekam jejak audit.
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">
              Alasan Perubahan Status {isReasonRequired && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="reason"
              placeholder={
                status === 'REOPENED'
                  ? 'Contoh: Koreksi penyesuaian audit pajak tahunan...'
                  : 'Catatan tambahan (opsional)...'
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required={isReasonRequired}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Menyimpan...' : 'Perbarui Status'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
