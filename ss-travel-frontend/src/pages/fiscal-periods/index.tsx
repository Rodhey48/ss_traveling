import { useState, useEffect } from 'react';
import Heading from '@/components/shared/heading';
import { Button } from '@/components/ui/button';
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
  CalendarRange,
  Plus,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import FiscalYearModal from './components/fiscal-year-modal';
import UpdateStatusModal from './components/update-status-modal';
import { FiscalPeriodService } from '@/services/fiscal-period.service';
import type {
  FiscalYear,
  FiscalPeriod,
  CreateFiscalYearFormData,
  UpdatePeriodStatusFormData,
  FiscalPeriodStatus,
} from '@/types';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/use-permission';

export default function FiscalPeriodsPage() {
  const { isCreate, isUpdate } = usePermission();
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<FiscalYear | null>(null);
  const [loading, setLoading] = useState(false);

  // Modals
  const [isYearModalOpen, setIsYearModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [periodToUpdate, setPeriodToUpdate] = useState<FiscalPeriod | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchYears = async () => {
    setLoading(true);
    try {
      const res = await FiscalPeriodService.findAllYears();
      if (res?.data && res.data.length > 0) {
        setFiscalYears(res.data);
        // Default to first year if none selected or keep current
        const currentYearId = selectedYearId || res.data[0].id;
        setSelectedYearId(currentYearId);
        await fetchYearDetail(currentYearId);
      }
    } catch (err: any) {
      toast.error('Gagal memuat tahun fiskal', {
        description: err?.response?.data?.message || err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchYearDetail = async (yearId: string) => {
    try {
      const res = await FiscalPeriodService.findOneYear(yearId);
      if (res?.data) {
        setSelectedYear(res.data);
      }
    } catch (err: any) {
      console.error('Failed fetching year details', err);
    }
  };

  useEffect(() => {
    fetchYears();
  }, []);

  const handleYearChange = async (yearId: string) => {
    setSelectedYearId(yearId);
    await fetchYearDetail(yearId);
  };

  const handleCreateYear = async (data: CreateFiscalYearFormData) => {
    setSubmitting(true);
    try {
      const res = await FiscalPeriodService.createYear(data);
      toast.success(`Tahun fiskal '${data.year}' berhasil dibuat dengan 12 periode.`);
      setIsYearModalOpen(false);
      await fetchYears();
      if (res?.data) {
        setSelectedYearId(res.data.id);
        setSelectedYear(res.data);
      }
    } catch (err: any) {
      toast.error('Gagal membuat tahun fiskal', {
        description: err?.response?.data?.message || err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenStatusModal = (period: FiscalPeriod) => {
    setPeriodToUpdate(period);
    setIsStatusModalOpen(true);
  };

  const handleUpdateStatus = async (data: UpdatePeriodStatusFormData) => {
    if (!periodToUpdate) return;
    setSubmitting(true);
    try {
      await FiscalPeriodService.updatePeriodStatus(periodToUpdate.id, data);
      toast.success(`Status periode '${periodToUpdate.name}' berhasil diperbarui.`);
      setIsStatusModalOpen(false);
      if (selectedYearId) {
        await fetchYearDetail(selectedYearId);
      }
    } catch (err: any) {
      toast.error('Gagal memperbarui status periode', {
        description: err?.response?.data?.message || err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: FiscalPeriodStatus) => {
    switch (status) {
      case 'OPEN':
        return (
          <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border-emerald-200">
            <CheckCircle2 className="h-3 w-3 mr-1" /> OPEN
          </Badge>
        );
      case 'CLOSING':
        return (
          <Badge className="bg-amber-600/15 text-amber-700 dark:text-amber-400 border-amber-200">
            <Clock className="h-3 w-3 mr-1" /> CLOSING
          </Badge>
        );
      case 'CLOSED':
        return (
          <Badge className="bg-slate-600/15 text-slate-700 dark:text-slate-400 border-slate-300">
            <Lock className="h-3 w-3 mr-1" /> CLOSED
          </Badge>
        );
      case 'REOPENED':
        return (
          <Badge className="bg-purple-600/15 text-purple-700 dark:text-purple-400 border-purple-200">
            <Unlock className="h-3 w-3 mr-1" /> REOPENED
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Heading
          title="Periode Fiskal Akuntansi"
          description="Kalender penutupan buku bulanan dan tahun fiskal PT SS Traveling Official."
        />
        {isCreate && (
          <Button onClick={() => setIsYearModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Buka Tahun Fiskal Baru
          </Button>
        )}
      </div>

      {/* Year Selection & Summary Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/30 p-4 rounded-xl border">
        <div className="flex items-center space-x-3">
          <CalendarRange className="h-6 w-6 text-primary shrink-0" />
          <div>
            <div className="text-xs text-muted-foreground">Pilih Tahun Fiskal:</div>
            <div className="flex items-center space-x-2 mt-1">
              <Select value={selectedYearId} onValueChange={handleYearChange}>
                <SelectTrigger className="w-[180px] bg-background font-bold text-base">
                  <SelectValue placeholder="Pilih Tahun" />
                </SelectTrigger>
                <SelectContent>
                  {fiscalYears.map((fy) => (
                    <SelectItem key={fy.id} value={fy.id}>
                      Tahun {fy.year} ({fy.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedYear && (
                <Badge
                  variant="outline"
                  className={
                    selectedYear.status === 'OPEN'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-slate-500 text-slate-600'
                  }
                >
                  Tahun {selectedYear.status}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {selectedYear && (
          <div className="text-xs text-muted-foreground flex flex-col md:text-right">
            <span>Rentang Waktu: {selectedYear.startDate} s.d. {selectedYear.endDate}</span>
            <span className="font-medium text-foreground">
              Total 12 Periode Bulanan Terkonfigurasi
            </span>
          </div>
        )}
      </div>

      {/* Monthly Periods Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Daftar 12 Periode Bulanan - Tahun {selectedYear?.year}</span>
            <span className="text-xs font-normal text-muted-foreground">
              Posting jurnal ditolak otomatis pada periode berstatus CLOSED
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Periode</TableHead>
                <TableHead>Nama Periode</TableHead>
                <TableHead>Rentang Tanggal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Keterangan & Catatan Tutup Buku</TableHead>
                <TableHead className="text-right w-[140px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Memuat kalender periode fiskal...
                  </TableCell>
                </TableRow>
              ) : !selectedYear?.periods || selectedYear.periods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Tidak ada periode bulanan pada tahun fiskal ini.
                  </TableCell>
                </TableRow>
              ) : (
                selectedYear.periods.map((period) => (
                  <TableRow key={period.id} className="hover:bg-muted/40">
                    <TableCell className="font-mono font-bold text-xs">
                      P-{String(period.periodNo).padStart(2, '0')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {period.name}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {period.startDate} &rarr; {period.endDate}
                    </TableCell>
                    <TableCell>{getStatusBadge(period.status)}</TableCell>
                    <TableCell className="text-xs">
                      {period.closeReason ? (
                        <div className="text-muted-foreground italic truncate max-w-sm">
                          {period.closeReason}
                        </div>
                      ) : period.status === 'CLOSED' ? (
                        <span className="text-muted-foreground">Periode terkunci</span>
                      ) : (
                        <span className="text-muted-foreground">Siap menerima jurnal transaksi</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isUpdate && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleOpenStatusModal(period)}
                        >
                          Ubah Status
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modals */}
      <FiscalYearModal
        isOpen={isYearModalOpen}
        onClose={() => setIsYearModalOpen(false)}
        onSubmit={handleCreateYear}
        isLoading={submitting}
      />

      <UpdateStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onSubmit={handleUpdateStatus}
        period={periodToUpdate}
        isLoading={submitting}
      />
    </div>
  );
}
