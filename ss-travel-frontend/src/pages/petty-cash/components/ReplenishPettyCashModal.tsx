import React, { useState, useEffect } from 'react';
import { X, ArrowDownCircle, Building2, Wallet } from 'lucide-react';
import type {
  CashAccount,
  BankAccount,
  CreatePettyCashReplenishmentFormData,
} from '@/types';
import { PettyCashService } from '@/services/petty-cash.service';
import { toast } from 'sonner';

interface ReplenishPettyCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cashAccounts: CashAccount[];
  bankAccounts: BankAccount[];
  defaultCashAccountId?: string;
}

export default function ReplenishPettyCashModal({
  isOpen,
  onClose,
  onSuccess,
  cashAccounts,
  bankAccounts,
  defaultCashAccountId,
}: ReplenishPettyCashModalProps) {
  const [cashAccountId, setCashAccountId] = useState('');
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [amountInput, setAmountInput] = useState('');
  const [sourceType, setSourceType] = useState<'BANK' | 'CASH'>('BANK');
  const [sourceBankAccountId, setSourceBankAccountId] = useState('');
  const [sourceCashAccountId, setSourceCashAccountId] = useState('');
  const [description, setDescription] = useState(
    'Pengisian kembali dana kas kecil operasional pool garasi',
  );
  const [receiptNo, setReceiptNo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const defaultId =
        defaultCashAccountId ||
        cashAccounts.find((c) => c.code === 'CASH-PETTY-GARASI')?.id ||
        cashAccounts[0]?.id ||
        '';
      setCashAccountId(defaultId);
      setTransactionDate(new Date().toISOString().slice(0, 10));
      setAmountInput('5.000.000');
      setSourceType('BANK');
      if (bankAccounts.length > 0) setSourceBankAccountId(bankAccounts[0].id);

      const otherCash = cashAccounts.filter((c) => c.id !== defaultId);
      if (otherCash.length > 0) setSourceCashAccountId(otherCash[0].id);

      setDescription('Pengisian kembali dana kas kecil operasional pool garasi');
      setReceiptNo('');
    }
  }, [isOpen, defaultCashAccountId, cashAccounts, bankAccounts]);

  if (!isOpen) return null;

  const parseRawAmount = (val: string): number => {
    const clean = val.replace(/\./g, '').replace(/,/g, '.');
    return parseFloat(clean) || 0;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^\d]/g, '');
    if (!rawVal) {
      setAmountInput('');
      return;
    }
    const num = parseInt(rawVal, 10);
    setAmountInput(num.toLocaleString('id-ID'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseRawAmount(amountInput);

    if (numericAmount <= 0) {
      toast.error('Nominal pengisian kas kecil harus lebih besar dari 0.');
      return;
    }
    if (!cashAccountId) {
      toast.error('Rekening kas kecil tujuan wajib dipilih.');
      return;
    }
    if (sourceType === 'BANK' && !sourceBankAccountId) {
      toast.error('Rekening bank sumber dana wajib dipilih.');
      return;
    }
    if (sourceType === 'CASH' && !sourceCashAccountId) {
      toast.error('Rekening kas sumber dana wajib dipilih.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: CreatePettyCashReplenishmentFormData = {
        cashAccountId,
        transactionDate,
        amount: numericAmount.toFixed(2),
        sourceType,
        sourceBankAccountId: sourceType === 'BANK' ? sourceBankAccountId : undefined,
        sourceCashAccountId: sourceType === 'CASH' ? sourceCashAccountId : undefined,
        description: description.trim(),
        receiptNo: receiptNo.trim() || undefined,
      };

      const res = await PettyCashService.createReplenishment(payload);
      toast.success(res.message || 'Dana kas kecil berhasil diisi kembali!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          'Gagal mengisi kembali kas kecil. Silakan periksa kembali formulir.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <ArrowDownCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Pengisian Kembali Kas Kecil (BKM)
              </h3>
              <p className="text-xs text-slate-500">
                Petty Cash Replenishment dari Bank atau Kas Induk Pool
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Target Cash Account */}
          <div>
            <label className="text-xs font-semibold text-slate-700">
              Rekening Kas Kecil Tujuan <span className="text-rose-500">*</span>
            </label>
            <select
              value={cashAccountId}
              onChange={(e) => setCashAccountId(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {cashAccounts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tanggal & Nominal */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-700">
                Tanggal Pengisian <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">
                Nominal Dana (Rp) <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-bold text-slate-400">
                  Rp
                </span>
                <input
                  type="text"
                  placeholder="0"
                  value={amountInput}
                  onChange={handleAmountChange}
                  required
                  className="w-full rounded-xl border border-slate-300 pl-11 pr-3.5 py-2.5 text-base font-bold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
          </div>

          {/* Sumber Dana Radio Tabs */}
          <div>
            <label className="text-xs font-semibold text-slate-700">
              Sumber Dana Pencairan <span className="text-rose-500">*</span>
            </label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSourceType('BANK')}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                  sourceType === 'BANK'
                    ? 'border-emerald-500 bg-emerald-50 font-bold text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Building2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-sm font-semibold">Rekening Bank</div>
                  <div className="text-xs text-slate-500">Transfer Bank Perusahaan (11104)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSourceType('CASH')}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                  sourceType === 'CASH'
                    ? 'border-emerald-500 bg-emerald-50 font-bold text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Wallet className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-sm font-semibold">Kas Induk Pool</div>
                  <div className="text-xs text-slate-500">Kas Fisik Pool Ciputat (11101)</div>
                </div>
              </button>
            </div>
          </div>

          {/* Selector Sumber Dana */}
          {sourceType === 'BANK' ? (
            <div>
              <label className="text-xs font-semibold text-slate-700">
                Pilih Rekening Bank <span className="text-rose-500">*</span>
              </label>
              <select
                value={sourceBankAccountId}
                onChange={(e) => setSourceBankAccountId(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bankName} - {b.accountName} ({b.accountNumberMasked || b.accountNumber})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-slate-700">
                Pilih Kas Asal <span className="text-rose-500">*</span>
              </label>
              <select
                value={sourceCashAccountId}
                onChange={(e) => setSourceCashAccountId(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {cashAccounts
                  .filter((c) => c.id !== cashAccountId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Keterangan & Referensi */}
          <div>
            <label className="text-xs font-semibold text-slate-700">
              Keterangan Pengisian <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">
              Nomor Referensi Bukti Transfer / Mutasi Bank
            </label>
            <input
              type="text"
              placeholder="Misal: TRF-BCA-98129"
              value={receiptNo}
              onChange={(e) => setReceiptNo(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-50"
            >
              <ArrowDownCircle className="h-4 w-4" />
              {isSubmitting ? 'Menyimpan...' : 'Isi Dana Kas Kecil (Posting BKM)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
