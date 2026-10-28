import { Check, Laptop, Moon, Sun } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/hooks/use-theme';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="h-10 w-10 shrink-0 rounded-2xl bg-slate-500/5 dark:bg-white/5 hover:bg-slate-500/10 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-all flex items-center justify-center border border-slate-200/40 dark:border-white/5 shadow-2xs cursor-pointer relative"
          title="Ganti Tema Tampilan"
        >
          <Sun className="h-4.5 w-4.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4.5 w-4.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 p-1.5 shadow-xl border-border rounded-2xl space-y-0.5">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className="flex items-center justify-between cursor-pointer rounded-xl px-2.5 py-2 text-xs font-semibold"
        >
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-amber-500" />
            <span>Light</span>
          </div>
          {theme === 'light' && <Check className="h-4 w-4 text-emerald-500 shrink-0 stroke-[2.5]" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className="flex items-center justify-between cursor-pointer rounded-xl px-2.5 py-2 text-xs font-semibold"
        >
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-indigo-400" />
            <span>Dark</span>
          </div>
          {theme === 'dark' && <Check className="h-4 w-4 text-emerald-500 shrink-0 stroke-[2.5]" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className="flex items-center justify-between cursor-pointer rounded-xl px-2.5 py-2 text-xs font-semibold"
        >
          <div className="flex items-center gap-2">
            <Laptop className="h-4 w-4 text-slate-500" />
            <span>System</span>
          </div>
          {theme === 'system' && <Check className="h-4 w-4 text-emerald-500 shrink-0 stroke-[2.5]" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
