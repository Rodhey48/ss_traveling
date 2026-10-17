import React, { useState, useEffect, useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FilePlus,
  Loader2,
  Bus,
  Building2,
  Sparkles,
  Layers,
} from 'lucide-react';
import { JournalService } from '@/services/journal.service';
import { AccountService } from '@/services/account.service';
import { VehicleService } from '@/services/vehicle.service';
import { OrganizationService } from '@/services/organization.service';
import type {
  Account,
  Vehicle,
  CostCenter,
  BusinessUnit,
  JournalLineInputFormData,
  CreateManualJournalFormData,
} from '@/types';
import { toast } from 'sonner';

interface CreateJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type JournalTemplateType =
  | 'CUSTOM'
  | 'EXPENSE_CASH'
  | 'EXPENSE_BANK'
  | 'CASH_TRANSFER_POOL_BANK'
  | 'CASH_TRANSFER_BANK_POOL'
  | 'ETOLL_TOPUP'
  | 'WORKSHOP_MAINTENANCE'
  | 'CREW_ALLOWANCE'
  | 'BANK_ADMIN_FEE'
  | 'CAPITAL_INJECTION'
  | 'ADJUSTMENT';

export default function CreateJournalModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateJournalModalProps) {
  const [loadingMaster, setLoadingMaster] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Master Data
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);

  // Form State
  const today = new Date().toISOString().slice(0, 10);
  const [journalDate, setJournalDate] = useState(today);
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState<JournalTemplateType>('CUSTOM');
  const [lines, setLines] = useState<JournalLineInputFormData[]>([
    {
      accountId: '',
      debit: '',
      credit: '0',
      description: '',
      vehicleId: '',
      costCenterId: '',
      businessUnitId: '',
    },
    {
      accountId: '',
      debit: '0',
      credit: '',
      description: '',
      vehicleId: '',
      costCenterId: '',
      businessUnitId: '',
    },
  ]);

  // Load Master Data saat modal dibuka
  useEffect(() => {
    if (!isOpen) return;

    const loadMasters = async () => {
      setLoadingMaster(true);
      try {
        const [accRes, vehRes, ccRes, buRes] = await Promise.all([
          AccountService.findAll({ isPostable: true }),
          VehicleService.findAll({ limit: 100 }),
          OrganizationService.getCostCenters(),
          OrganizationService.getBusinessUnits(),
        ]);

        if (accRes.data) {
          const accs = Array.isArray(accRes.data)
            ? (accRes.data as Account[]).filter((a) => a.isPostable && a.isActive)
            : [];
          accs.sort((a, b) => a.code.localeCompare(b.code));
          setAccounts(accs);
        }

        if (vehRes.data) {
          setVehicles(vehRes.data.data || []);
        }

        if (ccRes.data) {
          setCostCenters(ccRes.data);
        }

        if (buRes.data) {
          setBusinessUnits(buRes.data);
        }
      } catch (err: any) {
        toast.error('Gagal memuat data master', {
          description: err.message || 'Periksa koneksi jaringan.',
        });
      } finally {
        setLoadingMaster(false);
      }
    };

    loadMasters();
  }, [isOpen]);

  // Kelompokkan Akun berdasarkan Kategori Utama
  const groupedAccounts = useMemo(() => {
    const groups: Record<string, Account[]> = {
      '1 - ASET & KAS / BANK': [],
      '2 - LIABILITAS & UTANG': [],
      '3 - EKUITAS & MODAL': [],
      '4 - PENDAPATAN OPERASIONAL': [],
      '5 - BEBAN OPERASIONAL & PERJALANAN': [],
      '8 - PENDAPATAN & BEBAN NON-OPERASIONAL': [],
    };

    for (const acc of accounts) {
      const codeFirst = acc.code.charAt(0);
      if (codeFirst === '1') {
        groups['1 - ASET & KAS / BANK'].push(acc);
      } else if (codeFirst === '2') {
        groups['2 - LIABILITAS & UTANG'].push(acc);
      } else if (codeFirst === '3') {
        groups['3 - EKUITAS & MODAL'].push(acc);
      } else if (codeFirst === '4') {
        groups['4 - PENDAPATAN OPERASIONAL'].push(acc);
      } else if (codeFirst === '5') {
        groups['5 - BEBAN OPERASIONAL & PERJALANAN'].push(acc);
      } else {
        groups['8 - PENDAPATAN & BEBAN NON-OPERASIONAL'].push(acc);
      }
    }

    return groups;
  }, [accounts]);

  // Template change handler: Mereset seluruh inputan secara bersih saat berpindah template
  const handleTemplateChange = (tpl: JournalTemplateType) => {
    setTemplate(tpl);

    // Cari akun default dari COA
    const findAcc = (code: string) => accounts.find((a) => a.code === code)?.id || '';

    const cashPoolAcc = findAcc('11101'); // Kas Operasional Pool Ciputat
    const bankBcaAcc = findAcc('11104'); // Bank Operasional BCA
    const etollAcc = findAcc('11105'); // Kas Kartu E-Toll
    const workshopAcc = findAcc('55101'); // Beban Servis & Perawatan Armada
    const crewMealAcc = findAcc('53101'); // Beban Uang Makan Kru
    const bankFeeAcc = findAcc('59102'); // Beban Administrasi Bank
    const capitalAcc = findAcc('31101'); // Modal Disetor Pemilik

    switch (tpl) {
      case 'CUSTOM':
        setDescription('');
        setLines([
          { accountId: '', debit: '', credit: '0', description: '', vehicleId: '', costCenterId: '' },
          { accountId: '', debit: '0', credit: '', description: '', vehicleId: '', costCenterId: '' },
        ]);
        toast.info('Template Kustom aktif — Seluruh inputan telah direset.');
        break;

      case 'EXPENSE_CASH':
        setDescription('Pembayaran beban operasional tunai via Kas Pool Ciputat');
        setLines([
          { accountId: '', debit: '', credit: '0', description: 'Beban Operasional', vehicleId: '', costCenterId: '' },
          { accountId: cashPoolAcc, debit: '0', credit: '', description: 'Kas Operasional Pool', vehicleId: '', costCenterId: '' },
        ]);
        toast.info('Template Beban Kas Pool aktif — Input direset.', {
          description: 'Baris 1: Akun Beban (Debit) | Baris 2: Kas Pool 11101 (Kredit).',
        });
        break;

      case 'EXPENSE_BANK':
        setDescription('Pembayaran beban operasional via transfer Bank BCA');
        setLines([
          { accountId: '', debit: '', credit: '0', description: 'Beban Operasional', vehicleId: '', costCenterId: '' },
          { accountId: bankBcaAcc, debit: '0', credit: '', description: 'Bank Operasional BCA', vehicleId: '', costCenterId: '' },
        ]);
        toast.info('Template Beban Bank aktif — Input direset.', {
          description: 'Baris 1: Akun Beban (Debit) | Baris 2: Bank BCA 11104 (Kredit).',
        });
        break;

      case 'CASH_TRANSFER_POOL_BANK':
        setDescription('Setor penerimaan kas pool ke rekening Bank BCA operasional');
        setLines([
          { accountId: bankBcaAcc, debit: '', credit: '0', description: 'Bank BCA (Penerimaan Setoran Kas)', vehicleId: '', costCenterId: '' },
          { accountId: cashPoolAcc, debit: '0', credit: '', description: 'Kas Pool Ciputat (Keluar Setor ke Bank)', vehicleId: '', costCenterId: '' },
        ]);
        toast.info('Template Setor Kas ke Bank aktif — Input direset.', {
          description: 'Debit: Bank BCA (11104) | Kredit: Kas Pool (11101).',
        });
        break;

      case 'CASH_TRANSFER_BANK_POOL':
        setDescription('Tarik tunai Bank BCA untuk penambahan kas operasional pool');
        setLines([
          { accountId: cashPoolAcc, debit: '', credit: '0', description: 'Kas Pool Ciputat (Terima Tunai)', vehicleId: '', costCenterId: '' },
          { accountId: bankBcaAcc, debit: '0', credit: '', description: 'Bank BCA (Penarikan Rekening)', vehicleId: '', costCenterId: '' },
        ]);
        toast.info('Template Tarik Tunai Bank aktif — Input direset.', {
          description: 'Debit: Kas Pool (11101) | Kredit: Bank BCA (11104).',
        });
        break;

      case 'ETOLL_TOPUP':
        setDescription('Top-up saldo kas kartu E-Toll Trans Jawa perjalanan bus');
        setLines([
          { accountId: etollAcc, debit: '', credit: '0', description: 'Kas Kartu E-Toll Trans Jawa', vehicleId: '', costCenterId: '' },
          { accountId: cashPoolAcc, debit: '0', credit: '', description: 'Kas Operasional Pool', vehicleId: '', costCenterId: '' },
        ]);
        toast.info('Template Top-Up E-Toll aktif — Input direset.', {
          description: 'Debit: Kas E-Toll (11105) | Kredit: Kas Pool (11101).',
        });
        break;

      case 'WORKSHOP_MAINTENANCE':
        setDescription('Biaya perawatan rutin dan perbaikan armada garasi');
        setLines([
          { accountId: workshopAcc, debit: '', credit: '0', description: 'Beban Servis & Perawatan Armada', vehicleId: '', costCenterId: '' },
          { accountId: cashPoolAcc, debit: '0', credit: '', description: 'Kas Operasional Pool', vehicleId: '', costCenterId: '' },
        ]);
        toast.info('Template Perawatan Armada aktif — Input direset.', {
          description: 'Debit: Beban Servis (55101) | Kredit: Kas Pool (11101).',
        });
        break;

      case 'CREW_ALLOWANCE':
        setDescription('Pembayaran tunai uang makan kru operasional bus');
        setLines([
          { accountId: crewMealAcc, debit: '', credit: '0', description: 'Beban Uang Makan Kru Bus', vehicleId: '', costCenterId: '' },
          { accountId: cashPoolAcc, debit: '0', credit: '', description: 'Kas Operasional Pool', vehicleId: '', costCenterId: '' },
        ]);
        toast.info('Template Hak Kru aktif — Input direset.', {
          description: 'Debit: Beban Uang Makan Kru (53101) | Kredit: Kas Pool (11101).',
        });
        break;

      case 'BANK_ADMIN_FEE':
        setDescription('Beban administrasi bulanan dan biaya buku Bank BCA');
        setLines([
          { accountId: bankFeeAcc, debit: '', credit: '0', description: 'Beban Administrasi Bank', vehicleId: '', costCenterId: '' },
          { accountId: bankBcaAcc, debit: '0', credit: '', description: 'Bank Operasional BCA (Autodebet)', vehicleId: '', costCenterId: '' },
        ]);
        toast.info('Template Biaya Admin Bank aktif — Input direset.', {
          description: 'Debit: Beban Admin Bank (59102) | Kredit: Bank BCA (11104).',
        });
        break;

      case 'CAPITAL_INJECTION':
        setDescription('Setoran modal pemilik / talangan dana investor via bank');
        setLines([
          { accountId: bankBcaAcc, debit: '', credit: '0', description: 'Bank BCA (Dana Setoran Masuk)', vehicleId: '', costCenterId: '' },
          { accountId: capitalAcc, debit: '0', credit: '', description: 'Modal Disetor Pemilik / Investor', vehicleId: '', costCenterId: '' },
        ]);
        toast.info('Template Setoran Modal aktif — Input direset.', {
          description: 'Debit: Bank BCA (11104) | Kredit: Modal Disetor (31101).',
        });
        break;

      case 'ADJUSTMENT':
        setDescription('Jurnal memorial penyesuaian saldo pembukuan');
        setLines([
          { accountId: '', debit: '', credit: '0', description: 'Penyesuaian Debit', vehicleId: '', costCenterId: '' },
          { accountId: '', debit: '0', credit: '', description: 'Penyesuaian Kredit', vehicleId: '', costCenterId: '' },
        ]);
        toast.info('Template Jurnal Penyesuaian aktif — Input direset.');
        break;
    }
  };

  // Reset form
  const handleReset = () => {
    setJournalDate(today);
    setDescription('');
    setTemplate('CUSTOM');
    setLines([
      { accountId: '', debit: '', credit: '0', description: '', vehicleId: '', costCenterId: '' },
      { accountId: '', debit: '0', credit: '', description: '', vehicleId: '', costCenterId: '' },
    ]);
  };

  const handleAddLine = () => {
    setLines([
      ...lines,
      {
        accountId: '',
        debit: '0',
        credit: '0',
        description: '',
        vehicleId: '',
        costCenterId: '',
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 2) {
      toast.warning('Jurnal minimal harus memiliki 2 baris (Debit & Kredit).');
      return;
    }
    const updated = [...lines];
    updated.splice(index, 1);
    setLines(updated);
  };

  const handleLineChange = (
    index: number,
    field: keyof JournalLineInputFormData,
    value: string,
  ) => {
    const updated = [...lines];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setLines(updated);
  };

  // Real-time Balance Calculation
  const { totalDebit, totalCredit, difference, isBalanced } = useMemo(() => {
    let dSum = 0;
    let cSum = 0;

    for (const l of lines) {
      const d = parseFloat(String(l.debit).replace(/[^0-9.-]+/g, '')) || 0;
      const c = parseFloat(String(l.credit).replace(/[^0-9.-]+/g, '')) || 0;
      dSum += d;
      cSum += c;
    }

    const diff = Math.abs(dSum - cSum);
    const balanced = dSum > 0 && diff < 0.01;

    return {
      totalDebit: dSum,
      totalCredit: cSum,
      difference: diff,
      isBalanced: balanced,
    };
  }, [lines]);

  // Tombol Cerdas: Setimbangkan Otomatis Baris Ini
  const handleAutoBalance = (targetIndex: number) => {
    let dSum = 0;
    let cSum = 0;

    for (let i = 0; i < lines.length; i++) {
      if (i === targetIndex) continue;
      dSum += parseFloat(String(lines[i].debit)) || 0;
      cSum += parseFloat(String(lines[i].credit)) || 0;
    }

    const updated = [...lines];
    if (dSum > cSum) {
      // Debit lebih besar -> baris target harus Kredit sebesar selisih
      const diffVal = (dSum - cSum).toFixed(2);
      updated[targetIndex].credit = diffVal;
      updated[targetIndex].debit = '0';
    } else if (cSum > dSum) {
      // Kredit lebih besar -> baris target harus Debit sebesar selisih
      const diffVal = (cSum - dSum).toFixed(2);
      updated[targetIndex].debit = diffVal;
      updated[targetIndex].credit = '0';
    }
    setLines(updated);
    toast.success('Nilai baris disetimbangkan otomatis!');
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 2,
    }).format(val);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      toast.error('Keterangan transaksi wajib diisi.');
      return;
    }

    if (lines.length < 2) {
      toast.error('Jurnal minimal harus memiliki 2 baris (Debit & Kredit).');
      return;
    }

    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (!l.accountId) {
        toast.error(`Baris ke-${i + 1}: Silakan pilih akun COA.`);
        return;
      }
      const d = parseFloat(String(l.debit)) || 0;
      const c = parseFloat(String(l.credit)) || 0;
      if (d <= 0 && c <= 0) {
        toast.error(`Baris ke-${i + 1}: Masukkan nominal debit atau kredit lebih dari 0.`);
        return;
      }
      if (d > 0 && c > 0) {
        toast.error(`Baris ke-${i + 1}: Tidak boleh mengisi nominal debit dan kredit sekaligus.`);
        return;
      }
    }

    if (!isBalanced) {
      toast.error('Jurnal tidak seimbang!', {
        description: `Total Debit (${formatRupiah(totalDebit)}) != Total Kredit (${formatRupiah(totalCredit)}). Selisih: ${formatRupiah(difference)}`,
      });
      return;
    }

    const payload: CreateManualJournalFormData = {
      journalDate,
      description: description.trim(),
      sourceType: 'MANUAL',
      lines: lines.map((l) => ({
        accountId: l.accountId,
        debit: l.debit || '0',
        credit: l.credit || '0',
        description: l.description?.trim() || description.trim(),
        businessUnitId: l.businessUnitId || undefined,
        vehicleId: l.vehicleId || undefined,
        costCenterId: l.costCenterId || undefined,
      })),
    };

    setSubmitting(true);
    try {
      const res = await JournalService.createManualJournal(payload);
      toast.success('Jurnal berhasil diposting!', {
        description: `Nomor dokumen: ${res.data?.journalNo || 'Sukses'}`,
      });
      handleReset();
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Gagal memposting jurnal', {
        description: err.response?.data?.message || err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <FilePlus className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-800">
                  Entri Jurnal Memorial (Manual Posting)
                </DialogTitle>
                <p className="text-xs text-slate-500">
                  Pencatatan transaksi akuntansi ganda seimbang (Double-Entry Bookkeeping)
                </p>
              </div>
            </div>

            {/* Template Selector Badge */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs py-1 px-2.5 bg-slate-50 border-slate-200">
                <Layers className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                Template: {
                  template === 'CUSTOM' ? 'Bebas Multi-Akun' :
                  template === 'EXPENSE_CASH' ? 'Beban via Kas Pool' :
                  template === 'EXPENSE_BANK' ? 'Beban via Bank BCA' :
                  template === 'CASH_TRANSFER_POOL_BANK' ? 'Setor Kas ke Bank' :
                  template === 'CASH_TRANSFER_BANK_POOL' ? 'Tarik Bank ke Kas' :
                  template === 'ETOLL_TOPUP' ? 'Top-Up E-Toll' :
                  template === 'WORKSHOP_MAINTENANCE' ? 'Bengkel Armada' :
                  template === 'CREW_ALLOWANCE' ? 'Uang Makan Kru' :
                  template === 'BANK_ADMIN_FEE' ? 'Beban Admin Bank' :
                  template === 'CAPITAL_INJECTION' ? 'Setoran Modal' :
                  'Penyesuaian Saldo'
                }
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {loadingMaster ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <p className="text-sm font-medium">Memuat bagan akun COA dan dimensi perusahaan...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {/* Alert Peringatan Anti-Salah Penggunaan */}
            <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3 text-xs text-amber-950 flex items-start gap-2.5 shadow-xs">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-900 block">
                  Perhatian Khusus Akuntan & Tim Keuangan:
                </span>
                Formulir entri memorial ini hanya untuk transaksi penyesuaian non-operasional (Setoran Modal Investor, Biaya Bunga/Admin Bank BCA bulanan, Depresiasi Aset).
                <span className="font-semibold text-rose-700 block mt-0.5">
                  ⚠️ Dilarang menginput BBM Solar, Tol, Uang Jalan Kru, atau Setoran Tiket Bus di sini! Transaksi perjalanan bus wajib diproses melalui menu Meja Kasir Pool agar otomatis terhubung ke nomor SPJ armada dan tidak terjadi pencatatan ganda.
                </span>
              </div>
            </div>

            {/* Header Form: Tanggal, Pola Transaksi, & Keterangan */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 bg-slate-50/90 p-4 rounded-xl border border-slate-200">
              <div>
                <Label className="text-xs font-semibold text-slate-700">
                  Tanggal Jurnal <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={journalDate}
                  onChange={(e) => setJournalDate(e.target.value)}
                  className="mt-1 bg-white h-9 text-xs font-medium"
                  required
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">
                  Pola Transaksi Cepat (Template)
                </Label>
                <Select value={template} onValueChange={(val) => handleTemplateChange(val as JournalTemplateType)}>
                  <SelectTrigger className="mt-1 bg-white h-9 text-xs">
                    <SelectValue placeholder="Pilih Pola..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    <SelectGroup>
                      <SelectLabel className="bg-slate-100 text-[11px] font-bold text-slate-800 uppercase tracking-wider py-1 px-2 my-1">
                        Umum & Memorial
                      </SelectLabel>
                      <SelectItem value="CUSTOM" className="text-xs py-1.5">
                        <span className="font-semibold text-slate-800">Kustom / Bebas Multi-Akun</span>
                      </SelectItem>
                      <SelectItem value="ADJUSTMENT" className="text-xs py-1.5">
                        <span className="font-semibold text-slate-800">Jurnal Memorial Penyesuaian Saldo</span>
                      </SelectItem>
                    </SelectGroup>

                    <SelectGroup>
                      <SelectLabel className="bg-slate-100 text-[11px] font-bold text-slate-800 uppercase tracking-wider py-1 px-2 my-1">
                        Operasional Kas & Bank
                      </SelectLabel>
                      <SelectItem value="EXPENSE_CASH" className="text-xs py-1.5">
                        <span className="font-semibold text-slate-800">Beban via Kas Pool Ciputat (11101)</span>
                      </SelectItem>
                      <SelectItem value="EXPENSE_BANK" className="text-xs py-1.5">
                        <span className="font-semibold text-slate-800">Beban via Bank BCA (11104)</span>
                      </SelectItem>
                      <SelectItem value="CASH_TRANSFER_POOL_BANK" className="text-xs py-1.5">
                        <span className="font-semibold text-slate-800">Setor Kas Pool ke Bank BCA</span>
                      </SelectItem>
                      <SelectItem value="CASH_TRANSFER_BANK_POOL" className="text-xs py-1.5">
                        <span className="font-semibold text-slate-800">Tarik Tunai Bank BCA ke Kas Pool</span>
                      </SelectItem>
                      <SelectItem value="ETOLL_TOPUP" className="text-xs py-1.5">
                        <span className="font-semibold text-slate-800">Top-Up Kas Kartu E-Toll (11105)</span>
                      </SelectItem>
                    </SelectGroup>

                    <SelectGroup>
                      <SelectLabel className="bg-slate-100 text-[11px] font-bold text-slate-800 uppercase tracking-wider py-1 px-2 my-1">
                        Armada, Kru & Bengkel
                      </SelectLabel>
                      <SelectItem value="WORKSHOP_MAINTENANCE" className="text-xs py-1.5">
                        <span className="font-semibold text-slate-800">Biaya Servis & Bengkel Armada (55101)</span>
                      </SelectItem>
                      <SelectItem value="CREW_ALLOWANCE" className="text-xs py-1.5">
                        <span className="font-semibold text-slate-800">Pembayaran Uang Makan Kru Bus (53101)</span>
                      </SelectItem>
                    </SelectGroup>

                    <SelectGroup>
                      <SelectLabel className="bg-slate-100 text-[11px] font-bold text-slate-800 uppercase tracking-wider py-1 px-2 my-1">
                        Perbankan & Permodalan
                      </SelectLabel>
                      <SelectItem value="BANK_ADMIN_FEE" className="text-xs py-1.5">
                        <span className="font-semibold text-slate-800">Beban Administrasi Bank Bulanan (59102)</span>
                      </SelectItem>
                      <SelectItem value="CAPITAL_INJECTION" className="text-xs py-1.5">
                        <span className="font-semibold text-slate-800">Setoran Modal Pemilik / Investor (31101)</span>
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label className="text-xs font-semibold text-slate-700">
                  Keterangan Transaksi <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="Contoh: Pengeluaran biaya operasional / penyesuaian saldo garasi"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 bg-white h-9 text-xs"
                  required
                />
              </div>
            </div>

            {/* Dynamic Lines (Spacious Card-Row Layout) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-bold text-slate-800">
                    Rincian Baris Transaksi ({lines.length} Baris)
                  </Label>
                  <p className="text-xs text-slate-500">
                    Setiap baris dapat memilih akun dari kelompok COA manapun (Aset, Utang, Beban, dsb.)
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddLine}
                  className="h-8 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Tambah Baris Jurnal
                </Button>
              </div>

              <div className="space-y-3">
                {lines.map((line, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm hover:border-blue-300 transition-colors space-y-3"
                  >
                    {/* Tier 1: Akun COA, Debit, Kredit, & Aksi */}
                    <div className="flex flex-wrap lg:flex-nowrap items-start gap-3">
                      {/* Nomor Urut */}
                      <div className="h-8 w-8 rounded-lg bg-slate-100 border text-slate-700 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-6">
                        {idx + 1}
                      </div>

                      {/* Akun Selector dengan Group Header COA */}
                      <div className="flex-1 min-w-[280px]">
                        <Label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                          Pilih Akun Buku Besar <span className="text-rose-500">*</span>
                        </Label>
                        <Select
                          value={line.accountId}
                          onValueChange={(val) => handleLineChange(idx, 'accountId', val)}
                        >
                          <SelectTrigger className="h-9 text-xs bg-slate-50/70 border-slate-200">
                            <SelectValue placeholder="-- Pilih Akun COA (Daftar Terkelompok) --" />
                          </SelectTrigger>
                          <SelectContent className="max-h-80">
                            {Object.entries(groupedAccounts).map(([groupTitle, accList]) => {
                              if (accList.length === 0) return null;
                              return (
                                <SelectGroup key={groupTitle}>
                                  <SelectLabel className="bg-slate-100 text-[11px] font-bold text-slate-800 uppercase tracking-wider py-1.5 px-3 my-1">
                                    {groupTitle}
                                  </SelectLabel>
                                  {accList.map((acc) => (
                                    <SelectItem key={acc.id} value={acc.id} className="text-xs py-2 pl-4">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-blue-700 w-14 shrink-0">
                                          {acc.code}
                                        </span>
                                        <span className="text-slate-800 font-medium">{acc.name}</span>
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] ml-auto py-0 px-1.5 text-slate-500 border-slate-200"
                                        >
                                          {acc.type}
                                        </Badge>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Input Debit */}
                      <div className="w-full sm:w-44">
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-[11px] font-semibold text-slate-600">
                            Debit (Rp)
                          </Label>
                          {Number(line.debit) > 0 && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              DEBIT
                            </span>
                          )}
                        </div>
                        <Input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="0"
                          value={line.debit}
                          onChange={(e) => handleLineChange(idx, 'debit', e.target.value)}
                          className="h-9 text-xs text-right font-mono font-semibold bg-slate-50/70"
                        />
                      </div>

                      {/* Input Kredit */}
                      <div className="w-full sm:w-44">
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-[11px] font-semibold text-slate-600">
                            Kredit (Rp)
                          </Label>
                          {Number(line.credit) > 0 && (
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                              KREDIT
                            </span>
                          )}
                        </div>
                        <Input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="0"
                          value={line.credit}
                          onChange={(e) => handleLineChange(idx, 'credit', e.target.value)}
                          className="h-9 text-xs text-right font-mono font-semibold bg-slate-50/70"
                        />
                      </div>

                      {/* Aksi Baris */}
                      <div className="flex items-center gap-1 shrink-0 mt-6">
                        {difference > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAutoBalance(idx)}
                            className="h-9 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 px-2"
                            title="Setimbangkan nilai baris ini otomatis dengan selisih"
                          >
                            <Sparkles className="h-3.5 w-3.5 mr-1 text-blue-500" />
                            Setimbang
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveLine(idx)}
                          className="h-9 w-9 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Hapus baris"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Tier 2: Dimensi Unit Bisnis, Armada, Cost Center & Memo Baris */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2.5 border-t border-slate-100 text-xs">
                      <div>
                        <Label className="text-[11px] text-slate-500 mb-1 flex items-center gap-1 font-medium">
                          <Layers className="h-3 w-3 text-slate-400" />
                          Unit Bisnis (AKAP / Wisata)
                        </Label>
                        <Select
                          value={line.businessUnitId || 'none'}
                          onValueChange={(val) =>
                            handleLineChange(idx, 'businessUnitId', val === 'none' ? '' : val)
                          }
                        >
                          <SelectTrigger className="h-8 text-xs bg-white">
                            <SelectValue placeholder="Pilih Unit Bisnis..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none" className="text-xs text-slate-400">
                              -- Bersama / Kantor Pusat --
                            </SelectItem>
                            {businessUnits.map((bu) => (
                              <SelectItem key={bu.id} value={bu.id} className="text-xs">
                                <span className="font-bold text-blue-700">{bu.code}</span> — {bu.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-[11px] text-slate-500 mb-1 flex items-center gap-1 font-medium">
                          <Bus className="h-3 w-3 text-slate-400" />
                          Dimensi Armada Bus (Opsional)
                        </Label>
                        <Select
                          value={line.vehicleId || 'none'}
                          onValueChange={(val) =>
                            handleLineChange(idx, 'vehicleId', val === 'none' ? '' : val)
                          }
                        >
                          <SelectTrigger className="h-8 text-xs bg-white">
                            <SelectValue placeholder="Pilih Armada Bus..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none" className="text-xs text-slate-400">
                              -- Tanpa Armada Bus --
                            </SelectItem>
                            {vehicles.map((v) => (
                              <SelectItem key={v.id} value={v.id} className="text-xs">
                                <span className="font-bold text-slate-800">{v.code}</span> — {v.plateNumber} ({v.nickname || v.vehicleType})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-[11px] text-slate-500 mb-1 flex items-center gap-1 font-medium">
                          <Building2 className="h-3 w-3 text-slate-400" />
                          Dimensi Cost Center (Opsional)
                        </Label>
                        <Select
                          value={line.costCenterId || 'none'}
                          onValueChange={(val) =>
                            handleLineChange(idx, 'costCenterId', val === 'none' ? '' : val)
                          }
                        >
                          <SelectTrigger className="h-8 text-xs bg-white">
                            <SelectValue placeholder="Pilih Cost Center..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none" className="text-xs text-slate-400">
                              -- Tanpa Cost Center --
                            </SelectItem>
                            {costCenters.map((cc) => (
                              <SelectItem key={cc.id} value={cc.id} className="text-xs">
                                {cc.name} ({cc.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-[11px] text-slate-500 mb-1 block font-medium">
                          Keterangan Khusus Baris (Opsional)
                        </Label>
                        <Input
                          type="text"
                          placeholder="Catatan baris jika berbeda dari judul..."
                          value={line.description || ''}
                          onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Real-time Balance Checker Widget */}
            <div
              className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 text-sm transition-colors ${
                isBalanced
                  ? 'bg-emerald-50/80 border-emerald-300'
                  : 'bg-amber-50/80 border-amber-300'
              }`}
            >
              <div className="flex items-center gap-3">
                {isBalanced ? (
                  <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-full">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                ) : (
                  <div className="p-2.5 bg-amber-100 text-amber-700 rounded-full">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <div className="font-bold flex items-center gap-2">
                    <span className={isBalanced ? 'text-emerald-900 text-base' : 'text-amber-900 text-base'}>
                      {isBalanced ? 'Jurnal Seimbang (Balanced)' : 'Jurnal Belum Seimbang'}
                    </span>
                    <Badge
                      className={
                        isBalanced
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-600 text-white'
                      }
                    >
                      {isBalanced ? 'SIAP POSTING' : 'TIDAK SEIMBANG'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {isBalanced
                      ? 'Total Debit sama persis dengan Total Kredit. Transaksi memenuhi prinsip Double-Entry.'
                      : `Selisih saat ini: ${formatRupiah(difference)}. Gunakan tombol "Setimbang" atau input angka yang tepat.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-8 text-xs">
                <div className="text-right">
                  <span className="text-slate-500 block text-[11px]">Total Debit</span>
                  <span className="font-mono font-bold text-base text-slate-900">
                    {formatRupiah(totalDebit)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[11px]">Total Kredit</span>
                  <span className="font-mono font-bold text-base text-slate-900">
                    {formatRupiah(totalCredit)}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t pt-4 flex gap-2">
              <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5"
                disabled={submitting || !isBalanced}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Memposting Jurnal...
                  </>
                ) : (
                  <>
                    <FilePlus className="h-4 w-4 mr-1.5" />
                    Posting Jurnal Sekarang
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
