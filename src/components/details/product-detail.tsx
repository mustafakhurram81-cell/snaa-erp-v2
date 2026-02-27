"use client";

import React from "react";
import { Drawer, Button, StatusBadge } from "@/components/ui/shared";
import { formatCurrency } from "@/lib/utils";
import { Edit2, Package, TrendingUp } from "lucide-react";

interface Product {
    id: string;
    name: string;
    sku: string;
    category: string;
    subcategory: string;
    unit_cost: number;
    selling_price: number;
    stock: number;
    status: string;
    [key: string]: unknown;
}

interface ProductDetailProps {
    product: Product | null;
    open: boolean;
    onClose: () => void;
}

const recentOrders = [
    { id: "SO-2026-042", customer: "Royal Hospital", qty: 50, date: "Feb 25, 2026" },
    { id: "SO-2026-038", customer: "City Medical", qty: 30, date: "Feb 21, 2026" },
    { id: "SO-2026-030", customer: "Global Health", qty: 100, date: "Feb 10, 2026" },
];

export function ProductDetail({ product, open, onClose }: ProductDetailProps) {
    if (!product) return null;

    const margin = product.selling_price > 0
        ? ((product.selling_price - product.unit_cost) / product.selling_price * 100).toFixed(1)
        : "0";

    return (
        <Drawer
            open={open}
            onClose={onClose}
            title="Product Details"
            width="max-w-xl"
            footer={
                <div className="flex justify-between">
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                    <Button variant="secondary">
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit Product
                    </Button>
                </div>
            }
        >
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{product.name}</h3>
                    <p className="text-sm font-mono" style={{ color: "var(--muted-foreground)" }}>{product.sku}</p>
                </div>
                <StatusBadge status={product.status} />
            </div>

            {/* Category */}
            <div className="rounded-xl border p-4 mb-5" style={{ background: "var(--secondary)", borderColor: "var(--border)" }}>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Category</p>
                        <p className="text-sm font-medium mt-0.5" style={{ color: "var(--foreground)" }}>{product.category}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Subcategory</p>
                        <p className="text-sm font-medium mt-0.5" style={{ color: "var(--foreground)" }}>{product.subcategory}</p>
                    </div>
                </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-3 gap-4 mb-5">
                <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Unit Cost</p>
                    <p className="text-lg font-bold mt-0.5" style={{ color: "var(--foreground)" }}>{formatCurrency(product.unit_cost)}</p>
                </div>
                <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Selling Price</p>
                    <p className="text-lg font-bold mt-0.5" style={{ color: "var(--foreground)" }}>{formatCurrency(product.selling_price)}</p>
                </div>
                <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Margin</p>
                    <p className="text-lg font-bold mt-0.5 text-emerald-600 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {margin}%
                    </p>
                </div>
            </div>

            {/* Stock */}
            <div className="rounded-xl border p-4 mb-5" style={{ borderColor: "var(--border)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--muted-foreground)" }}>Current Stock</p>
                <p className={`text-2xl font-bold ${product.stock < 30 ? "text-red-600" : ""}`} style={product.stock >= 30 ? { color: "var(--foreground)" } : undefined}>
                    {product.stock} units
                </p>
                {product.stock < 30 && <p className="text-xs text-red-500 font-medium mt-1">⚠ Below reorder point</p>}
            </div>

            {/* Recent Orders */}
            <div>
                <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>Recent Orders</h4>
                <div className="space-y-2">
                    {recentOrders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: "var(--border)" }}>
                            <div>
                                <p className="text-sm font-medium" style={{ color: "var(--primary)" }}>{order.id}</p>
                                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{order.customer} · {order.date}</p>
                            </div>
                            <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{order.qty} units</span>
                        </div>
                    ))}
                </div>
            </div>
        </Drawer>
    );
}
