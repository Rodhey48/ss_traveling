import { useState } from 'react';
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
import { UserPlus, Sparkles, Building2 } from 'lucide-react';
import { CustomerService } from '@/services/customer.service';
import type { Customer, CustomerType, LeadSource } from '@/types';
import { toast } from 'sonner';

interface QuickCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (customer: Customer) => void;
}

export default function QuickCustomerModal({
  open,
  onOpenChange,
  onCreated,
}: QuickCustomerModalProps) {
  const [loading, setLoading] = useState(false);

  // Form State
  const [customerType, setCustomerType] = useState<CustomerType>('CORPORATE');
  const [institutionName, setInstitutionName] = useState('');
  const [picName, setPicName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [leadSource, setLeadSource] = useState<LeadSource>('WHATSAPP');

  const resetForm = () => {
    setCustomerType('CORPORATE');
    setInstitutionName('');
    setPicName('');
    setPhone('');
    setEmail('');
    setLeadSource('WHATSAPP');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!picName.trim()) {
      toast.warning('Nama PIC / Pemesan wajib diisi.');
      return;
    }

    if (!phone.trim()) {
      toast.warning('Nomor WhatsApp / telepon wajib diisi.');
      return;
    }

    const finalInstName = institutionName.trim()
      ? institutionName.trim()
      : `Rombongan ${picName.trim()}`;

    setLoading(true);
    try {
      const res = await CustomerService.create({
        customerType,
        institutionName: finalInstName,
        picName: picName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        leadSource,
        customerTier: 'BRONZE',
        isActive: true,
      });

      const createdCustomer = res.data;
      toast.success(
        `Klien '${createdCustomer.institutionName || createdCustomer.picName}' berhasil didaftarkan dan langsung terpilih!`,
      );

      resetForm();
      onOpenChange(false);
      onCreated(createdCustomer);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mendaftarkan klien baru.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-primary/10 text-primary">
              <UserPlus className="w-5 h-5" />
            </span>
            <div>
              <DialogTitle className="text-lg font-bold">
                Tambah Klien / Leads Baru (CRM)
              </DialogTitle>
              <DialogDescription className="text-xs">
                Daftarkan data kontak pelanggan sewa pariwisata secara instan on-the-fly.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">Tipe Klien / Segmen *</Label>
              <Select
                value={customerType}
                onValueChange={(val) => setCustomerType(val as CustomerType)}
              >
                <SelectTrigger className="mt-1.5 h-10 text-xs">
                  <SelectValue placeholder="Pilih Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CORPORATE">Perusahaan / B2B</SelectItem>
                  <SelectItem value="COMMUNITY">Komunitas / Paguyuban</SelectItem>
                  <SelectItem value="SCHOOL">Sekolah / Kampus</SelectItem>
                  <SelectItem value="INDIVIDUAL">Perorangan / Keluarga</SelectItem>
                  <SelectItem value="GOVERNMENT">Instansi Pemerintah</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold">Sumber Kontak (Lead) *</Label>
              <Select
                value={leadSource}
                onValueChange={(val) => setLeadSource(val as LeadSource)}
              >
                <SelectTrigger className="mt-1.5 h-10 text-xs">
                  <SelectValue placeholder="Sumber Leads" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WHATSAPP">WhatsApp Official</SelectItem>
                  <SelectItem value="DIRECT">Datang ke Pool (Walk-in)</SelectItem>
                  <SelectItem value="INSTAGRAM">Instagram Ads</SelectItem>
                  <SelectItem value="WEBSITE">Website Portal</SelectItem>
                  <SelectItem value="REFERRAL">Rekomendasi / Relasi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold flex items-center justify-between">
              <span>Nama Instansi / Rombongan / Keluarga *</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                {customerType === 'INDIVIDUAL' ? 'Opsional (default: Rombongan [Nama PIC])' : 'Wajib diisi'}
              </span>
            </Label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Building2 className="w-4 h-4" />
              </span>
              <Input
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                placeholder={
                  customerType === 'INDIVIDUAL'
                    ? 'Contoh: Rombongan Keluarga Besar Bpk. Rudi'
                    : 'Contoh: PT Astra Sedaya / SMA Negeri 1 Tangerang'
                }
                className="pl-9 h-10 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">Nama PIC / Kontak Pemesan *</Label>
              <Input
                value={picName}
                onChange={(e) => setPicName(e.target.value)}
                placeholder="Contoh: Pak Hendra Pratama"
                className="mt-1.5 h-10 text-xs"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Nomor WhatsApp / HP *</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="mt-1.5 h-10 text-xs font-medium"
                required
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Alamat Email (Opsional untuk Penawaran)</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Contoh: procurement@perusahaan.co.id"
              className="mt-1.5 h-10 text-xs"
            />
          </div>

          <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="h-9 text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading || !picName.trim() || !phone.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-xs min-w-[150px]"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              {loading ? 'Mendaftarkan...' : 'Simpan & Pilih Klien'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
