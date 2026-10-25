import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, Printer } from 'lucide-react';
import type { ArInvoice } from '@/types';
import ArInvoicePrintModal from './ArInvoicePrintModal';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: ArInvoice | null;
  onApprove?: (id: string) => void;
}

export function ArInvoiceDetailModal({ open, onOpenChange, invoice, onApprove }: Props) {
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  if (!invoice) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="outline" className="bg-slate-100 text-slate-700">DRAFT</Badge>;
      case 'APPROVED':
        return <Badge className="bg-blue-600 text-white">APPROVED</Badge>;
      case 'PARTIALLY_PAID':
        return <Badge className="bg-amber-500 text-white">PARTIAL</Badge>;
      case 'PAID':
        return <Badge className="bg-emerald-600 text-white">PAID</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">CANCELLED</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-indigo-600" />
                <DialogTitle className="text-xl font-bold text-slate-800">
                  Faktur Piutang Usaha: {invoice.invoiceNo}
                </DialogTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsPrintModalOpen(true)}
                  className="flex items-center gap-1.5 font-semibold text-xs text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100"
                >
                  <Printer className="h-3.5 w-3.5 text-indigo-600" />
                  Cetak Faktur (Invoice)
                </Button>
                {getStatusBadge(invoice.status)}
              </div>
            </div>
            <p className="text-sm text-slate-500">
              Pelanggan: <span className="font-semibold text-slate-700">{invoice.customerName}</span>
              {invoice.trip && ` • Terkait SPJ: ${invoice.trip.spjNo}`}
            </p>
          </DialogHeader>

          <div className="space-y-6">
            {/* Metadata Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <div className="text-[11px] text-slate-500 font-semibold uppercase">Tanggal Invoice</div>
                <div className="text-sm font-bold text-slate-800">
                  {new Date(invoice.invoiceDate).toLocaleDateString('id-ID')}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-semibold uppercase">Jatuh Tempo</div>
                <div className="text-sm font-bold text-slate-800">
                  {new Date(invoice.dueDate).toLocaleDateString('id-ID')}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-semibold uppercase">Total Nilai Piutang</div>
                <div className="text-sm font-extrabold text-slate-900">
                  Rp {Number(invoice.totalAmount).toLocaleString('id-ID')}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-semibold uppercase">Terbayar / Sisa</div>
                <div className="text-sm font-extrabold text-emerald-700">
                  Rp {Number(invoice.paidAmount).toLocaleString('id-ID')} / Rp{' '}
                  {Math.max(0, invoice.totalAmount - invoice.paidAmount).toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            {invoice.notes && (
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-xs text-blue-900">
                <span className="font-bold">Catatan:</span> {invoice.notes}
              </div>
            )}

            {/* Rincian Baris Invoice */}
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-800 text-sm">Rincian Baris Invoice</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-100">
                    <TableRow>
                      <TableHead className="w-12 text-center">No</TableHead>
                      <TableHead>Deskripsi Pendapatan</TableHead>
                      <TableHead className="w-20 text-center">Qty</TableHead>
                      <TableHead className="text-right">Harga Satuan</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.lines?.map((line, idx) => (
                      <TableRow key={line.id || idx}>
                        <TableCell className="text-center font-medium text-slate-500">{line.lineNo || idx + 1}</TableCell>
                        <TableCell>
                          <div className="font-semibold text-slate-800">{line.description}</div>
                          <div className="text-xs text-slate-500">
                            {line.account?.code ? `${line.account.code} - ${line.account.name}` : line.accountId}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-semibold text-slate-800">
                          {line.qty}
                        </TableCell>
                        <TableCell className="text-right text-slate-700 font-medium">
                          Rp {Number(line.unitPrice).toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-900">
                          Rp {Number(line.amount).toLocaleString('id-ID')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Riwayat Alokasi Penerimaan */}
            {invoice.allocations && invoice.allocations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-800 text-sm">Riwayat Pembayaran Pelunasan</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-100">
                      <TableRow>
                        <TableHead>No. Bukti Penerimaan</TableHead>
                        <TableHead>Tanggal Pelunasan</TableHead>
                        <TableHead className="text-right">Nominal Diterima</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.allocations.map((alloc, idx) => (
                        <TableRow key={alloc.id || idx}>
                          <TableCell className="font-semibold text-slate-800 text-xs">
                            {alloc.receipt?.receiptNo || alloc.receiptId}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">
                            {alloc.receipt?.receiptDate
                              ? new Date(alloc.receipt.receiptDate).toLocaleDateString('id-ID')
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right font-bold text-emerald-700 text-xs">
                            Rp {Number(alloc.amount).toLocaleString('id-ID')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Tombol Approval jika DRAFT */}
            {invoice.status === 'DRAFT' && onApprove && (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-amber-900">Setujui Faktur Piutang AR</div>
                  <div className="text-xs text-amber-700">
                    Ubah status invoice menjadi APPROVED agar siap ditagihkan dan dilunasi.
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    onApprove(invoice.id);
                    onOpenChange(false);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Setujui Invoice
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Printable Invoice Modal */}
      <ArInvoicePrintModal
        open={isPrintModalOpen}
        onOpenChange={setIsPrintModalOpen}
        invoice={invoice}
      />
    </>
  );
}
