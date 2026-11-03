import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { BrandLoader } from '@/components/shared/brand-loader';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading, company } = useAuth();

  if (loading) {
    return (
      <BrandLoader
        message="Memverifikasi Sesi Operasional…"
        subMessage={company?.name ? `Menghubungkan ke ${company.name.replace(/^PT\s+/i, '')} ERP` : 'Menghubungkan ke SS Travelink ERP'}
        minDuration={1200}
      />
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
