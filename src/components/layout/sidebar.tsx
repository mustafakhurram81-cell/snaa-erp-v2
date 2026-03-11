"use client";

import React, { useState, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    BarChart3,
    Users,
    FileText,
    ShoppingCart,
    Factory,
    Package,
    Calculator,
    Receipt,
    ClipboardList,
    Warehouse,
    Truck,
    UserCog,
    ChevronDown,
    Settings,
    ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/shared";

interface SidebarContextType {
    collapsed: boolean;
    setCollapsed: (v: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
    collapsed: false,
    setCollapsed: () => { },
});

export const useSidebar = () => useContext(SidebarContext);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("sidebar-collapsed");
            return stored === "true";
        }
        return false;
    });

    const handleSetCollapsed = (val: boolean) => {
        setCollapsed(val);
        localStorage.setItem("sidebar-collapsed", String(val));
    };

    return (
        <SidebarContext.Provider value={{ collapsed, setCollapsed: handleSetCollapsed }}>
            {children}
        </SidebarContext.Provider>
    );
}

const navGroups = [
    {
        label: "Overview",
        items: [
            { label: "Dashboard", href: "/", icon: LayoutDashboard },
            { label: "Reports", href: "/reports", icon: BarChart3 },
            { label: "Audit Log", href: "/audit-log", icon: ScrollText },
        ],
    },
    {
        label: "Sales",
        items: [
            { label: "Customers", href: "/customers", icon: Users },
            { label: "Quotations", href: "/quotations", icon: FileText },
            { label: "Sales Orders", href: "/sales-orders", icon: ShoppingCart },
        ],
    },
    {
        label: "Operations",
        items: [
            { label: "Production", href: "/production", icon: Factory },
            { label: "Products", href: "/products", icon: Package },
        ],
    },
    {
        label: "Finance",
        items: [
            { label: "Accounting", href: "/accounting", icon: Calculator },
            { label: "Invoices", href: "/invoices", icon: Receipt },
        ],
    },
    {
        label: "Procurement",
        items: [
            { label: "Purchase Orders", href: "/purchase-orders", icon: ClipboardList },
            { label: "Inventory", href: "/inventory", icon: Warehouse },
            { label: "Vendors", href: "/vendors", icon: Truck },
        ],
    },
    {
        label: "People",
        items: [
            { label: "HR & Payroll", href: "/hr", icon: UserCog },
        ],
    },
];

export function Sidebar() {
    const { collapsed, setCollapsed } = useSidebar();
    const pathname = usePathname();
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
        Object.fromEntries(navGroups.map((g) => [g.label, true]))
    );

    const toggleGroup = (label: string) => {
        if (collapsed) return;
        setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
    };

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    // Animation variants
    const sidebarTransition = { type: "spring" as const, stiffness: 300, damping: 30, mass: 0.8 };
    const labelVariants = {
        expanded: { opacity: 1, x: 0, width: "auto", transition: { duration: 0.2, delay: 0.05 } },
        collapsed: { opacity: 0, x: -8, width: 0, transition: { duration: 0.15 } },
    };

    return (
        <motion.aside
            className="fixed left-0 top-0 z-40 h-screen flex flex-col overflow-hidden shadow-[2px_0_8px_-2px_rgba(0,0,0,0.05),_4px_0_16px_rgba(0,0,0,0.02)] dark:shadow-[2px_0_8px_-2px_rgba(0,0,0,0.5)]"
            style={{
                background: "var(--sidebar-bg)",
            }}
            animate={{
                width: collapsed ? "var(--sidebar-collapsed-width)" : "var(--sidebar-width)",
            }}
            transition={sidebarTransition}
            role="navigation"
            aria-label="Main navigation"
        >
            {/* Header: Logo + Toggle */}
            <motion.div
                className="flex flex-shrink-0 h-14 relative"
                animate={{
                    flexDirection: collapsed ? "column" : "row",
                    alignItems: "center",
                    justifyContent: collapsed ? "center" : "space-between",
                    padding: collapsed ? "0 8px" : "0 16px",
                    gap: collapsed ? "2px" : "0",
                }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            >
                <Link href="/" className={cn(
                    "flex items-center overflow-hidden",
                    collapsed ? "justify-center" : "flex-1 min-w-0"
                )}>
                    <AnimatePresence mode="wait">
                        {!collapsed && (
                            <motion.div
                                key="logo-text"
                                initial={{ opacity: 0, width: 0, x: -10 }}
                                animate={{ opacity: 1, width: "auto", x: 0 }}
                                exit={{ opacity: 0, width: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden whitespace-nowrap"
                            >
                                <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                                    Smith Instruments
                                </span>
                                <span className="block text-[10px] font-medium" style={{ color: "var(--muted-foreground)" }}>
                                    ERP System
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Link>
                <motion.button
                    onClick={() => setCollapsed(!collapsed)}
                    className={cn(
                        "rounded-lg transition-colors hover:bg-[var(--sidebar-hover-bg)] flex-shrink-0 flex items-center justify-center",
                        collapsed ? "p-2 w-8 h-8" : "p-1.5"
                    )}
                    style={{ color: "var(--muted-foreground)" }}
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    aria-expanded={!collapsed}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <motion.div
                        animate={{ rotate: collapsed ? 180 : 0 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    >
                        {/* Custom minimalist 3-line icon */}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="4" y1="12" x2="20" y2="12"></line>
                            <line x1="4" y1="6" x2="20" y2="6"></line>
                            <line x1="4" y1="18" x2="20" y2="18"></line>
                        </svg>
                    </motion.div>
                </motion.button>
            </motion.div>

            {/* Navigation */}
            <nav className={cn(
                "flex-1 overflow-y-auto py-3",
                collapsed ? "px-1.5" : "px-3"
            )}>
                {navGroups.map((group, groupIdx) => (
                    <div key={group.label}>
                        <AnimatePresence>
                            {/* Dividers removed in collapsed state for an uninterrupted flow */}
                            {!collapsed && groupIdx > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, scaleX: 0 }}
                                    animate={{ opacity: 1, scaleX: 1 }}
                                    exit={{ opacity: 0, scaleX: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="mx-2 my-2 border-t"
                                    style={{ borderColor: "var(--sidebar-border)" }}
                                />
                            )}
                        </AnimatePresence>
                        <AnimatePresence>
                            {!collapsed && (
                                <motion.button
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.15 }}
                                    onClick={() => toggleGroup(group.label)}
                                    className="flex items-center justify-between w-full px-2 py-1.5 mt-2 mb-0.5 text-[11px] font-semibold uppercase tracking-wider rounded-md transition-colors hover:bg-[var(--sidebar-hover-bg)]"
                                    style={{ color: "var(--muted-foreground)" }}
                                >
                                    <span>{group.label}</span>
                                    <motion.div
                                        animate={{ rotate: openGroups[group.label] ? 0 : -90 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ChevronDown className="w-3 h-3" />
                                    </motion.div>
                                </motion.button>
                            )}
                        </AnimatePresence>
                        <AnimatePresence initial={false}>
                            {(collapsed || openGroups[group.label]) && (
                                <motion.div
                                    initial={collapsed ? false : { height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className={cn("overflow-hidden", collapsed && "flex flex-col items-center")}
                                >
                                    {group.items.map((item, itemIdx) => {
                                        const Icon = item.icon;
                                        const active = isActive(item.href);
                                        const linkContent = (
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    "relative w-full text-left transition-all duration-200 group flex items-center overflow-hidden",
                                                    collapsed ? "h-11 justify-center rounded-xl mx-auto w-11" : "h-[38px] px-3 gap-3 rounded-lg w-full",
                                                    active
                                                        ? "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active)] font-medium shadow-sm"
                                                        : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-active)]"
                                                )}
                                                style={{
                                                    color: active ? "var(--sidebar-active)" : "var(--sidebar-foreground)",
                                                    backgroundColor: active ? "var(--sidebar-active-bg)" : undefined,
                                                }}
                                            >
                                                {/* Active indicator line only visible when expanded */}
                                                {active && !collapsed && (
                                                    <motion.div
                                                        layoutId="sidebar-indicator"
                                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                                                        style={{ background: "var(--sidebar-active)" }}
                                                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                                    />
                                                )}
                                                <Icon className={cn("w-[18px] h-[18px] flex-shrink-0 transition-transform duration-200", active && "text-[var(--sidebar-active)]")} />
                                                <AnimatePresence mode="wait">
                                                    {!collapsed && (
                                                        <motion.span
                                                            key="label"
                                                            className="truncate"
                                                            variants={labelVariants}
                                                            initial="collapsed"
                                                            animate="expanded"
                                                            exit="collapsed"
                                                        >
                                                            {item.label}
                                                        </motion.span>
                                                    )}
                                                </AnimatePresence>
                                            </Link>
                                        );

                                        return (
                                            <motion.div
                                                key={item.href}
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.15, delay: itemIdx * 0.03 }}
                                            >
                                                {collapsed ? (
                                                    <Tooltip content={item.label} side="right" sideOffset={12}>
                                                        {linkContent}
                                                    </Tooltip>
                                                ) : linkContent}
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </nav>

            {/* Pinned Settings at bottom */}
            <div className={cn(
                "border-t flex-shrink-0",
                collapsed ? "px-1.5 py-2" : "p-3"
            )} style={{ borderColor: "var(--sidebar-border)" }}>
                {collapsed ? (
                    <Tooltip content="Settings" side="right" sideOffset={12}>
                        <Link
                            href="/settings"
                            className={cn(
                                "flex items-center rounded-lg text-[13px] font-medium transition-all duration-150 group relative",
                                "justify-center w-10 h-10 p-0 mx-auto",
                                isActive("/settings")
                                    ? "text-[var(--sidebar-active)]"
                                    : "hover:bg-[var(--sidebar-hover-bg)]"
                            )}
                            style={{
                                color: isActive("/settings") ? "var(--sidebar-active)" : "var(--sidebar-foreground)",
                                backgroundColor: isActive("/settings") ? "var(--sidebar-active-bg)" : undefined,
                            }}
                        >
                            <Settings className={cn("w-[18px] h-[18px] flex-shrink-0", isActive("/settings") && "text-[var(--sidebar-active)]")} />
                        </Link>
                    </Tooltip>
                ) : (
                    <Link
                        href="/settings"
                        className={cn(
                            "flex items-center rounded-lg text-[13px] font-medium transition-all duration-150 group relative",
                            "gap-3 px-3 py-2",
                            isActive("/settings")
                                ? "text-[var(--sidebar-active)]"
                                : "hover:bg-[var(--sidebar-hover-bg)]"
                        )}
                        style={{
                            color: isActive("/settings") ? "var(--sidebar-active)" : "var(--sidebar-foreground)",
                            backgroundColor: isActive("/settings") ? "var(--sidebar-active-bg)" : undefined,
                        }}
                    >
                        {/* Active indicator line only visible when expanded */}
                        {isActive("/settings") && (
                            <motion.div
                                layoutId="sidebar-indicator-settings"
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                                style={{ background: "var(--sidebar-active)" }}
                                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                            />
                        )}
                        <Settings className={cn("w-[18px] h-[18px] flex-shrink-0", isActive("/settings") && "text-[var(--sidebar-active)]")} />
                        <AnimatePresence mode="wait">
                            <motion.span
                                key="settings-label"
                                className="truncate"
                                variants={labelVariants}
                                initial="collapsed"
                                animate="expanded"
                                exit="collapsed"
                            >
                                Settings
                            </motion.span>
                        </AnimatePresence>
                    </Link>
                )}
            </div>
        </motion.aside>
    );
}
