import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MenuService } from '@/services/menu.service';
import type { Role, RoleFormData, BackendMenu } from '@/types';
import { toast } from 'sonner';

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
  loading,
}: RoleModalProps) {
  const [menuTree, setMenuTree] = useState<BackendMenu[]>([]);

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
          setMenuTree(response.data);
          
          // Flatten tree for useFieldArray mapping
          const flatPermissions: any[] = [];
          const flatten = (nodes: BackendMenu[], level = 0) => {
            nodes.forEach(node => {
              const existing = role?.menus?.find((m: any) => (m.menu?.id || m.menuId) === node.id);
              flatPermissions.push({
                menuId: node.id,
                menuName: node.name,
                level: level,
                isRead: existing?.isRead ?? false,
                isCreate: existing?.isCreate ?? false,
                isUpdate: existing?.isUpdate ?? false,
                isDelete: existing?.isDelete ?? false,
              });
              if (node.children) flatten(node.children, level + 1);
            });
          };
          
          flatten(response.data);
          replace(flatPermissions);
        }
      } catch (error) {
        toast.error('Failed to fetch menus');
      }
    };

    if (isOpen) {
      if (role) {
        form.reset({
          name: role.name,
          description: role.description,
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

  const handleCheckboxChange = (index: number, field: string, value: boolean) => {
    const current = form.getValues(`permissions.${index}`);
    const updated = { ...current, [field]: value };

    // Smart logic: If Create/Update/Delete is checked, Read MUST be checked
    if ((field === 'isCreate' || field === 'isUpdate' || field === 'isDelete') && value === true) {
      updated.isRead = true;
    }
    
    // If Read is unchecked, everything else MUST be unchecked
    if (field === 'isRead' && value === false) {
      updated.isCreate = false;
      updated.isUpdate = false;
      updated.isDelete = false;
    }

    update(index, updated);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{role ? 'Edit Role' : 'Add New Role'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                rules={{ required: 'Role name is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role Name</FormLabel>
                    <FormControl>
                      <Input placeholder="ADMIN" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Administrator access" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Permissions Matrix</FormLabel>
                <div className="text-[10px] text-muted-foreground italic">
                  * Checking Create/Update/Delete automatically enables Read
                </div>
              </div>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[300px]">Menu Hierarchy</TableHead>
                      <TableHead className="text-center w-[100px]">Read</TableHead>
                      <TableHead className="text-center w-[100px]">Create</TableHead>
                      <TableHead className="text-center w-[100px]">Update</TableHead>
                      <TableHead className="text-center w-[100px]">Delete</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id} className="hover:bg-accent/30">
                        <TableCell 
                          className="font-medium"
                          style={{ paddingLeft: `${(field as any).level * 24 + 16}px` }}
                        >
                          {(field as any).menuName}
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={form.watch(`permissions.${index}.isRead`)}
                            onCheckedChange={(v) => handleCheckboxChange(index, 'isRead', v as boolean)}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={form.watch(`permissions.${index}.isCreate`)}
                            onCheckedChange={(v) => handleCheckboxChange(index, 'isCreate', v as boolean)}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={form.watch(`permissions.${index}.isUpdate`)}
                            onCheckedChange={(v) => handleCheckboxChange(index, 'isUpdate', v as boolean)}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={form.watch(`permissions.${index}.isDelete`)}
                            onCheckedChange={(v) => handleCheckboxChange(index, 'isDelete', v as boolean)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {role ? 'Update Role' : 'Create Role'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
