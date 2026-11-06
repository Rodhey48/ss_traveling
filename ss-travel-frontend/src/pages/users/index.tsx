import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
  Users,
  UserCheck,
  UserX,
  UserCog,
  RefreshCw,
  RotateCcw,
  X,
} from 'lucide-react';
import UserTable from './components/user-table';
import UserModal from './components/user-modal';
import ResetPasswordModal from './components/reset-password-modal';
import ConfirmDialog from '@/components/shared/confirm-dialog';
import { MetricCardGridSkeleton } from '@/components/shared/skeleton-loaders';
import { UserService } from '@/services/user.service';
import { RoleService } from '@/services/role.service';
import type { User, UserFormData, Role } from '@/types';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/use-permission';

export default function UsersPage() {
  const { isCreate, isUpdate, isDelete, actions } = usePermission();

  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [roles, setRoles] = useState<Role[]>([]);

  // Search & Filter states
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedRoleId, setSelectedRoleId] = useState('ALL');

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    crew: 0,
  });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  // ConfirmDialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    variant: 'danger' | 'warning' | 'primary';
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
    onConfirm: () => void | Promise<void>;
  }>({
    open: false,
    title: '',
    description: '',
    variant: 'primary',
    confirmText: 'Konfirmasi',
    cancelText: 'Batal',
    isLoading: false,
    onConfirm: () => {},
  });

  // Action Permissions
  const canReset = !!actions['PermissionUser.reset'] || isUpdate;
  const canDeleteUser = !!actions['PermissionUser.delete'] || isDelete;
  const canToggleStatus = !!actions['PermissionUser.status'] || isUpdate;

  // Debounce search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch Roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await RoleService.findAll();
        if (response.status) {
          setRoles(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch roles', error);
      }
    };
    fetchRoles();
  }, []);

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await UserService.getStats();
      if (res.status && res.data) {
        setStats(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch user stats', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await UserService.findAll({
        page,
        limit,
        search: debouncedSearch || undefined,
        type: selectedType === 'ALL' ? undefined : selectedType,
        isActive: selectedStatus === 'ALL' ? undefined : selectedStatus,
        roleId: selectedRoleId === 'ALL' ? undefined : selectedRoleId,
      });

      if (response.status && response.data) {
        setUsers(response.data.data || []);
        setTotal(response.data.total || 0);
      }
    } catch (error) {
      toast.error('Gagal mengambil data user');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, selectedType, selectedStatus, selectedRoleId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Reset Filters
  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setSelectedType('ALL');
    setSelectedStatus('ALL');
    setSelectedRoleId('ALL');
    setPage(1);
  };

  const hasActiveFilters = useMemo(() => {
    return (
      debouncedSearch !== '' ||
      selectedType !== 'ALL' ||
      selectedStatus !== 'ALL' ||
      selectedRoleId !== 'ALL'
    );
  }, [debouncedSearch, selectedType, selectedStatus, selectedRoleId]);

  // Modal Handlers
  const handleCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setIsResetModalOpen(true);
  };

  // Toggle Status with ConfirmDialog
  const handleToggleStatusClick = (user: User) => {
    const actionText = user.isActive ? 'menonaktifkan' : 'mengaktifkan';
    setConfirmDialog({
      open: true,
      title: `${user.isActive ? 'Non-aktifkan' : 'Aktifkan'} Pengguna?`,
      description: `Apakah Anda yakin ingin ${actionText} akun ${user.name} (${user.email})? ${
        user.isActive
          ? 'Pengguna tidak akan dapat login ke sistem selama akun berstatus non-aktif.'
          : 'Pengguna akan dapat kembali login dan mengakses fitur sistem sesuai hak aksesnya.'
      }`,
      variant: user.isActive ? 'warning' : 'primary',
      confirmText: user.isActive ? 'Ya, Non-aktifkan' : 'Ya, Aktifkan',
      cancelText: 'Batal',
      isLoading: false,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isLoading: true }));
        try {
          const response = await UserService.toggleStatus(user.id);
          if (response.status) {
            toast.success(response.message || 'Status pengguna berhasil diperbarui');
            setConfirmDialog((prev) => ({ ...prev, open: false, isLoading: false }));
            fetchUsers();
            fetchStats();
          }
        } catch (error: any) {
          toast.error(error.response?.data?.message || 'Gagal mengubah status pengguna');
          setConfirmDialog((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  // Delete with ConfirmDialog
  const handleDeleteClick = (user: User) => {
    setConfirmDialog({
      open: true,
      title: 'Hapus / Non-aktifkan Pengguna?',
      description: `Apakah Anda yakin ingin menghapus akun ${user.name} (${user.email}, NIP: ${
        user.nip || '-'
      })? Status akun akan dinonaktifkan secara aman untuk menjaga keutuhan riwayat audit akuntansi dan log SPJ.`,
      variant: 'danger',
      confirmText: 'Ya, Hapus Pengguna',
      cancelText: 'Batal',
      isLoading: false,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isLoading: true }));
        try {
          await UserService.remove(user.id);
          toast.success('Pengguna berhasil dinonaktifkan');
          setConfirmDialog((prev) => ({ ...prev, open: false, isLoading: false }));
          fetchUsers();
          fetchStats();
        } catch (error) {
          toast.error('Gagal menghapus pengguna');
          setConfirmDialog((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  const handleSubmit = async (data: UserFormData) => {
    try {
      setSubmitting(true);
      if (selectedUser) {
        await UserService.update(selectedUser.id, data);
        toast.success('Pengguna berhasil diperbarui');
      } else {
        await UserService.create(data);
        toast.success('Pengguna baru berhasil dibuat');
      }
      setIsModalOpen(false);
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Manajemen Pengguna &amp; Karyawan
            </h1>
            <p className="text-sm text-muted-foreground">
              Kelola akun pengguna, penugasan peran (RBAC), dan status akses operasional PT SS Travelink Official
            </p>
          </div>
        </div>

        {isCreate && (
          <Button
            onClick={handleCreate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-9 text-xs gap-1.5 self-start md:self-auto"
          >
            <Plus className="h-4 w-4" /> Tambah Pengguna
          </Button>
        )}
      </div>

      {/* METRIC CARDS */}
      {statsLoading ? (
        <MetricCardGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md shadow-xs border-l-4 border-l-blue-600">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Pengguna
                </p>
                <h3 className="text-2xl font-extrabold font-mono text-blue-900 dark:text-blue-300 mt-1">
                  {stats.total}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Terdaftar dalam sistem</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-900/40">
                <Users className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md shadow-xs border-l-4 border-l-emerald-600">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Pengguna Aktif
                </p>
                <h3 className="text-2xl font-extrabold font-mono text-emerald-900 dark:text-emerald-300 mt-1">
                  {stats.active}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Akses operasional terbuka</p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                <UserCheck className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md shadow-xs border-l-4 border-l-rose-600">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Non-Aktif / Ditangguhkan
                </p>
                <h3 className="text-2xl font-extrabold font-mono text-rose-900 dark:text-rose-300 mt-1">
                  {stats.inactive}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Akses dinonaktifkan</p>
              </div>
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-100 dark:border-rose-900/40">
                <UserX className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md shadow-xs border-l-4 border-l-amber-600">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Personel Kru Lapangan
                </p>
                <h3 className="text-2xl font-extrabold font-mono text-amber-900 dark:text-amber-300 mt-1">
                  {stats.crew}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Supir, Kondektur &amp; Pramugari</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-100 dark:border-amber-900/40">
                <UserCog className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* FILTER & TOOLBAR */}
      <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md p-4 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* SEARCH INPUT */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari nama, email, NIP..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 pr-8 h-8.5 text-xs"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                title="Hapus pencarian"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* FILTER KATEGORI TYPE */}
          <Select
            value={selectedType}
            onValueChange={(val) => {
              setSelectedType(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-36 h-8.5 text-xs">
              <SelectValue placeholder="Kategori Tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">Semua Kategori</SelectItem>
              <SelectItem value="employee" className="text-xs">Karyawan</SelectItem>
              <SelectItem value="admin" className="text-xs">Administrator</SelectItem>
              <SelectItem value="user" className="text-xs">Pengguna</SelectItem>
            </SelectContent>
          </Select>

          {/* FILTER STATUS */}
          <Select
            value={selectedStatus}
            onValueChange={(val) => {
              setSelectedStatus(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-34 h-8.5 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">Semua Status</SelectItem>
              <SelectItem value="ACTIVE" className="text-xs">Hanya Aktif</SelectItem>
              <SelectItem value="INACTIVE" className="text-xs">Non-Aktif</SelectItem>
            </SelectContent>
          </Select>

          {/* FILTER ROLE */}
          <Select
            value={selectedRoleId}
            onValueChange={(val) => {
              setSelectedRoleId(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44 h-8.5 text-xs">
              <SelectValue placeholder="Pilih Peran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">Semua Peran (Roles)</SelectItem>
              {roles.map((r) => (
                <SelectItem key={r.id} value={r.id} className="text-xs">
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* RESET FILTER BUTTON */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-8.5 text-xs px-2.5 text-muted-foreground hover:text-foreground gap-1"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Filter
            </Button>
          )}
        </div>

        {/* REFRESH BUTTON */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            fetchUsers();
            fetchStats();
          }}
          disabled={loading}
          className="text-xs h-8.5 shrink-0 gap-1.5 self-end md:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Segarkan Data
        </Button>
      </div>

      {/* USER TABLE */}
      <UserTable
        users={users}
        isLoading={loading}
        page={page}
        limit={limit}
        total={total}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onResetPassword={handleResetPassword}
        onToggleStatus={handleToggleStatusClick}
        canUpdate={isUpdate}
        canDelete={canDeleteUser}
        canReset={canReset}
        canToggle={canToggleStatus}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
      />

      {/* CREATE / EDIT USER MODAL */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        user={selectedUser}
        loading={submitting}
      />

      {/* RESET PASSWORD MODAL */}
      <ResetPasswordModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        user={selectedUser}
      />

      {/* CONFIRM DIALOG (REPLACES WINDOW.CONFIRM) */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant={confirmDialog.variant}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        isLoading={confirmDialog.isLoading}
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  );
}
