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
import { Users2, Check, Loader2, Sparkles } from 'lucide-react';
import type {
  Customer,
  CustomerFormData,
  CustomerType,
  CustomerTier,
  LeadSource,
} from '@/types';
import { toast } from 'sonner';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  customer?: Customer | null;
  loading?: boolean;
}

export default function CustomerModal({
  isOpen,
  onClose,
  onSubmit,
  customer,
  loading = false,
}: CustomerModalProps) {
  const [formData, setFormData] = useState<CustomerFormData>({
    code: '',
    customerType: 'CORPORATE',
    institutionName: '',
    picName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    leadSource: 'DIRECT',
    customerTier: 'BRONZE',
    specialNotes: '',
    isActive: true,
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        code: customer.code,
        customerType: customer.customerType,
        institutionName: customer.institutionName || '',
        picName: customer.picName,
        phone: customer.phone,
        email: customer.email || '',
        address: customer.address || '',
        city: customer.city || '',
        leadSource: customer.leadSource,
        customerTier: customer.customerTier,
        specialNotes: customer.specialNotes || '',
        isActive: customer.isActive ?? true,
      });
    } else {
      setFormData({
        code: '',
        customerType: 'CORPORATE',
        institutionName: '',
        picName: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        leadSource: 'DIRECT',
        customerTier: 'BRONZE',
        specialNotes: '',
        isActive: true,
      });
    }
  }, [customer, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.picName.trim()) {
      toast.error('Nama PIC / narahubung wajib diisi');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('Nomor telepon / WhatsApp wajib diisi');
      return;
    }

    await onSubmit({
      ...formData,
      code: formData.code ? formData.code.trim().toUpperCase() : undefined,
      institutionName: formData.institutionName?.trim() || undefined,
      picName: formData.picName.trim(),
      phone: formData.phone.trim(),
      email: formData.email?.trim() || undefined,
      address: formData.address?.trim() || undefined,
      city: formData.city?.trim() || undefined,
      specialNotes: formData.specialNotes?.trim() || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Users2 className="h-5 w-5" />
            </div>
            <div>
              {customer
                ? `Edit Pelanggan: ${customer.institutionName || customer.picName}`
                : 'Tambah Pelanggan / Leads Sewa Wisata Baru'}
            </div>
          </DialogTitle>
          <DialogDescription className="text-xs">
            {customer
              ? 'Perbarui profil kontak, segmen institusi, dan tier prioritas pelanggan.'
              : 'Daftarkan prospek penyewa pariwisata atau kontak pelanggan setia PT SS Travelink Official.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Baris 1: Segmen Tipe & Tier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="customerType" className="text-xs font-semibold">
                Segmen Pelanggan <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.customerType}
                onValueChange={(val: CustomerType) =>
                  setFormData((prev) => ({ ...prev, customerType: val }))
                }
                disabled={loading}
              >
                <SelectTrigger id="customerType" className="text-xs h-9">
                  <SelectValue placeholder="Pilih Segmen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CORPORATE" className="text-xs">
                    🏢 Korporat / Perusahaan Pabrik
                  </SelectItem>
                  <SelectItem value="SCHOOL" className="text-xs">
                    🎓 Sekolah / Universitas (Study Tour)
                  </SelectItem>
                  <SelectItem value="COMMUNITY" className="text-xs">
                    🚴 Komunitas / Event Organizer
                  </SelectItem>
                  <SelectItem value="GOVERNMENT" className="text-xs">
                    🏛️ Instansi Pemerintah / Dinas
                  </SelectItem>
                  <SelectItem value="INDIVIDUAL" className="text-xs">
                    👤 Pribadi / Keluarga Wisata
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="customerTier" className="text-xs font-semibold">
                Tier / Tingkat Prioritas
              </Label>
              <Select
                value={formData.customerTier}
                onValueChange={(val: CustomerTier) =>
                  setFormData((prev) => ({ ...prev, customerTier: val }))
                }
                disabled={loading}
              >
                <SelectTrigger id="customerTier" className="text-xs h-9">
                  <SelectValue placeholder="Pilih Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLATINUM" className="text-xs">
                    💎 Platinum (Sewa Rutin &amp; Skala Besar)
                  </SelectItem>
                  <SelectItem value="GOLD" className="text-xs">
                    🥇 Gold (Pelanggan Loyal Tahunan)
                  </SelectItem>
                  <SelectItem value="SILVER" className="text-xs">
                    🥈 Silver (Pernah Sewa 1-2x)
                  </SelectItem>
                  <SelectItem value="BRONZE" className="text-xs">
                    🥉 Bronze (Prospek Baru / Leads)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Baris 2: Nama Instansi & Kode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="institutionName" className="text-xs font-semibold">
                Nama Instansi / Perusahaan / Sekolah
              </Label>
              <Input
                id="institutionName"
                placeholder="misal: PT Mitra Sejahtera Abadi"
                value={formData.institutionName || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, institutionName: e.target.value }))
                }
                className="text-xs h-8.5 font-medium"
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-xs font-semibold">
                Kode Pelanggan (Kosongkan utk Auto-Gen)
              </Label>
              <Input
                id="code"
                placeholder="misal: CUST-0001"
                value={formData.code || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    code: e.target.value.toUpperCase(),
                  }))
                }
                className="font-mono text-xs font-bold uppercase h-8.5"
                disabled={Boolean(customer) || loading}
              />
            </div>
          </div>

          {/* Baris 3: Nama PIC & Telepon WA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="picName" className="text-xs font-semibold">
                Nama PIC / Narahubung Panitia <span className="text-destructive">*</span>
              </Label>
              <Input
                id="picName"
                placeholder="misal: Bpk. Aris Setiawan"
                value={formData.picName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, picName: e.target.value }))
                }
                className="text-xs h-8.5 font-medium"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-semibold">
                Nomor WhatsApp / Telepon <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                placeholder="misal: 081234567890"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                className="text-xs h-8.5 font-mono"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Baris 4: Email & Asal Kota */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold">
                Alamat Email Resmi
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="procurement@mitrasejahtera.co.id"
                value={formData.email || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="text-xs h-8.5"
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="city" className="text-xs font-semibold">
                Kota / Wilayah Domisili
              </Label>
              <Input
                id="city"
                placeholder="misal: Tangerang Selatan / Jakarta"
                value={formData.city || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, city: e.target.value }))
                }
                className="text-xs h-8.5"
                disabled={loading}
              />
            </div>
          </div>

          {/* Baris 5: Sumber Prospek & Status Keaktifan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="leadSource" className="text-xs font-semibold">
                Sumber Prospek (Lead Source)
              </Label>
              <Select
                value={formData.leadSource}
                onValueChange={(val: LeadSource) =>
                  setFormData((prev) => ({ ...prev, leadSource: val }))
                }
                disabled={loading}
              >
                <SelectTrigger id="leadSource" className="text-xs h-9">
                  <SelectValue placeholder="Pilih Sumber" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIRECT" className="text-xs">
                    Langsung Datang ke Pool Garasi
                  </SelectItem>
                  <SelectItem value="WHATSAPP" className="text-xs">
                    Chat WhatsApp Hotline Resmi
                  </SelectItem>
                  <SelectItem value="INSTAGRAM" className="text-xs">
                    Instagram / Media Sosial
                  </SelectItem>
                  <SelectItem value="WEBSITE" className="text-xs">
                    Website Resmi www.sstravelink.id
                  </SelectItem>
                  <SelectItem value="REFERRAL" className="text-xs">
                    Rekomendasi Rekanan / Mitra
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="isActive" className="text-xs font-semibold">
                Status Pelanggan
              </Label>
              <Select
                value={formData.isActive ? 'ACTIVE' : 'INACTIVE'}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, isActive: val === 'ACTIVE' }))
                }
                disabled={loading}
              >
                <SelectTrigger id="isActive" className="text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE" className="text-xs">
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Aktif Operasional
                    </span>
                  </SelectItem>
                  <SelectItem value="INACTIVE" className="text-xs">
                    <span className="flex items-center gap-1.5 text-zinc-500 font-medium">
                      <span className="h-2 w-2 rounded-full bg-zinc-400" />
                      Non-Aktif
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Alamat Titik Jemput */}
          <div className="space-y-1.5">
            <Label htmlFor="address" className="text-xs font-semibold">
              Alamat Lengkap / Titik Penjemputan Armada
            </Label>
            <Input
              id="address"
              placeholder="misal: Kawasan Industri MM2100 Blok C-4, Cikarang Barat"
              value={formData.address || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, address: e.target.value }))
              }
              className="text-xs h-8.5"
              disabled={loading}
            />
          </div>

          {/* Catatan Khusus */}
          <div className="space-y-1.5">
            <Label htmlFor="specialNotes" className="text-xs font-semibold">
              Catatan Khusus Klien (Preferensi Bus, Fasilitas Khusus, dsb.)
            </Label>
            <Input
              id="specialNotes"
              placeholder="misal: Permintaan supir tertentu, sewa rutin pariwisata 5 armada tiap libur semester"
              value={formData.specialNotes || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, specialNotes: e.target.value }))
              }
              className="text-xs h-8.5"
              disabled={loading}
            />
          </div>

          <DialogFooter className="pt-3 border-t border-slate-200/80 dark:border-white/10 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="text-xs h-8.5"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="text-xs h-8.5 gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Menyimpan...
                </>
              ) : customer ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Simpan Perubahan
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" /> Simpan Pelanggan Baru
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
