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
import { useAuth } from '@/hooks/use-auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { UserService } from '@/services/user.service';
import { ShieldCheck } from 'lucide-react';

const forcePasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password baru minimal 6 karakter'),
  confirmPassword: z.string().min(6, 'Konfirmasi password minimal 6 karakter'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Konfirmasi password tidak cocok",
  path: ["confirmPassword"],
});

export default function ForceChangePasswordModal() {
  const { user, setAuthData } = useAuth();
  const [loading, setLoading] = useState(false);

  // Open automatically if isPasswordChanged is false
  const isOpen = user !== null && user.isPasswordChanged === false;

  const form = useForm({
    resolver: zodResolver(forcePasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      const response = await UserService.changePassword({
        newPassword: data.newPassword,
      });
      if (response.status) {
        toast.success('Password berhasil diperbarui');
        // Update global state to hide modal
        if (user) {
          setAuthData({
            user: { ...user, isPasswordChanged: true },
            menus: user.menus || []
          });
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memperbarui password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <div className="bg-amber-500/10 px-6 py-8 flex flex-col items-center text-center gap-4">
          <div className="p-4 bg-amber-500 rounded-full text-white shadow-lg shadow-amber-500/20">
            <ShieldCheck size={32} />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold text-amber-600">Keamanan Akun Diperlukan</DialogTitle>
            <DialogDescription className="text-amber-800/70 font-medium">
              Demi keamanan, Anda wajib mengganti password bawaan sebelum dapat melanjutkan penggunaan sistem.
            </DialogDescription>
          </div>
        </div>

        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password Baru</FormLabel>
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
                    <FormLabel>Konfirmasi Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Ulangi password baru" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="pt-4">
                <Button type="submit" disabled={loading} className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20">
                  {loading ? 'Memperbarui...' : 'Simpan & Lanjutkan'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
