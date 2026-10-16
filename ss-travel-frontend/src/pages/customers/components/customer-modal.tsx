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
import { Users2 } from 'lucide-react';
import type {
  Customer,
  CustomerFormData,
  CustomerType,
  CustomerTier,
  LeadSource,
} from '@/types';

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
        isActive: customer.isActive,
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
    await onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Users2 className="h-6 w-6 text-primary" />
            {customer ? `Edit Pelanggan: ${customer.institutionName || customer.picName}` : 'Tambah Pelanggan / Leads Baru'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Baris 1: Segmen Tipe & Tier */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="customerType" className="text-xs font-semibold">
                Segmen Pelanggan <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.customerType}
                onValueChange={(val: CustomerType) =>
                  setFormData({ ...formData, customerType: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Segmen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CORPORATE">🏢 Korporat / Perusahaan</SelectItem>
                  <SelectItem value="SCHOOL">🎓 Sekolah / Universitas</SelectItem>
                  <SelectItem value="COMMUNITY">🚴 Komunitas / Paguyuban</SelectItem>
                  <SelectItem value="GOVERNMENT">🏛️ Lembaga / Dinas Pemda</SelectItem>
                  <SelectItem value="INDIVIDUAL">👤 Pribadi / Keluarga</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="customerTier" className="text-xs font-semibold">
                Tier / Tingkat Prioritas
              </Label>
              <Select
                value={formData.customerTier}
                onValueChange={(val: CustomerTier) =>
                  setFormData({ ...formData, customerTier: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLATINUM">💎 Platinum (Sewa Rutin & Nilai Tinggi)</SelectItem>
                  <SelectItem value="GOLD">🥇 Gold (Pelanggan Loyal)</SelectItem>
                  <SelectItem value="SILVER">🥈 Silver (Pernah Sewa 1-2x)</SelectItem>
                  <SelectItem value="BRONZE">🥉 Bronze (Prospek Baru / Leads)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Baris 2: Nama Instansi & Kode */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="institutionName" className="text-xs font-semibold">
                Nama Instansi / Perusahaan / Komunitas
              </Label>
              <Input
                id="institutionName"
                placeholder="Contoh: PT Mitra Sejahtera Abadi"
                value={formData.institutionName}
                onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="code" className="text-xs font-semibold">
                Kode Pelanggan (Kosongkan utk Auto-Gen)
              </Label>
              <Input
                id="code"
                placeholder="Contoh: CUST-0001"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          {/* Baris 3: Nama PIC & Telepon WA */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="picName" className="text-xs font-semibold">
                Nama PIC / Narahubung <span className="text-destructive">*</span>
              </Label>
              <Input
                id="picName"
                placeholder="Contoh: Bpk. Aris Setiawan"
                value={formData.picName}
                onChange={(e) => setFormData({ ...formData, picName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone" className="text-xs font-semibold">
                Nomor WhatsApp / Telepon <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                placeholder="Contoh: 081234567890"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Baris 4: Email & Asal Kota */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs font-semibold">
                Alamat Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Contoh: procurement@mitrasejahtera.co.id"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="city" className="text-xs font-semibold">
                Kota / Wilayah Domisili
              </Label>
              <Input
                id="city"
                placeholder="Contoh: Tangerang / Jakarta"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
          </div>

          {/* Baris 5: Sumber Prospek (Lead Source) */}
          <div className="space-y-1">
            <Label htmlFor="leadSource" className="text-xs font-semibold">
              Sumber Prospek (Lead Source)
            </Label>
            <Select
              value={formData.leadSource}
              onValueChange={(val: LeadSource) =>
                setFormData({ ...formData, leadSource: val })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Sumber" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DIRECT">Langsung Datang ke Pool Garasi</SelectItem>
                <SelectItem value="WHATSAPP">Chat WhatsApp Hotline Resmi</SelectItem>
                <SelectItem value="INSTAGRAM">Instagram / Media Sosial</SelectItem>
                <SelectItem value="WEBSITE">Website Resmi www.sstravelink.id</SelectItem>
                <SelectItem value="REFERRAL">Rekomendasi Rekanan / Mitra</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Alamat Lengkap */}
          <div className="space-y-1">
            <Label htmlFor="address" className="text-xs font-semibold">
              Alamat Lengkap / Titik Jemput Utama
            </Label>
            <Input
              id="address"
              placeholder="Contoh: Kawasan Industri MM2100 Blok C-4, Cikarang Barat"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          {/* Catatan Khusus */}
          <div className="space-y-1">
            <Label htmlFor="specialNotes" className="text-xs font-semibold">
              Catatan Khusus Klien (Preferensi Armada, Riwayat Booking, dsb.)
            </Label>
            <Input
              id="specialNotes"
              placeholder="Contoh: Klien sewa rutin pariwisata 5 armada tiap akhir tahun"
              value={formData.specialNotes}
              onChange={(e) => setFormData({ ...formData, specialNotes: e.target.value })}
            />
          </div>

          <DialogFooter className="pt-4 border-t gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : customer ? 'Simpan Perubahan' : 'Simpan Pelanggan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
