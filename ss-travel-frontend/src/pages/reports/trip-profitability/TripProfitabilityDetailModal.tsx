import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                <Bus className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span>{detail?.info?.spjNo || 'Audit Profitabilitas Perjalanan'}</span>
                  {detail?.info?.hasReplacement && (
                    <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50">
                      Armada Pengganti (Skenario 3)
                    </Badge>
                  )}
                </DialogTitle>
                <p className="text-xs text-gray-500 mt-1">
                  Sudut Pandang:{' '}
                  <span className="font-semibold text-gray-700">
                    {viewMode === 'BY_JOURNEY_GROUP'
                      ? 'Kelompok Perjalanan Konsolidasi (Economic Journey Group)'
                      : 'Kinerja Bus Fisik Individual (Per Bus)'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-gray-500 gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            <span>Memuat audit rincian finansial...</span>
          </div>
        ) : !detail ? (
          <div className="text-center py-12 text-gray-500">
            <AlertCircle className="h-8 w-8 mx-auto text-amber-500 mb-2" />
            <span>Data tidak ditemukan.</span>
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4 mt-2">
            <div className="space-y-6">
              {/* ARMADA & RUTE HIGHLIGHT */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-xs">
                <div>
                  <span className="text-gray-500 block">Armada Bus</span>
                  <span className="font-bold text-gray-800 text-sm">{detail.info.vehicleCode}</span>
                  <span className="text-gray-500 block">{detail.info.vehiclePlate}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Trayek / Rute</span>
                  <span className="font-semibold text-gray-800 block">
                    {detail.info.origin} <ArrowRight className="inline h-3 w-3" /> {detail.info.destination}
                  </span>
                  <span className="text-gray-500">Tanggal: {detail.info.departureDate}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Driver / Kru</span>
                  <span className="font-semibold text-gray-800 block">{detail.info.driverName}</span>
                  <span className="text-gray-500">{detail.info.paxCount} Penumpang</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Status Finansial</span>
                  <Badge variant="outline" className="mt-1 font-semibold border-emerald-500 text-emerald-700 bg-emerald-50">
                    {detail.info.status}
                  </Badge>
                </div>
              </div>

              {/* STAT KARTU REVENUE VS COST VS MARGIN */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/60">
                  <div className="flex items-center justify-between text-blue-700 text-xs font-semibold mb-1">
                    <span>Omzet Bruto (Pendapatan)</span>
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <div className="text-xl font-bold text-blue-900">
                    Rp {Number(detail.info.grossRevenue).toLocaleString('id-ID')}
                  </div>
                  <div className="text-[11px] text-blue-600 mt-1">
                    Tiket: Rp {Number(detail.info.ticketRevenue).toLocaleString('id-ID')} | Kargo: Rp {Number(detail.info.cargoRevenue).toLocaleString('id-ID')}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/60">
                  <div className="flex items-center justify-between text-rose-700 text-xs font-semibold mb-1">
                    <span>Total Beban Langsung SPJ</span>
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div className="text-xl font-bold text-rose-900">
                    Rp {Number(detail.info.totalDirectCost).toLocaleString('id-ID')}
                  </div>
                  <div className="text-[11px] text-rose-600 mt-1">
                    BBM, Tol, RM, Hak Kru & Perbaikan Darurat
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl border ${
                    isPositive ? 'border-emerald-200 bg-emerald-50/60' : 'border-red-200 bg-red-50/60'
                  }`}
                >
                  <div
                    className={`flex items-center justify-between text-xs font-semibold mb-1 ${
                      isPositive ? 'text-emerald-700' : 'text-red-700'
                    }`}
                  >
                    <span>Margin Kontribusi Bersih</span>
                    {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  </div>
                  <div className={`text-xl font-bold ${isPositive ? 'text-emerald-900' : 'text-red-900'}`}>
                    Rp {Number(detail.info.contributionMargin).toLocaleString('id-ID')}
                  </div>
                  <div
                    className={`text-[11px] font-semibold mt-1 ${
                      isPositive ? 'text-emerald-700' : 'text-red-700'
                    }`}
                  >
                    Rasio Margin: {detail.info.contributionMarginRatio}%
                  </div>
                </div>
              </div>

              {/* RELATED SPJS IF CONSOLIDATION */}
              {detail.relatedSpjs && detail.relatedSpjs.length > 1 && (
                <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-xl text-xs">
                  <span className="font-bold text-amber-900 block mb-1">
                    Armada & SPJ yang Terkonsolidasi dalam Perjalanan Ini:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {detail.relatedSpjs.map((r) => (
                      <Badge
                        key={r.id}
                        variant="secondary"
                        className="bg-white border border-amber-300 text-amber-900 font-mono py-1 px-2.5"
                      >
                        {r.role === 'PARENT' ? 'Armada Utama: ' : 'Armada Pengganti: '}
                        <strong className="ml-1">{r.vehicleCode}</strong> ({r.spjNo})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* RINCIAN POS PENDAPATAN */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  Rincian Pos Pendapatan Operasional
                </h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-gray-100 text-gray-600 border-b border-gray-200">
                      <tr>
                        <th className="py-2.5 px-3">Pos Akun / Sumber</th>
                        <th className="py-2.5 px-3">Keterangan</th>
                        <th className="py-2.5 px-3 text-right">Nominal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {detail.revenueDetails.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center py-4 text-gray-400">
                            Tidak ada rincian pendapatan jurnal terposting.
                          </td>
                        </tr>
                      ) : (
                        detail.revenueDetails.map((rev, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="py-2 px-3 font-medium text-gray-800">{rev.source}</td>
                            <td className="py-2 px-3 text-gray-600">{rev.description}</td>
                            <td className="py-2 px-3 text-right font-bold text-emerald-600">
                              + Rp {Number(rev.amount).toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* RINCIAN POS BEBAN OPERASIONAL */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                  <Receipt className="h-4 w-4 text-rose-600" />
                  Rincian Pos Biaya Langsung Operasional (Beban SPJ)
                </h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-gray-100 text-gray-600 border-b border-gray-200">
                      <tr>
                        <th className="py-2.5 px-3">Kategori Beban</th>
                        <th className="py-2.5 px-3">Akun COA</th>
                        <th className="py-2.5 px-3">Keterangan Transaksi</th>
                        <th className="py-2.5 px-3 text-right">Nominal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {detail.costDetails.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-4 text-gray-400">
                            Tidak ada rincian beban langsung terposting.
                          </td>
                        </tr>
                      ) : (
                        detail.costDetails.map((c, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="py-2 px-3 font-semibold text-gray-800">{c.category}</td>
                            <td className="py-2 px-3 font-mono text-gray-500">
                              {c.accountCode} - {c.accountName}
                            </td>
                            <td className="py-2 px-3 text-gray-600">{c.description}</td>
                            <td className="py-2 px-3 text-right font-bold text-rose-600">
                              - Rp {Number(c.amount).toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* DOKUMEN JURNAL AKUNTANSI TERPOSTING */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Jurnal Terposting (Double-Entry Posting Records)
                </h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-gray-100 text-gray-600 border-b border-gray-200">
                      <tr>
                        <th className="py-2.5 px-3">No Jurnal</th>
                        <th className="py-2.5 px-3">Tanggal</th>
                        <th className="py-2.5 px-3">Sumber Transaksi</th>
                        <th className="py-2.5 px-3">Keterangan</th>
                        <th className="py-2.5 px-3 text-right">Debit / Kredit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {detail.journalEntries.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-4 text-gray-400">
                            Belum ada entri jurnal terposting untuk perjalanan ini.
                          </td>
                        </tr>
                      ) : (
                        detail.journalEntries.map((j) => (
                          <tr key={j.journalId} className="hover:bg-gray-50/50">
                            <td className="py-2 px-3 font-mono font-bold text-gray-800">{j.journalNo}</td>
                            <td className="py-2 px-3 text-gray-600">{j.journalDate}</td>
                            <td className="py-2 px-3">
                              <Badge variant="outline" className="font-mono text-[10px]">
                                {j.sourceType}
                              </Badge>
                            </td>
                            <td className="py-2 px-3 text-gray-600">{j.description}</td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-gray-700">
                              Rp {Number(j.totalDebit).toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </ScrollArea>
        )}

        <div className="border-t pt-3 flex justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
