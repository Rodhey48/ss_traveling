import { useState, useEffect } from 'react';
import Heading from '@/components/shared/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Search,
  Wallet,
  Landmark,
  CreditCard,
  User as UserIcon,
  Building,
  Edit,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import CashAccountModal from './components/cash-account-modal';
import BankAccountModal from './components/bank-account-modal';
import { CashBankService } from '@/services/cash-bank.service';
import { AccountService } from '@/services/account.service';
import { UserService } from '@/services/user.service';
import { OrganizationService } from '@/services/organization.service';
import type {
  CashAccount,
  CashAccountFormData,
  BankAccount,
  BankAccountFormData,
  Account,
  User,
  CostCenter,
} from '@/types';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/use-permission';

export default function CashBankPage() {
  const { isCreate, isUpdate, isDelete } = usePermission();
  const [activeTab, setActiveTab] = useState<'cash' | 'bank'>('cash');
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [glAccounts, setGlAccounts] = useState<Account[]>([]);
  const [custodianUsers, setCustodianUsers] = useState<User[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modals
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [selectedCash, setSelectedCash] = useState<CashAccount | null>(null);

  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<BankAccount | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const fetchMasterDependencies = async () => {
    try {
      const [accRes, userRes, ccRes] = await Promise.all([
        AccountService.findAll({ type: 'ASSET', isPostable: true }),
        UserService.findAll({ limit: 100 }),
        OrganizationService.getCostCenters(),
      ]);

      if (accRes?.data) setGlAccounts(accRes.data as Account[]);
      if (userRes?.data?.data) setCustodianUsers(userRes.data.data);
      if (ccRes?.data) setCostCenters(ccRes.data);
    } catch (err: any) {
      console.error('Failed fetching master dependencies', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cashRes, bankRes] = await Promise.all([
        CashBankService.findAllCashAccounts({ search }),
        CashBankService.findAllBankAccounts({ search }),
      ]);

      if (cashRes?.data) setCashAccounts(cashRes.data);
      if (bankRes?.data) setBankAccounts(bankRes.data);
    } catch (err: any) {
      toast.error('Gagal memuat data kas & rekening bank', {
        description: err?.response?.data?.message || err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterDependencies();
    fetchData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  // Cash Handlers
  const handleOpenCreateCash = () => {
    setSelectedCash(null);
    setIsCashModalOpen(true);
  };

  const handleOpenEditCash = (cash: CashAccount) => {
    setSelectedCash(cash);
    setIsCashModalOpen(true);
  };

  const handleSubmitCash = async (data: CashAccountFormData) => {
    setSubmitting(true);
    try {
      if (selectedCash) {
        await CashBankService.updateCashAccount(selectedCash.id, data);
        toast.success(`Rekening kas '${data.name}' berhasil diperbarui`);
      } else {
        await CashBankService.createCashAccount(data);
        toast.success(`Rekening kas '${data.name}' berhasil dibuat`);
      }
      setIsCashModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error('Gagal menyimpan rekening kas', {
        description: err?.response?.data?.message || err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCash = async (cash: CashAccount) => {
    if (!confirm(`Apakah Anda yakin ingin menonaktifkan kas '${cash.name}'?`)) return;
    try {
      await CashBankService.removeCashAccount(cash.id);
      toast.success(`Kas '${cash.name}' berhasil dinonaktifkan`);
      fetchData();
    } catch (err: any) {
      toast.error('Gagal menonaktifkan kas', {
        description: err?.response?.data?.message || err.message,
      });
    }
  };

  // Bank Handlers
  const handleOpenCreateBank = () => {
    setSelectedBank(null);
    setIsBankModalOpen(true);
  };

  const handleOpenEditBank = (bank: BankAccount) => {
    setSelectedBank(bank);
    setIsBankModalOpen(true);
  };

  const handleSubmitBank = async (data: BankAccountFormData) => {
    setSubmitting(true);
    try {
      if (selectedBank) {
        await CashBankService.updateBankAccount(selectedBank.id, data);
        toast.success(`Rekening bank '${data.bankName}' berhasil diperbarui`);
      } else {
        await CashBankService.createBankAccount(data);
        toast.success(`Rekening bank '${data.bankName}' berhasil dibuat`);
      }
      setIsBankModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error('Gagal menyimpan rekening bank', {
        description: err?.response?.data?.message || err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBank = async (bank: BankAccount) => {
    if (!confirm(`Apakah Anda yakin ingin menonaktifkan rekening '${bank.bankName} - ${bank.accountNumberMasked}'?`)) return;
    try {
      await CashBankService.removeBankAccount(bank.id);
      toast.success(`Rekening '${bank.bankName}' berhasil dinonaktifkan`);
      fetchData();
    } catch (err: any) {
      toast.error('Gagal menonaktifkan rekening bank', {
        description: err?.response?.data?.message || err.message,
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Heading
          title="Kas & Rekening Bank"
          description="Manajemen rekening kas operasional pool, kas kecil garasi, dan rekening bank korporat SS Traveling."
        />
        <div className="flex items-center space-x-2">
          {activeTab === 'cash' ? (
            isCreate && (
              <Button onClick={handleOpenCreateCash}>
                <Plus className="mr-2 h-4 w-4" /> Tambah Rekening Kas
              </Button>
            )
          ) : (
            isCreate && (
              <Button onClick={handleOpenCreateBank}>
                <Plus className="mr-2 h-4 w-4" /> Tambah Rekening Bank
              </Button>
            )
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-xs border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Kas Operasional & Petty Cash
              <Wallet className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cashAccounts.length} Titik Kas</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pool Ciputat, Cabang Yogya, Kas Kecil Garasi
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-l-4 border-l-blue-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Rekening Bank Korporat
              <Landmark className="h-4 w-4 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bankAccounts.length} Rekening Aktif</div>
            <p className="text-xs text-muted-foreground mt-1">
              BCA KCU Ciputat, Bank Mandiri Utama
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-l-4 border-l-emerald-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Keamanan Rekening
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">Masked Security</div>
            <p className="text-xs text-muted-foreground mt-1">
              Nomor rekening diproteksi otomatis untuk audit publik
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs View */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'cash' | 'bank')} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <TabsList className="grid w-full sm:w-[420px] grid-cols-2">
            <TabsTrigger value="cash" className="flex items-center space-x-2">
              <Wallet className="h-4 w-4" />
              <span>Kas Fisik ({cashAccounts.length})</span>
            </TabsTrigger>
            <TabsTrigger value="bank" className="flex items-center space-x-2">
              <Landmark className="h-4 w-4" />
              <span>Rekening Bank ({bankAccounts.length})</span>
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari kode atau nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </form>
        </div>

        {/* Tab 1: Kas Operasional */}
        <TabsContent value="cash" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Kode Kas</TableHead>
                    <TableHead>Nama Kas</TableHead>
                    <TableHead>Akun Buku Besar (GL)</TableHead>
                    <TableHead>Petugas Kasir</TableHead>
                    <TableHead>Cost Center</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Memuat data kas operasional...
                      </TableCell>
                    </TableRow>
                  ) : cashAccounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Belum ada rekening kas terdaftar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    cashAccounts.map((cash) => (
                      <TableRow key={cash.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono font-bold text-xs">
                          {cash.code}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{cash.name}</div>
                          {cash.description && (
                            <div className="text-xs text-muted-foreground truncate max-w-sm">
                              {cash.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {cash.account ? (
                            <Badge variant="outline" className="font-mono text-xs">
                              {cash.account.code} - {cash.account.name}
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {cash.custodianUser ? (
                            <div className="flex items-center text-xs">
                              <UserIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                              <span>{cash.custodianUser.name}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Belum ditugaskan</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {cash.costCenter ? (
                            <div className="flex items-center text-xs">
                              <Building className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                              <span>{cash.costCenter.name}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-1">
                            {isUpdate && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleOpenEditCash(cash)}
                              >
                                <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            )}
                            {isDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:text-destructive"
                                onClick={() => handleDeleteCash(cash)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Rekening Bank Korporat */}
        <TabsContent value="bank" className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">
              Memuat data rekening bank...
            </div>
          ) : bankAccounts.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              Belum ada rekening bank korporat terdaftar.
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {bankAccounts.map((bank) => (
                <Card key={bank.id} className="relative overflow-hidden shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-blue-600">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                        <CardTitle className="text-base font-bold">{bank.bankName}</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {bank.currency}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs font-mono font-semibold text-primary">
                      {bank.code}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3 pb-3">
                    <div className="rounded-lg bg-muted/60 p-3 space-y-1">
                      <div className="text-xs text-muted-foreground">Nomor Rekening (Masked)</div>
                      <div className="font-mono text-lg font-bold tracking-wider text-foreground">
                        {bank.accountNumberMasked}
                      </div>
                      <div className="text-xs font-medium text-muted-foreground truncate">
                        a.n. {bank.accountName}
                      </div>
                    </div>

                    <div className="text-xs space-y-1">
                      <div className="text-muted-foreground">Akun Buku Besar (GL):</div>
                      {bank.account ? (
                        <div className="font-mono font-medium text-xs bg-accent/40 p-1.5 rounded">
                          {bank.account.code} - {bank.account.name}
                        </div>
                      ) : (
                        <div>-</div>
                      )}
                    </div>

                    {bank.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {bank.description}
                      </p>
                    )}
                  </CardContent>

                  <CardFooter className="pt-0 flex justify-end space-x-1 border-t bg-muted/20 py-2">
                    {isUpdate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditBank(bank)}
                        className="h-8 text-xs"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                    )}
                    {isDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBank(bank)}
                        className="h-8 text-xs hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Nonaktifkan
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CashAccountModal
        isOpen={isCashModalOpen}
        onClose={() => setIsCashModalOpen(false)}
        onSubmit={handleSubmitCash}
        cashAccount={selectedCash}
        glAccounts={glAccounts}
        custodianUsers={custodianUsers}
        costCenters={costCenters}
        isLoading={submitting}
      />

      <BankAccountModal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        onSubmit={handleSubmitBank}
        bankAccount={selectedBank}
        glAccounts={glAccounts}
        isLoading={submitting}
      />
    </div>
  );
}
