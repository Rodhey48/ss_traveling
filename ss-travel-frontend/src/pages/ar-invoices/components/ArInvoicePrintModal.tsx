import { Printer, X, FileText } from 'lucide-react';
import type { ArInvoice } from '@/types';

interface ArInvoicePrintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: ArInvoice | null;
}

export default function ArInvoicePrintModal({
  open,
  onOpenChange,
  invoice,
}: ArInvoicePrintModalProps) {
  if (!open || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceDateStr = invoice.invoiceDate
    ? new Date(invoice.invoiceDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '-';

  const dueDateStr = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '-';

  const remaining = Math.max(0, invoice.totalAmount - invoice.paidAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl transition-all max-h-[90vh] overflow-y-auto">
        {/* Modal Actions Bar (Hidden during Print) */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-bold">
              <FileText className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Pratinjau Cetak Faktur Tagihan (Invoice AR)
              </h3>
              <p className="text-xs text-slate-500">
                Format resmi penagihan pelanggan sewa bus PT SS Traveling Official
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700"
            >
              <Printer className="h-4 w-4" />
              Cetak Invoice (A4)
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* PRINTABLE PHYSICAL INVOICE DOCUMENT */}
        <div className="mt-4 bg-white p-6 border border-slate-300 rounded-xl font-sans text-slate-900 print:border-none print:p-0 print:m-0 print:w-full">
          {/* KOP SURAT RESMI */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-amber-400 font-black text-xl shadow-md border-2 border-amber-400">
                SS
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900">
                  PT SS TRAVELINK OFFICIAL INDONESIA
                </h1>
                <p className="text-xs font-bold text-amber-600">
                  Layanan Bus Pariwisata Mewah & AKAP Eksekutif (Luxury Seat 2-1 • Combi • Sleeper)
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Jl. Pahlawan Gerbang No. 08 Rempoa, Ciputat Timur, Tangerang Selatan • Telp: 0822-9994-3700 • www.sstravelink.id
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-black tracking-wider text-indigo-700 uppercase">
                {invoice.isDownPayment ? 'KWITANSI UANG MUKA (DP)' : 'FAKTUR INVOICE'}
              </span>
              <div className="mt-1 font-mono text-base font-extrabold text-slate-900">
                {invoice.invoiceNo}
              </div>
              <div className="text-[10px] text-slate-500 font-semibold">
                Status: {invoice.status}
              </div>
            </div>
          </div>

          {/* DITUJUKAN KEPADA (CUSTOMER) & METADATA */}
          <div className="mt-4 grid grid-cols-2 gap-4 rounded-lg border border-slate-300 bg-slate-50/70 p-4 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Ditujukan Kepada (Penyewa / Klien):
              </span>
              <div className="mt-1 text-sm font-extrabold text-slate-900">
                {invoice.customer?.institutionName || invoice.customerName}
              </div>
              <div className="text-xs text-slate-700 mt-0.5">
                PIC: {invoice.customer?.picName || invoice.customerName}
              </div>
              <div className="text-[11px] text-slate-500">
                Kontak: {invoice.customer?.phone || '-'} • Kota: {invoice.customer?.city || 'Tangerang Selatan'}
              </div>
              {invoice.trip && (
                <div className="mt-2 text-[11px] font-medium text-indigo-900">
                  Ref SPJ Dinas: <strong>{invoice.trip.spjNo}</strong> ({invoice.trip.serviceType})
                </div>
              )}
            </div>

            <div className="space-y-1 text-right">
              <div className="grid grid-cols-2 gap-2 text-left">
                <span className="text-slate-500 font-medium">Tanggal Faktur:</span>
                <span className="font-bold text-slate-900">{invoiceDateStr}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-left">
                <span className="text-slate-500 font-medium">Jatuh Tempo:</span>
                <span className="font-bold text-rose-700">{dueDateStr}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-left">
                <span className="text-slate-500 font-medium">Mata Uang:</span>
                <span className="font-bold text-slate-900">IDR (Rupiah Indonesia)</span>
              </div>
            </div>
          </div>

          {/* TABEL RINCIAN TAGIHAN */}
          <div className="mt-4">
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <tr>
                  <th className="py-2 px-3 border-r border-slate-300 w-12 text-center">No</th>
                  <th className="py-2 px-3 border-r border-slate-300">Deskripsi Layanan Sewa Armada Bus</th>
                  <th className="py-2 px-3 border-r border-slate-300 w-16 text-center">Qty</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-right w-36">Harga Satuan</th>
                  <th className="py-2 px-3 text-right w-36">Subtotal (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoice.lines && invoice.lines.length > 0 ? (
                  invoice.lines.map((line, idx) => (
                    <tr key={line.id || idx}>
                      <td className="py-2 px-3 border-r border-slate-300 text-center font-medium text-slate-600">
                        {line.lineNo || idx + 1}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-300">
                        <div className="font-bold text-slate-900">{line.description}</div>
                        <div className="text-[10px] text-slate-500">
                          {line.account?.code ? `${line.account.code} - ${line.account.name}` : ''}
                        </div>
                      </td>
                      <td className="py-2 px-3 border-r border-slate-300 text-center font-semibold text-slate-800">
                        {line.qty}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-300 text-right text-slate-700">
                        Rp {Number(line.unitPrice).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                        Rp {Number(line.amount).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-2 px-3 border-r border-slate-300 text-center">1</td>
                    <td className="py-2 px-3 border-r border-slate-300 font-bold">
                      Paket Sewa Armada Bus Pariwisata Mewah (Sesuai Kontrak)
                    </td>
                    <td className="py-2 px-3 border-r border-slate-300 text-center">1</td>
                    <td className="py-2 px-3 border-r border-slate-300 text-right">
                      Rp {Number(invoice.totalAmount).toLocaleString('id-ID')}
                    </td>
                    <td className="py-2 px-3 text-right font-bold">
                      Rp {Number(invoice.totalAmount).toLocaleString('id-ID')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* TOTAL & RINGKASAN PEMBAYARAN */}
          <div className="mt-3 flex justify-between gap-4">
            {/* Informasi Rekening Bank */}
            <div className="w-1/2 rounded-lg border border-slate-300 bg-slate-50/50 p-3 text-xs">
              <span className="font-bold text-slate-900 block mb-1">
                Instruksi Pembayaran Transfer Bank Resmi:
              </span>
              <div className="text-[11px] text-slate-700 space-y-0.5">
                <div>Nama Bank: <strong>Bank Central Asia (BCA)</strong></div>
                <div>Nomor Rekening: <strong className="font-mono text-sm text-indigo-900">8830-1928-31</strong></div>
                <div>Atas Nama: <strong>PT SS TRAVELINK OFFICIAL</strong></div>
                <div className="text-[10px] text-slate-500 mt-1 italic">
                  * Mohon cantumkan nomor invoice pada berita transfer bank.
                </div>
              </div>
            </div>

            {/* Total Ringkasan Angka */}
            <div className="w-1/2 space-y-1.5 text-xs text-right">
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-500">Subtotal:</span>
                <span className="font-semibold text-slate-800">
                  Rp {Number(invoice.subtotal || invoice.totalAmount).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1">
                <span className="text-slate-500">PPN (0% Bebas Wisata):</span>
                <span className="font-semibold text-slate-800">Rp 0</span>
              </div>
              <div className="flex justify-between border-b-2 border-slate-900 pb-1 text-sm font-black text-slate-900">
                <span>Total Nilai Faktur:</span>
                <span>Rp {Number(invoice.totalAmount).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1 text-emerald-700 font-bold">
                <span>Telah Dibayarkan (DP / Pelunasan):</span>
                <span>- Rp {Number(invoice.paidAmount).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-rose-700 pt-0.5">
                <span>Sisa Tagihan yang Harus Dibayar:</span>
                <span>Rp {remaining.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          {/* KOLOM TANDA TANGAN RESMI */}
          <div className="mt-6 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="border border-slate-300 rounded-lg p-3 flex flex-col justify-between h-32 bg-white">
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                Diterima & Disetujui Oleh Penyewa
              </span>
              <div className="border-b border-dotted border-slate-400 mx-8 pb-1 font-bold text-slate-800">
                ( {invoice.customer?.picName || invoice.customerName} )
              </div>
              <span className="text-[9px] text-slate-400">Tanda Tangan & Cap Instansi</span>
            </div>

            <div className="border border-slate-300 rounded-lg p-3 flex flex-col justify-between h-32 bg-white">
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                Hormat Kami, PT SS TRAVELINK OFFICIAL
              </span>
              <div className="border-b border-dotted border-slate-400 mx-8 pb-1 font-bold text-slate-800">
                ( Bagian Keuangan / AR Finance )
              </div>
              <span className="text-[9px] text-slate-400">Kasir Piutang Usaha</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
