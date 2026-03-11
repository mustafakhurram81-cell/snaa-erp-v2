"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, Package, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export interface ProductOption {
    name: string;
    sku?: string;
    selling_price?: number;
    cost_price?: number;
}

interface ProductSearchProps {
    products: ProductOption[];
    value: string;
    onSelect: (product: ProductOption) => void;
    placeholder?: string;
    className?: string;
    /** Use cost_price instead of selling_price for display */
    useCostPrice?: boolean;
}

export function ProductSearch({
    products,
    value,
    onSelect,
    placeholder = "Search products...",
    className,
    useCostPrice = false,
}: ProductSearchProps) {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filter products by name or SKU
    const filtered = query.trim().length > 0
        ? products.filter((p) => {
            const q = query.toLowerCase();
            return (
                p.name.toLowerCase().includes(q) ||
                (p.sku && p.sku.toLowerCase().includes(q))
            );
        }).slice(0, 8) // Max 8 results
        : [];

    // Close on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === "Enter" && filtered[highlightedIndex]) {
            e.preventDefault();
            handleSelect(filtered[highlightedIndex]);
        } else if (e.key === "Escape") {
            setIsOpen(false);
            inputRef.current?.blur();
        }
    };

    const handleSelect = (product: ProductOption) => {
        onSelect(product);
        setQuery("");
        setIsOpen(false);
        setHighlightedIndex(0);
    };

    const handleClear = () => {
        onSelect({ name: "", sku: "", selling_price: 0, cost_price: 0 });
        setQuery("");
        setIsOpen(false);
    };

    const formatPrice = (p: ProductOption) => {
        const price = useCostPrice ? (p.cost_price || 0) : (p.selling_price || 0);
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(price);
    };

    // If a product is selected, show its name
    if (value) {
        return (
            <div
                className={cn(
                    "flex h-9 w-full items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 text-sm transition-colors",
                    className
                )}
            >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Package className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                    <span className="truncate font-medium" style={{ color: "var(--foreground)" }}>{value}</span>
                </div>
                <button
                    onClick={handleClear}
                    className="p-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
                    type="button"
                >
                    <X className="w-3 h-3 text-zinc-400" />
                </button>
            </div>
        );
    }

    return (
        <div className="relative">
            <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                        setHighlightedIndex(0);
                    }}
                    onFocus={() => {
                        if (query.trim().length > 0) setIsOpen(true);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className={cn(
                        "flex h-9 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent pl-8 pr-3 text-sm shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 placeholder:text-muted-foreground",
                        className
                    )}
                    autoComplete="off"
                />
            </div>

            <AnimatePresence>
                {isOpen && filtered.length > 0 && (
                    <motion.div
                        ref={dropdownRef}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-[100] mt-1 w-full min-w-[280px] overflow-hidden rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl shadow-xl"
                    >
                        <div className="max-h-[240px] overflow-y-auto p-1">
                            {filtered.map((product, idx) => (
                                <button
                                    key={`${product.name}-${product.sku}`}
                                    type="button"
                                    onClick={() => handleSelect(product)}
                                    onMouseEnter={() => setHighlightedIndex(idx)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                                        highlightedIndex === idx
                                            ? "bg-zinc-100 dark:bg-zinc-800"
                                            : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                                    )}
                                >
                                    <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                        <Package className="w-3.5 h-3.5 text-zinc-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                                            {product.name}
                                        </p>
                                        {product.sku && (
                                            <p className="text-[10px] font-mono" style={{ color: "var(--muted-foreground)" }}>
                                                SKU: {product.sku}
                                            </p>
                                        )}
                                    </div>
                                    <span className="text-xs font-semibold whitespace-nowrap" style={{ color: "var(--muted-foreground)" }}>
                                        {formatPrice(product)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
                {isOpen && query.trim().length > 0 && filtered.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute z-[100] mt-1 w-full rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl shadow-xl p-4 text-center"
                    >
                        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                            No products matching &quot;{query}&quot;
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
