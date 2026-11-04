import ConfirmDialog from '@/components/shared/confirm-dialog';
import Heading from '@/components/shared/heading';
import {
  BankAccountCardSkeleton,
  MetricCardGridSkeleton,
  TableSkeletonRows,
} from '@/components/shared/skeleton-loaders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermission } from '@/hooks/use-permission';
import { AccountService } from '@/services/account.service';
import { CashBankService } from '@/services/cash-bank.service';
import { OrganizationService } from '@/services/organization.service';
import { UserService } from '@/services/user.service';
import type {
  Account,
  BankAccount,
  BankAccountFormData,
  CashAccount,
  CashAccountFormData,
  CostCenter,
  User,
} from '@/types';
import {
  Building,
  Coins,
  Copy,
  CreditCard,
  Edit,
  Landmark,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  User as UserIcon,
  Wallet,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import BankAccountModal from './components/bank-account-modal';
import CashAccountModal from './components/cash-account-modal';

export default function CashBankPage() {
  const { isCreate, isUpdate, isDelete } = usePermission();
  const [activeTab, setActiveTab] = useState<'cash' | 'bank'>('cash');
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [glAccounts, setGlAccounts] = useState<Account[]>([]);
  const [custodianUsers, setCustodianUsers] = useState<User[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(false);

  // Search & Debounce
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [costCenterFilter, setCostCenterFilter] = useState<string>('ALL');
  const [bankNameFilter, setBankNameFilter] = useState<string>('ALL');

  // Modals state
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [selectedCash, setSelectedCash] = useState<CashAccount | null>(null);

  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<BankAccount | null>(null);

  const [submitting, setSubmitting] = useState(false);

  // Confirm Dialog for Delete/Deactivate
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'cash' | 'bank';
    item: CashAccount | BankAccount;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Currency Formatter
  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  // Debounce search effect (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchMasterDependencies = async () => {
    try {
      const [accRes, userRes, ccRes] = await Promise.all([
        AccountService.findAll({ type: 'ASSET', isPostable: true }),
        UserService.findAll({ limit: 100 }),
        OrganizationService.getCostCenters(),
      ]);

      if (accRes?.data) setGlAccounts(accRes.data as Account[]);
      if (userRes?.data?.data) setCustodianUsers(userRes.data.data);
      if (ccRes?.data) setCostCenters(ccRes.data);
    } catch (err: unknown) {
      console.error('Failed fetching master dependencies', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const includeInactive = statusFilter !== 'ACTIVE';
      const [cashRes, bankRes] = await Promise.all([
        CashBankService.findAllCashAccounts({
          search: debouncedSearch || undefined,
          costCenterId: costCenterFilter === 'ALL' ? undefined : costCenterFilter,
          includeInactive,
        }),
        CashBankService.findAllBankAccounts({
          search: debouncedSearch || undefined,
          bankName: bankNameFilter === 'ALL' ? undefined : bankNameFilter,
          includeInactive,
        }),
      ]);

      if (cashRes?.data) {
        let filteredCash = cashRes.data;
        if (statusFilter === 'INACTIVE') {
          filteredCash = filteredCash.filter((c) => !c.isActive);
        } else if (statusFilter === 'ACTIVE') {
          filteredCash = filteredCash.filter((c) => c.isActive);
        }
        setCashAccounts(filteredCash);
      }

      if (bankRes?.data) {
        let filteredBanks = bankRes.data;
        if (statusFilter === 'INACTIVE') {
          filteredBanks = filteredBanks.filter((b) => !b.isActive);
        } else if (statusFilter === 'ACTIVE') {
          filteredBanks = filteredBanks.filter((b) => b.isActive);
        }
        setBankAccounts(filteredBanks);
      }
    } catch (err: any) {
      toast.error('Gagal memuat data kas & rekening bank', {
        description: err?.response?.data?.message || err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterDependencies();
  }, []);

  useEffect(() => {
    fetchData();
  }, [debouncedSearch, statusFilter, costCenterFilter, bankNameFilter]);

  const isFilterActive =
    searchInput.trim() !== '' ||
    statusFilter !== 'ALL' ||
    costCenterFilter !== 'ALL' ||
    bankNameFilter !== 'ALL';

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setStatusFilter('ALL');
    setCostCenterFilter('ALL');
    setBankNameFilter('ALL');
  };

  // Cash Handlers
  const handleOpenCreateCash = () => {
    setSelectedCash(null);
    setIsCashModalOpen(true);
  };

  const handleOpenEditCash = (cash: CashAccount) => {
    setSelectedCash(cash);
    setIsCashModalOpen(true);
  };

  const handleSubmitCash = async (data: CashAccountFormData) => {
    setSubmitting(true);
    try {
      if (selectedCash) {
        await CashBankService.updateCashAccount(selectedCash.id, data);
        toast.success(`Rekening kas '${data.name}' berhasil diperbarui`);
      } else {
        await CashBankService.createCashAccount(data);
        toast.success(`Rekening kas '${data.name}' berhasil dibuat`);
      }
      setIsCashModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error('Gagal menyimpan rekening kas', {
        description: err?.response?.data?.message || err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Bank Handlers
  const handleOpenCreateBank = () => {
    setSelectedBank(null);
    setIsBankModalOpen(true);
  };

  const handleOpenEditBank = (bank: BankAccount) => {
    setSelectedBank(bank);
    setIsBankModalOpen(true);
  };

  const handleSubmitBank = async (data: BankAccountFormData) => {
    setSubmitting(true);
    try {
      if (selectedBank) {
        await CashBankService.updateBankAccount(selectedBank.id, data);
        toast.success(`Rekening bank '${data.bankName}' berhasil diperbarui`);
      } else {
        await CashBankService.createBankAccount(data);
        toast.success(`Rekening bank '${data.bankName}' berhasil dibuat`);
      }
      setIsBankModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error('Gagal menyimpan rekening bank', {
        description: err?.response?.data?.message || err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete / Deactivate Confirm Handler
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      if (itemToDelete.type === 'cash') {
        const cash = itemToDelete.item as CashAccount;
        await CashBankService.removeCashAccount(cash.id);
        toast.success(`Rekening kas '${cash.name}' berhasil dinonaktifkan`);
      } else {
        const bank = itemToDelete.item as BankAccount;
        await CashBankService.removeBankAccount(bank.id);
        toast.success(`Rekening bank '${bank.bankName}' berhasil dinonaktifkan`);
      }
      setItemToDelete(null);
      fetchData();
    } catch (err: any) {
      toast.error('Gagal memproses penonaktifan', {
        description: err?.response?.data?.message || err.message,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyAccountNumber = (e: React.MouseEvent, accNumber: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(accNumber);
    toast.success('Nomor rekening disalin ke clipboard!', {
      description: accNumber,
    });
  };

  // Saldo Total Akumulasi
  const totalCashBalance = useMemo(
    () =>
      cashAccounts.reduce(
        (sum, c) => sum + (Number(c.currentBalance) || 0),
        0,
      ),
    [cashAccounts],
  );

  const totalBankBalance = useMemo(
    () =>
      bankAccounts.reduce(
        (sum, b) => sum + (Number(b.currentBalance) || 0),
        0,
      ),
    [bankAccounts],
  );

  const totalLiquidity = totalCashBalance + totalBankBalance;

  return (
    <div className="space-y-6 p-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Heading
          title="Master Kas & Rekening Bank Korporat"
          description="Pusat konfigurasi rekening kas fisik pool garasi, rekening korporat penerimaan & operasional, dan integrasi saldo GL."
        />
        <div className="flex items-center space-x-2">
          {activeTab === 'cash' ? (
            isCreate && (
              <Button onClick={handleOpenCreateCash} className="h-9 text-xs gap-1.5">
                <Plus className="h-4 w-4" /> Tambah Rekening Kas
              </Button>
            )
          ) : (
            isCreate && (
              <Button onClick={handleOpenCreateBank} className="h-9 text-xs gap-1.5">
                <Plus className="h-4 w-4" /> Tambah Rekening Bank
              </Button>
            )
          )}
        </div>
      </div>

      {/* KPI Stats Cards - Live GL Balance */}
      {loading && cashAccounts.length === 0 && bankAccounts.length === 0 ? (
        <MetricCardGridSkeleton count={3} />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-primary">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                <span>Total Saldo Kas Fisik Pool</span>
                <Wallet className="h-4 w-4 text-primary" />
              </CardTitle>
              <div className="text-2xl font-black text-foreground tracking-tight mt-1">
                {formatCurrency(totalCashBalance)}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Dari <strong className="text-foreground">{cashAccounts.length}</strong> titik kas fisik aktif
              </p>
            </CardHeader>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-blue-600">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                <span>Total Saldo Bank Korporat</span>
                <Landmark className="h-4 w-4 text-blue-600" />
              </CardTitle>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight mt-1">
                {formatCurrency(totalBankBalance)}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Dari <strong className="text-foreground">{bankAccounts.length}</strong> rekening perbankan aktif
              </p>
            </CardHeader>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-emerald-600">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                <span>Total Likuiditas Kas & Bank</span>
                <Coins className="h-4 w-4 text-emerald-600" />
              </CardTitle>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight mt-1">
                {formatCurrency(totalLiquidity)}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Akumulasi saldo berjalan kas dan bank GL real-time
              </p>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Tabs View */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'cash' | 'bank')}
        className="space-y-4"
      >
        {/* Navigation Tabs Bar & Toolbar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md p-3 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs">
          <TabsList className="grid w-full sm:w-105 grid-cols-2">
            <TabsTrigger value="cash" className="flex items-center space-x-2 text-xs">
              <Wallet className="h-4 w-4" />
              <span>Kas Fisik ({cashAccounts.length})</span>
            </TabsTrigger>
            <TabsTrigger value="bank" className="flex items-center space-x-2 text-xs">
              <Landmark className="h-4 w-4" />
              <span>Rekening Bank ({bankAccounts.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Filter & Live Search Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Input Search dengan Debounce */}
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari kode, nama, no rek..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 pr-8 h-8.5 text-xs"
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

            {/* Filter Status Keaktifan */}
            <Select
              value={statusFilter}
              onValueChange={(val: 'ALL' | 'ACTIVE' | 'INACTIVE') =>
                setStatusFilter(val)
              }
            >
              <SelectTrigger className="w-full sm:w-36 h-8.5 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">
                  Semua Status
                </SelectItem>
                <SelectItem value="ACTIVE" className="text-xs">
                  Hanya Aktif
                </SelectItem>
                <SelectItem value="INACTIVE" className="text-xs">
                  Non-Aktif
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Filter Khusus Tab Kas (Cost Center) */}
            {activeTab === 'cash' && (
              <Select
                value={costCenterFilter}
                onValueChange={(val) => setCostCenterFilter(val)}
              >
                <SelectTrigger className="w-full sm:w-44 h-8.5 text-xs">
                  <SelectValue placeholder="Cost Center" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="ALL" className="text-xs">
                    Semua Cost Center
                  </SelectItem>
                  {costCenters.map((cc) => (
                    <SelectItem key={cc.id} value={cc.id} className="text-xs">
                      {cc.code} - {cc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Filter Khusus Tab Bank (Nama Bank) */}
            {activeTab === 'bank' && (
              <Select
                value={bankNameFilter}
                onValueChange={(val) => setBankNameFilter(val)}
              >
                <SelectTrigger className="w-full sm:w-36 h-8.5 text-xs">
                  <SelectValue placeholder="Nama Bank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">
                    Semua Bank
                  </SelectItem>
                  <SelectItem value="BCA" className="text-xs">
                    BCA
                  </SelectItem>
                  <SelectItem value="MANDIRI" className="text-xs">
                    Bank Mandiri
                  </SelectItem>
                  <SelectItem value="BRI" className="text-xs">
                    BRI
                  </SelectItem>
                  <SelectItem value="BNI" className="text-xs">
                    BNI
                  </SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Tombol Reset Filter */}
            {isFilterActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-8.5 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                title="Reset seluruh filter"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </Button>
            )}
          </div>
        </div>

        {/* ==================== TAB 1: KAS OPERASIONAL FISIK ==================== */}
        <TabsContent value="cash" className="space-y-4">
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/80 dark:bg-white/5">
                  <TableRow className="border-b border-slate-200/80 dark:border-white/10">
                    <TableHead className="w-36">Kode Kas</TableHead>
                    <TableHead>Nama Kas & Keterangan</TableHead>
                    <TableHead>Akun Buku Besar (GL)</TableHead>
                    <TableHead>Petugas Kasir</TableHead>
                    <TableHead>Cost Center</TableHead>
                    <TableHead className="text-right">Saldo Berjalan GL</TableHead>
                    <TableHead className="w-24 text-center">Status</TableHead>
                    <TableHead className="text-right w-24">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
                  {loading ? (
                    <TableSkeletonRows
                      rows={5}
                      colWidths={[
                        'w-24',
                        'w-36',
                        'w-32',
                        'w-24',
                        'w-24',
                        'w-28 ml-auto',
                        'w-16 mx-auto',
                        'w-16 ml-auto',
                      ]}
                    />
                  ) : cashAccounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="p-3 rounded-full bg-primary/10 text-primary">
                            <Wallet className="h-8 w-8 opacity-60" />
                          </div>
                          <h4 className="text-sm font-semibold text-foreground">
                            Tidak ada rekening kas ditemukan
                          </h4>
                          <p className="text-xs text-muted-foreground max-w-sm">
                            {isFilterActive
                              ? 'Tidak ada rekening kas yang cocok dengan filter atau kata kunci pencarian.'
                              : 'Belum ada rekening kas fisik yang terdaftar di dalam sistem.'}
                          </p>
                          {isFilterActive ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleResetFilters}
                              className="text-xs gap-1.5 h-8 mt-1"
                            >
                              <RotateCcw className="h-3.5 w-3.5" /> Reset Filter
                            </Button>
                          ) : (
                            isCreate && (
                              <Button
                                size="sm"
                                onClick={handleOpenCreateCash}
                                className="text-xs gap-1.5 h-8 mt-1"
                              >
                                <Plus className="h-3.5 w-3.5" /> Tambah Kas Baru
                              </Button>
                            )
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    cashAccounts.map((cash) => (
                      <TableRow
                        key={cash.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors"
                      >
                        <TableCell className="font-mono font-bold text-xs">
                          <Badge variant="outline" className="font-mono text-[11px] bg-background">
                            {cash.code}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="font-bold text-xs text-foreground">{cash.name}</div>
                          {cash.description && (
                            <div className="text-[11px] text-muted-foreground truncate max-w-sm mt-0.5" title={cash.description}>
                              {cash.description}
                            </div>
                          )}
                        </TableCell>

                        <TableCell>
                          {cash.account ? (
                            <Badge variant="secondary" className="font-mono text-[10px] py-0.5 px-1.5">
                              {cash.account.code} - {cash.account.name}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        <TableCell>
                          {cash.custodianUser ? (
                            <div className="flex items-center text-xs">
                              <UserIcon className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                              <span className="font-medium">{cash.custodianUser.name}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Belum ditugaskan</span>
                          )}
                        </TableCell>

                        <TableCell>
                          {cash.costCenter ? (
                            <div className="flex items-center text-xs">
                              <Building className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                              <span>{cash.costCenter.name}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <span className="font-mono font-black text-xs text-primary">
                            {formatCurrency(cash.currentBalance || 0)}
                          </span>
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge
                            className={
                              cash.isActive
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]'
                                : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20 text-[10px]'
                            }
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current mr-1 inline-block" />
                            {cash.isActive ? 'Aktif' : 'Non-Aktif'}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-1">
                            {isUpdate && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleOpenEditCash(cash)}
                                title="Edit Rekening Kas"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {isDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                onClick={() =>
                                  setItemToDelete({ type: 'cash', item: cash })
                                }
                                title="Nonaktifkan Rekening Kas"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== TAB 2: REKENING BANK KORPORAT ==================== */}
        <TabsContent value="bank" className="space-y-4">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <BankAccountCardSkeleton key={i} />
              ))}
            </div>
          ) : bankAccounts.length === 0 ? (
            <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-dashed border-slate-300 dark:border-white/15 p-12 text-center flex flex-col items-center justify-center space-y-2">
              <div className="p-3 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Landmark className="h-8 w-8 opacity-60" />
              </div>
              <h4 className="text-sm font-semibold text-foreground">
                Tidak ada rekening bank ditemukan
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm">
                {isFilterActive
                  ? 'Tidak ada rekening bank yang cocok dengan filter atau kata kunci pencarian.'
                  : 'Belum ada rekening bank korporat yang terdaftar di dalam sistem.'}
              </p>
              {isFilterActive ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="text-xs gap-1.5 h-8 mt-1"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reset Filter
                </Button>
              ) : (
                isCreate && (
                  <Button
                    size="sm"
                    onClick={handleOpenCreateBank}
                    className="text-xs gap-1.5 h-8 mt-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Tambah Rekening Bank
                  </Button>
                )
              )}
            </Card>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {bankAccounts.map((bank) => (
                <Card
                  key={bank.id}
                  className="relative overflow-hidden shadow-xs hover:shadow-md transition-all border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md flex flex-col justify-between border-t-4 border-t-blue-600"
                >
                  <div>
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <CreditCard className="h-4 w-4" />
                          </div>
                          <div>
                            <CardTitle className="text-sm font-bold text-foreground">
                              {bank.bankName}
                            </CardTitle>
                            <CardDescription className="text-[10px] font-mono font-semibold text-primary">
                              {bank.code}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge
                            className={
                              bank.isActive
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]'
                                : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20 text-[10px]'
                            }
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current mr-1 inline-block" />
                            {bank.isActive ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {bank.currency}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 space-y-3 pt-2">
                      {/* Box Nomor Rekening (Masked) & Salin */}
                      <div className="rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 p-3 space-y-1">
                        <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                          <span>Nomor Rekening Publik</span>
                          <button
                            type="button"
                            onClick={(e) =>
                              handleCopyAccountNumber(e, bank.accountNumberMasked)
                            }
                            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-[10px] transition-colors"
                            title="Salin nomor rekening"
                          >
                            <Copy className="h-3 w-3" /> Salin
                          </button>
                        </div>
                        <div className="font-mono text-base font-black tracking-wider text-foreground">
                          {bank.accountNumberMasked}
                        </div>
                        <div className="text-xs font-semibold text-muted-foreground truncate" title={bank.accountName}>
                          a.n. {bank.accountName}
                        </div>
                      </div>

                      {/* Saldo Berjalan GL Bank Real-Time */}
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40">
                        <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                          Saldo GL Berjalan:
                        </span>
                        <span className="font-mono font-black text-xs text-emerald-700 dark:text-emerald-400">
                          {formatCurrency(bank.currentBalance || 0)}
                        </span>
                      </div>

                      {/* Akun GL Buku Besar Terkait */}
                      <div className="text-xs space-y-1">
                        <div className="text-[11px] text-muted-foreground">Akun Buku Besar (GL):</div>
                        {bank.account ? (
                          <div className="font-mono font-medium text-xs bg-accent/40 p-1.5 rounded-md border border-slate-200/60 dark:border-white/5 truncate" title={`${bank.account.code} - ${bank.account.name}`}>
                            <span className="font-bold">{bank.account.code}</span> - {bank.account.name}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground italic">-</div>
                        )}
                      </div>

                      {bank.description && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2" title={bank.description}>
                          {bank.description}
                        </p>
                      )}
                    </CardContent>
                  </div>

                  <CardFooter className="p-3 pt-0 flex justify-end space-x-1 border-t border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 py-2">
                    {isUpdate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditBank(bank)}
                        className="h-7 text-xs gap-1"
                        title="Edit Rekening Bank"
                      >
                        <Edit className="h-3.5 w-3.5" /> Edit
                      </Button>
                    )}
                    {isDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setItemToDelete({ type: 'bank', item: bank })
                        }
                        className="h-7 text-xs text-destructive hover:bg-destructive/10 gap-1"
                        title="Nonaktifkan Rekening Bank"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Nonaktifkan
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal Rekening Kas */}
      <CashAccountModal
        isOpen={isCashModalOpen}
        onClose={() => setIsCashModalOpen(false)}
        onSubmit={handleSubmitCash}
        cashAccount={selectedCash}
        glAccounts={glAccounts}
        custodianUsers={custodianUsers}
        costCenters={costCenters}
        isLoading={submitting}
      />

      {/* Modal Rekening Bank */}
      <BankAccountModal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        onSubmit={handleSubmitBank}
        bankAccount={selectedBank}
        glAccounts={glAccounts}
        isLoading={submitting}
      />

      {/* Confirm Dialog Hapus / Nonaktifkan Rekening */}
      <ConfirmDialog
        open={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
        title={
          itemToDelete?.type === 'cash'
            ? 'Nonaktifkan Rekening Kas Fisik'
            : 'Nonaktifkan Rekening Bank Korporat'
        }
        description={
          itemToDelete?.type === 'cash'
            ? `Apakah Anda yakin ingin menonaktifkan kas '${(itemToDelete?.item as CashAccount)?.name}' (${(itemToDelete?.item as CashAccount)?.code})? Rekening yang dinonaktifkan tidak akan muncul pada pilihan pencairan SPJ atau penerimaan settlement.`
            : `Apakah Anda yakin ingin menonaktifkan rekening '${(itemToDelete?.item as BankAccount)?.bankName}' (${(itemToDelete?.item as BankAccount)?.accountNumberMasked})? Rekening yang dinonaktifkan tidak akan tersedia untuk transfer kasir atau penerimaan transfer tiket.`
        }
        variant="danger"
        confirmText="Nonaktifkan Rekening"
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
