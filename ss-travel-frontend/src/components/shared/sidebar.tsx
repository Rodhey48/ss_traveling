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
        `hidden md:block bg-white/80 dark:bg-zinc-900/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] text-slate-600 dark:text-slate-300 text-sm rounded-4xl border border-slate-200/80 dark:border-zinc-800 backdrop-blur-xl transition-all duration-300 shrink-0 my-3 ml-4 h-[calc(100vh-105px)] overflow-hidden select-none`,
        status && 'duration-500',
        !isMinimized ? 'w-70' : 'w-18.75',
        className
      )}
    >
      <div className="flex h-full flex-col min-h-0">
        {/* Header non-scroll */}
        <div className="shrink-0 p-4 border-b border-slate-200/60 dark:border-zinc-800 bg-transparent">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggle}
              title={isMinimized ? 'Perluas Sidebar' : 'Kecilkan Sidebar'}
              className="h-10 w-10 shrink-0 rounded-2xl bg-slate-500/5 dark:bg-white/10 hover:bg-slate-500/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center border border-slate-200/50 dark:border-zinc-700 shadow-2xs"
            >
              <ChevronLeft
                className={cn(
                  'size-4.5 transition-transform duration-200',
                  isMinimized && 'rotate-180'
                )}
              />
            </button>
            {!isMinimized && (
              <div className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex-1 truncate tracking-tight">
                Menu Utama
              </div>
            )}
          </div>
        </div>

        {/* Nav Items Scroll Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-3 py-3">
          <DashboardNav items={navItems} />
        </div>

        {/* Sidebar Footer Status */}
        <div className="p-3 border-t border-slate-200/60 dark:border-zinc-800 bg-slate-500/5 dark:bg-white/5 rounded-b-4xl">
          {!isMinimized ? (
            <div className="flex flex-col gap-1 px-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-700 dark:text-slate-300">SS Travelink</span>
                <span className="font-mono text-[9px] bg-slate-500/10 dark:bg-white/10 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded-full border border-slate-200/40 dark:border-zinc-700">v1.3</span>
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
      </div>
    </nav>
  );
}
