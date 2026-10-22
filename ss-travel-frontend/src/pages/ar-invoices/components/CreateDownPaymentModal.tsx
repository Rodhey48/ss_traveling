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
import { DollarSign, Building2, Wallet } from 'lucide-react';
import { ArService } from '@/services/ar.service';
import { CustomerService } from '@/services/customer.service';
import { CashBankService } from '@/services/cash-bank.service';
import { SpjService } from '@/services/spj.service';
import type {
  Customer,
  BankAccount,
  CashAccount,
  Spj,
  FinancePaymentMethod,
  CreateDownPaymentFormData,
} from '@/types';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateDownPaymentModal({ open, onOpenChange, onSuccess }: Props) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [spjs, setSpjs] = useState<Spj[]>([]);
  const [selectedSpjId, setSelectedSpjId] = useState<string>('');

  const [paymentMethod, setPaymentMethod] = useState<FinancePaymentMethod>('BANK_TRANSFER');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [selectedCashId, setSelectedCashId] = useState<string>('');

  const [receiptDate, setReceiptDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [amount, setAmount] = useState<number>(0);
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      // Reset inputan saat modal dibuka
      setSelectedCustomerId('');
      setCustomerName('');
      setSelectedSpjId('');
      setAmount(0);
      setReference('');
      setNotes('');
      setReceiptDate(new Date().toISOString().split('T')[0]);

      CustomerService.findAll({ limit: 100 }).then((res) => {
        const custs = res.data?.data || [];
        setCustomers(custs);
      });

      SpjService.getSpjs({ serviceType: 'WISATA' }).then((res) => {
        const items = res.data || [];
        setSpjs(items);
      });

      CashBankService.findAllBankAccounts().then((res) => {
        const active = (res.data || []).filter((acc) => acc.isActive);
        setBankAccounts(active);
        const bca = active.find((acc) => acc.bankName === 'BCA') || active[0];
        if (bca) setSelectedBankId(bca.id);
      });

      CashBankService.findAllCashAccounts().then((res) => {
        const active = (res.data || []).filter((acc) => acc.isActive);
        setCashAccounts(active);
        if (active.length > 0) setSelectedCashId(active[0].id);
      });
    }
  }, [open]);

  const handleCustomerChange = (id: string) => {
    setSelectedCustomerId(id);
    const c = customers.find((item) => item.id === id);
    if (c) {
      setCustomerName(c.institutionName || c.picName);
    } else {
      setCustomerName('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast.error('Nama pelanggan wajib diisi.');
      return;
    }
    if (amount <= 0) {
      toast.error('Nominal DP harus lebih dari 0.');
      return;
    }

    try {
      setSaving(true);
      const payload: CreateDownPaymentFormData = {
        customerId: selectedCustomerId || undefined,
        customerName,
        receiptDate,
        paymentMethod,
        bankAccountId: paymentMethod === 'BANK_TRANSFER' ? selectedBankId : undefined,
        cashAccountId: paymentMethod === 'CASH' ? selectedCashId : undefined,
        amount,
        downPaymentTripId: selectedSpjId || undefined,
        reference,
        notes,
      };

      await ArService.createDownPayment(payload);
      toast.success('Penerimaan DP sewa wisata berhasil dicatat dan jurnal liabilitas (24101) telah diposting.');
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mencatat penerimaan DP');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-2xl w-full p-6 sm:p-7 max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
            <DollarSign className="h-6 w-6 text-indigo-600" />
            Penerimaan Uang Muka (DP) Sewa Wisata
          </DialogTitle>
          <p className="text-sm text-slate-500">
            Pencatatan uang muka charter bus wisata (Skenario 2). Menghasilkan jurnal penerimaan kas/bank
            dan utang liabilitas titipan sewa (akun 24101).
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50/80 rounded-xl border border-slate-200">
            <div className="sm:col-span-2">
              <Label className="text-xs font-semibold text-slate-700">Pelanggan / Klien Wisata</Label>
              <select
                className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                value={selectedCustomerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
              >
                <option value="">-- Pilih Pelanggan Terdaftar (Opsional) --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.institutionName || c.picName} ({c.code})
                  </option>
                ))}
              </select>
              <Input
                placeholder="Atau ketik nama pelanggan / instansi..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-2 h-10 bg-white text-xs"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <Label className="text-xs font-semibold text-slate-700">SPJ Wisata Terkait (Opsional)</Label>
              <select
                className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                value={selectedSpjId}
                onChange={(e) => setSelectedSpjId(e.target.value)}
              >
                <option value="">- Belum Ditautkan ke SPJ Tertentu -</option>
                {spjs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.spjNo} — {s.vehicle?.plateNumber} ({s.vehicle?.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-700">Metode Penerimaan</Label>
            <div className="grid grid-cols-2 gap-3 mt-1.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('BANK_TRANSFER')}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  paymentMethod === 'BANK_TRANSFER'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Building2 className="h-5 w-5 text-indigo-600" />
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
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Wallet className="h-5 w-5 text-indigo-600" />
                <div>
                  <div className="text-xs font-bold">Kas Tunai Pool</div>
                  <div className="text-[10px] text-slate-500">BKM Meja Kasir</div>
                </div>
              </button>
            </div>
          </div>

          {paymentMethod === 'BANK_TRANSFER' ? (
            <div>
              <Label className="text-xs font-semibold text-slate-700">Rekening Bank Tujuan</Label>
              <select
                className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              <Label className="text-xs font-semibold text-slate-700">Kas Operasional Penerima</Label>
              <select
                className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              <Label className="text-xs font-semibold text-slate-700">Tanggal Penerimaan</Label>
              <Input
                type="date"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                className="mt-1 bg-white"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">No. Bukti / Ref Bank</Label>
              <Input
                placeholder="Contoh: TRF-BCA-DP-001"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="mt-1 bg-white"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-700">
              Jumlah Uang Muka (Rp) <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                Rp
              </span>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={amount > 0 ? amount.toLocaleString('id-ID') : ''}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setAmount(raw ? parseInt(raw, 10) : 0);
                }}
                className="pl-9 text-lg font-bold text-indigo-900 bg-white"
                required
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-700">Keterangan / Catatan Kontrak</Label>
            <Textarea
              placeholder="Contoh: DP 30% sewa bus pariwisata 5 hari tour Jawa Tengah..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 bg-white h-16"
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
              disabled={saving || amount <= 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              {saving ? 'Mencatat...' : 'Terima Uang Muka (DP)'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
