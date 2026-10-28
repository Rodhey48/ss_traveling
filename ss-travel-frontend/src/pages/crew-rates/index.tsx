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
  Info,
  Coins,
  Sparkles,
} from 'lucide-react';
import CrewRateModal from './components/crew-rate-modal';
import ConfirmDialog from '@/components/shared/confirm-dialog';
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

  // Confirm Dialog State (Core Mandate: No browser confirm)
  const [ruleToDelete, setRuleToDelete] = useState<CrewRateRule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    } catch {
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
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Heading
            title="Standar Kompensasi & Tarif Kru"
            description="Konfigurasi harga acuan dasar (Base Rate) uang makan, premi ritase/harian, dan bonus full seat kru (AKAP per Leg vs Wisata per Hari) sesuai Addendum v1.8 & v1.19."
          />
        </div>
        {isCreate && (
          <Button
            onClick={() => {
              setSelectedRule(null);
              setIsModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
          >
            <Plus className="mr-2 h-4 w-4" /> Tambah Standar Tarif Kru
          </Button>
        )}
      </div>

      {/* Banner Edukasi Arsitektur Addendum v1.19 */}
      <div className="p-4 rounded-xl border border-indigo-200/80 bg-indigo-50/40 dark:bg-indigo-950/20 text-xs text-foreground space-y-1.5 shadow-2xs">
        <div className="font-bold flex items-center gap-2 text-indigo-950 dark:text-indigo-200 text-xs">
          <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>Prinsip Standar Acuan Dasar & Override Kesepakatan (Addendum v1.19):</span>
        </div>
        <p className="text-muted-foreground text-[11px] leading-relaxed">
          Angka-angka pada tabel di bawah merupakan <strong>Harga Acuan Dasar (Base Rate)</strong> yang otomatis ditarik sistem sebagai rekomendasi saat pembuatan SPJ.
          Untuk dinas <strong>AKAP</strong>, berlaku prinsip kesetaraan 1 Hari = 1 Leg (PP 2 Leg dihitung 2x tarif dasar, engkel dihitung 1x).
          Untuk dinas <strong>Wisata</strong>, dihitung per hari kalender dinas. Pada modal Review SPJ, Dispatcher tetap memiliki hak penuh menyesuaikan (override) nominal akhir sesuai kesepakatan lapangan.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-xs border-l-4 border-l-indigo-600">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">AKAP Driver (Per Rit PP)</CardDescription>
            <CardTitle className="text-2xl font-bold text-indigo-700 dark:text-indigo-400 flex items-center justify-between">
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

        <Card className="shadow-xs border-l-4 border-l-sky-600">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">AKAP Kondektur (Per Rit PP)</CardDescription>
            <CardTitle className="text-2xl font-bold text-sky-700 dark:text-sky-400 flex items-center justify-between">
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
              className="gap-2 py-1.5 px-3 text-xs sm:text-sm font-semibold"
            >
              <Coins className="h-4 w-4" /> Tabel Master Tarif Dasar Kru
            </TabsTrigger>
            <TabsTrigger
              value="snapshot"
              className="gap-2 py-1.5 px-3 text-xs sm:text-sm font-semibold"
            >
              <Calculator className="h-4 w-4" /> Simulator Rate Snapshotting SPJ
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: RULES TABLE */}
        <TabsContent value="rules" className="space-y-4 pt-2">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border shadow-2xs">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Select value={filterService} onValueChange={setFilterService}>
                <SelectTrigger className="w-[180px] h-9 text-xs">
                  <SelectValue placeholder="Semua Layanan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Layanan</SelectItem>
                  <SelectItem value="AKAP">AKAP Reguler</SelectItem>
                  <SelectItem value="TOURISM">Pariwisata / Charter</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-[200px] h-9 text-xs">
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
              Menampilkan {rules.length} aturan tarif acuan kru
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
                  <TableHead className="text-right">Total Acuan Dasar</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs">
                      Memuat tarif acuan kompensasi kru...
                    </TableCell>
                  </TableRow>
                ) : rules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs">
                      Tidak ada aturan kompensasi kru yang ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  rules.map((r) => {
                    const totalHak =
                      Number(r.mealAllowance) + Number(r.tripIncentive);
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-semibold text-xs sm:text-sm">
                          {formatRoleLabel(r.role)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Badge
                              className={
                                r.serviceType === 'AKAP'
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }
                            >
                              {r.serviceType}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-mono">
                              ({r.rateType === 'PER_TRIP' ? 'Per Rit PP' : 'Per Hari'})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs sm:text-sm">
                          Rp {Number(r.mealAllowance).toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs sm:text-sm">
                          Rp {Number(r.tripIncentive).toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs sm:text-sm">
                          {Number(r.fullSeatBonus) > 0 ? (
                            <span className="text-amber-600 font-bold">
                              +Rp {Number(r.fullSeatBonus).toLocaleString('id-ID')}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
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
                                ? 'text-emerald-700 dark:text-emerald-400 border-emerald-300 bg-emerald-600/10 text-[10px]'
                                : 'text-zinc-500 text-[10px]'
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
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-3.5 w-3.5 text-indigo-600" />
                              </Button>
                            )}
                            {isDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setRuleToDelete(r)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-rose-600" />
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
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-indigo-600" />
                <CardTitle className="text-base font-semibold">
                  Simulator Engine Rate Snapshotting SPJ (Addendum v1.8 & v1.19)
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Uji perhitungan otomatis hak kompensasi kru yang akan di-snapshot saat SPJ terbit berdasarkan durasi Leg/Hari.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Jabatan Kru</label>
                  <Select
                    value={simRole}
                    onValueChange={(val) => setSimRole(val as CrewRole)}
                  >
                    <SelectTrigger className="h-9 mt-1 text-xs">
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
                    <SelectTrigger className="h-9 mt-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AKAP">AKAP Reguler (Trayek PP)</SelectItem>
                      <SelectItem value="TOURISM">Pariwisata / Sewa Bus (Harian)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {simService === 'TOURISM' ? (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Durasi Sewa (Hari)</label>
                    <Input
                      type="number"
                      min={1}
                      value={simDays}
                      onChange={(e) => setSimDays(Number(e.target.value))}
                      className="h-9 mt-1 font-mono text-xs"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Satuan Dinas AKAP</label>
                    <Input
                      disabled
                      value="1 Ritase PP (2 Leg)"
                      className="h-9 mt-1 text-xs bg-muted/50"
                    />
                  </div>
                )}

                <div>
                  <Button
                    onClick={handleSimulateSnapshot}
                    disabled={calculating}
                    className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    {calculating ? 'Menghitung...' : 'Hitung Snapshot Acuan'}
                  </Button>
                </div>
              </div>

              {snapshotResult && (
                <div className="p-4 rounded-xl bg-muted/40 border space-y-3 shadow-2xs">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-indigo-600" />
                      <span className="font-bold text-sm">
                        {formatRoleLabel(snapshotResult.role)} — Layanan {snapshotResult.serviceType}
                      </span>
                      <Badge variant="outline" className="text-xs font-semibold">
                        {snapshotResult.rateType === 'PER_TRIP'
                          ? 'Per Trip PP (2 Leg)'
                          : `${snapshotResult.durationDays} Hari Operasional`}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      Snapshot Ref: {snapshotResult.travelDate}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center sm:text-left">
                    <div>
                      <div className="text-xs text-muted-foreground">Uang Makan Acuan</div>
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
                      <div className="text-xs text-muted-foreground">Premi Dinas Acuan</div>
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
                        Total Rekomendasi Standar SPJ
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

      {/* Modal Form Tambah / Edit */}
      <CrewRateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        rule={selectedRule}
        loading={modalLoading}
      />

      {/* Confirm Dialog Hapus (Core Mandates) */}
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
