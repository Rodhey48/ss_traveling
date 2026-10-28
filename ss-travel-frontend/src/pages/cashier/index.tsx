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
  Wallet,
  Receipt,
  Search,
  RotateCcw,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Coins,
  Bus,
  ArrowRight,
  ShieldAlert,
  Printer,
  Lock,
} from 'lucide-react';
import { CashierService } from '@/services/cashier.service';
import { CashierSettlementModal } from './components/CashierSettlementModal';
import { DiscrepancyResolutionModal } from './components/DiscrepancyResolutionModal';
import { CashReceiptVoucherModal } from './components/CashReceiptVoucherModal';
import { CreateDiscrepancyModal } from './components/CreateDiscrepancyModal';
import type {
  CrewCashSettlement,
  CrewCashDiscrepancy,
  SettlementSummary,
} from '@/types';
import { toast } from 'sonner';

export default function CashierPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'settled' | 'discrepancies'>('pending');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Data states
  const [pendingSpjs, setPendingSpjs] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<CrewCashSettlement[]>([]);
  const [discrepancies, setDiscrepancies] = useState<CrewCashDiscrepancy[]>([]);

  // Modals state
  const [selectedSpjId, setSelectedSpjId] = useState<string | null>(null);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);

  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<CrewCashDiscrepancy | null>(null);
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);

  const [selectedVoucherSettlement, setSelectedVoucherSettlement] = useState<CrewCashSettlement | null>(null);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

  const [discrepancySummary, setDiscrepancySummary] = useState<SettlementSummary | null>(null);
  const [isCreateDiscrepancyModalOpen, setIsCreateDiscrepancyModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [resPending, resSettlements, resDiscrepancies] = await Promise.all([
        CashierService.getPendingSpjs({ search: search || undefined }),
        CashierService.getSettlements({ search: search || undefined }),
        CashierService.getDiscrepancies({ search: search || undefined }),
      ]);
      setPendingSpjs(resPending.items || []);
      setSettlements(resSettlements.items || []);
      setDiscrepancies(resDiscrepancies.items || []);
    } catch (err: any) {
      toast.error('Gagal mengambil data meja kasir: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatRupiah = (val: number | string | undefined) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(val || 0));
  };

  // Metrik Ringkasan
  const totalPending = pendingSpjs.length;
  const totalDiscrepancies = discrepancies.filter((d) => d.resolutionStatus === 'PENDING_INVESTIGATION').length;
  const totalSettled = settlements.filter((s) => s.status === 'VERIFIED').length;
  const totalBkmToday = settlements
    .filter((s) => s.status === 'VERIFIED')
    .reduce((acc, s) => acc + (Number(s.totalCashReceived) || 0), 0);

  const handleUnblockPeriodClosing = async (settlementId: string) => {
    try {
      await CashierService.unblockPeriodClosing(settlementId);
      toast.success('Akun penampung 11999 berhasil diposting, tutup buku bulanan tidak terblokir!');
      fetchData();
    } catch (err: any) {
      toast.error('Gagal unblock tutup buku: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Heading
          title="Meja Kasir Pool & Settlement Kas Kru"
          description="Rekonsiliasi fisik Dua Kantong Kas Kru (Anti-Netting), penerbitan BKM/BKK, dan pusat investigasi selisih kasir."
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RotateCcw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200/80 shadow-sm bg-white/80 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">SPJ Siap Rekonsiliasi</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{totalPending}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Menunggu bus tiba & hitung kas</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Bus className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-sm bg-white/80 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Temuan Selisih (Investigasi FM)</p>
              <h3 className="text-2xl font-bold text-rose-600 mt-1">{totalDiscrepancies}</h3>
              <p className="text-[11px] text-rose-400 mt-0.5">Skenario 4: Butuh putusan FM</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-sm bg-white/80 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Settlement Terverifikasi</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{totalSettled}</h3>
              <p className="text-[11px] text-emerald-500 mt-0.5">Kas seimbang & jurnal diposting</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-sm bg-white/80 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Kas Fisik Masuk (BKM)</p>
              <h3 className="text-xl font-bold text-slate-900 mt-1 font-mono">{formatRupiah(totalBkmToday)}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Sisa UJ + Penerimaan Tiket/Kargo</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Coins className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex border-b border-slate-200 gap-4 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 px-1 border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'pending'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Receipt className="h-4 w-4" />
          SPJ Siap Rekonsiliasi Pool
          {totalPending > 0 && (
            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 ml-1">
              {totalPending}
            </Badge>
          )}
        </button>

        <button
          onClick={() => setActiveTab('settled')}
          className={`pb-3 px-1 border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'settled'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          Riwayat Dokumen Settlement ({settlements.length})
        </button>

        <button
          onClick={() => setActiveTab('discrepancies')}
          className={`pb-3 px-1 border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'discrepancies'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Scale className="h-4 w-4 text-rose-600" />
          Pusat Investigasi Selisih (Finance Manager Hub)
          {totalDiscrepancies > 0 && (
            <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 ml-1">
              {totalDiscrepancies} Butuh Otorisasi
            </Badge>
          )}
        </button>
      </div>

      {/* FILTER SEARCH BAR */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari SPJ No, No Settlement, atau Plat Bus..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white text-xs"
          />
        </div>
      </div>

      {/* TAB 1: SPJ SIAP REKONSILIASI KAS */}
      {activeTab === 'pending' && (
        <Card className="border border-slate-200/80 shadow-sm bg-white overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="text-xs">
                <TableHead className="font-bold">Nomor SPJ</TableHead>
                <TableHead className="font-bold">Armada / Layanan</TableHead>
                <TableHead className="font-bold">Rute Operasional</TableHead>
                <TableHead className="font-bold">Kru Perjalanan</TableHead>
                <TableHead className="font-bold">Status Finansial</TableHead>
                <TableHead className="font-bold text-right">Aksi Meja Kasir</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {pendingSpjs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                    Tidak ada SPJ kepulangan yang menunggu rekonsiliasi kasir saat ini.
                  </TableCell>
                </TableRow>
              ) : (
                pendingSpjs.map((spj) => (
                  <TableRow key={spj.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="font-mono font-bold text-slate-800">
                      {spj.spjNo}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-slate-900">{spj.vehicle?.code}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{spj.vehicle?.plateNumber} ({spj.serviceType})</div>
                    </TableCell>
                    <TableCell>
                      {spj.legs && spj.legs.length > 0 ? (
                        <div className="text-slate-700">
                          {spj.legs[0].origin} <ArrowRight className="inline h-3 w-3 text-slate-400 mx-1" />{' '}
                          {spj.legs[spj.legs.length - 1].destination}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {spj.crewAssignments && spj.crewAssignments.length > 0 ? (
                        <div className="space-y-0.5">
                          {spj.crewAssignments.map((ca: any) => (
                            <span key={ca.id} className="inline-block text-[11px] text-slate-600 bg-slate-100 rounded px-1.5 py-0.5 mr-1 mb-0.5">
                              {ca.crew?.name} ({ca.role})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          spj.financialStatus === 'DISCREPANCY'
                            ? 'bg-rose-50 text-rose-700 border-rose-300'
                            : 'bg-amber-50 text-amber-700 border-amber-300'
                        }
                      >
                        {spj.financialStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
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
        </Card>
      )}

      {/* TAB 2: RIWAYAT DOKUMEN SETTLEMENT */}
      {activeTab === 'settled' && (
        <Card className="border border-slate-200/80 shadow-sm bg-white overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="text-xs">
                <TableHead className="font-bold">No Settlement</TableHead>
                <TableHead className="font-bold">Nomor SPJ / Bus</TableHead>
                <TableHead className="font-bold">Status Kantong 1 (UJ)</TableHead>
                <TableHead className="font-bold">Status Kantong 2 (Setoran)</TableHead>
                <TableHead className="font-bold text-right">Kas Masuk (BKM)</TableHead>
                <TableHead className="font-bold text-right">Kas Bayar Kru (BKK)</TableHead>
                <TableHead className="font-bold">Voucher Ref</TableHead>
                <TableHead className="font-bold text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {settlements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-400">
                    Belum ada rekonsiliasi kasir yang tercatat.
                  </TableCell>
                </TableRow>
              ) : (
                settlements.map((s) => (
                  <TableRow key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="font-mono font-bold text-slate-900">
                      {s.settlementNo}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString('id-ID') : '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-slate-800">{s.spj?.spjNo}</span>
                      <span className="block text-[11px] text-slate-500 font-mono">
                        {s.spj?.vehicle?.code}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          s.ujStatus === 'BALANCED'
                            ? 'bg-emerald-500 text-white text-[10px]'
                            : 'bg-rose-500 text-white text-[10px]'
                        }
                      >
                        {s.ujStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          s.revenueStatus === 'MATCHED'
                            ? 'bg-emerald-500 text-white text-[10px]'
                            : 'bg-amber-500 text-white text-[10px]'
                        }
                      >
                        {s.revenueStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-emerald-700">
                      {formatRupiah(s.totalCashReceived)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-amber-700">
                      {s.totalCashPaid > 0 ? formatRupiah(s.totalCashPaid) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-[11px]">
                        {s.bkmNo && <span className="text-emerald-700 font-bold block">{s.bkmNo}</span>}
                        {s.bkkNo && <span className="text-amber-700 block">{s.bkkNo}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-1.5">
                      {s.status !== 'VERIFIED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-amber-300 text-amber-800 bg-amber-50"
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
                        <Printer className="h-3.5 w-3.5 mr-1 text-slate-600" /> Cetak BKM
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* TAB 3: PUSAT INVESTIGASI SELISIH (FINANCE MANAGER HUB) */}
      {activeTab === 'discrepancies' && (
        <Card className="border border-slate-200/80 shadow-sm bg-white overflow-hidden">
          <div className="bg-rose-50/70 p-3.5 border-b border-rose-200 text-xs text-rose-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-600" />
              <span>
                <strong>Skenario 4: Separasi Wewenang Meja Kasir vs Manajer Keuangan.</strong> Kasir hanya mencatat temuan fisik, putusan dispensasi beban vs potongan gaji kru adalah wewenang mutlak Finance Manager.
              </span>
            </div>
          </div>
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="text-xs">
                <TableHead className="font-bold">No Selisih</TableHead>
                <TableHead className="font-bold">Nomor SPJ / Armada</TableHead>
                <TableHead className="font-bold">Kategori Sumber</TableHead>
                <TableHead className="font-bold text-right">Nominal Selisih</TableHead>
                <TableHead className="font-bold">Alasan / Catatan Telematika GPS</TableHead>
                <TableHead className="font-bold">Status Resolusi</TableHead>
                <TableHead className="font-bold text-right">Otorisasi Putusan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {discrepancies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                    Tidak ada temuan selisih kas yang menunggu investigasi.
                  </TableCell>
                </TableRow>
              ) : (
                discrepancies.map((d) => (
                  <TableRow key={d.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="font-mono font-bold text-slate-900">
                      {d.discrepancyNo}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-slate-800">{d.spj?.spjNo}</span>
                      <span className="block text-[11px] text-slate-500 font-mono">{d.spj?.vehicle?.code}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-slate-700">{d.sourceType}</span>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-rose-700">
                      {formatRupiah(d.differenceAmount)}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-slate-800 truncate" title={d.reason}>"{d.reason}"</p>
                      {d.investigationNotes && (
                        <p className="text-[10px] text-indigo-700 truncate" title={d.investigationNotes}>
                          GPS: {d.investigationNotes}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          d.resolutionStatus === 'RESOLVED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }
                      >
                        {d.resolutionStatus}
                      </Badge>
                      {d.resolutionDecision && (
                        <span className="block text-[10px] font-mono text-slate-500 mt-0.5">
                          {d.resolutionDecision}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {d.resolutionStatus === 'PENDING_INVESTIGATION' ? (
                        <Button
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                          onClick={() => {
                            setSelectedDiscrepancy(d);
                            setIsResolutionModalOpen(true);
                          }}
                        >
                          <Scale className="h-3.5 w-3.5 mr-1" />
                          Putusan FM
                        </Button>
                      ) : (
                        <span className="text-[11px] text-emerald-700 font-semibold flex items-center justify-end gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Selesai
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
    </div>
  );
}
