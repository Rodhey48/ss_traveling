import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, RotateCcw, Loader2 } from 'lucide-react';
import { JournalService } from '@/services/journal.service';
import type { JournalEntry, ReverseJournalFormData } from '@/types';
import { toast } from 'sonner';

interface ReverseJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  journal: JournalEntry | null;
}

export default function ReverseJournalModal({
  isOpen,
  onClose,
  onSuccess,
  journal,
}: ReverseJournalModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [reversalDate, setReversalDate] = useState(today);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!journal) return null;

  const formatRupiah = (val: string | number) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error('Alasan pembatalan/reversal jurnal wajib diisi.');
      return;
    }

    const payload: ReverseJournalFormData = {
      reason: reason.trim(),
      reversalDate,
    };

    setSubmitting(true);
    try {
      const res = await JournalService.reverseJournal(journal.id, payload);
      toast.success('Jurnal pembalik berhasil dibuat!', {
        description: `Nomor jurnal pembalik: ${res.data?.journalNo}`,
      });
      setReason('');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Gagal membalik jurnal', {
        description: err.response?.data?.message || err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-800">
                Pembalikan Jurnal (Reversal Entry)
              </DialogTitle>
              <p className="text-xs text-slate-500">
                Koreksi transaksi akuntansi melalui penerbitan jurnal pembalik
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Target Journal Snapshot */}
          <div className="bg-slate-50 p-3 rounded-lg border text-xs space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Jurnal yang Dibalik:</span>
              <span className="font-mono font-bold text-blue-700">{journal.journalNo}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Tanggal Asal:</span>
              <span className="font-medium text-slate-700">{journal.journalDate}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Total Transaksi:</span>
              <span className="font-mono font-bold text-slate-900">
                {formatRupiah(journal.totalDebit)}
              </span>
            </div>
            <div className="border-t pt-1.5 text-slate-600">
              <span className="text-slate-400 block text-[11px]">Keterangan:</span>
              <p className="font-medium mt-0.5">{journal.description}</p>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-800 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">Perhatian Akuntansi:</span>
              <p className="mt-0.5 text-rose-700">
                Jurnal yang sudah diposting tidak dapat diedit atau dihapus. Sistem akan menerbitkan <strong>Jurnal Pembalik Baru</strong> dengan posisi Debit dan Kredit tertukar secara otomatis, dan status jurnal <strong>{journal.journalNo}</strong> akan diubah permanen menjadi <strong>REVERSED</strong>.
              </p>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-700">
              Tanggal Jurnal Pembalik <span className="text-rose-500">*</span>
            </Label>
            <Input
              type="date"
              value={reversalDate}
              onChange={(e) => setReversalDate(e.target.value)}
              className="mt-1 h-9 text-sm bg-white"
              required
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-700">
              Alasan Pembalikan (Reversal Reason) <span className="text-rose-500">*</span>
            </Label>
            <textarea
              rows={3}
              placeholder="Contoh: Koreksi salah pembebanan akun biaya atau revisi nota operasional"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full p-2.5 text-xs rounded-md border border-input bg-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              required
            />
          </div>

          <DialogFooter className="border-t pt-3 flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Batal
            </Button>
            <Button
              type="submit"
              className="bg-rose-600 hover:bg-rose-700 text-white"
              disabled={submitting || !reason.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Memproses Reversal...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-1.5" />
                  Konfirmasi Pembalikan Jurnal
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
