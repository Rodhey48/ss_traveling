import ConfirmDialog from '@/components/shared/confirm-dialog';
import Heading from '@/components/shared/heading';
import {
  MetricCardGridSkeleton,
  TableSkeletonRows,
} from '@/components/shared/skeleton-loaders';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
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
import { CrewRateService } from '@/services/crew-rate.service';
import type {
  CrewRateRule,
  CrewRateRuleFormData,
  CrewRateSnapshotResult,
  CrewRole,
  CrewServiceType,
} from '@/types';
import {
  Award,
  Calculator,
  CalendarDays,
  Coins,
  Compass,
  Edit,
  Info,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import CrewRateModal from './components/crew-rate-modal';

export default function CrewRatesPage() {
  const { isCreate, isUpdate, isDelete } = usePermission();
  const [activeTab, setActiveTab] = useState<'rules' | 'snapshot'>('rules');
  const [rules, setRules] = useState<CrewRateRule[]>([]);
  const [loading, setLoading] = useState(false);

  // Search & Debounce
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Filters
  const [filterService, setFilterService] = useState<string>('ALL');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<CrewRateRule | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Confirm Dialog State
  const [ruleToDelete, setRuleToDelete] = useState<CrewRateRule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Snapshot simulation state
  const [simRole, setSimRole] = useState<CrewRole>('DRIVER');
  const [simService, setSimService] = useState<CrewServiceType>('AKAP');
  const [simDays, setSimDays] = useState<number>(3);
  const [snapshotResult, setSnapshotResult] =
    useState<CrewRateSnapshotResult | null>(null);
  const [calculating, setCalculating] = useState(false);

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  const formatRoleLabel = (role: CrewRole) => {
    switch (role) {
      case 'DRIVER':
        return 'Driver Utama (Sopir 1)';
      case 'CO_DRIVER':
        return 'Co-Driver (Sopir 2)';
      case 'CONDUCTOR':
        return 'Kondektur / Kernet';
      case 'STEWARDESS':
        return 'Pramugari / Stewardess';
      default:
        return role;
    }
  };

  // Debounce search effect (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim().toUpperCase());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await CrewRateService.findAll({
        serviceType: filterService !== 'ALL' ? (filterService as CrewServiceType) : undefined,
        role: filterRole !== 'ALL' ? (filterRole as CrewRole) : undefined,
      });
      if (res?.data) {
        setRules(res.data);
      }
    } catch {
      toast.error('Gagal memuat aturan tarif kompensasi kru');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterService, filterRole]);

  const isFilterActive =
    searchInput.trim() !== '' ||
    filterService !== 'ALL' ||
    filterRole !== 'ALL' ||
    statusFilter !== 'ALL';

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setFilterService('ALL');
    setFilterRole('ALL');
    setStatusFilter('ALL');
  };

  const handleSubmit = async (formData: CrewRateRuleFormData) => {
    setModalLoading(true);
    try {
      if (selectedRule) {
        await CrewRateService.update(selectedRule.id, formData);
        toast.success(`Standar tarif untuk ${formatRoleLabel(formData.role)} berhasil diperbarui`);
      } else {
        await CrewRateService.create(formData);
        toast.success(`Standar tarif baru untuk ${formatRoleLabel(formData.role)} berhasil dibuat`);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan tarif kru');
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!ruleToDelete) return;
    setIsDeleting(true);
    try {
      await CrewRateService.delete(ruleToDelete.id);
      toast.success(`Aturan tarif kompensasi untuk ${formatRoleLabel(ruleToDelete.role)} berhasil dihapus.`);
      setRuleToDelete(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus aturan tarif kru.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSimulateSnapshot = async () => {
    setCalculating(true);
    try {
      const res = await CrewRateService.getRateSnapshot({
        role: simRole,
        serviceType: simService,
        durationDays: simService === 'TOURISM' ? Number(simDays) : 1,
      });
      if (res?.data) {
        setSnapshotResult(res.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengambil rate snapshot');
      setSnapshotResult(null);
    } finally {
      setCalculating(false);
    }
  };

  // Filtered Rules (Search + Status)
  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      if (statusFilter === 'ACTIVE' && !r.isActive) return false;
      if (statusFilter === 'INACTIVE' && r.isActive) return false;
      if (debouncedSearch) {
        const roleLabel = formatRoleLabel(r.role).toUpperCase();
        const roleName = r.role.toUpperCase();
        const service = r.serviceType.toUpperCase();
        const origin = (r.origin || '').toUpperCase();
        const dest = (r.destination || '').toUpperCase();
        if (
          !roleLabel.includes(debouncedSearch) &&
          !roleName.includes(debouncedSearch) &&
          !service.includes(debouncedSearch) &&
          !origin.includes(debouncedSearch) &&
          !dest.includes(debouncedSearch)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [rules, statusFilter, debouncedSearch]);

  // Dynamic KPI Stats
  const akapDriverRule = useMemo(
    () => rules.find((r) => r.serviceType === 'AKAP' && r.role === 'DRIVER' && r.isActive),
    [rules],
  );
  const akapConductorRule = useMemo(
    () => rules.find((r) => r.serviceType === 'AKAP' && r.role === 'CONDUCTOR' && r.isActive),
    [rules],
  );
  const tourismDriverRule = useMemo(
    () => rules.find((r) => r.serviceType === 'TOURISM' && r.role === 'DRIVER' && r.isActive),
    [rules],
  );
  const maxFullSeatBonus = useMemo(() => {
    const activeAkap = rules.filter((r) => r.serviceType === 'AKAP' && r.isActive);
    if (activeAkap.length === 0) return 50000;
    return Math.max(...activeAkap.map((r) => Number(r.fullSeatBonus || 0)));
  }, [rules]);

  return (
    <div className="space-y-6 p-6">
      {/* Header Halaman  sesuai Addendum v1.8 & v1.19*/}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Heading
          title="Standar Kompensasi & Tarif Kru Bus"
          description="Konfigurasi harga acuan dasar (Base Rate) uang makan, premi ritase/harian, dan bonus full seat kru (AKAP per Leg vs Wisata per Hari)."
        />
        {isCreate && (
          <Button
            onClick={() => {
              setSelectedRule(null);
              setIsModalOpen(true);
            }}
            className="h-9 text-xs gap-1.5"
          >
            <Plus className="h-4 w-4" /> Tambah Standar Tarif Kru
          </Button>
        )}
      </div>

      {/* Banner Edukasi Arsitektur Addendum v1.19 */}
      <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-xs text-foreground space-y-1.5 shadow-2xs">
        <div className="font-bold flex items-center gap-2 text-primary text-xs">
          <Info className="w-4 h-4 text-primary shrink-0" />
          <span>Prinsip Standar Acuan Dasar & Override Kesepakatan Lapangan:</span>
        </div>
        <p className="text-muted-foreground text-[11px] leading-relaxed">
          Angka-angka pada tabel di bawah merupakan <strong>Harga Acuan Dasar (Base Rate)</strong> yang otomatis ditarik sistem sebagai rekomendasi saat pembuatan SPJ.
          Untuk dinas <strong>AKAP</strong>, berlaku prinsip kesetaraan 1 Hari = 1 Leg (PP 2 Leg dihitung 2x tarif dasar, engkel dihitung 1x).
          Untuk dinas <strong>Wisata</strong>, dihitung per hari kalender dinas. Pada modal Review SPJ, Dispatcher tetap memiliki hak penuh menyesuaikan (override) nominal akhir sesuai kesepakatan lapangan.
        </p>
      </div>

      {/* Dynamic Summary Cards */}
      {loading ? (
        <MetricCardGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-primary">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">AKAP Driver (Per Rit PP)</CardDescription>
              <CardTitle className="text-2xl font-bold text-primary flex items-center justify-between">
                <span>
                  {akapDriverRule
                    ? formatCurrency(
                      Number(akapDriverRule.mealAllowance) +
                      Number(akapDriverRule.tripIncentive),
                    )
                    : 'Rp 400.000'}
                </span>
                <Compass className="h-5 w-5 opacity-40 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Makan: {akapDriverRule ? formatCurrency(akapDriverRule.mealAllowance) : '150k'} + Premi: {akapDriverRule ? formatCurrency(akapDriverRule.tripIncentive) : '250k'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-blue-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">AKAP Kondektur (Per Rit PP)</CardDescription>
              <CardTitle className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between">
                <span>
                  {akapConductorRule
                    ? formatCurrency(
                      Number(akapConductorRule.mealAllowance) +
                      Number(akapConductorRule.tripIncentive),
                    )
                    : 'Rp 250.000'}
                </span>
                <Users className="h-5 w-5 opacity-40 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Makan: {akapConductorRule ? formatCurrency(akapConductorRule.mealAllowance) : '100k'} + Premi: {akapConductorRule ? formatCurrency(akapConductorRule.tripIncentive) : '150k'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-emerald-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Wisata Driver (Per Hari)</CardDescription>
              <CardTitle className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                <span>
                  {tourismDriverRule
                    ? `${formatCurrency(
                      Number(tourismDriverRule.mealAllowance) +
                      Number(tourismDriverRule.tripIncentive),
                    )} / hr`
                    : 'Rp 250.000 / hr'}
                </span>
                <CalendarDays className="h-5 w-5 opacity-40 text-emerald-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Makan: {tourismDriverRule ? formatCurrency(tourismDriverRule.mealAllowance) : '100k'} + Premi: {tourismDriverRule ? formatCurrency(tourismDriverRule.tripIncentive) : '150k'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-amber-500">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Bonus Full Seat 100%</CardDescription>
              <CardTitle className="text-2xl font-bold text-amber-600 dark:text-amber-400 flex items-center justify-between">
                <span>{formatCurrency(maxFullSeatBonus)}</span>
                <Award className="h-5 w-5 opacity-40 text-amber-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Insentif okupansi penuh trayek AKAP
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'rules' | 'snapshot')}
        className="space-y-4"
      >
        <div className="flex justify-start">
          <TabsList className="bg-muted/70 p-1 rounded-xl h-auto flex flex-wrap gap-1 justify-start">
            <TabsTrigger
              value="rules"
              className="gap-2 py-1.5 px-3.5 text-xs font-semibold"
            >
              <Coins className="h-4 w-4" /> Tabel Master Tarif Dasar Kru ({rules.length})
            </TabsTrigger>
            <TabsTrigger
              value="snapshot"
              className="gap-2 py-1.5 px-3.5 text-xs font-semibold"
            >
              <Calculator className="h-4 w-4" /> Simulator Rate Snapshotting SPJ
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ==================== TAB 1: RULES TABLE ==================== */}
        <TabsContent value="rules" className="space-y-4 pt-1">
          {/* Toolbar Search & Multi-Filter */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              {/* Input Search */}
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari jabatan, layanan..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 pr-8 h-8.5 text-xs uppercase"
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

              {/* Filter Layanan */}
              <Select value={filterService} onValueChange={setFilterService}>
                <SelectTrigger className="w-full sm:w-44 h-8.5 text-xs">
                  <SelectValue placeholder="Semua Layanan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">Semua Layanan</SelectItem>
                  <SelectItem value="AKAP" className="text-xs">AKAP Reguler</SelectItem>
                  <SelectItem value="TOURISM" className="text-xs">Pariwisata / Charter</SelectItem>
                </SelectContent>
              </Select>

              {/* Filter Jabatan */}
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-full sm:w-48 h-8.5 text-xs">
                  <SelectValue placeholder="Semua Jabatan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">Semua Jabatan</SelectItem>
                  <SelectItem value="DRIVER" className="text-xs">Driver Utama (Sopir 1)</SelectItem>
                  <SelectItem value="CO_DRIVER" className="text-xs">Co-Driver (Sopir 2)</SelectItem>
                  <SelectItem value="CONDUCTOR" className="text-xs">Kondektur</SelectItem>
                  <SelectItem value="STEWARDESS" className="text-xs">Pramugari</SelectItem>
                </SelectContent>
              </Select>

              {/* Filter Status */}
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
                  <SelectItem value="ALL" className="text-xs">Semua Status</SelectItem>
                  <SelectItem value="ACTIVE" className="text-xs">Hanya Aktif</SelectItem>
                  <SelectItem value="INACTIVE" className="text-xs">Non-Aktif</SelectItem>
                </SelectContent>
              </Select>

              {/* Reset Filter Button */}
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

            <div className="text-xs text-muted-foreground font-medium shrink-0 self-end lg:self-auto">
              Menampilkan <strong className="text-foreground">{filteredRules.length}</strong> dari {rules.length} aturan tarif acuan
            </div>
          </div>

          {/* Table Container */}
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/80 dark:bg-white/5">
                <TableRow className="border-b border-slate-200/80 dark:border-white/10">
                  <TableHead className="w-48">Jabatan Kru</TableHead>
                  <TableHead className="w-44">Layanan & Basis</TableHead>
                  <TableHead className="text-right w-36">Uang Makan</TableHead>
                  <TableHead className="text-right w-36">Premi Ritase/Hari</TableHead>
                  <TableHead className="text-right w-36">Bonus Full Seat</TableHead>
                  <TableHead className="text-right w-44">Total Acuan Dasar</TableHead>
                  <TableHead className="w-24 text-center">Status</TableHead>
                  <TableHead className="text-right w-20">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
                {loading ? (
                  <TableSkeletonRows
                    rows={5}
                    colWidths={[
                      'w-32',
                      'w-28',
                      'w-24 ml-auto',
                      'w-24 ml-auto',
                      'w-20 ml-auto',
                      'w-24 ml-auto',
                      'w-16 mx-auto',
                      'w-14 ml-auto',
                    ]}
                  />
                ) : filteredRules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="p-3 rounded-full bg-primary/10 text-primary">
                          <Coins className="h-8 w-8 opacity-60" />
                        </div>
                        <h4 className="text-sm font-semibold text-foreground">
                          Tidak ada aturan tarif kompensasi yang cocok
                        </h4>
                        <p className="text-xs text-muted-foreground max-w-sm">
                          {isFilterActive
                            ? 'Tidak ada aturan kompensasi kru yang cocok dengan filter atau kata kunci pencarian.'
                            : 'Belum ada standar tarif acuan kru yang terdaftar.'}
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
                              onClick={() => {
                                setSelectedRule(null);
                                setIsModalOpen(true);
                              }}
                              className="text-xs gap-1.5 h-8 mt-1"
                            >
                              <Plus className="h-3.5 w-3.5" /> Tambah Standar Tarif Baru
                            </Button>
                          )
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRules.map((r) => {
                    const totalHak = Number(r.mealAllowance) + Number(r.tripIncentive);
                    return (
                      <TableRow
                        key={r.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors"
                      >
                        <TableCell className="font-semibold text-xs text-foreground">
                          {formatRoleLabel(r.role)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Badge
                              className={
                                r.serviceType === 'AKAP'
                                  ? 'bg-primary/10 text-primary border-primary/20 text-[10px]'
                                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[10px]'
                              }
                            >
                              {r.serviceType === 'AKAP' ? 'AKAP Reguler' : 'Pariwisata'}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              ({r.rateType === 'PER_TRIP' ? 'Per Rit PP' : 'Per Hari'})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-semibold">
                          {formatCurrency(r.mealAllowance)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-semibold">
                          {formatCurrency(r.tripIncentive)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {Number(r.fullSeatBonus) > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400 font-bold">
                              +{formatCurrency(r.fullSeatBonus)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-[11px]">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(totalHak)}
                          <span className="text-[10px] text-muted-foreground font-normal ml-1">
                            {r.rateType === 'PER_TRIP' ? '/rit' : '/hari'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={
                              r.isActive
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]'
                                : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20 text-[10px]'
                            }
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current mr-1 inline-block" />
                            {r.isActive ? 'Aktif' : 'Non-Aktif'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isUpdate && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  setSelectedRule(r);
                                  setIsModalOpen(true);
                                }}
                                title="Edit Standar Tarif"
                              >
                                <Edit className="h-3.5 w-3.5 text-primary" />
                              </Button>
                            )}
                            {isDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                onClick={() => setRuleToDelete(r)}
                                title="Hapus Standar Tarif"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ==================== TAB 2: SIMULATOR RATE SNAPSHOTTING SPJ (Addendum v1.8 & v1.19) ==================== */}
        <TabsContent value="snapshot" className="space-y-4 pt-1">
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs">
            <CardHeader className="p-4 pb-2 border-b border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Calculator className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Simulator Engine Rate Snapshotting SPJ
                  </CardTitle>
                  <CardDescription className="text-[11px]">
                    Uji perhitungan otomatis hak kompensasi kru yang akan di-snapshot saat SPJ terbit berdasarkan durasi Leg/Hari.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-3 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Jabatan Kru</label>
                  <Select
                    value={simRole}
                    onValueChange={(val) => setSimRole(val as CrewRole)}
                  >
                    <SelectTrigger className="h-8.5 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRIVER" className="text-xs">Driver Utama (Sopir 1)</SelectItem>
                      <SelectItem value="CO_DRIVER" className="text-xs">Co-Driver (Sopir 2)</SelectItem>
                      <SelectItem value="CONDUCTOR" className="text-xs">Kondektur / Kernet</SelectItem>
                      <SelectItem value="STEWARDESS" className="text-xs">Pramugari / Stewardess</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Jenis Layanan SPJ</label>
                  <Select
                    value={simService}
                    onValueChange={(val) => setSimService(val as CrewServiceType)}
                  >
                    <SelectTrigger className="h-8.5 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AKAP" className="text-xs">AKAP Reguler (Trayek PP)</SelectItem>
                      <SelectItem value="TOURISM" className="text-xs">Pariwisata / Sewa Bus (Harian)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {simService === 'TOURISM' ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-muted-foreground">Durasi Sewa (Hari)</label>
                      <div className="flex items-center gap-1">
                        {[1, 3, 5, 7].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setSimDays(d)}
                            className="text-[10px] px-1 rounded bg-muted hover:bg-muted/80 font-mono transition-colors"
                          >
                            {d}h
                          </button>
                        ))}
                      </div>
                    </div>
                    <Input
                      type="number"
                      min={1}
                      value={simDays}
                      onChange={(e) => setSimDays(Math.max(1, Number(e.target.value) || 1))}
                      className="h-8.5 font-mono text-xs"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Satuan Dinas AKAP</label>
                    <Input
                      disabled
                      value="1 Ritase PP (2 Leg Trayek)"
                      className="h-8.5 text-xs bg-muted/50 font-mono"
                    />
                  </div>
                )}

                <div>
                  <Button
                    onClick={handleSimulateSnapshot}
                    disabled={calculating}
                    className="w-full h-8.5 text-xs gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {calculating ? 'Menghitung...' : 'Hitung Snapshot Acuan'}
                  </Button>
                </div>
              </div>

              {snapshotResult && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200/80 dark:border-white/10 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      <span className="font-bold text-xs text-foreground">
                        {formatRoleLabel(snapshotResult.role)} — Layanan {snapshotResult.serviceType}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-semibold font-mono">
                        {snapshotResult.rateType === 'PER_TRIP'
                          ? 'Per Trip PP (2 Leg)'
                          : `${snapshotResult.durationDays} Hari Operasional`}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      Tanggal Snapshot: {snapshotResult.travelDate}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center sm:text-left">
                    <div>
                      <div className="text-[11px] text-muted-foreground">Uang Makan Acuan</div>
                      <div className="text-base font-bold font-mono text-foreground">
                        {formatCurrency(snapshotResult.mealAllowance)}
                      </div>
                      {snapshotResult.rateType === 'PER_DAY' && (
                        <div className="text-[10px] text-muted-foreground">
                          @{formatCurrency(snapshotResult.dailyMealAllowance)} &times; {snapshotResult.durationDays} hr
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-[11px] text-muted-foreground">Premi Dinas Acuan</div>
                      <div className="text-base font-bold font-mono text-foreground">
                        {formatCurrency(snapshotResult.tripIncentive)}
                      </div>
                      {snapshotResult.rateType === 'PER_DAY' && (
                        <div className="text-[10px] text-muted-foreground">
                          @{formatCurrency(snapshotResult.dailyTripIncentive)} &times; {snapshotResult.durationDays} hr
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-[11px] text-muted-foreground">Potensi Bonus Full Seat</div>
                      <div className="text-base font-bold font-mono text-amber-600 dark:text-amber-400">
                        {snapshotResult.fullSeatBonus > 0
                          ? formatCurrency(snapshotResult.fullSeatBonus)
                          : '-'}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {snapshotResult.fullSeatBonus > 0
                          ? 'Cair jika okupansi 100%'
                          : 'Tidak berlaku wisata'}
                      </div>
                    </div>

                    <div className="sm:border-l sm:pl-4">
                      <div className="text-[11px] text-muted-foreground font-semibold">
                        Total Rekomendasi Standar SPJ
                      </div>
                      <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(snapshotResult.totalStandardCompensation)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Form Tambah / Edit */}
      <CrewRateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        rule={selectedRule}
        loading={modalLoading}
      />

      {/* Confirm Dialog Hapus (Core Mandates: Zero Native Alert) */}
      <ConfirmDialog
        open={!!ruleToDelete}
        onOpenChange={(open) => !open && setRuleToDelete(null)}
        title="Hapus Standar Tarif Kompensasi Kru"
        description={`Apakah Anda yakin ingin menghapus aturan kompensasi dasar untuk ${ruleToDelete ? formatRoleLabel(ruleToDelete.role) : ''} (${ruleToDelete?.serviceType})?`}
        variant="danger"
        confirmText="Hapus Aturan"
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
