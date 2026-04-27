import DashboardNav from '@/components/shared/dashboard-nav';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { NavItem, BackendMenu } from '@/types';

type TMobileSidebarProps = {
  className?: string;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
  sidebarOpen: boolean;
};

export default function MobileSidebar({
  setSidebarOpen,
  sidebarOpen
}: TMobileSidebarProps) {
  const [menus, setMenus] = useState<NavItem[]>([]);

  useEffect(() => {
    const storedMenus = localStorage.getItem('menus');

    if (storedMenus) {
      try {
        const parsedMenus: BackendMenu[] = JSON.parse(storedMenus);
        const mappedMenus: NavItem[] = parsedMenus.map((menu) => ({
          title: menu.name,
          href: menu.url,
          icon: menu.icon,
          label: menu.name
        }));
        setMenus(mappedMenus);
      } catch (error) {
        console.error('Error parsing menus from localStorage', error);
      }
    }
  }, [sidebarOpen]);

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent side="left" className="bg-background !px-0">
        <div className="space-y-4 py-4">
          <div className="space-y-4 px-3 py-2">
            <Link to="/" className="px-2 py-2 text-2xl font-bold text-[#1cb85a]">
              SS TRAVEL
            </Link>
            <div className="space-y-1 px-2">
              <DashboardNav items={menus} setOpen={setSidebarOpen} isMobileNav={true} />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
