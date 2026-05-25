import { getIcon } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/hooks/use-sidebar';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface DashboardNavProps {
  items: any[];
  setOpen?: (open: boolean) => void;
  isMobileNav?: boolean;
}

export default function DashboardNav({
  items,
  setOpen,
  isMobileNav = false
}: DashboardNavProps) {
  const { isMinimized } = useSidebar();
  const location = useLocation();
  const [expandedItems, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (title: string) => {
    setExpanded((prev) => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  if (!items?.length) {
    return null;
  }

  const renderNavItem = (item: any, index: number) => {
    const Icon = getIcon(item.icon || 'arrowRight');
    const hasChildren = item.items && item.items.length > 0;
    const isExpanded = expandedItems[item.title];
    const isActive = location.pathname === item.href;
    const isGroup = !!item.isParentGroup;

    return (
      <div key={index} className="w-full">
        {hasChildren ? (
          <div className="space-y-1">
            <button
              onClick={() => toggleExpand(item.title)}
              className={cn(
                'group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all',
                isExpanded ? 'bg-accent/50 text-accent-foreground' : 'transparent',
                isMinimized && !isMobileNav ? 'justify-center' : 'justify-between'
              )}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <Icon className={cn('size-5 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')} />
                {(!isMinimized || isMobileNav) && <span className="truncate">{item.title}</span>}
              </div>
              {(!isMinimized || isMobileNav) && (
                isExpanded ? <ChevronDown className="size-4 opacity-50" /> : <ChevronRight className="h-4 w-4 opacity-50" />
              )}
            </button>
            {isExpanded && (!isMinimized || isMobileNav) && (
              <div className="ml-4 mt-1 space-y-1 border-l border-border pl-2">
                {item.items.map((child: any, idx: number) =>
                  renderNavItem(child, idx)
                )}
              </div>
            )}
          </div>
        ) : (
          <Link
            to={isGroup ? '#' : (item.href || '#')}
            onClick={(e) => {
              if (isGroup) {
                e.preventDefault();
                // If it's a group but has no children, maybe do nothing or show toast
                return;
              }
              if (setOpen) setOpen(false);
            }}
            className={cn(
              'group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all',
              isActive ? 'bg-primary/10 text-primary font-bold' : 'transparent',
              isMinimized && !isMobileNav ? 'justify-center' : 'justify-start gap-2',
              item.disabled && 'cursor-not-allowed opacity-80'
            )}
          >
            <Icon className={cn('size-5 shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')} />
            {(!isMinimized || isMobileNav) && <span className="truncate">{item.title}</span>}
          </Link>
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
