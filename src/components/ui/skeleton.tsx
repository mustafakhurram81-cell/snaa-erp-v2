"use client";

import React from "react";

/**
 * Animated skeleton placeholder for loading states.
 */
export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
    return (
        <div
            className={`animate-pulse rounded-lg ${className}`}
            style={{
                background: "var(--secondary)",
                ...style,
            }}
        />
    );
}

/** Skeleton for a stat card */
export function StatCardSkeleton() {
    return (
        <div className="rounded-xl border p-5" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-32 mb-2" />
            <Skeleton className="h-3 w-20" />
        </div>
    );
}

/** Skeleton for a data table row */
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
    return (
        <tr className="border-b" style={{ borderColor: "var(--border)" }}>
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <Skeleton className="h-4 w-full" style={{ maxWidth: i === 0 ? "100px" : "80px" }} />
                </td>
            ))}
        </tr>
    );
}

/** Skeleton for a full card widget */
export function CardSkeleton({ height = 200 }: { height?: number }) {
    return (
        <div className="rounded-xl border p-5" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <Skeleton className="h-4 w-32 mb-1.5" />
                    <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-7 w-16 rounded-lg" />
            </div>
            <Skeleton className="w-full rounded-xl" style={{ height }} />
        </div>
    );
}

/** Skeleton for a full data table */
export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
    return (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            {/* Search bar */}
            <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                <Skeleton className="h-9 w-64 rounded-lg" />
            </div>
            {/* Header */}
            <div className="flex gap-4 px-4 py-3" style={{ background: "var(--secondary)" }}>
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={`h-${i}`} className="h-3 flex-1 rounded-md opacity-60" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIdx) => (
                <div
                    key={rowIdx}
                    className="flex gap-4 px-4 py-3.5 border-t"
                    style={{ borderColor: "var(--border)" }}
                >
                    {Array.from({ length: columns }).map((_, colIdx) => (
                        <Skeleton key={`r${rowIdx}-c${colIdx}`} className="h-3 flex-1 rounded-md" />
                    ))}
                </div>
            ))}
        </div>
    );
}

/** Skeleton for a chart widget */
export function ChartSkeleton() {
    return (
        <div className="rounded-xl border p-6" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
            <div className="flex items-center justify-between mb-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="flex items-end gap-3 h-[200px]">
                {[40, 65, 50, 80, 45, 70, 55, 90].map((h, i) => (
                    <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%` }} />
                ))}
            </div>
        </div>
    );
}

/** Full page skeleton: header + stat cards + table */
export function PageSkeleton() {
    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-40" />
                    <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-9 w-32 rounded-lg" />
            </div>
            <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (<StatCardSkeleton key={i} />))}
            </div>
            <TableSkeleton rows={6} columns={5} />
        </div>
    );
}
