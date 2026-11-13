import { useAuth } from '@/hooks/use-auth';
import { useRouter } from '@/hooks/use-router';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { getDeviceId } from '@/lib/axiosClient';
import { AuthService } from '@/services/auth.service';
import type { UserLoginInfo } from '@/types';

const formSchema = z.object({
  identifier: z.string().min(3, { message: 'Masukkan email atau NIP yang valid' }),
  password: z
    .string()
    .min(6, { message: 'Kata sandi harus minimal 6 karakter' }),
  type: z.string().optional()
});

type UserFormValue = z.infer<typeof formSchema>;

export default function UserAuthForm() {
  const router = useRouter();
  const { completeLoginWithAnimation } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorFields, setErrorFields] = useState<{
    identifier?: string;
    password?: string;
  }>({});

  const form = useForm<UserFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues: { identifier: '', password: '', type: 'admin' }
  });

  const onSubmit = async (data: UserFormValue) => {
    setLoading(true);
    setErrorFields({});

    try {
      // 1. Get Device ID and inject into login payload
      const deviceId = getDeviceId();
      const loginPayload = { ...data, deviceId };

      const response = await AuthService.login(loginPayload);

      // Pastikan data ada sebelum diproses
      if (!response || !response.data) {
        throw new Error('Respons server tidak valid');
      }

      const payload = response.data;

      const user: UserLoginInfo = {
        id: payload.user.id,
        name: payload.user.name,
        email: payload.user.email,
        nip: payload.user.nip,
        roles: payload.user.roles
      };

      // Aktifkan transisi mulus ke dashboard via level AuthProvider
      completeLoginWithAnimation({
        user,
        menus: payload.menus,
        company: payload.company,
        token: payload.token,
        refreshToken: payload.refreshToken
      });

      // Langsung alihkan rute ke dashboard (halaman login langsung unmount di balik BrandLoader level root)
      router.replace('/');
    } catch (error: any) {
      if (error.response) {
        const { status } = error.response;

        if (status === 404) {
          setErrorFields({
            identifier: 'Email/NIP atau kata sandi salah.',
            password: 'Email/NIP atau kata sandi salah.'
          });
        } else if (status === 400) {
          setErrorFields({
            password: 'Kata sandi salah.'
          });
        } else if (status === 401) {
          toast.error('Login Gagal', {
            description: error.response.data?.message || 'Kredensial salah.'
          });
        }
      } else {
        toast.error('Gagal terhubung ke server');
      }
      setLoading(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-4 relative z-10"
        >
          <FormField
            control={form.control}
            name="identifier"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-zinc-300 text-xs font-semibold tracking-wide">
                  Email atau NIP
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
                    <Input
                      type="text"
                      placeholder="name@sstravel.com atau ADM-001..."
                      disabled={loading}
                      className={cn(
                        'h-12 pl-10 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 transition-all text-sm',
                        errorFields.identifier ? 'border-red-500/80 focus-visible:ring-red-500' : ''
                      )}
                      {...field}
                    />
                  </div>
                </FormControl>
                {errorFields.identifier && (
                  <p className="text-xs text-red-400 font-medium">
                    {errorFields.identifier}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-zinc-300 text-xs font-semibold tracking-wide">
                  Kata Sandi
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      disabled={loading}
                      className={cn(
                        'h-12 pl-10 pr-10 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 transition-all text-sm',
                        errorFields.password ? 'border-red-500/80 focus-visible:ring-red-500' : ''
                      )}
                      {...field}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-3 flex items-center text-zinc-400 hover:text-zinc-200 transition-colors"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </FormControl>
                {errorFields.password && (
                  <p className="text-xs text-red-400 font-medium">{errorFields.password}</p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            disabled={loading}
            className="w-full h-12 rounded-xl bg-linear-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all active:scale-[0.99] border border-emerald-400/20 mt-2"
            type="submit"
          >
            {loading ? 'Memverifikasi Kredensial...' : 'Masuk ke Sistem'}
          </Button>
        </form>
      </Form>

      {/* Social Login Divider */}
      <div className="relative mt-7 pt-4 z-10">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-zinc-950/80 px-3 text-zinc-400 text-[11px] font-semibold tracking-wider">
            Atau masuk dengan
          </span>
        </div>
      </div>

      {/* Social Login Buttons: Google, Facebook, Microsoft */}
      <div className="grid grid-cols-3 gap-2.5 mt-4 z-10">
        {/* Google */}
        <button
          type="button"
          onClick={() => toast.info('Fitur SSO Google segera hadir.')}
          className="h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white transition-all flex items-center justify-center gap-2 text-xs font-semibold shadow-xs active:scale-95"
          title="Masuk dengan Google"
        >
          <svg className="size-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.4C.7 9.8 0 12 0 14.7s.7 4.9 1.9 7.3l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 17c1.8 3.7 5.6 6.5 10.1 6.5z"
            />
          </svg>
          <span className="hidden sm:inline">Google</span>
        </button>

        {/* Facebook */}
        <button
          type="button"
          onClick={() => toast.info('Fitur SSO Facebook segera hadir.')}
          className="h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white transition-all flex items-center justify-center gap-2 text-xs font-semibold shadow-xs active:scale-95"
          title="Masuk dengan Facebook"
        >
          <svg className="size-4 shrink-0 fill-[#1877F2]" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span className="hidden sm:inline">Facebook</span>
        </button>

        {/* Microsoft */}
        <button
          type="button"
          onClick={() => toast.info('Fitur SSO Microsoft segera hadir.')}
          className="h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white transition-all flex items-center justify-center gap-2 text-xs font-semibold shadow-xs active:scale-95"
          title="Masuk dengan Microsoft"
        >
          <svg className="size-3.5 shrink-0" viewBox="0 0 21 21">
            <rect x="1" y="1" width="9" height="9" fill="#f25022" />
            <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
            <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
            <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
          </svg>
          <span className="hidden sm:inline">Microsoft</span>
        </button>
      </div>
    </>
  );
}
