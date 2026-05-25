import DashboardNav from '@/components/shared/dashboard-nav';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/use-auth';
import type { NavItem } from '@/types';
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
      return authMenus.map((menu) => ({
        title: menu.name,
        href: menu.url || '',
        icon: menu.icon,
        label: menu.name
      }));
    } catch (error) {
      console.error('Error parsing menus from auth context', error);
      return [];
    }
  }, [authMenus]);

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent side="left" className="bg-background px-0!">
        <div className="space-y-4 py-4">
          <div className="space-y-4 px-3 py-2">
            <Link to="/" className="px-2 py-2 text-2xl font-bold text-[#1cb85a]">
              SS TRAVEL
            </Link>
            <div className="space-y-1 px-2">
              <DashboardNav items={navItems} setOpen={setSidebarOpen} isMobileNav={true} />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
