import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Percent, Loader2, Sparkles } from 'lucide-react';
import { AgentService } from '@/services/agent.service';
import ConfirmDialog from '@/components/shared/confirm-dialog';
import type {
  Agent,
  AgentCommissionRule,
  AgentCommissionRuleFormData,
  CommissionRuleType,
  SeatClass,
} from '@/types';
import { toast } from 'sonner';

interface CommissionRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent | null;
  seatClasses: SeatClass[];
}

export default function CommissionRulesModal({
  isOpen,
  onClose,
  agent,
  seatClasses,
}: CommissionRulesModalProps) {
  const [rules, setRules] = useState<AgentCommissionRule[]>([]);
  const [loading, setLoading] = useState(false);

  // Form for new rule
  const [seatClassId, setSeatClassId] = useState<string>('ALL');
  const [ruleType, setRuleType] = useState<CommissionRuleType>('FLAT_PER_TICKET');
  const [commissionValue, setCommissionValue] = useState<number>(20000);
  const [isActiveRule, setIsActiveRule] = useState<boolean>(true);
  const [addingRule, setAddingRule] = useState(false);

  // Confirm delete rule state
  const [ruleToDelete, setRuleToDelete] = useState<AgentCommissionRule | null>(null);
  const [isDeletingRule, setIsDeletingRule] = useState(false);

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  const fetchRules = async () => {
    if (!agent) return;
    setLoading(true);
    try {
      const res = await AgentService.findRulesByAgent(agent.id);
      if (res?.data) {
        setRules(res.data);
      }
    } catch {
      toast.error('Gagal memuat aturan komisi agen');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && agent) {
      fetchRules();
      if (agent.agentType === 'ONLINE_OTA') {
        setRuleType('PERCENTAGE');
        setCommissionValue(10);
        setSeatClassId('ALL');
      } else {
        setRuleType('FLAT_PER_TICKET');
        setCommissionValue(20000);
        setSeatClassId('ALL');
      }
      setIsActiveRule(true);
    }
  }, [isOpen, agent]);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agent) return;
    if (commissionValue < 0) {
      toast.error('Nilai komisi tidak boleh bernilai negatif');
      return;
    }

    setAddingRule(true);
    try {
      const payload: AgentCommissionRuleFormData = {
        seatClassId: seatClassId === 'ALL' ? undefined : seatClassId,
        ruleType,
        commissionValue: Number(commissionValue),
        isActive: isActiveRule,
      };

      await AgentService.createCommissionRule(agent.id, payload);
      toast.success('Aturan komisi baru berhasil ditambahkan');
      fetchRules();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menambahkan aturan komisi');
    } finally {
      setAddingRule(false);
    }
  };

  const handleConfirmDeleteRule = async () => {
    if (!ruleToDelete) return;
    setIsDeletingRule(true);
    try {
      await AgentService.deleteCommissionRule(ruleToDelete.id);
      toast.success('Aturan komisi berhasil dihapus');
      setRuleToDelete(null);
      fetchRules();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus aturan komisi');
    } finally {
      setIsDeletingRule(false);
    }
  };

  if (!agent) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Percent className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span>Aturan Komisi Penjualan:</span>
              <span className="text-primary font-bold">{agent.name}</span>
              <Badge variant="outline" className="font-mono text-xs">
                {agent.code}
              </Badge>
            </div>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Kelola skema potongan komisi tiket (Flat per Lembar Tiket atau Persentase Platform OTA) per kelas kabin.
          </DialogDescription>
        </DialogHeader>

        {/* Existing Rules Table */}
        <div className="space-y-4 py-2">
          <div className="rounded-xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-xs">
            <Table>
              <TableHeader className="bg-slate-50/80 dark:bg-white/5">
                <TableRow className="border-b border-slate-200/80 dark:border-white/10">
                  <TableHead className="w-44">Kelas Kursi Bus</TableHead>
                  <TableHead className="w-36">Skema Komisi</TableHead>
                  <TableHead className="text-right w-40">Besaran Komisi</TableHead>
                  <TableHead className="w-24 text-center">Status</TableHead>
                  <TableHead className="text-right w-16">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground text-xs">
                      <Loader2 className="h-4 w-4 animate-spin inline-block mr-1.5" /> Memuat daftar aturan komisi...
                    </TableCell>
                  </TableRow>
                ) : rules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-xs">
                      Belum ada aturan komisi khusus yang terdaftar untuk agen ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  rules.map((r) => (
                    <TableRow key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors">
                      <TableCell className="font-semibold text-xs">
                        {r.seatClass ? r.seatClass.name : 'Semua Kelas (Universal)'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px]">
                          {r.ruleType === 'FLAT_PER_TICKET' ? 'Flat per Tiket' : 'Persentase OTA'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                        {r.ruleType === 'FLAT_PER_TICKET'
                          ? formatCurrency(r.commissionValue)
                          : `${Number(r.commissionValue)}%`}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={
                            r.isActive
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]'
                              : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20 text-[10px]'
                          }
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current mr-1 inline-block" />
                          {r.isActive ? 'Aktif' : 'Non-Aktif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => setRuleToDelete(r)}
                          title="Hapus Aturan Komisi"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Add New Rule Form */}
          <form
            onSubmit={handleAddRule}
            className="p-3.5 border border-slate-200/80 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-white/5 space-y-3"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Tambah Aturan Komisi Baru</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div className="space-y-1">
                <Label htmlFor="scSelect" className="text-[11px] font-semibold text-muted-foreground">
                  Kelas Kursi
                </Label>
                <Select value={seatClassId} onValueChange={setSeatClassId}>
                  <SelectTrigger id="scSelect" className="h-8.5 text-xs">
                    <SelectValue placeholder="Semua Kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="text-xs">Semua Kelas Kursi</SelectItem>
                    {seatClasses.map((sc) => (
                      <SelectItem key={sc.id} value={sc.id} className="text-xs">
                        {sc.name} ({sc.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="typeSelect" className="text-[11px] font-semibold text-muted-foreground">
                  Skema Komisi
                </Label>
                <Select
                  value={ruleType}
                  onValueChange={(val) => setRuleType(val as CommissionRuleType)}
                >
                  <SelectTrigger id="typeSelect" className="h-8.5 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FLAT_PER_TICKET" className="text-xs">Flat (Rp / Tiket)</SelectItem>
                    <SelectItem value="PERCENTAGE" className="text-xs">Persentase (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="valInput" className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                  <span>Nilai {ruleType === 'FLAT_PER_TICKET' ? '(Rp)' : '(%)'}</span>
                  {ruleType === 'FLAT_PER_TICKET' && (
                    <span className="font-mono text-[10px] text-emerald-600 font-bold">
                      {formatCurrency(commissionValue || 0)}
                    </span>
                  )}
                </Label>
                <Input
                  id="valInput"
                  type="number"
                  min={0}
                  step={ruleType === 'FLAT_PER_TICKET' ? 1000 : 0.5}
                  value={commissionValue}
                  onChange={(e) => setCommissionValue(Number(e.target.value) || 0)}
                  className="h-8.5 text-xs font-mono font-bold"
                  required
                />
              </div>

              <div>
                <Button
                  type="submit"
                  disabled={addingRule}
                  className="w-full h-8.5 text-xs gap-1.5"
                >
                  {addingRule ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Menambahkan...
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" /> Tambah Aturan
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>

        <DialogFooter className="pt-2 border-t border-slate-200/80 dark:border-white/10">
          <Button type="button" variant="outline" onClick={onClose} className="text-xs h-8.5">
            Selesai / Tutup
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Confirm Delete Rule Dialog */}
      <ConfirmDialog
        open={!!ruleToDelete}
        onOpenChange={(open) => !open && setRuleToDelete(null)}
        title="Hapus Aturan Komisi Agen"
        description={`Apakah Anda yakin ingin menghapus aturan komisi untuk kelas ${ruleToDelete?.seatClass ? ruleToDelete.seatClass.name : 'Universal'} (${ruleToDelete?.ruleType === 'FLAT_PER_TICKET' ? formatCurrency(ruleToDelete?.commissionValue || 0) : `${ruleToDelete?.commissionValue}%`})?`}
        variant="danger"
        confirmText="Hapus Aturan"
        onConfirm={handleConfirmDeleteRule}
        isLoading={isDeletingRule}
      />
    </Dialog>
  );
}
