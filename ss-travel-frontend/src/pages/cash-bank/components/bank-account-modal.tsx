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
import type { BankAccount, BankAccountFormData, Account } from '@/types';

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
  const [formData, setFormData] = useState<BankAccountFormData>({
    code: '',
    bankName: 'BCA',
    accountName: 'PT SS Traveling Official',
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
        accountName: bankAccount.accountName || 'PT SS Traveling Official',
        accountNumber: bankAccount.accountNumber || '',
        accountId: bankAccount.accountId || '',
        currency: bankAccount.currency || 'IDR',
        description: bankAccount.description || '',
        isActive: bankAccount.isActive ?? true,
      });
    } else {
      setFormData({
        code: '',
        bankName: 'BCA',
        accountName: 'PT SS Traveling Official',
        accountNumber: '',
        accountId: glAccounts[0]?.id || '',
        currency: 'IDR',
        description: '',
        isActive: true,
      });
    }
  }, [bankAccount, glAccounts, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {bankAccount ? 'Edit Rekening Bank' : 'Tambah Rekening Bank Baru'}
          </DialogTitle>
          <DialogDescription>
            {bankAccount
              ? 'Perbarui detail rekening korporat perusahaan.'
              : 'Daftarkan rekening bank korporat operasional baru.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">
                Kode Rekening <span className="text-destructive">*</span>
              </Label>
              <Input
                id="code"
                placeholder="Contoh: BANK-BCA-OPS"
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, code: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankName">
                Nama Bank <span className="text-destructive">*</span>
              </Label>
              <Input
                id="bankName"
                placeholder="Contoh: BCA, Mandiri, BRI"
                value={formData.bankName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bankName: e.target.value }))
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountName">
              Nama Pemilik Rekening <span className="text-destructive">*</span>
            </Label>
            <Input
              id="accountName"
              placeholder="Contoh: PT SS Traveling Official"
              value={formData.accountName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, accountName: e.target.value }))
              }
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="accountNumber">
                Nomor Rekening <span className="text-destructive">*</span>
              </Label>
              <Input
                id="accountNumber"
                placeholder="Contoh: 8229994370"
                value={formData.accountNumber}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, accountNumber: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Mata Uang</Label>
              <Input
                id="currency"
                value={formData.currency || 'IDR'}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, currency: e.target.value }))
                }
                maxLength={3}
              />
            </div>
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
            <Label htmlFor="description">Deskripsi / Kantor Cabang</Label>
            <Input
              id="description"
              placeholder="Contoh: KCU Ciputat, untuk penerimaan transfer DP & tiket"
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
              {isLoading ? 'Menyimpan...' : bankAccount ? 'Simpan Perubahan' : 'Buat Rekening'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
