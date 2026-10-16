import { useState, useEffect } from 'react';
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
import type {
  CashAccount,
  CashAccountFormData,
  Account,
  User,
  CostCenter,
} from '@/types';

interface CashAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CashAccountFormData) => Promise<void>;
  cashAccount?: CashAccount | null;
  glAccounts: Account[];
  custodianUsers: User[];
  costCenters: CostCenter[];
  isLoading?: boolean;
}

export default function CashAccountModal({
  isOpen,
  onClose,
  onSubmit,
  cashAccount,
  glAccounts,
  custodianUsers,
  costCenters,
  isLoading,
}: CashAccountModalProps) {
  const [formData, setFormData] = useState<CashAccountFormData>({
    code: '',
    name: '',
    accountId: '',
    custodianUserId: undefined,
    costCenterId: undefined,
    description: '',
    isActive: true,
  });

  useEffect(() => {
    if (cashAccount) {
      setFormData({
        code: cashAccount.code || '',
        name: cashAccount.name || '',
        accountId: cashAccount.accountId || '',
        custodianUserId: cashAccount.custodianUserId || undefined,
        costCenterId: cashAccount.costCenterId || undefined,
        description: cashAccount.description || '',
        isActive: cashAccount.isActive ?? true,
      });
    } else {
      setFormData({
        code: '',
        name: '',
        accountId: glAccounts[0]?.id || '',
        custodianUserId: undefined,
        costCenterId: undefined,
        description: '',
        isActive: true,
      });
    }
  }, [cashAccount, glAccounts, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {cashAccount ? 'Edit Rekening Kas' : 'Tambah Rekening Kas Baru'}
          </DialogTitle>
          <DialogDescription>
            {cashAccount
              ? 'Perbarui detail akun kas operasional atau kas kecil.'
              : 'Daftarkan titik kas fisik baru (pool/cabang/bengkel).'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="code">
              Kode Kas <span className="text-destructive">*</span>
            </Label>
            <Input
              id="code"
              placeholder="Contoh: CASH-POOL-CIPUTAT"
              value={formData.code}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, code: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              Nama Rekening Kas <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Contoh: Kas Operasional Pool Ciputat"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountId">
              Akun Buku Besar (GL Account) <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.accountId}
              onValueChange={(val) =>
                setFormData((prev) => ({ ...prev, accountId: val }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Akun Buku Besar" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {glAccounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.code} - {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custodianUserId">Petugas Kasir / Penanggung Jawab</Label>
            <Select
              value={formData.custodianUserId || 'NONE'}
              onValueChange={(val) =>
                setFormData((prev) => ({
                  ...prev,
                  custodianUserId: val === 'NONE' ? undefined : val,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Petugas Kasir" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                <SelectItem value="NONE">-- Belum Ditugaskan --</SelectItem>
                {custodianUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="costCenterId">Cost Center Terkait</Label>
            <Select
              value={formData.costCenterId || 'NONE'}
              onValueChange={(val) =>
                setFormData((prev) => ({
                  ...prev,
                  costCenterId: val === 'NONE' ? undefined : val,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Cost Center" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">-- Tidak Terikat Cost Center --</SelectItem>
                {costCenters.map((cc) => (
                  <SelectItem key={cc.id} value={cc.id}>
                    {cc.code} - {cc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Input
              id="description"
              placeholder="Keterangan peruntukan kas..."
              value={formData.description || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Menyimpan...' : cashAccount ? 'Simpan Perubahan' : 'Buat Kas'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
