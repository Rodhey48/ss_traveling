import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Printer,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Landmark,
  Calendar,
  RotateCw,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { CashBankService } from '@/services/cash-bank.service';
import type { BankAccount, CashAccount, StatementReport } from '@/types';
import { toast } from 'sonner';

interface BankStatementViewProps {
  bankAccounts: BankAccount[];
  cashAccounts: CashAccount[];
  selectedAccountId?: string;
  selectedAccountType?: 'BANK' | 'CASH';
}

export default function BankStatementView({
  bankAccounts,
  cashAccounts,
  selectedAccountId,
  selectedAccountType = 'BANK',
}: BankStatementViewProps) {
  const [accountType, setAccountType] = useState<'BANK' | 'CASH'>(selectedAccountType);
  const [accountId, setAccountId] = useState<string>(selectedAccountId || '');

  // Dates
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();

  const [startDate, setStartDate] = useState(`${y}-${m}-01`);
  const [endDate, setEndDate] = useState(`${y}-${m}-${String(lastDay).padStart(2, '0')}`);
  const [activeDatePreset, setActiveDatePreset] = useState<'THIS_MONTH' | 'LAST_MONTH' | 'LAST_30' | 'THIS_YEAR' | 'CUSTOM'>('THIS_MONTH');

  // Loading & Data
  const [loading, setLoading] = useState(false);
  const [statement, setStatement] = useState<StatementReport | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>('ALL');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Auto select first account if not set
  useEffect(() => {
    if (!accountId) {
      if (accountType === 'BANK' && bankAccounts.length > 0) {
        setAccountId(bankAccounts[0].id);
      } else if (accountType === 'CASH' && cashAccounts.length > 0) {
        setAccountId(cashAccounts[0].id);
      }
    }
  }, [accountType, bankAccounts, cashAccounts, accountId]);

  useEffect(() => {
    if (selectedAccountId) {
      setAccountId(selectedAccountId);
      setAccountType(selectedAccountType);
    }
  }, [selectedAccountId, selectedAccountType]);

  // Fetch Statement API
  const fetchStatement = async () => {
    if (!accountId) return;
    setLoading(true);
    try {
      if (accountType === 'BANK') {
        const res = await CashBankService.getBankStatement(accountId, {
          startDate,
          endDate,
        });
        if (res?.data) setStatement(res.data);
      } else {
        const res = await CashBankService.getCashStatement(accountId, {
          startDate,
          endDate,
        });
        if (res?.data) setStatement(res.data);
      }
    } catch (err: any) {
      toast.error('Gagal memuat rekening koran', {
        description: err?.response?.data?.message || err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accountId) {
      fetchStatement();
    }
  }, [accountId, accountType, startDate, endDate]);

  // Quick Date Preset Handlers
  const handleApplyPreset = (preset: 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_30' | 'THIS_YEAR') => {
    const d = new Date();
    setActiveDatePreset(preset);
    setCurrentPage(1);

    if (preset === 'THIS_MONTH') {
      const curY = d.getFullYear();
      const curM = String(d.getMonth() + 1).padStart(2, '0');
      const curLast = new Date(curY, d.getMonth() + 1, 0).getDate();
      setStartDate(`${curY}-${curM}-01`);
      setEndDate(`${curY}-${curM}-${String(curLast).padStart(2, '0')}`);
    } else if (preset === 'LAST_MONTH') {
      const lastMonthDate = new Date(d.getFullYear(), d.getMonth() - 1, 1);
      const lY = lastMonthDate.getFullYear();
      const lM = String(lastMonthDate.getMonth() + 1).padStart(2, '0');
      const lLast = new Date(lY, lastMonthDate.getMonth() + 1, 0).getDate();
      setStartDate(`${lY}-${lM}-01`);
      setEndDate(`${lY}-${lM}-${String(lLast).padStart(2, '0')}`);
    } else if (preset === 'LAST_30') {
      const past30 = new Date(d.getTime() - 30 * 24 * 60 * 60 * 1000);
      setStartDate(past30.toISOString().slice(0, 10));
      setEndDate(d.toISOString().slice(0, 10));
    } else if (preset === 'THIS_YEAR') {
      const curY = d.getFullYear();
      setStartDate(`${curY}-01-01`);
      setEndDate(`${curY}-12-31`);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSourceTypeFilter('ALL');
    setDirectionFilter('ALL');
    setSortOrder('ASC');
    setCurrentPage(1);
    toast.info('Filter pencarian disetel ulang.');
  };

  // Filtered & Sorted Lines (Client-Side Filtering on the loaded Statement Snapshot)
  const filteredLines = useMemo(() => {
    if (!statement?.lines) return [];
    let list = [...statement.lines];

    // 1. Text Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (l) =>
          l.journalNo.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.date.toLowerCase().includes(q) ||
          l.sourceType.toLowerCase().includes(q),
      );
    }

    // 2. Source Type Filter
    if (sourceTypeFilter !== 'ALL') {
      list = list.filter((l) => {
        if (sourceTypeFilter === 'TRANSFER') {
          return l.sourceType === 'TRANSFER' || l.sourceType === 'BANK_TRANSACTION';
        }
        if (sourceTypeFilter === 'AR') {
          return l.sourceType === 'AR_INVOICE' || l.sourceType === 'AR_RECEIPT';
        }
        if (sourceTypeFilter === 'AP') {
          return l.sourceType === 'AP_INVOICE' || l.sourceType === 'AP_PAYMENT';
        }
        if (sourceTypeFilter === 'SPJ') {
          return l.sourceType === 'SPJ';
        }
        if (sourceTypeFilter === 'CASH_TRANSACTION') {
          return l.sourceType === 'CASH_TRANSACTION';
        }
        if (sourceTypeFilter === 'MANUAL') {
          return l.sourceType === 'MANUAL';
        }
        return l.sourceType === sourceTypeFilter;
      });
    }

    // 3. Direction Filter (Inflow / Outflow)
    if (directionFilter === 'IN') {
      list = list.filter((l) => Number(l.debit) > 0);
    } else if (directionFilter === 'OUT') {
      list = list.filter((l) => Number(l.credit) > 0);
    }

    // 4. Sort Order
    if (sortOrder === 'DESC') {
      list.reverse();
    }

    return list;
  }, [statement?.lines, searchQuery, sourceTypeFilter, directionFilter, sortOrder]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sourceTypeFilter, directionFilter, sortOrder, pageSize]);

  // Paginated Slice
  const totalPages = Math.max(1, Math.ceil(filteredLines.length / pageSize));
  const paginatedLines = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredLines.slice(startIdx, startIdx + pageSize);
  }, [filteredLines, currentPage, pageSize]);

  const formatRupiah = (val: string | number) => {
    const num = Number(val);
    if (isNaN(num)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const handlePrint = () => {
    window.print();
  };

  const getSourceTypeLabel = (type: string) => {
    switch (type) {
      case 'SPJ':
        return 'SPJ Kru';
      case 'AR_INVOICE':
      case 'AR_RECEIPT':
        return 'Piutang AR';
      case 'AP_INVOICE':
      case 'AP_PAYMENT':
        return 'Utang AP';
      case 'BANK_TRANSACTION':
      case 'TRANSFER':
        return 'Transfer Bank';
      case 'CASH_TRANSACTION':
        return 'Kas Pool BKK';
      case 'PERIOD_CLOSING':
        return 'Tutup Buku';
      default:
        return type || 'JURNAL';
    }
  };

  const currentAccountName =
    accountType === 'BANK'
      ? bankAccounts.find((b) => b.id === accountId)?.accountName || 'Rekening Bank'
      : cashAccounts.find((c) => c.id === accountId)?.name || 'Kas Pool';

  const currentAccountCode =
    accountType === 'BANK'
      ? bankAccounts.find((b) => b.id === accountId)?.code || ''
      : cashAccounts.find((c) => c.id === accountId)?.code || '';

  const isFiltersActive =
    searchQuery.trim() !== '' ||
    sourceTypeFilter !== 'ALL' ||
    directionFilter !== 'ALL' ||
    sortOrder !== 'ASC';

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar & Account Selector */}
      <Card className="shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Account Switcher */}
            <div className="flex items-center gap-2.5">
              <div className="flex rounded-lg border p-0.5 bg-muted">
                <button
                  type="button"
                  onClick={() => {
                    setAccountType('BANK');
                    if (bankAccounts[0]) setAccountId(bankAccounts[0].id);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-1.5 ${
                    accountType === 'BANK'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Landmark className="w-3.5 h-3.5" /> Bank
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAccountType('CASH');
                    if (cashAccounts[0]) setAccountId(cashAccounts[0].id);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-1.5 ${
                    accountType === 'CASH'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5" /> Kas Fisik
                </button>
              </div>

              <div className="w-72">
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder="Pilih Rekening" />
                  </SelectTrigger>
                  <SelectContent>
                    {accountType === 'BANK'
                      ? bankAccounts.map((b) => (
                          <SelectItem key={b.id} value={b.id} className="text-xs">
                            {b.bankName} - {b.accountName} ({b.accountNumberMasked || b.accountNumber})
                          </SelectItem>
                        ))
                      : cashAccounts.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="text-xs">
                            {c.code} - {c.name}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date Range Inputs & Print */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-muted-foreground">Dari:</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setActiveDatePreset('CUSTOM');
                  }}
                  className="w-34 text-xs h-9"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-muted-foreground">S.d:</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setActiveDatePreset('CUSTOM');
                  }}
                  className="w-34 text-xs h-9"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchStatement}
                disabled={loading}
                className="h-9 gap-1 text-xs"
              >
                <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Segarkan
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="h-9 gap-1 text-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Koran
              </Button>
            </div>
          </div>

          {/* Quick Date Presets */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span>Preset Periode Cepat:</span>
              <button
                type="button"
                onClick={() => handleApplyPreset('THIS_MONTH')}
                className={`px-2.5 py-1 rounded-md transition ${
                  activeDatePreset === 'THIS_MONTH'
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('LAST_MONTH')}
                className={`px-2.5 py-1 rounded-md transition ${
                  activeDatePreset === 'LAST_MONTH'
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
              >
                Bulan Lalu
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('LAST_30')}
                className={`px-2.5 py-1 rounded-md transition ${
                  activeDatePreset === 'LAST_30'
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
              >
                30 Hari Terakhir
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('THIS_YEAR')}
                className={`px-2.5 py-1 rounded-md transition ${
                  activeDatePreset === 'THIS_YEAR'
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
              >
                Tahun Berjalan
              </button>
            </div>

            <div className="text-[11px] text-muted-foreground">
              Rentang Aktif: <strong className="text-foreground">{startDate}</strong> s.d. <strong className="text-foreground">{endDate}</strong>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. KPI Cards: Saldo Awal, Masuk, Keluar, Saldo Akhir */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo Awal */}
        <Card className="shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Saldo Awal Periode</span>
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-2 text-xl font-bold font-mono text-foreground">
              {formatRupiah(statement?.openingBalance || 0)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Sebelum {startDate}</p>
          </CardContent>
        </Card>

        {/* Card 2: Total Masuk */}
        <Card className="shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Total Masuk (Debit)</span>
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                <ArrowDownLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="mt-2 text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              +{formatRupiah(statement?.totalDebit || 0)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Penerimaan & dropping dana</p>
          </CardContent>
        </Card>

        {/* Card 3: Total Keluar */}
        <Card className="shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Total Keluar (Kredit)</span>
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                <ArrowUpRight className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </div>
            </div>
            <div className="mt-2 text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
              -{formatRupiah(statement?.totalCredit || 0)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Pengeluaran operasional armada</p>
          </CardContent>
        </Card>

        {/* Card 4: Saldo Akhir */}
        <Card className="shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Saldo Akhir Berjalan</span>
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                <Wallet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div className="mt-2 text-xl font-bold font-mono text-foreground">
              {formatRupiah(statement?.endingBalance || 0)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Posisi Buku Besar (GL)</p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Statement Table Container with Comprehensive Filter & Pagination */}
      <Card className="shadow-xs overflow-hidden">
        <CardHeader className="p-4 border-b space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Rekening Koran: {currentAccountName}
                <Badge variant="outline" className="text-[11px] font-mono font-normal text-muted-foreground">
                  {currentAccountCode}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Mutasi pembukuan terposting periode {startDate} s.d. {endDate}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-xs">
                {filteredLines.length} Mutasi
              </Badge>
            </div>
          </div>

          {/* Search, Source Filter, Direction Filter, and Sort Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 pt-1">
            {/* Search Input */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari no. jurnal, keterangan transaksi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-8"
              />
            </div>

            {/* Source Type Filter */}
            <div>
              <Select value={sourceTypeFilter} onValueChange={setSourceTypeFilter}>
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="Tipe Dokumen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">Semua Dokumen</SelectItem>
                  <SelectItem value="SPJ" className="text-xs">SPJ Kru Perjalanan</SelectItem>
                  <SelectItem value="TRANSFER" className="text-xs">Mutasi Pemindahan Dana</SelectItem>
                  <SelectItem value="AR" className="text-xs">Piutang Pelanggan (AR)</SelectItem>
                  <SelectItem value="AP" className="text-xs">Tagihan Vendor (AP)</SelectItem>
                  <SelectItem value="CASH_TRANSACTION" className="text-xs">Kas Pool / Petty Cash</SelectItem>
                  <SelectItem value="MANUAL" className="text-xs">Jurnal Memorial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Direction Filter (In / Out) */}
            <div>
              <Select value={directionFilter} onValueChange={(val: any) => setDirectionFilter(val)}>
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="Arah Dana" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">Semua Arah</SelectItem>
                  <SelectItem value="IN" className="text-xs">Masuk (+Debit Saja)</SelectItem>
                  <SelectItem value="OUT" className="text-xs">Keluar (-Kredit Saja)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sorting & Reset */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
                className="h-8 text-xs flex-1 gap-1"
                title="Beralih urutan kronologis"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{sortOrder === 'ASC' ? 'Terlama' : 'Terbaru'}</span>
              </Button>

              {isFiltersActive && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                  title="Reset Filter"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="w-[110px] cursor-pointer hover:bg-muted/40 transition select-none"
                  onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
                  title="Klik untuk mengubah urutan tanggal"
                >
                  <div className="flex items-center gap-1">
                    <span>Tanggal</span>
                    <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead className="w-[140px]">No. Jurnal</TableHead>
                <TableHead className="w-[130px]">Tipe</TableHead>
                <TableHead>Keterangan & Rincian Transaksi</TableHead>
                <TableHead className="text-right w-[140px]">Masuk (Rp)</TableHead>
                <TableHead className="text-right w-[140px]">Keluar (Rp)</TableHead>
                <TableHead className="text-right w-[150px]">Saldo Berjalan (Rp)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {/* Row Saldo Awal: tampil di awal jika halaman 1, urutan ASC, dan tidak sedang search */}
              {currentPage === 1 && sortOrder === 'ASC' && !searchQuery.trim() && sourceTypeFilter === 'ALL' && directionFilter === 'ALL' && (
                <TableRow className="bg-muted/30 text-muted-foreground">
                  <TableCell>{startDate}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">-</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                      SALDO AWAL
                    </Badge>
                  </TableCell>
                  <TableCell className="italic text-muted-foreground font-medium">
                    Saldo Awal Periode Berjalan
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">-</TableCell>
                  <TableCell className="text-right text-muted-foreground">-</TableCell>
                  <TableCell className="text-right font-mono font-bold text-foreground">
                    {formatRupiah(statement?.openingBalance || 0)}
                  </TableCell>
                </TableRow>
              )}

              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <RotateCw className="w-4 h-4 animate-spin mx-auto mb-2 text-muted-foreground" />
                    Memuat rincian mutasi...
                  </TableCell>
                </TableRow>
              ) : paginatedLines.length > 0 ? (
                paginatedLines.map((line) => {
                  const isDebit = Number(line.debit) > 0;
                  const isCredit = Number(line.credit) > 0;
                  return (
                    <TableRow key={line.id} className="hover:bg-muted/50">
                      <TableCell className="text-muted-foreground whitespace-nowrap">{line.date}</TableCell>
                      <TableCell className="font-mono font-medium text-foreground">
                        {line.journalNo}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-normal font-mono text-muted-foreground">
                          {getSourceTypeLabel(line.sourceType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md truncate" title={line.description}>
                        {line.description}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {isDebit ? `+${formatRupiah(line.debit)}` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-rose-600 dark:text-rose-400">
                        {isCredit ? `-${formatRupiah(line.credit)}` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-foreground">
                        {formatRupiah(line.runningBalance)}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {isFiltersActive
                      ? 'Tidak ada mutasi yang cocok dengan kriteria pencarian & filter Anda.'
                      : `Tidak ada mutasi transaksi pada rentang periode ${startDate} s.d. ${endDate}.`}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* 4. Pagination Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border-t text-xs">
            {/* Info Range */}
            <div className="text-muted-foreground">
              {filteredLines.length > 0 ? (
                <>
                  Menampilkan{' '}
                  <strong className="text-foreground">
                    {(currentPage - 1) * pageSize + 1}
                  </strong>{' '}
                  &ndash;{' '}
                  <strong className="text-foreground">
                    {Math.min(currentPage * pageSize, filteredLines.length)}
                  </strong>{' '}
                  dari <strong className="text-foreground">{filteredLines.length}</strong> mutasi
                </>
              ) : (
                '0 mutasi'
              )}
            </div>

            {/* Limit Selector & Page Navigation */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span>Baris:</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(val) => {
                    setPageSize(Number(val));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-18 text-xs h-7">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10" className="text-xs">10</SelectItem>
                    <SelectItem value="25" className="text-xs">25</SelectItem>
                    <SelectItem value="50" className="text-xs">50</SelectItem>
                    <SelectItem value="100" className="text-xs">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1 || loading}
                  className="h-7 px-2 text-xs gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sebelumnya</span>
                </Button>

                <div className="px-2 text-xs font-medium text-foreground">
                  Halaman {currentPage} / {totalPages}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages || loading}
                  className="h-7 px-2 text-xs gap-1"
                >
                  <span className="hidden sm:inline">Berikutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
