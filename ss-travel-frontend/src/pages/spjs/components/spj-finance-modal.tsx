import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
} from '@/components/ui/card';
import {
  Wallet,
  Receipt,
  Coins,
  CreditCard,
  PlusCircle,
  RotateCcw,
  ArrowRightLeft,
  Fuel,
  Info,
  Send,
  Trash2,
  RefreshCw,
  TrendingDown,
  ArrowDownLeft,
  CircleDollarSign,
} from 'lucide-react';
import { SpjFinanceService } from '@/services/spj-finance.service';
import { CashBankService } from '@/services/cash-bank.service';
import { SpjService } from '@/services/spj.service';
import type {
  Spj,
  SpjUj,
  SpjExpense,
  SpjRevenueDeclaration,
  CrewMealPayment,
  CashAccount,
  BankAccount,
  SpjExpenseType,
  SpjExpensePaymentSource,
  SpjRevenueDeclarationType,
  SpjPaymentMethod,
} from '@/types';
import { toast } from 'sonner';

interface SpjFinanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spj: Spj | null;
  onSuccess?: () => void;
}

export default function SpjFinanceModal({
  open,
  onOpenChange,
  spj,
  onSuccess,
}: SpjFinanceModalProps) {
  const [activeTab, setActiveTab] = useState<
    'uj' | 'expenses' | 'revenues' | 'crew_payments'
  >('uj');
  const [loading, setLoading] = useState(false);

  // Data states
  const [uj, setUj] = useState<SpjUj | null>(null);
  const [expenses, setExpenses] = useState<SpjExpense[]>([]);
  const [revenues, setRevenues] = useState<SpjRevenueDeclaration[]>([]);
  const [crewPayments, setCrewPayments] = useState<CrewMealPayment[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [availableSpjs, setAvailableSpjs] = useState<Spj[]>([]);

  // Sub-dialogs
  const [disburseOpen, setDisburseOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [additionalReqOpen, setAdditionalReqOpen] = useState(false);
  const [rolloverOpen, setRolloverOpen] = useState(false);
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [revenueFormOpen, setRevenueFormOpen] = useState(false);
  const [earlyPayoutOpen, setEarlyPayoutOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] =
    useState<CrewMealPayment | null>(null);

  // Form states - Pencairan UJ (Formatted with dots)
  const [disburseAmount, setDisburseAmount] = useState('');
  const [disburseMethod, setDisburseMethod] =
    useState<SpjPaymentMethod>('CASH');
  const [disburseCashAcc, setDisburseCashAcc] = useState('');
  const [disburseBankAcc, setDisburseBankAcc] = useState('');
  const [disburseRef, setDisburseRef] = useState('');
  const [disburseNotes, setDisburseNotes] = useState('');

  // Form states - Pengembalian UJ
  const [returnAmount, setReturnAmount] = useState('');
  const [returnMethod, setReturnMethod] = useState<SpjPaymentMethod>('CASH');
  const [returnCashAcc, setReturnCashAcc] = useState('');
  const [returnBankAcc, setReturnBankAcc] = useState('');
  const [returnRef, setReturnRef] = useState('');
  const [returnNotes, setReturnNotes] = useState('');

  // Form states - Tambahan UJ
  const [addReqAmount, setAddReqAmount] = useState('');
  const [addReqReason, setAddReqReason] = useState('');

  // Form states - Rollover UJ (Skenario 3)
  const [rolloverTargetSpj, setRolloverTargetSpj] = useState('');
  const [rolloverAmount, setRolloverAmount] = useState('');
  const [rolloverNotes, setRolloverNotes] = useState('');

  // Form states - Input Pengeluaran
  const [expType, setExpType] = useState<SpjExpenseType>('FUEL');
  const [expAmount, setExpAmount] = useState('');
  const [expSource, setExpSource] = useState<SpjExpensePaymentSource>('UJ');
  const [expFuelLiters, setExpFuelLiters] = useState('');
  const [expOdometer, setExpOdometer] = useState('');
  const [expFuelStation, setExpFuelStation] = useState('');
  const [expReceiptNo, setExpReceiptNo] = useState('');
  const [expNotes, setExpNotes] = useState('');

  // Form states - Deklarasi Penerimaan
  const [revType, setRevType] =
    useState<SpjRevenueDeclarationType>('CARGO_MOTORCYCLE');
  const [revAmount, setRevAmount] = useState('');
  const [revRef, setRevRef] = useState('');
  const [revCargoCommissionPct, setRevCargoCommissionPct] = useState('20.00');
  const [revSenderName, setRevSenderName] = useState('');
  const [revSenderPhone, setRevSenderPhone] = useState('');
  const [revReceiverName, setRevReceiverName] = useState('');
  const [revReceiverPhone, setRevReceiverPhone] = useState('');
  const [revItemDesc, setRevItemDesc] = useState('');
  const [revNotes, setRevNotes] = useState('');

  // Form states - Early Payout
  const [earlyPayoutMethod, setEarlyPayoutMethod] =
    useState<SpjPaymentMethod>('BANK_TRANSFER');
  const [earlyPayoutBankAcc, setEarlyPayoutBankAcc] = useState('');
  const [earlyPayoutRef, setEarlyPayoutRef] = useState('');
  const [earlyPayoutNotes, setEarlyPayoutNotes] = useState('');

  // Helper formatting ribuan dengan titik pada input
  const formatNumberWithDots = (val: string | number) => {
    if (!val && val !== 0) return '';
    const clean = String(val).replace(/\D/g, '');
    if (!clean) return '';
    return new Intl.NumberFormat('id-ID').format(Number(clean));
  };

  // Helper membersihkan titik sebelum dikirim ke API
  const cleanDots = (val: string) => String(val || '').replace(/\./g, '');

  useEffect(() => {
    if (open && spj) {
      loadAllFinanceData();
      loadAccounts();
    }
  }, [open, spj]);

  const loadAllFinanceData = async () => {
    if (!spj) return;
    setLoading(true);
    try {
      const [ujData, expensesData, revenuesData, paymentsData] =
        await Promise.all([
          SpjFinanceService.getUj(spj.id).catch(() => null),
          SpjFinanceService.getExpenses(spj.id).catch(() => []),
          SpjFinanceService.getRevenues(spj.id).catch(() => []),
          SpjFinanceService.getCrewPayments(spj.id).catch(() => []),
        ]);
      setUj(ujData);
      setExpenses(expensesData || []);
      setRevenues(revenuesData || []);
      setCrewPayments(paymentsData || []);
    } catch {
      toast.error('Gagal memuat rincian keuangan SPJ.');
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      const [cashRes, bankRes, spjsRes] = await Promise.all([
        CashBankService.findAllCashAccounts({ includeInactive: false }),
        CashBankService.findAllBankAccounts({ includeInactive: false }),
        SpjService.getSpjs({ limit: 50 }),
      ]);
      setCashAccounts(cashRes.data || []);
      setBankAccounts(bankRes.data || []);
      setAvailableSpjs(
        spjsRes.data?.filter((s) => s.id !== spj?.id) || [],
      );
    } catch {
      // silent fallback
    }
  };

  const formatRupiah = (val: string | number | undefined | null) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(val || 0));
  };

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------

  const handleDisburseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spj) return;
    try {
      await SpjFinanceService.disburseUj(spj.id, {
        amount: cleanDots(disburseAmount),
        paymentMethod: disburseMethod,
        cashAccountId:
          disburseMethod === 'CASH' ? disburseCashAcc : undefined,
        bankAccountId:
          disburseMethod === 'BANK_TRANSFER' ? disburseBankAcc : undefined,
        receiptRef: disburseRef,
        notes: disburseNotes,
      });
      toast.success('Pencairan dana UJ berhasil dicatat!');
      setDisburseOpen(false);
      setDisburseAmount('');
      setDisburseRef('');
      setDisburseNotes('');
      loadAllFinanceData();
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mencairkan UJ.');
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spj) return;
    try {
      await SpjFinanceService.returnUj(spj.id, {
        amount: cleanDots(returnAmount),
        paymentMethod: returnMethod,
        cashAccountId: returnMethod === 'CASH' ? returnCashAcc : undefined,
        bankAccountId:
          returnMethod === 'BANK_TRANSFER' ? returnBankAcc : undefined,
        receiptRef: returnRef,
        notes: returnNotes,
      });
      toast.success('Pengembalian sisa UJ berhasil dicatat!');
      setReturnOpen(false);
      setReturnAmount('');
      setReturnRef('');
      setReturnNotes('');
      loadAllFinanceData();
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mencatat pengembalian.');
    }
  };

  const handleAdditionalReqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spj) return;
    try {
      await SpjFinanceService.requestAdditionalUj(spj.id, {
        amount: cleanDots(addReqAmount),
        reason: addReqReason,
      });
      toast.success('Permintaan tambahan UJ berhasil diajukan!');
      setAdditionalReqOpen(false);
      setAddReqAmount('');
      setAddReqReason('');
      loadAllFinanceData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengajukan tambahan UJ.');
    }
  };

  const handleProcessAddReq = async (
    requestId: string,
    status: 'APPROVED' | 'REJECTED',
  ) => {
    try {
      await SpjFinanceService.processAdditionalRequest(requestId, {
        status,
        rejectionReason:
          status === 'REJECTED'
            ? 'Tidak disetujui oleh manajemen'
            : undefined,
      });
      toast.success(
        `Pengajuan tambahan UJ berhasil di-${status.toLowerCase()}!`,
      );
      loadAllFinanceData();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Gagal memproses pengajuan tambahan.',
      );
    }
  };

  const handleRolloverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spj || !rolloverTargetSpj) return;
    try {
      await SpjFinanceService.rolloverUj(spj.id, {
        targetSpjId: rolloverTargetSpj,
        amount: cleanDots(rolloverAmount),
        notes: rolloverNotes,
      });
      toast.success(
        'Sisa saldo UJ berhasil diestafetkan ke SPJ armada pengganti!',
      );
      setRolloverOpen(false);
      setRolloverAmount('');
      setRolloverTargetSpj('');
      loadAllFinanceData();
      onSuccess?.();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Gagal melakukan estafet UJ.',
      );
    }
  };

  const handleCreateExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spj) return;
    try {
      await SpjFinanceService.createExpense(spj.id, {
        expenseType: expType,
        amount: cleanDots(expAmount),
        paymentSource: expSource,
        fuelLiters: expType === 'FUEL' ? expFuelLiters : undefined,
        odometerKm:
          expType === 'FUEL' && expOdometer ? Number(expOdometer) : undefined,
        fuelStation: expType === 'FUEL' ? expFuelStation : undefined,
        receiptNumber: expReceiptNo,
        notes: expNotes,
      });
      toast.success('Pengeluaran SPJ berhasil dicatat!');
      setExpenseFormOpen(false);
      setExpAmount('');
      setExpReceiptNo('');
      setExpNotes('');
      setExpFuelLiters('');
      setExpOdometer('');
      setExpFuelStation('');
      loadAllFinanceData();
      onSuccess?.();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Gagal mencatat pengeluaran SPJ.',
      );
    }
  };

  const handleVerifyExpense = async (
    expenseId: string,
    status: 'APPROVED' | 'REJECTED',
  ) => {
    try {
      await SpjFinanceService.verifyExpense(expenseId, status);
      toast.success(
        `Pengeluaran berhasil di-${status === 'APPROVED' ? 'verifikasi' : 'tolak'}!`,
      );
      loadAllFinanceData();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Gagal memperbarui status nota.',
      );
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await SpjFinanceService.deleteExpense(expenseId);
      toast.success('Pengeluaran berhasil dihapus.');
      loadAllFinanceData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus pengeluaran.');
    }
  };

  const handleCreateRevenueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spj) return;
    try {
      const isCargo =
        revType === 'CARGO_MOTORCYCLE' || revType === 'CARGO_BOX';
      await SpjFinanceService.createRevenue(spj.id, {
        declarationType: revType,
        amount: cleanDots(revAmount),
        sourceReference: revRef,
        crewCommissionPercentage: isCargo ? revCargoCommissionPct : '0.00',
        cargoSenderName: isCargo ? revSenderName : undefined,
        cargoSenderPhone: isCargo ? revSenderPhone : undefined,
        cargoReceiverName: isCargo ? revReceiverName : undefined,
        cargoReceiverPhone: isCargo ? revReceiverPhone : undefined,
        cargoItemDescription: isCargo ? revItemDesc : undefined,
        notes: revNotes,
      });
      toast.success('Deklarasi penerimaan kas kru berhasil dicatat!');
      setRevenueFormOpen(false);
      setRevAmount('');
      setRevRef('');
      setRevSenderName('');
      setRevSenderPhone('');
      setRevReceiverName('');
      setRevReceiverPhone('');
      setRevItemDesc('');
      setRevNotes('');
      loadAllFinanceData();
      onSuccess?.();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Gagal mencatat deklarasi penerimaan.',
      );
    }
  };

  const handleVerifyRevenue = async (
    revenueId: string,
    status: 'VERIFIED' | 'DISCREPANCY',
  ) => {
    try {
      await SpjFinanceService.verifyRevenue(revenueId, status);
      toast.success('Status verifikasi penerimaan berhasil diperbarui!');
      loadAllFinanceData();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Gagal memverifikasi penerimaan.',
      );
    }
  };

  const handleDeleteRevenue = async (revenueId: string) => {
    try {
      await SpjFinanceService.deleteRevenue(revenueId);
      toast.success('Deklarasi penerimaan berhasil dihapus.');
      loadAllFinanceData();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Gagal menghapus deklarasi.',
      );
    }
  };

  const handleSyncCrewPayments = async () => {
    if (!spj) return;
    try {
      await SpjFinanceService.syncCrewPayments(spj.id);
      toast.success(
        'Hak kompensasi kru berhasil disinkronkan dari snapshot penugasan!',
      );
      loadAllFinanceData();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Gagal menyinkronkan hak kompensasi.',
      );
    }
  };

  const handleEarlyPayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;
    try {
      await SpjFinanceService.disburseEarlyPayment(selectedPayment.id, {
        paymentMethod: earlyPayoutMethod,
        bankAccountId:
          earlyPayoutMethod === 'BANK_TRANSFER'
            ? earlyPayoutBankAcc
            : undefined,
        receiptRef: earlyPayoutRef,
        notes: earlyPayoutNotes,
      });
      toast.success(
        'Pencairan kompensasi di muka (Early Payout) berhasil dicatat!',
      );
      setEarlyPayoutOpen(false);
      setSelectedPayment(null);
      setEarlyPayoutRef('');
      setEarlyPayoutNotes('');
      loadAllFinanceData();
      onSuccess?.();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Gagal mencairkan kompensasi di muka.',
      );
    }
  };

  if (!spj) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl! w-[95vw]! max-h-[90vh]! flex flex-col p-0 overflow-hidden bg-background border border-border/70 rounded-xl shadow-xl">
          {/* Header */}
          <DialogHeader className="p-5 pb-3 border-b border-border/60 bg-muted/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <Wallet className="w-5 h-5 text-primary" />
                  Keuangan Operasional SPJ: {spj.spjNo}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Armada {spj.vehicle?.code} ({spj.vehicle?.plateNumber}) • Layanan{' '}
                  {spj.serviceType} • Kasir & Rekonsiliasi Lapangan
                </DialogDescription>
              </div>

              {/* Status Finansial & Saldo Amplop */}
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    spj.financialStatus === 'SETTLED'
                      ? 'default'
                      : spj.financialStatus === 'DISCREPANCY'
                      ? 'destructive'
                      : 'secondary'
                  }
                  className="font-mono text-xs px-2.5 py-0.5"
                >
                  {spj.financialStatus}
                </Badge>
                {uj && (
                  <Badge
                    variant="outline"
                    className="font-mono text-xs bg-muted/50 border-border text-foreground font-semibold"
                  >
                    Saldo UJ: {formatRupiah(uj.balance)}
                  </Badge>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Body Tabs */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <Tabs
              value={activeTab}
              onValueChange={(val: any) => setActiveTab(val)}
            >
              <TabsList className="grid grid-cols-4 w-full h-10 p-1 bg-muted/50 rounded-lg border border-border/40">
                <TabsTrigger
                  value="uj"
                  className="flex items-center gap-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-xs"
                >
                  <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  1. Uang Jalan (UJ)
                </TabsTrigger>
                <TabsTrigger
                  value="expenses"
                  className="flex items-center gap-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-xs"
                >
                  <Receipt className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  2. Biaya SPJ ({expenses.length})
                </TabsTrigger>
                <TabsTrigger
                  value="revenues"
                  className="flex items-center gap-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-xs"
                >
                  <Coins className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  3. Deklarasi Kas ({revenues.length})
                </TabsTrigger>
                <TabsTrigger
                  value="crew_payments"
                  className="flex items-center gap-2 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-xs"
                >
                  <CreditCard className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  4. Hak Kru ({crewPayments.length})
                </TabsTrigger>
              </TabsList>

              {/* ========================================================= */}
              {/* TAB 1: UANG JALAN (AMPLOP UJ) */}
              {/* ========================================================= */}
              <TabsContent value="uj" className="space-y-4 pt-3">
                {/* 4 Kartu Metrik Amplop UJ (Warna Seimbang & Kontras Nyaman) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Card className="border border-border/70 bg-card/60 hover:bg-card transition-colors shadow-2xs">
                    <CardHeader className="p-3.5 pb-1">
                      <CardDescription className="text-[11px] font-semibold text-muted-foreground tracking-wider uppercase flex items-center justify-between">
                        <span>TOTAL DICAIRKAN (UJ)</span>
                        <CircleDollarSign className="w-3.5 h-3.5 text-emerald-600/80" />
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3.5 pt-1">
                      <div className="text-lg font-bold text-foreground font-mono">
                        {formatRupiah(uj?.totalDisbursed)}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {uj?.disbursements?.length || 0} kali pencairan kasir
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border border-border/70 bg-card/60 hover:bg-card transition-colors shadow-2xs">
                    <CardHeader className="p-3.5 pb-1">
                      <CardDescription className="text-[11px] font-semibold text-muted-foreground tracking-wider uppercase flex items-center justify-between">
                        <span>TERPAKAI DI JALAN</span>
                        <TrendingDown className="w-3.5 h-3.5 text-amber-600/80" />
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3.5 pt-1">
                      <div className="text-lg font-bold text-foreground font-mono">
                        {formatRupiah(uj?.totalSpent)}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Nota BBM, tol & retribusi
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border border-border/70 bg-card/60 hover:bg-card transition-colors shadow-2xs">
                    <CardHeader className="p-3.5 pb-1">
                      <CardDescription className="text-[11px] font-semibold text-muted-foreground tracking-wider uppercase flex items-center justify-between">
                        <span>DIKEMBALIKAN KE KASIR</span>
                        <ArrowDownLeft className="w-3.5 h-3.5 text-blue-600/80" />
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3.5 pt-1">
                      <div className="text-lg font-bold text-foreground font-mono">
                        {formatRupiah(uj?.totalReturned)}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Setoran fisik tunai/bank
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border border-border/70 bg-card/60 hover:bg-card transition-colors shadow-2xs">
                    <CardHeader className="p-3.5 pb-1">
                      <CardDescription className="text-[11px] font-semibold text-muted-foreground tracking-wider uppercase flex items-center justify-between">
                        <span>SISA SALDO UJ</span>
                        <Wallet className="w-3.5 h-3.5 text-indigo-600/80" />
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-3.5 pt-1">
                      <div className="text-lg font-bold text-foreground font-mono">
                        {formatRupiah(uj?.balance)}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 h-4 font-semibold"
                        >
                          {uj?.status || 'DRAFT'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Action Bar UJ */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-muted/25 rounded-lg border border-border/60">
                  <div className="text-xs text-muted-foreground">
                    <strong className="text-foreground font-semibold">
                      Pemegang UJ:
                    </strong>{' '}
                    {uj?.crew?.name || 'Driver 1'} • Rekening Amplop SPJ
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => setDisburseOpen(true)}
                      className="h-8 text-xs font-semibold"
                    >
                      <PlusCircle className="w-3.5 h-3.5 mr-1" /> Cairkan UJ
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReturnAmount(
                          formatNumberWithDots(uj?.balance ? String(uj.balance) : '0'),
                        );
                        setReturnOpen(true);
                      }}
                      className="h-8 text-xs font-medium"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" /> Kembalikan Sisa
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setAdditionalReqOpen(true)}
                      className="h-8 text-xs font-medium"
                    >
                      <Send className="w-3.5 h-3.5 mr-1" /> Minta Tambahan UJ
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setRolloverAmount(
                          formatNumberWithDots(uj?.balance ? String(uj.balance) : '0'),
                        );
                        setRolloverOpen(true);
                      }}
                      className="h-8 text-xs font-semibold shadow-2xs"
                      title="Estafet UJ saat penggantian armada bus di tol (Skenario 3)"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 mr-1" /> Estafet
                      Rollover UJ
                    </Button>
                  </div>
                </div>

                {/* Riwayat Pencairan Bertahap */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Riwayat Pencairan UJ (Multi-Line Disbursements)
                  </h4>
                  <div className="border border-border/60 rounded-md overflow-hidden bg-background">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead className="text-xs font-medium">
                            Waktu Pencairan
                          </TableHead>
                          <TableHead className="text-xs font-medium">
                            Tipe
                          </TableHead>
                          <TableHead className="text-xs font-medium">
                            Metode
                          </TableHead>
                          <TableHead className="text-xs font-medium">
                            Ref / BKK
                          </TableHead>
                          <TableHead className="text-xs font-medium text-right">
                            Nominal
                          </TableHead>
                          <TableHead className="text-xs font-medium">
                            Catatan
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!uj?.disbursements || uj.disbursements.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center py-4 text-xs text-muted-foreground"
                            >
                              Belum ada riwayat pencairan dana UJ.
                            </TableCell>
                          </TableRow>
                        ) : (
                          uj.disbursements.map((d) => (
                            <TableRow key={d.id} className="hover:bg-muted/20">
                              <TableCell className="text-xs font-mono">
                                {new Date(d.disbursedAt).toLocaleString(
                                  'id-ID',
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-mono"
                                >
                                  {d.disbursementType}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {d.paymentMethod === 'CASH'
                                  ? `Tunai (${d.cashAccount?.name || 'Kas Pool'})`
                                  : `Bank (${d.bankAccount?.bankName || 'Transfer'})`}
                              </TableCell>
                              <TableCell className="text-xs font-mono text-muted-foreground">
                                {d.receiptRef || '-'}
                              </TableCell>
                              <TableCell className="text-xs font-mono font-bold text-right text-foreground">
                                {formatRupiah(d.amount)}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {d.notes || '-'}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Riwayat Pengembalian Fisik UJ */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Riwayat Pengembalian Fisik UJ ke Kasir (Returns)
                  </h4>
                  <div className="border border-border/60 rounded-md overflow-hidden bg-background">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead className="text-xs font-medium">
                            Waktu Terima
                          </TableHead>
                          <TableHead className="text-xs font-medium">
                            Metode
                          </TableHead>
                          <TableHead className="text-xs font-medium">
                            Ref / BKM
                          </TableHead>
                          <TableHead className="text-xs font-medium text-right">
                            Nominal
                          </TableHead>
                          <TableHead className="text-xs font-medium">
                            Kasir Penerima
                          </TableHead>
                          <TableHead className="text-xs font-medium">
                            Catatan
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!uj?.returns || uj.returns.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center py-4 text-xs text-muted-foreground"
                            >
                              Belum ada pengembalian sisa dana UJ.
                            </TableCell>
                          </TableRow>
                        ) : (
                          uj.returns.map((r) => (
                            <TableRow key={r.id} className="hover:bg-muted/20">
                              <TableCell className="text-xs font-mono">
                                {new Date(r.returnedAt).toLocaleString(
                                  'id-ID',
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {r.paymentMethod}
                              </TableCell>
                              <TableCell className="text-xs font-mono text-muted-foreground">
                                {r.receiptRef || '-'}
                              </TableCell>
                              <TableCell className="text-xs font-mono font-bold text-right text-foreground">
                                {formatRupiah(r.amount)}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {r.receiver?.name || '-'}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {r.notes || '-'}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Pengajuan Tambahan UJ di Jalan */}
                {uj?.additionalRequests &&
                  uj.additionalRequests.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Permintaan Tambahan UJ di Tengah Jalan
                      </h4>
                      <div className="border border-border/60 rounded-md overflow-hidden bg-background">
                        <Table>
                          <TableHeader className="bg-muted/30">
                            <TableRow>
                              <TableHead className="text-xs font-medium">
                                Waktu
                              </TableHead>
                              <TableHead className="text-xs font-medium">
                                Alasan Permintaan
                              </TableHead>
                              <TableHead className="text-xs font-medium text-right">
                                Nominal
                              </TableHead>
                              <TableHead className="text-xs font-medium">
                                Status
                              </TableHead>
                              <TableHead className="text-xs font-medium text-right">
                                Aksi Kasir
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {uj.additionalRequests.map((req) => (
                              <TableRow key={req.id} className="hover:bg-muted/20">
                                <TableCell className="text-xs font-mono">
                                  {new Date(req.createdAt).toLocaleString(
                                    'id-ID',
                                  )}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {req.reason}
                                </TableCell>
                                <TableCell className="text-xs font-mono font-bold text-right text-foreground">
                                  {formatRupiah(req.amount)}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      req.status === 'APPROVED'
                                        ? 'default'
                                        : req.status === 'REJECTED'
                                        ? 'destructive'
                                        : 'secondary'
                                    }
                                    className="text-[10px]"
                                  >
                                    {req.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right space-x-1">
                                  {req.status === 'PENDING' && (
                                    <>
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          handleProcessAddReq(
                                            req.id,
                                            'APPROVED',
                                          )
                                        }
                                        className="h-7 text-[11px] font-semibold"
                                      >
                                        Setujui & Transfer
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          handleProcessAddReq(
                                            req.id,
                                            'REJECTED',
                                          )
                                        }
                                        className="h-7 text-[11px] text-destructive hover:bg-destructive/10"
                                      >
                                        Tolak
                                      </Button>
                                    </>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
              </TabsContent>

              {/* ========================================================= */}
              {/* TAB 2: BIAYA OPERASIONAL SPJ (EXPENSES) */}
              {/* ========================================================= */}
              <TabsContent value="expenses" className="space-y-4 pt-3">
                <div className="flex items-center justify-between gap-3 p-3 bg-muted/25 border border-border/60 rounded-lg">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      Pengeluaran Operasional Bus
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      BBM solar (liter + odometer), tol Trans-Jawa, retribusi
                      terminal, servis makan restoran, dan biaya darurat.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setExpenseFormOpen(true)}
                    className="h-8 text-xs font-semibold"
                  >
                    <PlusCircle className="w-3.5 h-3.5 mr-1" /> Catat
                    Pengeluaran
                  </Button>
                </div>

                <div className="border border-border/60 rounded-md overflow-hidden bg-background">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="text-xs font-medium">
                          Waktu / Tanggal
                        </TableHead>
                        <TableHead className="text-xs font-medium">
                          Kategori
                        </TableHead>
                        <TableHead className="text-xs font-medium">
                          Sumber Dana
                        </TableHead>
                        <TableHead className="text-xs font-medium">
                          Rincian Nota (BBM / SPBU / Ref)
                        </TableHead>
                        <TableHead className="text-xs font-medium text-right">
                          Nominal
                        </TableHead>
                        <TableHead className="text-xs font-medium">
                          Status
                        </TableHead>
                        <TableHead className="text-xs font-medium text-right">
                          Aksi
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center py-6 text-xs text-muted-foreground"
                          >
                            Belum ada pengeluaran operasional yang dicatat pada
                            SPJ ini.
                          </TableCell>
                        </TableRow>
                      ) : (
                        expenses.map((exp) => (
                          <TableRow key={exp.id} className="hover:bg-muted/20">
                            <TableCell className="text-xs font-mono">
                              {new Date(exp.expenseDate).toLocaleDateString(
                                'id-ID',
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="text-[10px] font-mono"
                              >
                                {exp.expenseType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">
                              <Badge
                                variant="secondary"
                                className="text-[10px]"
                              >
                                {exp.paymentSource}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">
                              {exp.expenseType === 'FUEL' ? (
                                <div className="space-y-0.5">
                                  <div className="font-semibold flex items-center gap-1 text-foreground">
                                    <Fuel className="w-3 h-3 text-muted-foreground" />
                                    {exp.fuelLiters} Liter • Odo:{' '}
                                    {exp.odometerKm || '-'} KM
                                  </div>
                                  <div className="text-[11px] text-muted-foreground">
                                    {exp.fuelStation || 'SPBU Tol'} • No:{' '}
                                    {exp.receiptNumber || '-'}
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="font-medium text-foreground">
                                    {exp.receiptNumber || 'Tanpa No Struk'}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground">
                                    {exp.notes || '-'}
                                  </div>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-xs font-mono font-bold text-right text-foreground">
                              {formatRupiah(exp.amount)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  exp.status === 'APPROVED'
                                    ? 'default'
                                    : exp.status === 'REJECTED'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                                className="text-[10px]"
                              >
                                {exp.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-1">
                              {exp.status === 'PENDING' && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleVerifyExpense(exp.id, 'APPROVED')
                                  }
                                  className="h-7 text-[11px] font-semibold"
                                >
                                  Verifikasi
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteExpense(exp.id)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* ========================================================= */}
              {/* TAB 3: DEKLARASI PENERIMAAN KAS KRU (ANTI-NETTING) */}
              {/* ========================================================= */}
              <TabsContent value="revenues" className="space-y-4 pt-3">
                {/* Info Anti-Netting */}
                <div className="p-3 bg-muted/25 border border-border/60 rounded-lg flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">
                      Prinsip Anti-Netting Kas Kru (Addendum v1.9 & Skenario 1):
                    </strong>{' '}
                    Penerimaan tiket tunai langsung naik pool maupun kargo bagasi
                    motor/kardus wajib dideklarasikan secara bruto penuh. Komisi
                    kru (15% - 25%) dihitung sistem secara otomatis dan
                    dimasukkan ke tabel kompensasi kru tanpa memotong fisik kas
                    di jalan.
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Daftar Deklarasi Penerimaan Kas Kru
                  </h4>
                  <Button
                    size="sm"
                    onClick={() => setRevenueFormOpen(true)}
                    className="h-8 text-xs font-semibold"
                  >
                    <PlusCircle className="w-3.5 h-3.5 mr-1" /> Input
                    Penerimaan Kas
                  </Button>
                </div>

                <div className="border border-border/60 rounded-md overflow-hidden bg-background">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="text-xs font-medium">
                          Waktu
                        </TableHead>
                        <TableHead className="text-xs font-medium">
                          Jenis Penerimaan
                        </TableHead>
                        <TableHead className="text-xs font-medium">
                          Resi / Manifest
                        </TableHead>
                        <TableHead className="text-xs font-medium">
                          Rincian Kargo / Pengirim
                        </TableHead>
                        <TableHead className="text-xs font-medium text-right">
                          Bruto Kas
                        </TableHead>
                        <TableHead className="text-xs font-medium text-right">
                          Hak Komisi Kru
                        </TableHead>
                        <TableHead className="text-xs font-medium">
                          Status
                        </TableHead>
                        <TableHead className="text-xs font-medium text-right">
                          Aksi
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {revenues.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className="text-center py-6 text-xs text-muted-foreground"
                          >
                            Belum ada deklarasi penerimaan tiket langsung atau
                            kargo.
                          </TableCell>
                        </TableRow>
                      ) : (
                        revenues.map((rev) => (
                          <TableRow key={rev.id} className="hover:bg-muted/20">
                            <TableCell className="text-xs font-mono">
                              {new Date(rev.declaredAt).toLocaleString('id-ID')}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="text-[10px] font-mono"
                              >
                                {rev.declarationType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs font-mono text-muted-foreground">
                              {rev.sourceReference || '-'}
                            </TableCell>
                            <TableCell className="text-xs">
                              {rev.cargoSenderName ? (
                                <div className="space-y-0.5">
                                  <div>
                                    <strong>Dari:</strong> {rev.cargoSenderName}{' '}
                                    ➔ <strong>Ke:</strong>{' '}
                                    {rev.cargoReceiverName}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground">
                                    {rev.cargoItemDescription || 'Kargo paket'}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">
                                  {rev.notes || '-'}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs font-mono font-bold text-right text-foreground">
                              {formatRupiah(rev.amount)}
                            </TableCell>
                            <TableCell className="text-xs font-mono font-semibold text-right text-muted-foreground">
                              {Number(rev.crewCommissionAmount) > 0 ? (
                                <span>
                                  {formatRupiah(rev.crewCommissionAmount)}{' '}
                                  <span className="text-[10px] text-muted-foreground">
                                    ({rev.crewCommissionPercentage}%)
                                  </span>
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  rev.status === 'VERIFIED'
                                    ? 'default'
                                    : 'secondary'
                                }
                                className="text-[10px]"
                              >
                                {rev.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-1">
                              {rev.status === 'DECLARED' && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleVerifyRevenue(rev.id, 'VERIFIED')
                                  }
                                  className="h-7 text-[11px] font-semibold"
                                >
                                  Verifikasi Fisik
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteRevenue(rev.id)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* ========================================================= */}
              {/* TAB 4: HAK KOMPENSASI KRU & EARLY PAYOUT */}
              {/* ========================================================= */}
              <TabsContent value="crew_payments" className="space-y-4 pt-3">
                <div className="flex items-center justify-between gap-3 p-3 bg-muted/25 border border-border/60 rounded-lg">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      Kompensasi Kru, Premi Ritase, & Nafkah di Jalan
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Uang makan, premi ritase, bonus full-seat 100%, komisi
                      kargo, dan transfer nafkah keluarga kru (Skenario 2 Early
                      Payout).
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSyncCrewPayments}
                    disabled={loading}
                    className="h-8 text-xs font-medium"
                  >
                    <RefreshCw
                      className={
                        loading
                          ? 'w-3.5 h-3.5 mr-1 animate-spin'
                          : 'w-3.5 h-3.5 mr-1'
                      }
                    />{' '}
                    Sinkronkan Hak Kru
                  </Button>
                </div>

                <div className="border border-border/60 rounded-md overflow-hidden bg-background">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="text-xs font-medium">
                          Nama Kru
                        </TableHead>
                        <TableHead className="text-xs font-medium">
                          Kategori Hak
                        </TableHead>
                        <TableHead className="text-xs font-medium">
                          Jadwal Cair
                        </TableHead>
                        <TableHead className="text-xs font-medium text-right">
                          Nominal
                        </TableHead>
                        <TableHead className="text-xs font-medium">
                          Status Pembayaran
                        </TableHead>
                        <TableHead className="text-xs font-medium">
                          Keterangan / Ref Transfer
                        </TableHead>
                        <TableHead className="text-xs font-medium text-right">
                          Aksi
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {crewPayments.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center py-6 text-xs text-muted-foreground"
                          >
                            Belum ada baris hak kompensasi kru. Klik
                            'Sinkronkan Hak Kru' untuk mengambil dari snapshot
                            penugasan.
                          </TableCell>
                        </TableRow>
                      ) : (
                        crewPayments.map((pay) => (
                          <TableRow key={pay.id} className="hover:bg-muted/20">
                            <TableCell className="text-xs font-semibold">
                              👤 {pay.crew?.name || 'Kru SPJ'}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="text-[10px] font-mono"
                              >
                                {pay.paymentCategory}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">
                              {pay.payoutTiming === 'EARLY_DISBURSEMENT' ? (
                                <Badge variant="secondary" className="text-[10px]">
                                  Di Jalan (Early Payout)
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] text-muted-foreground"
                                >
                                  Saat Rekonsiliasi Pool
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs font-mono font-bold text-right text-foreground">
                              {formatRupiah(pay.amount)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  pay.status === 'PAID'
                                    ? 'default'
                                    : 'secondary'
                                }
                                className="text-[10px]"
                              >
                                {pay.status === 'PAID'
                                  ? 'TERBAYAR'
                                  : 'BELUM CAIR'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {pay.receiptRef ? (
                                <span>Ref: {pay.receiptRef}</span>
                              ) : (
                                <span>{pay.notes || '-'}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {pay.status === 'PENDING' && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPayment(pay);
                                    setEarlyPayoutOpen(true);
                                  }}
                                  className="h-7 text-[11px] font-semibold"
                                  title="Transfer sebagian nafkah premi di muka saat tour wisata (Skenario 2)"
                                >
                                  💸 Transfer Early
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* DIALOG 1: PENCAIRAN UJ */}
      {/* ========================================================= */}
      <Dialog open={disburseOpen} onOpenChange={setDisburseOpen}>
        <DialogContent className="max-w-md bg-background border border-border/70 rounded-xl shadow-lg">
          <DialogHeader className="pb-2 border-b border-border/50">
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
              <PlusCircle className="w-4 h-4 text-primary" />
              Pencairan Dana Uang Jalan (UJ)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Mencatat pengeluaran uang tunai pool atau transfer bank untuk modal
              perjalanan supir.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDisburseSubmit} className="space-y-3.5 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Nominal Pencairan
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-semibold text-muted-foreground select-none">
                  Rp
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={disburseAmount}
                  onChange={(e) =>
                    setDisburseAmount(formatNumberWithDots(e.target.value))
                  }
                  placeholder="0"
                  className="pl-9 h-9 text-xs font-mono font-semibold"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Metode Pembayaran
              </Label>
              <Select
                value={disburseMethod}
                onValueChange={(val: any) => setDisburseMethod(val)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Kas Tunai Pool (Kasir)</SelectItem>
                  <SelectItem value="BANK_TRANSFER">
                    Transfer Rekening Bank
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {disburseMethod === 'CASH' ? (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Akun Kas Sumber
                </Label>
                <Select
                  value={disburseCashAcc}
                  onValueChange={setDisburseCashAcc}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Pilih Akun Kas" />
                  </SelectTrigger>
                  <SelectContent>
                    {cashAccounts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Rekening Bank Sumber
                </Label>
                <Select
                  value={disburseBankAcc}
                  onValueChange={setDisburseBankAcc}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Pilih Rekening Bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.bankName} - {b.accountNumber} ({b.accountName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Nomor Bukti Kas Keluar (BKK) / Ref
              </Label>
              <Input
                value={disburseRef}
                onChange={(e) => setDisburseRef(e.target.value)}
                placeholder="Misal: BKK/2610/0001"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Catatan
              </Label>
              <Textarea
                value={disburseNotes}
                onChange={(e) => setDisburseNotes(e.target.value)}
                placeholder="Catatan pencairan UJ..."
                className="text-xs resize-none h-16"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDisburseOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" size="sm" className="font-semibold">
                Simpan Pencairan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* DIALOG 2: PENGEMBALIAN SISA UJ */}
      {/* ========================================================= */}
      <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
        <DialogContent className="max-w-md bg-background border border-border/70 rounded-xl shadow-lg">
          <DialogHeader className="pb-2 border-b border-border/50">
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
              <RotateCcw className="w-4 h-4 text-primary" />
              Pengembalian Fisik Sisa UJ ke Kasir
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Sopir menyerahkan sisa uang jalan tunai saat bus tiba kembali di
              pool.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReturnSubmit} className="space-y-3.5 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Nominal Sisa UJ Dikembalikan
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-semibold text-muted-foreground select-none">
                  Rp
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={returnAmount}
                  onChange={(e) =>
                    setReturnAmount(formatNumberWithDots(e.target.value))
                  }
                  placeholder="0"
                  className="pl-9 h-9 text-xs font-mono font-semibold"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Metode Penyetoran
              </Label>
              <Select
                value={returnMethod}
                onValueChange={(val: any) => setReturnMethod(val)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Tunai ke Kasir Pool</SelectItem>
                  <SelectItem value="BANK_TRANSFER">
                    Transfer ke Rekening Perusahaan
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {returnMethod === 'CASH' ? (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Akun Kas Penerima
                </Label>
                <Select
                  value={returnCashAcc}
                  onValueChange={setReturnCashAcc}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Pilih Akun Kas" />
                  </SelectTrigger>
                  <SelectContent>
                    {cashAccounts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Rekening Bank Penerima
                </Label>
                <Select
                  value={returnBankAcc}
                  onValueChange={setReturnBankAcc}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Pilih Rekening Bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.bankName} - {b.accountNumber} ({b.accountName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Nomor Bukti Kas Masuk (BKM)
              </Label>
              <Input
                value={returnRef}
                onChange={(e) => setReturnRef(e.target.value)}
                placeholder="Misal: BKM/2610/0001"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Catatan
              </Label>
              <Textarea
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="Keterangan pengembalian sisa UJ..."
                className="text-xs resize-none h-16"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReturnOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" size="sm" className="font-semibold">
                Catat Pengembalian
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* DIALOG 3: PERMINTAAN TAMBAHAN UJ DI JALAN */}
      {/* ========================================================= */}
      <Dialog
        open={additionalReqOpen}
        onOpenChange={setAdditionalReqOpen}
      >
        <DialogContent className="max-w-md bg-background border border-border/70 rounded-xl shadow-lg">
          <DialogHeader className="pb-2 border-b border-border/50">
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
              <Send className="w-4 h-4 text-primary" />
              Pengajuan Tambahan UJ di Tengah Perjalanan
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Kru mengajukan transfer tambahan dana operasional di jalan akibat
              keperluan tak terduga.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdditionalReqSubmit} className="space-y-3.5 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Nominal Tambahan yang Diminta
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-semibold text-muted-foreground select-none">
                  Rp
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={addReqAmount}
                  onChange={(e) =>
                    setAddReqAmount(formatNumberWithDots(e.target.value))
                  }
                  placeholder="0"
                  className="pl-9 h-9 text-xs font-mono font-semibold"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Alasan Kebutuhan Dana Tambahan
              </Label>
              <Textarea
                value={addReqReason}
                onChange={(e) => setAddReqReason(e.target.value)}
                placeholder="Contoh: Rute pengalihan tol macet total, butuh solar tambahan..."
                className="text-xs resize-none h-20"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAdditionalReqOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" size="sm" className="font-semibold">
                Kirim Pengajuan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* DIALOG 4: ESTAFET ROLLOVER UJ (SKENARIO 3) */}
      {/* ========================================================= */}
      <Dialog open={rolloverOpen} onOpenChange={setRolloverOpen}>
        <DialogContent className="max-w-md bg-background border border-border/70 rounded-xl shadow-lg">
          <DialogHeader className="pb-2 border-b border-border/50">
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-destructive">
              <ArrowRightLeft className="w-4 h-4" />
              Estafet Rollover Sisa UJ (Skenario 3 Breakdown)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Mentransfer sisa fisik saldo amplop UJ dari armada bus yang rusak
              ke dokumen SPJ bus pengganti.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRolloverSubmit} className="space-y-3.5 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Pilih SPJ Armada Pengganti
              </Label>
              <Select
                value={rolloverTargetSpj}
                onValueChange={setRolloverTargetSpj}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Pilih SPJ Bus Pengganti" />
                </SelectTrigger>
                <SelectContent>
                  {availableSpjs.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.spjNo} (Bus {s.vehicle?.code || 'SS-xx'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Nominal Sisa UJ yang Diestafetkan
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-semibold text-muted-foreground select-none">
                  Rp
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={rolloverAmount}
                  onChange={(e) =>
                    setRolloverAmount(formatNumberWithDots(e.target.value))
                  }
                  placeholder="0"
                  className="pl-9 h-9 text-xs font-mono font-semibold"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Catatan Serah Terima Fisik
              </Label>
              <Textarea
                value={rolloverNotes}
                onChange={(e) => setRolloverNotes(e.target.value)}
                placeholder="Contoh: Serah terima sisa uang solar di KM 102 Tol Cipali..."
                className="text-xs resize-none h-16"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRolloverOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                variant="destructive"
                className="font-semibold"
              >
                Eksekusi Estafet UJ
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* DIALOG 5: CATAT PENGELUARAN OPERASIONAL (SPJ EXPENSES) */}
      {/* ========================================================= */}
      <Dialog open={expenseFormOpen} onOpenChange={setExpenseFormOpen}>
        <DialogContent className="max-w-lg bg-background border border-border/70 rounded-xl shadow-lg">
          <DialogHeader className="pb-2 border-b border-border/50">
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
              <Receipt className="w-4 h-4 text-primary" />
              Input Pengeluaran Operasional SPJ
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Nota fisik BBM, tol, tiket kapal feri, parkir, retribusi TPR,
              maupun perbaikan darurat di jalan.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateExpenseSubmit} className="space-y-3.5 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Jenis Beban
                </Label>
                <Select
                  value={expType}
                  onValueChange={(val: any) => setExpType(val)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FUEL">BBM (Solar)</SelectItem>
                    <SelectItem value="TOLL">Tol / E-Toll</SelectItem>
                    <SelectItem value="PARKING">Parkir</SelectItem>
                    <SelectItem value="RETRIBUTION">Retribusi / TPR</SelectItem>
                    <SelectItem value="RESTAURANT_MEAL_SERVICE">
                      Servis Makan Penumpang
                    </SelectItem>
                    <SelectItem value="CREW_LODGING">
                      Penginapan Kru (Wisata)
                    </SelectItem>
                    <SelectItem value="EMERGENCY_REPAIR">
                      Perbaikan Darurat / Ban
                    </SelectItem>
                    <SelectItem value="TOWING">Biaya Derek Resmi Tol</SelectItem>
                    <SelectItem value="OTHER">Lain-Lain</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Sumber Dana
                </Label>
                <Select
                  value={expSource}
                  onValueChange={(val: any) => setExpSource(val)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UJ">Uang Jalan Kru (UJ)</SelectItem>
                    <SelectItem value="OFFICE_CASH">
                      Kas Kantor / Pool
                    </SelectItem>
                    <SelectItem value="OFFICE_BANK">
                      Transfer Bank Kantor
                    </SelectItem>
                    <SelectItem value="CREW_POCKET">
                      Talangan Kantong Kru
                    </SelectItem>
                    <SelectItem value="OFFICE_AP">
                      Tagihan Tempo Vendor (AP)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Nominal Pengeluaran
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-semibold text-muted-foreground select-none">
                  Rp
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={expAmount}
                  onChange={(e) =>
                    setExpAmount(formatNumberWithDots(e.target.value))
                  }
                  placeholder="0"
                  className="pl-9 h-9 text-xs font-mono font-semibold"
                  required
                />
              </div>
            </div>

            {expType === 'FUEL' && (
              <div className="grid grid-cols-3 gap-2.5 p-3 bg-muted/25 border border-border/60 rounded-lg">
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-muted-foreground">
                    Volume Solar (Liter)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={expFuelLiters}
                    onChange={(e) => setExpFuelLiters(e.target.value)}
                    placeholder="264.70"
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-muted-foreground">
                    Odometer (KM)
                  </Label>
                  <Input
                    type="number"
                    value={expOdometer}
                    onChange={(e) => setExpOdometer(e.target.value)}
                    placeholder="125430"
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-muted-foreground">
                    SPBU / Rest Area
                  </Label>
                  <Input
                    value={expFuelStation}
                    onChange={(e) => setExpFuelStation(e.target.value)}
                    placeholder="KM 207A Palikanci"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Nomor Struk / Nota Fisik
              </Label>
              <Input
                value={expReceiptNo}
                onChange={(e) => setExpReceiptNo(e.target.value)}
                placeholder="Misal: BBM-207-001"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Keterangan Biaya
              </Label>
              <Textarea
                value={expNotes}
                onChange={(e) => setExpNotes(e.target.value)}
                placeholder="Catatan rincian biaya..."
                className="text-xs resize-none h-16"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setExpenseFormOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" size="sm" className="font-semibold">
                Simpan Nota Pengeluaran
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* DIALOG 6: DEKLARASI PENERIMAAN KAS KRU */}
      {/* ========================================================= */}
      <Dialog open={revenueFormOpen} onOpenChange={setRevenueFormOpen}>
        <DialogContent className="max-w-lg bg-background border border-border/70 rounded-xl shadow-lg">
          <DialogHeader className="pb-2 border-b border-border/50">
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
              <Coins className="w-4 h-4 text-primary" />
              Deklarasi Penerimaan Kas Kru
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Tiket langsung naik pool atau kargo motor/kardus di bagasi bus
              (Anti-Netting).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateRevenueSubmit} className="space-y-3.5 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Jenis Penerimaan
                </Label>
                <Select
                  value={revType}
                  onValueChange={(val: any) => setRevType(val)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TICKET_CASH">
                      Tiket Tunai Langsung Naik
                    </SelectItem>
                    <SelectItem value="AGENT_DEPOSIT">
                      Titipan Setoran Agen Terminal
                    </SelectItem>
                    <SelectItem value="CARGO_MOTORCYCLE">
                      Kargo Sepeda Motor (Bagasi Bawah)
                    </SelectItem>
                    <SelectItem value="CARGO_BOX">
                      Kargo Kardus / Oleh-oleh
                    </SelectItem>
                    <SelectItem value="CHARTER_CASH">
                      Pelunasan Sewa Wisata di Lapangan
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Nomor Resi / Tiket
                </Label>
                <Input
                  value={revRef}
                  onChange={(e) => setRevRef(e.target.value)}
                  placeholder="Misal: RESI-MTR-001"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Nominal Bruto Kas Diterima
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-semibold text-muted-foreground select-none">
                  Rp
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={revAmount}
                  onChange={(e) =>
                    setRevAmount(formatNumberWithDots(e.target.value))
                  }
                  placeholder="0"
                  className="pl-9 h-9 text-xs font-mono font-semibold"
                  required
                />
              </div>
            </div>

            {/* Slider Komisi Dinamis Kru Kargo (Addendum v1.9) */}
            {(revType === 'CARGO_MOTORCYCLE' || revType === 'CARGO_BOX') && (
              <div className="p-3 bg-muted/25 border border-border/60 rounded-lg space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">
                    Hak Komisi Kru Kargo:
                  </span>
                  <span className="font-mono font-bold text-foreground">
                    {revCargoCommissionPct}% (
                    {formatRupiah(
                      (Number(cleanDots(revAmount) || 0) *
                        Number(revCargoCommissionPct)) /
                        100,
                    )}
                    )
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {['15.00', '20.00', '25.00'].map((pct) => (
                    <Button
                      key={pct}
                      type="button"
                      size="sm"
                      variant={
                        revCargoCommissionPct === pct ? 'default' : 'outline'
                      }
                      onClick={() => setRevCargoCommissionPct(pct)}
                      className="h-7 text-xs font-mono flex-1"
                    >
                      {pct}%
                    </Button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      Nama Pengirim
                    </Label>
                    <Input
                      value={revSenderName}
                      onChange={(e) => setRevSenderName(e.target.value)}
                      placeholder="Pak Ahmad"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      Nama Penerima
                    </Label>
                    <Input
                      value={revReceiverName}
                      onChange={(e) => setRevReceiverName(e.target.value)}
                      placeholder="Mas Wahyu"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <Label className="text-[11px] font-medium text-muted-foreground">
                    Keterangan Barang
                  </Label>
                  <Input
                    value={revItemDesc}
                    onChange={(e) => setRevItemDesc(e.target.value)}
                    placeholder="Contoh: Honda Vario 125cc"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Catatan
              </Label>
              <Textarea
                value={revNotes}
                onChange={(e) => setRevNotes(e.target.value)}
                placeholder="Catatan tambahan penerimaan kas..."
                className="text-xs resize-none h-16"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRevenueFormOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" size="sm" className="font-semibold">
                Simpan Deklarasi
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* DIALOG 7: EARLY PAYOUT TRANSFER (SKENARIO 2) */}
      {/* ========================================================= */}
      <Dialog open={earlyPayoutOpen} onOpenChange={setEarlyPayoutOpen}>
        <DialogContent className="max-w-md bg-background border border-border/70 rounded-xl shadow-lg">
          <DialogHeader className="pb-2 border-b border-border/50">
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
              <CreditCard className="w-4 h-4 text-primary" />
              Transfer Kompensasi di Muka (Early Payout)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Mencairkan sebagian uang premi ke rekening keluarga supir saat
              perjalanan wisata multi-day.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEarlyPayoutSubmit} className="space-y-3.5 pt-2">
            <div className="p-3 bg-muted/25 rounded-lg space-y-1 text-xs border border-border/50">
              <div>
                <strong className="text-foreground">Penerima:</strong>{' '}
                <span className="text-muted-foreground">
                  {selectedPayment?.crew?.name}
                </span>
              </div>
              <div>
                <strong className="text-foreground">Kategori:</strong>{' '}
                <span className="text-muted-foreground">
                  {selectedPayment?.paymentCategory}
                </span>
              </div>
              <div className="font-mono font-bold text-sm text-foreground pt-0.5">
                Nominal: {formatRupiah(selectedPayment?.amount)}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Metode Pencairan
              </Label>
              <Select
                value={earlyPayoutMethod}
                onValueChange={(val: any) => setEarlyPayoutMethod(val)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANK_TRANSFER">Transfer Bank</SelectItem>
                  <SelectItem value="CASH">Tunai Kas Kantor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Rekening Bank Sumber Perusahaan
              </Label>
              <Select
                value={earlyPayoutBankAcc}
                onValueChange={setEarlyPayoutBankAcc}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Pilih Rekening Bank" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.bankName} - {b.accountNumber} ({b.accountName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Nomor Referensi Transfer Bank
              </Label>
              <Input
                value={earlyPayoutRef}
                onChange={(e) => setEarlyPayoutRef(e.target.value)}
                placeholder="Misal: TRF-BCA-88772"
                className="h-9 text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Catatan
              </Label>
              <Textarea
                value={earlyPayoutNotes}
                onChange={(e) => setEarlyPayoutNotes(e.target.value)}
                placeholder="Contoh: Transfer uang nafkah keluarga driver di jalan..."
                className="text-xs resize-none h-16"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEarlyPayoutOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" size="sm" className="font-semibold">
                Konfirmasi Transfer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
