import { Navigate, Route, Routes } from 'react-router-dom';
import SignInPage from '@/pages/auth/signin';
import DashboardPage from '@/pages/dashboard';
import DashboardLayout from '@/layouts/dashboard-layout';
import { ProtectedRoute } from './protected-route';
import { GuestRoute } from './guest-route';

export default function AppRouter() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestRoute>
            <SignInPage />
          </GuestRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        {/* Add more protected routes here */}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
