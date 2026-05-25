import { IconPicker } from '@/components/shared/icon-picker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BackendMenu, MenuFormData } from '@/types';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MenuFormData) => void;
  menu?: BackendMenu | null;
  menus: BackendMenu[];
  loading?: boolean;
}

interface MenuOption {
  id: string;
  name: string;
  level: number;
}

export default function MenuModal({
  isOpen,
  onClose,
  onSubmit,
  menu,
  menus,
  loading,
}: MenuModalProps) {
  const form = useForm<MenuFormData>({
    defaultValues: {
      name: '',
      url: '',
      icon: '',
      sequence: 0,
      parentId: '',
      isActive: true,
      isWeb: true,
      isMobile: false,
      availableActions: [],
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (menu) {
        form.reset({
          name: menu.name,
          url: menu.url || '',
          icon: menu.icon || '',
          sequence: menu.sequence,
          parentId: menu.parent?.id || menu.parentId || '',
          isActive: menu.isActive,
          isWeb: menu.isWeb,
          isMobile: menu.isMobile,
          availableActions: menu.availableActions || [],
        });
      } else {
        form.reset({
          name: '',
          url: '',
          icon: '',
          sequence: 0,
          parentId: '',
          isActive: true,
          isWeb: true,
          isMobile: false,
          availableActions: [],
        });
      }
    }
  }, [menu, form, isOpen]);

  // Flatten menus for select, but exclude self and children to avoid circularity
  const flattenMenus = (list: BackendMenu[], level = 0): MenuOption[] => {
    return list.reduce((acc: MenuOption[], m) => {
      if (m.id === menu?.id) return acc; // Exclude self
      acc.push({ id: m.id, name: m.name, level });
      if (m.children) {
        acc.push(...flattenMenus(m.children, level + 1));
      }
      return acc;
    }, []);
  };

  const menuOptions = flattenMenus(menus);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-212.5 p-0 overflow-hidden border-border shadow-2xl">
        <div className="bg-primary/5 px-6 py-4 border-b border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary">{menu ? 'Edit Menu' : 'Tambah Menu Baru'}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {menu ? 'Perbarui detail menu yang sudah ada untuk aplikasi Anda.' : 'Silakan lengkapi formulir di bawah ini untuk membuat entri menu baru.'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  rules={{ required: 'Nama menu wajib diisi' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-foreground">Nama Menu</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Dashboard, Pengaturan..." className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-foreground">URL / Path</FormLabel>
                      <FormControl>
                        <Input placeholder="/dashboard" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-foreground">Pilih Ikon</FormLabel>
                      <FormControl>
                        <IconPicker
                          value={field.value || ''}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-foreground">Menu Induk (Parent)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Tanpa Induk (Level Atas)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Tanpa Induk (Level Atas)</SelectItem>
                          {menuOptions.map((opt) => (
                            <SelectItem key={opt.id} value={opt.id}>
                              {'\u00A0'.repeat(opt.level * 4)} {opt.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="sequence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-foreground">Urutan (Sequence)</FormLabel>
                      <FormControl>
                        <Input type="number" className="h-11" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="availableActions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-foreground">Aksi Khusus (Custom Actions)</FormLabel>
                      <div className="flex flex-wrap gap-2 min-h-11 p-2 border border-border rounded-md bg-background focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                        {Array.isArray(field.value) && field.value.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1.5 py-1 px-2.5 bg-secondary text-secondary-foreground border-none">
                            {tag}
                            <button
                              type="button"
                              onClick={() => {
                                const newTags = [...field.value];
                                newTags.splice(index, 1);
                                field.onChange(newTags);
                              }}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </Badge>
                        ))}
                        <input
                          className="flex-1 bg-transparent outline-none text-sm min-w-37.5 placeholder:text-muted-foreground"
                          placeholder="Ketik aksi & Enter (misal: approve)..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ',') {
                              e.preventDefault();
                              const val = e.currentTarget.value.trim().replace(',', '');
                              if (val && !field.value?.includes(val)) {
                                field.onChange([...(field.value || []), val]);
                                e.currentTarget.value = '';
                              }
                            } else if (e.key === 'Backspace' && !e.currentTarget.value && (field.value?.length ?? 0) > 0) {
                              const newTags = [...(field.value || [])];
                              newTags.pop();
                              field.onChange(newTags);
                            }
                          }}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-wrap gap-8 p-4 bg-secondary/50 rounded-xl border border-border">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3 space-y-0 cursor-pointer">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="size-5"
                        />
                      </FormControl>
                      <FormLabel className="font-medium cursor-pointer text-base text-foreground">Menu Aktif</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isWeb"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3 space-y-0 cursor-pointer">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="size-5"
                        />
                      </FormControl>
                      <FormLabel className="font-medium cursor-pointer text-base text-foreground">Tampil di Web</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isMobile"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3 space-y-0 cursor-pointer">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="size-5"
                        />
                      </FormControl>
                      <FormLabel className="font-medium cursor-pointer text-base text-foreground">Tampil di Mobile</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="pt-2 gap-3">
                <Button type="button" variant="ghost" onClick={onClose} className="h-11 px-8 text-foreground hover:bg-secondary">
                  Batal
                </Button>
                <Button type="submit" disabled={loading} className="h-11 px-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all">
                  {menu ? 'Simpan Perubahan' : 'Buat Menu Sekarang'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
