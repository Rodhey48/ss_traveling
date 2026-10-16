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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Armchair } from 'lucide-react';
import { VehicleService } from '@/services/vehicle.service';
import type { SeatClass } from '@/types';
import { toast } from 'sonner';

interface SeatClassMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export default function SeatClassMasterModal({
  isOpen,
  onClose,
  onUpdated,
}: SeatClassMasterModalProps) {
  const [list, setList] = useState<SeatClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    defaultLayout: '',
    description: '',
  });

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await VehicleService.getSeatClasses();
      if (res.status && res.data) {
        setList(res.data);
      }
    } catch (error) {
      toast.error('Gagal memuat master kelas kursi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchClasses();
      setEditingId(null);
      setFormData({ code: '', name: '', defaultLayout: '', description: '' });
    }
  }, [isOpen]);

  const handleEdit = (item: SeatClass) => {
    setEditingId(item.id);
    setFormData({
      code: item.code,
      name: item.name,
      defaultLayout: item.defaultLayout || '',
      description: item.description || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ code: '', name: '', defaultLayout: '', description: '' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await VehicleService.updateSeatClass(editingId, formData);
        toast.success('Master kelas kursi berhasil diperbarui');
      } else {
        await VehicleService.createSeatClass(formData);
        toast.success('Master kelas kursi baru berhasil ditambahkan');
      }
      handleCancelEdit();
      fetchClasses();
      if (onUpdated) onUpdated();
    } catch (error: any) {
      toast.error('Gagal menyimpan master kelas kursi', {
        description: error.response?.data?.message,
      });
    }
  };

  const handleDelete = async (item: SeatClass) => {
    if (!confirm(`Hapus master kelas kursi ${item.name}?`)) return;
    try {
      await VehicleService.removeSeatClassMaster(item.id);
      toast.success('Master kelas kursi berhasil dihapus');
      fetchClasses();
      if (onUpdated) onUpdated();
    } catch (error: any) {
      toast.error('Gagal menghapus kelas kursi', {
        description: error.response?.data?.message,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Armchair className="h-5 w-5 text-primary" />
            Master Standar Kelas Kursi (*Seat Classes*)
          </DialogTitle>
        </DialogHeader>

        {/* Form Input / Edit */}
        <form
          onSubmit={handleSave}
          className="p-3 bg-muted/40 rounded-xl border space-y-3"
        >
          <div className="font-semibold text-xs text-primary">
            {editingId ? 'Edit Kelas Kursi' : '+ Tambah Master Kelas Kursi Baru'}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold">Kode Unik</Label>
              <Input
                placeholder="SUITES"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
                required
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold">Nama Kelas Kursi</Label>
              <Input
                placeholder="Suites Class"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold">Format Denah</Label>
              <Input
                placeholder="1-1 / 2-1"
                value={formData.defaultLayout}
                onChange={(e) =>
                  setFormData({ ...formData, defaultLayout: e.target.value })
                }
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] font-semibold">Fasilitas Bawaan</Label>
            <Input
              placeholder="Deskripsi fasilitas kabin (AVOD, legrest, selimut)"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="h-8 text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            {editingId && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                className="h-7 text-xs"
              >
                Batal Edit
              </Button>
            )}
            <Button type="submit" size="sm" className="h-7 text-xs">
              {editingId ? 'Simpan' : 'Tambahkan'}
            </Button>
          </div>
        </form>

        {/* Tabel Master Kelas Kursi */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama Kelas</TableHead>
                <TableHead>Denah Layout</TableHead>
                <TableHead>Fasilitas</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-xs text-muted-foreground">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : list.map((sc) => (
                <TableRow key={sc.id}>
                  <TableCell className="font-mono font-bold text-xs">{sc.code}</TableCell>
                  <TableCell className="font-medium text-xs">{sc.name}</TableCell>
                  <TableCell className="text-xs">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {sc.defaultLayout || '-'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate" title={sc.description}>
                    {sc.description || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEdit(sc)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(sc)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
