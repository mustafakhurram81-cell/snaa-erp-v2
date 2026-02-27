"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Plus, Eye, Printer } from "lucide-react";
import { PageHeader, Button, DataTable, StatusBadge, Drawer, Input, SearchInput, Tabs, Card } from "@/components/ui/shared";
import { SalesOrderDetail } from "@/components/details/sales-order-detail";
import { formatCurrency, formatDate } from "@/lib/utils";

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
  [key: string]: unknown;
}

const mockOrders: SalesOrder[] = [
  { id: "1", order_number: "SO-2026-042", customer: "City Hospital", quotation: "QT-2026-088", date: "2026-02-25", delivery_date: "2026-03-15", items_count: 5, total: 12500, status: "confirmed" },
  { id: "2", order_number: "SO-2026-041", customer: "Metro Medical", quotation: "QT-2026-086", date: "2026-02-24", delivery_date: "2026-03-10", items_count: 8, total: 8900, status: "in_progress" },
  { id: "3", order_number: "SO-2026-040", customer: "Central Clinic", quotation: "QT-2026-084", date: "2026-02-23", delivery_date: "2026-03-05", items_count: 3, total: 15200, status: "shipped" },
  { id: "4", order_number: "SO-2026-039", customer: "National Hospital", quotation: "QT-2026-082", date: "2026-02-22", delivery_date: "2026-02-28", items_count: 12, total: 22000, status: "delivered" },
  { id: "5", order_number: "SO-2026-038", customer: "Prime Healthcare", quotation: "QT-2026-080", date: "2026-02-21", delivery_date: "2026-03-12", items_count: 6, total: 6300, status: "confirmed" },
  { id: "6", order_number: "SO-2026-037", customer: "Gulf Healthcare", quotation: "QT-2026-078", date: "2026-02-18", delivery_date: "2026-03-08", items_count: 15, total: 42000, status: "in_progress" },
  { id: "7", order_number: "SO-2026-036", customer: "Royal Clinic", quotation: "QT-2026-076", date: "2026-02-15", delivery_date: "2026-03-01", items_count: 4, total: 7500, status: "cancelled" },
];

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<SalesOrder[]>(mockOrders);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showDrawer, setShowDrawer] = useState(false);
  const [formData, setFormData] = useState({ customer: "", delivery_date: "" });
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

  const tabs = [
    { key: "all", label: "All", count: orders.length },
    { key: "confirmed", label: "Confirmed", count: orders.filter((o) => o.status === "confirmed").length },
    { key: "in_progress", label: "In Production", count: orders.filter((o) => o.status === "in_progress").length },
    { key: "shipped", label: "Shipped", count: orders.filter((o) => o.status === "shipped").length },
    { key: "delivered", label: "Delivered", count: orders.filter((o) => o.status === "delivered").length },
  ];

  const filtered = orders.filter((o) => {
    const matchesSearch = [o.order_number, o.customer].some((v) =>
      v.toLowerCase().includes(search.toLowerCase())
    );
    const matchesTab = activeTab === "all" || o.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const columns = [
    {
      key: "order_number",
      label: "Order #",
      render: (item: SalesOrder) => (
        <span className="font-medium text-sm" style={{ color: "var(--primary)" }}>{item.order_number}</span>
      ),
    },
    {
      key: "customer",
      label: "Customer",
      render: (item: SalesOrder) => (
        <span className="text-sm" style={{ color: "var(--foreground)" }}>{item.customer}</span>
      ),
    },
    {
      key: "quotation",
      label: "Quotation",
      render: (item: SalesOrder) => (
        <span className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>{item.quotation}</span>
      ),
    },
    {
      key: "date",
      label: "Order Date",
      render: (item: SalesOrder) => (
        <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>{formatDate(item.date)}</span>
      ),
    },
    {
      key: "delivery_date",
      label: "Delivery",
      render: (item: SalesOrder) => (
        <span className="text-sm" style={{ color: "var(--foreground)" }}>{formatDate(item.delivery_date)}</span>
      ),
    },
    {
      key: "total",
      label: "Total",
      render: (item: SalesOrder) => (
        <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
          {formatCurrency(item.total)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (item: SalesOrder) => <StatusBadge status={item.status} />,
    },
    {
      key: "actions",
      label: "",
      render: () => (
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded-md hover:bg-[var(--secondary)] transition-colors" title="View">
            <Eye className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
          </button>
          <button className="p-1.5 rounded-md hover:bg-[var(--secondary)] transition-colors" title="Print">
            <Printer className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Sales Orders"
        description="Track and manage confirmed customer orders"
        actions={
          <Button onClick={() => setShowDrawer(true)}>
            <Plus className="w-3.5 h-3.5" />
            New Sales Order
          </Button>
        }
      />

      <div className="flex items-center justify-between gap-4 mb-5">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        <div className="max-w-xs">
          <SearchInput value={search} onChange={setSearch} placeholder="Search orders..." />
        </div>
      </div>

      <DataTable columns={columns} data={filtered} emptyMessage="No sales orders found" onRowClick={(item) => setSelectedOrder(item as SalesOrder)} />

      <SalesOrderDetail order={selectedOrder} open={!!selectedOrder} onClose={() => setSelectedOrder(null)} />

      <Drawer
          open={showDrawer}
          onClose={() => setShowDrawer(false)}
          title="New Sales Order"
          width="max-w-2xl"
          footer={
              <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setShowDrawer(false)}>Cancel</Button>
                  <Button onClick={() => {
                      const newOrder: SalesOrder = {
                          id: Date.now().toString(),
                          order_number: `SO-2026-${(43 + orders.length).toString().padStart(3, "0")}`,
                          customer: formData.customer || "New Customer",
                          quotation: "-",
                          date: new Date().toISOString().slice(0, 10),
                          delivery_date: formData.delivery_date || new Date().toISOString().slice(0, 10),
                          items_count: 1,
                          total: 0,
                          status: "confirmed",
                      };
                      setOrders([newOrder, ...orders]);
                      setShowDrawer(false);
                      setFormData({ customer: "", delivery_date: "" });
                  }}>Create Order</Button>
              </div>
          }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Customer" value={formData.customer} onChange={(e) => setFormData({ ...formData, customer: e.target.value })} placeholder="Select customer..." />
            <Input label="Delivery Date" type="date" value={formData.delivery_date} onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })} />
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>Line Items</h4>
            <Card className="!p-3">
              <div className="grid grid-cols-12 gap-3 text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--muted-foreground)" }}>
                <span className="col-span-5">Product</span>
                <span className="col-span-2">Qty</span>
                <span className="col-span-2">Unit Price</span>
                <span className="col-span-2">Total</span>
                <span className="col-span-1"></span>
              </div>
              <div className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-5"><Input placeholder="Select product..." /></div>
                <div className="col-span-2"><Input type="number" placeholder="1" /></div>
                <div className="col-span-2"><Input type="number" placeholder="0.00" /></div>
                <div className="col-span-2 text-sm font-medium" style={{ color: "var(--foreground)" }}>$0.00</div>
                <div className="col-span-1"></div>
              </div>
            </Card>
            <Button variant="ghost" size="sm" className="mt-2">
              <Plus className="w-3.5 h-3.5" />
              Add Item
            </Button>
          </div>
        </div>
      </Drawer>
    </motion.div>
  );
}
