import DashboardNav from '@/components/shared/dashboard-nav';
import { useAuth } from '@/hooks/use-auth';
import { useSidebar } from '@/hooks/use-sidebar';
import { cn } from '@/lib/utils';
import type { BackendMenu, NavItem } from '@/types';
import { ChevronLeft } from 'lucide-react';
import { useEffect, useState } from 'react';

type SidebarProps = {
  className?: string;
};

export default function Sidebar({ className }: SidebarProps) {
  const { isMinimized, toggle } = useSidebar();
  const { menus: authMenus } = useAuth();
  const [status, setStatus] = useState(false);
  const [navItems, setNavItems] = useState<NavItem[]>([]);

  useEffect(() => {
    if (authMenus) {
      try {
        const mapMenuToNavItem = (menu: BackendMenu): any => ({
          title: menu.name,
          href: menu.url || '',
          icon: menu.icon,
          label: menu.name,
          isParentGroup: menu.title,
          items: menu.children ? menu.children.map(mapMenuToNavItem) : []
        });

        const mappedMenus: any[] = authMenus.map(mapMenuToNavItem);
        setNavItems(mappedMenus);
      } catch (error) {
        console.error('Error mapping menus to nav items', error);
      }
    }
  }, [authMenus]);

  const handleToggle = () => {
    setStatus(true);
    toggle();
    setTimeout(() => setStatus(false), 500);
  };

  return (
    <nav
      className={cn(
        `hidden h-screen flex-none border-r border-slate-200/90 dark:border-border/60 bg-slate-100/90 dark:bg-card/95 text-foreground shadow-xs md:flex md:flex-col justify-between select-none`,
        status && 'duration-500',
        !isMinimized ? 'w-80' : 'w-20',
        className
      )}
    >
      {/* Sidebar Brand Header */}
      <div
        className={cn(
          'flex h-16 items-center border-b border-slate-200/80 dark:border-border/60 px-3 bg-slate-100/50 dark:bg-card/40',
          isMinimized ? 'flex-col justify-center gap-1.5' : 'justify-between'
        )}
      >
        {!isMinimized && (
          <div className="flex items-center gap-2 font-black tracking-widest text-[#1cb85a] truncate text-base pl-1">
            <span>{import.meta.env.VITE_APP_NAME || 'SS TRAVEL ERP'}</span>
          </div>
        )}
        <button
          type="button"
          onClick={handleToggle}
          title={isMinimized ? 'Perluas Sidebar' : 'Kecilkan Sidebar'}
          className={cn(
            'size-7 cursor-pointer rounded-full border border-slate-200 dark:border-border/80 bg-white dark:bg-card text-foreground transition-all hover:bg-slate-200/60 dark:hover:bg-accent flex items-center justify-center shrink-0 shadow-xs'
          )}
        >
          <ChevronLeft
            className={cn(
              'size-4 transition-transform duration-200',
              isMinimized && 'rotate-180'
            )}
          />
        </button>
      </div>

      {/* Nav Items Scroll Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-3 px-2">
        <DashboardNav items={navItems} />
      </div>

      {/* Sidebar Footer Status */}
      <div className="border-t border-slate-200/80 dark:border-border/60 bg-slate-200/40 dark:bg-muted/10 p-3">
        {!isMinimized ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">SS Travelink</span>
              <span className="font-mono text-[9px] bg-white dark:bg-secondary text-foreground px-1.5 py-0.5 rounded border border-slate-200/80 dark:border-border/60">v1.3</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sistem Terhubung Realtime</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title="Sistem Aktif & Terhubung">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        )}
      </div>
    </nav>
  );
}
