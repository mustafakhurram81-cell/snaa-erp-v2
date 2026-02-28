"use client";

import React, { useState } from "react";
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
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Columns3, Search, X } from "lucide-react";

// --- DataTable ---

interface DataTableProps<TData> {
    columns: ColumnDef<TData, unknown>[];
    data: TData[];
    onRowClick?: (row: TData) => void;
    emptyMessage?: string;
    enableSelection?: boolean;
    enablePagination?: boolean;
    enableColumnVisibility?: boolean;
    searchPlaceholder?: string;
    pageSize?: number;
    onBulkDelete?: (items: TData[]) => void;
}

export function DataTable<TData>({
    columns,
    data,
    onRowClick,
    emptyMessage = "No data available",
    enableSelection = false,
    enablePagination = true,
    enableColumnVisibility = false,
    searchPlaceholder = "Search...",
    pageSize = 20,
    onBulkDelete,
}: DataTableProps<TData>) {
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

            {/* Table */}
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

export type { ColumnDef };
