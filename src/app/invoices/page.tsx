"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Receipt, Plus, Eye, Download, CheckCircle } from "lucide-react";
import { PageHeader, Button, DataTable, StatusBadge, SearchInput, Tabs, StatCard, Drawer, Input } from "@/components/ui/shared";
import { InvoiceDetail } from "@/components/details/invoice-detail";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DollarSign, Clock, AlertTriangle, Check } from "lucide-react";

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
  [key: string]: unknown;
}

const mockInvoices: Invoice[] = [
  { id: "1", invoice_number: "INV-2026-045", customer: "City Hospital", sales_order: "SO-2026-038", date: "2026-02-24", due_date: "2026-03-24", total: 12500, paid: 12500, status: "paid" },
  { id: "2", invoice_number: "INV-2026-044", customer: "Metro Medical", sales_order: "SO-2026-037", date: "2026-02-22", due_date: "2026-03-22", total: 8900, paid: 0, status: "sent" },
  { id: "3", invoice_number: "INV-2026-043", customer: "Gulf Healthcare", sales_order: "SO-2026-035", date: "2026-02-18", due_date: "2026-02-25", total: 42000, paid: 0, status: "overdue" },
  { id: "4", invoice_number: "INV-2026-042", customer: "Central Clinic", sales_order: "SO-2026-034", date: "2026-02-15", due_date: "2026-03-15", total: 15200, paid: 15200, status: "paid" },
  { id: "5", invoice_number: "INV-2026-041", customer: "National Hospital", sales_order: "SO-2026-032", date: "2026-02-12", due_date: "2026-03-12", total: 22000, paid: 11000, status: "sent" },
  { id: "6", invoice_number: "INV-2026-040", customer: "Prime Healthcare", sales_order: "SO-2026-030", date: "2026-02-10", due_date: "2026-02-20", total: 6300, paid: 0, status: "overdue" },
  { id: "7", invoice_number: "INV-2026-039", customer: "Royal Clinic", sales_order: "SO-2026-028", date: "2026-02-08", due_date: "2026-03-08", total: 7500, paid: 0, status: "draft" },
];

export default function InvoicesPage() {
  const [invoices] = useState<Invoice[]>(mockInvoices);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showPayment, setShowPayment] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const totalOutstanding = invoices.filter((i) => i.status !== "paid" && i.status !== "draft").reduce((sum, i) => sum + i.total - i.paid, 0);
  const totalOverdue = invoices.filter((i) => i.status === "overdue").reduce((sum, i) => sum + i.total - i.paid, 0);
  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.paid, 0);

  const tabs = [
    { key: "all", label: "All", count: invoices.length },
    { key: "draft", label: "Draft", count: invoices.filter((i) => i.status === "draft").length },
    { key: "sent", label: "Sent", count: invoices.filter((i) => i.status === "sent").length },
    { key: "paid", label: "Paid", count: invoices.filter((i) => i.status === "paid").length },
    { key: "overdue", label: "Overdue", count: invoices.filter((i) => i.status === "overdue").length },
  ];

  const filtered = invoices.filter((i) => {
    const matchesSearch = [i.invoice_number, i.customer].some((v) =>
      v.toLowerCase().includes(search.toLowerCase())
    );
    const matchesTab = activeTab === "all" || i.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const columns = [
    {
      key: "invoice_number",
      label: "Invoice #",
      render: (item: Invoice) => (
        <span className="font-medium text-sm" style={{ color: "var(--primary)" }}>{item.invoice_number}</span>
      ),
    },
    { key: "customer", label: "Customer" },
    {
      key: "sales_order",
      label: "Sales Order",
      render: (item: Invoice) => (
        <span className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>{item.sales_order}</span>
      ),
    },
    {
      key: "date",
      label: "Date",
      render: (item: Invoice) => (
        <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>{formatDate(item.date)}</span>
      ),
    },
    {
      key: "total",
      label: "Amount",
      render: (item: Invoice) => (
        <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
          {formatCurrency(item.total)}
        </span>
      ),
    },
    {
      key: "paid",
      label: "Paid",
      render: (item: Invoice) => (
        <span className="text-sm" style={{ color: item.paid > 0 ? "var(--foreground)" : "var(--muted-foreground)" }}>
          {formatCurrency(item.paid)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (item: Invoice) => <StatusBadge status={item.status} />,
    },
    {
      key: "actions",
      label: "",
      render: (item: Invoice) => (
        <div className="flex items-center gap-1">
          {(item.status === "sent" || item.status === "overdue") && (
            <button onClick={() => setShowPayment(true)} className="p-1.5 rounded-md hover:bg-[var(--secondary)] transition-colors" title="Record Payment">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            </button>
          )}
          <button className="p-1.5 rounded-md hover:bg-[var(--secondary)] transition-colors" title="Download">
            <Download className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Invoices"
        description="Manage billing and payment tracking"
        actions={
          <Button>
            <Plus className="w-3.5 h-3.5" />
            New Invoice
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Outstanding"
          value={formatCurrency(totalOutstanding)}
          icon={<Clock className="w-5 h-5 text-amber-500" />}
        />
        <StatCard
          title="Overdue"
          value={formatCurrency(totalOverdue)}
          change={`${invoices.filter((i) => i.status === "overdue").length} invoices`}
          changeType="negative"
          icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
        />
        <StatCard
          title="Collected (This Month)"
          value={formatCurrency(totalPaid)}
          changeType="positive"
          icon={<Check className="w-5 h-5 text-emerald-500" />}
        />
      </div>

      <div className="flex items-center justify-between gap-4 mb-5">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        <div className="max-w-xs">
          <SearchInput value={search} onChange={setSearch} placeholder="Search invoices..." />
        </div>
      </div>

      <DataTable columns={columns} data={filtered} emptyMessage="No invoices found" onRowClick={(item) => setSelectedInvoice(item as Invoice)} bulkActions />

      <InvoiceDetail invoice={selectedInvoice} open={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} onRecordPayment={() => { setSelectedInvoice(null); setShowPayment(true); }} />

      <Drawer
        open={showPayment}
        onClose={() => setShowPayment(false)}
        title="Record Payment"
        width="max-w-md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowPayment(false)}>Cancel</Button>
            <Button onClick={() => setShowPayment(false)}>Record Payment</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Payment Amount" type="number" placeholder="0.00" />
          <Input label="Payment Date" type="date" />
          <Input label="Reference / Notes" placeholder="Bank transfer ref..." />
        </div>
      </Drawer>
    </motion.div>
  );
}
