import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BackendMenu, MenuFormData } from '@/types';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MenuFormData) => void;
  menu?: BackendMenu | null;
  menus: BackendMenu[];
  loading?: boolean;
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
        });
      }
    }
  }, [menu, form, isOpen]);

  // Flatten menus for select, but exclude self and children to avoid circularity
  const flattenMenus = (list: BackendMenu[], level = 0): any[] => {
    return list.reduce((acc: any[], m) => {
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{menu ? 'Edit Menu' : 'Add New Menu'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              rules={{ required: 'Menu name is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Menu Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Dashboard" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input placeholder="/dashboard" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon (Lucide Name)</FormLabel>
                    <FormControl>
                      <Input placeholder="layout-dashboard" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sequence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sequence</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
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
                    <FormLabel>Parent Menu</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="No Parent (Top Level)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No Parent (Top Level)</SelectItem>
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

            <div className="flex flex-wrap gap-6 pt-2">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">Active</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isWeb"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">Web</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isMobile"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">Mobile</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {menu ? 'Update Menu' : 'Create Menu'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
