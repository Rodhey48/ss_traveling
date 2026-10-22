import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertCircle,
  AlertTriangle,
  Wallet,
  Receipt,
  Users,
  Coins,
  Loader2,
  Check,
} from 'lucide-react';
import { CashierService } from '@/services/cashier.service';
import { CashBankService } from '@/services/cash-bank.service';
import type {
  SettlementSummary,
  CashAccount,
  CreateSettlementFormData,
} from '@/types';
import { toast } from 'sonner';

interface CashierSettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  spjId: string;
  onSuccess: () => void;
  onOpenDiscrepancyModal: (summary: SettlementSummary) => void;
}

export const CashierSettlementModal: React.FC<CashierSettlementModalProps> = ({
  isOpen,
  onClose,
  spjId,
  onSuccess,
  onOpenDiscrepancyModal,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState<SettlementSummary | null>(null);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [selectedCashAccountId, setSelectedCashAccountId] = useState<string>('');

  // Input setoran tunai baru kru jika belum disetor
  const [depositorCrewId, setDepositorCrewId] = useState<string>('');
  const [remittanceAmount, setRemittanceAmount] = useState<number>(0);
  const [remittanceNotes, setRemittanceNotes] = useState<string>('');
  const [cashPaidToCrew, setCashPaidToCrew] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');

  // Mode Musyawarah Kru (Lapis 1)
  const [showMusyawarahHelper, setShowMusyawarahHelper] = useState(false);
  const [musyawarahAmount, setMusyawarahAmount] = useState<number>(0);

  const fetchSummary = async () => {
    try {
      const [resSummary, resCash] = await Promise.all([
        CashierService.getSettlementSummary(spjId),
        CashBankService.findAllCashAccounts(),
      ]);
      setSummary(resSummary);
      const accounts = resCash.data || [];
      setCashAccounts(accounts);

      // Auto-select Kas Pool Ciputat
      if (accounts.length > 0) {
        const poolCiputat = accounts.find((c) => c.code.includes('CIPUTAT')) || accounts[0];
        setSelectedCashAccountId(poolCiputat.id);
      }

      // Default depositor: Driver 1
      if (resSummary.spj.crewAssignments && resSummary.spj.crewAssignments.length > 0) {
        setDepositorCrewId(resSummary.spj.crewAssignments[0].crewId);
      }

      // Auto-fill remittance amount jika setoran masih kurang
      if (resSummary.kantong2Revenue.balance > 0) {
        setRemittanceAmount(resSummary.kantong2Revenue.balance);
      }
    } catch (err: any) {
      toast.error('Gagal memuat ringkasan meja kasir: ' + (err.response?.data?.message || err.message));
    }
  };

  useEffect(() => {
    if (isOpen && spjId) {
      fetchSummary();
    }
  }, [isOpen, spjId]);

  const formatRupiah = (val: number | string | undefined) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(val || 0));
  };

  // Lapis 1: Musyawarah Kru - Kru menutup kekurangan tunai di meja kasir
  const handleApplyMusyawarah = () => {
    if (!summary) return;
    const revBalance = summary.kantong2Revenue.balance;
    if (revBalance <= 0) {
      toast.info('Setoran kas penerimaan sudah genap, tidak ada kekurangan.');
      return;
    }
    setRemittanceAmount((prev) => prev + (musyawarahAmount || revBalance));
    setShowMusyawarahHelper(false);
    toast.success('Patungan fisik musyawarah kru ditambahkan ke setoran kas.');
  };

  const handleProcessSettlement = async () => {
    if (!selectedCashAccountId) {
      toast.error('Pilih rekening kas pool penerima terlebih dahulu.');
      return;
    }

    try {
      setSubmitting(true);

      const payload: CreateSettlementFormData = {
        spjId,
        cashAccountId: selectedCashAccountId,
        notes: notes || undefined,
        cashPaidToCrew,
      };

      // Jika ada setoran baru yang diinput
      if (remittanceAmount > 0 && depositorCrewId) {
        const allocations: any[] = [];
        let remaining = remittanceAmount;

        if (summary?.kantong2Revenue.breakdownDeclarations) {
          for (const decl of summary.kantong2Revenue.breakdownDeclarations) {
            const needed = decl.amount - (decl.allocatedAmount || 0);
            if (needed > 0 && remaining > 0) {
              const alloc = Math.min(needed, remaining);
              allocations.push({
                revenueDeclarationId: decl.id,
                allocatedAmount: alloc,
                notes: 'Alokasi setoran meja kasir pool',
              });
              remaining -= alloc;
            }
          }
        }

        payload.remittances = [
          {
            spjId,
            depositorCrewId,
            amount: remittanceAmount,
            cashAccountId: selectedCashAccountId,
            notes: remittanceNotes || 'Setoran kas kru di meja kasir',
            allocations,
          },
        ];
      }

      await CashierService.processSettlement(payload);
      toast.success('Rekonsiliasi Meja Kasir Pool berhasil diselesaikan!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Gagal memproses settlement: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (!summary) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl bg-white p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-600 mb-2" />
          <p className="text-sm text-slate-600">Menghitung kalkulasi Dua Kantong Kas Kru...</p>
        </DialogContent>
      </Dialog>
    );
  }

  const isUjBalanced = summary.kantong1Uj.status === 'BALANCED';
  const isRevenueMatched = summary.kantong2Revenue.status === 'MATCHED' || remittanceAmount === summary.kantong2Revenue.balance;
  const canSettleImmediately = isUjBalanced && (isRevenueMatched || summary.discrepancies.length > 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto bg-slate-50 text-slate-900 border-none shadow-2xl p-6">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
                <Receipt className="h-5 w-5 text-emerald-600" />
                Meja Kasir Pool: Rekonsiliasi SPJ {summary.spj.spjNo}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-1">
                Armada: <span className="font-semibold text-slate-700">{summary.spj.vehicle?.code} ({summary.spj.vehicle?.plateNumber})</span> |
                Status: <span className="font-semibold text-slate-700">{summary.spj.financialStatus}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                Anti-Netting Active
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* VISUALISASI DUA KANTONG KAS KRU (ANTI-NETTING) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* KANTONG 1: UANG JALAN (UJ) */}
            <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-blue-600 px-4 py-2.5 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  <span className="font-bold text-xs uppercase tracking-wide">
                    Kantong 1: Pertanggungjawaban UJ
                  </span>
                </div>
                <Badge
                  className={
                    summary.kantong1Uj.status === 'BALANCED'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-rose-500 text-white'
                  }
                >
                  {summary.kantong1Uj.status === 'BALANCED' ? 'BALANCED ✅' : 'DISCREPANCY ⚠️'}
                </Badge>
              </div>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Plafon UJ Dicairkan:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatRupiah(summary.kantong1Uj.totalDisbursed)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Nota Pengeluaran Sah (BBM/Tol):</span>
                  <span className="font-mono font-medium text-slate-700">
                    - {formatRupiah(summary.kantong1Uj.totalSpent)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Sisa Fisik UJ Dikembalikan:</span>
                  <span className="font-mono font-medium text-slate-700">
                    - {formatRupiah(summary.kantong1Uj.totalReturned)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 font-bold text-sm">
                  <span className="text-slate-700">Saldo Sisa UJ:</span>
                  <span
                    className={
                      summary.kantong1Uj.balance === 0
                        ? 'font-mono text-emerald-600'
                        : 'font-mono text-rose-600'
                    }
                  >
                    {formatRupiah(summary.kantong1Uj.balance)}
                  </span>
                </div>

                {summary.kantong1Uj.balance !== 0 && (
                  <div className="rounded bg-rose-50 border border-rose-200 p-2 text-rose-800 text-[11px] flex gap-2 items-start mt-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                    <div>
                      <p className="font-bold">Ada Selisih Uang Jalan Rp {summary.kantong1Uj.balance.toLocaleString('id-ID')}</p>
                      <p className="text-[10px] text-rose-600 mt-0.5">
                        Kru belum menyerahkan nota sah atau uang fisik untuk menutup selisih ini.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* KANTONG 2: PENERIMAAN BRUTO PERUSAHAAN */}
            <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-emerald-700 px-4 py-2.5 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  <span className="font-bold text-xs uppercase tracking-wide">
                    Kantong 2: Setoran Kas Tiket & Kargo
                  </span>
                </div>
                <Badge
                  className={
                    summary.kantong2Revenue.status === 'MATCHED'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-amber-500 text-white'
                  }
                >
                  {summary.kantong2Revenue.status === 'MATCHED' ? 'MATCHED ✅' : 'PENDING SETORAN ⚠️'}
                </Badge>
              </div>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Target Bruto Manifes Kru:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatRupiah(summary.kantong2Revenue.totalExpected)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500">Setoran Fisik Tercatat:</span>
                  <span className="font-mono font-medium text-slate-700">
                    {formatRupiah(summary.kantong2Revenue.totalRemitted)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 font-bold text-sm">
                  <span className="text-slate-700">Kekurangan Setoran:</span>
                  <span
                    className={
                      summary.kantong2Revenue.balance === 0
                        ? 'font-mono text-emerald-600'
                        : 'font-mono text-amber-600'
                    }
                  >
                    {formatRupiah(summary.kantong2Revenue.balance)}
                  </span>
                </div>

                {summary.kantong2Revenue.balance > 0 && (
                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full text-xs text-amber-800 border-amber-300 bg-amber-50 hover:bg-amber-100"
                      onClick={() => setShowMusyawarahHelper(!showMusyawarahHelper)}
                    >
                      <Users className="h-3.5 w-3.5 mr-1" />
                      Lapis 1: Musyawarah Kru di Meja Kasir (Tutup Kekurangan)
                    </Button>

                    {showMusyawarahHelper && (
                      <div className="mt-2 p-2.5 bg-amber-100/70 rounded-lg border border-amber-300 text-[11px] space-y-2">
                        <p className="font-semibold text-amber-900">
                          Kru patungan tunai di meja kasir untuk menggenapkan kekurangan setoran Rp {summary.kantong2Revenue.balance.toLocaleString('id-ID')}:
                        </p>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={musyawarahAmount || summary.kantong2Revenue.balance}
                            onChange={(e) => setMusyawarahAmount(Number(e.target.value))}
                            className="h-7 text-xs bg-white"
                          />
                          <Button size="sm" className="h-7 text-xs bg-amber-700 text-white" onClick={handleApplyMusyawarah}>
                            Genapkan
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* INPUT FORM SETORAN KAS AKTUAL DI MEJA KASIR */}
          {summary.kantong2Revenue.balance > 0 && (
            <Card className="border border-emerald-200 bg-emerald-50/40 p-4 rounded-xl">
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Coins className="h-4 w-4 text-emerald-700" /> Penerimaan Uang Fisik Setoran Baru dari Kru
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <Label className="text-[11px] text-slate-600">Kas Akun Pool Kasir</Label>
                  <select
                    className="w-full mt-1 border border-slate-300 rounded px-2 py-1.5 bg-white text-xs"
                    value={selectedCashAccountId}
                    onChange={(e) => setSelectedCashAccountId(e.target.value)}
                  >
                    {cashAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.code} - {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-[11px] text-slate-600">Kru Penyetor</Label>
                  <select
                    className="w-full mt-1 border border-slate-300 rounded px-2 py-1.5 bg-white text-xs"
                    value={depositorCrewId}
                    onChange={(e) => setDepositorCrewId(e.target.value)}
                  >
                    {summary.spj.crewAssignments?.map((ca) => (
                      <option key={ca.crewId} value={ca.crewId}>
                        {ca.crew?.name} ({ca.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-[11px] text-slate-600">Nominal Fisik Disetor (Rp)</Label>
                  <Input
                    type="number"
                    value={remittanceAmount}
                    onChange={(e) => setRemittanceAmount(Number(e.target.value))}
                    className="mt-1 bg-white text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-slate-600">Catatan Setoran</Label>
                  <Input
                    value={remittanceNotes}
                    onChange={(e) => setRemittanceNotes(e.target.value)}
                    placeholder="Misal: Uang fisik tiket tunai & kargo disetor penuh"
                    className="mt-1 bg-white text-xs"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* RINGKASAN POSISI KAS MEJA KASIR & PEMBAYARAN KRU */}
          <Card className="border border-slate-200 bg-white p-4 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Receipt className="h-4 w-4 text-slate-600" /> Ringkasan Fisik Laci Kasir Pool (BKM & BKK)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Total Fisik Masuk (BKM):</span>
                <span className="font-mono font-bold text-emerald-700 text-base">
                  {formatRupiah(summary.cashDesk.totalCashReceived + remittanceAmount)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Sisa UJ + Setoran Kas Kru</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Hak Kru Dibayar Tunai (BKK):</span>
                <span className="font-mono font-bold text-amber-700 text-base">
                  {cashPaidToCrew ? formatRupiah(summary.cashDesk.totalCrewCompensationPayable) : 'Rp 0'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Uang Makan / Komisi Kargo</span>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200">
                <span className="text-emerald-800 block text-[11px] font-semibold">Net Kas Bertambah di Pool:</span>
                <span className="font-mono font-bold text-emerald-900 text-base">
                  {formatRupiah(
                    summary.cashDesk.totalCashReceived +
                      remittanceAmount -
                      (cashPaidToCrew ? summary.cashDesk.totalCrewCompensationPayable : 0),
                  )}
                </span>
                <span className="text-[10px] text-emerald-700 block mt-0.5">Fisik bersih masuk laci kasir</span>
              </div>
            </div>

            {/* Opsi Pembayaran Tunai Kru & Catatan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {summary.cashDesk.pendingMealPayments.length > 0 && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="cashPaid"
                    checked={cashPaidToCrew}
                    onChange={(e) => setCashPaidToCrew(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <Label htmlFor="cashPaid" className="text-xs text-slate-700 cursor-pointer">
                    Bayarkan hak kru tunai dari kasir pool sekarang via BKK
                  </Label>
                </div>
              )}
              <div>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan proses settlement..."
                  className="text-xs bg-slate-50"
                />
              </div>
            </div>
          </Card>

          {/* TEMUAN SELISIH YANG TERCATAT JIKA ADA */}
          {summary.discrepancies.length > 0 && (
            <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  Ada {summary.discrepancies.length} Temuan Selisih Kas Sistemik Tercatat
                </span>
                <Badge variant="outline" className="border-rose-300 text-rose-800">
                  {summary.discrepancies[0].resolutionStatus}
                </Badge>
              </div>
              <p className="text-[11px] text-rose-800">
                Alasan Kasir: {summary.discrepancies[0].reason} (Nominal: {formatRupiah(summary.discrepancies[0].differenceAmount)})
              </p>
              {summary.discrepancies[0].resolutionStatus === 'RESOLVED' && (
                <div className="text-[11px] text-emerald-800 bg-emerald-100/60 p-2 rounded">
                  ✅ <strong>Keputusan FM:</strong> {summary.discrepancies[0].resolutionDecision} ({summary.discrepancies[0].investigationNotes})
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex items-center justify-between border-t pt-4 mt-4">
          <div>
            {!canSettleImmediately && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs text-rose-700 border-rose-300 bg-rose-50 hover:bg-rose-100"
                onClick={() => onOpenDiscrepancyModal(summary)}
              >
                <AlertCircle className="h-4 w-4 mr-1 text-rose-600" />
                Lapis 2: Catat Selisih Kasir (Jalur Sistemik FM)
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
              Batal
            </Button>
            <Button
              size="sm"
              disabled={submitting || (!canSettleImmediately && summary.discrepancies.length === 0)}
              onClick={handleProcessSettlement}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...
                </>
              ) : (
                <>
                  <Check className="mr-1.5 h-4 w-4" /> Selesaikan & Terbitkan BKM
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
