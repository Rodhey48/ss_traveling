import { formatRupiah, type DashboardSummary } from "../lib/dashboard.utils";

interface SummaryCardsProps {
  summary: DashboardSummary;
  loading?: boolean;
}

export default function SummaryCards({ summary, loading }: SummaryCardsProps) {
  const cards = [
    { label: "Gross Income", value: summary.grossIncome, tone: "text-foreground" },
    { label: "Total Expenses", value: summary.totalExpenses, tone: "text-destructive" },
    { label: "Net Total", value: summary.netTotal, tone: "text-foreground" },
    { label: "Tax", value: summary.totalTax, tone: "text-muted-foreground" },
    { label: "Profit After Tax", value: summary.profitAfterTax, tone: "text-primary" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">{card.label}</p>
          <p className={`mt-1 text-xl font-bold ${card.tone}`}>
            {loading ? "…" : formatRupiah(card.value)}
          </p>
        </div>
      ))}
    </div>
  );
}