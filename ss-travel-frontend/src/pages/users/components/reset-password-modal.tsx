import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { UserService } from '@/services/user.service';
import type { User } from '@/types';
import { Eye, EyeOff, KeyRound, Loader2, ShieldAlert } from 'lucide-react';

const resetPasswordSchema = z
  .object({
    adminPassword: z.string().min(1, 'Password Admin wajib diisi'),
    newPassword: z.string().min(6, 'Password baru minimal 6 karakter'),
    confirmPassword: z.string().min(6, 'Konfirmasi password minimal 6 karakter'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Konfirmasi password tidak cocok',
    path: ['confirmPassword'],
  });

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export default function ResetPasswordModal({
  isOpen,
  onClose,
  user,
}: ResetPasswordModalProps) {
  const [loading, setLoading] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      adminPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: any) => {
    if (!user) return;
    try {
      setLoading(true);
      await UserService.resetUserPassword(user.id, {
        adminPassword: data.adminPassword,
        newPassword: data.newPassword,
      });
      toast.success(`Password pengguna ${user.name} berhasil di-reset`);
      form.reset();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal me-reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-xl">
        <DialogHeader className="bg-rose-50 dark:bg-rose-950/30 px-6 py-5 border-b border-rose-100 dark:border-rose-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-xs shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-rose-950 dark:text-rose-200">
                Reset Password Pengguna
              </DialogTitle>
              <DialogDescription className="text-xs text-rose-800 dark:text-rose-300/80 mt-0.5">
                Mengatur ulang kata sandi login untuk <strong>{user?.name}</strong>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="adminPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5 text-xs font-semibold">
                      <KeyRound className="h-3.5 w-3.5 text-rose-600" />
                      Konfirmasi Password Anda (Admin) *
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showAdminPassword ? 'text' : 'password'}
                          placeholder="Masukkan password login Anda"
                          className="h-9 text-xs pr-9"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminPassword(!showAdminPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="h-px bg-slate-200/80 dark:bg-white/10 my-2" />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Password Baru untuk Pengguna *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? 'text' : 'password'}
                          placeholder="Minimal 6 karakter"
                          className="h-9 text-xs pr-9"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Ulangi Password Baru *</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Ketik ulang password baru"
                        className="h-9 text-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-3 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9 text-xs"
                  onClick={onClose}
                  disabled={loading}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading}
                  className="flex-1 h-9 text-xs bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Simpan Password
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
