"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Upload, DollarSign, Clock, AlertTriangle, Check, Trash2, ImageIcon, Download, CreditCard } from "lucide-react";
import { PageHeader, Button, Drawer, Input, Card, StatusBadge, Tabs, StatCard, Select, InlineStatusSelect } from "@/components/ui/shared";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { InvoiceDetail } from "@/components/details/invoice-detail";
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

interface Invoice {
  id: string;
  invoice_number: string;
  customer: string;
  customer_name?: string;
  sales_order: string;
  date: string;
  invoice_date?: string;
  due_date: string;
  total: number;
  total_amount?: number;
  paid: number;
  amount_paid?: number;
  status: string;
  line_items?: LineItem[];
  notes?: string;
}

interface DBProduct {
  id: string;
  name: string;
  selling_price: number;
}

// --- DB-based number generation ---
import { getNextINVNumber } from "@/lib/doc-numbers";

function emptyLineItem(): LineItem {
  return { id: Date.now().toString() + Math.random(), product: "", qty: 1, unit_price: 0 };
}



function InvoicesContent() {
  const { data: dbInvoices, loading, create, update, remove, fetchAll } = useSupabaseTable<Invoice>("invoices");
  const { data: dbProducts } = useSupabaseTable<DBProduct>("products", { orderBy: "name", ascending: true });
  const { data: dbCustomers } = useSupabaseTable<DBCustomer>("customers", { orderBy: "name", ascending: true });
  const [activeTab, setActiveTab] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { toast } = useToast();

  const columns = React.useMemo<ColumnDef<Invoice, unknown>[]>(() => [
    {
      accessorKey: "invoice_number",
      header: "Invoice #",
      cell: ({ row }) => <span className="font-medium text-sm" style={{ color: "var(--primary)" }}>{row.original.invoice_number}</span>,
    },
    {
      accessorKey: "customer_name",
      header: "Customer",
      cell: ({ row }) => <span className="text-sm" style={{ color: "var(--foreground)" }}>{row.original.customer_name || row.original.customer}</span>,
    },
    {
      accessorKey: "invoice_date",
      header: "Date",
      cell: ({ row }) => <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>{formatDate(row.original.invoice_date || row.original.date)}</span>,
    },
    {
      accessorKey: "due_date",
      header: "Due Date",
      cell: ({ row }) => <span className="text-sm" style={{ color: "var(--foreground)" }}>{formatDate(row.original.due_date)}</span>,
    },
    {
      accessorKey: "total_amount",
      header: "Total",
      cell: ({ row }) => <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{formatCurrency(row.original.total_amount || row.original.total || 0)}</span>,
    },
    {
      accessorKey: "amount_paid",
      header: "Paid",
      cell: ({ row }) => <span className="text-sm text-emerald-600 font-medium">{formatCurrency(row.original.amount_paid || row.original.paid || 0)}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <InlineStatusSelect
          status={row.original.status}
          options={["draft", "pending", "partial", "paid", "overdue", "cancelled"]}
          onChange={async (newStatus) => {
            const result = await update(row.original.id, { status: newStatus } as Partial<Invoice>);
            if (result) {
              toast("success", "Status updated", `Invoice ${row.original.invoice_number} is now ${newStatus}`);
              fetchAll();
            }
          }}
        />
      ),
    },
  ], [update, toast, fetchAll]);


  const [pendingDelete, setPendingDelete] = useState<Invoice | null>(null);
  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await remove(pendingDelete.id);
    setSelectedInvoice(null);
    setPendingDelete(null);
  };

  // Payment recording
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const handleRecordPayment = async () => {
    if (!paymentInvoice) return;
    const amount = parseFloat(paymentAmount);
    const errors: Record<string, string> = {};
    if (!amount || amount <= 0) errors.paymentAmount = "Enter a valid payment amount";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast("error", "Please fix errors in the form");
      return;
    }
    setFormErrors({});

    const prevPaid = paymentInvoice.amount_paid || paymentInvoice.paid || 0;
    const totalAmt = paymentInvoice.total_amount || paymentInvoice.total || 0;
    const newPaid = Math.min(prevPaid + amount, totalAmt);
    const newStatus = newPaid >= totalAmt ? "paid" : "partial";
    const { error } = await supabase.from("invoices").update({ amount_paid: newPaid, status: newStatus }).eq("id", paymentInvoice.id);
    if (error) { toast("error", "Failed to record payment"); return; }
    toast("success", "Payment recorded", `${formatCurrency(amount)} applied to ${paymentInvoice.invoice_number}`);
    logActivity({ entityType: "invoice", entityId: paymentInvoice.id, action: "Payment recorded", details: `${formatCurrency(amount)} — ${paymentInvoice.invoice_number}` });
    setPaymentInvoice(null);
    setPaymentAmount("");
    fetchAll();
  };

  const searchParams = useSearchParams();

  // Map DB fields
  const invoices = dbInvoices.map(i => ({
    ...i,
    customer: i.customer_name || i.customer || "",
    date: i.invoice_date || i.date || "",
    total: i.total_amount || i.total || 0,
    paid: i.amount_paid || i.paid || 0,
    sales_order: i.sales_order || "—",
  }));

  // Auto-detect overdue invoices
  useEffect(() => {
    if (!invoices.length) return;
    const today = new Date().toISOString().split("T")[0];
    const overdueInvoices = invoices.filter(
      i => i.due_date && i.due_date < today && (i.status === "pending" || i.status === "partial")
    );
    if (overdueInvoices.length > 0) {
      overdueInvoices.forEach(async (inv) => {
        await supabase.from("invoices").update({ status: "overdue" }).eq("id", inv.id);
      });
      // Only refetch if we actually flagged some as overdue
      if (overdueInvoices.length > 0) {
        const timer = setTimeout(() => fetchAll(), 500);
        return () => clearTimeout(timer);
      }
    }
  }, [dbInvoices.length]); // Only re-run when invoice count changes

  useEffect(() => {
    const openId = searchParams.get("open");
    if (openId) {
      const found = invoices.find((i) => i.invoice_number === openId);
      if (found) {
        // Defer setState to avoid synchronous setState-in-effect
        queueMicrotask(() => setSelectedInvoice(found));
      }
    }
  }, [searchParams, invoices]);

  // Form state
  const [formCustomer, setFormCustomer] = useState("");
  const [formSO, setFormSO] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formLineItems, setFormLineItems] = useState<LineItem[]>([emptyLineItem()]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const resetForm = () => { setFormCustomer(""); setFormSO(""); setFormDueDate(""); setFormLineItems([emptyLineItem()]); setFormErrors({}); };

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
  const handleProductSelect = (id: string, productName: string) => {
    const product = dbProducts.find((p) => p.name === productName);
    setFormLineItems(formLineItems.map((li) => (li.id === id ? { ...li, product: productName, unit_price: product?.selling_price || li.unit_price } : li)));
  };

  const formTotal = formLineItems.reduce((sum, li) => sum + li.qty * li.unit_price, 0);

  const handleCreate = async (asDraft: boolean) => {
    const errors: Record<string, string> = {};
    if (!formCustomer.trim()) errors.formCustomer = "Please select a customer";
    if (!formDueDate.trim()) errors.formDueDate = "Due date is required";

    // Check line items
    if (formLineItems.some((li) => !li.product.trim())) {
      errors.line_items = "Please fill in all line item products";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast("error", "Please fix the errors in the form");
      return;
    }
    setFormErrors({});

    const invNumber = await getNextINVNumber();
    const result = await create({
      invoice_number: invNumber,
      customer_name: formCustomer,
      invoice_date: new Date().toISOString().split("T")[0],
      due_date: formDueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      total_amount: formTotal,
      amount_paid: 0,
      status: asDraft ? "draft" : "pending",
      notes: formSO ? `Source SO: ${formSO}` : "",
    } as Partial<Invoice>);

    if (result) {
      // Persist line items to invoice_items table
      const items = formLineItems.map(li => ({
        invoice_id: result.id,
        product_name: li.product,
        quantity: li.qty,
        unit_price: li.unit_price,
        total: li.qty * li.unit_price,
      }));
      await supabase.from("invoice_items").insert(items);

      setShowDialog(false);
      resetForm();
      toast("success", `Invoice ${result.invoice_number} created with ${items.length} item(s)`);
      logActivity({ entityType: "invoice", entityId: result.id, action: "Invoice created", details: `${result.invoice_number} — ${formCustomer}` });
    } else {
      toast("error", "Failed to create invoice");
    }
  };

  const totalAmount = invoices.reduce((s, i) => s + i.total, 0);
  const totalPaid = invoices.reduce((s, i) => s + i.paid, 0);
  const totalOverdue = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + (i.total - i.paid), 0);

  const tabs = [
    { key: "all", label: "All", count: invoices.length },
    { key: "draft", label: "Draft", count: invoices.filter((i) => i.status === "draft").length },
    { key: "pending", label: "Pending", count: invoices.filter((i) => i.status === "pending").length },
    { key: "paid", label: "Paid", count: invoices.filter((i) => i.status === "paid").length },
    { key: "overdue", label: "Overdue", count: invoices.filter((i) => i.status === "overdue").length },
  ];

  const filtered = invoices.filter((i) => activeTab === "all" || i.status === activeTab);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Invoices"
        description="Manage billing and track payments"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setShowImport(true)}>
              <Upload className="w-3.5 h-3.5" />
              Import
            </Button>
            <Button variant="secondary" onClick={() => exportToCSV(invoices, "invoices", [
              { key: "invoice_number" as keyof typeof invoices[0], label: "Invoice #" },
              { key: "customer" as keyof typeof invoices[0], label: "Customer" },
              { key: "date" as keyof typeof invoices[0], label: "Date" },
              { key: "due_date" as keyof typeof invoices[0], label: "Due Date" },
              { key: "total" as keyof typeof invoices[0], label: "Total" },
              { key: "paid" as keyof typeof invoices[0], label: "Paid" },
              { key: "status" as keyof typeof invoices[0], label: "Status" },
            ])}>
              <Download className="w-3.5 h-3.5" /> Export
            </Button>
            <Button onClick={() => { resetForm(); setShowDialog(true); }}>
              <Plus className="w-3.5 h-3.5" />
              New Invoice
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard title="Total Invoiced" value={formatCurrency(totalAmount)} icon={<DollarSign className="w-5 h-5" style={{ color: "var(--muted-foreground)" }} />} />
        <StatCard title="Total Received" value={formatCurrency(totalPaid)} changeType="positive" icon={<Check className="w-5 h-5" style={{ color: "var(--muted-foreground)" }} />} />
        <StatCard title="Outstanding" value={formatCurrency(totalAmount - totalPaid)} icon={<Clock className="w-5 h-5" style={{ color: "var(--muted-foreground)" }} />} />
        <StatCard title="Overdue" value={formatCurrency(totalOverdue)} changeType="negative" icon={<AlertTriangle className="w-5 h-5" style={{ color: "var(--muted-foreground)" }} />} />
      </div>

      <div className="mb-5">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {loading ? (
        <TableSkeleton rows={8} columns={7} />
      ) : filtered.length === 0 ? (
        <div className="py-8">
          <EmptyState
            icon={<DollarSign className="w-8 h-8" />}
            title="No Invoices Found"
            description="You haven't created any invoices yet."
            action={
              <Button onClick={() => { resetForm(); setShowDialog(true); }}>
                <Plus className="w-4 h-4" /> Create First Invoice
              </Button>
            }
          />
        </div>
      ) : (
        <DataTable
          tableId="invoices"
          columns={columns}
          data={filtered}
          emptyMessage="No invoices found"
          searchPlaceholder="Search invoices..."
          enableSelection
          enableColumnFilters
          filterableColumns={["status"]}
          onBulkStatusUpdate={async (items, status) => {
            for (const item of items) {
              await supabase.from("invoices").update({ status }).eq("id", (item as any).id);
            }
            toast("success", "Status updated", `${items.length} items set to ${status}`);
            fetchAll();
          }}
          bulkStatusOptions={["draft", "pending", "paid", "overdue"]}
          onRowClick={(item) => setSelectedInvoice(item)}
        />
      )}

      <InvoiceDetail
        invoice={selectedInvoice}
        open={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onUpdate={async (updated) => { const result = await update(updated.id, updated); if (result) setSelectedInvoice(result); }}
        onDelete={async (inv) => { setPendingDelete(inv); }}
      />

      <Drawer
        open={showDialog}
        onClose={() => setShowDialog(false)}
        title="New Invoice"
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
          <div className="grid grid-cols-3 gap-4">
            <div>
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
            </div>
            <Input label="Sales Order" placeholder="SO-2026-XXX" value={formSO} onChange={(e) => setFormSO(e.target.value)} />
            <div>
              <Input label="Due Date *" type="date" error={formErrors.formDueDate} value={formDueDate} onChange={(e) => { setFormDueDate(e.target.value); if (formErrors.formDueDate) setFormErrors({ ...formErrors, formDueDate: "" }); }} />
            </div>
          </div>
          {formErrors.line_items && <p className="text-xs text-red-500">{formErrors.line_items}</p>}

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
                <span className="col-span-2">Unit Price</span>
                <span className="col-span-2">Amount</span>
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
        tableName="invoices"
        displayName="Invoices"
        requiredFields={["invoice_number", "customer_name", "total_amount"]}
        optionalFields={["status", "invoice_date", "due_date", "amount_paid", "notes"]}
        onImportComplete={() => fetchAll()}
      />

      <DeleteConfirmation
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title={`Delete ${pendingDelete?.invoice_number}?`}
        description="This invoice and all its line items will be permanently deleted. This action cannot be undone."
      />

      {/* Record Payment Drawer */}
      <Drawer
        open={!!paymentInvoice}
        onClose={() => setPaymentInvoice(null)}
        title="Record Payment"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setPaymentInvoice(null)}>Cancel</Button>
            <Button onClick={handleRecordPayment}>
              <CreditCard className="w-3.5 h-3.5" /> Record Payment
            </Button>
          </div>
        }
      >
        {paymentInvoice && (
          <div className="space-y-4">
            <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--secondary)" }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{paymentInvoice.invoice_number}</span>
                <StatusBadge status={paymentInvoice.status} />
              </div>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{paymentInvoice.customer_name || paymentInvoice.customer}</p>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase" style={{ color: "var(--muted-foreground)" }}>Total</p>
                  <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{formatCurrency(paymentInvoice.total_amount || paymentInvoice.total || 0)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase" style={{ color: "var(--muted-foreground)" }}>Paid</p>
                  <p className="text-sm font-bold text-emerald-600">{formatCurrency(paymentInvoice.amount_paid || paymentInvoice.paid || 0)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase" style={{ color: "var(--muted-foreground)" }}>Balance</p>
                  <p className="text-sm font-bold text-red-500">{formatCurrency((paymentInvoice.total_amount || paymentInvoice.total || 0) - (paymentInvoice.amount_paid || paymentInvoice.paid || 0))}</p>
                </div>
              </div>
            </div>
            <Input label="Payment Amount *" type="number" placeholder="0.00" error={formErrors.paymentAmount} value={paymentAmount} onChange={(e) => { setPaymentAmount(e.target.value); if (formErrors.paymentAmount) setFormErrors({ ...formErrors, paymentAmount: "" }); }} />
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Payment Method</label>
              <Select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                options={[
                  { value: "bank_transfer", label: "Bank Transfer" },
                  { value: "cash", label: "Cash" },
                  { value: "cheque", label: "Cheque" },
                  { value: "online", label: "Online Payment" }
                ]}
                className="w-full h-9 px-3 rounded-lg border text-sm bg-[var(--background)] border-[var(--border)] text-[var(--foreground)]"
              />
            </div>
            <Button variant="ghost" size="sm" onClick={() => setPaymentAmount(String((paymentInvoice.total_amount || paymentInvoice.total || 0) - (paymentInvoice.amount_paid || paymentInvoice.paid || 0)))}>
              Pay Full Balance
            </Button>
          </div>
        )}
      </Drawer>
    </motion.div>
  );
}

export default function InvoicesPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center font-medium" style={{ color: "var(--muted-foreground)" }}>Loading...</div>}>
      <InvoicesContent />
    </React.Suspense>
  );
}
