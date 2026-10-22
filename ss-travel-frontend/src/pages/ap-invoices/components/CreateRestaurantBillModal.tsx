import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Utensils, AlertTriangle, Bus } from 'lucide-react';
import { ApService } from '@/services/ap.service';
import { PartnerService } from '@/services/partner.service';
import type { Restaurant, UnbilledSpjItem, CreateRestaurantBillFormData } from '@/types';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateRestaurantBillModal({ open, onOpenChange, onSuccess }: Props) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');
  const [vendorInvoiceNo, setVendorInvoiceNo] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  );
  const [notes, setNotes] = useState<string>('');

  // Unbilled SPJs drawer / selection
  const [unbilledSpjs, setUnbilledSpjs] = useState<UnbilledSpjItem[]>([]);
  const [loadingUnbilled, setLoadingUnbilled] = useState(false);
  const [selectedSpjMap, setSelectedSpjMap] = useState<
    Record<string, { couponCount: number; discrepancyNotes?: string }>
  >({});

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      // Reset inputan saat modal dibuka
      setVendorInvoiceNo('');
      setNotes('');
      setInvoiceDate(new Date().toISOString().split('T')[0]);
      setDueDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      PartnerService.findAllRestaurants().then((res) => {
        const data = res.data || [];
        setRestaurants(data.filter((r) => r.isActive));
        if (data.length > 0 && !selectedRestaurantId) {
          setSelectedRestaurantId(data[0].id);
        }
      });
    }
  }, [open]);

  // Tarik SPJ belum ditagih saat restoran dipilih
  useEffect(() => {
    if (selectedRestaurantId && open) {
      setLoadingUnbilled(true);
      ApService.getUnbilledSpjs(selectedRestaurantId)
        .then((items) => {
          setUnbilledSpjs(items);
          // Inisialisasi map kupon
          const initialMap: Record<string, { couponCount: number; discrepancyNotes?: string }> = {};
          items.forEach((item) => {
            initialMap[item.tripId] = {
              couponCount: item.suggestedCouponCount || item.manifestPaxCount,
              discrepancyNotes: item.discrepancyNotes || '',
            };
          });
          setSelectedSpjMap(initialMap);
        })
        .catch((err) => {
          toast.error('Gagal mengambil daftar SPJ: ' + (err.response?.data?.message || err.message));
        })
        .finally(() => setLoadingUnbilled(false));
    }
  }, [selectedRestaurantId, open]);

  const selectedRestaurant = restaurants.find((r) => r.id === selectedRestaurantId);
  const ratePerPax = selectedRestaurant?.ratePerPax || 0;

  // Selected trip IDs for bill
  const [includedTripIds, setIncludedTripIds] = useState<string[]>([]);

  useEffect(() => {
    if (unbilledSpjs.length > 0) {
      // Default: centang semua SPJ yang ditarik
      setIncludedTripIds(unbilledSpjs.map((s) => s.tripId));
    } else {
      setIncludedTripIds([]);
    }
  }, [unbilledSpjs]);

  const toggleTripSelection = (tripId: string) => {
    setIncludedTripIds((prev) =>
      prev.includes(tripId) ? prev.filter((id) => id !== tripId) : [...prev, tripId],
    );
  };

  const updateCouponCount = (tripId: string, count: number) => {
    setSelectedSpjMap((prev) => ({
      ...prev,
      [tripId]: {
        ...prev[tripId],
        couponCount: count,
      },
    }));
  };

  const updateNotes = (tripId: string, note: string) => {
    setSelectedSpjMap((prev) => ({
      ...prev,
      [tripId]: {
        ...prev[tripId],
        discrepancyNotes: note,
      },
    }));
  };

  // Kalkulasi total
  const totalAmount = includedTripIds.reduce((acc, tripId) => {
    const item = selectedSpjMap[tripId];
    return acc + (item ? item.couponCount * ratePerPax : 0);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestaurantId) {
      toast.error('Pilih restoran mitra terlebih dahulu.');
      return;
    }
    if (!vendorInvoiceNo.trim()) {
      toast.error('Nomor faktur fisik dari restoran wajib diisi.');
      return;
    }
    if (includedTripIds.length === 0) {
      toast.error('Pilih minimal 1 SPJ untuk ditagihkan.');
      return;
    }

    try {
      setSaving(true);
      const payload: CreateRestaurantBillFormData = {
        restaurantId: selectedRestaurantId,
        vendorInvoiceNo,
        invoiceDate,
        dueDate,
        notes,
        spjItems: includedTripIds.map((tripId) => {
          const spjItem = unbilledSpjs.find((s) => s.tripId === tripId);
          return {
            tripId,
            tripLegId: spjItem?.tripLegId,
            couponCount: selectedSpjMap[tripId]?.couponCount || 0,
            discrepancyNotes: selectedSpjMap[tripId]?.discrepancyNotes,
          };
        }),
      };

      await ApService.createRestaurantBill(payload);
      toast.success('Tagihan servis makan restoran mitra berhasil dibuat (Draft).');
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal membuat tagihan restoran');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl sm:max-w-5xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-7">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
            <Utensils className="h-6 w-6 text-amber-600" />
            Tagihan Servis Makan Restoran Mitra (AP Berkala)
          </DialogTitle>
          <p className="text-sm text-slate-500">
            Tarik SPJ operasional yang belum ditagihkan, verifikasi kupon makan riil vs manifes,
            dan terbitkan tagihan utang usaha (21101) anti-double billing.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <Label className="text-xs font-semibold text-slate-700">Restoran Mitra</Label>
              <select
                className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={selectedRestaurantId}
                onChange={(e) => setSelectedRestaurantId(e.target.value)}
              >
                {restaurants.map((rm) => (
                  <option key={rm.id} value={rm.id}>
                    {rm.name} ({rm.city}) — Rp {Number(rm.ratePerPax).toLocaleString('id-ID')}/pax
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">
                Nomor Faktur Fisik Vendor <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Contoh: INV-RMTS-2026/10/012"
                value={vendorInvoiceNo}
                onChange={(e) => setVendorInvoiceNo(e.target.value)}
                className="mt-1 bg-white"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Tanggal Faktur</Label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="mt-1 bg-white"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Jatuh Tempo Pembayaran</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 bg-white"
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label className="text-xs font-semibold text-slate-700">Catatan Tambahan (Opsional)</Label>
              <Textarea
                placeholder="Keterangan periode penagihan atau dokumen pendukung..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 bg-white h-16"
              />
            </div>
          </div>

          {/* Daftar SPJ Belum Ditagih */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bus className="h-5 w-5 text-indigo-600" />
                <h3 className="font-semibold text-slate-800 text-sm">
                  Daftar SPJ Melintas Belum Ditagih ({unbilledSpjs.length})
                </h3>
              </div>
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                Tarif RM: Rp {Number(ratePerPax).toLocaleString('id-ID')} / pax
              </Badge>
            </div>

            {loadingUnbilled ? (
              <div className="p-8 text-center text-slate-400 text-sm">Memuat SPJ belum ditagih...</div>
            ) : unbilledSpjs.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed rounded-xl text-slate-500 text-sm">
                Tidak ada SPJ belum ditagih untuk restoran ini. Semua SPJ sudah pernah ditagihkan!
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-slate-100">
                    <TableRow>
                      <TableHead className="w-12 text-center">Pilih</TableHead>
                      <TableHead>No SPJ & Armada</TableHead>
                      <TableHead className="w-24 text-center">Manifes</TableHead>
                      <TableHead className="w-32 text-center">Kupon Riil</TableHead>
                      <TableHead>Catatan Selisih</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unbilledSpjs.map((spj) => {
                      const isIncluded = includedTripIds.includes(spj.tripId);
                      const currentCoupon = selectedSpjMap[spj.tripId]?.couponCount || 0;
                      const hasWarning = currentCoupon > spj.manifestPaxCount;
                      const subtotal = currentCoupon * ratePerPax;

                      return (
                        <TableRow
                          key={spj.tripId}
                          className={isIncluded ? 'bg-amber-50/30' : 'opacity-60 bg-white'}
                        >
                          <TableCell className="text-center">
                            <input
                              type="checkbox"
                              checked={isIncluded}
                              onChange={() => toggleTripSelection(spj.tripId)}
                              className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-slate-800">{spj.spjNo}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-2">
                              <span>Bus: {spj.vehiclePlate} ({spj.vehicleCode})</span>
                              <span>• Supir: {spj.driverName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-medium text-slate-700">
                            {spj.manifestPaxCount} pax
                          </TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="number"
                              min={1}
                              disabled={!isIncluded}
                              value={currentCoupon}
                              onChange={(e) =>
                                updateCouponCount(spj.tripId, parseInt(e.target.value) || 0)
                              }
                              className={`h-8 text-center font-bold ${
                                hasWarning ? 'border-amber-500 bg-amber-50 text-amber-900' : ''
                              }`}
                            />
                            {hasWarning && (
                              <div className="flex items-center justify-center gap-1 text-[11px] text-amber-600 mt-1">
                                <AlertTriangle className="h-3 w-3" />
                                &gt; Manifes ({spj.manifestPaxCount})
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Input
                              disabled={!isIncluded}
                              placeholder={
                                hasWarning
                                  ? 'Alasan kupon melebihi manifes...'
                                  : 'Catatan kupon riil...'
                              }
                              value={selectedSpjMap[spj.tripId]?.discrepancyNotes || ''}
                              onChange={(e) => updateNotes(spj.tripId, e.target.value)}
                              className="h-8 text-xs bg-white"
                            />
                          </TableCell>
                          <TableCell className="text-right font-bold text-slate-800">
                            Rp {subtotal.toLocaleString('id-ID')}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Footer Total */}
          <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                Total Tagihan Servis Makan
              </div>
              <div className="text-xs text-amber-600">
                Terdiri dari {includedTripIds.length} SPJ terverifikasi
              </div>
            </div>
            <div className="text-2xl font-black text-amber-900">
              Rp {totalAmount.toLocaleString('id-ID')}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={saving || includedTripIds.length === 0}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
            >
              {saving ? 'Menyimpan...' : 'Terbitkan Tagihan AP (Draft)'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
