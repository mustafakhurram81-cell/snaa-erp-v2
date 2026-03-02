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
    PanelLeftClose,
    PanelLeft,
    LogOut,
    Sun,
    Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/components/theme-provider";

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
            className="fixed left-0 top-0 z-40 h-screen flex flex-col border-r overflow-hidden"
            style={{
                background: "var(--sidebar-bg)",
                borderColor: "var(--sidebar-border)",
            }}
            animate={{
                width: collapsed ? "var(--sidebar-collapsed-width)" : "var(--sidebar-width)",
            }}
            transition={sidebarTransition}
        >
            {/* Header: Logo + Toggle */}
            <motion.div
                className="flex border-b flex-shrink-0"
                style={{ borderColor: "var(--sidebar-border)" }}
                animate={{
                    flexDirection: collapsed ? "column" : "row",
                    alignItems: "center",
                    justifyContent: collapsed ? "center" : "space-between",
                    padding: collapsed ? "12px 8px" : "0 16px",
                    gap: collapsed ? "8px" : "0",
                    height: collapsed ? "auto" : "64px",
                }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            >
                <Link href="/" className={cn(
                    "flex items-center overflow-hidden",
                    collapsed ? "justify-center" : "gap-3 flex-1 min-w-0"
                )}>
                    <motion.div
                        className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center flex-shrink-0"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <span className="text-white font-bold text-sm">SI</span>
                    </motion.div>
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
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <motion.div
                        animate={{ rotate: collapsed ? 180 : 0 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    >
                        {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
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
                        {/* Collapsed divider between groups */}
                        <AnimatePresence>
                            {collapsed && groupIdx > 0 && (
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
                                        return (
                                            <motion.div
                                                key={item.href}
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.15, delay: itemIdx * 0.03 }}
                                            >
                                                <Link
                                                    href={item.href}
                                                    className={cn(
                                                        "flex items-center rounded-lg text-[13px] font-semibold transition-all duration-150 group relative my-0.5",
                                                        collapsed
                                                            ? "justify-center w-10 h-10 p-0"
                                                            : "gap-3 px-3 py-2",
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
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </nav>

            {/* Pinned Settings + User */}
            <div className={cn(
                "border-t flex-shrink-0",
                collapsed ? "px-1.5 py-3" : "p-3"
            )} style={{ borderColor: "var(--sidebar-border)" }}>
                <Link
                    href="/settings"
                    className={cn(
                        "flex items-center rounded-lg text-[13px] font-semibold transition-all duration-150 group relative",
                        collapsed
                            ? "justify-center w-10 h-10 p-0 mx-auto"
                            : "gap-3 px-3 py-2",
                        isActive("/settings")
                            ? "text-[var(--sidebar-active)]"
                            : "hover:bg-[var(--sidebar-hover-bg)]"
                    )}
                    style={{
                        color: isActive("/settings") ? "var(--sidebar-active)" : "var(--sidebar-foreground)",
                        backgroundColor: isActive("/settings") ? "var(--sidebar-active-bg)" : undefined,
                    }}
                    title={collapsed ? "Settings" : undefined}
                >
                    {isActive("/settings") && (
                        <motion.div
                            layoutId="sidebar-indicator"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                            style={{ background: "var(--sidebar-active)" }}
                            transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        />
                    )}
                    <Settings className={cn("w-[18px] h-[18px] flex-shrink-0", isActive("/settings") && "text-[var(--sidebar-active)]")} />
                    <AnimatePresence mode="wait">
                        {!collapsed && (
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
                        )}
                    </AnimatePresence>
                </Link>

                {/* User info + Sign out */}
                <UserFooter collapsed={collapsed} labelVariants={labelVariants} />
            </div>
        </motion.aside>
    );
}

// Separate component to avoid hook rules issue
function UserFooter({ collapsed, labelVariants }: { collapsed: boolean; labelVariants: Record<string, unknown> }) {
    const { user, signOut } = useAuth();
    if (!user) return null;

    const email = user.email || "User";
    const initial = email.charAt(0).toUpperCase();

    return (
        <div className={cn(
            "mt-2 pt-2 border-t flex items-center",
            collapsed ? "justify-center flex-col gap-2" : "gap-3 px-3 py-2"
        )} style={{ borderColor: "var(--sidebar-border)" }}>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">{initial}</span>
            </div>
            <AnimatePresence mode="wait">
                {!collapsed && (
                    <motion.div
                        key="user-info"
                        className="flex-1 min-w-0"
                        variants={labelVariants as any}
                        initial="collapsed"
                        animate="expanded"
                        exit="collapsed"
                    >
                        <p className="text-[11px] font-medium truncate" style={{ color: "var(--foreground)" }}>{email}</p>
                    </motion.div>
                )}
            </AnimatePresence>
            <motion.button
                onClick={signOut}
                className={cn(
                    "rounded-lg transition-colors hover:bg-red-500/10 flex items-center justify-center flex-shrink-0",
                    collapsed ? "p-2" : "p-1.5"
                )}
                style={{ color: "var(--muted-foreground)" }}
                title="Sign out"
                whileHover={{ scale: 1.1, color: "#ef4444" }}
                whileTap={{ scale: 0.9 }}
            >
                <LogOut className="w-4 h-4" />
            </motion.button>
            <ThemeToggle collapsed={collapsed} />
        </div>
    );
}

function ThemeToggle({ collapsed }: { collapsed: boolean }) {
    const { theme, toggleTheme } = useTheme();
    return (
        <motion.button
            onClick={toggleTheme}
            className={cn(
                "rounded-lg transition-colors flex items-center justify-center flex-shrink-0",
                collapsed ? "p-2" : "p-1.5",
                theme === "dark" ? "hover:bg-amber-500/10" : "hover:bg-blue-500/10"
            )}
            style={{ color: "var(--muted-foreground)" }}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            whileHover={{ scale: 1.1, color: theme === "dark" ? "#f59e0b" : "#3b82f6" }}
            whileTap={{ scale: 0.9 }}
        >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </motion.button>
    );
}
