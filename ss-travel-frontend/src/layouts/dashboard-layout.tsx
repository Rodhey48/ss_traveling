import Header from '@/components/shared/header';
import Sidebar from '@/components/shared/sidebar';
import { Outlet } from 'react-router-dom';

export default function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-secondary">
      <Sidebar />
      <div className="flex w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <main className="relative mx-2 my-3 mr-2 flex-1 overflow-y-auto rounded-xl bg-background p-4 focus:outline-none md:mx-0 md:my-4 md:mr-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
