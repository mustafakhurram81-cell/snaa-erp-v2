"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, X, Users, FileText, ShoppingCart, Factory, Package,
    ClipboardList, Truck, Receipt, ArrowRight, Command
} from "lucide-react";

interface SearchItem {
    id: string;
    title: string;
    subtitle: string;
    module: string;
    icon: React.ReactNode;
    href: string;
}

const allSearchItems: SearchItem[] = [
    // Customers
    { id: "c1", title: "Dr. Ahmed Khan", subtitle: "City Hospital", module: "Customers", icon: <Users className="w-3.5 h-3.5" />, href: "/customers" },
    { id: "c2", title: "Sarah Williams", subtitle: "Metro Medical Center", module: "Customers", icon: <Users className="w-3.5 h-3.5" />, href: "/customers" },
    { id: "c3", title: "Dr. Fatima Al-Rashid", subtitle: "Gulf Healthcare", module: "Customers", icon: <Users className="w-3.5 h-3.5" />, href: "/customers" },
    { id: "c4", title: "James Anderson", subtitle: "Central Clinic", module: "Customers", icon: <Users className="w-3.5 h-3.5" />, href: "/customers" },
    // Products
    { id: "p1", title: "Mayo Scissors 6.5\" Straight", subtitle: "SC-MAY-065S · $24.00", module: "Products", icon: <Package className="w-3.5 h-3.5" />, href: "/products" },
    { id: "p2", title: "Adson Forceps 4.75\"", subtitle: "FC-ADS-475 · $15.00", module: "Products", icon: <Package className="w-3.5 h-3.5" />, href: "/products" },
    { id: "p3", title: "Kelly Clamp 5.5\" Curved", subtitle: "CL-KEL-055C · $20.00", module: "Products", icon: <Package className="w-3.5 h-3.5" />, href: "/products" },
    { id: "p4", title: "Metzenbaum Scissors 7\"", subtitle: "SC-MET-070C · $28.00", module: "Products", icon: <Package className="w-3.5 h-3.5" />, href: "/products" },
    // Quotations
    { id: "q1", title: "QT-2026-089", subtitle: "Gulf Healthcare · $42,000", module: "Quotations", icon: <FileText className="w-3.5 h-3.5" />, href: "/quotations" },
    { id: "q2", title: "QT-2026-088", subtitle: "City Hospital · $12,500", module: "Quotations", icon: <FileText className="w-3.5 h-3.5" />, href: "/quotations" },
    // Sales Orders
    { id: "s1", title: "SO-2026-042", subtitle: "City Hospital · $12,500", module: "Sales Orders", icon: <ShoppingCart className="w-3.5 h-3.5" />, href: "/sales-orders" },
    { id: "s2", title: "SO-2026-041", subtitle: "Metro Medical · $8,900", module: "Sales Orders", icon: <ShoppingCart className="w-3.5 h-3.5" />, href: "/sales-orders" },
    { id: "s3", title: "SO-2026-040", subtitle: "Central Clinic · $15,200", module: "Sales Orders", icon: <ShoppingCart className="w-3.5 h-3.5" />, href: "/sales-orders" },
    // Job Orders
    { id: "j1", title: "JO-2026-001", subtitle: "Mayo Scissors · Filing", module: "Production", icon: <Factory className="w-3.5 h-3.5" />, href: "/production" },
    { id: "j2", title: "JO-2026-002", subtitle: "Adson Forceps · Grinding", module: "Production", icon: <Factory className="w-3.5 h-3.5" />, href: "/production" },
    { id: "j3", title: "JO-2026-004", subtitle: "Metzenbaum Scissors · QC", module: "Production", icon: <Factory className="w-3.5 h-3.5" />, href: "/production" },
    // Purchase Orders
    { id: "po1", title: "PO-2026-028", subtitle: "Premium Steel Corp · Sent", module: "Purchase Orders", icon: <ClipboardList className="w-3.5 h-3.5" />, href: "/purchase-orders" },
    { id: "po2", title: "PO-2026-027", subtitle: "Global Stainless Ltd · Received", module: "Purchase Orders", icon: <ClipboardList className="w-3.5 h-3.5" />, href: "/purchase-orders" },
    // Vendors
    { id: "v1", title: "Ali Steel Works", subtitle: "Die Making · Sialkot", module: "Vendors", icon: <Truck className="w-3.5 h-3.5" />, href: "/vendors" },
    { id: "v2", title: "Riaz Forging", subtitle: "Forging · Sialkot", module: "Vendors", icon: <Truck className="w-3.5 h-3.5" />, href: "/vendors" },
    { id: "v3", title: "Precision Grinders", subtitle: "Grinding · Sialkot", module: "Vendors", icon: <Truck className="w-3.5 h-3.5" />, href: "/vendors" },
    // Invoices
    { id: "i1", title: "INV-2026-156", subtitle: "City Hospital · $12,500", module: "Invoices", icon: <Receipt className="w-3.5 h-3.5" />, href: "/invoices" },
    { id: "i2", title: "INV-2026-155", subtitle: "Metro Medical · $8,900", module: "Invoices", icon: <Receipt className="w-3.5 h-3.5" />, href: "/invoices" },
];

// Pages for quick navigation
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
    { title: "Settings", href: "/settings" },
];

export function CommandSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedIdx, setSelectedIdx] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    // Cmd+K listener
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
            setQuery("");
            setSelectedIdx(0);
        }
    }, [open]);

    const results = useMemo(() => {
        if (!query.trim()) {
            return { items: [], pages: pages.slice(0, 6) };
        }
        const q = query.toLowerCase();
        const matchedItems = allSearchItems.filter(
            (item) =>
                item.title.toLowerCase().includes(q) ||
                item.subtitle.toLowerCase().includes(q) ||
                item.module.toLowerCase().includes(q)
        ).slice(0, 8);
        const matchedPages = pages.filter(p => p.title.toLowerCase().includes(q)).slice(0, 4);
        return { items: matchedItems, pages: matchedPages };
    }, [query]);

    const allResults = [...results.items.map(i => ({ type: "item" as const, ...i })), ...results.pages.map(p => ({ type: "page" as const, id: p.href, title: p.title, href: p.href }))];

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
            {/* Trigger button */}
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

            {/* Modal */}
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
                            {/* Search input */}
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

                            {/* Results */}
                            <div className="max-h-80 overflow-y-auto py-2">
                                {!query.trim() && (
                                    <div className="px-3 pb-1">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1.5" style={{ color: "var(--muted-foreground)" }}>Quick Navigation</p>
                                        {results.pages.map((page, idx) => (
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

                                {query.trim() && results.items.length > 0 && (
                                    <div className="px-3">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1.5" style={{ color: "var(--muted-foreground)" }}>Results</p>
                                        {results.items.map((item, idx) => (
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

                                {query.trim() && results.pages.length > 0 && (
                                    <div className="px-3 mt-1">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1.5" style={{ color: "var(--muted-foreground)" }}>Pages</p>
                                        {results.pages.map((page, idx) => {
                                            const realIdx = results.items.length + idx;
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

                                {query.trim() && allResults.length === 0 && (
                                    <div className="py-8 text-center">
                                        <Search className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--muted-foreground)", opacity: 0.3 }} />
                                        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No results for &ldquo;{query}&rdquo;</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
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
