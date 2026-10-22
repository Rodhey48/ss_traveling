import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Scale,
  ShieldCheck,
  Building,
  UserCheck,
  Loader2,
  Navigation,
} from 'lucide-react';
import { CashierService } from '@/services/cashier.service';
import type {
  CrewCashDiscrepancy,
  DiscrepancyResolutionDecision,
  ResolveDiscrepancyFormData,
} from '@/types';
import { toast } from 'sonner';

interface DiscrepancyResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  discrepancy: CrewCashDiscrepancy | null;
  onSuccess: () => void;
}

export const DiscrepancyResolutionModal: React.FC<DiscrepancyResolutionModalProps> = ({
  isOpen,
  onClose,
  discrepancy,
  onSuccess,
}) => {
  const [decision, setDecision] =
    useState<DiscrepancyResolutionDecision>('COMPANY_WAIVER');
  const [resolutionNotes, setResolutionNotes] = useState<string>(
    'GPS valid berhenti di SPBU, rasio liter normal. Selisih disetujui dibebankan ke perusahaan sebagai dispensasi operasional resmi.',
  );
  const [submitting, setSubmitting] = useState(false);

  if (!discrepancy) return null;

  const formatRupiah = (val: number | string | undefined) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(val || 0));
  };

  const handleResolve = async () => {
    if (!resolutionNotes.trim()) {
      toast.error('Catatan pertimbangan keputusan wajib diisi.');
      return;
    }

    try {
      setSubmitting(true);
      const payload: ResolveDiscrepancyFormData = {
        decision,
        resolutionNotes,
      };

      await CashierService.resolveDiscrepancy(discrepancy.id, payload);
      toast.success(
        `Keputusan Finance Manager (${decision}) berhasil disahkan dan Jurnal Rekonsiliasi SPJ telah diposting seimbang!`,
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Gagal mengesahkan putusan: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white text-slate-900 border-none shadow-2xl p-6">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
              <Scale className="h-5 w-5 text-indigo-600" />
              Otorisasi Keputusan Manajer Keuangan (Skenario 4)
            </DialogTitle>
            <Badge variant="outline" className="border-indigo-300 text-indigo-700 font-mono">
              {discrepancy.discrepancyNo}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* DETAIL TEMUAN KASIR */}
          <Card className="border border-slate-200 bg-slate-50/70 p-3.5 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-700">Nomor SPJ / Armada:</span>
              <span className="font-mono font-bold text-slate-900">
                {discrepancy.spj?.spjNo} ({discrepancy.spj?.vehicle?.code})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-700">Kategori Temuan:</span>
              <span className="text-slate-800 font-medium">{discrepancy.sourceType}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold pt-1 border-t border-slate-200">
              <span className="text-rose-700">Nominal Selisih Kas:</span>
              <span className="font-mono text-rose-700 text-base">
                {formatRupiah(discrepancy.differenceAmount)}
              </span>
            </div>
            <div className="pt-1">
              <span className="text-slate-500 block text-[11px]">Kronologi / Alasan Kru:</span>
              <p className="text-slate-800 bg-white p-2 rounded border border-slate-200 mt-0.5">
                "{discrepancy.reason}"
              </p>
            </div>
            {discrepancy.investigationNotes && (
              <div className="flex items-start gap-1.5 text-indigo-900 bg-indigo-50/80 p-2 rounded border border-indigo-200">
                <Navigation className="h-4 w-4 shrink-0 text-indigo-600 mt-0.5" />
                <div>
                  <strong className="block text-[11px]">Data Telematika / GPS Armada:</strong>
                  <span className="text-[11px]">{discrepancy.investigationNotes}</span>
                </div>
              </div>
            )}
          </Card>

          {/* PILIHAN KEPUTUSAN FINANCE MANAGER */}
          <div className="space-y-2 pt-2">
            <Label className="font-bold text-slate-800">
              Pilih Keputusan Resmi Manajer Keuangan:
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Opsi 1: Dispensasi Perusahaan */}
              <div
                onClick={() => {
                  setDecision('COMPANY_WAIVER');
                  setResolutionNotes(
                    'GPS valid berhenti di SPBU, rasio liter normal. Selisih disetujui dibebankan ke perusahaan sebagai dispensasi operasional resmi.',
                  );
                }}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  decision === 'COMPANY_WAIVER'
                    ? 'border-indigo-600 bg-indigo-50/60 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-indigo-900">
                  <Building className="h-4 w-4 text-indigo-600" />
                  <span>Dispensasi Perusahaan</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Selisih ditanggung perusahaan dan dialokasikan ke akun beban{' '}
                  <code className="font-mono text-indigo-700 font-bold">58101 Beban Selisih Kasir Pool</code>.
                </p>
              </div>

              {/* Opsi 2: Bebankan ke Kru */}
              <div
                onClick={() => {
                  setDecision('CHARGE_TO_CREW');
                  setResolutionNotes(
                    'Terbukti kelalaian administrasi kru, selisih disetujui diakui sebagai piutang klaim kru untuk dipotong pada payroll berikutnya.',
                  );
                }}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  decision === 'CHARGE_TO_CREW'
                    ? 'border-rose-600 bg-rose-50/60 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-rose-900">
                  <UserCheck className="h-4 w-4 text-rose-600" />
                  <span>Klaim Piutang Kru</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Selisih dibebankan ke kru terkait dan dialokasikan ke akun aset{' '}
                  <code className="font-mono text-rose-700 font-bold">12901 Piutang Klaim Selisih Kas Kru</code>.
                </p>
              </div>
            </div>
          </div>

          {/* INPUT CATATAN PERTIMBANGAN AUDIT */}
          <div className="space-y-1.5 pt-1">
            <Label className="text-slate-700 font-medium">
              Catatan Dasar Pertimbangan & Otorisasi Audit FM:
            </Label>
            <Textarea
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Masukkan alasan investigasi dan pertimbangan audit..."
              className="text-xs bg-white border-slate-300"
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-4 mt-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            Batal
          </Button>
          <Button
            size="sm"
            disabled={submitting}
            onClick={handleResolve}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Mengesahkan...
              </>
            ) : (
              <>
                <ShieldCheck className="mr-1.5 h-4 w-4" /> Otorisasi Keputusan & Posting Jurnal SPJ
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
