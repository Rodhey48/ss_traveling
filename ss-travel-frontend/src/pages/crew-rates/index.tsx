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
  Users,
  Compass,
  Award,
  Calculator,
  Edit,
  Trash2,
  CalendarDays,
  ShieldCheck,
} from 'lucide-react';
import CrewRateModal from './components/crew-rate-modal';
import { CrewRateService } from '@/services/crew-rate.service';
import type {
  CrewRateRule,
  CrewRateRuleFormData,
  CrewRole,
  CrewServiceType,
  CrewRateSnapshotResult,
} from '@/types';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/use-permission';

export default function CrewRatesPage() {
  const { isCreate, isUpdate, isDelete } = usePermission();
  const [activeTab, setActiveTab] = useState<'rules' | 'snapshot'>('rules');
  const [rules, setRules] = useState<CrewRateRule[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [filterService, setFilterService] = useState<string>('ALL');
  const [filterRole, setFilterRole] = useState<string>('ALL');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<CrewRateRule | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Snapshot simulation state
  const [simRole, setSimRole] = useState<CrewRole>('DRIVER');
  const [simService, setSimService] = useState<CrewServiceType>('AKAP');
  const [simDays, setSimDays] = useState<number>(3);
  const [snapshotResult, setSnapshotResult] =
    useState<CrewRateSnapshotResult | null>(null);
  const [calculating, setCalculating] = useState(false);

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
    } catch (err: any) {
      toast.error('Gagal memuat aturan tarif kompensasi kru');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterService, filterRole]);

  const handleSubmit = async (formData: CrewRateRuleFormData) => {
    setModalLoading(true);
    try {
      if (selectedRule) {
        await CrewRateService.update(selectedRule.id, formData);
        toast.success('Standar tarif kompensasi kru berhasil diperbarui');
      } else {
        await CrewRateService.create(formData);
        toast.success('Standar tarif kompensasi kru berhasil dibuat');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan tarif kru');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (rule: CrewRateRule) => {
    if (confirm(`Hapus aturan kompensasi ${rule.role} (${rule.serviceType})?`)) {
      try {
        await CrewRateService.delete(rule.id);
        toast.success('Aturan tarif kru berhasil dihapus');
        fetchData();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Gagal menghapus tarif kru');
      }
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

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Heading
          title="Standar Kompensasi & Tarif Kru"
          description="Konfigurasi uang makan, premi ritase/harian, bonus full seat kru (AKAP PER_TRIP vs Wisata PER_DAY) sesuai Addendum v1.8."
        />
        {isCreate && (
          <Button
            onClick={() => {
              setSelectedRule(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Tambah Standar Tarif Kru
          </Button>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-xs border-l-4 border-l-primary">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">AKAP Driver (Per Trip PP)</CardDescription>
            <CardTitle className="text-2xl font-bold text-primary flex items-center justify-between">
              Rp 400.000
              <Compass className="h-5 w-5 opacity-40" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-xs text-muted-foreground">
              Makan: 150k + Premi: 250k (+ Bonus 50k)
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-l-4 border-l-blue-600">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">AKAP Kondektur (Per Trip PP)</CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-600 flex items-center justify-between">
              Rp 250.000
              <Users className="h-5 w-5 opacity-40" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-xs text-muted-foreground">
              Makan: 100k + Premi: 150k (+ Bonus 50k)
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-l-4 border-l-purple-600">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Wisata Driver (Per Hari)</CardDescription>
            <CardTitle className="text-2xl font-bold text-purple-700 dark:text-purple-400 flex items-center justify-between">
              Rp 250.000 / hr
              <CalendarDays className="h-5 w-5 opacity-40" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-xs text-muted-foreground">
              Makan: 100k + Premi: 150k
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-l-4 border-l-amber-500">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Bonus Full Seat 100%</CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-700 dark:text-amber-400 flex items-center justify-between">
              Rp 50.000
              <Award className="h-5 w-5 opacity-40" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-xs text-muted-foreground">
              Insentif okupansi penuh trayek AKAP
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'rules' | 'snapshot')}
        className="space-y-4"
      >
        <div className="flex justify-start">
          <TabsList className="bg-muted p-1 rounded-xl h-auto flex flex-wrap gap-1 justify-start">
            <TabsTrigger
              value="rules"
              className="gap-2 py-1.5 px-3 text-xs sm:text-sm"
            >
              <Users className="h-4 w-4" /> Tabel Master Tarif Kru
            </TabsTrigger>
            <TabsTrigger
              value="snapshot"
              className="gap-2 py-1.5 px-3 text-xs sm:text-sm"
            >
              <Calculator className="h-4 w-4" /> Simulasi Rate Snapshotting SPJ
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: RULES TABLE */}
        <TabsContent value="rules" className="space-y-4 pt-2">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Select value={filterService} onValueChange={setFilterService}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Semua Layanan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Layanan</SelectItem>
                  <SelectItem value="AKAP">AKAP Reguler</SelectItem>
                  <SelectItem value="TOURISM">Pariwisata</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-[200px] h-9">
                  <SelectValue placeholder="Semua Jabatan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Jabatan</SelectItem>
                  <SelectItem value="DRIVER">Driver Utama</SelectItem>
                  <SelectItem value="CO_DRIVER">Co-Driver</SelectItem>
                  <SelectItem value="CONDUCTOR">Kondektur</SelectItem>
                  <SelectItem value="STEWARDESS">Pramugari</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              Menampilkan {rules.length} aturan tarif kru
            </div>
          </div>

          <Card className="shadow-xs">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jabatan Kru</TableHead>
                  <TableHead>Layanan & Basis</TableHead>
                  <TableHead className="text-right">Uang Makan</TableHead>
                  <TableHead className="text-right">Premi Ritase/Harian</TableHead>
                  <TableHead className="text-right">Bonus Full Seat</TableHead>
                  <TableHead className="text-right">Total Standar Hak</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Memuat tarif kompensasi kru...
                    </TableCell>
                  </TableRow>
                ) : rules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Tidak ada aturan kompensasi kru yang ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  rules.map((r) => {
                    const totalHak =
                      Number(r.mealAllowance) + Number(r.tripIncentive);
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-semibold text-sm">
                          {formatRoleLabel(r.role)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant={r.serviceType === 'AKAP' ? 'default' : 'secondary'}
                            >
                              {r.serviceType}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-mono">
                              ({r.rateType === 'PER_TRIP' ? 'Per Rit PP' : 'Per Hari'})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          Rp {Number(r.mealAllowance).toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          Rp {Number(r.tripIncentive).toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {Number(r.fullSeatBonus) > 0 ? (
                            <span className="text-amber-600 font-bold">
                              +Rp {Number(r.fullSeatBonus).toLocaleString('id-ID')}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          Rp {totalHak.toLocaleString('id-ID')}
                          <span className="text-[10px] text-muted-foreground font-normal ml-1">
                            {r.rateType === 'PER_TRIP' ? '/rit' : '/hari'}
                          </span>
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
                                  setSelectedRule(r);
                                  setIsModalOpen(true);
                                }}
                              >
                                <Edit className="h-3.5 w-3.5 text-primary" />
                              </Button>
                            )}
                            {isDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(r)}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
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

        {/* TAB 2: SIMULASI RATE SNAPSHOTTING SPJ */}
        <TabsContent value="snapshot" className="space-y-4 pt-2">
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-semibold">
                  Simulasi Engine Rate Snapshotting SPJ (Addendum v1.8)
                </CardTitle>
              </div>
              <CardDescription>
                Hak kompensasi kru di-snapshot saat SPJ terbit sehingga kebal terhadap perubahan master tarif di masa depan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Jabatan Kru</label>
                  <Select
                    value={simRole}
                    onValueChange={(val) => setSimRole(val as CrewRole)}
                  >
                    <SelectTrigger className="h-9 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRIVER">Driver Utama</SelectItem>
                      <SelectItem value="CO_DRIVER">Co-Driver</SelectItem>
                      <SelectItem value="CONDUCTOR">Kondektur</SelectItem>
                      <SelectItem value="STEWARDESS">Pramugari</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Jenis Layanan SPJ</label>
                  <Select
                    value={simService}
                    onValueChange={(val) => setSimService(val as CrewServiceType)}
                  >
                    <SelectTrigger className="h-9 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AKAP">AKAP Reguler (Per Ritase PP)</SelectItem>
                      <SelectItem value="TOURISM">Pariwisata / Sewa Bus (Harian)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {simService === 'TOURISM' && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Durasi Sewa (Hari)</label>
                    <Input
                      type="number"
                      min={1}
                      value={simDays}
                      onChange={(e) => setSimDays(Number(e.target.value))}
                      className="h-9 mt-1 font-mono"
                    />
                  </div>
                )}

                <div>
                  <Button
                    onClick={handleSimulateSnapshot}
                    disabled={calculating}
                    className="w-full h-9"
                  >
                    {calculating ? 'Menghitung...' : 'Snapshot Kompensasi'}
                  </Button>
                </div>
              </div>

              {snapshotResult && (
                <div className="p-4 rounded-lg bg-muted/40 border space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      <span className="font-bold text-sm">
                        {formatRoleLabel(snapshotResult.role)} — Layanan {snapshotResult.serviceType}
                      </span>
                      <Badge variant="outline">
                        {snapshotResult.rateType === 'PER_TRIP'
                          ? 'Per Trip PP'
                          : `${snapshotResult.durationDays} Hari Operasional`}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Snapshot Date: {snapshotResult.travelDate}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center sm:text-left">
                    <div>
                      <div className="text-xs text-muted-foreground">Total Uang Makan (Hak Kru)</div>
                      <div className="text-lg font-bold font-mono text-foreground">
                        Rp {snapshotResult.mealAllowance.toLocaleString('id-ID')}
                      </div>
                      {snapshotResult.rateType === 'PER_DAY' && (
                        <div className="text-[10px] text-muted-foreground">
                          @Rp {snapshotResult.dailyMealAllowance.toLocaleString('id-ID')} &times; {snapshotResult.durationDays} hr
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground">Total Premi Ritase/Harian</div>
                      <div className="text-lg font-bold font-mono text-foreground">
                        Rp {snapshotResult.tripIncentive.toLocaleString('id-ID')}
                      </div>
                      {snapshotResult.rateType === 'PER_DAY' && (
                        <div className="text-[10px] text-muted-foreground">
                          @Rp {snapshotResult.dailyTripIncentive.toLocaleString('id-ID')} &times; {snapshotResult.durationDays} hr
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground">Potensi Bonus Full Seat</div>
                      <div className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
                        {snapshotResult.fullSeatBonus > 0
                          ? `Rp ${snapshotResult.fullSeatBonus.toLocaleString('id-ID')}`
                          : '-'}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {snapshotResult.fullSeatBonus > 0
                          ? 'Cair jika okupansi 100%'
                          : 'Tidak berlaku'}
                      </div>
                    </div>

                    <div className="sm:border-l sm:pl-4">
                      <div className="text-xs text-muted-foreground font-semibold">
                        Total Standar Kompensasi SPJ
                      </div>
                      <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                        Rp {snapshotResult.totalStandardCompensation.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal */}
      <CrewRateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        rule={selectedRule}
        loading={modalLoading}
      />
    </div>
  );
}
