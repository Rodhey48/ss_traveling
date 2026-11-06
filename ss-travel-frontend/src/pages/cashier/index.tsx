import ConfirmDialog from '@/components/shared/confirm-dialog';
import Heading from '@/components/shared/heading';
import {
  CashierPendingTableSkeletonRows,
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
import { CashierService } from '@/services/cashier.service';
import type {
  CrewCashDiscrepancy,
  CrewCashSettlement,
  SettlementSummary,
} from '@/types';
import {
  AlertTriangle,
  ArrowRight,
  Bus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Coins,
  Info,
  Lock,
  Printer,
  Receipt,
  RotateCcw,
  Scale,
  Search,
  ShieldAlert,
  Wallet,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CashierSettlementModal } from './components/CashierSettlementModal';
import { CashReceiptVoucherModal } from './components/CashReceiptVoucherModal';
import { CreateDiscrepancyModal } from './components/CreateDiscrepancyModal';
import { DiscrepancyResolutionModal } from './components/DiscrepancyResolutionModal';

export default function CashierPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'settled' | 'discrepancies'>('pending');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Data states
  const [pendingSpjs, setPendingSpjs] = useState<any[]>([]);
  const [totalPendingCount, setTotalPendingCount] = useState(0);

  const [settlements, setSettlements] = useState<CrewCashSettlement[]>([]);
  const [totalSettlementsCount, setTotalSettlementsCount] = useState(0);

  const [discrepancies, setDiscrepancies] = useState<CrewCashDiscrepancy[]>([]);
  const [totalDiscrepanciesCount, setTotalDiscrepanciesCount] = useState(0);

  // Modals state
  const [selectedSpjId, setSelectedSpjId] = useState<string | null>(null);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);

  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<CrewCashDiscrepancy | null>(null);
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);

  const [selectedVoucherSettlement, setSelectedVoucherSettlement] = useState<CrewCashSettlement | null>(null);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

  const [discrepancySummary, setDiscrepancySummary] = useState<SettlementSummary | null>(null);
  const [isCreateDiscrepancyModalOpen, setIsCreateDiscrepancyModalOpen] = useState(false);

  // Confirm Dialog State (Zero Native Alert)
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    variant: 'danger' | 'warning' | 'info' | 'primary';
    confirmText?: string;
    onConfirm: () => void | Promise<void>;
  }>({
    open: false,
    title: '',
    description: '',
    variant: 'primary',
    onConfirm: () => { },
  });

  // Debounced search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [resPending, resSettlements, resDiscrepancies] = await Promise.all([
        CashierService.getPendingSpjs({
          search: debouncedSearch || undefined,
          page: activeTab === 'pending' ? page : 1,
          limit: activeTab === 'pending' ? limit : 50,
        }),
        CashierService.getSettlements({
          search: debouncedSearch || undefined,
          page: activeTab === 'settled' ? page : 1,
          limit: activeTab === 'settled' ? limit : 50,
        }),
        CashierService.getDiscrepancies({
          search: debouncedSearch || undefined,
          page: activeTab === 'discrepancies' ? page : 1,
          limit: activeTab === 'discrepancies' ? limit : 50,
        }),
      ]);
      setPendingSpjs(resPending.items || []);
      setTotalPendingCount(resPending.total || 0);

      setSettlements(resSettlements.items || []);
      setTotalSettlementsCount(resSettlements.total || 0);

      setDiscrepancies(resDiscrepancies.items || []);
      setTotalDiscrepanciesCount(resDiscrepancies.total || 0);
    } catch (err: any) {
      toast.error('Gagal mengambil data meja kasir: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, activeTab, page, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(searchInput.trim());
    setPage(1);
  };

  const handleResetSearch = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setPage(1);
  };

  const formatRupiah = (val: number | string | undefined) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(val || 0));
  };

  // Metrik Ringkasan KPI Header
  const totalPending = totalPendingCount;
  const totalDiscrepancies = useMemo(
    () => discrepancies.filter((d) => d.resolutionStatus === 'PENDING_INVESTIGATION').length,
    [discrepancies],
  );
  const totalSettled = totalSettlementsCount;
  const totalBkmToday = useMemo(
    () =>
      settlements
        .filter((s) => s.status === 'VERIFIED')
        .reduce((acc, s) => acc + (Number(s.totalCashReceived) || 0), 0),
    [settlements],
  );

  // Pagination metrics for current active tab
  const currentTotal =
    activeTab === 'pending'
      ? totalPendingCount
      : activeTab === 'settled'
        ? totalSettlementsCount
        : totalDiscrepanciesCount;

  const totalPages = Math.ceil(currentTotal / limit) || 1;
  const startItem = currentTotal === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, currentTotal);

  const handleUnblockPeriodClosing = (settlementId: string) => {
    setConfirmDialog({
      open: true,
      title: 'Unblock Tutup Buku Bulanan (Akun 11999)',
      description:
        'Apakah Anda yakin ingin memposting selisih kasir ini ke akun penampung 11999 Selisih Kas Operasional Sementara? Hal ini memastikan tutup buku bulanan tidak terblokir sembari investigasi Finance Manager tetap berjalan.',
      variant: 'warning',
      confirmText: 'Posting ke Akun 11999',
      onConfirm: async () => {
        setIsConfirmLoading(true);
        try {
          await CashierService.unblockPeriodClosing(settlementId);
          toast.success('Akun penampung 11999 berhasil diposting, tutup buku bulanan tidak terblokir!');
          setConfirmDialog((prev) => ({ ...prev, open: false }));
          fetchData();
        } catch (err: any) {
          toast.error('Gagal unblock tutup buku: ' + (err.response?.data?.message || err.message));
        } finally {
          setIsConfirmLoading(false);
        }
      },
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Heading
          title="Meja Kasir Pool & Settlement Kas Kru"
          description="Rekonsiliasi fisik Dua Kantong Kas Kru (Anti-Netting), penerbitan voucher BKM/BKK, dan pusat investigasi selisih kasir."
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="text-xs h-8.5 gap-1.5">
            <RotateCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* METRIC CARDS HEADER */}
      {loading && pendingSpjs.length === 0 && settlements.length === 0 ? (
        <MetricCardGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-blue-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">SPJ Siap Rekonsiliasi</CardDescription>
              <CardTitle className="text-2xl font-black text-blue-600 dark:text-blue-400 flex items-center justify-between">
                <span>{totalPending} <span className="text-sm font-semibold text-muted-foreground">SPJ</span></span>
                <Bus className="h-5 w-5 opacity-40 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Menunggu bus tiba &amp; hitung kas fisik
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-rose-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Temuan Selisih (Investigasi FM)</CardDescription>
              <CardTitle className="text-2xl font-bold text-rose-600 dark:text-rose-400 flex items-center justify-between">
                <span>{totalDiscrepancies} <span className="text-sm font-semibold text-muted-foreground">Kasus</span></span>
                <AlertTriangle className="h-5 w-5 opacity-40 text-rose-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Skenario 4: Butuh otorisasi Manajer Keuangan
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-emerald-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Settlement Terverifikasi</CardDescription>
              <CardTitle className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                <span>{totalSettled} <span className="text-sm font-semibold text-muted-foreground">Tuntas</span></span>
                <CheckCircle2 className="h-5 w-5 opacity-40 text-emerald-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Kas seimbang &amp; jurnal GL diposting
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-amber-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Kas Fisik Masuk (BKM)</CardDescription>
              <CardTitle className="text-xl font-bold text-amber-700 dark:text-amber-400 flex items-center justify-between font-mono">
                <span>{formatRupiah(totalBkmToday)}</span>
                <Coins className="h-5 w-5 opacity-40 text-amber-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Sisa UJ kembali + penerimaan tiket &amp; kargo
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Banner Edukasi Dua Kantong Kas Kru (Anti-Netting) Blueprint Bab 7 &amp; Skenario 4*/}
      <div className="p-4 rounded-xl border border-indigo-200/70 bg-indigo-50/50 dark:border-indigo-900/40 dark:bg-indigo-950/20 text-xs text-indigo-950 dark:text-indigo-200 flex items-start gap-3 shadow-2xs">
        <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <p className="font-bold text-sm">
            Prinsip Dua Kantong Kas Kru (Anti-Netting )
          </p>
          <p className="leading-relaxed">
            Kasir dilarang memotong uang setoran tiket/kargo untuk menutup nota biaya solar/tol kru. <strong>Kantong 1 (Uang Jalan)</strong> wajib dipertanggungjawabkan dengan nota sah dan sisa fisik uang kembali. <strong>Kantong 2 (Setoran Kas)</strong> wajib disetor 100% bruto ke laci kasir pool sebelum komisi kargo dan hak kru dicairkan via voucher BKK resmi.
          </p>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex flex-wrap border-b border-slate-200/80 dark:border-white/10 gap-2 sm:gap-4 text-xs font-semibold">
        <button
          onClick={() => {
            setActiveTab('pending');
            setPage(1);
          }}
          className={`pb-3 px-2 border-b-2 flex items-center gap-2 transition-all ${activeTab === 'pending'
            ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
            : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          <Receipt className="h-4 w-4" />
          SPJ Siap Rekonsiliasi Pool
          {totalPending > 0 && (
            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px] ml-1">
              {totalPending}
            </Badge>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('settled');
            setPage(1);
          }}
          className={`pb-3 px-2 border-b-2 flex items-center gap-2 transition-all ${activeTab === 'settled'
            ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
            : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          Riwayat Dokumen Settlement ({totalSettlementsCount})
        </button>

        <button
          onClick={() => {
            setActiveTab('discrepancies');
            setPage(1);
          }}
          className={`pb-3 px-2 border-b-2 flex items-center gap-2 transition-all ${activeTab === 'discrepancies'
            ? 'border-rose-600 text-rose-700 dark:text-rose-400'
            : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          <Scale className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          Pusat Investigasi Selisih (FM Hub)
          {totalDiscrepancies > 0 && (
            <Badge className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 text-[10px] ml-1">
              {totalDiscrepancies} Butuh Putusan
            </Badge>
          )}
        </button>
      </div>

      {/* FILTER SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nomor SPJ, nomor settlement, atau plat bus..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 pr-8 h-8.5 text-xs uppercase"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleResetSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              title="Hapus pencarian"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </form>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-muted-foreground font-medium">
          {debouncedSearch && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetSearch}
              className="h-8.5 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset Pencarian
            </Button>
          )}
          <span>
            Menampilkan <strong className="text-foreground">{startItem} - {endItem}</strong> dari {currentTotal} item
          </span>
        </div>
      </div>

      {/* TAB 1: SPJ SIAP REKONSILIASI KAS */}
      {activeTab === 'pending' && (
        <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/80 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10">
              <TableRow className="text-xs">
                <TableHead className="w-40 font-bold">Nomor SPJ</TableHead>
                <TableHead className="w-36 font-bold">Armada / Layanan</TableHead>
                <TableHead className="w-56 font-bold">Rute Operasional</TableHead>
                <TableHead className="w-44 font-bold">Kru Perjalanan</TableHead>
                <TableHead className="w-36 font-bold">Status Finansial</TableHead>
                <TableHead className="font-bold text-right w-44">Aksi Meja Kasir</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs divide-y divide-slate-100 dark:divide-white/5">
              {loading ? (
                <CashierPendingTableSkeletonRows rows={limit} />
              ) : pendingSpjs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="p-3 rounded-full bg-primary/10 text-primary">
                        <Bus className="h-8 w-8 opacity-60" />
                      </div>
                      <h4 className="text-sm font-semibold text-foreground">
                        Tidak ada SPJ kepulangan yang menunggu rekonsiliasi kasir
                      </h4>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {debouncedSearch
                          ? 'Tidak ada SPJ yang cocok dengan kriteria pencarian Anda.'
                          : 'Seluruh armada bus yang tiba di pool telah tuntas direkonsiliasi di meja kasir.'}
                      </p>
                      {debouncedSearch && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResetSearch}
                          className="text-xs gap-1.5 h-8 mt-1"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Reset Pencarian
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pendingSpjs.map((spj) => (
                  <TableRow key={spj.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                    <TableCell className="font-mono font-bold text-foreground">
                      {spj.spjNo}
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-foreground">{spj.vehicle?.code}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">{spj.vehicle?.plateNumber} ({spj.serviceType})</div>
                    </TableCell>
                    <TableCell>
                      {spj.legs && spj.legs.length > 0 ? (
                        <div className="text-foreground font-medium">
                          {spj.legs[0].origin} <ArrowRight className="inline h-3 w-3 text-muted-foreground mx-1" />{' '}
                          {spj.legs[spj.legs.length - 1].destination}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {spj.crewAssignments && spj.crewAssignments.length > 0 ? (
                        <div className="space-y-0.5">
                          {spj.crewAssignments.map((ca: any) => (
                            <span key={ca.id} className="inline-block text-[11px] text-muted-foreground bg-muted rounded px-1.5 py-0.5 mr-1 mb-0.5 font-medium">
                              {ca.crew?.name} ({ca.role})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          spj.financialStatus === 'DISCREPANCY'
                            ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                        }
                      >
                        {spj.financialStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-7.5 px-2.5 shadow-2xs"
                        onClick={() => {
                          setSelectedSpjId(spj.id);
                          setIsSettlementModalOpen(true);
                        }}
                      >
                        <Wallet className="h-3.5 w-3.5 mr-1" />
                        Buka Rekonsiliasi Kasir
                      </Button>
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
                value={String(limit)}
                onValueChange={(val) => {
                  setLimit(Number(val));
                  setPage(1);
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
                Halaman {page} dari {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-7.5 w-7.5"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7.5 w-7.5"
                  title="Halaman Berikutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 2: RIWAYAT DOKUMEN SETTLEMENT */}
      {activeTab === 'settled' && (
        <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/80 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10">
              <TableRow className="text-xs">
                <TableHead className="w-40 font-bold">No Settlement</TableHead>
                <TableHead className="w-36 font-bold">Nomor SPJ / Bus</TableHead>
                <TableHead className="w-36 font-bold">Status Kantong 1 (UJ)</TableHead>
                <TableHead className="w-36 font-bold">Status Kantong 2 (Setoran)</TableHead>
                <TableHead className="font-bold text-right w-36">Kas Masuk (BKM)</TableHead>
                <TableHead className="font-bold text-right w-36">Kas Bayar Kru (BKK)</TableHead>
                <TableHead className="w-36 font-bold">Voucher Ref</TableHead>
                <TableHead className="font-bold text-right w-44">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs divide-y divide-slate-100 dark:divide-white/5">
              {loading ? (
                <TableSkeletonRows
                  rows={limit}
                  colWidths={[
                    'w-28',
                    'w-24',
                    'w-16',
                    'w-16',
                    'w-24 ml-auto',
                    'w-24 ml-auto',
                    'w-20',
                    'w-24 ml-auto',
                  ]}
                />
              ) : settlements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="p-3 rounded-full bg-primary/10 text-primary">
                        <CheckCircle2 className="h-8 w-8 opacity-60" />
                      </div>
                      <h4 className="text-sm font-semibold text-foreground">
                        Belum ada rekonsiliasi kasir yang tercatat
                      </h4>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {debouncedSearch
                          ? 'Tidak ada settlement yang cocok dengan kriteria pencarian Anda.'
                          : 'Dokumen rekonsiliasi kas meja kasir pool akan muncul setelah proses settlement selesai.'}
                      </p>
                      {debouncedSearch && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResetSearch}
                          className="text-xs gap-1.5 h-8 mt-1"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Reset Pencarian
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                settlements.map((s) => (
                  <TableRow key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                    <TableCell className="font-mono font-bold text-foreground">
                      {s.settlementNo}
                      <span className="block text-[10px] text-muted-foreground font-normal">
                        {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString('id-ID') : '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-foreground">{s.spj?.spjNo}</span>
                      <span className="block text-[11px] text-muted-foreground font-mono">
                        {s.spj?.vehicle?.code}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          s.ujStatus === 'BALANCED'
                            ? 'bg-emerald-600 text-white text-[10px]'
                            : 'bg-rose-600 text-white text-[10px]'
                        }
                      >
                        {s.ujStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          s.revenueStatus === 'MATCHED'
                            ? 'bg-emerald-600 text-white text-[10px]'
                            : 'bg-amber-600 text-white text-[10px]'
                        }
                      >
                        {s.revenueStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(s.totalCashReceived)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-amber-600 dark:text-amber-400">
                      {s.totalCashPaid > 0 ? formatRupiah(s.totalCashPaid) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-[11px]">
                        {s.bkmNo && <span className="text-emerald-600 dark:text-emerald-400 font-bold block">{s.bkmNo}</span>}
                        {s.bkkNo && <span className="text-amber-600 dark:text-amber-400 block">{s.bkkNo}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-1.5">
                      {s.status !== 'VERIFIED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-amber-300 text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30"
                          onClick={() => handleUnblockPeriodClosing(s.id)}
                          title="Posting Penampung 11999 untuk unblock tutup buku bulanan"
                        >
                          <Lock className="h-3 w-3 mr-1" /> Unblock Tutup Buku
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => {
                          setSelectedVoucherSettlement(s);
                          setIsVoucherModalOpen(true);
                        }}
                      >
                        <Printer className="h-3.5 w-3.5 mr-1 text-muted-foreground" /> Cetak BKM
                      </Button>
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
                value={String(limit)}
                onValueChange={(val) => {
                  setLimit(Number(val));
                  setPage(1);
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
                Halaman {page} dari {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-7.5 w-7.5"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7.5 w-7.5"
                  title="Halaman Berikutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 3: PUSAT INVESTIGASI SELISIH (FINANCE MANAGER HUB) */}
      {activeTab === 'discrepancies' && (
        <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
          <div className="bg-rose-50/70 dark:bg-rose-950/20 p-3.5 border-b border-rose-200/80 dark:border-rose-900/40 text-xs text-rose-900 dark:text-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>
                <strong>Skenario 4: Separasi Wewenang Meja Kasir vs Manajer Keuangan.</strong> Kasir hanya mencatat temuan fisik, putusan dispensasi beban (akun 58101) vs potongan klaim gaji kru (akun 12901) adalah wewenang mutlak Finance Manager.
              </span>
            </div>
          </div>
          <Table>
            <TableHeader className="bg-slate-50/80 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10">
              <TableRow className="text-xs">
                <TableHead className="w-40 font-bold">No Selisih</TableHead>
                <TableHead className="w-36 font-bold">Nomor SPJ / Armada</TableHead>
                <TableHead className="w-36 font-bold">Kategori Sumber</TableHead>
                <TableHead className="font-bold text-right w-36">Nominal Selisih</TableHead>
                <TableHead className="font-bold">Alasan / Catatan Telematika GPS</TableHead>
                <TableHead className="w-36 font-bold">Status Resolusi</TableHead>
                <TableHead className="font-bold text-right w-36">Otorisasi Putusan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs divide-y divide-slate-100 dark:divide-white/5">
              {loading ? (
                <TableSkeletonRows
                  rows={limit}
                  colWidths={[
                    'w-28',
                    'w-24',
                    'w-24',
                    'w-20 ml-auto',
                    'w-36',
                    'w-20',
                    'w-24 ml-auto',
                  ]}
                />
              ) : discrepancies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="p-3 rounded-full bg-primary/10 text-primary">
                        <Scale className="h-8 w-8 opacity-60" />
                      </div>
                      <h4 className="text-sm font-semibold text-foreground">
                        Tidak ada temuan selisih kas yang menunggu investigasi
                      </h4>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {debouncedSearch
                          ? 'Tidak ada kasus selisih yang cocok dengan kriteria pencarian Anda.'
                          : 'Seluruh settlement kasir dalam kondisi seimbang atau telah diputuskan oleh Finance Manager.'}
                      </p>
                      {debouncedSearch && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResetSearch}
                          className="text-xs gap-1.5 h-8 mt-1"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Reset Pencarian
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                discrepancies.map((d) => (
                  <TableRow key={d.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                    <TableCell className="font-mono font-bold text-foreground">
                      {d.discrepancyNo}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-foreground">{d.spj?.spjNo}</span>
                      <span className="block text-[11px] text-muted-foreground font-mono">{d.spj?.vehicle?.code}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-foreground">{d.sourceType}</span>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                      {formatRupiah(d.differenceAmount)}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-foreground truncate" title={d.reason}>"{d.reason}"</p>
                      {d.investigationNotes && (
                        <p className="text-[10px] text-indigo-600 dark:text-indigo-400 truncate" title={d.investigationNotes}>
                          GPS: {d.investigationNotes}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          d.resolutionStatus === 'RESOLVED'
                            ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-800 dark:text-rose-400 border-rose-500/30'
                        }
                      >
                        {d.resolutionStatus}
                      </Badge>
                      {d.resolutionDecision && (
                        <span className="block text-[10px] font-mono text-muted-foreground mt-0.5">
                          {d.resolutionDecision}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {d.resolutionStatus === 'PENDING_INVESTIGATION' ? (
                        <Button
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-7.5 px-2.5 shadow-2xs"
                          onClick={() => {
                            setSelectedDiscrepancy(d);
                            setIsResolutionModalOpen(true);
                          }}
                        >
                          <Scale className="h-3.5 w-3.5 mr-1" />
                          Putusan FM
                        </Button>
                      ) : (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-end gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Selesai
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Paginasi Tab 3 */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 border-t border-slate-200/80 dark:border-white/10 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Baris per halaman:</span>
              <Select
                value={String(limit)}
                onValueChange={(val) => {
                  setLimit(Number(val));
                  setPage(1);
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
                Halaman {page} dari {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-7.5 w-7.5"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7.5 w-7.5"
                  title="Halaman Berikutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* MODAL 1: REKONSILIASI KASIR POOL */}
      {selectedSpjId && (
        <CashierSettlementModal
          isOpen={isSettlementModalOpen}
          onClose={() => {
            setIsSettlementModalOpen(false);
            setSelectedSpjId(null);
          }}
          spjId={selectedSpjId}
          onSuccess={fetchData}
          onOpenDiscrepancyModal={(sum) => {
            setIsSettlementModalOpen(false);
            setDiscrepancySummary(sum);
            setIsCreateDiscrepancyModalOpen(true);
          }}
        />
      )}

      {/* MODAL 2: RESOLUSI KEPUTUSAN FINANCE MANAGER */}
      {selectedDiscrepancy && (
        <DiscrepancyResolutionModal
          isOpen={isResolutionModalOpen}
          onClose={() => {
            setIsResolutionModalOpen(false);
            setSelectedDiscrepancy(null);
          }}
          discrepancy={selectedDiscrepancy}
          onSuccess={fetchData}
        />
      )}

      {/* MODAL 3: CETAK VOUCHER RESMI BKM / BKK */}
      {selectedVoucherSettlement && (
        <CashReceiptVoucherModal
          isOpen={isVoucherModalOpen}
          onClose={() => {
            setIsVoucherModalOpen(false);
            setSelectedVoucherSettlement(null);
          }}
          settlement={selectedVoucherSettlement}
        />
      )}

      {/* MODAL 4: CATAT TEMUAN SELISIH BARU */}
      {discrepancySummary && (
        <CreateDiscrepancyModal
          isOpen={isCreateDiscrepancyModalOpen}
          onClose={() => {
            setIsCreateDiscrepancyModalOpen(false);
            setDiscrepancySummary(null);
          }}
          summary={discrepancySummary}
          onSuccess={fetchData}
        />
      )}

      {/* REUSABLE CONFIRM DIALOG */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant={confirmDialog.variant}
        confirmText={confirmDialog.confirmText}
        onConfirm={confirmDialog.onConfirm}
        isLoading={isConfirmLoading}
      />
    </div>
  );
}
