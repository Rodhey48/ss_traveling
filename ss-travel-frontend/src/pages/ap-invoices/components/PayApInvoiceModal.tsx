import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { CreditCard, Building2, Wallet } from 'lucide-react';
import { ApService } from '@/services/ap.service';
import { CashBankService } from '@/services/cash-bank.service';
import type {
  ApInvoice,
  BankAccount,
  CashAccount,
  FinancePaymentMethod,
  CreateApPaymentFormData,
} from '@/types';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: ApInvoice | null;
  onSuccess: () => void;
}

export function PayApInvoiceModal({ open, onOpenChange, invoice, onSuccess }: Props) {
  const [paymentMethod, setPaymentMethod] = useState<FinancePaymentMethod>('BANK_TRANSFER');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [selectedCashId, setSelectedCashId] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [reference, setReference] = useState<string>('');
  const [payAmount, setPayAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && invoice) {
      // Reset inputan saat modal dibuka
      setPayAmount(0);
      setReference('');
      setNotes('');
      setPaymentDate(new Date().toISOString().split('T')[0]);

      CashBankService.findAllBankAccounts().then((res) => {
        const data = res.data || [];
        setBankAccounts(data.filter((b) => b.isActive));
        if (data.length > 0) {
          const bca = data.find((b) => b.bankName === 'BCA') || data[0];
          setSelectedBankId(bca.id);
        }
      });

      CashBankService.findAllCashAccounts().then((res) => {
        const data = res.data || [];
        setCashAccounts(data.filter((c) => c.isActive));
        if (data.length > 0) {
          setSelectedCashId(data[0].id);
        }
      });
    }
  }, [open, invoice]);

  if (!invoice) return null;

  const remaining = Math.max(0, invoice.totalAmount - invoice.paidAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) {
      toast.error('Jumlah pembayaran harus lebih besar dari 0.');
      return;
    }
    if (payAmount > remaining) {
      toast.error(`Jumlah pembayaran (Rp ${payAmount.toLocaleString('id-ID')}) melebihi sisa tagihan (Rp ${remaining.toLocaleString('id-ID')}).`);
      return;
    }

    try {
      setSaving(true);
      const payload: CreateApPaymentFormData = {
        vendorType: invoice.vendorType,
        vendorId: invoice.vendorId,
        vendorName: invoice.vendorName,
        paymentDate,
        paymentMethod,
        bankAccountId: paymentMethod === 'BANK_TRANSFER' ? selectedBankId : undefined,
        cashAccountId: paymentMethod === 'CASH' ? selectedCashId : undefined,
        amount: payAmount,
        reference,
        notes,
        allocations: [{ invoiceId: invoice.id, amount: payAmount }],
      };

      await ApService.createPayment(payload);
      toast.success('Pembayaran tagihan AP berhasil dicatat dan diposting ke jurnal.');
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memproses pembayaran');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-2xl w-full p-6 sm:p-7 max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
            <CreditCard className="h-6 w-6 text-emerald-600" />
            Pembayaran Tagihan Vendor (AP)
          </DialogTitle>
          <p className="text-sm text-slate-500">
            Faktur: <span className="font-semibold text-slate-700">{invoice.billNo}</span> —{' '}
            {invoice.vendorName}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Total Nilai Tagihan:</span>
              <span className="font-semibold text-slate-700">
                Rp {Number(invoice.totalAmount).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Sudah Dibayar:</span>
              <span className="font-semibold text-slate-700">
                Rp {Number(invoice.paidAmount).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-1.5">
              <span>Sisa Tagihan Belum Lunas:</span>
              <span className="text-emerald-700 text-base">Rp {remaining.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-700">Metode Pembayaran</Label>
            <div className="grid grid-cols-2 gap-3 mt-1.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('BANK_TRANSFER')}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  paymentMethod === 'BANK_TRANSFER'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Building2 className="h-5 w-5 text-emerald-600" />
                <div>
                  <div className="text-xs font-bold">Transfer Bank</div>
                  <div className="text-[10px] text-slate-500">Rekening Korporat</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  paymentMethod === 'CASH'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Wallet className="h-5 w-5 text-emerald-600" />
                <div>
                  <div className="text-xs font-bold">Kas Tunai Pool</div>
                  <div className="text-[10px] text-slate-500">BKK Meja Kasir</div>
                </div>
              </button>
            </div>
          </div>

          {paymentMethod === 'BANK_TRANSFER' ? (
            <div>
              <Label className="text-xs font-semibold text-slate-700">Rekening Sumber Bank</Label>
              <select
                className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
                required
              >
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bankName} - {b.accountNumberMasked} ({b.accountName})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <Label className="text-xs font-semibold text-slate-700">Kas Pengeluaran</Label>
              <select
                className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={selectedCashId}
                onChange={(e) => setSelectedCashId(e.target.value)}
                required
              >
                {cashAccounts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-700">Tanggal Pembayaran</Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="mt-1 bg-white"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">No. Bukti / Referensi</Label>
              <Input
                placeholder="Contoh: TRF-BCA-9812"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="mt-1 bg-white"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center">
              <Label className="text-xs font-semibold text-slate-700">
                Jumlah Pembayaran (Rp) <span className="text-red-500">*</span>
              </Label>
              <button
                type="button"
                onClick={() => setPayAmount(remaining)}
                className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                Bayar Lunas (Rp {remaining.toLocaleString('id-ID')})
              </button>
            </div>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                Rp
              </span>
              <Input
                type="text"
                inputMode="numeric"
                placeholder={`0 (Maksimal: ${remaining.toLocaleString('id-ID')})`}
                value={payAmount > 0 ? payAmount.toLocaleString('id-ID') : ''}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  const num = raw ? parseInt(raw, 10) : 0;
                  setPayAmount(Math.min(num, remaining));
                }}
                className="pl-9 text-lg font-bold text-emerald-800 bg-white"
                required
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-700">Catatan Pembayaran (Opsional)</Label>
            <Textarea
              placeholder="Contoh: Pelunasan servis radiator via transfer BCA..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 bg-white h-14"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={saving || payAmount <= 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {saving ? 'Memproses...' : 'Konfirmasi Bayar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
