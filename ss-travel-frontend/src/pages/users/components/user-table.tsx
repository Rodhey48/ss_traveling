import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';
import type { User } from '@/types';
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  KeyRound,
  RotateCcw,
  Shield,
  Trash2,
  UserCheck,
  Users,
  UserX,
} from 'lucide-react';

interface UserTableProps {
  users: User[];
  isLoading?: boolean;
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onResetPassword: (user: User) => void;
  onToggleStatus: (user: User) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
  canReset?: boolean;
  canToggle?: boolean;
  hasActiveFilters?: boolean;
  onResetFilters?: () => void;
}

export default function UserTable({
  users,
  isLoading = false,
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
  onEdit,
  onDelete,
  onResetPassword,
  onToggleStatus,
  canUpdate = true,
  canDelete = true,
  canReset = false,
  canToggle = false,
  hasActiveFilters = false,
  onResetFilters,
}: UserTableProps) {
  const showActions = canUpdate || canDelete || canReset || canToggle;
  const totalPages = Math.ceil(total / limit) || 1;
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/80 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10">
            <TableRow>
              <TableHead className="w-80 font-bold uppercase text-[11px] tracking-wider text-muted-foreground">
                Profil Pengguna
              </TableHead>
              <TableHead className="font-bold uppercase text-[11px] tracking-wider text-muted-foreground">
                NIP
              </TableHead>
              <TableHead className="font-bold uppercase text-[11px] tracking-wider text-muted-foreground">
                Tipe Akun
              </TableHead>
              <TableHead className="font-bold uppercase text-[11px] tracking-wider text-muted-foreground">
                Hak Akses (Peran)
              </TableHead>
              <TableHead className="text-center font-bold uppercase text-[11px] tracking-wider text-muted-foreground">
                Status
              </TableHead>
              {showActions && (
                <TableHead className="text-right font-bold uppercase text-[11px] tracking-wider text-muted-foreground">
                  Aksi
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
            {isLoading ? (
              <TableSkeletonRows
                rows={limit > 10 ? 10 : limit}
                colWidths={['w-60', 'w-24', 'w-24', 'w-36', 'w-20 mx-auto', 'w-32 ml-auto']}
              />
            ) : users && users.length > 0 ? (
              users.map((user) => {
                const rolesList = user.roles || [];
                return (
                  <TableRow
                    key={user.id}
                    className={cn(
                      'hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors',
                      !user.isActive && 'opacity-60 bg-slate-50/40 dark:bg-white/2'
                    )}
                  >
                    {/* PROFIL PENGGUNA */}
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9.5 w-9.5 border border-slate-200 dark:border-white/10 shadow-2xs">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold font-mono">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-sm text-foreground truncate">
                            {user.name}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </span>
                          {user.phone && (
                            <span className="text-[11px] text-muted-foreground/80 font-mono">
                              {user.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* NIP */}
                    <TableCell className="py-3.5 font-mono text-xs font-semibold text-foreground">
                      {user.nip || (
                        <span className="text-muted-foreground/60 italic">-</span>
                      )}
                    </TableCell>

                    {/* TIPE AKUN */}
                    <TableCell className="py-3.5">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] uppercase font-bold tracking-wider',
                          user.type === 'admin'
                            ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                            : user.type === 'employee'
                            ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                            : 'border-slate-300 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300'
                        )}
                      >
                        {user.type === 'admin'
                          ? 'Administrator'
                          : user.type === 'employee'
                          ? 'Karyawan'
                          : 'Pengguna'}
                      </Badge>
                    </TableCell>

                    {/* ROLES / HAK AKSES */}
                    <TableCell className="py-3.5">
                      {rolesList.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {rolesList.map((r: any, idx: number) => {
                            const roleName = r.role?.name || r.name || r;
                            return (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60"
                              >
                                <Shield className="h-2.5 w-2.5 mr-1 opacity-70" />
                                {roleName}
                              </Badge>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/60 italic">
                          Belum ada peran
                        </span>
                      )}
                    </TableCell>

                    {/* STATUS KEAKTIFAN */}
                    <TableCell className="py-3.5 text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] font-bold uppercase tracking-wider',
                          user.isActive
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                            : 'border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                        )}
                      >
                        {user.isActive ? 'Aktif' : 'Non-Aktif'}
                      </Badge>
                    </TableCell>

                    {/* AKSI */}
                    {showActions && (
                      <TableCell className="py-3.5 text-right">
                        <div className="flex justify-end items-center gap-1">
                          {canReset && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                              title="Reset Password Pengguna"
                              onClick={() => onResetPassword(user)}
                            >
                              <KeyRound className="h-4 w-4" />
                            </Button>
                          )}

                          {canToggle && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                'h-8 w-8',
                                user.isActive
                                  ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                  : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                              )}
                              title={
                                user.isActive
                                  ? 'Non-aktifkan Akun Pengguna'
                                  : 'Aktifkan Akun Pengguna'
                              }
                              onClick={() => onToggleStatus(user)}
                            >
                              {user.isActive ? (
                                <UserX className="h-4 w-4" />
                              ) : (
                                <UserCheck className="h-4 w-4" />
                              )}
                            </Button>
                          )}

                          {canUpdate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                              title="Edit Data Pengguna"
                              onClick={() => onEdit(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}

                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              title="Hapus / Non-aktifkan Pengguna"
                              onClick={() => onDelete(user)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={showActions ? 6 : 5}
                  className="py-12 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                      <Users className="h-8 w-8 opacity-60" />
                    </div>
                    <p className="font-semibold text-foreground text-sm">
                      Tidak ada data pengguna ditemukan
                    </p>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      {hasActiveFilters
                        ? 'Tidak ada akun pengguna yang cocok dengan kriteria filter atau pencarian Anda.'
                        : 'Belum ada pengguna yang terdaftar di dalam sistem.'}
                    </p>
                    {hasActiveFilters && onResetFilters && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onResetFilters}
                        className="text-xs gap-1.5 h-8 mt-1"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Reset Filter
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
          Menampilkan{' '}
          <strong className="text-foreground">{startItem}</strong> -{' '}
          <strong className="text-foreground">{endItem}</strong> dari{' '}
          <strong className="text-foreground">{total}</strong> total pengguna
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">Baris:</span>
            <Select
              value={String(limit)}
              onValueChange={(val) => {
                onLimitChange(Number(val));
                onPageChange(1);
              }}
            >
              <SelectTrigger className="h-7.5 w-18 text-xs font-semibold">
                <SelectValue placeholder={String(limit)} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10" className="text-xs">10</SelectItem>
                <SelectItem value="20" className="text-xs">20</SelectItem>
                <SelectItem value="50" className="text-xs">50</SelectItem>
                <SelectItem value="100" className="text-xs">100</SelectItem>
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
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1 || isLoading}
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7.5 w-7.5"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages || isLoading}
              title="Halaman Berikutnya"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
