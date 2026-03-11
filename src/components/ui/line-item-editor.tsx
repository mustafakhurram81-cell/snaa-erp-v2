"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Search, Package, Trash2, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export interface LineItem {
    id: string;
    product: string;
    sku?: string;
    qty: number;
    unit_price: number;
}

export interface ProductOption {
    name: string;
    sku?: string;
    selling_price?: number;
    cost_price?: number;
}

interface LineItemEditorProps {
    products: ProductOption[];
    items: LineItem[];
    onChange: (items: LineItem[]) => void;
    /** Use cost_price instead of selling_price */
    useCostPrice?: boolean;
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function formatPrice(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
}

export function LineItemEditor({ products, items, onChange, useCostPrice = false }: LineItemEditorProps) {
    const [query, setQuery] = useState("");
    const [showResults, setShowResults] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(0);
    const searchRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);
    const qtyRefs = useRef<Map<string, HTMLInputElement>>(new Map());
    const priceRefs = useRef<Map<string, HTMLInputElement>>(new Map());

    // Filter products
    const filtered = query.trim().length > 0
        ? products.filter((p) => {
            const q = query.toLowerCase();
            return p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q));
        }).slice(0, 6)
        : [];

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                resultsRef.current && !resultsRef.current.contains(e.target as Node) &&
                searchRef.current && !searchRef.current.contains(e.target as Node)
            ) {
                setShowResults(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const addProduct = useCallback((product: ProductOption) => {
        const price = useCostPrice ? (product.cost_price || 0) : (product.selling_price || 0);
        // If product already in list, increment qty
        const existing = items.find((i) => i.product === product.name);
        if (existing) {
            onChange(items.map((i) => i.product === product.name ? { ...i, qty: i.qty + 1 } : i));
        } else {
            onChange([...items, { id: generateId(), product: product.name, sku: product.sku || "", qty: 1, unit_price: price }]);
        }
        setQuery("");
        setShowResults(false);
        setHighlightIndex(0);
        // Refocus search for rapid entry
        setTimeout(() => searchRef.current?.focus(), 50);
    }, [items, onChange, useCostPrice]);

    const updateItem = useCallback((id: string, field: keyof LineItem, value: string | number) => {
        onChange(items.map((i) => i.id === id ? { ...i, [field]: value } : i));
    }, [items, onChange]);

    const removeItem = useCallback((id: string) => {
        onChange(items.filter((i) => i.id !== id));
    }, [items, onChange]);

    const adjustQty = useCallback((id: string, delta: number) => {
        onChange(items.map((i) => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
    }, [items, onChange]);

    // Keyboard navigation in search
    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightIndex((p) => Math.min(p + 1, filtered.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightIndex((p) => Math.max(p - 1, 0));
        } else if (e.key === "Enter" && filtered[highlightIndex]) {
            e.preventDefault();
            addProduct(filtered[highlightIndex]);
        } else if (e.key === "Escape") {
            setShowResults(false);
        }
    };

    // Tab from qty to price within same row
    const handleQtyKeyDown = (e: React.KeyboardEvent, id: string) => {
        if (e.key === "Tab" && !e.shiftKey) {
            e.preventDefault();
            priceRefs.current.get(id)?.focus();
            priceRefs.current.get(id)?.select();
        } else if (e.key === "Enter") {
            e.preventDefault();
            searchRef.current?.focus();
        }
    };

    const handlePriceKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            searchRef.current?.focus();
        }
    };

    const total = items.reduce((sum, i) => sum + i.qty * i.unit_price, 0);

    return (
        <div className="space-y-3">
            {/* Search Bar — always prominent */}
            <div className="relative">
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                    <input
                        ref={searchRef}
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setShowResults(true);
                            setHighlightIndex(0);
                        }}
                        onFocus={() => { if (query.trim()) setShowResults(true); }}
                        onKeyDown={handleSearchKeyDown}
                        placeholder="Search products by name or SKU..."
                        className="w-full h-11 pl-11 pr-4 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-transparent text-sm font-medium shadow-sm transition-all duration-200 focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus-visible:outline-none placeholder:text-zinc-400"
                        autoComplete="off"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                            ↵ add
                        </kbd>
                    </div>
                </div>

                {/* Search Results Dropdown */}
                <AnimatePresence>
                    {showResults && filtered.length > 0 && (
                        <motion.div
                            ref={resultsRef}
                            initial={{ opacity: 0, y: -4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.98 }}
                            transition={{ duration: 0.12 }}
                            className="absolute z-[100] mt-1.5 w-full overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 shadow-2xl"
                        >
                            <div className="max-h-[280px] overflow-y-auto p-1.5">
                                {filtered.map((product, idx) => {
                                    const price = useCostPrice ? (product.cost_price || 0) : (product.selling_price || 0);
                                    const alreadyAdded = items.some((i) => i.product === product.name);
                                    return (
                                        <button
                                            key={`${product.name}-${product.sku}-${idx}`}
                                            type="button"
                                            onClick={() => addProduct(product)}
                                            onMouseEnter={() => setHighlightIndex(idx)}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-100",
                                                highlightIndex === idx
                                                    ? "bg-blue-50 dark:bg-blue-900/20"
                                                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                                                highlightIndex === idx
                                                    ? "bg-blue-100 dark:bg-blue-800/40"
                                                    : "bg-zinc-100 dark:bg-zinc-800"
                                            )}>
                                                <Package className={cn("w-3.5 h-3.5", highlightIndex === idx ? "text-blue-500" : "text-zinc-400")} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>
                                                    {product.name}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    {product.sku && (
                                                        <span className="text-[10px] font-mono" style={{ color: "var(--muted-foreground)" }}>
                                                            {product.sku}
                                                        </span>
                                                    )}
                                                    {alreadyAdded && (
                                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                            In list
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold whitespace-nowrap" style={{ color: "var(--primary)" }}>
                                                {formatPrice(price)}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                    {showResults && query.trim().length > 1 && filtered.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="absolute z-[100] mt-1.5 w-full rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 shadow-2xl p-5 text-center"
                        >
                            <Package className="w-6 h-6 mx-auto mb-2 text-zinc-300" />
                            <p className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
                                No products matching &quot;{query}&quot;
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Line Items List */}
            {items.length > 0 && (
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-wider" style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>
                        <span className="col-span-5">Product</span>
                        <span className="col-span-3 text-center">Quantity</span>
                        <span className="col-span-2">Unit Price</span>
                        <span className="col-span-2 text-right">Total</span>
                    </div>

                    {/* Rows */}
                    <AnimatePresence initial={false}>
                        {items.filter(i => i.product).map((item, idx) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                transition={{ duration: 0.15 }}
                                className={cn(
                                    "grid grid-cols-12 gap-2 items-center px-4 py-2.5 group transition-colors",
                                    idx % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-zinc-50/50 dark:bg-zinc-900/30"
                                )}
                                style={{ borderBottom: "1px solid var(--border)" }}
                            >
                                {/* Product Info */}
                                <div className="col-span-5 flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                        <Package className="w-3.5 h-3.5 text-zinc-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>
                                            {item.product}
                                        </p>
                                        {item.sku && (
                                            <p className="text-[10px] font-mono truncate" style={{ color: "var(--muted-foreground)" }}>
                                                {item.sku}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Quantity with +/- */}
                                <div className="col-span-3 flex items-center justify-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => adjustQty(item.id, -1)}
                                        className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-30"
                                        disabled={item.qty <= 1}
                                    >
                                        <Minus className="w-3 h-3" style={{ color: "var(--foreground)" }} />
                                    </button>
                                    <input
                                        ref={(el) => { if (el) qtyRefs.current.set(item.id, el); }}
                                        type="number"
                                        value={item.qty}
                                        onChange={(e) => updateItem(item.id, "qty", Math.max(1, parseInt(e.target.value) || 1))}
                                        onKeyDown={(e) => handleQtyKeyDown(e, item.id)}
                                        onFocus={(e) => e.target.select()}
                                        className="w-14 h-7 text-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent text-sm font-bold focus:border-blue-400 focus:ring-1 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        style={{ color: "var(--foreground)" }}
                                        min={1}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => adjustQty(item.id, 1)}
                                        className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                    >
                                        <Plus className="w-3 h-3" style={{ color: "var(--foreground)" }} />
                                    </button>
                                </div>

                                {/* Unit Price */}
                                <div className="col-span-2">
                                    <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-zinc-400">$</span>
                                        <input
                                            ref={(el) => { if (el) priceRefs.current.set(item.id, el); }}
                                            type="number"
                                            value={item.unit_price}
                                            onChange={(e) => updateItem(item.id, "unit_price", parseFloat(e.target.value) || 0)}
                                            onKeyDown={handlePriceKeyDown}
                                            onFocus={(e) => e.target.select()}
                                            className="w-full h-7 pl-5 pr-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent text-sm font-medium focus:border-blue-400 focus:ring-1 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            style={{ color: "var(--foreground)" }}
                                            step="0.01"
                                        />
                                    </div>
                                </div>

                                {/* Total + Delete */}
                                <div className="col-span-2 flex items-center justify-end gap-2">
                                    <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                                        {formatPrice(item.qty * item.unit_price)}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(item.id)}
                                        className="w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                    >
                                        <Trash2 className="w-3 h-3 text-red-500" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Footer Total */}
                    <div className="flex items-center justify-between px-4 py-3" style={{ background: "var(--secondary)" }}>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                                {items.filter(i => i.product).length} item{items.filter(i => i.product).length !== 1 ? "s" : ""}
                            </span>
                            <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>·</span>
                            <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                                Tab between qty → price, Enter to return to search
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Total</span>
                            <span className="ml-2 text-base font-bold" style={{ color: "var(--foreground)" }}>{formatPrice(total)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {items.filter(i => i.product).length === 0 && (
                <div className="rounded-xl border-2 border-dashed py-10 text-center transition-colors" style={{ borderColor: "var(--border)" }}>
                    <Package className="w-8 h-8 mx-auto mb-2 text-zinc-300 dark:text-zinc-600" />
                    <p className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>No products added yet</p>
                    <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)", opacity: 0.7 }}>
                        Search above to add products
                    </p>
                </div>
            )}
        </div>
    );
}
