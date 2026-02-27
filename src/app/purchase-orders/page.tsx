"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Plus, Eye, Truck as TruckIcon } from "lucide-react";
import { PageHeader, Button, DataTable, StatusBadge, SearchInput, Tabs, Drawer, Input, Card } from "@/components/ui/shared";
import { PurchaseOrderDetail } from "@/components/details/purchase-order-detail";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor: string;
  date: string;
  expected_date: string;
  items_count: number;
  total: number;
  status: string;
  jo_reference?: string;
  jo_stage?: string;
  [key: string]: unknown;
}

const mockPOs: PurchaseOrder[] = [
  { id: "1", po_number: "PO-2026-028", vendor: "Premium Steel Corp", date: "2026-02-24", expected_date: "2026-03-10", items_count: 6, total: 28000, status: "sent", jo_reference: "JO-2026-001", jo_stage: "Heat Treatment" },
  { id: "2", po_number: "PO-2026-027", vendor: "Global Stainless Ltd", date: "2026-02-20", expected_date: "2026-03-05", items_count: 10, total: 45000, status: "received", jo_reference: "JO-2026-002", jo_stage: "Grinding" },
  { id: "3", po_number: "PO-2026-026", vendor: "Euro Metals GMBH", date: "2026-02-18", expected_date: "2026-03-15", items_count: 4, total: 12500, status: "sent", jo_reference: "JO-2026-003", jo_stage: "Forging" },
  { id: "4", po_number: "PO-2026-025", vendor: "Precision Parts Ltd", date: "2026-02-15", expected_date: "2026-03-01", items_count: 8, total: 18000, status: "received", jo_reference: "JO-2026-004", jo_stage: "Electroplating" },
  { id: "5", po_number: "PO-2026-024", vendor: "Premium Steel Corp", date: "2026-02-10", expected_date: "2026-02-25", items_count: 3, total: 9500, status: "closed", jo_reference: "JO-2026-005", jo_stage: "Filing" },
  { id: "6", po_number: "PO-2026-023", vendor: "Packaging World", date: "2026-02-08", expected_date: "2026-02-20", items_count: 5, total: 3200, status: "draft" },
];

export default function PurchaseOrdersPage() {
  const [orders] = useState<PurchaseOrder[]>(mockPOs);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  const tabs = [
    { key: "all", label: "All", count: orders.length },
    { key: "draft", label: "Draft", count: orders.filter((o) => o.status === "draft").length },
    { key: "sent", label: "Sent", count: orders.filter((o) => o.status === "sent").length },
    { key: "received", label: "Received", count: orders.filter((o) => o.status === "received").length },
    { key: "closed", label: "Closed", count: orders.filter((o) => o.status === "closed").length },
  ];

  const filtered = orders.filter((o) => {
    const matchesSearch = [o.po_number, o.vendor].some((v) =>
      v.toLowerCase().includes(search.toLowerCase())
    );
    const matchesTab = activeTab === "all" || o.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const columns = [
    {
      key: "po_number",
      label: "PO #",
      render: (item: PurchaseOrder) => (
        <span className="font-medium text-sm" style={{ color: "var(--primary)" }}>{item.po_number}</span>
      ),
    },
    { key: "vendor", label: "Vendor" },
    {
      key: "jo_reference",
      label: "Job Order",
      render: (item: PurchaseOrder) => item.jo_reference ? (
        <div>
          <span className="text-xs font-mono font-semibold" style={{ color: "var(--primary)" }}>{item.jo_reference}</span>
          {item.jo_stage && <span className="text-[10px] ml-1" style={{ color: "var(--muted-foreground)" }}>· {item.jo_stage}</span>}
        </div>
      ) : <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>—</span>,
    },
    {
      key: "date",
      label: "Date",
      render: (item: PurchaseOrder) => (
        <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>{formatDate(item.date)}</span>
      ),
    },
    {
      key: "expected_date",
      label: "Expected",
      render: (item: PurchaseOrder) => (
        <span className="text-sm" style={{ color: "var(--foreground)" }}>{formatDate(item.expected_date)}</span>
      ),
    },
    {
      key: "items_count",
      label: "Items",
      render: (item: PurchaseOrder) => (
        <span className="text-sm" style={{ color: "var(--foreground)" }}>{item.items_count}</span>
      ),
    },
    {
      key: "total",
      label: "Total",
      render: (item: PurchaseOrder) => (
        <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
          {formatCurrency(item.total)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (item: PurchaseOrder) => <StatusBadge status={item.status} />,
    },
    {
      key: "actions",
      label: "",
      render: (item: PurchaseOrder) => (
        <div className="flex items-center gap-1">
          {item.status === "sent" && (
            <button className="p-1.5 rounded-md hover:bg-[var(--secondary)] transition-colors" title="Mark Received">
              <TruckIcon className="w-3.5 h-3.5 text-emerald-500" />
            </button>
          )}
          <button className="p-1.5 rounded-md hover:bg-[var(--secondary)] transition-colors" title="View">
            <Eye className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Purchase Orders"
        description="Manage supplier purchase orders and receiving"
        actions={
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="w-3.5 h-3.5" />
            New Purchase Order
          </Button>
        }
      />

      <div className="flex items-center justify-between gap-4 mb-5">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        <div className="max-w-xs">
          <SearchInput value={search} onChange={setSearch} placeholder="Search POs..." />
        </div>
      </div>

      <DataTable columns={columns} data={filtered} emptyMessage="No purchase orders found" onRowClick={(item) => setSelectedPO(item as PurchaseOrder)} bulkActions />

      <PurchaseOrderDetail order={selectedPO} open={!!selectedPO} onClose={() => setSelectedPO(null)} />

      <Drawer
        open={showDialog}
        onClose={() => setShowDialog(false)}
        title="New Purchase Order"
        width="max-w-2xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button variant="secondary">Save as Draft</Button>
            <Button onClick={() => setShowDialog(false)}>Create & Send</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Input label="PO Number" value="PO-2026-029" readOnly />
            <Input label="Vendor" placeholder="Select vendor..." />
            <Input label="Expected Delivery" type="date" />
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>Line Items</h4>
            <Card className="!p-3">
              <div className="grid grid-cols-12 gap-3 text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--muted-foreground)" }}>
                <span className="col-span-5">Item</span>
                <span className="col-span-2">Qty</span>
                <span className="col-span-2">Unit Cost</span>
                <span className="col-span-2">Total</span>
                <span className="col-span-1"></span>
              </div>
              <div className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-5"><Input placeholder="Item description..." /></div>
                <div className="col-span-2"><Input type="number" placeholder="1" /></div>
                <div className="col-span-2"><Input type="number" placeholder="0.00" /></div>
                <div className="col-span-2 text-sm font-medium" style={{ color: "var(--foreground)" }}>$0.00</div>
                <div className="col-span-1"></div>
              </div>
            </Card>
            <Button variant="ghost" size="sm" className="mt-2">
              <Plus className="w-3.5 h-3.5" />
              Add Item
            </Button>
          </div>
        </div>
      </Drawer>
    </motion.div>
  );
}
