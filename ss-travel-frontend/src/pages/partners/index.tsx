import { useState, useEffect } from 'react';
import Heading from '@/components/shared/heading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Utensils,
  UserCheck,
  Edit,
  Trash2,
  Receipt,
  MapPin,
  FileCheck2,
} from 'lucide-react';
import RestaurantModal from './components/restaurant-modal';
import CoordinatorFeeModal from './components/coordinator-fee-modal';
import { PartnerService } from '@/services/partner.service';
import { UserService } from '@/services/user.service';
import type {
  Restaurant,
  RestaurantFormData,
  CoordinatorFeeRule,
  CoordinatorFeeRuleFormData,
  User,
  CalculatedMealResult,
  CalculatedCoordinatorFeeResult,
} from '@/types';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/use-permission';

export default function PartnersPage() {
  const { isCreate, isUpdate, isDelete } = usePermission();
  const [activeTab, setActiveTab] = useState<'restaurants' | 'coordinators' | 'simulation'>('restaurants');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [coordinatorFees, setCoordinatorFees] = useState<CoordinatorFeeRule[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [isRestModalOpen, setIsRestModalOpen] = useState(false);
  const [selectedRest, setSelectedRest] = useState<Restaurant | null>(null);

  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<CoordinatorFeeRule | null>(null);

  const [modalLoading, setModalLoading] = useState(false);

  // Simulation state
  const [simRestId, setSimRestId] = useState('');
  const [simMealPax, setSimMealPax] = useState<number>(24);
  const [mealResult, setMealResult] = useState<CalculatedMealResult | null>(null);

  const [simLegDirection, setSimLegDirection] = useState<'DEPARTURE' | 'RETURN'>('DEPARTURE');
  const [simCoordPax, setSimCoordPax] = useState<number>(24);
  const [coordResult, setCoordResult] =
    useState<CalculatedCoordinatorFeeResult | null>(null);
  const [simulating, setSimulating] = useState(false);

  const fetchDependencies = async () => {
    try {
      const userRes = await UserService.findAll({ limit: 100 });
      if (userRes?.data?.data) {
        setUsers(userRes.data.data);
      }
    } catch (err: any) {
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
    } catch (err: any) {
      toast.error('Gagal memuat data mitra & fee');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
    fetchData();
  }, []);

  // Restaurant CRUD
  const handleRestSubmit = async (formData: RestaurantFormData) => {
    setModalLoading(true);
    try {
      if (selectedRest) {
        await PartnerService.updateRestaurant(selectedRest.id, formData);
        toast.success('Data rumah makan mitra berhasil diperbarui');
      } else {
        await PartnerService.createRestaurant(formData);
        toast.success('Rumah makan mitra baru berhasil didaftarkan');
      }
      setIsRestModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan rumah makan');
    } finally {
      setModalLoading(false);
    }
  };

  const handleRestDelete = async (rest: Restaurant) => {
    if (confirm(`Hapus rumah makan mitra '${rest.name}'?`)) {
      try {
        await PartnerService.deleteRestaurant(rest.id);
        toast.success('Rumah makan mitra berhasil dihapus');
        fetchData();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Gagal menghapus rumah makan');
      }
    }
  };

  // Coordinator Fee CRUD
  const handleFeeSubmit = async (formData: CoordinatorFeeRuleFormData) => {
    setModalLoading(true);
    try {
      if (selectedFee) {
        await PartnerService.updateCoordinatorFee(selectedFee.id, formData);
        toast.success('Aturan fee korlap berhasil diperbarui');
      } else {
        await PartnerService.createCoordinatorFee(formData);
        toast.success('Aturan fee korlap berhasil dibuat');
      }
      setIsFeeModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan aturan fee korlap');
    } finally {
      setModalLoading(false);
    }
  };

  const handleFeeDelete = async (fee: CoordinatorFeeRule) => {
    if (confirm(`Hapus aturan fee korlap Zona ${fee.zone}?`)) {
      try {
        await PartnerService.deleteCoordinatorFee(fee.id);
        toast.success('Aturan fee korlap berhasil dihapus');
        fetchData();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Gagal menghapus aturan fee');
      }
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
        legDirection: simLegDirection,
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

  return (
    <div className="space-y-6 p-6">
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
            >
              <Plus className="mr-2 h-4 w-4" /> Daftarkan Rumah Makan
            </Button>
          )}
          {activeTab === 'coordinators' && isCreate && (
            <Button
              onClick={() => {
                setSelectedFee(null);
                setIsFeeModalOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Tambah Aturan Fee Korlap
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-xs border-l-4 border-l-primary">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Rumah Makan Mitra</CardDescription>
            <CardTitle className="text-2xl font-bold text-primary flex items-center justify-between">
              {restaurants.length} Rumah Makan
              <Utensils className="h-5 w-5 opacity-40" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-xs text-muted-foreground">
              Subang (Cipali), Gringsing, Batang
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-l-4 border-l-blue-600">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Tarif Kupon Makan</CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-600 flex items-center justify-between">
              Rp 25.000 / pax
              <Receipt className="h-5 w-5 opacity-40" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-xs text-muted-foreground">
              Standar Kupon Makan Penumpang AKAP
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-l-4 border-l-purple-600">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Fee Korlap Barat</CardDescription>
            <CardTitle className="text-2xl font-bold text-purple-700 dark:text-purple-400 flex items-center justify-between">
              Rp 10.000 / pax
              <UserCheck className="h-5 w-5 opacity-40" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-xs text-muted-foreground">
              Jabodetabek (Leg Keberangkatan)
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-l-4 border-l-amber-500">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Fee Korlap Timur</CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-700 dark:text-amber-400 flex items-center justify-between">
              Rp 10.000 / pax
              <UserCheck className="h-5 w-5 opacity-40" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-xs text-muted-foreground">
              Jateng &amp; DIY (Leg Kepulangan)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) =>
          setActiveTab(val as 'restaurants' | 'coordinators' | 'simulation')
        }
        className="space-y-4"
      >
        <div className="flex justify-start">
          <TabsList className="bg-muted p-1 rounded-xl h-auto flex flex-wrap gap-1 justify-start">
            <TabsTrigger
              value="restaurants"
              className="gap-2 py-1.5 px-3 text-xs sm:text-sm"
            >
              <Utensils className="h-4 w-4" /> Rumah Makan Servis Makan
            </TabsTrigger>
            <TabsTrigger
              value="coordinators"
              className="gap-2 py-1.5 px-3 text-xs sm:text-sm"
            >
              <UserCheck className="h-4 w-4" /> Fee Koordinator Lapangan
            </TabsTrigger>
            <TabsTrigger
              value="simulation"
              className="gap-2 py-1.5 px-3 text-xs sm:text-sm"
            >
              <Receipt className="h-4 w-4" /> Simulasi Pengeluaran
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: RESTAURANTS */}
        <TabsContent value="restaurants" className="space-y-4 pt-2">
          <Card className="shadow-xs overflow-x-auto">
            <Table className="min-w-[750px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Kode & Nama Rumah Makan</TableHead>
                  <TableHead>Kota / Lokasi</TableHead>
                  <TableHead>Telepon / PIC</TableHead>
                  <TableHead className="text-right">Tarif / Pax</TableHead>
                  <TableHead>Mekanisme Pembayaran</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Memuat daftar rumah makan mitra...
                    </TableCell>
                  </TableRow>
                ) : restaurants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Belum ada rumah makan mitra yang didaftarkan.
                    </TableCell>
                  </TableRow>
                ) : (
                  restaurants.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-semibold text-sm">{r.name}</div>
                        <div className="text-xs font-mono text-muted-foreground">
                          {r.code}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs">
                          <MapPin className="h-3 w-3 text-rose-500" />
                          <span className="font-semibold">{r.city}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground line-clamp-1">
                          {r.address || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div>{r.phone || '-'}</div>
                        <div className="text-muted-foreground">
                          {r.contactPerson ? `PIC: ${r.contactPerson}` : '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        Rp {Number(r.ratePerPax).toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell>
                        {r.settlementType === 'INVOICED_MONTHLY_AP' ? (
                          <Badge variant="outline" className="bg-blue-600/10 text-blue-700 dark:text-blue-400 border-blue-200">
                            Invoice AP Bulanan
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Tunai Kru UJ</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            r.isActive
                              ? 'text-emerald-700 dark:text-emerald-400 border-emerald-300 bg-emerald-600/10'
                              : 'text-zinc-500'
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
                              size="sm"
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
                              size="sm"
                              onClick={() => handleRestDelete(r)}
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

        {/* TAB 2: COORDINATORS */}
        <TabsContent value="coordinators" className="space-y-4 pt-2">
          <Card className="shadow-xs overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">Zona Wilayah</TableHead>
                  <TableHead className="min-w-[280px]">Cakupan Operasional</TableHead>
                  <TableHead className="min-w-[180px]">Personel Korlap Terdaftar</TableHead>
                  <TableHead className="text-right w-[140px]">Besaran Fee / Pax</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="text-right w-[90px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Memuat aturan fee korlap...
                    </TableCell>
                  </TableRow>
                ) : coordinatorFees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Belum ada aturan fee korlap yang dikonfigurasi.
                    </TableCell>
                  </TableRow>
                ) : (
                  coordinatorFees.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-bold text-sm">
                        <Badge
                          variant={f.zone === 'WEST' ? 'default' : 'secondary'}
                          className="mr-2"
                        >
                          ZONA {f.zone}
                        </Badge>
                        {f.zone === 'WEST' ? 'Wilayah Barat' : 'Wilayah Timur'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {f.zone === 'WEST'
                          ? 'Jabodetabek (Ciputat, Pulo Gebang, Rambutan, dsb) — Leg Berangkat'
                          : 'Jawa Tengah & DIY (Giwangan, Jombor, Sleman, Solo) — Leg Pulang'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {f.coordinatorUser ? (
                          <div className="font-medium">{f.coordinatorUser.name}</div>
                        ) : (
                          <span className="text-muted-foreground">
                            Umum (Dihitung per SPJ)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        Rp {Number(f.feePerPax).toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            f.isActive
                              ? 'text-emerald-700 dark:text-emerald-400 border-emerald-300 bg-emerald-600/10'
                              : 'text-zinc-500'
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
                              size="sm"
                              onClick={() => {
                                setSelectedFee(f);
                                setIsFeeModalOpen(true);
                              }}
                            >
                              <Edit className="h-3.5 w-3.5 text-primary" />
                            </Button>
                          )}
                          {isDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFeeDelete(f)}
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

        {/* TAB 3: SIMULASI PENGELUARAN */}
        <TabsContent value="simulation" className="space-y-6 pt-2">
          {/* Section A: Meal Expense Simulation */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Utensils className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-semibold">
                  Kalkulator Servis Makan Penumpang (Addendum v1.9)
                </CardTitle>
              </div>
              <CardDescription>
                Simulasi beban konsumsi kupon makan bus dan mekanisme settlement akuntansinya
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Pilih Rumah Makan</label>
                  <Select value={simRestId} onValueChange={setSimRestId}>
                    <SelectTrigger className="h-9 mt-1">
                      <SelectValue placeholder="Pilih RM Mitra" />
                    </SelectTrigger>
                    <SelectContent>
                      {restaurants.map((rm) => (
                        <SelectItem key={rm.id} value={rm.id}>
                          {rm.name} ({rm.city})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Jumlah Penumpang (Pax)</label>
                  <Input
                    type="number"
                    min={1}
                    value={simMealPax}
                    onChange={(e) => setSimMealPax(Number(e.target.value))}
                    className="h-9 mt-1 font-mono"
                  />
                </div>

                <div>
                  <Button
                    onClick={handleSimulateMeal}
                    disabled={simulating}
                    className="w-full h-9"
                  >
                    {simulating ? 'Menghitung...' : 'Hitung Biaya Konsumsi'}
                  </Button>
                </div>
              </div>

              {mealResult && (
                <div className="p-4 rounded-lg bg-muted/40 border flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{mealResult.restaurantName}</span>
                      <Badge variant="outline">{mealResult.city}</Badge>
                      <Badge
                        className={
                          mealResult.requiresInvoiceAP
                            ? 'bg-blue-600/15 text-blue-700 dark:text-blue-400 border-blue-200'
                            : 'bg-amber-600/15 text-amber-700 dark:text-amber-400 border-amber-200'
                        }
                      >
                        {mealResult.requiresInvoiceAP
                          ? 'Posting: AP Tagihan Bulanan (Akun 21101)'
                          : 'Posting: Kasir / Uang Jalan Kru (Akun 13101)'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Kupon {mealResult.paxCount} Pax &times; Rp {mealResult.ratePerPax.toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-muted-foreground font-medium">Total Beban Konsumsi</div>
                    <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                      Rp {mealResult.totalExpense.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section B: Coordinator Fee Simulation */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-semibold">
                  Kalkulator Fee Jasa Koordinator Lapangan (Korlap)
                </CardTitle>
              </div>
              <CardDescription>
                Simulasi otomatis: Leg Berangkat &rarr; Zona WEST vs Leg Pulang &rarr; Zona EAST
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Arah Leg Perjalanan</label>
                  <Select
                    value={simLegDirection}
                    onValueChange={(val) =>
                      setSimLegDirection(val as 'DEPARTURE' | 'RETURN')
                    }
                  >
                    <SelectTrigger className="h-9 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DEPARTURE">
                        Leg Berangkat (Barat &rarr; Timur / Zone WEST)
                      </SelectItem>
                      <SelectItem value="RETURN">
                        Leg Pulang (Timur &rarr; Barat / Zone EAST)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Jumlah Penumpang (Pax)</label>
                  <Input
                    type="number"
                    min={1}
                    value={simCoordPax}
                    onChange={(e) => setSimCoordPax(Number(e.target.value))}
                    className="h-9 mt-1 font-mono"
                  />
                </div>

                <div>
                  <Button
                    onClick={handleSimulateCoord}
                    disabled={simulating}
                    className="w-full h-9"
                  >
                    {simulating ? 'Menghitung...' : 'Hitung Fee Korlap'}
                  </Button>
                </div>
              </div>

              {coordResult && (
                <div className="p-4 rounded-lg bg-muted/40 border flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="h-4 w-4 text-primary" />
                      <span className="font-bold text-sm">
                        Zona {coordResult.zone} (
                        {coordResult.legDirection === 'DEPARTURE'
                          ? 'Barat / Ciputat'
                          : 'Timur / Yogya'}
                        )
                      </span>
                      {coordResult.coordinatorName && (
                        <Badge variant="outline">PIC: {coordResult.coordinatorName}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Fee: Rp {coordResult.feePerPax.toLocaleString('id-ID')} &times; {coordResult.paxCount} Pax
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-muted-foreground font-medium">Total Fee Jasa Korlap</div>
                    <div className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
                      Rp {coordResult.totalFee.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <RestaurantModal
        isOpen={isRestModalOpen}
        onClose={() => setIsRestModalOpen(false)}
        onSubmit={handleRestSubmit}
        restaurant={selectedRest}
        loading={modalLoading}
      />

      <CoordinatorFeeModal
        isOpen={isFeeModalOpen}
        onClose={() => setIsFeeModalOpen(false)}
        onSubmit={handleFeeSubmit}
        rule={selectedFee}
        users={users}
        loading={modalLoading}
      />
    </div>
  );
}
