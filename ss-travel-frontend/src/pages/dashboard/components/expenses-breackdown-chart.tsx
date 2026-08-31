import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatRupiah, type CategoryTotal } from "../lib/dashboard.utils";

interface ExpensesBreakdownChartProps {
  data: CategoryTotal[];
}

export default function ExpensesBreakdownChart({ data }: ExpensesBreakdownChartProps) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="mb-4 font-semibold">Expenses Breakdown</p>
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground italic">Tidak ada data.</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tickFormatter={(v) => formatRupiah(v)} fontSize={11} />
            <YAxis type="category" dataKey="name" width={100} fontSize={12} />
            <Tooltip formatter={(v: number) => formatRupiah(v)} />
            <Bar dataKey="value" fill="#7C2D12" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}