import { useState, useEffect } from 'react';
import Heading from '@/components/shared/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardDescription,
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
  Users2,
  Building2,
  GraduationCap,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';
import CustomerModal from './components/customer-modal';
import CustomerDetailModal from './components/customer-detail-modal';
import { CustomerService } from '@/services/customer.service';
import type { Customer, CustomerFormData } from '@/types';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/use-permission';

export default function CustomersPage() {
  const { isCreate, isUpdate, isDelete } = usePermission();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await CustomerService.findAll({
        search,
        customerType: typeFilter === 'ALL' ? undefined : typeFilter,
        customerTier: tierFilter === 'ALL' ? undefined : tierFilter,
        limit: 50,
      });
      if (response.status) {
        setCustomers(response.data.data);
      }
    } catch (error: any) {
      toast.error('Gagal memuat data pelanggan / CRM leads', {
        description: error.response?.data?.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, typeFilter, tierFilter]);

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

  const handleDelete = async (customer: Customer) => {
    if (
      !confirm(
        `Yakin ingin menghapus data pelanggan ${
          customer.institutionName || customer.picName
        }?`,
      )
    ) {
      return;
    }
    try {
      await CustomerService.remove(customer.id);
      toast.success(
        `Pelanggan ${customer.institutionName || customer.picName} berhasil dihapus`,
      );
      fetchCustomers();
    } catch (error: any) {
      toast.error('Gagal menghapus data pelanggan', {
        description: error.response?.data?.message,
      });
    }
  };

  const handleSubmit = async (data: CustomerFormData) => {
    setSubmitting(true);
    try {
      if (selectedCustomer) {
        await CustomerService.update(selectedCustomer.id, data);
        toast.success(
          `Data pelanggan ${data.institutionName || data.picName} berhasil diperbarui`,
        );
      } else {
        await CustomerService.create(data);
        toast.success(
          `Pelanggan baru ${data.institutionName || data.picName} berhasil didaftarkan`,
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

  // Ringkasan Statistik CRM
  const totalCustomers = customers.length;
  const totalCorporate = customers.filter(
    (c) => c.customerType === 'CORPORATE',
  ).length;
  const totalSchool = customers.filter((c) => c.customerType === 'SCHOOL').length;
  const totalPlatinum = customers.filter(
    (c) => c.customerTier === 'PLATINUM',
  ).length;

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Heading
          title="Database Pelanggan & CRM Prospek Sewa"
          description="Pusat data prospek penyewa bus wisata (Corporate, Sekolah, EO, Komunitas), loyalitas pelanggan, dan histori sewa."
        />
        {isCreate && (
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Tambah Pelanggan / Lead
          </Button>
        )}
      </div>

      {/* Kartu Ringkasan Metrik */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">
              Total Database Pelanggan
            </CardDescription>
            <CardTitle className="text-2xl font-black text-primary flex items-center justify-between">
              {totalCustomers} Klien
              <Users2 className="h-6 w-6 opacity-40" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">
              Segmen Korporat / Pabrik
            </CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between">
              {totalCorporate} Klien
              <Building2 className="h-6 w-6 text-blue-500 opacity-60" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">
              Sekolah & Kampus (Study Tour)
            </CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between">
              {totalSchool} Lembaga
              <GraduationCap className="h-6 w-6 text-emerald-500 opacity-60" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">
              Pelanggan VIP Platinum
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-purple-600 flex items-center justify-between">
              {totalPlatinum} Klien
              <Sparkles className="h-6 w-6 opacity-60" />
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Toolbar Filter & Pencarian */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-lg">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama perusahaan, PIC, no WhatsApp, kota..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Tipe Klien" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Segmen</SelectItem>
              <SelectItem value="CORPORATE">Korporat / Kantor</SelectItem>
              <SelectItem value="SCHOOL">Sekolah / Kampus</SelectItem>
              <SelectItem value="COMMUNITY">Komunitas / EO</SelectItem>
              <SelectItem value="GOVERNMENT">Instansi Pemerintah</SelectItem>
              <SelectItem value="INDIVIDUAL">Perorangan / Pribadi</SelectItem>
            </SelectContent>
          </Select>

          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Semua Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Tier</SelectItem>
              <SelectItem value="PLATINUM">Platinum</SelectItem>
              <SelectItem value="GOLD">Gold</SelectItem>
              <SelectItem value="SILVER">Silver</SelectItem>
              <SelectItem value="BRONZE">Bronze</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabel Data Pelanggan */}
      {loading ? (
        <div className="p-12 text-center text-sm text-muted-foreground border rounded-xl bg-card">
          Memuat data pelanggan & prospek...
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode & Klien</TableHead>
                <TableHead>PIC / Kontak</TableHead>
                <TableHead>Wilayah / Kota</TableHead>
                <TableHead>Segmen & Sumber</TableHead>
                <TableHead>Tier & Total Trip</TableHead>
                <TableHead>Catatan Khusus</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow
                  key={c.id}
                  onClick={() => handleViewDetail(c)}
                  className="cursor-pointer hover:bg-muted/40 transition-colors"
                >
                  <TableCell>
                    <div className="font-mono text-xs font-semibold text-muted-foreground">
                      {c.code}
                    </div>
                    <div className="font-bold text-sm text-foreground">
                      {c.institutionName || c.picName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{c.picName}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Phone className="h-3 w-3 text-emerald-600" />
                      <a
                        href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="hover:underline text-emerald-600 font-medium"
                      >
                        {c.phone}
                      </a>
                    </div>
                    {c.email && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span className="truncate max-w-[150px]">{c.email}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs font-medium">
                      <MapPin className="h-3.5 w-3.5 text-rose-500" />
                      {c.city || 'Jabodetabek'}
                    </div>
                    <div
                      className="text-xs text-muted-foreground truncate max-w-[160px]"
                      title={c.address}
                    >
                      {c.address || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-xs font-medium bg-muted/40"
                    >
                      {c.customerType === 'CORPORATE' && '🏢 Korporat'}
                      {c.customerType === 'SCHOOL' && '🎓 Sekolah'}
                      {c.customerType === 'COMMUNITY' && '🚴 Komunitas'}
                      {c.customerType === 'GOVERNMENT' && '🏛️ Lembaga'}
                      {c.customerType === 'INDIVIDUAL' && '👤 Pribadi'}
                    </Badge>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      Via {c.leadSource}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        c.customerTier === 'PLATINUM'
                          ? 'border-purple-300 bg-purple-50 text-purple-700'
                          : c.customerTier === 'GOLD'
                          ? 'border-amber-300 bg-amber-50 text-amber-700'
                          : c.customerTier === 'SILVER'
                          ? 'border-blue-300 bg-blue-50 text-blue-700'
                          : 'border-slate-300 bg-slate-50 text-slate-700'
                      }
                    >
                      {c.customerTier}
                    </Badge>
                    <div className="text-xs font-semibold text-primary mt-1">
                      {c.totalTripsCount}x Sewa Wisata
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px]">
                    <p className="line-clamp-2" title={c.specialNotes}>
                      {c.specialNotes || '-'}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetail(c);
                        }}
                        className="h-8 w-8"
                        title="Lihat Detail Klien"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {isUpdate && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(c);
                          }}
                          className="h-8 w-8"
                          title="Edit Pelanggan"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {isDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(c);
                          }}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          title="Hapus Pelanggan"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

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
    </div>
  );
}
