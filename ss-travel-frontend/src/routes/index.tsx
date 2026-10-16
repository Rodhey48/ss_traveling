import { Navigate, Route, Routes } from 'react-router-dom';
import SignInPage from '@/pages/auth/signin';
import DashboardPage from '@/pages/dashboard';
import UsersPage from '@/pages/users';
import RolesPage from '@/pages/roles';
import MenusPage from '@/pages/menus';
import VehiclesPage from '@/pages/vehicles';
import CustomersPage from '@/pages/customers';
import OrganizationPage from '@/pages/organization';
import AccountsPage from '@/pages/accounts';
import CashBankPage from '@/pages/cash-bank';
import FiscalPeriodsPage from '@/pages/fiscal-periods';
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
        <Route path="vehicles" element={<VehiclesPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="organization" element={<OrganizationPage />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="cash-bank" element={<CashBankPage />} />
        <Route path="fiscal-periods" element={<FiscalPeriodsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="roles" element={<RolesPage />} />
        <Route path="menu-management" element={<MenusPage />} />
        {/* Add more protected routes here */}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
