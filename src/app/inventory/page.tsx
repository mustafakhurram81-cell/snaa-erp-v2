"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Warehouse, AlertTriangle, ArrowDownUp, Plus, Package, TrendingDown, TrendingUp } from "lucide-react";
import { PageHeader, Button, Card, StatCard, StatusBadge, Tabs, Drawer, Input } from "@/components/ui/shared";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { formatNumber, formatCurrency } from "@/lib/utils";

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
}

const mockInventory: InventoryItem[] = [
  { id: "1", sku: "SI-SC-001", product: "Mayo Scissors 6.5\" Straight", category: "Scissors", on_hand: 150, reserved: 20, available: 130, reorder_point: 50, status: "active" },
  { id: "2", sku: "SI-SC-002", product: "Metzenbaum Scissors 7\" Curved", category: "Scissors", on_hand: 120, reserved: 45, available: 75, reorder_point: 40, status: "active" },
  { id: "3", sku: "SI-FP-001", product: "Adson Forceps 4.75\"", category: "Forceps", on_hand: 200, reserved: 60, available: 140, reorder_point: 80, status: "active" },
  { id: "4", sku: "SI-FP-002", product: "Debakey Forceps 8\"", category: "Forceps", on_hand: 85, reserved: 30, available: 55, reorder_point: 30, status: "active" },
  { id: "5", sku: "SI-RT-001", product: "Army-Navy Retractor Set", category: "Retractors", on_hand: 60, reserved: 15, available: 45, reorder_point: 20, status: "active" },
  { id: "6", sku: "SI-CL-001", product: "Kelly Clamp 5.5\" Curved", category: "Clamps", on_hand: 175, reserved: 50, available: 125, reorder_point: 60, status: "active" },
  { id: "7", sku: "SI-NH-001", product: "Mayo-Hegar Needle Holder 7\"", category: "Needle Holders", on_hand: 95, reserved: 25, available: 70, reorder_point: 35, status: "active" },
  { id: "8", sku: "SI-SC-003", product: "Iris Scissors 4.5\" Straight", category: "Scissors", on_hand: 8, reserved: 5, available: 3, reorder_point: 30, status: "active" },
];

const movements = [
  { type: "in", product: "Mayo Scissors 6.5\"", qty: 200, reference: "PO-2026-027", date: "Feb 24, 2026" },
  { type: "out", product: "Adson Forceps 4.75\"", qty: 50, reference: "SO-2026-042", date: "Feb 24, 2026" },
  { type: "in", product: "Kelly Clamp 5.5\"", qty: 100, reference: "PO-2026-026", date: "Feb 23, 2026" },
  { type: "out", product: "Debakey Forceps 8\"", qty: 30, reference: "SO-2026-041", date: "Feb 22, 2026" },
  { type: "adjustment", product: "Iris Scissors 4.5\"", qty: -2, reference: "Manual adjustment", date: "Feb 21, 2026" },
];

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
    accessorKey: "reserved",
    header: "Reserved",
    cell: ({ row }) => (
      <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
        {formatNumber(row.original.reserved)}
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
    header: "Reorder",
    cell: ({ row }) => (
      <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
        {formatNumber(row.original.reorder_point)}
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
  const [inventory] = useState<InventoryItem[]>(mockInventory);
  const [activeTab, setActiveTab] = useState("overview");
  const [showAdjust, setShowAdjust] = useState(false);

  const totalOnHand = inventory.reduce((s, i) => s + i.on_hand, 0);
  const totalReserved = inventory.reduce((s, i) => s + i.reserved, 0);
  const lowStockCount = inventory.filter((i) => i.available <= i.reorder_point).length;

  const tabs = [
    { key: "overview", label: "Inventory" },
    { key: "movements", label: "Movements", count: movements.length },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Inventory"
        description="Real-time stock levels and movements"
        actions={
          <Button onClick={() => setShowAdjust(true)}>
            <ArrowDownUp className="w-3.5 h-3.5" />
            Adjust Stock
          </Button>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard title="Total Products" value={inventory.length} icon={<Package className="w-5 h-5" style={{ color: "var(--muted-foreground)" }} />} />
        <StatCard title="Total On Hand" value={formatNumber(totalOnHand)} icon={<Warehouse className="w-5 h-5" style={{ color: "var(--muted-foreground)" }} />} />
        <StatCard title="Reserved" value={formatNumber(totalReserved)} icon={<TrendingDown className="w-5 h-5" style={{ color: "var(--muted-foreground)" }} />} />
        <StatCard title="Low Stock Items" value={lowStockCount} changeType={lowStockCount > 0 ? "negative" : "neutral"} change={lowStockCount > 0 ? "Needs attention" : "All good"} icon={<AlertTriangle className="w-5 h-5" style={{ color: "var(--muted-foreground)" }} />} />
      </div>

      <div className="mb-5">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === "overview" && (
        <DataTable
          columns={columns}
          data={inventory}
          emptyMessage="No inventory items"
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
            <Button onClick={() => setShowAdjust(false)}>Submit Adjustment</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Product" placeholder="Select product..." />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Adjustment Type" placeholder="Add / Remove" />
            <Input label="Quantity" type="number" placeholder="0" />
          </div>
          <Input label="Reason" placeholder="Reason for adjustment..." />
        </div>
      </Drawer>
    </motion.div>
  );
}
