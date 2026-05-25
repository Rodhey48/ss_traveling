import DashboardNav from '@/components/shared/dashboard-nav';
import { useAuth } from '@/hooks/use-auth';
import { useSidebar } from '@/hooks/use-sidebar';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';
import type { BackendMenu, NavItem } from '@/types';
import {
  ChevronLeft,
  LogOut,
  Moon,
  Settings,
  Sparkles,
  Sun
} from 'lucide-react';
import { useEffect, useState } from 'react';

type SidebarProps = {
  className?: string;
};

export default function Sidebar({ className }: SidebarProps) {
  const { isMinimized, toggle } = useSidebar();
  const { user, menus: authMenus, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [status, setStatus] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
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

  const handleLogout = () => {
    logout();
  };

  return (
    <nav
      className={cn(
        `hidden h-screen flex-none bg-secondary px-3 md:block`,
        status && 'duration-500',
        !isMinimized ? 'w-72' : 'w-20',
        className
      )}
    >

      <div
        className={cn(
          'flex items-center px-0 py-1 md:px-2',
          isMinimized ? 'flex-col justify-center' : 'justify-between'
        )}
      >
        {!isMinimized && (
          <div className="flex h-20 items-center text-xl font-bold tracking-widest text-[#1cb85a]">
            SS TRAVEL
          </div>
        )}
        <ChevronLeft
          className={cn(
            'size-8 cursor-pointer rounded-full border bg-background text-foreground transition-all',
            isMinimized && 'rotate-180'
          )}
          onClick={handleToggle}
        />
      </div>

      <div className="flex h-[calc(100vh-100px)] flex-col justify-between">
        <div className="space-y-4 py-4">
          <div className="px-2 py-2">
            <div className="mt-3 space-y-1">
              <DashboardNav items={navItems} />
            </div>
          </div>
        </div>

        <div className="relative p-3">
          <button
            className="flex w-full items-center rounded-lg bg-secondary p-2 hover:bg-accent transition-colors"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
              {user ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            {!isMinimized && (
              <div className="ml-3 flex-1 text-left">
                <p className="font-semibold text-foreground truncate">
                  {user ? user.name : 'User Name'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user ? user.email : 'user@example.com'}
                </p>
              </div>
            )}
          </button>

          {showDropdown && (
            <div className="absolute bottom-16 left-0 w-full rounded-lg border bg-background p-2 shadow-lg animate-in fade-in slide-in-from-bottom-2">
              <button className="flex w-full items-center gap-2 rounded-lg p-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground">
                <Sparkles className="size-4" /> Profile
              </button>
              <button className="flex w-full items-center gap-2 rounded-lg p-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground">
                <Settings className="size-4" /> Setting
              </button>
              <button
                className="flex w-full items-center gap-2 rounded-lg p-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
              <hr className="my-2 border-border" />
              <button
                className="flex w-full items-center gap-2 rounded-lg p-2 text-sm text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="size-4" /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
