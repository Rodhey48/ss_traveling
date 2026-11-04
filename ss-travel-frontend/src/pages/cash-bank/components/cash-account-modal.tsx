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
import { Loader2, Wallet, Check, Sparkles } from 'lucide-react';
import type {
  CashAccount,
  CashAccountFormData,
  Account,
  User,
  CostCenter,
} from '@/types';
import { toast } from 'sonner';

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
        accountId: cashAccount.accountId || glAccounts[0]?.id || '',
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
    if (!formData.code.trim()) {
      toast.error('Kode kas wajib diisi');
      return;
    }
    if (!formData.name.trim()) {
      toast.error('Nama rekening kas wajib diisi');
      return;
    }
    if (!formData.accountId) {
      toast.error('Akun Buku Besar (GL) wajib dipilih');
      return;
    }

    await onSubmit({
      ...formData,
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      description: formData.description?.trim(),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              {cashAccount ? 'Edit Rekening Kas Fisik' : 'Tambah Rekening Kas Baru'}
            </div>
          </DialogTitle>
          <DialogDescription className="text-xs">
            {cashAccount
              ? 'Perbarui data titik kas operasional, custodian, dan integrasi GL.'
              : 'Daftarkan titik kas fisik baru di pool, cabang rute, atau kas kecil garasi.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-xs font-semibold">
                Kode Kas <span className="text-destructive">*</span>
              </Label>
              <Input
                id="code"
                placeholder="Contoh: CASH-POOL-CIPUTAT"
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    code: e.target.value.toUpperCase(),
                  }))
                }
                className="font-mono text-xs font-bold"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold">
                Nama Rekening Kas <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Contoh: Kas Induk Pool Ciputat"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="text-xs"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="accountId" className="text-xs font-semibold">
              Akun Buku Besar (GL Account) <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.accountId}
              onValueChange={(val) =>
                setFormData((prev) => ({ ...prev, accountId: val }))
              }
              disabled={isLoading}
            >
              <SelectTrigger id="accountId" className="text-xs h-9">
                <SelectValue placeholder="Pilih Akun Buku Besar Kas" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {glAccounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id} className="text-xs">
                    <span className="font-mono font-bold mr-1">{acc.code}</span> - {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Setiap transaksi kas ini akan otomatis membukukan mutasi ke akun GL terpilih.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="custodianUserId" className="text-xs font-semibold">
                Petugas Kasir / Custodian
              </Label>
              <Select
                value={formData.custodianUserId || 'NONE'}
                onValueChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    custodianUserId: val === 'NONE' ? undefined : val,
                  }))
                }
                disabled={isLoading}
              >
                <SelectTrigger id="custodianUserId" className="text-xs h-9">
                  <SelectValue placeholder="Pilih Petugas Kasir" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="NONE" className="text-xs italic text-muted-foreground">
                    -- Belum Ditugaskan --
                  </SelectItem>
                  {custodianUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id} className="text-xs">
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="costCenterId" className="text-xs font-semibold">
                Cost Center Terkait
              </Label>
              <Select
                value={formData.costCenterId || 'NONE'}
                onValueChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    costCenterId: val === 'NONE' ? undefined : val,
                  }))
                }
                disabled={isLoading}
              >
                <SelectTrigger id="costCenterId" className="text-xs h-9">
                  <SelectValue placeholder="Pilih Cost Center" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="NONE" className="text-xs italic text-muted-foreground">
                    -- Tidak Terikat Cost Center --
                  </SelectItem>
                  {costCenters.map((cc) => (
                    <SelectItem key={cc.id} value={cc.id} className="text-xs">
                      <span className="font-mono font-bold mr-1">{cc.code}</span> - {cc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="description" className="text-xs font-semibold">
                Keterangan / Lokasi Fisik
              </Label>
              <Input
                id="description"
                placeholder="Contoh: Laci kasir meja 1 Pool Rempoa Ciputat"
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                className="text-xs h-9"
                disabled={isLoading}
              />
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
                disabled={isLoading}
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

          <DialogFooter className="pt-3 border-t border-slate-200/80 dark:border-white/10 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="text-xs h-8.5"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="text-xs h-8.5 gap-1.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Menyimpan...
                </>
              ) : cashAccount ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Simpan Perubahan
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" /> Buat Rekening Kas
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
