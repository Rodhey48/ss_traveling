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
import { FileText, BookOpen, AlertTriangle } from 'lucide-react';
import type { ApInvoice } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: ApInvoice | null;
  onApprove?: (id: string) => void;
  onCancel?: (id: string) => void;
}

export function ApInvoiceDetailModal({
  open,
  onOpenChange,
  invoice,
  onApprove,
  onCancel,
}: Props) {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-indigo-600" />
              <DialogTitle className="text-xl font-bold text-slate-800">
                Faktur Tagihan AP: {invoice.billNo}
              </DialogTitle>
            </div>
            {getStatusBadge(invoice.status)}
          </div>
          <p className="text-sm text-slate-500">
            Vendor: <span className="font-semibold text-slate-700">{invoice.vendorName}</span> ({invoice.vendorType})
            {invoice.vendorInvoiceNo && ` • No. Fisik: ${invoice.vendorInvoiceNo}`}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Tanggal Faktur</div>
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
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Total Nilai Tagihan</div>
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

          {/* Rincian Baris Tagihan */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-800 text-sm">Rincian Baris Tagihan</h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-100">
                  <TableRow>
                    <TableHead className="w-12 text-center">No</TableHead>
                    <TableHead>Deskripsi & Akun</TableHead>
                    <TableHead>SPJ & Armada</TableHead>
                    <TableHead className="w-20 text-center">Qty / Kupon</TableHead>
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
                        {line.discrepancyNotes && (
                          <div className="text-[11px] text-amber-700 flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="h-3 w-3" />
                            {line.discrepancyNotes}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-medium text-slate-700">
                          {line.trip?.spjNo || line.tripId || '-'}
                        </div>
                        {line.vehicle && (
                          <div className="text-[11px] text-slate-500">
                            {line.vehicle.plateNumber} ({line.vehicle.code})
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-slate-800">
                        {line.couponCount || line.qty}
                        {line.manifestPaxCount ? (
                          <div className="text-[10px] text-slate-400">manifes: {line.manifestPaxCount}</div>
                        ) : null}
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

          {/* Jurnal Terposting (Jika Ada) */}
          {invoice.journalEntry && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-indigo-600" />
                <h4 className="font-semibold text-slate-800 text-sm">
                  Jurnal Pengakuan Utang Terposting ({invoice.journalEntry.journalNo})
                </h4>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                <Table>
                  <TableHeader className="bg-slate-100">
                    <TableRow>
                      <TableHead>Akun COA</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Kredit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.journalEntry.lines?.map((jl, idx) => (
                      <TableRow key={jl.id || idx}>
                        <TableCell className="font-medium text-xs text-slate-800">
                          {jl.account?.code ? `${jl.account.code} - ${jl.account.name}` : jl.accountId}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">{jl.description}</TableCell>
                        <TableCell className="text-right text-xs font-semibold text-slate-800">
                          {Number(jl.debit) > 0 ? `Rp ${Number(jl.debit).toLocaleString('id-ID')}` : '-'}
                        </TableCell>
                        <TableCell className="text-right text-xs font-semibold text-slate-800">
                          {Number(jl.credit) > 0 ? `Rp ${Number(jl.credit).toLocaleString('id-ID')}` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Riwayat Alokasi Pembayaran */}
          {invoice.allocations && invoice.allocations.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-800 text-sm">Riwayat Pembayaran Pelunasan</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-100">
                    <TableRow>
                      <TableHead>No. Pembayaran</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead className="text-right">Alokasi Dibayarkan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.allocations.map((alloc, idx) => (
                      <TableRow key={alloc.id || idx}>
                        <TableCell className="font-semibold text-slate-800 text-xs">
                          {alloc.payment?.paymentNo || alloc.paymentId}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {alloc.payment?.paymentDate
                            ? new Date(alloc.payment.paymentDate).toLocaleDateString('id-ID')
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

          {/* Aksi Persetujuan jika status masih DRAFT */}
          {invoice.status === 'DRAFT' && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-amber-900">Konfirmasi & Posting Tagihan AP</div>
                <div className="text-xs text-amber-700">
                  Setelah disetujui, jurnal utang akan diposting otomatis ke buku besar.
                </div>
              </div>
              <div className="flex gap-2">
                {onCancel && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onCancel(invoice.id);
                      onOpenChange(false);
                    }}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Batalkan Faktur
                  </Button>
                )}
                {onApprove && (
                  <Button
                    size="sm"
                    onClick={() => {
                      onApprove(invoice.id);
                      onOpenChange(false);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    Setujui & Posting Jurnal
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
