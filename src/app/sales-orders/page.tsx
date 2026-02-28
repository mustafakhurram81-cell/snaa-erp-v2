"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader, Button, Drawer, Input, Card, StatusBadge, Tabs } from "@/components/ui/shared";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { SalesOrderDetail } from "@/components/details/sales-order-detail";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

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
  quotation: string;
  date: string;
  delivery_date: string;
  items_count: number;
  total: number;
  status: string;
  line_items?: LineItem[];
  invoice_number?: string;
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

// --- Initial Data ---
const initialOrders: SalesOrder[] = [
  { id: "1", order_number: "SO-2026-042", customer: "City Hospital", quotation: "QT-2026-088", date: "2026-02-25", delivery_date: "2026-03-15", items_count: 5, total: 12500, status: "confirmed" },
  { id: "2", order_number: "SO-2026-041", customer: "Metro Medical Center", quotation: "QT-2026-085", date: "2026-02-22", delivery_date: "2026-03-12", items_count: 8, total: 24000, status: "in_progress" },
  { id: "3", order_number: "SO-2026-040", customer: "Gulf Healthcare", quotation: "QT-2026-082", date: "2026-02-20", delivery_date: "2026-03-10", items_count: 3, total: 8500, status: "shipped" },
  { id: "4", order_number: "SO-2026-039", customer: "Central Clinic", quotation: "QT-2026-080", date: "2026-02-18", delivery_date: "2026-03-05", items_count: 12, total: 38000, status: "delivered" },
  { id: "5", order_number: "SO-2026-038", customer: "National Hospital", quotation: "QT-2026-079", date: "2026-02-15", delivery_date: "2026-03-01", items_count: 6, total: 15000, status: "in_progress" },
  { id: "6", order_number: "SO-2026-037", customer: "Prime Healthcare", quotation: "QT-2026-077", date: "2026-02-12", delivery_date: "2026-02-28", items_count: 4, total: 9800, status: "delivered" },
  { id: "7", order_number: "SO-2026-036", customer: "Royal Clinic", quotation: "QT-2026-076", date: "2026-02-15", delivery_date: "2026-03-01", items_count: 4, total: 7500, status: "cancelled" },
];

let nextSONumber = 43;
function getNextSONumber() {
  return `SO-2026-${String(nextSONumber++).padStart(3, "0")}`;
}

function emptyLineItem(): LineItem {
  return { id: Date.now().toString() + Math.random(), product: "", qty: 1, unit_price: 0 };
}

// --- Columns ---
const columns: ColumnDef<SalesOrder, unknown>[] = [
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
    accessorKey: "customer",
    header: "Customer",
    cell: ({ row }) => <span className="text-sm" style={{ color: "var(--foreground)" }}>{row.original.customer}</span>,
  },
  {
    accessorKey: "quotation",
    header: "Quotation",
    cell: ({ row }) => (
      <span className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>{row.original.quotation}</span>
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
    accessorKey: "delivery_date",
    header: "Delivery",
    cell: ({ row }) => (
      <span className="text-sm" style={{ color: "var(--foreground)" }}>{formatDate(row.original.delivery_date)}</span>
    ),
  },
  {
    accessorKey: "items_count",
    header: "Items",
    cell: ({ row }) => <span className="text-sm" style={{ color: "var(--foreground)" }}>{row.original.items_count}</span>,
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => (
      <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{formatCurrency(row.original.total)}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
];

function SalesOrdersContent() {
  const [orders, setOrders] = useState<SalesOrder[]>(initialOrders);
  const [activeTab, setActiveTab] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const { toast } = useToast();
  const searchParams = useSearchParams();

  useEffect(() => {
    const openId = searchParams.get("open");
    if (openId) {
      const found = orders.find((o) => o.order_number === openId);
      if (found) setSelectedOrder(found);
    }
  }, [searchParams, orders]);

  // --- Form state ---
  const [formCustomer, setFormCustomer] = useState("");
  const [formQuotation, setFormQuotation] = useState("");
  const [formDeliveryDate, setFormDeliveryDate] = useState("");
  const [formLineItems, setFormLineItems] = useState<LineItem[]>([emptyLineItem()]);

  const resetForm = () => {
    setFormCustomer("");
    setFormQuotation("");
    setFormDeliveryDate("");
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
    const product = mockProducts.find((p) => p.name === productName);
    setFormLineItems(
      formLineItems.map((li) => (li.id === id ? { ...li, product: productName, unit_price: product?.price || li.unit_price } : li))
    );
  };

  const formTotal = formLineItems.reduce((sum, li) => sum + li.qty * li.unit_price, 0);

  const handleCreate = () => {
    if (!formCustomer.trim()) { toast("error", "Please enter a customer name"); return; }
    if (formLineItems.some((li) => !li.product.trim())) { toast("error", "Please fill in all line item products"); return; }

    const newOrder: SalesOrder = {
      id: Date.now().toString(),
      order_number: getNextSONumber(),
      customer: formCustomer,
      quotation: formQuotation || "—",
      date: new Date().toISOString().split("T")[0],
      delivery_date: formDeliveryDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      items_count: formLineItems.length,
      total: formTotal,
      status: "confirmed",
      line_items: [...formLineItems],
    };

    setOrders([newOrder, ...orders]);
    setShowDialog(false);
    resetForm();
    toast("success", `Sales Order ${newOrder.order_number} created`);
  };

  // --- Create Invoice from SO ---
  const handleCreateInvoice = (order: SalesOrder) => {
    const invNumber = `INV-2026-${String(nextSONumber++).padStart(3, "0")}`;
    setOrders(
      orders.map((o) => o.id === order.id ? { ...o, invoice_number: invNumber } : o)
    );
    toast("success", `Invoice ${invNumber} created from ${order.order_number}`);
  };

  // --- Create Job Orders from SO ---
  const handleCreateJobOrders = (order: SalesOrder) => {
    const itemCount = order.line_items?.length || order.items_count;
    toast("success", `${itemCount} Job Order(s) created from ${order.order_number}`);
  };

  // --- Delete SO ---
  const handleDeleteOrder = (order: SalesOrder) => {
    setOrders(orders.filter((o) => o.id !== order.id));
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
          <Button onClick={() => { resetForm(); setShowDialog(true); }}>
            <Plus className="w-3.5 h-3.5" />
            New Sales Order
          </Button>
        }
      />

      <div className="mb-5">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        emptyMessage="No sales orders found"
        searchPlaceholder="Search sales orders..."
        enableSelection
        onRowClick={(item) => setSelectedOrder(item)}
      />

      <SalesOrderDetail
        order={selectedOrder}
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onCreateInvoice={handleCreateInvoice}
        onCreateJobOrders={handleCreateJobOrders}
        onDelete={handleDeleteOrder}
        onUpdate={(updated) => { setOrders(orders.map((o) => o.id === updated.id ? updated : o)); setSelectedOrder(updated); }}
      />

      <Drawer
        open={showDialog}
        onClose={() => setShowDialog(false)}
        title="New Sales Order"
        width="max-w-2xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create Order</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Input label="Customer" placeholder="e.g. City Hospital" value={formCustomer} onChange={(e) => setFormCustomer(e.target.value)} />
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

export default function SalesOrdersPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center font-medium" style={{ color: "var(--muted-foreground)" }}>Loading...</div>}>
      <SalesOrdersContent />
    </React.Suspense>
  );
}
