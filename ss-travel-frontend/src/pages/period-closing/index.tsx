import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PeriodClosingService } from '@/services/period-closing.service';
import type { PeriodCheckStatus } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  FileCheck2,
  Info,
  Layers,
  Lock,
  Receipt,
  RefreshCw,
  Scale,
  Unlock,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ClosePeriodModal } from './ClosePeriodModal';
import { ReopenPeriodModal } from './ReopenPeriodModal';

export default function PeriodClosingPage() {
  const queryClient = useQueryClient();
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [reopenModalOpen, setReopenModalOpen] = useState(false);

  // 1. Ambil daftar periode fiskal
  const { data: periodsData, isLoading: isPeriodsLoading } = useQuery({
    queryKey: ['fiscal-periods-closing'],
    queryFn: () => PeriodClosingService.getPeriods(),
  });
  const periods = periodsData?.data || [];

  // Set default periode ke periode OPEN pertama atau periode terbaru
  useEffect(() => {
    if (periods.length > 0 && !selectedPeriodId) {
      const openPeriod = periods.find((p) => p.status === 'OPEN') || periods[0];
      setSelectedPeriodId(openPeriod.id);
    }
  }, [periods, selectedPeriodId]);

  const activePeriod = periods.find((p) => p.id === selectedPeriodId);

  // 2. Ambil audit checklist untuk periode yang dipilih
  const {
    data: checklistData,
    isLoading: isChecklistLoading,
  } = useQuery({
    queryKey: ['period-closing-checklist', selectedPeriodId],
    queryFn: () => PeriodClosingService.getChecklist(selectedPeriodId),
    enabled: Boolean(selectedPeriodId),
  });

  const checklist = checklistData?.data;

  // 3. Mutasi untuk eksekusi ulang audit checklist
  const runChecklistMutation = useMutation({
    mutationFn: () => PeriodClosingService.runChecklist(selectedPeriodId),
    onSuccess: (res) => {
      queryClient.setQueryData(['period-closing-checklist', selectedPeriodId], res);
      toast.success('Audit checklist tutup buku berhasil diperbarui!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal mengeksekusi checklist.');
    },
  });

  const getStatusBadge = (status?: PeriodCheckStatus) => {
    switch (status) {
      case 'PASSED':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 gap-1 text-[11px]">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            LOLOS (PASSED)
          </Badge>
        );
      case 'WARNING':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 gap-1 text-[11px]">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            PERINGATAN (WARNING)
          </Badge>
        );
      case 'BLOCKED':
        return (
          <Badge className="bg-rose-100 text-rose-800 border-rose-300 gap-1 text-[11px]">
            <XCircle className="h-3.5 w-3.5 text-rose-600" />
            TERBLOKIR (BLOCKED)
          </Badge>
        );
      default:
        return null;
    }
  };

  const getCheckIcon = (checkCode: string) => {
    switch (checkCode) {
      case 'JOURNAL_BALANCE':
        return <FileCheck2 className="h-5 w-5 text-blue-600" />;
      case 'CASHIER_SPJ_STATUS':
        return <Receipt className="h-5 w-5 text-indigo-600" />;
      case 'UNRESOLVED_DISCREPANCY_11999':
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case 'CASH_BANK_RECON':
        return <DollarSign className="h-5 w-5 text-emerald-600" />;
      case 'OPEN_AR_AP':
        return <Layers className="h-5 w-5 text-purple-600" />;
      case 'TRIAL_BALANCE_EQUAL':
        return <Scale className="h-5 w-5 text-teal-600" />;
      default:
        return <CheckCircle2 className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gray-900 text-white shadow-sm">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Tutup Buku Bulanan (Period Closing)
            </h1>
            <p className="text-sm text-gray-500">
              Wizard checklist otomatis penutupan periode akuntansi PT SS Traveling Official
            </p>
          </div>
        </div>

        {/* PERIODE SELECTOR & ACTIONS */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="w-56">
            <Select
              value={selectedPeriodId}
              onValueChange={(val) => setSelectedPeriodId(val)}
              disabled={isPeriodsLoading}
            >
              <SelectTrigger className="h-9 text-xs font-semibold">
                <SelectValue placeholder="Pilih Periode Fiskal" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.name} ({p.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => runChecklistMutation.mutate()}
            disabled={runChecklistMutation.isPending || isChecklistLoading}
            className="h-9 text-xs gap-1.5"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${runChecklistMutation.isPending || isChecklistLoading ? 'animate-spin' : ''
                }`}
            />
            Audit Ulang
          </Button>

          {activePeriod?.status === 'CLOSED' ? (
            <Button
              size="sm"
              onClick={() => setReopenModalOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white h-9 text-xs gap-1.5"
            >
              <Unlock className="h-3.5 w-3.5" />
              Buka Kembali Periode
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={!checklist?.canClose || isChecklistLoading}
              onClick={() => setCloseModalOpen(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white h-9 text-xs gap-1.5 shadow-sm"
            >
              <Lock className="h-3.5 w-3.5" />
              Kunci & Tutup Buku
            </Button>
          )}
        </div>
      </div>

      {/* STATUS RINGKASAN PERIODE */}
      {activePeriod && (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-gray-800 text-sm">{activePeriod.name}</span>
            <span className="text-gray-500 font-mono">
              ({activePeriod.startDate} s/d {activePeriod.endDate})
            </span>
            <Badge
              variant="outline"
              className={
                activePeriod.status === 'CLOSED'
                  ? 'border-rose-400 bg-rose-50 text-rose-800 font-bold'
                  : activePeriod.status === 'OPEN'
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-800 font-bold'
                    : 'border-blue-400 bg-blue-50 text-blue-800 font-bold'
              }
            >
              STATUS: {activePeriod.status}
            </Badge>
          </div>

          {activePeriod.status === 'CLOSED' && (
            <div className="text-gray-600 flex items-center gap-2">
              <span className="font-semibold text-rose-700">Telah Dikunci</span>
              <span>pada {activePeriod.closedAt ? new Date(activePeriod.closedAt).toLocaleDateString('id-ID') : '-'}</span>
              <span>oleh {activePeriod.closedByUser?.name || 'Finance Manager'}</span>
            </div>
          )}
        </div>
      )}

      {/* OVERALL READINESS CARD */}
      {isChecklistLoading ? (
        <div className="bg-white p-12 text-center text-gray-500 rounded-xl border border-gray-200 text-xs">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-2" />
          <span>Menjalankan 6-Point Audit Checklist Penutupan Buku...</span>
        </div>
      ) : checklist ? (
        <div className="space-y-4">
          <div
            className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${checklist.canClose
                ? 'bg-linear-to-r from-emerald-50 to-teal-50 border-emerald-300 text-emerald-950'
                : 'bg-linear-to-r from-rose-50 to-red-50 border-rose-300 text-rose-950'
              }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-lg mt-0.5 ${checklist.canClose ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                  }`}
              >
                {checklist.canClose ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
              </div>
              <div>
                <h3 className="font-extrabold text-sm md:text-base">
                  {checklist.canClose
                    ? 'PERIODE SIAP DITUTUP (READY TO CLOSE)'
                    : 'PENUTUPAN PERIODE TERBLOKIR (BLOCKED)'}
                </h3>
                <p className="text-xs opacity-90 mt-0.5">
                  {checklist.canClose
                    ? 'Seluruh kondisi wajib (keseimbangan jurnal & trial balance) telah terpenuhi. Anda dapat melakukan penutupan buku.'
                    : 'Terdapat pemeriksaan berstatus BLOCKED yang harus diselesaikan sebelum penutupan buku dapat dilakukan.'}
                </p>
                {checklist.blockerReasons.length > 0 && (
                  <ul className="mt-2 list-disc list-inside text-xs text-rose-800 font-semibold space-y-0.5">
                    {checklist.blockerReasons.map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {checklist.warningReasons.length > 0 && (
              <div className="bg-white/80 border border-amber-300 p-2.5 rounded-lg text-xs text-amber-900 max-w-sm">
                <span className="font-bold flex items-center gap-1 text-amber-800">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  {checklist.warningReasons.length} Peringatan (Bukan Pemblokir):
                </span>
                <ul className="mt-1 list-disc list-inside text-[11px] text-amber-800 space-y-0.5">
                  {checklist.warningReasons.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* BANNER EDUKASI KEMERDEKAAN TUTUP BUKU & AKUN 11999 (SKENARIO 4) */}
          <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-xl flex items-start gap-3 text-xs text-blue-900">
            <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">
                Kepatuhan Standar Akuntansi Bus PT SS Traveling Official (Skenario 4 — Kemerdekaan Tutup Buku):
              </span>
              <p className="text-blue-800 leading-relaxed">
                Perselisihan kasir di meja pool atau sengketa uang kru di jalan <strong>TIDAK MEMBLOKIR</strong> proses
                tutup buku bulanan. Saldo sengketa dialihkan sementara ke akun penampung{' '}
                <strong className="font-mono">11999 (Selisih Kas Operasional Sementara)</strong> sehingga penutupan
                buku bulanan dan penyajian laporan keuangan resmi perusahaan tetap berjalan tepat waktu tanpa hambatan.
              </p>
            </div>
          </div>

          {/* 6-POINT CHECKLIST GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {checklist.checks.map((item) => (
              <Card key={item.checkCode} className="border border-gray-200 shadow-sm overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                        {getCheckIcon(item.checkCode)}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-xs">{item.checkName}</h4>
                        <span className="text-[10px] font-mono text-gray-400">{item.checkCode}</span>
                      </div>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>

                  <p className="text-xs text-gray-600 bg-gray-50/70 p-2.5 rounded-lg border border-gray-100 leading-relaxed">
                    {item.description}
                  </p>

                  {/* DETAILS SPECIFIC VIEW */}
                  {item.checkCode === 'UNRESOLVED_DISCREPANCY_11999' && item.details && (
                    <div className="bg-amber-50/60 p-2 rounded border border-amber-200 text-[11px] text-amber-900 space-y-1">
                      <div className="flex justify-between">
                        <span>Saldo Terbuka Akun 11999:</span>
                        <strong className="font-mono">
                          Rp {Number(item.details.balance || 0).toLocaleString('id-ID')}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Kasus Investigasi Terbuka:</span>
                        <strong>{item.details.pendingInvestigationCount || 0} Kasus</strong>
                      </div>
                    </div>
                  )}

                  {item.checkCode === 'CASHIER_SPJ_STATUS' && item.details?.openSpjCount > 0 && (
                    <div className="bg-gray-50 p-2 rounded border border-gray-200 text-[11px] text-gray-700 flex justify-between">
                      <span>SPJ Belum Tuntas:</span>
                      <strong className="text-amber-800">{item.details?.openSpjCount} Dokumen</strong>
                    </div>
                  )}

                  {item.checkCode === 'CASH_BANK_RECON' && item.details?.accounts && (
                    <div className="space-y-1 text-[11px] pt-1">
                      {item.details.accounts.map((a: any) => (
                        <div key={a.code} className="flex justify-between font-mono text-gray-600">
                          <span>{a.code} - {a.name}:</span>
                          <span className="font-bold text-gray-800">
                            Rp {Number(a.balance).toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {item.checkCode === 'TRIAL_BALANCE_EQUAL' && item.details && (
                    <div className="flex justify-between text-[11px] font-mono bg-teal-50 p-1.5 rounded text-teal-900 border border-teal-200">
                      <span>Total Debit == Kredit:</span>
                      <strong>Rp {Number(item.details.totalDebit || 0).toLocaleString('id-ID')}</strong>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      {/* MODAL CLOSE & REOPEN */}
      {activePeriod && (
        <>
          <ClosePeriodModal
            open={closeModalOpen}
            onOpenChange={setCloseModalOpen}
            periodId={activePeriod.id}
            periodName={activePeriod.name}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['fiscal-periods-closing'] });
              queryClient.invalidateQueries({ queryKey: ['period-closing-checklist', activePeriod.id] });
            }}
          />

          <ReopenPeriodModal
            open={reopenModalOpen}
            onOpenChange={setReopenModalOpen}
            periodId={activePeriod.id}
            periodName={activePeriod.name}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['fiscal-periods-closing'] });
              queryClient.invalidateQueries({ queryKey: ['period-closing-checklist', activePeriod.id] });
            }}
          />
        </>
      )}
    </div>
  );
}
