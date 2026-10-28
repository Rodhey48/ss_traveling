import { ThemeToggle } from '@/components/shared/theme-toggle';
import UserNav from '@/components/shared/user-nav';
import NotificationNav from '@/components/shared/notification-nav';
import MobileSidebar from '@/components/shared/mobile-sidebar';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/90 dark:border-border/60 bg-slate-100/90 dark:bg-card/90 text-foreground px-4 md:px-6 backdrop-blur-md shadow-xs">
      <div className="flex items-center gap-3">
        <div className={cn('block md:hidden')}>
          <MobileSidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
          <Button
            variant="ghost"
            className="md:hidden size-9 text-foreground hover:bg-slate-200/60 dark:hover:bg-accent"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
        </div>
        <Link
          to="/"
          className="flex items-center gap-2 md:hidden"
        >
          <span className="text-base font-bold tracking-tight text-[#1cb85a] truncate">
            {import.meta.env.VITE_APP_NAME || 'SS TRAVEL ERP'}
          </span>
        </Link>

        {/* Command Center Status Pill (Desktop only) */}
        <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-border/60 bg-white/80 dark:bg-secondary/60 px-3 py-1 text-xs font-semibold text-muted-foreground shadow-2xs">
          <Radio className="size-3.5 text-emerald-500 animate-pulse" />
          <span className="text-foreground font-bold">SS Travel Command Center</span>
          <span className="text-muted-foreground/40 font-mono">|</span>
          <span className="text-[11px] text-muted-foreground">Garasi Ciputat & Lintasan AKAP</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <NotificationNav />
        <ThemeToggle />
        <div className="h-5 w-px bg-slate-200 dark:bg-border/80 mx-1 hidden sm:block" />
        <UserNav />
      </div>
    </header>
  );
}
