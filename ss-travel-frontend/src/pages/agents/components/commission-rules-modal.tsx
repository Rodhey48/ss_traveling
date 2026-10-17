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
import { Plus, Trash2 } from 'lucide-react';
import { AgentService } from '@/services/agent.service';
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
  const [addingRule, setAddingRule] = useState(false);

  const fetchRules = async () => {
    if (!agent) return;
    setLoading(true);
    try {
      const res = await AgentService.findRulesByAgent(agent.id);
      if (res?.data) {
        setRules(res.data);
      }
    } catch (err: any) {
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
    }
  }, [isOpen, agent]);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agent) return;

    setAddingRule(true);
    try {
      const payload: AgentCommissionRuleFormData = {
        seatClassId: seatClassId === 'ALL' ? undefined : seatClassId,
        ruleType,
        commissionValue: Number(commissionValue),
        isActive: true,
      };

      await AgentService.createCommissionRule(agent.id, payload);
      toast.success('Aturan komisi berhasil ditambahkan');
      fetchRules();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menambahkan aturan komisi');
    } finally {
      setAddingRule(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (confirm('Hapus aturan komisi ini?')) {
      try {
        await AgentService.deleteCommissionRule(ruleId);
        toast.success('Aturan komisi berhasil dihapus');
        fetchRules();
      } catch (err: any) {
        toast.error('Gagal menghapus aturan komisi');
      }
    }
  };

  if (!agent) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Aturan Komisi Penjualan:</span>
            <span className="text-emerald-600 font-bold">{agent.name}</span>
            <Badge variant="outline" className="text-xs">
              {agent.code}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Existing Rules Table */}
        <div className="space-y-4 py-2">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kelas Kursi</TableHead>
                  <TableHead>Tipe Komisi</TableHead>
                  <TableHead className="text-right">Besaran Komisi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Hapus</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      Memuat aturan...
                    </TableCell>
                  </TableRow>
                ) : rules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground text-xs">
                      Belum ada aturan komisi khusus.
                    </TableCell>
                  </TableRow>
                ) : (
                  rules.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium text-xs">
                        {r.seatClass ? r.seatClass.name : 'Semua Kelas (Universal)'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {r.ruleType === 'FLAT_PER_TICKET' ? 'Flat per Tiket' : 'Persentase'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs text-emerald-600">
                        {r.ruleType === 'FLAT_PER_TICKET'
                          ? `Rp ${Number(r.commissionValue).toLocaleString('id-ID')}`
                          : `${Number(r.commissionValue)}%`}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            r.isActive
                              ? 'text-emerald-700 dark:text-emerald-400 border-emerald-300 bg-emerald-600/10'
                              : 'text-muted-foreground'
                          }
                        >
                          {r.isActive ? 'Aktif' : 'Non-Aktif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRule(r.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Add New Rule Form */}
          <form onSubmit={handleAddRule} className="p-3 border rounded-lg bg-muted/40 space-y-3">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tambah Aturan Komisi Baru
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <Label htmlFor="scSelect" className="text-xs">Kelas Kursi</Label>
                <Select value={seatClassId} onValueChange={setSeatClassId}>
                  <SelectTrigger id="scSelect" className="h-8 text-xs mt-1">
                    <SelectValue placeholder="Semua Kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Kelas Kursi</SelectItem>
                    {seatClasses.map((sc) => (
                      <SelectItem key={sc.id} value={sc.id}>
                        {sc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="typeSelect" className="text-xs">Skema Komisi</Label>
                <Select
                  value={ruleType}
                  onValueChange={(val) => setRuleType(val as CommissionRuleType)}
                >
                  <SelectTrigger id="typeSelect" className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FLAT_PER_TICKET">Flat (Rp / Tiket)</SelectItem>
                    <SelectItem value="PERCENTAGE">Persentase (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="valInput" className="text-xs">
                  {ruleType === 'FLAT_PER_TICKET' ? 'Nominal (Rp)' : 'Persen (%)'}
                </Label>
                <Input
                  id="valInput"
                  type="number"
                  min={0}
                  step={ruleType === 'FLAT_PER_TICKET' ? 1000 : 0.5}
                  value={commissionValue}
                  onChange={(e) => setCommissionValue(Number(e.target.value))}
                  className="h-8 text-xs mt-1 font-mono"
                  required
                />
              </div>

              <div>
                <Button
                  type="submit"
                  size="sm"
                  disabled={addingRule}
                  className="w-full h-8 text-xs"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  {addingRule ? 'Menambahkan...' : 'Tambah Aturan'}
                </Button>
              </div>
            </div>
          </form>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
