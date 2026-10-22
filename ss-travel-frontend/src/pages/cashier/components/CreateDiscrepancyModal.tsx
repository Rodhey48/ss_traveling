import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2 } from 'lucide-react';
import { CashierService } from '@/services/cashier.service';
import type {
  SettlementSummary,
  CreateDiscrepancyFormData,
  DiscrepancySourceType,
} from '@/types';
import { toast } from 'sonner';

interface CreateDiscrepancyModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: SettlementSummary | null;
  onSuccess: () => void;
}

export const CreateDiscrepancyModal: React.FC<CreateDiscrepancyModalProps> = ({
  isOpen,
  onClose,
  summary,
  onSuccess,
}) => {
  const [sourceType, setSourceType] =
    useState<DiscrepancySourceType>('UJ_EXPENSE_UNVERIFIED');
  const [expectedAmount, setExpectedAmount] = useState<number>(0);
  const [actualAmount, setActualAmount] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [investigationNotes, setInvestigationNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (summary) {
      if (summary.kantong1Uj.balance > 0) {
        setSourceType('UJ_EXPENSE_UNVERIFIED');
        setExpectedAmount(summary.kantong1Uj.totalDisbursed - summary.kantong1Uj.totalReturned);
        setActualAmount(summary.kantong1Uj.totalSpent);
        setReason('Struk SPBU Palimanan hilang saat pengisian solar darurat.');
      } else if (summary.kantong2Revenue.balance > 0) {
        setSourceType('REVENUE_SHORTAGE');
        setExpectedAmount(summary.kantong2Revenue.totalExpected);
        setActualAmount(summary.kantong2Revenue.totalRemitted);
        setReason('Uang fisik setoran kas kru kurang dari target manifes.');
      }
    }
  }, [summary]);

  if (!summary) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error('Alasan temuan selisih wajib diisi.');
      return;
    }

    try {
      setSubmitting(true);
      const payload: CreateDiscrepancyFormData = {
        spjId: summary.spj.id,
        settlementId: summary.existingSettlement?.id,
        sourceType,
        expectedAmount,
        actualAmount,
        differenceAmount: expectedAmount - actualAmount,
        responsibleCrewId: summary.spj.crewAssignments?.[0]?.crewId,
        reason,
        investigationNotes: investigationNotes || undefined,
      };

      await CashierService.createDiscrepancy(payload);
      toast.success('Temuan selisih kasir berhasil dicatat (Jalur Sistemik Lapis 2) dan dialihkan ke Manajer Keuangan.');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Gagal mencatat selisih: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-white text-slate-900 border-none shadow-2xl p-6">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-base font-bold flex items-center gap-2 text-rose-700">
            <AlertCircle className="h-5 w-5 text-rose-600" />
            Catat Temuan Selisih Meja Kasir (Lapis 2 Sistemik)
          </DialogTitle>
          <p className="text-xs text-slate-500">
            SPJ: {summary.spj.spjNo} ({summary.spj.vehicle?.code})
          </p>
        </DialogHeader>

        <div className="space-y-3.5 py-2 text-xs">
          <div>
            <Label className="text-slate-700">Kategori Selisih Kas</Label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value as DiscrepancySourceType)}
              className="w-full mt-1 border border-slate-300 rounded px-2.5 py-1.5 bg-white text-xs"
            >
              <option value="UJ_EXPENSE_UNVERIFIED">Uang Jalan: Struk/Nota Hilang atau Belum Sah</option>
              <option value="REVENUE_SHORTAGE">Penerimaan Kas: Setoran Kurang dari Manifes</option>
              <option value="REVENUE_OVERAGE">Penerimaan Kas: Setoran Lebih dari Manifes</option>
              <option value="OTHER">Lainnya / Anomali Operasional</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-700">Nominal Seharusnya (Rp)</Label>
              <Input
                type="number"
                value={expectedAmount}
                onChange={(e) => setExpectedAmount(Number(e.target.value))}
                className="mt-1 text-xs font-mono"
              />
            </div>
            <div>
              <Label className="text-slate-700">Nominal Aktual (Rp)</Label>
              <Input
                type="number"
                value={actualAmount}
                onChange={(e) => setActualAmount(Number(e.target.value))}
                className="mt-1 text-xs font-mono"
              />
            </div>
          </div>

          <div className="p-2.5 bg-rose-50 rounded border border-rose-200 flex justify-between font-bold text-rose-900">
            <span>Selisih Temuan:</span>
            <span className="font-mono">Rp {(expectedAmount - actualAmount).toLocaleString('id-ID')}</span>
          </div>

          <div>
            <Label className="text-slate-700">Alasan Kasir & Penjelasan Kru:</Label>
            <Textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Jelaskan temuan di meja kasir..."
              className="mt-1 text-xs bg-white"
            />
          </div>

          <div>
            <Label className="text-slate-700">Catatan Awal Investigasi / Lokasi GPS (Opsional):</Label>
            <Input
              value={investigationNotes}
              onChange={(e) => setInvestigationNotes(e.target.value)}
              placeholder="Misal: Berhenti di Rest Area KM 208 Palimanan"
              className="mt-1 text-xs bg-white"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t pt-3">
          <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            Batal
          </Button>
          <Button
            size="sm"
            disabled={submitting}
            onClick={handleSubmit}
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Menyimpan...
              </>
            ) : (
              'Kirim ke Manajer Keuangan'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
