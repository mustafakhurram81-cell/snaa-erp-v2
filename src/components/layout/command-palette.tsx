"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
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
    Plus,
    Search,
} from "lucide-react";

const pages = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard, group: "Navigate" },
    { label: "Reports", href: "/reports", icon: BarChart3, group: "Navigate" },
    { label: "Customers", href: "/customers", icon: Users, group: "Navigate" },
    { label: "Quotations", href: "/quotations", icon: FileText, group: "Navigate" },
    { label: "Sales Orders", href: "/sales-orders", icon: ShoppingCart, group: "Navigate" },
    { label: "Production", href: "/production", icon: Factory, group: "Navigate" },
    { label: "Products", href: "/products", icon: Package, group: "Navigate" },
    { label: "Accounting", href: "/accounting", icon: Calculator, group: "Navigate" },
    { label: "Invoices", href: "/invoices", icon: Receipt, group: "Navigate" },
    { label: "Purchase Orders", href: "/purchase-orders", icon: ClipboardList, group: "Navigate" },
    { label: "Inventory", href: "/inventory", icon: Warehouse, group: "Navigate" },
    { label: "Vendors", href: "/vendors", icon: Truck, group: "Navigate" },
    { label: "HR & Payroll", href: "/hr", icon: UserCog, group: "Navigate" },
];

const quickActions = [
    { label: "New Customer", href: "/customers?action=new", icon: Plus, group: "Quick Actions" },
    { label: "New Quotation", href: "/quotations?action=new", icon: Plus, group: "Quick Actions" },
    { label: "New Sales Order", href: "/sales-orders?action=new", icon: Plus, group: "Quick Actions" },
    { label: "New Invoice", href: "/invoices?action=new", icon: Plus, group: "Quick Actions" },
    { label: "New Product", href: "/products?action=new", icon: Plus, group: "Quick Actions" },
    { label: "New Purchase Order", href: "/purchase-orders?action=new", icon: Plus, group: "Quick Actions" },
    { label: "New Vendor", href: "/vendors?action=new", icon: Plus, group: "Quick Actions" },
];

interface CommandPaletteProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
    const router = useRouter();
    const [search, setSearch] = useState("");

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onOpenChange(!open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, [open, onOpenChange]);

    const runCommand = useCallback(
        (command: () => void) => {
            onOpenChange(false);
            command();
        },
        [onOpenChange]
    );

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                        onClick={() => onOpenChange(false)}
                    />

                    {/* Command dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="fixed left-1/2 top-[20%] z-50 -translate-x-1/2 w-full max-w-[560px]"
                    >
                        <Command
                            className="rounded-xl border shadow-2xl overflow-hidden"
                            style={{
                                background: "var(--card)",
                                borderColor: "var(--border)",
                            }}
                        >
                            <div className="flex items-center px-4 border-b" style={{ borderColor: "var(--border)" }}>
                                <Search className="w-4 h-4 mr-2" style={{ color: "var(--muted-foreground)" }} />
                                <Command.Input
                                    value={search}
                                    onValueChange={setSearch}
                                    placeholder="Type a command or search..."
                                    className="flex h-12 w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted-foreground)]"
                                    style={{ color: "var(--foreground)" }}
                                />
                            </div>
                            <Command.List className="max-h-[340px] overflow-y-auto p-2">
                                <Command.Empty className="py-8 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                                    No results found.
                                </Command.Empty>

                                <Command.Group
                                    heading="Navigate"
                                    className="text-xs font-semibold uppercase tracking-wider px-2 py-1.5"
                                    style={{ color: "var(--muted-foreground)" }}
                                >
                                    {pages.map((page) => {
                                        const Icon = page.icon;
                                        return (
                                            <Command.Item
                                                key={page.href}
                                                value={page.label}
                                                onSelect={() => runCommand(() => router.push(page.href))}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors data-[selected=true]:bg-[var(--accent)]"
                                                style={{ color: "var(--foreground)" }}
                                            >
                                                <Icon className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                                                {page.label}
                                            </Command.Item>
                                        );
                                    })}
                                </Command.Group>

                                <Command.Separator className="my-2 h-px" style={{ background: "var(--border)" }} />

                                <Command.Group
                                    heading="Quick Actions"
                                    className="text-xs font-semibold uppercase tracking-wider px-2 py-1.5"
                                    style={{ color: "var(--muted-foreground)" }}
                                >
                                    {quickActions.map((action) => {
                                        const Icon = action.icon;
                                        return (
                                            <Command.Item
                                                key={action.href}
                                                value={action.label}
                                                onSelect={() => runCommand(() => router.push(action.href))}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors data-[selected=true]:bg-[var(--accent)]"
                                                style={{ color: "var(--foreground)" }}
                                            >
                                                <div className="w-4 h-4 rounded bg-blue-500/10 flex items-center justify-center">
                                                    <Icon className="w-3 h-3 text-blue-500" />
                                                </div>
                                                {action.label}
                                            </Command.Item>
                                        );
                                    })}
                                </Command.Group>
                            </Command.List>

                            <div className="flex items-center justify-between px-4 py-2.5 border-t text-[11px]" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-1">
                                        <kbd className="px-1.5 py-0.5 rounded border text-[10px]" style={{ borderColor: "var(--border)" }}>↑↓</kbd>
                                        Navigate
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <kbd className="px-1.5 py-0.5 rounded border text-[10px]" style={{ borderColor: "var(--border)" }}>↵</kbd>
                                        Select
                                    </span>
                                </div>
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1.5 py-0.5 rounded border text-[10px]" style={{ borderColor: "var(--border)" }}>Esc</kbd>
                                    Close
                                </span>
                            </div>
                        </Command>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
