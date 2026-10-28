import DashboardNav from '@/components/shared/dashboard-nav';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/use-auth';
import type { BackendMenu, NavItem } from '@/types';
import type { Dispatch, SetStateAction } from 'react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

type TMobileSidebarProps = {
  className?: string;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
  sidebarOpen: boolean;
};

export default function MobileSidebar({
  setSidebarOpen,
  sidebarOpen
}: TMobileSidebarProps) {
  const { menus: authMenus } = useAuth();

  const navItems = useMemo<NavItem[]>(() => {
    if (!authMenus) return [];
    try {
      const mapMenuToNavItem = (menu: BackendMenu): any => ({
        title: menu.name,
        href: menu.url || '',
        icon: menu.icon,
        label: menu.name,
        isParentGroup: menu.title,
        items: menu.children ? menu.children.map(mapMenuToNavItem) : []
      });

      return authMenus.map(mapMenuToNavItem);
    } catch (error) {
      console.error('Error parsing menus from auth context', error);
      return [];
    }
  }, [authMenus]);

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent side="left" className="bg-slate-100/95 dark:bg-card border-r border-slate-200/90 dark:border-border/60 text-foreground px-0! w-80 max-w-[85vw]">
        <div className="flex h-full flex-col py-4">
          <div className="px-5 py-2">
            <Link
              to="/"
              onClick={() => setSidebarOpen(false)}
              className="text-lg font-bold tracking-widest text-[#1cb85a]"
            >
              SS TRAVEL ERP
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-3 py-2">
            <DashboardNav items={navItems} setOpen={setSidebarOpen} isMobileNav={true} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
