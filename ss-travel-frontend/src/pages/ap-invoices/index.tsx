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
import { ApService } from '@/services/ap.service';
import type { ApInvoice, ApInvoiceStatus, ApPayment, ApVendorType } from '@/types';
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Eye,
  Info,
  Receipt,
  RotateCcw,
  Search,
  Utensils,
  Wrench,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ApInvoiceDetailModal } from './components/ApInvoiceDetailModal';
import { CreateGeneralApBillModal } from './components/CreateGeneralApBillModal';
import { CreateRestaurantBillModal } from './components/CreateRestaurantBillModal';
import { PayApInvoiceModal } from './components/PayApInvoiceModal';

export default function ApInvoicesPage() {
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments'>('invoices');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [vendorTypeFilter, setVendorTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);

  // Pagination states for Tab 1 (Invoices)
  const [invoicePage, setInvoicePage] = useState(1);
  const [invoiceLimit, setInvoiceLimit] = useState(10);
  const [totalInvoicesCount, setTotalInvoicesCount] = useState(0);

  // Pagination states for Tab 2 (Payments)
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentLimit, setPaymentLimit] = useState(10);
  const [totalPaymentsCount, setTotalPaymentsCount] = useState(0);

  // Data states
  const [invoices, setInvoices] = useState<ApInvoice[]>([]);
  const [payments, setPayments] = useState<ApPayment[]>([]);

  // Modals state
  const [isRestaurantModalOpen, setIsRestaurantModalOpen] = useState(false);
  const [isGeneralModalOpen, setIsGeneralModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<ApInvoice | null>(null);

  // Unified Confirm Dialog State (Zero Native Alerts)
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    variant: 'danger' | 'warning' | 'info' | 'primary';
    confirmText?: string;
    cancelText?: string;
    promptInput?: {
      label: string;
      placeholder?: string;
      required?: boolean;
      defaultValue?: string;
    };
    onConfirm: (inputValue?: string) => Promise<void>;
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
      setPaymentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [resInvoices, resPayments] = await Promise.all([
        ApService.getInvoices({
          search: debouncedSearch || undefined,
          vendorType: vendorTypeFilter !== 'ALL' ? (vendorTypeFilter as ApVendorType) : undefined,
          status: statusFilter !== 'ALL' ? (statusFilter as ApInvoiceStatus) : undefined,
          page: invoicePage,
          limit: invoiceLimit,
        }),
        ApService.getPayments({
          page: paymentPage,
          limit: paymentLimit,
        }),
      ]);
      setInvoices(resInvoices.data || []);
      setTotalInvoicesCount(resInvoices.total || 0);

      setPayments(resPayments.data || []);
      setTotalPaymentsCount(resPayments.total || 0);
    } catch (err: any) {
      toast.error('Gagal memuat data tagihan AP: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, vendorTypeFilter, statusFilter, invoicePage, invoiceLimit, paymentPage, paymentLimit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Approve with ConfirmDialog
  const handleApprove = (id: string, billNo?: string, vendorName?: string, amount?: number) => {
    const targetInvoice = invoices.find((inv) => inv.id === id);
    const invoiceNum = billNo || targetInvoice?.billNo || 'Tagihan AP';
    const vendor = vendorName || targetInvoice?.vendorName || 'Vendor';
    const formattedAmount = amount || targetInvoice?.totalAmount || 0;

    setConfirmDialog({
      open: true,
      title: 'Setujui Faktur Tagihan AP',
      description: `Apakah Anda yakin ingin menyetujui faktur tagihan '${invoiceNum}' untuk vendor '${vendor}' sebesar ${formatRupiah(formattedAmount)}?\nJurnal utang usaha akan otomatis diterbitkan dan diposting ke Buku Besar.`,
      variant: 'primary',
      confirmText: 'Setujui & Posting Utang',
      onConfirm: async () => {
        setIsConfirmLoading(true);
        try {
          await ApService.approveInvoice(id);
          toast.success('Tagihan AP berhasil disetujui dan jurnal utang telah diposting.');
          setConfirmDialog((prev) => ({ ...prev, open: false }));
          fetchData();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Gagal menyetujui tagihan AP');
        } finally {
          setIsConfirmLoading(false);
        }
      },
    });
  };

  // Handle Cancel with ConfirmDialog + Prompt Input (Replaced window.prompt)
  const handleCancel = (id: string, billNo?: string) => {
    const targetInvoice = invoices.find((inv) => inv.id === id);
    const invoiceNum = billNo || targetInvoice?.billNo || 'Tagihan AP';

    setConfirmDialog({
      open: true,
      title: 'Batalkan Faktur Tagihan AP',
      description: `Masukkan alasan pembatalan untuk faktur tagihan '${invoiceNum}'. Jika faktur ini sebelumnya telah disetujui, jurnal pembalik (reversal) otomatis diterbitkan di GL.`,
      variant: 'danger',
      confirmText: 'Konfirmasi Batalkan',
      cancelText: 'Kembali',
      promptInput: {
        label: 'Alasan Pembatalan',
        placeholder: 'Contoh: Koreksi nomor fisik faktur / Salah penentuan kupon servis makan',
        required: true,
      },
      onConfirm: async (reason?: string) => {
        if (!reason?.trim()) {
          toast.error('Alasan pembatalan wajib diisi');
          return;
        }
        setIsConfirmLoading(true);
        try {
          await ApService.cancelInvoice(id, reason.trim());
          toast.success('Tagihan AP berhasil dibatalkan.');
          setConfirmDialog((prev) => ({ ...prev, open: false }));
          fetchData();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Gagal membatalkan tagihan AP');
        } finally {
          setIsConfirmLoading(false);
        }
      },
    });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setVendorTypeFilter('ALL');
    setStatusFilter('ALL');
    setInvoicePage(1);
    setPaymentPage(1);
  };

  const hasActiveFilters = useMemo(() => {
    return (
      debouncedSearch !== '' ||
      vendorTypeFilter !== 'ALL' ||
      statusFilter !== 'ALL'
    );
  }, [debouncedSearch, vendorTypeFilter, statusFilter]);

  // Metrik Ringkasan Header
  const totalUnpaid = invoices
    .filter((inv) => inv.status === 'APPROVED' || inv.status === 'PARTIALLY_PAID')
    .reduce((acc, curr) => acc + (curr.totalAmount - curr.paidAmount), 0);

  const totalMealUnpaid = invoices
    .filter(
      (inv) =>
        inv.vendorType === 'RESTAURANT' &&
        (inv.status === 'APPROVED' || inv.status === 'PARTIALLY_PAID'),
    )
    .reduce((acc, curr) => acc + (curr.totalAmount - curr.paidAmount), 0);

  const totalWorkshopUnpaid = invoices
    .filter(
      (inv) =>
        inv.vendorType === 'WORKSHOP' &&
        (inv.status === 'APPROVED' || inv.status === 'PARTIALLY_PAID'),
    )
    .reduce((acc, curr) => acc + (curr.totalAmount - curr.paidAmount), 0);

  const totalPaidMonth = payments.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  function formatRupiah(val: number | string | undefined) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(val || 0));
  }

  const getStatusBadge = (status: ApInvoiceStatus) => {
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
  const totalPaymentPages = Math.ceil(totalPaymentsCount / paymentLimit) || 1;
  const startPaymentItem = totalPaymentsCount === 0 ? 0 : (paymentPage - 1) * paymentLimit + 1;
  const endPaymentItem = Math.min(paymentPage * paymentLimit, totalPaymentsCount);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Heading
          title="Modul Utang Usaha & Tagihan Vendor (AP)"
          description="Manajemen faktur tagihan servis makan RM mitra (Skenario 1), vendor bengkel/derek (Skenario 3), dan pelunasan kas/bank."
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setIsRestaurantModalOpen(true)}
            size="sm"
            className="gap-1.5 font-semibold text-xs h-8.5 shadow-2xs"
          >
            <Utensils className="h-4 w-4" />
            + Tagihan Servis Makan RM
          </Button>
          <Button
            onClick={() => setIsGeneralModalOpen(true)}
            variant="outline"
            size="sm"
            className="gap-1.5 font-semibold text-xs h-8.5"
          >
            <Wrench className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            + Tagihan Vendor Bengkel
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
      {loading && invoices.length === 0 && payments.length === 0 ? (
        <MetricCardGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-rose-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Total Tagihan Belum Dibayar</CardDescription>
              <CardTitle className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 flex items-center justify-between">
                <span>{formatRupiah(totalUnpaid)}</span>
                <Receipt className="h-5 w-5 opacity-40 text-rose-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Utang vendor berstatus disetujui (siap bayar)
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-amber-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Utang Servis Makan RM (21101)</CardDescription>
              <CardTitle className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 flex items-center justify-between">
                <span>{formatRupiah(totalMealUnpaid)}</span>
                <Utensils className="h-5 w-5 opacity-40 text-amber-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Tagihan berkala RM Taman Selera, Kendil Mas, dll
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-indigo-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Utang Bengkel &amp; Sparepart (21102)</CardDescription>
              <CardTitle className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
                <span>{formatRupiah(totalWorkshopUnpaid)}</span>
                <Wrench className="h-5 w-5 opacity-40 text-indigo-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Perbaikan radiator tol, derek, dan onderdil
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-emerald-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Total Terbayar Bulan Ini</CardDescription>
              <CardTitle className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                <span>{formatRupiah(totalPaidMonth)}</span>
                <CreditCard className="h-5 w-5 opacity-40 text-emerald-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Realisasi transfer bank &amp; kas pool
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Banner SOP Utang Usaha Vendor (Blueprint Bab 8.3 &amp; Skenario 1) */}
      <div className="p-4 rounded-xl border border-indigo-200/70 bg-indigo-50/50 dark:border-indigo-900/40 dark:bg-indigo-950/20 text-xs text-indigo-950 dark:text-indigo-200 flex items-start gap-3 shadow-2xs">
        <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <p className="font-bold text-sm">
            Tata Kelola Faktur Tagihan Vendor AP
          </p>
          <p className="leading-relaxed">
            Faktur servis makan RM diterbitkan secara berkala melalui penarikan SPJ yang belum ditagihkan dengan proteksi mutlak <strong>Anti-Double Billing</strong>. Tagihan bengkel/derek di jalan (Skenario 3) dialokasikan langsung ke aset bus terkait (`vehicleId`). Seluruh faktur berstatus DRAFT harus disetujui (APPROVED) sebelum dapat dibayarkan melalui meja kasir atau transfer bank korporat.
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
              Daftar Tagihan Vendor (Invoices)
              <Badge className="bg-primary/20 text-primary-foreground border-none text-[10px] ml-1">
                {totalInvoicesCount}
              </Badge>
            </Button>
            <Button
              variant={activeTab === 'payments' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('payments')}
              className="gap-2 text-xs font-semibold"
            >
              <CreditCard className="h-4 w-4" />
              Riwayat Pembayaran (Payments)
              <Badge className="bg-primary/20 text-primary-foreground border-none text-[10px] ml-1">
                {totalPaymentsCount}
              </Badge>
            </Button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari no. faktur / nama vendor..."
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
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Tipe:</span>
                <Select
                  value={vendorTypeFilter}
                  onValueChange={(val) => {
                    setVendorTypeFilter(val);
                    setInvoicePage(1);
                  }}
                >
                  <SelectTrigger className="w-48 h-8 text-xs">
                    <SelectValue placeholder="Tipe Vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="text-xs">Semua Tipe Vendor</SelectItem>
                    <SelectItem value="RESTAURANT" className="text-xs">Restoran Mitra (Servis Makan)</SelectItem>
                    <SelectItem value="WORKSHOP" className="text-xs">Bengkel &amp; Suku Cadang</SelectItem>
                    <SelectItem value="AGENT" className="text-xs">Agen Penjualan Tiket</SelectItem>
                    <SelectItem value="OTHER" className="text-xs">Lainnya / Umum</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Status:</span>
                <Select
                  value={statusFilter}
                  onValueChange={(val) => {
                    setStatusFilter(val);
                    setInvoicePage(1);
                  }}
                >
                  <SelectTrigger className="w-44 h-8 text-xs">
                    <SelectValue placeholder="Status Tagihan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="text-xs">Semua Status</SelectItem>
                    <SelectItem value="DRAFT" className="text-xs">DRAFT</SelectItem>
                    <SelectItem value="APPROVED" className="text-xs">APPROVED (Siap Bayar)</SelectItem>
                    <SelectItem value="PARTIALLY_PAID" className="text-xs">PARTIALLY PAID</SelectItem>
                    <SelectItem value="PAID" className="text-xs">PAID (Lunas)</SelectItem>
                    <SelectItem value="CANCELLED" className="text-xs">CANCELLED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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

        {/* TAB 1: DAFTAR TAGIHAN AP */}
        {activeTab === 'invoices' && (
          <div className="border border-slate-200/80 dark:border-white/10 rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/80 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10">
                <TableRow className="text-xs">
                  <TableHead className="w-36 font-bold">No. Tagihan</TableHead>
                  <TableHead className="font-bold">Vendor &amp; Tipe</TableHead>
                  <TableHead className="w-28 font-bold">Tgl. Faktur</TableHead>
                  <TableHead className="w-28 font-bold">Jatuh Tempo</TableHead>
                  <TableHead className="text-right w-36 font-bold">Total Tagihan</TableHead>
                  <TableHead className="text-right w-36 font-bold">Terbayar</TableHead>
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
                          Belum ada faktur tagihan vendor yang terdaftar
                        </h4>
                        <p className="text-xs text-muted-foreground max-w-sm">
                          {hasActiveFilters
                            ? 'Tidak ada tagihan yang cocok dengan kriteria filter Anda.'
                            : 'Faktur servis makan RM, perbaikan bengkel, dan pengadaan pool akan tersaji di sini.'}
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
                        <div className="font-mono font-bold text-foreground">{inv.billNo}</div>
                        {inv.vendorInvoiceNo && (
                          <div className="text-[10px] text-muted-foreground font-mono">
                            Ref: {inv.vendorInvoiceNo}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-foreground">{inv.vendorName}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{inv.vendorType}</div>
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
                              onClick={() => handleApprove(inv.id, inv.billNo, inv.vendorName, inv.totalAmount)}
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
                                setIsPayModalOpen(true);
                              }}
                              className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1"
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                              Bayar
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

        {/* TAB 2: RIWAYAT PEMBAYARAN AP */}
        {activeTab === 'payments' && (
          <div className="border border-slate-200/80 dark:border-white/10 rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/80 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10">
                <TableRow className="text-xs">
                  <TableHead className="w-36 font-bold">No. Pembayaran</TableHead>
                  <TableHead className="font-bold">Vendor</TableHead>
                  <TableHead className="w-28 font-bold">Tanggal Bayar</TableHead>
                  <TableHead className="w-28 font-bold">Metode</TableHead>
                  <TableHead className="font-bold">Rekening Sumber</TableHead>
                  <TableHead className="w-36 font-bold">No. Bukti / Ref</TableHead>
                  <TableHead className="text-right w-36 font-bold">Total Dibayarkan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs divide-y divide-slate-100 dark:divide-white/5">
                {loading ? (
                  <TableSkeletonRows
                    rows={paymentLimit}
                    colWidths={[
                      'w-28',
                      'w-32',
                      'w-24',
                      'w-20',
                      'w-28',
                      'w-24',
                      'w-28 ml-auto',
                    ]}
                  />
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="p-3 rounded-full bg-primary/10 text-primary">
                          <CreditCard className="h-8 w-8 opacity-60" />
                        </div>
                        <h4 className="text-sm font-semibold text-foreground">
                          Belum ada riwayat pembayaran tagihan AP
                        </h4>
                        <p className="text-xs text-muted-foreground max-w-sm">
                          Riwayat pengeluaran kas atau transfer bank untuk pelunasan tagihan vendor akan tercatat otomatis di sini.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((p) => (
                    <TableRow key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                      <TableCell className="font-mono font-bold text-foreground">
                        {p.paymentNo}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-foreground">{p.vendorName}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{p.vendorType}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {new Date(p.paymentDate).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            p.paymentMethod === 'BANK_TRANSFER'
                              ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 text-[10px] font-bold'
                              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 text-[10px] font-bold'
                          }
                        >
                          {p.paymentMethod === 'BANK_TRANSFER' ? 'Transfer Bank' : 'Kas Tunai'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-foreground">
                        {p.bankAccount
                          ? `${p.bankAccount.bankName} (${p.bankAccount.accountNumberMasked})`
                          : p.cashAccount
                            ? p.cashAccount.name
                            : '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono">
                        {p.reference || '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(p.amount)}
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
                  value={String(paymentLimit)}
                  onValueChange={(val) => {
                    setPaymentLimit(Number(val));
                    setPaymentPage(1);
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
                  Menampilkan <strong className="text-foreground">{startPaymentItem} - {endPaymentItem}</strong> dari {totalPaymentsCount} pembayaran
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  Halaman {paymentPage} dari {totalPaymentPages}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={paymentPage <= 1 || loading}
                    onClick={() => setPaymentPage((p) => Math.max(1, p - 1))}
                    className="h-7.5 w-7.5"
                    title="Halaman Sebelumnya"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={paymentPage >= totalPaymentPages || loading}
                    onClick={() => setPaymentPage((p) => Math.min(totalPaymentPages, p + 1))}
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
      <CreateRestaurantBillModal
        open={isRestaurantModalOpen}
        onOpenChange={setIsRestaurantModalOpen}
        onSuccess={fetchData}
      />

      <CreateGeneralApBillModal
        open={isGeneralModalOpen}
        onOpenChange={setIsGeneralModalOpen}
        onSuccess={fetchData}
      />

      <PayApInvoiceModal
        open={isPayModalOpen}
        onOpenChange={setIsPayModalOpen}
        invoice={selectedInvoice}
        onSuccess={fetchData}
      />

      <ApInvoiceDetailModal
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        invoice={selectedInvoice}
        onApprove={(id) => {
          setIsDetailModalOpen(false);
          handleApprove(id);
        }}
        onCancel={(id) => {
          setIsDetailModalOpen(false);
          handleCancel(id);
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
        promptInput={confirmDialog.promptInput}
        onConfirm={confirmDialog.onConfirm}
        isLoading={isConfirmLoading}
      />
    </div>
  );
}
