import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Landmark,
  Wallet,
  CreditCard,
  Check,
  X,
  User,
  Calendar,
} from 'lucide-react';
import type { FundTransfer } from '@/types';

interface TransferDetailModalProps {
  transfer: FundTransfer | null;
  isOpen: boolean;
  onClose: () => void;
  canApprove?: boolean;
  onApprove?: (transfer: FundTransfer) => void;
  onReject?: (transfer: FundTransfer) => void;
}

export default function TransferDetailModal({
  transfer,
  isOpen,
  onClose,
  canApprove = false,
  onApprove,
  onReject,
}: TransferDetailModalProps) {
  if (!transfer) return null;

  const formatRupiah = (val: string | number) => {
    const num = Number(val);
    if (isNaN(num)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const sourceName = transfer.sourceBankAccount?.bankName
    ? `${transfer.sourceBankAccount.bankName} - ${transfer.sourceBankAccount.accountName}`
    : transfer.sourceCashAccount?.name || 'Kas Sumber';

  const sourceNumber = transfer.sourceBankAccount?.accountNumberMasked || transfer.sourceBankAccount?.accountNumber || transfer.sourceCashAccount?.code || '-';

  const targetName = transfer.targetBankAccount?.bankName
    ? `${transfer.targetBankAccount.bankName} - ${transfer.targetBankAccount.accountName}`
    : transfer.targetCashAccount?.name || 'Kas Tujuan';

  const targetNumber = transfer.targetBankAccount?.accountNumberMasked || transfer.targetBankAccount?.accountNumber || transfer.targetCashAccount?.code || '-';

  const getTransferTypeLabel = (type: string) => {
    switch (type) {
      case 'MAIN_TO_OPS':
        return 'Induk → Operasional';
      case 'OPS_TO_OPS':
        return 'Antar Operasional';
      case 'POOL_TO_MAIN':
        return 'Setor Kas Pool → Induk';
      case 'OPS_TO_POOL':
        return 'Tarik Tunai Bank → Kas Pool';
      default:
        return type;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-foreground">
                <ArrowRightLeft className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold flex items-center gap-2">
                  <span>Dokumen Pemindahan Dana</span>
                  <span className="font-mono text-sm text-foreground">({transfer.transferNo})</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Tipe: {getTransferTypeLabel(transfer.transferType)} &bull; Dibuat pada {new Date(transfer.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </DialogDescription>
              </div>
            </div>

            {/* Status Badge */}
            <div>
              {transfer.status === 'PENDING_APPROVAL' && (
                <Badge variant="outline" className="text-xs gap-1 font-normal text-muted-foreground">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  Menunggu Otorisasi
                </Badge>
              )}
              {transfer.status === 'APPROVED' && (
                <Badge variant="outline" className="text-xs gap-1 font-normal text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Disetujui & Diposting
                </Badge>
              )}
              {transfer.status === 'REJECTED' && (
                <Badge variant="outline" className="text-xs gap-1 font-normal text-destructive border-destructive/20">
                  <XCircle className="w-3.5 h-3.5 text-destructive" />
                  Ditolak
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-1 text-xs">
          {/* Status Alert Banner */}
          {transfer.status === 'APPROVED' && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg border bg-muted/40 text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Transaksi Telah Disetujui</p>
                <p className="text-[11px] mt-0.5">
                  Disetujui oleh <strong>{transfer.approvedBy?.name || 'Finance Manager'}</strong>
                  {transfer.approvedAt ? ` pada ${new Date(transfer.approvedAt).toLocaleDateString('id-ID')}` : ''}.
                  Jurnal pembukuan kas/bank telah otomatis diposting ke Buku Besar.
                </p>
              </div>
            </div>
          )}

          {transfer.status === 'REJECTED' && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg border border-destructive/20 bg-destructive/5 text-destructive">
              <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Pengajuan Ditolak</p>
                <p className="text-[11px] mt-0.5">
                  Alasan penolakan: &ldquo;{transfer.rejectionReason || 'Tidak ada alasan dicantumkan'}&rdquo;
                </p>
              </div>
            </div>
          )}

          {transfer.status === 'PENDING_APPROVAL' && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg border bg-muted/40 text-muted-foreground">
              <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Menunggu Verifikasi Maker-Checker</p>
                <p className="text-[11px] mt-0.5">
                  Permohonan telah diajukan oleh staf dan siap ditinjau oleh Finance Manager atau Direktur untuk eksekusi posting ke GL.
                </p>
              </div>
            </div>
          )}

          {/* Visual Alur Transfer (Pengirim -> Penerima) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-xl border bg-muted/20">
            {/* Sumber */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                {transfer.sourceBankAccount ? (
                  <Landmark className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                )}
                <span>Rekening Pengirim (Kredit):</span>
              </div>
              <div className="font-bold text-sm text-foreground">{sourceName}</div>
              <div className="font-mono text-muted-foreground text-[11px]">{sourceNumber}</div>
            </div>

            {/* Tujuan */}
            <div className="space-y-1 md:border-l md:pl-3">
              <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                {transfer.targetBankAccount ? (
                  <CreditCard className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                ) : (
                  <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                )}
                <span>Rekening Penerima (Debit):</span>
              </div>
              <div className="font-bold text-sm text-foreground">{targetName}</div>
              <div className="font-mono text-muted-foreground text-[11px]">{targetNumber}</div>
            </div>
          </div>

          {/* Nominal Transfer Box */}
          <div className="rounded-xl border p-4 flex items-center justify-between bg-card">
            <div>
              <span className="text-xs text-muted-foreground font-medium">Total Nominal Pemindahan:</span>
              <div className="text-2xl font-black font-mono text-foreground mt-0.5">
                {formatRupiah(transfer.amount)}
              </div>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              IDR
            </Badge>
          </div>

          {/* Detail Informasi Tambahan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border bg-card space-y-1">
              <span className="text-muted-foreground text-[11px]">Tujuan / Keperluan:</span>
              <p className="font-medium text-foreground">{transfer.purpose || '-'}</p>
            </div>

            <div className="p-3 rounded-lg border bg-card space-y-1">
              <span className="text-muted-foreground text-[11px]">No. Referensi / Bukti M-Banking:</span>
              <p className="font-mono font-medium text-foreground">{transfer.referenceDoc || '-'}</p>
            </div>

            <div className="p-3 rounded-lg border bg-card space-y-1">
              <span className="text-muted-foreground text-[11px]">Pemohon (Maker):</span>
              <p className="font-medium text-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                {transfer.requestedBy?.name || 'Staf Operasional'}
              </p>
            </div>

            <div className="p-3 rounded-lg border bg-card space-y-1">
              <span className="text-muted-foreground text-[11px]">Waktu Pengajuan:</span>
              <p className="font-medium text-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                {new Date(transfer.createdAt).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs gap-1.5 h-8"
          >
            <Printer className="w-3.5 h-3.5 text-muted-foreground" />
            Cetak Bukti Transfer
          </Button>

          <div className="flex items-center gap-2">
            {transfer.status === 'PENDING_APPROVAL' && canApprove && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onReject?.(transfer);
                  }}
                  className="text-destructive hover:bg-destructive/10 text-xs h-8 px-3"
                >
                  <X className="w-3.5 h-3.5 mr-1" /> Tolak
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onApprove?.(transfer);
                  }}
                  className="text-xs h-8 px-3 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5 mr-1" /> Setujui & Posting
                </Button>
              </>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs h-8"
            >
              Tutup
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
