"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Plus, ArrowRight, Copy, Send } from "lucide-react";
import { PageHeader, Button, DataTable, StatusBadge, Drawer, Input, SearchInput, Tabs, Card } from "@/components/ui/shared";
import { QuotationDetail } from "@/components/details/quotation-detail";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Quotation {
  id: string;
  quote_number: string;
  customer: string;
  date: string;
  valid_until: string;
  items_count: number;
  total: number;
  status: string;
  [key: string]: unknown;
}

const mockQuotations: Quotation[] = [
  { id: "1", quote_number: "QT-2026-089", customer: "City Hospital", date: "2026-02-25", valid_until: "2026-03-25", items_count: 8, total: 18500, status: "sent" },
  { id: "2", quote_number: "QT-2026-088", customer: "Metro Medical Center", date: "2026-02-22", valid_until: "2026-03-22", items_count: 5, total: 12000, status: "accepted" },
  { id: "3", quote_number: "QT-2026-087", customer: "Gulf Healthcare", date: "2026-02-20", valid_until: "2026-03-20", items_count: 15, total: 42000, status: "draft" },
  { id: "4", quote_number: "QT-2026-086", customer: "Central Clinic", date: "2026-02-18", valid_until: "2026-03-18", items_count: 3, total: 5800, status: "accepted" },
  { id: "5", quote_number: "QT-2026-085", customer: "National Hospital", date: "2026-02-15", valid_until: "2026-03-15", items_count: 12, total: 35000, status: "rejected" },
  { id: "6", quote_number: "QT-2026-084", customer: "Prime Healthcare", date: "2026-02-12", valid_until: "2026-03-12", items_count: 6, total: 9200, status: "sent" },
  { id: "7", quote_number: "QT-2026-083", customer: "Royal Clinic", date: "2026-02-10", valid_until: "2026-03-10", items_count: 4, total: 7500, status: "draft" },
];

export default function QuotationsPage() {
  const [quotations] = useState<Quotation[]>(mockQuotations);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  const tabs = [
    { key: "all", label: "All", count: quotations.length },
    { key: "draft", label: "Draft", count: quotations.filter((q) => q.status === "draft").length },
    { key: "sent", label: "Sent", count: quotations.filter((q) => q.status === "sent").length },
    { key: "accepted", label: "Accepted", count: quotations.filter((q) => q.status === "accepted").length },
    { key: "rejected", label: "Rejected", count: quotations.filter((q) => q.status === "rejected").length },
  ];

  const filtered = quotations.filter((q) => {
    const matchesSearch = [q.quote_number, q.customer].some((v) =>
      v.toLowerCase().includes(search.toLowerCase())
    );
    const matchesTab = activeTab === "all" || q.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const columns = [
    {
      key: "quote_number",
      label: "Quote #",
      render: (item: Quotation) => (
        <span className="font-medium text-sm" style={{ color: "var(--primary)" }}>{item.quote_number}</span>
      ),
    },
    {
      key: "customer",
      label: "Customer",
      render: (item: Quotation) => (
        <span className="text-sm" style={{ color: "var(--foreground)" }}>{item.customer}</span>
      ),
    },
    {
      key: "date",
      label: "Date",
      render: (item: Quotation) => (
        <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>{formatDate(item.date)}</span>
      ),
    },
    {
      key: "items_count",
      label: "Items",
      render: (item: Quotation) => (
        <span className="text-sm" style={{ color: "var(--foreground)" }}>{item.items_count}</span>
      ),
    },
    {
      key: "total",
      label: "Total",
      render: (item: Quotation) => (
        <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
          {formatCurrency(item.total)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (item: Quotation) => <StatusBadge status={item.status} />,
    },
    {
      key: "actions",
      label: "",
      render: (item: Quotation) => (
        <div className="flex items-center gap-1">
          {item.status === "draft" && (
            <button className="p-1.5 rounded-md hover:bg-[var(--secondary)] transition-colors" title="Send">
              <Send className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
            </button>
          )}
          {item.status === "accepted" && (
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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Quotations"
        description="Manage price quotations for customers"
        actions={
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="w-3.5 h-3.5" />
            New Quotation
          </Button>
        }
      />

      <div className="flex items-center justify-between gap-4 mb-5">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        <div className="max-w-xs">
          <SearchInput value={search} onChange={setSearch} placeholder="Search quotations..." />
        </div>
      </div>

      <DataTable columns={columns} data={filtered} emptyMessage="No quotations found" onRowClick={(item) => setSelectedQuotation(item as Quotation)} />

      <QuotationDetail quotation={selectedQuotation} open={!!selectedQuotation} onClose={() => setSelectedQuotation(null)} />

      <Drawer
          open={showDialog}
          onClose={() => setShowDialog(false)}
          title="New Quotation"
          width="max-w-2xl"
          footer={
              <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setShowDialog(false)}>Cancel</Button>
                  <Button variant="secondary">Save as Draft</Button>
                  <Button onClick={() => setShowDialog(false)}>Create & Send</Button>
              </div>
          }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Input label="Quote Number" value="QT-2026-090" readOnly />
            <Input label="Customer" placeholder="Select customer..." />
            <Input label="Valid Until" type="date" />
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
