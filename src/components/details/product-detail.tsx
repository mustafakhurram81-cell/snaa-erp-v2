"use client";

import React, { useState, useEffect } from "react";
import { Drawer, Button, StatusBadge, DrawerTabs, Input } from "@/components/ui/shared";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Edit3, Package, TrendingUp, Save, X, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { DeleteConfirmation } from "@/components/shared/delete-confirmation";
import { LiveActivityLog } from "@/components/shared/activity-log";
import { supabase } from "@/lib/supabase";

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
}

interface ProductDetailProps {
    product: Product | null;
    open: boolean;
    onClose: () => void;
    onUpdate?: (product: Product) => void;
    onDelete?: (product: Product) => void;
}

interface RecentOrder {
    id: string;
    order_number: string;
    customer_name: string;
    quantity: number;
    created_at: string;
}

export function ProductDetail({ product, open, onClose, onUpdate, onDelete }: ProductDetailProps) {
    if (!product) return null;
    const { toast } = useToast();
    const [showDelete, setShowDelete] = useState(false);
    const [activeTab, setActiveTab] = useState("orders");
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ ...product });
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    useEffect(() => {
        if (product) { setEditData({ ...product }); setIsEditing(false); }
    }, [product]);

    // Fetch real sales order items containing this product
    useEffect(() => {
        if (!product?.id || !open) return;
        setLoadingOrders(true);
        supabase
            .from("sales_order_items")
            .select("id, quantity, sales_order_id, sales_orders!inner(order_number, customer_name, created_at)")
            .eq("product_id", product.id)
            .order("created_at", { ascending: false })
            .limit(10)
            .then(({ data, error }) => {
                if (data && !error) {
                    setRecentOrders(data.map((item: any) => ({
                        id: item.id,
                        order_number: item.sales_orders?.order_number || "—",
                        customer_name: item.sales_orders?.customer_name || "—",
                        quantity: item.quantity || 0,
                        created_at: item.sales_orders?.created_at || "",
                    })));
                } else {
                    // Fallback: search by product name in sales_order_items
                    supabase
                        .from("sales_order_items")
                        .select("id, quantity, product_name, created_at")
                        .ilike("product_name", product.name)
                        .order("created_at", { ascending: false })
                        .limit(10)
                        .then(({ data: fallbackData }) => {
                            setRecentOrders((fallbackData || []).map((item: any) => ({
                                id: item.id,
                                order_number: "—",
                                customer_name: item.product_name || "—",
                                quantity: item.quantity || 0,
                                created_at: item.created_at || "",
                            })));
                        });
                }
                setLoadingOrders(false);
            });
    }, [product?.id, product?.name, open]);

    const handleSave = async () => {
        if (onUpdate) onUpdate(editData);
        setIsEditing(false);
        toast("success", "Product updated", `${editData.name} saved successfully`);
        const { logActivity } = await import("@/lib/activity-logger");
        logActivity({ entityType: "product", entityId: product.id, action: "Product updated", details: `${product.sku} — ${product.name}` });
    };

    const handleCancel = () => { setEditData({ ...product }); setIsEditing(false); };

    const displayProduct = isEditing ? editData : product;
    const margin = displayProduct.selling_price > 0
        ? ((displayProduct.selling_price - displayProduct.unit_cost) / displayProduct.selling_price * 100).toFixed(1)
        : "0";

    const tabs = [
        { key: "orders", label: "Recent Orders", count: recentOrders.length },
        { key: "activity", label: "Activity" },
    ];

    return (
        <Drawer
            open={open}
            onClose={() => { handleCancel(); onClose(); }}
            title={isEditing ? "Edit Product" : "Product Details"}
            width="max-w-xl"
            footer={
                <div className="flex justify-between">
                    <Button variant="secondary" onClick={() => { handleCancel(); onClose(); }}>Close</Button>
                    <div className="flex gap-2">
                        {isEditing ? (
                            <>
                                <Button variant="secondary" onClick={handleCancel}><X className="w-3.5 h-3.5" /> Cancel</Button>
                                <Button onClick={handleSave}><Save className="w-3.5 h-3.5" /> Save Changes</Button>
                            </>
                        ) : (
                            <>
                                <Button variant="secondary" onClick={() => setIsEditing(true)}>
                                    <Edit3 className="w-3.5 h-3.5" /> Edit Product
                                </Button>
                                <button onClick={() => setShowDelete(true)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                            </>
                        )}
                    </div>
                </div>
            }
        >
            {/* Header */}
            <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                    {isEditing ? (
                        <div className="space-y-2">
                            <Input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} placeholder="Product name" />
                            <Input value={editData.sku} onChange={(e) => setEditData({ ...editData, sku: e.target.value })} placeholder="SKU" />
                        </div>
                    ) : (
                        <>
                            <h3 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{product.name}</h3>
                            <p className="text-sm font-mono" style={{ color: "var(--muted-foreground)" }}>{product.sku}</p>
                        </>
                    )}
                </div>
                {!isEditing && <StatusBadge status={product.status} />}
                {isEditing && (
                    <select
                        value={editData.status}
                        onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                        className="h-8 px-3 rounded-lg border text-xs font-medium"
                        style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
                    >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                )}
            </div>

            {/* Category */}
            <div className="rounded-xl border p-4 mb-5" style={{ background: "var(--secondary)", borderColor: "var(--border)" }}>
                {isEditing ? (
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Category" value={editData.category} onChange={(e) => setEditData({ ...editData, category: e.target.value })} />
                        <Input label="Subcategory" value={editData.subcategory} onChange={(e) => setEditData({ ...editData, subcategory: e.target.value })} />
                    </div>
                ) : (
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
                )}
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-3 gap-4 mb-5">
                {isEditing ? (
                    <>
                        <Input label="Unit Cost" type="number" value={String(editData.unit_cost)} onChange={(e) => setEditData({ ...editData, unit_cost: parseFloat(e.target.value) || 0 })} />
                        <Input label="Selling Price" type="number" value={String(editData.selling_price)} onChange={(e) => setEditData({ ...editData, selling_price: parseFloat(e.target.value) || 0 })} />
                        <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Margin</p>
                            <p className="text-lg font-bold mt-0.5 text-emerald-600 flex items-center gap-1">
                                <TrendingUp className="w-4 h-4" />{margin}%
                            </p>
                        </div>
                    </>
                ) : (
                    <>
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
                                <TrendingUp className="w-4 h-4" />{margin}%
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* Stock */}
            <div className="rounded-xl border p-4 mb-5" style={{ borderColor: "var(--border)" }}>
                {isEditing ? (
                    <Input label="Current Stock" type="number" value={String(editData.stock)} onChange={(e) => setEditData({ ...editData, stock: parseInt(e.target.value) || 0 })} />
                ) : (
                    <>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--muted-foreground)" }}>Current Stock</p>
                        <p className={`text-2xl font-bold ${displayProduct.stock < 30 ? "text-red-600" : ""}`} style={displayProduct.stock >= 30 ? { color: "var(--foreground)" } : undefined}>
                            {displayProduct.stock} units
                        </p>
                        {displayProduct.stock < 30 && <p className="text-xs text-red-500 font-medium mt-1">⚠ Below reorder point</p>}
                    </>
                )}
            </div>

            {/* Tabs (hidden during edit) */}
            {!isEditing && (
                <>
                    <DrawerTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
                    {activeTab === "orders" && (
                        <div className="space-y-2">
                            {loadingOrders ? (
                                <div className="py-8 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>Loading orders...</div>
                            ) : recentOrders.length === 0 ? (
                                <div className="py-8 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>No orders found for this product</div>
                            ) : (
                                recentOrders.map((order) => (
                                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: "var(--border)" }}>
                                        <div>
                                            <p className="text-sm font-medium" style={{ color: "var(--primary)" }}>{order.order_number}</p>
                                            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{order.customer_name} · {formatDate(order.created_at)}</p>
                                        </div>
                                        <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{order.quantity} units</span>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                    {activeTab === "activity" && (
                        <LiveActivityLog entityType="product" entityId={product.id} />
                    )}
                </>
            )}

            <DeleteConfirmation
                open={showDelete}
                onClose={() => setShowDelete(false)}
                onConfirm={async () => { setShowDelete(false); if (onDelete) { onDelete(product); } const { logActivity } = await import("@/lib/activity-logger"); logActivity({ entityType: "product", entityId: product.id, action: "Product deleted", details: `${product.sku} — ${product.name}` }); toast("success", "Product deleted", `${product.name} deleted`); onClose(); }}
                title={`Delete ${product.name}?`}
                description="This action cannot be undone. The product will be permanently removed from your catalog."
            />
        </Drawer>
    );
}
