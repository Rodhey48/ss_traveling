import { ThemeToggle } from '@/components/shared/theme-toggle';
import UserNav from '@/components/shared/user-nav';
import MobileSidebar from '@/components/shared/mobile-sidebar';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <header className="z-20 flex h-20 items-center justify-between bg-secondary px-4 md:px-6">
      <div className="flex items-center gap-2">
          <div className={cn('block md:hidden')}>
            <MobileSidebar
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            />
            <Button
              variant="ghost"
              className="md:hidden"
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 md:hidden"
          >
            <span className="text-lg font-bold tracking-tight text-[#1cb85a]">{import.meta.env.VITE_APP_NAME}</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserNav />
        </div>
    </header>
  );
}
