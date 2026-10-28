import MobileSidebar from '@/components/shared/mobile-sidebar';
import NotificationNav from '@/components/shared/notification-nav';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import UserNav from '@/components/shared/user-nav';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Menu, Radio } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <header className="flex justify-between items-center px-6 md:px-8 bg-white/80 dark:bg-zinc-900/90 w-full sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.03)] border-b border-slate-200/80 dark:border-zinc-800 backdrop-blur-xl transition-all duration-300 h-20 shrink-0">
      {/* Brand & Command Center Status */}
      <div className="flex items-center gap-4">
        <div className={cn('block md:hidden')}>
          <MobileSidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
          <Button
            variant="ghost"
            className="md:hidden h-10 w-10 rounded-2xl bg-slate-500/5 dark:bg-white/10 hover:bg-slate-500/10 text-slate-700 dark:text-slate-200"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
        </div>

        <Link to="/" className="flex items-center gap-3 w-auto md:w-65 shrink-0">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight bg-linear-to-r from-emerald-600 via-emerald-500 to-teal-400 bg-clip-text text-transparent drop-shadow-sm text-2xl leading-none">
                {import.meta.env.VITE_APP_NAME || 'SS Traveling'}
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 tracking-wide uppercase select-none leading-none">
                ERP
              </span>
            </div>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase leading-none mt-1.5 hidden sm:block">
              Transport & Fleet Management System
            </span>
          </div>
        </Link>

        {/* Corporate Alignment Status Pill */}
        <div className="hidden lg:flex items-center gap-3 pl-6 border-l border-slate-200/60 dark:border-zinc-800 h-8 shrink-0">
          <div className="flex items-center gap-2 rounded-full border border-slate-200/70 dark:border-zinc-700/80 bg-slate-500/5 dark:bg-white/5 px-3.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 shadow-2xs">
            <Radio className="size-3 text-emerald-500 animate-pulse" />
            <span className="font-bold text-slate-800 dark:text-slate-100">Command Center</span>
            <span className="text-slate-300 dark:text-slate-600 font-mono">|</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Garasi Ciputat & AKAP</span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <NotificationNav />
        <ThemeToggle />
        <div className="h-6 w-px bg-slate-200/80 dark:bg-zinc-800 mx-1 hidden sm:block" />
        <UserNav />
      </div>
    </header>
  );
}
