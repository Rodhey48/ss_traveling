import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  Bus,
  Search,
  RefreshCw,
  Eye,
  DollarSign,
  Receipt,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ReportService } from '@/services/report.service';
import { TripProfitabilityDetailModal } from './TripProfitabilityDetailModal';
import type { TripProfitabilityViewMode, TripServiceType } from '@/types';

export default function TripProfitabilityPage() {
  const [viewMode, setViewMode] = useState<TripProfitabilityViewMode>('BY_JOURNEY_GROUP');
  const [serviceType, setServiceType] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [selectedSpjId, setSelectedSpjId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['trip-profitability', viewMode, serviceType, search, startDate, endDate],
    queryFn: () =>
      ReportService.getTripProfitability({
        viewMode,
        serviceType: serviceType === 'ALL' ? undefined : (serviceType as TripServiceType),
        search: search || undefined,
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
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Laporan Profitabilitas & Margin Trip SPJ
              </h1>
              <p className="text-sm text-gray-500">
                Analisis margin kontribusi perjalanan armada bus (AKAP & Pariwisata) PT SS Traveling Official
              </p>
            </div>
          </div>
        </div>

        {/* TOGGLE SUDUT PANDANG */}
        <div className="flex items-center bg-gray-100 p-1.5 rounded-xl border border-gray-200">
          <Button
            size="sm"
            variant={viewMode === 'BY_JOURNEY_GROUP' ? 'default' : 'ghost'}
            className={
              viewMode === 'BY_JOURNEY_GROUP'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-xs'
                : 'text-gray-600 hover:text-gray-900 text-xs'
            }
            onClick={() => setViewMode('BY_JOURNEY_GROUP')}
          >
            <Layers className="h-3.5 w-3.5 mr-1.5" />
            Per Kelompok Perjalanan
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'BY_BUS' ? 'default' : 'ghost'}
            className={
              viewMode === 'BY_BUS'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-xs'
                : 'text-gray-600 hover:text-gray-900 text-xs'
            }
            onClick={() => setViewMode('BY_BUS')}
          >
            <Bus className="h-3.5 w-3.5 mr-1.5" />
            Per Bus Fisik
          </Button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Total Omzet Bruto
              </p>
              <h3 className="text-2xl font-extrabold text-blue-900 mt-1">
                Rp {summary ? Number(summary.totalRevenue).toLocaleString('id-ID') : '0'}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Tiket + Kargo + Charter</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <DollarSign className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Total Biaya Langsung SPJ
              </p>
              <h3 className="text-2xl font-extrabold text-rose-900 mt-1">
                Rp {summary ? Number(summary.totalDirectCost).toLocaleString('id-ID') : '0'}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">BBM, Tol, RM, Hak Kru</p>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
              <Receipt className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Margin Kontribusi Bersih
              </p>
              <h3
                className={`text-2xl font-extrabold mt-1 ${
                  summary && Number(summary.totalContributionMargin) >= 0
                    ? 'text-emerald-700'
                    : 'text-red-700'
                }`}
              >
                Rp {summary ? Number(summary.totalContributionMargin).toLocaleString('id-ID') : '0'}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Laba Bruto SPJ Armada</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <TrendingUp className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Rata-Rata Rasio Margin
              </p>
              <h3 className="text-2xl font-extrabold text-emerald-900 mt-1">
                {summary?.averageMarginRatio ?? 0}%
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Dari {summary?.totalTrips ?? 0} Perjalanan</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <Sparkles className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* BANNER EDUKASI SKENARIO 3 */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-4 rounded-xl flex items-start gap-3">
        <div className="p-1.5 bg-emerald-600 text-white rounded-lg mt-0.5">
          <Layers className="h-4 w-4" />
        </div>
        <div className="text-xs text-emerald-900 space-y-1">
          <p className="font-bold">
            Pedoman Standar Blueprint Keuangan Bus (Skenario 3 — Konsolidasi Perjalanan Ekonomi):
          </p>
          <p className="text-emerald-800 leading-relaxed">
            Pada mode <strong>Per Kelompok Perjalanan</strong>, SPJ Induk (armada breakdown di jalan) dan SPJ Pengganti
            dikonsolidasikan menjadi 1 unit ekonomi perjalanan yang utuh. Omzet tiket digabungkan dengan total solar, tol,
            uang makan kru, serta beban derek darurat untuk menyajikan margin kontribusi rute yang sebenarnya tanpa distorsi.
          </p>
        </div>
      </div>

      {/* TOOLBAR FILTER */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari No SPJ / Armada / Rute..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <Select value={serviceType} onValueChange={setServiceType}>
            <SelectTrigger className="w-36 h-9 text-xs">
              <SelectValue placeholder="Layanan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Layanan</SelectItem>
              <SelectItem value="AKAP">AKAP Reguler</SelectItem>
              <SelectItem value="WISATA">Pariwisata / Charter</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 text-xs w-36"
            />
            <span className="text-gray-400 text-xs">s/d</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 text-xs w-36"
            />
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          disabled={isLoading}
          className="text-xs h-9 shrink-0 gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Segarkan Data
        </Button>
      </div>

      {/* TABEL PROFITABILITAS PERJALANAN */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">No SPJ / Perjalanan</th>
                <th className="py-3 px-4">Layanan</th>
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
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-gray-500">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    <span>Mengkalkulasi margin kontribusi perjalanan...</span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-gray-400">
                    Tidak ada data perjalanan ditemukan untuk filter yang dipilih.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isMarginPositive = Number(item.contributionMargin) >= 0;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900 font-mono flex items-center gap-1.5">
                          <span>{item.spjNo}</span>
                          {item.hasReplacement && (
                            <Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-700 text-[10px]">
                              Penggantian
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500">{item.driverName}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          variant="secondary"
                          className={
                            item.serviceType === 'AKAP'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-purple-50 text-purple-700 border-purple-200'
                          }
                        >
                          {item.serviceType}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">{item.vehicleCode}</div>
                        <div className="text-[11px] text-gray-500">{item.vehiclePlate}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-gray-800">
                          {item.origin} <ArrowRight className="inline h-3 w-3 text-gray-400 mx-0.5" /> {item.destination}
                        </div>
                        <div className="text-[11px] text-gray-500">{item.paxCount} Penumpang</div>
                      </td>

                      <td className="py-3.5 px-4 text-gray-600">{item.departureDate}</td>

                      <td className="py-3.5 px-4 text-right font-bold text-blue-900">
                        Rp {Number(item.grossRevenue).toLocaleString('id-ID')}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-rose-800">
                        Rp {Number(item.totalDirectCost).toLocaleString('id-ID')}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`font-extrabold ${
                            isMarginPositive ? 'text-emerald-700' : 'text-red-700'
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
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold'
                              : item.contributionMarginRatio >= 10
                                ? 'border-amber-500 bg-amber-50 text-amber-700 font-bold'
                                : 'border-rose-500 bg-rose-50 text-rose-700 font-bold'
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
                          className="h-8 px-2.5 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 gap-1 text-xs"
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
