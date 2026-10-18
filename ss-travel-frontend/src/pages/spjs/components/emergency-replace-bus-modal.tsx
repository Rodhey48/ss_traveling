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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Wrench, ShieldAlert } from 'lucide-react';
import { SpjService } from '@/services/spj.service';
import { VehicleService } from '@/services/vehicle.service';
import type { Spj, Vehicle, EmergencyReplaceBusFormData } from '@/types';
import { toast } from 'sonner';

interface EmergencyReplaceBusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spj: Spj | null;
  onSuccess: () => void;
}

export default function EmergencyReplaceBusModal({
  open,
  onOpenChange,
  spj,
  onSuccess,
}: EmergencyReplaceBusModalProps) {
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [newVehicleId, setNewVehicleId] = useState('');
  const [incidentLocation, setIncidentLocation] = useState('KM 214 Tol Cipali');
  const [incidentNotes, setIncidentNotes] = useState('Radiator pecah dan overheat mesin');
  const [transferPassengerCount, setTransferPassengerCount] = useState(24);
  const [continueWithExistingCrew, setContinueWithExistingCrew] = useState(true);

  useEffect(() => {
    if (open) {
      loadVehicles();
      setNewVehicleId('');
      setIncidentLocation('KM 214 Tol Cipali');
      setIncidentNotes('Radiator pecah dan overheat mesin');
      setTransferPassengerCount(24);
      setContinueWithExistingCrew(true);
    }
  }, [open]);

  const loadVehicles = async () => {
    try {
      const res = await VehicleService.findAll({ limit: 50 });
      setVehicles(res.data?.data || []);
    } catch {
      toast.error('Gagal memuat daftar armada pengganti.');
    }
  };

  const availableBuses = vehicles.filter((v) => v.id !== spj?.vehicleId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spj || !newVehicleId || !incidentLocation || !incidentNotes) {
      toast.warning('Lengkapi semua data penanganan emergency breakdown.');
      return;
    }

    setLoading(true);
    try {
      const payload: EmergencyReplaceBusFormData = {
        parentSpjId: spj.id,
        newVehicleId,
        incidentLocation,
        incidentNotes,
        transferPassengerCount,
        continueWithExistingCrew,
      };

      const res = await SpjService.emergencyReplaceBus(spj.id, payload);
      toast.success(
        `SPJ Pengganti '${res.newSpj.spjNo}' berhasil diterbitkan dengan armada '${res.newSpj.vehicle?.code}'.`,
        {
          description: `SPJ asal '${spj.spjNo}' telah ditutup operasionalnya dan ditautkan via parent_spj_id.`,
        },
      );

      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memproses penggantian armada darurat.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Emergency Breakdown: Penggantian Armada di Tol (Skenario 3)
              </DialogTitle>
              <DialogDescription className="text-xs">
                Tutup SPJ armada yang rusak ({spj?.vehicle?.code}) dan terbitkan SPJ pengganti tanpa duplikasi omzet tiket.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Banner Peringatan Skenario 3 (Harmonis & Mudah Dibaca) */}
          <div className="p-3.5 rounded-xl border bg-muted/40 text-xs text-foreground space-y-1 shadow-2xs">
            <div className="font-bold flex items-center gap-1.5 text-xs text-foreground">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Proteksi Integritas Finansial Sistem:
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground text-[11px] leading-relaxed">
              <li>SPJ lama ({spj?.spjNo}) otomatis tuntas operasional & siap dipertanggungjawabkan kasnya.</li>
              <li>SPJ baru otomatis tertaut ke <code>parent_spj_id</code> (Grup Perjalanan Terkonsolidasi).</li>
              <li>Manifes penumpang dialihkan secara sah tanpa risiko pendapatan diakui 2 kali di akuntansi.</li>
            </ul>
          </div>

          <div>
            <Label className="text-xs font-semibold">Pilih Armada Cadangan / Pengganti (Storing) *</Label>
            <Select value={newVehicleId} onValueChange={setNewVehicleId}>
              <SelectTrigger className="mt-1.5 h-10 text-xs">
                <SelectValue placeholder="Pilih bus pengganti (misal: SS-03)..." />
              </SelectTrigger>
              <SelectContent>
                {availableBuses.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.code} - {v.plateNumber} ({v.capacity} Seat - {v.nickname || v.vehicleType})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">Lokasi Kejadian Darurat *</Label>
              <Input
                value={incidentLocation}
                onChange={(e) => setIncidentLocation(e.target.value)}
                placeholder="Contoh: KM 214 Tol Cipali"
                className="mt-1.5 h-10 text-xs"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Jumlah Penumpang Dialihkan</Label>
              <Input
                type="number"
                value={transferPassengerCount}
                onChange={(e) => setTransferPassengerCount(Number(e.target.value))}
                className="mt-1.5 h-10 text-xs font-bold"
                required
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Keterangan Teknis Insiden / Kerusakan *</Label>
            <Input
              value={incidentNotes}
              onChange={(e) => setIncidentNotes(e.target.value)}
              placeholder="Contoh: Radiator pecah, temperatur mesin high, derek Jasamarga dipanggil"
              className="mt-1.5 h-10 text-xs"
              required
            />
          </div>

          <div className="flex items-center space-x-2 pt-2 border-t">
            <Checkbox
              id="continueCrew"
              checked={continueWithExistingCrew}
              onCheckedChange={(checked) => setContinueWithExistingCrew(!!checked)}
            />
            <Label htmlFor="continueCrew" className="text-xs cursor-pointer font-medium leading-none text-muted-foreground">
              Kru utama (Supir 1, Supir 2, Kondektur) tetap bertugas mengemudikan bus pengganti sampai tujuan
            </Label>
          </div>

          <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
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
              disabled={loading || !newVehicleId}
              className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[150px] text-xs h-9 font-semibold"
            >
              <Wrench className="w-4 h-4 mr-1.5" />
              {loading ? 'Menerbitkan...' : 'Terbitkan SPJ Pengganti'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
