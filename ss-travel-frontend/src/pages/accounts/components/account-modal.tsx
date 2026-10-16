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
import { Checkbox } from '@/components/ui/checkbox';
import type { Account, AccountFormData, AccountType, NormalBalance } from '@/types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AccountFormData) => Promise<void>;
  account?: Account | null;
  parentAccount?: Account | null;
  allAccounts: Account[];
  isLoading?: boolean;
}

export default function AccountModal({
  isOpen,
  onClose,
  onSubmit,
  account,
  parentAccount,
  allAccounts,
  isLoading,
}: AccountModalProps) {
  const [formData, setFormData] = useState<AccountFormData>({
    code: '',
    name: '',
    type: 'ASSET',
    normalBalance: 'DEBIT',
    parentId: undefined,
    isPostable: true,
    description: '',
    isActive: true,
  });

  useEffect(() => {
    if (account) {
      setFormData({
        code: account.code || '',
        name: account.name || '',
        type: account.type || 'ASSET',
        normalBalance: account.normalBalance || 'DEBIT',
        parentId: account.parentId || undefined,
        isPostable: account.isPostable ?? true,
        description: account.description || '',
        isActive: account.isActive ?? true,
      });
    } else if (parentAccount) {
      setFormData({
        code: `${parentAccount.code}`,
        name: '',
        type: parentAccount.type,
        normalBalance: parentAccount.normalBalance,
        parentId: parentAccount.id,
        isPostable: true,
        description: '',
        isActive: true,
      });
    } else {
      setFormData({
        code: '',
        name: '',
        type: 'ASSET',
        normalBalance: 'DEBIT',
        parentId: undefined,
        isPostable: true,
        description: '',
        isActive: true,
      });
    }
  }, [account, parentAccount, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleTypeChange = (type: AccountType) => {
    // Default normal balance based on account type
    const defaultNormalBalance: NormalBalance =
      type === 'ASSET' || type === 'EXPENSE' ? 'DEBIT' : 'CREDIT';

    setFormData((prev) => ({
      ...prev,
      type,
      normalBalance: defaultNormalBalance,
    }));
  };

  // Filter possible parents (cannot be the account itself)
  const availableParents = allAccounts.filter(
    (acc) => !account || acc.id !== account.id,
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {account ? 'Edit Akun COA' : parentAccount ? `Tambah Sub-Akun untuk [${parentAccount.code}]` : 'Tambah Akun Baru'}
          </DialogTitle>
          <DialogDescription>
            {account
              ? 'Perbarui detail bagan akun akuntansi.'
              : 'Daftarkan akun baru ke dalam struktur Chart of Accounts.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">
                Kode Akun <span className="text-destructive">*</span>
              </Label>
              <Input
                id="code"
                placeholder="Contoh: 11106"
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, code: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">
                Tipe Akun <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(val: AccountType) => handleTypeChange(val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Tipe Akun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASSET">1 - Aset (ASSET)</SelectItem>
                  <SelectItem value="LIABILITY">2 - Liabilitas (LIABILITY)</SelectItem>
                  <SelectItem value="EQUITY">3 - Ekuitas (EQUITY)</SelectItem>
                  <SelectItem value="REVENUE">4 - Pendapatan (REVENUE)</SelectItem>
                  <SelectItem value="EXPENSE">5 - Beban (EXPENSE)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              Nama Akun <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Contoh: Kas Cadangan Operasional"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="normalBalance">Saldo Normal</Label>
              <Select
                value={formData.normalBalance}
                onValueChange={(val: NormalBalance) =>
                  setFormData((prev) => ({ ...prev, normalBalance: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Saldo Normal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEBIT">DEBIT</SelectItem>
                  <SelectItem value="CREDIT">KREDIT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentId">Akun Induk (Parent)</Label>
              <Select
                value={formData.parentId || 'NONE'}
                onValueChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    parentId: val === 'NONE' ? undefined : val,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Akun Induk" />
                </SelectTrigger>
                <SelectContent className="max-h-[220px]">
                  <SelectItem value="NONE">-- Tidak Ada (Header Utama) --</SelectItem>
                  {availableParents.map((parent) => (
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.code} - {parent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border p-3 bg-muted/40 space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPostable"
                checked={formData.isPostable}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    isPostable: checked === true,
                  }))
                }
              />
              <Label htmlFor="isPostable" className="font-medium cursor-pointer">
                Akun Postable (Dapat Menerima Jurnal)
              </Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Jika tidak dicentang, akun ini menjadi <strong>Akun Header (Kategori/Grup)</strong> dan tidak dapat dipilih langsung dalam pencatatan jurnal transaksi keuangan.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi / Catatan Akuntansi (Opsional)</Label>
            <Input
              id="description"
              placeholder="Keterangan fungsi atau aturan perlakuan akun..."
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
              {isLoading ? 'Menyimpan...' : account ? 'Simpan Perubahan' : 'Buat Akun'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
