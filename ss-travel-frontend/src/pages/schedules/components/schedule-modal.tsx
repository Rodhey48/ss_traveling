import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Clock, ShieldAlert, Sparkles, UserPlus, X } from 'lucide-react';
import QuickCustomerModal from './quick-customer-modal';
import { TripScheduleService } from '@/services/trip-schedule.service';
import { VehicleService } from '@/services/vehicle.service';
import { CustomerService } from '@/services/customer.service';
import { UserService } from '@/services/user.service';
import type {
  TripSchedule,
  CreateTripScheduleFormData,
  TripServiceType,
  Vehicle,
  Customer,
  User,
  ConflictCheckResult,
} from '@/types';
import { toast } from 'sonner';

interface ScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule?: TripSchedule | null;
  onSuccess: () => void;
  onConfirmSchedule?: (id: string, no: string) => void;
  onGenerateSpj?: (schedule: TripSchedule) => void;
}

export default function ScheduleModal({
  open,
  onOpenChange,
  schedule,
  onSuccess,
  onGenerateSpj,
}: ScheduleModalProps) {
  const [loading, setLoading] = useState(false);
  const [checkingConflict, setCheckingConflict] = useState(false);
  const [quickCustomerModalOpen, setQuickCustomerModalOpen] = useState(false);

  // Master Data
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [conductors, setConductors] = useState<User[]>([]);

  // Form State
  const [serviceType, setServiceType] = useState<TripServiceType>('AKAP');
  const [vehicleId, setVehicleId] = useState<string>('');

  // Tanggal & Jam Terpisah (24-Jam Format)
  const [departureDate, setDepartureDate] = useState<string>('');
  const [departureTime, setDepartureTime] = useState<string>('07:30');
  const [returnDate, setReturnDate] = useState<string>('');
  const [returnTime, setReturnTime] = useState<string>('19:00');

  const [origin, setOrigin] = useState<string>('Pool Ciputat / Jakarta');
  const [destination, setDestination] = useState<string>('Terminal Giwangan Yogyakarta');
  const [customerId, setCustomerId] = useState<string>('');
  const [picName, setPicName] = useState<string>('');
  const [picPhone, setPicPhone] = useState<string>('');
  const [pickupNotes, setPickupNotes] = useState<string>('');
  const [totalPackagePrice, setTotalPackagePrice] = useState<number>(0);
  const [plannedDriver1Id, setPlannedDriver1Id] = useState<string>('');
  const [plannedDriver2Id, setPlannedDriver2Id] = useState<string>('');
  const [plannedConductorId, setPlannedConductorId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Conflict / Buffer feedback state
  const [conflictResult, setConflictResult] = useState<ConflictCheckResult | null>(null);

  const splitIsoToDateAndTime = (isoDate?: string | Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    if (!isoDate) {
      const now = new Date();
      return {
        date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
        time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
      };
    }
    const d = new Date(isoDate);
    return {
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    };
  };

  useEffect(() => {
    if (open) {
      loadMasterData();
      if (schedule) {
        setServiceType(schedule.serviceType);
        setVehicleId(schedule.vehicleId || '');

        const dep = splitIsoToDateAndTime(schedule.plannedDepartureAt);
        setDepartureDate(dep.date);
        setDepartureTime(dep.time);

        const ret = splitIsoToDateAndTime(schedule.plannedReturnAt);
        setReturnDate(ret.date);
        setReturnTime(ret.time);

        setOrigin(schedule.origin);
        setDestination(schedule.destination);
        setCustomerId(schedule.customerId || '');
        setPicName(schedule.picName || '');
        setPicPhone(schedule.picPhone || '');
        setPickupNotes(schedule.pickupNotes || '');
        setTotalPackagePrice(Number(schedule.totalPackagePrice) || 0);
        setPlannedDriver1Id(schedule.plannedDriver1Id || '');
        setPlannedDriver2Id(schedule.plannedDriver2Id || '');
        setPlannedConductorId(schedule.plannedConductorId || '');
        setNotes(schedule.notes || '');
        setConflictResult(null);
      } else {
        resetForm();
      }
    }
  }, [open, schedule]);

  const resetForm = () => {
    setServiceType('AKAP');
    setVehicleId('');
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const dep = splitIsoToDateAndTime(now);
    setDepartureDate(dep.date);
    setDepartureTime('07:30');

    const ret = splitIsoToDateAndTime(tomorrow);
    setReturnDate(ret.date);
    setReturnTime('19:00');

    setOrigin('Pool Ciputat / Jakarta');
    setDestination('Terminal Giwangan Yogyakarta');
    setCustomerId('');
    setPicName('');
    setPicPhone('');
    setPickupNotes('');
    setTotalPackagePrice(0);
    setPlannedDriver1Id('');
    setPlannedDriver2Id('');
    setPlannedConductorId('');
    setNotes('');
    setConflictResult(null);
  };

  const loadMasterData = async () => {
    try {
      const [vehRes, custRes, usersRes] = await Promise.all([
        VehicleService.findAll({ limit: 50 }),
        CustomerService.findAll({ limit: 100 }),
        UserService.findAll({ limit: 100 }),
      ]);

      setVehicles(vehRes.data?.data || []);
      setCustomers(custRes.data?.data || []);

      const allUsers = usersRes.data?.data || [];
      const drvs = allUsers.filter(
        (u: any) =>
          u.roles?.some((r: any) => r.name === 'CREW_DRIVER' || r.name === 'SUPER_ADMIN') ||
          u.email?.includes('driver'),
      );
      const conds = allUsers.filter(
        (u: any) =>
          u.roles?.some((r: any) => r.name === 'CREW_CONDUCTOR' || r.name === 'CREW_STEWARDESS') ||
          u.email?.includes('conductor') ||
          u.email?.includes('stewardess'),
      );

      setDrivers(drvs.length > 0 ? drvs : allUsers);
      setConductors(conds.length > 0 ? conds : allUsers);
    } catch {
      toast.error('Gagal memuat master data armada dan kru.');
    }
  };

  const handleCustomerChange = (cId: string) => {
    setCustomerId(cId);
    const selected = customers.find((c) => c.id === cId);
    if (selected) {
      setPicName(selected.picName || '');
      setPicPhone(selected.phone || '');
    }
  };

  const handleQuickCustomerCreated = (newCustomer: Customer) => {
    setCustomers((prev) => [newCustomer, ...prev]);
    setCustomerId(newCustomer.id);
    setPicName(newCustomer.picName || '');
    setPicPhone(newCustomer.phone || '');
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const num = rawValue ? parseInt(rawValue, 10) : 0;
    setTotalPackagePrice(num);
  };

  const handleServiceTypeChange = (st: TripServiceType) => {
    setServiceType(st);
    setConflictResult(null);
    if (st === 'AKAP') {
      setOrigin('Pool Ciputat / Jakarta');
      setDestination('Terminal Giwangan Yogyakarta');
      setTotalPackagePrice(0);
      setDepartureTime('07:30');
      setReturnTime('19:00');
    } else if (st === 'WISATA') {
      setOrigin('Pool Ciputat / Tangerang');
      setDestination('Yogyakarta & Jawa Tengah');
      setTotalPackagePrice(17500000);
      setDepartureTime('06:00');
      setReturnTime('21:00');
    } else {
      setOrigin('Bandara Soekarno-Hatta (CGK)');
      setDestination('Hotel / Stasiun Gambir');
      setTotalPackagePrice(3000000);
      setDepartureTime('08:00');
      setReturnTime('17:00');
    }
  };

  // Handler pergantian armada & kru yang otomatis mereset alert bentrok
  const handleVehicleChange = (val: string) => {
    setVehicleId(val === 'NONE' ? '' : val);
    setConflictResult(null);
  };

  const handleDriver1Change = (val: string) => {
    setPlannedDriver1Id(val === 'NONE' ? '' : val);
    setConflictResult(null);
  };

  const handleDriver2Change = (val: string) => {
    setPlannedDriver2Id(val === 'NONE' ? '' : val);
    setConflictResult(null);
  };

  const handleConductorChange = (val: string) => {
    setPlannedConductorId(val === 'NONE' ? '' : val);
    setConflictResult(null);
  };

  // Preset Cepat Durasi Hari Wisata
  const handleDurationPreset = (daysAdd: number) => {
    if (!departureDate) return;
    const d = new Date(departureDate);
    d.setDate(d.getDate() + (daysAdd - 1));
    const pad = (n: number) => String(n).padStart(2, '0');
    const newRetDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    setReturnDate(newRetDate);
    setReturnTime('21:00');
    setConflictResult(null);
  };

  // Validasi & Kalkulasi Durasi
  const departureDateTime = new Date(`${departureDate || '2000-01-01'}T${departureTime || '00:00'}:00`);
  const returnDateTime = new Date(`${returnDate || '2000-01-01'}T${returnTime || '00:00'}:00`);

  const isTimeInvalid = !departureDate || !returnDate || returnDateTime.getTime() <= departureDateTime.getTime();

  // Hitung Hari Kalender
  const d1 = new Date(departureDate || new Date());
  const d2 = new Date(returnDate || new Date());
  const daysCount = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const nightsCount = Math.max(0, daysCount - 1);
  const diffHours = !isTimeInvalid
    ? Math.round(((returnDateTime.getTime() - departureDateTime.getTime()) / (1000 * 60 * 60)) * 10) / 10
    : 0;

  const handleCheckConflict = async () => {
    if (isTimeInvalid) {
      toast.warning('Pastikan waktu kepulangan lebih lama daripada waktu keberangkatan.');
      return;
    }

    setCheckingConflict(true);
    try {
      const crewIds: string[] = [];
      if (plannedDriver1Id) crewIds.push(plannedDriver1Id);
      if (plannedDriver2Id) crewIds.push(plannedDriver2Id);
      if (plannedConductorId) crewIds.push(plannedConductorId);

      const res = await TripScheduleService.checkConflict({
        vehicleId: vehicleId || undefined,
        crewIds,
        departureAt: departureDateTime.toISOString(),
        returnAt: returnDateTime.toISOString(),
        excludeScheduleId: schedule?.id,
      });

      setConflictResult(res);
      if (res.hasConflict) {
        toast.error('Terdeteksi bentrok jadwal operasional!', {
          description: res.conflictDetails.join(' | '),
          duration: 10000,
        });
      } else if (res.warnings && res.warnings.length > 0) {
        toast.warning('Tidak ada bentrok, namun terdapat peringatan waktu istirahat minimal (3 jam).', {
          duration: 8000,
        });
      } else {
        toast.success('Jadwal aman! Tidak ada bentrok armada maupun kru.');
      }
    } catch (err: any) {
      const rawMsg = err.response?.data?.message || 'Gagal memeriksa bentrok jadwal.';
      toast.error('Gagal memeriksa jadwal', {
        description: rawMsg,
        duration: 8000,
      });
    } finally {
      setCheckingConflict(false);
    }
  };

  const handleConfirmCurrentSchedule = async () => {
    if (!schedule) return;
    if (isTimeInvalid) {
      toast.error('Waktu kepulangan harus lebih lama daripada waktu keberangkatan.');
      return;
    }

    if (!vehicleId) {
      toast.error('Armada bus wajib ditugaskan sebelum mengonfirmasi jadwal.');
      return;
    }

    setLoading(true);
    try {
      const payload: CreateTripScheduleFormData = {
        serviceType,
        vehicleId: vehicleId || undefined,
        plannedDepartureAt: departureDateTime.toISOString(),
        plannedReturnAt: returnDateTime.toISOString(),
        origin,
        destination,
        customerId: customerId || undefined,
        picName: picName || undefined,
        picPhone: picPhone || undefined,
        pickupNotes: pickupNotes || undefined,
        totalPackagePrice: totalPackagePrice || 0,
        plannedDriver1Id: plannedDriver1Id || undefined,
        plannedDriver2Id: plannedDriver2Id || undefined,
        plannedConductorId: plannedConductorId || undefined,
        notes: notes || undefined,
      };

      await TripScheduleService.updateSchedule(schedule.id, payload);
      await TripScheduleService.confirmSchedule(schedule.id);

      toast.success(`Jadwal ${schedule.scheduleNo} berhasil disimpan dan dikonfirmasi (Terkunci)!`);
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengonfirmasi jadwal.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isTimeInvalid) {
      toast.error('Waktu kepulangan harus lebih lama daripada waktu keberangkatan.');
      return;
    }

    setLoading(true);
    try {
      const payload: CreateTripScheduleFormData = {
        serviceType,
        vehicleId: vehicleId || undefined,
        plannedDepartureAt: departureDateTime.toISOString(),
        plannedReturnAt: returnDateTime.toISOString(),
        origin,
        destination,
        customerId: customerId || undefined,
        picName: picName || undefined,
        picPhone: picPhone || undefined,
        pickupNotes: pickupNotes || undefined,
        totalPackagePrice: totalPackagePrice || 0,
        plannedDriver1Id: plannedDriver1Id || undefined,
        plannedDriver2Id: plannedDriver2Id || undefined,
        plannedConductorId: plannedConductorId || undefined,
        notes: notes || undefined,
      };

      if (schedule) {
        const res = await TripScheduleService.updateSchedule(schedule.id, payload);
        toast.success('Rencana jadwal berhasil diperbarui.');
        if (res.warnings && res.warnings.length > 0) {
          toast.warning(`Catatan: ${res.warnings.map((w: any) => w.message).join(' ')}`);
        }
      } else {
        const res = await TripScheduleService.createSchedule(payload);
        toast.success(`Rencana jadwal ${res.schedule.scheduleNo} berhasil dibuat.`);
        if (res.warnings && res.warnings.length > 0) {
          toast.warning(`Catatan: ${res.warnings.map((w: any) => w.message).join(' ')}`);
        }
      }

      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      const rawMsg = err.response?.data?.message || 'Gagal menyimpan rencana jadwal.';

      // Jika error 409 Conflict: parse kalimat-kalimat bentroknya dan tampilkan di banner modal
      if (err.response?.status === 409 || rawMsg.toLowerCase().includes('bentrok')) {
        let details: string[] = [];
        if (rawMsg.includes(':')) {
          const detailSection = rawMsg.split(':').slice(1).join(':').trim();
          details = detailSection
            .split(/(?<=\.)\s+/)
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0);
        }

        setConflictResult({
          hasConflict: true,
          conflictDetails: details.length > 0 ? details : [rawMsg],
          warnings: conflictResult?.warnings || [],
        });

        toast.error('Gagal Menyimpan: Bentrok Operasional Terdeteksi!', {
          description: rawMsg,
          duration: 12000,
        });
      } else {
        toast.error(rawMsg, { duration: 6000 });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[1000px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                <Clock className="w-5 h-5" />
              </span>
              <div>
                <DialogTitle className="text-xl font-bold">
                  {schedule ? `Edit Jadwal Dinas: ${schedule.scheduleNo}` : 'Booking / Rencana Jadwal Dinas Bus'}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Atur penugasan armada dan personil kru dinas sebelum dokumen SPJ diterbitkan.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            {/* Layanan & Pilihan Waktu Terpisah 24 Jam */}
            <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                {/* 1. Layanan (3 Kolom) */}
                <div className="md:col-span-3">
                  <div className="h-5 flex items-center">
                    <Label className="text-xs font-semibold">Jenis Layanan *</Label>
                  </div>
                  <Select
                    value={serviceType}
                    onValueChange={(val) => handleServiceTypeChange(val as TripServiceType)}
                  >
                    <SelectTrigger className="mt-1.5 h-10 text-xs">
                      <SelectValue placeholder="Pilih Layanan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AKAP">AKAP Reguler (Trayek PP)</SelectItem>
                      <SelectItem value="WISATA">Pariwisata / Charter Wisata</SelectItem>
                      <SelectItem value="SHUTTLE">Shuttle / Komuter Bandara</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 2. Waktu Berangkat (4.5 Kolom) */}
                <div className="md:col-span-4 lg:col-span-4">
                  <div className="h-5 flex items-center justify-between">
                    <Label className="text-xs font-semibold">Tanggal & Jam Berangkat *</Label>
                    <span className="text-[10px] text-muted-foreground">Format 24 Jam</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Input
                      type="date"
                      value={departureDate}
                      onChange={(e) => {
                        setDepartureDate(e.target.value);
                        setConflictResult(null);
                      }}
                      className="h-10 text-xs flex-1 px-3 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:mr-1"
                      required
                    />
                    <Input
                      type="time"
                      value={departureTime}
                      onChange={(e) => {
                        setDepartureTime(e.target.value);
                        setConflictResult(null);
                      }}
                      className="h-10 text-xs w-[115px] shrink-0 font-medium px-3 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:mr-1"
                      required
                    />
                  </div>
                </div>

                {/* 3. Waktu Kembali (4.5 Kolom) */}
                <div className="md:col-span-5 lg:col-span-5">
                  <div className="h-5 flex items-center justify-between">
                    <Label className="text-xs font-semibold">Tanggal & Jam Kembali / Selesai *</Label>
                    <span className="text-[10px] text-muted-foreground">Format 24 Jam</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Input
                      type="date"
                      min={departureDate}
                      value={returnDate}
                      onChange={(e) => {
                        setReturnDate(e.target.value);
                        setConflictResult(null);
                      }}
                      className="h-10 text-xs flex-1 px-3 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:mr-1"
                      required
                    />
                    <Input
                      type="time"
                      value={returnTime}
                      onChange={(e) => {
                        setReturnTime(e.target.value);
                        setConflictResult(null);
                      }}
                      className="h-10 text-xs w-[115px] shrink-0 font-medium px-3 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:mr-1"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Baris Validasi & Kalkulasi Total Hari & Malam */}
              {isTimeInvalid ? (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-900 dark:bg-red-950/40 dark:border-red-900 dark:text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>
                    <strong>Waktu Tidak Valid:</strong> Waktu kepulangan ({returnDate || '-'} {returnTime || '-'}) harus lebih lama daripada waktu keberangkatan ({departureDate || '-'} {departureTime || '-'}).
                  </span>
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-background border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1 rounded-md bg-muted text-primary shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <span className="text-muted-foreground mr-1.5">Total Pemakaian Bus:</span>
                      <strong className="text-foreground font-bold">
                        {daysCount} Hari {nightsCount > 0 ? `${nightsCount} Malam` : '(PP Hari yang Sama)'}
                      </strong>
                      <span className="text-muted-foreground ml-1.5 font-normal">
                        (±{diffHours} Jam Operasi)
                      </span>
                    </div>
                  </div>

                  {serviceType === 'WISATA' && (
                    <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
                      <span className="text-[10px] text-muted-foreground font-medium">Preset Cepat:</span>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDurationPreset(1)}
                        className="h-6 text-[10px] px-2 text-foreground font-medium"
                      >
                        1 Hari (PP)
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDurationPreset(2)}
                        className="h-6 text-[10px] px-2 text-foreground font-medium"
                      >
                        2D1N
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDurationPreset(3)}
                        className="h-6 text-[10px] px-2 text-foreground font-medium"
                      >
                        3D2N
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDurationPreset(5)}
                        className="h-6 text-[10px] px-2 text-foreground font-medium"
                      >
                        5D4N
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Rute & Tujuan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Kota Asal (Origin) *</Label>
                <Input
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Contoh: Pool Ciputat / Jakarta"
                  className="mt-1.5 h-10 text-xs"
                  required
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Kota Tujuan (Destination) *</Label>
                <Input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Contoh: Terminal Giwangan Yogyakarta"
                  className="mt-1.5 h-10 text-xs"
                  required
                />
              </div>
            </div>

            {/* Bagian Khusus Pariwisata / CRM Auto-complete */}
            {serviceType === 'WISATA' && (
              <div className="p-4 rounded-xl border bg-muted/30 space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-foreground">
                        Integrasi CRM Pelanggan Penyewa Wisata (B2B)
                      </span>
                      <p className="text-[11px] text-muted-foreground">
                        Pilih pelanggan terdaftar untuk melengkapi profil penyewa dan nilai sewa secara otomatis.
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
                    Paket Wisata
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <div>
                    <div className="h-5 flex items-center justify-between">
                      <Label className="text-xs font-semibold">Pelanggan Terdaftar (Leads CRM)</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuickCustomerModalOpen(true)}
                        className="h-5 px-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                      >
                        <UserPlus className="w-3 h-3 mr-1" /> + Klien Baru
                      </Button>
                    </div>
                    <Select value={customerId} onValueChange={handleCustomerChange}>
                      <SelectTrigger className="mt-1.5 h-10 text-xs">
                        <SelectValue placeholder="Pilih Instansi / Klien..." />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.institutionName || c.picName} ({c.code} - {c.customerTier})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Klien terdaftar pada master database CRM
                    </p>
                  </div>

                  <div>
                    <div className="h-5 flex items-center">
                      <Label className="text-xs font-semibold">Total Nilai Kontrak Sewa (Rp) *</Label>
                    </div>
                    <div className="relative mt-1.5">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                        Rp
                      </span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={totalPackagePrice > 0 ? totalPackagePrice.toLocaleString('id-ID') : ''}
                        onChange={handlePriceChange}
                        placeholder="0"
                        className="pl-9 h-10 text-xs font-semibold text-emerald-700 dark:text-emerald-400"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 truncate">
                      {totalPackagePrice > 0 ? (
                        <>
                          Terformat: <strong className="text-emerald-700 dark:text-emerald-400">Rp {totalPackagePrice.toLocaleString('id-ID')},00</strong>
                        </>
                      ) : (
                        'Masukkan nominal angka tanpa titik'
                      )}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold">Nama PIC / Panitia Rombongan</Label>
                    <Input
                      value={picName}
                      onChange={(e) => setPicName(e.target.value)}
                      placeholder="Contoh: Pak Hendra / Ibu Maya"
                      className="mt-1.5 h-10 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Kontak Telepon / WhatsApp PIC</Label>
                    <Input
                      value={picPhone}
                      onChange={(e) => setPicPhone(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="mt-1.5 h-10 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Alamat Titik Kumpul / Catatan Penjemputan</Label>
                  <Input
                    value={pickupNotes}
                    onChange={(e) => setPickupNotes(e.target.value)}
                    placeholder="Contoh: Depan Lobi Kantor Pusat Jl. Sudirman jam 06:00 WIB"
                    className="mt-1.5 h-10 text-xs"
                  />
                </div>
              </div>
            )}

            {/* Plotting Armada & Personel Kru (Disusun Lapang & Simetris) */}
            <div className="space-y-4 p-4 rounded-xl border bg-muted/30">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b pb-3">
                <div>
                  <span className="font-bold text-sm text-foreground">
                    Plotting Armada Bus & Tim Kru Terjadwal
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Tugaskan unit bus yang tersedia beserta kru pengemudi dan kondektur dinas.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCheckConflict}
                  disabled={checkingConflict || isTimeInvalid}
                  className="text-xs h-8 text-indigo-700 border-indigo-200 hover:bg-indigo-50 dark:text-indigo-300 dark:border-indigo-800 shrink-0"
                >
                  {checkingConflict ? 'Memeriksa...' : '⚡ Cek Bentrok & Buffer Rest'}
                </Button>
              </div>

              {/* Grid Simetris: Kolom Kiri Armada (1 bagian), Kolom Kanan 3 Kru (3 bagian) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* 1. Pilihan Armada Bus (col-span-4) */}
                <div className="lg:col-span-4 p-3 rounded-lg border bg-background/60 space-y-2">
                  <div className="h-5 flex items-center justify-between">
                    <Label className="text-xs font-semibold">Armada Bus Ditugaskan *</Label>
                    {vehicleId && (
                      <button
                        type="button"
                        onClick={() => handleVehicleChange('NONE')}
                        className="text-[11px] text-muted-foreground hover:text-red-600 flex items-center gap-0.5"
                        title="Kosongkan pilihan bus"
                      >
                        <X className="w-3 h-3" /> Reset
                      </button>
                    )}
                  </div>
                  <Select value={vehicleId || 'NONE'} onValueChange={handleVehicleChange}>
                    <SelectTrigger className="h-10 text-xs">
                      <SelectValue placeholder="Pilih Armada Bus..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE" className="text-muted-foreground italic font-normal">
                        -- Belum Dipilih / Kosongkan --
                      </SelectItem>
                      {vehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.code} - {v.plateNumber} ({v.capacity} Seat)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {vehicleId
                      ? `${vehicles.find((v) => v.id === vehicleId)?.nickname || 'Siap Operasi'} (${vehicles.find((v) => v.id === vehicleId)?.capacity} Kursi)`
                      : 'Wajib dipilih sebelum dikonfirmasi'}
                  </p>
                </div>

                {/* 2. Tim Kru Lapangan (col-span-8) */}
                <div className="lg:col-span-8 p-3 rounded-lg border bg-background/60 space-y-2">
                  <div className="h-5 flex items-center">
                    <Label className="text-xs font-semibold">Personel Kru Bertugas *</Label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Supir 1 */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-muted-foreground">
                          Driver 1 (Utama) *
                        </span>
                        {plannedDriver1Id && (
                          <button
                            type="button"
                            onClick={() => handleDriver1Change('NONE')}
                            className="text-[10px] text-muted-foreground hover:text-red-600 flex items-center gap-0.5"
                            title="Kosongkan Driver 1"
                          >
                            <X className="w-2.5 h-2.5" /> Lepas
                          </button>
                        )}
                      </div>
                      <Select value={plannedDriver1Id || 'NONE'} onValueChange={handleDriver1Change}>
                        <SelectTrigger className="h-10 text-xs">
                          <SelectValue placeholder="Pilih Driver 1..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE" className="text-muted-foreground italic font-normal">
                            -- Belum Ditugaskan --
                          </SelectItem>
                          {drivers.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name} ({d.nip || 'Driver'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Supir 2 */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-muted-foreground">
                          Driver 2 (Cadangan)
                        </span>
                        {plannedDriver2Id && (
                          <button
                            type="button"
                            onClick={() => handleDriver2Change('NONE')}
                            className="text-[10px] text-muted-foreground hover:text-red-600 flex items-center gap-0.5"
                            title="Kosongkan Driver 2"
                          >
                            <X className="w-2.5 h-2.5" /> Lepas
                          </button>
                        )}
                      </div>
                      <Select value={plannedDriver2Id || 'NONE'} onValueChange={handleDriver2Change}>
                        <SelectTrigger className="h-10 text-xs">
                          <SelectValue placeholder="Pilih Driver 2..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE" className="text-muted-foreground italic font-normal">
                            -- Tanpa Driver 2 (1 Supir) --
                          </SelectItem>
                          {drivers
                            .filter((d) => d.id !== plannedDriver1Id)
                            .map((d) => (
                              <SelectItem key={d.id} value={d.id}>
                                {d.name} ({d.nip || 'Driver'})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Kondektur */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-muted-foreground">
                          Kondektur / Helper
                        </span>
                        {plannedConductorId && (
                          <button
                            type="button"
                            onClick={() => handleConductorChange('NONE')}
                            className="text-[10px] text-muted-foreground hover:text-red-600 flex items-center gap-0.5"
                            title="Kosongkan Kondektur"
                          >
                            <X className="w-2.5 h-2.5" /> Lepas
                          </button>
                        )}
                      </div>
                      <Select value={plannedConductorId || 'NONE'} onValueChange={handleConductorChange}>
                        <SelectTrigger className="h-10 text-xs">
                          <SelectValue placeholder="Pilih Kondektur..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE" className="text-muted-foreground italic font-normal">
                            -- Tanpa Kondektur --
                          </SelectItem>
                          {conductors.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name} ({c.nip || 'Kondektur'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Minimal 1 pengemudi (Driver 1) wajib ditugaskan sebelum menerbitkan SPJ.
                  </p>
                </div>
              </div>

              {/* Conflict & Buffer Feedback Widget (Lembut & Tidak Mencolok) */}
              {conflictResult && (
                <div className="space-y-2 pt-1">
                  {conflictResult.hasConflict ? (
                    <div className="p-3.5 rounded-xl bg-red-50/40 border border-red-200/70 text-red-950 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-100 space-y-2 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 shrink-0">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-red-900 dark:text-red-200">
                            Jadwal Bentrok ({conflictResult.conflictDetails.length} Konflik Terdeteksi)
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Ganti personel kru atau armada di atas untuk menjadwalkan ulang:
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1 pt-0.5">
                        {conflictResult.conflictDetails.map((det, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-background border border-border/80 text-foreground text-xs flex items-start gap-2 shadow-2xs"
                          >
                            <span className="text-red-500 font-bold mt-0.5">•</span>
                            <span className="leading-relaxed">{det}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200/70 text-emerald-950 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-200 text-xs flex items-center gap-2.5">
                      <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="font-medium">
                        Jadwal Bebas Bentrok: Armada dan seluruh kru siap ditugaskan tanpa benturan jadwal.
                      </span>
                    </div>
                  )}

                  {conflictResult.warnings && conflictResult.warnings.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-amber-50/40 border border-amber-200/70 text-amber-950 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-100 space-y-2 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-amber-900 dark:text-amber-200">
                            Peringatan Buffer Waktu Istirahat (Standar Minimal 3 Jam)
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Jeda waktu setelah tugas sebelumnya kurang dari 180 menit.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1 pt-0.5">
                        {conflictResult.warnings.map((w, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-background border border-border/80 text-foreground text-xs flex items-start gap-2 shadow-2xs"
                          >
                            <span className="text-amber-500 font-bold mt-0.5">•</span>
                            <span className="leading-relaxed">{w.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">
                  Catatan Operasional / Itinerary & Kebutuhan Khusus
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  {notes.length} Karakter
                </span>
              </div>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tuliskan rincian itinerary wisata (hari ke-1 s/d selesai), titik henti/transit, permintaan fasilitas armada (bantal, selimut, wireless mic, dispenser), permintaan khusus rombongan, atau catatan rute..."
                rows={4}
                className="mt-1.5 text-xs resize-y min-h-[90px] leading-relaxed"
              />
            </div>

            <DialogFooter className="pt-4 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                {schedule && schedule.status === 'DRAFT' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleConfirmCurrentSchedule}
                    disabled={loading || isTimeInvalid || !vehicleId}
                    className="text-blue-700 border-blue-200 hover:bg-blue-50 dark:text-blue-300 dark:border-blue-800 text-xs h-9 w-full sm:w-auto font-semibold"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> Kunci Jadwal (Konfirmasi)
                  </Button>
                )}

                {schedule && schedule.status === 'CONFIRMED' && !schedule.spjId && onGenerateSpj && (
                  <Button
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      onGenerateSpj(schedule);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 w-full sm:w-auto font-semibold shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> Review & Terbitkan SPJ
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="text-xs h-9"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={loading || isTimeInvalid}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[130px] text-xs h-9 font-semibold"
                >
                  {loading ? 'Menyimpan...' : schedule ? 'Simpan Perubahan' : 'Buat Rencana Jadwal'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Quick Create Customer Baru */}
      <QuickCustomerModal
        open={quickCustomerModalOpen}
        onOpenChange={setQuickCustomerModalOpen}
        onCreated={handleQuickCustomerCreated}
      />
    </>
  );
}
