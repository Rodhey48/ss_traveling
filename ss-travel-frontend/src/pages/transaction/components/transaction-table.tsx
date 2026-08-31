import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import type { Transaction } from "@/types";
import type { PaginatedData } from "@/types/pagination";

type Meta = Omit<PaginatedData<Transaction>, "data">;

interface TransactionTableProps {
  data: Transaction[];
  loading?: boolean;
  meta?: Meta;
  onPageChange?: (page: number) => void;
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("...");

  pages.push(total);

  return pages;
}

export default function TransactionTable({ data, loading, meta, onPageChange }: TransactionTableProps) {
  const totalPages = meta?.totalPages ?? 1;
  const showingFrom = meta && meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0;
  const showingTo = meta ? Math.min(meta.page * meta.limit, meta.total) : 0;
  const pageNumbers = meta ? getPageNumbers(meta.page, totalPages) : [];

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <Table className="min-w-225">
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead className="sticky left-0 z-20 w-16 bg-muted text-center px-2 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)]">
                Actions
              </TableHead>
              <TableHead className="whitespace-nowrap px-4">Date</TableHead>
              <TableHead className="whitespace-nowrap px-4">Transaction Detail</TableHead>
              <TableHead className="whitespace-nowrap px-4">Amount</TableHead>
              <TableHead className="whitespace-nowrap px-4">Category</TableHead>
              <TableHead className="whitespace-nowrap px-4">Sub Category</TableHead>
              <TableHead className="whitespace-nowrap px-4">Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground italic">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground italic">
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              data.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="sticky left-0 z-10 w-16 bg-card px-2 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)]">
                    <div className="flex justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-4">{transaction.date}</TableCell>
                  <TableCell className="whitespace-nowrap px-4">{transaction.transactionDetail || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap px-4">{transaction.amount || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap px-4 capitalize">{transaction.category}</TableCell>
                  <TableCell className="whitespace-nowrap px-4">{transaction.subCategory || '-'}</TableCell>
                  <TableCell className="whitespace-nowrap px-4">{transaction.note || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {meta && meta.total > 0 && (
        <div className="flex items-center justify-between border-t px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Menampilkan {showingFrom}–{showingTo} dari {meta.total} transaksi
          </p>

          <div className="flex items-center gap-1">
            {pageNumbers.map((p, idx) =>
              p === "..." ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-sm text-muted-foreground">
                  ...
                </span>
              ) : (
                <Button
                  key={p}
                  variant={p === meta.page ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onPageChange?.(p)}
                >
                  {p}
                </Button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}