import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Users, Building2, User, Landmark, Phone, Loader2, Sparkles } from 'lucide-react';
import type { Coordinator, CoordinatorFormData, CoordinatorType } from '@/types';
import { toast } from 'sonner';

interface CoordinatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CoordinatorFormData) => Promise<void>;
  coordinator: Coordinator | null;
  loading: boolean;
}

export default function CoordinatorModal({
  isOpen,
  onClose,
  onSubmit,
  coordinator,
  loading,
}: CoordinatorModalProps) {
  const [formData, setFormData] = useState<CoordinatorFormData>({
    code: '',
    name: '',
    type: 'ORGANIZATION',
    organizationName: '',
    phone: '',
    email: '',
    area: 'JAKARTA - TERMINAL PULO GEBANG',
    address: '',
    bankName: 'BCA',
    bankAccountNumber: '',
    bankAccountHolder: '',
    notes: '',
    isActive: true,
  });

  useEffect(() => {
    if (coordinator) {
      setFormData({
        code: coordinator.code,
        name: coordinator.name,
        type: coordinator.type,
        organizationName: coordinator.organizationName || '',
        phone: coordinator.phone,
        email: coordinator.email || '',
        area: coordinator.area,
        address: coordinator.address || '',
        bankName: coordinator.bankName,
        bankAccountNumber: coordinator.bankAccountNumber,
        bankAccountHolder: coordinator.bankAccountHolder,
        notes: coordinator.notes || '',
        isActive: coordinator.isActive ?? true,
      });
    } else {
      setFormData({
        code: '',
        name: '',
        type: 'ORGANIZATION',
        organizationName: '',
        phone: '',
        email: '',
        area: 'JAKARTA - TERMINAL PULO GEBANG',
        address: '',
        bankName: 'BCA',
        bankAccountNumber: '',
        bankAccountHolder: '',
        notes: '',
        isActive: true,
      });
    }
  }, [coordinator, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error('Kode unik koordinator wajib diisi');
      return;
    }
    if (!formData.name.trim()) {
      toast.error('Nama PIC / koordinator wajib diisi');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('Nomor WhatsApp / HP koordinator wajib diisi');
      return;
    }
    if (!formData.bankName.trim() || !formData.bankAccountNumber.trim() || !formData.bankAccountHolder.trim()) {
      toast.error('Rincian rekening bank (Nama Bank, No Rekening, dan Atas Nama) wajib diisi untuk pencairan fee');
      return;
    }

    await onSubmit({
      ...formData,
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      organizationName: formData.organizationName?.trim() || undefined,
      phone: formData.phone.trim(),
      email: formData.email?.trim() || undefined,
      area: formData.area.trim().toUpperCase(),
      address: formData.address?.trim() || undefined,
      bankName: formData.bankName.trim().toUpperCase(),
      bankAccountNumber: formData.bankAccountNumber.trim(),
      bankAccountHolder: formData.bankAccountHolder.trim(),
      notes: formData.notes?.trim() || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
                {coordinator ? 'Edit Koordinator Lapangan' : 'Daftarkan Koordinator Lapangan Baru'}
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-sm">
                Kelola profil pengurus jalur eksternal, wilayah basis, kontak WhatsApp, dan rekening bank settlement.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Baris 1: Kode, Tipe, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Kode Korlap <span className="text-rose-500">*</span>
              </Label>
              <Input
                placeholder="Contoh: KOR-BRT-01"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="font-mono uppercase text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tipe Entitas <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(val: CoordinatorType) => setFormData({ ...formData, type: val })}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Pilih Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ORGANIZATION">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-500" /> Paguyuban / Organisasi
                    </span>
                  </SelectItem>
                  <SelectItem value="INDIVIDUAL">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-500" /> Perorangan (Personal)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Status Operasional
              </Label>
              <Select
                value={formData.isActive ? 'true' : 'false'}
                onValueChange={(val) => setFormData({ ...formData, isActive: val === 'true' })}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Aktif Mengawal</SelectItem>
                  <SelectItem value="false">Non-Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Baris 2: Nama PIC & Nama Organisasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nama Lengkap PIC / Koordinator <span className="text-rose-500">*</span>
              </Label>
              <Input
                placeholder="Contoh: H. Ahmad Sodik"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nama Paguyuban / Serikat Pengurus (Opsional)
              </Label>
              <Input
                placeholder="Contoh: Paguyuban Jalur Barat Pulo Gebang"
                value={formData.organizationName || ''}
                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                className="text-sm"
              />
            </div>
          </div>

          {/* Baris 3: WhatsApp & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-500" /> Nomor WhatsApp Aktif <span className="text-rose-500">*</span>
              </Label>
              <Input
                placeholder="Contoh: 081298765432"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="text-sm font-mono"
                required
              />
              <p className="text-[11px] text-slate-500">Nomor ini dipakai tim finance untuk mengirim bukti rekap transfer.</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email Kontak (Opsional)
              </Label>
              <Input
                type="email"
                placeholder="Contoh: korlap.barat@gmail.com"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="text-sm"
              />
            </div>
          </div>

          {/* Baris 4: Wilayah / Basis Operasi & Alamat */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Wilayah / Basis Terminal Operasional <span className="text-rose-500">*</span>
              </Label>
              <Input
                placeholder="Contoh: JAKARTA - TERMINAL PULO GEBANG"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="text-sm uppercase"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Alamat Posko / Kantor Jalur
              </Label>
              <Input
                placeholder="Contoh: Posko Pengurus Jalur Lt. 2 Terminal Pulo Gebang"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="text-sm"
              />
            </div>
          </div>

          {/* SECTION: DATA REKENING BANK PENCAIRAN SETTLEMENT */}
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-3">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                Data Rekening Bank Tujuan Transfer (Settlement Gelondongan)
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nama Bank <span className="text-rose-500">*</span>
                </Label>
                <Input
                  placeholder="Contoh: BCA / MANDIRI / BRI"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="font-mono uppercase text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nomor Rekening <span className="text-rose-500">*</span>
                </Label>
                <Input
                  placeholder="Contoh: 8830192847"
                  value={formData.bankAccountNumber}
                  onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                  className="font-mono text-sm tracking-wider"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Atas Nama Pemilik Rekening <span className="text-rose-500">*</span>
                </Label>
                <Input
                  placeholder="Contoh: Ahmad Sodik"
                  value={formData.bankAccountHolder}
                  onChange={(e) => setFormData({ ...formData, bankAccountHolder: e.target.value })}
                  className="text-sm uppercase font-semibold"
                  required
                />
              </div>
            </div>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80">
              * Rekening ini akan langsung muncul di meja Kasir/Finance saat melakukan transfer uang koordinasi gelondongan.
            </p>
          </div>

          {/* Catatan Tambahan */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Catatan Operasional (Opsional)
            </Label>
            <Input
              placeholder="Catatan jadwal jaga pos, koordinator cadangan, atau kesepakatan khusus..."
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="text-sm"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="text-sm"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {coordinator ? 'Simpan Perubahan' : 'Daftarkan Koordinator'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
