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
import { Building2, Check, Sparkles, Loader2 } from 'lucide-react';
import type { Agent, AgentFormData, AgentType, AgentSettlementType } from '@/types';
import { toast } from 'sonner';

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AgentFormData) => Promise<void>;
  agent: Agent | null;
  loading: boolean;
}

export default function AgentModal({
  isOpen,
  onClose,
  onSubmit,
  agent,
  loading,
}: AgentModalProps) {
  const [formData, setFormData] = useState<AgentFormData>({
    code: '',
    name: '',
    agentType: 'OFFLINE',
    city: 'JAKARTA',
    phone: '',
    email: '',
    address: '',
    settlementType: 'CASH_TO_CREW',
    contactPerson: '',
    isActive: true,
  });

  useEffect(() => {
    if (agent) {
      setFormData({
        code: agent.code,
        name: agent.name,
        agentType: agent.agentType,
        city: agent.city,
        phone: agent.phone,
        email: agent.email || '',
        address: agent.address || '',
        settlementType: agent.settlementType,
        contactPerson: agent.contactPerson || '',
        isActive: agent.isActive ?? true,
      });
    } else {
      setFormData({
        code: '',
        name: '',
        agentType: 'OFFLINE',
        city: 'JAKARTA',
        phone: '',
        email: '',
        address: '',
        settlementType: 'CASH_TO_CREW',
        contactPerson: '',
        isActive: true,
      });
    }
  }, [agent, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error('Kode unik agen wajib diisi');
      return;
    }
    if (!formData.name.trim()) {
      toast.error('Nama mitra agen wajib diisi');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('Nomor telepon / WhatsApp wajib diisi');
      return;
    }

    await onSubmit({
      ...formData,
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email?.trim() || undefined,
      address: formData.address?.trim() || undefined,
      contactPerson: formData.contactPerson?.trim() || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              {agent ? 'Edit Profil Mitra Agen Penjualan' : 'Daftarkan Mitra Agen Baru'}
            </div>
          </DialogTitle>
          <DialogDescription className="text-xs">
            {agent
              ? 'Perbarui data identitas loket fisik atau integrasi online travel agent (OTA).'
              : 'Daftarkan loket terminal baru atau platform online OTA untuk penjualan tiket bus.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Identitas Agen */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-xs font-semibold">
                Kode Agen <span className="text-destructive">*</span>
              </Label>
              <Input
                id="code"
                placeholder="Contoh: AGT-JKT-02"
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    code: e.target.value.toUpperCase(),
                  }))
                }
                disabled={Boolean(agent) || loading}
                className="font-mono text-xs font-bold uppercase h-8.5"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold">
                Nama Mitra Agen <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Contoh: Agen Terminal Pulo Gebang"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="text-xs h-8.5 font-medium"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Kategori & Kota Domisili */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="agentType" className="text-xs font-semibold">
                Kategori Agen <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.agentType}
                onValueChange={(val) => {
                  const aType = val as AgentType;
                  setFormData((prev) => ({
                    ...prev,
                    agentType: aType,
                    city: aType === 'ONLINE_OTA' ? 'ALL' : prev.city === 'ALL' ? 'JAKARTA' : prev.city,
                    settlementType: aType === 'ONLINE_OTA' ? 'BANK_TRANSFER' : prev.settlementType,
                  }));
                }}
                disabled={loading}
              >
                <SelectTrigger id="agentType" className="text-xs h-9">
                  <SelectValue placeholder="Pilih Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OFFLINE" className="text-xs">
                    Agen Fisik Loket / Terminal
                  </SelectItem>
                  <SelectItem value="ONLINE_OTA" className="text-xs">
                    Online Travel Agent (RedBus / Traveloka)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="city" className="text-xs font-semibold">
                Kota Domisili (Smart Route Filter) <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.city}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, city: val }))
                }
                disabled={loading}
              >
                <SelectTrigger id="city" className="text-xs h-9">
                  <SelectValue placeholder="Pilih Kota" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JAKARTA" className="text-xs">Jakarta</SelectItem>
                  <SelectItem value="TANGERANG" className="text-xs">Tangerang</SelectItem>
                  <SelectItem value="YOGYAKARTA" className="text-xs">Yogyakarta</SelectItem>
                  <SelectItem value="ALL" className="text-xs">Nasional / Semua Kota (OTA)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Kontak & PIC */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-semibold">
                Nomor Telepon / WhatsApp <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                placeholder="08123456789"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                className="text-xs h-8.5 font-mono"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactPerson" className="text-xs font-semibold">
                Nama PIC / Pengelola
              </Label>
              <Input
                id="contactPerson"
                placeholder="Contoh: Pak Joko Santoso"
                value={formData.contactPerson || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    contactPerson: e.target.value,
                  }))
                }
                className="text-xs h-8.5"
                disabled={loading}
              />
            </div>
          </div>

          {/* Penyetoran & Status Keaktifan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="settlementType" className="text-xs font-semibold">
                Mekanisme Penyetoran Uang Tiket <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.settlementType}
                onValueChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    settlementType: val as AgentSettlementType,
                  }))
                }
                disabled={loading}
              >
                <SelectTrigger id="settlementType" className="text-xs h-9">
                  <SelectValue placeholder="Pilih Penyetoran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH_TO_CREW" className="text-xs">
                    Titip Tunai ke Kru Bus (SPJ Lapangan)
                  </SelectItem>
                  <SelectItem value="CASH_TO_OFFICE" className="text-xs">
                    Setor Langsung ke Meja Kasir Pool
                  </SelectItem>
                  <SelectItem value="BANK_TRANSFER" className="text-xs">
                    Transfer Bank (Invoice Rekonsiliasi / OTA)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="isActive" className="text-xs font-semibold">
                Status Operasional
              </Label>
              <Select
                value={formData.isActive ? 'ACTIVE' : 'INACTIVE'}
                onValueChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    isActive: val === 'ACTIVE',
                  }))
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

          {/* Email & Alamat */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold">
                Email Korespondensi
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="agen.pulogebang@sstravel.com"
                value={formData.email || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="text-xs h-8.5"
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-xs font-semibold">
                Alamat Loket / Kantor
              </Label>
              <Input
                id="address"
                placeholder="misal: Terminal Terpadu Lantai 2 Loket No. 14"
                value={formData.address || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
                className="text-xs h-8.5"
                disabled={loading}
              />
            </div>
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
              ) : agent ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Simpan Perubahan
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" /> Daftarkan Agen
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
