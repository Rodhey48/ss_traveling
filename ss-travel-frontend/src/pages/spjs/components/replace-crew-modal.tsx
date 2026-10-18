import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserCheck, Users } from 'lucide-react';
import { SpjService } from '@/services/spj.service';
import { UserService } from '@/services/user.service';
import type { Spj, User, ReplaceCrewFormData } from '@/types';
import { toast } from 'sonner';

interface ReplaceCrewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spj: Spj | null;
  onSuccess: () => void;
}

export default function ReplaceCrewModal({
  open,
  onOpenChange,
  spj,
  onSuccess,
}: ReplaceCrewModalProps) {
  const [loading, setLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [assignmentId, setAssignmentId] = useState('');
  const [replacementCrewId, setReplacementCrewId] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) {
      loadUsers();
      setAssignmentId('');
      setReplacementCrewId('');
      setReason('');
    }
  }, [open]);

  const loadUsers = async () => {
    try {
      const res = await UserService.findAll({ limit: 100 });
      setAvailableUsers(res.data?.data || []);
    } catch {
      toast.error('Gagal memuat data pengguna untuk pengganti kru.');
    }
  };

  const activeAssignments = (spj?.crewAssignments || []).filter(
    (c) => c.status === 'ACTIVE' || c.status === 'ASSIGNED',
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spj || !assignmentId || !replacementCrewId || !reason) {
      toast.warning('Lengkapi semua data penggantian kru.');
      return;
    }

    setLoading(true);
    try {
      const payload: ReplaceCrewFormData = {
        assignmentId,
        replacementCrewId,
        reason,
      };

      await SpjService.replaceCrew(spj.id, payload);
      toast.success('Kru berhasil digantikan dan hak kompensasi baru berhasil di-snapshot.');
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memproses pergantian kru.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[550px]">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <DialogTitle className="text-lg font-bold">
                Pergantian Kru Berjalan / Sakit di Jalan
              </DialogTitle>
              <DialogDescription className="text-xs">
                Revisi penugasan kru di tengah perjalanan operasional (Skenario 1 & Addendum v1.1).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <Label className="text-xs font-semibold">Pilih Kru yang Berhalangan / Sakit *</Label>
            <Select value={assignmentId} onValueChange={setAssignmentId}>
              <SelectTrigger className="mt-1.5 h-10 text-xs">
                <SelectValue placeholder="Pilih kru dinas aktif..." />
              </SelectTrigger>
              <SelectContent>
                {activeAssignments.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.crew?.name} ({c.role} - Status: {c.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-semibold">Personel Kru Pengganti *</Label>
            <Select value={replacementCrewId} onValueChange={setReplacementCrewId}>
              <SelectTrigger className="mt-1.5 h-10 text-xs">
                <SelectValue placeholder="Pilih supir / kondektur pengganti..." />
              </SelectTrigger>
              <SelectContent>
                {availableUsers
                  .filter((u) => !activeAssignments.some((a) => a.crewId === u.id))
                  .map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.nip || u.email})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-semibold">Alasan Pergantian Kru (Wajib Dicatat) *</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Mengalami demam tinggi saat istirahat di garasi Yogya"
              className="mt-1.5 h-10 text-xs"
              required
            />
          </div>

          <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="text-xs h-9"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading || !assignmentId || !replacementCrewId}
              className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[140px] text-xs h-9 font-semibold"
            >
              <UserCheck className="w-4 h-4 mr-1.5" />
              {loading ? 'Memproses...' : 'Konfirmasi Ganti'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
