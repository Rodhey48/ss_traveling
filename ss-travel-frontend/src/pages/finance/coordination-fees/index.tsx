import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  ShieldAlert,
  CheckCircle2,
  Filter,
  Search,
  RefreshCw,
  Coins,
  Send,
  Copy,
  Check,
  FileText,
  Info,
  MapPin,
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
import { CoordinationFeeService } from '@/services/coordination-fee.service';
import { CashBankService } from '@/services/cash-bank.service';
import type {
  SpjCoordinationFee,
  CoordinationFeeBatch,
  CoordinatorFeeRule,
  CashAccount,
  CoordinatorZone,
} from '@/types';

export default function CoordinationFeesPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'batches' | 'rules'>('pending');
  const [loading, setLoading] = useState(true);

  // Data states
  const [pendingFees, setPendingFees] = useState<SpjCoordinationFee[]>([]);
  const [batches, setBatches] = useState<CoordinationFeeBatch[]>([]);
  const [rules, setRules] = useState<CoordinatorFeeRule[]>([]);
  const [bankAccounts, setBankAccounts] = useState<CashAccount[]>([]);

  // Filter states
  const [zoneFilter, setZoneFilter] = useState<'ALL' | CoordinatorZone>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selection states
  const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>([]);

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
  const [selectedBatchDetail, setSelectedBatchDetail] = useState<CoordinationFeeBatch | null>(null);
  const [copiedWA, setCopiedWA] = useState(false);

  // Modal Edit Rule states
  const [editRuleModalOpen, setEditRuleModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<CoordinatorFeeRule | null>(null);
  const [inputRuleFeePerPax, setInputRuleFeePerPax] = useState('10000');

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
      const [pendingRes, batchRes, ruleRes, accountsRes] = await Promise.all([
        CoordinationFeeService.getPendingFees({
          zone: zoneFilter === 'ALL' ? undefined : zoneFilter,
          search: searchQuery || undefined,
        }),
        CoordinationFeeService.getBatches(),
        CoordinationFeeService.getRules(),
        CashBankService.findAllCashAccounts({ includeInactive: false }),
      ]);

      setPendingFees(pendingRes || []);
      setBatches(batchRes || []);
      setRules(ruleRes || []);
      // Filter hanya akun kas / bank
      setBankAccounts(accountsRes.data || []);
    } catch {
      toast.error('Gagal memuat data uang koordinasi lapangan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [zoneFilter, searchQuery]);

  const toggleSelectFee = (id: string) => {
    setSelectedFeeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const selectAllPending = () => {
    if (selectedFeeIds.length === pendingFees.length) {
      setSelectedFeeIds([]);
    } else {
      setSelectedFeeIds(pendingFees.map((f) => f.id));
    }
  };

  const selectedFees = pendingFees.filter((f) => selectedFeeIds.includes(f.id));
  const selectedTotalAmount = selectedFees.reduce((acc, f) => acc + Number(f.totalFee || 0), 0);
  const selectedTotalTickets = selectedFees.reduce((acc, f) => acc + (f.ticketCount || 0), 0);

  const handleExecuteBulkPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFeeIds.length === 0) {
      toast.error('Pilih minimal satu SPJ untuk dibayar gelondongan.');
      return;
    }
    if (!batchBankAccountId) {
      toast.error('Pilih rekening bank sumber pembayaran.');
      return;
    }

    setBatchSubmitting(true);
    try {
      const firstFee = selectedFees[0];
      const zone = firstFee ? firstFee.zone : 'WEST';

      const res = await CoordinationFeeService.createBatch({
        zone,
        spjCoordinationFeeIds: selectedFeeIds,
        paymentDate: batchPaymentDate,
        bankAccountId: batchBankAccountId,
        referenceNumber: batchRefNumber,
        notes: batchNotes,
      });

      toast.success(
        `Pembayaran gelondongan ${res.batchNo} berhasil dieksekusi via Bank! Jurnal pelunasan utang 22102 otomatis terposting.`,
      );
      setBatchModalOpen(false);
      setSelectedFeeIds([]);
      setBatchRefNumber('');
      setBatchNotes('');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memproses pembayaran gelondongan.');
    } finally {
      setBatchSubmitting(false);
    }
  };

  const openBatchDetail = async (batchId: string) => {
    try {
      const detail = await CoordinationFeeService.getBatchDetail(batchId);
      setSelectedBatchDetail(detail);
      setDetailModalOpen(true);
      setCopiedWA(false);
    } catch {
      toast.error('Gagal mengambil rincian batch.');
    }
  };

  const copyToClipboard = (text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedWA(true);
    toast.success('Rincian format WhatsApp berhasil disalin ke clipboard!');
    setTimeout(() => setCopiedWA(false), 3000);
  };

  const handleUpdateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRule) return;
    try {
      await CoordinationFeeService.updateRule(selectedRule.id, {
        feePerPax: inputRuleFeePerPax,
      });
      toast.success('Tarif koordinasi zona berhasil diperbarui!');
      setEditRuleModalOpen(false);
      loadData();
    } catch {
      toast.error('Gagal memperbarui tarif koordinasi.');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-full">
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Coins className="w-6 h-6" />
              </span>
              Pembayaran Uang Koordinasi Lapangan
            </h1>
            <Badge variant="outline" className="font-mono text-xs border-amber-500/50 text-amber-700 dark:text-amber-300 bg-amber-50/50">
              Pengurus Jalur Barat &amp; Timur
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Rekapitulasi snapshot kewajiban uang koordinasi per tiket terjual atas SPJ bus (Beban 52105) dan eksekusi pembayaran transfer bank gelondongan (Pelunasan Utang 22102).
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
            <Coins className="w-3.5 h-3.5" />
            Tagihan Siap Bayar Gelondongan ({pendingFees.length} SPJ)
          </TabsTrigger>
          <TabsTrigger value="batches" className="text-xs font-semibold gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Riwayat Pembayaran Gelondongan ({batches.length} Batch)
          </TabsTrigger>
          <TabsTrigger value="rules" className="text-xs font-semibold gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            Pengaturan Tarif ({rules.length} Zona)
          </TabsTrigger>
        </TabsList>

        {/* ========================================================= */}
        {/* TAB 1: TAGIHAN SIAP BAYAR GELONDONGAN (OUTSTANDING SPJ)   */}
        {/* ========================================================= */}
        <TabsContent value="pending" className="space-y-4">
          {/* Filter Bar */}
          <Card className="border border-slate-200/80 dark:border-white/10 shadow-2xs">
            <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-foreground">Zona Wilayah:</span>
                </div>
                <div className="flex items-center gap-1">
                  {(['ALL', 'WEST', 'EAST'] as const).map((z) => (
                    <Button
                      key={z}
                      size="sm"
                      variant={zoneFilter === z ? 'default' : 'outline'}
                      onClick={() => setZoneFilter(z)}
                      className={`h-7 text-xs ${
                        zoneFilter === z
                          ? 'bg-amber-600 hover:bg-amber-700 text-white font-semibold'
                          : 'border-slate-300 dark:border-zinc-700'
                      }`}
                    >
                      {z === 'ALL' ? 'Semua Zona' : z === 'WEST' ? 'Barat (Jabodetabek)' : 'Timur (DIY / Jateng)'}
                    </Button>
                  ))}
                </div>
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

          {/* Tabel Pending Fees */}
          <Card className="border border-slate-200/80 dark:border-white/10 shadow-2xs overflow-hidden">
            <CardHeader className="p-4 pb-2 border-b border-border/50 bg-slate-50/50 dark:bg-zinc-900/30 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  Daftar SPJ Belum Dibayar Koordinasinya
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Centang beberapa SPJ untuk digabungkan ke dalam satu kali transfer bank gelondongan.
                </CardDescription>
              </div>

              {pendingFees.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={selectAllPending}
                  className="h-7 text-[11px] font-medium border-slate-300 dark:border-zinc-700"
                >
                  {selectedFeeIds.length === pendingFees.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
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
                    <TableHead className="text-xs font-semibold">Zona</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Tiket Terjual</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Tarif / Pax</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Total Kewajiban</TableHead>
                    <TableHead className="text-xs font-semibold">Koordinator Wilayah</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-10 text-xs text-muted-foreground">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                        Memuat daftar kewajiban koordinasi SPJ...
                      </TableCell>
                    </TableRow>
                  ) : pendingFees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-xs text-muted-foreground">
                        🎉 Tidak ada tagihan uang koordinasi yang tertunda. Seluruh SPJ telah lunas ditransfer gelondongan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingFees.map((fee) => {
                      const isSelected = selectedFeeIds.includes(fee.id);
                      return (
                        <TableRow
                          key={fee.id}
                          onClick={() => toggleSelectFee(fee.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-amber-50/80 dark:bg-amber-950/30'
                              : 'hover:bg-muted/20'
                          }`}
                        >
                          <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                            <div
                              onClick={() => toggleSelectFee(fee.id)}
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
                              {fee.spj?.spjNo || 'SPJ'}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              🚌 {fee.spj?.vehicle?.plateNumber || 'Armada'} ({fee.spj?.vehicle?.nickname || fee.spj?.vehicle?.bodyModel || 'Bus'})
                            </span>
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {fee.spjLeg ? (
                              <span>
                                {fee.spjLeg.origin} ➔ {fee.spjLeg.destination}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Rute Reguler</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {fee.zone === 'WEST' ? (
                              <Badge variant="outline" className="text-[10px] font-mono border-blue-400 text-blue-700 dark:text-blue-300 bg-blue-50/50">
                                🏙️ Barat (Jkt)
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] font-mono border-emerald-400 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50">
                                🌾 Timur (Yogya)
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-center font-mono font-bold text-foreground">
                            {fee.ticketCount} Pax
                          </TableCell>
                          <TableCell className="text-xs font-mono text-right text-muted-foreground">
                            {formatRupiah(fee.feePerPax)}
                          </TableCell>
                          <TableCell className="text-xs font-mono font-bold text-right text-amber-700 dark:text-amber-300">
                            {formatRupiah(fee.totalFee)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            👤 {fee.coordinatorUser?.name || `Koordinator Zona ${fee.zone}`}
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
          {selectedFeeIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl z-40 bg-background/95 backdrop-blur-md border border-amber-500/50 rounded-2xl shadow-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                  <Coins className="w-5 h-5" />
                </span>
                <div>
                  <div className="text-xs font-bold text-foreground flex items-center gap-2">
                    <span>Terpilih {selectedFeeIds.length} SPJ</span>
                    <span className="text-muted-foreground">({selectedTotalTickets} Pax Tiket)</span>
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
                  onClick={() => setSelectedFeeIds([])}
                  className="h-8 text-xs font-medium border-slate-300 dark:border-zinc-700"
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  onClick={() => setBatchModalOpen(true)}
                  className="h-8 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Bayar Gelondongan (Bulk Transfer)
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
                Setiap batch transfer bank langsung terhubung ke buku besar (Pelunasan Utang 22102) dan siap diekspor ke format chat WhatsApp.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-zinc-900/60">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Nomor Batch</TableHead>
                    <TableHead className="text-xs font-semibold">Tanggal Transfer</TableHead>
                    <TableHead className="text-xs font-semibold">Zona</TableHead>
                    <TableHead className="text-xs font-semibold">Penerima / Koordinator</TableHead>
                    <TableHead className="text-xs font-semibold">Rekening Asal Bank</TableHead>
                    <TableHead className="text-xs font-semibold">Ref Transfer</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Volume SPJ / Tiket</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Total Transfer</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-10 text-xs text-muted-foreground">
                        Belum ada riwayat pembayaran transfer gelondongan.
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
                        <TableCell>
                          {batch.zone === 'WEST' ? (
                            <Badge variant="outline" className="text-[10px] font-mono border-blue-400 text-blue-700 bg-blue-50/50">
                              Barat
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] font-mono border-emerald-400 text-emerald-700 bg-emerald-50/50">
                              Timur
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-foreground">
                          👤 {batch.coordinatorName || 'Koordinator'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          🏦 {batch.bankAccount?.name || 'Bank BCA'}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {batch.referenceNumber || '-'}
                        </TableCell>
                        <TableCell className="text-xs text-center font-mono font-semibold">
                          {batch.totalSpjs} SPJ ({batch.totalTickets} Pax)
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
        {/* TAB 3: PENGATURAN TARIF & KOORDINATOR (MASTER RULES)      */}
        {/* ========================================================= */}
        <TabsContent value="rules" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rules.map((r) => (
              <Card key={r.id} className="border border-slate-200/80 dark:border-white/10 shadow-2xs">
                <CardHeader className="p-4 pb-2 border-b border-border/50 bg-slate-50/50 dark:bg-zinc-900/30 flex flex-row items-center justify-between">
                  <div className="space-y-0.5">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-amber-600" />
                      Zona {r.zone === 'WEST' ? 'Barat (Jabodetabek / Banten)' : 'Timur (DIY / Klaten / Solo)'}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Tarif koordinasi otomatis per lembar tiket penumpang bus.
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedRule(r);
                      setInputRuleFeePerPax(String(r.feePerPax));
                      setEditRuleModalOpen(true);
                    }}
                    className="h-7 text-xs font-medium border-slate-300 dark:border-zinc-700"
                  >
                    ✏️ Edit Tarif
                  </Button>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Tarif per Penumpang:</span>
                    <span className="font-mono font-bold text-base text-foreground">
                      {formatRupiah(r.feePerPax)} / Pax
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Koordinator Terdaftar:</span>
                    <span className="font-semibold text-foreground">
                      👤 {r.coordinatorUser?.name || 'Koordinator Belum Ditetapkan'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Masa Berlaku:</span>
                    <span className="font-mono text-muted-foreground">
                      {new Date(r.effectiveFrom).toLocaleDateString('id-ID')} s/d Sekarang
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
              Pembayaran Gelondongan Uang Koordinasi via Bank
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Eksekusi pelunasan utang koordinasi ({selectedFeeIds.length} SPJ terpilih) melalui mutasi transfer bank kantor pusat.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleExecuteBulkPayment} className="p-5 space-y-4">
            {/* Box Ringkasan Nilai Transfer */}
            <div className="p-3.5 bg-amber-500/10 border border-amber-200 dark:border-amber-800/40 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Volume Perjalanan Terpilih:</span>
                <span className="font-mono font-bold text-foreground">
                  {selectedFeeIds.length} SPJ ({selectedTotalTickets} Tiket Penumpang)
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
                  placeholder="Contoh: TRF-BCA-202611-091"
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
                placeholder="Contoh: Transfer gelondongan uang koordinasi wilayah Barat minggu ke-1 November..."
                className="text-xs resize-none h-16 font-normal"
              />
            </div>

            {/* Info Akuntansi Otomatis */}
            <div className="p-3 bg-muted/20 border border-border/60 rounded-xl flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground">Dampak Jurnal Akuntansi:</strong> Transaksi ini akan mendebit akun <code className="font-mono text-foreground font-semibold">22102 — Utang Jasa Koordinator</code> dan mengkredit rekening bank terpilih. Seluruh {selectedFeeIds.length} SPJ akan langsung berstatus <strong className="text-emerald-600">LUNAS</strong>.
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
                  Rincian SPJ yang dilunasi dan format teks ringkasan untuk koordinator lapangan.
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
                <span className="text-muted-foreground block text-[11px]">Koordinator:</span>
                <span className="font-semibold text-foreground">{selectedBatchDetail?.coordinatorName}</span>
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
                  <Send className="w-3.5 h-3.5 text-emerald-600" /> Format Pesan WhatsApp ke Koordinator:
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
                      <TableHead className="text-[11px] font-semibold text-center">Tiket</TableHead>
                      <TableHead className="text-[11px] font-semibold text-right">Tarif</TableHead>
                      <TableHead className="text-[11px] font-semibold text-right">Total Fee</TableHead>
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
                            {item.ticketCount} Pax
                          </TableCell>
                          <TableCell className="text-xs text-right font-mono text-muted-foreground">
                            {formatRupiah(item.feePerPax)}
                          </TableCell>
                          <TableCell className="text-xs text-right font-mono font-bold text-foreground">
                            {formatRupiah(item.totalFee)}
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

      {/* ========================================================= */}
      {/* MODAL 3: EDIT ATURAN TARIF KOORDINASI                     */}
      {/* ========================================================= */}
      <Dialog open={editRuleModalOpen} onOpenChange={setEditRuleModalOpen}>
        <DialogContent className="max-w-md bg-background border border-border/70 rounded-2xl shadow-xl p-5">
          <DialogHeader className="pb-3 border-b border-border/50">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              Edit Tarif Koordinasi Zona {selectedRule?.zone}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Ubah tarif rupiah per lembar tiket penumpang untuk wilayah {selectedRule?.zone === 'WEST' ? 'Barat' : 'Timur'}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateRule} className="pt-3 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Tarif Koordinasi per Tiket (Rp) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-semibold text-muted-foreground select-none">Rp</span>
                <Input
                  type="number"
                  min="0"
                  step="500"
                  value={inputRuleFeePerPax}
                  onChange={(e) => setInputRuleFeePerPax(e.target.value)}
                  className="pl-9 h-9 text-xs font-mono font-bold"
                  required
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Standar SS Travelink: Rp 10.000 / pax penumpang terdaftar.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditRuleModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" size="sm" className="font-semibold bg-amber-600 hover:bg-amber-700 text-white">
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
