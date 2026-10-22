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
  Wrench,
  Plus,
  Trash2,
  Users,
  Zap,
  FileText,
  Shield,
  Package,
  Ticket,
  Sliders,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react';
import { ApService } from '@/services/ap.service';
import { AccountService } from '@/services/account.service';
import { VehicleService } from '@/services/vehicle.service';
import type {
  Account,
  Vehicle,
  ApVendorType,
  CreateApInvoiceFormData,
  CreateApInvoiceLineFormData,
} from '@/types';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ApTemplatePreset {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  badgeColor: string;
  vendorType: ApVendorType;
  defaultVendorName?: string;
  vendorNamePlaceholder: string;
  recommendedLiabilityCode: string;
  recommendedExpenseCode: string;
  lineDescriptionPlaceholder: string;
  notesPlaceholder: string;
  requiresVehicle: boolean;
}

const AP_TEMPLATES: ApTemplatePreset[] = [
  {
    id: 'GAJI',
    title: 'Gaji & Personalia',
    subtitle: 'Gaji staf, mekanik, uang lembur pool',
    icon: Users,
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    vendorType: 'OTHER',
    defaultVendorName: 'Daftar Gaji Karyawan SS Travelink',
    vendorNamePlaceholder: 'Contoh: Payroll Karyawan Periode Oktober 2026',
    recommendedLiabilityCode: '21201', // Utang Gaji & Upah Karyawan
    recommendedExpenseCode: '57105',   // Beban Gaji Karyawan Kantor & Manajemen
    lineDescriptionPlaceholder: 'Gaji pokok staf kantor & operasional pool bulan ini',
    notesPlaceholder: 'Rincian transfer payroll rekening karyawan kantor dan garasi...',
    requiresVehicle: false,
  },
  {
    id: 'UTILITAS',
    title: 'Listrik, Air & WiFi',
    subtitle: 'Tagihan bulanan PLN, PDAM, Internet',
    icon: Zap,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    vendorType: 'OTHER',
    defaultVendorName: 'PLN / Telkom / Provider Internet',
    vendorNamePlaceholder: 'Contoh: PT PLN (Persero) / Biznet Networks',
    recommendedLiabilityCode: '21202', // Utang Beban Akrual Operasional
    recommendedExpenseCode: '57104',   // Beban Listrik, Air, & Internet Pool/Kantor
    lineDescriptionPlaceholder: 'Tagihan listrik pool & internet kantor cabang',
    notesPlaceholder: 'ID Pelanggan PLN / No. Tagihan Internet kantor...',
    requiresVehicle: false,
  },
  {
    id: 'BENGKEL',
    title: 'Bengkel & Sparepart',
    subtitle: 'Servis mesin, oli drum, aki, ban bus',
    icon: Wrench,
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    vendorType: 'WORKSHOP',
    defaultVendorName: '',
    vendorNamePlaceholder: 'Contoh: Cirebon Diesel Motor / Toko Ban Sahabat',
    recommendedLiabilityCode: '21102', // Utang Vendor Bengkel Rekanan
    recommendedExpenseCode: '55101',   // Beban Servis & Perawatan Rutin Armada
    lineDescriptionPlaceholder: 'Overhaul pendingin radiator & servis mesin tol Cipali',
    notesPlaceholder: 'No. Surat Perintah Kerja (SPK) bengkel atau rincian nota...',
    requiresVehicle: true,
  },
  {
    id: 'LEGALITAS',
    title: 'Pajak STNK & KIR',
    subtitle: 'Perpanjangan STNK, KIR, izin trayek',
    icon: FileText,
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    vendorType: 'OTHER',
    defaultVendorName: 'Samsat / Dishub / Biro Jasa',
    vendorNamePlaceholder: 'Contoh: Samsat Ciputat / Dishub Tangerang',
    recommendedLiabilityCode: '21101', // Utang Vendor Umum
    recommendedExpenseCode: '57101',   // Beban Legalitas, Pajak STNK, & KIR Armada
    lineDescriptionPlaceholder: 'Biaya perpanjangan pajak STNK 1 tahun & uji berkala KIR',
    notesPlaceholder: 'Nomor berkas STNK / masa berlaku uji KIR armada...',
    requiresVehicle: true,
  },
  {
    id: 'ASURANSI',
    title: 'Asuransi Jasa Raharja',
    subtitle: 'Iuran wajib perlindungan penumpang & bus',
    icon: Shield,
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    vendorType: 'OTHER',
    defaultVendorName: 'PT Jasa Raharja (Persero)',
    vendorNamePlaceholder: 'Contoh: PT Asuransi Jasa Raharja',
    recommendedLiabilityCode: '21101', // Utang Usaha
    recommendedExpenseCode: '57102',   // Beban Asuransi Kendaraan & Jasa Raharja
    lineDescriptionPlaceholder: 'Iuran Wajib Dana Pertanggungan Kecelakaan Penumpang (IWKBU)',
    notesPlaceholder: 'Nomor polis asuransi / kwitansi resmi Jasa Raharja...',
    requiresVehicle: true,
  },
  {
    id: 'OPERASIONAL_POOL',
    title: 'Perlengkapan Pool & ATK',
    subtitle: 'Sabun cuci bus, ATK kantor, cetak tiket',
    icon: Package,
    badgeColor: 'bg-slate-50 text-slate-700 border-slate-200',
    vendorType: 'OTHER',
    defaultVendorName: '',
    vendorNamePlaceholder: 'Contoh: Toko ATK Makmur / Supplier Kimia Cuci',
    recommendedLiabilityCode: '21101', // Utang Usaha
    recommendedExpenseCode: '57103',   // Beban Perlengkapan & Kebersihan Pool
    lineDescriptionPlaceholder: 'Shampoo salju cuci bus, kain majun, dan kertas kasir',
    notesPlaceholder: 'Pengadaan perlengkapan operasional pool & garasi...',
    requiresVehicle: false,
  },
  {
    id: 'KOMISI_AGEN',
    title: 'Komisi Agen Tiket',
    subtitle: 'Rekap tagihan hak komisi agen bulanan',
    icon: Ticket,
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    vendorType: 'AGENT',
    defaultVendorName: '',
    vendorNamePlaceholder: 'Contoh: Agen Tiket Pondok Pinang / Agen Yogya',
    recommendedLiabilityCode: '22101', // Utang Komisi Agen Penjualan Tiket
    recommendedExpenseCode: '54101',   // Beban Komisi Agen Penjualan Tiket
    lineDescriptionPlaceholder: 'Hak komisi penjualan tiket bus AKAP periode bulanan',
    notesPlaceholder: 'Rekap total lembar tiket agen yang terjual...',
    requiresVehicle: false,
  },
  {
    id: 'CUSTOM',
    title: 'Tagihan Kustom / Bebas',
    subtitle: 'Pilihan manual seluruh akun COA',
    icon: Sliders,
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    vendorType: 'OTHER',
    defaultVendorName: '',
    vendorNamePlaceholder: 'Nama Vendor / Rekanan...',
    recommendedLiabilityCode: '21101',
    recommendedExpenseCode: '57104',
    lineDescriptionPlaceholder: 'Rincian deskripsi barang atau jasa...',
    notesPlaceholder: 'Catatan tambahan faktur...',
    requiresVehicle: false,
  },
];

interface GroupedAccounts {
  groupName: string;
  accounts: Account[];
}

export function CreateGeneralApBillModal({ open, onOpenChange, onSuccess }: Props) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('BENGKEL');

  const [vendorType, setVendorType] = useState<ApVendorType>('WORKSHOP');
  const [vendorName, setVendorName] = useState<string>('');
  const [vendorInvoiceNo, setVendorInvoiceNo] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  );
  const [apAccountId, setApAccountId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Dropdown data
  const [liabilityAccounts, setLiabilityAccounts] = useState<Account[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<Account[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Lines
  const [lines, setLines] = useState<CreateApInvoiceLineFormData[]>([
    {
      description: '',
      accountId: '',
      qty: 1,
      unitPrice: 0,
      vehicleId: '',
    },
  ]);

  const [saving, setSaving] = useState(false);

  // Grouping Akun COA Beban secara terstruktur agar mudah dibaca pengguna
  const groupExpenseAccounts = (accounts: Account[]): GroupedAccounts[] => {
    const groups: Record<string, { groupName: string; accounts: Account[] }> = {
      '51': { groupName: '51 — Beban Langsung Armada & Operasional Tiket', accounts: [] },
      '52': { groupName: '52 — Beban Tol, Parkir, & Penyeberangan', accounts: [] },
      '53': { groupName: '53 — Beban Hak Kru & Personalia Operasional', accounts: [] },
      '54': { groupName: '54 — Beban Keagenan & Komisi Tiket', accounts: [] },
      '55': { groupName: '55 — Beban Perawatan, Bengkel & Sparepart Armada', accounts: [] },
      '57': { groupName: '57 — Beban Umum, Administrasi, Fasilitas & Pool', accounts: [] },
      '59': { groupName: '59 — Beban Bunga & Administrasi Bank', accounts: [] },
      'other': { groupName: 'Beban Operasional Lainnya', accounts: [] },
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

  // Grouping Akun COA Utang secara terstruktur
  const groupLiabilityAccounts = (accounts: Account[]): GroupedAccounts[] => {
    const groups: Record<string, { groupName: string; accounts: Account[] }> = {
      '211': { groupName: '211 — Utang Usaha Vendor (Bengkel, Restoran, Sparepart, ATK)', accounts: [] },
      '212': { groupName: '212 — Utang Beban Akrual & Gaji Karyawan (Gaji, Listrik, Internet)', accounts: [] },
      '221': { groupName: '221 — Utang Komisi Agen Penjualan Tiket', accounts: [] },
      'other': { groupName: 'Kewajiban & Utang Usaha Lainnya', accounts: [] },
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
    liabAccs: Account[],
    expAccs: Account[],
  ) => {
    setSelectedTemplateId(templateId);
    const tmpl = AP_TEMPLATES.find((t) => t.id === templateId);
    if (!tmpl) return;

    setVendorType(tmpl.vendorType);
    setVendorName(tmpl.defaultVendorName || '');

    // Cari akun utang rekomendasi
    const liabMatch =
      liabAccs.find((a) => a.code === tmpl.recommendedLiabilityCode) ||
      liabAccs.find((a) => a.code === '21101') ||
      liabAccs[0];
    if (liabMatch) setApAccountId(liabMatch.id);

    // Cari akun beban rekomendasi
    const expMatch =
      expAccs.find((a) => a.code === tmpl.recommendedExpenseCode) ||
      expAccs[0];

    // Reset lines dengan akun beban rekomendasi
    setLines([
      {
        description: '',
        accountId: expMatch ? expMatch.id : '',
        qty: 1,
        unitPrice: 0,
        vehicleId: '',
      },
    ]);
  };

  useEffect(() => {
    if (open) {
      setVendorName('');
      setVendorInvoiceNo('');
      setNotes('');
      setInvoiceDate(new Date().toISOString().split('T')[0]);
      setDueDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      Promise.all([
        AccountService.findAll({ isPostable: true, tree: false }),
        VehicleService.findAll({ limit: 100 }),
      ]).then(([resAcc, resVeh]) => {
        const accs = (resAcc.data || []) as Account[];
        const postable = accs.filter((a) => a.isPostable && a.isActive);
        const liabilities = postable.filter((a) => a.type === 'LIABILITY');
        const expenses = postable.filter((a) => a.type === 'EXPENSE');

        setLiabilityAccounts(liabilities);
        setExpenseAccounts(expenses);

        const vList = resVeh.data?.data || [];
        setVehicles(vList);

        applyTemplate('BENGKEL', liabilities, expenses);
      });
    }
  }, [open]);

  const handleSelectTemplate = (tmplId: string) => {
    applyTemplate(tmplId, liabilityAccounts, expenseAccounts);
  };

  const addLine = () => {
    const activeTmpl = AP_TEMPLATES.find((t) => t.id === selectedTemplateId);
    const expMatch =
      expenseAccounts.find((a) => a.code === activeTmpl?.recommendedExpenseCode) ||
      expenseAccounts[0];

    setLines((prev) => [
      ...prev,
      {
        description: '',
        accountId: expMatch ? expMatch.id : '',
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

  const updateLine = (index: number, field: keyof CreateApInvoiceLineFormData, val: any) => {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, [field]: val } : line)),
    );
  };

  const totalAmount = lines.reduce((acc, curr) => acc + (curr.qty * curr.unitPrice || 0), 0);
  const currentTemplate = AP_TEMPLATES.find((t) => t.id === selectedTemplateId) || AP_TEMPLATES[0];
  const activeLiabilityAccount = liabilityAccounts.find((a) => a.id === apAccountId);

  const groupedExpenseAccounts = groupExpenseAccounts(expenseAccounts);
  const groupedLiabilityAccounts = groupLiabilityAccounts(liabilityAccounts);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim()) {
      toast.error('Nama vendor atau subjek tagihan wajib diisi.');
      return;
    }
    if (!apAccountId) {
      toast.error('Pilih akun utang usaha.');
      return;
    }
    if (lines.some((l) => !l.description.trim() || !l.accountId || l.unitPrice <= 0)) {
      toast.error('Pastikan semua baris rincian memiliki deskripsi, akun beban, dan nominal harga lebih dari 0.');
      return;
    }

    try {
      setSaving(true);
      const payload: CreateApInvoiceFormData = {
        vendorType,
        vendorName,
        vendorInvoiceNo: vendorInvoiceNo || undefined,
        invoiceDate,
        dueDate,
        apAccountId,
        notes: notes || undefined,
        sourceType: vendorType === 'WORKSHOP' ? 'WORKSHOP_REPAIR' : 'MANUAL',
        lines: lines.map((l) => ({
          description: l.description,
          accountId: l.accountId,
          qty: l.qty,
          unitPrice: l.unitPrice,
          vehicleId: l.vehicleId || undefined,
        })),
      };

      await ApService.createInvoice(payload);
      toast.success('Tagihan vendor AP berhasil disimpan sebagai DRAFT.');
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan tagihan vendor');
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
            Pencatatan Tagihan Vendor & Beban Operasional (AP)
          </DialogTitle>
          <p className="text-sm text-slate-500">
            Pintu masuk resmi seluruh tagihan Non-SPJ (gaji, listrik, internet, servis bengkel, sparepart, pajak STNK/KIR, perlengkapan pool).
            Pilih template rekomendasi di bawah untuk kemudahan pengisian akun akuntansi.
          </p>
        </DialogHeader>

        {/* SECTION 1: TEMPLATE CARDS PRESET (LEGA & MUDAH DIPILIH) */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              Pilih Rekomendasi Template Tagihan:
            </Label>
            <span className="text-xs text-slate-500">
              Klik kartu untuk memasang akun COA yang direkomendasikan
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {AP_TEMPLATES.map((tmpl) => {
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

          {/* Banner Informasi Rekomendasi Aktif */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between gap-3 text-xs text-indigo-950">
            <div className="flex items-center gap-2.5">
              <Info className="h-4 w-4 text-indigo-600 shrink-0" />
              <span>
                Template <strong>{currentTemplate.title}</strong> aktif:{' '}
                Rekomendasi Akun Utang (<strong>{currentTemplate.recommendedLiabilityCode}</strong>) & Beban (<strong>{currentTemplate.recommendedExpenseCode}</strong>).
                Semua pilihan akun tetap dapat Anda sesuaikan bebas di formulir bawah.
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          {/* Header Tagihan */}
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-semibold text-slate-700">Jenis Vendor</Label>
              <select
                className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                value={vendorType}
                onChange={(e) => setVendorType(e.target.value as ApVendorType)}
              >
                <option value="WORKSHOP">Bengkel Rekanan / Suku Cadang</option>
                <option value="AGENT">Agen Penjualan Tiket</option>
                <option value="RESTAURANT">Restoran Mitra</option>
                <option value="OTHER">Lainnya / Umum (PLN, WiFi, Gaji, Samsat, ATK)</option>
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">
                Nama Vendor / Instansi / Subjek <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder={currentTemplate.vendorNamePlaceholder}
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="mt-1 h-10 bg-white text-xs"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">No. Faktur / Nota / Bukti</Label>
              <Input
                placeholder="Contoh: NOTA-1029 / BUKTI-PLN-01"
                value={vendorInvoiceNo}
                onChange={(e) => setVendorInvoiceNo(e.target.value)}
                className="mt-1 h-10 bg-white text-xs"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <Label className="text-xs font-semibold text-slate-700">
                  Akun Utang (Kredit) <span className="text-red-500">*</span>
                </Label>
                {activeLiabilityAccount && (
                  <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-bold border border-indigo-200">
                    {activeLiabilityAccount.code === currentTemplate.recommendedLiabilityCode ? '★ Sesuai Template' : 'Kustom'}
                  </span>
                )}
              </div>
              <select
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                value={apAccountId}
                onChange={(e) => setApAccountId(e.target.value)}
                required
              >
                {groupedLiabilityAccounts.map((grp) => (
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
              <Label className="text-xs font-semibold text-slate-700">Tanggal Tagihan</Label>
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
              <Label className="text-xs font-semibold text-slate-700">Catatan / Keterangan Tagihan</Label>
              <Textarea
                placeholder={currentTemplate.notesPlaceholder}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 bg-white h-14 text-xs"
              />
            </div>
          </div>

          {/* Rincian Baris Tagihan (Lega dengan Kartu Terstruktur) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  Rincian Biaya & Beban Tagihan ({lines.length} Baris)
                </h3>
                <p className="text-xs text-slate-500">
                  Akun beban dikelompokkan berdasarkan kategori COA resmi agar mudah dipilih.
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
                const lineAccount = expenseAccounts.find((a) => a.id === line.accountId);
                return (
                  <div
                    key={idx}
                    className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs hover:border-slate-300 transition-colors"
                  >
                    {/* Baris Atas: Deskripsi Barang/Jasa & Armada */}
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
                        <Label className="text-xs font-semibold text-slate-700">
                          Armada Bus Terkait {currentTemplate.requiresVehicle && <span className="text-amber-600 font-semibold">(Disarankan)</span>}
                        </Label>
                        <select
                          className="mt-1 w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={line.vehicleId || ''}
                          onChange={(e) => updateLine(idx, 'vehicleId', e.target.value)}
                        >
                          <option value="">- Tanpa Bus (Beban Umum Kantor/Pool) -</option>
                          {vehicles.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.plateNumber} ({v.code}) — {v.nickname || v.vehicleType}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Baris Bawah: Akun Beban (Lega), Qty, Harga Satuan, Hapus */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end pt-2 border-t border-slate-100">
                      <div className="md:col-span-6">
                        <div className="flex justify-between items-center mb-1">
                          <Label className="text-xs font-semibold text-slate-700">
                            Akun Beban COA (Debit) <span className="text-red-500">*</span>
                          </Label>
                          {lineAccount?.code === currentTemplate.recommendedExpenseCode && (
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
                          {groupedExpenseAccounts.map((grp) => (
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
                Total Tagihan Vendor
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
              {saving ? 'Menyimpan...' : 'Simpan Tagihan AP (Draft)'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
