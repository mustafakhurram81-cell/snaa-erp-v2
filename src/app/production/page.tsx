"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, LayoutGrid, List, Filter, Search, ClipboardList } from "lucide-react";
import { PageHeader, Button, Card, StatusBadge, SearchInput } from "@/components/ui/shared";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { formatDate } from "@/lib/utils";
import { MANUFACTURING_STAGES, type JobStage, type StageStatus, getProgress, getCurrentStage } from "@/lib/stages";
import { JobOrderDetail, type JobOrder } from "@/components/details/job-order-detail";

// --- Mock Data ---
const mockJobOrders: JobOrder[] = [
  {
    id: "1", jo_number: "JO-2026-001", so_number: "SO-2026-042", customer: "Metro General Hospital",
    product: "Mayo Scissors 6.5\" Straight", quantity: 200, start_date: "2026-02-10", due_date: "2026-03-15", status: "in_progress",
    stages: [
      { stageId: 1, status: "completed", type: "vendor", vendor: "Ali Steel Works", startDate: "2026-02-10", endDate: "2026-02-13" },
      { stageId: 2, status: "completed", type: "vendor", vendor: "Riaz Forging", startDate: "2026-02-13", endDate: "2026-02-16" },
      { stageId: 3, status: "completed", type: "vendor", vendor: "Precision Grinders", startDate: "2026-02-16", endDate: "2026-02-19" },
      { stageId: 4, status: "in_progress", type: "vendor", vendor: "Master Filing Works", startDate: "2026-02-19" },
      { stageId: 5, status: "not_started", type: "vendor" },
      { stageId: 6, status: "not_started", type: "vendor" },
      { stageId: 7, status: "not_started", type: "in-house" },
      { stageId: 8, status: "not_started", type: "in-house" },
      { stageId: 9, status: "not_started", type: "in-house" },
      { stageId: 10, status: "not_started", type: "in-house" },
    ],
  },
  {
    id: "2", jo_number: "JO-2026-002", so_number: "SO-2026-042", customer: "Metro General Hospital",
    product: "Adson Forceps 4.75\"", quantity: 500, start_date: "2026-02-12", due_date: "2026-03-20", status: "in_progress",
    stages: [
      { stageId: 1, status: "completed", type: "vendor", vendor: "Ali Steel Works", startDate: "2026-02-12", endDate: "2026-02-14" },
      { stageId: 2, status: "completed", type: "vendor", vendor: "Khalid Forging", startDate: "2026-02-14", endDate: "2026-02-18" },
      { stageId: 3, status: "in_progress", type: "vendor", vendor: "Precision Grinders", startDate: "2026-02-18", poNumber: "PO-2026-031" },
      { stageId: 4, status: "not_started", type: "vendor" },
      { stageId: 5, status: "not_started", type: "vendor" },
      { stageId: 6, status: "not_started", type: "vendor" },
      { stageId: 7, status: "not_started", type: "in-house" },
      { stageId: 8, status: "not_started", type: "in-house" },
      { stageId: 9, status: "not_started", type: "in-house" },
      { stageId: 10, status: "not_started", type: "in-house" },
    ],
  },
  {
    id: "3", jo_number: "JO-2026-003", so_number: "SO-2026-043", customer: "Gulf Healthcare Solutions",
    product: "Kelly Clamp 5.5\" Curved", quantity: 150, start_date: "2026-02-18", due_date: "2026-03-25", status: "in_progress",
    stages: [
      { stageId: 1, status: "completed", type: "vendor", vendor: "Riaz Die Works", startDate: "2026-02-18", endDate: "2026-02-20" },
      { stageId: 2, status: "in_progress", type: "vendor", vendor: "Riaz Forging", startDate: "2026-02-20", poNumber: "PO-2026-033" },
      { stageId: 3, status: "not_started", type: "vendor" },
      { stageId: 4, status: "not_started", type: "vendor" },
      { stageId: 5, status: "not_started", type: "vendor" },
      { stageId: 6, status: "not_started", type: "vendor" },
      { stageId: 7, status: "not_started", type: "in-house" },
      { stageId: 8, status: "not_started", type: "in-house" },
      { stageId: 9, status: "not_started", type: "in-house" },
      { stageId: 10, status: "not_started", type: "in-house" },
    ],
  },
  {
    id: "4", jo_number: "JO-2026-004", so_number: "SO-2026-040", customer: "City Hospital",
    product: "Metzenbaum Scissors 7\" Curved", quantity: 100, start_date: "2026-02-05", due_date: "2026-03-01", status: "in_progress",
    stages: [
      { stageId: 1, status: "completed", type: "vendor", vendor: "Ali Steel Works", startDate: "2026-02-05", endDate: "2026-02-07" },
      { stageId: 2, status: "completed", type: "vendor", vendor: "Riaz Forging", startDate: "2026-02-07", endDate: "2026-02-10" },
      { stageId: 3, status: "completed", type: "vendor", vendor: "Precision Grinders", startDate: "2026-02-10", endDate: "2026-02-13" },
      { stageId: 4, status: "completed", type: "vendor", vendor: "Master Filing Works", startDate: "2026-02-13", endDate: "2026-02-16" },
      { stageId: 5, status: "completed", type: "vendor", vendor: "Heat Treat Sialkot", startDate: "2026-02-16", endDate: "2026-02-18" },
      { stageId: 6, status: "completed", type: "vendor", vendor: "Chrome Plating Works", startDate: "2026-02-18", endDate: "2026-02-21" },
      { stageId: 7, status: "completed", type: "in-house", startDate: "2026-02-21", endDate: "2026-02-22" },
      { stageId: 8, status: "in_progress", type: "in-house", startDate: "2026-02-22" },
      { stageId: 9, status: "not_started", type: "in-house" },
      { stageId: 10, status: "not_started", type: "in-house" },
    ],
  },
  {
    id: "5", jo_number: "JO-2026-005", so_number: "SO-2026-039", customer: "Apex Surgical Center",
    product: "Mayo-Hegar Needle Holder 7\"", quantity: 80, start_date: "2026-02-01", due_date: "2026-02-25", status: "completed",
    stages: Array.from({ length: 10 }, (_, i) => ({
      stageId: i + 1,
      status: "completed" as StageStatus,
      type: (i < 6 ? "vendor" : "in-house") as "vendor" | "in-house",
      vendor: i < 6 ? ["Ali Steel", "Riaz Forging", "Precision Grinders", "Filing Works", "Heat Treat", "Chrome Plating"][i] : undefined,
      startDate: `2026-02-0${i + 1}`,
      endDate: `2026-02-0${i + 3}`,
    })),
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "tween" as const, duration: 0.3 } },
};

export default function ProductionPage() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [selectedJO, setSelectedJO] = useState<JobOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return mockJobOrders.filter((jo) => {
      const matchSearch = jo.jo_number.toLowerCase().includes(search.toLowerCase()) ||
        jo.product.toLowerCase().includes(search.toLowerCase()) ||
        jo.customer.toLowerCase().includes(search.toLowerCase()) ||
        jo.so_number.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || jo.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter]);

  // Group JOs by current stage for Kanban
  const kanbanData = useMemo(() => {
    const groups: Record<string, JobOrder[]> = {};
    MANUFACTURING_STAGES.forEach(s => { groups[s.key] = []; });
    groups["completed"] = [];

    filtered.forEach((jo) => {
      if (jo.status === "completed") {
        groups["completed"].push(jo);
      } else {
        const currentStageId = getCurrentStage(jo.stages);
        const stage = MANUFACTURING_STAGES.find(s => s.id === currentStageId);
        if (stage) groups[stage.key]?.push(jo);
      }
    });
    return groups;
  }, [filtered]);

  const listColumns: ColumnDef<JobOrder, unknown>[] = [
    { accessorKey: "jo_number", header: "JO #", cell: ({ row }) => <span className="font-mono font-semibold" style={{ color: "var(--primary)" }}>{row.original.jo_number}</span> },
    { accessorKey: "product", header: "Product" },
    { accessorKey: "so_number", header: "Sales Order", cell: ({ row }) => <span className="font-mono text-xs" style={{ color: "var(--muted-foreground)" }}>{row.original.so_number}</span> },
    { accessorKey: "customer", header: "Customer" },
    { accessorKey: "quantity", header: "Qty", cell: ({ row }) => <span>{row.original.quantity} pcs</span> },
    {
      id: "progress", header: "Progress", enableSorting: false, cell: ({ row }) => {
        const p = getProgress(row.original.stages);
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--secondary)" }}>
              <div className="h-full rounded-full" style={{ width: `${p}%`, background: p === 100 ? "#10b981" : "var(--primary)" }} />
            </div>
            <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{p}%</span>
          </div>
        );
      }
    },
    {
      id: "current_stage", header: "Current Stage", enableSorting: false, cell: ({ row }) => {
        if (row.original.status === "completed") return <StatusBadge status="completed" />;
        const stageId = getCurrentStage(row.original.stages);
        const stage = MANUFACTURING_STAGES.find(s => s.id === stageId);
        return <span className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{stage?.name || "—"}</span>;
      }
    },
    { accessorKey: "due_date", header: "Due Date", cell: ({ row }) => <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{formatDate(row.original.due_date)}</span> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <PageHeader
        title="Production"
        description={`${mockJobOrders.length} job orders · ${mockJobOrders.filter(j => j.status === "in_progress").length} in progress`}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
              <button
                onClick={() => setView("kanban")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === "kanban" ? "bg-[var(--primary)] text-white" : "hover:bg-[var(--secondary)]"}`}
                style={view !== "kanban" ? { color: "var(--muted-foreground)" } : undefined}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setView("list")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === "list" ? "bg-[var(--primary)] text-white" : "hover:bg-[var(--secondary)]"}`}
                style={view !== "list" ? { color: "var(--muted-foreground)" } : undefined}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
            <Button>
              <Plus className="w-3.5 h-3.5" />
              New Job Order
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <motion.div variants={item} className="flex items-center gap-3 mb-5">
        <SearchInput value={search} onChange={setSearch} placeholder="Search job orders..." />
        <div className="flex gap-1.5">
          {["all", "in_progress", "completed"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? "bg-[var(--primary)] text-white" : "hover:bg-[var(--secondary)]"}`}
              style={statusFilter !== s ? { color: "var(--muted-foreground)" } : undefined}
            >
              {s === "all" ? "All" : s === "in_progress" ? "In Progress" : "Completed"}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Kanban View */}
      {view === "kanban" && (
        <motion.div variants={item} className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {MANUFACTURING_STAGES.map((stage) => {
              const jobs = kanbanData[stage.key] || [];
              return (
                <div key={stage.key} className="w-56 flex-shrink-0">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>{stage.name}</span>
                    {jobs.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{jobs.length}</span>
                    )}
                  </div>
                  <div className="space-y-2 min-h-[100px]">
                    {jobs.map((jo) => (
                      <Card key={jo.id} className="cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 !p-3" onClick={() => setSelectedJO(jo)}>
                        <p className="text-xs font-mono font-semibold" style={{ color: "var(--primary)" }}>{jo.jo_number}</p>
                        <p className="text-sm font-medium mt-1 line-clamp-1" style={{ color: "var(--foreground)" }}>{jo.product}</p>
                        <p className="text-[10px] mt-1" style={{ color: "var(--muted-foreground)" }}>{jo.customer}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] font-medium" style={{ color: "var(--muted-foreground)" }}>{jo.quantity} pcs</span>
                          <div className="flex items-center gap-1">
                            <div className="w-10 h-1 rounded-full overflow-hidden" style={{ background: "var(--secondary)" }}>
                              <div className="h-full rounded-full" style={{ width: `${getProgress(jo.stages)}%`, background: "var(--primary)" }} />
                            </div>
                            <span className="text-[9px] font-bold" style={{ color: "var(--muted-foreground)" }}>{getProgress(jo.stages)}%</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                    {jobs.length === 0 && (
                      <div className="py-6 text-center">
                        <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>No items</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Completed column */}
            <div className="w-56 flex-shrink-0">
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Done</span>
                {(kanbanData["completed"]?.length || 0) > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {kanbanData["completed"]?.length}
                  </span>
                )}
              </div>
              <div className="space-y-2 min-h-[100px]">
                {(kanbanData["completed"] || []).map((jo) => (
                  <Card key={jo.id} className="cursor-pointer hover:shadow-md transition-all duration-200 !p-3 opacity-70" onClick={() => setSelectedJO(jo)}>
                    <p className="text-xs font-mono font-semibold text-emerald-600">{jo.jo_number}</p>
                    <p className="text-sm font-medium mt-1 line-clamp-1" style={{ color: "var(--foreground)" }}>{jo.product}</p>
                    <p className="text-[10px] mt-1" style={{ color: "var(--muted-foreground)" }}>{jo.customer}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* List View */}
      {view === "list" && (
        <motion.div variants={item}>
          <DataTable
            columns={listColumns}
            data={filtered}
            emptyMessage="No job orders found"
            searchPlaceholder="Search job orders..."
            onRowClick={(item) => setSelectedJO(item)}
            enableSelection
          />
        </motion.div>
      )}

      <JobOrderDetail jobOrder={selectedJO} open={!!selectedJO} onClose={() => setSelectedJO(null)} />
    </motion.div>
  );
}
