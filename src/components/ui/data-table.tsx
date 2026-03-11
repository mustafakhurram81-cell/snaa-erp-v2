"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    flexRender,
    type ColumnDef,
    type SortingState,
    type ColumnFiltersState,
    type VisibilityState,
    type RowSelectionState,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { getStatusColor } from "@/lib/utils";
import { Input, Button, StatusBadge, Select, Tooltip, TooltipProvider, Checkbox } from "@/components/ui/shared";
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Columns3, Search, X, Filter, ChevronsLeft, ChevronsRight, Trash2, Download, Bookmark, Save, Printer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- DataTable ---

// --- DataTable ---

interface DataTableProps<TData> {
    columns: ColumnDef<TData, unknown>[];
    data: TData[];
    onRowClick?: (row: TData) => void;
    emptyMessage?: string;
    enableSelection?: boolean;
    enablePagination?: boolean;
    enableColumnVisibility?: boolean;
    enableColumnResizing?: boolean;
    enableColumnFilters?: boolean;
    filterableColumns?: string[]; // column IDs that can be filtered (e.g. ["status"])
    searchPlaceholder?: string;
    pageSize?: number;
    onBulkDelete?: (items: TData[]) => void;
    onBulkStatusUpdate?: (items: TData[], status: string) => void;
    bulkStatusOptions?: string[];
    tableId?: string;
}

export function DataTable<TData>({
    columns,
    data,
    onRowClick,
    emptyMessage = "No data available",
    enableSelection = false,
    enablePagination = true,
    enableColumnVisibility = false,
    enableColumnResizing = true,
    enableColumnFilters = false,
    filterableColumns = [],
    searchPlaceholder = "Search...",
    pageSize = 20,
    onBulkDelete,
    onBulkStatusUpdate,
    bulkStatusOptions,
    tableId,
}: DataTableProps<TData>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [showColumnMenu, setShowColumnMenu] = useState(false);

    // Clear row selection when data changes
    React.useEffect(() => {
        setRowSelection({});
    }, [data]);

    const allColumns = useMemo(() => {
        const cols = enableSelection
            ? [
                {
                    id: "select",
                    header: ({ table }: any) => (
                        <Checkbox
                            checked={table.getIsAllPageRowsSelected()}
                            onCheckedChange={(checked: boolean) => table.toggleAllPageRowsSelected(!!checked)}
                            aria-label="Select all"
                        />
                    ),
                    cell: ({ row }: any) => (
                        <Checkbox
                            checked={row.getIsSelected()}
                            onCheckedChange={(checked: boolean) => row.toggleSelected(!!checked)}
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            aria-label="Select row"
                        />
                    ),
                    enableSorting: false,
                    enableHiding: false,
                    size: 40,
                },
                ...columns,
            ]
            : columns;
        return cols;
    }, [enableSelection, columns]);

    const myCustomFilterFn = useCallback((row: any, columnId: string, filterValue: any) => {
        const value = row.getValue(columnId);
        if (value == null) return false;

        if (Array.isArray(filterValue)) {
            const [start, end] = filterValue;
            if (!start && !end) return true;

            const isDate = typeof value === "string" && value.length >= 10 && (value.includes("-") || value.includes("/"));
            if (isDate) {
                const dateVal = new Date(value).getTime();
                if (!isNaN(dateVal)) {
                    if (start && new Date(start).getTime() > dateVal) return false;

                    // Add 24h to end date to hit the end of the day bounds
                    if (end && (new Date(end).getTime() + 86400000) < dateVal) return false;
                    return true;
                }
            }

            const numVal = Number(value);
            if (!isNaN(numVal)) {
                if (start && numVal < Number(start)) return false;
                if (end && numVal > Number(end)) return false;
                return true;
            }
            return true;
        }

        return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
    }, []);

    const table = useReactTable({
        data,
        columns: allColumns,
        state: {
            sorting,
            globalFilter,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        filterFns: { custom: myCustomFilterFn },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
        enableRowSelection: enableSelection,
        enableColumnResizing,
        columnResizeMode: "onChange",
        defaultColumn: {
            filterFn: "custom" as any
        },
        initialState: {
            pagination: {
                pageSize,
            },
        },
    });
    const selectedRows = table.getFilteredSelectedRowModel().rows.map((r) => r.original);
    const selectedCount = selectedRows.length;

    const exportCSV = () => {
        const items = selectedRows.length > 0 ? selectedRows : data;
        const visibleColumns = table.getVisibleLeafColumns().filter((c) => c.id !== "select" && c.id !== "actions");
        const headers = visibleColumns.map((c) => typeof c.columnDef.header === "string" ? c.columnDef.header : c.id);
        const rows = items.map((item) =>
            visibleColumns.map((c) => {
                const val = (item as Record<string, unknown>)[c.id];
                return typeof val === "string" || typeof val === "number" ? String(val) : "";
            })
        );
        const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "export.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-3">
            {/* Toolbar: Search + Column Visibility */}
            <div className="flex items-center justify-between gap-3">
                <div className="relative max-w-sm flex-1">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                        style={{ color: "var(--muted-foreground)" }}
                    />
                    <input
                        type="text"
                        value={globalFilter ?? ""}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="w-full h-9 pl-10 pr-8 rounded-lg border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 placeholder:text-[var(--muted-foreground)]"
                        style={{
                            background: "var(--background)",
                            borderColor: "var(--border)",
                            color: "var(--foreground)",
                        }}
                    />
                    {globalFilter && (
                        <button
                            onClick={() => setGlobalFilter("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-[var(--secondary)] transition-colors"
                        >
                            <X className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <TooltipProvider>
                        {enableColumnFilters && filterableColumns.length > 0 && (
                            <ColumnFilterMenu
                                table={table}
                                data={data}
                                filterableColumns={filterableColumns}
                                columnFilters={columnFilters}
                                setColumnFilters={setColumnFilters}
                            />
                        )}

                        <Tooltip content="Print & Export PDF">
                            <button
                                onClick={() => window.print()}
                                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-xs font-medium transition-all hover:bg-[var(--secondary)]"
                                style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
                            >
                                <Printer className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Print</span>
                            </button>
                        </Tooltip>

                        {enableColumnVisibility && (
                            <div className="relative">
                                <Tooltip content="Toggle Columns">
                                    <button
                                        onClick={() => setShowColumnMenu(!showColumnMenu)}
                                        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-xs font-medium transition-all hover:bg-[var(--secondary)]"
                                        style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
                                    >
                                        <Columns3 className="w-3.5 h-3.5" />
                                        Columns
                                    </button>
                                </Tooltip>
                                {showColumnMenu && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowColumnMenu(false)} />
                                        <div
                                            className="absolute right-0 top-full mt-1 z-50 w-48 rounded-xl border shadow-xl p-1.5"
                                            style={{ background: "var(--card)", borderColor: "var(--border)" }}
                                        >
                                            {table
                                                .getAllLeafColumns()
                                                .filter((col) => col.id !== "select" && col.getCanHide())
                                                .map((col) => (
                                                    <label
                                                        key={col.id}
                                                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-[var(--secondary)] transition-colors"
                                                    >
                                                        <Checkbox
                                                            checked={col.getIsVisible()}
                                                            onCheckedChange={(checked: boolean) => col.toggleVisibility(!!checked)}
                                                        />
                                                        <span
                                                            className="text-xs font-medium capitalize"
                                                            style={{ color: "var(--foreground)" }}
                                                        >
                                                            {typeof col.columnDef.header === "string"
                                                                ? col.columnDef.header
                                                                : col.id.replace(/_/g, " ")}
                                                        </span>
                                                    </label>
                                                ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </TooltipProvider>
                </div>
            </div>

            {/* Active filter chips */}
            {columnFilters.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Filters:</span>
                    {columnFilters.map((f) => (
                        <span
                            key={f.id}
                            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
                            style={{ background: "var(--brand-50)", color: "var(--brand-600)" }}
                        >
                            <span className="capitalize">{f.id.replace(/_/g, " ")}</span>: <span className="capitalize">{String(f.value).replace(/_/g, " ")}</span>
                            <button
                                onClick={() => setColumnFilters(prev => prev.filter(cf => cf.id !== f.id))}
                                className="ml-0.5 hover:text-red-500 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                    <button
                        onClick={() => setColumnFilters([])}
                        className="text-xs font-medium px-2 py-1 rounded-lg hover:bg-[var(--secondary)] transition-colors"
                        style={{ color: "var(--muted-foreground)" }}
                    >
                        Clear all
                    </button>
                </div>
            )}

            {/* Table View */}
            <div
                className="rounded-xl overflow-hidden shadow-sm"
                style={{ background: "var(--card)" }}
            >
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto relative">
                    <table className="w-full">
                        <thead className="sticky top-0 z-10" style={{ background: "var(--secondary)" }}>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr
                                    key={headerGroup.id}
                                    className="border-b"
                                    style={{ borderColor: "var(--border)" }}
                                >
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className={cn(
                                                "text-left text-[11px] font-bold uppercase tracking-[0.05em] px-4 py-3",
                                                header.column.getCanSort() && "cursor-pointer select-none hover:text-[var(--foreground)] transition-colors"
                                            )}
                                            style={{
                                                color: "var(--muted-foreground)",
                                                background: "var(--secondary)",
                                                width: header.getSize() !== 150 ? header.getSize() : (header.column.id === "select" ? 40 : undefined),
                                                position: "relative",
                                            }}
                                            onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                                        >
                                            <div className="flex items-center gap-1">
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(header.column.columnDef.header, header.getContext())}
                                                {header.column.getCanSort() && (
                                                    <span className="inline-flex flex-col ml-1">
                                                        {header.column.getIsSorted() === "asc" ? (
                                                            <ChevronUp className="w-3.5 h-3.5 text-foreground" />
                                                        ) : header.column.getIsSorted() === "desc" ? (
                                                            <ChevronDown className="w-3.5 h-3.5 text-foreground" />
                                                        ) : (
                                                            <ChevronsUpDown className="w-3 h-3 opacity-40" />
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                            {enableColumnResizing && header.column.getCanResize() && (
                                                <div
                                                    onMouseDown={header.getResizeHandler()}
                                                    onTouchStart={header.getResizeHandler()}
                                                    className={cn(
                                                        "absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500/50 touch-none",
                                                        header.column.getIsResizing() ? "bg-blue-500" : "bg-transparent"
                                                    )}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {table.getRowModel().rows.length === 0 ? (
                                <motion.tr
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <td
                                        colSpan={allColumns.length}
                                        className="text-center py-12 text-sm"
                                        style={{ color: "var(--muted-foreground)" }}
                                    >
                                        {emptyMessage}
                                    </td>
                                </motion.tr>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {table.getRowModel().rows.map((row, index) => (
                                        <motion.tr
                                            key={row.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                                            className={cn(
                                                "border-b last:border-b-0 transition-all duration-200 relative",
                                                onRowClick && "cursor-pointer hover:bg-[var(--secondary)] hover:text-foreground hover:-translate-y-[1px] hover:shadow-md hover:z-10",
                                                row.getIsSelected() && "bg-secondary/50 dark:bg-secondary/20"
                                            )}
                                            style={{ borderColor: "var(--border)" }}
                                            onClick={() => onRowClick?.(row.original)}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <td
                                                    key={cell.id}
                                                    className="px-4 text-[13px] transition-all py-2.5"
                                                    style={{
                                                        color: "var(--foreground)",
                                                        width: cell.column.getSize() !== 150 ? cell.column.getSize() : undefined
                                                    }}
                                                >
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </td>
                                            ))}
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {enablePagination && (
                <div className="flex items-center justify-between px-1">
                    {/* Mobile footer optimization */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
                        {/* Selected items & Rows per page */}
                        <div className="flex items-center gap-4 text-xs font-semibold w-full sm:w-auto justify-between sm:justify-start" style={{ color: "var(--muted-foreground)" }}>
                            {enableSelection && (
                                <span>
                                    {table.getFilteredSelectedRowModel().rows.length} of{" "}
                                    {table.getFilteredRowModel().rows.length} selected
                                </span>
                            )}

                            <div className="flex items-center gap-2">
                                <span>Rows per page:</span>
                                <Select
                                    value={String(table.getState().pagination.pageSize)}
                                    onChange={(e: any) => table.setPageSize(Number(e.target.value))}
                                    options={[10, 20, 50, 100].map(pageSize => ({ value: String(pageSize), label: String(pageSize) }))}
                                    className="h-7 w-[70px] min-w-0 pr-2 pl-2 rounded-md border text-xs bg-transparent focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                                />
                            </div>
                        </div>

                        {/* Pagination controls */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                            <span className="text-xs font-semibold whitespace-nowrap" style={{ color: "var(--foreground)" }}>
                                Page {table.getState().pagination.pageIndex + 1} of{" "}
                                {table.getPageCount() || 1}
                            </span>

                            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-start">
                                {/* First/Prev group */}
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => table.setPageIndex(0)}
                                        disabled={!table.getCanPreviousPage()}
                                        className="h-8 w-8 inline-flex justify-center items-center rounded-lg border transition-colors hover:bg-[var(--secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                                    >
                                        <span className="sr-only">Go to first page</span>
                                        <ChevronsLeft className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => table.previousPage()}
                                        disabled={!table.getCanPreviousPage()}
                                        className="h-8 w-8 inline-flex justify-center items-center rounded-lg border transition-colors hover:bg-[var(--secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                                    >
                                        <span className="sr-only">Go to previous page</span>
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Next/Last group */}
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => table.nextPage()}
                                        disabled={!table.getCanNextPage()}
                                        className="h-8 w-8 inline-flex justify-center items-center rounded-lg border transition-colors hover:bg-[var(--secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                                    >
                                        <span className="sr-only">Go to next page</span>
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                        disabled={!table.getCanNextPage()}
                                        className="h-8 w-8 inline-flex justify-center items-center rounded-lg border transition-colors hover:bg-[var(--secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                                    >
                                        <span className="sr-only">Go to last page</span>
                                        <ChevronsRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Bulk Action Bar */}
            {enableSelection && selectedCount > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
                    <div
                        className="flex items-center gap-4 px-4 py-3 rounded-full border shadow-2xl backdrop-blur-md"
                        style={{ background: "var(--card)", borderColor: "var(--border)" }}
                    >
                        <span className="text-sm font-semibold whitespace-nowrap px-2" style={{ color: "var(--foreground)" }}>
                            {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
                        </span>

                        <div className="w-px h-5" style={{ background: "var(--border)" }}></div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={exportCSV}
                                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-[var(--secondary)]"
                                style={{ color: "var(--foreground)" }}
                            >
                                Export CSV
                            </button>
                            {onBulkStatusUpdate && bulkStatusOptions && (
                                <BulkStatusDropdown
                                    options={bulkStatusOptions}
                                    onSelect={(status) => {
                                        onBulkStatusUpdate(selectedRows, status);
                                        setRowSelection({});
                                    }}
                                />
                            )}
                            {onBulkDelete && (
                                <button
                                    onClick={() => {
                                        onBulkDelete(selectedRows);
                                        setRowSelection({});
                                    }}
                                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                                >
                                    Delete
                                </button>
                            )}
                            <button
                                onClick={() => setRowSelection({})}
                                className="text-xs px-2 py-1.5 rounded-lg transition-colors hover:bg-[var(--secondary)]"
                                style={{ color: "var(--muted-foreground)" }}
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/** Dropdown for bulk status update */
function BulkStatusDropdown({ options, onSelect }: { options: string[]; onSelect: (status: string) => void }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20"
                style={{ color: "var(--primary)" }}
            >
                Change Status ▾
            </button>
            {open && (
                <div
                    className="absolute bottom-full mb-1 left-0 w-40 rounded-lg border shadow-lg overflow-hidden z-50"
                    style={{ background: "var(--card)", borderColor: "var(--border)" }}
                >
                    {options.map((opt) => (
                        <button
                            key={opt}
                            className="w-full text-left text-xs px-3 py-2 hover:bg-[var(--secondary)] transition-colors capitalize"
                            style={{ color: "var(--foreground)" }}
                            onClick={() => { onSelect(opt); setOpen(false); }}
                        >
                            {opt.replace(/_/g, " ")}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

/** Column filter dropdown menu */
function ColumnFilterMenu<TData>({
    table,
    data,
    filterableColumns,
    columnFilters,
    setColumnFilters,
}: {
    table: any;
    data: TData[];
    filterableColumns: string[];
    columnFilters: ColumnFiltersState;
    setColumnFilters: (val: ColumnFiltersState | ((prev: ColumnFiltersState) => ColumnFiltersState)) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const columnTypes = useMemo(() => {
        const types: Record<string, "text" | "number" | "date"> = {};
        filterableColumns.forEach(colId => {
            const firstValid = data.find(row => (row as any)[colId] != null);
            if (firstValid) {
                const val = (firstValid as any)[colId];
                if (typeof val === "number" || colId.includes("amount") || colId.includes("price") || colId.includes("total")) types[colId] = "number";
                else if (val instanceof Date || colId.includes("date") || colId.includes("created_at") || colId.match(/_at$/)) types[colId] = "date";
                else types[colId] = "text";
            } else {
                types[colId] = "text";
            }
        });
        return types;
    }, [data, filterableColumns]);

    const activeFilterCount = columnFilters.length;

    const handleRangeChange = (colId: string, index: 0 | 1, val: string) => {
        setColumnFilters(prev => {
            const existing = prev.find(f => f.id === colId);
            const tuple = Array.isArray(existing?.value) ? [...(existing?.value as any[])] : ["", ""];
            tuple[index] = val;
            if (!tuple[0] && !tuple[1]) return prev.filter(f => f.id !== colId);
            return [...prev.filter(f => f.id !== colId), { id: colId, value: tuple }];
        });
    };

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-xs font-medium transition-all hover:bg-[var(--secondary)]"
                style={{ borderColor: activeFilterCount > 0 ? "var(--primary)" : "var(--border)", color: activeFilterCount > 0 ? "var(--primary)" : "var(--muted-foreground)" }}
            >
                <Filter className="w-3.5 h-3.5" />
                Filter
                {activeFilterCount > 0 && (
                    <span className="ml-0.5 text-[10px] font-bold bg-blue-600 text-white w-4 h-4 rounded-full flex items-center justify-center">
                        {activeFilterCount}
                    </span>
                )}
            </button>
            {open && (
                <div
                    className="absolute right-0 top-full mt-1 z-50 w-56 rounded-xl border shadow-xl p-2 max-h-80 overflow-y-auto"
                    style={{ background: "var(--card)", borderColor: "var(--border)" }}
                >
                    {filterableColumns.map(colId => {
                        const col = table.getColumn(colId);
                        const headerName = col && typeof col.columnDef.header === "string"
                            ? col.columnDef.header
                            : colId.replace(/_/g, " ");
                        const activeValue = columnFilters.find(f => f.id === colId)?.value as any;

                        return (
                            <div key={colId} className="mb-3 last:mb-0 pb-3 last:pb-0 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                                <div className="flex justify-between items-center mb-1.5 px-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider capitalize" style={{ color: "var(--muted-foreground)" }}>
                                        {headerName}
                                    </span>
                                    {activeValue && (
                                        <button
                                            onClick={() => setColumnFilters((prev) => prev.filter((f) => f.id !== colId))}
                                            className="text-[10px] text-red-500 hover:text-red-600 transition-colors"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>

                                {columnTypes[colId] === "number" && (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            value={Array.isArray(activeValue) ? activeValue[0] : ""}
                                            onChange={(e) => handleRangeChange(colId, 0, e.target.value)}
                                            className="w-1/2 h-8 px-2 text-xs rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                                        />
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            value={Array.isArray(activeValue) ? activeValue[1] : ""}
                                            onChange={(e) => handleRangeChange(colId, 1, e.target.value)}
                                            className="w-1/2 h-8 px-2 text-xs rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                                        />
                                    </div>
                                )}

                                {columnTypes[colId] === "date" && (
                                    <div className="flex flex-col gap-1.5">
                                        <input
                                            type="date"
                                            title="Start Date"
                                            value={Array.isArray(activeValue) ? activeValue[0] : ""}
                                            onChange={(e) => handleRangeChange(colId, 0, e.target.value)}
                                            className="w-full h-8 px-2 text-xs rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                                        />
                                        <input
                                            type="date"
                                            title="End Date"
                                            value={Array.isArray(activeValue) ? activeValue[1] : ""}
                                            onChange={(e) => handleRangeChange(colId, 1, e.target.value)}
                                            className="w-full h-8 px-2 text-xs rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                                        />
                                    </div>
                                )}

                                {columnTypes[colId] === "text" && (
                                    <input
                                        type="text"
                                        placeholder={`Filter ${headerName.toLowerCase()}...`}
                                        value={typeof activeValue === "string" ? activeValue : ""}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setColumnFilters(prev => {
                                                if (!val) return prev.filter(f => f.id !== colId);
                                                return [...prev.filter(f => f.id !== colId), { id: colId, value: val }];
                                            });
                                        }}
                                        className="w-full h-8 px-2.5 text-xs rounded-lg border bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export type { ColumnDef };
