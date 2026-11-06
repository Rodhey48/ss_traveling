import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RoleService } from '@/services/role.service';
import type { User, UserFormData, Role } from '@/types';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, ShieldCheck, User as UserIcon } from 'lucide-react';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => void;
  user?: User | null;
  loading?: boolean;
}

export default function UserModal({
  isOpen,
  onClose,
  onSubmit,
  user,
  loading = false,
}: UserModalProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<UserFormData>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      nip: '',
      phone: '',
      type: 'employee',
      isActive: true,
      roleIds: [],
    },
  });

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await RoleService.findAll();
        if (response.status) {
          setRoles(response.data);
        }
      } catch (error) {
        toast.error('Gagal mengambil daftar peran (roles)');
      }
    };

    if (isOpen) {
      fetchRoles();
      setShowPassword(false);
      if (user) {
        form.reset({
          name: user.name,
          email: user.email,
          nip: user.nip || '',
          phone: user.phone || '',
          type: user.type,
          isActive: user.isActive,
          roleIds: user.roles?.map((ur: any) => ur.role?.id || ur.roleId || ur.id) || [],
        });
      } else {
        form.reset({
          name: '',
          email: '',
          password: '',
          nip: '',
          phone: '',
          type: 'employee',
          isActive: true,
          roleIds: [],
        });
      }
    }
  }, [user, form, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
              <UserIcon className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                {user ? 'Ubah Data Pengguna' : 'Tambah Pengguna Baru'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {user
                  ? `Perbarui informasi profil dan penugasan peran untuk ${user.name}`
                  : 'Daftarkan pengguna baru, tetapkan nomor NIP, dan atur peran akses sistem.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* NAMA LENGKAP */}
              <FormField
                control={form.control}
                name="name"
                rules={{ required: 'Nama lengkap wajib diisi' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Nama Lengkap *</FormLabel>
                    <FormControl>
                      <Input placeholder="cth. Budi Setiawan" className="h-9 text-xs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* EMAIL */}
              <FormField
                control={form.control}
                name="email"
                rules={{
                  required: 'Email wajib diisi',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Format email tidak valid',
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Alamat Email *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="cth. budi@sstravel.com"
                        className="h-9 text-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* PASSWORD (HANYA MUNCUL SAAT BUAT BARU) */}
            {!user && (
              <FormField
                control={form.control}
                name="password"
                rules={{
                  required: 'Password awal wajib diisi',
                  minLength: {
                    value: 6,
                    message: 'Password minimal 6 karakter',
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Password Awal *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Minimal 6 karakter"
                          className="h-9 text-xs pr-9"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* NIP */}
              <FormField
                control={form.control}
                name="nip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Nomor Induk Pegawai (NIP)</FormLabel>
                    <FormControl>
                      <Input placeholder="cth. SST-0012" className="h-9 text-xs font-mono uppercase" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* TELEPON */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Nomor Telepon / WhatsApp</FormLabel>
                    <FormControl>
                      <Input placeholder="cth. 08123456789" className="h-9 text-xs font-mono" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* TIPE PENGGUNA */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Kategori Pengguna *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Pilih tipe" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="employee" className="text-xs">
                          Karyawan / Personel Lapangan
                        </SelectItem>
                        <SelectItem value="admin" className="text-xs">
                          Administrator Sistem
                        </SelectItem>
                        <SelectItem value="user" className="text-xs">
                          Pengguna Reguler
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* PERAN (ROLE RBAC) */}
              <FormField
                control={form.control}
                name="roleIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      Hak Akses Utama (Role)
                    </FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange([val])}
                      value={field.value?.[0] || ''}
                    >
                      <FormControl>
                        <SelectTrigger className="h-9 text-xs font-semibold">
                          <SelectValue placeholder="Pilih Peran Utama" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id} className="text-xs">
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* STATUS KEAKTIFAN */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold">Status Keaktifan Akun</FormLabel>
                  <Select
                    onValueChange={(val) => field.onChange(val === 'true')}
                    value={field.value ? 'true' : 'false'}
                  >
                    <FormControl>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="true" className="text-xs">
                        Aktif Operasional (Dapat Login)
                      </SelectItem>
                      <SelectItem value="false" className="text-xs">
                        Non-Aktif / Ditangguhkan (Login Ditolak)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-3 border-t border-slate-200/80 dark:border-white/10 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-9 text-xs"
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-xs gap-1.5"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {user ? 'Simpan Perubahan' : 'Buat Pengguna'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
