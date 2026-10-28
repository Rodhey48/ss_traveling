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
  Utensils,
  Wrench,
  CreditCard,
  Eye,
} from 'lucide-react';
import { ApService } from '@/services/ap.service';
import { CreateRestaurantBillModal } from './components/CreateRestaurantBillModal';
import { CreateGeneralApBillModal } from './components/CreateGeneralApBillModal';
import { PayApInvoiceModal } from './components/PayApInvoiceModal';
import { ApInvoiceDetailModal } from './components/ApInvoiceDetailModal';
import type { ApInvoice, ApPayment, ApVendorType, ApInvoiceStatus } from '@/types';
import { toast } from 'sonner';

export default function ApInvoicesPage() {
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments'>('invoices');
  const [search, setSearch] = useState('');
  const [vendorTypeFilter, setVendorTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);

  // Data states
  const [invoices, setInvoices] = useState<ApInvoice[]>([]);
  const [payments, setPayments] = useState<ApPayment[]>([]);

  // Modals state
  const [isRestaurantModalOpen, setIsRestaurantModalOpen] = useState(false);
  const [isGeneralModalOpen, setIsGeneralModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<ApInvoice | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [resInvoices, resPayments] = await Promise.all([
        ApService.getInvoices({
          search: search || undefined,
          vendorType: vendorTypeFilter !== 'ALL' ? (vendorTypeFilter as ApVendorType) : undefined,
          status: statusFilter !== 'ALL' ? (statusFilter as ApInvoiceStatus) : undefined,
        }),
        ApService.getPayments({}),
      ]);
      setInvoices(resInvoices.data || []);
      setPayments(resPayments.data || []);
    } catch (err: any) {
      toast.error('Gagal memuat data tagihan AP: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [search, vendorTypeFilter, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (id: string) => {
    try {
      await ApService.approveInvoice(id);
      toast.success('Tagihan AP berhasil disetujui dan jurnal utang telah diposting.');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyetujui tagihan AP');
    }
  };

  const handleCancel = async (id: string) => {
    const reason = prompt('Masukkan alasan pembatalan tagihan AP:');
    if (!reason) return;
    try {
      await ApService.cancelInvoice(id, reason);
      toast.success('Tagihan AP berhasil dibatalkan.');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal membatalkan tagihan AP');
    }
  };

  // Metrik Ringkasan
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

  const formatRupiah = (val: number | string | undefined) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(val || 0));
  };

  const getStatusBadge = (status: ApInvoiceStatus) => {
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
          title="Modul Utang Usaha & Tagihan Vendor (AP)"
          description="Manajemen faktur tagihan servis makan RM mitra (Skenario 1), vendor bengkel/derek (Skenario 3), dan pelunasan kas/bank."
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setIsRestaurantModalOpen(true)}
            variant="default"
            className="gap-2 font-medium"
          >
            <Utensils className="h-4 w-4" />
            + Tagihan Servis Makan RM
          </Button>
          <Button
            onClick={() => setIsGeneralModalOpen(true)}
            variant="outline"
            className="gap-2 font-medium"
          >
            <Wrench className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            + Tagihan Vendor Bengkel
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
                Total Tagihan Belum Dibayar
              </p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {formatRupiah(totalUnpaid)}
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Utang vendor berstatus disetujui
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md shadow-xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-100 dark:border-amber-900/40">
              <Utensils className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-amber-700 dark:text-amber-400 tracking-wider">
                Utang Servis Makan RM (21101)
              </p>
              <h3 className="text-2xl font-black text-amber-900 dark:text-amber-300 mt-1">
                {formatRupiah(totalMealUnpaid)}
              </h3>
              <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                Tagihan berkala RM Taman Selera, dll
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md shadow-xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
              <Wrench className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-indigo-700 dark:text-indigo-400 tracking-wider">
                Utang Bengkel & Suku Cadang (21102)
              </p>
              <h3 className="text-2xl font-black text-indigo-900 dark:text-indigo-300 mt-1">
                {formatRupiah(totalWorkshopUnpaid)}
              </h3>
              <p className="text-[11px] text-indigo-600/80 dark:text-indigo-400/80 mt-0.5">
                Perbaikan radiator, derek tol, sparepart
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
                Total Terbayar Bulan Ini
              </p>
              <h3 className="text-2xl font-black text-emerald-900 dark:text-emerald-300 mt-1">
                {formatRupiah(totalPaidMonth)}
              </h3>
              <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                Realisasi transfer bank & kas pool
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
              Daftar Tagihan Vendor (Invoices)
            </Button>
            <Button
              variant={activeTab === 'payments' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('payments')}
              className="gap-2 text-xs font-semibold"
            >
              <CreditCard className="h-4 w-4" />
              Riwayat Pembayaran (Payments)
            </Button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <Input
                placeholder="Cari no. faktur / vendor..."
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
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tipe:</span>
              <select
                className="h-8 px-2.5 rounded-lg border border-slate-200/80 dark:border-white/10 text-xs bg-slate-50 dark:bg-white/5 font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
                value={vendorTypeFilter}
                onChange={(e) => setVendorTypeFilter(e.target.value)}
              >
                <option value="ALL">Semua Tipe Vendor</option>
                <option value="RESTAURANT">Restoran Mitra (Servis Makan)</option>
                <option value="WORKSHOP">Bengkel & Suku Cadang</option>
                <option value="AGENT">Agen Penjualan Tiket</option>
                <option value="OTHER">Lainnya</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Status:</span>
              <select
                className="h-8 px-2.5 rounded-lg border border-slate-200/80 dark:border-white/10 text-xs bg-slate-50 dark:bg-white/5 font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">Semua Status</option>
                <option value="DRAFT">DRAFT</option>
                <option value="APPROVED">APPROVED (Siap Bayar)</option>
                <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
                <option value="PAID">PAID (Lunas)</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>
        )}

        {/* TAB 1: DAFTAR TAGIHAN AP */}
        {activeTab === 'invoices' && (
          <div className="border border-slate-200/80 dark:border-white/10 rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/80 dark:bg-white/5">
                <TableRow className="border-b border-slate-200/80 dark:border-white/10">
                  <TableHead>No. Tagihan</TableHead>
                  <TableHead>Vendor & Tipe</TableHead>
                  <TableHead>Tgl. Faktur</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead className="text-right">Total Tagihan</TableHead>
                  <TableHead className="text-right">Terbayar</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                      Memuat data tagihan AP...
                    </TableCell>
                  </TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                      Belum ada tagihan vendor yang terdaftar.
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv) => (
                    <TableRow key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                      <TableCell>
                        <div className="font-bold text-slate-800 dark:text-slate-100 text-xs">{inv.billNo}</div>
                        {inv.vendorInvoiceNo && (
                          <div className="text-[11px] text-slate-400 dark:text-slate-500">
                            Ref: {inv.vendorInvoiceNo}
                          </div>
                        )}
                      </TableCell>
                        <TableCell>
                          <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{inv.vendorName}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">{inv.vendorType}</div>
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
                                  setIsPayModalOpen(true);
                                }}
                                className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
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
          </div>
        )}

        {/* TAB 2: RIWAYAT PEMBAYARAN AP */}
        {activeTab === 'payments' && (
          <div className="border border-slate-200/80 dark:border-white/10 rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/80 dark:bg-white/5">
                <TableRow className="border-b border-slate-200/80 dark:border-white/10">
                  <TableHead>No. Pembayaran</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Tanggal Bayar</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead>Rekening Sumber</TableHead>
                  <TableHead>No. Bukti / Ref</TableHead>
                  <TableHead className="text-right">Total Dibayarkan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                      Memuat riwayat pembayaran...
                    </TableCell>
                  </TableRow>
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                      Belum ada riwayat pembayaran AP yang tercatat.
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((p) => (
                    <TableRow key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                      <TableCell className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                        {p.paymentNo}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{p.vendorName}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{p.vendorType}</div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                        {new Date(p.paymentDate).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            p.paymentMethod === 'BANK_TRANSFER'
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                          }
                        >
                          {p.paymentMethod === 'BANK_TRANSFER' ? 'Transfer Bank' : 'Kas Tunai'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-700 dark:text-slate-300">
                        {p.bankAccount
                          ? `${p.bankAccount.bankName} (${p.bankAccount.accountNumberMasked})`
                          : p.cashAccount
                          ? p.cashAccount.name
                          : '-'}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {p.reference || '-'}
                      </TableCell>
                      <TableCell className="text-right font-extrabold text-emerald-800 dark:text-emerald-400 text-xs">
                        {formatRupiah(p.amount)}
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
        onApprove={handleApprove}
        onCancel={handleCancel}
      />
    </div>
  );
}
