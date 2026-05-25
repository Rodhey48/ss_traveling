import { useEffect, useRef } from 'react';
import { AuthService } from '@/services/auth.service';
import { useAuth } from '@/hooks/use-auth';

// Sync every 5 minutes
const SYNC_INTERVAL = 5 * 60 * 1000;

export default function SyncProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, setAuthData } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const syncData = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await AuthService.getMe();
      if (response.status) {
        setAuthData({
          user: response.data.user,
          menus: response.data.menus
        });
      }
    } catch (error) {
      console.error('Background sync failed', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      // Run sync immediately on mount/auth
      syncData();

      // Setup interval
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
