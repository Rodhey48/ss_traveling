import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Scale,
  BookOpen,
  RefreshCw,
  TrendingUp,
  Building2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
import { AccountService } from '@/services/account.service';
import { OrganizationService } from '@/services/organization.service';
import type { Account, CostCenter, BusinessUnit } from '@/types';

export default function GeneralLedgerPage() {
  const [activeTab, setActiveTab] = useState<'GL' | 'TB' | 'PNL' | 'BS'>('GL');

  // Shared Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [asOfDate, setAsOfDate] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [selectedCostCenterId, setSelectedCostCenterId] = useState<string>('ALL');
  const [selectedBusinessUnitId, setSelectedBusinessUnitId] = useState<string>('ALL');

  // Load Accounts for dropdown
  const { data: accountsData } = useQuery({
    queryKey: ['accounts-list'],
    queryFn: () => AccountService.findAll({ isPostable: true }),
  });
  const postableAccounts = (accountsData?.data as Account[]) || [];

  // Load Cost Centers & Business Units
  const { data: ccData } = useQuery({
    queryKey: ['cost-centers-list'],
    queryFn: () => OrganizationService.getCostCenters(),
  });
  const costCenters = (ccData?.data as CostCenter[]) || [];

  const { data: buData } = useQuery({
    queryKey: ['business-units-list'],
    queryFn: () => OrganizationService.getBusinessUnits(),
  });
  const businessUnits = (buData?.data as BusinessUnit[]) || [];

  // Query GL
  const {
    data: glData,
    isLoading: isGlLoading,
    refetch: refetchGl,
  } = useQuery({
    queryKey: [
      'report-gl',
      selectedAccountId,
      startDate,
      endDate,
      selectedCostCenterId,
      selectedBusinessUnitId,
    ],
    queryFn: () =>
      ReportService.getGeneralLedger({
        accountId: selectedAccountId === 'ALL' ? undefined : selectedAccountId,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        costCenterId: selectedCostCenterId === 'ALL' ? undefined : selectedCostCenterId,
        businessUnitId: selectedBusinessUnitId === 'ALL' ? undefined : selectedBusinessUnitId,
      }),
    enabled: activeTab === 'GL',
  });

  // Query Trial Balance
  const {
    data: tbData,
    isLoading: isTbLoading,
    refetch: refetchTb,
  } = useQuery({
    queryKey: ['report-tb', startDate, endDate, selectedBusinessUnitId],
    queryFn: () =>
      ReportService.getTrialBalance({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        businessUnitId: selectedBusinessUnitId === 'ALL' ? undefined : selectedBusinessUnitId,
      }),
    enabled: activeTab === 'TB',
  });

  // Query Income Statement (P&L)
  const {
    data: pnlData,
    isLoading: isPnlLoading,
    refetch: refetchPnl,
  } = useQuery({
    queryKey: [
      'report-pnl',
      startDate,
      endDate,
      selectedCostCenterId,
      selectedBusinessUnitId,
    ],
    queryFn: () =>
      ReportService.getIncomeStatement({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        costCenterId: selectedCostCenterId === 'ALL' ? undefined : selectedCostCenterId,
        businessUnitId: selectedBusinessUnitId === 'ALL' ? undefined : selectedBusinessUnitId,
      }),
    enabled: activeTab === 'PNL',
  });

  // Query Balance Sheet
  const {
    data: bsData,
    isLoading: isBsLoading,
    refetch: refetchBs,
  } = useQuery({
    queryKey: ['report-bs', asOfDate, selectedBusinessUnitId],
    queryFn: () =>
      ReportService.getBalanceSheet({
        asOfDate: asOfDate || undefined,
        businessUnitId: selectedBusinessUnitId === 'ALL' ? undefined : selectedBusinessUnitId,
      }),
    enabled: activeTab === 'BS',
  });

  const glResponse = glData?.data;
  const tbResponse = tbData?.data;
  const pnlResponse = pnlData?.data;
  const bsResponse = bsData?.data;

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedAccountId('ALL');
    setSelectedCostCenterId('ALL');
    setSelectedBusinessUnitId('ALL');
    setAsOfDate('');
  };

  const hasActiveFilters = useMemo(() => {
    return (
      startDate !== '' ||
      endDate !== '' ||
      selectedAccountId !== 'ALL' ||
      selectedCostCenterId !== 'ALL' ||
      selectedBusinessUnitId !== 'ALL' ||
      asOfDate !== ''
    );
  }, [startDate, endDate, selectedAccountId, selectedCostCenterId, selectedBusinessUnitId, asOfDate]);

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-700 text-white shadow-sm">
            <Scale className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Laporan Finansial &amp; Akuntansi
            </h1>
            <p className="text-sm text-muted-foreground">
              Buku Besar (GL), Neraca Saldo, Laba Rugi Komprehensif per Cost Center, dan Neraca Keuangan PT SS Travelink Official
            </p>
          </div>
        </div>

        {/* REFRESH BUTTON */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (activeTab === 'GL') refetchGl();
            else if (activeTab === 'TB') refetchTb();
            else if (activeTab === 'PNL') refetchPnl();
            else if (activeTab === 'BS') refetchBs();
          }}
          className="h-8.5 text-xs gap-1.5 self-start md:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Segarkan Laporan
        </Button>
      </div>

      {/* NAVIGATION TABS */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="GL" className="text-xs px-4 py-2 flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            Buku Besar (General Ledger)
          </TabsTrigger>
          <TabsTrigger value="TB" className="text-xs px-4 py-2 flex items-center gap-1.5">
            <Scale className="h-3.5 w-3.5" />
            Neraca Saldo (Trial Balance)
          </TabsTrigger>
          <TabsTrigger value="PNL" className="text-xs px-4 py-2 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Laba Rugi (Income Statement)
          </TabsTrigger>
          <TabsTrigger value="BS" className="text-xs px-4 py-2 flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            Neraca (Balance Sheet)
          </TabsTrigger>
        </TabsList>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: BUKU BESAR (GENERAL LEDGER) */}
        {/* ------------------------------------------------------------- */}
        <TabsContent value="GL" className="space-y-4">
          {/* FILTER TOOLBAR */}
          <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md p-4 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-wrap gap-3 items-center">
            <div className="w-full sm:w-64">
              <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Pilih Akun COA</label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="h-8.5 text-xs">
                  <SelectValue placeholder="Semua Akun Aktif" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">Semua Akun dengan Mutasi</SelectItem>
                  {postableAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id} className="text-xs">
                      {acc.code} - {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-48">
              <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Cost Center</label>
              <Select value={selectedCostCenterId} onValueChange={setSelectedCostCenterId}>
                <SelectTrigger className="h-8.5 text-xs">
                  <Building2 className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
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
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Dari Tanggal</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8.5 text-xs w-36"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Sampai Tanggal</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8.5 text-xs w-36"
              />
            </div>

            {hasActiveFilters && (
              <div className="self-end pb-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-8.5 text-xs px-2.5 text-muted-foreground hover:text-foreground gap-1"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset Filter
                </Button>
              </div>
            )}
          </div>

          {isGlLoading ? (
            <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md p-16 text-center text-muted-foreground rounded-xl border border-slate-200/80 dark:border-white/10">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-2" />
              <span>Memuat buku besar akun...</span>
            </div>
          ) : !glResponse || glResponse.accounts.length === 0 ? (
            <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md p-12 text-center text-muted-foreground rounded-xl border border-slate-200/80 dark:border-white/10 text-xs">
              <BookOpen className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2" />
              <p className="font-semibold text-foreground">Tidak ada pergerakan transaksi jurnal terposting</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Silakan sesuaikan filter akun atau rentang tanggal untuk melihat mutasi.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {glResponse.accounts.map((acc) => (
                <div key={acc.accountId} className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-xl shadow-xs overflow-hidden">
                  {/* ACCOUNT HEADER */}
                  <div className="bg-slate-50/80 dark:bg-white/5 px-4 py-3 border-b border-slate-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 px-2 py-0.5 rounded">
                        {acc.accountCode}
                      </span>
                      <span className="font-bold text-foreground text-sm">{acc.accountName}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {acc.accountType}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        Saldo Normal: {acc.normalBalance}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div>
                        <span className="text-muted-foreground text-[10px] block font-sans">Saldo Awal</span>
                        <span className="font-semibold text-foreground">
                          Rp {Number(acc.openingBalance).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-[10px] block font-sans">Mutasi Debit</span>
                        <span className="font-semibold text-blue-700 dark:text-blue-400">
                          Rp {Number(acc.totalDebit).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-[10px] block font-sans">Mutasi Kredit</span>
                        <span className="font-semibold text-rose-700 dark:text-rose-400">
                          Rp {Number(acc.totalCredit).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="border-l border-slate-200 dark:border-white/10 pl-4">
                        <span className="text-muted-foreground text-[10px] block font-sans">Saldo Akhir</span>
                        <span className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                          Rp {Number(acc.endingBalance).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* LINES TABLE */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/50 dark:bg-white/5 text-muted-foreground border-b border-slate-100 dark:border-white/5 uppercase text-[10px] font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">Tanggal</th>
                          <th className="py-2.5 px-3">No Jurnal</th>
                          <th className="py-2.5 px-3">Sumber</th>
                          <th className="py-2.5 px-3">Keterangan Transaksi</th>
                          <th className="py-2.5 px-3 text-right">Debit</th>
                          <th className="py-2.5 px-3 text-right">Kredit</th>
                          <th className="py-2.5 px-3 text-right">Saldo Berjalan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono">
                        {acc.lines.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-4 text-muted-foreground font-sans text-xs">
                              Tidak ada mutasi dalam rentang tanggal ini. (Hanya membawa saldo awal)
                            </td>
                          </tr>
                        ) : (
                          acc.lines.map((line) => (
                            <tr key={line.lineId} className="hover:bg-slate-50/60 dark:hover:bg-white/5 transition-colors">
                              <td className="py-2 px-3 text-muted-foreground font-sans">{line.journalDate}</td>
                              <td className="py-2 px-3 font-bold text-blue-700 dark:text-blue-400">{line.journalNo}</td>
                              <td className="py-2 px-3">
                                <Badge variant="outline" className="text-[9px]">
                                  {line.sourceType}
                                </Badge>
                              </td>
                              <td className="py-2 px-3 text-foreground font-sans">{line.description}</td>
                              <td className="py-2 px-3 text-right text-foreground">
                                {Number(line.debit) > 0
                                  ? `Rp ${Number(line.debit).toLocaleString('id-ID')}`
                                  : '-'}
                              </td>
                              <td className="py-2 px-3 text-right text-foreground">
                                {Number(line.credit) > 0
                                  ? `Rp ${Number(line.credit).toLocaleString('id-ID')}`
                                  : '-'}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-emerald-800 dark:text-emerald-300">
                                Rp {Number(line.runningBalance).toLocaleString('id-ID')}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: NERACA SALDO (TRIAL BALANCE) */}
        {/* ------------------------------------------------------------- */}
        <TabsContent value="TB" className="space-y-4">
          <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md p-4 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Dari Tanggal</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-8.5 text-xs w-40"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Sampai Tanggal</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-8.5 text-xs w-40"
                />
              </div>

              {(startDate !== '' || endDate !== '') && (
                <div className="self-end pb-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="h-8.5 text-xs px-2.5 text-muted-foreground hover:text-foreground gap-1"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset Tanggal
                  </Button>
                </div>
              )}
            </div>

            {tbResponse && (
              <div className="flex items-center gap-2">
                {tbResponse.totals.isBalanced ? (
                  <Badge className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60 py-1 px-3 text-xs flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Neraca Saldo Seimbang (Balanced)
                  </Badge>
                ) : (
                  <Badge className="bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800/60 py-1 px-3 text-xs flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    Neraca Saldo Tidak Seimbang!
                  </Badge>
                )}
              </div>
            )}
          </div>

          {isTbLoading ? (
            <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md p-16 text-center text-muted-foreground rounded-xl border border-slate-200/80 dark:border-white/10">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-2" />
              <span>Menyusun neraca saldo...</span>
            </div>
          ) : !tbResponse || tbResponse.items.length === 0 ? (
            <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md p-12 text-center text-muted-foreground rounded-xl border border-slate-200/80 dark:border-white/10 text-xs">
              <Scale className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2" />
              <p className="font-semibold text-foreground">Tidak ada data neraca saldo untuk periode ini.</p>
            </div>
          ) : (
            <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 dark:bg-white/5 text-muted-foreground font-semibold uppercase text-[10px] border-b border-slate-200/80 dark:border-white/10">
                    <tr>
                      <th rowSpan={2} className="py-2 px-3 border-r border-slate-200/80 dark:border-white/10">Kode</th>
                      <th rowSpan={2} className="py-2 px-3 border-r border-slate-200/80 dark:border-white/10">Nama Akun</th>
                      <th colSpan={2} className="py-1 px-3 text-center border-b border-r border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
                        Saldo Awal
                      </th>
                      <th colSpan={2} className="py-1 px-3 text-center border-b border-r border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
                        Mutasi Periode
                      </th>
                      <th colSpan={2} className="py-1 px-3 text-center border-b border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
                        Saldo Akhir
                      </th>
                    </tr>
                    <tr className="text-[10px] text-muted-foreground">
                      <th className="py-1 px-2.5 text-right border-r border-slate-200/80 dark:border-white/10">Debit</th>
                      <th className="py-1 px-2.5 text-right border-r border-slate-200/80 dark:border-white/10">Kredit</th>
                      <th className="py-1 px-2.5 text-right border-r border-slate-200/80 dark:border-white/10">Debit</th>
                      <th className="py-1 px-2.5 text-right border-r border-slate-200/80 dark:border-white/10">Kredit</th>
                      <th className="py-1 px-2.5 text-right border-r border-slate-200/80 dark:border-white/10">Debit</th>
                      <th className="py-1 px-2.5 text-right">Kredit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono text-[11px]">
                    {tbResponse.items.map((item) => (
                      <tr key={item.accountId} className="hover:bg-slate-50/70 dark:hover:bg-white/5 transition-colors">
                        <td className="py-2 px-3 font-bold text-foreground border-r border-slate-100 dark:border-white/5">
                          {item.accountCode}
                        </td>
                        <td className="py-2 px-3 font-sans text-foreground border-r border-slate-100 dark:border-white/5">
                          {item.accountName}
                        </td>
                        <td className="py-2 px-2.5 text-right border-r border-slate-100 dark:border-white/5">
                          {Number(item.openingDebit) > 0 ? Number(item.openingDebit).toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="py-2 px-2.5 text-right border-r border-slate-100 dark:border-white/5">
                          {Number(item.openingCredit) > 0 ? Number(item.openingCredit).toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="py-2 px-2.5 text-right border-r border-slate-100 dark:border-white/5 text-blue-800 dark:text-blue-400">
                          {Number(item.periodDebit) > 0 ? Number(item.periodDebit).toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="py-2 px-2.5 text-right border-r border-slate-100 dark:border-white/5 text-rose-800 dark:text-rose-400">
                          {Number(item.periodCredit) > 0 ? Number(item.periodCredit).toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="py-2 px-2.5 text-right border-r border-slate-100 dark:border-white/5 font-bold text-foreground">
                          {Number(item.endingDebit) > 0 ? Number(item.endingDebit).toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="py-2 px-2.5 text-right font-bold text-foreground">
                          {Number(item.endingCredit) > 0 ? Number(item.endingCredit).toLocaleString('id-ID') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100/80 dark:bg-white/10 font-mono font-bold text-xs text-foreground border-t-2 border-slate-300 dark:border-white/20">
                    <tr>
                      <td colSpan={2} className="py-2.5 px-3 text-right uppercase border-r border-slate-200/80 dark:border-white/10 font-sans">
                        Grand Total
                      </td>
                      <td className="py-2.5 px-2.5 text-right border-r border-slate-200/80 dark:border-white/10">
                        Rp {Number(tbResponse.totals.openingDebit).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-2.5 text-right border-r border-slate-200/80 dark:border-white/10">
                        Rp {Number(tbResponse.totals.openingCredit).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-2.5 text-right border-r border-slate-200/80 dark:border-white/10 text-blue-900 dark:text-blue-300">
                        Rp {Number(tbResponse.totals.periodDebit).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-2.5 text-right border-r border-slate-200/80 dark:border-white/10 text-rose-900 dark:text-rose-300">
                        Rp {Number(tbResponse.totals.periodCredit).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-2.5 text-right border-r border-slate-200/80 dark:border-white/10 text-emerald-900 dark:text-emerald-300">
                        Rp {Number(tbResponse.totals.endingDebit).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-2.5 text-right text-emerald-900 dark:text-emerald-300">
                        Rp {Number(tbResponse.totals.endingCredit).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: LABA RUGI (INCOME STATEMENT) */}
        {/* ------------------------------------------------------------- */}
        <TabsContent value="PNL" className="space-y-4">
          <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md p-4 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-wrap gap-3 items-center">
            <div className="w-48">
              <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Cost Center (Segmen)</label>
              <Select value={selectedCostCenterId} onValueChange={setSelectedCostCenterId}>
                <SelectTrigger className="h-8.5 text-xs">
                  <Building2 className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
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
            </div>

            <div className="w-44">
              <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Unit Usaha (BU)</label>
              <Select value={selectedBusinessUnitId} onValueChange={setSelectedBusinessUnitId}>
                <SelectTrigger className="h-8.5 text-xs">
                  <SelectValue placeholder="Semua Unit Usaha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs font-semibold">Semua Unit Usaha</SelectItem>
                  {businessUnits.map((bu) => (
                    <SelectItem key={bu.id} value={bu.id} className="text-xs">
                      {bu.code} - {bu.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Dari Tanggal</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8.5 text-xs w-36"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Sampai Tanggal</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8.5 text-xs w-36"
              />
            </div>

            {(startDate !== '' || endDate !== '' || selectedCostCenterId !== 'ALL' || selectedBusinessUnitId !== 'ALL') && (
              <div className="self-end pb-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setSelectedCostCenterId('ALL');
                    setSelectedBusinessUnitId('ALL');
                  }}
                  className="h-8.5 text-xs px-2.5 text-muted-foreground hover:text-foreground gap-1"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset Filter
                </Button>
              </div>
            )}
          </div>

          {isPnlLoading ? (
            <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md p-16 text-center text-muted-foreground rounded-xl border border-slate-200/80 dark:border-white/10">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-2" />
              <span>Mengkalkulasi laba rugi operasional...</span>
            </div>
          ) : !pnlResponse ? (
            <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md p-12 text-center text-muted-foreground rounded-xl border border-slate-200/80 dark:border-white/10 text-xs">
              <TrendingUp className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2" />
              <p className="font-semibold text-foreground">Data tidak tersedia</p>
            </div>
          ) : (
            <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-xl shadow-xs p-6 space-y-6 max-w-4xl mx-auto">
              {/* PNL TITLE */}
              <div className="text-center pb-4 border-b border-slate-200/80 dark:border-white/10">
                <h3 className="text-lg font-bold text-foreground">PT SS TRAVELINK OFFICIAL</h3>
                <h4 className="text-base font-semibold text-foreground/90">LAPORAN LABA RUGI KOMPREHENSIF</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Periode: {pnlResponse.periodInfo.startDate} s/d {pnlResponse.periodInfo.endDate}
                </p>

                {(selectedCostCenterId !== 'ALL' || selectedBusinessUnitId !== 'ALL') && (
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-2.5">
                    {selectedCostCenterId !== 'ALL' && (
                      <Badge variant="outline" className="font-mono text-xs border-indigo-400 text-indigo-700 dark:text-indigo-300 bg-indigo-50/60 dark:bg-indigo-950/40 gap-1.5 py-1 px-3 font-bold">
                        <Building2 className="w-3.5 h-3.5" />
                        Segmen Cost Center: {costCenters.find((c) => c.id === selectedCostCenterId)?.code} - {costCenters.find((c) => c.id === selectedCostCenterId)?.name}
                      </Badge>
                    )}
                    {selectedBusinessUnitId !== 'ALL' && (
                      <Badge variant="outline" className="font-mono text-xs border-blue-400 text-blue-700 dark:text-blue-300 bg-blue-50/60 dark:bg-blue-950/40 gap-1.5 py-1 px-3">
                        Unit Usaha: {businessUnits.find((b) => b.id === selectedBusinessUnitId)?.name}
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* I. PENDAPATAN OPERASIONAL */}
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-100/80 dark:bg-white/5 p-2.5 rounded-lg text-xs font-bold text-foreground">
                  <span>I. PENDAPATAN OPERASIONAL (REVENUE)</span>
                  <span className="font-mono text-emerald-800 dark:text-emerald-300">
                    Rp {Number(pnlResponse.revenues.totalRevenue).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="pl-4 space-y-2 text-xs">
                  {pnlResponse.revenues.groups.map((grp) => (
                    <div key={grp.groupCode} className="space-y-1">
                      <div className="flex justify-between font-semibold text-foreground">
                        <span>{grp.groupName}</span>
                        <span className="font-mono">Rp {Number(grp.subtotal).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="pl-4 space-y-0.5 text-muted-foreground text-[11px]">
                        {grp.accounts.map((acc) => (
                          <div key={acc.accountCode} className="flex justify-between">
                            <span>{acc.accountCode} - {acc.accountName}</span>
                            <span className="font-mono">Rp {Number(acc.amount).toLocaleString('id-ID')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* II. BEBAN OPERASIONAL */}
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-100/80 dark:bg-white/5 p-2.5 rounded-lg text-xs font-bold text-foreground">
                  <span>II. BEBAN OPERASIONAL ARMADA, KRU &amp; POOL</span>
                  <span className="font-mono text-rose-800 dark:text-rose-400">
                    Rp {Number(pnlResponse.expenses.totalExpense).toLocaleString('id-ID')}
                  </span>
                </div>

                {/* Sub-Kelompok Beban */}
                <div className="pl-4 space-y-3 text-xs">
                  {[
                    { label: 'Beban Langsung BBM & Fasilitas Armada', groups: pnlResponse.expenses.directFleetCosts },
                    { label: 'Beban Kompensasi & Hak Kru Operasional', groups: pnlResponse.expenses.crewCosts },
                    { label: 'Beban Komisi Agen & Korlap Rekanan', groups: pnlResponse.expenses.agentPartnerCosts },
                    { label: 'Beban Perawatan Bengkel & Derek Darurat', groups: pnlResponse.expenses.maintenanceCosts },
                    { label: 'Beban Umum & Operasional Pool', groups: pnlResponse.expenses.generalPoolCosts },
                    { label: 'Beban Lain-lain & Selisih Kasir', groups: pnlResponse.expenses.otherCosts },
                  ].map((cat, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="font-bold text-foreground border-b border-slate-200/80 dark:border-white/10 pb-0.5">{cat.label}</div>
                      {cat.groups.map((grp) => (
                        <div key={grp.groupCode} className="pl-2 space-y-0.5">
                          <div className="flex justify-between font-semibold text-foreground">
                            <span>{grp.groupName}</span>
                            <span className="font-mono">Rp {Number(grp.subtotal).toLocaleString('id-ID')}</span>
                          </div>
                          <div className="pl-3 space-y-0.5 text-muted-foreground text-[11px]">
                            {grp.accounts.map((acc) => (
                              <div key={acc.accountCode} className="flex justify-between">
                                <span>{acc.accountCode} - {acc.accountName}</span>
                                <span className="font-mono">Rp {Number(acc.amount).toLocaleString('id-ID')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* SUMMARY LABA KOTOR & BERSIH */}
              <div className="border-t-2 border-slate-300 dark:border-white/20 pt-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-foreground">
                  <span className="font-sans font-bold">Laba Kotor (Gross Margin)</span>
                  <span className="font-bold">Rp {Number(pnlResponse.grossProfit).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-foreground">
                  <span className="font-sans font-bold">Laba Operasional (Operating Profit)</span>
                  <span className="font-bold">Rp {Number(pnlResponse.operatingProfit).toLocaleString('id-ID')}</span>
                </div>
                <div
                  className={`flex justify-between p-3 rounded-xl border text-sm font-bold ${
                    Number(pnlResponse.netIncome) >= 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60'
                      : 'bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-300 border-red-300 dark:border-red-800/60'
                  }`}
                >
                  <span className="font-sans">LABA BERSIH PERIODE BERJALAN (NET INCOME)</span>
                  <span className="text-base">Rp {Number(pnlResponse.netIncome).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: NERACA KEUANGAN (BALANCE SHEET) */}
        {/* ------------------------------------------------------------- */}
        <TabsContent value="BS" className="space-y-4">
          <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md p-4 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">Posisi Per Tanggal</label>
                <Input
                  type="date"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                  className="h-8.5 text-xs w-44"
                />
              </div>

              {asOfDate !== '' && (
                <div className="self-end pb-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAsOfDate('')}
                    className="h-8.5 text-xs px-2.5 text-muted-foreground hover:text-foreground gap-1"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset
                  </Button>
                </div>
              )}
            </div>

            {bsResponse && (
              <div>
                {bsResponse.isBalanced ? (
                  <Badge className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60 py-1 px-3 text-xs flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Neraca Seimbang (Aset = Liabilitas + Ekuitas)
                  </Badge>
                ) : (
                  <Badge className="bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800/60 py-1 px-3 text-xs flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    Neraca Tidak Seimbang!
                  </Badge>
                )}
              </div>
            )}
          </div>

          {isBsLoading ? (
            <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md p-16 text-center text-muted-foreground rounded-xl border border-slate-200/80 dark:border-white/10">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-2" />
              <span>Menghitung posisi neraca aset &amp; liabilitas...</span>
            </div>
          ) : !bsResponse ? (
            <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md p-12 text-center text-muted-foreground rounded-xl border border-slate-200/80 dark:border-white/10 text-xs">
              <Building2 className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2" />
              <p className="font-semibold text-foreground">Data tidak tersedia</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SISI KIRI: ASET */}
              <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-xl shadow-xs p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200/80 dark:border-white/10 pb-2">
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                    ASET (AKTIVA)
                  </h3>
                  <span className="font-mono font-bold text-blue-900 dark:text-blue-300 text-sm">
                    Rp {Number(bsResponse.assets.totalAssets).toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="space-y-4 text-xs">
                  {bsResponse.assets.categories.map((cat) => (
                    <div key={cat.categoryCode} className="space-y-1">
                      <div className="flex justify-between font-bold text-foreground bg-slate-50/80 dark:bg-white/5 p-1.5 rounded">
                        <span>{cat.categoryName}</span>
                        <span className="font-mono">Rp {Number(cat.subtotal).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="pl-3 space-y-0.5 text-muted-foreground text-[11px]">
                        {cat.items.map((item) => (
                          <div key={item.accountCode} className="flex justify-between">
                            <span>{item.accountCode} - {item.accountName}</span>
                            <span className="font-mono">Rp {Number(item.amount).toLocaleString('id-ID')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200/80 dark:border-white/10 pt-3 flex justify-between font-bold text-sm bg-blue-50/50 dark:bg-blue-950/30 p-2.5 rounded-lg text-blue-900 dark:text-blue-300">
                  <span>TOTAL ASET</span>
                  <span className="font-mono">Rp {Number(bsResponse.assets.totalAssets).toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* SISI KANAN: LIABILITAS & EKUITAS */}
              <div className="space-y-6">
                {/* LIABILITAS */}
                <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-xl shadow-xs p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200/80 dark:border-white/10 pb-2">
                    <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                      <Scale className="h-4 w-4 text-rose-700 dark:text-rose-400" />
                      LIABILITAS (KEWAJIBAN / UTANG)
                    </h3>
                    <span className="font-mono font-bold text-rose-900 dark:text-rose-300 text-sm">
                      Rp {Number(bsResponse.liabilities.totalLiabilities).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="space-y-4 text-xs">
                    {bsResponse.liabilities.categories.map((cat) => (
                      <div key={cat.categoryCode} className="space-y-1">
                        <div className="flex justify-between font-bold text-foreground bg-slate-50/80 dark:bg-white/5 p-1.5 rounded">
                          <span>{cat.categoryName}</span>
                          <span className="font-mono">Rp {Number(cat.subtotal).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="pl-3 space-y-0.5 text-muted-foreground text-[11px]">
                          {cat.items.map((item) => (
                            <div key={item.accountCode} className="flex justify-between">
                              <span>{item.accountCode} - {item.accountName}</span>
                              <span className="font-mono">Rp {Number(item.amount).toLocaleString('id-ID')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-200/80 dark:border-white/10 pt-2 flex justify-between font-bold text-xs text-rose-900 dark:text-rose-300">
                    <span>Total Liabilitas</span>
                    <span className="font-mono">
                      Rp {Number(bsResponse.liabilities.totalLiabilities).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* EKUITAS */}
                <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-xl shadow-xs p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200/80 dark:border-white/10 pb-2">
                    <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                      EKUITAS (MODAL)
                    </h3>
                    <span className="font-mono font-bold text-emerald-900 dark:text-emerald-300 text-sm">
                      Rp {Number(bsResponse.equity.totalEquity).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {bsResponse.equity.categories.map((cat) => (
                      <div key={cat.categoryCode} className="space-y-1">
                        <div className="flex justify-between font-bold text-foreground bg-slate-50/80 dark:bg-white/5 p-1.5 rounded">
                          <span>{cat.categoryName}</span>
                          <span className="font-mono">Rp {Number(cat.subtotal).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="pl-3 space-y-0.5 text-muted-foreground text-[11px]">
                          {cat.items.map((item) => (
                            <div key={item.accountCode} className="flex justify-between">
                              <span>{item.accountCode} - {item.accountName}</span>
                              <span className="font-mono">Rp {Number(item.amount).toLocaleString('id-ID')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-between font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded text-xs border border-emerald-200 dark:border-emerald-800/60">
                      <span>Laba/Rugi Berjalan (Current Net Income)</span>
                      <span className="font-mono">
                        Rp {Number(bsResponse.equity.currentPeriodNetIncome).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200/80 dark:border-white/10 pt-2 flex justify-between font-bold text-xs text-emerald-900 dark:text-emerald-300">
                    <span>Total Ekuitas</span>
                    <span className="font-mono">
                      Rp {Number(bsResponse.equity.totalEquity).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* TOTAL PASIVA */}
                <div className="bg-slate-100/80 dark:bg-white/10 p-3 rounded-xl border border-slate-300 dark:border-white/20 flex justify-between items-center font-bold text-sm text-foreground">
                  <span>TOTAL LIABILITAS + EKUITAS</span>
                  <span className="font-mono">
                    Rp{' '}
                    {(
                      Number(bsResponse.liabilities.totalLiabilities) + Number(bsResponse.equity.totalEquity)
                    ).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
