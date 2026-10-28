import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Scale,
  BookOpen,
  RefreshCw,
  TrendingUp,
  Building2,
  CheckCircle2,
  AlertTriangle,
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
import type { Account } from '@/types';

export default function GeneralLedgerPage() {
  const [activeTab, setActiveTab] = useState<'GL' | 'TB' | 'PNL' | 'BS'>('GL');

  // Shared Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [asOfDate, setAsOfDate] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');

  // Load Accounts for dropdown
  const { data: accountsData } = useQuery({
    queryKey: ['accounts-list'],
    queryFn: () => AccountService.findAll({ isPostable: true }),
  });
  const postableAccounts = (accountsData?.data as Account[]) || [];

  // Query GL
  const {
    data: glData,
    isLoading: isGlLoading,
    refetch: refetchGl,
  } = useQuery({
    queryKey: ['report-gl', selectedAccountId, startDate, endDate],
    queryFn: () =>
      ReportService.getGeneralLedger({
        accountId: selectedAccountId === 'ALL' ? undefined : selectedAccountId,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
    enabled: activeTab === 'GL',
  });

  // Query Trial Balance
  const {
    data: tbData,
    isLoading: isTbLoading,
    refetch: refetchTb,
  } = useQuery({
    queryKey: ['report-tb', startDate, endDate],
    queryFn: () =>
      ReportService.getTrialBalance({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
    enabled: activeTab === 'TB',
  });

  // Query Income Statement (P&L)
  const {
    data: pnlData,
    isLoading: isPnlLoading,
    refetch: refetchPnl,
  } = useQuery({
    queryKey: ['report-pnl', startDate, endDate],
    queryFn: () =>
      ReportService.getIncomeStatement({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
    enabled: activeTab === 'PNL',
  });

  // Query Balance Sheet
  const {
    data: bsData,
    isLoading: isBsLoading,
    refetch: refetchBs,
  } = useQuery({
    queryKey: ['report-bs', asOfDate],
    queryFn: () =>
      ReportService.getBalanceSheet({
        asOfDate: asOfDate || undefined,
      }),
    enabled: activeTab === 'BS',
  });

  const glResponse = glData?.data;
  const tbResponse = tbData?.data;
  const pnlResponse = pnlData?.data;
  const bsResponse = bsData?.data;

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-700 text-white shadow-sm">
            <Scale className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Laporan Finansial & Akuntansi
            </h1>
            <p className="text-sm text-gray-500">
              Buku Besar (GL), Neraca Saldo, Laba Rugi Komprehensif, dan Neraca Keuangan PT SS Traveling Official
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
          className="h-9 text-xs gap-1.5 self-start md:self-auto"
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
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-3 items-center">
            <div className="w-full sm:w-72">
              <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Pilih Akun COA</label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Semua Akun Aktif" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Akun dengan Mutasi</SelectItem>
                  {postableAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Dari Tanggal</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 text-xs w-40"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Sampai Tanggal</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 text-xs w-40"
              />
            </div>
          </div>

          {isGlLoading ? (
            <div className="bg-white p-16 text-center text-gray-500 rounded-xl border border-gray-200">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-2" />
              <span>Memuat buku besar akun...</span>
            </div>
          ) : !glResponse || glResponse.accounts.length === 0 ? (
            <div className="bg-white p-12 text-center text-gray-400 rounded-xl border border-gray-200 text-xs">
              Tidak ada pergerakan transaksi jurnal terposting pada filter ini.
            </div>
          ) : (
            <div className="space-y-6">
              {glResponse.accounts.map((acc) => (
                <div key={acc.accountId} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  {/* ACCOUNT HEADER */}
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                        {acc.accountCode}
                      </span>
                      <span className="font-bold text-gray-900 text-sm">{acc.accountName}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {acc.accountType}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] text-gray-500">
                        Saldo Normal: {acc.normalBalance}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div>
                        <span className="text-gray-500 text-[10px] block">Saldo Awal</span>
                        <span className="font-semibold text-gray-800">
                          Rp {Number(acc.openingBalance).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 text-[10px] block">Mutasi Debit</span>
                        <span className="font-semibold text-blue-700">
                          Rp {Number(acc.totalDebit).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 text-[10px] block">Mutasi Kredit</span>
                        <span className="font-semibold text-rose-700">
                          Rp {Number(acc.totalCredit).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="border-l pl-4">
                        <span className="text-gray-500 text-[10px] block">Saldo Akhir</span>
                        <span className="font-bold text-emerald-800 text-sm">
                          Rp {Number(acc.endingBalance).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* LINES TABLE */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100 uppercase text-[10px] font-semibold">
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
                      <tbody className="divide-y divide-gray-100 font-mono">
                        {acc.lines.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-4 text-gray-400 font-sans text-xs">
                              Tidak ada mutasi dalam rentang tanggal ini. (Hanya membawa saldo awal)
                            </td>
                          </tr>
                        ) : (
                          acc.lines.map((line) => (
                            <tr key={line.lineId} className="hover:bg-gray-50/60">
                              <td className="py-2 px-3 text-gray-600 font-sans">{line.journalDate}</td>
                              <td className="py-2 px-3 font-bold text-blue-700">{line.journalNo}</td>
                              <td className="py-2 px-3">
                                <Badge variant="outline" className="text-[9px]">
                                  {line.sourceType}
                                </Badge>
                              </td>
                              <td className="py-2 px-3 text-gray-700 font-sans">{line.description}</td>
                              <td className="py-2 px-3 text-right text-gray-900">
                                {Number(line.debit) > 0
                                  ? `Rp ${Number(line.debit).toLocaleString('id-ID')}`
                                  : '-'}
                              </td>
                              <td className="py-2 px-3 text-right text-gray-900">
                                {Number(line.credit) > 0
                                  ? `Rp ${Number(line.credit).toLocaleString('id-ID')}`
                                  : '-'}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-emerald-800">
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
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Dari Tanggal</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 text-xs w-40"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Sampai Tanggal</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 text-xs w-40"
                />
              </div>
            </div>

            {tbResponse && (
              <div className="flex items-center gap-2">
                {tbResponse.totals.isBalanced ? (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 py-1 px-3 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Neraca Saldo Seimbang (Balanced)
                  </Badge>
                ) : (
                  <Badge className="bg-rose-100 text-rose-800 border-rose-300 py-1 px-3 text-xs flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    Neraca Saldo Tidak Seimbang!
                  </Badge>
                )}
              </div>
            )}
          </div>

          {isTbLoading ? (
            <div className="bg-white p-16 text-center text-gray-500 rounded-xl border border-gray-200">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-2" />
              <span>Menyusun neraca saldo...</span>
            </div>
          ) : !tbResponse || tbResponse.items.length === 0 ? (
            <div className="bg-white p-12 text-center text-gray-400 rounded-xl border border-gray-200 text-xs">
              Tidak ada data neraca saldo untuk periode ini.
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 text-gray-700 font-semibold uppercase text-[10px] border-b border-gray-200">
                    <tr>
                      <th rowSpan={2} className="py-2 px-3 border-r border-gray-200">Kode</th>
                      <th rowSpan={2} className="py-2 px-3 border-r border-gray-200">Nama Akun</th>
                      <th colSpan={2} className="py-1 px-3 text-center border-b border-r border-gray-200 bg-gray-50">
                        Saldo Awal
                      </th>
                      <th colSpan={2} className="py-1 px-3 text-center border-b border-r border-gray-200 bg-gray-50">
                        Mutasi Periode
                      </th>
                      <th colSpan={2} className="py-1 px-3 text-center border-b border-gray-200 bg-gray-50">
                        Saldo Akhir
                      </th>
                    </tr>
                    <tr className="text-[10px] text-gray-500">
                      <th className="py-1 px-2.5 text-right border-r border-gray-200">Debit</th>
                      <th className="py-1 px-2.5 text-right border-r border-gray-200">Kredit</th>
                      <th className="py-1 px-2.5 text-right border-r border-gray-200">Debit</th>
                      <th className="py-1 px-2.5 text-right border-r border-gray-200">Kredit</th>
                      <th className="py-1 px-2.5 text-right border-r border-gray-200">Debit</th>
                      <th className="py-1 px-2.5 text-right">Kredit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                    {tbResponse.items.map((item) => (
                      <tr key={item.accountId} className="hover:bg-gray-50/70">
                        <td className="py-2 px-3 font-bold text-gray-900 border-r border-gray-100">
                          {item.accountCode}
                        </td>
                        <td className="py-2 px-3 font-sans text-gray-800 border-r border-gray-100">
                          {item.accountName}
                        </td>
                        <td className="py-2 px-2.5 text-right border-r border-gray-100">
                          {Number(item.openingDebit) > 0 ? Number(item.openingDebit).toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="py-2 px-2.5 text-right border-r border-gray-100">
                          {Number(item.openingCredit) > 0 ? Number(item.openingCredit).toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="py-2 px-2.5 text-right border-r border-gray-100 text-blue-800">
                          {Number(item.periodDebit) > 0 ? Number(item.periodDebit).toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="py-2 px-2.5 text-right border-r border-gray-100 text-rose-800">
                          {Number(item.periodCredit) > 0 ? Number(item.periodCredit).toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="py-2 px-2.5 text-right border-r border-gray-100 font-bold text-gray-900">
                          {Number(item.endingDebit) > 0 ? Number(item.endingDebit).toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="py-2 px-2.5 text-right font-bold text-gray-900">
                          {Number(item.endingCredit) > 0 ? Number(item.endingCredit).toLocaleString('id-ID') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100 font-mono font-bold text-xs text-gray-900 border-t-2 border-gray-300">
                    <tr>
                      <td colSpan={2} className="py-2.5 px-3 text-right uppercase border-r border-gray-200 font-sans">
                        Grand Total
                      </td>
                      <td className="py-2.5 px-2.5 text-right border-r border-gray-200">
                        Rp {Number(tbResponse.totals.openingDebit).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-2.5 text-right border-r border-gray-200">
                        Rp {Number(tbResponse.totals.openingCredit).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-2.5 text-right border-r border-gray-200 text-blue-900">
                        Rp {Number(tbResponse.totals.periodDebit).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-2.5 text-right border-r border-gray-200 text-rose-900">
                        Rp {Number(tbResponse.totals.periodCredit).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-2.5 text-right border-r border-gray-200 text-emerald-900">
                        Rp {Number(tbResponse.totals.endingDebit).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-2.5 text-right text-emerald-900">
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
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-3 items-center">
            <div>
              <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Dari Tanggal</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 text-xs w-40"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Sampai Tanggal</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 text-xs w-40"
              />
            </div>
          </div>

          {isPnlLoading ? (
            <div className="bg-white p-16 text-center text-gray-500 rounded-xl border border-gray-200">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-2" />
              <span>Mengkalkulasi laba rugi operasional...</span>
            </div>
          ) : !pnlResponse ? (
            <div className="bg-white p-12 text-center text-gray-400 rounded-xl border border-gray-200 text-xs">
              Data tidak tersedia.
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6 max-w-4xl mx-auto">
              {/* PNL TITLE */}
              <div className="text-center pb-4 border-b">
                <h3 className="text-lg font-bold text-gray-900">PT SS TRAVELINK OFFICIAL</h3>
                <h4 className="text-base font-semibold text-gray-800">LAPORAN LABA RUGI KOMPREHENSIF</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Periode: {pnlResponse.periodInfo.startDate} s/d {pnlResponse.periodInfo.endDate}
                </p>
              </div>

              {/* I. PENDAPATAN OPERASIONAL */}
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-gray-100 p-2.5 rounded-lg text-xs font-bold text-gray-800">
                  <span>I. PENDAPATAN OPERASIONAL (REVENUE)</span>
                  <span className="font-mono text-emerald-800">
                    Rp {Number(pnlResponse.revenues.totalRevenue).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="pl-4 space-y-2 text-xs">
                  {pnlResponse.revenues.groups.map((grp) => (
                    <div key={grp.groupCode} className="space-y-1">
                      <div className="flex justify-between font-semibold text-gray-700">
                        <span>{grp.groupName}</span>
                        <span className="font-mono">Rp {Number(grp.subtotal).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="pl-4 space-y-0.5 text-gray-500 text-[11px]">
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
                <div className="flex justify-between items-center bg-gray-100 p-2.5 rounded-lg text-xs font-bold text-gray-800">
                  <span>II. BEBAN OPERASIONAL ARMADA, KRU & POOL</span>
                  <span className="font-mono text-rose-800">
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
                      <div className="font-bold text-gray-800 border-b pb-0.5">{cat.label}</div>
                      {cat.groups.map((grp) => (
                        <div key={grp.groupCode} className="pl-2 space-y-0.5">
                          <div className="flex justify-between font-semibold text-gray-700">
                            <span>{grp.groupName}</span>
                            <span className="font-mono">Rp {Number(grp.subtotal).toLocaleString('id-ID')}</span>
                          </div>
                          <div className="pl-3 space-y-0.5 text-gray-500 text-[11px]">
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
              <div className="border-t-2 border-gray-300 pt-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-gray-700">
                  <span className="font-sans font-bold">Laba Kotor (Gross Margin)</span>
                  <span className="font-bold">Rp {Number(pnlResponse.grossProfit).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span className="font-sans font-bold">Laba Operasional (Operating Profit)</span>
                  <span className="font-bold">Rp {Number(pnlResponse.operatingProfit).toLocaleString('id-ID')}</span>
                </div>
                <div
                  className={`flex justify-between p-3 rounded-xl border text-sm font-bold ${
                    Number(pnlResponse.netIncome) >= 0
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                      : 'bg-red-50 text-red-900 border-red-300'
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
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Posisi Per Tanggal</label>
                <Input
                  type="date"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                  className="h-9 text-xs w-44"
                />
              </div>
            </div>

            {bsResponse && (
              <div>
                {bsResponse.isBalanced ? (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 py-1 px-3 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Neraca Seimbang (Aset = Liabilitas + Ekuitas)
                  </Badge>
                ) : (
                  <Badge className="bg-rose-100 text-rose-800 border-rose-300 py-1 px-3 text-xs flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    Neraca Tidak Seimbang!
                  </Badge>
                )}
              </div>
            )}
          </div>

          {isBsLoading ? (
            <div className="bg-white p-16 text-center text-gray-500 rounded-xl border border-gray-200">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-2" />
              <span>Menghitung posisi neraca aset & liabilitas...</span>
            </div>
          ) : !bsResponse ? (
            <div className="bg-white p-12 text-center text-gray-400 rounded-xl border border-gray-200 text-xs">
              Data tidak tersedia.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SISI KIRI: ASET */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-700" />
                    ASET (AKTIVA)
                  </h3>
                  <span className="font-mono font-bold text-blue-900 text-sm">
                    Rp {Number(bsResponse.assets.totalAssets).toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="space-y-4 text-xs">
                  {bsResponse.assets.categories.map((cat) => (
                    <div key={cat.categoryCode} className="space-y-1">
                      <div className="flex justify-between font-bold text-gray-800 bg-gray-50 p-1.5 rounded">
                        <span>{cat.categoryName}</span>
                        <span className="font-mono">Rp {Number(cat.subtotal).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="pl-3 space-y-0.5 text-gray-600 text-[11px]">
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

                <div className="border-t pt-3 flex justify-between font-bold text-sm bg-blue-50/50 p-2.5 rounded-lg text-blue-900">
                  <span>TOTAL ASET</span>
                  <span className="font-mono">Rp {Number(bsResponse.assets.totalAssets).toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* SISI KANAN: LIABILITAS & EKUITAS */}
              <div className="space-y-6">
                {/* LIABILITAS */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <Scale className="h-4 w-4 text-rose-700" />
                      LIABILITAS (KEWAJIBAN / UTANG)
                    </h3>
                    <span className="font-mono font-bold text-rose-900 text-sm">
                      Rp {Number(bsResponse.liabilities.totalLiabilities).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="space-y-4 text-xs">
                    {bsResponse.liabilities.categories.map((cat) => (
                      <div key={cat.categoryCode} className="space-y-1">
                        <div className="flex justify-between font-bold text-gray-800 bg-gray-50 p-1.5 rounded">
                          <span>{cat.categoryName}</span>
                          <span className="font-mono">Rp {Number(cat.subtotal).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="pl-3 space-y-0.5 text-gray-600 text-[11px]">
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

                  <div className="border-t pt-2 flex justify-between font-bold text-xs text-rose-900">
                    <span>Total Liabilitas</span>
                    <span className="font-mono">
                      Rp {Number(bsResponse.liabilities.totalLiabilities).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* EKUITAS */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-700" />
                      EKUITAS (MODAL)
                    </h3>
                    <span className="font-mono font-bold text-emerald-900 text-sm">
                      Rp {Number(bsResponse.equity.totalEquity).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {bsResponse.equity.categories.map((cat) => (
                      <div key={cat.categoryCode} className="space-y-1">
                        <div className="flex justify-between font-bold text-gray-800 bg-gray-50 p-1.5 rounded">
                          <span>{cat.categoryName}</span>
                          <span className="font-mono">Rp {Number(cat.subtotal).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="pl-3 space-y-0.5 text-gray-600 text-[11px]">
                          {cat.items.map((item) => (
                            <div key={item.accountCode} className="flex justify-between">
                              <span>{item.accountCode} - {item.accountName}</span>
                              <span className="font-mono">Rp {Number(item.amount).toLocaleString('id-ID')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-between font-bold text-emerald-800 bg-emerald-50 p-2 rounded text-xs border border-emerald-200">
                      <span>Laba/Rugi Berjalan (Current Net Income)</span>
                      <span className="font-mono">
                        Rp {Number(bsResponse.equity.currentPeriodNetIncome).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-2 flex justify-between font-bold text-xs text-emerald-900">
                    <span>Total Ekuitas</span>
                    <span className="font-mono">
                      Rp {Number(bsResponse.equity.totalEquity).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* TOTAL PASIVA */}
                <div className="bg-gray-100 p-3 rounded-xl border border-gray-300 flex justify-between items-center font-bold text-sm text-gray-900">
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
