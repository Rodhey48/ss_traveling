import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { BrandLoader } from '@/components/shared/brand-loader';

interface GuestRouteProps {
  children: ReactNode;
}

export function GuestRoute({ children }: GuestRouteProps) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <BrandLoader
        message="Memverifikasi Sesi Operasional…"
        subMessage="Menghubungkan ke SS Traveling ERP"
        minDuration={1200}
      />
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
