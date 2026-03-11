"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, X, Users, FileText, ShoppingCart, Factory, Package,
    ClipboardList, Truck, Receipt, ArrowRight, Command
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface SearchItem {
    id: string;
    title: string;
    subtitle: string;
    module: string;
    icon: React.ReactNode;
    href: string;
}

const searchConfig = [
    { table: "customers", nameField: "name", subtitle: (r: any) => r.city || r.email || "", module: "Customers", icon: <Users className="w-3.5 h-3.5" />, href: "/customers" },
    { table: "vendors", nameField: "name", subtitle: (r: any) => r.city || r.contact_name || "", module: "Vendors", icon: <Truck className="w-3.5 h-3.5" />, href: "/vendors" },
    { table: "products", nameField: "name", subtitle: (r: any) => `${r.sku || ""} · $${r.selling_price || 0}`, module: "Products", icon: <Package className="w-3.5 h-3.5" />, href: "/products" },
    { table: "sales_orders", nameField: "order_number", subtitle: (r: any) => `${r.customer_name || ""} · $${r.total_amount || 0}`, module: "Sales Orders", icon: <ShoppingCart className="w-3.5 h-3.5" />, href: "/sales-orders" },
    { table: "quotations", nameField: "quote_number", subtitle: (r: any) => `${r.customer_name || ""} · $${r.total_amount || 0}`, module: "Quotations", icon: <FileText className="w-3.5 h-3.5" />, href: "/quotations" },
    { table: "invoices", nameField: "invoice_number", subtitle: (r: any) => `${r.customer_name || ""} · $${r.total_amount || 0}`, module: "Invoices", icon: <Receipt className="w-3.5 h-3.5" />, href: "/invoices" },
    { table: "purchase_orders", nameField: "po_number", subtitle: (r: any) => r.status || "", module: "Purchase Orders", icon: <ClipboardList className="w-3.5 h-3.5" />, href: "/purchase-orders" },
    { table: "production_orders", nameField: "job_number", subtitle: (r: any) => `${r.product_name || ""} · ${r.status || ""}`, module: "Production", icon: <Factory className="w-3.5 h-3.5" />, href: "/production" },
];

const pages = [
    { title: "Dashboard", href: "/" },
    { title: "Reports", href: "/reports" },
    { title: "Customers", href: "/customers" },
    { title: "Quotations", href: "/quotations" },
    { title: "Sales Orders", href: "/sales-orders" },
    { title: "Production", href: "/production" },
    { title: "Products", href: "/products" },
    { title: "Invoices", href: "/invoices" },
    { title: "Purchase Orders", href: "/purchase-orders" },
    { title: "Vendors", href: "/vendors" },
    { title: "Inventory", href: "/inventory" },
    { title: "HR & Payroll", href: "/hr" },
    { title: "Accounting", href: "/accounting" },
    { title: "Audit Log", href: "/audit-log" },
    { title: "Settings", href: "/settings" },
];

export function CommandSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [items, setItems] = useState<SearchItem[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setOpen(true);
            }
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 100);
            queueMicrotask(() => {
                setQuery("");
                setSelectedIdx(0);
                setItems([]);
            });
        }
    }, [open]);

    const doSearch = useCallback(async (q: string) => {
        if (q.length < 2) { setItems([]); return; }
        setLoading(true);
        const allItems: SearchItem[] = [];

        await Promise.all(
            searchConfig.map(async (cfg) => {
                try {
                    const { data } = await supabase
                        .from(cfg.table as any)
                        .select("*")
                        .ilike(cfg.nameField, `%${q}%`)
                        .limit(3);
                    if (data) {
                        data.forEach((row: any) => {
                            allItems.push({
                                id: row.id,
                                title: row[cfg.nameField] || "",
                                subtitle: cfg.subtitle(row),
                                module: cfg.module,
                                icon: cfg.icon,
                                href: cfg.href,
                            });
                        });
                    }
                } catch { }
            })
        );

        setItems(allItems);
        setSelectedIdx(0);
        setLoading(false);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => doSearch(query), 250);
        return () => clearTimeout(timer);
    }, [query, doSearch]);

    const matchedPages = query.trim()
        ? pages.filter(p => p.title.toLowerCase().includes(query.toLowerCase())).slice(0, 4)
        : pages.slice(0, 6);

    const allResults = [
        ...items.map(i => ({ type: "item" as const, ...i })),
        ...matchedPages.map(p => ({ type: "page" as const, id: p.href, title: p.title, href: p.href })),
    ];

    const handleSelect = (item: { href: string }) => {
        router.push(item.href);
        setOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIdx(i => Math.min(i + 1, allResults.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIdx(i => Math.max(i - 1, 0));
        } else if (e.key === "Enter" && allResults[selectedIdx]) {
            handleSelect(allResults[selectedIdx]);
        }
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-colors hover:bg-[var(--secondary)]"
                style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
            >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Search...</span>
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border" style={{ borderColor: "var(--border)", background: "var(--secondary)" }}>
                    <Command className="w-2.5 h-2.5" />K
                </kbd>
            </button>

            <AnimatePresence>
                {open && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50"
                            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
                            onClick={() => setOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ type: "tween", duration: 0.15 }}
                            className="fixed left-1/2 top-[20%] -translate-x-1/2 z-50 w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden"
                            style={{ background: "var(--card)", borderColor: "var(--border)" }}
                        >
                            <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                                <Search className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
                                <input
                                    ref={inputRef}
                                    value={query}
                                    onChange={(e) => { setQuery(e.target.value); setSelectedIdx(0); }}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Search customers, products, orders..."
                                    className="flex-1 bg-transparent text-sm outline-none"
                                    style={{ color: "var(--foreground)" }}
                                />
                                {query && (
                                    <button onClick={() => setQuery("")} className="p-0.5 rounded hover:bg-[var(--secondary)]">
                                        <X className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
                                    </button>
                                )}
                                <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono border" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>ESC</kbd>
                            </div>

                            <div className="max-h-80 overflow-y-auto py-2">
                                {loading && (
                                    <div className="flex items-center justify-center py-6">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
                                    </div>
                                )}

                                {!loading && !query.trim() && (
                                    <div className="px-3 pb-1">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1.5" style={{ color: "var(--muted-foreground)" }}>Quick Navigation</p>
                                        {matchedPages.map((page, idx) => (
                                            <button
                                                key={page.href}
                                                onClick={() => handleSelect(page)}
                                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${idx === selectedIdx ? "bg-[var(--primary)] text-white" : "hover:bg-[var(--secondary)]"}`}
                                                style={idx !== selectedIdx ? { color: "var(--foreground)" } : undefined}
                                            >
                                                <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
                                                <span className="font-medium">{page.title}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {!loading && query.trim() && items.length > 0 && (
                                    <div className="px-3">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1.5" style={{ color: "var(--muted-foreground)" }}>Results</p>
                                        {items.map((item, idx) => (
                                            <button
                                                key={item.id}
                                                onClick={() => handleSelect(item)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${idx === selectedIdx ? "bg-[var(--primary)] text-white" : "hover:bg-[var(--secondary)]"}`}
                                            >
                                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${idx === selectedIdx ? "bg-white/20" : "bg-[var(--secondary)]"}`}>
                                                    {item.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate" style={idx !== selectedIdx ? { color: "var(--foreground)" } : undefined}>{item.title}</p>
                                                    <p className="text-[11px] truncate" style={{ color: idx === selectedIdx ? "rgba(255,255,255,0.7)" : "var(--muted-foreground)" }}>{item.subtitle}</p>
                                                </div>
                                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${idx === selectedIdx ? "bg-white/20" : "bg-[var(--secondary)]"}`} style={idx !== selectedIdx ? { color: "var(--muted-foreground)" } : undefined}>
                                                    {item.module}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {!loading && query.trim() && matchedPages.length > 0 && (
                                    <div className="px-3 mt-1">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1.5" style={{ color: "var(--muted-foreground)" }}>Pages</p>
                                        {matchedPages.map((page, idx) => {
                                            const realIdx = items.length + idx;
                                            return (
                                                <button
                                                    key={page.href}
                                                    onClick={() => handleSelect(page)}
                                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${realIdx === selectedIdx ? "bg-[var(--primary)] text-white" : "hover:bg-[var(--secondary)]"}`}
                                                    style={realIdx !== selectedIdx ? { color: "var(--foreground)" } : undefined}
                                                >
                                                    <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
                                                    <span className="font-medium">{page.title}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {!loading && query.trim() && allResults.length === 0 && (
                                    <div className="py-8 text-center">
                                        <Search className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--muted-foreground)", opacity: 0.3 }} />
                                        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No results for &ldquo;{query}&rdquo;</p>
                                    </div>
                                )}
                            </div>

                            <div className="px-4 py-2 border-t flex items-center gap-4 text-[10px]" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
                                <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded border text-[9px]" style={{ borderColor: "var(--border)" }}>↑↓</kbd> Navigate</span>
                                <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded border text-[9px]" style={{ borderColor: "var(--border)" }}>↵</kbd> Open</span>
                                <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded border text-[9px]" style={{ borderColor: "var(--border)" }}>Esc</kbd> Close</span>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
