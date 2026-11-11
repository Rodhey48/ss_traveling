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
import { PartnerService } from '@/services/partner.service';
import { UserService } from '@/services/user.service';
import type {
  CalculatedCoordinatorFeeResult,
  CalculatedMealResult,
  CoordinatorFeeRule,
  CoordinatorFeeRuleFormData,
  Restaurant,
  RestaurantFormData,
  User,
} from '@/types';
import {
  Calculator,
  Compass,
  Edit,
  FileCheck2,
  MapPin,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  UserCheck,
  Utensils,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import CoordinatorFeeModal from './components/coordinator-fee-modal';
import RestaurantModal from './components/restaurant-modal';

export default function PartnersPage() {
  const { isCreate, isUpdate, isDelete } = usePermission();
  const [activeTab, setActiveTab] = useState<'restaurants' | 'coordinators' | 'simulation'>('restaurants');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [coordinatorFees, setCoordinatorFees] = useState<CoordinatorFeeRule[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Search & Filter Tab 1 (Rumah Makan)
  const [restSearchInput, setRestSearchInput] = useState('');
  const [debouncedRestSearch, setDebouncedRestSearch] = useState('');
  const [restCityFilter, setRestCityFilter] = useState('ALL');
  const [restSettlementFilter, setRestSettlementFilter] = useState('ALL');
  const [restStatusFilter, setRestStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Filter Tab 2 (Koordinator)
  const [coordOriginFilter, setCoordOriginFilter] = useState('');
  const [coordDestinationFilter, setCoordDestinationFilter] = useState('');
  const [coordStatusFilter, setCoordStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals State
  const [isRestModalOpen, setIsRestModalOpen] = useState(false);
  const [selectedRest, setSelectedRest] = useState<Restaurant | null>(null);

  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<CoordinatorFeeRule | null>(null);

  const [modalLoading, setModalLoading] = useState(false);

  // Confirm Dialog State
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'restaurant' | 'coordinator';
    item: Restaurant | CoordinatorFeeRule;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Simulation State
  const [simRestId, setSimRestId] = useState('');
  const [simMealPax, setSimMealPax] = useState<number>(24);
  const [mealResult, setMealResult] = useState<CalculatedMealResult | null>(null);

  const [simCoordOrigin, setSimCoordOrigin] = useState('JAKARTA');
  const [simCoordDestination, setSimCoordDestination] = useState('YOGYAKARTA');
  const [simCoordPax, setSimCoordPax] = useState<number>(24);
  const [coordResult, setCoordResult] =
    useState<CalculatedCoordinatorFeeResult | null>(null);
  const [simulating, setSimulating] = useState(false);

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
      setDebouncedRestSearch(restSearchInput.trim().toUpperCase());
    }, 300);
    return () => clearTimeout(timer);
  }, [restSearchInput]);

  const fetchDependencies = async () => {
    try {
      const userRes = await UserService.findAll({ limit: 100 });
      if (userRes?.data?.data) {
        setUsers(userRes.data.data);
      }
    } catch (err: unknown) {
      console.error('Failed fetching users', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [restRes, feeRes] = await Promise.all([
        PartnerService.findAllRestaurants(),
        PartnerService.findAllCoordinatorFees(),
      ]);

      if (restRes?.data) {
        setRestaurants(restRes.data);
        if (restRes.data.length > 0 && !simRestId) {
          setSimRestId(restRes.data[0].id);
        }
      }
      if (feeRes?.data) setCoordinatorFees(feeRes.data);
    } catch {
      toast.error('Gagal memuat data mitra rumah makan & fee korlap');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
    fetchData();
  }, []);

  // Filter Reset Handlers
  const isRestFilterActive =
    restSearchInput.trim() !== '' ||
    restCityFilter !== 'ALL' ||
    restSettlementFilter !== 'ALL' ||
    restStatusFilter !== 'ALL';

  const handleResetRestFilters = () => {
    setRestSearchInput('');
    setDebouncedRestSearch('');
    setRestCityFilter('ALL');
    setRestSettlementFilter('ALL');
    setRestStatusFilter('ALL');
  };

  const isCoordFilterActive =
    coordOriginFilter.trim() !== '' || coordDestinationFilter.trim() !== '' || coordStatusFilter !== 'ALL';

  const handleResetCoordFilters = () => {
    setCoordOriginFilter('');
    setCoordDestinationFilter('');
    setCoordStatusFilter('ALL');
  };

  // Restaurant CRUD
  const handleRestSubmit = async (formData: RestaurantFormData) => {
    setModalLoading(true);
    try {
      if (selectedRest) {
        await PartnerService.updateRestaurant(selectedRest.id, formData);
        toast.success(`Data rumah makan '${formData.name}' berhasil diperbarui`);
      } else {
        await PartnerService.createRestaurant(formData);
        toast.success(`Rumah makan mitra '${formData.name}' berhasil didaftarkan`);
      }
      setIsRestModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan rumah makan');
    } finally {
      setModalLoading(false);
    }
  };

  // Coordinator Fee CRUD
  const handleFeeSubmit = async (formData: CoordinatorFeeRuleFormData) => {
    setModalLoading(true);
    try {
      if (selectedFee) {
        await PartnerService.updateCoordinatorFee(selectedFee.id, formData);
        toast.success(`Aturan fee korlap Rute ${formData.origin}-${formData.destination} berhasil diperbarui`);
      } else {
        await PartnerService.createCoordinatorFee(formData);
        toast.success(`Aturan fee korlap Rute ${formData.origin}-${formData.destination} berhasil dibuat`);
      }
      setIsFeeModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan aturan fee korlap');
    } finally {
      setModalLoading(false);
    }
  };

  // Confirm Delete Handler
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      if (itemToDelete.type === 'restaurant') {
        const rest = itemToDelete.item as Restaurant;
        await PartnerService.deleteRestaurant(rest.id);
        toast.success(`Rumah makan mitra '${rest.name}' berhasil dihapus`);
      } else {
        const fee = itemToDelete.item as CoordinatorFeeRule;
        await PartnerService.deleteCoordinatorFee(fee.id);
        toast.success(`Aturan fee korlap Rute ${fee.origin}-${fee.destination} berhasil dihapus`);
      }
      setItemToDelete(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus entri');
    } finally {
      setIsDeleting(false);
    }
  };

  // Simulations
  const handleSimulateMeal = async () => {
    if (!simRestId) {
      toast.error('Pilih rumah makan terlebih dahulu');
      return;
    }
    setSimulating(true);
    try {
      const res = await PartnerService.calculateMealExpense({
        restaurantId: simRestId,
        paxCount: Math.max(1, Number(simMealPax) || 1),
      });
      if (res?.data) {
        setMealResult(res.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengkalkulasi kupon makan');
    } finally {
      setSimulating(false);
    }
  };

  const handleSimulateCoord = async () => {
    setSimulating(true);
    try {
      const res = await PartnerService.getFeeForRoute({
        origin: simCoordOrigin,
        destination: simCoordDestination,
        paxCount: Math.max(1, Number(simCoordPax) || 1),
      });
      if (res?.data) {
        setCoordResult(res.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengkalkulasi fee korlap');
    } finally {
      setSimulating(false);
    }
  };

  // Filtered Restaurants
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((r) => {
      if (restCityFilter !== 'ALL' && r.city.toUpperCase() !== restCityFilter) {
        return false;
      }
      if (restSettlementFilter !== 'ALL' && r.settlementType !== restSettlementFilter) {
        return false;
      }
      if (restStatusFilter === 'ACTIVE' && !r.isActive) return false;
      if (restStatusFilter === 'INACTIVE' && r.isActive) return false;
      if (debouncedRestSearch) {
        const matchName = r.name.toUpperCase().includes(debouncedRestSearch);
        const matchCode = r.code.toUpperCase().includes(debouncedRestSearch);
        const matchCity = r.city.toUpperCase().includes(debouncedRestSearch);
        const matchAddress = (r.address || '').toUpperCase().includes(debouncedRestSearch);
        const matchPIC = (r.contactPerson || '').toUpperCase().includes(debouncedRestSearch);
        if (!matchName && !matchCode && !matchCity && !matchAddress && !matchPIC) {
          return false;
        }
      }
      return true;
    });
  }, [restaurants, restCityFilter, restSettlementFilter, restStatusFilter, debouncedRestSearch]);

  // Filtered Coordinators
  const filteredCoordinators = useMemo(() => {
    return coordinatorFees.filter((f) => {
      if (coordOriginFilter.trim() !== '' && !f.origin.toUpperCase().includes(coordOriginFilter.toUpperCase())) return false;
      if (coordDestinationFilter.trim() !== '' && !f.destination.toUpperCase().includes(coordDestinationFilter.toUpperCase())) return false;
      if (coordStatusFilter === 'ACTIVE' && !f.isActive) return false;
      if (coordStatusFilter === 'INACTIVE' && f.isActive) return false;
      return true;
    });
  }, [coordinatorFees, coordOriginFilter, coordDestinationFilter, coordStatusFilter]);

  // Dynamic KPI Stats
  const activeRestCount = useMemo(
    () => restaurants.filter((r) => r.isActive).length,
    [restaurants],
  );
  const avgRatePerPax = useMemo(() => {
    const activeRests = restaurants.filter((r) => r.isActive);
    if (activeRests.length === 0) return 25000;
    const total = activeRests.reduce((sum, r) => sum + Number(r.ratePerPax), 0);
    return Math.round(total / activeRests.length);
  }, [restaurants]);

  const westFeeRule = useMemo(
    () => coordinatorFees.find((f) => f.origin === 'JAKARTA' && f.destination === 'YOGYAKARTA' && f.isActive),
    [coordinatorFees],
  );
  const eastFeeRule = useMemo(
    () => coordinatorFees.find((f) => f.origin === 'YOGYAKARTA' && f.destination === 'JAKARTA' && f.isActive),
    [coordinatorFees],
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Heading
          title="Restoran Mitra & Korlap Lapangan"
          description="Master rumah makan servis makan AKAP (kupon tagihan AP bulanan vs kasir UJ) & standardisasi fee jasa koordinator lapangan (Addendum v1.9)."
        />
        <div className="flex items-center gap-2">
          {activeTab === 'restaurants' && isCreate && (
            <Button
              onClick={() => {
                setSelectedRest(null);
                setIsRestModalOpen(true);
              }}
              className="h-9 text-xs gap-1.5"
            >
              <Plus className="h-4 w-4" /> Daftarkan Rumah Makan
            </Button>
          )}
          {activeTab === 'coordinators' && isCreate && (
            <Button
              onClick={() => {
                setSelectedFee(null);
                setIsFeeModalOpen(true);
              }}
              className="h-9 text-xs gap-1.5"
            >
              <Plus className="h-4 w-4" /> Tambah Aturan Fee Korlap
            </Button>
          )}
        </div>
      </div>

      {/* Dynamic Summary Cards */}
      {loading ? (
        <MetricCardGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-primary">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Rumah Makan Mitra</CardDescription>
              <CardTitle className="text-2xl font-black text-primary flex items-center justify-between">
                <span>{restaurants.length} <span className="text-sm font-semibold text-muted-foreground">Mitra</span></span>
                <Utensils className="h-5 w-5 opacity-40 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{activeRestCount} RM aktif</span> (Subang, Gringsing, Batang)
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-blue-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Tarif Rata-Rata Kupon Makan</CardDescription>
              <CardTitle className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between">
                <span>{formatCurrency(avgRatePerPax)} <span className="text-sm font-semibold text-muted-foreground">/ pax</span></span>
                <Receipt className="h-5 w-5 opacity-40 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Standar Kupon Servis Makan Penumpang AKAP
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-purple-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Fee Rute Jakarta &rarr; Yogya</CardDescription>
              <CardTitle className="text-2xl font-bold text-purple-700 dark:text-purple-400 flex items-center justify-between">
                <span>
                  {westFeeRule ? formatCurrency(westFeeRule.feePerPax) : 'Rp 10.000'}{' '}
                  <span className="text-sm font-semibold text-muted-foreground">/ pax</span>
                </span>
                <UserCheck className="h-5 w-5 opacity-40 text-purple-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Rute Keberangkatan (JAKARTA &rarr; YOGYAKARTA)
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-amber-500">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Fee Rute Yogya &rarr; Jakarta</CardDescription>
              <CardTitle className="text-2xl font-bold text-amber-700 dark:text-amber-400 flex items-center justify-between">
                <span>
                  {eastFeeRule ? formatCurrency(eastFeeRule.feePerPax) : 'Rp 10.000'}{' '}
                  <span className="text-sm font-semibold text-muted-foreground">/ pax</span>
                </span>
                <Compass className="h-5 w-5 opacity-40 text-amber-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Rute Kepulangan (YOGYAKARTA &rarr; JAKARTA)
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) =>
          setActiveTab(val as 'restaurants' | 'coordinators' | 'simulation')
        }
        className="space-y-4"
      >
        <div className="flex justify-start">
          <TabsList className="bg-muted/70 p-1 rounded-xl h-auto flex flex-wrap gap-1 justify-start">
            <TabsTrigger
              value="restaurants"
              className="gap-2 py-1.5 px-3.5 text-xs font-semibold"
            >
              <Utensils className="h-4 w-4" /> Rumah Makan Servis Makan ({restaurants.length})
            </TabsTrigger>
            <TabsTrigger
              value="coordinators"
              className="gap-2 py-1.5 px-3.5 text-xs font-semibold"
            >
              <UserCheck className="h-4 w-4" /> Fee Koordinator Lapangan ({coordinatorFees.length})
            </TabsTrigger>
            <TabsTrigger
              value="simulation"
              className="gap-2 py-1.5 px-3.5 text-xs font-semibold"
            >
              <Calculator className="h-4 w-4" /> Simulator Beban Kupon &amp; Fee Korlap
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ==================== TAB 1: RUMAH MAKAN ==================== */}
        <TabsContent value="restaurants" className="space-y-4 pt-1">
          {/* Toolbar Search & Multi-Filter */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              {/* Input Search */}
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama RM, kota, lokasi..."
                  value={restSearchInput}
                  onChange={(e) => setRestSearchInput(e.target.value)}
                  className="pl-9 pr-8 h-8.5 text-xs uppercase"
                />
                {restSearchInput && (
                  <button
                    type="button"
                    onClick={() => setRestSearchInput('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    title="Hapus pencarian"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Kota */}
              <Select value={restCityFilter} onValueChange={setRestCityFilter}>
                <SelectTrigger className="w-full sm:w-40 h-8.5 text-xs">
                  <SelectValue placeholder="Semua Kota" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">Semua Kota</SelectItem>
                  <SelectItem value="SUBANG" className="text-xs">Subang</SelectItem>
                  <SelectItem value="GRINGSING" className="text-xs">Gringsing</SelectItem>
                  <SelectItem value="BATANG" className="text-xs">Batang</SelectItem>
                </SelectContent>
              </Select>

              {/* Filter Mekanisme Pembayaran */}
              <Select
                value={restSettlementFilter}
                onValueChange={setRestSettlementFilter}
              >
                <SelectTrigger className="w-full sm:w-48 h-8.5 text-xs">
                  <SelectValue placeholder="Semua Mekanisme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">Semua Pembayaran</SelectItem>
                  <SelectItem value="INVOICED_MONTHLY_AP" className="text-xs">Tagihan AP Bulanan</SelectItem>
                  <SelectItem value="PAID_BY_CREW_UJ" className="text-xs">Tunai Kru / UJ SPJ</SelectItem>
                </SelectContent>
              </Select>

              {/* Filter Status */}
              <Select
                value={restStatusFilter}
                onValueChange={(val: 'ALL' | 'ACTIVE' | 'INACTIVE') =>
                  setRestStatusFilter(val)
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
              {isRestFilterActive && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetRestFilters}
                  className="h-8.5 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                  title="Reset seluruh filter"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reset
                </Button>
              )}
            </div>

            <div className="text-xs text-muted-foreground font-medium shrink-0 self-end lg:self-auto">
              Menampilkan <strong className="text-foreground">{filteredRestaurants.length}</strong> dari {restaurants.length} rumah makan mitra
            </div>
          </div>

          {/* Table Container */}
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/80 dark:bg-white/5">
                <TableRow className="border-b border-slate-200/80 dark:border-white/10">
                  <TableHead className="w-56">Kode & Nama Rumah Makan</TableHead>
                  <TableHead className="w-48">Kota / Lokasi Rest Area</TableHead>
                  <TableHead className="w-40">Telepon / PIC</TableHead>
                  <TableHead className="text-right w-36">Tarif / Pax</TableHead>
                  <TableHead className="w-44">Mekanisme Pembayaran</TableHead>
                  <TableHead className="w-24 text-center">Status</TableHead>
                  <TableHead className="text-right w-20">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
                {loading ? (
                  <TableSkeletonRows
                    rows={5}
                    colWidths={[
                      'w-40',
                      'w-32',
                      'w-28',
                      'w-24 ml-auto',
                      'w-28',
                      'w-16 mx-auto',
                      'w-14 ml-auto',
                    ]}
                  />
                ) : filteredRestaurants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="p-3 rounded-full bg-primary/10 text-primary">
                          <Utensils className="h-8 w-8 opacity-60" />
                        </div>
                        <h4 className="text-sm font-semibold text-foreground">
                          Tidak ada rumah makan mitra yang cocok
                        </h4>
                        <p className="text-xs text-muted-foreground max-w-sm">
                          {isRestFilterActive
                            ? 'Tidak ada rumah makan yang cocok dengan kriteria filter atau kata kunci pencarian.'
                            : 'Belum ada rumah makan mitra yang didaftarkan di sistem.'}
                        </p>
                        {isRestFilterActive ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleResetRestFilters}
                            className="text-xs gap-1.5 h-8 mt-1"
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Reset Filter
                          </Button>
                        ) : (
                          isCreate && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedRest(null);
                                setIsRestModalOpen(true);
                              }}
                              className="text-xs gap-1.5 h-8 mt-1"
                            >
                              <Plus className="h-3.5 w-3.5" /> Daftarkan Rumah Makan Baru
                            </Button>
                          )
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRestaurants.map((r) => (
                    <TableRow
                      key={r.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors"
                    >
                      <TableCell>
                        <div className="font-bold text-xs text-foreground">{r.name}</div>
                        <div className="text-[11px] font-mono text-muted-foreground">
                          {r.code}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs">
                          <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                          <span className="font-semibold">{r.city}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground line-clamp-1">
                          {r.address || '-'}
                        </div>
                      </TableCell>

                      <TableCell className="text-xs">
                        <div className="font-mono text-[11px]">{r.phone || '-'}</div>
                        <div className="text-muted-foreground text-[10px]">
                          {r.contactPerson ? `PIC: ${r.contactPerson}` : '-'}
                        </div>
                      </TableCell>

                      <TableCell className="text-right font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(r.ratePerPax)}
                      </TableCell>

                      <TableCell>
                        {r.settlementType === 'INVOICED_MONTHLY_AP' ? (
                          <Badge variant="outline" className="bg-blue-600/10 text-blue-700 dark:text-blue-400 border-blue-200 text-[10px]">
                            Tagihan AP Bulanan
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            Tunai Kru (UJ)
                          </Badge>
                        )}
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
                                setSelectedRest(r);
                                setIsRestModalOpen(true);
                              }}
                              title="Edit Rumah Makan"
                            >
                              <Edit className="h-3.5 w-3.5 text-primary" />
                            </Button>
                          )}
                          {isDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              onClick={() =>
                                setItemToDelete({ type: 'restaurant', item: r })
                              }
                              title="Hapus Rumah Makan"
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
          </Card>
        </TabsContent>

        {/* ==================== TAB 2: KOORDINATOR LAPANGAN ==================== */}
        <TabsContent value="coordinators" className="space-y-4 pt-1">
          {/* Toolbar Multi-Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <Input
                placeholder="Asal (Origin)"
                value={coordOriginFilter}
                onChange={(e) => setCoordOriginFilter(e.target.value)}
                className="w-full sm:w-32 h-8.5 text-xs uppercase"
              />
              <span className="text-xs text-muted-foreground px-1">&rarr;</span>
              <Input
                placeholder="Tujuan (Destination)"
                value={coordDestinationFilter}
                onChange={(e) => setCoordDestinationFilter(e.target.value)}
                className="w-full sm:w-32 h-8.5 text-xs uppercase"
              />

              <Select
                value={coordStatusFilter}
                onValueChange={(val: 'ALL' | 'ACTIVE' | 'INACTIVE') =>
                  setCoordStatusFilter(val)
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

              {isCoordFilterActive && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetCoordFilters}
                  className="h-8.5 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                  title="Reset filter rute"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reset
                </Button>
              )}
            </div>

            <div className="text-xs text-muted-foreground font-medium">
              Menampilkan <strong className="text-foreground">{filteredCoordinators.length}</strong> aturan fee korlap rute
            </div>
          </div>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/80 dark:bg-white/5">
                <TableRow className="border-b border-slate-200/80 dark:border-white/10">
                  <TableHead className="min-w-48">Rute Trayek (Asal &rarr; Tujuan)</TableHead>
                  <TableHead className="min-w-64">Cakupan / Keterangan Operasional</TableHead>
                  <TableHead className="w-56">Personel Korlap Terdaftar</TableHead>
                  <TableHead className="text-right w-40">Besaran Fee / Pax</TableHead>
                  <TableHead className="w-24 text-center">Status</TableHead>
                  <TableHead className="text-right w-20">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
                {loading ? (
                  <TableSkeletonRows
                    rows={4}
                    colWidths={[
                      'w-36',
                      'w-48',
                      'w-32',
                      'w-24 ml-auto',
                      'w-16 mx-auto',
                      'w-14 ml-auto',
                    ]}
                  />
                ) : filteredCoordinators.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="p-3 rounded-full bg-primary/10 text-primary">
                          <UserCheck className="h-8 w-8 opacity-60" />
                        </div>
                        <h4 className="text-sm font-semibold text-foreground">
                          Belum ada aturan fee korlap yang cocok
                        </h4>
                        <p className="text-xs text-muted-foreground max-w-sm">
                          {isCoordFilterActive
                            ? 'Tidak ada aturan fee korlap yang sesuai dengan filter rute.'
                            : 'Belum ada aturan fee koordinator lapangan yang dikonfigurasi.'}
                        </p>
                        {isCoordFilterActive ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleResetCoordFilters}
                            className="text-xs gap-1.5 h-8 mt-1"
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Reset Filter
                          </Button>
                        ) : (
                          isCreate && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedFee(null);
                                setIsFeeModalOpen(true);
                              }}
                              className="text-xs gap-1.5 h-8 mt-1"
                            >
                              <Plus className="h-3.5 w-3.5" /> Tambah Aturan Fee Korlap
                            </Button>
                          )
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCoordinators.map((f) => (
                    <TableRow
                      key={f.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors"
                    >
                      <TableCell className="font-bold text-xs text-foreground">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/10 px-2.5 py-1 rounded-md text-xs font-mono font-bold">
                            <span className="text-primary">{f.origin}</span>
                            <span className="text-muted-foreground">&rarr;</span>
                            <span className="text-primary">{f.destination}</span>
                          </div>
                          {f.origin === 'ALL' && f.destination === 'ALL' && (
                            <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-300">
                              Global Fallback
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {f.origin === 'ALL' && f.destination === 'ALL'
                          ? 'Berlaku umum untuk semua rute perjalanan tanpa konfigurasi tarif khusus'
                          : `Rute operasional dari ${f.origin} menuju ${f.destination}`}
                      </TableCell>

                      <TableCell className="text-xs">
                        {f.coordinatorUser ? (
                          <div className="font-bold text-foreground">{f.coordinatorUser.name}</div>
                        ) : (
                          <span className="text-muted-foreground italic text-[11px]">
                            Umum (Berlaku Semua SPJ)
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-right font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(f.feePerPax)}
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge
                          className={
                            f.isActive
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]'
                              : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20 text-[10px]'
                          }
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current mr-1 inline-block" />
                          {f.isActive ? 'Aktif' : 'Non-Aktif'}
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
                                setSelectedFee(f);
                                setIsFeeModalOpen(true);
                              }}
                              title="Edit Aturan Fee"
                            >
                              <Edit className="h-3.5 w-3.5 text-primary" />
                            </Button>
                          )}
                          {isDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              onClick={() =>
                                setItemToDelete({ type: 'coordinator', item: f })
                              }
                              title="Hapus Aturan Fee"
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
          </Card>
        </TabsContent>

        {/* ==================== TAB 3: SIMULATOR PENGELUARAN ==================== */}
        <TabsContent value="simulation" className="space-y-6 pt-1">
          {/* Section A: Meal Expense Simulation */}
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs">
            <CardHeader className="p-4 pb-2 border-b border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Utensils className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Kalkulator Servis Makan Penumpang (Addendum v1.9)
                  </CardTitle>
                  <CardDescription className="text-[11px]">
                    Simulasi beban konsumsi kupon makan bus dan mekanisme settlement akuntansinya.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-3 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Pilih Rumah Makan</label>
                  <Select value={simRestId} onValueChange={setSimRestId}>
                    <SelectTrigger className="h-8.5 text-xs">
                      <SelectValue placeholder="Pilih RM Mitra" />
                    </SelectTrigger>
                    <SelectContent>
                      {restaurants.map((rm) => (
                        <SelectItem key={rm.id} value={rm.id} className="text-xs">
                          {rm.name} ({rm.city}) — {formatCurrency(rm.ratePerPax)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-muted-foreground">Pax</label>
                    <div className="flex items-center gap-1">
                      {[12, 24, 32, 48].map((pax) => (
                        <button
                          key={pax}
                          type="button"
                          onClick={() => setSimMealPax(pax)}
                          className="text-[10px] px-1 rounded bg-muted hover:bg-muted/80 font-mono transition-colors"
                        >
                          {pax}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input
                    type="number"
                    min={1}
                    value={simMealPax}
                    onChange={(e) => setSimMealPax(Math.max(1, Number(e.target.value) || 1))}
                    className="h-8.5 font-mono text-xs font-bold"
                  />
                </div>

                <div>
                  <Button
                    onClick={handleSimulateMeal}
                    disabled={simulating}
                    className="w-full h-8.5 text-xs gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {simulating ? 'Menghitung...' : 'Hitung Biaya Konsumsi'}
                  </Button>
                </div>
              </div>

              {mealResult && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-foreground">{mealResult.restaurantName}</span>
                      <Badge variant="outline" className="text-[10px]">{mealResult.city}</Badge>
                      <Badge
                        className={
                          mealResult.requiresInvoiceAP
                            ? 'bg-blue-600/15 text-blue-700 dark:text-blue-400 border-blue-200 text-[10px]'
                            : 'bg-amber-600/15 text-amber-700 dark:text-amber-400 border-amber-200 text-[10px]'
                        }
                      >
                        {mealResult.requiresInvoiceAP
                          ? 'Posting: AP Tagihan Bulanan (Akun 21101)'
                          : 'Posting: Kasir / Uang Jalan Kru (Akun 13101)'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      Kupon {mealResult.paxCount} Pax &times; {formatCurrency(mealResult.ratePerPax)}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-[11px] text-muted-foreground font-medium">Total Beban Konsumsi</div>
                    <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(mealResult.totalExpense)}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section B: Coordinator Fee Simulation */}
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs">
            <CardHeader className="p-4 pb-2 border-b border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Kalkulator Fee Jasa Koordinator Lapangan (Korlap)
                  </CardTitle>
                  <CardDescription className="text-[11px]">
                    Simulasi otomatis: Kalkulasi fee berdasarkan Kota Asal dan Tujuan leg perjalanan SPJ.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-3 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Rute Asal (Origin)</label>
                  <Input
                    placeholder="JAKARTA"
                    value={simCoordOrigin}
                    onChange={(e) => setSimCoordOrigin(e.target.value.toUpperCase())}
                    className="h-8.5 font-mono text-xs uppercase"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Rute Tujuan (Destination)</label>
                  <Input
                    placeholder="YOGYAKARTA"
                    value={simCoordDestination}
                    onChange={(e) => setSimCoordDestination(e.target.value.toUpperCase())}
                    className="h-8.5 font-mono text-xs uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-muted-foreground">Pax</label>
                  </div>
                  <Input
                    type="number"
                    min={1}
                    value={simCoordPax}
                    onChange={(e) => setSimCoordPax(Math.max(1, Number(e.target.value) || 1))}
                    className="h-8.5 font-mono text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <Button
                  onClick={handleSimulateCoord}
                  disabled={simulating}
                  className="w-full h-8.5 text-xs gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {simulating ? 'Menghitung...' : 'Hitung Fee Korlap'}
                </Button>
              </div>

              {coordResult && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <FileCheck2 className="h-4 w-4 text-primary" />
                      <span className="font-bold text-xs text-foreground">
                        Rute {coordResult.origin} &rarr; {coordResult.destination}
                      </span>
                      {coordResult.coordinatorName && (
                        <Badge variant="outline" className="text-[10px]">
                          PIC: {coordResult.coordinatorName}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      Fee: {formatCurrency(coordResult.feePerPax)} &times; {coordResult.paxCount} Pax
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-[11px] text-muted-foreground font-medium">Total Fee Jasa Korlap</div>
                    <div className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
                      {formatCurrency(coordResult.totalFee)}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </TabsContent>
      </Tabs>

      {/* Modal CRUD Rumah Makan */}
      <RestaurantModal
        isOpen={isRestModalOpen}
        onClose={() => setIsRestModalOpen(false)}
        onSubmit={handleRestSubmit}
        restaurant={selectedRest}
        loading={modalLoading}
      />

      {/* Modal CRUD Fee Korlap */}
      <CoordinatorFeeModal
        isOpen={isFeeModalOpen}
        onClose={() => setIsFeeModalOpen(false)}
        onSubmit={handleFeeSubmit}
        rule={selectedFee}
        users={users}
        loading={modalLoading}
      />

      {/* Confirm Dialog Hapus (Core Mandates: Zero Native Alert) */}
      <ConfirmDialog
        open={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
        title={
          itemToDelete?.type === 'restaurant'
            ? 'Hapus Rumah Makan Mitra'
            : 'Hapus Aturan Fee Korlap'
        }
        description={
          itemToDelete?.type === 'restaurant'
            ? `Apakah Anda yakin ingin menghapus rumah makan mitra '${(itemToDelete?.item as Restaurant)?.name}' (${(itemToDelete?.item as Restaurant)?.code})?`
            : `Apakah Anda yakin ingin menghapus aturan fee koordinator lapangan untuk Rute ${(itemToDelete?.item as CoordinatorFeeRule)?.origin}-${(itemToDelete?.item as CoordinatorFeeRule)?.destination}?`
        }
        variant="danger"
        confirmText="Hapus Data"
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
