import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm shadow-emerald-600/20 active:scale-95',
        emerald:
          'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm shadow-emerald-600/20 active:scale-95',
        gradient:
          'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:from-emerald-700 active:to-teal-600 text-white shadow-md shadow-emerald-500/25 active:scale-95',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:scale-95',
        outline:
          'border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/5 shadow-2xs hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 backdrop-blur-md active:scale-95',
        secondary:
          'bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-100 shadow-2xs hover:bg-slate-200/80 dark:hover:bg-white/15 active:scale-95',
        glass:
          'border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/5 shadow-2xs hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 backdrop-blur-md active:scale-95',
        ghost:
          'hover:bg-slate-500/10 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 active:scale-95',
        link: 'text-emerald-600 dark:text-emerald-400 underline-offset-4 hover:underline'
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-10 rounded-xl px-8',
        icon: 'h-9 w-9 rounded-xl'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
