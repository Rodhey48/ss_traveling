import { useState, useEffect, useCallback } from 'react';
import Heading from '@/components/shared/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Receipt,
  Search,
  RotateCcw,
  DollarSign,
  FileCheck2,
  CreditCard,
  Eye,
  Sparkles,
} from 'lucide-react';
import { ArService } from '@/services/ar.service';
import { CreateDownPaymentModal } from './components/CreateDownPaymentModal';
import { CreateCharterPelunasanModal } from './components/CreateCharterPelunasanModal';
import { CreateGeneralArInvoiceModal } from './components/CreateGeneralArInvoiceModal';
import { CreateArReceiptModal } from './components/CreateArReceiptModal';
import { ArInvoiceDetailModal } from './components/ArInvoiceDetailModal';
import type { ArInvoice, ArReceipt, ArInvoiceStatus } from '@/types';
import { toast } from 'sonner';

export default function ArInvoicesPage() {
  const [activeTab, setActiveTab] = useState<'invoices' | 'receipts'>('invoices');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);

  // Data states
  const [invoices, setInvoices] = useState<ArInvoice[]>([]);
  const [receipts, setReceipts] = useState<ArReceipt[]>([]);

  // Modals state
  const [isDpModalOpen, setIsDpModalOpen] = useState(false);
  const [isCharterModalOpen, setIsCharterModalOpen] = useState(false);
  const [isGeneralArModalOpen, setIsGeneralArModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<ArInvoice | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [resInvoices, resReceipts] = await Promise.all([
        ArService.getInvoices({
          search: search || undefined,
          status: statusFilter !== 'ALL' ? (statusFilter as ArInvoiceStatus) : undefined,
        }),
        ArService.getReceipts({}),
      ]);
      setInvoices(resInvoices.data || []);
      setReceipts(resReceipts.data || []);
    } catch (err: any) {
      toast.error('Gagal memuat data piutang AR: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (id: string) => {
    try {
      await ArService.approveInvoice(id);
      toast.success('Invoice AR berhasil disetujui.');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyetujui invoice AR');
    }
  };

  // Metrik Ringkasan
  const totalOutstanding = invoices
    .filter((inv) => inv.status === 'APPROVED' || inv.status === 'PARTIALLY_PAID')
    .reduce((acc, curr) => acc + (curr.totalAmount - curr.paidAmount), 0);

  const totalDpReceived = receipts
    .filter((r) => r.isDownPayment && r.status === 'CONFIRMED')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const totalCollectedMonth = receipts
    .filter((r) => !r.isDownPayment && r.status === 'CONFIRMED')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const formatRupiah = (val: number | string | undefined) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(val || 0));
  };

  const getStatusBadge = (status: ArInvoiceStatus) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="outline" className="bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10">DRAFT</Badge>;
      case 'APPROVED':
        return <Badge className="bg-blue-600/90 dark:bg-blue-500/90 text-white">APPROVED</Badge>;
      case 'PARTIALLY_PAID':
        return <Badge className="bg-amber-500/90 dark:bg-amber-500 text-white">PARTIAL</Badge>;
      case 'PAID':
        return <Badge className="bg-emerald-600/90 dark:bg-emerald-500 text-white">PAID</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">CANCELLED</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Heading
          title="Modul Piutang Usaha & DP Sewa Wisata (AR)"
          description="Pencatatan uang muka sewa wisata 30% (Skenario 2), penerbitan invoice pelunasan 70%, dan pelunasan piutang."
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setIsGeneralArModalOpen(true)}
            variant="outline"
            className="gap-2 font-medium"
          >
            <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            + Buat Invoice AR Umum
          </Button>
          <Button
            onClick={() => setIsDpModalOpen(true)}
            variant="default"
            className="gap-2 font-medium"
          >
            <DollarSign className="h-4 w-4" />
            + Terima DP Sewa Wisata (30%)
          </Button>
          <Button
            onClick={() => setIsCharterModalOpen(true)}
            variant="outline"
            className="gap-2 font-medium"
          >
            <FileCheck2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            + Invoice Pelunasan Wisata (70%)
          </Button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md shadow-xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/40">
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                Total Piutang Belum Tertagih
              </p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {formatRupiah(totalOutstanding)}
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Piutang sewa wisata & kontrak aktif
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md shadow-xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-indigo-700 dark:text-indigo-400 tracking-wider">
                Titipan DP Sewa Wisata (24101)
              </p>
              <h3 className="text-2xl font-black text-indigo-900 dark:text-indigo-300 mt-1">
                {formatRupiah(totalDpReceived)}
              </h3>
              <p className="text-[11px] text-indigo-600/80 dark:text-indigo-400/80 mt-0.5">
                Liabilitas uang muka kontrak berjalan
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md shadow-xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-400 tracking-wider">
                Piutang Tertagih (Pelunasan)
              </p>
              <h3 className="text-2xl font-black text-emerald-900 dark:text-emerald-300 mt-1">
                {formatRupiah(totalCollectedMonth)}
              </h3>
              <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                Penerimaan mutasi bank & kas
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md shadow-xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-900/40">
              <FileCheck2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-blue-700 dark:text-blue-400 tracking-wider">
                Total Faktur Terbit
              </p>
              <h3 className="text-2xl font-black text-blue-900 dark:text-blue-300 mt-1">
                {invoices.length} Faktur
              </h3>
              <p className="text-[11px] text-blue-600/80 dark:text-blue-400/80 mt-0.5">
                {invoices.filter((i) => i.status === 'PAID').length} Lunas •{' '}
                {invoices.filter((i) => i.status === 'APPROVED').length} Menunggu Pelunasan
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABS & FILTERS */}
      <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md p-4 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 dark:border-white/10 pb-4">
          <div className="tabs-container-pill">
            <Button
              variant={activeTab === 'invoices' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('invoices')}
              className="gap-2 text-xs font-semibold"
            >
              <Receipt className="h-4 w-4" />
              Daftar Faktur Piutang (AR Invoices)
            </Button>
            <Button
              variant={activeTab === 'receipts' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('receipts')}
              className="gap-2 text-xs font-semibold"
            >
              <CreditCard className="h-4 w-4" />
              Riwayat Penerimaan Pembayaran (Receipts)
            </Button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <Input
                placeholder="Cari no. invoice / pelanggan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs bg-slate-50 dark:bg-white/5 border-slate-200/80 dark:border-white/10"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchData}
              className="h-9 w-9 shrink-0 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {activeTab === 'invoices' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Status:</span>
            <select
              className="h-8 px-2.5 rounded-lg border border-slate-200/80 dark:border-white/10 text-xs bg-slate-50 dark:bg-white/5 font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Semua Status</option>
              <option value="DRAFT">DRAFT</option>
              <option value="APPROVED">APPROVED (Menunggu Pelunasan)</option>
              <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
              <option value="PAID">PAID (Lunas)</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        )}

        {/* TAB 1: DAFTAR INVOICE AR */}
        {activeTab === 'invoices' && (
          <div className="border border-slate-200/80 dark:border-white/10 rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/80 dark:bg-white/5">
                <TableRow className="border-b border-slate-200/80 dark:border-white/10">
                  <TableHead>No. Invoice</TableHead>
                  <TableHead>Pelanggan & SPJ</TableHead>
                  <TableHead>Tgl. Invoice</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead className="text-right">Total Piutang</TableHead>
                  <TableHead className="text-right">Diterima</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                      Memuat data invoice AR...
                    </TableCell>
                  </TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                      Belum ada invoice piutang yang terdaftar.
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv) => (
                    <TableRow key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                      <TableCell>
                        <div className="font-bold text-slate-800 dark:text-slate-100 text-xs">{inv.invoiceNo}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">{inv.sourceType}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{inv.customerName}</div>
                        {inv.trip && (
                          <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                            SPJ: {inv.trip.spjNo}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                        {new Date(inv.invoiceDate).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                        {new Date(inv.dueDate).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell className="text-right font-extrabold text-slate-900 dark:text-white text-xs">
                        {formatRupiah(inv.totalAmount)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-emerald-700 dark:text-emerald-400 text-xs">
                        {formatRupiah(inv.paidAmount)}
                      </TableCell>
                      <TableCell className="text-center">{getStatusBadge(inv.status)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setIsDetailModalOpen(true);
                            }}
                            className="h-7 px-2 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Detail
                          </Button>

                          {inv.status === 'DRAFT' && (
                            <Button
                              size="sm"
                              onClick={() => handleApprove(inv.id)}
                              className="h-7 px-2 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              Setujui
                            </Button>
                          )}

                          {(inv.status === 'APPROVED' || inv.status === 'PARTIALLY_PAID') && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setIsReceiptModalOpen(true);
                              }}
                              className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                              Pelunasan
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* TAB 2: RIWAYAT PENERIMAAN PEMBAYARAN */}
        {activeTab === 'receipts' && (
          <div className="border border-slate-200/80 dark:border-white/10 rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/80 dark:bg-white/5">
                <TableRow className="border-b border-slate-200/80 dark:border-white/10">
                  <TableHead>No. Bukti Penerimaan</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jenis Penerimaan</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead>Rekening Bank / Kas</TableHead>
                  <TableHead>No. Bukti / Ref</TableHead>
                  <TableHead className="text-right">Total Diterima</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                      Memuat riwayat penerimaan...
                    </TableCell>
                  </TableRow>
                ) : receipts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                      Belum ada penerimaan pembayaran AR yang tercatat.
                    </TableCell>
                  </TableRow>
                ) : (
                  receipts.map((r) => (
                    <TableRow key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                      <TableCell className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                        {r.receiptNo}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                        {r.customerName}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                        {new Date(r.receiptDate).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>
                        {r.isDownPayment ? (
                          <Badge className="bg-indigo-600/90 dark:bg-indigo-500/90 text-white text-[10px]">
                            DP Sewa 30% (24101)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 text-[10px]">
                            Pelunasan Piutang (12101)
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            r.paymentMethod === 'BANK_TRANSFER'
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                          }
                        >
                          {r.paymentMethod === 'BANK_TRANSFER' ? 'Transfer Bank' : 'Kas Tunai'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-700 dark:text-slate-300">
                        {r.bankAccount
                          ? `${r.bankAccount.bankName} (${r.bankAccount.accountNumberMasked})`
                          : r.cashAccount
                          ? r.cashAccount.name
                          : '-'}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {r.reference || '-'}
                      </TableCell>
                      <TableCell className="text-right font-extrabold text-emerald-800 dark:text-emerald-400 text-xs">
                        {formatRupiah(r.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* MODALS */}
      <CreateGeneralArInvoiceModal
        open={isGeneralArModalOpen}
        onOpenChange={setIsGeneralArModalOpen}
        onSuccess={fetchData}
      />

      <CreateDownPaymentModal
        open={isDpModalOpen}
        onOpenChange={setIsDpModalOpen}
        onSuccess={fetchData}
      />

      <CreateCharterPelunasanModal
        open={isCharterModalOpen}
        onOpenChange={setIsCharterModalOpen}
        onSuccess={fetchData}
      />

      <CreateArReceiptModal
        open={isReceiptModalOpen}
        onOpenChange={setIsReceiptModalOpen}
        invoice={selectedInvoice}
        onSuccess={fetchData}
      />

      <ArInvoiceDetailModal
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        invoice={selectedInvoice}
        onApprove={handleApprove}
      />
    </div>
  );
}
