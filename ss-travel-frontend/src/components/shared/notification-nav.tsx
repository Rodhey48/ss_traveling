import { useState } from 'react';
import { Bell, CheckCheck, Clock, FileText, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'spj' | 'cashier' | 'finance';
  unread: boolean;
  link?: string;
}

export default function NotificationNav() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'SPJ Siap Diberangkatkan',
      description: 'SPJ-2026-AKAP-088 unit Bus B-7102-SS telah dicetak dan siap dinas.',
      time: '10 mnt lalu',
      type: 'spj',
      unread: true,
      link: '/spjs',
    },
    {
      id: '2',
      title: 'Settlement Kasir Menunggu',
      description: 'Kru trip Jogja-Ciputat telah tiba di pool untuk penyelesaian setoran.',
      time: '45 mnt lalu',
      type: 'cashier',
      unread: true,
      link: '/cashier',
    },
    {
      id: '3',
      title: 'Alert Jatuh Tempo AP Vendor',
      description: '2 tagihan rumah makan rekanan mendekati tanggal jatuh tempo.',
      time: '2 jam lalu',
      type: 'finance',
      unread: true,
      link: '/ap-invoices',
    },
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'spj':
        return <FileText className="size-4 text-amber-500" />;
      case 'cashier':
        return <Clock className="size-4 text-emerald-500" />;
      case 'finance':
        return <AlertTriangle className="size-4 text-rose-500" />;
      default:
        return <Bell className="size-4 text-primary" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative size-9 rounded-lg border-slate-200/90 dark:border-border/80 bg-white dark:bg-card text-foreground hover:bg-slate-200/60 dark:hover:bg-accent transition-all cursor-pointer shadow-xs"
          title="Notifikasi Operasional"
        >
          <Bell className="size-4.5 text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white shadow-xs animate-pulse">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-96 p-2 shadow-xl border-border">
        <DropdownMenuLabel className="flex items-center justify-between px-2 py-1.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-foreground">Notifikasi Operasional</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] bg-rose-500/10 text-rose-600 border-none font-bold">
                {unreadCount} Baru
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors cursor-pointer"
            >
              <CheckCheck className="size-3.5" />
              Tandai dibaca
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuGroup className="space-y-1">
          {notifications.map((item) => (
            <DropdownMenuItem
              key={item.id}
              onClick={() => item.link && navigate(item.link)}
              className="flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-colors focus:bg-accent hover:bg-accent/60"
            >
              <div className="p-2 rounded-lg bg-secondary/80 border border-border/50 shrink-0 mt-0.5">
                {getIcon(item.type)}
              </div>
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs font-semibold truncate ${item.unread ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {item.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                    {item.time}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>
              {item.unread && (
                <span className="size-1.5 rounded-full bg-rose-500 shrink-0 mt-2" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
