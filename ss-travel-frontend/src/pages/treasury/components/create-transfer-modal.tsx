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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRightLeft, ShieldAlert } from 'lucide-react';
import { CashBankService } from '@/services/cash-bank.service';
import type {
  BankAccount,
  CashAccount,
  CreateFundTransferFormData,
  FundTransferType,
} from '@/types';
import { toast } from 'sonner';

interface CreateTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  bankAccounts: BankAccount[];
  cashAccounts: CashAccount[];
}

export default function CreateTransferModal({
  isOpen,
  onClose,
  onSuccess,
  bankAccounts,
  cashAccounts,
}: CreateTransferModalProps) {
  const [transferType, setTransferType] = useState<FundTransferType>('MAIN_TO_OPS');
  const [sourceType, setSourceType] = useState<'BANK' | 'CASH'>('BANK');
  const [sourceBankId, setSourceBankId] = useState<string>('');
  const [sourceCashId, setSourceCashId] = useState<string>('');
  const [targetType, setTargetType] = useState<'BANK' | 'CASH'>('BANK');
  const [targetBankId, setTargetBankId] = useState<string>('');
  const [targetCashId, setTargetCashId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');
  const [referenceDoc, setReferenceDoc] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Filter accounts
  const mainBanks = bankAccounts.filter((b) => b.code.includes('MAIN'));
  const opsBanks = bankAccounts.filter((b) => b.code.includes('OPS'));

  // Handler template
  const handleTemplateChange = (type: FundTransferType) => {
    setTransferType(type);
    if (type === 'MAIN_TO_OPS') {
      setSourceType('BANK');
      setSourceBankId(mainBanks[0]?.id || bankAccounts[0]?.id || '');
      setTargetType('BANK');
      setTargetBankId(opsBanks[0]?.id || bankAccounts[1]?.id || '');
      setPurpose('Dropping dana operasional perjalanan armada bus');
    } else if (type === 'OPS_TO_OPS') {
      setSourceType('BANK');
      setSourceBankId(opsBanks[0]?.id || bankAccounts[0]?.id || '');
      setTargetType('BANK');
      setTargetBankId(opsBanks[1]?.id || bankAccounts[1]?.id || '');
      setPurpose('Pemindahan likuiditas antar unit bisnis operasional');
    } else if (type === 'POOL_TO_MAIN') {
      setSourceType('CASH');
      setSourceCashId(cashAccounts[0]?.id || '');
      setTargetType('BANK');
      setTargetBankId(mainBanks[0]?.id || bankAccounts[0]?.id || '');
      setPurpose('Setoran penerimaan kas pool fisik ke rekening induk pusat');
    } else if (type === 'OPS_TO_POOL') {
      setSourceType('BANK');
      setSourceBankId(opsBanks[0]?.id || bankAccounts[0]?.id || '');
      setTargetType('CASH');
      setTargetCashId(cashAccounts[0]?.id || '');
      setPurpose('Tarik tunai bank operasional untuk uang jalan/kas pool');
    } else {
      setPurpose('');
    }
  };

  useEffect(() => {
    if (isOpen) {
      handleTemplateChange('MAIN_TO_OPS');
      setAmount('');
      setReferenceDoc('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanAmount = parseFloat(amount);
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      toast.error('Nominal pemindahan dana tidak valid', {
        description: 'Masukkan angka lebih dari 0 rupiah.',
      });
      return;
    }

    if (sourceType === 'BANK' && !sourceBankId) {
      toast.error('Pilih rekening bank sumber');
      return;
    }
    if (sourceType === 'CASH' && !sourceCashId) {
      toast.error('Pilih akun kas sumber');
      return;
    }
    if (targetType === 'BANK' && !targetBankId) {
      toast.error('Pilih rekening bank tujuan');
      return;
    }
    if (targetType === 'CASH' && !targetCashId) {
      toast.error('Pilih akun kas tujuan');
      return;
    }

    if (
      sourceType === targetType &&
      ((sourceType === 'BANK' && sourceBankId === targetBankId) ||
        (sourceType === 'CASH' && sourceCashId === targetCashId))
    ) {
      toast.error('Rekening sumber dan tujuan tidak boleh sama');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateFundTransferFormData = {
        transferType,
        sourceBankAccountId: sourceType === 'BANK' ? sourceBankId : undefined,
        sourceCashAccountId: sourceType === 'CASH' ? sourceCashId : undefined,
        targetBankAccountId: targetType === 'BANK' ? targetBankId : undefined,
        targetCashAccountId: targetType === 'CASH' ? targetCashId : undefined,
        amount: cleanAmount.toFixed(2),
        purpose: purpose.trim() || 'Pemindahan Dana Kas/Bank',
        referenceDoc: referenceDoc.trim() || undefined,
      };

      const res = await CashBankService.createFundTransfer(payload);
      toast.success('Pengajuan pemindahan dana berhasil diajukan!', {
        description: `Nomor Ref: ${res.data.transferNo}. Menunggu persetujuan atasan.`,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Gagal mengajukan pemindahan dana', {
        description: err?.response?.data?.message || err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatRupiah = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getBankOptionLabel = (b: BankAccount) => {
    let suffix = 'Ops Pool';
    if (b.code.includes('MAIN')) suffix = 'Induk (Pusat)';
    else if (b.code.includes('AKAP')) suffix = 'Ops AKAP';
    else if (b.code.includes('WIS')) suffix = 'Ops Wisata';
    return `${b.bankName} - ${suffix} (${b.accountNumberMasked || b.accountNumber})`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-foreground">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Ajukan Pemindahan Dana</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Pemindahan saldo kas/bank dengan alur verifikasi atasan (*Maker-Checker*).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          {/* Template Selector */}
          <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
            <Label className="text-xs font-medium text-muted-foreground">
              Pilihan Alur Pemindahan:
            </Label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleTemplateChange('MAIN_TO_OPS')}
                className={`p-2.5 rounded-lg border text-left transition ${
                  transferType === 'MAIN_TO_OPS'
                    ? 'border-primary bg-background shadow-xs ring-1 ring-primary/20'
                    : 'border-border bg-card/60 hover:bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="font-semibold text-foreground">Induk &rarr; Operasional</div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Dropping dana ke unit bisnis</p>
              </button>

              <button
                type="button"
                onClick={() => handleTemplateChange('OPS_TO_OPS')}
                className={`p-2.5 rounded-lg border text-left transition ${
                  transferType === 'OPS_TO_OPS'
                    ? 'border-primary bg-background shadow-xs ring-1 ring-primary/20'
                    : 'border-border bg-card/60 hover:bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="font-semibold text-foreground">Antar Operasional</div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Sesama unit operasional</p>
              </button>

              <button
                type="button"
                onClick={() => handleTemplateChange('POOL_TO_MAIN')}
                className={`p-2.5 rounded-lg border text-left transition ${
                  transferType === 'POOL_TO_MAIN'
                    ? 'border-primary bg-background shadow-xs ring-1 ring-primary/20'
                    : 'border-border bg-card/60 hover:bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="font-semibold text-foreground">Kas Pool &rarr; Bank Induk</div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Setoran fisik ke bank pusat</p>
              </button>

              <button
                type="button"
                onClick={() => handleTemplateChange('OPS_TO_POOL')}
                className={`p-2.5 rounded-lg border text-left transition ${
                  transferType === 'OPS_TO_POOL'
                    ? 'border-primary bg-background shadow-xs ring-1 ring-primary/20'
                    : 'border-border bg-card/60 hover:bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="font-semibold text-foreground">Bank Ops &rarr; Kas Pool</div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Tarik tunai laci garasi pool</p>
              </button>
            </div>
          </div>

          {/* Source and Target Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Sumber */}
            <div className="space-y-1.5 p-3 rounded-lg border bg-muted/20">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-muted-foreground">
                  Rekening Sumber (Kredit)
                </Label>
              </div>

              {sourceType === 'BANK' ? (
                <Select value={sourceBankId} onValueChange={setSourceBankId}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder="Pilih Rekening Pengirim" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((b) => (
                      <SelectItem key={b.id} value={b.id} className="text-xs">
                        {getBankOptionLabel(b)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select value={sourceCashId} onValueChange={setSourceCashId}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder="Pilih Kas Pengirim" />
                  </SelectTrigger>
                  <SelectContent>
                    {cashAccounts.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.code} - {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Tujuan */}
            <div className="space-y-1.5 p-3 rounded-lg border bg-muted/20">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-muted-foreground">
                  Rekening Tujuan (Debit)
                </Label>
              </div>

              {targetType === 'BANK' ? (
                <Select value={targetBankId} onValueChange={setTargetBankId}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder="Pilih Rekening Penerima" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((b) => (
                      <SelectItem key={b.id} value={b.id} className="text-xs">
                        {getBankOptionLabel(b)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select value={targetCashId} onValueChange={setTargetCashId}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder="Pilih Kas Penerima" />
                  </SelectTrigger>
                  <SelectContent>
                    {cashAccounts.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.code} - {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Nominal Transfer */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-foreground">Nominal Transfer (Rp)</Label>
              <span className="text-xs font-bold font-mono text-foreground">
                {formatRupiah(amount)}
              </span>
            </div>
            <Input
              type="number"
              min="1"
              step="any"
              placeholder="Contoh: 15000000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="text-sm font-semibold h-9"
            />
          </div>

          {/* Keperluan / Tujuan Dropping */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">Tujuan / Keperluan Dropping</Label>
            <Input
              placeholder="Contoh: Dropping dana UJ armada AKAP keberangkatan Yogya & bayar servis makan RM"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              required
              className="text-xs h-9"
            />
          </div>

          {/* Dokumen Referensi Eksternal */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              No. Referensi / Bukti Transfer (Opsional)
            </Label>
            <Input
              placeholder="Contoh: Ref M-Banking #TRX998822 / Struk Setoran"
              value={referenceDoc}
              onChange={(e) => setReferenceDoc(e.target.value)}
              className="text-xs h-9"
            />
          </div>

          {/* Notice Approval */}
          <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-200/60 bg-amber-50/50 dark:bg-amber-950/20 text-muted-foreground text-xs">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
            <p>
              Pengajuan ini memerlukan persetujuan atasan (Finance Manager / Direktur) sebelum jurnal otomatis diposting ke Buku Besar.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting} className="text-xs h-9">
              Batal
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="text-xs h-9"
            >
              {submitting ? 'Mengajukan...' : 'Kirim Pengajuan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
