import React, { useState } from 'react';
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
import { KeyRound, ShieldAlert } from 'lucide-react';

const resetPasswordSchema = z.object({
  adminPassword: z.string().min(1, 'Password Admin wajib diisi'),
  newPassword: z.string().min(6, 'Password baru minimal 6 karakter'),
  confirmPassword: z.string().min(6, 'Konfirmasi password minimal 6 karakter'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Konfirmasi password tidak cocok",
  path: ["confirmPassword"],
});

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export default function ResetPasswordModal({ isOpen, onClose, user }: ResetPasswordModalProps) {
  const [loading, setLoading] = useState(false);

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
      toast.success(`Password user ${user.name} berhasil di-reset`);
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
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-red-500/10 px-6 py-6 border-b border-border flex items-center gap-4">
          <div className="p-3 bg-red-500 rounded-xl text-white shadow-lg shadow-red-500/20">
            <ShieldAlert size={24} />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold text-foreground">Reset Password User</DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">
              Aksi ini akan mengubah password untuk <strong>{user?.name}</strong>
            </DialogDescription>
          </div>
        </div>

        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="adminPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <KeyRound size={14} className="text-primary" />
                      Konfirmasi Password Anda (Admin)
                    </FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Masukkan password login Anda" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="h-px bg-border my-2" />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password Baru untuk User</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Minimal 6 karakter" className="h-11" {...field} />
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
                    <FormLabel>Konfirmasi Password Baru</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Ulangi password baru" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="pt-4 flex gap-3">
                <Button type="button" variant="ghost" className="flex-1 h-11" onClick={onClose}>Batal</Button>
                <Button type="submit" disabled={loading} className="flex-[2] h-11 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20">
                  {loading ? 'Memproses...' : 'Reset Password User'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
