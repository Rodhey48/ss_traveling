import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  FileText,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Bus,
  Building2,
  User as UserIcon,
  Layers,
} from 'lucide-react';
import type { JournalEntry } from '@/types';
import { getNonManualReversalInfo } from '../index';

interface JournalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  journal: JournalEntry | null;
  onReverseClick?: (journal: JournalEntry) => void;
  canReverse?: boolean;
}

export default function JournalDetailModal({
  isOpen,
  onClose,
  journal,
  onReverseClick,
  canReverse = false,
}: JournalDetailModalProps) {
  if (!journal) return null;

  const formatRupiah = (val: string | number) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const isReversed = journal.status === 'REVERSED';
  const isReversalEntry = Boolean(journal.reversalOfId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <span>{journal.journalNo}</span>
                  <Badge
                    variant={isReversed ? 'destructive' : 'default'}
                    className={
                      isReversed
                        ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                        : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                    }
                  >
                    {journal.status}
                  </Badge>
                  <Badge variant="outline" className="font-mono text-xs">
                    {journal.sourceType}
                  </Badge>
                </DialogTitle>
                <p className="text-sm text-slate-500 mt-0.5">
                  ID: {journal.id}
                </p>
              </div>
            </div>

            {journal.status === 'POSTED' && canReverse && onReverseClick && (
              journal.sourceType === 'MANUAL' ? (
                <Button
                  variant="outline"
                  className="text-rose-600 border-rose-200 hover:bg-rose-50"
                  onClick={() => {
                    onClose();
                    onReverseClick(journal);
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-1.5" />
                  Pembalik (Reversal)
                </Button>
              ) : (
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-block cursor-not-allowed">
                        <Button
                          variant="outline"
                          disabled
                          className="text-slate-400 border-slate-200 opacity-60 cursor-not-allowed"
                        >
                          <RotateCcw className="h-4 w-4 mr-1.5 text-slate-400" />
                          Pembalik (Reversal)
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className="max-w-xs text-xs bg-slate-900 text-white p-2.5 shadow-xl border border-slate-700"
                    >
                      <p className="font-semibold text-amber-300 mb-1 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        Reversal Manual Dinonaktifkan
                      </p>
                      <p className="text-[11px] leading-relaxed text-slate-200">
                        {getNonManualReversalInfo(journal.sourceType)}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            )}
          </div>
        </DialogHeader>

        {/* Reversal Banner */}
        {isReversed && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-rose-800 flex items-start gap-2.5 text-sm">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Jurnal Ini Telah Dibalik (REVERSED)</p>
              <p className="text-rose-700 text-xs mt-0.5">
                Transaksi jurnal ini telah dibatalkan secara sah melalui jurnal pembalik. Saldo buku besar telah disesuaikan kembali.
              </p>
            </div>
          </div>
        )}

        {isReversalEntry && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 flex items-start gap-2.5 text-sm">
            <RotateCcw className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Jurnal Pembalik (Reversal Entry)</p>
              <p className="text-amber-700 text-xs mt-0.5">
                Jurnal ini adalah entri pembalik atas jurnal nomor: <span className="font-mono font-bold">{journal.reversalOf?.journalNo || journal.reversalOfId}</span>.
              </p>
            </div>
          </div>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-3.5 rounded-lg border text-sm">
          <div>
            <span className="text-slate-500 text-xs block">Tanggal Transaksi</span>
            <div className="font-medium flex items-center gap-1.5 mt-0.5">
              <Calendar className="h-4 w-4 text-slate-400" />
              {journal.journalDate}
            </div>
          </div>
          <div>
            <span className="text-slate-500 text-xs block">Periode Fiskal</span>
            <div className="font-medium mt-0.5">
              {journal.period?.name || 'Oktober 2026'}
            </div>
          </div>
          <div>
            <span className="text-slate-500 text-xs block">Diposting Oleh</span>
            <div className="font-medium flex items-center gap-1.5 mt-0.5">
              <UserIcon className="h-4 w-4 text-slate-400" />
              {journal.postedByUser?.name || 'Sistem / Administrator'}
            </div>
          </div>
          <div className="md:col-span-3 border-t pt-2 mt-1">
            <span className="text-slate-500 text-xs block">Keterangan Transaksi</span>
            <p className="text-slate-700 mt-0.5 font-medium">{journal.description}</p>
          </div>
        </div>

        {/* Lines Table */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-slate-800">
              Rincian Baris Jurnal ({journal.lines?.length || 0} Baris)
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Status: SEIMBANG (BALANCED)</span>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-100">
                <TableRow>
                  <TableHead className="w-10 text-center font-bold">No</TableHead>
                  <TableHead className="font-bold">Akun COA</TableHead>
                  <TableHead className="font-bold">Keterangan & Dimensi</TableHead>
                  <TableHead className="text-right font-bold w-36">Debit (Rp)</TableHead>
                  <TableHead className="text-right font-bold w-36">Kredit (Rp)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {journal.lines?.map((line, idx) => {
                  const hasDebit = Number(line.debit) > 0;
                  const hasCredit = Number(line.credit) > 0;
                  return (
                    <TableRow key={line.id || idx} className="hover:bg-slate-50/80">
                      <TableCell className="text-center font-mono text-xs text-slate-400">
                        {line.lineNo || idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-xs font-bold text-blue-700">
                          {line.account?.code || line.accountId}
                        </div>
                        <div className="text-sm font-medium text-slate-800">
                          {line.account?.name || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-700">
                          {line.description || journal.description}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {line.businessUnit && (
                            <Badge
                              variant="outline"
                              className={`text-[11px] gap-1 font-semibold ${
                                line.businessUnit.code === 'AKAP'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : line.businessUnit.code === 'WISATA'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              <Layers className="h-3 w-3" />
                              Unit: {line.businessUnit.code}
                            </Badge>
                          )}
                          {line.vehicle && (
                            <Badge variant="outline" className="text-[11px] bg-slate-50 gap-1 text-slate-600">
                              <Bus className="h-3 w-3" />
                              {line.vehicle.code} ({line.vehicle.plateNumber})
                            </Badge>
                          )}
                          {line.costCenter && (
                            <Badge variant="outline" className="text-[11px] bg-slate-50 gap-1 text-slate-600">
                              <Building2 className="h-3 w-3" />
                              {line.costCenter.name}
                            </Badge>
                          )}
                          {line.tripId && (
                            <Badge variant="outline" className="text-[11px] bg-purple-50 text-purple-700 border-purple-200">
                              SPJ: {line.tripId.slice(0, 8)}...
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-sm">
                        {hasDebit ? (
                          <span className="text-slate-900 font-bold">{formatRupiah(line.debit)}</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-sm">
                        {hasCredit ? (
                          <span className="text-slate-900 font-bold">{formatRupiah(line.credit)}</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Footer Totals */}
          <div className="bg-slate-100 border border-t-0 rounded-b-lg p-3 flex justify-between items-center text-sm">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-xs">
              Total Akumulasi
            </span>
            <div className="flex gap-8">
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Total Debit</span>
                <span className="font-mono font-bold text-base text-slate-900">
                  {formatRupiah(journal.totalDebit)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Total Kredit</span>
                <span className="font-mono font-bold text-base text-slate-900">
                  {formatRupiah(journal.totalCredit)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 pt-3 border-t">
          <Button variant="secondary" onClick={onClose}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
