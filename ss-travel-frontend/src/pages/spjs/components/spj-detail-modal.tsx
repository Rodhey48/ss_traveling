import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Clock,
  MapPin,
  Users,
  Play,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  FileText,
} from 'lucide-react';
import ConfirmDialog from '@/components/shared/confirm-dialog';
import { SpjService } from '@/services/spj.service';
import type { Spj, SpjLeg } from '@/types';
import { toast } from 'sonner';

interface SpjDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spj: Spj | null;
  onSuccess: () => void;
  onOpenReplaceCrew: () => void;
  onOpenEmergencyReplace: () => void;
}

export default function SpjDetailModal({
  open,
  onOpenChange,
  spj,
  onSuccess,
  onOpenReplaceCrew,
  onOpenEmergencyReplace,
}: SpjDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'legs' | 'crew'>('legs');
  const [actionLoading, setActionLoading] = useState(false);

  // Edit Leg state
  const [editingLegId, setEditingLegId] = useState<string | null>(null);
  const [mealPaxCount, setMealPaxCount] = useState<number>(0);
  const [mealNotes, setMealNotes] = useState<string>('');
  const [passengerCount, setPassengerCount] = useState<number>(0);

  // Custom Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    variant: 'danger' | 'warning' | 'info' | 'primary';
    confirmText?: string;
    onConfirm: () => void | Promise<void>;
  }>({
    open: false,
    title: '',
    description: '',
    variant: 'primary',
    onConfirm: () => {},
  });

  if (!spj) return null;

  const handleStart = () => {
    setConfirmDialog({
      open: true,
      title: 'Berangkatkan Armada Bus',
      description: `Apakah Anda yakin ingin memberangkatkan armada bus '${spj.vehicle?.code}'? SPJ '${spj.spjNo}' akan aktif di rute perjalanan.`,
      variant: 'primary',
      confirmText: 'Berangkatkan Bus',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await SpjService.startSpj(spj.id);
          toast.success(`Armada bus '${spj.vehicle?.code}' resmi diberangkatkan di rute!`);
          setConfirmDialog((prev) => ({ ...prev, open: false }));
          onSuccess();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Gagal memberangkatkan bus.');
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleComplete = () => {
    setConfirmDialog({
      open: true,
      title: 'Konfirmasi Kedatangan di Garasi Pool',
      description: `Konfirmasi kepulangan armada bus '${spj.vehicle?.code}' di garasi? Status operasional SPJ akan selesai (COMPLETED), dan status finansial otomatis beralih ke UNDER_REVIEW untuk rekonsiliasi kasir.`,
      variant: 'info',
      confirmText: 'Konfirmasi Tiba Pool',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await SpjService.completeSpj(spj.id);
          toast.success(`Operasional SPJ '${spj.spjNo}' tuntas. Siap untuk rekonsiliasi kasir pool!`);
          setConfirmDialog((prev) => ({ ...prev, open: false }));
          onSuccess();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Gagal menyelesaikan operasional SPJ.');
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleIssue = () => {
    setConfirmDialog({
      open: true,
      title: 'Terbitkan Dokumen SPJ Resmi',
      description: `Terbitkan resmi dokumen SPJ '${spj.spjNo}'? Status dokumen akan beralih menjadi ISSUED dan armada siap jalan.`,
      variant: 'primary',
      confirmText: 'Terbitkan Resmi',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await SpjService.issueSpj(spj.id);
          toast.success(`SPJ '${spj.spjNo}' resmi berstatus ISSUED.`);
          setConfirmDialog((prev) => ({ ...prev, open: false }));
          onSuccess();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Gagal menerbitkan SPJ.');
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleStartEditLeg = (leg: SpjLeg) => {
    setEditingLegId(leg.id);
    setMealPaxCount(leg.mealPaxCount || 0);
    setMealNotes(leg.mealDiscrepancyNotes || '');
    setPassengerCount(leg.passengerCount || 0);
  };

  const handleSaveLeg = async (legId: string) => {
    setActionLoading(true);
    try {
      await SpjService.updateLeg(legId, {
        passengerCount,
        mealPaxCount,
        mealDiscrepancyNotes: mealNotes || undefined,
      });
      toast.success('Data leg perjalanan dan kupon makan restoran mitra berhasil diperbarui.');
      setEditingLegId(null);
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui leg perjalanan.');
    } finally {
      setActionLoading(false);
    }
  };

  const getOperationalStatusBadge = (status: string) => {
    switch (status) {
      case 'ISSUED':
        return (
          <Badge className="bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-50 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800 font-semibold text-[10px]">
            ISSUED (Siap Jalan)
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-semibold text-[10px] shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping mr-1" /> IN_PROGRESS
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge variant="secondary" className="font-semibold text-[10px] border border-border">
            COMPLETED (Tiba Pool)
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge variant="destructive" className="font-semibold text-[10px]">
            CANCELLED
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="font-medium text-[10px]">
            {status || 'DRAFT'}
          </Badge>
        );
    }
  };

  const getFinancialStatusBadge = (status: string) => {
    switch (status) {
      case 'SETTLED':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 font-semibold text-[10px]">
            SETTLED (Lunas)
          </Badge>
        );
      case 'UNDER_REVIEW':
        return (
          <Badge className="bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-50 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800 font-semibold text-[10px]">
            UNDER_REVIEW (Kasir)
          </Badge>
        );
      case 'DISCREPANCY':
        return (
          <Badge variant="destructive" className="font-semibold text-[10px]">
            DISCREPANCY (Selisih)
          </Badge>
        );
      case 'PENDING_SETTLEMENT':
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 font-semibold text-[10px]">
            PENDING SETTLEMENT
          </Badge>
        );
    }
  };

  const getServiceBadge = (type: string) => {
    switch (type) {
      case 'AKAP':
        return (
          <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 font-semibold text-[10px]">
            AKAP Reguler
          </Badge>
        );
      case 'WISATA':
        return (
          <Badge className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 font-semibold text-[10px]">
            Sewa Wisata
          </Badge>
        );
      default:
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 font-semibold text-[10px]">
            Shuttle
          </Badge>
        );
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[880px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-primary/10 text-primary">
                  <FileText className="w-5 h-5" />
                </span>
                <div>
                  <DialogTitle className="text-xl font-bold">{spj.spjNo}</DialogTitle>
                  <DialogDescription className="text-xs">
                    Surat Perintah Jalan Dinas Operasional PT SS Traveling Official
                  </DialogDescription>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {getOperationalStatusBadge(spj.operationalStatus)}
                {getFinancialStatusBadge(spj.financialStatus)}
              </div>
            </div>
          </DialogHeader>

          {/* Banner Emergency Breakdown (Skenario 3) jika ini SPJ Pengganti */}
          {spj.parentSpj && (
            <div className="p-3.5 rounded-xl border border-amber-200/70 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/20 text-xs text-foreground flex items-start gap-2.5 shadow-2xs">
              <Wrench className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs">Dokumen SPJ Pengganti Armada Breakdown (Skenario 3)</p>
                <p className="text-muted-foreground mt-0.5 leading-relaxed">
                  Perjalanan ini merupakan estafet darurat lanjutan dari SPJ Induk{' '}
                  <strong className="text-foreground">{spj.parentSpj.spjNo}</strong> ({spj.parentSpj.vehicle?.code}). Omzet muatan tiket diakui terpusat tanpa duplikasi.
                </p>
              </div>
            </div>
          )}

          {/* Informasi Ringkas Armada & Penugasan */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl border bg-muted/20 text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px]">Armada Bus:</span>
              <span className="font-bold text-sm text-foreground">
                {spj.vehicle?.code}
              </span>
              <span className="text-muted-foreground block">{spj.vehicle?.plateNumber}</span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px]">Layanan & Kapasitas:</span>
              <div className="mt-1">
                {getServiceBadge(spj.serviceType)}
              </div>
              <span className="text-muted-foreground block mt-0.5">{spj.vehicle?.capacity} Kursi</span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px]">Jadwal Terhubung:</span>
              <span className="font-semibold text-foreground">
                {spj.tripSchedule?.scheduleNo || '-'}
              </span>
              {spj.tripSchedule?.customer && (
                <span className="text-muted-foreground block truncate">
                  {spj.tripSchedule.customer.institutionName || spj.tripSchedule.customer.picName}
                </span>
              )}
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px]">Waktu Operasional:</span>
              <span className="text-muted-foreground block">
                Terbit: {spj.issuedAt ? new Date(spj.issuedAt).toLocaleDateString('id-ID') : '-'}
              </span>
              <span className="text-muted-foreground block">
                Selesai: {spj.operationallyCompletedAt ? new Date(spj.operationallyCompletedAt).toLocaleDateString('id-ID') : '-'}
              </span>
            </div>
          </div>

          {/* Tabs: Legs Rute vs Penugasan Kru */}
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'legs' | 'crew')} className="space-y-4">
            <TabsList className="bg-muted p-1">
              <TabsTrigger value="legs" className="flex items-center gap-2 text-xs font-semibold">
                <MapPin className="w-4 h-4" /> Rute Perjalanan (Legs) ({spj.legs?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="crew" className="flex items-center gap-2 text-xs font-semibold">
                <Users className="w-4 h-4" /> Penugasan Kru & Hak ({spj.crewAssignments?.length || 0})
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Legs Rute Perjalanan */}
            <TabsContent value="legs" className="space-y-3">
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 text-xs">
                      <TableHead className="w-[80px]">Leg #</TableHead>
                      <TableHead>Arah & Rute</TableHead>
                      <TableHead>Waktu Dinas</TableHead>
                      <TableHead>Manifes Kursi</TableHead>
                      <TableHead>Kupon Restoran Mitra</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {spj.legs?.map((leg) => {
                      const isEditing = editingLegId === leg.id;

                      return (
                        <TableRow key={leg.id} className="text-xs hover:bg-muted/30">
                          <TableCell className="font-bold">
                            <Badge variant="secondary" className="text-[10px]">
                              Leg {leg.sequenceNo}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <div className="font-semibold text-foreground">{leg.origin.split('/')[0].trim()} ➔ {leg.destination}</div>
                            <Badge variant="outline" className="text-[9px] mt-0.5 text-muted-foreground font-normal">
                              {leg.direction}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-muted-foreground">
                            {leg.departureAt && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-muted-foreground" /> Berangkat:{' '}
                                {new Date(leg.departureAt).toLocaleTimeString('id-ID', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            )}
                            {leg.arrivalAt && (
                              <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                                <Clock className="w-3 h-3" /> Tiba:{' '}
                                {new Date(leg.arrivalAt).toLocaleTimeString('id-ID', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            )}
                          </TableCell>

                          <TableCell>
                            {isEditing ? (
                              <Input
                                type="number"
                                value={passengerCount}
                                onChange={(e) => setPassengerCount(Number(e.target.value))}
                                className="h-8 w-20 text-xs font-bold"
                              />
                            ) : (
                              <span className="font-bold text-foreground">{leg.passengerCount} Pax</span>
                            )}
                          </TableCell>

                          <TableCell>
                            {isEditing ? (
                              <div className="space-y-1">
                                <Input
                                type="number"
                                value={mealPaxCount}
                                onChange={(e) => setMealPaxCount(Number(e.target.value))}
                                placeholder="Kupon RM"
                                className="h-8 w-24 text-xs font-semibold"
                              />
                              <Input
                                value={mealNotes}
                                onChange={(e) => setMealNotes(e.target.value)}
                                placeholder="Catatan selisih kupon"
                                className="h-7 text-[10px]"
                              />
                            </div>
                          ) : (
                            <div>
                              <span className="font-semibold text-foreground">
                                {leg.mealPaxCount || 0} Kupon
                              </span>
                              {leg.mealDiscrepancyNotes && (
                                <p className="text-[10px] text-muted-foreground italic">
                                  "{leg.mealDiscrepancyNotes}"
                                </p>
                              )}
                            </div>
                          )}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-medium"
                          >
                            {leg.status}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingLegId(null)}
                                className="h-7 text-[10px] px-2"
                              >
                                Batal
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSaveLeg(leg.id)}
                                disabled={actionLoading}
                                className="h-7 text-[10px] px-2 bg-primary text-primary-foreground font-semibold"
                              >
                                Simpan
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStartEditLeg(leg)}
                              className="h-7 text-[11px] font-medium text-primary hover:bg-primary/10"
                            >
                              Edit Kupon/Pax
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Tab 2: Penugasan Kru & Snapshot Tarif */}
          <TabsContent value="crew" className="space-y-3">
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 text-xs">
                    <TableHead>Nama Personel</TableHead>
                    <TableHead>Peran (Role)</TableHead>
                    <TableHead>Uang Makan (SPJ)</TableHead>
                    <TableHead>Premi Ritase</TableHead>
                    <TableHead>Bonus Full Seat (100%)</TableHead>
                    <TableHead>Status Penugasan</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {spj.crewAssignments?.map((c) => (
                    <TableRow key={c.id} className="text-xs hover:bg-muted/30">
                      <TableCell className="font-bold text-foreground">
                        {c.crew?.name}
                        <div className="text-[10px] text-muted-foreground font-normal">{c.crew?.nip || c.crew?.email}</div>
                        {c.replacementCrew && (
                          <div className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5 font-medium">
                            ➔ Digantikan oleh: {c.replacementCrew.name}
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-normal">
                          {c.role}
                        </Badge>
                      </TableCell>

                      <TableCell className="font-medium text-foreground">
                        Rp {Number(c.mealAllowanceSnapshot || 0).toLocaleString('id-ID')}
                      </TableCell>

                      <TableCell className="font-medium text-foreground">
                        Rp {Number(c.incentiveSnapshot || 0).toLocaleString('id-ID')}
                      </TableCell>

                      <TableCell className="font-medium text-foreground">
                        Rp {Number(c.fullSeatBonusSnapshot || 0).toLocaleString('id-ID')}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            c.status === 'REPLACED'
                              ? 'bg-amber-50/70 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300'
                              : c.status === 'ACTIVE'
                              ? 'bg-emerald-50/70 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'text-muted-foreground'
                          }
                        >
                          {c.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Tombol Aksi Operasional */}
        <DialogFooter className="pt-4 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Tombol aksi khusus insiden darurat */}
          <div className="flex items-center gap-2">
            {spj.operationalStatus === 'IN_PROGRESS' && (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onOpenReplaceCrew}
                  className="text-xs h-9 text-amber-800 border-amber-300/80 hover:bg-amber-50 dark:text-amber-300 dark:border-amber-800/80 font-medium"
                >
                  <Users className="w-3.5 h-3.5 mr-1.5" /> Ganti Kru Sakit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onOpenEmergencyReplace}
                  className="text-xs h-9 text-red-700 border-red-300/80 hover:bg-red-50 dark:text-red-400 dark:border-red-800/80 font-medium"
                >
                  <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> Breakdown Tol
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs h-9">
              Tutup
            </Button>

            {spj.operationalStatus === 'DRAFT' && (
              <Button
                size="sm"
                onClick={handleIssue}
                disabled={actionLoading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-9 font-semibold"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Terbitkan SPJ
              </Button>
            )}

            {spj.operationalStatus === 'ISSUED' && (
              <Button
                size="sm"
                onClick={handleStart}
                disabled={actionLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 font-semibold shadow-2xs"
              >
                <Play className="w-4 h-4 mr-1.5" /> Berangkatkan Bus
              </Button>
            )}

            {spj.operationalStatus === 'IN_PROGRESS' && (
              <Button
                size="sm"
                onClick={handleComplete}
                disabled={actionLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 font-semibold shadow-2xs"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Selesai / Tiba di Pool
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Reusable Confirm Dialog */}
    <ConfirmDialog
      open={confirmDialog.open}
      onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
      title={confirmDialog.title}
      description={confirmDialog.description}
      variant={confirmDialog.variant}
      confirmText={confirmDialog.confirmText}
      onConfirm={confirmDialog.onConfirm}
    />
  </>
  );
}
