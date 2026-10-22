import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X, Bus, CheckCircle2 } from 'lucide-react';
import type { CrewCashSettlement } from '@/types';

interface CashReceiptVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  settlement: CrewCashSettlement | null;
}

export const CashReceiptVoucherModal: React.FC<CashReceiptVoucherModalProps> = ({
  isOpen,
  onClose,
  settlement,
}) => {
  if (!settlement) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatRupiah = (val: number | string | undefined) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(val || 0));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white text-slate-900 print:m-0 print:p-0 print:border-none print:shadow-none">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <Bus className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">
                  PT SS TRAVELING INDONESIA
                </DialogTitle>
                <p className="text-xs text-slate-500">
                  Layanan Bus Pariwisata & AKAP (Tangerang - Yogyakarta PP)
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                {settlement.bkmNo ? 'BUKTI KAS MASUK (BKM)' : 'VOUCHER SETTLEMENT'}
              </span>
              <p className="mt-1 text-xs font-mono font-bold text-slate-700">
                {settlement.bkmNo || settlement.settlementNo}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-4 text-sm">
          {/* Metadata Transaksi */}
          <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 border border-slate-200">
            <div>
              <p className="text-xs text-slate-500">Nomor SPJ:</p>
              <p className="font-semibold text-slate-800">{settlement.spj?.spjNo || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Armada Bus:</p>
              <p className="font-semibold text-slate-800">
                {settlement.spj?.vehicle?.code} - {settlement.spj?.vehicle?.plateNumber}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Kasir Penerima:</p>
              <p className="font-semibold text-slate-800">
                {settlement.cashier?.name || 'Kasir Pool Ciputat'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Tanggal Rekonsiliasi:</p>
              <p className="font-semibold text-slate-800">
                {settlement.reviewedAt
                  ? new Date(settlement.reviewedAt).toLocaleString('id-ID')
                  : new Date().toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          {/* Rincian Finansial Dua Kantong Kas */}
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 font-semibold text-slate-700 border-b">
                <tr>
                  <th className="p-2.5">Kategori Kas</th>
                  <th className="p-2.5">Deskripsi</th>
                  <th className="p-2.5 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-2.5 font-medium text-slate-800">Kantong 1 (Uang Jalan)</td>
                  <td className="p-2.5 text-slate-600">
                    Pengembalian sisa fisik Uang Jalan perjalanan
                  </td>
                  <td className="p-2.5 text-right font-mono font-medium text-slate-900">
                    {formatRupiah(settlement.totalUjReturned)}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium text-slate-800">Kantong 2 (Setoran Kas)</td>
                  <td className="p-2.5 text-slate-600">
                    Setoran bruto tiket kas & resi paket kargo kru
                  </td>
                  <td className="p-2.5 text-right font-mono font-medium text-slate-900">
                    {formatRupiah(settlement.totalRevenueRemitted)}
                  </td>
                </tr>
                {settlement.totalCashPaid > 0 && (
                  <tr className="bg-amber-50/50">
                    <td className="p-2.5 font-medium text-amber-800">Pengeluaran Kasir (BKK)</td>
                    <td className="p-2.5 text-amber-700">
                      Pembayaran tunai uang makan kru & komisi kargo (Ref: {settlement.bkkNo || '-'})
                    </td>
                    <td className="p-2.5 text-right font-mono font-medium text-amber-900">
                      - {formatRupiah(settlement.totalCashPaid)}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t">
                <tr>
                  <td colSpan={2} className="p-2.5 text-slate-800">
                    TOTAL KAS FISIK BERSIH DITERIMA KASIR POOL:
                  </td>
                  <td className="p-2.5 text-right font-mono text-emerald-700 text-sm">
                    {formatRupiah(settlement.totalCashReceived - settlement.totalCashPaid)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Status & Catatan */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
            <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              <span>Status Dokumen: VERIFIED & BALANCED (SEIMBANG)</span>
            </div>
            {settlement.journalEntryId && (
              <span className="font-mono text-slate-600">
                Jurnal Terposting: Ref-{settlement.settlementNo}
              </span>
            )}
          </div>

          {/* Kolom Tanda Tangan */}
          <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
            <div className="space-y-12">
              <p className="text-slate-600 font-medium">Kru Penyetor,</p>
              <div className="border-b border-slate-400 mx-8"></div>
              <p className="text-slate-500">( Driver / Kondektur Bus )</p>
            </div>
            <div className="space-y-12">
              <p className="text-slate-600 font-medium">Kasir Pool Penerima,</p>
              <div className="border-b border-slate-400 mx-8"></div>
              <p className="text-slate-800 font-semibold">
                ( {settlement.cashier?.name || 'Petugas Kasir'} )
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t pt-4 print:hidden">
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="mr-1.5 h-4 w-4" /> Tutup
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handlePrint}>
            <Printer className="mr-1.5 h-4 w-4" /> Cetak Voucher Fisik
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
