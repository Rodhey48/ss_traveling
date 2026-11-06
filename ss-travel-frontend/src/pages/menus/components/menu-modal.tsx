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
  FormDescription,
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
import {
  Check,
  FolderTree,
  KeyRound,
  Layers,
  Loader2,
  Plus,
  Sparkles,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MenuFormData) => void;
  menu?: BackendMenu | null;
  menus: BackendMenu[];
  loading?: boolean;
  fixedParentId?: string | null;
}

interface MenuOption {
  id: string;
  name: string;
  level: number;
}

const COMMON_ACTIONS = [
  'approve',
  'reject',
  'export',
  'print',
  'reverse',
  'reassign',
  'verify',
  'download',
];

export default function MenuModal({
  isOpen,
  onClose,
  onSubmit,
  menu,
  menus,
  loading = false,
  fixedParentId,
}: MenuModalProps) {
  const [actionInput, setActionInput] = useState('');

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
      title: false,
      aclName: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (menu) {
        form.reset({
          name: menu.name || '',
          url: menu.url || '',
          icon: menu.icon || '',
          sequence: menu.sequence ?? 0,
          parentId: menu.parent?.id || menu.parentId || '',
          isActive: menu.isActive ?? true,
          isWeb: menu.isWeb ?? true,
          isMobile: menu.isMobile ?? false,
          availableActions: menu.availableActions || [],
          title: menu.title ?? false,
          aclName: menu.aclName || '',
        });
      } else {
        form.reset({
          name: '',
          url: '',
          icon: '',
          sequence: 0,
          parentId: fixedParentId || '',
          isActive: true,
          isWeb: true,
          isMobile: false,
          availableActions: [],
          title: false,
          aclName: '',
        });
      }
      setActionInput('');
    }
  }, [menu, form, isOpen, fixedParentId]);

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
  const selectedParentName = fixedParentId
    ? menus.find((m) => m.id === fixedParentId)?.name
    : null;

  const handleAddAction = (actionToAdd: string) => {
    const clean = actionToAdd.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!clean) return;
    const current = form.getValues('availableActions') || [];
    if (!current.includes(clean)) {
      form.setValue('availableActions', [...current, clean], {
        shouldDirty: true,
      });
    }
    setActionInput('');
  };

  const handleRemoveAction = (index: number) => {
    const current = form.getValues('availableActions') || [];
    const next = [...current];
    next.splice(index, 1);
    form.setValue('availableActions', next, { shouldDirty: true });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-border/60 shadow-2xl backdrop-blur-md bg-card/95">
        <div className="bg-primary/5 px-6 py-4 border-b border-border/60 flex items-center justify-between">
          <DialogHeader className="text-left space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-primary/10 text-primary">
                {menu ? <Layers className="h-5 w-5" /> : <FolderTree className="h-5 w-5" />}
              </span>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  {menu
                    ? `Edit Menu: ${menu.name}`
                    : fixedParentId
                    ? `Tambah Sub-Menu di "${selectedParentName}"`
                    : 'Tambah Menu Utama'}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {menu
                    ? 'Perbarui konfigurasi rute, tampilan hierarki, dan hak akses menu.'
                    : 'Konfigurasikan item menu navigasi baru untuk sistem ERP.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <Form {...form}>
            <form id="menu-modal-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Row 1: Nama Menu & URL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  rules={{ required: 'Nama menu wajib diisi' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-foreground">
                        Nama Menu <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Contoh: Manajemen Kasir"
                          className="h-10 bg-background/60"
                          {...field}
                        />
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
                      <FormLabel className="text-xs font-semibold text-foreground">
                        URL / Rute Path
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="/cashier atau # jika grup"
                          className="h-10 font-mono text-sm bg-background/60"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-[11px] text-muted-foreground">
                        Kosongkan atau beri # jika menu hanya berupa folder grup.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 2: Ikon & Induk Menu */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-foreground">
                        Ikon Navigasi (Lucide)
                      </FormLabel>
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
                      <FormLabel className="text-xs font-semibold text-foreground">
                        Menu Induk (Parent)
                      </FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(val === 'none' ? '' : val)}
                        value={field.value || 'none'}
                        disabled={Boolean(!menu && fixedParentId)}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10 bg-background/60">
                            <SelectValue placeholder="Tanpa Induk (Menu Utama / Root)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-60">
                          <SelectItem value="none">
                            <span className="font-semibold text-primary">★ Tanpa Induk (Root / Level Atas)</span>
                          </SelectItem>
                          {menuOptions.map((opt) => (
                            <SelectItem key={opt.id} value={opt.id}>
                              <span className="font-mono text-muted-foreground">
                                {'• '.repeat(opt.level)}
                              </span>{' '}
                              {opt.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!menu && fixedParentId && (
                        <p className="text-[11px] text-muted-foreground italic">
                          Parent dikunci otomatis pada grup "{selectedParentName}".
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 3: Sequence & ACL Identifier */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sequence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-foreground">
                        Urutan Tampilan (Sequence)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="h-10 bg-background/60"
                          {...field}
                          value={field.value ?? 0}
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                        />
                      </FormControl>
                      <FormDescription className="text-[11px] text-muted-foreground">
                        Angka lebih kecil tampil lebih awal di menu samping.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="aclName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <KeyRound className="h-3.5 w-3.5 text-primary" />
                        <span>Identifier Izin (ACL Key)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Misal: Cashier, Journal, User"
                          className="h-10 font-mono text-sm bg-background/60"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-[11px] text-muted-foreground">
                        Kunci izin RBAC (contoh: Cashier:read). Jika kosong, menggunakan Nama Menu.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 4: Custom Actions */}
              <FormField
                control={form.control}
                name="availableActions"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        <span>Aksi Khusus Tambahan (Custom Actions)</span>
                      </FormLabel>
                      <span className="text-[11px] text-muted-foreground">
                        {(field.value || []).length} aksi aktif
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 min-h-10 p-2 border border-border/70 rounded-lg bg-background/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                      {Array.isArray(field.value) &&
                        field.value.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="flex items-center gap-1 py-0.5 px-2 text-xs bg-primary/10 text-primary border border-primary/20"
                          >
                            <span>{tag}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAction(index)}
                              className="text-primary hover:text-destructive transition-colors ml-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      <input
                        className="flex-1 bg-transparent outline-none text-xs min-w-32 placeholder:text-muted-foreground/60 py-1"
                        placeholder="Ketik & Enter (misal: approve, verify)..."
                        value={actionInput}
                        onChange={(e) => setActionInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            handleAddAction(actionInput);
                          } else if (
                            e.key === 'Backspace' &&
                            !actionInput &&
                            (field.value?.length ?? 0) > 0
                          ) {
                            handleRemoveAction((field.value?.length ?? 1) - 1);
                          }
                        }}
                      />
                    </div>

                    {/* Quick suggested chips */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[11px] text-muted-foreground">Saran Cepat:</span>
                      {COMMON_ACTIONS.filter(
                        (act) => !(field.value || []).includes(act)
                      ).map((act) => (
                        <button
                          key={act}
                          type="button"
                          onClick={() => handleAddAction(act)}
                          className="inline-flex items-center gap-0.5 text-[11px] px-2 py-0.5 rounded-full bg-secondary hover:bg-primary/10 hover:text-primary text-secondary-foreground transition-colors border border-border/50"
                        >
                          <Plus className="h-2.5 w-2.5" />
                          {act}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Row 5: Group Toggle */}
              <div className="p-3.5 bg-primary/5 rounded-xl border border-primary/20">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="flex items-start space-x-3 space-y-0 cursor-pointer">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="size-4.5 mt-0.5"
                        />
                      </FormControl>
                      <div className="space-y-0.5 leading-tight">
                        <FormLabel className="font-semibold cursor-pointer text-sm text-foreground flex items-center gap-1.5">
                          Jadikan Sebagai Grup / Folder Navigasi
                          {field.value && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1 bg-primary/10 text-primary border-primary/30">
                              GROUP
                            </Badge>
                          )}
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Jika diaktifkan, menu ini berfungsi sebagai wadah dropdown sub-menu tanpa membuka halaman sendiri.
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 6: Toggles Status & Platform */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-secondary/30 rounded-xl border border-border/60">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0 cursor-pointer">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="size-4"
                        />
                      </FormControl>
                      <FormLabel className="font-medium cursor-pointer text-xs text-foreground">
                        Status Aktif
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isWeb"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0 cursor-pointer">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="size-4"
                        />
                      </FormControl>
                      <FormLabel className="font-medium cursor-pointer text-xs text-foreground">
                        Tampil di Web
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isMobile"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0 cursor-pointer">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="size-4"
                        />
                      </FormControl>
                      <FormLabel className="font-medium cursor-pointer text-xs text-foreground">
                        Tampil di Mobile
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </div>

        <DialogFooter className="px-6 py-3.5 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="h-10 px-5 text-sm text-foreground hover:bg-secondary"
          >
            Batal
          </Button>
          <Button
            type="submit"
            form="menu-modal-form"
            disabled={loading}
            className="h-10 px-6 text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                {menu ? 'Simpan Perubahan' : 'Buat Menu Sekarang'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
