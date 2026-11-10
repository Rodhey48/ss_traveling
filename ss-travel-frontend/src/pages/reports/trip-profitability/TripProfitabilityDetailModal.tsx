import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  Bus,
  Receipt,
  FileText,
  AlertCircle,
  Loader2,
  DollarSign,
  ArrowRight,
  Building2,
  UtensilsCrossed,
  Coins,
  Fuel,
  Users,
  CheckCircle2,
  Wrench,
  Percent,
  Scale,
  Layers,
} from 'lucide-react';
import { ReportService } from '@/services/report.service';
import type { TripProfitabilityViewMode } from '@/types';

interface TripProfitabilityDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spjId: string | null;
  viewMode: TripProfitabilityViewMode;
}

export function TripProfitabilityDetailModal({
  open,
  onOpenChange,
  spjId,
  viewMode,
}: TripProfitabilityDetailModalProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['trip-profitability-detail', spjId, viewMode],
    queryFn: () => ReportService.getTripProfitabilityDetail(spjId!, viewMode),
    enabled: open && Boolean(spjId),
  });

  const detail = data?.data;
  const isPositive = detail?.info
    ? Number(detail.info.contributionMargin) >= 0
    : true;

  const defaultCostCenterCode =
    detail?.info.costCenterCode ||
    (detail?.info.serviceType === 'WISATA' ? 'CC-OPS-WISATA' : 'CC-OPS-AKAP');
  const defaultCostCenterName =
    detail?.info.costCenterName ||
    (detail?.info.serviceType === 'WISATA'
      ? 'Operasional Divisi Pariwisata'
      : 'Operasional Divisi AKAP');

  const gross = Number(detail?.info.grossRevenue) || 0;
  const totalCost = Number(detail?.info.totalDirectCost) || 0;
  const margin = Number(detail?.info.contributionMargin) || 0;
  const ratio = Number(detail?.info.contributionMarginRatio) || 0;

  const getPctOfGross = (cost: number) => {
    if (gross <= 0) return 0;
    return Math.min(100, Math.round((cost / gross) * 100));
  };

  const totalJurnalDebit = (detail?.journalEntries || []).reduce(
    (acc, curr) => acc + Number(curr.totalDebit || 0),
    0
  );
  const totalJurnalCredit = (detail?.journalEntries || []).reduce(
    (acc, curr) => acc + Number(curr.totalCredit || 0),
    0
  );
  const isJournalBalanced =
    detail && detail.journalEntries.length > 0
      ? Math.abs(totalJurnalDebit - totalJurnalCredit) < 1
      : true;

  const marginStatus =
    ratio >= 30
      ? {
          label: 'Margin Prima (≥ 30%)',
          color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400',
        }
      : ratio >= 0
      ? {
          label: 'Margin Wajar (0 - 29%)',
          color: 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400',
        }
      : {
          label: 'Defisit / Rugi (< 0%)',
          color: 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400',
        };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto p-6 sm:p-7">
        <DialogHeader className="border-b pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800">
                <Bus className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900 dark:text-zinc-100 flex flex-wrap items-center gap-2">
                  <span>{detail?.info?.spjNo || 'Audit Profitabilitas Perjalanan'}</span>
                  <Badge
                    variant="outline"
                    className="font-mono text-xs border-indigo-300 text-indigo-700 bg-indigo-50/70 dark:bg-indigo-950/40 dark:text-indigo-300 flex items-center gap-1"
                  >
                    <Building2 className="w-3 h-3" />
                    {defaultCostCenterCode}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={`text-xs font-semibold ${
                      detail?.info.serviceType === 'WISATA'
                        ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300'
                        : 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300'
                    }`}
                  >
                    {detail?.info.serviceType || 'TRIP'}
                  </Badge>
                  {detail?.info?.hasReplacement && (
                    <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300">
                      Armada Pengganti (Skenario 3)
                    </Badge>
                  )}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Sudut Pandang:{' '}
                  <span className="font-semibold text-foreground">
                    {viewMode === 'BY_JOURNEY_GROUP'
                      ? 'Kelompok Perjalanan Konsolidasi (Economic Journey Group)'
                      : 'Kinerja Bus Fisik Individual (Per Bus)'}
                  </span>{' '}
                  • Segmen: <strong className="text-foreground">{defaultCostCenterName}</strong>
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <span className="text-sm">Menyiapkan data audit profitabilitas &amp; jurnal...</span>
          </div>
        ) : !detail ? (
          <div className="text-center py-16 text-muted-foreground">
            <AlertCircle className="h-10 w-10 mx-auto text-amber-500 mb-2" />
            <p className="font-semibold">Data audit tidak ditemukan.</p>
            <p className="text-xs mt-1">Periksa kembali nomor SPJ atau izin akses Anda.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-5">
            {/* QUICK INFO STRIP */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 dark:bg-zinc-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Armada Bus</span>
                <span className="font-bold text-foreground text-sm">{detail.info.vehicleCode}</span>
                <span className="text-muted-foreground block font-mono text-[11px]">{detail.info.vehiclePlate}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Trayek &amp; Tanggal</span>
                <span className="font-semibold text-foreground block truncate">
                  {detail.info.origin} <ArrowRight className="inline h-3 w-3 text-muted-foreground mx-0.5" /> {detail.info.destination}
                </span>
                <span className="text-muted-foreground text-[11px] font-mono">{detail.info.departureDate}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Driver / Kru</span>
                <span className="font-semibold text-foreground block truncate">{detail.info.driverName || '-'}</span>
                <span className="text-muted-foreground text-[11px]">
                  {detail.info.serviceType === 'WISATA' ? 'Trip Sewa Khusus' : `${detail.info.paxCount} Penumpang`}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Cost Center</span>
                <span className="font-mono font-semibold text-foreground block">{defaultCostCenterCode}</span>
                <span className="text-[10px] text-muted-foreground truncate block">{defaultCostCenterName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Status SPJ</span>
                <Badge variant="outline" className="mt-1 font-semibold border-emerald-500/50 text-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/30">
                  {detail.info.status}
                </Badge>
              </div>
            </div>

            {/* TABBED INTERFACE */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="overview" className="text-xs flex items-center gap-1.5 py-2">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Ringkasan &amp; Margin</span>
                </TabsTrigger>
                <TabsTrigger value="breakdown" className="text-xs flex items-center gap-1.5 py-2">
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Pos Finansial ({detail.revenueDetails.length + detail.costDetails.length})</span>
                </TabsTrigger>
                <TabsTrigger value="journals" className="text-xs flex items-center gap-1.5 py-2">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Jurnal GL ({detail.journalEntries.length})</span>
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: RINGKASAN & MARGIN */}
              <TabsContent value="overview" className="space-y-5 mt-0">
                {/* 3 HERO KPI CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/20">
                    <div className="flex items-center justify-between text-blue-700 dark:text-blue-400 text-xs font-semibold mb-1">
                      <span>Omzet Bruto (Pendapatan)</span>
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <div className="text-xl font-bold font-mono text-blue-900 dark:text-blue-300">
                      Rp {gross.toLocaleString('id-ID')}
                    </div>
                    <div className="text-[11px] text-blue-600 dark:text-blue-400 font-mono mt-1">
                      {detail.info.serviceType === 'WISATA'
                        ? `Pelunasan Charter: Rp ${(Number(detail.info.charterRevenue) || gross).toLocaleString('id-ID')}`
                        : `Tiket: Rp ${Number(detail.info.ticketRevenue).toLocaleString('id-ID')} • Kargo: Rp ${Number(detail.info.cargoRevenue).toLocaleString('id-ID')}`}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-950/20">
                    <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 text-xs font-semibold mb-1">
                      <span>Total Beban Langsung</span>
                      <Receipt className="h-4 w-4" />
                    </div>
                    <div className="text-xl font-bold font-mono text-rose-900 dark:text-rose-300">
                      Rp {totalCost.toLocaleString('id-ID')}
                    </div>
                    <div className="text-[11px] text-rose-600 dark:text-rose-400 font-mono mt-1">
                      {gross > 0 ? `${Math.round((totalCost / gross) * 100)}% dari Omzet Bruto` : '0%'}
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-xl border ${
                      isPositive
                        ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-950/20'
                        : 'border-red-200 dark:border-red-900/40 bg-red-50/60 dark:bg-red-950/20'
                    }`}
                  >
                    <div
                      className={`flex items-center justify-between text-xs font-semibold mb-1 ${
                        isPositive ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
                      }`}
                    >
                      <span>Margin Kontribusi Bersih</span>
                      {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    </div>
                    <div className={`text-xl font-bold font-mono ${isPositive ? 'text-emerald-900 dark:text-emerald-300' : 'text-red-900 dark:text-red-300'}`}>
                      Rp {margin.toLocaleString('id-ID')}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        Rasio: <strong className={isPositive ? 'text-emerald-600' : 'text-red-600'}>{ratio}%</strong>
                      </span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-medium ${marginStatus.color}`}>
                        {marginStatus.label}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* STRUKTUR PENGELUARAN BIAYA LANGSUNG (6 COST DRIVERS) */}
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                      <Percent className="w-3.5 h-3.5 text-emerald-600" />
                      Struktur Komposisi Biaya Operasional (Share of Revenue)
                    </h4>
                    <span className="text-[11px] text-muted-foreground">
                      Total Beban: <strong className="text-foreground">Rp {totalCost.toLocaleString('id-ID')}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {/* 1. BBM */}
                    <div className="p-3 rounded-lg border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-zinc-800/40">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span className="flex items-center gap-1.5 font-medium text-foreground">
                          <Fuel className="w-3.5 h-3.5 text-amber-500" /> BBM Solar
                        </span>
                        <span className="font-mono font-semibold text-foreground text-[11px]">
                          {getPctOfGross(Number(detail.info.fuelCost))}%
                        </span>
                      </div>
                      <div className="text-sm font-bold font-mono text-foreground">
                        Rp {Number(detail.info.fuelCost).toLocaleString('id-ID')}
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-zinc-700 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${getPctOfGross(Number(detail.info.fuelCost))}%` }}
                        />
                      </div>
                    </div>

                    {/* 2. Hak Kru */}
                    <div className="p-3 rounded-lg border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-zinc-800/40">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span className="flex items-center gap-1.5 font-medium text-foreground">
                          <Users className="w-3.5 h-3.5 text-sky-500" /> Hak Kru &amp; Upah
                        </span>
                        <span className="font-mono font-semibold text-foreground text-[11px]">
                          {getPctOfGross(Number(detail.info.crewCost))}%
                        </span>
                      </div>
                      <div className="text-sm font-bold font-mono text-foreground">
                        Rp {Number(detail.info.crewCost).toLocaleString('id-ID')}
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-zinc-700 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-sky-500 rounded-full"
                          style={{ width: `${getPctOfGross(Number(detail.info.crewCost))}%` }}
                        />
                      </div>
                    </div>

                    {/* 3. Servis Makan RM */}
                    <div className="p-3 rounded-lg border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-zinc-800/40">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span className="flex items-center gap-1.5 font-medium text-foreground">
                          <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-500" /> Restoran Mitra (RM)
                        </span>
                        <span className="font-mono font-semibold text-foreground text-[11px]">
                          {getPctOfGross(Number(detail.info.mealCouponCost))}%
                        </span>
                      </div>
                      <div className="text-sm font-bold font-mono text-foreground">
                        Rp {Number(detail.info.mealCouponCost).toLocaleString('id-ID')}
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-zinc-700 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${getPctOfGross(Number(detail.info.mealCouponCost))}%` }}
                        />
                      </div>
                    </div>

                    {/* 4. Koordinasi Jalur */}
                    <div className="p-3 rounded-lg border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-zinc-800/40">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span className="flex items-center gap-1.5 font-medium text-foreground">
                          <Coins className="w-3.5 h-3.5 text-indigo-500" /> Koordinasi Jalur
                        </span>
                        <span className="font-mono font-semibold text-foreground text-[11px]">
                          {getPctOfGross(Number(detail.info.agentAndPartnerCost))}%
                        </span>
                      </div>
                      <div className="text-sm font-bold font-mono text-foreground">
                        Rp {Number(detail.info.agentAndPartnerCost).toLocaleString('id-ID')}
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-zinc-700 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${getPctOfGross(Number(detail.info.agentAndPartnerCost))}%` }}
                        />
                      </div>
                    </div>

                    {/* 5. Tol & Parkir */}
                    <div className="p-3 rounded-lg border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-zinc-800/40">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span className="flex items-center gap-1.5 font-medium text-foreground">
                          <Receipt className="w-3.5 h-3.5 text-blue-500" /> Tol &amp; Parkir
                        </span>
                        <span className="font-mono font-semibold text-foreground text-[11px]">
                          {getPctOfGross(Number(detail.info.tollAndParkingCost))}%
                        </span>
                      </div>
                      <div className="text-sm font-bold font-mono text-foreground">
                        Rp {Number(detail.info.tollAndParkingCost).toLocaleString('id-ID')}
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-zinc-700 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${getPctOfGross(Number(detail.info.tollAndParkingCost))}%` }}
                        />
                      </div>
                    </div>

                    {/* 6. Derek & Bengkel Insidental */}
                    <div className="p-3 rounded-lg border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-zinc-800/40">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span className="flex items-center gap-1.5 font-medium text-foreground">
                          <Wrench className="w-3.5 h-3.5 text-rose-500" /> Derek / Perbaikan
                        </span>
                        <span className="font-mono font-semibold text-foreground text-[11px]">
                          {getPctOfGross(Number(detail.info.incidentalRepairCost))}%
                        </span>
                      </div>
                      <div className="text-sm font-bold font-mono text-foreground">
                        Rp {Number(detail.info.incidentalRepairCost).toLocaleString('id-ID')}
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-zinc-700 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full"
                          style={{ width: `${getPctOfGross(Number(detail.info.incidentalRepairCost))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* CONSOLIDATION IF HAS REPLACEMENT */}
                {detail.relatedSpjs && detail.relatedSpjs.length > 1 && (
                  <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 p-4 rounded-xl text-xs space-y-2">
                    <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-amber-600" />
                      Konsolidasi Skenario 3 (Armada Pengganti Breakdown):
                    </span>
                    <p className="text-amber-800 dark:text-amber-300 text-[11px]">
                      Pendapatan tiket tetap utuh di perjalanan awal, sementara biaya operasional bus pengganti digabungkan untuk mencerminkan profitabilitas perjalanan sebenarnya.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {detail.relatedSpjs.map((r) => (
                        <Badge
                          key={r.id}
                          variant="secondary"
                          className="bg-white dark:bg-zinc-800 border border-amber-300 text-amber-900 dark:text-amber-200 font-mono py-1 px-2.5"
                        >
                          {r.role === 'PARENT' ? 'Armada Utama: ' : 'Armada Pengganti: '}
                          <strong className="ml-1">{r.vehicleCode}</strong> ({r.spjNo})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* TAB 2: RINCIAN POS PENDAPATAN & BEBAN */}
              <TabsContent value="breakdown" className="space-y-5 mt-0">
                {/* 1. SEKSI PENDAPATAN */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                      <DollarSign className="h-4 w-4 text-emerald-600" />
                      Pos Pendapatan Operasional
                    </h4>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      Subtotal: + Rp {gross.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden text-xs bg-white dark:bg-zinc-900">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-zinc-900/80 text-muted-foreground border-b border-slate-200 dark:border-white/10 font-semibold text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3.5">Sumber Pendapatan</th>
                          <th className="py-2.5 px-3">Cost Center</th>
                          <th className="py-2.5 px-3">Keterangan</th>
                          <th className="py-2.5 px-3.5 text-right">Nominal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {detail.revenueDetails.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center py-6 text-muted-foreground italic">
                              Tidak ada rincian pos pendapatan terdaftar.
                            </td>
                          </tr>
                        ) : (
                          detail.revenueDetails.map((rev, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                              <td className="py-2.5 px-3.5 font-semibold text-foreground">
                                {rev.source}
                              </td>
                              <td className="py-2.5 px-3">
                                <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground">
                                  {rev.costCenterCode || defaultCostCenterCode}
                                </Badge>
                              </td>
                              <td className="py-2.5 px-3 text-muted-foreground truncate max-w-[240px]">
                                {rev.description}
                              </td>
                              <td className="py-2.5 px-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                + Rp {Number(rev.amount).toLocaleString('id-ID')}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. SEKSI BEBAN OPERASIONAL */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                      <Receipt className="h-4 w-4 text-rose-600" />
                      Pos Beban Langsung Operasional (SPJ Direct Cost)
                    </h4>
                    <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                      Subtotal: - Rp {totalCost.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden text-xs bg-white dark:bg-zinc-900">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-zinc-900/80 text-muted-foreground border-b border-slate-200 dark:border-white/10 font-semibold text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3.5">Kategori Beban</th>
                          <th className="py-2.5 px-3">Kode &amp; Akun COA</th>
                          <th className="py-2.5 px-3">Cost Center</th>
                          <th className="py-2.5 px-3">Keterangan Transaksi</th>
                          <th className="py-2.5 px-3.5 text-right">Nominal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {detail.costDetails.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-6 text-muted-foreground italic">
                              Tidak ada rincian beban langsung terdaftar.
                            </td>
                          </tr>
                        ) : (
                          detail.costDetails.map((c, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                              <td className="py-2.5 px-3.5 font-semibold text-foreground flex items-center gap-1.5">
                                {c.accountCode === '51101' ? (
                                  <Fuel className="w-3.5 h-3.5 text-amber-500" />
                                ) : c.accountCode === '51102' ? (
                                  <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-500" />
                                ) : c.accountCode === '52105' ? (
                                  <Coins className="w-3.5 h-3.5 text-indigo-500" />
                                ) : c.accountCode === '53101' ? (
                                  <Users className="w-3.5 h-3.5 text-sky-500" />
                                ) : c.accountCode === '55101' ? (
                                  <Wrench className="w-3.5 h-3.5 text-rose-500" />
                                ) : (
                                  <Receipt className="w-3.5 h-3.5 text-blue-500" />
                                )}
                                <span>{c.category}</span>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-muted-foreground text-[11px]">
                                <span className="font-bold text-foreground">{c.accountCode}</span> - {c.accountName}
                              </td>
                              <td className="py-2.5 px-3">
                                <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground">
                                  {c.costCenterCode || defaultCostCenterCode}
                                </Badge>
                              </td>
                              <td className="py-2.5 px-3 text-muted-foreground truncate max-w-[200px]">
                                {c.description}
                              </td>
                              <td className="py-2.5 px-3.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                                - Rp {Number(c.amount).toLocaleString('id-ID')}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* BOTTOM WATERFALL EQUATION */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-900/60 flex flex-wrap items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-emerald-600" />
                    <span className="font-medium text-muted-foreground">Rekapitulasi:</span>
                    <span className="font-mono font-semibold text-blue-600">
                      Omzet Rp {gross.toLocaleString('id-ID')}
                    </span>
                    <span className="text-muted-foreground">-</span>
                    <span className="font-mono font-semibold text-rose-600">
                      Beban Rp {totalCost.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="text-muted-foreground">Net Margin:</span>
                    <span className={`font-mono text-sm ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      Rp {margin.toLocaleString('id-ID')} ({ratio}%)
                    </span>
                  </div>
                </div>
              </TabsContent>

              {/* TAB 3: JURNAL GL */}
              <TabsContent value="journals" className="space-y-4 mt-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200 dark:border-white/10 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 ${isJournalBalanced ? 'text-emerald-600' : 'text-amber-500'}`} />
                    <span className="font-semibold text-foreground">
                      Double-Entry Posting Integrity:
                    </span>
                    <Badge variant="outline" className={isJournalBalanced ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50'}>
                      {isJournalBalanced ? 'Seimbang (Balance)' : 'Discrepancy'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-muted-foreground">
                    <span>Total Debit: <strong className="text-foreground">Rp {totalJurnalDebit.toLocaleString('id-ID')}</strong></span>
                    <span>•</span>
                    <span>Total Kredit: <strong className="text-foreground">Rp {totalJurnalCredit.toLocaleString('id-ID')}</strong></span>
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden text-xs bg-white dark:bg-zinc-900">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-zinc-900/80 text-muted-foreground border-b border-slate-200 dark:border-white/10 font-semibold text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3.5">No Jurnal</th>
                        <th className="py-2.5 px-3">Tanggal</th>
                        <th className="py-2.5 px-3">Sumber Transaksi</th>
                        <th className="py-2.5 px-3">Cost Center</th>
                        <th className="py-2.5 px-3">Keterangan / Uraian</th>
                        <th className="py-2.5 px-3.5 text-right">Debit / Kredit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {detail.journalEntries.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-muted-foreground italic">
                            Belum ada entri jurnal terposting untuk perjalanan ini.
                          </td>
                        </tr>
                      ) : (
                        detail.journalEntries.map((j) => (
                          <tr key={j.journalId} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                            <td className="py-2.5 px-3.5 font-mono font-bold text-foreground">
                              {j.journalNo}
                            </td>
                            <td className="py-2.5 px-3 text-muted-foreground font-mono text-[11px]">
                              {j.journalDate}
                            </td>
                            <td className="py-2.5 px-3">
                              <Badge variant="outline" className="font-mono text-[10px]">
                                {j.sourceType}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-3">
                              <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground">
                                {j.costCenterCode || defaultCostCenterCode}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-3 text-muted-foreground truncate max-w-[220px]">
                              {j.description}
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-mono font-semibold text-foreground">
                              Rp {Number(j.totalDebit).toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        <div className="border-t pt-4 flex items-center justify-between mt-6">
          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Sistem Keuangan Terpadu SS Travel • Standard Akuntansi Anti-Netting</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
