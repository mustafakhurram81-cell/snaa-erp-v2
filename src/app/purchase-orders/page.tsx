"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Eye, Truck as TruckIcon, Trash2, ImageIcon } from "lucide-react";
import { PageHeader, Button, Drawer, Input, Card, StatusBadge, Tabs } from "@/components/ui/shared";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { PurchaseOrderDetail } from "@/components/details/purchase-order-detail";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

interface LineItem {
  id: string;
  item: string;
  qty: number;
  unit_cost: number;
}

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
  line_items?: LineItem[];
}

const mockVendors = ["Premium Steel Corp", "Global Stainless Ltd", "Euro Metals GMBH", "Precision Parts Ltd", "Packaging World"];

const initialPOs: PurchaseOrder[] = [
  { id: "1", po_number: "PO-2026-028", vendor: "Premium Steel Corp", date: "2026-02-24", expected_date: "2026-03-10", items_count: 6, total: 28000, status: "sent", jo_reference: "JO-2026-001", jo_stage: "Heat Treatment" },
  { id: "2", po_number: "PO-2026-027", vendor: "Global Stainless Ltd", date: "2026-02-20", expected_date: "2026-03-05", items_count: 10, total: 45000, status: "received", jo_reference: "JO-2026-002", jo_stage: "Grinding" },
  { id: "3", po_number: "PO-2026-026", vendor: "Euro Metals GMBH", date: "2026-02-18", expected_date: "2026-03-15", items_count: 4, total: 12500, status: "sent", jo_reference: "JO-2026-003", jo_stage: "Forging" },
  { id: "4", po_number: "PO-2026-025", vendor: "Precision Parts Ltd", date: "2026-02-15", expected_date: "2026-03-01", items_count: 8, total: 18000, status: "received", jo_reference: "JO-2026-004", jo_stage: "Electroplating" },
  { id: "5", po_number: "PO-2026-024", vendor: "Premium Steel Corp", date: "2026-02-10", expected_date: "2026-02-25", items_count: 3, total: 9500, status: "closed", jo_reference: "JO-2026-005", jo_stage: "Filing" },
  { id: "6", po_number: "PO-2026-023", vendor: "Packaging World", date: "2026-02-08", expected_date: "2026-02-20", items_count: 5, total: 3200, status: "draft" },
];

let nextPONumber = 29;
function getNextPONumber() {
  return `PO-2026-${String(nextPONumber++).padStart(3, "0")}`;
}

function emptyLineItem(): LineItem {
  return { id: Date.now().toString() + Math.random(), item: "", qty: 1, unit_cost: 0 };
}

const columns: ColumnDef<PurchaseOrder, unknown>[] = [
  {
    accessorKey: "po_number",
    header: "PO #",
    cell: ({ row }) => <span className="font-medium text-sm" style={{ color: "var(--primary)" }}>{row.original.po_number}</span>,
  },
  { accessorKey: "vendor", header: "Vendor" },
  {
    accessorKey: "jo_reference",
    header: "Job Order",
    cell: ({ row }) => row.original.jo_reference ? (
      <div>
        <span className="text-xs font-mono font-semibold" style={{ color: "var(--primary)" }}>{row.original.jo_reference}</span>
        {row.original.jo_stage && <span className="text-[10px] ml-1" style={{ color: "var(--muted-foreground)" }}>· {row.original.jo_stage}</span>}
      </div>
    ) : <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>—</span>,
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>{formatDate(row.original.date)}</span>,
  },
  {
    accessorKey: "expected_date",
    header: "Expected",
    cell: ({ row }) => <span className="text-sm" style={{ color: "var(--foreground)" }}>{formatDate(row.original.expected_date)}</span>,
  },
  {
    accessorKey: "items_count",
    header: "Items",
    cell: ({ row }) => <span className="text-sm" style={{ color: "var(--foreground)" }}>{row.original.items_count}</span>,
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{formatCurrency(row.original.total)}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
];

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>(initialPOs);
  const [activeTab, setActiveTab] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const { toast } = useToast();

  // Form state
  const [formVendor, setFormVendor] = useState("");
  const [formExpectedDate, setFormExpectedDate] = useState("");
  const [formLineItems, setFormLineItems] = useState<LineItem[]>([emptyLineItem()]);

  const resetForm = () => { setFormVendor(""); setFormExpectedDate(""); setFormLineItems([emptyLineItem()]); };
  const addLineItem = () => setFormLineItems([...formLineItems, emptyLineItem()]);
  const removeLineItem = (id: string) => { if (formLineItems.length <= 1) return; setFormLineItems(formLineItems.filter((li) => li.id !== id)); };
  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setFormLineItems(formLineItems.map((li) => (li.id === id ? { ...li, [field]: value } : li)));
  };

  const formTotal = formLineItems.reduce((sum, li) => sum + li.qty * li.unit_cost, 0);

  const handleCreate = (asDraft: boolean) => {
    if (!formVendor.trim()) { toast("error", "Please select a vendor"); return; }
    if (formLineItems.some((li) => !li.item.trim())) { toast("error", "Please fill in all line items"); return; }

    const newPO: PurchaseOrder = {
      id: Date.now().toString(),
      po_number: getNextPONumber(),
      vendor: formVendor,
      date: new Date().toISOString().split("T")[0],
      expected_date: formExpectedDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      items_count: formLineItems.length,
      total: formTotal,
      status: asDraft ? "draft" : "sent",
      line_items: [...formLineItems],
    };

    setOrders([newPO, ...orders]);
    setShowDialog(false);
    resetForm();
    toast("success", `Purchase Order ${newPO.po_number} created`);
  };

  const tabs = [
    { key: "all", label: "All", count: orders.length },
    { key: "draft", label: "Draft", count: orders.filter((o) => o.status === "draft").length },
    { key: "sent", label: "Sent", count: orders.filter((o) => o.status === "sent").length },
    { key: "received", label: "Received", count: orders.filter((o) => o.status === "received").length },
    { key: "closed", label: "Closed", count: orders.filter((o) => o.status === "closed").length },
  ];

  const filtered = orders.filter((o) => activeTab === "all" || o.status === activeTab);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Purchase Orders"
        description="Manage supplier purchase orders and receiving"
        actions={
          <Button onClick={() => { resetForm(); setShowDialog(true); }}>
            <Plus className="w-3.5 h-3.5" />
            New Purchase Order
          </Button>
        }
      />

      <div className="mb-5">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        emptyMessage="No purchase orders found"
        searchPlaceholder="Search POs..."
        enableSelection
        onRowClick={(item) => setSelectedPO(item)}
      />

      <PurchaseOrderDetail
        order={selectedPO}
        open={!!selectedPO}
        onClose={() => setSelectedPO(null)}
        onUpdate={(updated) => { setOrders(orders.map((p) => p.id === updated.id ? updated : p)); setSelectedPO(updated); }}
        onDelete={(po) => { setOrders(orders.filter((p) => p.id !== po.id)); setSelectedPO(null); }}
      />

      <Drawer
        open={showDialog}
        onClose={() => setShowDialog(false)}
        title="New Purchase Order"
        width="max-w-2xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button variant="secondary" onClick={() => handleCreate(true)}>Save as Draft</Button>
            <Button onClick={() => handleCreate(false)}>Create & Send</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Vendor</label>
              <select
                value={formVendor}
                onChange={(e) => setFormVendor(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                style={{ background: "var(--background)", borderColor: "var(--border)", color: formVendor ? "var(--foreground)" : "var(--muted-foreground)" }}
              >
                <option value="">Select vendor...</option>
                {mockVendors.map((v) => (<option key={v} value={v}>{v}</option>))}
              </select>
            </div>
            <Input label="Expected Delivery" type="date" value={formExpectedDate} onChange={(e) => setFormExpectedDate(e.target.value)} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Line Items</h4>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--secondary)", color: "var(--primary)" }}>
                {formLineItems.length} item{formLineItems.length !== 1 ? "s" : ""}
              </span>
            </div>
            <Card className="!p-3 space-y-2">
              <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                <span className="col-span-1"></span>
                <span className="col-span-4">Item</span>
                <span className="col-span-2">Qty</span>
                <span className="col-span-2">Unit Cost</span>
                <span className="col-span-2">Total</span>
                <span className="col-span-1"></span>
              </div>
              {formLineItems.map((li) => (
                <div key={li.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-1">
                    <div className="group relative">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center cursor-pointer border border-transparent hover:border-blue-300 transition-colors">
                        <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />
                      </div>
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50">
                        <div className="w-32 h-32 rounded-xl bg-zinc-100 dark:bg-zinc-800 border shadow-lg flex flex-col items-center justify-center gap-1" style={{ borderColor: "var(--border)" }}>
                          <ImageIcon className="w-8 h-8 text-zinc-300" />
                          <span className="text-[9px] text-zinc-400">No image yet</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-4">
                    <Input placeholder="Item description..." value={li.item} onChange={(e) => updateLineItem(li.id, "item", e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" placeholder="1" value={String(li.qty)} onChange={(e) => updateLineItem(li.id, "qty", Math.max(1, parseInt(e.target.value) || 1))} />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" placeholder="0.00" value={String(li.unit_cost)} onChange={(e) => updateLineItem(li.id, "unit_cost", parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{formatCurrency(li.qty * li.unit_cost)}</span>
                  </div>
                  <div className="col-span-1">
                    <button onClick={() => removeLineItem(li.id)} disabled={formLineItems.length <= 1} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30 transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </Card>
            <Button variant="ghost" size="sm" className="mt-2" onClick={addLineItem}>
              <Plus className="w-3.5 h-3.5" />
              Add Item
            </Button>
          </div>

          <div className="flex justify-end pt-3 border-t" style={{ borderColor: "var(--border)" }}>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider font-medium" style={{ color: "var(--muted-foreground)" }}>Total</p>
              <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{formatCurrency(formTotal)}</p>
            </div>
          </div>
        </div>
      </Drawer>
    </motion.div>
  );
}
