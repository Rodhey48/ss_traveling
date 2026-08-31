import { useEffect, useState } from "react";
import Heading from "@/components/shared/heading";
import { TransactionService } from "@/services/transaction.service";
import type { Transaction } from "@/types";
import type { PaginatedData } from "@/types/pagination";
import { toast } from "sonner";

import MonthSelect from "./components/month-select";
import IncomeBreakdownChart from "./components/income-breakdown-chart";
import TotalsChart from "./components/totals-chart";
import { computeSummary, getMonthOptions, getMonthRange, groupBySubCategory } from "./lib/dashboard.utils";
import SummaryCards from "./components/summary-cards";
import CategoryBreakdownTable from "./components/catrgory-breakdown-table";
import ExpensesBreakdownChart from "./components/expenses-breackdown-chart";

export default function DashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => getMonthOptions()[0]?.value ?? "");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!selectedMonth) return;
      try {
        setLoading(true);
        const { startDate, endDate } = getMonthRange(selectedMonth);
        const response = await TransactionService.findAll({
          startDate,
          endDate,
          page: 1,
          limit: 1000,
        });
        if (response.status) {
          const { data } = response.data as PaginatedData<Transaction>;
          setTransactions(data);
        }
      } catch (error) {
        toast.error("Gagal mengambil ringkasan transaksi");
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [selectedMonth]);

  const summary = computeSummary(transactions);
  const income = transactions.filter((t) => t.category === "income");
  const expenses = transactions.filter((t) => t.category === "expenses");
  const incomeBySubCategory = groupBySubCategory(income);
  const expensesBySubCategory = groupBySubCategory(expenses);

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Heading
          title="Ringkasan Bulanan"
          description="Ikhtisar penghasilan dan pengeluaran. Pilih bulan untuk memperbarui data."
        />
        <MonthSelect value={selectedMonth} onChange={setSelectedMonth} />
      </div>

      <SummaryCards summary={summary} loading={loading} />

      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryBreakdownTable
          title="Income"
          data={incomeBySubCategory}
          emptyText="Belum ada data income bulan ini."
        />
        <CategoryBreakdownTable
          title="Expenses"
          data={expensesBySubCategory}
          emptyText="Belum ada data pengeluaran bulan ini."
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <IncomeBreakdownChart data={incomeBySubCategory} />
        <ExpensesBreakdownChart data={expensesBySubCategory} />
      </div>

      <TotalsChart summary={summary} />
    </div>
  );
}