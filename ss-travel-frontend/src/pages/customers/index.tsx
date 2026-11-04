import { useState, useEffect, useMemo, useCallback } from 'react';
import ConfirmDialog from '@/components/shared/confirm-dialog';
import Heading from '@/components/shared/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { usePermission } from '@/hooks/use-permission';
import { CustomerService } from '@/services/customer.service';
import {
  MetricCardGridSkeleton,
  TableSkeletonRows,
} from '@/components/shared/skeleton-loaders';
import type { Customer, CustomerFormData } from '@/types';
import {
  Building2,
  Edit,
  Eye,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Users2,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import CustomerDetailModal from './components/customer-detail-modal';
import CustomerModal from './components/customer-modal';

export default function CustomersPage() {
  const { isCreate, isUpdate, isDelete } = usePermission();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);

  // Search & Filter States
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Confirm Delete Dialog State (Zero Native Alert)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounced search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1); // Reset to page 1 on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await CustomerService.findAll({
        search: debouncedSearch || undefined,
        customerType: typeFilter === 'ALL' ? undefined : typeFilter,
        customerTier: tierFilter === 'ALL' ? undefined : tierFilter,
        isActive:
          statusFilter === 'ALL'
            ? undefined
            : statusFilter === 'ACTIVE',
        page,
        limit,
      });
      if (response?.status && response.data) {
        setCustomers(response.data.data || []);
        setTotal(response.data.total || 0);
      }
    } catch (error: any) {
      toast.error('Gagal memuat data pelanggan / CRM leads', {
        description: error.response?.data?.message,
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, typeFilter, tierFilter, statusFilter, page, limit]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleCreate = () => {
    setSelectedCustomer(null);
    setIsModalOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleViewDetail = (customer: Customer) => {
    setDetailCustomer(customer);
    setIsDetailOpen(true);
  };

  // Confirm Delete Handler
  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;
    setIsDeleting(true);
    try {
      await CustomerService.remove(customerToDelete.id);
      toast.success(
        `Pelanggan '${customerToDelete.institutionName || customerToDelete.picName}' berhasil dihapus`,
      );
      setCustomerToDelete(null);
      fetchCustomers();
    } catch (error: any) {
      toast.error('Gagal menghapus data pelanggan', {
        description: error.response?.data?.message,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (data: CustomerFormData) => {
    setSubmitting(true);
    try {
      if (selectedCustomer) {
        await CustomerService.update(selectedCustomer.id, data);
        toast.success(
          `Data pelanggan '${data.institutionName || data.picName}' berhasil diperbarui`,
        );
      } else {
        await CustomerService.create(data);
        toast.success(
          `Pelanggan baru '${data.institutionName || data.picName}' berhasil didaftarkan`,
        );
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (error: any) {
      toast.error('Gagal menyimpan pelanggan', {
        description: error.response?.data?.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isFilterActive =
    searchInput.trim() !== '' ||
    typeFilter !== 'ALL' ||
    tierFilter !== 'ALL' ||
    statusFilter !== 'ALL';

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setTypeFilter('ALL');
    setTierFilter('ALL');
    setStatusFilter('ALL');
    setPage(1);
  };

  // Pagination metrics
  const totalPages = Math.ceil(total / limit) || 1;
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  // Dynamic KPI Calculations from loaded set & totals
  const totalCorporate = useMemo(
    () => customers.filter((c) => c.customerType === 'CORPORATE').length,
    [customers],
  );
  const totalSchool = useMemo(
    () => customers.filter((c) => c.customerType === 'SCHOOL').length,
    [customers],
  );
  const totalVip = useMemo(
    () =>
      customers.filter(
        (c) => c.customerTier === 'PLATINUM' || c.customerTier === 'GOLD',
      ).length,
    [customers],
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Heading
          title="Database Pelanggan & CRM Prospek Sewa"
          description="Pusat data prospek penyewa bus pariwisata (Corporate, Sekolah, EO, Komunitas), loyalitas pelanggan, dan histori order."
        />
        {isCreate && (
          <Button onClick={handleCreate} className="h-9 text-xs gap-1.5">
            <Plus className="h-4 w-4" /> Tambah Pelanggan / Lead
          </Button>
        )}
      </div>

      {/* Kartu Ringkasan Metrik */}
      {loading && customers.length === 0 ? (
        <MetricCardGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-primary">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Total Database Pelanggan</CardDescription>
              <CardTitle className="text-2xl font-black text-primary flex items-center justify-between">
                <span>{total} <span className="text-sm font-semibold text-muted-foreground">Klien</span></span>
                <Users2 className="h-5 w-5 opacity-40 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Database terpusat prospek sewa pariwisata
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-blue-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Segmen Korporat / Pabrik</CardDescription>
              <CardTitle className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between">
                <span>{totalCorporate} <span className="text-sm font-semibold text-muted-foreground">Klien</span></span>
                <Building2 className="h-5 w-5 opacity-40 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Klien kantor &amp; pabrik industri sewa armada
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-emerald-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Sekolah &amp; Kampus (Study Tour)</CardDescription>
              <CardTitle className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                <span>{totalSchool} <span className="text-sm font-semibold text-muted-foreground">Lembaga</span></span>
                <GraduationCap className="h-5 w-5 opacity-40 text-emerald-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Kunjungan industri, study tour &amp; ziarah
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-purple-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Pelanggan VIP Platinum &amp; Gold</CardDescription>
              <CardTitle className="text-2xl font-bold text-purple-700 dark:text-purple-400 flex items-center justify-between">
                <span>{totalVip} <span className="text-sm font-semibold text-muted-foreground">Klien VIP</span></span>
                <Sparkles className="h-5 w-5 opacity-40 text-purple-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Pelanggan loyal repeat order prioritas tinggi
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Toolbar Filter & Pencarian */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Input Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama, PIC, WhatsApp, kota..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 pr-8 h-8.5 text-xs uppercase"
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

          {/* Filter Segmen */}
          <Select
            value={typeFilter}
            onValueChange={(val) => {
              setTypeFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-44 h-8.5 text-xs">
              <SelectValue placeholder="Semua Segmen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">Semua Segmen</SelectItem>
              <SelectItem value="CORPORATE" className="text-xs">🏢 Korporat / Kantor</SelectItem>
              <SelectItem value="SCHOOL" className="text-xs">🎓 Sekolah / Kampus</SelectItem>
              <SelectItem value="COMMUNITY" className="text-xs">🚴 Komunitas / EO</SelectItem>
              <SelectItem value="GOVERNMENT" className="text-xs">🏛️ Instansi Pemerintah</SelectItem>
              <SelectItem value="INDIVIDUAL" className="text-xs">👤 Pribadi / Keluarga</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter Tier */}
          <Select
            value={tierFilter}
            onValueChange={(val) => {
              setTierFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-36 h-8.5 text-xs">
              <SelectValue placeholder="Semua Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">Semua Tier</SelectItem>
              <SelectItem value="PLATINUM" className="text-xs">💎 Platinum</SelectItem>
              <SelectItem value="GOLD" className="text-xs">🥇 Gold</SelectItem>
              <SelectItem value="SILVER" className="text-xs">🥈 Silver</SelectItem>
              <SelectItem value="BRONZE" className="text-xs">🥉 Bronze</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter Status */}
          <Select
            value={statusFilter}
            onValueChange={(val: 'ALL' | 'ACTIVE' | 'INACTIVE') => {
              setStatusFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-36 h-8.5 text-xs">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">Semua Status</SelectItem>
              <SelectItem value="ACTIVE" className="text-xs">Hanya Aktif</SelectItem>
              <SelectItem value="INACTIVE" className="text-xs">Non-Aktif</SelectItem>
            </SelectContent>
          </Select>

          {/* Reset Filter Button */}
          {isFilterActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-8.5 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5"
              title="Reset seluruh filter"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground font-medium shrink-0 self-end lg:self-auto">
          Menampilkan <strong className="text-foreground">{startItem} - {endItem}</strong> dari {total} pelanggan
        </div>
      </div>

      {/* Tabel Data Pelanggan */}
      <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80 dark:bg-white/5">
            <TableRow className="border-b border-slate-200/80 dark:border-white/10">
              <TableHead className="w-56">Kode &amp; Nama Klien</TableHead>
              <TableHead className="w-52">PIC &amp; WhatsApp</TableHead>
              <TableHead className="w-44">Domisili / Kota</TableHead>
              <TableHead className="w-40">Segmen &amp; Sumber</TableHead>
              <TableHead className="w-36">Tier &amp; Total Trip</TableHead>
              <TableHead className="min-w-48">Catatan Khusus</TableHead>
              <TableHead className="text-right w-24">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
            {loading ? (
              <TableSkeletonRows
                rows={limit}
                colWidths={[
                  'w-40',
                  'w-36',
                  'w-28',
                  'w-28',
                  'w-24',
                  'w-48',
                  'w-16 ml-auto',
                ]}
              />
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                      <Users2 className="h-8 w-8 opacity-60" />
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">
                      Tidak ada data pelanggan yang cocok
                    </h4>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      {isFilterActive
                        ? 'Tidak ada pelanggan yang sesuai dengan kriteria filter atau pencarian Anda.'
                        : 'Belum ada pelanggan atau leads penyewa yang terdaftar di database.'}
                    </p>
                    {isFilterActive ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetFilters}
                        className="text-xs gap-1.5 h-8 mt-1"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Reset Filter
                      </Button>
                    ) : (
                      isCreate && (
                        <Button
                          size="sm"
                          onClick={handleCreate}
                          className="text-xs gap-1.5 h-8 mt-1"
                        >
                          <Plus className="h-3.5 w-3.5" /> Tambah Pelanggan Baru
                        </Button>
                      )
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              customers.map((c) => (
                <TableRow
                  key={c.id}
                  onClick={() => handleViewDetail(c)}
                  className="cursor-pointer hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors"
                >
                  <TableCell>
                    <div className="font-mono text-xs font-semibold text-muted-foreground">
                      {c.code}
                    </div>
                    <div className="font-bold text-xs text-foreground">
                      {c.institutionName || c.picName}
                    </div>
                  </TableCell>

                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="font-medium text-xs text-foreground">{c.picName}</div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      <Phone className="h-3 w-3 text-emerald-600 shrink-0" />
                      <a
                        href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '').startsWith('0') ? '62' + c.phone.replace(/[^0-9]/g, '').slice(1) : c.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline text-emerald-600 font-semibold font-mono text-[11px]"
                      >
                        {c.phone}
                      </a>
                    </div>
                    {c.email && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground truncate max-w-44">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="truncate">{c.email}</span>
                      </div>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1 text-xs font-medium">
                      <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                      <span>{c.city || 'Jabodetabek'}</span>
                    </div>
                    <div
                      className="text-[10px] text-muted-foreground truncate max-w-40"
                      title={c.address}
                    >
                      {c.address || '-'}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-medium bg-muted/40"
                    >
                      {c.customerType === 'CORPORATE' && '🏢 Korporat'}
                      {c.customerType === 'SCHOOL' && '🎓 Sekolah'}
                      {c.customerType === 'COMMUNITY' && '🚴 Komunitas'}
                      {c.customerType === 'GOVERNMENT' && '🏛️ Lembaga'}
                      {c.customerType === 'INDIVIDUAL' && '👤 Pribadi'}
                    </Badge>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Via {c.leadSource}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        c.customerTier === 'PLATINUM'
                          ? 'border-purple-300 bg-purple-500/10 text-purple-700 dark:text-purple-400 text-[10px]'
                          : c.customerTier === 'GOLD'
                          ? 'border-amber-300 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px]'
                          : c.customerTier === 'SILVER'
                          ? 'border-blue-300 bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[10px]'
                          : 'border-slate-300 bg-slate-500/10 text-slate-700 dark:text-slate-400 text-[10px]'
                      }
                    >
                      {c.customerTier}
                    </Badge>
                    <div className="text-[11px] font-semibold text-primary mt-0.5">
                      {c.totalTripsCount}x Sewa Wisata
                    </div>
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground max-w-50">
                    <p className="line-clamp-2 text-[11px]" title={c.specialNotes}>
                      {c.specialNotes || '-'}
                    </p>
                  </TableCell>

                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDetail(c)}
                        className="h-7 w-7 text-primary hover:bg-primary/10"
                        title="Lihat Detail Klien"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      {isUpdate && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(c)}
                          className="h-7 w-7 text-primary hover:bg-primary/10"
                          title="Edit Pelanggan"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {isDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setCustomerToDelete(c)}
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          title="Hapus Pelanggan"
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

        {/* Paginasi Server-Side */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 border-t border-slate-200/80 dark:border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Baris per halaman:</span>
            <Select
              value={String(limit)}
              onValueChange={(val) => {
                setLimit(Number(val));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-18 h-7.5 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10" className="text-xs">10</SelectItem>
                <SelectItem value="25" className="text-xs">25</SelectItem>
                <SelectItem value="50" className="text-xs">50</SelectItem>
                <SelectItem value="100" className="text-xs">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              Halaman {page} dari {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-7.5 w-7.5"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-7.5 w-7.5"
                title="Halaman Berikutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Modal Dialog Form Tambah / Edit */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        customer={selectedCustomer}
        loading={submitting}
      />

      {/* Modal Detail Pelanggan & Histori Sewa */}
      <CustomerDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        customer={detailCustomer}
        onEdit={handleEdit}
      />

      {/* Confirm Delete Dialog (Zero Native Alert) */}
      <ConfirmDialog
        open={!!customerToDelete}
        onOpenChange={(open) => !open && setCustomerToDelete(null)}
        title="Hapus Data Pelanggan"
        description={`Apakah Anda yakin ingin menghapus data pelanggan '${customerToDelete?.institutionName || customerToDelete?.picName}' (${customerToDelete?.code})? Tindakan ini tidak dapat dibatalkan.`}
        variant="danger"
        confirmText="Hapus Pelanggan"
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
