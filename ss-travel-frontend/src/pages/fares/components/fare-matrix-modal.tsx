import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import type { FareMatrix, FareMatrixFormData, FareSeason, SeatClass } from '@/types';

interface FareMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FareMatrixFormData) => Promise<void>;
  matrix: FareMatrix | null;
  seasons: FareSeason[];
  seatClasses: SeatClass[];
  loading: boolean;
}

export default function FareMatrixModal({
  isOpen,
  onClose,
  onSubmit,
  matrix,
  seasons,
  seatClasses,
  loading,
}: FareMatrixModalProps) {
  const [formData, setFormData] = useState<FareMatrixFormData>({
    fareSeasonId: '',
    origin: 'TANGERANG',
    destination: 'YOGYAKARTA',
    seatClassId: '',
    amount: 350000,
    isActive: true,
  });

  useEffect(() => {
    if (matrix) {
      setFormData({
        fareSeasonId: matrix.fareSeasonId,
        origin: matrix.origin,
        destination: matrix.destination,
        seatClassId: matrix.seatClassId,
        amount: Number(matrix.amount),
        isActive: matrix.isActive,
      });
    } else {
      setFormData({
        fareSeasonId: seasons[0]?.id || '',
        origin: 'TANGERANG',
        destination: 'YOGYAKARTA',
        seatClassId: seatClasses[0]?.id || '',
        amount: 350000,
        isActive: true,
      });
    }
  }, [matrix, seasons, seatClasses, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {matrix ? 'Edit Matriks Tarif Tiket' : 'Tambah Matriks Tarif Tiket'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="fareSeasonId">Musim Tarif</Label>
            <Select
              value={formData.fareSeasonId}
              onValueChange={(val) =>
                setFormData({ ...formData, fareSeasonId: val })
              }
              disabled={Boolean(matrix)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Musim Tarif" />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="origin">Kota Asal</Label>
              <Input
                id="origin"
                placeholder="misal: TANGERANG"
                value={formData.origin}
                onChange={(e) =>
                  setFormData({ ...formData, origin: e.target.value.toUpperCase() })
                }
                disabled={Boolean(matrix)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">Kota Tujuan</Label>
              <Input
                id="destination"
                placeholder="misal: YOGYAKARTA"
                value={formData.destination}
                onChange={(e) =>
                  setFormData({ ...formData, destination: e.target.value.toUpperCase() })
                }
                disabled={Boolean(matrix)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seatClassId">Kelas Kursi Bus</Label>
            <Select
              value={formData.seatClassId}
              onValueChange={(val) =>
                setFormData({ ...formData, seatClassId: val })
              }
              disabled={Boolean(matrix)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Kelas Kursi" />
              </SelectTrigger>
              <SelectContent>
                {seatClasses.map((sc) => (
                  <SelectItem key={sc.id} value={sc.id}>
                    {sc.name} ({sc.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Tarif Tiket Dasar (Rp)</Label>
            <Input
              id="amount"
              type="number"
              min={0}
              step={1000}
              placeholder="misal: 350000"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: Number(e.target.value) })
              }
              required
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : matrix ? 'Simpan Perubahan' : 'Tambah Tarif'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
