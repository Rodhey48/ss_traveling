import ConfirmDialog from '@/components/shared/confirm-dialog';
import Heading from '@/components/shared/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { CashBankService } from '@/services/cash-bank.service';
import type {
  BankAccount,
  CashAccount,
  FundTransfer,
} from '@/types';
import {
  ArrowRightLeft,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  FileText,
  Landmark,
  Plus,
  RotateCw,
  RotateCcw,
  ShieldAlert,
  Wallet,
  X,
  XCircle,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MetricCardGridSkeleton,
  BankAccountCardSkeleton,
  TransferTableSkeletonRows,
} from '@/components/shared/skeleton-loaders';
import BankStatementView from './components/bank-statement-view';
import CreateTransferModal from './components/create-transfer-modal';
import TransferDetailModal from './components/transfer-detail-modal';

export default function TreasuryPage() {
  const { isCreate, actions } = usePermission();

  // Otorisasi Maker-Checker murni berbasis custom permission menu (actions.approve)
  const canApprove = Boolean(actions?.approve);

  const [activeTab, setActiveTab] = useState<'statement' | 'transfers' | 'approval'>('statement');
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [transfers, setTransfers] = useState<FundTransfer[]>([]);

  const [accountsLoading, setAccountsLoading] = useState(true);
  const [transfersLoading, setTransfersLoading] = useState(false);

  // Filter & Search states for Tab 2 (Riwayat Mutasi)
  const [transferFilterStatus, setTransferFilterStatus] = useState<string>('ALL');
  const [transferTypeFilter, setTransferTypeFilter] = useState<string>('ALL');
  const [transferSearchInput, setTransferSearchInput] = useState<string>('');
  const [debouncedTransferSearch, setDebouncedTransferSearch] = useState<string>('');

  // Pagination states for Tab 2
  const [transferPage, setTransferPage] = useState<number>(1);
  const [transferLimit, setTransferLimit] = useState<number>(10);

  // Modals
  const [isCreateTransferOpen, setIsCreateTransferOpen] = useState(false);
  const [selectedDetailTransfer, setSelectedDetailTransfer] = useState<FundTransfer | null>(null);

  // Unified Confirmation Dialog (for Approve & Reject)
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    variant?: 'danger' | 'warning' | 'info' | 'primary';
    confirmText?: string;
    cancelText?: string;
    promptInput?: {
      label: string;
      placeholder?: string;
      required?: boolean;
      defaultValue?: string;
    };
    onConfirm: (inputValue?: string) => Promise<void>;
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: async () => { },
  });

  // Statement Selection
  const [selectedStatementId, setSelectedStatementId] = useState<string>('');
  const [selectedStatementType, setSelectedStatementType] = useState<'BANK' | 'CASH'>('BANK');

  // Debounced search for Tab 2 (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTransferSearch(transferSearchInput.trim());
      setTransferPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [transferSearchInput]);

  const fetchData = async () => {
    setAccountsLoading(true);
    try {
      const [cashRes, bankRes] = await Promise.all([
        CashBankService.findAllCashAccounts(),
        CashBankService.findAllBankAccounts(),
      ]);

      if (cashRes?.data) setCashAccounts(cashRes.data);
      if (bankRes?.data) {
        setBankAccounts(bankRes.data);
        if (!selectedStatementId && bankRes.data.length > 0) {
          setSelectedStatementId(bankRes.data[0].id);
          setSelectedStatementType('BANK');
        }
      }
    } catch (err: any) {
      toast.error('Gagal memuat data kas & rekening bank', {
        description: err?.response?.data?.message || err.message,
      });
    } finally {
      setAccountsLoading(false);
    }
  };

  const fetchTransfers = useCallback(async () => {
    setTransfersLoading(true);
    try {
      const params: any = {};
      if (transferFilterStatus !== 'ALL') params.status = transferFilterStatus;
      if (debouncedTransferSearch) params.search = debouncedTransferSearch;
      const res = await CashBankService.findAllFundTransfers(params);
      if (res?.data) setTransfers(res.data);
    } catch (err: any) {
      console.error('Gagal memuat data mutasi transfer', err);
    } finally {
      setTransfersLoading(false);
    }
  }, [transferFilterStatus, debouncedTransferSearch]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

  // Approval Handlers (Replaced window.confirm with ConfirmDialog)
  const handleApproveTransfer = (transfer: FundTransfer) => {
    const formattedAmount = Number(transfer.amount).toLocaleString('id-ID');
    setConfirmDialog({
      open: true,
      title: 'Setujui & Posting Pemindahan Dana',
      description: `Apakah Anda yakin ingin menyetujui pengajuan transfer '${transfer.transferNo}' sebesar Rp ${formattedAmount}?\nJurnal akuntansi kas/bank akan otomatis diterbitkan dan diposting ke Buku Besar.`,
      variant: 'primary',
      confirmText: 'Setujui & Posting ke GL',
      cancelText: 'Batal',
      onConfirm: async () => {
        setIsConfirmLoading(true);
        try {
          await CashBankService.approveFundTransfer(transfer.id);
          toast.success('Pemindahan dana berhasil disetujui & diposting ke GL!');
          setConfirmDialog((prev) => ({ ...prev, open: false }));
          fetchTransfers();
          fetchData();
        } catch (err: any) {
          toast.error('Gagal menyetujui pemindahan dana', {
            description: err?.response?.data?.message || err.message,
          });
        } finally {
          setIsConfirmLoading(false);
        }
      },
    });
  };

  // Rejection Handler (Replaced modal/alert with ConfirmDialog + Prompt Input)
  const handleRejectTransfer = (transfer: FundTransfer) => {
    setConfirmDialog({
      open: true,
      title: 'Tolak Pengajuan Pemindahan Dana',
      description: `Masukkan alasan penolakan untuk dokumen '${transfer.transferNo}'. Pengajuan ini akan ditandai Ditolak dan tidak diposting ke Buku Besar.`,
      variant: 'danger',
      confirmText: 'Konfirmasi Tolak',
      cancelText: 'Batal',
      promptInput: {
        label: 'Alasan Penolakan',
        placeholder: 'Contoh: Nominal tidak sesuai dengan SPJ / Dokumen pendukung belum lengkap',
        required: true,
      },
      onConfirm: async (reason?: string) => {
        if (!reason?.trim()) {
          toast.error('Alasan penolakan wajib diisi');
          return;
        }
        setIsConfirmLoading(true);
        try {
          await CashBankService.rejectFundTransfer(transfer.id, {
            rejectionReason: reason.trim(),
          });
          toast.success('Pengajuan pemindahan dana telah ditolak');
          setConfirmDialog((prev) => ({ ...prev, open: false }));
          fetchTransfers();
        } catch (err: any) {
          toast.error('Gagal menolak pengajuan', {
            description: err?.response?.data?.message || err.message,
          });
        } finally {
          setIsConfirmLoading(false);
        }
      },
    });
  };

  const formatRupiah = (val: string | number) => {
    const num = Number(val);
    if (isNaN(num)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const pendingTransfers = useMemo(
    () => transfers.filter((t) => t.status === 'PENDING_APPROVAL'),
    [transfers],
  );

  // Filtered transfers for Tab 2
  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      if (transferTypeFilter !== 'ALL' && t.transferType !== transferTypeFilter) {
        return false;
      }
      return true;
    });
  }, [transfers, transferTypeFilter]);

  // Tab 2 Pagination
  const totalTransfers = filteredTransfers.length;
  const totalTransferPages = Math.ceil(totalTransfers / transferLimit) || 1;
  const paginatedTransfers = useMemo(() => {
    const start = (transferPage - 1) * transferLimit;
    return filteredTransfers.slice(start, start + transferLimit);
  }, [filteredTransfers, transferPage, transferLimit]);

  const startTransferItem = totalTransfers === 0 ? 0 : (transferPage - 1) * transferLimit + 1;
  const endTransferItem = Math.min(transferPage * transferLimit, totalTransfers);

  const handleResetTransferFilters = () => {
    setTransferSearchInput('');
    setDebouncedTransferSearch('');
    setTransferFilterStatus('ALL');
    setTransferTypeFilter('ALL');
    setTransferPage(1);
  };

  const hasActiveTransferFilters = useMemo(() => {
    return (
      debouncedTransferSearch !== '' ||
      transferFilterStatus !== 'ALL' ||
      transferTypeFilter !== 'ALL'
    );
  }, [debouncedTransferSearch, transferFilterStatus, transferTypeFilter]);

  // Separated accounts
  const mainBanks = bankAccounts.filter((b) => b.code.includes('MAIN'));
  const opsBanks = bankAccounts.filter((b) => b.code.includes('OPS'));

  // Aggregated Liquidity Metrics
  const totalMainBalance = mainBanks.reduce((sum, b) => sum + Number((b as any).currentBalance || 0), 0);
  const totalOpsBalance = opsBanks.reduce((sum, b) => sum + Number((b as any).currentBalance || 0), 0);
  const totalCashBalance = cashAccounts.reduce((sum, c) => sum + Number((c as any).currentBalance || 0), 0);
  const totalLiquidity = totalMainBalance + totalOpsBalance + totalCashBalance;

  const getBankTitle = (bank: BankAccount) => {
    if (bank.code.includes('MAIN')) return `${bank.bankName} Induk (Penerimaan)`;
    if (bank.code.includes('AKAP')) return `${bank.bankName} Ops AKAP`;
    if (bank.code.includes('WIS')) return `${bank.bankName} Ops Wisata`;
    return `${bank.bankName} Operasional Pool`;
  };

  const getBankBadgeLabel = (bank: BankAccount) => {
    if (bank.code.includes('MAIN')) return 'Pusat Inflow';
    if (bank.code.includes('AKAP')) return 'AKAP Outflow';
    if (bank.code.includes('WIS')) return 'Wisata Outflow';
    return 'Pool / Kantor';
  };

  const getBankIconColor = (bank: BankAccount) => {
    if (bank.code.includes('MAIN')) return 'text-blue-600 dark:text-blue-400';
    if (bank.code.includes('AKAP')) return 'text-indigo-600 dark:text-indigo-400';
    if (bank.code.includes('WIS')) return 'text-amber-600 dark:text-amber-400';
    return 'text-cyan-600 dark:text-cyan-400';
  };

  const getTransferTypeLabel = (type: string) => {
    switch (type) {
      case 'MAIN_TO_OPS':
        return 'Induk → Ops';
      case 'OPS_TO_OPS':
        return 'Antar Ops';
      case 'POOL_TO_MAIN':
        return 'Setor Kas → Induk';
      case 'OPS_TO_POOL':
        return 'Tarik Tunai → Pool';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Heading
          title="Mutasi Kas & Rekening Bank"
          description="Operasional kas & bank pool: Rekening Koran Digital, pemindahan dana antar rekening, dan persetujuan dropping atasan."
        />
        <div className="flex items-center gap-2">
          {isCreate && (
            <Button
              size="sm"
              onClick={() => setIsCreateTransferOpen(true)}
              className="gap-2 shadow-xs text-xs h-8.5"
            >
              <ArrowRightLeft className="h-4 w-4" /> Ajukan Pemindahan Dana
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchData();
              fetchTransfers();
            }}
            disabled={accountsLoading || transfersLoading}
            className="text-xs h-8.5 gap-1.5"
            title="Muat ulang seluruh data"
          >
            <RotateCw className={`h-3.5 w-3.5 ${accountsLoading || transfersLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* 4 Summary Cards Clean with Tasteful Icon Colors */}
      {accountsLoading ? (
        <MetricCardGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Saldo Likuiditas */}
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-emerald-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Total Likuiditas Kas &amp; Bank</CardDescription>
              <CardTitle className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                <span>{formatRupiah(totalLiquidity)}</span>
                <Wallet className="h-5 w-5 opacity-40 text-emerald-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                {bankAccounts.length} Rekening Bank &bull; {cashAccounts.length} Kas Fisik
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Rekening Induk */}
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-blue-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Rekening Induk (Penerimaan)</CardDescription>
              <CardTitle className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 flex items-center justify-between">
                <span>{formatRupiah(totalMainBalance)}</span>
                <Landmark className="h-5 w-5 opacity-40 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Penampung omzet tiket &amp; sewa
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Rekening Operasional Armada */}
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-purple-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Rekening Operasional Armada</CardDescription>
              <CardTitle className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400 flex items-center justify-between">
                <span>{formatRupiah(totalOpsBalance)}</span>
                <CreditCard className="h-5 w-5 opacity-40 text-purple-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Plafon UJ &amp; pengeluaran armada
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Antrean Persetujuan */}
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-amber-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Antrean Persetujuan Dropping</CardDescription>
              <CardTitle className="text-2xl font-bold text-amber-600 dark:text-amber-400 flex items-center justify-between">
                <span>{pendingTransfers.length} <span className="text-sm font-semibold text-muted-foreground">Pengajuan</span></span>
                <Clock className="h-5 w-5 opacity-40 text-amber-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Menunggu otorisasi Maker-Checker
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 dark:border-white/10 pb-3">
          <TabsList className="grid w-full sm:w-120 grid-cols-3">
            <TabsTrigger value="statement" className="text-xs flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Rekening Koran</span>
            </TabsTrigger>
            <TabsTrigger value="transfers" className="text-xs flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Riwayat Mutasi</span>
            </TabsTrigger>
            <TabsTrigger value="approval" className="text-xs flex items-center gap-1.5 relative">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Persetujuan</span>
              {pendingTransfers.length > 0 && (
                <Badge variant="destructive" className="ml-1 px-1.5 py-0 text-[10px] h-4 min-w-4 rounded-full">
                  {pendingTransfers.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: REKENING KORAN DIGITAL & KARTU REKENING INDUK / OPS     */}
        {/* ============================================================== */}
        <TabsContent value="statement" className="space-y-6">
          {/* Section 1: Rekening Induk (Revenue Inflow) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-muted">
                <Landmark className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs font-semibold text-foreground">
                Rekening Induk (Penerimaan Perusahaan)
              </span>
              <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                Inflow
              </Badge>
            </div>
            {accountsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BankAccountCardSkeleton />
                <BankAccountCardSkeleton />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mainBanks.map((bank) => {
                  const isSelected = selectedStatementId === bank.id && selectedStatementType === 'BANK';
                  return (
                    <Card
                      key={bank.id}
                      onClick={() => {
                        setSelectedStatementId(bank.id);
                        setSelectedStatementType('BANK');
                      }}
                      className={`cursor-pointer transition-all duration-150 ${isSelected
                          ? 'border-primary ring-1 ring-primary/20 shadow-sm'
                          : 'hover:border-primary/40 shadow-xs'
                        }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                              <Landmark className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <div className="font-semibold text-sm text-foreground">{getBankTitle(bank)}</div>
                              <div className="text-xs text-muted-foreground font-mono mt-0.5">
                                {bank.accountNumberMasked || bank.accountNumber}
                              </div>
                              <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                                a.n. {bank.accountName}
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                            {getBankBadgeLabel(bank)}
                          </Badge>
                        </div>

                        <div className="mt-4 pt-3 border-t flex items-baseline justify-between">
                          <span className="text-xs text-muted-foreground">Saldo Buku Besar:</span>
                          <span className="text-base font-bold font-mono text-foreground">
                            {formatRupiah((bank as any).currentBalance || 0)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Rekening Operasional (Disbursement Outflow) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-muted">
                <CreditCard className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-xs font-semibold text-foreground">
                Rekening Operasional Armada (Pengeluaran UJ &amp; AP)
              </span>
              <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                Outflow
              </Badge>
            </div>
            {accountsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <BankAccountCardSkeleton />
                <BankAccountCardSkeleton />
                <BankAccountCardSkeleton />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {opsBanks.map((bank) => {
                  const isSelected = selectedStatementId === bank.id && selectedStatementType === 'BANK';
                  const iconColor = getBankIconColor(bank);
                  return (
                    <Card
                      key={bank.id}
                      onClick={() => {
                        setSelectedStatementId(bank.id);
                        setSelectedStatementType('BANK');
                      }}
                      className={`cursor-pointer transition-all duration-150 ${isSelected
                          ? 'border-primary ring-1 ring-primary/20 shadow-sm'
                          : 'hover:border-primary/40 shadow-xs'
                        }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                            <CreditCard className={`w-4 h-4 ${iconColor}`} />
                          </div>
                          <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                            {getBankBadgeLabel(bank)}
                          </Badge>
                        </div>

                        <div className="mt-3">
                          <div className="font-semibold text-xs truncate text-foreground" title={getBankTitle(bank)}>
                            {getBankTitle(bank)}
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                            {bank.accountNumberMasked || bank.accountNumber}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate mt-0.5" title={bank.accountName}>
                            a.n. {bank.accountName}
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t flex items-baseline justify-between">
                          <span className="text-[11px] text-muted-foreground">Saldo:</span>
                          <span className="text-xs font-bold font-mono text-foreground">
                            {formatRupiah((bank as any).currentBalance || 0)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: Kas Fisik Pool */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-muted">
                <Wallet className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xs font-semibold text-foreground">
                Kas Fisik Operasional Pool &amp; Kas Kecil Garasi
              </span>
            </div>
            {accountsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <BankAccountCardSkeleton />
                <BankAccountCardSkeleton />
                <BankAccountCardSkeleton />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {cashAccounts.map((cash) => {
                  const isSelected = selectedStatementId === cash.id && selectedStatementType === 'CASH';
                  const isPetty = cash.code.includes('PETTY');
                  return (
                    <Card
                      key={cash.id}
                      onClick={() => {
                        setSelectedStatementId(cash.id);
                        setSelectedStatementType('CASH');
                      }}
                      className={`cursor-pointer transition-all duration-150 ${isSelected
                          ? 'border-primary ring-1 ring-primary/20 shadow-sm'
                          : 'hover:border-primary/40 shadow-xs'
                        }`}
                    >
                      <CardContent className="p-3.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                              <Wallet className={`w-4 h-4 ${isPetty ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
                            </div>
                            <div>
                              <span className="font-semibold text-xs text-foreground">{cash.name}</span>
                              <div className="text-[10px] text-muted-foreground font-mono">{cash.code}</div>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                            {isPetty ? 'Kas Kecil' : 'Kas Fisik'}
                          </Badge>
                        </div>
                        <div className="mt-3 pt-2 border-t flex items-baseline justify-between">
                          <span className="text-[11px] text-muted-foreground">Saldo Fisik:</span>
                          <span className="text-xs font-bold font-mono text-foreground">
                            {formatRupiah((cash as any).currentBalance || 0)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Digital Statement Component */}
          <div className="pt-2">
            <BankStatementView
              bankAccounts={bankAccounts}
              cashAccounts={cashAccounts}
              selectedAccountId={selectedStatementId}
              selectedAccountType={selectedStatementType}
            />
          </div>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 2: RIWAYAT PEMINDAHAN DANA (FUND TRANSFERS)                */}
        {/* ============================================================== */}
        <TabsContent value="transfers" className="space-y-4">
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
            <CardHeader className="p-4 border-b border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                    <ArrowRightLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  Daftar Mutasi Pemindahan Dana
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Transaksi pemindahan saldo antar rekening korporat dan kas pool dengan nomor dokumen TRF/...
                </CardDescription>
              </div>

              {isCreate && (
                <Button
                  size="sm"
                  onClick={() => setIsCreateTransferOpen(true)}
                  className="h-8 text-xs gap-1.5 shadow-2xs self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" /> Transfer Baru
                </Button>
              )}
            </CardHeader>

            {/* Filter Toolbar Tab 2 */}
            <div className="p-3.5 bg-slate-50/50 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Cari nomor TRF atau keperluan..."
                    value={transferSearchInput}
                    onChange={(e) => setTransferSearchInput(e.target.value)}
                    className="pl-9 pr-8 h-8 text-xs uppercase"
                  />
                  {transferSearchInput && (
                    <button
                      type="button"
                      onClick={() => setTransferSearchInput('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      title="Hapus pencarian"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Status */}
                <div>
                  <Select
                    value={transferFilterStatus}
                    onValueChange={(val) => {
                      setTransferFilterStatus(val);
                      setTransferPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full text-xs h-8">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL" className="text-xs">Semua Status</SelectItem>
                      <SelectItem value="PENDING_APPROVAL" className="text-xs">Menunggu Approval</SelectItem>
                      <SelectItem value="APPROVED" className="text-xs">Disetujui</SelectItem>
                      <SelectItem value="REJECTED" className="text-xs">Ditolak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filter Tipe Mutasi */}
                <div>
                  <Select
                    value={transferTypeFilter}
                    onValueChange={(val) => {
                      setTransferTypeFilter(val);
                      setTransferPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full text-xs h-8">
                      <SelectValue placeholder="Tipe Mutasi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL" className="text-xs">Semua Tipe Mutasi</SelectItem>
                      <SelectItem value="MAIN_TO_OPS" className="text-xs">Induk → Ops (Dropping Plafon)</SelectItem>
                      <SelectItem value="OPS_TO_OPS" className="text-xs">Antar Ops (AKAP ↔ Wisata)</SelectItem>
                      <SelectItem value="POOL_TO_MAIN" className="text-xs">Setor Kas Pool → Induk</SelectItem>
                      <SelectItem value="OPS_TO_POOL" className="text-xs">Tarik Tunai Bank → Pool</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Status Bar Filter */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1 text-xs">
                <div>
                  {hasActiveTransferFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetTransferFilters}
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                    >
                      <RotateCcw className="h-3 w-3" /> Reset Filter
                    </Button>
                  )}
                </div>
                <span className="text-muted-foreground font-medium self-end sm:self-auto">
                  Menampilkan <strong className="text-foreground">{startTransferItem} - {endTransferItem}</strong> dari {totalTransfers} mutasi transfer
                </span>
              </div>
            </div>

            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/80 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10">
                  <TableRow className="text-xs">
                    <TableHead className="w-35 font-bold">No. Transfer</TableHead>
                    <TableHead className="w-27.5 font-bold">Tanggal</TableHead>
                    <TableHead className="w-35 font-bold">Tipe Mutasi</TableHead>
                    <TableHead className="font-bold">Alur Pemindahan Dana</TableHead>
                    <TableHead className="text-right w-35 font-bold">Nominal (Rp)</TableHead>
                    <TableHead className="font-bold">Keperluan</TableHead>
                    <TableHead className="w-32.5 font-bold">Pemohon</TableHead>
                    <TableHead className="w-30 font-bold">Status</TableHead>
                    <TableHead className="w-17.5 text-center font-bold">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs divide-y divide-slate-100 dark:divide-white/5">
                  {transfersLoading ? (
                    <TransferTableSkeletonRows rows={transferLimit} />
                  ) : paginatedTransfers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="p-3 rounded-full bg-primary/10 text-primary">
                            <ArrowRightLeft className="h-8 w-8 opacity-60" />
                          </div>
                          <h4 className="text-sm font-semibold text-foreground">
                            Belum ada riwayat pemindahan dana
                          </h4>
                          <p className="text-xs text-muted-foreground max-w-sm">
                            {hasActiveTransferFilters
                              ? 'Tidak ada mutasi transfer yang cocok dengan filter pencarian.'
                              : 'Seluruh transaksi dropping dana antar rekening bank korporat dan kas pool akan tercatat di sini.'}
                          </p>
                          {hasActiveTransferFilters && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleResetTransferFilters}
                              className="text-xs gap-1.5 h-8 mt-1"
                            >
                              <RotateCcw className="h-3.5 w-3.5" /> Reset Filter
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTransfers.map((t) => {
                      const sourceName = t.sourceBankAccount?.bankName
                        ? `${t.sourceBankAccount.bankName} (${t.sourceBankAccount.accountName})`
                        : t.sourceCashAccount?.name || 'Kas Sumber';
                      const targetName = t.targetBankAccount?.bankName
                        ? `${t.targetBankAccount.bankName} (${t.targetBankAccount.accountName})`
                        : t.targetCashAccount?.name || 'Kas Tujuan';

                      return (
                        <TableRow key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                          <TableCell className="font-mono font-bold text-foreground">
                            {t.transferNo}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(t.createdAt).toLocaleDateString('id-ID')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                              {getTransferTypeLabel(t.transferType)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <span>{sourceName}</span>
                              <span className="text-muted-foreground">&rarr;</span>
                              <span className="font-medium text-foreground">{targetName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-foreground">
                            {formatRupiah(t.amount)}
                          </TableCell>
                          <TableCell className="max-w-xs truncate" title={t.purpose}>
                            <div className="font-medium text-foreground">{t.purpose}</div>
                            {t.referenceDoc && (
                              <div className="text-[11px] text-muted-foreground">Ref: {t.referenceDoc}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {t.requestedBy?.name || 'Staf'}
                          </TableCell>
                          <TableCell>
                            {t.status === 'PENDING_APPROVAL' && (
                              <Badge variant="outline" className="text-amber-700 dark:text-amber-400 border-amber-500/30 bg-amber-500/10 text-[10px] gap-1 font-normal">
                                <Clock className="w-3 h-3 text-amber-500" /> Menunggu
                              </Badge>
                            )}
                            {t.status === 'APPROVED' && (
                              <Badge variant="outline" className="text-emerald-700 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 text-[10px] gap-1 font-normal">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Disetujui
                              </Badge>
                            )}
                            {t.status === 'REJECTED' && (
                              <Badge variant="outline" className="text-destructive border-destructive/20 text-[10px] gap-1 font-normal" title={t.rejectionReason}>
                                <XCircle className="w-3 h-3 text-destructive" /> Ditolak
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedDetailTransfer(t)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              title="Lihat Detail Dokumen Transfer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              {/* Paginasi Table Tab 2 */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 border-t border-slate-200/80 dark:border-white/10 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Baris per halaman:</span>
                  <Select
                    value={String(transferLimit)}
                    onValueChange={(val) => {
                      setTransferLimit(Number(val));
                      setTransferPage(1);
                    }}
                  >
                    <SelectTrigger className="w-18 h-7.5 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10" className="text-xs">10</SelectItem>
                      <SelectItem value="20" className="text-xs">20</SelectItem>
                      <SelectItem value="50" className="text-xs">50</SelectItem>
                      <SelectItem value="100" className="text-xs">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    Halaman {transferPage} dari {totalTransferPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={transferPage <= 1 || transfersLoading}
                      onClick={() => setTransferPage((p) => Math.max(1, p - 1))}
                      className="h-7.5 w-7.5"
                      title="Halaman Sebelumnya"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={transferPage >= totalTransferPages || transfersLoading}
                      onClick={() => setTransferPage((p) => Math.min(totalTransferPages, p + 1))}
                      className="h-7.5 w-7.5"
                      title="Halaman Berikutnya"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 3: MEJA PERSETUJUAN (APPROVAL DESK)                        */}
        {/* ============================================================== */}
        <TabsContent value="approval" className="space-y-4">
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
            <CardHeader className="p-4 border-b border-slate-200/80 dark:border-white/10 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                    <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  Antrean Persetujuan Pemindahan Dana (Maker-Checker)
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Tinjau dan setujui permohonan dropping dana dari Rekening Induk ke Rekening Operasional sebelum diposting ke GL.
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-xs text-muted-foreground font-normal">
                {pendingTransfers.length} Menunggu Tindakan
              </Badge>
            </CardHeader>

            <CardContent className="p-4">
              {transfersLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-28 rounded-md" />
                            <Skeleton className="h-4 w-16 rounded-full" />
                            <Skeleton className="h-3.5 w-36 rounded-md" />
                          </div>
                          <Skeleton className="h-4 w-64 rounded-md" />
                          <Skeleton className="h-3.5 w-48 rounded-md" />
                        </div>
                        <div className="flex flex-col items-end gap-2.5 min-w-50">
                          <Skeleton className="h-6 w-32 rounded-md" />
                          <div className="flex gap-2">
                            <Skeleton className="h-8 w-16 rounded-md" />
                            <Skeleton className="h-8 w-24 rounded-md" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : pendingTransfers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50 text-emerald-600" />
                  <p className="font-medium text-sm text-foreground">Tidak ada pengajuan tertunda</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Semua permohonan pemindahan dana telah diproses oleh atasan.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingTransfers.map((t) => {
                    const sourceName = t.sourceBankAccount?.bankName
                      ? `${t.sourceBankAccount.bankName} - ${t.sourceBankAccount.accountName}`
                      : t.sourceCashAccount?.name || 'Kas Sumber';
                    const targetName = t.targetBankAccount?.bankName
                      ? `${t.targetBankAccount.bankName} - ${t.targetBankAccount.accountName}`
                      : t.targetCashAccount?.name || 'Kas Tujuan';

                    return (
                      <div
                        key={t.id}
                        className="rounded-lg border border-slate-200/80 dark:border-white/10 bg-card p-4 hover:bg-muted/20 transition"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-semibold text-xs text-foreground">
                                {t.transferNo}
                              </span>
                              <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                                {getTransferTypeLabel(t.transferType)}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Oleh <strong>{t.requestedBy?.name || 'Staf'}</strong> &bull; {new Date(t.createdAt).toLocaleDateString('id-ID')}
                              </span>
                            </div>

                            {/* Alur Transfer */}
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="text-muted-foreground">Dari: <strong className="text-foreground">{sourceName}</strong></span>
                              <span className="text-muted-foreground">&rarr;</span>
                              <span className="text-foreground">Ke: <strong className="text-foreground">{targetName}</strong></span>
                            </div>

                            <p className="text-xs text-muted-foreground">
                              <span>Tujuan:</span> {t.purpose}
                              {t.referenceDoc && <span className="ml-2 font-mono text-[11px]">(Ref: {t.referenceDoc})</span>}
                            </p>
                          </div>

                          {/* Nominal & Actions */}
                          <div className="flex flex-col items-end gap-2.5 min-w-50">
                            <div className="text-right">
                              <div className="text-[11px] text-muted-foreground">Nominal:</div>
                              <div className="text-lg font-bold font-mono text-foreground">
                                {formatRupiah(t.amount)}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedDetailTransfer(t)}
                                className="text-xs h-8 px-2.5 gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" /> Detail
                              </Button>

                              {canApprove && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRejectTransfer(t)}
                                    className="text-destructive hover:bg-destructive/10 text-xs h-8 px-2.5"
                                  >
                                    <X className="w-3.5 h-3.5 mr-1" /> Tolak
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleApproveTransfer(t)}
                                    className="text-xs h-8 px-2.5 shadow-xs"
                                  >
                                    <Check className="w-3.5 h-3.5 mr-1" /> Setujui &amp; Posting
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CreateTransferModal
        isOpen={isCreateTransferOpen}
        onClose={() => setIsCreateTransferOpen(false)}
        onSuccess={() => {
          fetchTransfers();
          fetchData();
        }}
        bankAccounts={bankAccounts}
        cashAccounts={cashAccounts}
      />

      <TransferDetailModal
        transfer={selectedDetailTransfer}
        isOpen={!!selectedDetailTransfer}
        onClose={() => setSelectedDetailTransfer(null)}
        canApprove={canApprove}
        onApprove={handleApproveTransfer}
        onReject={handleRejectTransfer}
      />

      {/* Confirmation Dialog (Zero Native Alerts) */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant={confirmDialog.variant}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        promptInput={confirmDialog.promptInput}
        onConfirm={confirmDialog.onConfirm}
        isLoading={isConfirmLoading}
      />
    </div>
  );
}
