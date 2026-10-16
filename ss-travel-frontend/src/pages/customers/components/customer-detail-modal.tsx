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
} from 'lucide-react';
import type { Customer } from '@/types';

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="font-mono text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                  {customer.code}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    customer.customerTier === 'PLATINUM'
                      ? 'border-purple-300 bg-purple-50 text-purple-700'
                      : customer.customerTier === 'GOLD'
                      ? 'border-amber-300 bg-amber-50 text-amber-700'
                      : customer.customerTier === 'SILVER'
                      ? 'border-blue-300 bg-blue-50 text-blue-700'
                      : 'border-slate-300 bg-slate-50 text-slate-700'
                  }
                >
                  <Sparkles className="h-3 w-3 mr-1" /> Tier {customer.customerTier}
                </Badge>
              </div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 pt-1">
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
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
                  : 'bg-muted text-muted-foreground'
              }
            >
              {customer.isActive ? 'Pelanggan Aktif' : 'Non-Aktif'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Ringkasan Metrik Loyalitas CRM */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-muted/30 rounded-xl border space-y-0.5">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <History className="h-3.5 w-3.5 text-primary" /> Total Frekuensi Sewa
              </span>
              <span className="text-lg font-black text-primary block">
                {customer.totalTripsCount}x Perjalanan
              </span>
            </div>
            <div className="p-3 bg-muted/30 rounded-xl border space-y-0.5">
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
            <div className="p-3 bg-muted/30 rounded-xl border space-y-0.5">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Sumber Prospek (Lead)
              </span>
              <span className="text-xs font-semibold text-foreground block pt-1">
                Via {customer.leadSource}
              </span>
            </div>
          </div>

          {/* Rincian Kontak & Lokasi Penjemputan */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Informasi Kontak & Titik Jemput
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-card rounded-xl border space-y-1">
                <div className="text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-emerald-600" /> Nomor Telepon / WhatsApp
                </div>
                <div className="font-mono font-bold text-sm text-foreground flex items-center justify-between">
                  {customer.phone}
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:underline bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200"
                  >
                    <MessageCircle className="h-3 w-3" /> Chat WA
                  </a>
                </div>
              </div>

              <div className="p-3 bg-card rounded-xl border space-y-1">
                <div className="text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-blue-600" /> Email Penawaran / Faktur
                </div>
                <div className="font-medium text-foreground truncate pt-0.5" title={customer.email}>
                  {customer.email || 'Tidak dicantumkan'}
                </div>
              </div>

              <div className="sm:col-span-2 p-3 bg-card rounded-xl border space-y-1">
                <div className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-rose-600" /> Alamat Domisili / Titik Kumpul Penjemputan
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
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Catatan Khusus & Preferensi Sewa (*CRM Notes*)
              </h4>
              <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
                {customer.specialNotes}
              </div>
            </div>
          )}

          {/* Seksi Riwayat Perjalanan Sewa (History Order SPJ) */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary" /> Riwayat Order & Kontrak SPJ Wisata
              </h4>
              <Badge variant="outline" className="text-[10px]">
                Integrasi SPJ Tahap 5
              </Badge>
            </div>

            <Card className="border border-dashed bg-muted/20">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start gap-2.5">
                  <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p className="font-semibold text-foreground">
                      Modul Riwayat SPJ Perjalanan Wisata Sedang Dipersiapkan
                    </p>
                    <p className="leading-relaxed">
                      Saat modul operasional SPJ (Surat Perintah Jalan) diaktifkan di <strong>Tahap 5</strong> nanti,
                      seluruh kontrak sewa pariwisata yang melibatkan pelanggan ini akan otomatis tercatat di sini secara rinci:
                      nomor SPJ resmi, tanggal tour, armada bus yang ditugaskan, nama supir, serta invoice pelunasan sewa.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="pt-4 border-t gap-2">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(customer);
              }}
              className="gap-1.5 text-xs"
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
            <Button size="sm" className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
              <MessageCircle className="h-3.5 w-3.5" /> Hubungi WhatsApp
            </Button>
          </a>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
