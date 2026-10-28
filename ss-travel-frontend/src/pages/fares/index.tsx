import { useState, useEffect } from 'react';
import Heading from '@/components/shared/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Calendar,
  Ticket,
  ArrowRight,
  Calculator,
  Edit,
  Trash2,
  Sparkles,
} from 'lucide-react';
import FareSeasonModal from './components/fare-season-modal';
import FareMatrixModal from './components/fare-matrix-modal';
import { FareService } from '@/services/fare.service';
import { VehicleService } from '@/services/vehicle.service';
import type {
  FareSeason,
  FareSeasonFormData,
  FareMatrix,
  FareMatrixFormData,
  SeatClass,
  CalculatedFareResult,
} from '@/types';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/use-permission';

export default function FaresPage() {
  const { isCreate, isUpdate, isDelete } = usePermission();
  const [activeTab, setActiveTab] = useState<'matrix' | 'seasons'>('matrix');
  const [seasons, setSeasons] = useState<FareSeason[]>([]);
  const [matrices, setMatrices] = useState<FareMatrix[]>([]);
  const [seatClasses, setSeatClasses] = useState<SeatClass[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedSeasonFilter, setSelectedSeasonFilter] = useState<string>('ALL');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');

  // Modals
  const [isSeasonModalOpen, setIsSeasonModalOpen] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<FareSeason | null>(null);

  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);
  const [selectedMatrix, setSelectedMatrix] = useState<FareMatrix | null>(null);

  const [modalLoading, setModalLoading] = useState(false);

  // Simulation calculator state
  const [simOrigin, setSimOrigin] = useState('TANGERANG');
  const [simDestination, setSimDestination] = useState('YOGYAKARTA');
  const [simSeatClassId, setSimSeatClassId] = useState('');
  const [simTravelDate, setSimTravelDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [calcResult, setCalcResult] = useState<CalculatedFareResult | null>(null);
  const [calculating, setCalculating] = useState(false);

  const fetchDependencies = async () => {
    try {
      const scRes = await VehicleService.getSeatClasses();
      if (scRes?.data) {
        setSeatClasses(scRes.data);
        if (scRes.data.length > 0 && !simSeatClassId) {
          setSimSeatClassId(scRes.data[0].id);
        }
      }
    } catch (err: any) {
      console.error('Failed fetching seat classes', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [seasonRes, matrixRes] = await Promise.all([
        FareService.findAllSeasons(),
        FareService.findAllMatrix(),
      ]);

      if (seasonRes?.data) setSeasons(seasonRes.data);
      if (matrixRes?.data) setMatrices(matrixRes.data);
    } catch (err: any) {
      toast.error('Gagal memuat data matriks tarif tiket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
    fetchData();
  }, []);

  // Handle Season CRUD
  const handleSeasonSubmit = async (formData: FareSeasonFormData) => {
    setModalLoading(true);
    try {
      if (selectedSeason) {
        await FareService.updateSeason(selectedSeason.id, formData);
        toast.success('Kalender musim tarif berhasil diperbarui');
      } else {
        await FareService.createSeason(formData);
        toast.success('Musim tarif baru berhasil dibuat');
      }
      setIsSeasonModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan musim tarif');
    } finally {
      setModalLoading(false);
    }
  };

  const handleSeasonDelete = async (season: FareSeason) => {
    if (season.code === 'REGULER') {
      toast.error('Musim tarif REGULER tidak boleh dihapus.');
      return;
    }
    if (confirm(`Hapus musim tarif '${season.name}'? Seluruh matriks terkait akan ikut terhapus.`)) {
      try {
        await FareService.deleteSeason(season.id);
        toast.success('Musim tarif berhasil dihapus');
        fetchData();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Gagal menghapus musim tarif');
      }
    }
  };

  // Handle Matrix CRUD
  const handleMatrixSubmit = async (formData: FareMatrixFormData) => {
    setModalLoading(true);
    try {
      if (selectedMatrix) {
        await FareService.updateMatrix(selectedMatrix.id, formData);
        toast.success('Matriks tarif tiket berhasil diperbarui');
      } else {
        await FareService.createMatrix(formData);
        toast.success('Matriks tarif baru berhasil ditambahkan');
      }
      setIsMatrixModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan matriks tarif');
    } finally {
      setModalLoading(false);
    }
  };

  const handleMatrixDelete = async (matrix: FareMatrix) => {
    if (confirm(`Hapus entri tarif ${matrix.origin} -> ${matrix.destination}?`)) {
      try {
        await FareService.deleteMatrix(matrix.id);
        toast.success('Matriks tarif berhasil dihapus');
        fetchData();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Gagal menghapus tarif');
      }
    }
  };

  // Live Simulation
  const handleSimulateCalculation = async () => {
    if (!simSeatClassId) {
      toast.error('Pilih kelas kursi terlebih dahulu');
      return;
    }
    setCalculating(true);
    try {
      const res = await FareService.calculateFare({
        origin: simOrigin,
        destination: simDestination,
        seatClassId: simSeatClassId,
        travelDate: simTravelDate,
      });
      if (res?.data) {
        setCalcResult(res.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Kalkulasi tarif tidak ditemukan');
      setCalcResult(null);
    } finally {
      setCalculating(false);
    }
  };

  const filteredMatrices = matrices.filter((m) => {
    if (selectedSeasonFilter !== 'ALL' && m.fareSeasonId !== selectedSeasonFilter) {
      return false;
    }
    if (selectedClassFilter !== 'ALL' && m.seatClassId !== selectedClassFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Heading
          title="Matriks Tarif & Musim Tiket"
          description="Konfigurasi kalender musim dinamis (Reguler, Tuslah Lebaran, Libur Sekolah) & matriks tarif per kelas kursi bus."
        />
        <div className="flex items-center gap-2">
          {activeTab === 'seasons' && isCreate && (
            <Button
              onClick={() => {
                setSelectedSeason(null);
                setIsSeasonModalOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Tambah Musim
            </Button>
          )}
          {activeTab === 'matrix' && isCreate && (
            <Button
              onClick={() => {
                setSelectedMatrix(null);
                setIsMatrixModalOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Tambah Matriks Tarif
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-xs border-l-4 border-l-primary">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Kalender Musim Tarif</CardDescription>
            <CardTitle className="text-2xl font-bold text-primary flex items-center justify-between">
              {seasons.length} Musim
              <Calendar className="h-5 w-5 opacity-40" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-xs text-muted-foreground">
              {seasons.filter((s) => s.isActive).length} Musim Aktif
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-l-4 border-l-blue-600">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Matriks Tarif Terkonfigurasi</CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-600 flex items-center justify-between">
              {matrices.length} Kombinasi
              <Ticket className="h-5 w-5 opacity-40" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-xs text-muted-foreground">
              Rute Jakarta/Tangerang &lt;-&gt; Yogya
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-l-4 border-l-purple-600">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Tarif Dasar Sleeper</CardDescription>
            <CardTitle className="text-2xl font-bold text-purple-700 dark:text-purple-400 flex items-center justify-between">
              Rp 420.000
              <Sparkles className="h-5 w-5 opacity-40" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-xs text-muted-foreground">
              Tuslah Lebaran: Rp 650.000
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-l-4 border-l-amber-500">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Tarif Dasar Executive</CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-700 dark:text-amber-400 flex items-center justify-between">
              Rp 250.000
              <Ticket className="h-5 w-5 opacity-40" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-xs text-muted-foreground">
              Tuslah Lebaran: Rp 400.000
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'matrix' | 'seasons')}
        className="space-y-4"
      >
        <div className="flex justify-start">
          <TabsList className="bg-muted p-1 rounded-xl h-auto flex flex-wrap gap-1 justify-start">
            <TabsTrigger
              value="matrix"
              className="gap-2 py-1.5 px-3 text-xs sm:text-sm"
            >
              <Ticket className="h-4 w-4" /> Matriks Tarif Tiket
            </TabsTrigger>
            <TabsTrigger
              value="seasons"
              className="gap-2 py-1.5 px-3 text-xs sm:text-sm"
            >
              <Calendar className="h-4 w-4" /> Kalender Musim Tarif
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: MATRIKS TARIF TIKET */}
        <TabsContent value="matrix" className="space-y-6 pt-2">
          {/* Kalkulator Simulasi Dinamis Widget */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-semibold">
                  Simulasi Engine Dynamic Pricing (Formula Addendum v1.6 & v1.17)
                </CardTitle>
              </div>
              <CardDescription>
                Uji perhitungan harga tiket otomatis: f(Rute, Tanggal Musim, Kelas Kursi)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Kota Asal</label>
                  <Input
                    value={simOrigin}
                    onChange={(e) => setSimOrigin(e.target.value.toUpperCase())}
                    placeholder="TANGERANG"
                    className="h-9 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Kota Tujuan</label>
                  <Input
                    value={simDestination}
                    onChange={(e) => setSimDestination(e.target.value.toUpperCase())}
                    placeholder="YOGYAKARTA"
                    className="h-9 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Kelas Kursi</label>
                  <Select value={simSeatClassId} onValueChange={setSimSeatClassId}>
                    <SelectTrigger className="h-9 mt-1">
                      <SelectValue placeholder="Pilih Kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      {seatClasses.map((sc) => (
                        <SelectItem key={sc.id} value={sc.id}>
                          {sc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Tanggal Perjalanan
                  </label>
                  <Input
                    type="date"
                    value={simTravelDate}
                    onChange={(e) => setSimTravelDate(e.target.value)}
                    className="h-9 mt-1"
                  />
                </div>
                <div>
                  <Button
                    onClick={handleSimulateCalculation}
                    disabled={calculating}
                    className="w-full h-9"
                  >
                    {calculating ? 'Menghitung...' : 'Hitung Tarif'}
                  </Button>
                </div>
              </div>

              {calcResult && (
                <div className="mt-4 p-4 rounded-lg bg-muted/40 border flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {calcResult.origin} &rarr; {calcResult.destination}
                      </span>
                      <Badge variant="outline">{calcResult.seatClass.name}</Badge>
                      {calcResult.isSeasonal ? (
                        <Badge className="bg-amber-600/15 text-amber-700 dark:text-amber-400 border-amber-200">
                          Musim: {calcResult.seasonName}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Reguler Harian</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tanggal Keberangkatan: {calcResult.travelDate}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground font-medium">Harga Tiket Final</div>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      Rp {Number(calcResult.amount).toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select
                value={selectedSeasonFilter}
                onValueChange={setSelectedSeasonFilter}
              >
                <SelectTrigger className="w-[200px] h-9">
                  <SelectValue placeholder="Semua Musim" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Musim Tarif</SelectItem>
                  {seasons.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedClassFilter}
                onValueChange={setSelectedClassFilter}
              >
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Semua Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Kelas Kursi</SelectItem>
                  {seatClasses.map((sc) => (
                    <SelectItem key={sc.id} value={sc.id}>
                      {sc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              Menampilkan {filteredMatrices.length} dari {matrices.length} tarif tiket
            </div>
          </div>

          {/* Matrix Table */}
          <Card className="shadow-xs">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rute Perjalanan</TableHead>
                  <TableHead>Musim Tarif</TableHead>
                  <TableHead>Kelas Kursi</TableHead>
                  <TableHead className="text-right">Tarif Dasar Tiket</TableHead>
                  <TableHead>Mulai Berlaku</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Memuat matriks tarif tiket...
                    </TableCell>
                  </TableRow>
                ) : filteredMatrices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Tidak ada tarif yang cocok dengan filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMatrices.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-semibold">
                        <div className="flex items-center gap-1.5">
                          <span>{m.origin}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span>{m.destination}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            m.fareSeason?.code === 'REGULER' ? 'secondary' : 'default'
                          }
                          className={
                            m.fareSeason?.code === 'LEBARAN_2026'
                              ? 'bg-amber-600/15 text-amber-700 dark:text-amber-400 border-amber-200'
                              : ''
                          }
                        >
                          {m.fareSeason?.name || m.fareSeasonId}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {m.seatClass?.name || 'Kelas Kursi'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-base text-emerald-700 dark:text-emerald-400">
                        Rp {Number(m.amount).toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {m.effectiveFrom ? m.effectiveFrom.split('T')[0] : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            m.isActive
                              ? 'text-emerald-700 dark:text-emerald-400 border-emerald-300 bg-emerald-600/10'
                              : 'text-zinc-500'
                          }
                        >
                          {m.isActive ? 'Aktif' : 'Non-Aktif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isUpdate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedMatrix(m);
                                setIsMatrixModalOpen(true);
                              }}
                            >
                              <Edit className="h-3.5 w-3.5 text-primary" />
                            </Button>
                          )}
                          {isDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMatrixDelete(m)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
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

        {/* TAB 2: KALENDER MUSIM TARIF */}
        <TabsContent value="seasons" className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {seasons.map((s) => (
              <Card
                key={s.id}
                className="shadow-xs flex flex-col justify-between"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-mono text-xs">
                      {s.code}
                    </Badge>
                    <Badge
                      className={
                        s.isActive
                          ? 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border-emerald-200'
                          : 'bg-muted text-muted-foreground'
                      }
                    >
                      {s.isActive ? 'Aktif' : 'Non-Aktif'}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-bold mt-2">{s.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {s.description || 'Tidak ada deskripsi tambahan.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-2.5 rounded-lg bg-muted/40 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mulai:</span>
                      <span className="font-semibold">
                        {s.startDate ? s.startDate.split('T')[0] : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Selesai:</span>
                      <span className="font-semibold">
                        {s.endDate ? s.endDate.split('T')[0] : '-'}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Jumlah Matriks Terkait: <strong>{s.matrices?.length || 0}</strong>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t">
                    {isUpdate && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedSeason(s);
                          setIsSeasonModalOpen(true);
                        }}
                      >
                        <Edit className="h-3.5 w-3.5 mr-1 text-primary" /> Edit
                      </Button>
                    )}
                    {isDelete && s.code !== 'REGULER' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSeasonDelete(s)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1 text-destructive" /> Hapus
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <FareSeasonModal
        isOpen={isSeasonModalOpen}
        onClose={() => setIsSeasonModalOpen(false)}
        onSubmit={handleSeasonSubmit}
        season={selectedSeason}
        loading={modalLoading}
      />

      <FareMatrixModal
        isOpen={isMatrixModalOpen}
        onClose={() => setIsMatrixModalOpen(false)}
        onSubmit={handleMatrixSubmit}
        matrix={selectedMatrix}
        seasons={seasons}
        seatClasses={seatClasses}
        loading={modalLoading}
      />
    </div>
  );
}
