"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Upload, Trash2, ImageIcon, Download } from "lucide-react";
import { PageHeader, Button, Drawer, Input, Card, Tabs, Select, InlineStatusSelect } from "@/components/ui/shared";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { PurchaseOrderDetail } from "@/components/details/purchase-order-detail";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { useSupabaseTable } from "@/lib/supabase-hooks";
import { supabase } from "@/lib/supabase";
import { exportToCSV } from "@/lib/csv-export";
import { TableSkeleton } from "@/components/ui/skeleton";
import { CSVImportDialog } from "@/components/shared/csv-import";
import { DeleteConfirmation } from "@/components/shared/delete-confirmation";
import { logActivity } from "@/lib/activity-logger";

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

interface DBVendor {
  id: string;
  name: string;
}

// --- DB-based number generation ---
import { getNextPONumber } from "@/lib/doc-numbers";

function emptyLineItem(): LineItem {
  return { id: Date.now().toString() + Math.random(), item: "", qty: 1, unit_cost: 0 };
}



export default function PurchaseOrdersPage() {
  const { data: dbOrders, loading, create, update, remove, fetchAll, lastError } = useSupabaseTable<PurchaseOrder>("purchase_orders");
  const { data: dbVendors } = useSupabaseTable<DBVendor>("vendors", { orderBy: "name", ascending: true });
  const [activeTab, setActiveTab] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const { toast } = useToast();

  const columns = React.useMemo<ColumnDef<PurchaseOrder, unknown>[]>(() => [
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
      cell: ({ row }) => (
        <InlineStatusSelect
          status={row.original.status}
          options={["draft", "sent", "received", "closed", "cancelled"]}
          onChange={async (newStatus) => {
            const result = await update(row.original.id, { status: newStatus } as Partial<PurchaseOrder>);
            if (result) {
              toast("success", "Status updated", `PO ${row.original.po_number} is now ${newStatus}`);
              fetchAll();
            }
          }}
        />
      ),
    },
  ], [update, toast, fetchAll]);

  // Delete confirmation
  const [pendingDelete, setPendingDelete] = useState<PurchaseOrder | null>(null);
  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await remove(pendingDelete.id);
    setSelectedPO(null);
    setPendingDelete(null);
  };



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

  // Keyboard shortcut: N to create new
  useEffect(() => {
    const handleNew = () => { resetForm(); setShowDialog(true); };
    const handleEsc = () => { setShowDialog(false); };
    window.addEventListener("keyboard-new", handleNew);
    window.addEventListener("keyboard-escape", handleEsc);
    return () => { window.removeEventListener("keyboard-new", handleNew); window.removeEventListener("keyboard-escape", handleEsc); };
  }, []);
  const addLineItem = () => setFormLineItems([...formLineItems, emptyLineItem()]);
  const removeLineItem = (id: string) => { if (formLineItems.length <= 1) return; setFormLineItems(formLineItems.filter((li) => li.id !== id)); };
  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setFormLineItems(formLineItems.map((li) => (li.id === id ? { ...li, [field]: value } : li)));
  };

  const formTotal = formLineItems.reduce((sum, li) => sum + li.qty * li.unit_cost, 0);

  const handleCreate = async (asDraft: boolean) => {
    if (!formVendor.trim()) { toast("error", "Please select a vendor"); return; }
    if (formLineItems.some((li) => !li.item.trim())) { toast("error", "Please fill in all line items"); return; }

    const poNumber = await getNextPONumber();
    const result = await create({
      po_number: poNumber,
      vendor_name: formVendor,
      order_date: new Date().toISOString().split("T")[0],
      expected_delivery_date: formExpectedDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      total_amount: formTotal,
      status: asDraft ? "draft" : "sent",
      notes: "",
    } as Partial<PurchaseOrder>);

    if (result) {
      // Persist line items
      const items = formLineItems.map((li, idx) => ({
        purchase_order_id: result.id,
        description: li.item,
        quantity: li.qty,
        unit_price: li.unit_cost,
        line_number: idx + 1,
      }));
      await (supabase as any).from("purchase_order_items").insert(items);

      // Look up vendor_id and link to PO
      const { data: vendorRow } = await supabase.from("vendors").select("id").eq("name", formVendor).maybeSingle();
      if (vendorRow) {
        await supabase.from("purchase_orders").update({ vendor_id: vendorRow.id }).eq("id", result.id);
      }

      setShowDialog(false);
      resetForm();
      toast("success", `Purchase Order ${result.po_number} created`);
      logActivity({ entityType: "purchase_order", entityId: result.id, action: "Purchase Order created", details: `${result.po_number} — ${formVendor}` });
    } else {
      toast("error", lastError.current || "Failed to create purchase order");
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
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setShowImport(true)}>
              <Upload className="w-3.5 h-3.5" />
              Import
            </Button>
            <Button variant="secondary" onClick={() => exportToCSV(orders, "purchase_orders", [
              { key: "po_number" as keyof typeof orders[0], label: "PO #" },
              { key: "vendor" as keyof typeof orders[0], label: "Vendor" },
              { key: "date" as keyof typeof orders[0], label: "Date" },
              { key: "expected_date" as keyof typeof orders[0], label: "Expected" },
              { key: "total" as keyof typeof orders[0], label: "Total" },
              { key: "status" as keyof typeof orders[0], label: "Status" },
            ])}>
              <Download className="w-3.5 h-3.5" /> Export
            </Button>
            <Button onClick={() => { resetForm(); setShowDialog(true); }}>
              <Plus className="w-3.5 h-3.5" />
              New Purchase Order
            </Button>
          </div>
        }
      />

      <div className="mb-5">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {loading ? (
        <TableSkeleton rows={5} columns={5} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage="No purchase orders found"
          searchPlaceholder="Search POs..."
          enableSelection
          enableColumnFilters
          filterableColumns={["status"]}
          onBulkStatusUpdate={async (items, status) => {
            for (const item of items) {
              await supabase.from("purchase_orders").update({ status }).eq("id", (item as any).id);
            }
            toast("success", "Status updated", `${items.length} items set to ${status}`);
            fetchAll();
          }}
          bulkStatusOptions={["draft", "sent", "received", "closed"]}
          onRowClick={(item) => setSelectedPO(item)}
        />
      )}

      <PurchaseOrderDetail
        order={selectedPO}
        open={!!selectedPO}
        onClose={() => setSelectedPO(null)}
        onUpdate={async (updated) => { const result = await update(updated.id, updated); if (result) setSelectedPO(result); }}
        onDelete={async (po) => { setPendingDelete(po); }}
      />

      <Drawer
        open={showDialog}
        onClose={() => { setShowDialog(false); resetForm(); }}
        title="New Purchase Order"
        width="max-w-2xl"
        preventCloseOnBackdrop
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
              <Select
                value={formVendor}
                onChange={(e: any) => setFormVendor(e.target.value)}
                options={[
                  { value: "", label: "Select vendor..." },
                  ...dbVendors.map((v) => ({ value: v.name, label: v.name }))
                ]}
                className="w-full h-9 px-3 rounded-lg border text-sm bg-[var(--background)] border-[var(--border)] text-[var(--foreground)]"
              />
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

      <CSVImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        tableName="purchase_orders"
        displayName="Purchase Orders"
        requiredFields={["po_number", "vendor_name", "total_amount"]}
        optionalFields={["status", "expected_date", "notes"]}
        onImportComplete={() => fetchAll()}
      />

      <DeleteConfirmation
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title={`Delete ${pendingDelete?.po_number}?`}
        description="This will permanently delete this purchase order. This action cannot be undone."
      />
    </motion.div>
  );
}
