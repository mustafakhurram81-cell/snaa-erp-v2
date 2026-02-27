"use client";

import React from "react";
import { cn } from "@/lib/utils";

// --- Page Header ---
interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
    return (
        <div className="flex items-start justify-between mb-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
                    {title}
                </h1>
                {description && (
                    <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
                        {description}
                    </p>
                )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
}

// --- Stat Card ---
interface StatCardProps {
    title: string;
    value: string | number;
    change?: string;
    changeType?: "positive" | "negative" | "neutral";
    icon?: React.ReactNode;
    className?: string;
}

export function StatCard({ title, value, change, changeType = "neutral", icon, className }: StatCardProps) {
    return (
        <div
            className={cn(
                "rounded-xl border p-5 transition-all duration-200 shadow-soft hover:shadow-soft-md hover:-translate-y-0.5 group",
                className
            )}
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                        {title}
                    </p>
                    <p className="text-3xl font-bold mt-2 tracking-tight" style={{ color: "var(--foreground)" }}>
                        {value}
                    </p>
                    {change && (
                        <p
                            className={cn(
                                "text-xs font-medium mt-1.5",
                                changeType === "positive" && "text-emerald-600 dark:text-emerald-400",
                                changeType === "negative" && "text-red-600 dark:text-red-400",
                                changeType === "neutral" && "text-[var(--muted-foreground)]"
                            )}
                        >
                            {change}
                        </p>
                    )}
                </div>
                {icon && (
                    <div
                        className="p-2.5 rounded-xl transition-colors"
                        style={{ background: "var(--secondary)" }}
                    >
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
}

// --- Status Badge ---
interface StatusBadgeProps {
    status: string;
    className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const colors: Record<string, string> = {
        active: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
        draft: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700",
        sent: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
        accepted: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
        rejected: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
        confirmed: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
        in_progress: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
        completed: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
        shipped: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800",
        delivered: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
        paid: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
        overdue: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
        pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
        planned: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700",
        received: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
        closed: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700",
        cancelled: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
        processing: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
    };

    const colorClass = colors[status.toLowerCase().replace(/[\s-]/g, "_")] ||
        "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700";

    return (
        <span
            className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border capitalize",
                colorClass,
                className
            )}
        >
            {status.replace(/_/g, " ")}
        </span>
    );
}

// --- Data Table ---
interface Column<T> {
    key: string;
    label: string;
    render?: (item: T) => React.ReactNode;
    className?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    onRowClick?: (item: T) => void;
    emptyMessage?: string;
    bulkActions?: boolean;
    onBulkDelete?: (items: T[]) => void;
}

export function DataTable<T extends Record<string, unknown>>({
    columns,
    data,
    onRowClick,
    emptyMessage = "No data available",
    bulkActions = false,
    onBulkDelete,
}: DataTableProps<T>) {
    const [selected, setSelected] = React.useState<Set<number>>(new Set());

    const toggleAll = () => {
        if (selected.size === data.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(data.map((_, i) => i)));
        }
    };

    const toggleOne = (idx: number) => {
        const next = new Set(selected);
        if (next.has(idx)) next.delete(idx);
        else next.add(idx);
        setSelected(next);
    };

    const exportCSV = () => {
        const selectedItems = data.filter((_, i) => selected.has(i));
        const items = selectedItems.length > 0 ? selectedItems : data;
        const headers = columns.map((c) => c.label);
        const rows = items.map((item) =>
            columns.map((c) => {
                const val = item[c.key];
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

    const colSpan = columns.length + (bulkActions ? 1 : 0);

    return (
        <div className="relative">
            <div
                className="rounded-xl border overflow-hidden"
                style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                                {bulkActions && (
                                    <th className="w-10 px-3 py-3" style={{ background: "var(--secondary)" }}>
                                        <input
                                            type="checkbox"
                                            checked={selected.size === data.length && data.length > 0}
                                            onChange={toggleAll}
                                            className="w-3.5 h-3.5 rounded cursor-pointer accent-blue-600"
                                        />
                                    </th>
                                )}
                                {columns.map((col) => (
                                    <th
                                        key={col.key}
                                        className={cn(
                                            "text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-3",
                                            col.className
                                        )}
                                        style={{ color: "var(--muted-foreground)", background: "var(--secondary)" }}
                                    >
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={colSpan}
                                        className="text-center py-12 text-sm"
                                        style={{ color: "var(--muted-foreground)" }}
                                    >
                                        {emptyMessage}
                                    </td>
                                </tr>
                            ) : (
                                data.map((item, idx) => (
                                    <tr
                                        key={idx}
                                        className={cn(
                                            "border-b last:border-b-0 transition-colors",
                                            onRowClick && "cursor-pointer hover:bg-[var(--secondary)]",
                                            selected.has(idx) && "bg-blue-50/50 dark:bg-blue-900/10"
                                        )}
                                        style={{ borderColor: "var(--border)" }}
                                        onClick={() => onRowClick?.(item)}
                                    >
                                        {bulkActions && (
                                            <td className="w-10 px-3 py-3" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={selected.has(idx)}
                                                    onChange={() => toggleOne(idx)}
                                                    className="w-3.5 h-3.5 rounded cursor-pointer accent-blue-600"
                                                />
                                            </td>
                                        )}
                                        {columns.map((col) => (
                                            <td
                                                key={col.key}
                                                className={cn("px-4 py-3 text-sm", col.className)}
                                                style={{ color: "var(--foreground)" }}
                                            >
                                                {col.render ? col.render(item) : (item[col.key] as React.ReactNode)}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Floating bulk action bar */}
            {bulkActions && selected.size > 0 && (
                <div
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border shadow-xl backdrop-blur-sm"
                    style={{ background: "var(--card)", borderColor: "var(--border)" }}
                >
                    <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                        {selected.size} selected
                    </span>
                    <div className="w-px h-5" style={{ background: "var(--border)" }} />
                    <button onClick={exportCSV} className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-[var(--secondary)]" style={{ color: "var(--primary)" }}>
                        Export CSV
                    </button>
                    {onBulkDelete && (
                        <button
                            onClick={() => { onBulkDelete(data.filter((_, i) => selected.has(i))); setSelected(new Set()); }}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                        >
                            Delete
                        </button>
                    )}
                    <button onClick={() => setSelected(new Set())} className="text-xs px-2 py-1.5 rounded-lg transition-colors hover:bg-[var(--secondary)]" style={{ color: "var(--muted-foreground)" }}>
                        Clear
                    </button>
                </div>
            )}
        </div>
    );
}

// --- Empty State ---
interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
            <div
                className="p-4 rounded-2xl mb-4"
                style={{ background: "var(--secondary)" }}
            >
                {icon}
            </div>
            <h3 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
                {title}
            </h3>
            <p className="text-sm mt-1 mb-4 max-w-sm text-center" style={{ color: "var(--muted-foreground)" }}>
                {description}
            </p>
            {action}
        </div>
    );
}

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "destructive";
    size?: "sm" | "md" | "lg";
    children: React.ReactNode;
}

export function Button({
    variant = "primary",
    size = "md",
    className,
    children,
    ...props
}: ButtonProps) {
    const variants = {
        primary:
            "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm",
        secondary:
            "border text-[var(--foreground)] hover:bg-[var(--secondary)] active:bg-[var(--accent)]",
        ghost:
            "text-[var(--foreground)] hover:bg-[var(--secondary)]",
        destructive:
            "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-5 py-2.5 text-sm",
    };

    return (
        <button
            className={cn(
                "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
                variants[variant],
                sizes[size],
                className
            )}
            style={variant === "secondary" ? { borderColor: "var(--border)" } : undefined}
            {...props}
        >
            {children}
        </button>
    );
}

// --- Card ---
interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: boolean;
    onClick?: () => void;
}

export function Card({ children, className, padding = true, onClick }: CardProps) {
    return (
        <div
            className={cn(
                "rounded-xl border transition-all shadow-soft",
                padding && "p-5",
                className
            )}
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
            onClick={onClick}
        >
            {children}
        </div>
    );
}

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
    return (
        <div className="space-y-1.5">
            {label && (
                <label className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                    {label}
                </label>
            )}
            <input
                className={cn(
                    "flex h-9 w-full rounded-lg border px-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 placeholder:text-[var(--muted-foreground)]",
                    error && "border-red-500 focus:ring-red-500/30",
                    className
                )}
                style={{
                    background: "var(--background)",
                    borderColor: error ? undefined : "var(--border)",
                    color: "var(--foreground)",
                }}
                {...props}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}

// --- Select ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: { value: string; label: string }[];
}

export function Select({ label, options, className, ...props }: SelectProps) {
    return (
        <div className="space-y-1.5">
            {label && (
                <label className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                    {label}
                </label>
            )}
            <select
                className={cn(
                    "flex h-9 w-full rounded-lg border px-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer",
                    className
                )}
                style={{
                    background: "var(--background)",
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                }}
                {...props}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

// --- Tabs ---
interface TabsProps {
    tabs: { key: string; label: string; count?: number }[];
    activeTab: string;
    onChange: (key: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
    return (
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "var(--secondary)" }}>
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    onClick={() => onChange(tab.key)}
                    className={cn(
                        "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                        activeTab === tab.key
                            ? "bg-[var(--card)] shadow-sm text-[var(--foreground)]"
                            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    )}
                >
                    {tab.label}
                    {tab.count !== undefined && (
                        <span className="ml-1.5 text-xs opacity-60">{tab.count}</span>
                    )}
                </button>
            ))}
        </div>
    );
}

// --- Drawer Tabs ---
interface DrawerTabsProps {
    tabs: { key: string; label: string; count?: number }[];
    activeTab: string;
    onChange: (key: string) => void;
}

export function DrawerTabs({ tabs, activeTab, onChange }: DrawerTabsProps) {
    return (
        <div className="flex items-center gap-0 border-b mb-5" style={{ borderColor: "var(--border)" }}>
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    onClick={() => onChange(tab.key)}
                    className={cn(
                        "px-4 py-2.5 text-sm font-medium transition-all relative",
                        activeTab === tab.key
                            ? "text-[var(--foreground)]"
                            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    )}
                >
                    {tab.label}
                    {tab.count !== undefined && (
                        <span className="ml-1.5 text-xs opacity-60">{tab.count}</span>
                    )}
                    {activeTab === tab.key && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t" />
                    )}
                </button>
            ))}
        </div>
    );
}

// --- Dialog / Modal ---
interface DialogProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    width?: string;
}

export function Dialog({ open, onClose, title, children, width = "max-w-lg" }: DialogProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />
            <div
                className={cn(
                    "relative z-10 w-full rounded-xl border shadow-2xl animate-scale-in",
                    width
                )}
                style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
                    <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md transition-colors hover:bg-[var(--secondary)]"
                        style={{ color: "var(--muted-foreground)" }}
                    >
                        ✕
                    </button>
                </div>
                <div className="px-6 py-4">{children}</div>
            </div>
        </div>
    );
}

// --- Search Input ---
interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder = "Search..." }: SearchInputProps) {
    return (
        <div className="relative">
            <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "var(--muted-foreground)" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
            </svg>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full h-9 pl-10 pr-4 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-[var(--muted-foreground)]"
                style={{
                    background: "var(--background)",
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                }}
            />
        </div>
    );
}

// --- Drawer ---
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";

interface DrawerProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    width?: string;
    footer?: React.ReactNode;
}

export function Drawer({ open, onClose, title, children, width = "max-w-lg", footer }: DrawerProps) {
    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className={cn(
                            "fixed right-0 top-0 z-50 h-screen w-full flex flex-col shadow-soft-lg",
                            width
                        )}
                        style={{ background: "var(--card)" }}
                    >
                        {/* Header */}
                        <div
                            className="flex items-center justify-between px-6 py-4 border-b shrink-0"
                            style={{ borderColor: "var(--border)" }}
                        >
                            <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
                                {title}
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg transition-colors hover:bg-[var(--secondary)]"
                                style={{ color: "var(--muted-foreground)" }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto px-6 py-5">
                            {children}
                        </div>

                        {/* Footer */}
                        {footer && (
                            <div
                                className="px-6 py-4 border-t shrink-0"
                                style={{ borderColor: "var(--border)" }}
                            >
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
