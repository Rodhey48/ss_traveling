import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import { ChevronDown, HelpCircle, Loader2, Search } from 'lucide-react';
import React, { useDeferredValue, useMemo, useState } from 'react';

// Pre-filter icon names once outside the component
const allIconNames = Object.keys(LucideIcons).filter(
  (key) => {
    const item = (LucideIcons as any)[key];
    return (
      (typeof item === 'function' || (typeof item === 'object' && item !== null)) &&
      key !== 'Icon' &&
      key !== 'createLucideIcon' &&
      key !== 'LucideIcon' &&
      key !== 'LucideProps' &&
      key !== 'icons' &&
      /^[A-Z][a-zA-Z0-9]+$/.test(key)
    );
  }
).sort();

const ICONS_PER_PAGE = 120;

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function IconPicker({ value, onChange, className }: IconPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [open, setOpen] = useState(false);
  const [limit, setLimit] = useState(ICONS_PER_PAGE);

  // Filter icons based on deferred search term for performance
  const filteredIcons = useMemo(() => {
    return allIconNames.filter((name) =>
      name.toLowerCase().includes(deferredSearchTerm.toLowerCase())
    );
  }, [deferredSearchTerm]);

  // Reset limit when search term changes - use layout effect or ref to avoid sync setState warning if needed
  // but for now let's just ensure it's not triggering a loop.
  const visibleIcons = useMemo(() => {
    // If searchTerm changed, we might want to reset limit, but visibleIcons is derived.
    // To fix the "setState in effect" warning, we can derive visible icons 
    // and handle "load more" independently.
    return filteredIcons.slice(0, limit);
  }, [filteredIcons, limit]);

  const getIconComponent = (name: string): React.ElementType => {
    if (!name) return HelpCircle;
    const Icon = (LucideIcons as any)[name];
    if (name !== 'Icon' && (typeof Icon === 'function' || (typeof Icon === 'object' && Icon !== null))) {
      return Icon;
    }
    return HelpCircle;
  };

  const SelectedIcon = getIconComponent(value);
  const isStale = searchTerm !== deferredSearchTerm;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          type="button"
          aria-expanded={open}
          className={cn('w-full justify-between h-11 px-3 bg-background border-input hover:bg-accent hover:text-accent-foreground', className)}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <SelectedIcon className="size-5 shrink-0 text-primary" />
            <span className="truncate font-medium">
              {typeof value === 'string' && value ? value : 'Pilih ikon...'}
            </span>
          </div>
          <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-120 p-0 shadow-2xl border border-border bg-popover text-popover-foreground"
        align="start"
        side="bottom"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-center border-b border-border px-3 py-3 bg-muted/50 backdrop-blur-sm sticky top-0 z-10">
          {isStale ? (
            <Loader2 className="mr-3 size-5 shrink-0 animate-spin text-primary" />
          ) : (
            <Search className="mr-3 size-5 shrink-0 opacity-40" />
          )}
          <input
            placeholder="Cari ikon (misal: Home, User, Settings...)"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setLimit(ICONS_PER_PAGE); // Reset limit directly on change
            }}
            className="flex-1 h-9 border-none bg-transparent p-0 focus:outline-none text-base placeholder:text-muted-foreground"
            autoFocus
          />
        </div>
        <ScrollArea className="h-100 w-full" type="auto">
          <div className="p-3" onWheel={(e) => e.stopPropagation()}>
            <div className="grid grid-cols-10 gap-1.5">
              {visibleIcons.map((iconName) => {
                const Icon = getIconComponent(iconName);
                return (
                  <Button
                    key={iconName}
                    variant="ghost"
                    type="button"
                    size="icon"
                    title={iconName}
                    className={cn(
                      'size-10 p-0 hover:bg-primary/15 hover:text-primary transition-all duration-200',
                      value === iconName && 'bg-primary/20 text-primary font-bold ring-1 ring-primary/30'
                    )}
                    onClick={() => {
                      onChange(iconName);
                      setOpen(false);
                    }}
                  >
                    <Icon className="size-6" />
                  </Button>
                );
              })}
            </div>

            {filteredIcons.length > limit && (
              <div className="mt-4 flex justify-center pb-2">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  className="w-full text-xs h-9 hover:bg-primary hover:text-white transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setLimit(prev => prev + 100);
                  }}
                >
                  Tampilkan Lebih Banyak ({filteredIcons.length - limit} Ikon Lagi)
                </Button>
              </div>
            )}

            {filteredIcons.length === 0 && (
              <div className="py-20 text-center flex flex-col items-center gap-3">
                <Search className="size-10 opacity-10" />
                <p className="text-sm text-muted-foreground">
                  Ikon "{searchTerm}" tidak ditemukan.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
