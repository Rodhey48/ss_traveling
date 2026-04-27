import DashboardNav from '@/components/shared/dashboard-nav';
import { useSidebar } from '@/hooks/use-sidebar';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';
import {
  Bell,
  ChevronLeft,
  LogOut,
  Moon,
  Settings,
  Sparkles,
  Sun
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserLoginInfo, NavItem, BackendMenu } from '@/types';

type SidebarProps = {
  className?: string;
};

export default function Sidebar({ className }: SidebarProps) {
  const { isMinimized, toggle } = useSidebar();
  const { theme, setTheme } = useTheme();
  const [status, setStatus] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [user, setUser] = useState<UserLoginInfo | null>(null);
  const [menus, setMenus] = useState<NavItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedMenus = localStorage.getItem('menus');

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

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
  }, []);

  const handleToggle = () => {
    setStatus(true);
    toggle();
    setTimeout(() => setStatus(false), 500);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav
      className={cn(
        `relative z-10 hidden h-screen flex-none px-3 md:block`,
        status && 'duration-500',
        !isMinimized ? 'w-72' : 'w-[80px]',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center px-0 py-4 md:px-2',
          isMinimized ? 'flex-col justify-center' : 'justify-between'
        )}
      >
        {!isMinimized && (
          <div className="flex items-center text-xl font-bold tracking-widest text-[#1cb85a]">
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
              <DashboardNav items={menus} />
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
