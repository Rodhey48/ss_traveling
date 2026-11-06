import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableSkeletonRows } from '@/components/shared/skeleton-loaders';
import RoleModal from './components/role-modal';
import ConfirmDialog from '@/components/shared/confirm-dialog';
import { RoleService } from '@/services/role.service';
import type { Role, RoleFormData } from '@/types';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/use-permission';
import {
  Plus,
  Edit,
  Shield,
  Search,
  RefreshCw,
  RotateCcw,
  X,
  Trash2,
  Lock,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Briefcase,
  Bus,
} from 'lucide-react';

export default function RolesPage() {
  const { isCreate, isUpdate, isDelete } = usePermission();

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Search & Pagination
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // ConfirmDialog
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

  // Debounced search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await RoleService.findAll();
      if (response.status) {
        setRoles(response.data || []);
      }
    } catch (error) {
      toast.error('Gagal mengambil daftar peran (roles)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // Filtered roles
  const filteredRoles = useMemo(() => {
    if (!debouncedSearch) return roles;
    const query = debouncedSearch.toLowerCase();
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        (r.description && r.description.toLowerCase().includes(query))
    );
  }, [roles, debouncedSearch]);

  // Pagination slice
  const paginatedRoles = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredRoles.slice(start, start + limit);
  }, [filteredRoles, page, limit]);

  const totalPages = Math.ceil(filteredRoles.length / limit) || 1;
  const startItem = filteredRoles.length === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, filteredRoles.length);

  // Role Categories count for Metrics
  const stats = useMemo(() => {
    const total = roles.length;
    const management = roles.filter((r) =>
      ['SUPER_ADMIN', 'SUPERADMIN', 'ADMIN', 'DIRECTOR', 'FINANCE_MANAGER', 'ACCOUNTANT', 'FINANCE_AR_AP'].includes(
        r.name
      )
    ).length;
    const operational = roles.filter((r) =>
      ['OPS_ADMIN', 'POOL_CASHIER', 'FIELD_COORDINATOR'].includes(r.name)
    ).length;
    const crew = roles.filter((r) =>
      ['CREW_DRIVER', 'CREW_CONDUCTOR', 'CREW_STEWARDESS'].includes(r.name)
    ).length;
    return { total, management, operational, crew };
  }, [roles]);

  const handleCreate = () => {
    setSelectedRole(null);
    setIsModalOpen(true);
  };

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setIsModalOpen(true);
  };

  const handleDelete = (role: Role) => {
    const protectedRoles = ['SUPER_ADMIN', 'SUPERADMIN', 'DIRECTOR', 'FINANCE_MANAGER'];
    if (protectedRoles.includes(role.name)) {
      toast.error(`Peran ${role.name} merupakan peran inti sistem dan tidak boleh dihapus.`);
      return;
    }

    setConfirmDialog({
      open: true,
      title: 'Hapus Peran (Role)?',
      description: `Apakah Anda yakin ingin menghapus peran "${role.name}" (${
        role.description || '-'
      })? Pengguna yang terhubung dengan peran ini akan kehilangan izin akses menu terkait.`,
      variant: 'danger',
      confirmText: 'Ya, Hapus Peran',
      cancelText: 'Batal',
      isLoading: false,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isLoading: true }));
        try {
          await RoleService.remove(role.id);
          toast.success(`Peran ${role.name} berhasil dihapus`);
          setConfirmDialog((prev) => ({ ...prev, open: false, isLoading: false }));
          fetchRoles();
        } catch (error: any) {
          toast.error(error.response?.data?.message || 'Gagal menghapus peran');
          setConfirmDialog((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  const handleSubmit = async (data: RoleFormData) => {
    try {
      setSubmitting(true);
      if (selectedRole) {
        await RoleService.update(selectedRole.id, data);
        toast.success('Peran dan matriks hak akses berhasil diperbarui');
      } else {
        await RoleService.create(data);
        toast.success('Peran baru berhasil dibuat');
      }
      setIsModalOpen(false);
      fetchRoles();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setPage(1);
  };

  return (
    <div className="space-y-6 p-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Manajemen Peran &amp; Hak Akses (RBAC)
            </h1>
            <p className="text-sm text-muted-foreground">
              Kelola peran pengguna, struktur hierarki kewenangan, dan matriks izin menu sistem PT SS Travelink Official
            </p>
          </div>
        </div>

        {isCreate && (
          <Button
            onClick={handleCreate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-9 text-xs gap-1.5 self-start md:self-auto"
          >
            <Plus className="h-4 w-4" /> Tambah Peran
          </Button>
        )}
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md shadow-xs border-l-4 border-l-blue-600">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Peran (Roles)
              </p>
              <h3 className="text-2xl font-extrabold font-mono text-blue-900 dark:text-blue-300 mt-1">
                {stats.total}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Struktur kewenangan aktif</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-900/40">
              <Shield className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md shadow-xs border-l-4 border-l-emerald-600">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Manajemen &amp; Finansial
              </p>
              <h3 className="text-2xl font-extrabold font-mono text-emerald-900 dark:text-emerald-300 mt-1">
                {stats.management}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Admin, Direksi &amp; Akuntan</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md shadow-xs border-l-4 border-l-amber-600">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Operasional &amp; Kasir
              </p>
              <h3 className="text-2xl font-extrabold font-mono text-amber-900 dark:text-amber-300 mt-1">
                {stats.operational}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Dispatcher, Kasir, &amp; Korlap</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-100 dark:border-amber-900/40">
              <Briefcase className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md shadow-xs border-l-4 border-l-purple-600">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Kru Lapangan Bus
              </p>
              <h3 className="text-2xl font-extrabold font-mono text-purple-900 dark:text-purple-300 mt-1">
                {stats.crew}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Driver, Kondektur, Pramugari</p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl border border-purple-100 dark:border-purple-900/40">
              <Bus className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FILTER & TOOLBAR */}
      <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md p-4 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* SEARCH INPUT */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari peran atau deskripsi tugas..."
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

          {debouncedSearch && (
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
          onClick={fetchRoles}
          disabled={loading}
          className="text-xs h-8.5 shrink-0 gap-1.5 self-end md:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Segarkan Data
        </Button>
      </div>

      {/* TABLE SECTION */}
      <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10">
              <TableRow>
                <TableHead className="w-72 font-bold uppercase text-[11px] tracking-wider text-muted-foreground">
                  Nama Peran (Role Name)
                </TableHead>
                <TableHead className="font-bold uppercase text-[11px] tracking-wider text-muted-foreground">
                  Deskripsi Tugas Pokok
                </TableHead>
                <TableHead className="w-56 font-bold uppercase text-[11px] tracking-wider text-muted-foreground">
                  Cakupan Izin Menu
                </TableHead>
                <TableHead className="text-right font-bold uppercase text-[11px] tracking-wider text-muted-foreground">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
              {loading ? (
                <TableSkeletonRows
                  rows={limit > 10 ? 10 : limit}
                  colWidths={['w-48', 'w-72', 'w-32', 'w-24 ml-auto']}
                />
              ) : paginatedRoles.length > 0 ? (
                paginatedRoles.map((role) => {
                  const isProtected = ['SUPER_ADMIN', 'SUPERADMIN', 'DIRECTOR', 'FINANCE_MANAGER'].includes(
                    role.name
                  );
                  return (
                    <TableRow
                      key={role.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors"
                    >
                      {/* NAMA PERAN */}
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                            <Shield className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-bold font-mono text-sm text-foreground">
                              {role.name}
                            </span>
                            {isProtected && (
                              <Badge
                                variant="outline"
                                className="ml-2 text-[9px] font-bold border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
                              >
                                Core Role
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* DESKRIPSI */}
                      <TableCell className="py-3.5 text-xs text-muted-foreground">
                        {role.description || (
                          <span className="italic text-muted-foreground/50">Tidak ada deskripsi</span>
                        )}
                      </TableCell>

                      {/* CAKUPAN IZIN MENU */}
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60"
                          >
                            {role.menus?.length || 0} Menu Terhubung
                          </Badge>
                        </div>
                      </TableCell>

                      {/* AKSI */}
                      <TableCell className="py-3.5 text-right">
                        <div className="flex justify-end items-center gap-1">
                          {isUpdate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(role)}
                              className="h-8 px-2.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs gap-1"
                              title="Ubah Matriks Izin Akses Peran"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              <span>Matriks Akses</span>
                            </Button>
                          )}

                          {isDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className={
                                isProtected
                                  ? 'h-8 w-8 text-muted-foreground/40 cursor-not-allowed'
                                  : 'h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                              }
                              disabled={isProtected}
                              title={
                                isProtected
                                  ? 'Peran inti sistem tidak dapat dihapus'
                                  : 'Hapus Peran'
                              }
                              onClick={() => handleDelete(role)}
                            >
                              {isProtected ? (
                                <Lock className="h-3.5 w-3.5" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="p-3 rounded-full bg-primary/10 text-primary">
                        <Shield className="h-8 w-8 opacity-60" />
                      </div>
                      <p className="font-semibold text-foreground text-sm">
                        Tidak ada peran ditemukan
                      </p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {debouncedSearch
                          ? 'Tidak ada peran sistem yang cocok dengan kata kunci pencarian Anda.'
                          : 'Belum ada peran pengguna yang dikonfigurasikan di dalam sistem.'}
                      </p>
                      {debouncedSearch && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResetFilters}
                          className="text-xs gap-1.5 h-8 mt-1"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Reset Pencarian
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* FOOTER PAGINATION BAR */}
        <div className="p-3.5 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-zinc-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>
            Menampilkan <strong className="text-foreground">{startItem}</strong> -{' '}
            <strong className="text-foreground">{endItem}</strong> dari{' '}
            <strong className="text-foreground">{filteredRoles.length}</strong> total peran sistem
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">Baris:</span>
              <Select
                value={String(limit)}
                onValueChange={(val) => {
                  setLimit(Number(val));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-7.5 w-18 text-xs font-semibold">
                  <SelectValue placeholder={String(limit)} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10" className="text-xs">10</SelectItem>
                  <SelectItem value="20" className="text-xs">20</SelectItem>
                  <SelectItem value="50" className="text-xs">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[11px] text-muted-foreground mr-1">
                Halaman {page} dari {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-7.5 w-7.5"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1 || loading}
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7.5 w-7.5"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages || loading}
                title="Halaman Berikutnya"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE / EDIT ROLE MODAL */}
      <RoleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        role={selectedRole}
        loading={submitting}
      />

      {/* CONFIRM DIALOG */}
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
