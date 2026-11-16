import { AnimatePresence, motion } from "motion/react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { EmptyState, ErrorState, TableSkeleton } from "@turnpike/shared/components/premium/states";
import { Button } from "@turnpike/shared/components/ui/button";
import { Checkbox } from "@turnpike/shared/components/ui/checkbox";
import { Input } from "@turnpike/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@turnpike/shared/components/ui/select";
import { PAGE_SIZE_OPTIONS } from "@turnpike/shared/constants/config";
import { cn } from "@turnpike/shared/lib/utils";
import { exportToCsv } from "@turnpike/shared/utils/format";

export interface DataGridColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Raw value used for sorting, searching and CSV export. */
  value?: (row: T) => string | number | undefined | null;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
}

interface DataGridProps<T> {
  rows: T[] | undefined;
  columns: DataGridColumn<T>[];
  getRowId: (row: T) => string;
  isLoading?: boolean;
  error?: { message: string } | null;
  onRetry?: () => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  toolbar?: ReactNode;
  selectable?: boolean;
  bulkActions?: (selected: T[], clear: () => void) => ReactNode;
  rowActions?: (row: T) => ReactNode;
  exportName?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Server-side pagination (skip/limit). */
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function DataGrid<T>({
  rows,
  columns,
  getRowId,
  isLoading,
  error,
  onRetry,
  searchPlaceholder = "Search…",
  filters,
  toolbar,
  selectable = true,
  bulkActions,
  rowActions,
  exportName = "export",
  emptyTitle,
  emptyDescription,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: DataGridProps<T>) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const cellValue = (row: T, column: DataGridColumn<T>) =>
    column.value ? column.value(row) : undefined;

  const visible = useMemo(() => {
    let list = rows ?? [];

    if (query.trim()) {
      const needle = query.trim().toLowerCase();
      list = list.filter((row) =>
        columns.some((column) => String(cellValue(row, column) ?? "").toLowerCase().includes(needle)),
      );
    }

    if (sort) {
      const column = columns.find((item) => item.key === sort.key);
      if (column) {
        list = [...list].sort((a, b) => {
          const av = cellValue(a, column) ?? "";
          const bv = cellValue(b, column) ?? "";
          const result =
            typeof av === "number" && typeof bv === "number"
              ? av - bv
              : String(av).localeCompare(String(bv));
          return sort.dir === "asc" ? result : -result;
        });
      }
    }

    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, query, sort, columns]);

  const paginatedVisible = useMemo(() => {
    const start = page * pageSize;
    return visible.slice(start, start + pageSize);
  }, [visible, page, pageSize]);

  const selectedRows = visible.filter((row) => selected.has(getRowId(row)));
  const allSelected = visible.length > 0 && selectedRows.length === visible.length;
  const clearSelection = () => setSelected(new Set());

  const toggleSort = (key: string) =>
    setSort((current) =>
      current?.key !== key
        ? { key, dir: "asc" }
        : current.dir === "asc"
          ? { key, dir: "desc" }
          : null,
    );

  return (
    <div className="overflow-hidden rounded-2xl glass-panel gradient-ring">
      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 p-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Search table"
            className="border-transparent bg-background/60 pl-9 backdrop-blur"
          />
        </div>
        {filters}
        {toolbar}
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() =>
            exportToCsv(
              exportName,
              (selectedRows.length ? selectedRows : visible) as Record<string, unknown>[],
              columns.map((column) => ({
                key: column.key,
                label: column.header,
                value: (row) => cellValue(row as T, column),
              })),
            )
          }
          disabled={!visible.length}
        >
          <Download className="size-4" /> CSV
        </Button>
      </div>

      <AnimatePresence>
        {selectable && selectedRows.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex flex-wrap items-center gap-2 overflow-hidden border-b border-border/60 bg-primary/5 px-3 py-2 text-sm"
          >
            <span className="font-medium">{selectedRows.length} selected</span>
            {bulkActions?.(selectedRows, clearSelection)}
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              Clear
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-h-[62vh] overflow-auto">
        {isLoading ? (
          <TableSkeleton cols={Math.min(columns.length + 1, 6)} />
        ) : error ? (
          <ErrorState message={error.message} onRetry={onRetry} />
        ) : visible.length === 0 ? (
          <EmptyState title={emptyTitle ?? "No records found"} description={emptyDescription} />
        ) : (
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-background/80 backdrop-blur-xl">
                {selectable && (
                  <th className="w-10 border-b border-border/60 px-3 py-3">
                    <Checkbox
                      checked={allSelected}
                      aria-label="Select all rows"
                      onCheckedChange={(checked) =>
                        setSelected(checked ? new Set(visible.map(getRowId)) : new Set())
                      }
                    />
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn(
                      "border-b border-border/60 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                      column.headerClassName,
                    )}
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                      >
                        {column.header}
                        {sort?.key === column.key ? (
                          sort.dir === "asc" ? (
                            <ArrowUp className="size-3.5" />
                          ) : (
                            <ArrowDown className="size-3.5" />
                          )
                        ) : (
                          <ArrowUpDown className="size-3.5 opacity-40" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                ))}
                {rowActions && (
                  <th className="border-b border-border/60 px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedVisible.map((row, index) => {
                const id = getRowId(row);
                return (
                  <motion.tr
                    key={id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.02, 0.25), duration: 0.3 }}
                    className="group transition-colors hover:bg-primary/[0.04]"
                  >
                    {selectable && (
                      <td className="border-b border-border/40 px-3 py-3 align-middle">
                        <Checkbox
                          checked={selected.has(id)}
                          aria-label="Select row"
                          onCheckedChange={(checked) =>
                            setSelected((current) => {
                              const next = new Set(current);
                              if (checked) next.add(id);
                              else next.delete(id);
                              return next;
                            })
                          }
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn("border-b border-border/40 px-3 py-3 align-middle", column.className)}
                      >
                        {column.cell(row)}
                      </td>
                    ))}
                    {rowActions && (
                      <td className="border-b border-border/40 px-3 py-3 text-right align-middle">
                        {rowActions(row)}
                      </td>
                    )}
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-3 py-2.5 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>Rows</span>
          <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
            <SelectTrigger className="h-8 w-20" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="hidden sm:inline">
            Showing {visible.length} on page {page + 1}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="size-4" /> Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={(page + 1) * pageSize >= visible.length}
            onClick={() => onPageChange(page + 1)}
          >
            Next <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
