import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  UtensilsCrossed,
  CheckCircle2,
  Filter,
  Search,
  RefreshCw,
  Send,
  Copy,
  Check,
  FileText,
  Info,
  MapPin,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RestaurantSettlementService } from '@/services/restaurant-settlement.service';
import { CashBankService } from '@/services/cash-bank.service';
import type {
  SpjMealRecord,
  RestaurantSettlementBatch,
  Restaurant,
  CashAccount,
} from '@/types';

export default function RestaurantSettlementsPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'batches' | 'restaurants'>('pending');
  const [loading, setLoading] = useState(true);

  // Data states
  const [pendingRecords, setPendingRecords] = useState<SpjMealRecord[]>([]);
  const [batches, setBatches] = useState<RestaurantSettlementBatch[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [bankAccounts, setBankAccounts] = useState<CashAccount[]>([]);

  // Filter states
  const [restaurantFilter, setRestaurantFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selection states
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);

  // Modal Bulk Transfer states
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchPaymentDate, setBatchPaymentDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [batchBankAccountId, setBatchBankAccountId] = useState('');
  const [batchRefNumber, setBatchRefNumber] = useState('');
  const [batchNotes, setBatchNotes] = useState('');
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  // Modal Batch Detail & WA states
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedBatchDetail, setSelectedBatchDetail] = useState<RestaurantSettlementBatch | null>(null);
  const [copiedWA, setCopiedWA] = useState(false);

  const formatRupiah = (val: number | string | undefined | null) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [pendingRes, batchRes, restsRes, accountsRes] = await Promise.all([
        RestaurantSettlementService.getPendingRecords({
          restaurantId: restaurantFilter === 'ALL' ? undefined : restaurantFilter,
          search: searchQuery || undefined,
        }),
        RestaurantSettlementService.getBatches(),
        RestaurantSettlementService.getRestaurants(),
        CashBankService.findAllCashAccounts({ includeInactive: false }),
      ]);

      setPendingRecords(pendingRes || []);
      setBatches(batchRes || []);
      setRestaurants(restsRes || []);
      setBankAccounts(accountsRes.data || []);
    } catch {
      toast.error('Gagal memuat data tagihan restoran mitra.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [restaurantFilter, searchQuery]);

  const toggleSelectRecord = (id: string) => {
    setSelectedRecordIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const selectAllPending = () => {
    if (selectedRecordIds.length === pendingRecords.length) {
      setSelectedRecordIds([]);
    } else {
      setSelectedRecordIds(pendingRecords.map((r) => r.id));
    }
  };

  const selectedRecords = pendingRecords.filter((r) => selectedRecordIds.includes(r.id));
  const selectedTotalAmount = selectedRecords.reduce((acc, r) => acc + Number(r.totalAmount || 0), 0);
  const selectedTotalCoupons = selectedRecords.reduce((acc, r) => acc + (r.actualPax || 0), 0);

  const handleExecuteBulkPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRecordIds.length === 0) {
      toast.error('Pilih minimal satu SPJ untuk dibayar gelondongan.');
      return;
    }
    if (!batchBankAccountId) {
      toast.error('Pilih rekening bank sumber pembayaran.');
      return;
    }

    setBatchSubmitting(true);
    try {
      const firstRecord = selectedRecords[0];
      const restaurantId = firstRecord ? firstRecord.restaurantId : '';

      const res = await RestaurantSettlementService.createBatch({
        restaurantId,
        spjMealRecordIds: selectedRecordIds,
        paymentDate: batchPaymentDate,
        bankAccountId: batchBankAccountId,
        referenceNumber: batchRefNumber,
        notes: batchNotes,
      });

      toast.success(
        `Pembayaran gelondongan ${res.batchNo} berhasil dieksekusi via Bank! Jurnal pelunasan utang 21101 otomatis terposting.`,
      );
      setBatchModalOpen(false);
      setSelectedRecordIds([]);
      setBatchRefNumber('');
      setBatchNotes('');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memproses pembayaran gelondongan restoran.');
    } finally {
      setBatchSubmitting(false);
    }
  };

  const openBatchDetail = async (batchId: string) => {
    try {
      const detail = await RestaurantSettlementService.getBatchDetail(batchId);
      setSelectedBatchDetail(detail);
      setDetailModalOpen(true);
      setCopiedWA(false);
    } catch {
      toast.error('Gagal mengambil rincian batch restoran.');
    }
  };

  const copyToClipboard = (text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedWA(true);
    toast.success('Rincian format WhatsApp berhasil disalin ke clipboard!');
    setTimeout(() => setCopiedWA(false), 3000);
  };

  return (
    <div className="p-6 space-y-6 max-w-full">
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <UtensilsCrossed className="w-6 h-6" />
              </span>
              Pembayaran Kupon Servis Makan Restoran Mitra
            </h1>
            <Badge variant="outline" className="font-mono text-xs border-amber-500/50 text-amber-700 dark:text-amber-300 bg-amber-50/50">
              Prasmanan Penumpang AKAP
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Rekapitulasi snapshot kupon makan riil per tiket terjual atas SPJ bus (Beban 51102) dan eksekusi pembayaran transfer bank gelondongan (Pelunasan Utang 21101).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={loadData}
            disabled={loading}
            className="h-8 text-xs font-medium border-slate-300 dark:border-zinc-700 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
          </Button>
        </div>
      </div>

      {/* Tabs Navigasi */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-4">
        <TabsList className="bg-muted/60 p-1 border border-border/60">
          <TabsTrigger value="pending" className="text-xs font-semibold gap-1.5">
            <UtensilsCrossed className="w-3.5 h-3.5" />
            Tagihan Siap Bayar Gelondongan ({pendingRecords.length} SPJ)
          </TabsTrigger>
          <TabsTrigger value="batches" className="text-xs font-semibold gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Riwayat Pembayaran Gelondongan ({batches.length} Batch)
          </TabsTrigger>
          <TabsTrigger value="restaurants" className="text-xs font-semibold gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            Daftar Restoran Mitra ({restaurants.length} Restoran)
          </TabsTrigger>
        </TabsList>

        {/* ========================================================= */}
        {/* TAB 1: TAGIHAN RESTORAN SIAP BAYAR GELONDONGAN            */}
        {/* ========================================================= */}
        <TabsContent value="pending" className="space-y-4">
          {/* Filter Bar */}
          <Card className="border border-slate-200/80 dark:border-white/10 shadow-2xs">
            <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-foreground">Filter Restoran:</span>
                </div>
                <Select value={restaurantFilter} onValueChange={setRestaurantFilter}>
                  <SelectTrigger className="h-8 text-xs w-64 font-normal">
                    <SelectValue placeholder="Semua Restoran Mitra" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="text-xs font-normal">
                      Semua Restoran Mitra
                    </SelectItem>
                    {restaurants.map((rm) => (
                      <SelectItem key={rm.id} value={rm.id} className="text-xs font-normal">
                        🍽️ {rm.name} ({rm.city})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari No. SPJ / Plat Bus / Rute..."
                  className="pl-8 h-8 text-xs font-normal"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabel Pending Records */}
          <Card className="border border-slate-200/80 dark:border-white/10 shadow-2xs overflow-hidden">
            <CardHeader className="p-4 pb-2 border-b border-border/50 bg-slate-50/50 dark:bg-zinc-900/30 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  Daftar SPJ Belum Dibayar Kupon Makannya
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Centang beberapa SPJ untuk digabungkan ke dalam satu kali transfer bank gelondongan ke pemilik restoran.
                </CardDescription>
              </div>

              {pendingRecords.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={selectAllPending}
                  className="h-7 text-[11px] font-medium border-slate-300 dark:border-zinc-700"
                >
                  {selectedRecordIds.length === pendingRecords.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                </Button>
              )}
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-zinc-900/60">
                  <TableRow>
                    <TableHead className="w-10 text-center">Pilih</TableHead>
                    <TableHead className="text-xs font-semibold">No. SPJ &amp; Bus</TableHead>
                    <TableHead className="text-xs font-semibold">Rute Perjalanan</TableHead>
                    <TableHead className="text-xs font-semibold">Restoran Mitra Singgah</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Manifes Pax</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Kupon Riil</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Tarif / Pax</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Total Tagihan (21101)</TableHead>
                    <TableHead className="text-xs font-semibold">Catatan Selisih</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-10 text-xs text-muted-foreground">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                        Memuat daftar tagihan restoran mitra...
                      </TableCell>
                    </TableRow>
                  ) : pendingRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12 text-xs text-muted-foreground">
                        🎉 Tidak ada tagihan kupon makan yang tertunda. Seluruh kupon SPJ telah lunas ditransfer gelondongan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingRecords.map((record) => {
                      const isSelected = selectedRecordIds.includes(record.id);
                      return (
                        <TableRow
                          key={record.id}
                          onClick={() => toggleSelectRecord(record.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-amber-50/80 dark:bg-amber-950/30'
                              : 'hover:bg-muted/20'
                          }`}
                        >
                          <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                            <div
                              onClick={() => toggleSelectRecord(record.id)}
                              className={`w-4 h-4 rounded mx-auto flex items-center justify-center border cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-amber-600 border-amber-600 text-white'
                                  : 'border-slate-300 dark:border-zinc-700 bg-background'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            <span className="font-bold font-mono text-foreground block">
                              {record.spj?.spjNo || 'SPJ'}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              🚌 {record.spj?.vehicle?.plateNumber || 'Armada'} ({record.spj?.vehicle?.nickname || record.spj?.vehicle?.bodyModel || 'Bus'})
                            </span>
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {record.spjLeg ? (
                              <span>
                                {record.spjLeg.origin} ➔ {record.spjLeg.destination}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Rute SPJ</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-foreground">
                            🍽️ {record.restaurant?.name || 'Restoran Mitra'} ({record.restaurant?.city || '-'})
                          </TableCell>
                          <TableCell className="text-xs text-center font-mono text-muted-foreground">
                            {record.manifestPax} Pax
                          </TableCell>
                          <TableCell className="text-xs text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {record.actualPax} Kupon
                          </TableCell>
                          <TableCell className="text-xs font-mono text-right text-muted-foreground">
                            {formatRupiah(record.ratePerPax)}
                          </TableCell>
                          <TableCell className="text-xs font-mono font-bold text-right text-amber-700 dark:text-amber-300">
                            {formatRupiah(record.totalAmount)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                            {record.discrepancyNotes || '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-700 dark:text-amber-300 bg-amber-50/50 font-medium">
                              Belum Ditransfer
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Sticky Bottom Bar Pilihan Gelondongan */}
          {selectedRecordIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl z-40 bg-background/95 backdrop-blur-md border border-amber-500/50 rounded-2xl shadow-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                  <UtensilsCrossed className="w-5 h-5" />
                </span>
                <div>
                  <div className="text-xs font-bold text-foreground flex items-center gap-2">
                    <span>Terpilih {selectedRecordIds.length} SPJ</span>
                    <span className="text-muted-foreground">({selectedTotalCoupons} Kupon Makan)</span>
                  </div>
                  <div className="text-sm font-mono font-extrabold text-amber-600 dark:text-amber-400">
                    Total Transfer Gelondongan: {formatRupiah(selectedTotalAmount)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedRecordIds([])}
                  className="h-8 text-xs font-medium border-slate-300 dark:border-zinc-700"
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  onClick={() => setBatchModalOpen(true)}
                  className="h-8 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Bayar Gelondongan ke Restoran
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ========================================================= */}
        {/* TAB 2: RIWAYAT PEMBAYARAN GELONDONGAN (BATCHES)           */}
        {/* ========================================================= */}
        <TabsContent value="batches" className="space-y-4">
          <Card className="border border-slate-200/80 dark:border-white/10 shadow-2xs overflow-hidden">
            <CardHeader className="p-4 pb-2 border-b border-border/50 bg-slate-50/50 dark:bg-zinc-900/30">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                Riwayat Pembayaran Gelondongan yang Telah Ditransfer
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Setiap batch transfer bank langsung terhubung ke buku besar (Pelunasan Utang 21101) dan siap diekspor ke format chat WhatsApp.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-zinc-900/60">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Nomor Batch</TableHead>
                    <TableHead className="text-xs font-semibold">Tanggal Transfer</TableHead>
                    <TableHead className="text-xs font-semibold">Restoran Mitra</TableHead>
                    <TableHead className="text-xs font-semibold">Rekening Asal Bank</TableHead>
                    <TableHead className="text-xs font-semibold">Ref Transfer</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Volume SPJ / Kupon</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Total Transfer</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-10 text-xs text-muted-foreground">
                        Belum ada riwayat pembayaran transfer gelondongan restoran.
                      </TableCell>
                    </TableRow>
                  ) : (
                    batches.map((batch) => (
                      <TableRow key={batch.id} className="hover:bg-muted/20">
                        <TableCell className="text-xs font-bold font-mono text-foreground">
                          {batch.batchNo}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {batch.paymentDate}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-foreground">
                          🍽️ {batch.restaurantName || 'Restoran'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          🏦 {batch.bankAccount?.name || 'Bank BCA'}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {batch.referenceNumber || '-'}
                        </TableCell>
                        <TableCell className="text-xs text-center font-mono font-semibold">
                          {batch.totalSpjs} SPJ ({batch.totalCoupons} Kupon)
                        </TableCell>
                        <TableCell className="text-xs font-mono font-bold text-right text-emerald-600 dark:text-emerald-400">
                          {formatRupiah(batch.totalAmount)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="default" className="text-[10px] bg-emerald-600 font-semibold gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Lunas Terposting
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openBatchDetail(batch.id)}
                            className="h-7 text-[11px] font-medium border-slate-300 dark:border-zinc-700 gap-1 hover:bg-slate-100 dark:hover:bg-zinc-800"
                          >
                            👁️ Rincian &amp; WA
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================= */}
        {/* TAB 3: DAFTAR RESTORAN MITRA RESMI                        */}
        {/* ========================================================= */}
        <TabsContent value="restaurants" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {restaurants.map((rm) => (
              <Card key={rm.id} className="border border-slate-200/80 dark:border-white/10 shadow-2xs">
                <CardHeader className="p-4 pb-2 border-b border-border/50 bg-slate-50/50 dark:bg-zinc-900/30">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4 text-amber-600" />
                      {rm.name}
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {rm.code}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {rm.city}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tarif per Kupon:</span>
                    <span className="font-mono font-bold text-sm text-foreground">
                      {formatRupiah(rm.ratePerPax)} / Pax
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Mekanisme Pembayaran:</span>
                    <span className="font-medium text-foreground">
                      {rm.settlementType === 'INVOICED_MONTHLY_AP'
                        ? '🏢 Transfer Gelondongan Kantor'
                        : '💵 Kas UJ Supir'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-border/50">
                    <span className="text-muted-foreground">Rekening Restoran:</span>
                    <span className="font-mono text-muted-foreground">
                      {rm.bankName ? `${rm.bankName} - ${rm.bankAccountNumber}` : 'Transfer Bank Mitra'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ========================================================= */}
      {/* MODAL 1: EKSEKUSI PEMBAYARAN GELONDONGAN (BULK TRANSFER)  */}
      {/* ========================================================= */}
      <Dialog open={batchModalOpen} onOpenChange={setBatchModalOpen}>
        <DialogContent className="max-w-lg bg-background border border-border/70 rounded-2xl shadow-xl p-0 overflow-hidden">
          <DialogHeader className="p-5 pb-3 border-b border-border/50 bg-amber-50/50 dark:bg-amber-950/20">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <Send className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              Pembayaran Gelondongan Kupon Makan via Bank
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Eksekusi pelunasan utang servis makan ({selectedRecordIds.length} SPJ terpilih) melalui transfer rekening bank kantor pusat.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleExecuteBulkPayment} className="p-5 space-y-4">
            {/* Box Ringkasan Nilai Transfer */}
            <div className="p-3.5 bg-amber-500/10 border border-amber-200 dark:border-amber-800/40 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Restoran Mitra:</span>
                <span className="font-bold text-foreground">
                  🍽️ {selectedRecords[0]?.restaurant?.name || 'Restoran Mitra'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Volume Kupon:</span>
                <span className="font-mono font-bold text-foreground">
                  {selectedRecordIds.length} SPJ ({selectedTotalCoupons} Kupon Prasmanan)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-amber-200/50">
                <span className="text-foreground font-semibold">Total Nilai Ditransfer:</span>
                <span className="font-mono font-extrabold text-base text-amber-700 dark:text-amber-300">
                  {formatRupiah(selectedTotalAmount)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Tanggal Transfer Bank <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="date"
                  value={batchPaymentDate}
                  onChange={(e) => setBatchPaymentDate(e.target.value)}
                  className="h-9 text-xs font-mono font-semibold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  No. Referensi Transfer Bank
                </Label>
                <Input
                  value={batchRefNumber}
                  onChange={(e) => setBatchRefNumber(e.target.value)}
                  placeholder="Contoh: TRF-BCA-RM-0091"
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Rekening Bank Kantor Pembayar <span className="text-destructive">*</span>
              </Label>
              <Select value={batchBankAccountId} onValueChange={setBatchBankAccountId} required>
                <SelectTrigger className="h-9 text-xs font-normal">
                  <SelectValue placeholder="Pilih Rekening Bank (BCA / Mandiri)" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id} className="text-xs font-normal">
                      🏦 {acc.name} ({acc.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Catatan Tambahan Transfer</Label>
              <Textarea
                value={batchNotes}
                onChange={(e) => setBatchNotes(e.target.value)}
                placeholder="Contoh: Pelunasan kupon makan minggu ke-1 November 2026..."
                className="text-xs resize-none h-16 font-normal"
              />
            </div>

            {/* Info Akuntansi Otomatis */}
            <div className="p-3 bg-muted/20 border border-border/60 rounded-xl flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground">Dampak Jurnal Akuntansi:</strong> Transaksi ini akan mendebit akun <code className="font-mono text-foreground font-semibold">21101 — Utang Usaha Vendor Restoran Mitra</code> dan mengkredit rekening bank. Seluruh {selectedRecordIds.length} SPJ akan langsung berstatus <strong className="text-emerald-600">LUNAS</strong>.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
              <Button type="button" variant="outline" size="sm" onClick={() => setBatchModalOpen(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={batchSubmitting}
                className="font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-2xs gap-1.5"
              >
                {batchSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Memproses...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Eksekusi Transfer Gelondongan
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL 2: RINCIAN BATCH & SALIN FORMAT WHATSAPP            */}
      {/* ========================================================= */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-2xl bg-background border border-border/70 rounded-2xl shadow-xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
          <DialogHeader className="p-5 pb-3 border-b border-border/50 bg-slate-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                  <FileText className="w-5 h-5 text-primary" />
                  Rincian Batch #{selectedBatchDetail?.batchNo}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Rincian kupon SPJ yang dilunasi dan format teks ringkasan untuk pemilik rumah makan mitra.
                </DialogDescription>
              </div>
              <Badge variant="default" className="text-[10px] bg-emerald-600 font-semibold gap-1">
                <CheckCircle2 className="w-3 h-3" /> Lunas Terposting
              </Badge>
            </div>
          </DialogHeader>

          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            {/* Ringkasan Header Batch */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-muted/20 border border-border/60 rounded-xl text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Tanggal Transfer:</span>
                <span className="font-mono font-semibold text-foreground">{selectedBatchDetail?.paymentDate}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Restoran:</span>
                <span className="font-semibold text-foreground">{selectedBatchDetail?.restaurantName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Rekening Asal:</span>
                <span className="text-foreground">{selectedBatchDetail?.bankAccount?.name || 'Bank BCA'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Total Ditransfer:</span>
                <span className="font-mono font-bold text-amber-700 dark:text-amber-300">
                  {formatRupiah(selectedBatchDetail?.totalAmount)}
                </span>
              </div>
            </div>

            {/* Kotak Format Teks WhatsApp Siap Kirim */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-emerald-600" /> Format Pesan WhatsApp ke Pengelola Rumah Makan:
                </Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(selectedBatchDetail?.whatsappRemittanceText)}
                  className="h-7 text-[11px] font-medium border-emerald-500/60 text-emerald-700 dark:text-emerald-300 gap-1 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100"
                >
                  {copiedWA ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Salin Teks WA
                    </>
                  )}
                </Button>
              </div>
              <pre className="p-3.5 bg-slate-900 text-slate-100 text-xs font-mono rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-48 border border-slate-800">
                {selectedBatchDetail?.whatsappRemittanceText || 'Memuat teks...'}
              </pre>
            </div>

            {/* Tabel Rincian SPJ dalam Batch */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Rincian SPJ Perjalanan dalam Batch Ini ({selectedBatchDetail?.items?.length || 0} SPJ):
              </Label>
              <div className="border border-border/60 rounded-xl overflow-hidden bg-background">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-zinc-900/60">
                    <TableRow>
                      <TableHead className="text-[11px] font-semibold">No. SPJ &amp; Bus</TableHead>
                      <TableHead className="text-[11px] font-semibold">Rute</TableHead>
                      <TableHead className="text-[11px] font-semibold text-center">Kupon</TableHead>
                      <TableHead className="text-[11px] font-semibold text-right">Tarif</TableHead>
                      <TableHead className="text-[11px] font-semibold text-right">Total Tagihan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!selectedBatchDetail?.items || selectedBatchDetail.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-xs text-muted-foreground">
                          Tidak ada rincian item SPJ.
                        </TableCell>
                      </TableRow>
                    ) : (
                      selectedBatchDetail.items.map((item, idx) => (
                        <TableRow key={item.id} className="hover:bg-muted/20">
                          <TableCell className="text-xs font-mono font-semibold">
                            {idx + 1}. {item.spj?.spjNo || 'SPJ'} ({item.spj?.vehicle?.plateNumber || 'Bus'})
                          </TableCell>
                          <TableCell className="text-xs">
                            {item.spjLeg ? `${item.spjLeg.origin} ➔ ${item.spjLeg.destination}` : '-'}
                          </TableCell>
                          <TableCell className="text-xs text-center font-mono font-bold">
                            {item.actualPax} Kupon
                          </TableCell>
                          <TableCell className="text-xs text-right font-mono text-muted-foreground">
                            {formatRupiah(item.ratePerPax)}
                          </TableCell>
                          <TableCell className="text-xs text-right font-mono font-bold text-foreground">
                            {formatRupiah(item.totalAmount)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-border/50 flex justify-end">
            <Button size="sm" variant="outline" onClick={() => setDetailModalOpen(false)}>
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
