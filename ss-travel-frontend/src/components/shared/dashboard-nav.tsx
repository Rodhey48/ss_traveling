import { getIcon } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/hooks/use-sidebar';
import { useEffect, useState } from 'react';
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

  // Auto-expand the parent that contains the active route
  useEffect(() => {
    if (!items?.length) return;

    const findActiveParent = (navItems: any[]): string | null => {
      for (const item of navItems) {
        if (item.items && item.items.length > 0) {
          const hasActive = item.items.some(
            (c: any) =>
              c.href === location.pathname ||
              (c.items && c.items.some((sub: any) => sub.href === location.pathname))
          );
          if (hasActive) return item.title;
        }
      }
      return null;
    };

    const activeTitle = findActiveParent(items);
    if (activeTitle) {
      setExpanded((prev) => {
        if (prev[activeTitle]) return prev;
        return { [activeTitle]: true };
      });
    }
  }, [location.pathname, items]);

  const toggleExpand = (title: string) => {
    setExpanded((prev) => {
      const isCurrentlyOpen = !!prev[title];
      if (isCurrentlyOpen) {
        return { ...prev, [title]: false };
      }
      // Accordion mode: keep only the clicked section open
      return { [title]: true };
    });
  };

  if (!items?.length) {
    return null;
  }

  const renderNavItem = (item: any, index: number, isChild = false) => {
    const Icon = getIcon(item.icon || 'arrowRight');
    const hasChildren = item.items && item.items.length > 0;
    const isExpanded = expandedItems[item.title];
    const isActive = location.pathname === item.href;
    const isGroup = !!item.isParentGroup;

    return (
      <div key={index} className="w-full min-w-0">
        {hasChildren ? (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => toggleExpand(item.title)}
              title={item.title}
              className={cn(
                'group flex w-full items-center rounded-2xl px-3 py-2 text-sm font-semibold transition-all duration-200 select-none min-w-0',
                isExpanded
                  ? 'bg-slate-500/10 dark:bg-white/10 text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'bg-slate-500/5 dark:bg-white/5 hover:bg-slate-500/10 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300',
                isMinimized && !isMobileNav ? 'justify-center' : 'justify-between'
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
                <Icon
                  className={cn(
                    'size-4.5 shrink-0 transition-colors',
                    isExpanded ? 'text-emerald-500' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                  )}
                />
                {(!isMinimized || isMobileNav) && (
                  <span className="truncate text-xs lg:text-[13px] font-semibold tracking-tight">{item.title}</span>
                )}
              </div>
              {(!isMinimized || isMobileNav) && (
                <div className="shrink-0 pl-1 text-slate-400 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200">
                  {isExpanded ? (
                    <ChevronDown className="size-4 transition-transform duration-200" />
                  ) : (
                    <ChevronRight className="size-4 transition-transform duration-200" />
                  )}
                </div>
              )}
            </button>
            {isExpanded && (!isMinimized || isMobileNav) && (
              <div className="ml-3 mt-1 space-y-1 border-l-2 border-slate-200/50 dark:border-white/5 pl-2.5 min-w-0">
                {item.items.map((child: any, idx: number) =>
                  renderNavItem(child, idx, true)
                )}
              </div>
            )}
          </div>
        ) : (
          <Link
            to={isGroup ? '#' : (item.href || '#')}
            title={item.title}
            onClick={(e) => {
              if (isGroup) {
                e.preventDefault();
                return;
              }
              if (setOpen) setOpen(false);
            }}
            className={cn(
              'group flex items-center transition-all duration-200 min-w-0 w-full select-none',
              isChild
                ? 'rounded-2xl px-3 py-1.5 text-xs'
                : 'rounded-2xl px-3 py-2 text-xs lg:text-[13px]',
              isActive
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/20 dark:shadow-emerald-500/10'
                : 'bg-slate-500/5 dark:bg-white/5 hover:bg-emerald-500/10 dark:hover:bg-emerald-400/10 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400',
              isMinimized && !isMobileNav ? 'justify-center p-2 rounded-xl' : 'justify-start gap-2.5',
              item.disabled && 'cursor-not-allowed opacity-80'
            )}
          >
            <Icon
              className={cn(
                isChild ? 'size-4' : 'size-4.5',
                'shrink-0 transition-colors',
                isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
              )}
            />
            {(!isMinimized || isMobileNav) && (
              <span className={cn('truncate font-semibold leading-normal', isChild ? 'text-xs' : 'text-xs lg:text-[13px]')}>
                {item.title}
              </span>
            )}
          </Link>
        )}
      </div>
    );
  };

  return (
    <nav className="grid items-start gap-1.5 min-w-0">
      {items.map((item, index) => renderNavItem(item, index))}
    </nav>
  );
}
