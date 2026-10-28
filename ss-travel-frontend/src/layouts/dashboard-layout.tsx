import Header from '@/components/shared/header';
import Sidebar from '@/components/shared/sidebar';
import { Outlet } from 'react-router-dom';

export default function DashboardLayout() {
  return (
    <div className="relative h-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-zinc-950 transition-colors duration-300">
      {/* Background Ambient Glows (SiOlive Style) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 dark:bg-emerald-600/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-teal-500/10 dark:bg-teal-600/5 blur-[150px]" />
        <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] rounded-full bg-emerald-500/5 dark:bg-emerald-500/2 blur-[100px]" />
      </div>

      <div className="relative z-10 flex h-full flex-col overflow-hidden">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto relative z-10 focus:outline-none">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
