import { formatRupiah, type CategoryTotal } from "../lib/dashboard.utils";

interface CategoryBreakdownTableProps {
  title: string;
  data: CategoryTotal[];
  emptyText: string;
}

export default function CategoryBreakdownTable({ title, data, emptyText }: CategoryBreakdownTableProps) {
  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="bg-muted px-4 py-3 font-semibold">{title}</div>
      <div className="divide-y">
        {data.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground italic">{emptyText}</p>
        ) : (
          data.map((row) => (
            <div key={row.name} className="flex items-center justify-between px-4 py-2 text-sm">
              <span className="font-medium">{row.name}</span>
              <span>{formatRupiah(row.value)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}