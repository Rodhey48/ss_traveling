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
import {
  Plus,
  Trash2,
  Bus,
  Ticket,
  Package,
  Store,
  Sliders,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react';
import { ArService } from '@/services/ar.service';
import { AccountService } from '@/services/account.service';
import { CustomerService } from '@/services/customer.service';
import { VehicleService } from '@/services/vehicle.service';
import type {
  Account,
  Customer,
  Vehicle,
  CreateArInvoiceFormData,
  CreateArInvoiceLineFormData,
} from '@/types';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ArTemplatePreset {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  badgeColor: string;
  defaultCustomerName?: string;
  customerNamePlaceholder: string;
  recommendedArCode: string;      // Akun Piutang (Debit)
  recommendedRevenueCode: string; // Akun Pendapatan (Kredit)
  lineDescriptionPlaceholder: string;
  notesPlaceholder: string;
}

const AR_TEMPLATES: ArTemplatePreset[] = [
  {
    id: 'CHARTER_NON_SPJ',
    title: 'Sewa Wisata / Dropping',
    subtitle: 'Kontrak carter bus rombongan',
    icon: Bus,
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    customerNamePlaceholder: 'Contoh: PT Telkom Akses / SMAN 1 Ciputat',
    recommendedArCode: '12101',      // Piutang Sewa Charter Bus Wisata
    recommendedRevenueCode: '42101', // Pendapatan Sewa Bus Wisata
    lineDescriptionPlaceholder: 'Sewa bus pariwisata 3 hari drop-off bandara & tour',
    notesPlaceholder: 'Kontrak sewa charter bus rombongan...',
  },
  {
    id: 'AGEN_TIKET',
    title: 'Piutang Tiket Agen',
    subtitle: 'Tagihan penjualan tiket mitra agen',
    icon: Ticket,
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    customerNamePlaceholder: 'Contoh: Agen Tiket Terminal Giwangan / Pondok Pinang',
    recommendedArCode: '12101',      // Piutang Usaha
    recommendedRevenueCode: '41101', // Pendapatan Tiket Bus AKAP
    lineDescriptionPlaceholder: 'Setoran penjualan tiket penumpang bus AKAP periode berjalan',
    notesPlaceholder: 'Rekap nomor seri tiket agen yang belum disetor ke rekening kantor...',
  },
  {
    id: 'KARGO_PAKET',
    title: 'Pengiriman Kargo Rutin',
    subtitle: 'Piutang ekspedisi paket & motor',
    icon: Package,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    customerNamePlaceholder: 'Contoh: CV Ekspedisi Mandiri / Kargo Logistik',
    recommendedArCode: '12101',      // Piutang Usaha
    recommendedRevenueCode: '43101', // Pendapatan Paket & Kargo Bus
    lineDescriptionPlaceholder: 'Tagihan pengiriman kargo paket bulanan via bagasi bus',
    notesPlaceholder: 'No. Resi pengiriman kargo / nota penagihan...',
  },
  {
    id: 'SEWA_LAHAN_IKLAN',
    title: 'Sewa Kios & Iklan Bodi',
    subtitle: 'Sewa kantin pool, billboard bus',
    icon: Store,
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    customerNamePlaceholder: 'Contoh: Pengelola Kantin Garasi / PT Media Iklan',
    recommendedArCode: '12101',      // Piutang Usaha
    recommendedRevenueCode: '81101', // Pendapatan Non-Operasional / Sewa Lahan
    lineDescriptionPlaceholder: 'Sewa kios garasi Ciputat & pemasangan stiker iklan bodi',
    notesPlaceholder: 'Perjanjian sewa lahan atau kontrak promosi...',
  },
  {
    id: 'CUSTOM',
    title: 'Invoice AR Kustom',
    subtitle: 'Pilihan manual seluruh akun COA',
    icon: Sliders,
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    customerNamePlaceholder: 'Nama Klien / Pembayar...',
    recommendedArCode: '12101',
    recommendedRevenueCode: '42101',
    lineDescriptionPlaceholder: 'Deskripsi rincian piutang usaha...',
    notesPlaceholder: 'Catatan tambahan invoice...',
  },
];

interface GroupedAccounts {
  groupName: string;
  accounts: Account[];
}

export function CreateGeneralArInvoiceModal({ open, onOpenChange, onSuccess }: Props) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('CHARTER_NON_SPJ');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  );
  const [arAccountId, setArAccountId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Dropdown data
  const [receivableAccounts, setReceivableAccounts] = useState<Account[]>([]);
  const [revenueAccounts, setRevenueAccounts] = useState<Account[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Lines
  const [lines, setLines] = useState<CreateArInvoiceLineFormData[]>([
    {
      description: '',
      accountId: '',
      qty: 1,
      unitPrice: 0,
      vehicleId: '',
    },
  ]);

  const [saving, setSaving] = useState(false);

  // Grouping Akun Pendapatan secara terstruktur
  const groupRevenueAccounts = (accounts: Account[]): GroupedAccounts[] => {
    const groups: Record<string, { groupName: string; accounts: Account[] }> = {
      '41': { groupName: '41 — Pendapatan Tiket Bus AKAP', accounts: [] },
      '42': { groupName: '42 — Pendapatan Sewa Bus Wisata (Charter)', accounts: [] },
      '43': { groupName: '43 — Pendapatan Paket & Kargo Bus', accounts: [] },
      '81': { groupName: '81 — Pendapatan Non-Operasional (Sewa Lahan & Iklan)', accounts: [] },
      'other': { groupName: 'Pendapatan Lainnya', accounts: [] },
    };

    accounts.forEach((acc) => {
      const prefix = acc.code.slice(0, 2);
      if (groups[prefix]) {
        groups[prefix].accounts.push(acc);
      } else {
        groups['other'].accounts.push(acc);
      }
    });

    return Object.values(groups).filter((g) => g.accounts.length > 0);
  };

  // Grouping Akun Piutang secara terstruktur
  const groupReceivableAccounts = (accounts: Account[]): GroupedAccounts[] => {
    const groups: Record<string, { groupName: string; accounts: Account[] }> = {
      '121': { groupName: '121 — Piutang Usaha Sewa Bus Wisata & Charter', accounts: [] },
      '122': { groupName: '122 — Piutang Setoran Tiket Agen Bus AKAP', accounts: [] },
      '123': { groupName: '123 — Piutang Ekspedisi Kargo & Paket', accounts: [] },
      'other': { groupName: 'Aset Lancar & Piutang Lainnya', accounts: [] },
    };

    accounts.forEach((acc) => {
      const prefix = acc.code.slice(0, 3);
      if (groups[prefix]) {
        groups[prefix].accounts.push(acc);
      } else {
        groups['other'].accounts.push(acc);
      }
    });

    return Object.values(groups).filter((g) => g.accounts.length > 0);
  };

  const applyTemplate = (
    templateId: string,
    recAccs: Account[],
    revAccs: Account[],
  ) => {
    setSelectedTemplateId(templateId);
    const tmpl = AR_TEMPLATES.find((t) => t.id === templateId);
    if (!tmpl) return;

    // Cari akun piutang rekomendasi
    const recMatch =
      recAccs.find((a) => a.code === tmpl.recommendedArCode) ||
      recAccs.find((a) => a.code === '12101') ||
      recAccs[0];
    if (recMatch) setArAccountId(recMatch.id);

    // Cari akun pendapatan rekomendasi
    const revMatch =
      revAccs.find((a) => a.code === tmpl.recommendedRevenueCode) ||
      revAccs[0];

    // Reset lines dengan akun pendapatan rekomendasi
    setLines([
      {
        description: '',
        accountId: revMatch ? revMatch.id : '',
        qty: 1,
        unitPrice: 0,
        vehicleId: '',
      },
    ]);
  };

  useEffect(() => {
    if (open) {
      setSelectedCustomerId('');
      setCustomerName('');
      setNotes('');
      setInvoiceDate(new Date().toISOString().split('T')[0]);
      setDueDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      Promise.all([
        AccountService.findAll({ isPostable: true, tree: false }),
        CustomerService.findAll({ limit: 100 }),
        VehicleService.findAll({ limit: 100 }),
      ]).then(([resAcc, resCust, resVeh]) => {
        const accs = (resAcc.data || []) as Account[];
        const postable = accs.filter((a) => a.isPostable && a.isActive);
        const assets = postable.filter((a) => a.type === 'ASSET');
        const revenues = postable.filter((a) => a.type === 'REVENUE');

        setReceivableAccounts(assets);
        setRevenueAccounts(revenues);

        setCustomers(resCust.data?.data || []);
        setVehicles(resVeh.data?.data || []);

        applyTemplate('CHARTER_NON_SPJ', assets, revenues);
      });
    }
  }, [open]);

  const handleSelectTemplate = (tmplId: string) => {
    applyTemplate(tmplId, receivableAccounts, revenueAccounts);
  };

  const handleCustomerChange = (id: string) => {
    setSelectedCustomerId(id);
    const c = customers.find((item) => item.id === id);
    if (c) {
      setCustomerName(c.institutionName || c.picName);
    } else {
      setCustomerName('');
    }
  };

  const addLine = () => {
    const activeTmpl = AR_TEMPLATES.find((t) => t.id === selectedTemplateId);
    const revMatch =
      revenueAccounts.find((a) => a.code === activeTmpl?.recommendedRevenueCode) ||
      revenueAccounts[0];

    setLines((prev) => [
      ...prev,
      {
        description: '',
        accountId: revMatch ? revMatch.id : '',
        qty: 1,
        unitPrice: 0,
        vehicleId: '',
      },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: keyof CreateArInvoiceLineFormData, val: any) => {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, [field]: val } : line)),
    );
  };

  const totalAmount = lines.reduce((acc, curr) => acc + (curr.qty * curr.unitPrice || 0), 0);
  const currentTemplate = AR_TEMPLATES.find((t) => t.id === selectedTemplateId) || AR_TEMPLATES[0];
  const activeArAccount = receivableAccounts.find((a) => a.id === arAccountId);

  const groupedRevenueAccounts = groupRevenueAccounts(revenueAccounts);
  const groupedReceivableAccounts = groupReceivableAccounts(receivableAccounts);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast.error('Nama pelanggan atau pembayar wajib diisi.');
      return;
    }
    if (!arAccountId) {
      toast.error('Pilih akun piutang usaha.');
      return;
    }
    if (lines.some((l) => !l.description.trim() || !l.accountId || l.unitPrice <= 0)) {
      toast.error('Pastikan semua rincian baris memiliki deskripsi, akun pendapatan, dan nominal harga lebih dari 0.');
      return;
    }

    try {
      setSaving(true);
      const payload: CreateArInvoiceFormData = {
        customerId: selectedCustomerId || undefined,
        customerName,
        invoiceDate,
        dueDate,
        arAccountId,
        notes: notes || undefined,
        lines: lines.map((l) => ({
          description: l.description,
          accountId: l.accountId,
          qty: l.qty,
          unitPrice: l.unitPrice,
          vehicleId: l.vehicleId || undefined,
        })),
      };

      await ArService.createInvoice(payload);
      toast.success('Invoice penagihan AR berhasil diterbitkan sebagai DRAFT.');
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menerbitkan invoice AR');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl sm:max-w-5xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-7">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-xl font-bold text-slate-900">
            <Sparkles className="h-6 w-6 text-indigo-600" />
            Penerbitan Invoice Piutang Usaha Umum (AR)
          </DialogTitle>
          <p className="text-sm text-slate-500">
            Menerbitkan tagihan piutang resmi ke pelanggan atau mitra pihak ketiga (Sewa bus non-SPJ, piutang tiket agen, kargo, sewa lahan pool).
            Pilih template di bawah untuk otomatisasi rekomendasi akun akuntansi.
          </p>
        </DialogHeader>

        {/* SECTION 1: TEMPLATE CARDS PRESET */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              Pilih Rekomendasi Template Piutang & Pendapatan:
            </Label>
            <span className="text-xs text-slate-500">
              Otomatis mengisi rekomendasi akun COA
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {AR_TEMPLATES.map((tmpl) => {
              const IconComp = tmpl.icon;
              const isSelected = selectedTemplateId === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tmpl.id)}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all relative ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/90 ring-2 ring-indigo-500/25 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className={`p-2 rounded-lg border ${tmpl.badgeColor}`}>
                      <IconComp className="h-4 w-4" />
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                    )}
                  </div>
                  <div className="mt-2.5">
                    <div className="text-xs font-bold text-slate-800 leading-tight">
                      {tmpl.title}
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {tmpl.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Banner Informasi Rekomendasi */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between gap-3 text-xs text-indigo-950">
            <div className="flex items-center gap-2.5">
              <Info className="h-4 w-4 text-indigo-600 shrink-0" />
              <span>
                Template <strong>{currentTemplate.title}</strong> aktif:{' '}
                Rekomendasi Piutang (<strong>{currentTemplate.recommendedArCode}</strong>) & Pendapatan (<strong>{currentTemplate.recommendedRevenueCode}</strong>).
                Semua pilihan akun tetap dapat Anda sesuaikan bebas di formulir bawah.
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label className="text-xs font-semibold text-slate-700">Pelanggan / Klien Terdaftar</Label>
              <select
                className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                value={selectedCustomerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
              >
                <option value="">-- Pilih dari Database Pelanggan (Opsional) --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.institutionName || c.picName} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">
                Nama Tagihan Pelanggan <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder={currentTemplate.customerNamePlaceholder}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-1 h-10 bg-white text-xs"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <Label className="text-xs font-semibold text-slate-700">
                  Akun Piutang (Debit) <span className="text-red-500">*</span>
                </Label>
                {activeArAccount && (
                  <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-bold border border-indigo-200">
                    {activeArAccount.code === currentTemplate.recommendedArCode ? '★ Sesuai Template' : 'Kustom'}
                  </span>
                )}
              </div>
              <select
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                value={arAccountId}
                onChange={(e) => setArAccountId(e.target.value)}
                required
              >
                {groupedReceivableAccounts.map((grp) => (
                  <optgroup key={grp.groupName} label={grp.groupName}>
                    {grp.accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} — {a.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Tanggal Faktur Tagihan</Label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="mt-1 h-10 bg-white text-xs"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Jatuh Tempo Pembayaran</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 h-10 bg-white text-xs"
                required
              />
            </div>

            <div className="md:col-span-3">
              <Label className="text-xs font-semibold text-slate-700">Catatan Tagihan</Label>
              <Textarea
                placeholder={currentTemplate.notesPlaceholder}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 bg-white h-14 text-xs"
              />
            </div>
          </div>

          {/* Rincian Baris */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  Rincian Pendapatan Tagihan ({lines.length} Baris)
                </h3>
                <p className="text-xs text-slate-500">
                  Pilih akun pendapatan COA (Kredit) untuk masing-masing baris item.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLine}
                className="h-8 gap-1.5 text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50 font-semibold"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Rincian Baris
              </Button>
            </div>

            <div className="space-y-3">
              {lines.map((line, idx) => {
                const lineAccount = revenueAccounts.find((a) => a.id === line.accountId);
                return (
                  <div
                    key={idx}
                    className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs hover:border-slate-300 transition-colors"
                  >
                    {/* Baris Atas: Deskripsi & Armada */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                      <div className="md:col-span-8">
                        <Label className="text-xs font-semibold text-slate-700">
                          Deskripsi Barang / Jasa <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder={currentTemplate.lineDescriptionPlaceholder}
                          value={line.description}
                          onChange={(e) => updateLine(idx, 'description', e.target.value)}
                          className="mt-1 h-9 text-xs bg-white"
                          required
                        />
                      </div>

                      <div className="md:col-span-4">
                        <Label className="text-xs font-semibold text-slate-700">Armada Bus Terkait</Label>
                        <select
                          className="mt-1 w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={line.vehicleId || ''}
                          onChange={(e) => updateLine(idx, 'vehicleId', e.target.value)}
                        >
                          <option value="">- Tanpa Bus -</option>
                          {vehicles.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.plateNumber} ({v.code}) — {v.nickname || v.vehicleType}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Baris Bawah: Akun Pendapatan, Qty, Harga Satuan, Hapus */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end pt-2 border-t border-slate-100">
                      <div className="md:col-span-6">
                        <div className="flex justify-between items-center mb-1">
                          <Label className="text-xs font-semibold text-slate-700">
                            Akun Pendapatan (Kredit) <span className="text-red-500">*</span>
                          </Label>
                          {lineAccount?.code === currentTemplate.recommendedRevenueCode && (
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold border border-emerald-200">
                              ★ Rekomendasi Template
                            </span>
                          )}
                        </div>
                        <select
                          className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                          value={line.accountId}
                          onChange={(e) => updateLine(idx, 'accountId', e.target.value)}
                          required
                        >
                          {groupedRevenueAccounts.map((grp) => (
                            <optgroup key={grp.groupName} label={grp.groupName}>
                              {grp.accounts.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.code} — {a.name}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <Label className="text-xs font-semibold text-slate-700 mb-1 block">Qty</Label>
                        <Input
                          type="number"
                          min={0.01}
                          step={0.01}
                          value={line.qty}
                          onChange={(e) => updateLine(idx, 'qty', parseFloat(e.target.value) || 0)}
                          className="h-9 text-xs text-center font-bold"
                          required
                        />
                      </div>

                      <div className="md:col-span-3">
                        <Label className="text-xs font-semibold text-slate-700 mb-1 block">
                          Harga Satuan (Rp) <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">Rp</span>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={line.unitPrice > 0 ? line.unitPrice.toLocaleString('id-ID') : ''}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, '');
                              updateLine(idx, 'unitPrice', raw ? parseInt(raw, 10) : 0);
                            }}
                            className="pl-8 h-9 text-xs text-right font-bold text-slate-900"
                            required
                          />
                        </div>
                      </div>

                      <div className="md:col-span-1 flex justify-end">
                        {lines.length > 1 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLine(idx)}
                            className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                            title="Hapus baris ini"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <div className="w-9 h-9" />
                        )}
                      </div>
                    </div>

                    {/* Subtotal baris */}
                    <div className="flex justify-end items-center gap-2 pt-1 text-xs text-slate-500">
                      <span>Subtotal Baris {idx + 1}:</span>
                      <span className="font-extrabold text-slate-900">
                        Rp {(line.qty * line.unitPrice).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Total */}
          <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Total Tagihan Piutang
              </div>
              <div className="text-xs text-slate-500">Termasuk {lines.length} baris rincian</div>
            </div>
            <div className="text-2xl font-black text-slate-900">
              Rp {totalAmount.toLocaleString('id-ID')}
            </div>
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
              disabled={saving || totalAmount <= 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              {saving ? 'Menerbitkan...' : 'Terbitkan Invoice AR (Draft)'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
