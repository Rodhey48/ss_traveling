import type { Transaction } from "@/types";

export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 2,
  }).format(value);
}

export function getMonthOptions() {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    options.push({ value, label });
  }
  return options;
}

export function getMonthRange(monthValue: string) {
  const [year, month] = monthValue.split("-").map(Number);
  const startDate = new Date(year, month - 1, 1).toISOString().slice(0, 10);
  const endDate = new Date(year, month, 0).toISOString().slice(0, 10);
  return { startDate, endDate };
}

export interface CategoryTotal {
  name: string;
  value: number;
}

export function groupBySubCategory(items: Transaction[]): CategoryTotal[] {
  const map = new Map<string, number>();
  for (const t of items) {
    const key = t.subCategory || "Lainnya";
    const amount = Number(t.amount) || 0;
    map.set(key, (map.get(key) || 0) + amount);
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export interface DashboardSummary {
  grossIncome: number;
  totalExpenses: number;
  netTotal: number;
  totalTax: number;
  profitAfterTax: number;
}

export function computeSummary(transactions: Transaction[]): DashboardSummary {
  const income = transactions.filter((t) => t.category === "income");
  const expenses = transactions.filter((t) => t.category === "expenses");

  const grossIncome = income.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const totalExpenses = expenses.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const netTotal = grossIncome - totalExpenses;
  const totalTax = transactions.reduce((acc, t) => acc + (Number(t.tax) || 0), 0);
  const profitAfterTax = netTotal - totalTax;

  return { grossIncome, totalExpenses, netTotal, totalTax, profitAfterTax };
}

export const CHART_COLORS = ["#7C2D12", "#164E63", "#3F6212", "#B45309", "#1E3A5F", "#831843"];