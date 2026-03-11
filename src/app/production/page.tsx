"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { LayoutGrid, List, Plus } from "lucide-react";
import { PageHeader, Button, Card, StatusBadge, InlineStatusSelect, SearchInput, Drawer, Input } from "@/components/ui/shared";
import { Stepper } from "@/components/ui/stepper";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { formatDate } from "@/lib/utils";
import { MANUFACTURING_STAGES, type JobStage, type StageStatus, getProgress, getCurrentStage } from "@/lib/stages";
import { JobOrderDetail, type JobOrder } from "@/components/details/job-order-detail";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/toast";
import { TableSkeleton, EmptyState } from "@/components/ui/shared";
import { DeleteConfirmation } from "@/components/shared/delete-confirmation";

// DB types
interface DBProductionOrder {
  id: string;
  job_number: string;
  product_name: string;
  quantity: number;
  start_date: string;
  end_date: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  notes: string | null;
  sales_order_id: string | null;
  production_stages: DBProductionStage[];
}

interface DBProductionStage {
  id: string;
  production_order_id: string;
  stage_number: number;
  stage_name: string;
  status: string;
  execution_type: string;
  vendor_id: string | null;
}

// Map DB status to frontend status
function mapStageStatus(dbStatus: string): StageStatus {
  switch (dbStatus) {
    case "Completed": return "completed";
    case "In Progress": return "in_progress";
    case "Pending":
    default: return "not_started";
  }
}

function mapOrderStatus(dbStatus: string): string {
  switch (dbStatus) {
    case "In Progress": return "in_progress";
    case "Completed": return "completed";
    case "Planned": return "in_progress";
    default: return dbStatus.toLowerCase().replace(" ", "_");
  }
}

// Convert DB record to frontend JobOrder
function toJobOrder(db: DBProductionOrder): JobOrder {
  const stages: JobStage[] = MANUFACTURING_STAGES.map((ms) => {
    const dbStage = db.production_stages?.find((s) => s.stage_number === ms.id);
    if (dbStage) {
      return {
        stageId: ms.id,
        status: mapStageStatus(dbStage.status),
        type: (dbStage.execution_type === "Vendor" ? "vendor" : "in-house") as "vendor" | "in-house",
      };
    }
    return {
      stageId: ms.id,
      status: "not_started" as StageStatus,
      type: ms.defaultType as "vendor" | "in-house",
    };
  });

  return {
    id: db.id,
    jo_number: db.job_number,
    so_number: db.sales_order_id || "—",
    customer: "",
    product: db.product_name,
    quantity: db.quantity || 0,
    start_date: db.start_date,
    due_date: db.end_date || "",
    status: mapOrderStatus(db.status || "Planned"),
    stages,
  };
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "tween" as const, duration: 0.3 } },
};

// --- DB-based number generation ---
import { getNextJONumber } from "@/lib/doc-numbers";

export default function ProductionPage() {
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"kanban" | "list">("list");
  const [selectedJO, setSelectedJO] = useState<JobOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  // Delete confirmation
  const [pendingDelete, setPendingDelete] = useState<JobOrder | null>(null);
  const confirmDeleteJO = async () => {
    if (!pendingDelete) return;
    // Delete stages first, then the order
    await supabase.from("production_stages").delete().eq("production_order_id", pendingDelete.id);
    await supabase.from("production_orders").delete().eq("id", pendingDelete.id);
    setSelectedJO(null);
    setPendingDelete(null);
    toast("success", "Job order deleted");
    fetchJobOrders();
  };

  const [formProduct, setFormProduct] = useState("");
  const [formQuantity, setFormQuantity] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [createStep, setCreateStep] = useState(0);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchJobOrders = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("production_orders")
        .select("*, production_stages(*)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      const mapped = (data || []).map((d) => toJobOrder(d as unknown as DBProductionOrder));
      setJobOrders(mapped);
    } catch (err) {
      console.error("Failed to fetch production orders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobOrders();
  }, [fetchJobOrders]);

  const handleCreate = async () => {
    const errors: Record<string, string> = {};
    if (!formProduct.trim()) errors.formProduct = "Product name is required";
    if (!formQuantity.trim() || parseInt(formQuantity) <= 0) errors.formQuantity = "Enter a valid quantity";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast("error", "Please fix errors before creating");
      return;
    }
    setFormErrors({});

    const joNumber = await getNextJONumber();

    // Insert production order
    const { data: order, error: orderError } = await supabase
      .from("production_orders")
      .insert({
        job_number: joNumber,
        product_name: formProduct,
        quantity: parseInt(formQuantity) || 1,
        start_date: new Date().toISOString().split("T")[0],
        end_date: formDueDate || null,
        status: "Planned",
        priority: "Medium",
      })
      .select()
      .single();

    if (orderError || !order) {
      toast("error", "Failed to create job order");
      return;
    }

    // Insert 10 default stages
    const stages = MANUFACTURING_STAGES.map((ms) => ({
      production_order_id: order.id,
      stage_number: ms.id,
      stage_name: ms.name,
      status: "Pending",
      execution_type: ms.defaultType === "vendor" ? "Vendor" : "In-House",
    }));

    const { error: stagesError } = await supabase
      .from("production_stages")
      .insert(stages);

    if (stagesError) {
      toast("error", "Job order created but failed to create stages");
    } else {
      toast("success", `Job Order ${joNumber} created with 10 stages`);
    }
    setShowCreateDialog(false);
    setCreateStep(0);
    setFormProduct("");
    setFormQuantity("");
    setFormDueDate("");
    setFormErrors({});
    fetchJobOrders();
  };

  const filtered = useMemo(() => {
    return jobOrders.filter((jo) => {
      const matchSearch = jo.jo_number.toLowerCase().includes(search.toLowerCase()) ||
        jo.product.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || jo.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter, jobOrders]);

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

  const listColumns = useMemo<ColumnDef<JobOrder, unknown>[]>(() => [
    { accessorKey: "jo_number", header: "JO #", cell: ({ row }) => <span className="font-mono font-semibold" style={{ color: "var(--primary)" }}>{row.original.jo_number}</span> },
    { accessorKey: "product", header: "Product" },
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
    { accessorKey: "due_date", header: "Due Date", cell: ({ row }) => <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{row.original.due_date ? formatDate(row.original.due_date) : "—"}</span> },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <InlineStatusSelect
          status={row.original.status}
          options={["planned", "in_progress", "completed", "cancelled"]}
          onChange={async (newStatus) => {
            const result = await supabase.from("production_orders").update({ status: newStatus }).eq("id", row.original.id);
            if (!result.error) {
              toast("success", "Status updated", `JO ${row.original.jo_number} is now ${newStatus}`);
              fetchJobOrders();
            } else {
              toast("error", "Failed to update status");
            }
          }}
        />
      )
    },
  ], [toast, fetchJobOrders]);

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <PageHeader
        title="Production"
        description={`${jobOrders.length} job orders · ${jobOrders.filter(j => j.status === "in_progress").length} in progress`}
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
            <Button onClick={() => setShowCreateDialog(true)}>
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

      {loading ? (
        <TableSkeleton rows={5} columns={5} />
      ) : (
        <>
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
              {filtered.length === 0 ? (
                <div className="py-8">
                  <EmptyState
                    icon={<List className="w-8 h-8" />}
                    title="No Job Orders Found"
                    description="You haven't created or planned any production yet."
                    action={
                      <Button onClick={() => setShowCreateDialog(true)}>
                        <Plus className="w-4 h-4" /> Create First Job Order
                      </Button>
                    }
                  />
                </div>
              ) : (
                <DataTable
                  columns={listColumns}
                  data={filtered}
                  enableColumnFilters
                  filterableColumns={["status"]}
                  emptyMessage="No job orders found"
                  searchPlaceholder="Search job orders..."
                  onRowClick={(item) => setSelectedJO(item)}
                  enableSelection
                />
              )}
            </motion.div>
          )}
        </>
      )}

      <JobOrderDetail
        jobOrder={selectedJO}
        open={!!selectedJO}
        onClose={() => setSelectedJO(null)}
        onDelete={(jo) => setPendingDelete(jo)}
        onStageUpdate={() => { fetchJobOrders(); setSelectedJO(null); }}
      />

      {/* Create Dialog */}
      <Drawer
        open={showCreateDialog}
        onClose={() => { setShowCreateDialog(false); setCreateStep(0); }}
        title="New Job Order"
        preventCloseOnBackdrop
        footer={
          <div className="flex justify-between items-center w-full">
            <Button variant="ghost" onClick={() => { setShowCreateDialog(false); setCreateStep(0); }}>Cancel</Button>
            <div className="flex gap-2">
              {createStep > 0 && <Button variant="secondary" onClick={() => setCreateStep(createStep - 1)}>Back</Button>}
              {createStep < 2 ? (
                <Button onClick={() => setCreateStep(createStep + 1)}>Next Step</Button>
              ) : (
                <Button onClick={handleCreate}>Create Job Order</Button>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          <Stepper steps={["Basic Info", "Quantities & Dates", "Review Stages"]} currentStep={createStep} className="px-4" />

          <div className="mt-8 px-2">
            {createStep === 0 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <Input label="Product Name *" placeholder="e.g. Mayo Scissors 6.5&quot; Straight" error={formErrors.formProduct} value={formProduct} onChange={(e) => { setFormProduct(e.target.value); if (formErrors.formProduct) setFormErrors({ ...formErrors, formProduct: "" }); }} />
                <div className="rounded-xl border p-4 bg-blue-50/50 dark:bg-blue-900/10" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">Standardized Production</p>
                  <p className="text-xs text-blue-600/80 dark:text-blue-300/80">
                    By default, this Job Order will be initialized with the 10 standard manufacturing stages for surgical instruments.
                  </p>
                </div>
              </div>
            )}

            {createStep === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Target Quantity *" type="number" placeholder="100" error={formErrors.formQuantity} value={formQuantity} onChange={(e) => { setFormQuantity(e.target.value); if (formErrors.formQuantity) setFormErrors({ ...formErrors, formQuantity: "" }); }} />
                  <Input label="Expected Completion Date" type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} />
                </div>
              </div>
            )}

            {createStep === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--secondary)" }}>
                  <p className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>Manufacturing Stages Overview</p>
                  <div className="space-y-2">
                    {MANUFACTURING_STAGES.map((stage, idx) => (
                      <div key={stage.id} className="flex justify-between items-center text-xs p-2 rounded-lg bg-[var(--background)] border" style={{ borderColor: 'var(--border)' }}>
                        <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{idx + 1}. {stage.name}</span>
                        <span className="px-2 py-0.5 rounded-full uppercase tracking-wider text-[9px] font-bold" style={{
                          background: stage.defaultType === 'vendor' ? 'var(--secondary)' : 'var(--primary)',
                          color: stage.defaultType === 'vendor' ? 'var(--foreground)' : 'white'
                        }}>
                          {stage.defaultType}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Drawer>

      <DeleteConfirmation
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDeleteJO}
        title={`Delete ${pendingDelete?.jo_number}?`}
        description="This will permanently delete this job order and all its stages. This action cannot be undone."
      />
    </motion.div>
  );
}
