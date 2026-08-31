import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLORS, formatRupiah, type CategoryTotal } from "../lib/dashboard.utils";

interface IncomeBreakdownChartProps {
  data: CategoryTotal[];
}

export default function IncomeBreakdownChart({ data }: IncomeBreakdownChartProps) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="mb-4 font-semibold">Income Breakdown</p>
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground italic">Tidak ada data.</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => formatRupiah(v)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}