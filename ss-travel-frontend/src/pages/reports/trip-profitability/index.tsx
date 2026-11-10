import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ReportService } from '@/services/report.service';
import {
  MetricCardGridSkeleton,
  TableSkeletonRows,
} from '@/components/shared/skeleton-loaders';
import type { TripProfitabilityViewMode, TripServiceType, CostCenter } from '@/types';
import { OrganizationService } from '@/services/organization.service';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Bus,
  DollarSign,
  Eye,
  Layers,
  Receipt,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  X,
  RotateCcw,
  Building2,
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { TripProfitabilityDetailModal } from './TripProfitabilityDetailModal';

export default function TripProfitabilityPage() {
  const [viewMode, setViewMode] = useState<TripProfitabilityViewMode>('BY_JOURNEY_GROUP');
  const [serviceType, setServiceType] = useState<string>('ALL');
  const [selectedCostCenterId, setSelectedCostCenterId] = useState<string>('ALL');
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [selectedSpjId, setSelectedSpjId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Debounced search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load Cost Centers
  const { data: ccData } = useQuery({
    queryKey: ['cost-centers-list'],
    queryFn: () => OrganizationService.getCostCenters(),
  });
  const costCenters = (ccData?.data as CostCenter[]) || [];

  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      'trip-profitability',
      viewMode,
      serviceType,
      selectedCostCenterId,
      debouncedSearch,
      startDate,
      endDate,
    ],
    queryFn: () =>
      ReportService.getTripProfitability({
        viewMode,
        serviceType: serviceType === 'ALL' ? undefined : (serviceType as TripServiceType),
        costCenterId: selectedCostCenterId === 'ALL' ? undefined : selectedCostCenterId,
        search: debouncedSearch || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
  });

  const reportData = data?.data;
  const summary = reportData?.summary;
  const items = reportData?.items || [];

  const handleOpenDetail = (id: string) => {
    setSelectedSpjId(id);
    setDetailModalOpen(true);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setServiceType('ALL');
    setSelectedCostCenterId('ALL');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = useMemo(() => {
    return (
      debouncedSearch !== '' ||
      serviceType !== 'ALL' ||
      selectedCostCenterId !== 'ALL' ||
      startDate !== '' ||
      endDate !== ''
    );
  }, [debouncedSearch, serviceType, selectedCostCenterId, startDate, endDate]);

  return (
    <div className="space-y-6 p-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Laporan Profitabilitas &amp; Margin Trip SPJ
              </h1>
              <p className="text-sm text-muted-foreground">
                Analisis margin kontribusi perjalanan armada bus (AKAP &amp; Pariwisata) PT SS Travelink Official
              </p>
            </div>
          </div>
        </div>

        {/* TOGGLE SUDUT PANDANG */}
        <div className="tabs-container-pill">
          <Button
            size="sm"
            variant={viewMode === 'BY_JOURNEY_GROUP' ? 'default' : 'ghost'}
            className="text-xs px-3.5 py-1.5 gap-1.5"
            onClick={() => setViewMode('BY_JOURNEY_GROUP')}
          >
            <Layers className="h-3.5 w-3.5" />
            Per Kelompok Perjalanan
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'BY_BUS' ? 'default' : 'ghost'}
            className="text-xs px-3.5 py-1.5 gap-1.5"
            onClick={() => setViewMode('BY_BUS')}
          >
            <Bus className="h-3.5 w-3.5" />
            Per Bus Fisik
          </Button>
        </div>
      </div>

      {/* METRIC CARDS */}
      {isLoading ? (
        <MetricCardGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md shadow-xs border-l-4 border-l-blue-600">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Omzet Bruto
                </p>
                <h3 className="text-2xl font-extrabold font-mono text-blue-900 dark:text-blue-300 mt-1">
                  Rp {summary ? Number(summary.totalRevenue).toLocaleString('id-ID') : '0'}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Tiket + Kargo + Charter</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-900/40">
                <DollarSign className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md shadow-xs border-l-4 border-l-rose-600">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Biaya Langsung SPJ
                </p>
                <h3 className="text-2xl font-extrabold font-mono text-rose-900 dark:text-rose-300 mt-1">
                  Rp {summary ? Number(summary.totalDirectCost).toLocaleString('id-ID') : '0'}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">BBM, Tol, RM, Hak Kru</p>
              </div>
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-100 dark:border-rose-900/40">
                <Receipt className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md shadow-xs border-l-4 border-l-emerald-600">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Margin Kontribusi Bersih
                </p>
                <h3
                  className={`text-2xl font-extrabold font-mono mt-1 ${
                    summary && Number(summary.totalContributionMargin) >= 0
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-red-700 dark:text-red-400'
                  }`}
                >
                  Rp {summary ? Number(summary.totalContributionMargin).toLocaleString('id-ID') : '0'}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Laba Bruto SPJ Armada</p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                <TrendingUp className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md shadow-xs border-l-4 border-l-amber-600">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Rata-Rata Rasio Margin
                </p>
                <h3 className="text-2xl font-extrabold font-mono text-emerald-900 dark:text-emerald-300 mt-1">
                  {summary?.averageMarginRatio ?? 0}%
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Dari {summary?.totalTrips ?? 0} Perjalanan</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-100 dark:border-amber-900/40">
                <Sparkles className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* BANNER EDUKASI SKENARIO 3 */}
      <div className="bg-linear-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800/40 p-4 rounded-xl flex items-start gap-3 shadow-2xs">
        <div className="p-1.5 bg-emerald-600 text-white rounded-lg mt-0.5 shrink-0">
          <Layers className="h-4 w-4" />
        </div>
        <div className="text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
          <p className="font-bold text-sm">
            Pedoman Standar Blueprint Keuangan Bus (Skenario 3 — Konsolidasi Perjalanan Ekonomi):
          </p>
          <p className="text-emerald-800 dark:text-emerald-300/90 leading-relaxed">
            Pada mode <strong>Per Kelompok Perjalanan</strong>, SPJ Induk (armada breakdown di jalan) dan SPJ Pengganti
            dikonsolidasikan menjadi 1 unit ekonomi perjalanan yang utuh. Omzet tiket digabungkan dengan total solar, tol,
            uang makan kru, serta beban derek darurat untuk menyajikan margin kontribusi rute yang sebenarnya tanpa distorsi.
          </p>
        </div>
      </div>

      {/* TOOLBAR FILTER */}
      <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md p-4 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari No SPJ / Armada / Rute..."
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

          <Select value={serviceType} onValueChange={setServiceType}>
            <SelectTrigger className="w-36 h-8.5 text-xs">
              <SelectValue placeholder="Layanan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">Semua Layanan</SelectItem>
              <SelectItem value="AKAP" className="text-xs">AKAP Reguler</SelectItem>
              <SelectItem value="WISATA" className="text-xs">Pariwisata / Charter</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter Cost Center */}
          <Select value={selectedCostCenterId} onValueChange={setSelectedCostCenterId}>
            <SelectTrigger className="w-48 h-8.5 text-xs">
              <Building2 className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Cost Center" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs font-semibold">Semua Cost Center</SelectItem>
              {costCenters.map((cc) => (
                <SelectItem key={cc.id} value={cc.id} className="text-xs">
                  {cc.code} - {cc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8.5 text-xs w-36"
            />
            <span className="text-muted-foreground text-xs">s/d</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8.5 text-xs w-36"
            />
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-8.5 text-xs px-2.5 text-muted-foreground hover:text-foreground gap-1"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Filter
            </Button>
          )}
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          disabled={isLoading}
          className="text-xs h-8.5 shrink-0 gap-1.5 self-end md:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Segarkan Data
        </Button>
      </div>

      {/* TABEL PROFITABILITAS PERJALANAN */}
      <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10 text-muted-foreground font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">No SPJ / Perjalanan</th>
                <th className="py-3 px-4">Layanan &amp; Cost Center</th>
                <th className="py-3 px-4">Armada Bus</th>
                <th className="py-3 px-4">Rute Trayek</th>
                <th className="py-3 px-4">Keberangkatan</th>
                <th className="py-3 px-4 text-right">Omzet Bruto</th>
                <th className="py-3 px-4 text-right">Beban Langsung</th>
                <th className="py-3 px-4 text-right">Margin Kontribusi</th>
                <th className="py-3 px-4 text-center">% Margin</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {isLoading ? (
                <TableSkeletonRows
                  rows={6}
                  colWidths={[
                    'w-28',
                    'w-24',
                    'w-20',
                    'w-36',
                    'w-24',
                    'w-24 ml-auto',
                    'w-24 ml-auto',
                    'w-24 ml-auto',
                    'w-16 mx-auto',
                    'w-20 mx-auto',
                    'w-12 mx-auto',
                  ]}
                />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="p-3 rounded-full bg-primary/10 text-primary">
                        <TrendingUp className="h-8 w-8 opacity-60" />
                      </div>
                      <p className="font-semibold text-foreground">
                        Tidak ada data perjalanan ditemukan
                      </p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {hasActiveFilters
                          ? 'Tidak ada data margin perjalanan yang cocok dengan kriteria filter Anda.'
                          : 'Perjalanan SPJ yang telah selesai direkonsiliasi akan otomatis teranalisis di sini.'}
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
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isMarginPositive = Number(item.contributionMargin) >= 0;
                  const ccCode = item.costCenterCode || (item.serviceType === 'WISATA' ? 'CC-OPS-WISATA' : 'CC-OPS-AKAP');

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-foreground font-mono flex items-center gap-1.5">
                          <span>{item.spjNo}</span>
                          {item.hasReplacement && (
                            <Badge variant="outline" className="border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[10px]">
                              Penggantian
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground">{item.driverName}</div>
                      </td>

                      <td className="py-3.5 px-4 space-y-1">
                        <div>
                          <Badge
                            variant="secondary"
                            className={
                              item.serviceType === 'AKAP'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/60 text-[11px]'
                                : 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800/60 text-[11px]'
                            }
                          >
                            {item.serviceType}
                          </Badge>
                        </div>
                        <div className="font-mono text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span>{ccCode}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-foreground">{item.vehicleCode}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">{item.vehiclePlate}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-foreground">
                          {item.origin} <ArrowRight className="inline h-3 w-3 text-muted-foreground mx-0.5" /> {item.destination}
                        </div>
                        <div className="text-[11px] text-muted-foreground">{item.paxCount} Penumpang</div>
                      </td>

                      <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">{item.departureDate}</td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold font-mono text-blue-900 dark:text-blue-300">
                          Rp {Number(item.grossRevenue).toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {item.serviceType === 'WISATA'
                            ? `Charter: Rp ${Number(item.charterRevenue || item.grossRevenue).toLocaleString('id-ID')}`
                            : `Tiket: Rp ${Number(item.ticketRevenue).toLocaleString('id-ID')}`}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold font-mono text-rose-800 dark:text-rose-400">
                          Rp {Number(item.totalDirectCost).toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          BBM: Rp {Number(item.fuelCost).toLocaleString('id-ID')} • Kru: Rp {Number(item.crewCost).toLocaleString('id-ID')}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono">
                        <span
                          className={`font-extrabold ${
                            isMarginPositive ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
                          }`}
                        >
                          Rp {Number(item.contributionMargin).toLocaleString('id-ID')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Badge
                          variant="outline"
                          className={
                            item.contributionMarginRatio >= 30
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold'
                              : item.contributionMarginRatio >= 10
                              ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold'
                              : 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold'
                          }
                        >
                          {item.contributionMarginRatio}%
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                          {item.status}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenDetail(item.id)}
                          className="h-7.5 px-2.5 text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 gap-1 text-xs"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Audit</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER BAR */}
        <div className="p-3.5 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-zinc-900/60 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Menampilkan <strong className="text-foreground">{items.length}</strong> perjalanan dinas armada
          </span>
          <span className="font-mono text-[11px]">
            Mode: {viewMode === 'BY_JOURNEY_GROUP' ? 'Konsolidasi Kelompok Perjalanan' : 'Armada Fisik Individual'}
          </span>
        </div>
      </div>

      {/* DETAIL MODAL */}
      <TripProfitabilityDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        spjId={selectedSpjId}
        viewMode={viewMode}
      />
    </div>
  );
}
