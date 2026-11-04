import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Sparkles,
  Edit,
  MessageCircle,
  History,
  FileText,
  Info,
  Copy,
} from 'lucide-react';
import type { Customer } from '@/types';
import { toast } from 'sonner';

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onEdit?: (customer: Customer) => void;
}

export default function CustomerDetailModal({
  isOpen,
  onClose,
  customer,
  onEdit,
}: CustomerDetailModalProps) {
  if (!customer) return null;

  const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
  const waUrl = cleanPhone.startsWith('0')
    ? `https://wa.me/62${cleanPhone.slice(1)}`
    : `https://wa.me/${cleanPhone}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} berhasil disalin ke clipboard`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-200/80 dark:border-white/10 pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="font-mono text-xs font-bold bg-primary/10 text-primary border-primary/20">
                  {customer.code}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    customer.customerTier === 'PLATINUM'
                      ? 'border-purple-300 bg-purple-500/10 text-purple-700 dark:text-purple-400'
                      : customer.customerTier === 'GOLD'
                      ? 'border-amber-300 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                      : customer.customerTier === 'SILVER'
                      ? 'border-blue-300 bg-blue-500/10 text-blue-700 dark:text-blue-400'
                      : 'border-slate-300 bg-slate-500/10 text-slate-700 dark:text-slate-400'
                  }
                >
                  <Sparkles className="h-3 w-3 mr-1" /> Tier {customer.customerTier}
                </Badge>
              </div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2 pt-1 text-foreground">
                <Building2 className="h-5 w-5 text-primary" />
                {customer.institutionName || customer.picName}
              </DialogTitle>
              {customer.institutionName && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  PIC Panitia: <strong>{customer.picName}</strong>
                </p>
              )}
            </div>

            <Badge
              variant="outline"
              className={
                customer.isActive
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs'
                  : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20 text-xs'
              }
            >
              {customer.isActive ? 'Pelanggan Aktif' : 'Non-Aktif'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Ringkasan Metrik Loyalitas CRM */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-muted/40 rounded-xl border border-slate-200/80 dark:border-white/10 space-y-0.5">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <History className="h-3.5 w-3.5 text-primary" /> Total Sewa
              </span>
              <span className="text-lg font-black text-primary block">
                {customer.totalTripsCount}x Perjalanan
              </span>
            </div>
            <div className="p-3 bg-muted/40 rounded-xl border border-slate-200/80 dark:border-white/10 space-y-0.5">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-primary" /> Terakhir Sewa
              </span>
              <span className="text-xs font-semibold text-foreground block pt-1">
                {customer.lastTripDate
                  ? new Date(customer.lastTripDate).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'Belum Ada Trip'}
              </span>
            </div>
            <div className="p-3 bg-muted/40 rounded-xl border border-slate-200/80 dark:border-white/10 space-y-0.5">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Sumber Prospek
              </span>
              <span className="text-xs font-semibold text-foreground block pt-1">
                Via {customer.leadSource}
              </span>
            </div>
          </div>

          {/* Rincian Kontak & Lokasi Penjemputan */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Informasi Kontak &amp; Titik Jemput
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-card rounded-xl border border-slate-200/80 dark:border-white/10 space-y-1.5">
                <div className="text-muted-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-emerald-600" /> WhatsApp / Telepon
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(customer.phone, 'Nomor telepon')}
                    className="hover:text-foreground text-muted-foreground"
                    title="Salin nomor"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
                <div className="font-mono font-bold text-sm text-foreground flex items-center justify-between">
                  {customer.phone}
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:underline bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20"
                  >
                    <MessageCircle className="h-3 w-3" /> Chat WA
                  </a>
                </div>
              </div>

              <div className="p-3 bg-card rounded-xl border border-slate-200/80 dark:border-white/10 space-y-1.5">
                <div className="text-muted-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-blue-600" /> Email Penawaran / Faktur
                  </span>
                  {customer.email && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(customer.email || '', 'Email')}
                      className="hover:text-foreground text-muted-foreground"
                      title="Salin email"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div className="font-medium text-foreground truncate pt-0.5" title={customer.email}>
                  {customer.email || 'Tidak dicantumkan'}
                </div>
              </div>

              <div className="sm:col-span-2 p-3 bg-card rounded-xl border border-slate-200/80 dark:border-white/10 space-y-1.5">
                <div className="text-muted-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-rose-600" /> Alamat Domisili &amp; Titik Kumpul Penjemputan
                  </span>
                  {customer.address && (
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          `${customer.address || ''}, ${customer.city || ''}`,
                          'Alamat penjemputan',
                        )
                      }
                      className="hover:text-foreground text-muted-foreground"
                      title="Salin alamat"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div className="font-medium text-foreground">
                  {customer.address ? `${customer.address}, ` : ''}
                  <span className="font-semibold text-primary">{customer.city || 'Jabodetabek'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Preferensi Khusus / Special Notes */}
          {customer.specialNotes && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Catatan Khusus &amp; Preferensi Sewa (*CRM Notes*)
              </h4>
              <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                {customer.specialNotes}
              </div>
            </div>
          )}

          {/* Seksi Riwayat Perjalanan Sewa (History Order SPJ) */}
          <div className="space-y-2.5 pt-2 border-t border-slate-200/80 dark:border-white/10">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary" /> Riwayat Order &amp; Kontrak SPJ Wisata
              </h4>
              <Badge variant="outline" className="text-[10px]">
                Integrasi SPJ Aktif
              </Badge>
            </div>

            <Card className="border border-dashed border-slate-200/80 dark:border-white/10 bg-muted/20">
              <CardContent className="p-3.5 space-y-1.5">
                <div className="flex items-start gap-2.5">
                  <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p className="font-semibold text-foreground">
                      Kesiapan Integrasi Kontrak Sewa Wisata
                    </p>
                    <p className="leading-relaxed text-[11px]">
                      Pelanggan ini dapat langsung dipilih saat membuat jadwal dinas pariwisata di <strong>Jadwal &amp; Plotting (/schedules)</strong>. Seluruh riwayat order, nomor SPJ resmi, armada bus yang ditugaskan, serta faktur tagihan DP &amp; pelunasan sewa akan terakumulasi secara otomatis pada akun ini.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-slate-200/80 dark:border-white/10 gap-2">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(customer);
              }}
              className="gap-1.5 text-xs h-8.5"
            >
              <Edit className="h-3.5 w-3.5" /> Edit Data Pelanggan
            </Button>
          )}
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex"
          >
            <Button size="sm" className="gap-1.5 text-xs h-8.5 bg-emerald-600 hover:bg-emerald-700 text-white">
              <MessageCircle className="h-3.5 w-3.5" /> Hubungi WhatsApp
            </Button>
          </a>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs h-8.5">
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
