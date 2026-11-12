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
  SelectGroup,
  SelectItem,
  SelectLabel,
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
import { AgentService } from '@/services/agent.service';
import { VehicleService } from '@/services/vehicle.service';
import type {
  Agent,
  AgentFormData,
  AgentType,
  CalculatedCommissionResult,
  SeatClass,
} from '@/types';
import { CITIES_BY_REGION, getOperatingCityLabel } from '@/constants/cities';
import {
  Building2,
  Calculator,
  Coins,
  Edit,
  Globe,
  Percent,
  Plus,
  RotateCcw,
  Route,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import AgentModal from './components/agent-modal';
import CommissionRulesModal from './components/commission-rules-modal';

export default function AgentsPage() {
  const { isCreate, isUpdate, isDelete } = usePermission();
  const [activeTab, setActiveTab] = useState<'list' | 'simulation'>('list');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [seatClasses, setSeatClasses] = useState<SeatClass[]>([]);
  const [loading, setLoading] = useState(false);

  // Search & Debounce
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Filters
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals state
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [rulesAgent, setRulesAgent] = useState<Agent | null>(null);

  // Confirm delete agent state
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Simulation State
  const [simLeg, setSimLeg] = useState<'DEPARTURE' | 'RETURN'>('DEPARTURE');
  const [routeAgents, setRouteAgents] = useState<Agent[]>([]);
  const [routeLoading, setRouteLoading] = useState(false);

  const [calcAgentId, setCalcAgentId] = useState('');
  const [calcSeatClassId, setCalcSeatClassId] = useState('ALL');
  const [calcTicketPrice, setCalcTicketPrice] = useState<number>(330000);
  const [commissionResult, setCommissionResult] =
    useState<CalculatedCommissionResult | null>(null);
  const [calculating, setCalculating] = useState(false);

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

  const fetchDependencies = async () => {
    try {
      const scRes = await VehicleService.getSeatClasses();
      if (scRes?.data) setSeatClasses(scRes.data);
    } catch (err: unknown) {
      console.error('Failed fetching seat classes', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await AgentService.findAll({
        search: debouncedSearch || undefined,
        agentType: selectedType !== 'ALL' ? (selectedType as AgentType) : undefined,
        city: selectedCity !== 'ALL' ? selectedCity : undefined,
        isActive:
          statusFilter === 'ACTIVE'
            ? true
            : statusFilter === 'INACTIVE'
              ? false
              : undefined,
      });
      if (res?.data) {
        setAgents(res.data);
        if (res.data.length > 0 && !calcAgentId) {
          setCalcAgentId(res.data[0].id);
        }
      }
    } catch {
      toast.error('Gagal memuat daftar mitra agen');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentsByRoute = async (leg: 'DEPARTURE' | 'RETURN') => {
    setRouteLoading(true);
    try {
      const origin = leg === 'DEPARTURE' ? 'JAKARTA' : 'YOGYAKARTA';
      const destination = leg === 'DEPARTURE' ? 'YOGYAKARTA' : 'JAKARTA';
      const res = await AgentService.findAgentsByRoute(origin, destination);
      if (res?.data) {
        setRouteAgents(res.data);
      }
    } catch {
      toast.error('Gagal memuat filter rute agen');
    } finally {
      setRouteLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    fetchData();
  }, [debouncedSearch, selectedType, selectedCity, statusFilter]);

  useEffect(() => {
    if (activeTab === 'simulation') {
      fetchAgentsByRoute(simLeg);
    }
  }, [activeTab, simLeg]);

  const isFilterActive =
    searchInput.trim() !== '' ||
    selectedType !== 'ALL' ||
    selectedCity !== 'ALL' ||
    statusFilter !== 'ALL';

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setSelectedType('ALL');
    setSelectedCity('ALL');
    setStatusFilter('ALL');
  };

  const handleAgentSubmit = async (formData: AgentFormData) => {
    setModalLoading(true);
    try {
      if (selectedAgent) {
        await AgentService.update(selectedAgent.id, formData);
        toast.success(`Data agen '${formData.name}' berhasil diperbarui`);
      } else {
        await AgentService.create(formData);
        toast.success(`Agen mitra baru '${formData.name}' berhasil didaftarkan`);
      }
      setIsAgentModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data agen');
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmDeleteAgent = async () => {
    if (!agentToDelete) return;
    setIsDeleting(true);
    try {
      await AgentService.delete(agentToDelete.id);
      toast.success(`Mitra agen '${agentToDelete.name}' berhasil dihapus`);
      setAgentToDelete(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus mitra agen');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCalculateCommission = async () => {
    if (!calcAgentId) {
      toast.error('Pilih mitra agen terlebih dahulu');
      return;
    }
    setCalculating(true);
    try {
      const res = await AgentService.calculateCommission({
        agentId: calcAgentId,
        seatClassId: calcSeatClassId === 'ALL' ? undefined : calcSeatClassId,
        ticketPrice: Number(calcTicketPrice),
      });
      if (res?.data) {
        setCommissionResult(res.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengkalkulasi komisi agen');
      setCommissionResult(null);
    } finally {
      setCalculating(false);
    }
  };

  const offlineCount = useMemo(
    () => agents.filter((a) => a.agentType === 'OFFLINE').length,
    [agents],
  );
  const otaCount = useMemo(
    () => agents.filter((a) => a.agentType === 'ONLINE_OTA').length,
    [agents],
  );
  const activeCount = useMemo(
    () => agents.filter((a) => a.isActive).length,
    [agents],
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Heading
          title="Mitra Agen & Aturan Komisi Tiket"
          description="Pengelolaan agen fisik loket terminal vs Online OTA (RedBus, Traveloka), smart route filter arah dinas, dan aturan komisi penjualan."
        />
        {isCreate && (
          <Button
            onClick={() => {
              setSelectedAgent(null);
              setIsAgentModalOpen(true);
            }}
            className="h-9 text-xs gap-1.5"
          >
            <Plus className="h-4 w-4" /> Daftarkan Agen Baru
          </Button>
        )}
      </div>

      {/* Metrics Cards */}
      {loading ? (
        <MetricCardGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-primary">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Total Mitra Agen</CardDescription>
              <CardTitle className="text-2xl font-black text-primary flex items-center justify-between">
                <span>{agents.length} <span className="text-sm font-semibold text-muted-foreground">Mitra</span></span>
                <Building2 className="h-5 w-5 opacity-40 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{activeCount} agen aktif</span> beroperasi
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-blue-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Agen Fisik Loket</CardDescription>
              <CardTitle className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between">
                <span>{offlineCount} <span className="text-sm font-semibold text-muted-foreground">Loket</span></span>
                <Building2 className="h-5 w-5 opacity-40 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Komisi Flat per Tiket Terjual
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-purple-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Online OTA Partners</CardDescription>
              <CardTitle className="text-2xl font-bold text-purple-700 dark:text-purple-400 flex items-center justify-between">
                <span>{otaCount} <span className="text-sm font-semibold text-muted-foreground">Platform</span></span>
                <Globe className="h-5 w-5 opacity-40 text-purple-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Komisi Persentase Platform (10%)
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-amber-500">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Sistem Penyetoran</CardDescription>
              <CardTitle className="text-2xl font-bold text-amber-700 dark:text-amber-400 flex items-center justify-between">
                <span>3 Jalur Kas</span>
                <Coins className="h-5 w-5 opacity-40 text-amber-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Titip Kru SPJ, Kasir Pool, Bank
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'list' | 'simulation')}
        className="space-y-4"
      >
        <div className="flex justify-start">
          <TabsList className="bg-muted/70 p-1 rounded-xl h-auto flex flex-wrap gap-1 justify-start">
            <TabsTrigger
              value="list"
              className="gap-2 py-1.5 px-3.5 text-xs font-semibold"
            >
              <Building2 className="h-4 w-4" /> Daftar Mitra Agen ({agents.length})
            </TabsTrigger>
            <TabsTrigger
              value="simulation"
              className="gap-2 py-1.5 px-3.5 text-xs font-semibold"
            >
              <Calculator className="h-4 w-4" /> Smart Route Filter &amp; Kalkulator Komisi
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ==================== TAB 1: DAFTAR AGEN ==================== */}
        <TabsContent value="list" className="space-y-4 pt-1">
          {/* Toolbar Search & Multi-Filter */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              {/* Input Search */}
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari agen, kode, telepon..."
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

              {/* Filter Kategori */}
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full sm:w-44 h-8.5 text-xs">
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">Semua Kategori</SelectItem>
                  <SelectItem value="OFFLINE" className="text-xs">Loket Fisik Terminal</SelectItem>
                  <SelectItem value="ONLINE_OTA" className="text-xs">Online OTA</SelectItem>
                </SelectContent>
              </Select>

              {/* Filter Kota */}
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-full sm:w-44 h-8.5 text-xs">
                  <SelectValue placeholder="Semua Kota" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="ALL" className="text-xs font-semibold">Semua Kota Domisili</SelectItem>
                  <SelectGroup>
                    <SelectLabel className="text-[11px] font-bold text-primary">Zona Barat</SelectLabel>
                    {CITIES_BY_REGION.WEST.map((c) => (
                      <SelectItem key={c.value} value={c.value} className="text-xs">
                        {c.shortLabel}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="text-[11px] font-bold text-amber-600 dark:text-amber-400">Zona Tengah</SelectLabel>
                    {CITIES_BY_REGION.CENTRAL.map((c) => (
                      <SelectItem key={c.value} value={c.value} className="text-xs">
                        {c.shortLabel}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="text-[11px] font-bold text-blue-600 dark:text-blue-400">Zona Timur</SelectLabel>
                    {CITIES_BY_REGION.EAST.map((c) => (
                      <SelectItem key={c.value} value={c.value} className="text-xs">
                        {c.shortLabel}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="text-[11px] font-bold text-purple-600 dark:text-purple-400">Nasional</SelectLabel>
                    {CITIES_BY_REGION.NATIONAL.map((c) => (
                      <SelectItem key={c.value} value={c.value} className="text-xs">
                        {c.shortLabel}
                      </SelectItem>
                    ))}
                  </SelectGroup>
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
              Menampilkan <strong className="text-foreground">{agents.length}</strong> agen mitra terdaftar
            </div>
          </div>

          {/* Agents Table */}
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/80 dark:bg-white/5">
                <TableRow className="border-b border-slate-200/80 dark:border-white/10">
                  <TableHead className="w-56">Kode & Nama Agen</TableHead>
                  <TableHead className="w-32">Kategori</TableHead>
                  <TableHead className="w-32">Kota Domisili</TableHead>
                  <TableHead className="w-44">Kontak / PIC</TableHead>
                  <TableHead className="w-40">Penyetoran Kas</TableHead>
                  <TableHead className="text-center w-36">Aturan Komisi</TableHead>
                  <TableHead className="w-24 text-center">Status</TableHead>
                  <TableHead className="text-right w-20">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
                {loading ? (
                  <TableSkeletonRows
                    rows={6}
                    colWidths={[
                      'w-40',
                      'w-24',
                      'w-24',
                      'w-28',
                      'w-24',
                      'w-24 mx-auto',
                      'w-16 mx-auto',
                      'w-14 ml-auto',
                    ]}
                  />
                ) : agents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="p-3 rounded-full bg-primary/10 text-primary">
                          <Building2 className="h-8 w-8 opacity-60" />
                        </div>
                        <h4 className="text-sm font-semibold text-foreground">
                          Tidak ada mitra agen yang cocok
                        </h4>
                        <p className="text-xs text-muted-foreground max-w-sm">
                          {isFilterActive
                            ? 'Tidak ada agen yang sesuai dengan kata kunci pencarian atau kombinasi filter.'
                            : 'Belum ada data mitra agen yang terdaftar di sistem.'}
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
                                setSelectedAgent(null);
                                setIsAgentModalOpen(true);
                              }}
                              className="text-xs gap-1.5 h-8 mt-1"
                            >
                              <Plus className="h-3.5 w-3.5" /> Daftarkan Agen Baru
                            </Button>
                          )
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  agents.map((a) => (
                    <TableRow
                      key={a.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors"
                    >
                      <TableCell>
                        <div className="font-bold text-xs text-foreground">{a.name}</div>
                        <div className="text-[11px] font-mono text-muted-foreground">
                          {a.code}
                        </div>
                      </TableCell>

                      <TableCell>
                        {a.agentType === 'OFFLINE' ? (
                          <Badge variant="outline" className="bg-blue-600/10 text-blue-700 dark:text-blue-400 border-blue-200 text-[10px]">
                            Loket Fisik
                          </Badge>
                        ) : (
                          <Badge className="bg-purple-600/15 text-purple-700 dark:text-purple-400 border-purple-200 text-[10px]">
                            Online OTA
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge variant="secondary" className="font-semibold text-[10px]" title={a.city}>
                          {getOperatingCityLabel(a.city)}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs">
                        <div className="font-mono text-[11px]">{a.phone}</div>
                        <div className="text-muted-foreground text-[10px]">
                          {a.contactPerson ? `PIC: ${a.contactPerson}` : '-'}
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="text-[11px] font-mono">
                          {a.settlementType === 'CASH_TO_CREW'
                            ? 'Titip Kru (SPJ)'
                            : a.settlementType === 'CASH_TO_OFFICE'
                              ? 'Kasir Pool'
                              : 'Transfer Bank'}
                        </span>
                      </TableCell>

                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRulesAgent(a);
                            setIsRulesModalOpen(true);
                          }}
                          className="h-7 text-xs gap-1"
                        >
                          <Percent className="h-3 w-3 text-primary" />
                          <span>{a.commissionRules?.length || 0} Aturan</span>
                        </Button>
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge
                          className={
                            a.isActive
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]'
                              : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20 text-[10px]'
                          }
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current mr-1 inline-block" />
                          {a.isActive ? 'Aktif' : 'Non-Aktif'}
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
                                setSelectedAgent(a);
                                setIsAgentModalOpen(true);
                              }}
                              title="Edit Profil Agen"
                            >
                              <Edit className="h-3.5 w-3.5 text-primary" />
                            </Button>
                          )}
                          {isDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              onClick={() => setAgentToDelete(a)}
                              title="Hapus Agen"
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

        {/* ==================== TAB 2: SMART ROUTE FILTER & KALKULATOR KOMISI  Addendum v1.7 ==================== */}
        <TabsContent value="simulation" className="space-y-6 pt-1">
          {/* Section A: Smart Filter by Leg Direction */}
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs">
            <CardHeader className="p-4 pb-2 border-b border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Route className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Validasi Smart Filter Arah Rute SPJ (Anti Human-Error)
                  </CardTitle>
                  <CardDescription className="text-[11px]">
                    Mencegah kru bus salah memilih agen kota tujuan di leg keberangkatan saat deklarasi manifest tiket.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-3 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <span className="text-xs font-semibold text-muted-foreground">Pilih Arah Leg Perjalanan Bus:</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={simLeg === 'DEPARTURE' ? 'default' : 'outline'}
                    onClick={() => setSimLeg('DEPARTURE')}
                    className="text-xs h-8"
                  >
                    Leg Berangkat: Jakarta/Tgr &rarr; Yogya
                  </Button>
                  <Button
                    size="sm"
                    variant={simLeg === 'RETURN' ? 'default' : 'outline'}
                    onClick={() => setSimLeg('RETURN')}
                    className="text-xs h-8"
                  >
                    Leg Pulang: Yogya &rarr; Jakarta/Tgr
                  </Button>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-xl space-y-2.5">
                <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-primary" />
                  <span>
                    Daftar Agen Sah yang Boleh Dipilih pada Leg{' '}
                    <strong className="text-foreground">{simLeg === 'DEPARTURE' ? 'Berangkat (Barat)' : 'Pulang (Timur)'}</strong>:
                  </span>
                </div>
                {routeLoading ? (
                  <div className="text-xs text-muted-foreground py-3">Memfilter daftar agen sah...</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {routeAgents.map((ag) => (
                      <div
                        key={ag.id}
                        className="p-2.5 border border-slate-200/80 dark:border-white/10 rounded-lg text-xs flex justify-between items-center bg-white dark:bg-zinc-900/80 shadow-2xs"
                      >
                        <div>
                          <div className="font-bold text-foreground text-xs">{ag.name}</div>
                          <div className="text-muted-foreground font-mono text-[10px]">{ag.code}</div>
                        </div>
                        <Badge
                          variant={ag.agentType === 'OFFLINE' ? 'outline' : 'secondary'}
                          className="text-[10px]"
                        >
                          {ag.city}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section B: Commission Calculator */}
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs">
            <CardHeader className="p-4 pb-2 border-b border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Calculator className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Kalkulator Komisi Penjualan Tiket Otomatis
                  </CardTitle>
                  <CardDescription className="text-[11px]">
                    Simulasi pemotongan hak agen (Flat per Tiket vs Persentase OTA) & Net Payout Kas SS Travelink.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-3 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Pilih Agen</label>
                  <Select value={calcAgentId} onValueChange={setCalcAgentId}>
                    <SelectTrigger className="h-8.5 text-xs">
                      <SelectValue placeholder="Pilih Agen" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((ag) => (
                        <SelectItem key={ag.id} value={ag.id} className="text-xs">
                          {ag.name} ({ag.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Kelas Kursi</label>
                  <Select value={calcSeatClassId} onValueChange={setCalcSeatClassId}>
                    <SelectTrigger className="h-8.5 text-xs">
                      <SelectValue placeholder="Semua Kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL" className="text-xs">Semua Kelas Kursi</SelectItem>
                      {seatClasses.map((sc) => (
                        <SelectItem key={sc.id} value={sc.id} className="text-xs">
                          {sc.name} ({sc.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-muted-foreground">Harga Tiket (Rp)</label>
                    <div className="flex items-center gap-1">
                      {[250000, 330000, 420000].map((pr) => (
                        <button
                          key={pr}
                          type="button"
                          onClick={() => setCalcTicketPrice(pr)}
                          className="text-[10px] px-1 rounded bg-muted hover:bg-muted/80 font-mono transition-colors"
                        >
                          {pr / 1000}k
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    step={1000}
                    value={calcTicketPrice}
                    onChange={(e) => setCalcTicketPrice(Number(e.target.value) || 0)}
                    className="h-8.5 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <Button
                    onClick={handleCalculateCommission}
                    disabled={calculating}
                    className="w-full h-8.5 text-xs gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {calculating ? 'Menghitung...' : 'Hitung Komisi'}
                  </Button>
                </div>
              </div>

              {commissionResult && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-foreground">{commissionResult.agentName}</span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {commissionResult.seatClassName || 'Semua Kelas'}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        Skema: {commissionResult.ruleType === 'FLAT_PER_TICKET' ? 'Flat per Tiket' : 'Persentase Platform'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      Harga Tiket Terjual: <strong className="text-foreground">{formatCurrency(commissionResult.ticketPrice)}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-[11px] text-muted-foreground font-medium">Potongan Komisi Agen</div>
                      <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
                        {formatCurrency(commissionResult.calculatedCommission)}
                      </div>
                    </div>

                    <div className="text-right pl-6 border-l border-slate-200/80 dark:border-white/10">
                      <div className="text-[11px] text-muted-foreground font-medium">Net Disetor ke SS Travelink</div>
                      <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(commissionResult.netPayoutToCompany)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal CRUD Agen */}
      <AgentModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
        onSubmit={handleAgentSubmit}
        agent={selectedAgent}
        loading={modalLoading}
      />

      {/* Modal Aturan Komisi */}
      <CommissionRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        agent={rulesAgent}
        seatClasses={seatClasses}
      />

      {/* Confirm Dialog Hapus Agen (Core Mandates: Zero Native Alert) */}
      <ConfirmDialog
        open={!!agentToDelete}
        onOpenChange={(open) => !open && setAgentToDelete(null)}
        title="Hapus Mitra Agen Penjualan"
        description={`Apakah Anda yakin ingin menghapus agen '${agentToDelete?.name}' (${agentToDelete?.code})? Seluruh aturan komisi yang terkait dengan agen ini akan ikut terhapus.`}
        variant="danger"
        confirmText="Hapus Agen"
        onConfirm={handleConfirmDeleteAgent}
        isLoading={isDeleting}
      />
    </div>
  );
}
