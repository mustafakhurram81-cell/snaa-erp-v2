"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, Plus, Grid3x3, List, ImageIcon, Download, Upload } from "lucide-react";
import { PageHeader, Button, Card, StatusBadge, Drawer, Input, SearchInput } from "@/components/ui/shared";
import { ProductDetail } from "@/components/details/product-detail";
import { useToast } from "@/components/ui/toast";
import { useSupabaseTable } from "@/lib/supabase-hooks";
import { exportToCSV } from "@/lib/csv-export";
import { CSVImportDialog } from "@/components/shared/csv-import";
import { DeleteConfirmation } from "@/components/shared/delete-confirmation";
import { logActivity } from "@/lib/activity-logger";
import { supabase } from "@/lib/supabase";
import { TableSkeleton } from "@/components/ui/skeleton";

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
    image_url?: string;
}

const categories = ["All", "Scissors", "Forceps", "Retractors", "Clamps", "Needle Holders"];

export default function ProductsPage() {
    const { data: products, loading, create, update, remove, fetchAll } = useSupabaseTable<Product>("products");
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("list");
    const [activeCategory, setActiveCategory] = useState("All");
    const [showDialog, setShowDialog] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const { toast } = useToast();

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const imageRef = useRef<HTMLInputElement>(null);

    // Form state
    const [formData, setFormData] = useState({ name: "", sku: "", category: "", subcategory: "" });

    const resetForm = () => { setFormData({ name: "", sku: "", category: "", subcategory: "" }); setImageFile(null); setImagePreview(null); };

    // Keyboard shortcut: N to create new
    useEffect(() => {
        const handleNew = () => { resetForm(); setShowDialog(true); };
        const handleEsc = () => { setShowDialog(false); };
        window.addEventListener("keyboard-new", handleNew);
        window.addEventListener("keyboard-escape", handleEsc);
        return () => { window.removeEventListener("keyboard-new", handleNew); window.removeEventListener("keyboard-escape", handleEsc); };
    }, []);

    const handleCreate = async () => {
        if (!formData.name.trim() || !formData.sku.trim()) {
            toast("error", "Name and SKU are required");
            return;
        }

        // Upload image if selected
        let image_url = "";
        if (imageFile) {
            const ext = imageFile.name.split(".").pop() || "jpg";
            const path = `${formData.sku.replace(/[^a-zA-Z0-9-]/g, "_")}.${ext}`;
            const { error: upErr } = await supabase.storage.from("product-images").upload(path, imageFile, { upsert: true });
            if (!upErr) {
                const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
                image_url = urlData.publicUrl;
            }
        }

        const result = await create({
            sku: formData.sku,
            name: formData.name,
            category: formData.category || "Uncategorized",
            subcategory: formData.subcategory || "",
            unit_cost: 0,
            selling_price: 0,
            stock: 0,
            status: "active",
            ...(image_url ? { image_url } : {}),
        } as Partial<Product>);

        if (result) {
            setShowDialog(false);
            resetForm();
            toast("success", `Product ${result.name} created`);
            logActivity({ entityType: "product", entityId: result.id, action: "Product created", details: `${result.sku} — ${result.name}` });
        } else {
            toast("error", "Failed to create product");
        }
    };

    const handleUpdateProduct = async (updated: Product) => {
        const result = await update(updated.id, updated);
        if (result) {
            setSelectedProduct(result);
        }
    };

    const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
    const handleDeleteProduct = async (product: Product) => {
        setPendingDelete(product);
    };
    const confirmDelete = async () => {
        if (!pendingDelete) return;
        const success = await remove(pendingDelete.id);
        if (success) setSelectedProduct(null);
        setPendingDelete(null);
    };

    const filtered = products.filter((p) => {
        const matchesSearch = [p.name, p.sku, p.category].some((v) =>
            (v || "").toLowerCase().includes(search.toLowerCase())
        );
        const matchesCategory = activeCategory === "All" || p.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    if (loading) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <PageHeader title="Products" description="Loading..." />
                <TableSkeleton rows={5} columns={5} />
            </motion.div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <PageHeader
                title="Products"
                description={`${products.length} surgical instruments in catalog`}
                actions={
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => setShowImport(true)}>
                            <Upload className="w-3.5 h-3.5" />
                            Import
                        </Button>
                        <Button variant="secondary" onClick={() => exportToCSV(products, 'products')}>
                            <Download className="w-3.5 h-3.5" />
                            Export
                        </Button>
                        <Button onClick={() => { resetForm(); setShowDialog(true); }}>
                            <Plus className="w-3.5 h-3.5" />
                            Add Product
                        </Button>
                    </div>
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
                                <div className="w-full h-32 rounded-lg mb-3 flex items-center justify-center overflow-hidden" style={{ background: "var(--secondary)" }}>
                                    {(product as any).image_url ? (
                                        <img src={(product as any).image_url} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Package className="w-10 h-10 transition-transform group-hover:scale-110" style={{ color: "var(--muted-foreground)" }} />
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <div>
                                        <p className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>{product.sku}</p>
                                        <h3 className="text-sm font-semibold mt-0.5 line-clamp-2" style={{ color: "var(--foreground)" }}>
                                            {product.name}
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>
                                            {product.category}
                                        </span>
                                        {product.subcategory && (
                                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>
                                                {product.subcategory}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                                        <StatusBadge status={product.status} />
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            ) : (
                /* List/Table View */
                <div
                    className="rounded-xl border overflow-hidden"
                    style={{ background: "var(--card)", borderColor: "var(--border)" }}
                >
                    <table className="w-full">
                        <thead>
                            <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                                <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-3 w-10" style={{ color: "var(--muted-foreground)", background: "var(--secondary)" }}></th>
                                <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-3" style={{ color: "var(--muted-foreground)", background: "var(--secondary)" }}>Product</th>
                                <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-3" style={{ color: "var(--muted-foreground)", background: "var(--secondary)" }}>SKU</th>
                                <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-3" style={{ color: "var(--muted-foreground)", background: "var(--secondary)" }}>Category</th>
                                <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-3" style={{ color: "var(--muted-foreground)", background: "var(--secondary)" }}>Subcategory</th>
                                <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-3" style={{ color: "var(--muted-foreground)", background: "var(--secondary)" }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((product) => (
                                <tr key={product.id} className="border-b last:border-b-0 hover:bg-[var(--secondary)] transition-colors cursor-pointer" style={{ borderColor: "var(--border)" }} onClick={() => setSelectedProduct(product)}>
                                    <td className="px-4 py-3">
                                        <div className="group relative">
                                            <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-transparent hover:border-blue-300 transition-colors overflow-hidden">
                                                {(product as any).image_url ? (
                                                    <img src={(product as any).image_url} alt={product.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="w-4 h-4 text-zinc-400" />
                                                )}
                                            </div>
                                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50">
                                                <div className="w-36 h-36 rounded-xl bg-zinc-100 dark:bg-zinc-800 border shadow-lg flex flex-col items-center justify-center gap-1 overflow-hidden" style={{ borderColor: "var(--border)" }}>
                                                    {(product as any).image_url ? (
                                                        <img src={(product as any).image_url} alt={product.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <>
                                                            <Package className="w-10 h-10 text-zinc-300" />
                                                            <span className="text-[9px] text-zinc-400">No image yet</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>{product.name}</td>
                                    <td className="px-4 py-3 text-sm font-mono" style={{ color: "var(--muted-foreground)" }}>{product.sku}</td>
                                    <td className="px-4 py-3 text-sm" style={{ color: "var(--foreground)" }}>{product.category}</td>
                                    <td className="px-4 py-3 text-sm" style={{ color: "var(--muted-foreground)" }}>{product.subcategory}</td>
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
                onDelete={handleDeleteProduct}
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
                        <Input label="Product Name *" placeholder='Mayo Scissors 6.5"' value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        <Input label="SKU *" placeholder="SI-SC-001" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Category" placeholder="Scissors" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
                        <Input label="Subcategory" placeholder="Mayo" value={formData.subcategory} onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })} />
                    </div>
                    {/* Image Upload */}
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--muted-foreground)" }}>Product Image</p>
                        <div
                            className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-blue-500 transition-colors"
                            style={{ borderColor: "var(--border)" }}
                            onClick={() => imageRef.current?.click()}
                        >
                            {imagePreview ? (
                                <div className="flex items-center gap-3">
                                    <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
                                    <div className="text-left flex-1">
                                        <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{imageFile?.name}</p>
                                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{((imageFile?.size || 0) / 1024).toFixed(1)} KB</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <ImageIcon className="w-6 h-6 mx-auto mb-1" style={{ color: "var(--muted-foreground)" }} />
                                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Click to upload an image</p>
                                </>
                            )}
                            <input
                                ref={imageRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) {
                                        setImageFile(f);
                                        setImagePreview(URL.createObjectURL(f));
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            </Drawer>

            <CSVImportDialog
                open={showImport}
                onClose={() => setShowImport(false)}
                tableName="products"
                displayName="Products"
                requiredFields={["name", "sku"]}
                optionalFields={["category", "subcategory", "unit_cost", "selling_price", "stock"]}
                onImportComplete={() => fetchAll()}
            />

            <DeleteConfirmation
                open={!!pendingDelete}
                onClose={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
                title={`Delete ${pendingDelete?.name}?`}
                description="This product will be permanently deleted. This action cannot be undone."
            />
        </motion.div>
    );
}
