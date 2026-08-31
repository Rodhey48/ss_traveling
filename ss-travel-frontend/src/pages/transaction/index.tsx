import Heading from "@/components/shared/heading";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search } from 'lucide-react';
import TransactionTable from "./components/transaction-table";
import { TransactionService } from "@/services/transaction.service";
import { useEffect, useState } from "react";
import type { Transaction } from "@/types";
import type { PaginatedData } from "@/types/pagination";
import { toast } from "sonner";

export default function TransactionPage() {
  const [transactionData, setTransactionData] = useState<Transaction[]>([]);
  const [meta, setMeta] = useState<Omit<PaginatedData<Transaction>, "data">>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const fetchTransaction = async () => {
    try {
      setLoading(true);
      const response = await TransactionService.findAll({
        search,
        category: category === "all" ? undefined : category,
        page,
        limit,
      });
      if (response.status) {
        const { data, ...pagination } = response.data as PaginatedData<Transaction>;
        setTransactionData(data);
        setMeta(pagination);
      }
    } catch (error) {
      toast.error('Gagal mengambil data transaksi');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedTransaction(null);
    setIsModalOpen(true);
  };

  useEffect(() => {
    fetchTransaction();
  }, [search, category, page, limit]);

  // reset ke halaman 1 setiap kali filter/search/limit berubah
  useEffect(() => {
    setPage(1);
  }, [search, category, limit]);

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title="TRANSACTION LOG"
          description="Halaman kelola transaksi."
        />
        <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
          <Plus className="mr-2 h-4 w-4" /> Tambah Transaksi
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari transaksi..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expenses">Expenses</SelectItem>
          </SelectContent>
        </Select>

        <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
          <SelectTrigger className="w-28">
            <SelectValue placeholder="Limit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 / page</SelectItem>
            <SelectItem value="25">25 / page</SelectItem>
            <SelectItem value="50">50 / page</SelectItem>
            <SelectItem value="100">100 / page</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <TransactionTable
        data={transactionData}
        loading={loading}
        meta={meta}
        onPageChange={setPage}
      />
    </>
  );
}