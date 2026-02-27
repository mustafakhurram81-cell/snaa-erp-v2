"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Warehouse, AlertTriangle, ArrowDownUp, Plus, Package, TrendingDown, TrendingUp } from "lucide-react";
import { PageHeader, Button, Card, StatCard, DataTable, StatusBadge, SearchInput, Tabs, Drawer, Input } from "@/components/ui/shared";
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
  [key: string]: unknown;
}

const mockInventory: InventoryItem[] = [
  { id: "1", sku: "SI-SC-001", product: "Mayo Scissors 6.5\" Straight", category: "Scissors", on_hand: 150, reserved: 20, available: 130, reorder_point: 50, status: "active" },
  { id: "2", sku: "SI-SC-002", product: "Metzenbaum Scissors 7\" Curved", category: "Scissors", on_hand: 120, reserved: 15, available: 105, reorder_point: 40, status: "active" },
  { id: "3", sku: "SI-FP-001", product: "Adson Forceps 4.75\"", category: "Forceps", on_hand: 200, reserved: 50, available: 150, reorder_point: 60, status: "active" },
  { id: "4", sku: "SI-FP-002", product: "Debakey Forceps 8\"", category: "Forceps", on_hand: 85, reserved: 30, available: 55, reorder_point: 30, status: "active" },
  { id: "5", sku: "SI-RT-001", product: "Army-Navy Retractor Set", category: "Retractors", on_hand: 60, reserved: 10, available: 50, reorder_point: 25, status: "active" },
  { id: "6", sku: "SI-CL-001", product: "Kelly Clamp 5.5\" Curved", category: "Clamps", on_hand: 175, reserved: 40, available: 135, reorder_point: 50, status: "active" },
  { id: "7", sku: "SI-NH-001", product: "Mayo-Hegar Needle Holder 7\"", category: "Needle Holders", on_hand: 95, reserved: 20, available: 75, reorder_point: 35, status: "active" },
  { id: "8", sku: "SI-SC-003", product: "Iris Scissors 4.5\" Straight", category: "Scissors", on_hand: 8, reserved: 5, available: 3, reorder_point: 30, status: "active" },
];

const movements = [
  { type: "in", product: "Mayo Scissors 6.5\"", qty: 200, reference: "PO-2026-027", date: "Feb 24, 2026" },
  { type: "out", product: "Adson Forceps 4.75\"", qty: 50, reference: "SO-2026-042", date: "Feb 24, 2026" },
  { type: "in", product: "Kelly Clamp 5.5\"", qty: 300, reference: "PRD-2026-109", date: "Feb 23, 2026" },
  { type: "out", product: "Debakey Forceps 8\"", qty: 30, reference: "SO-2026-041", date: "Feb 22, 2026" },
  { type: "adjustment", product: "Iris Scissors 4.5\"", qty: -2, reference: "Manual adjustment", date: "Feb 21, 2026" },
];

export default function InventoryPage() {
  const [inventory] = useState<InventoryItem[]>(mockInventory);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("stock");
  const [showAdjust, setShowAdjust] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const totalItems = inventory.reduce((sum, i) => sum + i.on_hand, 0);
  const lowStock = inventory.filter((i) => i.available <= i.reorder_point);
  const reserved = inventory.reduce((sum, i) => sum + i.reserved, 0);

  const filtered = inventory.filter((i) =>
    [i.sku, i.product, i.category].some((v) =>
      v.toLowerCase().includes(search.toLowerCase())
    )
  );

  const columns = [
    {
      key: "product",
      label: "Product",
      render: (item: InventoryItem) => (
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{item.product}</p>
          <p className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>{item.sku}</p>
        </div>
      ),
    },
    { key: "category", label: "Category" },
    {
      key: "on_hand",
      label: "On Hand",
      render: (item: InventoryItem) => (
        <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{item.on_hand}</span>
      ),
    },
    {
      key: "reserved",
      label: "Reserved",
      render: (item: InventoryItem) => (
        <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>{item.reserved}</span>
      ),
    },
    {
      key: "available",
      label: "Available",
      render: (item: InventoryItem) => (
        <span className={`font-medium text-sm ${item.available <= item.reorder_point ? "text-red-500" : ""}`} style={item.available > item.reorder_point ? { color: "var(--foreground)" } : undefined}>
          {item.available}
        </span>
      ),
    },
    {
      key: "reorder_point",
      label: "Reorder Pt",
      render: (item: InventoryItem) => (
        <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>{item.reorder_point}</span>
      ),
    },
    {
      key: "status_indicator",
      label: "Status",
      render: (item: InventoryItem) => (
        item.available <= item.reorder_point ? (
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs font-medium text-red-500">Low Stock</span>
          </div>
        ) : (
          <span className="text-xs font-medium text-emerald-500">In Stock</span>
        )
      ),
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Inventory"
        description="Stock levels, movements, and adjustments"
        actions={
          <Button onClick={() => setShowAdjust(true)}>
            <ArrowDownUp className="w-3.5 h-3.5" />
            Adjust Stock
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Total Items in Stock"
          value={formatNumber(totalItems)}
          icon={<Package className="w-5 h-5 text-blue-500" />}
        />
        <StatCard
          title="Low Stock Alerts"
          value={lowStock.length.toString()}
          change={`${lowStock.length} items below reorder point`}
          changeType="negative"
          icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
        />
        <StatCard
          title="Reserved Stock"
          value={formatNumber(reserved)}
          icon={<Warehouse className="w-5 h-5 text-amber-500" />}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <Tabs
          tabs={[
            { key: "stock", label: "Stock Levels" },
            { key: "movements", label: "Movements" },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
        <div className="max-w-xs">
          <SearchInput value={search} onChange={setSearch} placeholder="Search inventory..." />
        </div>
      </div>

      {activeTab === "stock" ? (
        <DataTable columns={columns} data={filtered} emptyMessage="No inventory items" onRowClick={(item) => setSelectedItem(item as InventoryItem)} />
      ) : (
        <Card padding={false}>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {movements.map((mv, idx) => (
              <div key={idx} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--secondary)] transition-colors">
                <div className={`p-2 rounded-lg ${
                  mv.type === "in" ? "bg-emerald-100 dark:bg-emerald-900/20" :
                  mv.type === "out" ? "bg-red-100 dark:bg-red-900/20" :
                  "bg-amber-100 dark:bg-amber-900/20"
                }`}>
                  {mv.type === "in" ? <TrendingUp className="w-4 h-4 text-emerald-600" /> :
                   mv.type === "out" ? <TrendingDown className="w-4 h-4 text-red-600" /> :
                   <ArrowDownUp className="w-4 h-4 text-amber-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{mv.product}</p>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{mv.reference}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${
                    mv.type === "in" ? "text-emerald-600" : mv.type === "out" ? "text-red-600" : "text-amber-600"
                  }`}>
                    {mv.type === "in" ? "+" : ""}{mv.qty}
                  </p>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{mv.date}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Drawer
          open={showAdjust}
          onClose={() => setShowAdjust(false)}
          title="Adjust Stock"
          width="max-w-md"
          footer={
              <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setShowAdjust(false)}>Cancel</Button>
                  <Button onClick={() => setShowAdjust(false)}>Apply Adjustment</Button>
              </div>
          }
      >
        <div className="space-y-4">
          <Input label="Product" placeholder="Search product..." />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Adjustment Qty" type="number" placeholder="0" />
            <Input label="Type" placeholder="In / Out / Adjustment" />
          </div>
          <Input label="Reason / Reference" placeholder="Manual count adjustment..." />
        </div>
      </Drawer>
    </motion.div>
  );
}
