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
import type { FareSeason, FareSeasonFormData } from '@/types';

interface FareSeasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FareSeasonFormData) => Promise<void>;
  season: FareSeason | null;
  loading: boolean;
}

export default function FareSeasonModal({
  isOpen,
  onClose,
  onSubmit,
  season,
  loading,
}: FareSeasonModalProps) {
  const [formData, setFormData] = useState<FareSeasonFormData>({
    code: '',
    name: '',
    startDate: '',
    endDate: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    if (season) {
      setFormData({
        code: season.code,
        name: season.name,
        startDate: season.startDate ? season.startDate.split('T')[0] : '',
        endDate: season.endDate ? season.endDate.split('T')[0] : '',
        description: season.description || '',
        isActive: season.isActive,
      });
    } else {
      setFormData({
        code: '',
        name: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        description: '',
        isActive: true,
      });
    }
  }, [season, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {season ? 'Edit Kalender Musim Tarif' : 'Tambah Kalender Musim Tarif'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Kode Musim</Label>
              <Input
                id="code"
                placeholder="misal: LEBARAN_2026"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
                disabled={Boolean(season)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nama Musim / Tuslah</Label>
              <Input
                id="name"
                placeholder="misal: Tuslah Lebaran 1447H"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Tanggal Mulai</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Tanggal Selesai</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Keterangan / Alasan Penetapan Tarif</Label>
            <Input
              id="description"
              placeholder="misal: Penyesuaian tarif mudik & balik Idul Fitri"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : season ? 'Simpan Perubahan' : 'Buat Musim'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
