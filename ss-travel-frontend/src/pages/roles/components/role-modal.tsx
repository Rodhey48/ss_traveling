import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MenuService } from '@/services/menu.service';
import type { BackendMenu, Role, RoleFormData } from '@/types';
import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Shield, Loader2, Info } from 'lucide-react';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RoleFormData) => void;
  role?: Role | null;
  loading?: boolean;
}

export default function RoleModal({
  isOpen,
  onClose,
  onSubmit,
  role,
  loading = false,
}: RoleModalProps) {
  const form = useForm<RoleFormData>({
    defaultValues: {
      name: '',
      description: '',
      permissions: [],
    },
  });

  const { fields, replace, update } = useFieldArray({
    control: form.control,
    name: 'permissions',
  });

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const response = await MenuService.getTree();
        if (response.status) {
          // Flatten tree for useFieldArray mapping
          const flatPermissions: any[] = [];
          const flatten = (nodes: BackendMenu[], level = 0) => {
            nodes.forEach((node) => {
              const existing = role?.menus?.find(
                (m: any) => (m.menu?.id || m.menuId) === node.id
              );
              flatPermissions.push({
                menuId: node.id,
                menuName: node.name,
                level: level,
                availableActions: node.availableActions || [],
                isRead: existing?.isRead ?? false,
                isCreate: existing?.isCreate ?? false,
                isUpdate: existing?.isUpdate ?? false,
                isDelete: existing?.isDelete ?? false,
                actions: existing?.actions || {},
              });
              if (node.children) flatten(node.children, level + 1);
            });
          };

          flatten(response.data);
          replace(flatPermissions);
        }
      } catch (error) {
        toast.error('Gagal mengambil struktur menu sistem');
      }
    };

    if (isOpen) {
      if (role) {
        form.reset({
          name: role.name,
          description: role.description || '',
        });
      } else {
        form.reset({
          name: '',
          description: '',
        });
      }
      fetchMenus();
    }
  }, [role, form, isOpen, replace]);

  const handleCheckboxChange = (
    index: number,
    field: string,
    value: boolean,
    actionName?: string
  ) => {
    const current = form.getValues(`permissions.${index}`);
    let updated = { ...current };

    if (actionName) {
      // Handle custom action
      updated.actions = { ...current.actions, [actionName]: value };
      if (value === true) updated.isRead = true; // Auto read if action checked
    } else {
      // Handle CRUD
      (updated as any)[field] = value;

      // Smart logic: If Create/Update/Delete is checked, Read MUST be checked
      if (
        (field === 'isCreate' || field === 'isUpdate' || field === 'isDelete') &&
        value === true
      ) {
        updated.isRead = true;
      }

      // If Read is unchecked, everything else MUST be unchecked
      if (field === 'isRead' && value === false) {
        updated.isCreate = false;
        updated.isUpdate = false;
        updated.isDelete = false;
        // Also uncheck all custom actions
        if (updated.actions) {
          const resetActions = { ...updated.actions };
          Object.keys(resetActions).forEach((k) => (resetActions[k] = false));
          updated.actions = resetActions;
        }
      }
    }

    update(index, updated);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                {role ? 'Ubah Peran & Hak Akses' : 'Tambah Peran (Role) Baru'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {role
                  ? `Atur matriks izin akses menu dan tindakan khusus untuk peran ${role.name}`
                  : 'Definisikan nama peran baru dan konfigurasikan matriks hak akses menu (RBAC).'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* NAMA PERAN */}
              <FormField
                control={form.control}
                name="name"
                rules={{ required: 'Nama peran wajib diisi' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Nama Peran (Kode Role) *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="cth. FINANCE_AUDITOR"
                        className="h-9 text-xs font-mono uppercase"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* DESKRIPSI PERAN */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Deskripsi / Tugas Pokok</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="cth. Auditor keuangan dan verifikasi laporan tutup buku"
                        className="h-9 text-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* PERMISSIONS MATRIX */}
            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <FormLabel className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-emerald-600" />
                  Matriks Hak Akses Menu &amp; Aksi (RBAC Matrix)
                </FormLabel>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3 text-emerald-600" />
                  <span>Centang Buat/Ubah/Hapus otomatis mengaktifkan hak Baca.</span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/2 overflow-hidden shadow-2xs">
                <div className="max-h-[380px] overflow-y-auto">
                  <Table className="text-xs">
                    <TableHeader className="bg-slate-100/90 dark:bg-zinc-900 sticky top-0 z-10 border-b border-slate-200/80 dark:border-white/10">
                      <TableRow>
                        <TableHead className="w-56 font-bold uppercase text-[10px] text-muted-foreground">
                          Hierarki Menu
                        </TableHead>
                        <TableHead className="text-center w-18 font-bold uppercase text-[10px] text-muted-foreground">
                          Baca (Read)
                        </TableHead>
                        <TableHead className="text-center w-18 font-bold uppercase text-[10px] text-muted-foreground">
                          Buat (Create)
                        </TableHead>
                        <TableHead className="text-center w-18 font-bold uppercase text-[10px] text-muted-foreground">
                          Ubah (Update)
                        </TableHead>
                        <TableHead className="text-center w-18 font-bold uppercase text-[10px] text-muted-foreground">
                          Hapus (Delete)
                        </TableHead>
                        <TableHead className="font-bold uppercase text-[10px] text-muted-foreground">
                          Aksi Fungsional Khusus
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
                      {fields.map((field, index) => {
                        const level = (field as any).level || 0;
                        const availableActions = (field as any).availableActions || [];
                        return (
                          <TableRow
                            key={field.id}
                            className="hover:bg-slate-100/60 dark:hover:bg-white/5 transition-colors"
                          >
                            <TableCell
                              className="font-medium text-xs text-foreground"
                              style={{ paddingLeft: `${level * 20 + 12}px` }}
                            >
                              <div className="flex items-center gap-1.5">
                                {level > 0 && (
                                  <span className="text-muted-foreground/40 font-mono">└</span>
                                )}
                                <span className={level === 0 ? 'font-bold text-foreground' : 'text-foreground/90'}>
                                  {(field as any).menuName}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell className="text-center py-2.5">
                              <Checkbox
                                checked={form.watch(`permissions.${index}.isRead`)}
                                onCheckedChange={(v) =>
                                  handleCheckboxChange(index, 'isRead', v as boolean)
                                }
                              />
                            </TableCell>

                            <TableCell className="text-center py-2.5">
                              <Checkbox
                                checked={form.watch(`permissions.${index}.isCreate`)}
                                onCheckedChange={(v) =>
                                  handleCheckboxChange(index, 'isCreate', v as boolean)
                                }
                              />
                            </TableCell>

                            <TableCell className="text-center py-2.5">
                              <Checkbox
                                checked={form.watch(`permissions.${index}.isUpdate`)}
                                onCheckedChange={(v) =>
                                  handleCheckboxChange(index, 'isUpdate', v as boolean)
                                }
                              />
                            </TableCell>

                            <TableCell className="text-center py-2.5">
                              <Checkbox
                                checked={form.watch(`permissions.${index}.isDelete`)}
                                onCheckedChange={(v) =>
                                  handleCheckboxChange(index, 'isDelete', v as boolean)
                                }
                              />
                            </TableCell>

                            <TableCell className="py-2.5">
                              {availableActions.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {availableActions.map((action: string) => {
                                    const isChecked =
                                      (form.watch(`permissions.${index}.actions`) || {})[action] ?? false;
                                    return (
                                      <label
                                        key={action}
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border cursor-pointer transition-colors ${
                                          isChecked
                                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60'
                                            : 'bg-white dark:bg-white/5 text-muted-foreground border-slate-200 dark:border-white/10 hover:border-slate-300'
                                        }`}
                                      >
                                        <Checkbox
                                          className="h-3 w-3 rounded-xs"
                                          checked={isChecked}
                                          onCheckedChange={(v) =>
                                            handleCheckboxChange(index, 'actions', v as boolean, action)
                                          }
                                        />
                                        <span className="uppercase font-mono">{action}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-[11px] text-muted-foreground/50 italic">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

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
                {role ? 'Simpan Perubahan Peran' : 'Buat Peran Baru'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
