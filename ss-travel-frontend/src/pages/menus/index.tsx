import ConfirmDialog from '@/components/shared/confirm-dialog';
import Heading from '@/components/shared/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getIcon } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermission } from '@/hooks/use-permission';
import { cn } from '@/lib/utils';
import { MenuService } from '@/services/menu.service';
import type { BackendMenu, MenuFormData } from '@/types';
import {
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Edit,
  FolderTree,
  Globe,
  KeyRound,
  LayoutGrid,
  Monitor,
  Plus,
  PlusCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import MenuModal from './components/menu-modal';

type FilterType = 'all' | 'group' | 'route' | 'inactive';

export default function MenusPage() {
  const { isCreate, isUpdate, isDelete } = usePermission();
  const [menus, setMenus] = useState<BackendMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<BackendMenu | null>(null);
  const [fixedParentId, setFixedParentId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // ConfirmDialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    menuId?: string;
    isLoading: boolean;
  }>({
    open: false,
    title: '',
    description: '',
    isLoading: false,
  });

  // Debounce search 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const response = await MenuService.getTree();
      if (response.status) {
        setMenus(response.data || []);
      }
    } catch (error) {
      toast.error('Gagal mengambil data menu navigasi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  // Collect all menu IDs recursively helper
  const getAllMenuIds = (list: BackendMenu[]): string[] => {
    const ids: string[] = [];
    const traverse = (items: BackendMenu[]) => {
      for (const item of items) {
        if (item.children && item.children.length > 0) {
          ids.push(item.id);
          traverse(item.children);
        }
      }
    };
    traverse(list);
    return ids;
  };

  // Expand / Collapse all
  const handleExpandAll = () => {
    const allIds = getAllMenuIds(menus);
    const newExpanded: Record<string, boolean> = {};
    allIds.forEach((id) => {
      newExpanded[id] = true;
    });
    setExpanded(newExpanded);
  };

  const handleCollapseAll = () => {
    setExpanded({});
  };

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

  const handleDeleteClick = (menu: BackendMenu) => {
    const childCount = menu.children ? menu.children.length : 0;
    setConfirmDialog({
      open: true,
      title: `Hapus Menu: ${menu.name}?`,
      description: childCount > 0
        ? `Menu ini memiliki ${childCount} sub-menu di dalamnya. Menghapus menu ini akan menghapus seluruh sub-menu tersebut secara permanen. Apakah Anda yakin?`
        : 'Menu ini akan dihapus secara permanen dari sistem navigasi aplikasi. Tindakan ini tidak dapat dibatalkan.',
      menuId: menu.id,
      isLoading: false,
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDialog.menuId) return;
    try {
      setConfirmDialog((prev) => ({ ...prev, isLoading: true }));
      await MenuService.remove(confirmDialog.menuId);
      toast.success('Menu berhasil dihapus dari sistem');
      setConfirmDialog((prev) => ({ ...prev, open: false, isLoading: false }));
      fetchMenus();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menghapus menu');
      setConfirmDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleSubmit = async (data: MenuFormData) => {
    try {
      setSubmitting(true);
      const payload = {
        ...data,
        parentId:
          !data.parentId || data.parentId === 'none' || data.parentId === ''
            ? undefined
            : data.parentId,
      };

      if (selectedMenu) {
        await MenuService.update(selectedMenu.id, payload);
        toast.success(`Menu "${data.name}" berhasil diperbarui`);
      } else {
        await MenuService.create(payload);
        toast.success(`Menu "${data.name}" berhasil ditambahkan`);
      }
      setIsModalOpen(false);
      fetchMenus();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Terjadi kesalahan saat memproses data menu');
    } finally {
      setSubmitting(false);
    }
  };

  // Recursive statistics calculation
  const stats = useMemo(() => {
    let total = 0;
    let groups = 0;
    let routes = 0;
    let active = 0;
    let inactive = 0;
    let mobile = 0;

    const countItems = (items: BackendMenu[]) => {
      for (const item of items) {
        total++;
        if (item.title || (item.children && item.children.length > 0)) {
          groups++;
        }
        if (!item.title && item.url && item.url !== '#') {
          routes++;
        }
        if (item.isActive) {
          active++;
        } else {
          inactive++;
        }
        if (item.isMobile) {
          mobile++;
        }
        if (item.children && item.children.length > 0) {
          countItems(item.children);
        }
      }
    };

    countItems(menus);
    return { total, groups, routes, active, inactive, mobile };
  }, [menus]);

  // Recursive search and filter logic
  const filterMenuNode = (
    item: BackendMenu,
    query: string,
    filter: FilterType
  ): BackendMenu | null => {
    // 1. Check filter matches
    let matchesFilter = true;
    if (filter === 'group') {
      matchesFilter = Boolean(item.title || (item.children && item.children.length > 0));
    } else if (filter === 'route') {
      matchesFilter = Boolean(!item.title && item.url && item.url !== '#');
    } else if (filter === 'inactive') {
      matchesFilter = !item.isActive;
    }

    // 2. Check query matches
    const qLower = query.toLowerCase();
    const matchesQuery =
      !query ||
      item.name.toLowerCase().includes(qLower) ||
      (item.url && item.url.toLowerCase().includes(qLower)) ||
      (item.aclName && item.aclName.toLowerCase().includes(qLower)) ||
      (item.availableActions &&
        item.availableActions.some((act) => act.toLowerCase().includes(qLower)));

    // 3. Process children recursively
    let filteredChildren: BackendMenu[] = [];
    if (item.children && item.children.length > 0) {
      filteredChildren = item.children
        .map((child) => filterMenuNode(child, query, filter))
        .filter((child): child is BackendMenu => child !== null);
    }

    // If query or filter is active, node is kept if it matches OR any child matches
    if (query || filter !== 'all') {
      const selfMatches = matchesQuery && matchesFilter;
      const childMatches = filteredChildren.length > 0;

      if (selfMatches || childMatches) {
        return {
          ...item,
          children: filteredChildren,
        };
      }
      return null;
    }

    return item;
  };

  const filteredMenus = useMemo(() => {
    if (!debouncedSearch && activeFilter === 'all') {
      return menus;
    }
    return menus
      .map((item) => filterMenuNode(item, debouncedSearch, activeFilter))
      .filter((item): item is BackendMenu => item !== null);
  }, [menus, debouncedSearch, activeFilter]);

  // Auto-expand nodes when searching so user sees matches immediately
  useEffect(() => {
    if (debouncedSearch) {
      const matchIds = getAllMenuIds(filteredMenus);
      const newExpanded: Record<string, boolean> = {};
      matchIds.forEach((id) => {
        newExpanded[id] = true;
      });
      setExpanded(newExpanded);
    }
  }, [debouncedSearch, filteredMenus]);

  const renderIcon = (iconName?: string) => {
    if (!iconName) {
      return (
        <span className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
          •
        </span>
      );
    }
    const Icon = getIcon(iconName);
    return (
      <span className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 transition-transform group-hover:scale-105">
        <Icon className="h-4 w-4" />
      </span>
    );
  };

  // Recursive Menu Row Component
  const MenuRow = ({
    menu,
    level = 0,
  }: {
    menu: BackendMenu;
    level?: number;
  }) => {
    if (!menu) return null;
    const hasChildren = Array.isArray(menu.children) && menu.children.length > 0;
    const isExpanded = expanded[menu.id] ?? false;

    return (
      <div className="relative">
        <div
          className={cn(
            'group flex items-center justify-between py-2.5 px-4 border-b border-border/40 hover:bg-accent/40 transition-all duration-150',
            menu.title && 'bg-primary/[0.03] font-semibold',
            !menu.isActive && 'opacity-60 bg-muted/20'
          )}
          style={{ paddingLeft: `${level * 24 + 16}px` }}
        >
          {/* Left Column: Expand toggle, Icon, Name, and Badges */}
          <div className="flex items-center min-w-0 flex-1 gap-2.5 mr-4">
            {/* Expand / Collapse toggle */}
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleExpand(menu.id)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title={isExpanded ? 'Tutup sub-menu' : 'Buka sub-menu'}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-primary" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <span className="w-6 shrink-0" />
            )}

            {/* Icon */}
            {renderIcon(menu.icon)}

            {/* Menu Name & Metadata */}
            <div className="flex items-center flex-wrap gap-2 min-w-0 flex-1">
              <span
                className={cn(
                  'text-sm font-medium truncate text-foreground',
                  menu.title && 'font-bold text-primary text-base'
                )}
              >
                {menu.name}
              </span>

              {/* Sequence */}
              <Badge
                variant="outline"
                className="text-[10px] h-4 px-1.5 font-mono text-muted-foreground border-border/60"
                title="Urutan tampilan"
              >
                #{menu.sequence ?? 0}
              </Badge>

              {/* Group Indicator */}
              {menu.title && (
                <Badge
                  variant="outline"
                  className="text-[10px] h-4 px-1.5 bg-primary/10 text-primary border-primary/30 font-semibold"
                >
                  GROUP
                </Badge>
              )}

              {/* Sub-menu counter chip */}
              {hasChildren && (
                <Badge
                  variant="secondary"
                  className="text-[10px] h-4 px-1.5 bg-secondary text-secondary-foreground"
                >
                  {menu.children?.length} sub-menu
                </Badge>
              )}

              {/* URL Path */}
              {menu.url && (
                <span className="text-[11px] font-mono text-muted-foreground bg-muted/80 px-2 py-0.5 rounded border border-border/50 truncate max-w-64">
                  {menu.url}
                </span>
              )}

              {/* ACL Key */}
              {menu.aclName && (
                <Badge
                  variant="outline"
                  className="text-[10px] h-4 px-1.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 font-mono flex items-center gap-1"
                >
                  <KeyRound className="h-2.5 w-2.5" />
                  {menu.aclName}
                </Badge>
              )}

              {/* Custom Actions */}
              {menu.availableActions && menu.availableActions.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  {menu.availableActions.map((act) => (
                    <span
                      key={act}
                      className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-mono"
                    >
                      {act}
                    </span>
                  ))}
                </div>
              )}

              {/* Platform indicators */}
              <div className="flex items-center gap-1">
                {menu.isWeb && (
                  <span title="Tampil di Web" className="text-muted-foreground">
                    <Monitor className="h-3.5 w-3.5" />
                  </span>
                )}
                {menu.isMobile && (
                  <span title="Tampil di Mobile" className="text-muted-foreground">
                    <Smartphone className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>

              {/* Inactive Badge */}
              {!menu.isActive && (
                <Badge
                  variant="destructive"
                  className="text-[10px] h-4 px-1.5 font-semibold"
                >
                  NON-AKTIF
                </Badge>
              )}
            </div>
          </div>

          {/* Right Column: Actions (Visible on hover or mobile) */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isCreate && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-primary hover:bg-primary/10 font-medium"
                title="Tambah Sub-Menu di bawah menu ini"
                onClick={() => handleCreateChild(menu.id)}
              >
                <PlusCircle className="h-3.5 w-3.5 mr-1" />
                Sub
              </Button>
            )}
            {isUpdate && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-foreground hover:bg-accent"
                title="Edit Konfigurasi Menu"
                onClick={() => handleEdit(menu)}
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
            )}
            {isDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                title="Hapus Menu"
                onClick={() => handleDeleteClick(menu)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Children Rows */}
        {hasChildren && isExpanded && (
          <div className="relative border-l border-primary/20 ml-7 transition-all">
            {menu.children?.map((child) => (
              <MenuRow
                key={child.id}
                menu={child}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <Heading
          title="Manajemen Menu Sistem"
          description="Konfigurasi hirarki navigasi aplikasi, routing URL halaman, dan parameter ACL RBAC."
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMenus}
            disabled={loading}
            className="h-10 px-3 border-border/60 hover:bg-secondary"
            title="Muat Ulang Data Menu"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>

          {isCreate && (
            <Button
              onClick={handleCreateMainMenu}
              className="h-10 px-4 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
            >
              <Plus className="mr-2 h-4 w-4" /> Tambah Menu Utama
            </Button>
          )}
        </div>
      </div>

      {/* 4 KPI Glassmorphism Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Menu */}
        <Card className="backdrop-blur-md bg-card/60 dark:bg-card/40 border-l-4 border-l-emerald-500 border border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Item Menu
              </p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-[11px] text-muted-foreground">Seluruh entri navigasi</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <LayoutGrid className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Menu Utama / Folder Grup */}
        <Card className="backdrop-blur-md bg-card/60 dark:bg-card/40 border-l-4 border-l-blue-500 border border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Menu Grup / Induk
              </p>
              <p className="text-2xl font-bold text-foreground">{stats.groups}</p>
              <p className="text-[11px] text-muted-foreground">Kategori dan wadah folder</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FolderTree className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Rute Fitur & Navigasi */}
        <Card className="backdrop-blur-md bg-card/60 dark:bg-card/40 border-l-4 border-l-indigo-500 border border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Rute Navigasi Aktif
              </p>
              <p className="text-2xl font-bold text-foreground">{stats.routes}</p>
              <p className="text-[11px] text-muted-foreground">Halaman endpoint modul</p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Globe className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Kesiapan Status */}
        <Card className="backdrop-blur-md bg-card/60 dark:bg-card/40 border-l-4 border-l-amber-500 border border-border/50 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status Operasional
              </p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {stats.active}
                </span>
                <span className="text-xs text-muted-foreground">Aktif</span>
                {stats.inactive > 0 && (
                  <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                    {stats.inactive} Non-Aktif
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">{stats.mobile} siap mobile</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Bar: Search, Filter Chips, and Expand/Collapse */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border border-border/60 backdrop-blur-md bg-card/60">
        {/* Left: Search with Debounce & Clear */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama menu, URL path, ACL key, atau aksi..."
            className="pl-9 pr-8 h-9 text-sm bg-background/50 border-border/60"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Middle: Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            type="button"
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('all')}
            className="h-8 text-xs rounded-lg"
          >
            Semua ({stats.total})
          </Button>
          <Button
            type="button"
            variant={activeFilter === 'group' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('group')}
            className="h-8 text-xs rounded-lg"
          >
            Grup ({stats.groups})
          </Button>
          <Button
            type="button"
            variant={activeFilter === 'route' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('route')}
            className="h-8 text-xs rounded-lg"
          >
            Rute ({stats.routes})
          </Button>
          {stats.inactive > 0 && (
            <Button
              type="button"
              variant={activeFilter === 'inactive' ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('inactive')}
              className="h-8 text-xs rounded-lg"
            >
              Non-Aktif ({stats.inactive})
            </Button>
          )}
        </div>

        {/* Right: Expand / Collapse All */}
        <div className="flex items-center gap-1.5 border-t sm:border-t-0 pt-2 sm:pt-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleExpandAll}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            title="Buka semua sub-menu"
          >
            <ChevronsUpDown className="h-3.5 w-3.5 mr-1" />
            Buka Semua
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCollapseAll}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            title="Tutup semua sub-menu"
          >
            <ChevronsDownUp className="h-3.5 w-3.5 mr-1" />
            Tutup Semua
          </Button>
        </div>
      </div>

      {/* Hierarchical Menu Tree Card */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between py-3.5 px-4 border-b border-border/60 bg-muted/40 font-semibold text-sm">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-primary" />
            <span>Struktur Hirarki Menu & Otorisasi RBAC</span>
          </div>
          <span className="text-xs text-muted-foreground font-normal">
            Menampilkan {filteredMenus.length} cabang menu utama
          </span>
        </div>

        <div className="flex flex-col">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2.5 px-3 border-b border-border/30"
                  style={{ paddingLeft: `${(i % 3) * 24 + 12}px` }}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-7 w-7 rounded-lg" />
                    <Skeleton className="h-4 w-36 rounded" />
                    <Skeleton className="h-4 w-20 rounded-full" />
                    <Skeleton className="h-4 w-28 rounded" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-7 w-12 rounded" />
                    <Skeleton className="h-7 w-7 rounded" />
                    <Skeleton className="h-7 w-7 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMenus.length > 0 ? (
            filteredMenus.map((menu) => (
              <MenuRow
                key={menu.id}
                menu={menu}
                level={0}
              />
            ))
          ) : (
            <div className="p-16 text-center text-muted-foreground flex flex-col items-center gap-3">
              <FolderTree className="h-12 w-12 opacity-20 text-muted-foreground" />
              <p className="font-medium text-foreground">
                {debouncedSearch || activeFilter !== 'all'
                  ? 'Tidak ada menu yang sesuai dengan filter atau pencarian Anda.'
                  : 'Belum ada menu yang dibuat di sistem.'}
              </p>
              <p className="text-xs max-w-md text-muted-foreground">
                {debouncedSearch || activeFilter !== 'all'
                  ? 'Coba gunakan kata kunci lain atau bersihkan filter pencarian.'
                  : 'Mulai dengan menambahkan menu utama navigasi untuk mengatur struktur aplikasi.'}
              </p>
              {debouncedSearch || activeFilter !== 'all' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveFilter('all');
                  }}
                  className="mt-2 text-xs"
                >
                  Reset Filter & Pencarian
                </Button>
              ) : isCreate ? (
                <Button
                  size="sm"
                  onClick={handleCreateMainMenu}
                  className="mt-2 bg-primary text-primary-foreground"
                >
                  <Plus className="mr-1.5 h-4 w-4" /> Tambah Menu Utama Sekarang
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Menu Form Modal */}
      <MenuModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        menu={selectedMenu}
        menus={menus}
        loading={submitting}
        fixedParentId={fixedParentId}
      />

      {/* ConfirmDialog for Deletions */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog((prev) => ({ ...prev, open }))
        }
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant="danger"
        confirmText="Hapus Menu"
        cancelText="Batal"
        isLoading={confirmDialog.isLoading}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
