import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import ThemeProvider from '@/hooks/use-theme';
import { SidebarProvider } from '@/hooks/use-sidebar';
import { AuthProvider } from '@/hooks/use-auth';
import SyncProvider from './sync-provider';
import ForceChangePasswordModal from '@/components/shared/force-change-password-modal';

export default function AppProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider defaultTheme="system" storageKey="ss-travel-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SidebarProvider>
            <BrowserRouter>
              <SyncProvider>
                {children}
                <ForceChangePasswordModal />
              </SyncProvider>
            </BrowserRouter>
          </SidebarProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
