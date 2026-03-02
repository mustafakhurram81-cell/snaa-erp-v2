"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, ImageIcon } from "lucide-react";
import { PageHeader, Button, Drawer, Input, Card, StatusBadge, Tabs } from "@/components/ui/shared";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { PurchaseOrderDetail } from "@/components/details/purchase-order-detail";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { useSupabaseTable } from "@/lib/supabase-hooks";

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
  vendor_name?: string;
  date: string;
  order_date?: string;
  expected_date: string;
  expected_delivery_date?: string;
  items_count: number;
  total: number;
  total_amount?: number;
  status: string;
  jo_reference?: string;
  jo_stage?: string;
  line_items?: LineItem[];
  notes?: string;
}

const mockVendors = ["Premium Steel Corp", "Global Stainless Ltd", "Euro Metals GMBH", "Precision Parts Ltd", "Packaging World"];

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
  {
    accessorKey: "vendor_name",
    header: "Vendor",
    cell: ({ row }) => <span className="text-sm" style={{ color: "var(--foreground)" }}>{row.original.vendor_name || row.original.vendor}</span>,
  },
  {
    accessorKey: "order_date",
    header: "Date",
    cell: ({ row }) => <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>{formatDate(row.original.order_date || row.original.date)}</span>,
  },
  {
    accessorKey: "expected_delivery_date",
    header: "Expected",
    cell: ({ row }) => <span className="text-sm" style={{ color: "var(--foreground)" }}>{formatDate(row.original.expected_delivery_date || row.original.expected_date)}</span>,
  },
  {
    accessorKey: "total_amount",
    header: "Total",
    cell: ({ row }) => <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{formatCurrency(row.original.total_amount || row.original.total || 0)}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
];

export default function PurchaseOrdersPage() {
  const { data: dbOrders, loading, create, update, remove } = useSupabaseTable<PurchaseOrder>("purchase_orders");
  const [activeTab, setActiveTab] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const { toast } = useToast();

  // Map DB fields
  const orders = dbOrders.map(o => ({
    ...o,
    vendor: o.vendor_name || o.vendor || "",
    date: o.order_date || o.date || "",
    expected_date: o.expected_delivery_date || o.expected_date || "",
    total: o.total_amount || o.total || 0,
    items_count: o.items_count || 0,
  }));

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

  const handleCreate = async (asDraft: boolean) => {
    if (!formVendor.trim()) { toast("error", "Please select a vendor"); return; }
    if (formLineItems.some((li) => !li.item.trim())) { toast("error", "Please fill in all line items"); return; }

    const result = await create({
      po_number: getNextPONumber(),
      vendor_name: formVendor,
      order_date: new Date().toISOString().split("T")[0],
      expected_delivery_date: formExpectedDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      total_amount: formTotal,
      status: asDraft ? "draft" : "sent",
      notes: "",
    } as Partial<PurchaseOrder>);

    if (result) {
      setShowDialog(false);
      resetForm();
      toast("success", `Purchase Order ${result.po_number} created`);
    } else {
      toast("error", "Failed to create purchase order");
    }
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

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage="No purchase orders found"
          searchPlaceholder="Search POs..."
          enableSelection
          onRowClick={(item) => setSelectedPO(item)}
        />
      )}

      <PurchaseOrderDetail
        order={selectedPO}
        open={!!selectedPO}
        onClose={() => setSelectedPO(null)}
        onUpdate={async (updated) => { const result = await update(updated.id, updated); if (result) setSelectedPO(result); }}
        onDelete={async (po) => { await remove(po.id); setSelectedPO(null); }}
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
