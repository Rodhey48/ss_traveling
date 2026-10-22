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
import { FileCheck2 } from 'lucide-react';
import { ArService } from '@/services/ar.service';
import { SpjService } from '@/services/spj.service';
import { CustomerService } from '@/services/customer.service';
import type { Spj, Customer, CreateCharterPelunasanFormData } from '@/types';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateCharterPelunasanModal({ open, onOpenChange, onSuccess }: Props) {
  const [spjs, setSpjs] = useState<Spj[]>([]);
  const [selectedSpjId, setSelectedSpjId] = useState<string>('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');

  const [invoiceDate, setInvoiceDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  );
  const [remainingAmount, setRemainingAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      // Reset inputan saat modal dibuka
      setSelectedSpjId('');
      setSelectedCustomerId('');
      setCustomerName('');
      setRemainingAmount(0);
      setNotes('');
      setInvoiceDate(new Date().toISOString().split('T')[0]);
      setDueDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      SpjService.getSpjs({ serviceType: 'WISATA' }).then((res) => {
        const items = res.data || [];
        setSpjs(items);
      });

      CustomerService.findAll({ limit: 100 }).then((res) => {
        const items = res.data?.data || [];
        setCustomers(items);
      });
    }
  }, [open]);

  const handleCustomerChange = (id: string) => {
    setSelectedCustomerId(id);
    const c = customers.find((item) => item.id === id);
    if (c) {
      setCustomerName(c.institutionName || c.picName);
    } else {
      setCustomerName('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpjId) {
      toast.error('Pilih SPJ Wisata terlebih dahulu.');
      return;
    }
    if (!customerName.trim()) {
      toast.error('Nama pelanggan wajib diisi.');
      return;
    }
    if (remainingAmount <= 0) {
      toast.error('Nominal pelunasan harus lebih dari 0.');
      return;
    }

    try {
      setSaving(true);
      const payload: CreateCharterPelunasanFormData = {
        tripId: selectedSpjId,
        customerId: selectedCustomerId || undefined,
        customerName,
        invoiceDate,
        dueDate,
        remainingAmount,
        notes,
      };

      await ArService.createCharterPelunasanInvoice(payload);
      toast.success('Invoice pelunasan 70% sewa wisata berhasil diterbitkan (INV/WIS).');
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menerbitkan invoice pelunasan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-2xl w-full p-6 sm:p-7 max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
            <FileCheck2 className="h-6 w-6 text-indigo-600" />
            Penerbitan Invoice Pelunasan Sewa Wisata (70%)
          </DialogTitle>
          <p className="text-sm text-slate-500">
            Penerbitan faktur piutang usaha (akun 12101) untuk sisa kontrak sewa charter bus (Skenario 2).
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-4">
            <div>
              <Label className="text-xs font-semibold text-slate-700">Pilih SPJ Wisata Terkait <span className="text-red-500">*</span></Label>
              <select
                className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                value={selectedSpjId}
                onChange={(e) => setSelectedSpjId(e.target.value)}
                required
              >
                <option value="">-- Pilih SPJ Wisata --</option>
                {spjs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.spjNo} — {s.vehicle?.plateNumber} ({s.vehicle?.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Pelanggan / Klien <span className="text-red-500">*</span></Label>
              <select
                className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                value={selectedCustomerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
              >
                <option value="">-- Pilih Pelanggan Terdaftar (Opsional) --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.institutionName || c.picName} ({c.code})
                  </option>
                ))}
              </select>
              <Input
                placeholder="Atau ketik nama klien / instansi penyewa..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-2 h-10 bg-white text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-700">Tanggal Invoice</Label>
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
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-700">
              Sisa Nominal Pelunasan (Rp) <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                Rp
              </span>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={remainingAmount > 0 ? remainingAmount.toLocaleString('id-ID') : ''}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setRemainingAmount(raw ? parseInt(raw, 10) : 0);
                }}
                className="pl-9 text-lg font-bold text-indigo-900 bg-white"
                required
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-700">Keterangan / Catatan Tagihan</Label>
            <Textarea
              placeholder="Contoh: Invoice pelunasan 70% kontrak sewa bus pariwisata..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 bg-white h-16"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
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
              disabled={saving || remainingAmount <= 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              {saving ? 'Menerbitkan...' : 'Terbitkan Invoice Pelunasan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
