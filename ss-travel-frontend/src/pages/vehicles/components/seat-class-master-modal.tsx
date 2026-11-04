import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import ConfirmDialog from '@/components/shared/confirm-dialog';
import { VehicleService } from '@/services/vehicle.service';
import type { SeatClass } from '@/types';
import { Armchair, Check, Edit, Loader2, Sparkles, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
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
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [classToDelete, setClassToDelete] = useState<SeatClass | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    } catch (error: any) {
      toast.error('Gagal memuat master kelas kursi', {
        description: error.response?.data?.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchClasses();
      setEditingId(null);
      setFormData({ code: '', name: '', defaultLayout: '', description: '' });
      setClassToDelete(null);
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
    if (!formData.code.trim() || !formData.name.trim()) {
      toast.error('Kode dan Nama kelas kursi wajib diisi');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        defaultLayout: formData.defaultLayout.trim(),
        description: formData.description.trim(),
      };

      if (editingId) {
        await VehicleService.updateSeatClass(editingId, payload);
        toast.success(`Master kelas kursi ${payload.name} berhasil diperbarui`);
      } else {
        await VehicleService.createSeatClass(payload);
        toast.success(`Master kelas kursi baru ${payload.name} berhasil ditambahkan`);
      }
      handleCancelEdit();
      fetchClasses();
      if (onUpdated) onUpdated();
    } catch (error: any) {
      toast.error('Gagal menyimpan master kelas kursi', {
        description: error.response?.data?.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!classToDelete) return;
    setIsDeleting(true);
    try {
      await VehicleService.removeSeatClassMaster(classToDelete.id);
      toast.success(`Master kelas kursi '${classToDelete.name}' berhasil dihapus`);
      setClassToDelete(null);
      fetchClasses();
      if (onUpdated) onUpdated();
    } catch (error: any) {
      toast.error('Gagal menghapus kelas kursi', {
        description: error.response?.data?.message,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Armchair className="h-5 w-5 text-primary" />
              Master Standar Kelas Kursi (*Seat Classes*)
            </DialogTitle>
          </DialogHeader>

          {/* Form Input / Edit */}
          <form
            onSubmit={handleSave}
            className="p-4 bg-slate-50/80 dark:bg-white/5 rounded-xl border border-slate-200/80 dark:border-white/10 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold text-xs text-primary flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                {editingId ? 'Edit Kelas Kursi Terpilih' : 'Tambah Master Kelas Kursi Baru'}
              </div>
              {editingId && (
                <Badge variant="outline" className="text-[10px] font-mono">
                  Sedang Mengedit ID: {editingId.slice(0, 8)}...
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">
                  Kode Unik <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="SUITES / LUXURY_2_1"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  required
                  className="h-8.5 text-xs font-mono"
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">
                  Nama Kelas Kursi <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Suites Class / Luxury 2-1"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="h-8.5 text-xs"
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">
                  Format Denah Layout
                </Label>
                <Input
                  placeholder="1-1 / 2-1 / 2-2"
                  value={formData.defaultLayout}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultLayout: e.target.value })
                  }
                  className="h-8.5 text-xs font-mono"
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-semibold">
                Fasilitas Bawaan & Deskripsi
              </Label>
              <Input
                placeholder="Fasilitas kabin bawaan (misal: Audio Video on Demand, legrest, bantal, selimut)"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="h-8.5 text-xs"
                disabled={isSaving}
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="h-8 text-xs gap-1"
                >
                  <X className="h-3.5 w-3.5" /> Batal Edit
                </Button>
              )}
              <Button
                type="submit"
                size="sm"
                disabled={isSaving}
                className="h-8 text-xs gap-1.5"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Menyimpan...
                  </>
                ) : editingId ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Simpan Perubahan
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" /> Tambahkan Master
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Tabel Master Kelas Kursi */}
          <div className="rounded-xl border border-slate-200/80 dark:border-white/10 overflow-hidden bg-white/50 dark:bg-zinc-900/40">
            <Table>
              <TableHeader className="bg-slate-50/80 dark:bg-white/5">
                <TableRow className="border-b border-slate-200/80 dark:border-white/10">
                  <TableHead className="w-32">Kode</TableHead>
                  <TableHead className="w-44">Nama Kelas</TableHead>
                  <TableHead className="w-28">Denah Layout</TableHead>
                  <TableHead>Fasilitas</TableHead>
                  <TableHead className="w-20 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-xs text-muted-foreground"
                    >
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                      Memuat data master kelas kursi...
                    </TableCell>
                  </TableRow>
                ) : list.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-32 text-center text-muted-foreground"
                    >
                      <Armchair className="h-7 w-7 mx-auto mb-1.5 opacity-30 text-muted-foreground" />
                      <p className="font-medium text-xs text-foreground">
                        Belum ada master kelas kursi
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Gunakan form di atas untuk menambahkan standar kelas kursi baru.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  list.map((sc) => (
                    <TableRow
                      key={sc.id}
                      className={editingId === sc.id ? 'bg-primary/5' : ''}
                    >
                      <TableCell className="font-mono font-bold text-xs">
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px] bg-background"
                        >
                          {sc.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-xs text-foreground">
                        {sc.name}
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge
                          variant="secondary"
                          className="font-mono text-[10px] py-0 px-1.5"
                        >
                          {sc.defaultLayout || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className="text-xs text-muted-foreground max-w-56 truncate"
                        title={sc.description}
                      >
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
                            title="Edit Kelas Kursi"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            onClick={() => setClassToDelete(sc)}
                            title="Hapus Kelas Kursi"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="text-xs h-8.5">
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog Hapus Master Kelas Kursi */}
      <ConfirmDialog
        open={!!classToDelete}
        onOpenChange={(open) => !open && setClassToDelete(null)}
        title="Hapus Master Kelas Kursi"
        description={`Apakah Anda yakin ingin menghapus kelas kursi '${classToDelete?.name}' (${classToDelete?.code})? Tindakan ini tidak dapat dilakukan jika ada armada yang menggunakan kelas kursi ini.`}
        variant="danger"
        confirmText="Hapus Kelas Kursi"
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </>
  );
}
