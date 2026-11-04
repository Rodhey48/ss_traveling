import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import type { Account, BankAccount, BankAccountFormData } from '@/types';
import { Check, Landmark, Loader2, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface BankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BankAccountFormData) => Promise<void>;
  bankAccount?: BankAccount | null;
  glAccounts: Account[];
  isLoading?: boolean;
}

export default function BankAccountModal({
  isOpen,
  onClose,
  onSubmit,
  bankAccount,
  glAccounts,
  isLoading,
}: BankAccountModalProps) {
  const { company } = useAuth();
  const defaultAccountName = company?.name || 'PT SS Travelink Official';

  const [formData, setFormData] = useState<BankAccountFormData>({
    code: '',
    bankName: 'BCA',
    accountName: defaultAccountName,
    accountNumber: '',
    accountId: '',
    currency: 'IDR',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    if (bankAccount) {
      setFormData({
        code: bankAccount.code || '',
        bankName: bankAccount.bankName || 'BCA',
        accountName: bankAccount.accountName || defaultAccountName,
        accountNumber: bankAccount.accountNumber || '',
        accountId: bankAccount.accountId || glAccounts[0]?.id || '',
        currency: bankAccount.currency || 'IDR',
        description: bankAccount.description || '',
        isActive: bankAccount.isActive ?? true,
      });
    } else {
      setFormData({
        code: '',
        bankName: 'BCA',
        accountName: defaultAccountName,
        accountNumber: '',
        accountId: glAccounts[0]?.id || '',
        currency: 'IDR',
        description: '',
        isActive: true,
      });
    }
  }, [bankAccount, glAccounts, isOpen, defaultAccountName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error('Kode rekening bank wajib diisi');
      return;
    }
    if (!formData.bankName.trim()) {
      toast.error('Nama bank wajib diisi');
      return;
    }
    if (!formData.accountNumber.trim()) {
      toast.error('Nomor rekening bank wajib diisi');
      return;
    }
    if (!formData.accountId) {
      toast.error('Akun Buku Besar (GL) wajib dipilih');
      return;
    }

    await onSubmit({
      ...formData,
      code: formData.code.trim().toUpperCase(),
      bankName: formData.bankName.trim(),
      accountName: formData.accountName.trim(),
      accountNumber: formData.accountNumber.trim().replace(/\s+/g, ''),
      description: formData.description?.trim(),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              {bankAccount ? 'Edit Rekening Bank Korporat' : 'Tambah Rekening Bank Baru'}
            </div>
          </DialogTitle>
          <DialogDescription className="text-xs">
            {bankAccount
              ? 'Perbarui detail rekening korporat perusahaan dan integrasi buku besar.'
              : 'Daftarkan rekening bank operasional baru untuk penerimaan atau dropping dana.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-xs font-semibold">
                Kode Rekening <span className="text-destructive">*</span>
              </Label>
              <Input
                id="code"
                placeholder="Contoh: BANK-BCA-MAIN / BANK-MANDIRI-OPS"
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
              <Label htmlFor="bankName" className="text-xs font-semibold">
                Nama Bank <span className="text-destructive">*</span>
              </Label>
              <Input
                id="bankName"
                placeholder="Contoh: Bank BCA / Bank Mandiri / BRI"
                value={formData.bankName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bankName: e.target.value }))
                }
                className="text-xs"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="accountName" className="text-xs font-semibold">
              Nama Pemilik Rekening (Beneficiary) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="accountName"
              placeholder="Contoh: PT SS Travelink Official"
              value={formData.accountName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, accountName: e.target.value }))
              }
              className="text-xs"
              required
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="accountNumber" className="text-xs font-semibold">
                Nomor Rekening Asli <span className="text-destructive">*</span>
              </Label>
              <Input
                id="accountNumber"
                placeholder="Contoh: 8830192831"
                value={formData.accountNumber}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    accountNumber: e.target.value,
                  }))
                }
                className="font-mono text-xs font-bold"
                required
                disabled={isLoading}
              />
              <p className="text-[10px] text-muted-foreground">
                Sistem akan otomatis memproteksi/masking 4 digit terakhir untuk tampilan publik.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="currency" className="text-xs font-semibold">
                Mata Uang
              </Label>
              <Input
                id="currency"
                value={formData.currency || 'IDR'}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    currency: e.target.value.toUpperCase(),
                  }))
                }
                maxLength={3}
                className="font-mono text-xs text-center font-bold"
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
                <SelectValue placeholder="Pilih Akun Buku Besar Bank" />
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
              Akun GL ini akan menampung saldo berjalan dan posting mutasi penerimaan/pengeluaran transfer.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="description" className="text-xs font-semibold">
                Deskripsi / Kantor Cabang / Peruntukan
              </Label>
              <Input
                id="description"
                placeholder="Contoh: KCU Ciputat - Rekening Induk Penerimaan"
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
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
              ) : bankAccount ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Simpan Perubahan
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" /> Buat Rekening Bank
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
