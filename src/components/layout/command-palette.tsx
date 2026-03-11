"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
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
    Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

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

interface SearchResult {
    id: string;
    label: string;
    sublabel?: string;
    href: string;
    icon: typeof Users;
    iconColor: string;
}

interface CommandPaletteProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Keyboard shortcut
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

    // Clear state when closed
    useEffect(() => {
        if (!open) {
            setSearch("");
            setSearchResults([]);
            setSearching(false);
        }
    }, [open]);

    // Debounced live search
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (search.length < 2) {
            setSearchResults([]);
            setSearching(false);
            return;
        }
        setSearching(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const term = `%${search}%`;
                const [customers, products, invoices, orders] = await Promise.all([
                    supabase.from("customers").select("id, name, city").ilike("name", term).limit(4),
                    supabase.from("products").select("id, name, sku").ilike("name", term).limit(4),
                    supabase.from("invoices").select("id, invoice_number, customer_name").ilike("invoice_number", term).limit(4),
                    supabase.from("sales_orders").select("id, order_number, customer_name").ilike("order_number", term).limit(4),
                ]);
                const results: SearchResult[] = [
                    ...(customers.data || []).map((c: any) => ({
                        id: c.id, label: c.name, sublabel: c.city || "Customer",
                        href: `/customers`, icon: Users, iconColor: "text-cyan-500",
                    })),
                    ...(products.data || []).map((p: any) => ({
                        id: p.id, label: p.name, sublabel: p.sku || "Product",
                        href: `/products`, icon: Package, iconColor: "text-violet-500",
                    })),
                    ...(invoices.data || []).map((i: any) => ({
                        id: i.id, label: i.invoice_number, sublabel: i.customer_name || "Invoice",
                        href: `/invoices`, icon: Receipt, iconColor: "text-emerald-500",
                    })),
                    ...(orders.data || []).map((o: any) => ({
                        id: o.id, label: o.order_number, sublabel: o.customer_name || "Sales Order",
                        href: `/sales-orders`, icon: ShoppingCart, iconColor: "text-blue-500",
                    })),
                ];
                setSearchResults(results);
            } catch (err) {
                console.error("Command palette search error:", err);
            } finally {
                setSearching(false);
            }
        }, 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [search]);

    const runCommand = useCallback(
        (command: () => void) => {
            onOpenChange(false);
            command();
        },
        [onOpenChange]
    );

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
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
                            className="rounded-2xl shadow-2xl overflow-hidden bg-white/80 dark:bg-zinc-950/80 backdrop-blur-3xl ring-1 ring-black/5 dark:ring-white/10"
                        >
                            <div className="flex items-center px-4 py-2 border-b border-black/5 dark:border-white/10">
                                <Search className="w-5 h-5 mr-3 text-zinc-500" />
                                <Command.Input
                                    value={search}
                                    onValueChange={setSearch}
                                    placeholder="Type a command or search records…"
                                    className="flex h-14 w-full bg-transparent text-base outline-none placeholder:text-zinc-500 font-medium"
                                    style={{ color: "var(--foreground)" }}
                                />
                                {searching && <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />}
                            </div>
                            <Command.List className="max-h-[400px] overflow-y-auto p-2 scrollbar-thin">
                                <Command.Empty className="py-8 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                                    No results found.
                                </Command.Empty>

                                {/* Live search results */}
                                {searchResults.length > 0 && (
                                    <>
                                        <Command.Group
                                            heading="Search Results"
                                            className="text-xs font-semibold uppercase tracking-wider px-2 py-1.5"
                                            style={{ color: "var(--muted-foreground)" }}
                                        >
                                            {searchResults.map((result) => {
                                                const Icon = result.icon;
                                                return (
                                                    <Command.Item
                                                        key={`search-${result.id}`}
                                                        value={`${result.label} ${result.sublabel}`}
                                                        onSelect={() => runCommand(() => router.push(result.href))}
                                                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors data-[selected=true]:bg-[var(--accent)]"
                                                        style={{ color: "var(--foreground)" }}
                                                    >
                                                        <Icon className={`w-4 h-4 ${result.iconColor}`} />
                                                        <div className="flex flex-col">
                                                            <span>{result.label}</span>
                                                            {result.sublabel && (
                                                                <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                                                                    {result.sublabel}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </Command.Item>
                                                );
                                            })}
                                        </Command.Group>
                                        <Command.Separator className="my-2 h-px" style={{ background: "var(--border)" }} />
                                    </>
                                )}

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
        </AnimatePresence>,
        document.body
    );
}
