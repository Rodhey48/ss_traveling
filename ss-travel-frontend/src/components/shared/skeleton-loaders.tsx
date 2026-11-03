import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { TableRow, TableCell } from "@/components/ui/table";

/**
 * Skeleton placeholder for a single Metric / KPI Card
 */
export function MetricCardSkeleton() {
  return (
    <Card className="shadow-xs border border-slate-200/60 dark:border-zinc-800/80">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="h-7 w-40 mt-3 rounded-md" />
        <Skeleton className="h-3.5 w-48 mt-2 rounded-md" />
      </CardContent>
    </Card>
  );
}

/**
 * Responsive Grid of Metric Card Skeletons
 */
export function MetricCardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <MetricCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton placeholder for Bank / Cash Account Card
 */
export function BankAccountCardSkeleton() {
  return (
    <Card className="shadow-xs border border-slate-200/60 dark:border-zinc-800/80">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36 rounded-md" />
              <Skeleton className="h-3 w-28 rounded-md" />
              <Skeleton className="h-3 w-20 rounded-md" />
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <Skeleton className="h-5 w-28 rounded-md" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Generic Table Skeleton with customizable row and cell widths
 */
export function TableSkeletonRows({
  rows = 5,
  colWidths = ["w-20", "w-28", "w-36", "w-24", "w-20"],
}: {
  rows?: number;
  colWidths?: string[];
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIndex) => (
        <TableRow key={rIndex} className="hover:bg-transparent">
          {colWidths.map((width, cIndex) => (
            <TableCell key={cIndex} className="py-3">
              <Skeleton className={`h-4 ${width} rounded-md`} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

/**
 * Specialized Skeleton rows for Fund Transfers History Table
 */
export function TransferTableSkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i} className="hover:bg-transparent">
          <TableCell className="py-3.5">
            <Skeleton className="h-4 w-20 rounded-md" />
          </TableCell>
          <TableCell className="py-3.5">
            <Skeleton className="h-4 w-24 rounded-md" />
          </TableCell>
          <TableCell className="py-3.5">
            <Skeleton className="h-5 w-24 rounded-full" />
          </TableCell>
          <TableCell className="py-3.5">
            <div className="space-y-1">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-3 w-20 rounded-md" />
            </div>
          </TableCell>
          <TableCell className="py-3.5">
            <div className="space-y-1">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-3 w-20 rounded-md" />
            </div>
          </TableCell>
          <TableCell className="py-3.5 text-right">
            <Skeleton className="h-4 w-24 ml-auto rounded-md" />
          </TableCell>
          <TableCell className="py-3.5">
            <Skeleton className="h-4 w-36 rounded-md" />
          </TableCell>
          <TableCell className="py-3.5">
            <Skeleton className="h-5 w-20 rounded-full" />
          </TableCell>
          <TableCell className="py-3.5 text-center">
            <Skeleton className="h-7 w-12 mx-auto rounded-md" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

/**
 * Specialized Skeleton rows for Bank Statement (Rekening Koran) Table
 */
export function StatementTableSkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i} className="hover:bg-transparent">
          <TableCell className="py-3.5">
            <Skeleton className="h-4 w-20 rounded-md" />
          </TableCell>
          <TableCell className="py-3.5">
            <Skeleton className="h-4 w-24 rounded-md" />
          </TableCell>
          <TableCell className="py-3.5">
            <Skeleton className="h-5 w-16 rounded-full" />
          </TableCell>
          <TableCell className="py-3.5">
            <Skeleton className="h-4 w-48 rounded-md" />
          </TableCell>
          <TableCell className="py-3.5 text-right">
            <Skeleton className="h-4 w-24 ml-auto rounded-md" />
          </TableCell>
          <TableCell className="py-3.5 text-right">
            <Skeleton className="h-4 w-24 ml-auto rounded-md" />
          </TableCell>
          <TableCell className="py-3.5 text-right">
            <Skeleton className="h-4 w-28 ml-auto rounded-md" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
