import { useRouter } from '@/hooks/use-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
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
      const response = await AuthService.login(data);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('menus', JSON.stringify(response.data.menus));
      const user: UserLoginInfo = {
        id: response.data.user.id,
        name: response.data.user.name,
        email: response.data.user.email,
        nip: response.data.user.nip,
        roles: response.data.user.roles
      };

      localStorage.setItem('user', JSON.stringify(user));
      toast.success('Login Berhasil', {
        description: 'Anda akan dialihkan ke dashboard.'
      });
      setTimeout(() => {
        router.push('/');
      }, 1000);
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
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-4"
        >
          <FormField
            control={form.control}
            name="identifier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email atau NIP</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Masukkan email atau NIP Anda..."
                    disabled={loading}
                    className={errorFields.identifier ? 'border-red-500' : ''}
                    {...field}
                  />
                </FormControl>
                {errorFields.identifier && (
                  <p className="text-sm text-red-500">
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
              <FormItem>
                <FormLabel>Kata Sandi</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Masukkan kata sandi..."
                      disabled={loading}
                      className={errorFields.password ? 'border-red-500' : ''}
                      {...field}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </FormControl>
                {errorFields.password && (
                  <p className="text-sm text-red-500">{errorFields.password}</p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            disabled={loading}
            className="ml-auto w-full bg-[#1cb85a] text-white hover:bg-[#169748]"
            type="submit"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </Button>
        </form>
      </Form>

      <div className="relative mt-8">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-gray-500">Atau masuk dengan</span>
        </div>
      </div>

      <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
        <Button
          variant="outline"
          type="button"
          disabled
          className="w-full flex-1 gap-2 bg-gray-50/50 text-gray-400 opacity-60 hover:bg-gray-50"
        >
          Google
        </Button>
        <Button
          variant="outline"
          type="button"
          disabled
          className="w-full flex-1 gap-2 bg-gray-50/50 text-gray-400 opacity-60 hover:bg-gray-50"
        >
          Microsoft
        </Button>
      </div>
    </>
  );
}
