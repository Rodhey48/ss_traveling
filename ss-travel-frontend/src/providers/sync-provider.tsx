import { useEffect, useRef } from 'react';
import { AuthService } from '@/services/auth.service';
import { useAuth } from '@/hooks/use-auth';

// Sync every 5 minutes
const SYNC_INTERVAL = 5 * 60 * 1000;

export default function SyncProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const syncData = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await AuthService.getMe();
      if (response.status) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('menus', JSON.stringify(response.data.menus));
        // Note: We don't trigger a full page reload to avoid breaking UX.
        // Hooks like usePermission and useSidebar will pick up changes on next render
        // or during the next route transition.
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
