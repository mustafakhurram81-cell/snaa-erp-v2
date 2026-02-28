"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, DollarSign, Clock, AlertTriangle, Check, Trash2 } from "lucide-react";
import { PageHeader, Button, Drawer, Input, Card, StatusBadge, Tabs, StatCard } from "@/components/ui/shared";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { InvoiceDetail } from "@/components/details/invoice-detail";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

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
  sales_order: string;
  date: string;
  due_date: string;
  total: number;
  paid: number;
  status: string;
  line_items?: LineItem[];
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

const initialInvoices: Invoice[] = [
  { id: "1", invoice_number: "INV-2026-045", customer: "City Hospital", sales_order: "SO-2026-038", date: "2026-02-24", due_date: "2026-03-24", total: 12500, paid: 12500, status: "paid" },
  { id: "2", invoice_number: "INV-2026-044", customer: "Metro Medical Center", sales_order: "SO-2026-037", date: "2026-02-22", due_date: "2026-03-22", total: 24000, paid: 10000, status: "pending" },
  { id: "3", invoice_number: "INV-2026-043", customer: "Gulf Healthcare", sales_order: "SO-2026-035", date: "2026-02-18", due_date: "2026-03-18", total: 42000, paid: 42000, status: "paid" },
  { id: "4", invoice_number: "INV-2026-042", customer: "Central Clinic", sales_order: "SO-2026-034", date: "2026-02-15", due_date: "2026-03-01", total: 5800, paid: 0, status: "overdue" },
  { id: "5", invoice_number: "INV-2026-041", customer: "National Hospital", sales_order: "SO-2026-033", date: "2026-02-12", due_date: "2026-03-12", total: 35000, paid: 15000, status: "pending" },
  { id: "6", invoice_number: "INV-2026-040", customer: "Prime Healthcare", sales_order: "SO-2026-031", date: "2026-02-10", due_date: "2026-02-25", total: 9200, paid: 0, status: "overdue" },
  { id: "7", invoice_number: "INV-2026-039", customer: "Royal Clinic", sales_order: "SO-2026-028", date: "2026-02-08", due_date: "2026-03-08", total: 7500, paid: 0, status: "draft" },
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
    accessorKey: "customer",
    header: "Customer",
    cell: ({ row }) => <span className="text-sm" style={{ color: "var(--foreground)" }}>{row.original.customer}</span>,
  },
  {
    accessorKey: "sales_order",
    header: "Sales Order",
    cell: ({ row }) => <span className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>{row.original.sales_order}</span>,
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>{formatDate(row.original.date)}</span>,
  },
  {
    accessorKey: "due_date",
    header: "Due Date",
    cell: ({ row }) => <span className="text-sm" style={{ color: "var(--foreground)" }}>{formatDate(row.original.due_date)}</span>,
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{formatCurrency(row.original.total)}</span>,
  },
  {
    accessorKey: "paid",
    header: "Paid",
    cell: ({ row }) => <span className="text-sm text-emerald-600 font-medium">{formatCurrency(row.original.paid)}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
];

function InvoicesContent() {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [activeTab, setActiveTab] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { toast } = useToast();
  const searchParams = useSearchParams();

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

  const handleCreate = (asDraft: boolean) => {
    if (!formCustomer.trim()) { toast("error", "Please enter a customer name"); return; }
    if (formLineItems.some((li) => !li.product.trim())) { toast("error", "Please fill in all line item products"); return; }

    const newInvoice: Invoice = {
      id: Date.now().toString(),
      invoice_number: getNextINVNumber(),
      customer: formCustomer,
      sales_order: formSO || "—",
      date: new Date().toISOString().split("T")[0],
      due_date: formDueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      total: formTotal,
      paid: 0,
      status: asDraft ? "draft" : "pending",
      line_items: [...formLineItems],
    };

    setInvoices([newInvoice, ...invoices]);
    setShowDialog(false);
    resetForm();
    toast("success", `Invoice ${newInvoice.invoice_number} created`);
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

      <DataTable
        columns={columns}
        data={filtered}
        emptyMessage="No invoices found"
        searchPlaceholder="Search invoices..."
        enableSelection
        onRowClick={(item) => setSelectedInvoice(item)}
      />

      <InvoiceDetail
        invoice={selectedInvoice}
        open={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onUpdate={(updated) => { setInvoices(invoices.map((i) => i.id === updated.id ? updated : i)); setSelectedInvoice(updated); }}
        onDelete={(inv) => { setInvoices(invoices.filter((i) => i.id !== inv.id)); setSelectedInvoice(null); }}
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
                <span className="col-span-5">Item</span>
                <span className="col-span-2">Qty</span>
                <span className="col-span-2">Unit Price</span>
                <span className="col-span-2">Amount</span>
                <span className="col-span-1"></span>
              </div>
              {formLineItems.map((li) => (
                <div key={li.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <select
                      value={li.product}
                      onChange={(e) => handleProductSelect(li.id, e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                      style={{ background: "var(--background)", borderColor: "var(--border)", color: li.product ? "var(--foreground)" : "var(--muted-foreground)" }}
                    >
                      <option value="">Select product...</option>
                      {mockProducts.map((p) => (
                        <option key={p.name} value={p.name}>{p.name}</option>
                      ))}
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
