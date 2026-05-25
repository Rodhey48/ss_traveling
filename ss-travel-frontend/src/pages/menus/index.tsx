import { useState, useEffect } from 'react';
import Heading from '@/components/shared/heading';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, ChevronRight, ChevronDown, LayoutGrid, PlusCircle } from 'lucide-react';
import { MenuService } from '@/services/menu.service';
import type { BackendMenu, MenuFormData } from '@/types';
import { toast } from 'sonner';
import MenuModal from './components/menu-modal';
import { getIcon } from '@/components/ui/icons';
import { usePermission } from '@/hooks/use-permission';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function MenusPage() {
  const { isCreate, isUpdate, isDelete } = usePermission();
  const [menus, setMenus] = useState<BackendMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<BackendMenu | null>(null);
  const [fixedParentId, setFixedParentId] = useState<string | null>(null);
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
      toast.error('Gagal mengambil data menu');
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

  const handleCreateMainMenu = () => {
    setSelectedMenu(null);
    setFixedParentId(null);
    setIsModalOpen(true);
  };

  const handleCreateChild = (parentId: string) => {
    setSelectedMenu(null);
    setFixedParentId(parentId);
    setIsModalOpen(true);
  };

  const handleEdit = (menu: BackendMenu) => {
    setSelectedMenu(menu);
    setFixedParentId(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus menu ini? Semua sub-menu di dalamnya juga akan terhapus.')) {
      try {
        await MenuService.remove(id);
        toast.success('Menu berhasil dihapus');
        fetchMenus();
      } catch (error) {
        toast.error('Gagal menghapus menu');
      }
    }
  };

  const handleSubmit = async (data: MenuFormData) => {
    try {
      setSubmitting(true);
      
      const payload = { 
        ...data, 
        parentId: (!data.parentId || data.parentId === 'none' || data.parentId === '') ? undefined : data.parentId,
      };
      
      if (selectedMenu) {
        await MenuService.update(selectedMenu.id, payload);
        toast.success('Menu berhasil diperbarui');
      } else {
        await MenuService.create(payload);
        toast.success('Menu berhasil dibuat');
      }
      setIsModalOpen(false);
      fetchMenus();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  const renderIcon = (iconName?: string) => {
    if (!iconName) return null;
    const Icon = getIcon(iconName);
    return <Icon className="h-4 w-4 mr-2 text-primary" />;
  };

  const MenuRow = ({ menu, level = 0 }: { menu: BackendMenu; level?: number }) => {
    if (!menu) return null;
    const isExpanded = expanded[menu.id];
    const hasChildren = Array.isArray(menu.children) && menu.children.length > 0;

    return (
      <>
        <div 
          className={cn(
            "group flex items-center py-2.5 px-4 border-b hover:bg-accent/40 transition-all",
            menu.title && "bg-primary/[0.02]"
          )}
          style={{ paddingLeft: `${level * 24 + 16}px` }}
        >
          <div className="flex items-center flex-1 min-w-0">
            <button 
              onClick={() => toggleExpand(menu.id)}
              className={cn(
                "p-1 mr-1 rounded hover:bg-accent transition-colors",
                !hasChildren && "invisible"
              )}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            
            <div className="flex items-center min-w-0 gap-2">
              {renderIcon(menu.icon)}
              <span className={cn(
                "font-medium truncate",
                menu.title && "text-primary font-bold"
              )}>
                {menu.name}
              </span>
              
              <div className="flex items-center gap-1.5 shrink-0">
                {menu.title && (
                  <Badge variant="outline" className="text-[10px] h-4 px-1 bg-primary/5 text-primary border-primary/20">GROUP</Badge>
                )}
                <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border">
                  {menu.url || '#'}
                </span>
                {!menu.isActive && (
                  <Badge variant="destructive" className="text-[10px] h-4 px-1">NON-AKTIF</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isCreate && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-primary hover:bg-primary/10" 
                title="Tambah Sub-Menu"
                onClick={() => handleCreateChild(menu.id)}
              >
                <PlusCircle className="h-4 w-4" />
              </Button>
            )}
            {isUpdate && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-accent" 
                title="Edit Menu"
                onClick={() => handleEdit(menu)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {isDelete && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-destructive hover:bg-destructive/10" 
                title="Hapus Menu"
                onClick={() => handleDelete(menu.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="bg-muted/10">
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
          title="Manajemen Menu"
          description="Atur struktur navigasi aplikasi secara hierarkis dengan mudah."
        />
        {isCreate && (
          <Button onClick={handleCreateMainMenu} className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" /> Tambah Menu Utama
          </Button>
        )}
      </div>

      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <div className="flex items-center py-3.5 px-4 border-b bg-muted/50 font-semibold text-sm">
          <LayoutGrid className="h-4 w-4 mr-2 text-primary" />
          <span>Struktur Hirarki Menu</span>
        </div>
        <div className="flex flex-col">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground animate-pulse">Memuat struktur menu...</div>
          ) : menus.length > 0 ? (
            menus.map((menu) => <MenuRow key={menu.id} menu={menu} />)
          ) : (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
              <LayoutGrid className="h-10 w-10 opacity-10" />
              <p>Belum ada menu yang dibuat. Klik "Tambah Menu Utama" untuk memulai.</p>
            </div>
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
        fixedParentId={fixedParentId}
      />
    </div>
  );
}
