import { getIcon } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types';
import { Dispatch, SetStateAction, useState } from 'react';
import { useSidebar } from '@/hooks/use-sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { usePathname } from '@/hooks/use-pathname';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface DashboardNavProps {
  items: NavItem[];
  setOpen?: Dispatch<SetStateAction<boolean>>;
  isMobileNav?: boolean;
}

export default function DashboardNav({
  items,
  setOpen,
  isMobileNav = false
}: DashboardNavProps) {
  const path = usePathname();
  const { isMinimized } = useSidebar();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  if (!items?.length) {
    return null;
  }

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const renderNavItem = (item: any, index: number, isSubItem = false) => {
    const Icon = getIcon(item.icon || '');
    const hasChildren = item.items && item.items.length > 0;
    const isOpen = openMenus[item.title];
    const isActive = path === item.href || (hasChildren && item.items.some((child: any) => child.href === path));

    const content = (
      <div
        className={cn(
          'flex items-center gap-2 overflow-hidden rounded-md py-2 text-sm font-medium transition-all hover:text-primary',
          isActive
            ? 'bg-white text-black shadow-sm'
            : 'text-muted-foreground hover:bg-white/50',
          isSubItem && 'pl-6'
        )}
      >
        <Icon className={cn('ml-2.5 size-5', isActive ? 'text-primary' : '')} />
        {(!isMinimized || isMobileNav) && (
          <span className="flex-1 truncate">{item.title}</span>
        )}
        {hasChildren && (!isMinimized || isMobileNav) && (
          <div className="mr-2">
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
        )}
      </div>
    );

    return (
      <div key={index} className="space-y-1">
        {item.href ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to={item.disabled ? '#' : item.href}
                  onClick={() => {
                    if (setOpen) setOpen(false);
                  }}
                >
                  {content}
                </Link>
              </TooltipTrigger>
              <TooltipContent
                align="center"
                side="right"
                sideOffset={8}
                className={!isMinimized ? 'hidden' : 'inline-block'}
              >
                {item.title}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <div
            className="cursor-pointer"
            onClick={() => toggleMenu(item.title)}
          >
            {content}
          </div>
        )}

        {hasChildren && isOpen && (!isMinimized || isMobileNav) && (
          <div className="space-y-1">
            {item.items.map((child: any, idx: number) =>
              renderNavItem(child, idx, true)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className="grid items-start gap-1">
      {items.map((item, index) => renderNavItem(item, index))}
    </nav>
  );
}
