"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, DollarSign, Clock, AlertTriangle, Check, Trash2, ImageIcon } from "lucide-react";
import { PageHeader, Button, Drawer, Input, Card, StatusBadge, Tabs, StatCard } from "@/components/ui/shared";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { InvoiceDetail } from "@/components/details/invoice-detail";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { useSupabaseTable } from "@/lib/supabase-hooks";

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

// --- Mock Products ---
const mockProducts = [
  { name: 'Mayo Scissors 6.5" Straight', price: 24.0 },
  { name: 'Metzenbaum Scissors 7" Curved', price: 28.0 },
  { name: 'Adson Forceps 4.75"', price: 15.0 },
  { name: 'Debakey Forceps 8"', price: 35.0 },
  { name: "Army-Navy Retractor Set", price: 52.0 },
  { name: 'Kelly Clamp 5.5" Curved', price: 20.0 },
  { name: 'Mayo-Hegar Needle Holder 7"', price: 30.0 },
];

let nextINVNumber = 46;
function getNextINVNumber() {
  return `INV-2026-${String(nextINVNumber++).padStart(3, "0")}`;
}

function emptyLineItem(): LineItem {
  return { id: Date.now().toString() + Math.random(), product: "", qty: 1, unit_price: 0 };
}

const columns: ColumnDef<Invoice, unknown>[] = [
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
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
];

function InvoicesContent() {
  const { data: dbInvoices, loading, create, update, remove } = useSupabaseTable<Invoice>("invoices");
  const [activeTab, setActiveTab] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { toast } = useToast();
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

  useEffect(() => {
    const openId = searchParams.get("open");
    if (openId) {
      const found = invoices.find((i) => i.invoice_number === openId);
      if (found) setSelectedInvoice(found);
    }
  }, [searchParams, invoices]);

  // Form state
  const [formCustomer, setFormCustomer] = useState("");
  const [formSO, setFormSO] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formLineItems, setFormLineItems] = useState<LineItem[]>([emptyLineItem()]);

  const resetForm = () => { setFormCustomer(""); setFormSO(""); setFormDueDate(""); setFormLineItems([emptyLineItem()]); };
  const addLineItem = () => setFormLineItems([...formLineItems, emptyLineItem()]);
  const removeLineItem = (id: string) => { if (formLineItems.length <= 1) return; setFormLineItems(formLineItems.filter((li) => li.id !== id)); };
  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setFormLineItems(formLineItems.map((li) => (li.id === id ? { ...li, [field]: value } : li)));
  };
  const handleProductSelect = (id: string, productName: string) => {
    const product = mockProducts.find((p) => p.name === productName);
    setFormLineItems(formLineItems.map((li) => (li.id === id ? { ...li, product: productName, unit_price: product?.price || li.unit_price } : li)));
  };

  const formTotal = formLineItems.reduce((sum, li) => sum + li.qty * li.unit_price, 0);

  const handleCreate = async (asDraft: boolean) => {
    if (!formCustomer.trim()) { toast("error", "Please enter a customer name"); return; }
    if (formLineItems.some((li) => !li.product.trim())) { toast("error", "Please fill in all line item products"); return; }

    const result = await create({
      invoice_number: getNextINVNumber(),
      customer_name: formCustomer,
      invoice_date: new Date().toISOString().split("T")[0],
      due_date: formDueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      total_amount: formTotal,
      amount_paid: 0,
      status: asDraft ? "draft" : "pending",
      notes: formSO ? `Source SO: ${formSO}` : "",
    } as Partial<Invoice>);

    if (result) {
      setShowDialog(false);
      resetForm();
      toast("success", `Invoice ${result.invoice_number} created`);
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
          <Button onClick={() => { resetForm(); setShowDialog(true); }}>
            <Plus className="w-3.5 h-3.5" />
            New Invoice
          </Button>
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
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage="No invoices found"
          searchPlaceholder="Search invoices..."
          enableSelection
          onRowClick={(item) => setSelectedInvoice(item)}
        />
      )}

      <InvoiceDetail
        invoice={selectedInvoice}
        open={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onUpdate={async (updated) => { const result = await update(updated.id, updated); if (result) setSelectedInvoice(result); }}
        onDelete={async (inv) => { await remove(inv.id); setSelectedInvoice(null); }}
      />

      <Drawer
        open={showDialog}
        onClose={() => setShowDialog(false)}
        title="New Invoice"
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
          <div className="grid grid-cols-3 gap-4">
            <Input label="Customer" placeholder="e.g. City Hospital" value={formCustomer} onChange={(e) => setFormCustomer(e.target.value)} />
            <Input label="Sales Order" placeholder="SO-2026-XXX" value={formSO} onChange={(e) => setFormSO(e.target.value)} />
            <Input label="Due Date" type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} />
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
                    <select
                      value={li.product}
                      onChange={(e) => handleProductSelect(li.id, e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                      style={{ background: "var(--background)", borderColor: "var(--border)", color: li.product ? "var(--foreground)" : "var(--muted-foreground)" }}
                    >
                      <option value="">Select product...</option>
                      {mockProducts.map((p) => (<option key={p.name} value={p.name}>{p.name}</option>))}
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
