"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Upload, ArrowRight, Copy, Send, Trash2, ImageIcon } from "lucide-react";
import { PageHeader, Button, Drawer, Input, Card, StatusBadge, Tabs } from "@/components/ui/shared";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { QuotationDetail } from "@/components/details/quotation-detail";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { useSupabaseTable } from "@/lib/supabase-hooks";
import { supabase } from "@/lib/supabase";
import { TableSkeleton } from "@/components/ui/skeleton";
import { CSVImportDialog } from "@/components/shared/csv-import";
import { DeleteConfirmation } from "@/components/shared/delete-confirmation";
import { logActivity } from "@/lib/activity-logger";
import { validateRequired, validateForm, hasErrors } from "@/lib/form-validation";

interface DBCustomer { id: string; name: string; }

// --- Types ---
interface LineItem {
  id: string;
  product: string;
  qty: number;
  unit_price: number;
}

interface Quotation {
  id: string;
  quote_number: string;
  customer: string;
  customer_name?: string;
  date: string;
  valid_until: string;
  items_count: number;
  total: number;
  total_amount?: number;
  status: string;
  line_items?: LineItem[];
  so_number?: string;
  notes?: string;
}

interface DBProduct {
  id: string;
  name: string;
  selling_price: number;
}

// --- DB-based number generation ---
import { getNextQTNumber } from "@/lib/doc-numbers";

// --- Columns ---
const columns: ColumnDef<Quotation, unknown>[] = [
  {
    accessorKey: "quote_number",
    header: "Quote #",
    cell: ({ row }) => (
      <div>
        <span className="font-medium text-sm" style={{ color: "var(--primary)" }}>{row.original.quote_number}</span>
        {row.original.so_number && (
          <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-medium">
            → {row.original.so_number}
          </span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "customer_name",
    header: "Customer",
    cell: ({ row }) => (
      <span className="text-sm" style={{ color: "var(--foreground)" }}>{row.original.customer_name || row.original.customer}</span>
    ),
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>{formatDate(row.original.date)}</span>
    ),
  },
  {
    accessorKey: "total_amount",
    header: "Total",
    cell: ({ row }) => (
      <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
        {formatCurrency(row.original.total_amount || row.original.total || 0)}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
];

// --- Empty line item ---
function emptyLineItem(): LineItem {
  return { id: Date.now().toString() + Math.random(), product: "", qty: 1, unit_price: 0 };
}

// --- Page ---
function QuotationsContent() {
  const { data: dbQuotations, loading, create, update, remove, fetchAll } = useSupabaseTable<Quotation>("quotations");
  const { data: dbProducts } = useSupabaseTable<DBProduct>("products", { orderBy: "name", ascending: true });
  const { data: dbCustomers } = useSupabaseTable<DBCustomer>("customers", { orderBy: "name", ascending: true });
  const [activeTab, setActiveTab] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const { toast } = useToast();
  // Keyboard shortcut: N to create new
  useEffect(() => {
    const handleNew = () => { resetForm(); setShowDialog(true); };
    const handleEsc = () => { setShowDialog(false); };
    window.addEventListener("keyboard-new", handleNew);
    window.addEventListener("keyboard-escape", handleEsc);
    return () => { window.removeEventListener("keyboard-new", handleNew); window.removeEventListener("keyboard-escape", handleEsc); };
  }, []);

  const searchParams = useSearchParams();

  // Map DB fields
  const quotations = dbQuotations.map(q => ({
    ...q,
    customer: q.customer_name || q.customer || "",
    total: q.total_amount || q.total || 0,
    items_count: q.items_count || 0,
  }));

  // Auto-open from ?open= param
  useEffect(() => {
    const openId = searchParams.get("open");
    if (openId) {
      const found = quotations.find((q) => q.quote_number === openId);
      if (found) setSelectedQuotation(found);
    }
  }, [searchParams, quotations]);

  // --- Create form state ---
  const [formCustomer, setFormCustomer] = useState("");
  const [formValidUntil, setFormValidUntil] = useState("");
  const [formLineItems, setFormLineItems] = useState<LineItem[]>([emptyLineItem()]);

  const resetForm = () => {
    setFormCustomer("");
    setFormValidUntil("");
    setFormLineItems([emptyLineItem()]);
  };

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
    setFormLineItems(formLineItems.map((li) => li.id === id ? { ...li, product: productName, unit_price: product?.selling_price || li.unit_price } : li));
  };

  const formTotal = formLineItems.reduce((sum, li) => sum + li.qty * li.unit_price, 0);

  const handleCreate = async (asDraft: boolean) => {
    if (!formCustomer.trim()) { toast("error", "Please enter a customer name"); return; }
    if (formLineItems.some((li) => !li.product.trim())) { toast("error", "Please fill in all line item products"); return; }

    const quoteNumber = await getNextQTNumber();
    const result = await create({
      quote_number: quoteNumber,
      customer_name: formCustomer,
      date: new Date().toISOString().split("T")[0],
      valid_until: formValidUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      total_amount: formTotal,
      status: asDraft ? "draft" : "sent",
      notes: "",
    } as Partial<Quotation>);

    if (result) {
      // Persist line items to quotation_items table
      const items = formLineItems.map(li => ({
        quotation_id: result.id,
        product_name: li.product,
        quantity: li.qty,
        unit_price: li.unit_price,
      }));
      await supabase.from("quotation_items").insert(items);

      setShowDialog(false);
      resetForm();
      toast("success", `Quotation ${result.quote_number} created with ${items.length} item(s)`);
      logActivity({ entityType: "quotation", entityId: result.id, action: "Quotation created", details: `${result.quote_number} — ${formCustomer}` });
    } else {
      toast("error", "Failed to create quotation");
    }
  };

  const handleConvertToSO = async (quotation: Quotation) => {
    const { getNextSONumber } = await import("@/lib/doc-numbers");
    const soNumber = await getNextSONumber();

    // 1. Create the sales order
    const { data: so, error: soErr } = await supabase.from("sales_orders").insert({
      order_number: soNumber,
      customer_name: quotation.customer_name || quotation.customer,
      order_date: new Date().toISOString().split("T")[0],
      expected_delivery_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      total_amount: quotation.total_amount || quotation.total,
      status: "confirmed",
      notes: `Converted from ${quotation.quote_number}`,
    }).select().single();

    if (soErr || !so) {
      toast("error", "Failed to create sales order");
      return;
    }

    // 2. Copy line items from quotation_items to sales_order_items
    const { data: qtItems } = await supabase
      .from("quotation_items")
      .select("*")
      .eq("quotation_id", quotation.id);

    if (qtItems && qtItems.length > 0) {
      const soItems = qtItems.map((item: any) => ({
        sales_order_id: so.id,
        product_name: item.product_name,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }));
      await supabase.from("sales_order_items").insert(soItems);
    }

    // 3. Update quotation status
    await update(quotation.id, { status: "converted", so_number: soNumber } as Partial<Quotation>);
    toast("success", `Sales Order ${soNumber} created from ${quotation.quote_number} with ${qtItems?.length || 0} item(s)`);
    logActivity({ entityType: "quotation", entityId: quotation.id, action: "Converted to SO", details: `${quotation.quote_number} → ${soNumber}` });
  };

  const [pendingDelete, setPendingDelete] = useState<Quotation | null>(null);
  const handleDeleteQuotation = async (quotation: Quotation) => {
    setPendingDelete(quotation);
  };
  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await remove(pendingDelete.id);
    setSelectedQuotation(null);
    setPendingDelete(null);
  };

  const handleUpdateQuotation = async (updated: Quotation) => {
    const result = await update(updated.id, updated);
    if (result) setSelectedQuotation(result);
  };

  const tabs = [
    { key: "all", label: "All", count: quotations.length },
    { key: "draft", label: "Draft", count: quotations.filter((q) => q.status === "draft").length },
    { key: "sent", label: "Sent", count: quotations.filter((q) => q.status === "sent").length },
    { key: "accepted", label: "Accepted", count: quotations.filter((q) => q.status === "accepted").length },
    { key: "rejected", label: "Rejected", count: quotations.filter((q) => q.status === "rejected").length },
  ];

  const filtered = quotations.filter((q) => activeTab === "all" || q.status === activeTab);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Quotations"
        description="Manage price quotations for customers"
        actions={
          <Button onClick={() => { resetForm(); setShowDialog(true); }}>
            <Plus className="w-3.5 h-3.5" />
            New Quotation
          </Button>
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
          emptyMessage="No quotations found"
          searchPlaceholder="Search quotations..."
          onRowClick={(item) => setSelectedQuotation(item)}
        />
      )}

      <QuotationDetail
        quotation={selectedQuotation}
        open={!!selectedQuotation}
        onClose={() => setSelectedQuotation(null)}
        onConvertToSO={handleConvertToSO}
        onDelete={handleDeleteQuotation}
        onUpdate={handleUpdateQuotation}
      />

      {/* --- Create Quotation Drawer --- */}
      <Drawer
        open={showDialog}
        onClose={() => setShowDialog(false)}
        title="New Quotation"
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
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Customer *</label>
              <select
                value={formCustomer}
                onChange={(e) => setFormCustomer(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                style={{ background: "var(--background)", borderColor: "var(--border)", color: formCustomer ? "var(--foreground)" : "var(--muted-foreground)" }}
              >
                <option value="">Select customer...</option>
                {dbCustomers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <Input label="Valid Until" type="date" value={formValidUntil} onChange={(e) => setFormValidUntil(e.target.value)} />
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
                    <select
                      value={li.product}
                      onChange={(e) => handleProductSelect(li.id, e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                      style={{ background: "var(--background)", borderColor: "var(--border)", color: li.product ? "var(--foreground)" : "var(--muted-foreground)" }}
                    >
                      <option value="">Select product...</option>
                      {dbProducts.map((p) => (<option key={p.id} value={p.name}>{p.name} — {formatCurrency(p.selling_price || 0)}</option>))}
                    </select>
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
        tableName="quotations"
        displayName="Quotations"
        requiredFields={["quote_number", "customer_name", "total_amount"]}
        optionalFields={["status", "valid_until", "notes"]}
        onImportComplete={() => fetchAll()}
      />

      <DeleteConfirmation
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title={`Delete ${pendingDelete?.quote_number}?`}
        description="This quotation and all its line items will be permanently deleted. This action cannot be undone."
      />
    </motion.div>
  );
}

export default function QuotationsPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center font-medium" style={{ color: "var(--muted-foreground)" }}>Loading...</div>}>
      <QuotationsContent />
    </React.Suspense>
  );
}
