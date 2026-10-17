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
import type { Agent, AgentFormData, AgentType, AgentSettlementType } from '@/types';

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
        isActive: agent.isActive,
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
    await onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {agent ? 'Edit Mitra Agen Penjualan' : 'Daftarkan Mitra Agen Baru'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Kode Agen</Label>
              <Input
                id="code"
                placeholder="misal: AGT-JKT-02"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
                disabled={Boolean(agent)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nama Mitra Agen</Label>
              <Input
                id="name"
                placeholder="misal: Agen Terminal Kampung Rambutan"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agentType">Kategori Agen</Label>
              <Select
                value={formData.agentType}
                onValueChange={(val) =>
                  setFormData({ ...formData, agentType: val as AgentType })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OFFLINE">Agen Fisik Loket / Terminal</SelectItem>
                  <SelectItem value="ONLINE_OTA">Online Travel Agent (OTA)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Kota Domisili (Smart Filter)</Label>
              <Select
                value={formData.city}
                onValueChange={(val) => setFormData({ ...formData, city: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Kota" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JAKARTA">Jakarta</SelectItem>
                  <SelectItem value="TANGERANG">Tangerang</SelectItem>
                  <SelectItem value="YOGYAKARTA">Yogyakarta</SelectItem>
                  <SelectItem value="ALL">Nasional / Semua Kota (OTA)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Nomor Telepon / WA</Label>
              <Input
                id="phone"
                placeholder="08123456789"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="agen@sstravel.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="settlementType">Mekanisme Penyetoran Uang Tiket</Label>
              <Select
                value={formData.settlementType}
                onValueChange={(val) =>
                  setFormData({
                    ...formData,
                    settlementType: val as AgentSettlementType,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Penyetoran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH_TO_CREW">
                    Titip Tunai ke Kru Bus (SPJ)
                  </SelectItem>
                  <SelectItem value="CASH_TO_OFFICE">
                    Setor Langsung ke Kasir Pool
                  </SelectItem>
                  <SelectItem value="BANK_TRANSFER">
                    Transfer Bank (Invoice Rekon / OTA)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPerson">Nama PIC / Penanggung Jawab</Label>
              <Input
                id="contactPerson"
                placeholder="misal: Pak Joko"
                value={formData.contactPerson}
                onChange={(e) =>
                  setFormData({ ...formData, contactPerson: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Alamat Loket / Kantor Agen</Label>
            <Input
              id="address"
              placeholder="misal: Terminal Bus Terpadu Pulo Gebang Lantai 2 Loket No. 14"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : agent ? 'Simpan Perubahan' : 'Daftarkan Agen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
