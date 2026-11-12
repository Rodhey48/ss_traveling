import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { CashBankService } from '@/services/cash-bank.service';
import { CoordinationFeeService } from '@/services/coordination-fee.service';
import { PartnerService } from '@/services/partner.service';
import { RouteService } from '@/services/route.service';
import type {
  CashAccount,
  CoordinationFeeBatch,
  Coordinator,
  CoordinatorFeeRule,
  Route,
  SpjCoordinationFee,
} from '@/types';
import {
  Building2,
  Check,
  CheckCircle2,
  Coins,
  Copy,
  ExternalLink,
  FileText,
  Info,
  Landmark,
  MapPin,
  Phone,
  RefreshCw,
  RotateCcw,
  Route as RouteIcon,
  Search,
  Send,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function CoordinationFeesPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'batches' | 'rules'>('pending');
  const [loading, setLoading] = useState(true);

  // Data states
  const [pendingFees, setPendingFees] = useState<SpjCoordinationFee[]>([]);
  const [batches, setBatches] = useState<CoordinationFeeBatch[]>([]);
  const [rules, setRules] = useState<CoordinatorFeeRule[]>([]);
  const [bankAccounts, setBankAccounts] = useState<CashAccount[]>([]);
  const [availableRoutes, setAvailableRoutes] = useState<Route[]>([]);
  const [availableCoordinators, setAvailableCoordinators] = useState<Coordinator[]>([]);

  // Filter states
  const [selectedRouteId, setSelectedRouteId] = useState<string>('ALL');
  const [selectedCoordinatorId, setSelectedCoordinatorId] = useState<string>('ALL');
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
  const [copiedAccNumber, setCopiedAccNumber] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);

  // Modal Batch Detail & WA states
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedBatchDetail, setSelectedBatchDetail] = useState<CoordinationFeeBatch | null>(null);
  const [copiedWA, setCopiedWA] = useState(false);

  // Modal Edit Rule states
  const [editRuleModalOpen, setEditRuleModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<CoordinatorFeeRule | null>(null);
  const [inputRuleFeePerPax, setInputRuleFeePerPax] = useState('10000');
  const [inputRuleCoordinatorId, setInputRuleCoordinatorId] = useState<string>('NONE');

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
      const [pendingRes, batchRes, ruleRes, accountsRes, routesRes, coordRes] = await Promise.all([
        CoordinationFeeService.getPendingFees({
          routeId: selectedRouteId === 'ALL' ? undefined : selectedRouteId,
          coordinatorId: selectedCoordinatorId === 'ALL' ? undefined : selectedCoordinatorId,
          search: searchQuery || undefined,
        }),
        CoordinationFeeService.getBatches(),
        CoordinationFeeService.getRules(),
        CashBankService.findAllCashAccounts({ includeInactive: false }),
        RouteService.findAll(),
        PartnerService.findAllCoordinators(),
      ]);

      setPendingFees(pendingRes || []);
      setBatches(batchRes || []);
      setRules(ruleRes || []);
      setBankAccounts(accountsRes.data || []);
      if (routesRes.status && Array.isArray(routesRes.data)) {
        setAvailableRoutes(routesRes.data);
      }
      if (coordRes?.data && Array.isArray(coordRes.data)) {
        setAvailableCoordinators(coordRes.data);
      }
    } catch {
      toast.error('Gagal memuat data uang koordinasi lapangan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedRouteId, selectedCoordinatorId, searchQuery]);

  const isFilterActive =
    selectedRouteId !== 'ALL' || selectedCoordinatorId !== 'ALL' || searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setSelectedRouteId('ALL');
    setSelectedCoordinatorId('ALL');
    setSearchQuery('');
  };

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

  // Target coordinator for the selected batch
  const targetCoordinator =
    selectedFees.find((f) => f.coordinator)?.coordinator ||
    (selectedCoordinatorId !== 'ALL'
      ? availableCoordinators.find((c) => c.id === selectedCoordinatorId)
      : undefined);

  const handleCopy = (text: string, type: 'acc' | 'amount') => {
    navigator.clipboard.writeText(text);
    if (type === 'acc') {
      setCopiedAccNumber(true);
      toast.success(`Nomor rekening ${text} berhasil disalin!`);
      setTimeout(() => setCopiedAccNumber(false), 2500);
    } else {
      setCopiedAmount(true);
      toast.success(`Nominal transfer Rp ${Number(text).toLocaleString('id-ID')} berhasil disalin!`);
      setTimeout(() => setCopiedAmount(false), 2500);
    }
  };

  const handleExecuteBulkPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFeeIds.length === 0) {
      toast.error('Pilih minimal satu SPJ untuk dibayar gelondongan.');
      return;
    }
    if (!batchBankAccountId) {
      toast.error('Pilih rekening bank kantor sumber pembayaran.');
      return;
    }

    setBatchSubmitting(true);
    try {
      const firstFee = selectedFees[0];
      const origin = firstFee ? firstFee.origin : 'ALL';
      const destination = firstFee ? firstFee.destination : 'ALL';

      const res = await CoordinationFeeService.createBatch({
        origin,
        destination,
        coordinatorId: targetCoordinator?.id,
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
        coordinatorId: inputRuleCoordinatorId === 'NONE' ? undefined : inputRuleCoordinatorId,
      });
      toast.success('Aturan tarif koordinasi berhasil diperbarui!');
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
              Pengurus Jalur &amp; Paguyuban Terminal
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Rekapitulasi snapshot kewajiban uang jasa koordinator per tiket terjual atas SPJ bus (Beban 52105) dan eksekusi pembayaran transfer bank gelondongan (Pelunasan Utang 22102).
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
            Pengaturan Tarif &amp; Koordinator ({rules.length} Aturan)
          </TabsTrigger>
        </TabsList>

        {/* ========================================================= */}
        {/* TAB 1: TAGIHAN SIAP BAYAR GELONDONGAN (OUTSTANDING SPJ)   */}
        {/* ========================================================= */}
        <TabsContent value="pending" className="space-y-4">
          {/* Dynamic Filter Bar */}
          <Card className="border border-slate-200/80 dark:border-white/10 shadow-2xs">
            <CardContent className="p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                {/* Filter Master Rute Dinamis */}
                <div className="flex items-center gap-1.5 min-w-56">
                  <RouteIcon className="w-4 h-4 text-primary shrink-0" />
                  <Select value={selectedRouteId} onValueChange={setSelectedRouteId}>
                    <SelectTrigger className="h-8.5 text-xs">
                      <SelectValue placeholder="Pilih Master Rute Trayek" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL" className="text-xs font-semibold">
                        Semua Rute Trayek
                      </SelectItem>
                      {availableRoutes.map((r) => (
                        <SelectItem key={r.id} value={r.id} className="text-xs">
                          [{r.code}] {r.name} ({r.origin} ➔ {r.destination})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filter Koordinator Lapangan Dinamis */}
                <div className="flex items-center gap-1.5 min-w-56">
                  <Users className="w-4 h-4 text-amber-500 shrink-0" />
                  <Select value={selectedCoordinatorId} onValueChange={setSelectedCoordinatorId}>
                    <SelectTrigger className="h-8.5 text-xs">
                      <SelectValue placeholder="Pilih Koordinator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL" className="text-xs font-semibold">
                        Semua Koordinator Lapangan
                      </SelectItem>
                      {availableCoordinators.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs">
                          [{c.code}] {c.name} {c.organizationName ? `(${c.organizationName})` : ''} - {c.bankName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari No. SPJ / Plat Bus / Korlap..."
                    className="pl-8 h-8.5 text-xs font-normal"
                  />
                </div>

                {isFilterActive && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetFilters}
                    className="h-8.5 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                  </Button>
                )}
              </div>

              <div className="text-xs text-muted-foreground font-medium self-end lg:self-center">
                Menampilkan <strong className="text-foreground">{pendingFees.length}</strong> SPJ siap bayar
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
                    <TableHead className="text-xs font-semibold min-w-56">Koordinator Lapangan &amp; Kontak</TableHead>
                    <TableHead className="text-xs font-semibold min-w-56">Rekening Tujuan Transfer</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Tiket</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Tarif / Pax</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Total Kewajiban</TableHead>
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
                      const kor = fee.coordinator;
                      return (
                        <TableRow
                          key={fee.id}
                          onClick={() => toggleSelectFee(fee.id)}
                          className={`cursor-pointer transition-colors ${isSelected
                              ? 'bg-amber-50/80 dark:bg-amber-950/30'
                              : 'hover:bg-muted/20'
                            }`}
                        >
                          <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                            <div
                              onClick={() => toggleSelectFee(fee.id)}
                              className={`w-4 h-4 rounded mx-auto flex items-center justify-center border cursor-pointer transition-colors ${isSelected
                                  ? 'bg-amber-600 border-amber-600 text-white'
                                  : 'border-slate-300 dark:border-zinc-700 bg-background'
                                }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-3" />}
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
                          <TableCell className="text-xs">
                            <div className="font-semibold text-foreground">
                              {fee.origin} ➔ {fee.destination}
                            </div>
                            {fee.spjLeg && (
                              <div className="text-[11px] text-muted-foreground">
                                Leg: {fee.spjLeg.origin} ➔ {fee.spjLeg.destination}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            {kor ? (
                              <div>
                                <div className="font-bold text-foreground flex items-center gap-1.5">
                                  <span className="text-amber-600 font-mono">[{kor.code}]</span> {kor.name}
                                </div>
                                {kor.organizationName && (
                                  <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                    <Building2 className="w-3 h-3 text-blue-500" />
                                    {kor.organizationName}
                                  </div>
                                )}
                                <a
                                  href={`https://wa.me/${kor.phone.replace(/^0/, '62').replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 font-semibold mt-0.5"
                                >
                                  <Phone className="w-3 h-3" />
                                  {kor.phone}
                                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                                </a>
                              </div>
                            ) : fee.coordinatorUser ? (
                              <div className="font-semibold text-foreground">
                                👤 {fee.coordinatorUser.name}
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic text-[11px]">
                                Koordinator Umum
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {kor ? (
                              <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/20 inline-block">
                                <div className="flex items-center gap-1.5 font-bold text-xs text-amber-700 dark:text-amber-300">
                                  <Landmark className="w-3.5 h-3.5" />
                                  <span>{kor.bankName}</span>
                                  <span className="font-mono tracking-wider text-foreground">
                                    {kor.bankAccountNumber}
                                  </span>
                                </div>
                                <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">
                                  A.N. {kor.bankAccountHolder}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic text-[11px]">-</span>
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
                    {targetCoordinator && (
                      <Badge variant="outline" className="text-[10px] font-semibold border-amber-400 text-amber-700 dark:text-amber-300">
                        Penerima: {targetCoordinator.name}
                      </Badge>
                    )}
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
                Setiap batch transfer bank langsung terhubung ke buku besar (Pelunasan Utang 22102) dan siap dikirim via chat WhatsApp.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-zinc-900/60">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Nomor Batch</TableHead>
                    <TableHead className="text-xs font-semibold">Tanggal Transfer</TableHead>
                    <TableHead className="text-xs font-semibold">Rute</TableHead>
                    <TableHead className="text-xs font-semibold min-w-48">Penerima &amp; Rekening Tujuan</TableHead>
                    <TableHead className="text-xs font-semibold">Rekening Asal Kantor</TableHead>
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
                          <Badge variant="outline" className="text-[10px] font-mono border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                            {batch.origin} &rarr; {batch.destination}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-foreground">
                          <div className="font-bold flex items-center gap-1.5">
                            👤 {batch.coordinatorName || 'Koordinator Lapangan'}
                          </div>
                          {batch.coordinatorBankName && (
                            <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                              🏦 {batch.coordinatorBankName} - {batch.coordinatorBankAccountNo}
                            </div>
                          )}
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
            {rules.map((r) => {
              const kor = r.coordinator;
              return (
                <Card key={r.id} className="border border-slate-200/80 dark:border-white/10 shadow-2xs">
                  <CardHeader className="p-4 pb-2 border-b border-border/50 bg-slate-50/50 dark:bg-zinc-900/30 flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-amber-600" />
                        Rute {r.origin} &rarr; {r.destination} {r.origin === 'ALL' && r.destination === 'ALL' ? '(Global Fallback)' : ''}
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        {r.route ? `Master Rute: [${r.route.code}] ${r.route.name}` : 'Aturan rute manual'}
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedRule(r);
                        setInputRuleFeePerPax(String(r.feePerPax));
                        setInputRuleCoordinatorId(r.coordinatorId || 'NONE');
                        setEditRuleModalOpen(true);
                      }}
                      className="h-7 text-xs font-medium border-slate-300 dark:border-zinc-700"
                    >
                      ✏️ Edit Aturan
                    </Button>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Tarif per Penumpang:</span>
                      <span className="font-mono font-bold text-base text-foreground">
                        {formatRupiah(r.feePerPax)} / Pax
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 block">
                        Koordinator Lapangan Penerima Transfer:
                      </span>
                      {kor ? (
                        <div className="text-xs">
                          <div className="font-bold text-foreground">
                            [{kor.code}] {kor.name} {kor.organizationName ? `(${kor.organizationName})` : ''}
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                            🏦 {kor.bankName} - {kor.bankAccountNumber} (A.N. {kor.bankAccountHolder}) | 📞 {kor.phone}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Belum ditetapkan koordinator spesifik
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Masa Berlaku:</span>
                      <span className="font-mono text-muted-foreground">
                        {new Date(r.effectiveFrom).toLocaleDateString('id-ID')} s/d Sekarang
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* ========================================================= */}
      {/* MODAL 1: EKSEKUSI PEMBAYARAN GELONDONGAN (BULK TRANSFER)  */}
      {/* ========================================================= */}
      <Dialog open={batchModalOpen} onOpenChange={setBatchModalOpen}>
        <DialogContent className="max-w-xl bg-background border border-border/70 rounded-2xl shadow-xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
          <DialogHeader className="p-5 pb-3 border-b border-border/50 bg-amber-50/50 dark:bg-amber-950/20">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <Send className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              Pembayaran Gelondongan Uang Koordinasi via Bank
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Eksekusi pelunasan utang koordinasi ({selectedFeeIds.length} SPJ terpilih) melalui mutasi transfer bank kantor pusat.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleExecuteBulkPayment} className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* CALLOUT INFO: DATA REKENING PENERIMA (POIN 2) */}
            {targetCoordinator ? (
              <div className="p-4 bg-linear-to-br from-amber-500/10 via-amber-500/5 to-transparent border-2 border-amber-500/30 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                      Tujuan Transfer (Rekening Koordinator Lapangan)
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono border-amber-500/40 text-amber-700 bg-amber-50">
                    {targetCoordinator.bankName}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Nama Penerima / Paguyuban:</span>
                    <span className="font-bold text-foreground block text-sm">
                      {targetCoordinator.name}
                    </span>
                    {targetCoordinator.organizationName && (
                      <span className="text-[11px] text-muted-foreground block">
                        {targetCoordinator.organizationName}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[11px]">Nomor WhatsApp:</span>
                    <a
                      href={`https://wa.me/${targetCoordinator.phone.replace(/^0/, '62').replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {targetCoordinator.phone}
                    </a>
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] text-muted-foreground block font-medium">Nomor Rekening Tujuan:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black font-mono tracking-wider text-foreground">
                        {targetCoordinator.bankAccountNumber}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground">
                        (A.N. {targetCoordinator.bankAccountHolder})
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(targetCoordinator.bankAccountNumber, 'acc')}
                    className="h-7 text-xs font-semibold border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 gap-1.5"
                  >
                    {copiedAccNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedAccNumber ? 'Tersalin!' : 'Salin No. Rek'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-muted/20 border border-border/60 rounded-xl text-xs text-muted-foreground">
                ℹ️ Rute perjalanan ini belum terikat pada Master Koordinator spesifik. Anda tetap dapat melanjutkan transfer bank gelondongan.
              </div>
            )}

            {/* Box Ringkasan Nilai Transfer & Tombol Salin Nominal */}
            <div className="p-3.5 bg-amber-500/10 border border-amber-200 dark:border-amber-800/40 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Volume Perjalanan Terpilih:</span>
                <span className="font-mono font-bold text-foreground">
                  {selectedFeeIds.length} SPJ ({selectedTotalTickets} Tiket Penumpang)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-amber-200/50">
                <div>
                  <span className="text-foreground font-semibold block">Total Nominal Ditransfer:</span>
                  <span className="font-mono font-extrabold text-lg text-amber-700 dark:text-amber-300">
                    {formatRupiah(selectedTotalAmount)}
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(String(selectedTotalAmount), 'amount')}
                  className="h-7 text-xs font-semibold border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 gap-1.5"
                >
                  {copiedAmount ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedAmount ? 'Tersalin!' : 'Salin Nominal'}
                </Button>
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
                <span className="text-muted-foreground block text-[11px]">Penerima Korlap:</span>
                <span className="font-semibold text-foreground">{selectedBatchDetail?.coordinatorName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Rekening Asal Bank:</span>
                <span className="text-foreground">{selectedBatchDetail?.bankAccount?.name || 'Bank Kantor'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Total Ditransfer:</span>
                <span className="font-mono font-bold text-amber-700 dark:text-amber-300">
                  {formatRupiah(selectedBatchDetail?.totalAmount)}
                </span>
              </div>
            </div>

            {selectedBatchDetail?.coordinatorBankName && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs flex items-center justify-between">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Rekening Bank Tujuan Penerima:</span>
                  <span className="font-bold font-mono text-foreground">
                    {selectedBatchDetail.coordinatorBankName} - {selectedBatchDetail.coordinatorBankAccountNo}
                  </span>{' '}
                  <span className="text-muted-foreground font-semibold">
                    (A.N. {selectedBatchDetail.coordinatorBankAccountHolder})
                  </span>
                </div>
                {selectedBatchDetail.coordinatorPhone && (
                  <a
                    href={`https://wa.me/${selectedBatchDetail.coordinatorPhone.replace(/^0/, '62').replace(/\D/g, '')}?text=${encodeURIComponent(selectedBatchDetail.whatsappRemittanceText || '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
                  >
                    <Phone className="w-3.5 h-3.5" /> Kirim via WhatsApp
                  </a>
                )}
              </div>
            )}

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
      {/* MODAL 3: EDIT ATURAN TARIF & KOORDINATOR                  */}
      {/* ========================================================= */}
      <Dialog open={editRuleModalOpen} onOpenChange={setEditRuleModalOpen}>
        <DialogContent className="max-w-md bg-background border border-border/70 rounded-2xl shadow-xl p-5">
          <DialogHeader className="pb-3 border-b border-border/50">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              Edit Aturan Rute {selectedRule?.origin} &rarr; {selectedRule?.destination}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Ubah tarif rupiah per tiket dan tentukan koordinator lapangan penerima fee rute ini.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateRule} className="pt-3 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Koordinator Lapangan Penerima Transfer
              </Label>
              <Select
                value={inputRuleCoordinatorId}
                onValueChange={setInputRuleCoordinatorId}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Pilih Koordinator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE" className="text-xs text-muted-foreground">
                    -- Tanpa Koordinator Spesifik (Umum) --
                  </SelectItem>
                  {availableCoordinators.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      [{c.code}] {c.name} {c.organizationName ? `(${c.organizationName})` : ''} - {c.bankName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
