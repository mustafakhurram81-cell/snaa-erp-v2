"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, FileText, ShoppingCart, Receipt, Users, Package, Truck } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface SearchResult {
    type: string;
    label: string;
    sublabel: string;
    href: string;
    icon: typeof FileText;
    color: string;
}

const typeConfig: Record<string, { icon: typeof FileText; color: string; table: string; label: string; searchCol: string; idCol: string; href: string }> = {
    customers: { icon: Users, color: "text-cyan-500", table: "customers", label: "Customer", searchCol: "name", idCol: "id", href: "/customers" },
    products: { icon: Package, color: "text-blue-500", table: "products", label: "Product", searchCol: "name", idCol: "sku", href: "/products" },
    invoices: { icon: Receipt, color: "text-emerald-500", table: "invoices", label: "Invoice", searchCol: "invoice_number", idCol: "invoice_number", href: "/invoices" },
    sales_orders: { icon: ShoppingCart, color: "text-violet-500", table: "sales_orders", label: "Sales Order", searchCol: "order_number", idCol: "order_number", href: "/sales-orders" },
    quotations: { icon: FileText, color: "text-blue-500", table: "quotations", label: "Quotation", searchCol: "quote_number", idCol: "quote_number", href: "/quotations" },
    vendors: { icon: Truck, color: "text-amber-500", table: "vendors", label: "Vendor", searchCol: "name", idCol: "id", href: "/vendors" },
};

export function SearchDialog() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();

    // Cmd+K to open
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setOpen(prev => !prev);
            }
            if (e.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    // Search across tables
    const doSearch = useCallback(async (q: string) => {
        if (q.length < 2) { setResults([]); return; }
        setSearching(true);
        try {
            const searches = Object.entries(typeConfig).map(async ([, cfg]) => {
                // Search by main column + also by customer_name if available
                const cols = cfg.table === "invoices" || cfg.table === "sales_orders" || cfg.table === "quotations"
                    ? `${cfg.searchCol}, customer_name, status`
                    : `${cfg.searchCol}, status`;

                const { data } = await supabase
                    .from(cfg.table)
                    .select(cols)
                    .or(`${cfg.searchCol}.ilike.%${q}%${cfg.table === "invoices" || cfg.table === "sales_orders" || cfg.table === "quotations" ? `,customer_name.ilike.%${q}%` : ""}`)
                    .limit(3);

                return (data || []).map((row: any) => ({
                    type: cfg.label,
                    label: row[cfg.searchCol] || row.name || "",
                    sublabel: row.customer_name || row.status || "",
                    href: `${cfg.href}?open=${row[cfg.idCol]}`,
                    icon: cfg.icon,
                    color: cfg.color,
                }));
            });

            const all = (await Promise.all(searches)).flat();
            setResults(all.slice(0, 10));
        } catch {
            setResults([]);
        } finally {
            setSearching(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => doSearch(query), 300);
        return () => clearTimeout(timer);
    }, [query, doSearch]);

    useEffect(() => { setSelectedIndex(0); }, [results]);

    const handleSelect = (result: SearchResult) => {
        setOpen(false);
        setQuery("");
        router.push(result.href);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)); }
        if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
        if (e.key === "Enter" && results[selectedIndex]) { handleSelect(results[selectedIndex]); }
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />

                    {/* Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-x-0 top-[15%] z-50 mx-auto w-full max-w-lg"
                    >
                        <div className="rounded-2xl border shadow-2xl overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                            {/* Search Input */}
                            <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                                <Search className="w-5 h-5 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
                                <input
                                    autoFocus
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Search customers, orders, invoices..."
                                    className="flex-1 bg-transparent text-sm outline-none"
                                    style={{ color: "var(--foreground)" }}
                                />
                                <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-[var(--secondary)] transition-colors">
                                    <X className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                                </button>
                            </div>

                            {/* Results */}
                            <div className="max-h-[320px] overflow-y-auto p-2">
                                {searching && (
                                    <div className="py-8 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>Searching...</div>
                                )}
                                {!searching && query.length >= 2 && results.length === 0 && (
                                    <div className="py-8 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>No results found for &quot;{query}&quot;</div>
                                )}
                                {!searching && query.length < 2 && (
                                    <div className="py-8 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                                        Type at least 2 characters to search
                                    </div>
                                )}
                                {results.map((result, idx) => {
                                    const Icon = result.icon;
                                    return (
                                        <button
                                            key={`${result.type}-${result.label}-${idx}`}
                                            onClick={() => handleSelect(result)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${idx === selectedIndex ? "bg-[var(--secondary)]" : "hover:bg-[var(--secondary)]"}`}
                                        >
                                            <div className={`p-2 rounded-lg flex-shrink-0 bg-[var(--secondary)]`}>
                                                <Icon className={`w-4 h-4 ${result.color}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{result.label}</p>
                                                <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>{result.type} · {result.sublabel}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between px-4 py-2 border-t text-[10px]" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
                                <div className="flex items-center gap-2">
                                    <kbd className="px-1.5 py-0.5 rounded border font-mono" style={{ borderColor: "var(--border)" }}>↑↓</kbd> Navigate
                                    <kbd className="px-1.5 py-0.5 rounded border font-mono" style={{ borderColor: "var(--border)" }}>↵</kbd> Open
                                </div>
                                <div>
                                    <kbd className="px-1.5 py-0.5 rounded border font-mono" style={{ borderColor: "var(--border)" }}>esc</kbd> Close
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
