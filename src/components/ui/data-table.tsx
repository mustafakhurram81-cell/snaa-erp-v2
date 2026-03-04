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
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Columns3, Search, X, Filter, LayoutGrid, Table2 } from "lucide-react";

// --- Mobile viewport hook ---
function useIsMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
        setIsMobile(mql.matches);
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mql.addEventListener("change", handler);
        return () => mql.removeEventListener("change", handler);
    }, [breakpoint]);
    return isMobile;
}

// --- DataTable ---

interface DataTableProps<TData> {
    columns: ColumnDef<TData, unknown>[];
    data: TData[];
    onRowClick?: (row: TData) => void;
    emptyMessage?: string;
    enableSelection?: boolean;
    enablePagination?: boolean;
    enableColumnVisibility?: boolean;
    enableColumnFilters?: boolean;
    filterableColumns?: string[]; // column IDs that can be filtered (e.g. ["status"])
    searchPlaceholder?: string;
    pageSize?: number;
    onBulkDelete?: (items: TData[]) => void;
    onBulkStatusUpdate?: (items: TData[], status: string) => void;
    bulkStatusOptions?: string[];
}

export function DataTable<TData>({
    columns,
    data,
    onRowClick,
    emptyMessage = "No data available",
    enableSelection = false,
    enablePagination = true,
    enableColumnVisibility = false,
    enableColumnFilters = false,
    filterableColumns = [],
    searchPlaceholder = "Search...",
    pageSize = 20,
    onBulkDelete,
    onBulkStatusUpdate,
    bulkStatusOptions,
}: DataTableProps<TData>) {
    const isMobile = useIsMobile();
    const [forceView, setForceView] = useState<"auto" | "table" | "cards">("auto");
    const showCards = forceView === "cards" || (forceView === "auto" && isMobile);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [showColumnMenu, setShowColumnMenu] = useState(false);

    const allColumns: ColumnDef<TData, unknown>[] = enableSelection
        ? [
            {
                id: "select",
                header: ({ table }) => (
                    <input
                        type="checkbox"
                        checked={table.getIsAllPageRowsSelected()}
                        onChange={table.getToggleAllPageRowsSelectedHandler()}
                        className="w-3.5 h-3.5 rounded cursor-pointer accent-blue-600"
                    />
                ),
                cell: ({ row }) => (
                    <input
                        type="checkbox"
                        checked={row.getIsSelected()}
                        onChange={row.getToggleSelectedHandler()}
                        onClick={(e) => e.stopPropagation()}
                        className="w-3.5 h-3.5 rounded cursor-pointer accent-blue-600"
                    />
                ),
                enableSorting: false,
                enableHiding: false,
                size: 40,
            },
            ...columns,
        ]
        : columns;

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
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
        enableRowSelection: enableSelection,
        initialState: {
            pagination: {
                pageSize,
            },
        },
    });

    const selectedRows = table.getFilteredSelectedRowModel().rows.map((r) => r.original);

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
                    {/* View toggle */}
                    <div className="flex items-center rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                        <button
                            onClick={() => setForceView(forceView === "table" ? "auto" : "table")}
                            className={cn("p-2 transition-colors", !showCards && "bg-[var(--secondary)]")}
                            style={{ color: !showCards ? "var(--foreground)" : "var(--muted-foreground)" }}
                            title="Table view"
                        >
                            <Table2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => setForceView(forceView === "cards" ? "auto" : "cards")}
                            className={cn("p-2 transition-colors", showCards && "bg-[var(--secondary)]")}
                            style={{ color: showCards ? "var(--foreground)" : "var(--muted-foreground)" }}
                            title="Card view"
                        >
                            <LayoutGrid className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    {enableColumnFilters && filterableColumns.length > 0 && (
                        <ColumnFilterMenu
                            table={table}
                            data={data}
                            filterableColumns={filterableColumns}
                            columnFilters={columnFilters}
                            setColumnFilters={setColumnFilters}
                        />
                    )}
                    {enableColumnVisibility && (
                        <div className="relative">
                            <button
                                onClick={() => setShowColumnMenu(!showColumnMenu)}
                                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-xs font-medium transition-all hover:bg-[var(--secondary)]"
                                style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
                            >
                                <Columns3 className="w-3.5 h-3.5" />
                                Columns
                            </button>
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
                                                    <input
                                                        type="checkbox"
                                                        checked={col.getIsVisible()}
                                                        onChange={col.getToggleVisibilityHandler()}
                                                        className="w-3.5 h-3.5 rounded accent-blue-600 cursor-pointer"
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

            {/* Table (desktop) / Card View (mobile) */}
            {showCards ? (
                /* ═══════ CARD VIEW ═══════ */
                <div className="space-y-3 data-card-view">
                    {table.getRowModel().rows.length === 0 ? (
                        <div
                            className="rounded-xl border text-center py-12 text-sm"
                            style={{ borderColor: "var(--border)", color: "var(--muted-foreground)", background: "var(--card)" }}
                        >
                            {emptyMessage}
                        </div>
                    ) : (
                        table.getRowModel().rows.map((row) => {
                            const cells = row.getVisibleCells().filter(c => c.column.id !== "select");
                            const titleCell = cells[0];
                            const statusCell = cells.find(c => c.column.id === "status");
                            const restCells = cells.filter(c => c !== titleCell && c !== statusCell);
                            return (
                                <div
                                    key={row.id}
                                    className={cn(
                                        "rounded-xl border p-4 transition-all",
                                        onRowClick && "cursor-pointer hover:shadow-md active:scale-[0.99]",
                                        row.getIsSelected() && "ring-2 ring-blue-500/40"
                                    )}
                                    style={{ background: "var(--card)", borderColor: "var(--border)" }}
                                    onClick={() => onRowClick?.(row.original)}
                                >
                                    {/* Header: Title + Status badge */}
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                                            {titleCell && flexRender(titleCell.column.columnDef.cell, titleCell.getContext())}
                                        </div>
                                        {statusCell && (
                                            <div className="flex-shrink-0">
                                                {flexRender(statusCell.column.columnDef.cell, statusCell.getContext())}
                                            </div>
                                        )}
                                    </div>
                                    {/* Key-value pairs */}
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                                        {restCells.slice(0, 6).map((cell) => {
                                            const header = typeof cell.column.columnDef.header === "string"
                                                ? cell.column.columnDef.header
                                                : cell.column.id.replace(/_/g, " ");
                                            return (
                                                <div key={cell.id}>
                                                    <div className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                                                        {header}
                                                    </div>
                                                    <div className="text-xs mt-0.5" style={{ color: "var(--foreground)" }}>
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {/* Selection checkbox */}
                                    {enableSelection && (
                                        <div className="mt-3 pt-2 border-t flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
                                            <input
                                                type="checkbox"
                                                checked={row.getIsSelected()}
                                                onChange={row.getToggleSelectedHandler()}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-3.5 h-3.5 rounded cursor-pointer accent-blue-600"
                                            />
                                            <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>Select</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            ) : (
                /* ═══════ TABLE VIEW (existing) ═══════ */
                <div
                    className="rounded-xl border overflow-hidden"
                    style={{ background: "var(--card)", borderColor: "var(--border)" }}
                >
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
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
                                                    "text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-3",
                                                    header.column.getCanSort() && "cursor-pointer select-none hover:text-[var(--foreground)] transition-colors"
                                                )}
                                                style={{
                                                    color: "var(--muted-foreground)",
                                                    background: "var(--secondary)",
                                                    width: header.column.id === "select" ? "40px" : undefined,
                                                }}
                                                onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                                            >
                                                <div className="flex items-center gap-1">
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(header.column.columnDef.header, header.getContext())}
                                                    {header.column.getCanSort() && (
                                                        <span className="inline-flex flex-col ml-0.5">
                                                            {header.column.getIsSorted() === "asc" ? (
                                                                <ChevronUp className="w-3.5 h-3.5 text-blue-500" />
                                                            ) : header.column.getIsSorted() === "desc" ? (
                                                                <ChevronDown className="w-3.5 h-3.5 text-blue-500" />
                                                            ) : (
                                                                <ChevronsUpDown className="w-3 h-3 opacity-40" />
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody>
                                {table.getRowModel().rows.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={allColumns.length}
                                            className="text-center py-12 text-sm"
                                            style={{ color: "var(--muted-foreground)" }}
                                        >
                                            {emptyMessage}
                                        </td>
                                    </tr>
                                ) : (
                                    table.getRowModel().rows.map((row) => (
                                        <tr
                                            key={row.id}
                                            className={cn(
                                                "border-b last:border-b-0 transition-colors",
                                                onRowClick && "cursor-pointer hover:bg-[var(--secondary)]",
                                                row.getIsSelected() && "bg-blue-50/50 dark:bg-blue-900/10"
                                            )}
                                            style={{ borderColor: "var(--border)" }}
                                            onClick={() => onRowClick?.(row.original)}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <td
                                                    key={cell.id}
                                                    className={cn("px-4 py-3 text-sm")}
                                                    style={{ color: "var(--foreground)" }}
                                                >
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {enablePagination && table.getPageCount() > 1 && (
                <div className="flex items-center justify-between px-1">
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        Showing{" "}
                        {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
                        –
                        {Math.min(
                            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                            table.getFilteredRowModel().rows.length
                        )}{" "}
                        of {table.getFilteredRowModel().rows.length}
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-all hover:bg-[var(--secondary)] disabled:opacity-40 disabled:pointer-events-none"
                            style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        {Array.from({ length: table.getPageCount() }, (_, i) => i).map((pageIdx) => (
                            <button
                                key={pageIdx}
                                onClick={() => table.setPageIndex(pageIdx)}
                                className={cn(
                                    "inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-medium transition-all",
                                    pageIdx === table.getState().pagination.pageIndex
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "hover:bg-[var(--secondary)]"
                                )}
                                style={
                                    pageIdx !== table.getState().pagination.pageIndex
                                        ? { color: "var(--muted-foreground)" }
                                        : undefined
                                }
                            >
                                {pageIdx + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-all hover:bg-[var(--secondary)] disabled:opacity-40 disabled:pointer-events-none"
                            style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Floating bulk action bar */}
            {enableSelection && Object.keys(rowSelection).length > 0 && (
                <div
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border shadow-xl backdrop-blur-sm"
                    style={{ background: "var(--card)", borderColor: "var(--border)" }}
                >
                    <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                        {selectedRows.length} selected
                    </span>
                    <div className="w-px h-5" style={{ background: "var(--border)" }} />
                    <button
                        onClick={exportCSV}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-[var(--secondary)]"
                        style={{ color: "var(--primary)" }}
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

    // Extract unique values for each filterable column
    const columnValues = useMemo(() => {
        const vals: Record<string, string[]> = {};
        filterableColumns.forEach(colId => {
            const uniqueVals = [...new Set(data.map(row => String((row as any)[colId] || "")).filter(Boolean))];
            vals[colId] = uniqueVals.sort();
        });
        return vals;
    }, [data, filterableColumns]);

    const activeFilterCount = columnFilters.length;

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
                        const activeValue = columnFilters.find(f => f.id === colId)?.value;

                        return (
                            <div key={colId} className="mb-2 last:mb-0">
                                <div className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 capitalize" style={{ color: "var(--muted-foreground)" }}>
                                    {headerName}
                                </div>
                                <button
                                    className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors ${!activeValue ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600" : "hover:bg-[var(--secondary)]"}`}
                                    style={{ color: !activeValue ? undefined : "var(--foreground)" }}
                                    onClick={() => {
                                        setColumnFilters(prev => prev.filter(f => f.id !== colId));
                                    }}
                                >
                                    All
                                </button>
                                {(columnValues[colId] || []).map(val => (
                                    <button
                                        key={val}
                                        className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors capitalize ${activeValue === val ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-medium" : "hover:bg-[var(--secondary)]"}`}
                                        style={{ color: activeValue === val ? undefined : "var(--foreground)" }}
                                        onClick={() => {
                                            setColumnFilters(prev => {
                                                const without = prev.filter(f => f.id !== colId);
                                                return [...without, { id: colId, value: val }];
                                            });
                                        }}
                                    >
                                        {val.replace(/_/g, " ")}
                                    </button>
                                ))}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export type { ColumnDef };
