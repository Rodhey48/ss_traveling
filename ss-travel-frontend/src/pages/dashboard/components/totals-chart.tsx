import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatRupiah, type DashboardSummary } from "../lib/dashboard.utils";

interface TotalsChartProps {
  summary: DashboardSummary;
}

export default function TotalsChart({ summary }: TotalsChartProps) {
  const data = [
    { name: "Gross Income", value: summary.grossIncome },
    { name: "Net Income", value: summary.netTotal },
    { name: "Profit After Tax", value: summary.profitAfterTax },
  ];

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="mb-4 font-semibold">Income Totals</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" fontSize={12} />
          <YAxis tickFormatter={(v) => formatRupiah(v)} fontSize={11} width={90} />
          <Tooltip formatter={(v: number) => formatRupiah(v)} />
          <Bar dataKey="value" fill="#164E63" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}