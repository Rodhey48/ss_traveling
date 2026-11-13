import { useTheme } from '@/hooks/use-theme';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            'group toast font-sans shadow-xl rounded-xl border backdrop-blur-xl bg-background/95 dark:bg-zinc-900/95 text-foreground border-border/80',
          error:
            '!bg-red-50/95 dark:!bg-red-950/95 !text-red-950 dark:!text-red-50 !border-red-200 dark:!border-red-800/80 shadow-xl shadow-red-950/5 dark:shadow-black/40 [&_[data-title]]:!text-red-950 dark:[&_[data-title]]:!text-red-50 [&_[data-title]]:font-bold [&_[data-description]]:!text-red-800 dark:[&_[data-description]]:!text-red-200 [&_[data-icon]]:!text-red-600 dark:[&_[data-icon]]:!text-red-400 [&_[data-close-button]]:!text-red-900 dark:[&_[data-close-button]]:!text-red-100 [&_[data-close-button]]:!bg-red-100 dark:[&_[data-close-button]]:!bg-red-900/60 [&_[data-close-button]]:!border-red-300 dark:[&_[data-close-button]]:!border-red-700',
          success:
            '!bg-emerald-50/95 dark:!bg-emerald-950/95 !text-emerald-950 dark:!text-emerald-50 !border-emerald-200 dark:!border-emerald-800/80 shadow-xl shadow-emerald-950/5 dark:shadow-black/40 [&_[data-title]]:!text-emerald-950 dark:[&_[data-title]]:!text-emerald-50 [&_[data-title]]:font-bold [&_[data-description]]:!text-emerald-800 dark:[&_[data-description]]:!text-emerald-200 [&_[data-icon]]:!text-emerald-600 dark:[&_[data-icon]]:!text-emerald-400 [&_[data-close-button]]:!text-emerald-900 dark:[&_[data-close-button]]:!text-emerald-100 [&_[data-close-button]]:!bg-emerald-100 dark:[&_[data-close-button]]:!bg-emerald-900/60 [&_[data-close-button]]:!border-emerald-300 dark:[&_[data-close-button]]:!border-emerald-700',
          warning:
            '!bg-amber-50/95 dark:!bg-amber-950/95 !text-amber-950 dark:!text-amber-50 !border-amber-200 dark:!border-amber-800/80 shadow-xl shadow-amber-950/5 dark:shadow-black/40 [&_[data-title]]:!text-amber-950 dark:[&_[data-title]]:!text-amber-50 [&_[data-title]]:font-bold [&_[data-description]]:!text-amber-800 dark:[&_[data-description]]:!text-amber-200 [&_[data-icon]]:!text-amber-600 dark:[&_[data-icon]]:!text-amber-400 [&_[data-close-button]]:!text-amber-900 dark:[&_[data-close-button]]:!text-amber-100 [&_[data-close-button]]:!bg-amber-100 dark:[&_[data-close-button]]:!bg-amber-900/60 [&_[data-close-button]]:!border-amber-300 dark:[&_[data-close-button]]:!border-amber-700',
          info:
            '!bg-blue-50/95 dark:!bg-blue-950/95 !text-blue-950 dark:!text-blue-50 !border-blue-200 dark:!border-blue-800/80 shadow-xl shadow-blue-950/5 dark:shadow-black/40 [&_[data-title]]:!text-blue-950 dark:[&_[data-title]]:!text-blue-50 [&_[data-title]]:font-bold [&_[data-description]]:!text-blue-800 dark:[&_[data-description]]:!text-blue-200 [&_[data-icon]]:!text-blue-600 dark:[&_[data-icon]]:!text-blue-400 [&_[data-close-button]]:!text-blue-900 dark:[&_[data-close-button]]:!text-blue-100 [&_[data-close-button]]:!bg-blue-100 dark:[&_[data-close-button]]:!bg-blue-900/60 [&_[data-close-button]]:!border-blue-300 dark:[&_[data-close-button]]:!border-blue-700',
          title: 'font-semibold text-sm',
          description: 'text-xs font-medium mt-0.5 leading-normal',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground font-semibold text-xs',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground font-semibold text-xs'
        }
      }}
      {...props}
    />
  );
};

export { Toaster };
