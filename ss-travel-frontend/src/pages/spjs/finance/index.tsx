import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Textarea } from '@/components/ui/textarea';
import { AgentService } from '@/services/agent.service';
import { CashBankService } from '@/services/cash-bank.service';
import { CoordinationFeeService } from '@/services/coordination-fee.service';
import { RestaurantSettlementService } from '@/services/restaurant-settlement.service';
import { SpjFinanceService } from '@/services/spj-finance.service';
import { SpjService } from '@/services/spj.service';
import { VehicleService } from '@/services/vehicle.service';
import type {
  Agent,
  AgentSettlementType,
  BankAccount,
  CashAccount,
  CrewMealPayment,
  Restaurant,
  SeatClass,
  Spj,
  SpjCoordinationFee,
  SpjExpense,
  SpjExpensePaymentSource,
  SpjExpenseType,
  SpjMealRecord,
  SpjPaymentMethod,
  SpjRevenueDeclaration,
  SpjRevenueDeclarationType,
  SpjUj,
} from '@/types';
import {
  ArrowLeft,
  ArrowRightLeft,
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Coins,
  CreditCard,
  FileText,
  Fuel,
  Hotel,
  Info,
  PlusCircle,
  Receipt,
  RefreshCw,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
  TrendingDown,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/shared/confirm-dialog';
import { useAuth } from '@/hooks/use-auth';
import { usePermission } from '@/hooks/use-permission';

export default function SpjFinancePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { user } = useAuth();
  const { actions } = usePermission('/spjs');
  const isSuperAdmin =
    user?.role === 'SUPER_ADMIN' ||
    user?.role?.toUpperCase() === 'SUPER_ADMIN' ||
    Boolean(
      user?.roles?.some(
        (r: any) =>
          r.name === 'SUPER_ADMIN' ||
          r.name?.toUpperCase() === 'SUPER_ADMIN',
      ),
    );
  const canDisburseUj = isSuperAdmin || Boolean((actions as any)?.disburse_uj);

  const [spj, setSpj] = useState<Spj | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [uj, setUj] = useState<SpjUj | null>(null);
  const [expenses, setExpenses] = useState<SpjExpense[]>([]);
  const [revenues, setRevenues] = useState<SpjRevenueDeclaration[]>([]);
  const [crewPayments, setCrewPayments] = useState<CrewMealPayment[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [availableSpjs, setAvailableSpjs] = useState<Spj[]>([]);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [filterByLeg, setFilterByLeg] = useState<boolean>(true);
  const [seatClasses, setSeatClasses] = useState<SeatClass[]>([]);

  // Sub-dialogs
  const [disburseOpen, setDisburseOpen] = useState(false);
  const [confirmDisburseOpen, setConfirmDisburseOpen] = useState(false);
  const [disburseLoading, setDisburseLoading] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [additionalReqOpen, setAdditionalReqOpen] = useState(false);
  const [rolloverOpen, setRolloverOpen] = useState(false);
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [revenueFormOpen, setRevenueFormOpen] = useState(false);
  const [earlyPayoutOpen, setEarlyPayoutOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<CrewMealPayment | null>(null);

  // Dialog Penjualan Tiket Agen & Preview Jurnal
  const [agentTicketModalOpen, setAgentTicketModalOpen] = useState(false);
  const [journalPreviewModalOpen, setJournalPreviewModalOpen] = useState(false);

  // Dialog Kupon Makan Penumpang di Restoran Mitra
  const [, setMealServiceData] = useState<any>(null);
  const [mealCouponModalOpen, setMealCouponModalOpen] = useState(false);
  const [selectedLegForMeal, setSelectedLegForMeal] = useState<any>(null);
  const [inputMealPaxCount, setInputMealPaxCount] = useState<number>(0);
  const [inputMealRatePerPax, setInputMealRatePerPax] = useState<string>('25.000');
  const [inputMealDiscrepancyNotes, setInputMealDiscrepancyNotes] = useState<string>('');
  const [spjMealRecords, setSpjMealRecords] = useState<SpjMealRecord[]>([]);
  const [restaurantsList, setRestaurantsList] = useState<Restaurant[]>([]);
  const [selectedMealRestaurantId, setSelectedMealRestaurantId] = useState<string>('');

  // Uang Koordinasi Lapangan (Pengurus Jalur - Beban 52105)
  const [coordinationFees, setCoordinationFees] = useState<SpjCoordinationFee[]>([]);

  // Form states - Pencairan UJ
  const [disburseAmount, setDisburseAmount] = useState('');
  const [disburseMethod, setDisburseMethod] = useState<SpjPaymentMethod>('CASH');
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

  // Form states - Deklarasi Penerimaan Kas Langsung & Kargo
  const [revType, setRevType] = useState<SpjRevenueDeclarationType>('CARGO_MOTORCYCLE');
  const [revAmount, setRevAmount] = useState('');
  const [revRef, setRevRef] = useState('');
  const [revCargoCommissionPct, setRevCargoCommissionPct] = useState('20.00');
  const [revCargoCommissionAmount, setRevCargoCommissionAmount] = useState('70000');
  const [revRecipientCrewAssignmentId, setRevRecipientCrewAssignmentId] = useState('');
  const [revSenderName, setRevSenderName] = useState('');
  const [revSenderPhone, setRevSenderPhone] = useState('');
  const [revReceiverName, setRevReceiverName] = useState('');
  const [revReceiverPhone, setRevReceiverPhone] = useState('');
  const [revItemDesc, setRevItemDesc] = useState('');
  const [revNotes, setRevNotes] = useState('');

  // Form states - Early Payout
  const [earlyPayoutMethod, setEarlyPayoutMethod] = useState<SpjPaymentMethod>('BANK_TRANSFER');
  const [earlyPayoutBankAcc, setEarlyPayoutBankAcc] = useState('');
  const [earlyPayoutRef, setEarlyPayoutRef] = useState('');
  const [earlyPayoutNotes, setEarlyPayoutNotes] = useState('');

  // Form states - PENJUALAN TIKET AGENT
  const [agentSpjLegId, setAgentSpjLegId] = useState('');
  const [agentId, setAgentId] = useState('');
  const [agentSeatClassId, setAgentSeatClassId] = useState('');
  const [agentTicketCount, setAgentTicketCount] = useState<number>(5);
  const [agentTicketPrice, setAgentTicketPrice] = useState<string>('250000');
  const [agentCommissionAmount, setAgentCommissionAmount] = useState<string>('100000');
  const [agentSettlementType, setAgentSettlementType] = useState<AgentSettlementType>('CASH_TO_CREW');
  const [agentBankAccId, setAgentBankAccId] = useState('');
  const [agentManifestRef, setAgentManifestRef] = useState('');
  const [agentNotes, setAgentNotes] = useState('');

  // Form states - Uang Perpal Kru (Menginap di Terminal / Luar Kota)
  const [perpalModalOpen, setPerpalModalOpen] = useState(false);
  const [perpalTerminal, setPerpalTerminal] = useState('Terminal Giwangan Yogyakarta');
  const [perpalDays, setPerpalDays] = useState(1);
  const [perpalRatePerDay, setPerpalRatePerDay] = useState('100.000');
  const [perpalTiming, setPerpalTiming] = useState<'AT_SETTLEMENT' | 'EARLY_DISBURSEMENT'>('AT_SETTLEMENT');
  const [perpalSelectedCrew, setPerpalSelectedCrew] = useState<string[]>([]);
  const [perpalNotes, setPerpalNotes] = useState('');

  // Form states - Bonus Full Seat Kru (Okupansi 100%)
  const [fullSeatModalOpen, setFullSeatModalOpen] = useState(false);
  const [fullSeatBonusRate, setFullSeatBonusRate] = useState('150.000');
  const [fullSeatSelectedCrew, setFullSeatSelectedCrew] = useState<string[]>([]);
  const [fullSeatNotes, setFullSeatNotes] = useState('');

  const togglePerpalCrew = (assignmentId: string) => {
    setPerpalSelectedCrew((prev) =>
      prev.includes(assignmentId)
        ? prev.filter((id) => id !== assignmentId)
        : [...prev, assignmentId],
    );
  };

  const toggleFullSeatCrew = (assignmentId: string) => {
    setFullSeatSelectedCrew((prev) =>
      prev.includes(assignmentId)
        ? prev.filter((id) => id !== assignmentId)
        : [...prev, assignmentId],
    );
  };

  // Helper formatting ribuan dengan titik pada input
  const formatNumberWithDots = (val: string | number) => {
    if (!val && val !== 0) return '';
    const clean = String(val).replace(/\D/g, '');
    if (!clean) return '';
    return new Intl.NumberFormat('id-ID').format(Number(clean));
  };

  const cleanDots = (val: string) => String(val || '').replace(/\./g, '');

  const formatRupiah = (val: string | number | undefined | null) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(val || 0));
  };

  useEffect(() => {
    if (id) {
      loadInitialData();
    }
  }, [id]);

  const loadInitialData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const spjRes = await SpjService.getSpj(id);
      setSpj(spjRes);

      await Promise.all([
        loadFinanceData(id),
        loadAccounts(id),
        loadAgentsAndSeatClasses(spjRes),
      ]);
    } catch {
      toast.error('Gagal memuat rincian SPJ.');
    } finally {
      setLoading(false);
    }
  };

  const loadFinanceData = async (spjId?: string) => {
    const targetId = spjId || id;
    if (!targetId) return;
    try {
      const [
        ujData,
        expensesData,
        revenuesData,
        paymentsData,
        mealData,
        coorData,
        mealRecordsData,
        restsData,
      ] = await Promise.all([
        SpjFinanceService.getUj(targetId).catch(() => null),
        SpjFinanceService.getExpenses(targetId).catch(() => []),
        SpjFinanceService.getRevenues(targetId).catch(() => []),
        SpjFinanceService.getCrewPayments(targetId).catch(() => []),
        SpjFinanceService.getMealService(targetId).catch(() => null),
        CoordinationFeeService.getSpjFees(targetId).catch(() => []),
        RestaurantSettlementService.getSpjMealRecords(targetId).catch(() => []),
        RestaurantSettlementService.getRestaurants().catch(() => []),
      ]);
      setUj(ujData);
      setExpenses(expensesData || []);
      setRevenues(revenuesData || []);
      setCrewPayments(paymentsData || []);
      setMealServiceData(mealData);
      setCoordinationFees(coorData || []);
      setSpjMealRecords(mealRecordsData || []);
      setRestaurantsList(restsData || []);
      if (restsData && restsData.length > 0 && !selectedMealRestaurantId) {
        setSelectedMealRestaurantId(restsData[0].id);
      }
    } catch {
      toast.error('Gagal memuat pembukuan keuangan SPJ.');
    }
  };

  const handleSyncCoordinationFees = async () => {
    if (!id) return;
    try {
      await CoordinationFeeService.syncSpjFee(id);
      toast.success('Uang koordinasi lapangan SPJ berhasil disinkronkan & diakrualkan!');
      loadFinanceData(id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyinkronkan uang koordinasi.');
    }
  };

  const handleDeleteCoordinationFee = async (feeId: string) => {
    try {
      await CoordinationFeeService.deleteFee(feeId);
      toast.success('Uang koordinasi dan jurnal akrual berhasil dibatalkan!');
      loadFinanceData(id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus uang koordinasi.');
    }
  };

  const loadAccounts = async (currentSpjId: string) => {
    try {
      const [cashRes, bankRes, spjsRes] = await Promise.all([
        CashBankService.findAllCashAccounts({ includeInactive: false }),
        CashBankService.findAllBankAccounts({ includeInactive: false }),
        SpjService.getSpjs({ limit: 50 }),
      ]);
      setCashAccounts(cashRes.data || []);
      setBankAccounts(bankRes.data || []);
      setAvailableSpjs(spjsRes.data?.filter((s) => s.id !== currentSpjId) || []);
    } catch {
      // silent fallback
    }
  };

  const filterAgentsByRoute = (selectedLeg: any, allList: Agent[], useLeg: boolean) => {
    if (!useLeg || !selectedLeg) {
      return allList;
    }

    const orig = (selectedLeg.origin || '').trim().toUpperCase();
    const isWestOrigin =
      orig.includes('JAKARTA') ||
      orig.includes('TANGERANG') ||
      orig.includes('CIPUTAT') ||
      orig.includes('REMPOA') ||
      orig.includes('BOGOR') ||
      orig.includes('BEKASI') ||
      orig.includes('DEPOK') ||
      orig.includes('BANTEN') ||
      orig.includes('SERANG') ||
      orig.includes('CILEGON') ||
      orig.includes('LEBAK BULUS') ||
      orig.includes('PULO GEBANG') ||
      orig.includes('PORIS');

    const isEastOrigin =
      orig.includes('YOGYAKARTA') ||
      orig.includes('JOGJA') ||
      orig.includes('SLEMAN') ||
      orig.includes('BANTUL') ||
      orig.includes('WATES') ||
      orig.includes('KULON PROGO') ||
      orig.includes('KLATEN') ||
      orig.includes('SOLO') ||
      orig.includes('SURAKARTA') ||
      orig.includes('SUKOHARJO') ||
      orig.includes('WONOGIRI') ||
      orig.includes('MAGELANG') ||
      orig.includes('MUNTILAN') ||
      orig.includes('SURABAYA') ||
      orig.includes('GIWANGAN') ||
      orig.includes('JOMBOR');

    return allList.filter((a) => {
      if (a.agentType === 'ONLINE_OTA' || a.city === 'ALL') return true;
      if (isWestOrigin) {
        return ['JAKARTA', 'TANGERANG', 'SOUTH TANGERANG', 'BOGOR', 'BEKASI', 'DEPOK', 'SERANG', 'CILEGON'].includes(a.city.toUpperCase());
      }
      if (isEastOrigin) {
        return ['YOGYAKARTA', 'SLEMAN', 'BANTUL', 'KULON PROGO', 'KLATEN', 'SOLO', 'SURAKARTA', 'MAGELANG', 'SUKOHARJO', 'WONOGIRI', 'SURABAYA'].includes(a.city.toUpperCase());
      }
      return true;
    });
  };

  const loadAgentsAndSeatClasses = async (currentSpj: Spj) => {
    try {
      const allRes = await AgentService.findAll({ isActive: true });
      const rawAgents = allRes.data || [];
      setAllAgents(rawAgents);

      const defaultLeg = currentSpj.legs?.[0];
      const defaultLegId = defaultLeg?.id || '';
      if (!agentSpjLegId && defaultLegId) {
        setAgentSpjLegId(defaultLegId);
      }

      const filtered = filterAgentsByRoute(defaultLeg, rawAgents, true);
      setFilteredAgents(filtered);

      if (filtered.length > 0 && !agentId) {
        setAgentId(filtered[0].id);
        if (filtered[0].settlementType) {
          setAgentSettlementType(filtered[0].settlementType);
        }
      }

      const scRes = await VehicleService.getSeatClasses();
      setSeatClasses(scRes.data || []);

      if (scRes.data?.length > 0 && !agentSeatClassId) {
        setAgentSeatClassId(scRes.data[0].id);
      }
    } catch {
      // silent fallback
    }
  };

  const handleLegChange = (legId: string) => {
    setAgentSpjLegId(legId);
    const targetLeg = spj?.legs?.find((l) => l.id === legId) || spj?.legs?.[0];
    const filtered = filterAgentsByRoute(targetLeg, allAgents, filterByLeg);
    setFilteredAgents(filtered);

    // Jika agen yang sedang terpilih tidak ada di list leg ini, pilih otomatis agen pertama yang cocok
    if (filtered.length > 0 && !filtered.some((a) => a.id === agentId)) {
      handleAgentOrSeatClassChange(filtered[0].id, agentSeatClassId, agentTicketCount, agentTicketPrice);
    }
  };

  const handleToggleFilterByLeg = (enabled: boolean) => {
    setFilterByLeg(enabled);
    const targetLeg = spj?.legs?.find((l) => l.id === agentSpjLegId) || spj?.legs?.[0];
    const filtered = filterAgentsByRoute(targetLeg, allAgents, enabled);
    setFilteredAgents(filtered);

    if (filtered.length > 0 && !filtered.some((a) => a.id === agentId)) {
      handleAgentOrSeatClassChange(filtered[0].id, agentSeatClassId, agentTicketCount, agentTicketPrice);
    }
  };

  const handleRefresh = async () => {
    if (!id) return;
    setRefreshing(true);
    try {
      const spjRes = await SpjService.getSpj(id);
      setSpj(spjRes);
      await loadFinanceData(id);
      toast.success('Data keuangan SPJ berhasil diperbarui.');
    } catch {
      toast.error('Gagal menyinkronkan data keuangan.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleAgentOrSeatClassChange = async (newAgentId: string, newSeatClassId: string, count: number, price: string) => {
    setAgentId(newAgentId);
    setAgentSeatClassId(newSeatClassId);

    const selAgent = allAgents.find((a) => a.id === newAgentId) || filteredAgents.find((a) => a.id === newAgentId);
    if (selAgent?.settlementType) {
      setAgentSettlementType(selAgent.settlementType);
    }

    if (!newAgentId || !price) return;

    try {
      const numPrice = Number(cleanDots(price)) || 250000;
      const res = await AgentService.calculateCommission({
        agentId: newAgentId,
        seatClassId: newSeatClassId === 'ALL' ? undefined : newSeatClassId,
        ticketPrice: numPrice,
      });

      if (res.data) {
        const commPerTicket = res.data.calculatedCommission || 20000;
        const totalComm = commPerTicket * (count || 1);
        setAgentCommissionAmount(String(totalComm));
      }
    } catch {
      const fallbackComm = 20000 * (count || 1);
      setAgentCommissionAmount(String(fallbackComm));
    }
  };

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------

  const handleDisburseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const cleanAmount = cleanDots(disburseAmount);
    if (!cleanAmount || Number(cleanAmount) <= 0) {
      toast.error('Masukkan nominal pencairan UJ yang valid.');
      return;
    }
    if (disburseMethod === 'CASH' && !disburseCashAcc) {
      toast.error('Pilih akun kas sumber pencairan.');
      return;
    }
    if (disburseMethod === 'BANK_TRANSFER' && !disburseBankAcc) {
      toast.error('Pilih rekening bank sumber pencairan.');
      return;
    }
    setConfirmDisburseOpen(true);
  };

  const executeDisburse = async () => {
    if (!id) return;
    setDisburseLoading(true);
    try {
      await SpjFinanceService.disburseUj(id, {
        amount: cleanDots(disburseAmount),
        paymentMethod: disburseMethod,
        cashAccountId: disburseMethod === 'CASH' ? disburseCashAcc : undefined,
        bankAccountId: disburseMethod === 'BANK_TRANSFER' ? disburseBankAcc : undefined,
        receiptRef: disburseRef,
        notes: disburseNotes,
      });
      toast.success('Pencairan dana UJ berhasil dicatat & jurnal GL telah terposting!');
      setConfirmDisburseOpen(false);
      setDisburseOpen(false);
      setDisburseAmount('');
      setDisburseRef('');
      setDisburseNotes('');
      loadFinanceData(id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mencairkan UJ.');
    } finally {
      setDisburseLoading(false);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await SpjFinanceService.returnUj(id, {
        amount: cleanDots(returnAmount),
        paymentMethod: returnMethod,
        cashAccountId: returnMethod === 'CASH' ? returnCashAcc : undefined,
        bankAccountId: returnMethod === 'BANK_TRANSFER' ? returnBankAcc : undefined,
        receiptRef: returnRef,
        notes: returnNotes,
      });
      toast.success('Pengembalian sisa UJ berhasil dicatat!');
      setReturnOpen(false);
      setReturnAmount('');
      setReturnRef('');
      setReturnNotes('');
      loadFinanceData(id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mencatat pengembalian.');
    }
  };

  const handleAdditionalReqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await SpjFinanceService.requestAdditionalUj(id, {
        amount: cleanDots(addReqAmount),
        reason: addReqReason,
      });
      toast.success('Permintaan tambahan UJ berhasil diajukan!');
      setAdditionalReqOpen(false);
      setAddReqAmount('');
      setAddReqReason('');
      loadFinanceData(id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengajukan tambahan UJ.');
    }
  };

  const handleProcessAddReq = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await SpjFinanceService.processAdditionalRequest(requestId, {
        status,
        rejectionReason: status === 'REJECTED' ? 'Tidak disetujui oleh manajemen' : undefined,
      });
      toast.success(`Pengajuan tambahan UJ berhasil di-${status.toLowerCase()}!`);
      if (id) loadFinanceData(id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memproses pengajuan tambahan.');
    }
  };

  const handleRolloverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !rolloverTargetSpj) return;
    try {
      await SpjFinanceService.rolloverUj(id, {
        targetSpjId: rolloverTargetSpj,
        amount: cleanDots(rolloverAmount),
        notes: rolloverNotes,
      });
      toast.success('Sisa saldo UJ berhasil diestafetkan ke SPJ armada pengganti!');
      setRolloverOpen(false);
      setRolloverAmount('');
      setRolloverTargetSpj('');
      loadFinanceData(id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal melakukan estafet UJ.');
    }
  };

  const handleCreateExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await SpjFinanceService.createExpense(id, {
        expenseType: expType,
        amount: cleanDots(expAmount),
        paymentSource: expSource,
        fuelLiters: expType === 'FUEL' ? expFuelLiters : undefined,
        odometerKm: expType === 'FUEL' && expOdometer ? Number(expOdometer) : undefined,
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
      loadFinanceData(id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mencatat pengeluaran SPJ.');
    }
  };

  const handleVerifyExpense = async (expenseId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await SpjFinanceService.verifyExpense(expenseId, status);
      toast.success(`Pengeluaran berhasil di-${status === 'APPROVED' ? 'verifikasi' : 'tolak'}!`);
      if (id) loadFinanceData(id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui status nota.');
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await SpjFinanceService.deleteExpense(expenseId);
      toast.success('Pengeluaran berhasil dihapus.');
      if (id) loadFinanceData(id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus pengeluaran.');
    }
  };

  const handleCreateRevenueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      const isCargo = revType === 'CARGO_MOTORCYCLE' || revType === 'CARGO_BOX';
      await SpjFinanceService.createRevenue(id, {
        declarationType: revType,
        amount: cleanDots(revAmount),
        sourceReference: revRef,
        crewCommissionPercentage: isCargo ? revCargoCommissionPct : '0.00',
        crewCommissionAmount: isCargo ? cleanDots(revCargoCommissionAmount) : '0.00',
        recipientCrewAssignmentId: isCargo && revRecipientCrewAssignmentId ? revRecipientCrewAssignmentId : undefined,
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
      loadFinanceData(id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mencatat deklarasi penerimaan.');
    }
  };

  // PROSES PENJUALAN TIKET AGENT DENGAN AUTO-JURNAL
  const handleExecuteSaveAgentTicket = async () => {
    if (!id || !agentId) {
      toast.error('Harap pilih Mitra Agen Penjual Tiket.');
      return;
    }
    const cleanPrice = cleanDots(agentTicketPrice);
    const count = Number(agentTicketCount) || 1;
    const grossTotal = String(Number(cleanPrice) * count);

    try {
      await SpjFinanceService.createRevenue(id, {
        declarationType: 'TICKET_AGENT' as SpjRevenueDeclarationType,
        amount: grossTotal,
        agentId,
        seatClassId: agentSeatClassId || undefined,
        ticketCount: count,
        ticketPrice: cleanPrice,
        agentCommissionAmount: cleanDots(agentCommissionAmount),
        settlementType: agentSettlementType,
        bankAccountId: agentSettlementType === 'BANK_TRANSFER' ? agentBankAccId : undefined,
        sourceReference: agentManifestRef || `MNF-AGT-${count}PAX`,
        notes: agentNotes || `Penjualan ${count} tiket oleh agen`,
      });

      toast.success('Penjualan tiket agen berhasil disimpan & jurnal otomatis terbentuk!');
      setJournalPreviewModalOpen(false);
      setAgentTicketModalOpen(false);
      loadFinanceData(id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan penjualan tiket agen.');
    }
  };

  const handleVerifyRevenue = async (revenueId: string, status: 'VERIFIED' | 'DISCREPANCY') => {
    try {
      await SpjFinanceService.verifyRevenue(revenueId, status);
      toast.success('Status verifikasi penerimaan berhasil diperbarui!');
      if (id) loadFinanceData(id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memverifikasi penerimaan.');
    }
  };

  const handleDeleteRevenue = async (revenueId: string) => {
    try {
      await SpjFinanceService.deleteRevenue(revenueId);
      toast.success('Deklarasi penerimaan berhasil dihapus.');
      if (id) loadFinanceData(id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus deklarasi.');
    }
  };

  const handleSyncCrewPayments = async () => {
    if (!id) return;
    try {
      await SpjFinanceService.syncCrewPayments(id);
      toast.success('Hak kompensasi kru berhasil disinkronkan dari snapshot penugasan!');
      loadFinanceData(id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyinkronkan hak kompensasi.');
    }
  };

  const handleSavePerpal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (perpalSelectedCrew.length === 0) {
      toast.error('Pilih minimal satu personil kru yang menerima uang perpal.');
      return;
    }

    try {
      await SpjFinanceService.addPerpalPayment(id, {
        crewAssignmentIds: perpalSelectedCrew,
        terminalLocation: perpalTerminal,
        daysCount: Number(perpalDays) || 1,
        amountPerPersonPerDay: cleanDots(perpalRatePerDay),
        payoutTiming: perpalTiming,
        notes: perpalNotes,
      });
      toast.success('Uang perpal kru berhasil dicatat!');
      setPerpalModalOpen(false);
      setPerpalNotes('');
      loadFinanceData(id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mencatat uang perpal.');
    }
  };

  const handleSaveFullSeatBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (fullSeatSelectedCrew.length === 0) {
      toast.error('Pilih minimal satu personil kru yang menerima bonus full seat.');
      return;
    }

    try {
      await SpjFinanceService.claimFullSeatBonus(id, {
        crewAssignmentIds: fullSeatSelectedCrew,
        bonusAmountPerPerson: cleanDots(fullSeatBonusRate),
        notes: fullSeatNotes,
      });
      toast.success('Bonus full seat kru berhasil dicatat!');
      setFullSeatModalOpen(false);
      setFullSeatNotes('');
      loadFinanceData(id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mencatat bonus full seat.');
    }
  };

  const handleEarlyPayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment || !id) return;
    try {
      await SpjFinanceService.disburseEarlyPayment(selectedPayment.id, {
        paymentMethod: earlyPayoutMethod,
        bankAccountId: earlyPayoutMethod === 'BANK_TRANSFER' ? earlyPayoutBankAcc : undefined,
        receiptRef: earlyPayoutRef,
        notes: earlyPayoutNotes,
      });
      toast.success('Pencairan kompensasi di muka (Early Payout) berhasil dicatat!');
      setEarlyPayoutOpen(false);
      setSelectedPayment(null);
      setEarlyPayoutRef('');
      setEarlyPayoutNotes('');
      loadFinanceData(id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mencairkan kompensasi di muka.');
    }
  };

  const handleSaveMealCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedLegForMeal) return;

    if (!selectedMealRestaurantId) {
      toast.error('Pilih Rumah Makan Mitra tempat bus singgah.');
      return;
    }

    try {
      await RestaurantSettlementService.recordSpjMeal(id, {
        restaurantId: selectedMealRestaurantId,
        spjLegId: selectedLegForMeal.id,
        actualPax: Number(inputMealPaxCount),
        ratePerPax: cleanDots(inputMealRatePerPax),
        discrepancyNotes: inputMealDiscrepancyNotes,
      });
      toast.success('Kupon servis makan penumpang & akrual beban 51102 berhasil dicatat!');
      setMealCouponModalOpen(false);
      loadFinanceData(id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan kupon servis makan.');
    }
  };

  const handleDeleteMealRecord = async (recordId: string) => {
    try {
      await RestaurantSettlementService.deleteMealRecord(recordId);
      toast.success('Catatan kupon makan dan jurnal akrual berhasil dibatalkan!');
      loadFinanceData(id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus kupon makan.');
    }
  };

  // Kalkulasi Total Finansial untuk KPI & Header Sub-bagian
  const isWisata = spj?.serviceType === 'WISATA';
  const totalRevenuesGross = revenues.reduce((acc, r) => acc + Number(r.amount || 0), 0);
  const totalTicketsSold = revenues.reduce((acc, r) => acc + Number(r.ticketCount || 0), 0);
  const totalAgentCommissions = revenues.reduce((acc, r) => acc + Number(r.agentCommissionAmount || 0), 0);
  const cargoDeclarations = revenues.filter((r) => r.declarationType?.includes('CARGO'));
  const totalCargoAmount = cargoDeclarations.reduce((acc, r) => acc + Number(r.amount || 0), 0);

  const totalExpensesAmount = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const totalFuelLiters = expenses
    .filter((e) => e.expenseType === 'FUEL')
    .reduce((acc, e) => acc + Number(e.fuelLiters || 0), 0);

  const totalManifestPax = spj?.legs?.reduce((acc, l) => acc + (l.passengerCount || 0), 0) || 0;
  const totalMealCoupons =
    spjMealRecords.length > 0
      ? spjMealRecords.reduce((acc, r) => acc + (r.actualPax || 0), 0)
      : spj?.legs?.reduce((acc, l) => acc + (l.mealPaxCount !== undefined ? l.mealPaxCount : (l.passengerCount || 0)), 0) || 0;
  const totalEstimatedMealCost =
    spjMealRecords.length > 0
      ? spjMealRecords.reduce((acc, r) => acc + Number(r.totalAmount || 0), 0)
      : totalMealCoupons * 25000;

  const totalCrewComp = crewPayments.reduce((acc, c) => acc + Number(c.amount || 0), 0);
  const totalCrewPaid = crewPayments.filter((c) => c.status === 'PAID').reduce((acc, c) => acc + Number(c.amount || 0), 0);
  const totalCrewPending = crewPayments.filter((c) => c.status !== 'PAID').reduce((acc, c) => acc + Number(c.amount || 0), 0);

  const totalCoordinationFee = coordinationFees.reduce((acc, f) => acc + Number(f.totalFee || 0), 0);
  const totalCoordinationTickets = coordinationFees.reduce((acc, f) => acc + (f.ticketCount || 0), 0);

  const selectedAgentObj = allAgents.find((a) => a.id === agentId) || filteredAgents.find((a) => a.id === agentId);
  const selectedSeatClassObj = seatClasses.find((s) => s.id === agentSeatClassId);
  const calculatedGrossTicketTotal = (Number(cleanDots(agentTicketPrice)) || 0) * (Number(agentTicketCount) || 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">Memuat seluruh pembukuan keuangan SPJ...</p>
      </div>
    );
  }

  if (!spj) {
    return (
      <div className="text-center py-20 space-y-4">
        <h3 className="text-lg font-bold text-foreground">Dokumen SPJ Tidak Ditemukan</h3>
        <Button onClick={() => navigate('/spjs')}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Kembali ke Daftar SPJ
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 w-full">
      {/* ========================================================= */}
      {/* HEADER UTAMA: BREADCRUMB, SPJ INFO, STATUS, & QUICK ACTIONS */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/spjs')}
              className="h-8 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground gap-1.5 border-slate-300 dark:border-zinc-700 shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Daftar SPJ
            </Button>
            <Badge variant="outline" className="text-xs font-mono font-semibold">
              {spj.serviceType}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Wallet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              Keuangan Operasional SPJ: {spj.spjNo}
            </h1>
            <div className="flex items-center gap-1.5">
              <Badge
                variant={
                  spj.operationalStatus === 'COMPLETED'
                    ? 'default'
                    : spj.operationalStatus === 'IN_PROGRESS'
                      ? 'secondary'
                      : 'outline'
                }
                className="font-mono text-xs px-2.5 py-0.5"
              >
                Ops: {spj.operationalStatus}
              </Badge>
              <Badge
                variant={
                  spj.financialStatus === 'SETTLED'
                    ? 'default'
                    : spj.financialStatus === 'DISCREPANCY'
                      ? 'destructive'
                      : 'secondary'
                }
                className="font-mono text-xs px-2.5 py-0.5 font-bold"
              >
                Fin: {spj.financialStatus}
              </Badge>
            </div>
          </div>

          <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
            <span>
              Armada: <strong>{spj.vehicle?.code}</strong> ({spj.vehicle?.plateNumber})
            </span>
            <span>•</span>
            <span>
              Driver 1: <strong>{spj.crewAssignments?.[0]?.crew?.name || 'Supir 1'}</strong>
            </span>
            <span>•</span>
            <span>
              Rute: {spj.legs?.[0]?.origin || 'Jakarta'} ➔ {spj.legs?.[0]?.destination || 'Yogyakarta'}
            </span>
          </p>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-9 text-xs font-medium px-3.5 gap-1.5 border-slate-300 dark:border-zinc-700 shadow-2xs hover:bg-slate-100 dark:hover:bg-zinc-800"
          >
            <RefreshCw className={refreshing ? 'w-3.5 h-3.5 animate-spin' : 'w-3.5 h-3.5 text-muted-foreground'} />
            Sinkronkan Data
          </Button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5 KARTU METRIK RINGKASAN KEANGAN (CLEAN GLASSMORPHISM) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
        <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-emerald-600">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs font-medium">Total UJ Dicairkan</CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
              <span>{formatRupiah(uj?.totalDisbursed)}</span>
              <CircleDollarSign className="w-4 h-4 opacity-40 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-[11px] text-muted-foreground">{uj?.disbursements?.length || 0} kali pencairan kasir</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-amber-600">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs font-medium">Terpakai di Jalan</CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 flex items-center justify-between">
              <span>{formatRupiah(uj?.totalSpent)}</span>
              <TrendingDown className="w-4 h-4 opacity-40 text-amber-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-[11px] text-muted-foreground">{expenses.length} nota BBM &amp; tol</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-blue-600">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs font-medium">Sisa Saldo UJ Kru</CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 flex items-center justify-between">
              <span>{formatRupiah(uj?.balance)}</span>
              <Wallet className="w-4 h-4 opacity-40 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-[11px] text-muted-foreground">Wajib kembali ke kasir</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-indigo-600">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs font-medium">Bruto Tiket &amp; Kargo</CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
              <span>{formatRupiah(totalRevenuesGross)}</span>
              <Coins className="w-4 h-4 opacity-40 text-indigo-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-[11px] text-muted-foreground">{revenues.length} transaksi deklarasi</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-purple-600 col-span-2 md:col-span-1">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs font-medium">Hak Kompensasi Kru</CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400 flex items-center justify-between">
              <span>{formatRupiah(totalCrewComp)}</span>
              <CreditCard className="w-4 h-4 opacity-40 text-purple-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-[11px] text-muted-foreground">{crewPayments.length} baris hak kru</p>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================= */}
      {/* 1 CARD INDUK UTAMA: DOKUMEN PEMBUKUAN LENGKAP SPJ (FULL WIDTH) */}
      {/* ========================================================= */}
      <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs rounded-2xl overflow-hidden w-full">
        {/* Card Header Induk */}
        <CardHeader className="p-5 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-zinc-900/40">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Rincian Pembukuan Operasional &amp; Keuangan SPJ
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Dokumen tunggal pertanggungjawaban modal jalan, pengeluaran operasional, pendapatan kotor tiket agen &amp; kargo, serta hak kompensasi kru.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-mono">
                Ops: <strong className="ml-1 text-foreground">{spj.operationalStatus}</strong>
              </Badge>
              <Badge
                variant={
                  spj.financialStatus === 'SETTLED'
                    ? 'default'
                    : spj.financialStatus === 'DISCREPANCY'
                      ? 'destructive'
                      : 'secondary'
                }
                className="text-xs font-mono font-bold"
              >
                Fin: {spj.financialStatus}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-8 divide-y divide-slate-200/70 dark:divide-white/10">
          {/* ======================================================= */}
          {/* BAGIAN 1: UANG JALAN (UJ) & PENCAIRAN BERTAHAP          */}
          {/* ======================================================= */}
          <div className="space-y-4 pt-1 first:pt-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Wallet className="w-4 h-4" />
                    </span>
                    1. Amplop Uang Jalan (UJ) &amp; Pengembalian Kasir
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="font-mono text-[11px] bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800">
                      Dicairkan: {formatRupiah(uj?.totalDisbursed)}
                    </Badge>
                    <Badge variant="outline" className="font-mono text-[11px] bg-amber-50/70 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800">
                      Terpakai: {formatRupiah(uj?.totalSpent)}
                    </Badge>
                    <Badge variant="outline" className="font-mono text-[11px] bg-blue-50/70 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800 font-bold">
                      Sisa Saldo: {formatRupiah(uj?.balance)}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Pencairan kasir garasi, pengembalian fisik sisa supir, permintaan tambahan di tol, dan estafet rollover armada bus (Skenario 3).
                </p>
              </div>

              {/* Action Buttons Bagian 1 */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    if (!canDisburseUj) {
                      toast.error('Akses ditolak: Anda tidak memiliki wewenang untuk mencairkan UJ (memerlukan izin SPJ:disburse_uj).');
                      return;
                    }
                    setDisburseOpen(true);
                  }}
                  disabled={!canDisburseUj}
                  title={!canDisburseUj ? 'Anda tidak memiliki hak otorisasi untuk mencairkan UJ (memerlukan izin disburse_uj)' : 'Cairkan uang jalan operasional'}
                  className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Cairkan UJ
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReturnAmount(formatNumberWithDots(uj?.balance ? String(uj.balance) : '0'));
                    setReturnOpen(true);
                  }}
                  className="h-8 text-xs font-medium border-slate-300 dark:border-zinc-700 gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" /> Kembalikan Sisa
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAdditionalReqOpen(true)}
                  className="h-8 text-xs font-medium border-slate-300 dark:border-zinc-700 gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-muted-foreground" /> Minta Tambahan UJ
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setRolloverAmount(formatNumberWithDots(uj?.balance ? String(uj.balance) : '0'));
                    setRolloverOpen(true);
                  }}
                  className="h-8 text-xs font-medium text-destructive border-destructive/30 hover:bg-destructive/10 gap-1.5"
                  title="Estafet UJ saat penggantian armada bus di tol (Skenario 3)"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" /> Estafet Rollover
                </Button>
              </div>
            </div>

            {/* Riwayat Pencairan Bertahap & Pengembalian */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Riwayat Pencairan Bertahap */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Riwayat Pencairan UJ (Disbursements)</span>
                  <span className="font-mono text-foreground font-semibold">{formatRupiah(uj?.totalDisbursed)}</span>
                </h4>
                <div className="border border-slate-200/80 dark:border-white/10 rounded-xl overflow-hidden bg-background">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-zinc-900/60">
                      <TableRow>
                        <TableHead className="text-xs font-semibold">Waktu</TableHead>
                        <TableHead className="text-xs font-semibold">Metode / Akun</TableHead>
                        <TableHead className="text-xs font-semibold">Ref BKK</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Nominal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!uj?.disbursements || uj.disbursements.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6 text-xs text-muted-foreground">
                            Belum ada pencairan dana UJ. Klik 'Cairkan UJ'.
                          </TableCell>
                        </TableRow>
                      ) : (
                        uj.disbursements.map((d) => (
                          <TableRow key={d.id} className="hover:bg-muted/20">
                            <TableCell className="text-xs font-mono">{new Date(d.disbursedAt).toLocaleDateString('id-ID')}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {d.paymentMethod === 'CASH'
                                ? `Tunai (${d.cashAccount?.name || 'Kas Pool'})`
                                : `Bank (${d.bankAccount?.bankName || 'Transfer'})`}
                            </TableCell>
                            <TableCell className="text-xs font-mono text-muted-foreground">{d.receiptRef || '-'}</TableCell>
                            <TableCell className="text-xs font-mono font-bold text-right text-foreground">{formatRupiah(d.amount)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Riwayat Pengembalian Sisa UJ */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Riwayat Pengembalian Fisik UJ (Returns)</span>
                  <span className="font-mono text-foreground font-semibold">{formatRupiah(uj?.totalReturned)}</span>
                </h4>
                <div className="border border-slate-200/80 dark:border-white/10 rounded-xl overflow-hidden bg-background">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-zinc-900/60">
                      <TableRow>
                        <TableHead className="text-xs font-semibold">Waktu Terima</TableHead>
                        <TableHead className="text-xs font-semibold">Metode</TableHead>
                        <TableHead className="text-xs font-semibold">Ref BKM</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Nominal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!uj?.returns || uj.returns.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6 text-xs text-muted-foreground">
                            Belum ada pengembalian sisa UJ dari supir.
                          </TableCell>
                        </TableRow>
                      ) : (
                        uj.returns.map((r) => (
                          <TableRow key={r.id} className="hover:bg-muted/20">
                            <TableCell className="text-xs font-mono">{new Date(r.returnedAt).toLocaleDateString('id-ID')}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{r.paymentMethod}</TableCell>
                            <TableCell className="text-xs font-mono text-muted-foreground">{r.receiptRef || '-'}</TableCell>
                            <TableCell className="text-xs font-mono font-bold text-right text-foreground">{formatRupiah(r.amount)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Pengajuan Tambahan UJ di Jalan (Jika Ada) */}
            {uj?.additionalRequests && uj.additionalRequests.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Permintaan Tambahan UJ di Tengah Perjalanan
                </h4>
                <div className="border border-slate-200/80 dark:border-white/10 rounded-xl overflow-hidden bg-background">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-zinc-900/60">
                      <TableRow>
                        <TableHead className="text-xs font-semibold">Waktu</TableHead>
                        <TableHead className="text-xs font-semibold">Alasan Permintaan</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Nominal</TableHead>
                        <TableHead className="text-xs font-semibold">Status</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Aksi Kasir</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uj.additionalRequests.map((req) => (
                        <TableRow key={req.id} className="hover:bg-muted/20">
                          <TableCell className="text-xs font-mono">{new Date(req.createdAt).toLocaleString('id-ID')}</TableCell>
                          <TableCell className="text-xs">{req.reason}</TableCell>
                          <TableCell className="text-xs font-mono font-bold text-right text-foreground">{formatRupiah(req.amount)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                req.status === 'APPROVED' ? 'default' : req.status === 'REJECTED' ? 'destructive' : 'secondary'
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
                                  onClick={() => handleProcessAddReq(req.id, 'APPROVED')}
                                  className="h-7 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  Setujui &amp; Transfer
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleProcessAddReq(req.id, 'REJECTED')}
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
          </div>

          {/* ======================================================= */}
          {/* BAGIAN 2: PENGELUARAN OPERASIONAL SPJ (EXPENSES)        */}
          {/* ======================================================= */}
          <div className="space-y-4 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Receipt className="w-4 h-4" />
                    </span>
                    2. Biaya Operasional SPJ
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="font-mono text-[11px] bg-amber-50/70 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-bold">
                      Total Biaya: {formatRupiah(totalExpensesAmount)}
                    </Badge>
                    <Badge variant="outline" className="text-[11px] text-muted-foreground">
                      {expenses.length} Nota
                    </Badge>
                    {totalFuelLiters > 0 && (
                      <Badge variant="outline" className="font-mono text-[11px] bg-blue-50/70 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800">
                        ⛽ Solar: {totalFuelLiters} L
                      </Badge>
                    )}
                    {totalCoordinationFee > 0 && (
                      <Badge variant="outline" className="font-mono text-[11px] bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800 font-semibold">
                        🤝 Koordinasi: {formatRupiah(totalCoordinationFee)} ({totalCoordinationTickets} Pax)
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Seluruh bukti sah nota fisik BBM solar (liter + odometer), tol Trans-Jawa, retribusi terminal, dan servis makan.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setExpenseFormOpen(true)}
                className="h-8 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Catat Pengeluaran
              </Button>
            </div>

            <div className="border border-slate-200/80 dark:border-white/10 rounded-xl overflow-hidden bg-background">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-zinc-900/60">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Tanggal</TableHead>
                    <TableHead className="text-xs font-semibold">Kategori</TableHead>
                    <TableHead className="text-xs font-semibold">Sumber Dana</TableHead>
                    <TableHead className="text-xs font-semibold">Rincian Nota (BBM / SPBU / Ref)</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Nominal</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                        Belum ada nota pengeluaran operasional yang dicatat pada SPJ ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    expenses.map((exp) => (
                      <TableRow key={exp.id} className="hover:bg-muted/20">
                        <TableCell className="text-xs font-mono">{new Date(exp.expenseDate).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {exp.expenseType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="secondary" className="text-[10px]">
                            {exp.paymentSource}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {exp.expenseType === 'FUEL' ? (
                            <div className="space-y-0.5">
                              <div className="font-semibold flex items-center gap-1 text-foreground">
                                <Fuel className="w-3 h-3 text-muted-foreground" />
                                {exp.fuelLiters} Liter • Odo: {exp.odometerKm || '-'} KM
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {exp.fuelStation || 'SPBU Tol'} • No: {exp.receiptNumber || '-'}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-medium text-foreground">{exp.receiptNumber || 'Tanpa No Struk'}</div>
                              <div className="text-[11px] text-muted-foreground">{exp.notes || '-'}</div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-mono font-bold text-right text-foreground">{formatRupiah(exp.amount)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              exp.status === 'APPROVED' ? 'default' : exp.status === 'REJECTED' ? 'destructive' : 'secondary'
                            }
                            className="text-[10px]"
                          >
                            {exp.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          {exp.status === 'PENDING' && (
                            <Button size="sm" onClick={() => handleVerifyExpense(exp.id, 'APPROVED')} className="h-7 text-[11px] font-semibold">
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
          </div>

          {/* ======================================================= */}
          {/* BAGIAN 3: PENERIMAAN KAS & PENJUALAN TIKET AGEN         */}
          {/* ======================================================= */}
          <div className="space-y-4 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <Coins className="w-4 h-4" />
                    </span>
                    3. Deklarasi Kas &amp; Penjualan Tiket Mitra Agen
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="default" className="font-mono text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                      🎟️ Terjual: {totalTicketsSold} Pax
                    </Badge>
                    <Badge variant="outline" className="font-mono text-[11px] bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800 font-bold">
                      Total Bruto: {formatRupiah(totalRevenuesGross)}
                    </Badge>
                    {totalAgentCommissions > 0 && (
                      <Badge variant="outline" className="font-mono text-[11px] bg-amber-50/70 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800">
                        Komisi: {formatRupiah(totalAgentCommissions)}
                      </Badge>
                    )}
                    {cargoDeclarations.length > 0 && (
                      <Badge variant="outline" className="font-mono text-[11px] text-muted-foreground">
                        📦 {cargoDeclarations.length} Kargo ({formatRupiah(totalCargoAmount)})
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Pencatatan pendapatan tiket agen terminal, online OTA, tiket langsung, serta kargo motor/kardus dengan kepatuhan 100% Bruto.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  disabled={isWisata}
                  onClick={() => {
                    if (filteredAgents.length > 0 && !agentId) {
                      setAgentId(filteredAgents[0].id);
                    }
                    setAgentTicketModalOpen(true);
                  }}
                  className={`h-8 text-xs font-semibold gap-1.5 ${isWisata
                    ? 'bg-muted text-muted-foreground opacity-60 cursor-not-allowed hover:bg-muted'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                    }`}
                  title={isWisata ? 'Khusus Layanan AKAP (Layanan Wisata berbasis kontrak charter rombongan)' : undefined}
                >
                  <Building2 className="w-3.5 h-3.5" /> + Input Tiket Agen
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (isWisata) {
                      setRevType('CHARTER_CASH');
                    }
                    if (spj.crewAssignments && spj.crewAssignments.length > 0 && !revRecipientCrewAssignmentId) {
                      const defaultDriver = spj.crewAssignments.find((c) => c.role === 'DRIVER') || spj.crewAssignments[0];
                      if (defaultDriver) setRevRecipientCrewAssignmentId(defaultDriver.id);
                    }
                    setRevenueFormOpen(true);
                  }}
                  className="h-8 text-xs font-medium border-slate-300 dark:border-zinc-700 gap-1.5"
                >
                  <Coins className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />{' '}
                  {isWisata ? '+ Terima Pelunasan Tunai (Charter)' : '+ Tiket Langsung / Kargo'}
                </Button>
              </div>
            </div>

            {/* Info Anti-Netting & Otomasi Tiket Agen */}
            <div className="p-3.5 bg-slate-50 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-white/10 rounded-xl flex items-start gap-3">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground font-semibold">
                  {isWisata
                    ? 'Standar Pendapatan Layanan Wisata (Kontrak Charter):'
                    : 'Standar Akuntansi Bruto & Komisi Terjadwal (Addendum v1.7 & Skenario 1):'}
                </strong>{' '}
                {isWisata
                  ? 'Pendapatan bus pariwisata diakui secara terpusat dari nilai kontrak sewa paket (Akun 42101) melalui DP 30% dan Pelunasan AR 70%. Kru di lapangan tidak menjual tiket agen atau kargo eceran, namun dapat mencatat penerimaan pelunasan sewa tunai (CHARTER_CASH) jika diserahkan langsung oleh penyewa.'
                  : 'Penjualan tiket agen loket maupun OTA diakui penuh 100% sebagai Pendapatan Tiket (`41101`). Komisi agen diakui sebagai Beban Komisi (`54101`) berpasangan dengan Utang Komisi (`22101`), sehingga hak komisi tidak dipotong di jalan melainkan dibayarkan resmi secara terjadwal oleh tim Finance via transfer bank korporat.'}
              </div>
            </div>

            <div className="border border-slate-200/80 dark:border-white/10 rounded-xl overflow-hidden bg-background">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-zinc-900/60">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Waktu / Resi</TableHead>
                    <TableHead className="text-xs font-semibold">Jenis</TableHead>
                    <TableHead className="text-xs font-semibold">Mitra Agen / Pengirim</TableHead>
                    <TableHead className="text-xs font-semibold">Rincian Tiket / Kuota</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Bruto Kas</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Hak Komisi</TableHead>
                    <TableHead className="text-xs font-semibold">Metode Setoran</TableHead>
                    <TableHead className="text-xs font-semibold">Status Jurnal</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenues.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-xs text-muted-foreground">
                        Belum ada deklarasi tiket agen atau kargo yang dicatat. Klik '+ Input Tiket Agen' di atas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    revenues.map((rev) => (
                      <TableRow key={rev.id} className="hover:bg-muted/20">
                        <TableCell className="text-xs font-mono">
                          <div>{new Date(rev.declaredAt).toLocaleDateString('id-ID')}</div>
                          <div className="text-[11px] text-muted-foreground font-semibold">{rev.sourceReference || '-'}</div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={rev.declarationType === 'TICKET_AGENT' ? 'default' : 'outline'}
                            className="text-[10px] font-mono"
                          >
                            {rev.declarationType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {rev.agent ? (
                            <div>
                              <div className="font-semibold text-foreground flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-muted-foreground" />
                                {rev.agent.name}
                              </div>
                              <div className="text-[11px] text-muted-foreground">{rev.agent.city} • {rev.agent.agentType}</div>
                            </div>
                          ) : rev.cargoSenderName ? (
                            <div>
                              <strong>Dari:</strong> {rev.cargoSenderName} ➔ {rev.cargoReceiverName}
                              <div className="text-[11px] text-muted-foreground">{rev.cargoItemDescription}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">{rev.notes || '-'}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {rev.ticketCount ? (
                            <div>
                              <span className="font-bold text-foreground">{rev.ticketCount} Pax</span>{' '}
                              <span className="text-[11px] text-muted-foreground">@ {formatRupiah(rev.ticketPrice)}</span>
                              {rev.seatClass && <div className="text-[10px] text-muted-foreground">{rev.seatClass.name}</div>}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-mono font-bold text-right text-foreground">{formatRupiah(rev.amount)}</TableCell>
                        <TableCell className="text-xs font-mono font-semibold text-right text-muted-foreground">
                          {Number(rev.agentCommissionAmount) > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400 font-bold">
                              {formatRupiah(rev.agentCommissionAmount)}
                            </span>
                          ) : Number(rev.crewCommissionAmount) > 0 ? (
                            <span>
                              {formatRupiah(rev.crewCommissionAmount)}{' '}
                              <span className="text-[10px] text-muted-foreground">({rev.crewCommissionPercentage}%)</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="secondary" className="text-[10px]">
                            {rev.settlementType || 'CASH_TO_CREW'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {rev.journalId ? (
                            <Badge variant="default" className="text-[10px] bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1 w-fit">
                              <BadgeCheck className="w-3 h-3" /> Terposting
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">
                              {rev.status}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          {rev.status === 'DECLARED' && !rev.journalId && (
                            <Button size="sm" onClick={() => handleVerifyRevenue(rev.id, 'VERIFIED')} className="h-7 text-[11px] font-semibold">
                              Verifikasi
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
          </div>

          {/* ======================================================= */}
          {/* BAGIAN 4: TAGIHAN SERVIS MAKAN RESTORAN MITRA           */}
          {/* ======================================================= */}
          <div className="space-y-4 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <UtensilsCrossed className="w-4 h-4" />
                    </span>
                    4. Tagihan Servis Makan Restoran Mitra
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="font-mono text-[11px] bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-bold">
                      🍽️ Kupon Ditukar: {totalMealCoupons} Pax
                    </Badge>
                    <Badge variant="outline" className="font-mono text-[11px] text-muted-foreground">
                      Manifes: {totalManifestPax} Pax
                    </Badge>
                    <Badge variant="outline" className="font-mono text-[11px] bg-amber-50/70 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-semibold">
                      Beban 51102: {formatRupiah(totalEstimatedMealCost)}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Rekapitulasi penukaran kupon makan penumpang riil per leg dan status pembayaran transfer gelondongan kantor ke pemilik restoran.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isWisata}
                  onClick={() => navigate('/finance/restaurant-settlements')}
                  className={`h-8 text-xs font-semibold gap-1.5 ${isWisata
                    ? 'border-border text-muted-foreground opacity-60 cursor-not-allowed hover:bg-transparent'
                    : 'border-amber-500/60 text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100'
                    }`}
                  title={isWisata ? 'Khusus Layanan AKAP (Layanan Wisata tidak menggunakan kupon restoran mitra)' : undefined}
                >
                  <UtensilsCrossed className="w-3.5 h-3.5" /> Kelola Pembayaran Restoran ➔
                </Button>
              </div>
            </div>

            {/* Info Restoran Mitra Callout */}
            <div className="p-3.5 bg-slate-50 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-white/10 rounded-xl flex items-start gap-3">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground font-semibold">
                  {isWisata
                    ? 'Catatan Layanan Pariwisata (Non-Kupon Restoran):'
                    : 'Standar Pelayanan Tiket Termasuk Makan (Beban 51102 vs Utang 21101):'}
                </strong>{' '}
                {isWisata
                  ? 'Pada layanan sewa bus pariwisata (Wisata/Charter), konsumsi penumpang dan rombongan dikelola mandiri oleh panitia/klien penyewa. Fitur kupon makan restoran mitra (@ Rp 25.000) dinonaktifkan khusus untuk armada pariwisata.'
                  : 'Tiket resmi penumpang bus SS Travelink sudah termasuk 1x makan prasmanan di Rumah Makan Mitra (misal: Subang / Cipali / Gringsing). Tagihan diakumulasi dan ditransfer langsung oleh kantor pusat secara gelondongan tanpa memotong Uang Jalan (UJ) supir.'}
              </div>
            </div>

            {/* Tabel Legs & Penukaran Kupon Makan Penumpang */}
            <div className="border border-slate-200/80 dark:border-white/10 rounded-xl overflow-hidden bg-background">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-zinc-900/60">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Leg</TableHead>
                    <TableHead className="text-xs font-semibold">Rute Perjalanan</TableHead>
                    <TableHead className="text-xs font-semibold">Restoran Mitra Singgah</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Manifes Penumpang</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Kupon Ditukarkan</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Selisih Kupon</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Tagihan (51102)</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Status Pembayaran</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!spj.legs || spj.legs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-6 text-xs text-muted-foreground">
                        Belum ada data leg perjalanan untuk SPJ ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    spj.legs.map((leg, idx) => {
                      const mealRec = spjMealRecords.find((r) => r.spjLegId === leg.id);
                      const manifest = leg.passengerCount || 0;
                      const mealCount = mealRec ? mealRec.actualPax : leg.mealPaxCount !== undefined ? leg.mealPaxCount : manifest;
                      const diff = mealCount - manifest;
                      const rate = mealRec ? mealRec.ratePerPax : 25000;
                      const subtotal = mealRec ? mealRec.totalAmount : mealCount * rate;

                      return (
                        <TableRow key={leg.id} className="hover:bg-muted/20">
                          <TableCell className="text-xs font-bold font-mono">Leg #{idx + 1}</TableCell>
                          <TableCell className="text-xs font-medium">
                            {leg.origin} ➔ {leg.destination}
                          </TableCell>
                          <TableCell className="text-xs">
                            {mealRec?.restaurant ? (
                              <div>
                                <div className="font-semibold text-foreground">
                                  🍽️ {mealRec.restaurant.name}
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                  {mealRec.restaurant.city}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic">Belum dipilih</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-center font-mono font-semibold">
                            {manifest} Pax
                          </TableCell>
                          <TableCell className="text-xs text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {mealCount} Kupon
                          </TableCell>
                          <TableCell className="text-xs text-center font-mono">
                            {diff === 0 ? (
                              <span className="text-muted-foreground">-</span>
                            ) : diff < 0 ? (
                              <span className="text-amber-600 font-bold">{diff} Pax</span>
                            ) : (
                              <span className="text-emerald-600 font-bold">+{diff} Pax</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-mono font-bold text-right text-foreground">
                            {formatRupiah(subtotal)}
                          </TableCell>
                          <TableCell className="text-center">
                            {mealRec ? (
                              mealRec.status === 'PAID' ? (
                                <Badge variant="default" className="text-[10px] bg-emerald-600 font-semibold gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Lunas pada Batch #{mealRec.settlementBatch?.batchNo || 'BATCH'}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-700 dark:text-amber-300 bg-amber-50/50">
                                  🟡 Menunggu Transfer Kantor
                                </Badge>
                              )
                            ) : (
                              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                Belum Dicatat
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isWisata}
                              onClick={() => {
                                setSelectedLegForMeal(leg);
                                setInputMealPaxCount(mealCount);
                                setInputMealDiscrepancyNotes(mealRec?.discrepancyNotes || leg.mealDiscrepancyNotes || '');
                                if (mealRec?.restaurantId) {
                                  setSelectedMealRestaurantId(mealRec.restaurantId);
                                  setInputMealRatePerPax(formatNumberWithDots(mealRec.ratePerPax || 25000));
                                } else if (restaurantsList.length > 0) {
                                  setSelectedMealRestaurantId(restaurantsList[0].id);
                                  setInputMealRatePerPax(formatNumberWithDots(restaurantsList[0].ratePerPax || 25000));
                                }
                                setMealCouponModalOpen(true);
                              }}
                              className={`h-7 text-[11px] font-medium gap-1 ${isWisata
                                ? 'border-border text-muted-foreground opacity-60 cursor-not-allowed hover:bg-transparent'
                                : 'border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800'
                                }`}
                              title={isWisata ? 'Khusus Layanan AKAP (Konsumsi wisata dikelola panitia rombongan)' : undefined}
                            >
                              ✏️ {mealRec ? 'Edit Kupon' : 'Catat Kupon'}
                            </Button>
                            {mealRec && mealRec.status !== 'PAID' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={isWisata}
                                onClick={() => handleDeleteMealRecord(mealRec.id)}
                                className={`h-7 w-7 p-0 ${isWisata
                                  ? 'text-muted-foreground opacity-40 cursor-not-allowed'
                                  : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                                  }`}
                                title={isWisata ? 'Khusus Layanan AKAP' : 'Hapus Kupon Makan'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* ======================================================= */}
          {/* BAGIAN 5: BEBAN KOORDINASI LAPANGAN (BEBAN 52105)        */}
          {/* ======================================================= */}
          <div className="space-y-4 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Coins className="w-4 h-4" />
                    </span>
                    5. Beban Koordinasi Lapangan &amp; Pengurus Jalur
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="font-mono text-[11px] bg-amber-50/70 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-bold">
                      🤝 Beban 52105: {formatRupiah(totalCoordinationFee)}
                    </Badge>
                    <Badge variant="outline" className="font-mono text-[11px] text-muted-foreground">
                      {totalCoordinationTickets} Pax Terhitung
                    </Badge>
                    <Badge variant="outline" className="text-[10px] border-border text-muted-foreground bg-muted/40">
                      Non-UJ (Transfer Kantor)
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Kewajiban snapshot uang koordinasi per tiket terjual atas SPJ bus ini. Diakui sebagai beban operasional rute SPJ dan ditransfer gelondongan oleh kantor pusat.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isWisata}
                  onClick={handleSyncCoordinationFees}
                  className={`h-8 text-xs font-medium gap-1.5 ${isWisata
                    ? 'border-border text-muted-foreground opacity-60 cursor-not-allowed hover:bg-transparent'
                    : 'border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800'
                    }`}
                  title={isWisata ? 'Khusus Layanan AKAP (Tidak ada biaya koordinasi pengurus jalur terminal pada bus pariwisata)' : undefined}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isWisata ? 'text-muted-foreground' : 'text-amber-600'}`} /> Sinkronkan Koordinasi
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isWisata}
                  onClick={() => navigate('/finance/coordination-fees')}
                  className={`h-8 text-xs font-semibold gap-1.5 ${isWisata
                    ? 'border-border text-muted-foreground opacity-60 cursor-not-allowed hover:bg-transparent'
                    : 'border-amber-500/60 text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100'
                    }`}
                  title={isWisata ? 'Khusus Layanan AKAP (Tidak ada biaya koordinasi pengurus jalur terminal pada bus pariwisata)' : undefined}
                >
                  Kelola Transfer Gelondongan ➔
                </Button>
              </div>
            </div>

            {/* Info Callout Beban 52105 & Utang 22102 */}
            <div className="p-3.5 bg-slate-50 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-white/10 rounded-xl flex items-start gap-3">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground font-semibold">
                  {isWisata
                    ? 'Catatan Layanan Pariwisata (Bebas Koordinasi Jalur):'
                    : 'Standar Matching Principle (Beban 52105 vs Utang 22102):'}
                </strong>{' '}
                {isWisata
                  ? 'Sewa bus pariwisata beroperasi berdasarkan izin insidentil / kontrak rombongan tanpa melalui jalur terminal reguler. Biaya koordinasi pengurus jalur terminal (Akun 52105) dinonaktifkan untuk layanan ini.'
                  : 'Uang koordinasi pengurus jalur dihitung proporsional dari tiket penumpang yang terjual per leg. Beban ini otomatis melekat pada dokumen SPJ ini untuk mengukur profitabilitas riil perjalanan bus, namun supir tidak perlu membayar di jalan karena penyelesaian dilakukan langsung oleh kantor pusat secara akumulatif gelondongan.'}
              </div>
            </div>

            {/* Tabel Rincian Fee per Leg */}
            <div className="border border-slate-200/80 dark:border-white/10 rounded-xl overflow-hidden bg-background">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-zinc-900/60">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Rute Trayek</TableHead>
                    <TableHead className="text-xs font-semibold">Leg Perjalanan</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Tiket Terjual</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Tarif / Pax</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Total Beban (52105)</TableHead>
                    <TableHead className="text-xs font-semibold">Koordinator Lapangan</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Status Pembayaran</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coordinationFees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6 text-xs text-muted-foreground">
                        Belum ada perhitungan uang koordinasi untuk SPJ ini. Klik tombol 'Sinkronkan Koordinasi' di atas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    coordinationFees.map((cf) => (
                      <TableRow key={cf.id} className="hover:bg-muted/20">
                        <TableCell className="text-xs font-bold">
                          <Badge variant="outline" className="text-[10px] font-mono border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                            {cf.origin} &rarr; {cf.destination}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {cf.spjLeg ? `${cf.spjLeg.origin} ➔ ${cf.spjLeg.destination}` : 'Rute SPJ'}
                        </TableCell>
                        <TableCell className="text-xs text-center font-mono font-bold text-foreground">
                          {cf.ticketCount} Pax
                        </TableCell>
                        <TableCell className="text-xs text-right font-mono text-muted-foreground">
                          {formatRupiah(cf.feePerPax)}
                        </TableCell>
                        <TableCell className="text-xs text-right font-mono font-bold text-amber-700 dark:text-amber-300">
                          {formatRupiah(cf.totalFee)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {cf.coordinator ? (
                            <div>
                              <span className="font-bold text-foreground">[{cf.coordinator.code}] {cf.coordinator.name}</span>
                              {cf.coordinator.organizationName && (
                                <span className="block text-[11px] text-muted-foreground">{cf.coordinator.organizationName}</span>
                              )}
                            </div>
                          ) : cf.coordinatorUser ? (
                            <span>👤 {cf.coordinatorUser.name}</span>
                          ) : (
                            <span>Umum (Semua SPJ)</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {cf.status === 'PAID' ? (
                            <Badge variant="default" className="text-[10px] bg-emerald-600 font-semibold gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Lunas pada Batch #{cf.settlementBatch?.batchNo || 'BATCH'}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-700 dark:text-amber-300 bg-amber-50/50">
                              🟡 Menunggu Transfer Kantor
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {cf.status !== 'PAID' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={isWisata}
                              onClick={() => handleDeleteCoordinationFee(cf.id)}
                              className={`h-7 w-7 p-0 ${isWisata
                                ? 'text-muted-foreground opacity-40 cursor-not-allowed'
                                : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                                }`}
                              title={isWisata ? 'Khusus Layanan AKAP' : 'Hapus Kewajiban Koordinasi'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* ======================================================= */}
          {/* BAGIAN 6: HAK KOMPENSASI KRU & EARLY PAYOUT             */}
          {/* ======================================================= */}
          <div className="space-y-4 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <CreditCard className="w-4 h-4" />
                    </span>
                    6. Hak Kompensasi Kru
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="font-mono text-[11px] bg-purple-50/70 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800 font-bold">
                      Total Hak: {formatRupiah(totalCrewComp)}
                    </Badge>
                    <Badge variant="outline" className="font-mono text-[11px] bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800">
                      Terbayar: {formatRupiah(totalCrewPaid)}
                    </Badge>
                    {totalCrewPending > 0 && (
                      <Badge variant="outline" className="font-mono text-[11px] bg-amber-50/70 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800">
                        Belum Cair: {formatRupiah(totalCrewPending)}
                      </Badge>
                    )}
                    {isWisata ? (
                      <Badge variant="outline" className="text-[10px] font-mono border-purple-400 text-purple-700 dark:text-purple-300 bg-purple-50/50">
                        🌴 Wisata: Tarif Harian (PER_DAY)
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] font-mono border-border text-muted-foreground">
                        🚌 AKAP: Tarif Ritase PP (PER_TRIP)
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Uang makan jalan, uang perpal menginap di terminal, premi ritase supir, bonus full-seat 100%, komisi kargo, serta fasilitas transfer nafkah supir di jalan (Early Payout Skenario 2).
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    if (spj.crewAssignments && spj.crewAssignments.length > 0) {
                      setPerpalSelectedCrew(spj.crewAssignments.map((c) => c.id));
                    }
                    setPerpalModalOpen(true);
                  }}
                  className="h-8 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs gap-1.5"
                >
                  <Hotel className="w-3.5 h-3.5" /> + Uang Perpal Kru (Menginap)
                </Button>
                <Button
                  size="sm"
                  disabled={isWisata}
                  onClick={() => {
                    if (spj.crewAssignments && spj.crewAssignments.length > 0) {
                      setFullSeatSelectedCrew(spj.crewAssignments.map((c) => c.id));
                    }
                    setFullSeatModalOpen(true);
                  }}
                  className={`h-8 text-xs font-semibold gap-1.5 ${isWisata
                    ? 'bg-muted text-muted-foreground opacity-60 cursor-not-allowed hover:bg-muted'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    }`}
                  title={isWisata ? 'Khusus Layanan AKAP (Bonus Full Seat tidak berlaku untuk charter wisata)' : undefined}
                >
                  <Sparkles className="w-3.5 h-3.5" /> + Klaim Bonus Full Seat
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSyncCrewPayments}
                  className="h-8 text-xs font-medium border-slate-300 dark:border-zinc-700 gap-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Sinkronkan Hak Kru
                </Button>
              </div>
            </div>

            <div className="border border-slate-200/80 dark:border-white/10 rounded-xl overflow-hidden bg-background">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-zinc-900/60">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Nama Personil Kru</TableHead>
                    <TableHead className="text-xs font-semibold">Kategori Hak</TableHead>
                    <TableHead className="text-xs font-semibold">Jadwal Pencairan</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Nominal</TableHead>
                    <TableHead className="text-xs font-semibold">Status Pembayaran</TableHead>
                    <TableHead className="text-xs font-semibold">Keterangan / Ref Transfer</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {crewPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                        Belum ada baris hak kompensasi kru. Klik 'Sinkronkan Hak Kru' untuk mengambil dari snapshot penugasan SPJ.
                      </TableCell>
                    </TableRow>
                  ) : (
                    crewPayments.map((pay) => (
                      <TableRow key={pay.id} className="hover:bg-muted/20">
                        <TableCell className="text-xs font-semibold text-foreground">👤 {pay.crew?.name || 'Kru SPJ'}</TableCell>
                        <TableCell>
                          {pay.paymentCategory === 'PERPAL_ALLOWANCE' ? (
                            <Badge variant="outline" className="text-[10px] font-mono border-indigo-400 text-indigo-700 dark:text-indigo-300 bg-indigo-50/60 dark:bg-indigo-950/20 font-semibold">
                              🏨 Uang Perpal (Menginap)
                            </Badge>
                          ) : pay.paymentCategory === 'FULL_SEAT_BONUS' ? (
                            <Badge variant="outline" className="text-[10px] font-mono border-emerald-400 text-emerald-700 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/20 font-bold">
                              🎯 Bonus Full Seat
                            </Badge>
                          ) : pay.paymentCategory === 'CARGO_COMMISSION' ? (
                            <Badge variant="outline" className="text-[10px] font-mono border-amber-400 text-amber-700 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-950/20">
                              📦 Komisi Kargo
                            </Badge>
                          ) : pay.paymentCategory === 'TRIP_INCENTIVE' ? (
                            <Badge variant="outline" className="text-[10px] font-mono border-purple-400 text-purple-700 dark:text-purple-300 bg-purple-50/60 dark:bg-purple-950/20">
                              ⚡ Premi Ritase
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] font-mono">
                              🍽️ Uang Makan
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {pay.payoutTiming === 'EARLY_DISBURSEMENT' ? (
                            <Badge variant="secondary" className="text-[10px]">
                              Di Jalan (Early Payout)
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">
                              Saat Rekonsiliasi Pool
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-mono font-bold text-right text-foreground">{formatRupiah(pay.amount)}</TableCell>
                        <TableCell>
                          <Badge variant={pay.status === 'PAID' ? 'default' : 'secondary'} className="text-[10px]">
                            {pay.status === 'PAID' ? 'TERBAYAR' : 'BELUM CAIR'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {pay.receiptRef ? <span>Ref: {pay.receiptRef}</span> : <span>{pay.notes || '-'}</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          {pay.status === 'PENDING' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedPayment(pay);
                                setEarlyPayoutOpen(true);
                              }}
                              className="h-7 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
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
          </div>
        </CardContent>
      </Card>

      {/* ========================================================= */}
      {/* DIALOG A: INPUT PENJUALAN TIKET MITRA AGENT              */}
      {/* ========================================================= */}
      <Dialog open={agentTicketModalOpen} onOpenChange={setAgentTicketModalOpen}>
        <DialogContent className="max-w-xl bg-background border border-border/70 rounded-2xl shadow-xl p-0 overflow-hidden">
          <DialogHeader className="p-5 pb-3 border-b border-border/50 bg-muted/20">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Input Penjualan Tiket Mitra Agen
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Pencatatan manifes tiket agen terminal/loket fisik atau Online OTA dengan perhitungan komisi otomatis &amp; kepatuhan pencatatan bruto.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setAgentTicketModalOpen(false);
              setJournalPreviewModalOpen(true);
            }}
            className="p-5 space-y-4"
          >
            {/* Pilihan Leg Rute Perjalanan */}
            {spj.legs && spj.legs.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground">Pilih Leg Rute Perjalanan</Label>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {spj.legs.length} Leg Terjadwal
                  </span>
                </div>
                <Select value={agentSpjLegId} onValueChange={handleLegChange}>
                  <SelectTrigger className="h-9 text-xs font-normal">
                    <SelectValue placeholder="Pilih Leg Perjalanan..." />
                  </SelectTrigger>
                  <SelectContent>
                    {spj.legs.map((leg, idx) => (
                      <SelectItem key={leg.id} value={leg.id} className="text-xs py-1.5 font-normal">
                        Leg #{idx + 1}: {leg.origin} ➔ {leg.destination} ({leg.passengerCount || 0} Pax)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Pilihan Mitra Agen & Filter Toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">
                  Mitra Agen Penjual <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleFilterByLeg(true)}
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium transition-colors ${filterByLeg
                      ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    🎯 Sesuai Leg ({filteredAgents.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleFilterByLeg(false)}
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium transition-colors ${!filterByLeg
                      ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    🌐 Semua Agen ({allAgents.length})
                  </button>
                </div>
              </div>

              <Select
                value={agentId}
                onValueChange={(val) =>
                  handleAgentOrSeatClassChange(val, agentSeatClassId, agentTicketCount, agentTicketPrice)
                }
              >
                <SelectTrigger className="h-9 text-xs font-normal">
                  <SelectValue placeholder="Pilih Mitra Agen..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {filteredAgents.map((ag) => (
                    <SelectItem key={ag.id} value={ag.id} className="text-xs py-1.5 font-normal">
                      <span>{ag.name}</span>{' '}
                      <span className="text-[10px] text-muted-foreground font-mono">
                        ({ag.city} • {ag.agentType === 'ONLINE_OTA' ? 'OTA' : 'Loket'})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Info Rute yang Aktif */}
              <p className="text-[11px] text-muted-foreground">
                {filterByLeg ? (
                  <span>
                    ✨ Menampilkan agen untuk rute{' '}
                    <strong className="text-foreground">
                      {spj.legs?.find((l) => l.id === agentSpjLegId)?.origin || 'Asal'} ➔{' '}
                      {spj.legs?.find((l) => l.id === agentSpjLegId)?.destination || 'Tujuan'}
                    </strong>{' '}
                    serta platform Online OTA.
                  </span>
                ) : (
                  <span>🌐 Menampilkan seluruh <strong>{allAgents.length}</strong> mitra agen di seluruh wilayah operasional.</span>
                )}
              </p>
            </div>

            {/* Baris Kelas Kursi & Jumlah Tiket */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Kelas Kursi Armada Bus</Label>
                <Select
                  value={agentSeatClassId}
                  onValueChange={(val) =>
                    handleAgentOrSeatClassChange(agentId, val, agentTicketCount, agentTicketPrice)
                  }
                >
                  <SelectTrigger className="h-9 text-xs font-normal">
                    <SelectValue placeholder="Pilih Kelas Kursi" />
                  </SelectTrigger>
                  <SelectContent>
                    {seatClasses.map((sc) => (
                      <SelectItem key={sc.id} value={sc.id} className="text-xs py-1.5 font-normal">
                        {sc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Jumlah Lembar Tiket (Pax) <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={agentTicketCount}
                  onChange={(e) => {
                    const c = Number(e.target.value) || 1;
                    setAgentTicketCount(c);
                    handleAgentOrSeatClassChange(agentId, agentSeatClassId, c, agentTicketPrice);
                  }}
                  className="h-9 text-xs font-mono font-bold"
                  required
                />
              </div>
            </div>

            {/* Baris Harga Satuan & Total Bruto */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Harga Satuan Tiket (Rp)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-semibold text-muted-foreground select-none">Rp</span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={formatNumberWithDots(agentTicketPrice)}
                    onChange={(e) => {
                      const clean = cleanDots(e.target.value);
                      setAgentTicketPrice(clean);
                      handleAgentOrSeatClassChange(agentId, agentSeatClassId, agentTicketCount, clean);
                    }}
                    className="pl-9 h-9 text-xs font-mono font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Total Penjualan Kotor (Bruto)</Label>
                <div className="h-9 px-3 flex items-center bg-muted/40 border border-border/60 rounded-md font-mono text-xs font-bold text-foreground">
                  {formatRupiah(calculatedGrossTicketTotal)}
                </div>
              </div>
            </div>

            {/* Komisi Agen & Metode Setoran */}
            <div className="p-3.5 bg-muted/25 border border-border/60 rounded-xl space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Total Hak Komisi Agen</span>
                    <span className="text-[10px] text-muted-foreground font-normal">(Auto-Rule)</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-semibold text-muted-foreground select-none">Rp</span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={formatNumberWithDots(agentCommissionAmount)}
                      onChange={(e) => setAgentCommissionAmount(cleanDots(e.target.value))}
                      className="pl-9 h-9 text-xs font-mono font-bold text-amber-600 dark:text-amber-400"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Metode Penyerahan Setoran</Label>
                  <Select
                    value={agentSettlementType}
                    onValueChange={(val: any) => setAgentSettlementType(val)}
                  >
                    <SelectTrigger className="h-9 text-xs font-normal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH_TO_CREW" className="text-xs py-1.5 font-normal">Dititipkan Tunai ke Kru Bus</SelectItem>
                      <SelectItem value="BANK_TRANSFER" className="text-xs py-1.5 font-normal">Transfer ke Rekening Bank Perusahaan</SelectItem>
                      <SelectItem value="CASH_TO_OFFICE" className="text-xs py-1.5 font-normal">Disetor Langsung ke Kasir Kantor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {agentSettlementType === 'BANK_TRANSFER' && (
                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs font-semibold text-foreground">Rekening Bank Tujuan Perusahaan</Label>
                  <Select value={agentBankAccId} onValueChange={setAgentBankAccId}>
                    <SelectTrigger className="h-9 text-xs font-normal">
                      <SelectValue placeholder="Pilih Rekening Bank Penerima..." />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map((b) => (
                        <SelectItem key={b.id} value={b.id} className="text-xs py-1.5 font-normal">
                          {b.bankName} - {b.accountNumber} ({b.accountName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Referensi Manifes & Catatan */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Nomor Resi / Manifes Loket</Label>
                <Input
                  value={agentManifestRef}
                  onChange={(e) => setAgentManifestRef(e.target.value)}
                  placeholder="Misal: MNF-LBB-08"
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Catatan Tambahan</Label>
                <Input
                  value={agentNotes}
                  onChange={(e) => setAgentNotes(e.target.value)}
                  placeholder="Keterangan tiket..."
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
              <Button type="button" variant="outline" size="sm" onClick={() => setAgentTicketModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" size="sm" className="font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs">
                Tinjau &amp; Simpan Jurnal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* DIALOG B: PREVIEW JURNAL AKUNTANSI OTOMATIS (CONFIRMATION) */}
      {/* ========================================================= */}
      <Dialog open={journalPreviewModalOpen} onOpenChange={setJournalPreviewModalOpen}>
        <DialogContent className="max-w-2xl bg-background border border-border/70 rounded-2xl shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-5 pb-3 border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-2 text-primary font-bold">
              <FileText className="w-5 h-5 text-indigo-600" />
              <DialogTitle className="text-base font-bold text-foreground">
                Konfirmasi Penjualan &amp; Preview Jurnal Akuntansi
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Verifikasi angka dan simulasi mutasi jurnal otomatis sebelum data disimpan permanen ke buku besar SPJ.
            </DialogDescription>
          </DialogHeader>

          <div className="p-5 space-y-4">
            {/* Rangkuman Transaksi */}
            <div className="p-3.5 bg-muted/30 border border-border/60 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mitra Agen:</span>
                <span className="font-bold text-foreground">{selectedAgentObj?.name || 'Mitra Agen'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Volume &amp; Kelas Kursi:</span>
                <span className="font-semibold text-foreground">
                  {agentTicketCount} Pax @ {formatRupiah(cleanDots(agentTicketPrice))} ({selectedSeatClassObj?.name || 'Reguler'})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Penjualan Kotor (Bruto):</span>
                <span className="font-mono font-bold text-foreground">{formatRupiah(calculatedGrossTicketTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Beban Komisi Agen:</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {formatRupiah(cleanDots(agentCommissionAmount))}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-border/40">
                <span className="text-muted-foreground">Metode Penyerahan Setoran:</span>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {agentSettlementType}
                </Badge>
              </div>
            </div>

            {/* Tabel Preview Jurnal */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Jurnal Akuntansi yang Akan Diterbitkan Otomatis:
              </h4>
              <div className="border border-border/60 rounded-xl overflow-hidden bg-background">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="text-xs font-semibold">Kode Akun</TableHead>
                      <TableHead className="text-xs font-semibold">Nama Akun Akuntansi</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Debit</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Kredit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs font-mono">
                    <TableRow>
                      <TableCell className="font-bold text-primary">
                        {selectedAgentObj?.agentType === 'ONLINE_OTA' ? '12102' : '12103'}
                      </TableCell>
                      <TableCell className="font-sans">
                        Piutang Agen Penjualan Tiket {selectedAgentObj?.agentType === 'ONLINE_OTA' ? 'Online (OTA)' : 'Offline (Loket)'}
                      </TableCell>
                      <TableCell className="text-right font-bold">{formatRupiah(calculatedGrossTicketTotal)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">-</TableCell>
                    </TableRow>

                    {Number(cleanDots(agentCommissionAmount)) > 0 && (
                      <TableRow>
                        <TableCell className="font-bold text-amber-600">54101</TableCell>
                        <TableCell className="font-sans">Beban Komisi Agen Penjualan Tiket</TableCell>
                        <TableCell className="text-right font-bold text-amber-600">
                          {formatRupiah(cleanDots(agentCommissionAmount))}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">-</TableCell>
                      </TableRow>
                    )}

                    <TableRow>
                      <TableCell className="font-bold text-emerald-600">41101</TableCell>
                      <TableCell className="font-sans pl-4">➔ Pendapatan Tiket AKAP Reguler (Omzet Bruto)</TableCell>
                      <TableCell className="text-right text-muted-foreground">-</TableCell>
                      <TableCell className="text-right font-bold text-emerald-600">{formatRupiah(calculatedGrossTicketTotal)}</TableCell>
                    </TableRow>

                    {Number(cleanDots(agentCommissionAmount)) > 0 && (
                      <TableRow>
                        <TableCell className="font-bold text-purple-600">22101</TableCell>
                        <TableCell className="font-sans pl-4">➔ Utang Komisi Agen Penjualan Tiket</TableCell>
                        <TableCell className="text-right text-muted-foreground">-</TableCell>
                        <TableCell className="text-right font-bold text-purple-600">
                          {formatRupiah(cleanDots(agentCommissionAmount))}
                        </TableCell>
                      </TableRow>
                    )}

                    {agentSettlementType === 'BANK_TRANSFER' && (
                      <>
                        <TableRow className="border-t border-dashed border-border/60">
                          <TableCell className="font-bold text-blue-600">11121</TableCell>
                          <TableCell className="font-sans font-semibold">
                            Rekening Bank Perusahaan (Pelunasan Setoran Agen)
                          </TableCell>
                          <TableCell className="text-right font-bold text-blue-600">{formatRupiah(calculatedGrossTicketTotal)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-bold text-primary">
                            {selectedAgentObj?.agentType === 'ONLINE_OTA' ? '12102' : '12103'}
                          </TableCell>
                          <TableCell className="font-sans pl-4">
                            ➔ Piutang Agen Penjualan Tiket (Lunas via Bank)
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">-</TableCell>
                          <TableCell className="text-right font-bold">{formatRupiah(calculatedGrossTicketTotal)}</TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setJournalPreviewModalOpen(false);
                  setAgentTicketModalOpen(true);
                }}
              >
                Kembali &amp; Koreksi
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleExecuteSaveAgentTicket}
                className="font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Konfirmasi &amp; Simpan Transaksi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* DIALOG 1: PENCAIRAN UJ                                   */}
      {/* ========================================================= */}
      <Dialog open={disburseOpen} onOpenChange={setDisburseOpen}>
        <DialogContent className="max-w-md bg-background border border-border/70 rounded-xl shadow-lg">
          <DialogHeader className="pb-2 border-b border-border/50">
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
              <PlusCircle className="w-4 h-4 text-primary" /> Pencairan Dana Uang Jalan (UJ)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Mencatat pengeluaran uang tunai pool atau transfer bank untuk modal perjalanan supir.
            </DialogDescription>
          </DialogHeader>

          {/* Informational Banner */}
          <div className="p-3 mx-1 mt-1 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/20 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <span className="font-bold">Informasi Finansial &amp; Akuntansi:</span>
              <p className="text-[11px] text-blue-800 dark:text-blue-300">
                Pencairan dana UJ ini akan <strong>langsung memotong saldo kas/bank</strong> sumber dan membukukan mutasi Debit ke akun <strong>13101 (Uang Jalan Kru)</strong> di Buku Besar GL.
              </p>
            </div>
          </div>

          <form onSubmit={handleDisburseSubmit} className="space-y-3.5 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Nominal Pencairan</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-semibold text-muted-foreground select-none">Rp</span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={disburseAmount}
                  onChange={(e) => setDisburseAmount(formatNumberWithDots(e.target.value))}
                  placeholder="0"
                  className="pl-9 h-9 text-xs font-mono font-semibold"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Metode Pembayaran</Label>
              <Select value={disburseMethod} onValueChange={(val: any) => setDisburseMethod(val)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Kas Tunai Pool (Kasir)</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Transfer Rekening Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {disburseMethod === 'CASH' ? (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Akun Kas Sumber</Label>
                <Select value={disburseCashAcc} onValueChange={setDisburseCashAcc}>
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
                <Label className="text-xs font-medium text-foreground">Rekening Bank Sumber</Label>
                <Select value={disburseBankAcc} onValueChange={setDisburseBankAcc}>
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
              <Label className="text-xs font-medium text-foreground">Nomor Bukti Kas Keluar (BKK) / Ref</Label>
              <Input
                value={disburseRef}
                onChange={(e) => setDisburseRef(e.target.value)}
                placeholder="Misal: BKK/2611/0001"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Catatan</Label>
              <Textarea
                value={disburseNotes}
                onChange={(e) => setDisburseNotes(e.target.value)}
                placeholder="Catatan pencairan UJ..."
                className="text-xs resize-none h-16"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
              <Button type="button" variant="outline" size="sm" onClick={() => setDisburseOpen(false)}>
                Batal
              </Button>
              <Button type="submit" size="sm" className="font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Lanjut Konfirmasi Pencairan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ConfirmDialog for UJ Disbursement */}
      <ConfirmDialog
        open={confirmDisburseOpen}
        onOpenChange={setConfirmDisburseOpen}
        title="Konfirmasi Pencairan Uang Jalan (UJ)"
        description={`Anda akan mencairkan modal UJ sebesar Rp ${disburseAmount} untuk ${spj?.spjNo || 'SPJ'} melalui ${
          disburseMethod === 'BANK_TRANSFER'
            ? 'Transfer ' + (bankAccounts.find((b) => b.id === disburseBankAcc)?.bankName || 'Bank') + ' No. Rek ' + (bankAccounts.find((b) => b.id === disburseBankAcc)?.accountNumber || '') + ' (' + (bankAccounts.find((b) => b.id === disburseBankAcc)?.accountName || '') + ')'
            : 'Kas Tunai ' + (cashAccounts.find((c) => c.id === disburseCashAcc)?.name || 'Pool')
        }. Tindakan ini akan LANGSUNG MEMOTONG saldo kas/bank terkait dan membukukan mutasi Debit ke akun 13101 (Uang Jalan Kru) di Buku Besar GL.`}
        variant="primary"
        confirmText="Ya, Cairkan & Posting Jurnal"
        cancelText="Periksa Kembali"
        isLoading={disburseLoading}
        onConfirm={executeDisburse}
      />

      {/* ========================================================= */}
      {/* DIALOG 2: PENGEMBALIAN SISA UJ                           */}
      {/* ========================================================= */}
      <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
        <DialogContent className="max-w-md bg-background border border-border/70 rounded-xl shadow-lg">
          <DialogHeader className="pb-2 border-b border-border/50">
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
              <RotateCcw className="w-4 h-4 text-primary" /> Pengembalian Fisik Sisa UJ ke Kasir
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Sopir menyerahkan sisa uang jalan tunai saat bus tiba kembali di pool.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReturnSubmit} className="space-y-3.5 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Nominal Sisa UJ Dikembalikan</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-semibold text-muted-foreground select-none">Rp</span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={returnAmount}
                  onChange={(e) => setReturnAmount(formatNumberWithDots(e.target.value))}
                  placeholder="0"
                  className="pl-9 h-9 text-xs font-mono font-semibold"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Metode Penyetoran</Label>
              <Select value={returnMethod} onValueChange={(val: any) => setReturnMethod(val)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Tunai ke Kasir Pool</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Transfer ke Rekening Perusahaan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {returnMethod === 'CASH' ? (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Akun Kas Penerima</Label>
                <Select value={returnCashAcc} onValueChange={setReturnCashAcc}>
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
                <Label className="text-xs font-medium text-foreground">Rekening Bank Penerima</Label>
                <Select value={returnBankAcc} onValueChange={setReturnBankAcc}>
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
              <Label className="text-xs font-medium text-foreground">Nomor Bukti Kas Masuk (BKM)</Label>
              <Input
                value={returnRef}
                onChange={(e) => setReturnRef(e.target.value)}
                placeholder="Misal: BKM/2611/0001"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Catatan</Label>
              <Textarea
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="Keterangan pengembalian sisa UJ..."
                className="text-xs resize-none h-16"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
              <Button type="button" variant="outline" size="sm" onClick={() => setReturnOpen(false)}>
                Batal
              </Button>
              <Button type="submit" size="sm" className="font-semibold bg-emerald-600 hover:bg-emerald-700 text-white">
                Catat Pengembalian
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* DIALOG 3: PERMINTAAN TAMBAHAN UJ DI JALAN                 */}
      {/* ========================================================= */}
      <Dialog open={additionalReqOpen} onOpenChange={setAdditionalReqOpen}>
        <DialogContent className="max-w-md bg-background border border-border/70 rounded-xl shadow-lg">
          <DialogHeader className="pb-2 border-b border-border/50">
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
              <Send className="w-4 h-4 text-primary" /> Pengajuan Tambahan UJ di Perjalanan
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Kru mengajukan transfer tambahan dana operasional di jalan akibat keperluan darurat.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdditionalReqSubmit} className="space-y-3.5 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Nominal Tambahan yang Diminta</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-semibold text-muted-foreground select-none">Rp</span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={addReqAmount}
                  onChange={(e) => setAddReqAmount(formatNumberWithDots(e.target.value))}
                  placeholder="0"
                  className="pl-9 h-9 text-xs font-mono font-semibold"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Alasan Kebutuhan Tambahan</Label>
              <Textarea
                value={addReqReason}
                onChange={(e) => setAddReqReason(e.target.value)}
                placeholder="Contoh: Rute pengalihan macet, perlu solar tambahan..."
                className="text-xs resize-none h-20"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
              <Button type="button" variant="outline" size="sm" onClick={() => setAdditionalReqOpen(false)}>
                Batal
              </Button>
              <Button type="submit" size="sm" className="font-semibold bg-emerald-600 hover:bg-emerald-700 text-white">
                Kirim Pengajuan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* DIALOG 4: ESTAFET ROLLOVER UJ (SKENARIO 3)                */}
      {/* ========================================================= */}
      <Dialog open={rolloverOpen} onOpenChange={setRolloverOpen}>
        <DialogContent className="max-w-md bg-background border border-border/70 rounded-xl shadow-lg">
          <DialogHeader className="pb-2 border-b border-border/50">
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-destructive">
              <ArrowRightLeft className="w-4 h-4" /> Estafet Rollover UJ (Skenario 3 Breakdown)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Mentransfer sisa fisik saldo amplop UJ dari bus yang rusak ke dokumen SPJ bus pengganti.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRolloverSubmit} className="space-y-3.5 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Pilih SPJ Armada Pengganti</Label>
              <Select value={rolloverTargetSpj} onValueChange={setRolloverTargetSpj}>
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
              <Label className="text-xs font-medium text-foreground">Nominal Sisa UJ Diestafetkan</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-semibold text-muted-foreground select-none">Rp</span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={rolloverAmount}
                  onChange={(e) => setRolloverAmount(formatNumberWithDots(e.target.value))}
                  placeholder="0"
                  className="pl-9 h-9 text-xs font-mono font-semibold"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Catatan Serah Terima Fisik</Label>
              <Textarea
                value={rolloverNotes}
                onChange={(e) => setRolloverNotes(e.target.value)}
                placeholder="Contoh: Serah terima sisa uang solar di KM 102 Tol Cipali..."
                className="text-xs resize-none h-16"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
              <Button type="button" variant="outline" size="sm" onClick={() => setRolloverOpen(false)}>
                Batal
              </Button>
              <Button type="submit" size="sm" variant="destructive" className="font-semibold">
                Eksekusi Estafet UJ
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* DIALOG 5: CATAT PENGELUARAN OPERASIONAL (SPJ EXPENSES)    */}
      {/* ========================================================= */}
      <Dialog open={expenseFormOpen} onOpenChange={setExpenseFormOpen}>
        <DialogContent className="max-w-lg bg-background border border-border/70 rounded-xl shadow-lg">
          <DialogHeader className="pb-2 border-b border-border/50">
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
              <Receipt className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Input Pengeluaran Operasional SPJ
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Nota fisik BBM, tol, parkir, retribusi terminal, servis makan, maupun biaya darurat.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateExpenseSubmit} className="space-y-3.5 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Jenis Beban</Label>
                <Select value={expType} onValueChange={(val: any) => setExpType(val)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FUEL">BBM (Solar)</SelectItem>
                    <SelectItem value="TOLL">Tol / E-Toll</SelectItem>
                    <SelectItem value="PARKING">Parkir</SelectItem>
                    <SelectItem value="RETRIBUTION">Retribusi / TPR</SelectItem>
                    <SelectItem value="RESTAURANT_MEAL_SERVICE">Servis Makan Penumpang</SelectItem>
                    <SelectItem value="CREW_LODGING">Penginapan Kru (Wisata)</SelectItem>
                    <SelectItem value="EMERGENCY_REPAIR">Perbaikan Darurat / Ban</SelectItem>
                    <SelectItem value="TOWING">Biaya Derek Resmi Tol</SelectItem>
                    <SelectItem value="OTHER">Lain-Lain</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Sumber Dana</Label>
                <Select value={expSource} onValueChange={(val: any) => setExpSource(val)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UJ">Uang Jalan Kru (UJ)</SelectItem>
                    <SelectItem value="OFFICE_CASH">Kas Kantor / Pool</SelectItem>
                    <SelectItem value="OFFICE_BANK">Transfer Bank Kantor</SelectItem>
                    <SelectItem value="CREW_POCKET">Talangan Kantong Kru</SelectItem>
                    <SelectItem value="OFFICE_AP">Tagihan Tempo Vendor (AP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Nominal Pengeluaran</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-semibold text-muted-foreground select-none">Rp</span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={expAmount}
                  onChange={(e) => setExpAmount(formatNumberWithDots(e.target.value))}
                  placeholder="0"
                  className="pl-9 h-9 text-xs font-mono font-semibold"
                  required
                />
              </div>
            </div>

            {expType === 'FUEL' && (
              <div className="grid grid-cols-3 gap-2.5 p-3 bg-muted/25 border border-border/60 rounded-lg">
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-muted-foreground">Volume (Liter)</Label>
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
                  <Label className="text-[11px] font-medium text-muted-foreground">Odometer (KM)</Label>
                  <Input
                    type="number"
                    value={expOdometer}
                    onChange={(e) => setExpOdometer(e.target.value)}
                    placeholder="125430"
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-muted-foreground">SPBU / Rest Area</Label>
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
              <Label className="text-xs font-medium text-foreground">Nomor Struk / Nota Fisik</Label>
              <Input
                value={expReceiptNo}
                onChange={(e) => setExpReceiptNo(e.target.value)}
                placeholder="Misal: BBM-207-001"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Keterangan Biaya</Label>
              <Textarea
                value={expNotes}
                onChange={(e) => setExpNotes(e.target.value)}
                placeholder="Catatan rincian biaya..."
                className="text-xs resize-none h-16"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
              <Button type="button" variant="outline" size="sm" onClick={() => setExpenseFormOpen(false)}>
                Batal
              </Button>
              <Button type="submit" size="sm" className="font-semibold bg-amber-600 hover:bg-amber-700 text-white">
                Simpan Nota Pengeluaran
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* DIALOG 6: DEKLARASI PENERIMAAN LANGSUNG & KARGO          */}
      {/* ========================================================= */}
      <Dialog open={revenueFormOpen} onOpenChange={setRevenueFormOpen}>
        <DialogContent className="max-w-lg bg-background border border-border/70 rounded-xl shadow-lg">
          <DialogHeader className="pb-2 border-b border-border/50">
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
              <Coins className="w-4 h-4 text-primary" />{' '}
              {isWisata ? 'Input Pelunasan Sewa Wisata di Lapangan' : 'Input Penerimaan Kas Langsung & Kargo'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isWisata
                ? 'Penerimaan fisik sisa sewa dari penyewa rombongan di lapangan (Anti-Netting).'
                : 'Tiket langsung naik pool/jalan atau kargo motor/kardus di bagasi bus (Anti-Netting).'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateRevenueSubmit} className="space-y-3.5 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Jenis Penerimaan</Label>
                <Select value={revType} onValueChange={(val: any) => setRevType(val)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TICKET_CASH" disabled={isWisata}>
                      Tiket Tunai Langsung Naik {isWisata ? '(Khusus AKAP)' : ''}
                    </SelectItem>
                    <SelectItem value="CARGO_MOTORCYCLE" disabled={isWisata}>
                      Kargo Sepeda Motor (Bagasi) {isWisata ? '(Khusus AKAP)' : ''}
                    </SelectItem>
                    <SelectItem value="CARGO_BOX" disabled={isWisata}>
                      Kargo Kardus / Oleh-oleh {isWisata ? '(Khusus AKAP)' : ''}
                    </SelectItem>
                    <SelectItem value="CHARTER_CASH">
                      Pelunasan Sewa Wisata di Lapangan (Charter)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Nomor Resi / Tiket</Label>
                <Input
                  value={revRef}
                  onChange={(e) => setRevRef(e.target.value)}
                  placeholder="Misal: RESI-MTR-001"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Nominal Bruto Kas Diterima</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-semibold text-muted-foreground select-none">Rp</span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={revAmount}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setRevAmount(formatNumberWithDots(raw));
                    const gross = Number(cleanDots(raw)) || 0;
                    const comm = (gross * (Number(revCargoCommissionPct) || 0)) / 100;
                    setRevCargoCommissionAmount(String(Math.round(comm)));
                  }}
                  placeholder="0"
                  className="pl-9 h-9 text-xs font-mono font-semibold"
                  required
                />
              </div>
            </div>

            {(revType === 'CARGO_MOTORCYCLE' || revType === 'CARGO_BOX') && (
              <div className="p-3.5 bg-slate-50 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-white/10 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-amber-600" />
                    Pengaturan Hak Komisi Kru Kargo:
                  </span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {formatRupiah(cleanDots(revCargoCommissionAmount))} ({Number(revCargoCommissionPct || 0).toFixed(2)}%)
                  </span>
                </div>

                {/* Dropdown Pemilihan Personil Kru Penerima Komisi */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-foreground">
                    Personil Kru Penerima Hak Komisi <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={revRecipientCrewAssignmentId}
                    onValueChange={setRevRecipientCrewAssignmentId}
                  >
                    <SelectTrigger className="h-8 text-xs font-normal">
                      <SelectValue placeholder="Pilih Personil Kru Penerima Komisi" />
                    </SelectTrigger>
                    <SelectContent>
                      {spj.crewAssignments && spj.crewAssignments.length > 0 ? (
                        spj.crewAssignments.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="text-xs font-normal">
                            👤 {c.crew?.name || 'Kru'} ({c.role})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled className="text-xs font-normal">
                          Belum ada kru di SPJ ini
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Preset Chips Cepat */}
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-medium">Pilihan Cepat Persentase:</span>
                  <div className="flex items-center gap-1.5">
                    {['10.00', '15.00', '20.00', '25.00', '30.00'].map((pct) => (
                      <Button
                        key={pct}
                        type="button"
                        size="sm"
                        variant={Number(revCargoCommissionPct).toFixed(2) === pct ? 'default' : 'outline'}
                        onClick={() => {
                          setRevCargoCommissionPct(pct);
                          const gross = Number(cleanDots(revAmount)) || 0;
                          const comm = (gross * Number(pct)) / 100;
                          setRevCargoCommissionAmount(String(Math.round(comm)));
                        }}
                        className={`h-6 text-[11px] font-mono flex-1 px-1.5 ${Number(revCargoCommissionPct).toFixed(2) === pct
                          ? 'bg-amber-600 hover:bg-amber-700 text-white font-bold'
                          : 'border-slate-300 dark:border-zinc-700'
                          }`}
                      >
                        {Number(pct)}%
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Dua Input Dua Arah yang Fleksibel (Persen & Rupiah) */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">
                      Kustom Persentase (%)
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={revCargoCommissionPct}
                        onChange={(e) => {
                          const pct = e.target.value;
                          setRevCargoCommissionPct(pct);
                          const gross = Number(cleanDots(revAmount)) || 0;
                          const comm = (gross * (Number(pct) || 0)) / 100;
                          setRevCargoCommissionAmount(String(Math.round(comm)));
                        }}
                        placeholder="20.00"
                        className="h-8 text-xs font-mono font-bold pr-7"
                      />
                      <span className="absolute right-2.5 top-2 text-xs font-bold text-muted-foreground select-none">%</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-foreground">
                      Atau Nominal Rupiah Langsung (Rp)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs font-semibold text-muted-foreground select-none">Rp</span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={formatNumberWithDots(revCargoCommissionAmount)}
                        onChange={(e) => {
                          const rawNominal = cleanDots(e.target.value);
                          setRevCargoCommissionAmount(rawNominal);
                          const gross = Number(cleanDots(revAmount)) || 0;
                          if (gross > 0) {
                            const calculatedPct = ((Number(rawNominal) || 0) / gross) * 100;
                            setRevCargoCommissionPct(calculatedPct.toFixed(2));
                          }
                        }}
                        placeholder="0"
                        className="pl-8 h-8 text-xs font-mono font-bold text-amber-600 dark:text-amber-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Rincian Bersih Setoran ke Kasir Pool */}
                <div className="flex items-center justify-between p-2 bg-muted/40 rounded-lg text-[11px] border border-border/50">
                  <span className="text-muted-foreground">Net Setoran Bersih ke Kantor (Kantong 2):</span>
                  <span className="font-mono font-bold text-foreground">
                    {formatRupiah((Number(cleanDots(revAmount)) || 0) - (Number(cleanDots(revCargoCommissionAmount)) || 0))}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-muted-foreground">Nama Pengirim</Label>
                    <Input value={revSenderName} onChange={(e) => setRevSenderName(e.target.value)} placeholder="Pak Ahmad" className="h-8 text-xs font-normal" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-muted-foreground">Nama Penerima</Label>
                    <Input value={revReceiverName} onChange={(e) => setRevReceiverName(e.target.value)} placeholder="Mas Wahyu" className="h-8 text-xs font-normal" />
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <Label className="text-[11px] font-medium text-muted-foreground">Keterangan Barang</Label>
                  <Input value={revItemDesc} onChange={(e) => setRevItemDesc(e.target.value)} placeholder="Contoh: Honda Vario 125cc" className="h-8 text-xs font-normal" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Catatan</Label>
              <Textarea
                value={revNotes}
                onChange={(e) => setRevNotes(e.target.value)}
                placeholder="Catatan tambahan penerimaan kas..."
                className="text-xs resize-none h-16"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
              <Button type="button" variant="outline" size="sm" onClick={() => setRevenueFormOpen(false)}>
                Batal
              </Button>
              <Button type="submit" size="sm" className="font-semibold bg-emerald-600 hover:bg-emerald-700 text-white">
                Simpan Deklarasi
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* DIALOG 7: EARLY PAYOUT TRANSFER (SKENARIO 2)             */}
      {/* ========================================================= */}
      <Dialog open={earlyPayoutOpen} onOpenChange={setEarlyPayoutOpen}>
        <DialogContent className="max-w-md bg-background border border-border/70 rounded-xl shadow-lg">
          <DialogHeader className="pb-2 border-b border-border/50">
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
              <CreditCard className="w-4 h-4 text-primary" /> Transfer Kompensasi di Muka (Early Payout)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Mencairkan sebagian uang premi ke rekening keluarga supir saat perjalanan wisata multi-day.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEarlyPayoutSubmit} className="space-y-3.5 pt-2">
            <div className="p-3 bg-muted/25 rounded-lg space-y-1 text-xs border border-border/50">
              <div>
                <strong className="text-foreground">Penerima:</strong>{' '}
                <span className="text-muted-foreground">{selectedPayment?.crew?.name}</span>
              </div>
              <div>
                <strong className="text-foreground">Kategori:</strong>{' '}
                <span className="text-muted-foreground">{selectedPayment?.paymentCategory}</span>
              </div>
              <div className="font-mono font-bold text-sm text-foreground pt-0.5">
                Nominal: {formatRupiah(selectedPayment?.amount)}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Metode Pencairan</Label>
              <Select value={earlyPayoutMethod} onValueChange={(val: any) => setEarlyPayoutMethod(val)}>
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
              <Label className="text-xs font-medium text-foreground">Rekening Bank Sumber Perusahaan</Label>
              <Select value={earlyPayoutBankAcc} onValueChange={setEarlyPayoutBankAcc}>
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
              <Label className="text-xs font-medium text-foreground">Nomor Referensi Transfer Bank</Label>
              <Input
                value={earlyPayoutRef}
                onChange={(e) => setEarlyPayoutRef(e.target.value)}
                placeholder="Misal: TRF-BCA-88772"
                className="h-9 text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Catatan</Label>
              <Textarea
                value={earlyPayoutNotes}
                onChange={(e) => setEarlyPayoutNotes(e.target.value)}
                placeholder="Contoh: Transfer uang nafkah keluarga driver di jalan..."
                className="text-xs resize-none h-16"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
              <Button type="button" variant="outline" size="sm" onClick={() => setEarlyPayoutOpen(false)}>
                Batal
              </Button>
              <Button type="submit" size="sm" className="font-semibold bg-emerald-600 hover:bg-emerald-700 text-white">
                Konfirmasi Transfer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* DIALOG 8: CATAT / EDIT KUPON MAKAN PENUMPANG PER LEG      */}
      {/* ========================================================= */}
      <Dialog open={mealCouponModalOpen} onOpenChange={setMealCouponModalOpen}>
        <DialogContent className="max-w-md bg-background border border-border/70 rounded-2xl shadow-xl p-0 overflow-hidden">
          <DialogHeader className="p-5 pb-3 border-b border-border/50 bg-muted/20">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <UtensilsCrossed className="w-5 h-5 text-amber-600" />
              Catat Kupon Makan Penumpang
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {selectedLegForMeal?.origin} ➔ {selectedLegForMeal?.destination} (Manifes: {selectedLegForMeal?.passengerCount || 0} Pax)
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveMealCoupon} className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Rumah Makan Mitra Singgah <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedMealRestaurantId}
                onValueChange={(val) => {
                  setSelectedMealRestaurantId(val);
                  const found = restaurantsList.find((r) => r.id === val);
                  if (found) {
                    setInputMealRatePerPax(formatNumberWithDots(found.ratePerPax || 25000));
                  }
                }}
                required
              >
                <SelectTrigger className="h-9 text-xs font-normal">
                  <SelectValue placeholder="Pilih Rumah Makan Mitra" />
                </SelectTrigger>
                <SelectContent>
                  {restaurantsList.map((rm) => (
                    <SelectItem key={rm.id} value={rm.id} className="text-xs font-normal">
                      🍽️ {rm.name} ({rm.city}) - @ Rp {Number(rm.ratePerPax).toLocaleString('id-ID')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Jumlah Kupon Riil (Pax) <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={inputMealPaxCount}
                  onChange={(e) => setInputMealPaxCount(Number(e.target.value) || 0)}
                  className="h-9 text-xs font-mono font-bold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Tarif per Kupon (Rp) <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-semibold text-muted-foreground select-none">Rp</span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={inputMealRatePerPax}
                    onChange={(e) => setInputMealRatePerPax(formatNumberWithDots(e.target.value))}
                    placeholder="25.000"
                    className="pl-9 h-9 text-xs font-mono font-bold"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Catatan Selisih Kupon (Jika Ada Penumpang Tidur / Puasa)
              </Label>
              <Textarea
                value={inputMealDiscrepancyNotes}
                onChange={(e) => setInputMealDiscrepancyNotes(e.target.value)}
                placeholder="Contoh: 2 penumpang tidur dan tidak turun menukar kupon makan..."
                className="text-xs resize-none h-20"
              />
            </div>

            <div className="p-3 bg-muted/30 border border-border/60 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Estimasi Tagihan Restoran:</span>
                <span className="font-mono font-bold text-sm text-foreground">
                  {formatRupiah(
                    (Number(inputMealPaxCount) || 0) * (Number(cleanDots(inputMealRatePerPax)) || 0),
                  )}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                Tarif otomatis ter-snapshot dari master restoran, namun bisa diedit manual menyesuaikan porsi khusus perjalanan.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
              <Button type="button" variant="outline" size="sm" onClick={() => setMealCouponModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" size="sm" className="font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-2xs">
                Simpan Kupon Makan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* DIALOG 9: TAMBAH UANG PERPAL KRU (MENGINAP DI TERMINAL)  */}
      {/* ========================================================= */}
      <Dialog open={perpalModalOpen} onOpenChange={setPerpalModalOpen}>
        <DialogContent className="max-w-lg bg-background border border-border/70 rounded-2xl shadow-xl p-0 overflow-hidden">
          <DialogHeader className="p-5 pb-3 border-b border-border/50 bg-indigo-50/50 dark:bg-indigo-950/20">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <Hotel className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Tambah Uang Perpal Kru (Menginap di Terminal)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Kompensasi tambahan uang makan &amp; biaya tunggu saat armada bus tidak langsung jalan PP melainkan menginap/stand by di terminal atau luar kota.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePerpal} className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Lokasi Terminal / Kota Tempat Perpal <span className="text-destructive">*</span>
              </Label>
              <Input
                value={perpalTerminal}
                onChange={(e) => setPerpalTerminal(e.target.value)}
                placeholder="Contoh: Terminal Giwangan Yogyakarta / Terminal Jombor"
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Jumlah Hari Perpal (Hari) <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="14"
                  value={perpalDays}
                  onChange={(e) => setPerpalDays(Math.max(1, Number(e.target.value) || 1))}
                  className="h-9 text-xs font-mono font-bold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Nominal per Hari per Orang (Rp) <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-semibold text-muted-foreground select-none">Rp</span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={formatNumberWithDots(perpalRatePerDay)}
                    onChange={(e) => setPerpalRatePerDay(formatNumberWithDots(e.target.value))}
                    placeholder="100.000"
                    className="pl-9 h-9 text-xs font-mono font-bold"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Checklist Personil Kru yang Ikut Menginap */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">
                Pilih Personil Kru yang Berhak Menerima Uang Perpal:
              </Label>
              <div className="space-y-2 p-3 bg-muted/20 border border-border/60 rounded-xl">
                {!spj.crewAssignments || spj.crewAssignments.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Tidak ada kru terdaftar di SPJ ini.</p>
                ) : (
                  spj.crewAssignments.map((crewAss) => {
                    const isChecked = perpalSelectedCrew.includes(crewAss.id);
                    return (
                      <div
                        key={crewAss.id}
                        onClick={() => togglePerpalCrew(crewAss.id)}
                        className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors text-xs select-none ${isChecked
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800 font-semibold'
                          : 'bg-background border-border/50 text-muted-foreground hover:bg-muted/30'
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${isChecked
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-slate-300 dark:border-zinc-700 bg-background'
                              }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-3" />}
                          </div>
                          <span>
                            👤 {crewAss.crew?.name || 'Kru'} ({crewAss.role})
                          </span>
                        </div>
                        <span className="font-mono text-indigo-700 dark:text-indigo-300 font-bold">
                          {formatRupiah((Number(perpalDays) || 1) * (Number(cleanDots(perpalRatePerDay)) || 0))}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Pilihan Waktu Pencairan */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Jadwal Pencairan Uang Perpal</Label>
              <Select
                value={perpalTiming}
                onValueChange={(val: any) => setPerpalTiming(val)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AT_SETTLEMENT">
                    🏢 Saat Rekonsiliasi Kasir Garasi (Setelah Kembali)
                  </SelectItem>
                  <SelectItem value="EARLY_DISBURSEMENT">
                    💸 Ditransfer Segera di Jalan (Early Payout via Bank)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Catatan Tambahan Alasan Perpal</Label>
              <Textarea
                value={perpalNotes}
                onChange={(e) => setPerpalNotes(e.target.value)}
                placeholder="Contoh: Menginap menunggu arus balik penumpang hari Minggu sore..."
                className="text-xs resize-none h-16 font-normal"
              />
            </div>

            {/* Total Ringkasan Perpal */}
            <div className="p-3 bg-indigo-500/10 border border-indigo-200 dark:border-indigo-800/40 rounded-xl flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">
                Total Kompensasi Perpal ({perpalSelectedCrew.length} Personil x {perpalDays} Hari):
              </span>
              <span className="font-mono font-bold text-sm text-indigo-700 dark:text-indigo-300">
                {formatRupiah(
                  perpalSelectedCrew.length *
                  (Number(perpalDays) || 1) *
                  (Number(cleanDots(perpalRatePerDay)) || 0),
                )}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
              <Button type="button" variant="outline" size="sm" onClick={() => setPerpalModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" size="sm" className="font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs">
                Simpan Uang Perpal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* DIALOG 10: KLAIM BONUS FULL SEAT KRU (OKUPANSI 100%)      */}
      {/* ========================================================= */}
      <Dialog open={fullSeatModalOpen} onOpenChange={setFullSeatModalOpen}>
        <DialogContent className="max-w-lg bg-background border border-border/70 rounded-2xl shadow-xl p-0 overflow-hidden">
          <DialogHeader className="p-5 pb-3 border-b border-border/50 bg-emerald-50/50 dark:bg-emerald-950/20">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Klaim Bonus Full Seat Kru (Okupansi 100%)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Apresiasi bonus pencapaian load factor penuh 100% kapasitas kursi penumpang bus SPJ.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveFullSeatBonus} className="p-5 space-y-4">
            {/* Status Okupansi Live */}
            <div className="p-3.5 bg-muted/20 border border-border/60 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Kapasitas Kursi Armada:</span>
                <span className="font-mono font-bold text-foreground">
                  {spj.vehicle?.capacity || 28} Kursi
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Total Tiket Terjual:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {totalTicketsSold} Tiket ({totalManifestPax} Manifes Pax)
                </span>
              </div>
              <div className="pt-1 flex items-center gap-1.5">
                {totalTicketsSold >= (spj.vehicle?.capacity || 28) ? (
                  <Badge variant="default" className="text-[11px] bg-emerald-600 font-semibold gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Target Okupansi 100% Terpenuhi Sempurna!
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[11px] border-amber-400 text-amber-700 dark:text-amber-300 bg-amber-50/50">
                    Okupansi: {totalTicketsSold} / {spj.vehicle?.capacity || 28} Kursi (Klaim Kebijakan Manajemen)
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Nominal Bonus per Kru (Rp) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-semibold text-muted-foreground select-none">Rp</span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={formatNumberWithDots(fullSeatBonusRate)}
                  onChange={(e) => setFullSeatBonusRate(formatNumberWithDots(e.target.value))}
                  placeholder="150.000"
                  className="pl-9 h-9 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400"
                  required
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Standar bonus full seat: Rp 150.000 s/d Rp 200.000 per orang sesuai master data tarif.
              </p>
            </div>

            {/* Checklist Personil Kru Penerima Bonus */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">
                Pilih Personil Kru Penerima Bonus Full Seat:
              </Label>
              <div className="space-y-2 p-3 bg-muted/20 border border-border/60 rounded-xl">
                {!spj.crewAssignments || spj.crewAssignments.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Tidak ada kru terdaftar di SPJ ini.</p>
                ) : (
                  spj.crewAssignments.map((crewAss) => {
                    const isChecked = fullSeatSelectedCrew.includes(crewAss.id);
                    return (
                      <div
                        key={crewAss.id}
                        onClick={() => toggleFullSeatCrew(crewAss.id)}
                        className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors text-xs select-none ${isChecked
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 font-semibold'
                          : 'bg-background border-border/50 text-muted-foreground hover:bg-muted/30'
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${isChecked
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 dark:border-zinc-700 bg-background'
                              }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-3" />}
                          </div>
                          <span>
                            👤 {crewAss.crew?.name || 'Kru'} ({crewAss.role})
                          </span>
                        </div>
                        <span className="font-mono text-emerald-700 dark:text-emerald-300 font-bold">
                          {formatRupiah(cleanDots(fullSeatBonusRate))}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Catatan Klaim</Label>
              <Textarea
                value={fullSeatNotes}
                onChange={(e) => setFullSeatNotes(e.target.value)}
                placeholder="Contoh: Bonus full seat rute Jakarta - Solo okupansi 100%..."
                className="text-xs resize-none h-16 font-normal"
              />
            </div>

            {/* Total Ringkasan Bonus */}
            <div className="p-3 bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800/40 rounded-xl flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">
                Total Bonus Full Seat ({fullSeatSelectedCrew.length} Personil):
              </span>
              <span className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-300">
                {formatRupiah(
                  fullSeatSelectedCrew.length * (Number(cleanDots(fullSeatBonusRate)) || 0),
                )}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
              <Button type="button" variant="outline" size="sm" onClick={() => setFullSeatModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" size="sm" className="font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs">
                Konfirmasi Bonus Full Seat
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
