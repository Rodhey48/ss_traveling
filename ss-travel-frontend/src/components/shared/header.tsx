import MobileSidebar from '@/components/shared/mobile-sidebar';
import NotificationNav from '@/components/shared/notification-nav';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import UserNav from '@/components/shared/user-nav';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import pendopoLogo from '@/assets/ss_travel/ss-transport-pendopo.webp';
import ssTransportWordmark from '@/assets/ss_travel/ss-transport-wordmark.webp';
import ssTravelingWordmark from '@/assets/ss_travel/ss-traveling-wordmark.webp';

export default function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <header className="flex justify-between items-center px-6 md:px-8 bg-white/80 dark:bg-zinc-900/90 w-full sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.03)] border-b border-slate-200/80 dark:border-zinc-800 backdrop-blur-xl transition-all duration-300 h-20 shrink-0">
      {/* Brand & Dual Business Wings */}
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

        {/* Corporate Logo & Title */}
        <Link to="/" className="flex items-center gap-3 w-auto shrink-0 group">
          <div className="w-10 h-10 rounded-xl bg-slate-500/5 dark:bg-white/10 p-1 border border-slate-200/60 dark:border-zinc-700/80 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <img
              src={pendopoLogo}
              alt="SS Logo"
              className="w-full h-full object-contain filter drop-shadow-xs"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight bg-linear-to-r from-emerald-600 via-emerald-500 to-teal-400 bg-clip-text text-transparent drop-shadow-sm text-xl md:text-2xl leading-none">
                {import.meta.env.VITE_APP_NAME || 'SS Traveling'}
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 tracking-wide uppercase select-none leading-none">
                ERP
              </span>
            </div>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase leading-none mt-1 hidden sm:block">
              Transport & Fleet Management System
            </span>
          </div>
        </Link>

        {/* Dual Business Wings Indicator */}
        <div className="hidden xl:flex items-center gap-2.5 pl-6 border-l border-slate-200/60 dark:border-zinc-800 h-8 shrink-0">
          {/* Wing 1: SS Transport */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200/70 dark:border-zinc-700/80 bg-white/70 dark:bg-zinc-800/60 px-2.5 py-1 shadow-2xs">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div className="bg-white px-1.5 py-0.5 rounded-md flex items-center">
              <img
                src={ssTransportWordmark}
                alt="SS Transport"
                className="h-3.5 w-auto object-contain"
              />
            </div>
            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 uppercase">
              AKAP
            </span>
          </div>

          <span className="text-slate-300 dark:text-zinc-700 text-xs font-mono">•</span>

          {/* Wing 2: SS Traveling */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200/70 dark:border-zinc-700/80 bg-white/70 dark:bg-zinc-800/60 px-2.5 py-1 shadow-2xs">
            <span className="size-2 rounded-full bg-cyan-500 shrink-0" />
            <div className="bg-white px-1.5 py-0.5 rounded-md flex items-center">
              <img
                src={ssTravelingWordmark}
                alt="SS Traveling"
                className="h-3.5 w-auto object-contain"
              />
            </div>
            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-md bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/25 uppercase">
              Wisata
            </span>
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
