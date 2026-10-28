import Header from '@/components/shared/header';
import Sidebar from '@/components/shared/sidebar';
import { Outlet } from 'react-router-dom';

export default function DashboardLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100 dark:bg-background text-foreground">
      <Sidebar />
      <div className="flex w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <main className="relative flex-1 overflow-y-auto bg-slate-100 dark:bg-background focus:outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
