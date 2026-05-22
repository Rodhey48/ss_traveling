import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import ThemeProvider from '@/hooks/use-theme';
import { SidebarProvider } from '@/hooks/use-sidebar';
import SyncProvider from './sync-provider';

export default function AppProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider defaultTheme="system" storageKey="ss-travel-theme">
      <QueryClientProvider client={queryClient}>
        <SidebarProvider>
          <BrowserRouter>
            <SyncProvider>{children}</SyncProvider>
          </BrowserRouter>
        </SidebarProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
