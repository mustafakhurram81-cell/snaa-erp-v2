"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Upload, Trash2, ImageIcon, Download } from "lucide-react";
import { PageHeader, Button, Drawer, Input, Card, InlineStatusSelect, Tabs, Select } from "@/components/ui/shared";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { SalesOrderDetail } from "@/components/details/sales-order-detail";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { useSupabaseTable } from "@/lib/supabase-hooks";
import { supabase } from "@/lib/supabase";
import { exportToCSV } from "@/lib/csv-export";
import { logActivity } from "@/lib/activity-logger";
import { TableSkeleton, EmptyState } from "@/components/ui/shared";
import { CSVImportDialog } from "@/components/shared/csv-import";
import { DeleteConfirmation } from "@/components/shared/delete-confirmation";

interface DBCustomer { id: string; name: string; }

// --- Types ---
interface LineItem {
  id: string;
  product: string;
  qty: number;
  unit_price: number;
}

interface SalesOrder {
  id: string;
  order_number: string;
  customer: string;
  customer_name?: string;
  quotation: string;
  date: string;
  order_date?: string;
  delivery_date: string;
  expected_delivery_date?: string;
  items_count: number;
  total: number;
  total_amount?: number;
  status: string;
  line_items?: LineItem[];
  invoice_number?: string;
  notes?: string;
}

interface DBProduct {
  id: string;
  name: string;
  selling_price: number;
}

// --- DB-based number generation ---
import { getNextSONumber } from "@/lib/doc-numbers";

function emptyLineItem(): LineItem {
  return { id: Date.now().toString() + Math.random(), product: "", qty: 1, unit_price: 0 };
}



function SalesOrdersContent() {
  const { data: dbOrders, loading, create, update, remove, fetchAll } = useSupabaseTable<SalesOrder>("sales_orders");
  const { data: dbProducts } = useSupabaseTable<DBProduct>("products", { orderBy: "name", ascending: true });
  const { data: dbCustomers } = useSupabaseTable<DBCustomer>("customers", { orderBy: "name", ascending: true });
  const [activeTab, setActiveTab] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const { toast } = useToast();

  const columns = React.useMemo<ColumnDef<SalesOrder, unknown>[]>(() => [
    {
      accessorKey: "order_number",
      header: "Order #",
      cell: ({ row }) => (
        <div>
          <span className="font-medium text-sm" style={{ color: "var(--primary)" }}>{row.original.order_number}</span>
          {row.original.invoice_number && (
            <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium">
              → {row.original.invoice_number}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "customer_name",
      header: "Customer",
      cell: ({ row }) => <span className="text-sm" style={{ color: "var(--foreground)" }}>{row.original.customer_name || row.original.customer}</span>,
    },
    {
      accessorKey: "order_date",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>{formatDate(row.original.order_date || row.original.date)}</span>
      ),
    },
    {
      accessorKey: "expected_delivery_date",
      header: "Delivery",
      cell: ({ row }) => (
        <span className="text-sm" style={{ color: "var(--foreground)" }}>{formatDate(row.original.expected_delivery_date || row.original.delivery_date)}</span>
      ),
    },
    {
      accessorKey: "total_amount",
      header: "Total",
      cell: ({ row }) => (
        <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{formatCurrency(row.original.total_amount || row.original.total || 0)}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <InlineStatusSelect
          status={row.original.status}
          options={["pending", "in_progress", "shipped", "completed"]}
          onChange={async (newStatus) => {
            const result = await update(row.original.id, { status: newStatus } as Partial<SalesOrder>);
            if (result) {
              toast("success", "Status updated", `Order ${row.original.order_number} is now ${newStatus}`);
              fetchAll();
            }
          }}
        />
      ),
    },
  ], [update, toast, fetchAll]);



  const searchParams = useSearchParams();

  // Map DB fields to display fields
  const orders = dbOrders.map(o => ({
    ...o,
    customer: o.customer_name || o.customer || "",
    date: o.order_date || o.date || "",
    delivery_date: o.expected_delivery_date || o.delivery_date || "",
    total: o.total_amount || o.total || 0,
    items_count: o.items_count || 0,
    quotation: o.quotation || "—",
  }));

  useEffect(() => {
    const openId = searchParams.get("open");
    if (openId) {
      const found = orders.find((o) => o.order_number === openId);
      if (found) {
        queueMicrotask(() => setSelectedOrder(found));
      }
    }
  }, [searchParams, orders]);

  // --- Form state ---
  const [formCustomer, setFormCustomer] = useState("");
  const [formQuotation, setFormQuotation] = useState("");
  const [formDeliveryDate, setFormDeliveryDate] = useState("");
  const [formLineItems, setFormLineItems] = useState<LineItem[]>([emptyLineItem()]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormCustomer("");
    setFormQuotation("");
    setFormDeliveryDate("");
    setFormLineItems([emptyLineItem()]);
    setFormErrors({});
  };

  // Keyboard shortcut: N to create new
  useEffect(() => {
    const handleNew = () => { resetForm(); setShowDialog(true); };
    const handleEsc = () => { setShowDialog(false); };
    window.addEventListener("keyboard-new", handleNew);
    window.addEventListener("keyboard-escape", handleEsc);
    return () => { window.removeEventListener("keyboard-new", handleNew); window.removeEventListener("keyboard-escape", handleEsc); };
  }, []);

  const addLineItem = () => setFormLineItems([...formLineItems, emptyLineItem()]);
  const removeLineItem = (id: string) => {
    if (formLineItems.length <= 1) return;
    setFormLineItems(formLineItems.filter((li) => li.id !== id));
  };
  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setFormLineItems(formLineItems.map((li) => (li.id === id ? { ...li, [field]: value } : li)));
  };
  const handleProductSelect = (id: string, productName: string) => {
    const product = dbProducts.find((p) => p.name === productName);
    setFormLineItems(
      formLineItems.map((li) => (li.id === id ? { ...li, product: productName, unit_price: product?.selling_price || li.unit_price } : li))
    );
  };

  const formTotal = formLineItems.reduce((sum, li) => sum + li.qty * li.unit_price, 0);

  const handleCreate = async () => {
    const errors: Record<string, string> = {};
    if (!formCustomer.trim()) errors.formCustomer = "Please select a customer";

    if (formLineItems.some((li) => !li.product.trim())) {
      toast("error", "Please fill in all line item products");
      return;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast("error", "Please fix the errors in the form");
      return;
    }
    setFormErrors({});

    const orderNumber = await getNextSONumber();
    const result = await create({
      order_number: orderNumber,
      customer_name: formCustomer,
      order_date: new Date().toISOString().split("T")[0],
      expected_delivery_date: formDeliveryDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      total_amount: formTotal,
      status: "confirmed",
      notes: formQuotation ? `Source: ${formQuotation}` : "",
    } as Partial<SalesOrder>);

    if (result) {
      // Persist line items to sales_order_items table
      const items = formLineItems.map(li => ({
        sales_order_id: result.id,
        product_name: li.product,
        quantity: li.qty,
        unit_price: li.unit_price,
      }));
      await supabase.from("sales_order_items").insert(items);

      setShowDialog(false);
      resetForm();
      toast("success", `Sales Order ${result.order_number} created with ${items.length} item(s)`);
      logActivity({ entityType: "sales_order", entityId: result.id, action: "Sales Order created", details: `${result.order_number} — ${formCustomer} ` });
    } else {
      toast("error", "Failed to create sales order");
    }
  };

  // --- Create Invoice from SO ---
  const handleCreateInvoice = async (order: SalesOrder) => {
    // Generate next invoice number from DB
    const { data: lastInv } = await supabase.from("invoices").select("invoice_number").order("created_at", { ascending: false }).limit(1);
    let invNum = 1;
    if (lastInv && lastInv.length > 0) { const m = lastInv[0].invoice_number.match(/(\d+)$/); if (m) invNum = parseInt(m[1]) + 1; }
    const invNumber = `INV - 2026 - ${String(invNum).padStart(3, "0")} `;

    // 1. Create invoice record (link customer_id if available)
    const { data: inv, error: invErr } = await supabase.from("invoices").insert({
      invoice_number: invNumber,
      customer_id: (order as any).customer_id || null,
      customer_name: (order as any).customer_name || order.customer,
      issue_date: new Date().toISOString().split("T")[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      total_amount: (order as any).total_amount || order.total,
      status: "draft",
      notes: `From ${order.order_number} `,
    }).select().single();

    if (invErr || !inv) {
      toast("error", "Failed to create invoice");
      return;
    }

    // 2. Copy line items from sales_order_items → invoice_items
    const { data: soItems } = await supabase
      .from("sales_order_items")
      .select("*")
      .eq("sales_order_id", order.id);

    if (soItems && soItems.length > 0) {
      const invoiceItems = soItems.map((item: any) => ({
        invoice_id: inv.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }));
      await supabase.from("invoice_items").insert(invoiceItems);
    }

    // 3. Update SO with invoice reference
    await update(order.id, { invoice_number: invNumber } as Partial<SalesOrder>);
    toast("success", `Invoice ${invNumber} created from ${order.order_number} with ${soItems?.length || 0} item(s)`);
    logActivity({ entityType: "sales_order", entityId: order.id, action: "Invoice created from SO", details: `${invNumber} from ${order.order_number} ` });
    logActivity({ entityType: "invoice", entityId: inv.id, action: "Invoice created", details: `${invNumber} — ${order.customer} ` });
  };

  // --- Create Job Orders from SO ---
  const handleCreateJobOrders = async (order: SalesOrder) => {
    // Fetch line items for this SO
    const { data: soItems } = await supabase.from("sales_order_items").select("*").eq("sales_order_id", order.id);
    const items = soItems && soItems.length > 0 ? soItems : [{ product_name: order.customer_name || "Production Item", quantity: 1 }];

    let created = 0;
    for (const item of items) {
      // Generate next JO number
      const { data: lastJO } = await supabase.from("production_orders").select("job_number").order("created_at", { ascending: false }).limit(1);
      let joNum = 1;
      if (lastJO && lastJO.length > 0) { const m = lastJO[0].job_number.match(/(\d+)$/); if (m) joNum = parseInt(m[1]) + 1; }
      const joNumber = `JO - 2026 - ${String(joNum).padStart(3, "0")} `;

      const { data: joData, error: joErr } = await supabase.from("production_orders").insert({
        job_number: joNumber,
        product_name: (item as any).product_name || "Item",
        quantity: (item as any).quantity || 1,
        start_date: new Date().toISOString().split("T")[0],
        status: "Planned",
        priority: "Medium",
        sales_order_id: order.id,
      }).select().single();

      if (!joErr && joData) {
        // Insert 10 default manufacturing stages
        const stages = Array.from({ length: 10 }, (_, i) => ({
          production_order_id: joData.id,
          stage_number: i + 1,
          stage_name: ["Die Making", "Forging", "Grinding", "Filing", "Heat Treatment", "Electroplating", "Assembly", "Quality Control", "Finishing", "Packaging"][i],
          status: "Pending",
          execution_type: "In-House",
        }));
        await supabase.from("production_stages").insert(stages);
        created++;
      }
    }

    // Update SO status
    await update(order.id, { status: "in_progress" } as Partial<SalesOrder>);
    toast("success", `${created} Job Order(s) created from ${order.order_number} `);
    logActivity({ entityType: "sales_order", entityId: order.id, action: "Job Orders created", details: `${created} JOs from ${order.order_number} ` });
  };

  // --- Delete SO ---
  const [pendingDelete, setPendingDelete] = useState<SalesOrder | null>(null);
  const handleDeleteOrder = async (order: SalesOrder) => {
    setPendingDelete(order);
  };
  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await remove(pendingDelete.id);
    setSelectedOrder(null);
    setPendingDelete(null);
  };

  const tabs = [
    { key: "all", label: "All", count: orders.length },
    { key: "confirmed", label: "Confirmed", count: orders.filter((o) => o.status === "confirmed").length },
    { key: "in_progress", label: "In Progress", count: orders.filter((o) => o.status === "in_progress").length },
    { key: "shipped", label: "Shipped", count: orders.filter((o) => o.status === "shipped").length },
    { key: "delivered", label: "Delivered", count: orders.filter((o) => o.status === "delivered").length },
  ];

  const filtered = orders.filter((o) => activeTab === "all" || o.status === activeTab);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Sales Orders"
        description="Track and manage customer orders"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setShowImport(true)}>
              <Upload className="w-3.5 h-3.5" />
              Import
            </Button>
            <Button variant="secondary" onClick={() => exportToCSV(orders, "sales_orders", [
              { key: "order_number" as keyof typeof orders[0], label: "Order #" },
              { key: "customer" as keyof typeof orders[0], label: "Customer" },
              { key: "date" as keyof typeof orders[0], label: "Date" },
              { key: "delivery_date" as keyof typeof orders[0], label: "Delivery" },
              { key: "total" as keyof typeof orders[0], label: "Total" },
              { key: "status" as keyof typeof orders[0], label: "Status" },
            ])}>
              <Download className="w-3.5 h-3.5" /> Export
            </Button>
            <Button onClick={() => { resetForm(); setShowDialog(true); }}>
              <Plus className="w-3.5 h-3.5" />
              New Sales Order
            </Button>
          </div>
        }
      />

      <div className="mb-5">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {loading ? (
        <TableSkeleton rows={8} columns={6} />
      ) : filtered.length === 0 ? (
        <div className="py-8">
          <EmptyState
            icon={<ImageIcon className="w-8 h-8" />}
            title="No Sales Orders Found"
            description="You haven't created any sales orders yet."
            action={
              <Button onClick={() => { resetForm(); setShowDialog(true); }}>
                <Plus className="w-4 h-4" /> Create First Sales Order
              </Button>
            }
          />
        </div>
      ) : (
        <DataTable
          tableId="sales_orders"
          columns={columns}
          data={filtered}
          emptyMessage="No sales orders found"
          searchPlaceholder="Search sales orders..."
          enableSelection
          enableColumnFilters
          filterableColumns={["status"]}
          onBulkStatusUpdate={async (items, status) => {
            for (const item of items) {
              await supabase.from("sales_orders").update({ status }).eq("id", (item as any).id);
            }
            toast("success", "Status updated", `${items.length} items set to ${status} `);
            fetchAll();
          }}
          bulkStatusOptions={["pending", "in_progress", "shipped", "completed"]}
          onRowClick={(item) => setSelectedOrder(item)}
        />
      )}

      <SalesOrderDetail
        order={selectedOrder}
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onCreateInvoice={handleCreateInvoice}
        onCreateJobOrders={handleCreateJobOrders}
        onDelete={handleDeleteOrder}
        onUpdate={async (updated) => { const result = await update(updated.id, updated); if (result) setSelectedOrder(result); }}
      />

      <Drawer
        open={showDialog}
        onClose={() => setShowDialog(false)}
        title="New Sales Order"
        width="max-w-2xl"
        preventCloseOnBackdrop
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create Order</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Customer *</label>
              <Select
                error={formErrors.formCustomer}
                value={formCustomer}
                onChange={(e: any) => { setFormCustomer(e.target.value); if (formErrors.formCustomer) setFormErrors({ ...formErrors, formCustomer: "" }); }}
                options={[
                  { value: "", label: "Select customer..." },
                  ...dbCustomers.map(c => ({ value: c.name, label: c.name }))
                ]}
                className="w-full h-9 px-3 rounded-lg border text-sm bg-[var(--background)] border-[var(--border)] text-[var(--foreground)]"
              />
            </div>
            <Input label="Source Quotation" placeholder="QT-2026-XXX" value={formQuotation} onChange={(e) => setFormQuotation(e.target.value)} />
            <Input label="Delivery Date" type="date" value={formDeliveryDate} onChange={(e) => setFormDeliveryDate(e.target.value)} />
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
                <span className="col-span-4">Product</span>
                <span className="col-span-2">Qty</span>
                <span className="col-span-2">Unit Price</span>
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
                    <Select
                      value={li.product}
                      onChange={(e: any) => handleProductSelect(li.id, e.target.value)}
                      options={[
                        { value: "", label: "Select product..." },
                        ...dbProducts.map((p) => ({ value: p.name, label: `${p.name} — ${formatCurrency(p.selling_price || 0)}` }))
                      ]}
                      className="w-full h-9 px-3 rounded-lg border text-sm bg-[var(--background)] border-[var(--border)] text-[var(--foreground)]"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" placeholder="1" value={String(li.qty)} onChange={(e) => updateLineItem(li.id, "qty", Math.max(1, parseInt(e.target.value) || 1))} />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" placeholder="0.00" value={String(li.unit_price)} onChange={(e) => updateLineItem(li.id, "unit_price", parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{formatCurrency(li.qty * li.unit_price)}</span>
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
        tableName="sales_orders"
        displayName="Sales Orders"
        requiredFields={["order_number", "customer_name", "total_amount"]}
        optionalFields={["status", "delivery_date", "notes"]}
        onImportComplete={() => fetchAll()}
      />

      <DeleteConfirmation
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title={`Delete ${pendingDelete?.order_number}?`}
        description="This sales order and all its line items will be permanently deleted. This action cannot be undone."
      />
    </motion.div>
  );
}

export default function SalesOrdersPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center font-medium" style={{ color: "var(--muted-foreground)" }}>Loading...</div>}>
      <SalesOrdersContent />
    </React.Suspense>
  );
}
