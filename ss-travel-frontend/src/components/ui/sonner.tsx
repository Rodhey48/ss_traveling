import { useTheme } from '@/hooks/use-theme';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast font-sans shadow-xl rounded-xl border backdrop-blur-lg bg-background/80 text-foreground',
          error:
            '!bg-red-400/30 !text-white !border-red-500/50 dark:!text-white',
          success:
            '!bg-emerald-500/30 !text-white !border-emerald-500/50 dark:!text-white',
          warning:
            '!bg-amber-500/30 !text-white !border-amber-500/50 dark:!text-white',
          info: '!bg-blue-500/30 !text-white !border-blue-500/50 dark:!text-white',
          description: 'group-[.toast]:opacity-90 text-sm font-medium',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground font-semibold',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground font-semibold'
        }
      }}
      {...props}
    />
  );
};

export { Toaster };
