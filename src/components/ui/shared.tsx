"use client";

import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

// --- Animated CountUp ---
function useAnimatedCount(end: number, duration: number = 1.5) {
    const [count, setCount] = React.useState(0);
    React.useEffect(() => {
        let startTime: number;
        let animationFrame: number;
        const startValue = 0;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);

            // easeOutExpo
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            setCount(Math.floor(startValue + (end - startValue) * easeProgress));

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                setCount(end); // Ensure exact final value
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [end, duration]);

    return count;
}

interface AnimatedCountUpProps {
    value: string | number;
    isCurrency?: boolean;
}

export function AnimatedCountUp({ value, isCurrency = false }: AnimatedCountUpProps) {
    const isNumeric = typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value.replace(/[^0-9.-]+/g, ""))));

    if (!isNumeric) return <span>{value}</span>;

    // Extract actual numeric value
    const numValue = typeof value === 'number' ? value : Number(value.replace(/[^0-9.-]+/g, ""));
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const count = useAnimatedCount(numValue);

    if (isCurrency || (typeof value === 'string' && value.includes('$'))) {
        return <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(count)}</span>;
    }
    return <span>{count.toLocaleString()}</span>;
}


// --- Page Header ---
interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
    return (
        <div className="flex items-start justify-between mb-8 animate-fade-in">
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
                "rounded-xl p-5 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 group",
                className
            )}
            style={{ background: "var(--card)" }}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                        {title}
                    </p>
                    <p className="text-3xl font-bold mt-2 tracking-tight" style={{ color: "var(--foreground)" }}>
                        <AnimatedCountUp value={value} />
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
                        className="p-2.5 rounded-xl transition-colors backdrop-blur-md"
                        style={{ background: "var(--secondary)", opacity: 0.9 }}
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

const STATUS_DOT_COLORS: Record<string, string> = {
    active: "bg-emerald-500",
    draft: "bg-zinc-400",
    sent: "bg-blue-500",
    accepted: "bg-emerald-500",
    rejected: "bg-red-500",
    confirmed: "bg-blue-500",
    in_progress: "bg-amber-500",
    completed: "bg-emerald-500",
    shipped: "bg-violet-500",
    delivered: "bg-emerald-500",
    paid: "bg-emerald-500",
    overdue: "bg-red-500",
    pending: "bg-amber-500",
    planned: "bg-zinc-400",
    received: "bg-emerald-500",
    closed: "bg-zinc-400",
    cancelled: "bg-red-500",
    processing: "bg-blue-500",
    partial: "bg-orange-500",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const dotColor = STATUS_DOT_COLORS[status.toLowerCase().replace(/[\s-]/g, "_")] || "bg-zinc-400";

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50",
                className
            )}
        >
            <span className={cn("w-1.5 h-1.5 rounded-full shadow-sm shadow-[inherit]", dotColor)} />
            {status.replace(/_/g, " ")}
        </span>
    );
}

// --- Inline Status Select ---
interface InlineStatusSelectProps {
    status: string;
    options: string[];
    onChange: (newStatus: string) => void;
    className?: string;
}

export function InlineStatusSelect({ status, options, onChange, className }: InlineStatusSelectProps) {
    const dotColor = STATUS_DOT_COLORS[status.toLowerCase().replace(/[\s-]/g, "_")] || "bg-zinc-400";

    return (
        <SelectPrimitive.Root value={status} onValueChange={(val) => onChange(val)}>
            <SelectPrimitive.Trigger
                className={cn(
                    "relative inline-flex items-center pl-5 pr-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-400/20 transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800",
                    className
                )}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
            >
                <span className={cn("absolute left-2 w-1.5 h-1.5 rounded-full z-10", dotColor)} />
                <SelectPrimitive.Value>
                    <span>{status.replace(/_/g, " ")}</span>
                </SelectPrimitive.Value>
                <SelectPrimitive.Icon asChild>
                    <ChevronDown className="h-3 w-3 opacity-50 ml-1.5" />
                </SelectPrimitive.Icon>
            </SelectPrimitive.Trigger>
            <SelectPrimitive.Portal>
                <SelectPrimitive.Content
                    position="popper"
                    sideOffset={4}
                    className="z-[100] min-w-[8rem] overflow-hidden rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl shadow-xl text-black dark:text-white"
                >
                    <SelectPrimitive.Viewport className="p-1">
                        {options.map((opt) => (
                            <SelectPrimitive.Item
                                key={opt}
                                value={opt}
                                className="relative flex w-full cursor-pointer select-none items-center rounded-lg py-1.5 pl-8 pr-2 text-xs font-semibold uppercase tracking-wider outline-none focus:bg-zinc-100 dark:focus:bg-zinc-800"
                            >
                                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                    <SelectPrimitive.ItemIndicator>
                                        <Check className="h-3 w-3" />
                                    </SelectPrimitive.ItemIndicator>
                                </span>
                                <SelectPrimitive.ItemText>{opt.replace(/_/g, " ")}</SelectPrimitive.ItemText>
                            </SelectPrimitive.Item>
                        ))}
                    </SelectPrimitive.Viewport>
                </SelectPrimitive.Content>
            </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
    );
}

// --- Empty State ---
interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    action?: React.ReactNode;
    className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center py-16 px-6 animate-fade-in border-2 border-dashed rounded-2xl mx-auto w-full transition-colors hover:bg-slate-50/50 dark:hover:bg-zinc-900/20",
                className
            )}
            style={{ borderColor: "var(--border)" }}
        >
            <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="p-4 rounded-2xl mb-5 shadow-sm text-[var(--muted-foreground)]"
                style={{ background: "var(--secondary)" }}
            >
                {icon}
            </motion.div>
            <h3 className="text-base font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
                {title}
            </h3>
            <p className="text-sm mt-1.5 mb-6 max-w-sm text-center" style={{ color: "var(--muted-foreground)" }}>
                {description}
            </p>
            {action && (
                <div className="mt-2 text-sm">
                    {action}
                </div>
            )}
        </div>
    );
}

// --- Skeleton ---
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-zinc-200/60 dark:bg-zinc-800/60", className)}
            {...props}
        />
    );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
    return (
        <div className="w-full space-y-3 mt-4">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={`h-${i}`} className="h-4 w-24" />
                ))}
            </div>
            {/* Rows Skeleton */}
            {Array.from({ length: rows }).map((_, i) => (
                <div key={`r-${i}`} className="flex items-center justify-between py-3">
                    {Array.from({ length: columns }).map((_, j) => (
                        <Skeleton key={`c-${i}-${j}`} className={cn("h-4", j === 0 ? "w-32" : j === columns - 1 ? "w-16" : "w-24")} />
                    ))}
                </div>
            ))}
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-3 w-1/4 mt-2" />
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
            "bg-black text-white hover:bg-neutral-800 active:bg-neutral-900 dark:bg-white dark:text-black dark:hover:bg-neutral-200 dark:active:bg-neutral-300 shadow-sm",
        secondary:
            "bg-secondary/50 hover:bg-secondary text-foreground",
        ghost:
            "text-foreground hover:bg-secondary hover:text-secondary-foreground",
        destructive:
            "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm",
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-5 py-2.5 text-sm",
    };

    return (
        <motion.button
            whileHover={{ y: -1, scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            className={cn(
                "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none before:absolute before:inset-0 before:rounded-lg before:shadow-sm before:opacity-0 hover:before:opacity-100 before:transition-opacity relative z-0",
                variants[variant],
                sizes[size],
                className
            )}
            {...(props as any)}
        >
            <span className="relative z-10 flex items-center gap-2">{children}</span>
        </motion.button>
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
                "rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md",
                padding && "p-5",
                className
            )}
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
        <div className="space-y-1.5 relative pb-0">
            {label && (
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    {label}
                </label>
            )}
            <input
                className={cn(
                    "flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 placeholder:text-muted-foreground",
                    error && "border-red-500 focus-visible:ring-red-500/30",
                    className
                )}
                {...props}
            />
            <AnimatePresence>
                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-[10px] font-medium text-red-500 mt-1 absolute -bottom-5 left-0"
                    >
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}

// --- Select ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: { value: string; label: string }[];
    placeholder?: string;
    error?: string;
}

export function Select({ label, options, className, error, ...props }: SelectProps) {
    return (
        <div className="space-y-1.5 relative pb-0">
            {label && (
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    {label}
                </label>
            )}
            <SelectPrimitive.Root value={props.value as string} onValueChange={(val) => {
                if (props.onChange) {
                    const e = { target: { value: val } } as any;
                    props.onChange(e);
                }
            }} disabled={props.disabled}>
                <SelectPrimitive.Trigger
                    className={cn(
                        "flex h-9 w-full items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 text-sm shadow-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50 focus:outline-none focus:ring-2 focus:ring-zinc-400/20 disabled:cursor-not-allowed disabled:opacity-50",
                        error && "border-red-500 focus-visible:ring-red-500/30",
                        className
                    )}
                >
                    <SelectPrimitive.Value placeholder={props.placeholder || "Select an option..."}>
                        {options.find((opt) => opt.value === props.value)?.label || props.placeholder}
                    </SelectPrimitive.Value>
                    <SelectPrimitive.Icon asChild>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                    </SelectPrimitive.Icon>
                </SelectPrimitive.Trigger>
                <SelectPrimitive.Portal>
                    <SelectPrimitive.Content
                        position="popper"
                        sideOffset={4}
                        className={cn(
                            "z-50 min-w-[8rem] overflow-hidden rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-xl text-black dark:text-white data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                        )}
                    >
                        <SelectPrimitive.Viewport className="p-1">
                            {options.map((opt) => (
                                <SelectPrimitive.Item
                                    key={opt.value}
                                    value={opt.value}
                                    className={cn(
                                        "relative flex w-full cursor-pointer select-none items-center rounded-lg py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-zinc-100 dark:focus:bg-zinc-800 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                                    )}
                                >
                                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                        <SelectPrimitive.ItemIndicator>
                                            <Check className="h-4 w-4" />
                                        </SelectPrimitive.ItemIndicator>
                                    </span>
                                    <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                                </SelectPrimitive.Item>
                            ))}
                        </SelectPrimitive.Viewport>
                    </SelectPrimitive.Content>
                </SelectPrimitive.Portal>
            </SelectPrimitive.Root>
            <AnimatePresence>
                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-[10px] font-medium text-red-500 mt-1 absolute -bottom-5 left-0"
                    >
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>
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
                        "relative px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                        activeTab === tab.key
                            ? "text-[var(--foreground)]"
                            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    )}
                >
                    {activeTab === tab.key && (
                        <motion.div
                            layoutId="active-tab"
                            className="absolute inset-0 shadow-sm rounded-md"
                            style={{ background: "var(--card)" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                    )}
                    <span className="relative z-10 flex items-center">
                        {tab.label}
                        {tab.count !== undefined && (
                            <span className="ml-1.5 text-xs opacity-60">{tab.count}</span>
                        )}
                    </span>
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
        <div className="flex items-center gap-1 p-1 rounded-xl mb-5" style={{ background: "var(--secondary)" }}>
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    onClick={() => onChange(tab.key)}
                    className={cn(
                        "relative flex-1 px-3 py-2 text-xs font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-1.5",
                        activeTab === tab.key
                            ? "text-[var(--foreground)]"
                            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    )}
                >
                    {activeTab === tab.key && (
                        <motion.div
                            layoutId="active-drawer-tab"
                            className="absolute inset-0 shadow-sm rounded-lg"
                            style={{ background: "var(--card)" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                    )}
                    <span className="relative z-10 flex items-center justify-center gap-1.5 w-full">
                        {tab.label}
                        {tab.count !== undefined && (
                            <span className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center transition-colors",
                                activeTab === tab.key
                                    ? "bg-blue-100/50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                                    : "bg-transparent text-[var(--muted-foreground)]"
                            )}>{tab.count}</span>
                        )}
                    </span>
                </button>
            ))}
        </div>
    );
}

// --- Drawer Section Divider ---
interface DrawerSectionProps {
    label: string;
    children: React.ReactNode;
    className?: string;
}

export function DrawerSection({ label, children, className }: DrawerSectionProps) {
    return (
        <div className={cn("mb-5", className)}>
            <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>{label}</span>
                <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            </div>
            {children}
        </div>
    );
}

// --- Drawer Stat Card ---
interface DrawerStatCardProps {
    label: string;
    value: string | number;
    subValue?: string;
    icon?: React.ReactNode;
    accent?: "blue" | "emerald" | "amber" | "violet" | "rose";
}

export function DrawerStatCard({ label, value, subValue, icon, accent = "blue" }: DrawerStatCardProps) {
    const accentColors = {
        blue: "from-blue-500 to-blue-600",
        emerald: "from-emerald-500 to-emerald-600",
        amber: "from-amber-500 to-amber-600",
        violet: "from-violet-500 to-violet-600",
        rose: "from-rose-500 to-rose-600",
    };
    return (
        <div className="relative rounded-xl border p-3 overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <div className={cn("absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b", accentColors[accent])} />
            <div className="flex items-center justify-between">
                <div className="pl-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>{label}</p>
                    <p className="text-sm font-bold mt-0.5" style={{ color: "var(--foreground)" }}>{value}</p>
                    {subValue && <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>{subValue}</p>}
                </div>
                {icon && <div className="text-[var(--muted-foreground)] opacity-60">{icon}</div>}
            </div>
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
                    "relative z-10 w-full rounded-xl border shadow-2xl animate-scale-in bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl",
                    width
                )}
                style={{ borderColor: "var(--border)" }}
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
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="px-6 py-4">{children}</div>
            </div>
        </div>
    );
}

// --- Custom Inputs ---
export const Checkbox = React.forwardRef<
    React.ElementRef<typeof CheckboxPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
    <CheckboxPrimitive.Root
        ref={ref}
        className={cn(
            "peer h-4 w-4 shrink-0 rounded-[4px] border border-zinc-300 dark:border-zinc-700 bg-transparent shadow-sm hover:border-zinc-400 dark:hover:border-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-zinc-900 data-[state=checked]:border-zinc-900 data-[state=checked]:text-white dark:data-[state=checked]:bg-zinc-100 dark:data-[state=checked]:border-zinc-100 dark:data-[state=checked]:text-black transition-colors",
            className
        )}
        {...props}
    >
        <CheckboxPrimitive.Indicator className={cn("flex items-center justify-center text-current")}>
            <Check className="h-3 w-3" strokeWidth={3} />
        </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export const Switch = React.forwardRef<
    React.ElementRef<typeof SwitchPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
    <SwitchPrimitive.Root
        className={cn(
            "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-inner transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-zinc-200 dark:data-[state=unchecked]:bg-zinc-800",
            className
        )}
        {...props}
        ref={ref}
    >
        <SwitchPrimitive.Thumb
            className={cn(
                "pointer-events-none block h-4 w-4 rounded-full bg-white dark:bg-zinc-200 shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
            )}
        />
    </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;

// --- Tooltip ---
export const TooltipProvider = TooltipPrimitive.Provider;

export const Tooltip = React.forwardRef<
    React.ElementRef<typeof TooltipPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & { content: React.ReactNode; children: React.ReactNode; showArrow?: boolean }
>(({ className, sideOffset = 4, content, children, showArrow = true, ...props }, ref) => (
    <TooltipPrimitive.Root delayDuration={200}>
        <TooltipPrimitive.Trigger asChild>
            {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content
                ref={ref}
                sideOffset={sideOffset}
                className={cn(
                    "z-50 rounded-[12px] bg-black dark:bg-zinc-100 px-3.5 py-2 text-[13px] font-semibold text-white dark:text-black shadow-xl",
                    "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
                    "data-[side=bottom]:slide-in-from-top-3 data-[side=left]:slide-in-from-right-3 data-[side=right]:slide-in-from-left-3 data-[side=top]:slide-in-from-bottom-3",
                    "data-[state=closed]:slide-out-to-left-1 data-[state=open]:duration-300 data-[state=closed]:duration-200 ease-out",
                    className
                )}
                {...props}
            >
                {content}
                {showArrow && <TooltipPrimitive.Arrow className="fill-black dark:fill-zinc-100" width={12} height={6} />}
            </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
));
Tooltip.displayName = TooltipPrimitive.Content.displayName;

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
                className="w-full h-9 pl-10 pr-4 rounded-lg border border-input bg-transparent text-sm shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 placeholder:text-muted-foreground"
            />
        </div>
    );
}

// --- Drawer ---
import { X as XIcon } from "lucide-react";

interface DrawerProps {
    open: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    width?: string;
    footer?: React.ReactNode;
    onSave?: () => void;
    preventCloseOnBackdrop?: boolean;
}

export function Drawer({
    open,
    onClose,
    title,
    subtitle,
    children,
    width = "max-w-lg",
    footer,
    onSave,
    preventCloseOnBackdrop = false
}: DrawerProps) {
    // Keyboard shortcuts: Escape to close, Ctrl/Cmd+S to save
    useEffect(() => {
        if (!open) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !preventCloseOnBackdrop) { e.preventDefault(); onClose(); }
            if ((e.metaKey || e.ctrlKey) && e.key === "s" && onSave) { e.preventDefault(); onSave(); }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [open, onClose, onSave, preventCloseOnBackdrop]);

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
                        onClick={preventCloseOnBackdrop ? undefined : onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className={cn(
                            "fixed right-0 top-0 z-50 h-screen w-full flex flex-col shadow-2xl bg-white/95 dark:bg-zinc-950/95 backdrop-blur-3xl",
                            "max-sm:max-w-full",
                            width
                        )}
                        style={{ borderLeft: "1px solid var(--border)" }}
                    >
                        {/* Header */}
                        <div
                            className="flex items-center justify-between px-6 py-4 border-b shrink-0 relative"
                            style={{ borderColor: "var(--border)" }}
                        >
                            {/* Left accent */}
                            <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-gradient-to-b from-black to-zinc-700 dark:from-white dark:to-zinc-300" />
                            <div className="pl-2">
                                <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
                                    {title}
                                </h2>
                                {subtitle && (
                                    <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{subtitle}</p>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg transition-all duration-200 hover:bg-[var(--secondary)] hover:scale-105 active:scale-95"
                                style={{ color: "var(--muted-foreground)" }}
                            >
                                <XIcon className="w-4 h-4" />
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
