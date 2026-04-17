import Heading from '@/components/shared/heading';

export default function DashboardPage() {
  return (
    <div className="flex flex-col space-y-4">
      <Heading
        title="Dashboard Overview"
        description="Welcome to SS Traveling ERP Dashboard."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Placeholder cards */}
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow">
          <p className="text-sm font-medium">Total Fleet</p>
          <p className="text-2xl font-bold">12</p>
        </div>
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow">
          <p className="text-sm font-medium">Active Trips</p>
          <p className="text-2xl font-bold">4</p>
        </div>
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow">
          <p className="text-sm font-medium">Monthly Revenue</p>
          <p className="text-2xl font-bold">Rp 45.000.000</p>
        </div>
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow">
          <p className="text-sm font-medium">Active Users</p>
          <p className="text-2xl font-bold">8</p>
        </div>
      </div>
    </div>
  );
}
