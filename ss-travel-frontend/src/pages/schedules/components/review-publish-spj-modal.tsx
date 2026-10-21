import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Bus,
  Clock,
  MapPin,
  CheckCircle2,
  Users,
  ShieldCheck,
  Building2,
  ArrowRight,
  Route,
  Info,
  Coins,
  RotateCcw,
} from 'lucide-react';
import { TripScheduleService, type CustomCrewRatePayload } from '@/services/trip-schedule.service';
import { UserService } from '@/services/user.service';
import type { TripSchedule, Vehicle, User } from '@/types';
import { toast } from 'sonner';

interface ReviewPublishSpjModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: TripSchedule | null;
  vehicles: Vehicle[];
  onSuccess: () => void;
}

export default function ReviewPublishSpjModal({
  open,
  onOpenChange,
  schedule,
  vehicles,
  onSuccess,
}: ReviewPublishSpjModalProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  // State yang dapat diedit sebelum SPJ diterbitkan resmi
  const [vehicleId, setVehicleId] = useState('');
  const [driver1Id, setDriver1Id] = useState('');
  const [driver2Id, setDriver2Id] = useState('');
  const [conductorId, setConductorId] = useState('');
  const [notes, setNotes] = useState('');
  const [isRoundTrip, setIsRoundTrip] = useState(true);

  // State Kompensasi Kru Fleksibel (Addendum v1.19)
  const [driver1Meal, setDriver1Meal] = useState<number>(0);
  const [driver1Incentive, setDriver1Incentive] = useState<number>(0);
  const [driver1Timing, setDriver1Timing] = useState<'AT_SETTLEMENT' | 'EARLY_DISBURSEMENT'>('AT_SETTLEMENT');

  const [driver2Meal, setDriver2Meal] = useState<number>(0);
  const [driver2Incentive, setDriver2Incentive] = useState<number>(0);
  const [driver2Timing, setDriver2Timing] = useState<'AT_SETTLEMENT' | 'EARLY_DISBURSEMENT'>('AT_SETTLEMENT');

  const [conductorMeal, setConductorMeal] = useState<number>(0);
  const [conductorIncentive, setConductorIncentive] = useState<number>(0);
  const [conductorTiming, setConductorTiming] = useState<'AT_SETTLEMENT' | 'EARLY_DISBURSEMENT'>('AT_SETTLEMENT');

  // Menandai apakah user melakukan manual override
  const [isUserOverridden, setIsUserOverridden] = useState(false);

  const selectedBus = useMemo(() => vehicles.find((v) => v.id === vehicleId), [vehicles, vehicleId]);

  // Hitung durasi satuan: 1 Hari = 1 Leg (AKAP), N Hari (Wisata)
  const { multiplier, unitLabel } = useMemo(() => {
    if (!schedule) return { multiplier: 1, unitLabel: '1 Hari' };

    if (schedule.serviceType === 'AKAP') {
      const mult = isRoundTrip ? 2 : 1;
      return { multiplier: mult, unitLabel: mult === 2 ? '2 Leg (PP)' : '1 Leg (Engkel)' };
    } else {
      const dep = new Date(schedule.plannedDepartureAt);
      const ret = new Date(schedule.plannedReturnAt);
      const days = Math.max(1, Math.ceil((ret.getTime() - dep.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      return { multiplier: days, unitLabel: `${days} Hari Sewa` };
    }
  }, [schedule, isRoundTrip]);

  // Kalkulasi Rekomendasi Tarif Dasar berdasarkan Tipe Armada & Satuan
  const systemRecommendedRates = useMemo(() => {
    const isLuxuryOrSleeper =
      selectedBus &&
      (selectedBus.vehicleType?.toLowerCase().includes('sleeper') ||
        selectedBus.vehicleType?.toLowerCase().includes('luxury') ||
        selectedBus.vehicleType?.toLowerCase().includes('combi') ||
        selectedBus.nickname?.toLowerCase().includes('luxury') ||
        selectedBus.nickname?.toLowerCase().includes('sleeper'));

    if (schedule?.serviceType === 'AKAP') {
      // Tarif dasar harian/per-leg AKAP
      const baseDriverMeal = isLuxuryOrSleeper ? 150000 : 125000;
      const baseDriverInc = isLuxuryOrSleeper ? 250000 : 200000;
      const baseCondMeal = 100000;
      const baseCondInc = 150000;

      return {
        driverMeal: baseDriverMeal * multiplier,
        driverInc: baseDriverInc * multiplier,
        condMeal: baseCondMeal * multiplier,
        condInc: baseCondInc * multiplier,
      };
    } else {
      // Tarif dasar harian Wisata
      const baseDriverMeal = 100000;
      const baseDriverInc = isLuxuryOrSleeper ? 200000 : 150000;
      const baseCondMeal = 75000;
      const baseCondInc = 100000;

      return {
        driverMeal: baseDriverMeal * multiplier,
        driverInc: baseDriverInc * multiplier,
        condMeal: baseCondMeal * multiplier,
        condInc: baseCondInc * multiplier,
      };
    }
  }, [schedule, selectedBus, multiplier]);

  // Terapkan kalkulasi otomatis jika belum di-override manual
  useEffect(() => {
    if (!isUserOverridden) {
      setDriver1Meal(systemRecommendedRates.driverMeal);
      setDriver1Incentive(systemRecommendedRates.driverInc);

      setDriver2Meal(systemRecommendedRates.driverMeal);
      setDriver2Incentive(systemRecommendedRates.driverInc);

      setConductorMeal(systemRecommendedRates.condMeal);
      setConductorIncentive(systemRecommendedRates.condInc);
    }
  }, [systemRecommendedRates, isUserOverridden]);

  useEffect(() => {
    if (open && schedule) {
      setVehicleId(schedule.vehicleId || '');
      setDriver1Id(schedule.plannedDriver1Id || '');
      setDriver2Id(schedule.plannedDriver2Id || '');
      setConductorId(schedule.plannedConductorId || '');
      setNotes(schedule.notes || '');
      setIsRoundTrip(schedule.serviceType === 'AKAP');
      setIsUserOverridden(false);
      loadUsers();
    }
  }, [open, schedule]);

  const loadUsers = async () => {
    try {
      const res = await UserService.findAll({ limit: 100 });
      setAvailableUsers(res.data?.data || []);
    } catch {
      toast.error('Gagal memuat master kru.');
    }
  };

  const handleResetRates = () => {
    setIsUserOverridden(false);
    setDriver1Meal(systemRecommendedRates.driverMeal);
    setDriver1Incentive(systemRecommendedRates.driverInc);
    setDriver2Meal(systemRecommendedRates.driverMeal);
    setDriver2Incentive(systemRecommendedRates.driverInc);
    setConductorMeal(systemRecommendedRates.condMeal);
    setConductorIncentive(systemRecommendedRates.condInc);
    toast.info('Nilai kompensasi kru telah di-reset ke rekomendasi standar sistem.');
  };

  if (!schedule) return null;

  // Estimasi nomor SPJ
  const previewSpjNo = schedule.scheduleNo
    ? schedule.scheduleNo.replace('SCH/', 'SPJ/')
    : 'SPJ/AUTO';

  const driver1User = availableUsers.find((u) => u.id === driver1Id);
  const driver2User = availableUsers.find((u) => u.id === driver2Id);
  const conductorUser = availableUsers.find((u) => u.id === conductorId);

  // Total estimasi hak kru
  const totalCrewCompensation =
    (driver1Id ? Number(driver1Meal || 0) + Number(driver1Incentive || 0) : 0) +
    (driver2Id ? Number(driver2Meal || 0) + Number(driver2Incentive || 0) : 0) +
    (conductorId ? Number(conductorMeal || 0) + Number(conductorIncentive || 0) : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!vehicleId) {
      toast.error('Pilih armada bus yang akan jalan.');
      return;
    }

    if (!driver1Id && !driver2Id) {
      toast.error('Penerbitan SPJ memerlukan minimal 1 orang Supir (Driver).');
      return;
    }

    // Bangun payload custom crew rates
    const customCrewRates: CustomCrewRatePayload[] = [];
    if (driver1Id) {
      customCrewRates.push({
        crewId: driver1Id,
        role: 'DRIVER',
        mealAllowance: Number(driver1Meal || 0),
        incentive: Number(driver1Incentive || 0),
        payoutTiming: driver1Timing,
      });
    }
    if (driver2Id) {
      customCrewRates.push({
        crewId: driver2Id,
        role: 'CO_DRIVER',
        mealAllowance: Number(driver2Meal || 0),
        incentive: Number(driver2Incentive || 0),
        payoutTiming: driver2Timing,
      });
    }
    if (conductorId) {
      customCrewRates.push({
        crewId: conductorId,
        role: 'CONDUCTOR',
        mealAllowance: Number(conductorMeal || 0),
        incentive: Number(conductorIncentive || 0),
        payoutTiming: conductorTiming,
      });
    }

    setLoading(true);
    try {
      const spj = await TripScheduleService.generateSpj(schedule.id, {
        vehicleId,
        driver1Id: driver1Id || undefined,
        driver2Id: driver2Id || undefined,
        conductorId: conductorId || undefined,
        isRoundTrip,
        customCrewRates,
        notes: notes || undefined,
      });

      toast.success(`Surat Perintah Jalan '${spj.spjNo}' berhasil diterbitkan resmi!`, {
        description: `Armada ${selectedBus ? selectedBus.code : 'Bus'} dan kru telah dikunci dengan total hak kompensasi Rp ${totalCrewCompensation.toLocaleString('id-ID')}.`,
        action: {
          label: 'Buka Halaman SPJ',
          onClick: () => navigate('/spjs'),
        },
      });

      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menerbitkan Surat Perintah Jalan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[880px] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                <FileText className="w-5 h-5" />
              </span>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  Review & Konfirmasi Penerbitan SPJ Resmi
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Periksa armada, rute, alokasi {unitLabel}, serta sesuaikan hak kompensasi kru sebelum SPJ diterbitkan.
                </DialogDescription>
              </div>
            </div>

            <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800 font-semibold text-[10px] self-start sm:self-auto">
              Target Status: ISSUED (Siap Jalan)
            </Badge>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Header Preview Dokumen Fisik */}
          <div className="p-3.5 rounded-xl border bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-[10px] text-muted-foreground block font-medium">Nomor SPJ Resmi yang Akan Diterbitkan:</span>
              <span className="text-sm font-extrabold text-foreground tracking-wide font-mono">
                {previewSpjNo}
              </span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">
                Bersumber dari Jadwal: <strong>{schedule.scheduleNo}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Badge className={
                schedule.serviceType === 'AKAP'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }>
                {schedule.serviceType === 'AKAP' ? 'Layanan AKAP Reguler' : 'Layanan Sewa Wisata'}
              </Badge>
              <Badge variant="secondary" className="font-semibold text-[10px]">
                Basis Dinas: {unitLabel}
              </Badge>
            </div>
          </div>

          {/* SECTION: Konfigurasi & Visualisasi Segmen Leg Perjalanan (AKAP vs Wisata) */}
          <div className="p-4 rounded-xl border bg-card space-y-3 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Route className="w-4 h-4 text-indigo-600" />
                <span>Rencana Segmen Perjalanan (Leg Routing)</span>
              </div>

              {schedule.serviceType === 'AKAP' ? (
                <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRoundTrip(true);
                      setIsUserOverridden(false);
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-md font-semibold transition-colors ${
                      isRoundTrip
                        ? 'bg-background text-foreground shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    2 Leg (PP Pulang-Pergi)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRoundTrip(false);
                      setIsUserOverridden(false);
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-md font-semibold transition-colors ${
                      !isRoundTrip
                        ? 'bg-background text-foreground shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    1 Leg (Satu Arah)
                  </button>
                </div>
              ) : (
                <span className="text-[11px] text-muted-foreground font-medium">
                  Durasi Sewa: <strong>{unitLabel}</strong>
                </span>
              )}
            </div>

            {/* Visualisasi Kartu Segmen Leg 1 & Leg 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Leg 1: Arah Berangkat */}
              <div className="p-3 rounded-lg border border-indigo-200/80 bg-indigo-50/30 dark:bg-indigo-950/20 dark:border-indigo-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-indigo-100/70 text-indigo-800 border-indigo-300 dark:bg-indigo-900/60 dark:text-indigo-200 font-bold text-[10px]">
                    Leg 1: Keberangkatan {isRoundTrip ? '(Arah Timur / DEPARTURE)' : '(ONE WAY)'}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3 text-sky-600" />
                    {new Date(schedule.plannedDepartureAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                  </span>
                </div>

                <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{schedule.origin}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                  <span>{schedule.destination}</span>
                </div>

                <div className="text-[11px] text-muted-foreground space-y-0.5">
                  <p>
                    Tanggal Berangkat: <strong>{new Date(schedule.plannedDepartureAt).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                  </p>
                  {driver1User && (
                    <p className="text-indigo-700 dark:text-indigo-400 font-medium">
                      👤 Kru Awal: {driver1User.name} {driver2User ? `& ${driver2User.name}` : ''}
                    </p>
                  )}
                </div>
              </div>

              {/* Leg 2: Arah Pulang (Jika PP) */}
              {isRoundTrip ? (
                <div className="p-3 rounded-lg border border-amber-200/80 bg-amber-50/30 dark:bg-amber-950/20 dark:border-amber-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-amber-100/70 text-amber-800 border-amber-300 dark:bg-amber-900/60 dark:text-amber-200 font-bold text-[10px]">
                      Leg 2: Kepulangan (Arah Barat / RETURN)
                    </Badge>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3 text-sky-600" />
                      {new Date(schedule.plannedReturnAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    </span>
                  </div>

                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{schedule.destination}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span>{schedule.origin}</span>
                  </div>

                  <div className="text-[11px] text-muted-foreground space-y-0.5">
                    <p>
                      Estimasi Tiba di Pool: <strong>{new Date(schedule.plannedReturnAt).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                    </p>
                    <p className="text-amber-800 dark:text-amber-300 font-medium">
                      🔄 Kru Leg 2: {driver2User ? `${driver1User?.name || 'Driver 1'} & ${driver2User.name}` : (driver1User?.name || 'Driver Terjadwal')} (Fleksibel diganti di transit)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground text-center">
                  <span>Perjalanan dinas ini hanya 1 Leg (Satu Arah tanpa rute pulang otomatis).</span>
                </div>
              )}
            </div>
          </div>

          {/* Grid Pilihan Armada & Plotting Kru */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kolom Kiri: Pilihan Armada Bus */}
            <div className="space-y-3.5 p-3.5 rounded-xl border bg-card">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground border-b pb-2">
                <Bus className="w-4 h-4 text-indigo-600" />
                <span>Armada Bus Ditugaskan</span>
              </div>

              <div>
                <Label className="text-xs font-semibold">Pilih Unit Armada Bus *</Label>
                <Select
                  value={vehicleId}
                  onValueChange={(val) => {
                    setVehicleId(val);
                    setIsUserOverridden(false);
                  }}
                >
                  <SelectTrigger className="mt-1.5 h-10 text-xs">
                    <SelectValue placeholder="Pilih armada bus..." />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.code} - {v.plateNumber} ({v.capacity} Seat - {v.vehicleType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedBus && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Kapasitas: <strong>{selectedBus.capacity} Kursi</strong> | Kelas: <strong>{selectedBus.nickname || selectedBus.vehicleType}</strong>
                  </p>
                )}
              </div>

              {schedule.customer && (
                <div className="p-2.5 rounded-lg border bg-muted/30 text-xs space-y-0.5 mt-2">
                  <div className="font-semibold text-foreground flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Penyewa: {schedule.customer.institutionName || schedule.customer.picName}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Harga Kontrak: <strong>Rp {Number(schedule.totalPackagePrice || 0).toLocaleString('id-ID')}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Kolom Kanan: Personel Kru Dinas */}
            <div className="space-y-3.5 p-3.5 rounded-xl border bg-card">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground border-b pb-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Personel Kru Bertugas</span>
              </div>

              <div>
                <Label className="text-xs font-semibold">Pengemudi Utama (Driver 1) *</Label>
                <Select value={driver1Id} onValueChange={setDriver1Id}>
                  <SelectTrigger className="mt-1.5 h-10 text-xs">
                    <SelectValue placeholder="Pilih supir 1..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.nip || u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Pengemudi Cadangan (Driver 2 / Co-Driver)</Label>
                <Select value={driver2Id || 'NONE'} onValueChange={(v) => setDriver2Id(v === 'NONE' ? '' : v)}>
                  <SelectTrigger className="mt-1.5 h-10 text-xs">
                    <SelectValue placeholder="Tidak ada Driver 2" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">-- Tidak Ada Driver 2 --</SelectItem>
                    {availableUsers
                      .filter((u) => u.id !== driver1Id)
                      .map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} ({u.nip || u.email})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Kondektur / Asisten Bus</Label>
                <Select value={conductorId || 'NONE'} onValueChange={(v) => setConductorId(v === 'NONE' ? '' : v)}>
                  <SelectTrigger className="mt-1.5 h-10 text-xs">
                    <SelectValue placeholder="Tidak ada kondektur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">-- Tidak Ada Kondektur --</SelectItem>
                    {availableUsers
                      .filter((u) => u.id !== driver1Id && u.id !== driver2Id)
                      .map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} ({u.nip || u.email})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* SECTION BARU: Rincian Hak Kompensasi Kru (Addendum v1.19 - Editable In-SPJ Customizer) */}
          <div className="p-4 rounded-xl border bg-card space-y-3.5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5">
              <div className="flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-foreground">
                  Rincian Kompensasi Kru (Uang Makan & Premi Dinas — Basis {unitLabel})
                </span>
                {isUserOverridden && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[9px] font-bold">
                    Telah Disesuaikan Manual
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetRates}
                  className="h-7 text-[10px] text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reset Rekomendasi
                </Button>
                <Badge variant="secondary" className="font-mono font-bold text-[11px] text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300">
                  Total: Rp {totalCrewCompensation.toLocaleString('id-ID')}
                </Badge>
              </div>
            </div>

            {/* Input Kompensasi Driver 1 */}
            {driver1Id && (
              <div className="p-3 rounded-lg border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    Supir 1: {driver1User?.name || 'Driver 1'}
                  </span>
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-muted-foreground">Waktu Bayar:</span>
                    <button
                      type="button"
                      onClick={() => setDriver1Timing('AT_SETTLEMENT')}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                        driver1Timing === 'AT_SETTLEMENT'
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Kasir Pool (Pulang)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDriver1Timing('EARLY_DISBURSEMENT')}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                        driver1Timing === 'EARLY_DISBURSEMENT'
                          ? 'bg-amber-600 text-white font-bold'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Bayar di Awal (Transfer)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Uang Makan ({unitLabel})</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground font-semibold">Rp</span>
                      <Input
                        type="number"
                        value={driver1Meal}
                        onChange={(e) => {
                          setDriver1Meal(Number(e.target.value));
                          setIsUserOverridden(true);
                        }}
                        className="pl-8 h-9 text-xs font-semibold"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Premi Ritase / Dinas ({unitLabel})</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground font-semibold">Rp</span>
                      <Input
                        type="number"
                        value={driver1Incentive}
                        onChange={(e) => {
                          setDriver1Incentive(Number(e.target.value));
                          setIsUserOverridden(true);
                        }}
                        className="pl-8 h-9 text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Input Kompensasi Driver 2 */}
            {driver2Id && (
              <div className="p-3 rounded-lg border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-600" />
                    Supir 2 / Co-Driver: {driver2User?.name || 'Driver 2'}
                  </span>
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-muted-foreground">Waktu Bayar:</span>
                    <button
                      type="button"
                      onClick={() => setDriver2Timing('AT_SETTLEMENT')}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                        driver2Timing === 'AT_SETTLEMENT'
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Kasir Pool (Pulang)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDriver2Timing('EARLY_DISBURSEMENT')}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                        driver2Timing === 'EARLY_DISBURSEMENT'
                          ? 'bg-amber-600 text-white font-bold'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Bayar di Awal (Transfer)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Uang Makan ({unitLabel})</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground font-semibold">Rp</span>
                      <Input
                        type="number"
                        value={driver2Meal}
                        onChange={(e) => {
                          setDriver2Meal(Number(e.target.value));
                          setIsUserOverridden(true);
                        }}
                        className="pl-8 h-9 text-xs font-semibold"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Premi Ritase / Dinas ({unitLabel})</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground font-semibold">Rp</span>
                      <Input
                        type="number"
                        value={driver2Incentive}
                        onChange={(e) => {
                          setDriver2Incentive(Number(e.target.value));
                          setIsUserOverridden(true);
                        }}
                        className="pl-8 h-9 text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Input Kompensasi Kondektur */}
            {conductorId && (
              <div className="p-3 rounded-lg border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-600" />
                    Kondektur / Helper: {conductorUser?.name || 'Kondektur'}
                  </span>
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-muted-foreground">Waktu Bayar:</span>
                    <button
                      type="button"
                      onClick={() => setConductorTiming('AT_SETTLEMENT')}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                        conductorTiming === 'AT_SETTLEMENT'
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Kasir Pool (Pulang)
                    </button>
                    <button
                      type="button"
                      onClick={() => setConductorTiming('EARLY_DISBURSEMENT')}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                        conductorTiming === 'EARLY_DISBURSEMENT'
                          ? 'bg-amber-600 text-white font-bold'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Bayar di Awal (Transfer)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Uang Makan ({unitLabel})</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground font-semibold">Rp</span>
                      <Input
                        type="number"
                        value={conductorMeal}
                        onChange={(e) => {
                          setConductorMeal(Number(e.target.value));
                          setIsUserOverridden(true);
                        }}
                        className="pl-8 h-9 text-xs font-semibold"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Premi Ritase / Dinas ({unitLabel})</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground font-semibold">Rp</span>
                      <Input
                        type="number"
                        value={conductorIncentive}
                        onChange={(e) => {
                          setConductorIncentive(Number(e.target.value));
                          setIsUserOverridden(true);
                        }}
                        className="pl-8 h-9 text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Kotak Edukasi Operasional Lapangan: SOP Pergantian Kru di Cabang (Skenario 1 Poin 7) */}
          <div className="p-3.5 rounded-xl border border-indigo-200/80 bg-indigo-50/40 dark:border-indigo-900/40 dark:bg-indigo-950/20 text-xs text-foreground space-y-1 shadow-2xs">
            <div className="font-bold flex items-center gap-1.5 text-xs text-indigo-950 dark:text-indigo-200">
              <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>SOP Penugasan Kru & Fleksibilitas Revisi Leg 2 (Skenario 1):</span>
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Kru yang ditugaskan di atas otomatis aktif untuk rute awal (Leg 1). Sesuai Blueprint operasional, jika terjadi <strong>pergantian supir di kota transit (Yogyakarta)</strong> atau ada kru yang sakit saat istirahat pool cabang, personel pada <strong>Leg 2</strong> dapat direvisi langsung di perjalanan melalui tombol <strong>[Ganti Kru]</strong> pada dokumen SPJ tanpa membatalkan perjalanan.
            </p>
          </div>

          {/* Catatan Instruksi Khusus Perjalanan */}
          <div>
            <Label className="text-xs font-semibold">Instruksi Khusus Operasional / Catatan Perjalanan SPJ</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Wajib servis makan di RM Raos Eco Gringsing, cek kelayakan ban di Rest Area KM 379, bawa dokumen izin trayek lengkap."
              className="mt-1.5 text-xs min-h-[60px]"
            />
          </div>

          {/* Banner Edukasi Hak Kompensasi Kru */}
          <div className="p-3 rounded-lg border bg-muted/40 text-[11px] text-muted-foreground flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Saat SPJ diterbitkan resmi, sistem otomatis melakukan <strong>Rate Snapshotting</strong> (Uang Makan & Premi Dinas) sesuai nominal di atas, mengunci hak kru secara sah untuk rekonsiliasi kasir pool.
            </span>
          </div>

          {/* Footer Tombol Aksi */}
          <DialogFooter className="pt-3 border-t gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="text-xs h-9"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !vehicleId || (!driver1Id && !driver2Id)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 shadow-xs min-w-[170px]"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              {loading ? 'Menerbitkan...' : `Konfirmasi & Terbitkan SPJ (${isRoundTrip ? '2 Leg' : '1 Leg'})`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
