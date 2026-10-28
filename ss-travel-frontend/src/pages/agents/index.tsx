import { useState, useEffect } from 'react';
import Heading from '@/components/shared/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  Building2,
  Globe,
  Percent,
  Calculator,
  Edit,
  Trash2,
  Coins,
  Route,
  ShieldAlert,
} from 'lucide-react';
import AgentModal from './components/agent-modal';
import CommissionRulesModal from './components/commission-rules-modal';
import { AgentService } from '@/services/agent.service';
import { VehicleService } from '@/services/vehicle.service';
import type {
  Agent,
  AgentFormData,
  AgentType,
  SeatClass,
  CalculatedCommissionResult,
} from '@/types';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/use-permission';

export default function AgentsPage() {
  const { isCreate, isUpdate, isDelete } = usePermission();
  const [activeTab, setActiveTab] = useState<'list' | 'simulation'>('list');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [seatClasses, setSeatClasses] = useState<SeatClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedCity, setSelectedCity] = useState<string>('ALL');

  // Modals
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [rulesAgent, setRulesAgent] = useState<Agent | null>(null);

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

  const fetchDependencies = async () => {
    try {
      const scRes = await VehicleService.getSeatClasses();
      if (scRes?.data) setSeatClasses(scRes.data);
    } catch (err: any) {
      console.error('Failed fetching seat classes', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await AgentService.findAll({
        search,
        agentType: selectedType !== 'ALL' ? (selectedType as AgentType) : undefined,
        city: selectedCity !== 'ALL' ? selectedCity : undefined,
      });
      if (res?.data) {
        setAgents(res.data);
        if (res.data.length > 0 && !calcAgentId) {
          setCalcAgentId(res.data[0].id);
        }
      }
    } catch (err: any) {
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
    } catch (err: any) {
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
  }, [search, selectedType, selectedCity]);

  useEffect(() => {
    if (activeTab === 'simulation') {
      fetchAgentsByRoute(simLeg);
    }
  }, [activeTab, simLeg]);

  const handleAgentSubmit = async (formData: AgentFormData) => {
    setModalLoading(true);
    try {
      if (selectedAgent) {
        await AgentService.update(selectedAgent.id, formData);
        toast.success('Data agen berhasil diperbarui');
      } else {
        await AgentService.create(formData);
        toast.success('Agen mitra baru berhasil didaftarkan');
      }
      setIsAgentModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data agen');
    } finally {
      setModalLoading(false);
    }
  };

  const handleAgentDelete = async (agent: Agent) => {
    if (confirm(`Hapus agen '${agent.name}'? Seluruh aturan komisi terkait akan terhapus.`)) {
      try {
        await AgentService.delete(agent.id);
        toast.success('Agen mitra berhasil dihapus');
        fetchData();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Gagal menghapus agen');
      }
    }
  };

  const handleCalculateCommission = async () => {
    if (!calcAgentId) {
      toast.error('Pilih agen terlebih dahulu');
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
      toast.error(err.response?.data?.message || 'Gagal mengkalkulasi komisi');
      setCommissionResult(null);
    } finally {
      setCalculating(false);
    }
  };

  const offlineCount = agents.filter((a) => a.agentType === 'OFFLINE').length;
  const otaCount = agents.filter((a) => a.agentType === 'ONLINE_OTA').length;
  const activeCount = agents.filter((a) => a.isActive).length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Heading
          title="Mitra Agen & Aturan Komisi"
          description="Pengelolaan agen fisik loket terminal vs Online OTA (RedBus, Traveloka), filter leg rute, dan aturan komisi penjualan."
        />
        {isCreate && (
          <Button
            onClick={() => {
              setSelectedAgent(null);
              setIsAgentModalOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Daftarkan Agen Baru
          </Button>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-xs border-l-4 border-l-primary">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Total Mitra Agen</CardDescription>
            <CardTitle className="text-2xl font-bold text-primary flex items-center justify-between">
              {agents.length} Mitra
              <Building2 className="h-5 w-5 opacity-40" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-xs text-muted-foreground">
              {activeCount} Agen Status Aktif
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-l-4 border-l-blue-600">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Agen Fisik Loket</CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-600 flex items-center justify-between">
              {offlineCount} Loket
              <Building2 className="h-5 w-5 opacity-40" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-xs text-muted-foreground">
              Komisi Flat per Tiket Terjual
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-l-4 border-l-purple-600">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Online OTA Partners</CardDescription>
            <CardTitle className="text-2xl font-bold text-purple-700 dark:text-purple-400 flex items-center justify-between">
              {otaCount} Platform
              <Globe className="h-5 w-5 opacity-40" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-xs text-muted-foreground">
              Komisi Persentase (10%)
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-l-4 border-l-amber-500">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Sistem Penyetoran</CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-700 dark:text-amber-400 flex items-center justify-between">
              3 Jalur Kas
              <Coins className="h-5 w-5 opacity-40" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-xs text-muted-foreground">
              Titip Kru SPJ, Kasir Pool, Bank
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'list' | 'simulation')}
        className="space-y-4"
      >
        <div className="flex justify-start">
          <TabsList className="bg-muted p-1 rounded-xl h-auto flex flex-wrap gap-1 justify-start">
            <TabsTrigger
              value="list"
              className="gap-2 py-1.5 px-3 text-xs sm:text-sm"
            >
              <Building2 className="h-4 w-4" /> Daftar Mitra Agen
            </TabsTrigger>
            <TabsTrigger
              value="simulation"
              className="gap-2 py-1.5 px-3 text-xs sm:text-sm"
            >
              <Calculator className="h-4 w-4" /> Smart Filter &amp; Kalkulator Komisi
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: DAFTAR AGEN */}
        <TabsContent value="list" className="space-y-4 pt-2">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-[240px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari agen, kode, telepon..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Kategori</SelectItem>
                  <SelectItem value="OFFLINE">Loket Fisik</SelectItem>
                  <SelectItem value="ONLINE_OTA">Online OTA</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue placeholder="Semua Kota" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Kota</SelectItem>
                  <SelectItem value="JAKARTA">Jakarta</SelectItem>
                  <SelectItem value="TANGERANG">Tangerang</SelectItem>
                  <SelectItem value="YOGYAKARTA">Yogyakarta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              Menampilkan {agents.length} agen terdaftar
            </div>
          </div>

          {/* Agents Table */}
          <Card className="shadow-xs">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode & Nama Agen</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Kota Domisili</TableHead>
                  <TableHead>Kontak / PIC</TableHead>
                  <TableHead>Penyetoran Kas</TableHead>
                  <TableHead className="text-center">Aturan Komisi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Memuat data mitra agen...
                    </TableCell>
                  </TableRow>
                ) : agents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Tidak ada mitra agen yang ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  agents.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="font-semibold text-sm">{a.name}</div>
                        <div className="text-xs font-mono text-muted-foreground">
                          {a.code}
                        </div>
                      </TableCell>
                      <TableCell>
                        {a.agentType === 'OFFLINE' ? (
                          <Badge variant="outline" className="bg-blue-600/10 text-blue-700 dark:text-blue-400 border-blue-200">
                            Loket Fisik
                          </Badge>
                        ) : (
                          <Badge className="bg-purple-600/15 text-purple-700 dark:text-purple-400 border-purple-200">Online OTA</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-semibold">
                          {a.city}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div>{a.phone}</div>
                        <div className="text-muted-foreground">
                          {a.contactPerson ? `PIC: ${a.contactPerson}` : '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono">
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
                          className="h-7 text-xs"
                        >
                          <Percent className="h-3 w-3 mr-1 text-primary" />
                          {a.commissionRules?.length || 0} Aturan
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            a.isActive
                              ? 'text-emerald-700 dark:text-emerald-400 border-emerald-300 bg-emerald-600/10'
                              : 'text-zinc-500'
                          }
                        >
                          {a.isActive ? 'Aktif' : 'Non-Aktif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isUpdate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedAgent(a);
                                setIsAgentModalOpen(true);
                              }}
                            >
                              <Edit className="h-3.5 w-3.5 text-primary" />
                            </Button>
                          )}
                          {isDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAgentDelete(a)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
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

        {/* TAB 2: SIMULASI SMART FILTER & KALKULATOR KOMISI */}
        <TabsContent value="simulation" className="space-y-6 pt-2">
          {/* Section A: Smart Filter by Leg Direction */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Route className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-semibold">
                  Validasi Smart Filter Arah Rute SPJ (Anti Human-Error, Addendum v1.7)
                </CardTitle>
              </div>
              <CardDescription>
                Mencegah kru salah memilih agen kota tujuan di leg keberangkatan saat deklarasi manifest tiket
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">Pilih Leg Perjalanan:</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={simLeg === 'DEPARTURE' ? 'default' : 'outline'}
                      onClick={() => setSimLeg('DEPARTURE')}
                    >
                      Leg Berangkat: Jakarta/Tgr &rarr; Yogya
                    </Button>
                    <Button
                      size="sm"
                      variant={simLeg === 'RETURN' ? 'default' : 'outline'}
                      onClick={() => setSimLeg('RETURN')}
                    >
                      Leg Pulang: Yogya &rarr; Jakarta/Tgr
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-muted/30 border rounded-lg">
                <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-primary" />
                  <span>
                    Daftar Agen Sah yang Boleh Dipilih pada Leg{' '}
                    <strong>{simLeg === 'DEPARTURE' ? 'Berangkat' : 'Pulang'}</strong>:
                  </span>
                </div>
                {routeLoading ? (
                  <div className="text-xs text-muted-foreground py-2">Memfilter agen...</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {routeAgents.map((ag) => (
                      <div
                        key={ag.id}
                        className="p-2 border rounded text-xs flex justify-between items-center bg-card"
                      >
                        <div>
                          <div className="font-semibold">{ag.name}</div>
                          <div className="text-muted-foreground font-mono">{ag.code}</div>
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
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-semibold">
                  Kalkulator Komisi Penjualan Tiket Otomatis
                </CardTitle>
              </div>
              <CardDescription>
                Simulasi pemotongan hak agen (Flat per Tiket vs Persentase OTA) & Net Payout Kas SS Traveling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Pilih Agen</label>
                  <Select value={calcAgentId} onValueChange={setCalcAgentId}>
                    <SelectTrigger className="h-9 mt-1">
                      <SelectValue placeholder="Pilih Agen" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((ag) => (
                        <SelectItem key={ag.id} value={ag.id}>
                          {ag.name} ({ag.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Kelas Kursi</label>
                  <Select value={calcSeatClassId} onValueChange={setCalcSeatClassId}>
                    <SelectTrigger className="h-9 mt-1">
                      <SelectValue placeholder="Semua Kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Semua Kelas</SelectItem>
                      {seatClasses.map((sc) => (
                        <SelectItem key={sc.id} value={sc.id}>
                          {sc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Harga Tiket (Rp)</label>
                  <Input
                    type="number"
                    min={0}
                    step={1000}
                    value={calcTicketPrice}
                    onChange={(e) => setCalcTicketPrice(Number(e.target.value))}
                    className="h-9 mt-1 font-mono"
                  />
                </div>

                <div>
                  <Button
                    onClick={handleCalculateCommission}
                    disabled={calculating}
                    className="w-full h-9"
                  >
                    {calculating ? 'Menghitung...' : 'Hitung Komisi'}
                  </Button>
                </div>
              </div>

              {commissionResult && (
                <div className="p-4 rounded-lg bg-muted/40 border flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{commissionResult.agentName}</span>
                      <Badge variant="outline">{commissionResult.seatClassName}</Badge>
                      <Badge variant="secondary" className="text-xs">
                        Skema: {commissionResult.ruleType === 'FLAT_PER_TICKET' ? 'Flat' : 'Persen'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Harga Tiket Terjual: Rp {commissionResult.ticketPrice.toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground font-medium">Potongan Komisi Agen</div>
                      <div className="text-xl font-bold text-rose-600 dark:text-rose-400">
                        Rp {commissionResult.calculatedCommission.toLocaleString('id-ID')}
                      </div>
                    </div>

                    <div className="text-right pl-6 border-l">
                      <div className="text-xs text-muted-foreground font-medium">Net Disetor ke SS Traveling</div>
                      <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        Rp {commissionResult.netPayoutToCompany.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AgentModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
        onSubmit={handleAgentSubmit}
        agent={selectedAgent}
        loading={modalLoading}
      />

      <CommissionRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        agent={rulesAgent}
        seatClasses={seatClasses}
      />
    </div>
  );
}
