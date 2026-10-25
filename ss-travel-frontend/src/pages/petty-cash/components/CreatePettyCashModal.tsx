import React, { useState, useEffect } from 'react';
import {
  X,
  Receipt,
  Truck,
  UserCheck,
  Package,
  Wrench,
  Coffee,
  Car,
  Sparkles,
} from 'lucide-react';
import type {
  CashAccount,
  Account,
  Vehicle,
  PettyCashCategory,
  CreatePettyCashDisbursementFormData,
} from '@/types';
import { PettyCashService } from '@/services/petty-cash.service';
import { toast } from 'sonner';

interface CreatePettyCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cashAccounts: CashAccount[];
  expenseAccounts: Account[];
  vehicles: Vehicle[];
  defaultCashAccountId?: string;
}

export default function CreatePettyCashModal({
  isOpen,
  onClose,
  onSuccess,
  cashAccounts,
  expenseAccounts,
  vehicles,
  defaultCashAccountId,
}: CreatePettyCashModalProps) {
  const [cashAccountId, setCashAccountId] = useState('');
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [amountInput, setAmountInput] = useState('');
  const [recipient, setRecipient] = useState('');
  const [category, setCategory] = useState<PettyCashCategory>('STANDBY_CREW');
  const [expenseAccountId, setExpenseAccountId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [description, setDescription] = useState('');
  const [receiptNo, setReceiptNo] = useState('');
  const [autoVerify, setAutoVerify] = useState(true);
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
      setAmountInput('');
      setRecipient('');
      setCategory('STANDBY_CREW');
      setVehicleId('');
      setDescription('');
      setReceiptNo('');
      setAutoVerify(true);

      // Pre-select 53105
      const standbyAcc = expenseAccounts.find((a) => a.code === '53105');
      if (standbyAcc) setExpenseAccountId(standbyAcc.id);
      else if (expenseAccounts.length > 0) setExpenseAccountId(expenseAccounts[0].id);
    }
  }, [isOpen, defaultCashAccountId, cashAccounts, expenseAccounts]);

  if (!isOpen) return null;

  // Handle Preset Fast Categories
  const handleSelectPreset = (cat: PettyCashCategory, targetCode: string) => {
    setCategory(cat);
    const matched = expenseAccounts.find((a) => a.code === targetCode);
    if (matched) {
      setExpenseAccountId(matched.id);
    }
    if (cat === 'STANDBY_CREW') {
      setDescription('Uang makan standby kru piket pool garasi');
    } else if (cat === 'FACILITY_SNACK') {
      setDescription('Pembelian grosir snack, kopi, & amenity kabin bus');
    } else if (cat === 'DEADHEAD_INSENTIF') {
      setDescription('Uang saku insentif langsir armada kosongan ke bengkel/karoseri');
    } else if (cat === 'POOL_SUPPLIES') {
      setDescription('Pembelian sabun cuci bus, kuas spon, dan perlengkapan pool');
    } else if (cat === 'OVERTIME_MEKANIK') {
      setDescription('Upah lembur teknisi bengkel servis armada malam');
    } else if (cat === 'OFFICE_CONSUMPTION') {
      setDescription('Konsumsi galon air minum & kopi piket staf kantor/pool');
    } else if (cat === 'OFFICE_TRAVEL') {
      setDescription('Uang transport dinas luar kota staf ke Dishub / Bank');
    } else if (cat === 'WORKSHOP_EMERGENCY') {
      setDescription('Pembelian sparepart/baut darurat bengkel garasi');
    }
  };

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
      toast.error('Nominal pengeluaran kas kecil harus lebih besar dari 0.');
      return;
    }
    if (!cashAccountId) {
      toast.error('Rekening kas kecil wajib dipilih.');
      return;
    }
    if (!recipient.trim()) {
      toast.error('Nama penerima dana wajib diisi.');
      return;
    }
    if (!expenseAccountId) {
      toast.error('Akun beban COA wajib dipilih.');
      return;
    }
    if (!description.trim()) {
      toast.error('Keterangan pengeluaran wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: CreatePettyCashDisbursementFormData = {
        cashAccountId,
        transactionDate,
        amount: numericAmount.toFixed(2),
        recipient: recipient.trim(),
        expenseAccountId,
        category,
        vehicleId: vehicleId || undefined,
        description: description.trim(),
        receiptNo: receiptNo.trim() || undefined,
        autoVerify,
      };

      const res = await PettyCashService.createDisbursement(payload);
      toast.success(res.message || 'Pengeluaran kas kecil berhasil dicatat!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          'Gagal mencatat pengeluaran kas kecil. Silakan periksa kembali formulir.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Input Pengeluaran Kas Kecil Pool (BKK)
              </h3>
              <p className="text-xs text-slate-500">
                Pencatatan beban operasional non-SPJ garasi PT SS Traveling Official
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
          {/* Preset Buttons */}
          <div>
            <label className="text-xs font-semibold text-slate-600">
              Pilih Kategori Cepat (SOP Akuntansi Bus)
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button
                type="button"
                onClick={() => handleSelectPreset('STANDBY_CREW', '53105')}
                className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-xs font-medium transition-all ${
                  category === 'STANDBY_CREW'
                    ? 'border-amber-500 bg-amber-50 font-bold text-amber-800 ring-2 ring-amber-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <UserCheck className="h-4 w-4 text-amber-600 shrink-0" />
                <div>
                  <div className="truncate">Standby Driver</div>
                  <div className="text-[10px] text-slate-400">Akun 53105</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('DEADHEAD_INSENTIF', '53106')}
                className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-xs font-medium transition-all ${
                  category === 'DEADHEAD_INSENTIF'
                    ? 'border-indigo-500 bg-indigo-50 font-bold text-indigo-800 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Truck className="h-4 w-4 text-indigo-600 shrink-0" />
                <div>
                  <div className="truncate">Langsir Armada</div>
                  <div className="text-[10px] text-slate-400">Akun 53106</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('FACILITY_SNACK', '52104')}
                className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-xs font-medium transition-all ${
                  category === 'FACILITY_SNACK'
                    ? 'border-emerald-500 bg-emerald-50 font-bold text-emerald-800 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Package className="h-4 w-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="truncate">Snack Onboard</div>
                  <div className="text-[10px] text-slate-400">Akun 52104</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('POOL_SUPPLIES', '57102')}
                className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-xs font-medium transition-all ${
                  category === 'POOL_SUPPLIES'
                    ? 'border-blue-500 bg-blue-50 font-bold text-blue-800 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
                <div>
                  <div className="truncate">Cuci Bus & ATK</div>
                  <div className="text-[10px] text-slate-400">Akun 57102</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('OVERTIME_MEKANIK', '57107')}
                className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-xs font-medium transition-all ${
                  category === 'OVERTIME_MEKANIK'
                    ? 'border-purple-500 bg-purple-50 font-bold text-purple-800 ring-2 ring-purple-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Wrench className="h-4 w-4 text-purple-600 shrink-0" />
                <div>
                  <div className="truncate">Lembur Mekanik</div>
                  <div className="text-[10px] text-slate-400">Akun 57107</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('OFFICE_CONSUMPTION', '57108')}
                className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-xs font-medium transition-all ${
                  category === 'OFFICE_CONSUMPTION'
                    ? 'border-rose-500 bg-rose-50 font-bold text-rose-800 ring-2 ring-rose-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Coffee className="h-4 w-4 text-rose-600 shrink-0" />
                <div>
                  <div className="truncate">Kopi & Piket</div>
                  <div className="text-[10px] text-slate-400">Akun 57108</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('OFFICE_TRAVEL', '57109')}
                className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-xs font-medium transition-all ${
                  category === 'OFFICE_TRAVEL'
                    ? 'border-cyan-500 bg-cyan-50 font-bold text-cyan-800 ring-2 ring-cyan-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Car className="h-4 w-4 text-cyan-600 shrink-0" />
                <div>
                  <div className="truncate">Transport Dinas</div>
                  <div className="text-[10px] text-slate-400">Akun 57109</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('WORKSHOP_EMERGENCY', '55102')}
                className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-xs font-medium transition-all ${
                  category === 'WORKSHOP_EMERGENCY'
                    ? 'border-orange-500 bg-orange-50 font-bold text-orange-800 ring-2 ring-orange-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Wrench className="h-4 w-4 text-orange-600 shrink-0" />
                <div>
                  <div className="truncate">Sparepart Garasi</div>
                  <div className="text-[10px] text-slate-400">Akun 55102</div>
                </div>
              </button>
            </div>
          </div>

          {/* Baris 1: Rekening Kas Kecil & Tanggal */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-700">
                Rekening Kas Kecil <span className="text-rose-500">*</span>
              </label>
              <select
                value={cashAccountId}
                onChange={(e) => setCashAccountId(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                {cashAccounts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">
                Tanggal Pengeluaran <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Baris 2: Nominal & Penerima */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-700">
                Nominal (Rp) <span className="text-rose-500">*</span>
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
                  className="w-full rounded-xl border border-slate-300 pl-11 pr-3.5 py-2.5 text-base font-bold text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">
                Penerima Dana (Orang / Toko) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Driver Hendra / Toko Baut Makmur"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Baris 3: Akun Beban COA & Armada Bus */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-700">
                Akun Beban GL (COA) <span className="text-rose-500">*</span>
              </label>
              <select
                value={expenseAccountId}
                onChange={(e) => setExpenseAccountId(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <optgroup label="Beban Langsung Fasilitas (52)">
                  {expenseAccounts
                    .filter((a) => a.code.startsWith('52'))
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} - {a.name}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Beban Kru Garasi (53)">
                  {expenseAccounts
                    .filter((a) => a.code.startsWith('53'))
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} - {a.name}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Beban Bengkel & Sparepart (55)">
                  {expenseAccounts
                    .filter((a) => a.code.startsWith('55'))
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} - {a.name}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Beban Operasional Pool & Kantor (57)">
                  {expenseAccounts
                    .filter((a) => a.code.startsWith('57'))
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} - {a.name}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Beban Lainnya">
                  {expenseAccounts
                    .filter(
                      (a) =>
                        !a.code.startsWith('52') &&
                        !a.code.startsWith('53') &&
                        !a.code.startsWith('55') &&
                        !a.code.startsWith('57'),
                    )
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} - {a.name}
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Armada Bus (Dimensi Biaya)
                </label>
                {(category === 'DEADHEAD_INSENTIF' ||
                  category === 'WORKSHOP_EMERGENCY') && (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    ★ Dianjurkan Diisi
                  </span>
                )}
              </div>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="">-- Beban Umum Pool (Tidak Terikat Bus Tertentu) --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.code} - {v.plateNumber} ({v.nickname || 'Armada'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Baris 4: Keterangan & Nomor Nota */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700">
                Keterangan Rinci Pengeluaran <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                placeholder="Rincian tujuan pengeluaran uang kas kecil..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">
                Nomor Nota / Struk Fisik
              </label>
              <input
                type="text"
                placeholder="Misal: STRUK-882"
                value={receiptNo}
                onChange={(e) => setReceiptNo(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Opsional jika ada bukti kuitansi toko
              </p>
            </div>
          </div>

          {/* Auto-verify toggle info */}
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 border border-slate-200">
            <input
              type="checkbox"
              id="autoVerify"
              checked={autoVerify}
              onChange={(e) => setAutoVerify(e.target.checked)}
              className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500"
            />
            <label htmlFor="autoVerify" className="text-xs text-slate-700 cursor-pointer">
              <strong>Langsung Verifikasi & Posting Jurnal (VERIFIED)</strong> — Rekening Kas Kecil akan langsung berkurang dan akun beban akan otomatis terjurnal di Buku Besar.
            </label>
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
              className="flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-amber-600/20 hover:bg-amber-700 disabled:opacity-50"
            >
              <Receipt className="h-4 w-4" />
              {isSubmitting ? 'Menyimpan...' : 'Terbitkan BKK Kas Kecil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
