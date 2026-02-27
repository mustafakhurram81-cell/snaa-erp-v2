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
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    const [collapsed, setCollapsed] = useState(false);
    return (
        <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
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
    {
        label: "System",
        items: [
            { label: "Settings", href: "/settings", icon: Settings },
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

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 z-40 h-screen flex flex-col border-r transition-all duration-300 ease-in-out",
                collapsed ? "w-[var(--sidebar-collapsed-width)]" : "w-[var(--sidebar-width)]"
            )}
            style={{
                background: "var(--sidebar-bg)",
                borderColor: "var(--sidebar-border)",
            }}
        >
            {/* Logo */}
            <div className="flex items-center h-16 px-4 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
                <Link href="/" className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">SI</span>
                    </div>
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
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
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {navGroups.map((group) => (
                    <div key={group.label} className="mb-2">
                        {!collapsed && (
                            <button
                                onClick={() => toggleGroup(group.label)}
                                className="flex items-center justify-between w-full px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider rounded-md transition-colors hover:bg-[var(--sidebar-hover-bg)]"
                                style={{ color: "var(--muted-foreground)" }}
                            >
                                <span>{group.label}</span>
                                <ChevronDown
                                    className={cn(
                                        "w-3 h-3 transition-transform duration-200",
                                        openGroups[group.label] ? "" : "-rotate-90"
                                    )}
                                />
                            </button>
                        )}
                        <AnimatePresence initial={false}>
                            {(collapsed || openGroups[group.label]) && (
                                <motion.div
                                    initial={collapsed ? false : { height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    {group.items.map((item) => {
                                        const Icon = item.icon;
                                        const active = isActive(item.href);
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={cn(
                                                    "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-semibold transition-all duration-150 group relative my-0.5",
                                                    active
                                                        ? "text-[var(--sidebar-active)]"
                                                        : "hover:bg-[var(--sidebar-hover-bg)]"
                                                )}
                                                style={{
                                                    color: active ? "var(--sidebar-active)" : "var(--sidebar-foreground)",
                                                    backgroundColor: active ? "var(--sidebar-active-bg)" : undefined,
                                                }}
                                                title={collapsed ? item.label : undefined}
                                            >
                                                {active && (
                                                    <motion.div
                                                        layoutId="sidebar-indicator"
                                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                                                        style={{ background: "var(--sidebar-active)" }}
                                                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                                    />
                                                )}
                                                <Icon className={cn("w-[18px] h-[18px] flex-shrink-0", active && "text-[var(--sidebar-active)]")} />
                                                {!collapsed && (
                                                    <span className="truncate">{item.label}</span>
                                                )}
                                            </Link>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </nav>

            {/* Collapse toggle */}
            <div className="p-3 border-t" style={{ borderColor: "var(--sidebar-border)" }}>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="flex items-center justify-center w-full p-2 rounded-lg transition-colors hover:bg-[var(--sidebar-hover-bg)]"
                    style={{ color: "var(--muted-foreground)" }}
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    {!collapsed && <span className="ml-2 text-xs font-medium">Collapse</span>}
                </button>
            </div>
        </aside>
    );
}
