"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, ArrowRight, Copy, Send, Trash2, X } from "lucide-react";
import { PageHeader, Button, Drawer, Input, Card, StatusBadge, Tabs } from "@/components/ui/shared";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { QuotationDetail } from "@/components/details/quotation-detail";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

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
  date: string;
  valid_until: string;
  items_count: number;
  total: number;
  status: string;
  line_items?: LineItem[];
  so_number?: string;
}

// --- Mock Products for selection ---
const mockProducts = [
  { name: 'Mayo Scissors 6.5" Straight', price: 24.0 },
  { name: 'Metzenbaum Scissors 7" Curved', price: 28.0 },
  { name: 'Adson Forceps 4.75"', price: 15.0 },
  { name: 'Debakey Forceps 8"', price: 35.0 },
  { name: "Army-Navy Retractor Set", price: 52.0 },
  { name: 'Kelly Clamp 5.5" Curved', price: 20.0 },
  { name: 'Mayo-Hegar Needle Holder 7"', price: 30.0 },
];

// --- Initial Mock Data ---
const initialQuotations: Quotation[] = [
  { id: "1", quote_number: "QT-2026-089", customer: "City Hospital", date: "2026-02-25", valid_until: "2026-03-25", items_count: 8, total: 18500, status: "sent" },
  {
    id: "2", quote_number: "QT-2026-088", customer: "Metro Medical Center", date: "2026-02-22", valid_until: "2026-03-22", items_count: 5, total: 12000, status: "accepted", line_items: [
      { id: "li1", product: 'Mayo Scissors 6.5" Straight', qty: 200, unit_price: 24.0 },
      { id: "li2", product: 'Adson Forceps 4.75"', qty: 100, unit_price: 15.0 },
      { id: "li3", product: 'Kelly Clamp 5.5" Curved', qty: 150, unit_price: 20.0 },
      { id: "li4", product: 'Mayo-Hegar Needle Holder 7"', qty: 80, unit_price: 30.0 },
      { id: "li5", product: 'Debakey Forceps 8"', qty: 50, unit_price: 35.0 },
    ]
  },
  { id: "3", quote_number: "QT-2026-087", customer: "Gulf Healthcare", date: "2026-02-20", valid_until: "2026-03-20", items_count: 15, total: 42000, status: "draft" },
  { id: "4", quote_number: "QT-2026-086", customer: "Central Clinic", date: "2026-02-18", valid_until: "2026-03-18", items_count: 3, total: 5800, status: "accepted" },
  { id: "5", quote_number: "QT-2026-085", customer: "National Hospital", date: "2026-02-15", valid_until: "2026-03-15", items_count: 12, total: 35000, status: "rejected" },
  { id: "6", quote_number: "QT-2026-084", customer: "Prime Healthcare", date: "2026-02-12", valid_until: "2026-03-12", items_count: 6, total: 9200, status: "sent" },
  { id: "7", quote_number: "QT-2026-083", customer: "Royal Clinic", date: "2026-02-10", valid_until: "2026-03-10", items_count: 4, total: 7500, status: "draft" },
];

// Next number tracker
let nextQTNumber = 90;
function getNextQTNumber() {
  return `QT-2026-${String(nextQTNumber++).padStart(3, "0")}`;
}

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
    accessorKey: "customer",
    header: "Customer",
    cell: ({ row }) => (
      <span className="text-sm" style={{ color: "var(--foreground)" }}>{row.original.customer}</span>
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
    accessorKey: "items_count",
    header: "Items",
    cell: ({ row }) => (
      <span className="text-sm" style={{ color: "var(--foreground)" }}>{row.original.items_count}</span>
    ),
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => (
      <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
        {formatCurrency(row.original.total)}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        {row.original.status === "draft" && (
          <button className="p-1.5 rounded-md hover:bg-[var(--secondary)] transition-colors" title="Send">
            <Send className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
          </button>
        )}
        {row.original.status === "accepted" && !row.original.so_number && (
          <button className="p-1.5 rounded-md hover:bg-[var(--secondary)] transition-colors" title="Convert to SO">
            <ArrowRight className="w-3.5 h-3.5 text-blue-500" />
          </button>
        )}
        <button className="p-1.5 rounded-md hover:bg-[var(--secondary)] transition-colors" title="Duplicate">
          <Copy className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
        </button>
      </div>
    ),
  },
];

// --- Empty line item ---
function emptyLineItem(): LineItem {
  return { id: Date.now().toString() + Math.random(), product: "", qty: 1, unit_price: 0 };
}

// --- Page ---
function QuotationsContent() {
  const [quotations, setQuotations] = useState<Quotation[]>(initialQuotations);
  const [activeTab, setActiveTab] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const { toast } = useToast();
  const searchParams = useSearchParams();

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
  const [formStatus, setFormStatus] = useState<"draft" | "sent">("draft");

  const resetForm = () => {
    setFormCustomer("");
    setFormValidUntil("");
    setFormLineItems([emptyLineItem()]);
    setFormStatus("draft");
  };

  const addLineItem = () => {
    setFormLineItems([...formLineItems, emptyLineItem()]);
  };

  const removeLineItem = (id: string) => {
    if (formLineItems.length <= 1) return;
    setFormLineItems(formLineItems.filter((li) => li.id !== id));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setFormLineItems(
      formLineItems.map((li) => (li.id === id ? { ...li, [field]: value } : li))
    );
  };

  const handleProductSelect = (id: string, productName: string) => {
    const product = mockProducts.find((p) => p.name === productName);
    setFormLineItems(
      formLineItems.map((li) =>
        li.id === id ? { ...li, product: productName, unit_price: product?.price || li.unit_price } : li
      )
    );
  };

  const formTotal = formLineItems.reduce((sum, li) => sum + li.qty * li.unit_price, 0);

  const handleCreate = (asDraft: boolean) => {
    if (!formCustomer.trim()) {
      toast("error", "Please enter a customer name");
      return;
    }
    if (formLineItems.some((li) => !li.product.trim())) {
      toast("error", "Please fill in all line item products");
      return;
    }

    const newQuotation: Quotation = {
      id: Date.now().toString(),
      quote_number: getNextQTNumber(),
      customer: formCustomer,
      date: new Date().toISOString().split("T")[0],
      valid_until: formValidUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      items_count: formLineItems.length,
      total: formTotal,
      status: asDraft ? "draft" : "sent",
      line_items: [...formLineItems],
    };

    setQuotations([newQuotation, ...quotations]);
    setShowDialog(false);
    resetForm();
    toast("success", `Quotation ${newQuotation.quote_number} created`);
  };

  // --- Convert Quotation to Sales Order ---
  const handleConvertToSO = (quotation: Quotation) => {
    const soNumber = getNextQTNumber().replace("QT", "SO"); // generate SO number
    // Update the quotation to mark it as converted with linked SO
    setQuotations(
      quotations.map((q) =>
        q.id === quotation.id ? { ...q, status: "converted", so_number: soNumber } : q
      )
    );
    toast("success", `Sales Order ${soNumber} created from ${quotation.quote_number}`);
  };

  // --- Delete Quotation ---
  const handleDeleteQuotation = (quotation: Quotation) => {
    setQuotations(quotations.filter((q) => q.id !== quotation.id));
  };

  // --- Update Quotation ---
  const handleUpdateQuotation = (updated: Quotation) => {
    setQuotations(quotations.map((q) => q.id === updated.id ? updated : q));
    setSelectedQuotation(updated);
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

      <DataTable
        columns={columns}
        data={filtered}
        emptyMessage="No quotations found"
        searchPlaceholder="Search quotations..."
        onRowClick={(item) => setSelectedQuotation(item)}
      />

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
          {/* Header Fields */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Customer"
              placeholder="e.g. City Hospital"
              value={formCustomer}
              onChange={(e) => setFormCustomer(e.target.value)}
            />
            <Input
              label="Valid Until"
              type="date"
              value={formValidUntil}
              onChange={(e) => setFormValidUntil(e.target.value)}
            />
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Line Items</h4>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--secondary)", color: "var(--primary)" }}>
                {formLineItems.length} item{formLineItems.length !== 1 ? "s" : ""}
              </span>
            </div>

            <Card className="!p-3 space-y-2">
              {/* Column Headers */}
              <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                <span className="col-span-5">Product</span>
                <span className="col-span-2">Qty</span>
                <span className="col-span-2">Unit Price</span>
                <span className="col-span-2">Total</span>
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
                    <Input
                      type="number"
                      placeholder="1"
                      value={String(li.qty)}
                      onChange={(e) => updateLineItem(li.id, "qty", Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={String(li.unit_price)}
                      onChange={(e) => updateLineItem(li.id, "unit_price", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                      {formatCurrency(li.qty * li.unit_price)}
                    </span>
                  </div>
                  <div className="col-span-1">
                    <button
                      onClick={() => removeLineItem(li.id)}
                      disabled={formLineItems.length <= 1}
                      className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30 transition-colors"
                    >
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

          {/* Total */}
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

export default function QuotationsPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center font-medium" style={{ color: "var(--muted-foreground)" }}>Loading...</div>}>
      <QuotationsContent />
    </React.Suspense>
  );
}
