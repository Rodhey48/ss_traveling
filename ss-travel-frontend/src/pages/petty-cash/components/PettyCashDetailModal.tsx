import { useState } from 'react';
import {
  X,
  Printer,
  CheckCircle2,
  XCircle,
  Truck,
  Scale,
  Receipt,
} from 'lucide-react';
import type { CashTransaction } from '@/types';
import { PettyCashService } from '@/services/petty-cash.service';
import { toast } from 'sonner';

interface PettyCashDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction: CashTransaction | null;
}

export default function PettyCashDetailModal({
  isOpen,
  onClose,
  onSuccess,
  transaction,
}: PettyCashDetailModalProps) {
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !transaction) return null;

  const isDisbursement = transaction.type === 'DISBURSEMENT';
  const isVerified = transaction.status === 'VERIFIED';
  const isSubmitted = transaction.status === 'SUBMITTED';

  const handleVerify = async () => {
    try {
      setIsProcessing(true);
      const res = await PettyCashService.verifyTransaction(transaction.id);
      toast.success(res.message || 'Transaksi kas kecil berhasil diverifikasi!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Gagal memverifikasi transaksi kas kecil.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Alasan penolakan wajib diisi.');
      return;
    }
    try {
      setIsProcessing(true);
      const res = await PettyCashService.rejectTransaction(transaction.id, {
        reason: rejectReason.trim(),
      });
      toast.success(res.message || 'Transaksi kas kecil telah ditolak.');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Gagal menolak transaksi kas kecil.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                isDisbursement
                  ? 'bg-amber-500/10 text-amber-600'
                  : 'bg-emerald-500/10 text-emerald-600'
              }`}
            >
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-800">
                  {transaction.transactionNo}
                </h3>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    transaction.status === 'VERIFIED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : transaction.status === 'SUBMITTED'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {transaction.status}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    isDisbursement
                      ? 'bg-slate-100 text-slate-700'
                      : 'bg-blue-50 text-blue-700'
                  }`}
                >
                  {isDisbursement ? 'BKK (Kas Keluar)' : 'BKM (Replenishment)'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Dokumen Kas Kecil Pool PT SS Traveling Official
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

        {/* Printable Voucher Section */}
        <div id="voucher-print-area" className="mt-4 space-y-4">
          {/* Main Info Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-medium text-slate-500">
                  Total Nominal Transaksi
                </span>
                <div className="text-2xl font-extrabold text-slate-900">
                  Rp {Number(transaction.amount).toLocaleString('id-ID')}
                </div>
              </div>
              <div className="text-sm sm:text-right">
                <span className="text-xs font-medium text-slate-500">
                  Tanggal Transaksi
                </span>
                <div className="font-semibold text-slate-800">
                  {new Date(transaction.transactionDate).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
              <div>
                <span className="text-slate-500">Penerima / Sumber Dana:</span>
                <div className="font-bold text-slate-800 mt-0.5">
                  {transaction.recipient}
                </div>
              </div>

              <div>
                <span className="text-slate-500">Rekening Kas Kecil:</span>
                <div className="font-bold text-slate-800 mt-0.5">
                  {transaction.cashAccount?.code} - {transaction.cashAccount?.name}
                </div>
              </div>

              {transaction.expenseAccount && (
                <div>
                  <span className="text-slate-500">Akun Beban GL (COA):</span>
                  <div className="font-bold text-amber-800 mt-0.5">
                    {transaction.expenseAccount.code} - {transaction.expenseAccount.name}
                  </div>
                </div>
              )}

              {transaction.vehicle && (
                <div>
                  <span className="text-slate-500">Dimensi Armada Bus:</span>
                  <div className="font-bold text-indigo-800 mt-0.5 flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5" />
                    {transaction.vehicle.code} ({transaction.vehicle.plateNumber})
                  </div>
                </div>
              )}

              {transaction.receiptNo && (
                <div>
                  <span className="text-slate-500">Nomor Nota / Bon:</span>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {transaction.receiptNo}
                  </div>
                </div>
              )}

              {transaction.costCenter && (
                <div>
                  <span className="text-slate-500">Cost Center:</span>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {transaction.costCenter.code} - {transaction.costCenter.name}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3 border-t border-slate-200 pt-3 text-xs">
              <span className="text-slate-500">Uraian / Keterangan:</span>
              <p className="mt-1 text-slate-800 font-medium whitespace-pre-wrap">
                {transaction.description}
              </p>
            </div>

            {transaction.rejectionReason && (
              <div className="mt-3 rounded-lg bg-rose-50 p-3 border border-rose-200 text-xs text-rose-800">
                <strong>Alasan Penolakan:</strong> {transaction.rejectionReason}
              </div>
            )}
          </div>

          {/* Journal Entry Preview */}
          {transaction.journalEntry && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Jurnal Umum Terposting: {transaction.journalEntry.journalNo}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  POSTED GL
                </span>
              </div>

              {transaction.journalEntry.lines && (
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="py-1">Akun COA</th>
                        <th className="py-1">Keterangan</th>
                        <th className="py-1 text-right">Debit</th>
                        <th className="py-1 text-right">Kredit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                      {transaction.journalEntry.lines.map((line, idx) => (
                        <tr key={idx}>
                          <td className="py-1.5">
                            {line.account?.code} - {line.account?.name}
                          </td>
                          <td className="py-1.5 font-sans text-slate-600">
                            {line.description || '-'}
                          </td>
                          <td className="py-1.5 text-right font-semibold">
                            {Number(line.debit) > 0
                              ? `Rp ${Number(line.debit).toLocaleString('id-ID')}`
                              : '-'}
                          </td>
                          <td className="py-1.5 text-right font-semibold">
                            {Number(line.credit) > 0
                              ? `Rp ${Number(line.credit).toLocaleString('id-ID')}`
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Audit Signatures */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-600 border-t border-slate-100 pt-3">
            <div>
              <div className="text-[11px] text-slate-400">Penerima Dana</div>
              <div className="mt-8 font-bold text-slate-800">
                {transaction.recipient}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Kasir Pool (Penginput)</div>
              <div className="mt-8 font-bold text-slate-800">
                {transaction.createdByUser?.name || 'Kasir Pool'}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Akuntan (Verifikasi)</div>
              <div className="mt-8 font-bold text-slate-800">
                {transaction.verifiedByUser?.name ||
                  (isVerified ? 'Akuntan Perusahaan' : 'Belum Diverifikasi')}
              </div>
            </div>
          </div>
        </div>

        {/* Reject Reason Form Toggle */}
        {isRejecting && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/50 p-3 space-y-2">
            <label className="text-xs font-bold text-rose-800">
              Alasan Penolakan Pengeluaran Kas Kecil
            </label>
            <input
              type="text"
              placeholder="Jelaskan alasan bon ditolak (misal: nota tidak sah / salah nominal)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full rounded-lg border border-rose-300 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsRejecting(false)}
                className="rounded-lg px-3 py-1 text-xs text-slate-600 hover:bg-slate-200/50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={isProcessing}
                className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-bold text-white hover:bg-rose-700"
              >
                Konfirmasi Tolak
              </button>
            </div>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            <Printer className="h-4 w-4" />
            Cetak Voucher
          </button>

          <div className="flex items-center gap-2">
            {isSubmitted && !isRejecting && (
              <>
                <button
                  type="button"
                  onClick={() => setIsRejecting(true)}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
                >
                  <XCircle className="h-4 w-4" />
                  Tolak Bon
                </button>
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isProcessing ? 'Memproses...' : 'Verifikasi & Posting GL'}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
