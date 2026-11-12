import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import ConfirmDialog from '@/components/shared/confirm-dialog';
import Heading from '@/components/shared/heading';
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
import type {
  CalculatedCoordinatorFeeResult,
  CalculatedMealResult,
  Coordinator,
  CoordinatorFormData,
  CoordinatorFeeRule,
  CoordinatorFeeRuleFormData,
  Restaurant,
  RestaurantFormData,
} from '@/types';
import {
  Calculator,
  Compass,
  Edit,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  Trash2,
  UserCheck,
  Utensils,
  Users,
  Building2,
  Landmark,
  Phone,
  ExternalLink,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import CoordinatorModal from './components/coordinator-modal';
import CoordinatorFeeModal from './components/coordinator-fee-modal';
import RestaurantModal from './components/restaurant-modal';

export default function PartnersPage() {
  const { isCreate, isUpdate, isDelete } = usePermission();
  const [activeTab, setActiveTab] = useState<'restaurants' | 'coordinators' | 'simulation'>('restaurants');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [coordinatorFees, setCoordinatorFees] = useState<CoordinatorFeeRule[]>([]);
  const [loading, setLoading] = useState(false);

  // Search & Filter Tab 1 (Rumah Makan)
  const [restSearchInput, setRestSearchInput] = useState('');
  const [debouncedRestSearch, setDebouncedRestSearch] = useState('');
  const [restCityFilter, setRestCityFilter] = useState('ALL');
  const [restSettlementFilter, setRestSettlementFilter] = useState('ALL');
  const [restStatusFilter, setRestStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Subtab & Filters Tab 2 (Koordinator)
  const [coordSubTab, setCoordSubTab] = useState<'master' | 'rules'>('master');
  const [masterCoordSearch, setMasterCoordSearch] = useState('');
  const [masterCoordTypeFilter, setMasterCoordTypeFilter] = useState<'ALL' | 'INDIVIDUAL' | 'ORGANIZATION'>('ALL');
  const [coordOriginFilter, setCoordOriginFilter] = useState('');
  const [coordDestinationFilter, setCoordDestinationFilter] = useState('');
  const [coordStatusFilter, setCoordStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals State
  const [isRestModalOpen, setIsRestModalOpen] = useState(false);
  const [selectedRest, setSelectedRest] = useState<Restaurant | null>(null);

  const [isCoordinatorModalOpen, setIsCoordinatorModalOpen] = useState(false);
  const [selectedCoordinator, setSelectedCoordinator] = useState<Coordinator | null>(null);

  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<CoordinatorFeeRule | null>(null);

  const [modalLoading, setModalLoading] = useState(false);

  // Confirm Dialog State
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'restaurant' | 'coordinator_master' | 'coordinator_fee';
    item: Restaurant | Coordinator | CoordinatorFeeRule;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Simulation State
  const [simRestId, setSimRestId] = useState('');
  const [simMealPax, setSimMealPax] = useState<number>(24);
  const [mealResult, setMealResult] = useState<CalculatedMealResult | null>(null);

  const [simCoordOrigin, setSimCoordOrigin] = useState('JAKARTA');
  const [simCoordDestination, setSimCoordDestination] = useState('YOGYAKARTA');
  const [simCoordPax, setSimCoordPax] = useState<number>(24);
  const [coordResult, setCoordResult] = useState<CalculatedCoordinatorFeeResult | null>(null);
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [restRes, feeRes, coordRes] = await Promise.all([
        PartnerService.findAllRestaurants(),
        PartnerService.findAllCoordinatorFees(),
        PartnerService.findAllCoordinators(),
      ]);

      if (restRes?.data) {
        setRestaurants(restRes.data);
        if (restRes.data.length > 0 && !simRestId) {
          setSimRestId(restRes.data[0].id);
        }
      }
      if (feeRes?.data) setCoordinatorFees(feeRes.data);
      if (coordRes?.data) setCoordinators(coordRes.data);
    } catch {
      toast.error('Gagal memuat data mitra rumah makan & koordinator');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  // Master Coordinator CRUD
  const handleCoordinatorSubmit = async (formData: CoordinatorFormData) => {
    setModalLoading(true);
    try {
      if (selectedCoordinator) {
        await PartnerService.updateCoordinator(selectedCoordinator.id, formData);
        toast.success(`Profil koordinator '${formData.name}' berhasil diperbarui`);
      } else {
        await PartnerService.createCoordinator(formData);
        toast.success(`Koordinator lapangan '${formData.name}' berhasil didaftarkan`);
      }
      setIsCoordinatorModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data koordinator');
    } finally {
      setModalLoading(false);
    }
  };

  // Coordinator Fee Rule CRUD
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
      } else if (itemToDelete.type === 'coordinator_master') {
        const kor = itemToDelete.item as Coordinator;
        await PartnerService.deleteCoordinator(kor.id);
        toast.success(`Koordinator lapangan '${kor.name}' berhasil dihapus`);
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

  // Filtered Master Coordinators
  const filteredMasterCoordinators = useMemo(() => {
    return coordinators.filter((c) => {
      if (masterCoordTypeFilter !== 'ALL' && c.type !== masterCoordTypeFilter) return false;
      if (masterCoordSearch) {
        const s = masterCoordSearch.toUpperCase();
        const matchCode = c.code.toUpperCase().includes(s);
        const matchName = c.name.toUpperCase().includes(s);
        const matchOrg = (c.organizationName || '').toUpperCase().includes(s);
        const matchArea = (c.area || '').toUpperCase().includes(s);
        const matchPhone = (c.phone || '').toUpperCase().includes(s);
        const matchBank = (c.bankAccountNumber || '').toUpperCase().includes(s);
        if (!matchCode && !matchName && !matchOrg && !matchArea && !matchPhone && !matchBank) {
          return false;
        }
      }
      return true;
    });
  }, [coordinators, masterCoordSearch, masterCoordTypeFilter]);

  // Filtered Coordinator Rules
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
  const activeCoordCount = useMemo(
    () => coordinators.filter((c) => c.isActive).length,
    [coordinators],
  );
  const avgRatePerPax = useMemo(() => {
    const activeRests = restaurants.filter((r) => r.isActive);
    if (activeRests.length === 0) return 25000;
    const total = activeRests.reduce((sum, r) => sum + Number(r.ratePerPax), 0);
    return Math.round(total / activeRests.length);
  }, [restaurants]);

  return (
    <div className="space-y-6 p-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Heading
          title="Restoran Mitra & Korlap Lapangan"
          description="Master rumah makan servis makan AKAP & data master koordinator lapangan eksternal lengkap dengan info rekening transfer."
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
          {activeTab === 'coordinators' && coordSubTab === 'master' && isCreate && (
            <Button
              onClick={() => {
                setSelectedCoordinator(null);
                setIsCoordinatorModalOpen(true);
              }}
              className="h-9 text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold"
            >
              <Plus className="h-4 w-4" /> Daftarkan Koordinator
            </Button>
          )}
          {activeTab === 'coordinators' && coordSubTab === 'rules' && isCreate && (
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

      {/* Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-200/60 dark:bg-zinc-800/60" />
          ))}
        </div>
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
              <CardDescription className="text-xs">Tarif Servis Makan</CardDescription>
              <CardTitle className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between">
                <span>{formatCurrency(avgRatePerPax)} <span className="text-sm font-semibold text-muted-foreground">/ pax</span></span>
                <Receipt className="h-5 w-5 opacity-40 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Standar Kupon Makan Penumpang AKAP
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-amber-500">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Koordinator Lapangan</CardDescription>
              <CardTitle className="text-2xl font-bold text-amber-700 dark:text-amber-400 flex items-center justify-between">
                <span>
                  {coordinators.length} <span className="text-sm font-semibold text-muted-foreground">Mitra Korlap</span>
                </span>
                <Users className="h-5 w-5 opacity-40 text-amber-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                <span className="text-emerald-600 font-semibold">{activeCoordCount} aktif</span> (Pengurus Jalur Barat, Timur, Tengah)
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-purple-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Aturan Fee per Rute</CardDescription>
              <CardTitle className="text-2xl font-bold text-purple-700 dark:text-purple-400 flex items-center justify-between">
                <span>
                  {coordinatorFees.length} <span className="text-sm font-semibold text-muted-foreground">Trayek</span>
                </span>
                <Compass className="h-5 w-5 opacity-40 text-purple-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Standar Rp 10.000 / pax per tiket terjual
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
              <Users className="h-4 w-4" /> Koordinator Lapangan ({coordinators.length} PIC / {coordinatorFees.length} Aturan)
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
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama RM, kota, lokasi..."
                  value={restSearchInput}
                  onChange={(e) => setRestSearchInput(e.target.value)}
                  className="pl-9 h-8.5 text-xs"
                />
              </div>

              <Select value={restCityFilter} onValueChange={setRestCityFilter}>
                <SelectTrigger className="w-full sm:w-36 h-8.5 text-xs">
                  <SelectValue placeholder="Semua Kota" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">Semua Wilayah</SelectItem>
                  <SelectItem value="SUBANG" className="text-xs">Subang</SelectItem>
                  <SelectItem value="GRINGSING" className="text-xs">Gringsing</SelectItem>
                  <SelectItem value="BATANG" className="text-xs">Batang</SelectItem>
                </SelectContent>
              </Select>

              <Select value={restSettlementFilter} onValueChange={setRestSettlementFilter}>
                <SelectTrigger className="w-full sm:w-44 h-8.5 text-xs">
                  <SelectValue placeholder="Metode Pembayaran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">Semua Settlement</SelectItem>
                  <SelectItem value="INVOICED_MONTHLY_AP" className="text-xs">Tagihan Bulanan AP</SelectItem>
                  <SelectItem value="PAID_BY_CREW_UJ" className="text-xs">Tunai Kas UJ Kru</SelectItem>
                </SelectContent>
              </Select>

              {isRestFilterActive && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetRestFilters}
                  className="h-8.5 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reset
                </Button>
              )}
            </div>

            <div className="text-xs text-muted-foreground font-medium">
              Menampilkan <strong className="text-foreground">{filteredRestaurants.length}</strong> rumah makan mitra
            </div>
          </div>

          {/* Table Rumah Makan */}
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/80 dark:bg-white/5">
                <TableRow className="border-b border-slate-200/80 dark:border-white/10">
                  <TableHead className="w-24">Kode</TableHead>
                  <TableHead className="min-w-48">Nama Rumah Makan &amp; Alamat</TableHead>
                  <TableHead className="w-32">Kota / Wilayah</TableHead>
                  <TableHead className="text-right w-36">Tarif / Pax</TableHead>
                  <TableHead className="w-44">Tipe Settlement</TableHead>
                  <TableHead className="w-40">Kontak PIC</TableHead>
                  <TableHead className="w-24 text-center">Status</TableHead>
                  <TableHead className="text-right w-20">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-xs text-muted-foreground">
                      Memuat data rumah makan...
                    </TableCell>
                  </TableRow>
                ) : filteredRestaurants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-xs text-muted-foreground">
                      Tidak ada rumah makan mitra yang cocok.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRestaurants.map((r) => (
                    <TableRow key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                      <TableCell className="font-mono font-bold text-xs text-primary">{r.code}</TableCell>
                      <TableCell>
                        <div className="font-bold text-xs text-foreground">{r.name}</div>
                        {r.address && <div className="text-[11px] text-muted-foreground line-clamp-1">{r.address}</div>}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-muted-foreground">{r.city}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs text-foreground">
                        {formatCurrency(r.ratePerPax)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            r.settlementType === 'INVOICED_MONTHLY_AP'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px]'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px]'
                          }
                        >
                          {r.settlementType === 'INVOICED_MONTHLY_AP' ? 'Tagihan AP Bulanan' : 'Tunai UJ Kru'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.contactPerson ? <div>👤 {r.contactPerson}</div> : null}
                        {r.phone && <div className="font-mono text-[11px]">📞 {r.phone}</div>}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={
                            r.isActive
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]'
                              : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20 text-[10px]'
                          }
                        >
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
                            >
                              <Edit className="h-3.5 w-3.5 text-primary" />
                            </Button>
                          )}
                          {isDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              onClick={() => setItemToDelete({ type: 'restaurant', item: r })}
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
          {/* Subtab Segmented Switcher */}
          <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-zinc-800">
              <Button
                size="sm"
                variant={coordSubTab === 'master' ? 'default' : 'ghost'}
                onClick={() => setCoordSubTab('master')}
                className={`h-7.5 text-xs font-semibold gap-1.5 rounded-lg ${
                  coordSubTab === 'master'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                    : 'text-muted-foreground'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Daftar Master Koordinator ({coordinators.length})
              </Button>
              <Button
                size="sm"
                variant={coordSubTab === 'rules' ? 'default' : 'ghost'}
                onClick={() => setCoordSubTab('rules')}
                className={`h-7.5 text-xs font-semibold gap-1.5 rounded-lg ${
                  coordSubTab === 'rules'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                    : 'text-muted-foreground'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                Aturan Tarif Fee per Rute ({coordinatorFees.length})
              </Button>
            </div>

            <div className="text-xs text-muted-foreground hidden sm:block">
              {coordSubTab === 'master'
                ? 'Kelola data PIC mitra eksternal, nomor WhatsApp, dan rekening bank transfer'
                : 'Aturan otomatisasi tarif fee per lembar tiket penumpang di SPJ'}
            </div>
          </div>

          {/* SUBTAB 1: DAFTAR MASTER KOORDINATOR */}
          {coordSubTab === 'master' && (
            <div className="space-y-4">
              {/* Toolbar Master Korlap */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs">
                <div className="flex flex-wrap items-center gap-2.5 flex-1">
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari kode, nama PIC, paguyuban, no rek..."
                      value={masterCoordSearch}
                      onChange={(e) => setMasterCoordSearch(e.target.value)}
                      className="pl-9 h-8.5 text-xs"
                    />
                  </div>

                  <Select
                    value={masterCoordTypeFilter}
                    onValueChange={(val: any) => setMasterCoordTypeFilter(val)}
                  >
                    <SelectTrigger className="w-full sm:w-44 h-8.5 text-xs">
                      <SelectValue placeholder="Tipe Entitas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL" className="text-xs">Semua Tipe</SelectItem>
                      <SelectItem value="ORGANIZATION" className="text-xs">Paguyuban / Organisasi</SelectItem>
                      <SelectItem value="INDIVIDUAL" className="text-xs">Perorangan (Personal)</SelectItem>
                    </SelectContent>
                  </Select>

                  {masterCoordSearch && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMasterCoordSearch('')}
                      className="h-8.5 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
                    </Button>
                  )}
                </div>

                <div className="text-xs text-muted-foreground font-medium">
                  Menampilkan <strong className="text-foreground">{filteredMasterCoordinators.length}</strong> koordinator lapangan
                </div>
              </div>

              {/* Tabel Master Koordinator */}
              <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50/80 dark:bg-white/5">
                    <TableRow className="border-b border-slate-200/80 dark:border-white/10">
                      <TableHead className="w-28">Kode Korlap</TableHead>
                      <TableHead className="min-w-56">Nama PIC &amp; Paguyuban</TableHead>
                      <TableHead className="w-36">Tipe</TableHead>
                      <TableHead className="min-w-44">Basis Operasional</TableHead>
                      <TableHead className="w-44">Kontak WhatsApp</TableHead>
                      <TableHead className="min-w-60">Rekening Tujuan Transfer</TableHead>
                      <TableHead className="w-24 text-center">Status</TableHead>
                      <TableHead className="text-right w-20">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-10 text-xs text-muted-foreground">
                          Memuat data master koordinator lapangan...
                        </TableCell>
                      </TableRow>
                    ) : filteredMasterCoordinators.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="py-12 text-center text-xs text-muted-foreground">
                          Belum ada master koordinator lapangan yang cocok.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMasterCoordinators.map((c) => (
                        <TableRow key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                          <TableCell className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400">
                            {c.code}
                          </TableCell>
                          <TableCell>
                            <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                              {c.name}
                            </div>
                            {c.organizationName && (
                              <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                                <Building2 className="w-3 h-3 text-blue-500" />
                                {c.organizationName}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                c.type === 'ORGANIZATION'
                                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px]'
                                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]'
                              }
                            >
                              {c.type === 'ORGANIZATION' ? 'Paguyuban' : 'Personal'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            <span className="font-semibold text-foreground block">{c.area}</span>
                            {c.address && (
                              <span className="text-[11px] text-muted-foreground line-clamp-1">{c.address}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            <a
                              href={`https://wa.me/${c.phone.replace(/^0/, '62').replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 font-semibold"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              {c.phone}
                              <ExternalLink className="w-3 h-3 opacity-60" />
                            </a>
                            {c.email && <div className="text-[11px] text-muted-foreground">{c.email}</div>}
                          </TableCell>
                          <TableCell>
                            <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/20 inline-block min-w-48">
                              <div className="flex items-center gap-1.5 font-bold text-xs text-amber-700 dark:text-amber-300">
                                <Landmark className="w-3.5 h-3.5" />
                                <span>{c.bankName}</span>
                                <span className="font-mono font-semibold tracking-wider text-foreground">
                                  {c.bankAccountNumber}
                                </span>
                              </div>
                              <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">
                                A.N. {c.bankAccountHolder}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={
                                c.isActive
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]'
                                  : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20 text-[10px]'
                              }
                            >
                              {c.isActive ? 'Aktif' : 'Non-Aktif'}
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
                                    setSelectedCoordinator(c);
                                    setIsCoordinatorModalOpen(true);
                                  }}
                                  title="Edit Koordinator"
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
                                    setItemToDelete({ type: 'coordinator_master', item: c })
                                  }
                                  title="Hapus Koordinator"
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
            </div>
          )}

          {/* SUBTAB 2: ATURAN FEE PER RUTE (TARIF PER PAX) */}
          {coordSubTab === 'rules' && (
            <div className="space-y-4">
              {/* Toolbar Multi-Filter Rules */}
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
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Reset
                    </Button>
                  )}
                </div>

                <div className="text-xs text-muted-foreground font-medium">
                  Menampilkan <strong className="text-foreground">{filteredCoordinators.length}</strong> aturan tarif rute
                </div>
              </div>

              <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50/80 dark:bg-white/5">
                    <TableRow className="border-b border-slate-200/80 dark:border-white/10">
                      <TableHead className="min-w-48">Rute Trayek (Asal &rarr; Tujuan)</TableHead>
                      <TableHead className="min-w-56">Master Rute</TableHead>
                      <TableHead className="min-w-64">Koordinator Lapangan Penerima</TableHead>
                      <TableHead className="text-right w-40">Besaran Fee / Pax</TableHead>
                      <TableHead className="w-24 text-center">Status</TableHead>
                      <TableHead className="text-right w-20">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-xs text-muted-foreground">
                          Memuat aturan tarif fee korlap...
                        </TableCell>
                      </TableRow>
                    ) : filteredCoordinators.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-12 text-center text-xs text-muted-foreground">
                          Tidak ada aturan tarif yang cocok.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCoordinators.map((f) => {
                        const kor = f.coordinator;
                        return (
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

                            <TableCell className="text-xs">
                              {f.route ? (
                                <div>
                                  <span className="font-semibold text-foreground font-mono">[{f.route.code}]</span>{' '}
                                  <span>{f.route.name}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-[11px] italic">
                                  Rute Manual (ALL)
                                </span>
                              )}
                            </TableCell>

                            <TableCell className="text-xs">
                              {kor ? (
                                <div>
                                  <div className="font-bold text-foreground flex items-center gap-1.5">
                                    <span className="text-amber-600 font-mono">[{kor.code}]</span> {kor.name}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                                    🏦 {kor.bankName} - {kor.bankAccountNumber} (A.N. {kor.bankAccountHolder})
                                  </div>
                                </div>
                              ) : f.coordinatorUser ? (
                                <div className="font-bold text-foreground">👤 {f.coordinatorUser.name}</div>
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
                                      setItemToDelete({ type: 'coordinator_fee', item: f })
                                    }
                                    title="Hapus Aturan Fee"
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
            </div>
          )}
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
                          className={`text-[10px] px-1.5 py-0.5 rounded ${
                            simMealPax === pax
                              ? 'bg-primary text-primary-foreground font-bold'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
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
                    onChange={(e) => setSimMealPax(Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-8.5 text-xs"
                  />
                </div>

                <div>
                  <Button
                    onClick={handleSimulateMeal}
                    disabled={simulating}
                    className="w-full h-8.5 text-xs gap-1.5"
                  >
                    <Calculator className="h-3.5 w-3.5" /> Hitung Beban
                  </Button>
                </div>
              </div>

              {mealResult && (
                <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-foreground flex items-center gap-2">
                      <span>{mealResult.restaurantName}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {mealResult.settlementType === 'INVOICED_MONTHLY_AP' ? 'Tagihan AP' : 'Tunai UJ'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {formatCurrency(mealResult.ratePerPax)} &times; {mealResult.paxCount} Pax
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-muted-foreground font-medium">Total Beban Makan</div>
                    <div className="text-2xl font-black font-mono text-primary">
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
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Kalkulator Fee Koordinator Lapangan
                  </CardTitle>
                  <CardDescription className="text-[11px]">
                    Simulasi kewajiban uang koordinasi rute perjalanan per lembar tiket terjual.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-3 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Kota Asal (Origin)</label>
                  <Input
                    value={simCoordOrigin}
                    onChange={(e) => setSimCoordOrigin(e.target.value.toUpperCase())}
                    className="h-8.5 text-xs uppercase"
                    placeholder="JAKARTA"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Kota Tujuan (Destination)</label>
                  <Input
                    value={simCoordDestination}
                    onChange={(e) => setSimCoordDestination(e.target.value.toUpperCase())}
                    className="h-8.5 text-xs uppercase"
                    placeholder="YOGYAKARTA"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Jumlah Penumpang (Pax)</label>
                  <Input
                    type="number"
                    min={1}
                    value={simCoordPax}
                    onChange={(e) => setSimCoordPax(Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-8.5 text-xs"
                  />
                </div>

                <div>
                  <Button
                    onClick={handleSimulateCoord}
                    disabled={simulating}
                    className="w-full h-8.5 text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                  >
                    <Calculator className="h-3.5 w-3.5" /> Hitung Fee
                  </Button>
                </div>
              </div>

              {coordResult && (
                <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-foreground flex items-center gap-2">
                      <span>Rute {coordResult.origin} &rarr; {coordResult.destination}</span>
                      {coordResult.coordinatorName && (
                        <Badge variant="outline" className="text-[10px] text-amber-700 dark:text-amber-300 border-amber-300">
                          PIC: {coordResult.coordinatorName}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                      Fee: {formatCurrency(coordResult.feePerPax)} &times; {coordResult.paxCount} Pax
                    </p>
                    {coordResult.bankName && (
                      <p className="text-[11px] text-amber-700 dark:text-amber-300 font-mono mt-0.5">
                        🏦 Rekening: {coordResult.bankName} - {coordResult.bankAccountNumber} (A.N. {coordResult.bankAccountHolder})
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-[11px] text-muted-foreground font-medium">Total Fee Jasa Korlap</div>
                    <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
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

      {/* Modal CRUD Master Koordinator Lapangan */}
      <CoordinatorModal
        isOpen={isCoordinatorModalOpen}
        onClose={() => setIsCoordinatorModalOpen(false)}
        onSubmit={handleCoordinatorSubmit}
        coordinator={selectedCoordinator}
        loading={modalLoading}
      />

      {/* Modal CRUD Aturan Fee Korlap */}
      <CoordinatorFeeModal
        isOpen={isFeeModalOpen}
        onClose={() => setIsFeeModalOpen(false)}
        onSubmit={handleFeeSubmit}
        rule={selectedFee}
        coordinators={coordinators}
        loading={modalLoading}
      />

      {/* Confirm Dialog Hapus */}
      <ConfirmDialog
        open={!!itemToDelete}
        onOpenChange={(open: boolean) => !open && setItemToDelete(null)}
        title={
          itemToDelete?.type === 'restaurant'
            ? 'Hapus Rumah Makan Mitra'
            : itemToDelete?.type === 'coordinator_master'
            ? 'Hapus Master Koordinator Lapangan'
            : 'Hapus Aturan Fee Korlap'
        }
        description={
          itemToDelete?.type === 'restaurant'
            ? `Apakah Anda yakin ingin menghapus rumah makan mitra '${(itemToDelete?.item as Restaurant)?.name}' (${(itemToDelete?.item as Restaurant)?.code})?`
            : itemToDelete?.type === 'coordinator_master'
            ? `Apakah Anda yakin ingin menghapus master koordinator lapangan '${(itemToDelete?.item as Coordinator)?.name}' (${(itemToDelete?.item as Coordinator)?.code})?`
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
