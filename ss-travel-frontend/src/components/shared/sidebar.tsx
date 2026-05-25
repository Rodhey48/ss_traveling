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
import ProfileModal from './profile-modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type SidebarProps = {
  className?: string;
};

export default function Sidebar({ className }: SidebarProps) {
  const { isMinimized, toggle } = useSidebar();
  const { user, menus: authMenus, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [status, setStatus] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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
        <div className="space-y-4 py-4 overflow-y-auto custom-scrollbar">
          <div className="px-2 py-2">
            <div className="mt-3 space-y-1">
              <DashboardNav items={navItems} />
            </div>
          </div>
        </div>

        <div className="relative p-3 border-t border-border/50">
          <button
            className="flex w-full items-center rounded-xl bg-background/50 backdrop-blur-sm p-2 hover:bg-accent transition-all duration-300 shadow-sm border border-border/40"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <Avatar className="size-10 border border-primary/20 shadow-sm">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {user ? user.name.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            
            {!isMinimized && (
              <div className="ml-3 flex-1 text-left overflow-hidden">
                <p className="font-bold text-sm text-foreground truncate">
                  {user ? user.name : 'User Name'}
                </p>
                <p className="text-[11px] text-muted-foreground truncate opacity-80">
                  {user ? user.email : 'user@example.com'}
                </p>
              </div>
            )}
          </button>

          {showDropdown && (
            <div className="absolute bottom-20 left-0 w-[calc(100%+0px)] mx-3 -ml-0 rounded-2xl border border-border/50 bg-background/95 backdrop-blur-md p-2 shadow-2xl animate-in fade-in slide-in-from-bottom-4 z-50">
              <div className="px-2 py-1.5 mb-2 border-b border-border/50">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Akun Saya</p>
              </div>
              <button 
                className="flex w-full items-center gap-3 rounded-xl p-2.5 text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-all group"
                onClick={() => {
                  setIsProfileOpen(true);
                  setShowDropdown(false);
                }}
              >
                <div className="p-1.5 rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors">
                  <Sparkles className="size-4" />
                </div>
                <span className="font-medium">Profil & Keamanan</span>
              </button>
              
              <button className="flex w-full items-center gap-3 rounded-xl p-2.5 text-sm text-foreground hover:bg-accent transition-all group">
                <div className="p-1.5 rounded-lg bg-secondary/50 group-hover:bg-secondary transition-colors">
                  <Settings className="size-4" />
                </div>
                <span className="font-medium">Pengaturan</span>
              </button>

              <button
                className="flex w-full items-center gap-3 rounded-xl p-2.5 text-sm text-foreground hover:bg-accent transition-all group"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                <div className="p-1.5 rounded-lg bg-secondary/50 group-hover:bg-secondary transition-colors">
                  {theme === 'dark' ? <Sun className="size-4 text-amber-500" /> : <Moon className="size-4 text-blue-500" />}
                </div>
                <span className="font-medium">{theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}</span>
              </button>

              <div className="my-2 border-t border-border/50" />
              
              <button
                className="flex w-full items-center gap-3 rounded-xl p-2.5 text-sm text-destructive hover:bg-destructive/10 transition-all group"
                onClick={handleLogout}
              >
                <div className="p-1.5 rounded-lg bg-destructive/5 group-hover:bg-destructive/10 transition-colors">
                  <LogOut className="size-4" />
                </div>
                <span className="font-bold">Keluar Aplikasi</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />
    </nav>
  );
}
