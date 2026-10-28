import { useState, useEffect } from 'react';
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
  Building,
  Briefcase,
  Layers,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Save,
} from 'lucide-react';
import BusinessUnitModal from './components/business-unit-modal';
import CostCenterModal from './components/cost-center-modal';
import ProfitCenterModal from './components/profit-center-modal';
import { OrganizationService } from '@/services/organization.service';
import type { Company, BusinessUnit, CostCenter, ProfitCenter } from '@/types';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/use-permission';

export default function OrganizationPage() {
  const { isCreate, isUpdate, isDelete } = usePermission();

  // State Data
  const [company, setCompany] = useState<Company | null>(null);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [profitCenters, setProfitCenters] = useState<ProfitCenter[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal States
  const [buModalOpen, setBuModalOpen] = useState(false);
  const [selectedBu, setSelectedBu] = useState<BusinessUnit | null>(null);

  const [ccModalOpen, setCcModalOpen] = useState(false);
  const [selectedCc, setSelectedCc] = useState<CostCenter | null>(null);

  const [pcModalOpen, setPcModalOpen] = useState(false);
  const [selectedPc, setSelectedPc] = useState<ProfitCenter | null>(null);

  const [submitting, setSubmitting] = useState(false);

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
    } catch (error: any) {
      toast.error('Gagal memuat data organisasi');
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
      await OrganizationService.updateCompany(company.id, companyForm);
      toast.success('Profil perusahaan berhasil diperbarui');
      fetchAllData();
    } catch (error: any) {
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
        toast.success('Unit bisnis berhasil diperbarui');
      } else {
        await OrganizationService.createBusinessUnit(data);
        toast.success('Unit bisnis baru berhasil ditambahkan');
      }
      setBuModalOpen(false);
      fetchAllData();
    } catch (error: any) {
      toast.error('Gagal menyimpan unit bisnis');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBu = async (bu: BusinessUnit) => {
    if (!confirm(`Hapus unit bisnis ${bu.name}?`)) return;
    try {
      await OrganizationService.removeBusinessUnit(bu.id);
      toast.success('Unit bisnis berhasil dihapus');
      fetchAllData();
    } catch (error) {
      toast.error('Gagal menghapus unit bisnis');
    }
  };

  // --- CC HANDLERS ---
  const handleSaveCc = async (data: Partial<CostCenter>) => {
    setSubmitting(true);
    try {
      if (selectedCc) {
        await OrganizationService.updateCostCenter(selectedCc.id, data);
        toast.success('Cost center berhasil diperbarui');
      } else {
        await OrganizationService.createCostCenter(data);
        toast.success('Cost center baru berhasil ditambahkan');
      }
      setCcModalOpen(false);
      fetchAllData();
    } catch (error: any) {
      toast.error('Gagal menyimpan cost center');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCc = async (cc: CostCenter) => {
    if (!confirm(`Hapus cost center ${cc.name}?`)) return;
    try {
      await OrganizationService.removeCostCenter(cc.id);
      toast.success('Cost center berhasil dihapus');
      fetchAllData();
    } catch (error) {
      toast.error('Gagal menghapus cost center');
    }
  };

  // --- PC HANDLERS ---
  const handleSavePc = async (data: Partial<ProfitCenter>) => {
    setSubmitting(true);
    try {
      if (selectedPc) {
        await OrganizationService.updateProfitCenter(selectedPc.id, data);
        toast.success('Profit center berhasil diperbarui');
      } else {
        await OrganizationService.createProfitCenter(data);
        toast.success('Profit center baru berhasil ditambahkan');
      }
      setPcModalOpen(false);
      fetchAllData();
    } catch (error: any) {
      toast.error('Gagal menyimpan profit center');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePc = async (pc: ProfitCenter) => {
    if (!confirm(`Hapus profit center ${pc.name}?`)) return;
    try {
      await OrganizationService.removeProfitCenter(pc.id);
      toast.success('Profit center berhasil dihapus');
      fetchAllData();
    } catch (error) {
      toast.error('Gagal menghapus profit center');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Heading
        title="Pengaturan Struktur Organisasi & Dimensi"
        description="Konfigurasi profil entitas hukum perusahaan, unit bisnis operasional, hierarki cost center, dan profit center."
      />

      {loading ? (
        <div className="p-12 text-center text-sm text-muted-foreground border rounded-xl bg-card">
          Memuat data organisasi dan dimensi...
        </div>
      ) : (
        <Tabs defaultValue="company" className="space-y-4">
          <TabsList className="bg-muted p-1 rounded-xl">
            <TabsTrigger value="company" className="gap-2 text-xs">
              <Building className="h-4 w-4" /> Profil Perusahaan
            </TabsTrigger>
            <TabsTrigger value="business-units" className="gap-2 text-xs">
              <Briefcase className="h-4 w-4" /> Unit Bisnis ({businessUnits.length})
            </TabsTrigger>
            <TabsTrigger value="cost-centers" className="gap-2 text-xs">
              <Layers className="h-4 w-4" /> Cost Center ({costCenters.length})
            </TabsTrigger>
            <TabsTrigger value="profit-centers" className="gap-2 text-xs">
              <TrendingUp className="h-4 w-4" /> Profit Center ({profitCenters.length})
            </TabsTrigger>
          </TabsList>

        {/* TAB 1: PROFIL PERUSAHAAN */}
        <TabsContent value="company">
          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" /> Entitas Hukum PT SS Traveling Official
              </CardTitle>
              <CardDescription className="text-xs">
                Informasi dasar perusahaan yang tercetak pada kop faktur, invoice AR, dan dokumen SPJ.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveCompany} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="cName" className="text-xs font-semibold">
                      Nama Perusahaan Resmi
                    </Label>
                    <Input
                      id="cName"
                      value={companyForm.name}
                      onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="cCode" className="text-xs font-semibold">
                      Kode Perusahaan (Company Scope)
                    </Label>
                    <Input id="cCode" value={companyForm.code} disabled className="bg-muted font-mono" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="cPhone" className="text-xs font-semibold">
                      Telepon / WhatsApp Kantor
                    </Label>
                    <Input
                      id="cPhone"
                      value={companyForm.phone}
                      onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="cEmail" className="text-xs font-semibold">
                      Email Resmi
                    </Label>
                    <Input
                      id="cEmail"
                      value={companyForm.email}
                      onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="cAddress" className="text-xs font-semibold">
                    Alamat Kantor Pusat / Pool Utama
                  </Label>
                  <Input
                    id="cAddress"
                    value={companyForm.address}
                    onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Mata Uang Basis</Label>
                    <Input value={companyForm.currency} disabled className="bg-muted font-bold" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Zona Waktu Sistem</Label>
                    <Input value={companyForm.timezone} disabled className="bg-muted font-mono" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="cWeb" className="text-xs font-semibold">
                      Website
                    </Label>
                    <Input
                      id="cWeb"
                      value={companyForm.website}
                      onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                    />
                  </div>
                </div>

                {isUpdate && (
                  <div className="pt-3 flex justify-end">
                    <Button type="submit" disabled={submitting} className="gap-2">
                      <Save className="h-4 w-4" /> {submitting ? 'Menyimpan...' : 'Simpan Profil'}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: UNIT BISNIS */}
        <TabsContent value="business-units">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold">Lini / Unit Usaha Operasional</CardTitle>
                <CardDescription className="text-xs">
                  Klasifikasi operasional layanan bus: AKAP Reguler, Pariwisata, dan Shuttle Bandara.
                </CardDescription>
              </div>
              {isCreate && (
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedBu(null);
                    setBuModalOpen(true);
                  }}
                  className="gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Tambah Unit Bisnis
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode Unit</TableHead>
                    <TableHead>Nama Unit Bisnis</TableHead>
                    <TableHead>Keterangan Layanan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {businessUnits.map((bu) => (
                    <TableRow key={bu.id}>
                      <TableCell className="font-mono font-bold text-primary">{bu.code}</TableCell>
                      <TableCell className="font-semibold">{bu.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{bu.description || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-emerald-600 bg-emerald-50">
                          Aktif
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {isUpdate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setSelectedBu(bu);
                                setBuModalOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {isDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteBu(bu)}
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: COST CENTERS */}
        <TabsContent value="cost-centers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold">Pusat Biaya (Cost Centers)</CardTitle>
                <CardDescription className="text-xs">
                  Dimensi tempat penanggung jawab beban biaya terjadi (Pool Garasi, Bengkel, Administrasi Kantor).
                </CardDescription>
              </div>
              {isCreate && (
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedCc(null);
                    setCcModalOpen(true);
                  }}
                  className="gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Tambah Cost Center
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode CC</TableHead>
                    <TableHead>Nama Pusat Biaya</TableHead>
                    <TableHead>Induk (Parent)</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costCenters.map((cc) => (
                    <TableRow key={cc.id}>
                      <TableCell className="font-mono font-bold text-primary">{cc.code}</TableCell>
                      <TableCell className="font-semibold">{cc.name}</TableCell>
                      <TableCell className="text-xs">
                        {cc.parent ? (
                          <Badge variant="outline">{cc.parent.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground">- Pusat -</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{cc.description || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {isUpdate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setSelectedCc(cc);
                                setCcModalOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {isDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteCc(cc)}
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: PROFIT CENTERS */}
        <TabsContent value="profit-centers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold">Pusat Laba (Profit Centers)</CardTitle>
                <CardDescription className="text-xs">
                  Dimensi pelaporan analisis margin kontribusi dan laba kotor per lini bisnis perusahaan.
                </CardDescription>
              </div>
              {isCreate && (
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedPc(null);
                    setPcModalOpen(true);
                  }}
                  className="gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Tambah Profit Center
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode PC</TableHead>
                    <TableHead>Nama Profit Center</TableHead>
                    <TableHead>Unit Bisnis Terkait</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profitCenters.map((pc) => (
                    <TableRow key={pc.id}>
                      <TableCell className="font-mono font-bold text-primary">{pc.code}</TableCell>
                      <TableCell className="font-semibold">{pc.name}</TableCell>
                      <TableCell>
                        {pc.businessUnit ? (
                          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                            {pc.businessUnit.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{pc.description || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {isUpdate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setSelectedPc(pc);
                                setPcModalOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {isDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeletePc(pc)}
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      )}

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
    </div>
  );
}
