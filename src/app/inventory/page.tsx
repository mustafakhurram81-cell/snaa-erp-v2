"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Warehouse, AlertTriangle, ArrowDownUp, Plus, Package, TrendingDown, TrendingUp } from "lucide-react";
import { PageHeader, Button, Card, StatCard, StatusBadge, Tabs, Drawer, Input } from "@/components/ui/shared";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { useSupabaseTable } from "@/lib/supabase-hooks";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/toast";

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  reorder_point: number;
  selling_price: number;
  unit_cost: number;
  status: string;
}

interface InventoryItem {
  id: string;
  sku: string;
  product: string;
  category: string;
  on_hand: number;
  reserved: number;
  available: number;
  reorder_point: number;
  status: string;
  selling_price: number;
  unit_cost: number;
}

interface Movement {
  type: "in" | "out" | "adjustment";
  product: string;
  qty: number;
  reference: string;
  date: string;
}

const fallbackMovements: Movement[] = [];

const columns: ColumnDef<InventoryItem, unknown>[] = [
  {
    accessorKey: "product",
    header: "Product",
    cell: ({ row }) => (
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{row.original.product}</p>
        <p className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>{row.original.sku}</p>
      </div>
    ),
  },
  { accessorKey: "category", header: "Category" },
  {
    accessorKey: "on_hand",
    header: "On Hand",
    cell: ({ row }) => (
      <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
        {formatNumber(row.original.on_hand)}
      </span>
    ),
  },
  {
    accessorKey: "available",
    header: "Available",
    cell: ({ row }) => {
      const low = row.original.available <= row.original.reorder_point;
      return (
        <span className={`font-semibold text-sm ${low ? "text-red-500" : ""}`} style={!low ? { color: "var(--foreground)" } : undefined}>
          {formatNumber(row.original.available)}
          {low && <AlertTriangle className="inline w-3 h-3 ml-1" />}
        </span>
      );
    },
  },
  {
    accessorKey: "reorder_point",
    header: "Reorder Pt",
    cell: ({ row }) => (
      <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
        {formatNumber(row.original.reorder_point)}
      </span>
    ),
  },
  {
    accessorKey: "unit_cost",
    header: "Unit Cost",
    cell: ({ row }) => (
      <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
        {formatCurrency(row.original.unit_cost)}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.available <= row.original.reorder_point ? "Low Stock" : "In Stock"} />,
    enableSorting: false,
  },
];

export default function InventoryPage() {
  const { data: products, loading, fetchAll } = useSupabaseTable<Product>("products", { orderBy: "name", ascending: true });
  const [activeTab, setActiveTab] = useState("overview");
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjProduct, setAdjProduct] = useState("");
  const [adjType, setAdjType] = useState<"add" | "remove">("add");
  const [adjQty, setAdjQty] = useState("");
  const [adjReason, setAdjReason] = useState("");
  const { toast } = useToast();

  const resetAdjForm = () => { setAdjProduct(""); setAdjType("add"); setAdjQty(""); setAdjReason(""); };

  // Live movements from POs (in) and SOs (out)
  const [movements, setMovements] = useState<Movement[]>(fallbackMovements);
  useEffect(() => {
    async function fetchMovements() {
      const [poRes, soRes] = await Promise.all([
        supabase.from("purchase_orders").select("po_number, vendor_name, total_amount, status, created_at").order("created_at", { ascending: false }).limit(25),
        supabase.from("sales_orders").select("order_number, customer_name, total_amount, status, created_at").order("created_at", { ascending: false }).limit(25),
      ]);
      const live: Movement[] = [];
      (poRes.data || []).forEach((po: any) => {
        live.push({
          type: "in",
          product: po.vendor_name || "Purchase",
          qty: Math.round((po.total_amount || 0) / 100), // estimate units from value
          reference: po.po_number || "PO",
          date: new Date(po.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        });
      });
      (soRes.data || []).forEach((so: any) => {
        live.push({
          type: "out",
          product: so.customer_name || "Sale",
          qty: Math.round((so.total_amount || 0) / 100),
          reference: so.order_number || "SO",
          date: new Date(so.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        });
      });
      if (live.length > 0) {
        live.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setMovements(live.slice(0, 50));
      }
    }
    fetchMovements();
  }, []);

  const handleStockAdjust = async () => {
    if (!adjProduct) { toast("error", "Please select a product"); return; }
    const qty = parseInt(adjQty);
    if (!qty || qty <= 0) { toast("error", "Enter a valid quantity"); return; }
    const product = products.find(p => p.id === adjProduct);
    if (!product) return;
    const newStock = adjType === "add" ? (product.stock || 0) + qty : Math.max(0, (product.stock || 0) - qty);
    const { error } = await supabase.from("products").update({ stock: newStock }).eq("id", adjProduct);
    if (error) { toast("error", "Failed to adjust stock"); return; }
    toast("success", "Stock adjusted", `${product.name}: ${adjType === "add" ? "+" : "-"}${qty} → ${newStock} units`);
    const { logActivity } = await import("@/lib/activity-logger");
    logActivity({ entityType: "product", entityId: product.id, action: "Stock adjusted", details: `${product.name}: ${adjType === "add" ? "+" : "-"}${qty} → ${newStock}` });
    setShowAdjust(false);
    resetAdjForm();
    fetchAll();
  };

  // Map products to inventory items
  const inventory: InventoryItem[] = useMemo(() => products.map(p => ({
    id: p.id,
    sku: p.sku || "",
    product: p.name,
    category: p.category || "Uncategorized",
    on_hand: p.stock || 0,
    reserved: 0,
    available: p.stock || 0,
    reorder_point: p.reorder_point || 10,
    status: p.status || "active",
    selling_price: Number(p.selling_price) || 0,
    unit_cost: Number(p.unit_cost) || 0,
  })), [products]);

  const totalOnHand = inventory.reduce((s, i) => s + i.on_hand, 0);
  const totalValue = inventory.reduce((s, i) => s + i.on_hand * i.unit_cost, 0);
  const lowStockCount = inventory.filter((i) => i.available <= i.reorder_point).length;

  const tabs = [
    { key: "overview", label: "Inventory", count: inventory.length },
    { key: "movements", label: "Movements", count: movements.length },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Inventory"
        description={`${inventory.length} products · Real-time stock levels`}
        actions={
          <Button onClick={() => { resetAdjForm(); setShowAdjust(true); }}>
            <ArrowDownUp className="w-3.5 h-3.5" />
            Adjust Stock
          </Button>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard title="Total Products" value={loading ? "..." : inventory.length} icon={<Package className="w-5 h-5" style={{ color: "var(--muted-foreground)" }} />} />
        <StatCard title="Total On Hand" value={loading ? "..." : formatNumber(totalOnHand)} icon={<Warehouse className="w-5 h-5" style={{ color: "var(--muted-foreground)" }} />} />
        <StatCard title="Inventory Value" value={loading ? "..." : formatCurrency(totalValue)} icon={<TrendingUp className="w-5 h-5" style={{ color: "var(--muted-foreground)" }} />} />
        <StatCard title="Low Stock Items" value={lowStockCount} changeType={lowStockCount > 0 ? "negative" : "neutral"} change={lowStockCount > 0 ? "Needs attention" : "All good"} icon={<AlertTriangle className="w-5 h-5" style={{ color: "var(--muted-foreground)" }} />} />
      </div>

      <div className="mb-5">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === "overview" && (
        <DataTable
          columns={columns}
          data={inventory}
          emptyMessage={loading ? "Loading inventory..." : "No inventory items"}
          searchPlaceholder="Search products..."
          enableColumnVisibility
        />
      )}

      {activeTab === "movements" && (
        <div className="space-y-2">
          {movements.map((m, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${m.type === "in" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : m.type === "out" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>
                  {m.type === "in" ? <TrendingUp className="w-3.5 h-3.5" /> : m.type === "out" ? <TrendingDown className="w-3.5 h-3.5" /> : <ArrowDownUp className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{m.product}</p>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{m.reference} · {m.date}</p>
                </div>
              </div>
              <span className={`text-sm font-semibold ${m.type === "in" ? "text-emerald-600" : m.type === "out" ? "text-blue-600" : "text-amber-600"}`}>
                {m.type === "in" ? "+" : ""}{m.qty}
              </span>
            </div>
          ))}
        </div>
      )}

      <Drawer
        open={showAdjust}
        onClose={() => setShowAdjust(false)}
        title="Stock Adjustment"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowAdjust(false)}>Cancel</Button>
            <Button onClick={handleStockAdjust}>Submit Adjustment</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Product *</label>
            <select
              value={adjProduct}
              onChange={(e) => setAdjProduct(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              style={{ background: "var(--background)", borderColor: "var(--border)", color: adjProduct ? "var(--foreground)" : "var(--muted-foreground)" }}
            >
              <option value="">Select product...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock || 0})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Type *</label>
              <select
                value={adjType}
                onChange={(e) => setAdjType(e.target.value as "add" | "remove")}
                className="w-full h-9 px-3 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                <option value="add">Add Stock</option>
                <option value="remove">Remove Stock</option>
              </select>
            </div>
            <Input label="Quantity *" type="number" placeholder="0" value={adjQty} onChange={(e) => setAdjQty(e.target.value)} />
          </div>
          <Input label="Reason" placeholder="Reason for adjustment..." value={adjReason} onChange={(e) => setAdjReason(e.target.value)} />
        </div>
      </Drawer>
    </motion.div>
  );
}

