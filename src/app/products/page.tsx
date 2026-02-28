"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Package, Plus, Grid3x3, List } from "lucide-react";
import { PageHeader, Button, Card, StatusBadge, Drawer, Input, SearchInput } from "@/components/ui/shared";
import { ProductDetail } from "@/components/details/product-detail";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

interface Product {
    id: string;
    sku: string;
    name: string;
    category: string;
    subcategory: string;
    unit_cost: number;
    selling_price: number;
    stock: number;
    status: string;
}

const initialProducts: Product[] = [
    { id: "1", sku: "SI-SC-001", name: 'Mayo Scissors 6.5" Straight', category: "Scissors", subcategory: "Mayo", unit_cost: 8.50, selling_price: 24.00, stock: 150, status: "active" },
    { id: "2", sku: "SI-SC-002", name: 'Metzenbaum Scissors 7" Curved', category: "Scissors", subcategory: "Metzenbaum", unit_cost: 9.00, selling_price: 28.00, stock: 120, status: "active" },
    { id: "3", sku: "SI-FP-001", name: 'Adson Forceps 4.75"', category: "Forceps", subcategory: "Adson", unit_cost: 5.50, selling_price: 15.00, stock: 200, status: "active" },
    { id: "4", sku: "SI-FP-002", name: 'Debakey Forceps 8"', category: "Forceps", subcategory: "DeBakey", unit_cost: 12.00, selling_price: 35.00, stock: 85, status: "active" },
    { id: "5", sku: "SI-RT-001", name: "Army-Navy Retractor Set", category: "Retractors", subcategory: "Hand-held", unit_cost: 18.00, selling_price: 52.00, stock: 60, status: "active" },
    { id: "6", sku: "SI-CL-001", name: 'Kelly Clamp 5.5" Curved', category: "Clamps", subcategory: "Kelly", unit_cost: 7.00, selling_price: 20.00, stock: 175, status: "active" },
    { id: "7", sku: "SI-NH-001", name: 'Mayo-Hegar Needle Holder 7"', category: "Needle Holders", subcategory: "Mayo-Hegar", unit_cost: 10.00, selling_price: 30.00, stock: 95, status: "active" },
    { id: "8", sku: "SI-SC-003", name: 'Iris Scissors 4.5" Straight', category: "Scissors", subcategory: "Iris", unit_cost: 6.00, selling_price: 18.00, stock: 0, status: "inactive" },
];

const categories = ["All", "Scissors", "Forceps", "Retractors", "Clamps", "Needle Holders"];

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [activeCategory, setActiveCategory] = useState("All");
    const [showDialog, setShowDialog] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const { toast } = useToast();

    // Form state
    const [formData, setFormData] = useState({ name: "", sku: "", category: "", subcategory: "", unit_cost: "", selling_price: "", stock: "" });

    const resetForm = () => setFormData({ name: "", sku: "", category: "", subcategory: "", unit_cost: "", selling_price: "", stock: "" });

    const handleCreate = () => {
        if (!formData.name.trim() || !formData.sku.trim()) {
            toast("error", "Name and SKU are required");
            return;
        }
        const newProduct: Product = {
            id: Date.now().toString(),
            sku: formData.sku,
            name: formData.name,
            category: formData.category || "Uncategorized",
            subcategory: formData.subcategory || "",
            unit_cost: parseFloat(formData.unit_cost) || 0,
            selling_price: parseFloat(formData.selling_price) || 0,
            stock: parseInt(formData.stock) || 0,
            status: "active",
        };
        setProducts([newProduct, ...products]);
        setShowDialog(false);
        resetForm();
        toast("success", `Product ${newProduct.name} created`);
    };

    const handleUpdateProduct = (updated: typeof products[0]) => {
        setProducts(products.map((p) => p.id === updated.id ? updated : p));
        setSelectedProduct(updated);
    };

    const filtered = products.filter((p) => {
        const matchesSearch = [p.name, p.sku, p.category].some((v) =>
            v.toLowerCase().includes(search.toLowerCase())
        );
        const matchesCategory = activeCategory === "All" || p.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <PageHeader
                title="Products"
                description={`${products.length} surgical instruments in catalog`}
                actions={
                    <Button onClick={() => { resetForm(); setShowDialog(true); }}>
                        <Plus className="w-3.5 h-3.5" />
                        Add Product
                    </Button>
                }
            />

            {/* Filters Row */}
            <div className="flex items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3 flex-1">
                    <div className="max-w-sm flex-1">
                        <SearchInput value={search} onChange={setSearch} placeholder="Search products..." />
                    </div>
                    <div className="flex items-center gap-1 overflow-x-auto">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${activeCategory === cat
                                    ? "bg-blue-600 text-white"
                                    : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)]"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "var(--secondary)" }}>
                    <button
                        onClick={() => setViewMode("grid")}
                        className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-[var(--card)] shadow-sm" : ""}`}
                        style={{ color: "var(--muted-foreground)" }}
                    >
                        <Grid3x3 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode("list")}
                        className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-[var(--card)] shadow-sm" : ""}`}
                        style={{ color: "var(--muted-foreground)" }}
                    >
                        <List className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Grid View */}
            {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map((product, idx) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                        >
                            <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group" onClick={() => setSelectedProduct(product)}>
                                <div className="w-full h-32 rounded-lg mb-3 flex items-center justify-center" style={{ background: "var(--secondary)" }}>
                                    <Package className="w-10 h-10 transition-transform group-hover:scale-110" style={{ color: "var(--muted-foreground)" }} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>{product.sku}</p>
                                            <h3 className="text-sm font-semibold mt-0.5 line-clamp-2" style={{ color: "var(--foreground)" }}>
                                                {product.name}
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>
                                            {product.category}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                                        <div>
                                            <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{formatCurrency(product.selling_price)}</p>
                                            <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>Cost: {formatCurrency(product.unit_cost)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold" style={{ color: product.stock > 0 ? "var(--foreground)" : "#ef4444" }}>
                                                {product.stock}
                                            </p>
                                            <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>In stock</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            ) : (
                /* List View */
                <div
                    className="rounded-xl border overflow-hidden"
                    style={{ background: "var(--card)", borderColor: "var(--border)" }}
                >
                    <table className="w-full">
                        <thead>
                            <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                                <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-3" style={{ color: "var(--muted-foreground)", background: "var(--secondary)" }}>Product</th>
                                <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-3" style={{ color: "var(--muted-foreground)", background: "var(--secondary)" }}>SKU</th>
                                <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-3" style={{ color: "var(--muted-foreground)", background: "var(--secondary)" }}>Category</th>
                                <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-3" style={{ color: "var(--muted-foreground)", background: "var(--secondary)" }}>Price</th>
                                <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-3" style={{ color: "var(--muted-foreground)", background: "var(--secondary)" }}>Stock</th>
                                <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-3" style={{ color: "var(--muted-foreground)", background: "var(--secondary)" }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((product) => (
                                <tr key={product.id} className="border-b last:border-b-0 hover:bg-[var(--secondary)] transition-colors cursor-pointer" style={{ borderColor: "var(--border)" }} onClick={() => setSelectedProduct(product)}>
                                    <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>{product.name}</td>
                                    <td className="px-4 py-3 text-sm font-mono" style={{ color: "var(--muted-foreground)" }}>{product.sku}</td>
                                    <td className="px-4 py-3 text-sm" style={{ color: "var(--foreground)" }}>{product.category}</td>
                                    <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>{formatCurrency(product.selling_price)}</td>
                                    <td className="px-4 py-3 text-sm" style={{ color: product.stock > 0 ? "var(--foreground)" : "#ef4444" }}>{product.stock}</td>
                                    <td className="px-4 py-3"><StatusBadge status={product.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <ProductDetail
                product={selectedProduct}
                open={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
                onUpdate={handleUpdateProduct}
            />

            <Drawer
                open={showDialog}
                onClose={() => setShowDialog(false)}
                title="Add Product"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setShowDialog(false)}>Cancel</Button>
                        <Button onClick={handleCreate}>Create Product</Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Product Name" placeholder='Mayo Scissors 6.5"' value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        <Input label="SKU" placeholder="SI-SC-001" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Category" placeholder="Scissors" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
                        <Input label="Subcategory" placeholder="Mayo" value={formData.subcategory} onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <Input label="Unit Cost" type="number" placeholder="0.00" value={formData.unit_cost} onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })} />
                        <Input label="Selling Price" type="number" placeholder="0.00" value={formData.selling_price} onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })} />
                        <Input label="Initial Stock" type="number" placeholder="0" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} />
                    </div>
                    {/* Margin Preview */}
                    {formData.unit_cost && formData.selling_price && (
                        <div className="rounded-lg border p-3" style={{ borderColor: "var(--border)", background: "var(--secondary)" }}>
                            <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--muted-foreground)" }}>Margin Preview</p>
                            <div className="flex items-center gap-4 mt-1">
                                <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                                    {formatCurrency(parseFloat(formData.selling_price) - parseFloat(formData.unit_cost))} per unit
                                </span>
                                <span className="text-xs font-semibold text-emerald-600">
                                    {((parseFloat(formData.selling_price) - parseFloat(formData.unit_cost)) / parseFloat(formData.selling_price) * 100).toFixed(1)}% margin
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </Drawer>
        </motion.div>
    );
}
