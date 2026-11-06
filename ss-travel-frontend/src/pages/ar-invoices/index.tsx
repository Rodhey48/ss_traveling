import ConfirmDialog from '@/components/shared/confirm-dialog';
import Heading from '@/components/shared/heading';
import {
  MetricCardGridSkeleton,
  TableSkeletonRows,
} from '@/components/shared/skeleton-loaders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArService } from '@/services/ar.service';
import type { ArInvoice, ArInvoiceStatus, ArReceipt } from '@/types';
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  Eye,
  FileCheck2,
  Info,
  Receipt,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArInvoiceDetailModal } from './components/ArInvoiceDetailModal';
import { CreateArReceiptModal } from './components/CreateArReceiptModal';
import { CreateCharterPelunasanModal } from './components/CreateCharterPelunasanModal';
import { CreateDownPaymentModal } from './components/CreateDownPaymentModal';
import { CreateGeneralArInvoiceModal } from './components/CreateGeneralArInvoiceModal';

export default function ArInvoicesPage() {
  const [activeTab, setActiveTab] = useState<'invoices' | 'receipts'>('invoices');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);

  // Pagination states for Tab 1 (Invoices)
  const [invoicePage, setInvoicePage] = useState(1);
  const [invoiceLimit, setInvoiceLimit] = useState(10);
  const [totalInvoicesCount, setTotalInvoicesCount] = useState(0);

  // Pagination states for Tab 2 (Receipts)
  const [receiptPage, setReceiptPage] = useState(1);
  const [receiptLimit, setReceiptLimit] = useState(10);
  const [totalReceiptsCount, setTotalReceiptsCount] = useState(0);

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

  // Unified Confirm Dialog State (Zero Native Alerts)
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    variant: 'danger' | 'warning' | 'info' | 'primary';
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => Promise<void>;
  }>({
    open: false,
    title: '',
    description: '',
    variant: 'primary',
    onConfirm: async () => { },
  });

  // Debounced live search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setInvoicePage(1);
      setReceiptPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [resInvoices, resReceipts] = await Promise.all([
        ArService.getInvoices({
          search: debouncedSearch || undefined,
          status: statusFilter !== 'ALL' ? (statusFilter as ArInvoiceStatus) : undefined,
          page: invoicePage,
          limit: invoiceLimit,
        }),
        ArService.getReceipts({
          page: receiptPage,
          limit: receiptLimit,
        }),
      ]);
      setInvoices(resInvoices.data || []);
      setTotalInvoicesCount(resInvoices.total || 0);

      setReceipts(resReceipts.data || []);
      setTotalReceiptsCount(resReceipts.total || 0);
    } catch (err: any) {
      toast.error('Gagal memuat data piutang AR: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, invoicePage, invoiceLimit, receiptPage, receiptLimit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Approve with ConfirmDialog
  const handleApprove = (id: string, invoiceNo?: string, customerName?: string, amount?: number) => {
    const targetInvoice = invoices.find((inv) => inv.id === id);
    const invoiceNum = invoiceNo || targetInvoice?.invoiceNo || 'Invoice AR';
    const client = customerName || targetInvoice?.customerName || 'Pelanggan';
    const formattedAmount = amount || targetInvoice?.totalAmount || 0;

    setConfirmDialog({
      open: true,
      title: 'Setujui Invoice Piutang AR',
      description: `Apakah Anda yakin ingin menyetujui invoice piutang '${invoiceNum}' untuk '${client}' sebesar ${formatRupiah(formattedAmount)}?\nStatus invoice akan berganti menjadi APPROVED (Siap Ditagihkan & Dilunasi).`,
      variant: 'primary',
      confirmText: 'Setujui Invoice',
      onConfirm: async () => {
        setIsConfirmLoading(true);
        try {
          await ArService.approveInvoice(id);
          toast.success('Invoice AR berhasil disetujui.');
          setConfirmDialog((prev) => ({ ...prev, open: false }));
          fetchData();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Gagal menyetujui invoice AR');
        } finally {
          setIsConfirmLoading(false);
        }
      },
    });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setStatusFilter('ALL');
    setInvoicePage(1);
    setReceiptPage(1);
  };

  const hasActiveFilters = useMemo(() => {
    return debouncedSearch !== '' || statusFilter !== 'ALL';
  }, [debouncedSearch, statusFilter]);

  // Metrik Ringkasan Header
  const totalOutstanding = invoices
    .filter((inv) => inv.status === 'APPROVED' || inv.status === 'PARTIALLY_PAID')
    .reduce((acc, curr) => acc + (curr.totalAmount - curr.paidAmount), 0);

  const totalDpReceived = receipts
    .filter((r) => r.isDownPayment && r.status === 'CONFIRMED')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const totalCollectedMonth = receipts
    .filter((r) => !r.isDownPayment && r.status === 'CONFIRMED')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  function formatRupiah(val: number | string | undefined) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(val || 0));
  }

  const getStatusBadge = (status: ArInvoiceStatus) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="outline" className="bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 font-bold text-[10px]">DRAFT</Badge>;
      case 'APPROVED':
        return <Badge className="bg-blue-600/90 dark:bg-blue-500/90 text-white font-bold text-[10px]">APPROVED</Badge>;
      case 'PARTIALLY_PAID':
        return <Badge className="bg-amber-500/90 dark:bg-amber-500 text-white font-bold text-[10px]">PARTIAL</Badge>;
      case 'PAID':
        return <Badge className="bg-emerald-600/90 dark:bg-emerald-500 text-white font-bold text-[10px]">PAID</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive" className="font-bold text-[10px]">CANCELLED</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Pagination metrics Tab 1
  const totalInvoicePages = Math.ceil(totalInvoicesCount / invoiceLimit) || 1;
  const startInvoiceItem = totalInvoicesCount === 0 ? 0 : (invoicePage - 1) * invoiceLimit + 1;
  const endInvoiceItem = Math.min(invoicePage * invoiceLimit, totalInvoicesCount);

  // Pagination metrics Tab 2
  const totalReceiptPages = Math.ceil(totalReceiptsCount / receiptLimit) || 1;
  const startReceiptItem = totalReceiptsCount === 0 ? 0 : (receiptPage - 1) * receiptLimit + 1;
  const endReceiptItem = Math.min(receiptPage * receiptLimit, totalReceiptsCount);

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
            size="sm"
            className="gap-1.5 font-semibold text-xs h-8.5"
          >
            <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            + Buat Invoice AR Umum
          </Button>
          <Button
            onClick={() => setIsDpModalOpen(true)}
            size="sm"
            className="gap-1.5 font-semibold text-xs h-8.5 shadow-2xs"
          >
            <DollarSign className="h-4 w-4" />
            + Terima DP Sewa Wisata (30%)
          </Button>
          <Button
            onClick={() => setIsCharterModalOpen(true)}
            variant="outline"
            size="sm"
            className="gap-1.5 font-semibold text-xs h-8.5"
          >
            <FileCheck2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            + Invoice Pelunasan Wisata (70%)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="text-xs h-8.5 gap-1.5"
            title="Muat ulang seluruh data"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* METRIC CARDS HEADER */}
      {loading && invoices.length === 0 && receipts.length === 0 ? (
        <MetricCardGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-rose-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Total Piutang Belum Tertagih</CardDescription>
              <CardTitle className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 flex items-center justify-between">
                <span>{formatRupiah(totalOutstanding)}</span>
                <Receipt className="h-5 w-5 opacity-40 text-rose-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Piutang sewa pariwisata &amp; kontrak aktif
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-indigo-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Titipan DP Sewa Wisata (24101)</CardDescription>
              <CardTitle className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
                <span>{formatRupiah(totalDpReceived)}</span>
                <DollarSign className="h-5 w-5 opacity-40 text-indigo-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Liabilitas uang muka kontrak berjalan (30%)
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-emerald-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Piutang Tertagih (Pelunasan)</CardDescription>
              <CardTitle className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                <span>{formatRupiah(totalCollectedMonth)}</span>
                <CreditCard className="h-5 w-5 opacity-40 text-emerald-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Penerimaan mutasi bank &amp; kas tunai
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-blue-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Total Faktur Terbit</CardDescription>
              <CardTitle className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 flex items-center justify-between">
                <span>{totalInvoicesCount} Faktur</span>
                <FileCheck2 className="h-5 w-5 opacity-40 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                {invoices.filter((i) => i.status === 'PAID').length} Lunas •{' '}
                {invoices.filter((i) => i.status === 'APPROVED').length} Siap Tagih
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Banner SOP Piutang Usaha & DP Sewa Wisata (Blueprint Bab 8.3 &amp; Skenario 2)*/}
      <div className="p-4 rounded-xl border border-indigo-200/70 bg-indigo-50/50 dark:border-indigo-900/40 dark:bg-indigo-950/20 text-xs text-indigo-950 dark:text-indigo-200 flex items-start gap-3 shadow-2xs">
        <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <p className="font-bold text-sm">
            Tata Kelola Piutang Usaha &amp; DP Sewa Wisata
          </p>
          <p className="leading-relaxed">
            Pembayaran Uang Muka (DP 30%) oleh pelanggan charter dibukukan sebagai titipan kewajiban/liabilitas di akun <strong>24101 Pendapatan Diterima di Muka</strong>. Saat perjalanan bus wisata selesai (status `COMPLETED`), dispatcher/keuangan menerbitkan invoice pelunasan sisa 70% ke akun <strong>12101 Piutang Usaha</strong>. Pelunasan disetor via transfer Bank BCA atau kasir pool.
          </p>
        </div>
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
              <Badge className="bg-primary/20 text-primary-foreground border-none text-[10px] ml-1">
                {totalInvoicesCount}
              </Badge>
            </Button>
            <Button
              variant={activeTab === 'receipts' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('receipts')}
              className="gap-2 text-xs font-semibold"
            >
              <CreditCard className="h-4 w-4" />
              Riwayat Penerimaan Pembayaran (Receipts)
              <Badge className="bg-primary/20 text-primary-foreground border-none text-[10px] ml-1">
                {totalReceiptsCount}
              </Badge>
            </Button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari no. invoice / nama pelanggan..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 pr-8 h-8.5 text-xs uppercase"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  title="Hapus pencarian"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {activeTab === 'invoices' && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Status:</span>
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setInvoicePage(1);
                }}
              >
                <SelectTrigger className="w-48 h-8 text-xs">
                  <SelectValue placeholder="Status Invoice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">Semua Status</SelectItem>
                  <SelectItem value="DRAFT" className="text-xs">DRAFT</SelectItem>
                  <SelectItem value="APPROVED" className="text-xs">APPROVED (Menunggu Pelunasan)</SelectItem>
                  <SelectItem value="PARTIALLY_PAID" className="text-xs">PARTIALLY PAID</SelectItem>
                  <SelectItem value="PAID" className="text-xs">PAID (Lunas)</SelectItem>
                  <SelectItem value="CANCELLED" className="text-xs">CANCELLED</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-muted-foreground">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                >
                  <RotateCcw className="h-3 w-3" /> Reset Filter
                </Button>
              )}
              <span>
                Menampilkan <strong className="text-foreground">{startInvoiceItem} - {endInvoiceItem}</strong> dari {totalInvoicesCount} faktur
              </span>
            </div>
          </div>
        )}

        {/* TAB 1: DAFTAR INVOICE AR */}
        {activeTab === 'invoices' && (
          <div className="border border-slate-200/80 dark:border-white/10 rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/80 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10">
                <TableRow className="text-xs">
                  <TableHead className="w-36 font-bold">No. Invoice</TableHead>
                  <TableHead className="font-bold">Pelanggan &amp; SPJ</TableHead>
                  <TableHead className="w-28 font-bold">Tgl. Invoice</TableHead>
                  <TableHead className="w-28 font-bold">Jatuh Tempo</TableHead>
                  <TableHead className="text-right w-36 font-bold">Total Piutang</TableHead>
                  <TableHead className="text-right w-36 font-bold">Diterima</TableHead>
                  <TableHead className="text-center w-28 font-bold">Status</TableHead>
                  <TableHead className="text-center w-36 font-bold">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs divide-y divide-slate-100 dark:divide-white/5">
                {loading ? (
                  <TableSkeletonRows
                    rows={invoiceLimit}
                    colWidths={[
                      'w-28',
                      'w-32',
                      'w-24',
                      'w-24',
                      'w-24 ml-auto',
                      'w-24 ml-auto',
                      'w-20 mx-auto',
                      'w-28 mx-auto',
                    ]}
                  />
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="p-3 rounded-full bg-primary/10 text-primary">
                          <Receipt className="h-8 w-8 opacity-60" />
                        </div>
                        <h4 className="text-sm font-semibold text-foreground">
                          Belum ada invoice piutang yang terdaftar
                        </h4>
                        <p className="text-xs text-muted-foreground max-w-sm">
                          {hasActiveFilters
                            ? 'Tidak ada invoice yang cocok dengan kriteria filter Anda.'
                            : 'Faktur pelunasan sewa wisata dan tagihan sewa bus akan tersaji di sini.'}
                        </p>
                        {hasActiveFilters && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleResetFilters}
                            className="text-xs gap-1.5 h-8 mt-1"
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Reset Filter
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv) => (
                    <TableRow key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                      <TableCell>
                        <div className="font-mono font-bold text-foreground">{inv.invoiceNo}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{inv.sourceType}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-foreground">{inv.customerName}</div>
                        {inv.trip && (
                          <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono font-medium">
                            SPJ: {inv.trip.spjNo}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {new Date(inv.invoiceDate).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {new Date(inv.dueDate).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-foreground">
                        {formatRupiah(inv.totalAmount)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-emerald-600 dark:text-emerald-400">
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
                              onClick={() => handleApprove(inv.id, inv.invoiceNo, inv.customerName, inv.totalAmount)}
                              className="h-7 px-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold"
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
                              className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1"
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

            {/* Paginasi Tab 1 */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 border-t border-slate-200/80 dark:border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Baris per halaman:</span>
                <Select
                  value={String(invoiceLimit)}
                  onValueChange={(val) => {
                    setInvoiceLimit(Number(val));
                    setInvoicePage(1);
                  }}
                >
                  <SelectTrigger className="w-18 h-7.5 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10" className="text-xs">10</SelectItem>
                    <SelectItem value="20" className="text-xs">20</SelectItem>
                    <SelectItem value="50" className="text-xs">50</SelectItem>
                    <SelectItem value="100" className="text-xs">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  Halaman {invoicePage} dari {totalInvoicePages}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={invoicePage <= 1 || loading}
                    onClick={() => setInvoicePage((p) => Math.max(1, p - 1))}
                    className="h-7.5 w-7.5"
                    title="Halaman Sebelumnya"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={invoicePage >= totalInvoicePages || loading}
                    onClick={() => setInvoicePage((p) => Math.min(totalInvoicePages, p + 1))}
                    className="h-7.5 w-7.5"
                    title="Halaman Berikutnya"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RIWAYAT PENERIMAAN PEMBAYARAN */}
        {activeTab === 'receipts' && (
          <div className="border border-slate-200/80 dark:border-white/10 rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/80 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10">
                <TableRow className="text-xs">
                  <TableHead className="w-36 font-bold">No. Bukti Penerimaan</TableHead>
                  <TableHead className="font-bold">Pelanggan</TableHead>
                  <TableHead className="w-28 font-bold">Tanggal</TableHead>
                  <TableHead className="w-40 font-bold">Jenis Penerimaan</TableHead>
                  <TableHead className="w-28 font-bold">Metode</TableHead>
                  <TableHead className="font-bold">Rekening Bank / Kas</TableHead>
                  <TableHead className="w-36 font-bold">No. Bukti / Ref</TableHead>
                  <TableHead className="text-right w-36 font-bold">Total Diterima</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs divide-y divide-slate-100 dark:divide-white/5">
                {loading ? (
                  <TableSkeletonRows
                    rows={receiptLimit}
                    colWidths={[
                      'w-32',
                      'w-32',
                      'w-24',
                      'w-24',
                      'w-20',
                      'w-28',
                      'w-24',
                      'w-28 ml-auto',
                    ]}
                  />
                ) : receipts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="p-3 rounded-full bg-primary/10 text-primary">
                          <CreditCard className="h-8 w-8 opacity-60" />
                        </div>
                        <h4 className="text-sm font-semibold text-foreground">
                          Belum ada penerimaan pembayaran AR yang tercatat
                        </h4>
                        <p className="text-xs text-muted-foreground max-w-sm">
                          Riwayat setoran DP 30% atau pelunasan 70% kontrak sewa wisata akan tersaji di sini.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  receipts.map((r) => (
                    <TableRow key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                      <TableCell className="font-mono font-bold text-foreground">
                        {r.receiptNo}
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        {r.customerName}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {new Date(r.receiptDate).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>
                        {r.isDownPayment ? (
                          <Badge className="bg-indigo-600/90 dark:bg-indigo-500/90 text-white text-[10px] font-bold">
                            DP Sewa 30% (24101)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 text-[10px] font-bold">
                            Pelunasan Piutang (12101)
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            r.paymentMethod === 'BANK_TRANSFER'
                              ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 text-[10px] font-bold'
                              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 text-[10px] font-bold'
                          }
                        >
                          {r.paymentMethod === 'BANK_TRANSFER' ? 'Transfer Bank' : 'Kas Tunai'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-foreground">
                        {r.bankAccount
                          ? `${r.bankAccount.bankName} (${r.bankAccount.accountNumberMasked})`
                          : r.cashAccount
                            ? r.cashAccount.name
                            : '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono">
                        {r.reference || '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(r.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Paginasi Tab 2 */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 border-t border-slate-200/80 dark:border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Baris per halaman:</span>
                <Select
                  value={String(receiptLimit)}
                  onValueChange={(val) => {
                    setReceiptLimit(Number(val));
                    setReceiptPage(1);
                  }}
                >
                  <SelectTrigger className="w-18 h-7.5 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10" className="text-xs">10</SelectItem>
                    <SelectItem value="20" className="text-xs">20</SelectItem>
                    <SelectItem value="50" className="text-xs">50</SelectItem>
                    <SelectItem value="100" className="text-xs">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground ml-2">
                  Menampilkan <strong className="text-foreground">{startReceiptItem} - {endReceiptItem}</strong> dari {totalReceiptsCount} bukti penerimaan
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  Halaman {receiptPage} dari {totalReceiptPages}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={receiptPage <= 1 || loading}
                    onClick={() => setReceiptPage((p) => Math.max(1, p - 1))}
                    className="h-7.5 w-7.5"
                    title="Halaman Sebelumnya"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={receiptPage >= totalReceiptPages || loading}
                    onClick={() => setReceiptPage((p) => Math.min(totalReceiptPages, p + 1))}
                    className="h-7.5 w-7.5"
                    title="Halaman Berikutnya"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
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
        onApprove={(id) => {
          setIsDetailModalOpen(false);
          handleApprove(id);
        }}
      />

      {/* REUSABLE CONFIRM DIALOG */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant={confirmDialog.variant}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        onConfirm={confirmDialog.onConfirm}
        isLoading={isConfirmLoading}
      />
    </div>
  );
}
