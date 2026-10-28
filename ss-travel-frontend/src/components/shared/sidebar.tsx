import DashboardNav from '@/components/shared/dashboard-nav';
import { useAuth } from '@/hooks/use-auth';
import { useSidebar } from '@/hooks/use-sidebar';
import { cn } from '@/lib/utils';
import type { BackendMenu, NavItem } from '@/types';
import {
  Bell,
  ChevronLeft
} from 'lucide-react';
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
        `hidden h-screen flex-none bg-secondary px-2.5 md:block`,
        status && 'duration-500',
        !isMinimized ? 'w-80' : 'w-20',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center px-1 py-2 md:px-2',
          isMinimized ? 'flex-col justify-center gap-2' : 'justify-between'
        )}
      >
        {!isMinimized && (
          <div className="flex h-16 items-center text-lg font-bold tracking-widest text-[#1cb85a] truncate">
            {import.meta.env.VITE_APP_NAME || 'SS TRAVEL ERP'}
          </div>
        )}
        <ChevronLeft
          className={cn(
            'size-7.5 cursor-pointer rounded-full border bg-background text-foreground transition-all hover:bg-accent shrink-0 shadow-xs',
            isMinimized && 'rotate-180'
          )}
          onClick={handleToggle}
        />
      </div>

      <div className="flex h-[calc(100vh-80px)] flex-col justify-between">
        <div className="py-2 overflow-y-auto overflow-x-hidden custom-scrollbar pr-1">
          <div className="px-1">
            <DashboardNav items={navItems} />
          </div>
        </div>

        <div className="relative p-2 border-t border-border/50">
          <button
            className={cn(
              "flex w-full items-center rounded-xl bg-background/50 backdrop-blur-sm p-2 hover:bg-accent transition-all duration-300 shadow-sm border border-border/40 group",
              isMinimized ? "justify-center" : "justify-between"
            )}
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="p-1.5 rounded-lg bg-primary/5 text-primary group-hover:bg-primary/10 transition-colors">
                  <Bell className="size-4.5" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 size-2 bg-red-500 border-2 border-background rounded-full" />
              </div>
              {!isMinimized && (
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-foreground">Notifikasi</span>
                  <span className="text-[10px] text-muted-foreground">3 pesan baru</span>
                </div>
              )}
            </div>
          </button>
        </div>
      </div>
    </nav>
  );
}
