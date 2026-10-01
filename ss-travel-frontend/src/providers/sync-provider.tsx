import { useEffect, useRef } from 'react';
import { AuthService } from '@/services/auth.service';
import { useAuth } from '@/hooks/use-auth';

// Sync setiap 5 menit
const SYNC_INTERVAL = 5 * 60 * 1000;

export default function SyncProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, setAuthData } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const syncData = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await AuthService.getMe();
      if (response.status && response.data) {
        setAuthData({
          user: response.data.user,
          menus: response.data.menus,
        });
      }
    } catch (error) {
      console.warn('[Sync] Background sync skipped or failed:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      // Jalankan sinkronisasi segera saat user terautentikasi / pertama kali mount
      syncData();

      // Pasang interval berkala
      intervalRef.current = setInterval(syncData, SYNC_INTERVAL);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAuthenticated]);

  return <>{children}</>;
}
