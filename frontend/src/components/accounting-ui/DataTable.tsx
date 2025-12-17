import React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

export interface Column<T> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  getRowId: (row: T) => string;
  emptyState?: React.ReactNode;
  sortConfig?: { key: string; direction: "asc" | "desc" } | null;
  onSort?: (key: string) => void;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  getRowId,
  emptyState,
  sortConfig,
  onSort,
  pagination,
}: DataTableProps<T>) {
  const getCellValue = (row: T, accessor: Column<T>["accessor"]) => {
    if (typeof accessor === "function") return accessor(row);
    return row[accessor] as React.ReactNode;
  };

  const getSortIcon = (columnId: string) => {
    if (!sortConfig || sortConfig.key !== columnId) {
      return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-4 h-4 ml-1" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1" />
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.id}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(6)].map((_, i) => (
              <tr key={i} className="border-b border-neutral-100 last:border-0">
                {columns.map((col) => (
                  <td key={col.id} className="px-4 py-3">
                    <Skeleton className="h-4 w-full max-w-[240px]" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    return <div className="bg-white rounded-lg border border-neutral-200 p-8">{emptyState}</div>;
  }

  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize)) : 1;

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.id}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider",
                    col.sortable && onSort ? "cursor-pointer select-none" : "",
                    col.className
                  )}
                  onClick={col.sortable && onSort ? () => onSort(col.id) : undefined}
                >
                  <span className="flex items-center">
                    {col.header}
                    {col.sortable && onSort ? getSortIcon(col.id) : null}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {data.map((row) => {
              const id = getRowId(row);
              return (
                <tr key={id} className="transition-colors hover:bg-neutral-50">
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className={cn("px-4 py-3 text-sm text-neutral-900", col.className)}
                    >
                      {getCellValue(row, col.accessor)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 bg-neutral-50">
          <p className="text-sm text-neutral-500">
            {pagination.total} résultat{pagination.total !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              icon={<ChevronLeft className="w-4 h-4" />}
            />
            <span className="text-sm text-neutral-500 px-2">
              Page {pagination.page} sur {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
              icon={<ChevronRight className="w-4 h-4" />}
            />
          </div>
        </div>
      )}
    </div>
  );
}
