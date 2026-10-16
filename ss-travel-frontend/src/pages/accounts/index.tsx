import { useState, useEffect, useMemo } from 'react';
import Heading from '@/components/shared/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  FolderTree,
  Table2,
  ChevronRight,
  ChevronDown,
  Edit,
  Trash2,
  PlusCircle,
  FileText,
  Folder,
  Layers,
} from 'lucide-react';
import AccountModal from './components/account-modal';
import { AccountService } from '@/services/account.service';
import type { Account, AccountTreeNode, AccountFormData, AccountType } from '@/types';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/use-permission';

export default function AccountsPage() {
  const { isCreate, isUpdate, isDelete } = usePermission();
  const [flatAccounts, setFlatAccounts] = useState<Account[]>([]);
  const [treeAccounts, setTreeAccounts] = useState<AccountTreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [postableFilter, setPostableFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [parentForSubAccount, setParentForSubAccount] = useState<Account | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Expanded Tree nodes
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    '1': true,
    '11': true,
    '2': true,
    '3': true,
    '4': true,
    '5': true,
    '51': true,
    '52': true,
    '53': true,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [flatRes, treeRes] = await Promise.all([
        AccountService.findAll({ includeInactive: false }),
        AccountService.findAll({ tree: true, includeInactive: false }),
      ]);

      if (flatRes?.data) {
        setFlatAccounts(flatRes.data as Account[]);
      }
      if (treeRes?.data) {
        setTreeAccounts(treeRes.data as AccountTreeNode[]);
      }
    } catch (err: any) {
      toast.error('Gagal memuat bagan akun (COA)', {
        description: err?.response?.data?.message || err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const allIds: Record<string, boolean> = {};
    const traverse = (nodes: AccountTreeNode[]) => {
      for (const node of nodes) {
        allIds[node.id] = true;
        allIds[node.code] = true;
        if (node.children && node.children.length > 0) {
          traverse(node.children);
        }
      }
    };
    traverse(treeAccounts);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes({});
  };

  const handleOpenCreate = () => {
    setSelectedAccount(null);
    setParentForSubAccount(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc: Account) => {
    setSelectedAccount(acc);
    setParentForSubAccount(null);
    setIsModalOpen(true);
  };

  const handleOpenAddSub = (parentAcc: Account) => {
    setSelectedAccount(null);
    setParentForSubAccount(parentAcc);
    setIsModalOpen(true);
  };

  const handleSubmitModal = async (data: AccountFormData) => {
    setSubmitting(true);
    try {
      if (selectedAccount) {
        await AccountService.update(selectedAccount.id, data);
        toast.success(`Akun '${data.code}' berhasil diperbarui`);
      } else {
        await AccountService.create(data);
        toast.success(`Akun '${data.code}' berhasil dibuat`);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error('Gagal menyimpan akun', {
        description: err?.response?.data?.message || err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (acc: Account) => {
    if (!confirm(`Apakah Anda yakin ingin menonaktifkan akun '${acc.code} - ${acc.name}'?`)) {
      return;
    }
    try {
      await AccountService.remove(acc.id);
      toast.success(`Akun '${acc.code}' berhasil dinonaktifkan`);
      fetchData();
    } catch (err: any) {
      toast.error('Gagal menonaktifkan akun', {
        description: err?.response?.data?.message || err.message,
      });
    }
  };

  // Type badge styling helper
  const getTypeBadge = (type: AccountType) => {
    switch (type) {
      case 'ASSET':
        return <Badge className="bg-blue-600/15 text-blue-700 dark:text-blue-400 border-blue-200">1 - Aset</Badge>;
      case 'LIABILITY':
        return <Badge className="bg-amber-600/15 text-amber-700 dark:text-amber-400 border-amber-200">2 - Liabilitas</Badge>;
      case 'EQUITY':
        return <Badge className="bg-purple-600/15 text-purple-700 dark:text-purple-400 border-purple-200">3 - Ekuitas</Badge>;
      case 'REVENUE':
        return <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border-emerald-200">4 - Pendapatan</Badge>;
      case 'EXPENSE':
        return <Badge className="bg-rose-600/15 text-rose-700 dark:text-rose-400 border-rose-200">5 - Beban</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = flatAccounts.length;
    const assets = flatAccounts.filter((a) => a.type === 'ASSET').length;
    const liabilities = flatAccounts.filter((a) => a.type === 'LIABILITY').length;
    const equity = flatAccounts.filter((a) => a.type === 'EQUITY').length;
    const revenue = flatAccounts.filter((a) => a.type === 'REVENUE').length;
    const expense = flatAccounts.filter((a) => a.type === 'EXPENSE').length;
    const postable = flatAccounts.filter((a) => a.isPostable).length;

    return { total, assets, liabilities, equity, revenue, expense, postable };
  }, [flatAccounts]);

  // Filtered flat accounts
  const filteredFlatAccounts = useMemo(() => {
    return flatAccounts.filter((acc) => {
      const matchSearch =
        search === '' ||
        acc.code.toLowerCase().includes(search.toLowerCase()) ||
        acc.name.toLowerCase().includes(search.toLowerCase());

      const matchType = typeFilter === 'ALL' || acc.type === typeFilter;
      const matchPostable =
        postableFilter === 'ALL' ||
        (postableFilter === 'POSTABLE' && acc.isPostable) ||
        (postableFilter === 'HEADER' && !acc.isPostable);

      return matchSearch && matchType && matchPostable;
    });
  }, [flatAccounts, search, typeFilter, postableFilter]);

  // Recursive Tree Row Component
  const renderTreeNodes = (nodes: AccountTreeNode[], level = 0) => {
    return nodes.map((node) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedNodes[node.id] || expandedNodes[node.code] || false;

      // Filter check for tree
      const matchSearch =
        search === '' ||
        node.code.toLowerCase().includes(search.toLowerCase()) ||
        node.name.toLowerCase().includes(search.toLowerCase());

      const matchType = typeFilter === 'ALL' || node.type === typeFilter;
      const matchPostable =
        postableFilter === 'ALL' ||
        (postableFilter === 'POSTABLE' && node.isPostable) ||
        (postableFilter === 'HEADER' && !node.isPostable);

      const isVisible = matchSearch && matchType && matchPostable;

      return (
        <div key={node.id} className="flex flex-col">
          {isVisible && (
            <div
              className={`flex items-center justify-between py-2 px-3 hover:bg-accent/40 rounded-md transition-colors border-b border-border/40 ${
                level === 0
                  ? 'bg-muted/30 font-semibold'
                  : level === 1
                  ? 'font-medium'
                  : 'text-sm'
              }`}
              style={{ paddingLeft: `${level * 24 + 12}px` }}
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                {hasChildren ? (
                  <button
                    type="button"
                    onClick={() => toggleExpand(node.id)}
                    className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                ) : (
                  <span className="w-6 inline-block" />
                )}

                {hasChildren ? (
                  <Folder className="h-4 w-4 text-amber-500 shrink-0" />
                ) : (
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                )}

                <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted font-bold tracking-wider">
                  {node.code}
                </span>

                <span className="truncate">{node.name}</span>

                {node.isPostable ? (
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-emerald-500 text-emerald-600 bg-emerald-50/50">
                    Postable
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                    Header
                  </Badge>
                )}

                <Badge
                  variant="outline"
                  className={`text-[10px] py-0 px-1.5 ${
                    node.normalBalance === 'DEBIT' ? 'text-blue-600' : 'text-purple-600'
                  }`}
                >
                  {node.normalBalance}
                </Badge>
              </div>

              <div className="flex items-center space-x-2 shrink-0 ml-4">
                {getTypeBadge(node.type)}

                {isCreate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => handleOpenAddSub(node)}
                    title="Tambah Sub-Akun"
                  >
                    <PlusCircle className="h-3.5 w-3.5 mr-1 text-primary" />
                    Sub
                  </Button>
                )}

                {isUpdate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleOpenEdit(node)}
                    title="Edit Akun"
                  >
                    <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                )}

                {isDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:text-destructive"
                    onClick={() => handleDelete(node)}
                    title="Nonaktifkan"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {hasChildren && isExpanded && renderTreeNodes(node.children, level + 1)}
        </div>
      );
    });
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Heading
          title="Bagan Akun (Chart of Accounts)"
          description="Master struktur rekening akuntansi (COA) standar operasional bus SS Traveling."
        />
        {isCreate && (
          <Button onClick={handleOpenCreate} className="shrink-0">
            <Plus className="mr-2 h-4 w-4" /> Tambah Akun
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-6">
        <Card className="shadow-xs">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
              Total Akun
              <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-xl font-bold">{stats.total}</div>
            <p className="text-[11px] text-muted-foreground">
              {stats.postable} Postable
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-l-4 border-l-blue-500">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              1 - ASET
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-xl font-bold text-blue-600">{stats.assets}</div>
            <p className="text-[11px] text-muted-foreground">Kas, Bank, Piutang, Bus</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-l-4 border-l-amber-500">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              2 - LIABILITAS
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-xl font-bold text-amber-600">{stats.liabilities}</div>
            <p className="text-[11px] text-muted-foreground">Utang AP, Komisi, DP</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-l-4 border-l-purple-500">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              3 - EKUITAS
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-xl font-bold text-purple-600">{stats.equity}</div>
            <p className="text-[11px] text-muted-foreground">Modal & Saldo Laba</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-l-4 border-l-emerald-500">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              4 - PENDAPATAN
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-xl font-bold text-emerald-600">{stats.revenue}</div>
            <p className="text-[11px] text-muted-foreground">Tiket, Sewa, Kargo</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-l-4 border-l-rose-500">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              5 - BEBAN
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-xl font-bold text-rose-600">{stats.expense}</div>
            <p className="text-[11px] text-muted-foreground">BBM, Tol, Kru, Bengkel</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and View Toggle Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari kode akun atau nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Semua Tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Tipe Akun</SelectItem>
              <SelectItem value="ASSET">1 - Aset</SelectItem>
              <SelectItem value="LIABILITY">2 - Liabilitas</SelectItem>
              <SelectItem value="EQUITY">3 - Ekuitas</SelectItem>
              <SelectItem value="REVENUE">4 - Pendapatan</SelectItem>
              <SelectItem value="EXPENSE">5 - Beban</SelectItem>
            </SelectContent>
          </Select>

          <Select value={postableFilter} onValueChange={setPostableFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>
              <SelectItem value="POSTABLE">Postable Sah</SelectItem>
              <SelectItem value="HEADER">Header Saja</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View Switcher & Tree Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          {viewMode === 'tree' && (
            <div className="flex items-center space-x-1 mr-2">
              <Button
                variant="outline"
                size="sm"
                onClick={expandAll}
                className="text-xs h-9 px-2.5"
              >
                Buka Semua
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={collapseAll}
                className="text-xs h-9 px-2.5"
              >
                Tutup Semua
              </Button>
            </div>
          )}

          <div className="flex items-center bg-muted p-1 rounded-lg border">
            <button
              type="button"
              onClick={() => setViewMode('tree')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'tree'
                  ? 'bg-background shadow-xs text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FolderTree className="h-3.5 w-3.5" />
              <span>Hierarki Pohon</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-background shadow-xs text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Table2 className="h-3.5 w-3.5" />
              <span>Daftar Tabel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">
            Memuat struktur bagan akun...
          </div>
        ) : viewMode === 'tree' ? (
          <div className="p-2 space-y-1">
            {treeAccounts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Tidak ada akun yang sesuai dengan filter.
              </div>
            ) : (
              renderTreeNodes(treeAccounts)
            )}
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Kode Akun</TableHead>
                  <TableHead>Nama Akun</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead className="w-[100px]">Normal</TableHead>
                  <TableHead className="w-[120px]">Sifat</TableHead>
                  <TableHead>Akun Induk</TableHead>
                  <TableHead className="text-right w-[110px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFlatAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Tidak ada akun yang sesuai dengan filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFlatAccounts.map((acc) => (
                    <TableRow key={acc.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono font-bold text-xs">
                        {acc.code}
                      </TableCell>
                      <TableCell className="font-medium">
                        {acc.name}
                        {acc.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-md">
                            {acc.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getTypeBadge(acc.type)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            acc.normalBalance === 'DEBIT'
                              ? 'text-blue-600 border-blue-200'
                              : 'text-purple-600 border-purple-200'
                          }
                        >
                          {acc.normalBalance}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {acc.isPostable ? (
                          <Badge className="bg-emerald-600/15 text-emerald-700 border-emerald-200">
                            Postable
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Header</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {acc.parent ? `${acc.parent.code} - ${acc.parent.name}` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {isUpdate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleOpenEdit(acc)}
                            >
                              <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          )}
                          {isDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:text-destructive"
                              onClick={() => handleDelete(acc)}
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
          </div>
        )}
      </Card>

      {/* Account Create/Edit Modal */}
      <AccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitModal}
        account={selectedAccount}
        parentAccount={parentForSubAccount}
        allAccounts={flatAccounts}
        isLoading={submitting}
      />
    </div>
  );
}
