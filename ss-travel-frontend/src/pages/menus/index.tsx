import { useState, useEffect } from 'react';
import Heading from '@/components/shared/heading';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, ChevronRight, ChevronDown, LayoutGrid } from 'lucide-react';
import { MenuService } from '@/services/menu.service';
import type { BackendMenu, MenuFormData } from '@/types';
import { toast } from 'sonner';
import MenuModal from './components/menu-modal';
import * as Icons from 'lucide-react';
import { usePermission } from '@/hooks/use-permission';

export default function MenusPage() {
  const { isCreate, isUpdate, isDelete } = usePermission();
  const [menus, setMenus] = useState<BackendMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<BackendMenu | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const response = await MenuService.getTree();
      if (response.status) {
        setMenus(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch menus');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreate = () => {
    setSelectedMenu(null);
    setIsModalOpen(true);
  };

  const handleEdit = (menu: BackendMenu) => {
    setSelectedMenu(menu);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this menu? Children will also be affected if any.')) {
      try {
        await MenuService.remove(id);
        toast.success('Menu deleted successfully');
        fetchMenus();
      } catch (error) {
        toast.error('Failed to delete menu');
      }
    }
  };

  const handleSubmit = async (data: MenuFormData) => {
    try {
      setSubmitting(true);
      // Clean up parentId if "none" and parse availableActions string to array if needed
      const availableActions = typeof data.availableActions === 'string' 
        ? (data.availableActions as string).split(',').map(s => s.trim()).filter(s => s !== '')
        : data.availableActions;

      const payload = { 
        ...data, 
        parentId: (!data.parentId || data.parentId === 'none' || data.parentId === '') ? undefined : data.parentId,
        availableActions
      };
      
      if (selectedMenu) {
        await MenuService.update(selectedMenu.id, payload);
        toast.success('Menu updated successfully');
      } else {
        await MenuService.create(payload);
        toast.success('Menu created successfully');
      }
      setIsModalOpen(false);
      fetchMenus();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const renderIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Icons.HelpCircle;
    return <Icon className="h-4 w-4 mr-2 text-muted-foreground" />;
  };

  const MenuRow = ({ menu, level = 0 }: { menu: BackendMenu; level?: number }) => {
    if (!menu) return null;
    const isExpanded = expanded[menu.id];
    const hasChildren = Array.isArray(menu.children) && menu.children.length > 0;

    return (
      <>
        <div 
          className="group flex items-center py-2 px-4 border-b hover:bg-accent/50 transition-colors"
          style={{ paddingLeft: `${level * 24 + 16}px` }}
        >
          <div className="flex items-center flex-1">
            <button 
              onClick={() => toggleExpand(menu.id)}
              className={`p-1 mr-1 rounded hover:bg-accent ${!hasChildren && 'invisible'}`}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            {menu.icon && renderIcon(menu.icon)}
            <span className="font-medium">{menu.name || 'Unnamed Menu'}</span>
            <span className="ml-3 text-xs text-muted-foreground bg-accent px-2 py-0.5 rounded">
              {menu.url || '#'}
            </span>
            {!menu.isActive && (
              <span className="ml-2 text-[10px] uppercase font-bold text-destructive bg-destructive/10 px-1.5 rounded">
                Inactive
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {isUpdate && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(menu)}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {isDelete && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(menu.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {menu.children?.map((child) => (
              <MenuRow key={child.id} menu={child} level={level + 1} />
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <Heading
          title="Menu Management"
          description="Manage the hierarchical application navigation structure."
        />
        {isCreate && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Menu
          </Button>
        )}
      </div>

      <div className="rounded-md border bg-card">
        <div className="flex items-center py-3 px-4 border-b bg-muted/50 font-semibold text-sm">
          <LayoutGrid className="h-4 w-4 mr-2" />
          <span>Menu Structure (Drag & Drop Coming Soon)</span>
        </div>
        <div className="flex flex-col">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading menu structure...</div>
          ) : menus.length > 0 ? (
            menus.map((menu) => <MenuRow key={menu.id} menu={menu} />)
          ) : (
            <div className="p-8 text-center text-muted-foreground">No menus found. Click "Add Menu" to get started.</div>
          )}
        </div>
      </div>

      <MenuModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        menu={selectedMenu}
        menus={menus}
        loading={submitting}
      />
    </div>
  );
}
