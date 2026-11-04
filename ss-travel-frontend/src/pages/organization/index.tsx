import { useState, useEffect, useMemo } from 'react';
import ConfirmDialog from '@/components/shared/confirm-dialog';
import Heading from '@/components/shared/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  MetricCardGridSkeleton,
  TableSkeletonRows,
} from '@/components/shared/skeleton-loaders';
import {
  Building,
  Briefcase,
  Layers,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Save,
  Search,
  X,
  RotateCcw,
  Loader2,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Coins,
  Clock,
} from 'lucide-react';
import BusinessUnitModal from './components/business-unit-modal';
import CostCenterModal from './components/cost-center-modal';
import ProfitCenterModal from './components/profit-center-modal';
import { OrganizationService } from '@/services/organization.service';
import type { Company, BusinessUnit, CostCenter, ProfitCenter } from '@/types';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/use-permission';
import { useAuth } from '@/hooks/use-auth';

export default function OrganizationPage() {
  const { isCreate, isUpdate, isDelete } = usePermission();
  const { setCompany: setAuthCompany } = useAuth();

  // State Data
  const [company, setCompany] = useState<Company | null>(null);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [profitCenters, setProfitCenters] = useState<ProfitCenter[]>([]);
  const [loading, setLoading] = useState(false);

  // Search & Filter States
  const [buSearchInput, setBuSearchInput] = useState('');
  const [debouncedBuSearch, setDebouncedBuSearch] = useState('');

  const [ccSearchInput, setCcSearchInput] = useState('');
  const [debouncedCcSearch, setDebouncedCcSearch] = useState('');
  const [ccParentFilter, setCcParentFilter] = useState('ALL');

  const [pcSearchInput, setPcSearchInput] = useState('');
  const [debouncedPcSearch, setDebouncedPcSearch] = useState('');
  const [pcBuFilter, setPcBuFilter] = useState('ALL');

  // Modal States
  const [buModalOpen, setBuModalOpen] = useState(false);
  const [selectedBu, setSelectedBu] = useState<BusinessUnit | null>(null);

  const [ccModalOpen, setCcModalOpen] = useState(false);
  const [selectedCc, setSelectedCc] = useState<CostCenter | null>(null);

  const [pcModalOpen, setPcModalOpen] = useState(false);
  const [selectedPc, setSelectedPc] = useState<ProfitCenter | null>(null);

  const [submitting, setSubmitting] = useState(false);

  // Confirm Delete Dialog State
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'business-unit' | 'cost-center' | 'profit-center';
    item: BusinessUnit | CostCenter | ProfitCenter;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Company Form State
  const [companyForm, setCompanyForm] = useState({
    name: '',
    code: '',
    currency: 'IDR',
    timezone: 'Asia/Jakarta',
    phone: '',
    email: '',
    address: '',
    website: '',
  });

  // Debounced search effects (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedBuSearch(buSearchInput.trim().toUpperCase());
    }, 300);
    return () => clearTimeout(timer);
  }, [buSearchInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCcSearch(ccSearchInput.trim().toUpperCase());
    }, 300);
    return () => clearTimeout(timer);
  }, [ccSearchInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPcSearch(pcSearchInput.trim().toUpperCase());
    }, 300);
    return () => clearTimeout(timer);
  }, [pcSearchInput]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [compRes, buRes, ccRes, pcRes] = await Promise.all([
        OrganizationService.getCompany(),
        OrganizationService.getBusinessUnits(),
        OrganizationService.getCostCenters(),
        OrganizationService.getProfitCenters(),
      ]);

      if (compRes.status && compRes.data) {
        setCompany(compRes.data);
        setAuthCompany(compRes.data);
        setCompanyForm({
          name: compRes.data.name || '',
          code: compRes.data.code || '',
          currency: compRes.data.currency || 'IDR',
          timezone: compRes.data.timezone || 'Asia/Jakarta',
          phone: compRes.data.phone || '',
          email: compRes.data.email || '',
          address: compRes.data.address || '',
          website: compRes.data.website || '',
        });
      }

      if (buRes.status) setBusinessUnits(buRes.data);
      if (ccRes.status) setCostCenters(ccRes.data);
      if (pcRes.status) setProfitCenters(pcRes.data);
    } catch {
      toast.error('Gagal memuat data struktur organisasi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // --- COMPANY HANDLER ---
  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setSubmitting(true);
    try {
      const res = await OrganizationService.updateCompany(company.id, companyForm);
      if (res?.data) {
        setAuthCompany(res.data);
      }
      toast.success('Profil perusahaan berhasil diperbarui');
      fetchAllData();
    } catch {
      toast.error('Gagal memperbarui profil perusahaan');
    } finally {
      setSubmitting(false);
    }
  };

  // --- BU HANDLERS ---
  const handleSaveBu = async (data: Partial<BusinessUnit>) => {
    setSubmitting(true);
    try {
      if (selectedBu) {
        await OrganizationService.updateBusinessUnit(selectedBu.id, data);
        toast.success(`Unit bisnis '${data.name}' berhasil diperbarui`);
      } else {
        await OrganizationService.createBusinessUnit(data);
        toast.success(`Unit bisnis baru '${data.name}' berhasil ditambahkan`);
      }
      setBuModalOpen(false);
      fetchAllData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan unit bisnis');
    } finally {
      setSubmitting(false);
    }
  };

  // --- CC HANDLERS ---
  const handleSaveCc = async (data: Partial<CostCenter>) => {
    setSubmitting(true);
    try {
      if (selectedCc) {
        await OrganizationService.updateCostCenter(selectedCc.id, data);
        toast.success(`Cost center '${data.name}' berhasil diperbarui`);
      } else {
        await OrganizationService.createCostCenter(data);
        toast.success(`Cost center baru '${data.name}' berhasil ditambahkan`);
      }
      setCcModalOpen(false);
      fetchAllData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan cost center');
    } finally {
      setSubmitting(false);
    }
  };

  // --- PC HANDLERS ---
  const handleSavePc = async (data: Partial<ProfitCenter>) => {
    setSubmitting(true);
    try {
      if (selectedPc) {
        await OrganizationService.updateProfitCenter(selectedPc.id, data);
        toast.success(`Profit center '${data.name}' berhasil diperbarui`);
      } else {
        await OrganizationService.createProfitCenter(data);
        toast.success(`Profit center baru '${data.name}' berhasil ditambahkan`);
      }
      setPcModalOpen(false);
      fetchAllData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan profit center');
    } finally {
      setSubmitting(false);
    }
  };

  // --- CONFIRM DELETE HANDLER (Zero Native Alert) ---
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      if (itemToDelete.type === 'business-unit') {
        const bu = itemToDelete.item as BusinessUnit;
        await OrganizationService.removeBusinessUnit(bu.id);
        toast.success(`Unit bisnis '${bu.name}' berhasil dihapus`);
      } else if (itemToDelete.type === 'cost-center') {
        const cc = itemToDelete.item as CostCenter;
        await OrganizationService.removeCostCenter(cc.id);
        toast.success(`Cost center '${cc.name}' berhasil dihapus`);
      } else {
        const pc = itemToDelete.item as ProfitCenter;
        await OrganizationService.removeProfitCenter(pc.id);
        toast.success(`Profit center '${pc.name}' berhasil dihapus`);
      }
      setItemToDelete(null);
      fetchAllData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menghapus entri');
    } finally {
      setIsDeleting(false);
    }
  };

  // --- FILTERED DATA ---
  const filteredBusinessUnits = useMemo(() => {
    return businessUnits.filter((bu) => {
      if (debouncedBuSearch) {
        const matchCode = bu.code.toUpperCase().includes(debouncedBuSearch);
        const matchName = bu.name.toUpperCase().includes(debouncedBuSearch);
        const matchDesc = (bu.description || '').toUpperCase().includes(debouncedBuSearch);
        if (!matchCode && !matchName && !matchDesc) return false;
      }
      return true;
    });
  }, [businessUnits, debouncedBuSearch]);

  const filteredCostCenters = useMemo(() => {
    return costCenters.filter((cc) => {
      if (ccParentFilter === 'ROOT' && cc.parentId) return false;
      if (ccParentFilter !== 'ALL' && ccParentFilter !== 'ROOT' && cc.parentId !== ccParentFilter) {
        return false;
      }
      if (debouncedCcSearch) {
        const matchCode = cc.code.toUpperCase().includes(debouncedCcSearch);
        const matchName = cc.name.toUpperCase().includes(debouncedCcSearch);
        const matchDesc = (cc.description || '').toUpperCase().includes(debouncedCcSearch);
        if (!matchCode && !matchName && !matchDesc) return false;
      }
      return true;
    });
  }, [costCenters, ccParentFilter, debouncedCcSearch]);

  const filteredProfitCenters = useMemo(() => {
    return profitCenters.filter((pc) => {
      if (pcBuFilter !== 'ALL' && pc.businessUnitId !== pcBuFilter) {
        return false;
      }
      if (debouncedPcSearch) {
        const matchCode = pc.code.toUpperCase().includes(debouncedPcSearch);
        const matchName = pc.name.toUpperCase().includes(debouncedPcSearch);
        const matchDesc = (pc.description || '').toUpperCase().includes(debouncedPcSearch);
        if (!matchCode && !matchName && !matchDesc) return false;
      }
      return true;
    });
  }, [profitCenters, pcBuFilter, debouncedPcSearch]);

  return (
    <div className="space-y-6 p-6">
      <Heading
        title="Pengaturan Struktur Organisasi & Dimensi"
        description="Konfigurasi profil entitas hukum perusahaan, unit bisnis operasional, hierarki cost center, dan profit center."
      />

      {/* Dynamic Summary Cards */}
      {loading ? (
        <MetricCardGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-primary">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Entitas Perusahaan</CardDescription>
              <CardTitle className="text-lg font-black text-primary flex items-center justify-between">
                <span className="truncate">{companyForm.name || 'PT SS Travelink'}</span>
                <Building2 className="h-5 w-5 opacity-40 text-primary shrink-0" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground font-mono">
                Kode: <strong>{companyForm.code || 'SST'}</strong> &bull; {companyForm.currency} &bull; {companyForm.timezone}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-blue-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Lini Unit Bisnis</CardDescription>
              <CardTitle className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between">
                <span>{businessUnits.length} <span className="text-sm font-semibold text-muted-foreground">Unit Usaha</span></span>
                <Briefcase className="h-5 w-5 opacity-40 text-blue-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                AKAP Reguler, Pariwisata / Charter, Shuttle
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-purple-600">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Pusat Biaya (Cost Center)</CardDescription>
              <CardTitle className="text-2xl font-bold text-purple-700 dark:text-purple-400 flex items-center justify-between">
                <span>{costCenters.length} <span className="text-sm font-semibold text-muted-foreground">Pusat Biaya</span></span>
                <Layers className="h-5 w-5 opacity-40 text-purple-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Pool Ciputat, Garasi, HQ, Ops AKAP &amp; Wisata
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs border-l-4 border-l-amber-500">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Pusat Laba (Profit Center)</CardDescription>
              <CardTitle className="text-2xl font-bold text-amber-700 dark:text-amber-400 flex items-center justify-between">
                <span>{profitCenters.length} <span className="text-sm font-semibold text-muted-foreground">Pusat Laba</span></span>
                <TrendingUp className="h-5 w-5 opacity-40 text-amber-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-[11px] text-muted-foreground">
                Analisis Margin Kontribusi Per Lini Usaha
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="company" className="space-y-4">
        <TabsList className="bg-muted/70 p-1 rounded-xl h-auto flex flex-wrap gap-1 justify-start">
          <TabsTrigger value="company" className="gap-2 py-1.5 px-3.5 text-xs font-semibold">
            <Building className="h-4 w-4" /> Profil Perusahaan
          </TabsTrigger>
          <TabsTrigger value="business-units" className="gap-2 py-1.5 px-3.5 text-xs font-semibold">
            <Briefcase className="h-4 w-4" /> Unit Bisnis ({businessUnits.length})
          </TabsTrigger>
          <TabsTrigger value="cost-centers" className="gap-2 py-1.5 px-3.5 text-xs font-semibold">
            <Layers className="h-4 w-4" /> Cost Center ({costCenters.length})
          </TabsTrigger>
          <TabsTrigger value="profit-centers" className="gap-2 py-1.5 px-3.5 text-xs font-semibold">
            <TrendingUp className="h-4 w-4" /> Profit Center ({profitCenters.length})
          </TabsTrigger>
        </TabsList>

        {/* ==================== TAB 1: PROFIL PERUSAHAAN ==================== */}
        <TabsContent value="company">
          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs max-w-4xl">
            <CardHeader className="p-4 pb-3 border-b border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-foreground">
                    Entitas Hukum {companyForm.name || 'PT SS Travelink Official'}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Informasi dasar legalitas dan profil korporat yang tercetak pada kop faktur, invoice AR, dan dokumen SPJ supir.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-4">
              {loading ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-9 w-full" /></div>
                    <div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-9 w-full" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-9 w-full" /></div>
                    <div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-9 w-full" /></div>
                  </div>
                  <div className="space-y-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-9 w-full" /></div>
                </div>
              ) : (
                <form onSubmit={handleSaveCompany} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <Label htmlFor="cName" className="text-xs font-semibold flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-primary" />
                        Nama Perusahaan Resmi <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="cName"
                        value={companyForm.name}
                        onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                        required
                        className="h-8.5 text-xs font-semibold"
                        disabled={submitting}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cCode" className="text-xs font-semibold">
                        Kode Perusahaan (Company Scope)
                      </Label>
                      <Input
                        id="cCode"
                        value={companyForm.code}
                        disabled
                        className="bg-muted font-mono font-bold text-xs h-8.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <Label htmlFor="cPhone" className="text-xs font-semibold flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-emerald-600" />
                        Telepon / WhatsApp Kantor
                      </Label>
                      <Input
                        id="cPhone"
                        placeholder="082299943700"
                        value={companyForm.phone}
                        onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                        className="h-8.5 text-xs font-mono"
                        disabled={submitting}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cEmail" className="text-xs font-semibold flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-blue-600" />
                        Email Resmi Korporat
                      </Label>
                      <Input
                        id="cEmail"
                        placeholder="info@sstravelink.id"
                        value={companyForm.email}
                        onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                        className="h-8.5 text-xs"
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="cAddress" className="text-xs font-semibold flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-rose-500" />
                      Alamat Kantor Pusat / Pool Utama
                    </Label>
                    <Input
                      id="cAddress"
                      placeholder="Jl Pahlawan Gerbang No 08 Rempoa Ciputat Timur, South Tangerang"
                      value={companyForm.address}
                      onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                      className="h-8.5 text-xs"
                      disabled={submitting}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold flex items-center gap-1.5">
                        <Coins className="h-3.5 w-3.5 text-amber-500" />
                        Mata Uang Basis
                      </Label>
                      <Input value={companyForm.currency} disabled className="bg-muted font-bold font-mono text-xs h-8.5" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-indigo-500" />
                        Zona Waktu Sistem
                      </Label>
                      <Input value={companyForm.timezone} disabled className="bg-muted font-mono text-xs h-8.5" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cWeb" className="text-xs font-semibold flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5 text-teal-600" />
                        Website Resmi
                      </Label>
                      <Input
                        id="cWeb"
                        placeholder="www.sstravelink.id"
                        value={companyForm.website}
                        onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                        className="h-8.5 text-xs"
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  {isUpdate && (
                    <div className="pt-3 border-t border-slate-200/80 dark:border-white/10 flex justify-end">
                      <Button type="submit" disabled={submitting} className="h-8.5 text-xs gap-1.5">
                        {submitting ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Menyimpan...
                          </>
                        ) : (
                          <>
                            <Save className="h-3.5 w-3.5" /> Simpan Profil Perusahaan
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== TAB 2: UNIT BISNIS ==================== */}
        <TabsContent value="business-units" className="space-y-4 pt-1">
          {/* Toolbar Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs">
            <div className="flex items-center gap-2.5 flex-1">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari kode atau nama unit bisnis..."
                  value={buSearchInput}
                  onChange={(e) => setBuSearchInput(e.target.value)}
                  className="pl-9 pr-8 h-8.5 text-xs uppercase"
                />
                {buSearchInput && (
                  <button
                    type="button"
                    onClick={() => setBuSearchInput('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    title="Hapus pencarian"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {buSearchInput && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBuSearchInput('')}
                  className="h-8.5 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reset
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="text-xs text-muted-foreground font-medium hidden sm:block">
                Total: <strong className="text-foreground">{filteredBusinessUnits.length}</strong> unit
              </div>
              {isCreate && (
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedBu(null);
                    setBuModalOpen(true);
                  }}
                  className="h-8.5 text-xs gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Tambah Unit Bisnis
                </Button>
              )}
            </div>
          </div>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/80 dark:bg-white/5">
                <TableRow className="border-b border-slate-200/80 dark:border-white/10">
                  <TableHead className="w-36">Kode Unit</TableHead>
                  <TableHead className="w-56">Nama Unit Bisnis</TableHead>
                  <TableHead className="min-w-64">Keterangan Layanan</TableHead>
                  <TableHead className="w-24 text-center">Status</TableHead>
                  <TableHead className="text-right w-20">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
                {loading ? (
                  <TableSkeletonRows
                    rows={3}
                    colWidths={['w-24', 'w-48', 'w-64', 'w-16 mx-auto', 'w-14 ml-auto']}
                  />
                ) : filteredBusinessUnits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="p-3 rounded-full bg-primary/10 text-primary">
                          <Briefcase className="h-8 w-8 opacity-60" />
                        </div>
                        <h4 className="text-sm font-semibold text-foreground">
                          Tidak ada unit bisnis yang cocok
                        </h4>
                        <p className="text-xs text-muted-foreground max-w-sm">
                          {buSearchInput
                            ? 'Tidak ada unit bisnis yang sesuai dengan kata kunci pencarian.'
                            : 'Belum ada unit bisnis operasional yang didaftarkan di sistem.'}
                        </p>
                        {buSearchInput ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setBuSearchInput('')}
                            className="text-xs gap-1.5 h-8 mt-1"
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Reset Pencarian
                          </Button>
                        ) : (
                          isCreate && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedBu(null);
                                setBuModalOpen(true);
                              }}
                              className="text-xs gap-1.5 h-8 mt-1"
                            >
                              <Plus className="h-3.5 w-3.5" /> Tambah Unit Bisnis Baru
                            </Button>
                          )
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBusinessUnits.map((bu) => (
                    <TableRow
                      key={bu.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors"
                    >
                      <TableCell className="font-mono font-bold text-xs text-primary">
                        {bu.code}
                      </TableCell>
                      <TableCell className="font-semibold text-xs text-foreground">
                        {bu.name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {bu.description || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]">
                          <span className="h-1.5 w-1.5 rounded-full bg-current mr-1 inline-block" />
                          Aktif
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {isUpdate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                setSelectedBu(bu);
                                setBuModalOpen(true);
                              }}
                              title="Edit Unit Bisnis"
                            >
                              <Edit className="h-3.5 w-3.5 text-primary" />
                            </Button>
                          )}
                          {isDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              onClick={() =>
                                setItemToDelete({ type: 'business-unit', item: bu })
                              }
                              title="Hapus Unit Bisnis"
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
          </Card>
        </TabsContent>

        {/* ==================== TAB 3: COST CENTERS ==================== */}
        <TabsContent value="cost-centers" className="space-y-4 pt-1">
          {/* Toolbar Multi-Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari kode atau nama CC..."
                  value={ccSearchInput}
                  onChange={(e) => setCcSearchInput(e.target.value)}
                  className="pl-9 pr-8 h-8.5 text-xs uppercase"
                />
                {ccSearchInput && (
                  <button
                    type="button"
                    onClick={() => setCcSearchInput('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    title="Hapus pencarian"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <Select value={ccParentFilter} onValueChange={setCcParentFilter}>
                <SelectTrigger className="w-full sm:w-48 h-8.5 text-xs">
                  <SelectValue placeholder="Semua Tingkatan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">Semua Tingkatan</SelectItem>
                  <SelectItem value="ROOT" className="text-xs">Pusat / Tanpa Induk</SelectItem>
                  {costCenters
                    .filter((c) => !c.parentId)
                    .map((rootCc) => (
                      <SelectItem key={rootCc.id} value={rootCc.id} className="text-xs">
                        Sub dari {rootCc.code}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {(ccSearchInput || ccParentFilter !== 'ALL') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCcSearchInput('');
                    setCcParentFilter('ALL');
                  }}
                  className="h-8.5 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reset
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="text-xs text-muted-foreground font-medium hidden sm:block">
                Total: <strong className="text-foreground">{filteredCostCenters.length}</strong> cost center
              </div>
              {isCreate && (
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedCc(null);
                    setCcModalOpen(true);
                  }}
                  className="h-8.5 text-xs gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Tambah Cost Center
                </Button>
              )}
            </div>
          </div>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/80 dark:bg-white/5">
                <TableRow className="border-b border-slate-200/80 dark:border-white/10">
                  <TableHead className="w-40">Kode CC</TableHead>
                  <TableHead className="w-60">Nama Pusat Biaya</TableHead>
                  <TableHead className="w-48">Induk (Parent)</TableHead>
                  <TableHead className="min-w-64">Keterangan Alokasi</TableHead>
                  <TableHead className="text-right w-20">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
                {loading ? (
                  <TableSkeletonRows
                    rows={4}
                    colWidths={['w-28', 'w-48', 'w-36', 'w-64', 'w-14 ml-auto']}
                  />
                ) : filteredCostCenters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="p-3 rounded-full bg-primary/10 text-primary">
                          <Layers className="h-8 w-8 opacity-60" />
                        </div>
                        <h4 className="text-sm font-semibold text-foreground">
                          Tidak ada cost center yang cocok
                        </h4>
                        <p className="text-xs text-muted-foreground max-w-sm">
                          {ccSearchInput || ccParentFilter !== 'ALL'
                            ? 'Tidak ada cost center yang sesuai dengan kriteria filter.'
                            : 'Belum ada cost center yang dikonfigurasi di sistem.'}
                        </p>
                        {ccSearchInput || ccParentFilter !== 'ALL' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCcSearchInput('');
                              setCcParentFilter('ALL');
                            }}
                            className="text-xs gap-1.5 h-8 mt-1"
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Reset Filter
                          </Button>
                        ) : (
                          isCreate && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedCc(null);
                                setCcModalOpen(true);
                              }}
                              className="text-xs gap-1.5 h-8 mt-1"
                            >
                              <Plus className="h-3.5 w-3.5" /> Tambah Cost Center Baru
                            </Button>
                          )
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCostCenters.map((cc) => (
                    <TableRow
                      key={cc.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors"
                    >
                      <TableCell className="font-mono font-bold text-xs text-primary">
                        {cc.code}
                      </TableCell>
                      <TableCell className="font-semibold text-xs text-foreground">
                        {cc.name}
                      </TableCell>
                      <TableCell className="text-xs">
                        {cc.parent ? (
                          <Badge variant="outline" className="text-[10px]">
                            {cc.parent.name} ({cc.parent.code})
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground italic text-[11px]">- Pusat / Root -</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {cc.description || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {isUpdate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                setSelectedCc(cc);
                                setCcModalOpen(true);
                              }}
                              title="Edit Cost Center"
                            >
                              <Edit className="h-3.5 w-3.5 text-primary" />
                            </Button>
                          )}
                          {isDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              onClick={() =>
                                setItemToDelete({ type: 'cost-center', item: cc })
                              }
                              title="Hapus Cost Center"
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
          </Card>
        </TabsContent>

        {/* ==================== TAB 4: PROFIT CENTERS ==================== */}
        <TabsContent value="profit-centers" className="space-y-4 pt-1">
          {/* Toolbar Multi-Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari kode atau nama PC..."
                  value={pcSearchInput}
                  onChange={(e) => setPcSearchInput(e.target.value)}
                  className="pl-9 pr-8 h-8.5 text-xs uppercase"
                />
                {pcSearchInput && (
                  <button
                    type="button"
                    onClick={() => setPcSearchInput('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    title="Hapus pencarian"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <Select value={pcBuFilter} onValueChange={setPcBuFilter}>
                <SelectTrigger className="w-full sm:w-52 h-8.5 text-xs">
                  <SelectValue placeholder="Semua Unit Bisnis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">Semua Unit Bisnis</SelectItem>
                  {businessUnits.map((bu) => (
                    <SelectItem key={bu.id} value={bu.id} className="text-xs">
                      {bu.code} — {bu.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(pcSearchInput || pcBuFilter !== 'ALL') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPcSearchInput('');
                    setPcBuFilter('ALL');
                  }}
                  className="h-8.5 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reset
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="text-xs text-muted-foreground font-medium hidden sm:block">
                Total: <strong className="text-foreground">{filteredProfitCenters.length}</strong> profit center
              </div>
              {isCreate && (
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedPc(null);
                    setPcModalOpen(true);
                  }}
                  className="h-8.5 text-xs gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Tambah Profit Center
                </Button>
              )}
            </div>
          </div>

          <Card className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/80 dark:bg-white/5">
                <TableRow className="border-b border-slate-200/80 dark:border-white/10">
                  <TableHead className="w-40">Kode PC</TableHead>
                  <TableHead className="w-60">Nama Profit Center</TableHead>
                  <TableHead className="w-48">Unit Bisnis Terkait</TableHead>
                  <TableHead className="min-w-64">Keterangan Analisis</TableHead>
                  <TableHead className="text-right w-20">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
                {loading ? (
                  <TableSkeletonRows
                    rows={3}
                    colWidths={['w-28', 'w-48', 'w-36', 'w-64', 'w-14 ml-auto']}
                  />
                ) : filteredProfitCenters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="p-3 rounded-full bg-primary/10 text-primary">
                          <TrendingUp className="h-8 w-8 opacity-60" />
                        </div>
                        <h4 className="text-sm font-semibold text-foreground">
                          Tidak ada profit center yang cocok
                        </h4>
                        <p className="text-xs text-muted-foreground max-w-sm">
                          {pcSearchInput || pcBuFilter !== 'ALL'
                            ? 'Tidak ada profit center yang sesuai dengan kriteria filter.'
                            : 'Belum ada profit center yang dikonfigurasi di sistem.'}
                        </p>
                        {pcSearchInput || pcBuFilter !== 'ALL' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setPcSearchInput('');
                              setPcBuFilter('ALL');
                            }}
                            className="text-xs gap-1.5 h-8 mt-1"
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Reset Filter
                          </Button>
                        ) : (
                          isCreate && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedPc(null);
                                setPcModalOpen(true);
                              }}
                              className="text-xs gap-1.5 h-8 mt-1"
                            >
                              <Plus className="h-3.5 w-3.5" /> Tambah Profit Center Baru
                            </Button>
                          )
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProfitCenters.map((pc) => (
                    <TableRow
                      key={pc.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors"
                    >
                      <TableCell className="font-mono font-bold text-xs text-primary">
                        {pc.code}
                      </TableCell>
                      <TableCell className="font-semibold text-xs text-foreground">
                        {pc.name}
                      </TableCell>
                      <TableCell>
                        {pc.businessUnit ? (
                          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px]">
                            {pc.businessUnit.name} ({pc.businessUnit.code})
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {pc.description || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {isUpdate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                setSelectedPc(pc);
                                setPcModalOpen(true);
                              }}
                              title="Edit Profit Center"
                            >
                              <Edit className="h-3.5 w-3.5 text-primary" />
                            </Button>
                          )}
                          {isDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              onClick={() =>
                                setItemToDelete({ type: 'profit-center', item: pc })
                              }
                              title="Hapus Profit Center"
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
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <BusinessUnitModal
        isOpen={buModalOpen}
        onClose={() => setBuModalOpen(false)}
        onSubmit={handleSaveBu}
        item={selectedBu}
        loading={submitting}
      />
      <CostCenterModal
        isOpen={ccModalOpen}
        onClose={() => setCcModalOpen(false)}
        onSubmit={handleSaveCc}
        item={selectedCc}
        costCenters={costCenters}
        loading={submitting}
      />
      <ProfitCenterModal
        isOpen={pcModalOpen}
        onClose={() => setPcModalOpen(false)}
        onSubmit={handleSavePc}
        item={selectedPc}
        businessUnits={businessUnits}
        loading={submitting}
      />

      {/* Confirm Delete Dialog (Zero Native Alert) */}
      <ConfirmDialog
        open={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
        title={
          itemToDelete?.type === 'business-unit'
            ? 'Hapus Unit Bisnis Operasional'
            : itemToDelete?.type === 'cost-center'
            ? 'Hapus Pusat Biaya (Cost Center)'
            : 'Hapus Pusat Laba (Profit Center)'
        }
        description={
          itemToDelete?.type === 'business-unit'
            ? `Apakah Anda yakin ingin menghapus unit bisnis '${(itemToDelete?.item as BusinessUnit)?.name}' (${(itemToDelete?.item as BusinessUnit)?.code})?`
            : itemToDelete?.type === 'cost-center'
            ? `Apakah Anda yakin ingin menghapus cost center '${(itemToDelete?.item as CostCenter)?.name}' (${(itemToDelete?.item as CostCenter)?.code})?`
            : `Apakah Anda yakin ingin menghapus profit center '${(itemToDelete?.item as ProfitCenter)?.name}' (${(itemToDelete?.item as ProfitCenter)?.code})?`
        }
        variant="danger"
        confirmText="Hapus Data"
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
