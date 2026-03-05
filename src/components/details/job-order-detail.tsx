"use client";

import React, { useState } from "react";
import { Drawer, Button, StatusBadge, DrawerTabs, Input, DrawerSection, DrawerStatCard } from "@/components/ui/shared";
import { formatDate, formatCurrency } from "@/lib/utils";
import { MANUFACTURING_STAGES, type JobStage, type StageStatus, type StageType, getProgress } from "@/lib/stages";
import { useToast } from "@/components/ui/toast";
import { supabase } from "@/lib/supabase";
import { LiveActivityLog } from "@/components/shared/activity-log";
import {
    Hammer, Flame, CircleDot, FileSliders, Thermometer, Sparkles,
    Wrench, ShieldCheck, PaintBucket, Package as PackageIcon,
    CheckCircle2, Clock, Play, SkipForward, Building2, Store,
    Plus, ChevronDown, ChevronUp, ShoppingCart, ImageIcon, Trash2
} from "lucide-react";

const stageIcons: Record<string, React.ReactNode> = {
    die_making: <Hammer className="w-4 h-4" />,
    forging: <Flame className="w-4 h-4" />,
    grinding: <CircleDot className="w-4 h-4" />,
    filing: <FileSliders className="w-4 h-4" />,
    heat_treatment: <Thermometer className="w-4 h-4" />,
    electroplating: <Sparkles className="w-4 h-4" />,
    assembly: <Wrench className="w-4 h-4" />,
    quality_control: <ShieldCheck className="w-4 h-4" />,
    finishing: <PaintBucket className="w-4 h-4" />,
    packaging: <PackageIcon className="w-4 h-4" />,
};

const statusColors: Record<StageStatus, string> = {
    not_started: "text-zinc-400 bg-zinc-100 dark:bg-zinc-800",
    in_progress: "text-blue-600 bg-blue-50 dark:bg-blue-900/30",
    completed: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30",
    skipped: "text-zinc-400 bg-zinc-100 dark:bg-zinc-800 line-through",
};

const statusIcons: Record<StageStatus, React.ReactNode> = {
    not_started: <Clock className="w-3.5 h-3.5" />,
    in_progress: <Play className="w-3.5 h-3.5" />,
    completed: <CheckCircle2 className="w-3.5 h-3.5" />,
    skipped: <SkipForward className="w-3.5 h-3.5" />,
};

export interface JobOrder {
    id: string;
    jo_number: string;
    so_number: string;
    customer: string;
    product: string;
    quantity: number;
    start_date: string;
    due_date: string;
    status: string;
    stages: JobStage[];
}

interface JobOrderDetailProps {
    jobOrder: JobOrder | null;
    open: boolean;
    onClose: () => void;
    onDelete?: (jobOrder: JobOrder) => void;
    onStageUpdate?: () => void;
}

// Line item for PO creation from job
interface POLineItem {
    stageId: number;
    stageName: string;
    vendor: string;
    quantity: number;
    unit_cost: number;
    selected: boolean;
    alreadyOrdered: boolean;
}

export function JobOrderDetail({ jobOrder, open, onClose, onDelete, onStageUpdate }: JobOrderDetailProps) {
    if (!jobOrder) return null;
    const { toast } = useToast();
    const [expandedStage, setExpandedStage] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState("stages");
    const [showPOCreation, setShowPOCreation] = useState(false);
    const [poLineItems, setPOLineItems] = useState<POLineItem[]>([]);
    const [poVendor, setPOVendor] = useState("");
    const [poExpectedDate, setPOExpectedDate] = useState("");
    const progress = getProgress(jobOrder.stages);

    const handleStartStage = async (stageId: number) => {
        const stage = MANUFACTURING_STAGES.find(s => s.id === stageId);
        const today = new Date().toISOString().split("T")[0];
        // Update production_stages in DB
        const { error } = await supabase
            .from("production_stages")
            .update({ status: "In Progress", start_date: today })
            .eq("production_order_id", jobOrder.id)
            .eq("stage_number", stageId);
        if (error) {
            toast("error", "Failed to start stage");
            return;
        }
        toast("info", "Stage started", `${stage?.name} is now in progress`);
        if (onStageUpdate) onStageUpdate();
    };

    const handleCompleteStage = async (stageId: number) => {
        const stage = MANUFACTURING_STAGES.find(s => s.id === stageId);
        const today = new Date().toISOString().split("T")[0];
        const { error } = await supabase
            .from("production_stages")
            .update({ status: "Completed", completed_date: today })
            .eq("production_order_id", jobOrder.id)
            .eq("stage_number", stageId);
        if (error) {
            toast("error", "Failed to complete stage");
            return;
        }
        // Check if all stages are now completed
        const { data: allStages } = await supabase
            .from("production_stages")
            .select("status")
            .eq("production_order_id", jobOrder.id);
        const allDone = allStages && allStages.every((s: any) => s.status === "Completed" || s.status === "Skipped");
        if (allDone) {
            await supabase.from("production_orders").update({ status: "Completed" }).eq("id", jobOrder.id);
            toast("success", "Job order completed", `All stages for ${jobOrder.jo_number} are done!`);
        } else {
            toast("success", "Stage completed", `${stage?.name} marked as complete`);
        }
        if (onStageUpdate) onStageUpdate();
    };

    const handleCreatePO = (stageId: number, vendor: string) => {
        const stage = MANUFACTURING_STAGES.find(s => s.id === stageId);
        toast("success", "Purchase Order created", `PO created for ${vendor} — ${stage?.name}`);
    };

    // Open PO creation drawer with all job items
    const handleOpenPOCreation = () => {
        const items: POLineItem[] = jobOrder.stages
            .filter(s => s.type === "vendor")
            .map(s => {
                const stage = MANUFACTURING_STAGES.find(ms => ms.id === s.stageId);
                const alreadyOrdered = !!s.poNumber;
                return {
                    stageId: s.stageId,
                    stageName: stage?.name || `Stage ${s.stageId}`,
                    vendor: s.vendor || "",
                    quantity: jobOrder.quantity,
                    unit_cost: 0,
                    selected: false,
                    alreadyOrdered,
                };
            });

        // Sort: available items first, already ordered at bottom
        items.sort((a, b) => Number(a.alreadyOrdered) - Number(b.alreadyOrdered));

        setPOLineItems(items);
        setPOVendor("");
        setPOExpectedDate("");
        setShowPOCreation(true);
    };

    const toggleLineItem = (stageId: number) => {
        setPOLineItems(poLineItems.map(li =>
            li.stageId === stageId && !li.alreadyOrdered
                ? { ...li, selected: !li.selected }
                : li
        ));
    };

    const handleSubmitPO = () => {
        const selected = poLineItems.filter(li => li.selected);
        if (selected.length === 0) { toast("error", "Select at least one item"); return; }
        if (!poVendor.trim()) { toast("error", "Please enter a vendor"); return; }

        toast("success", "Purchase Order created", `PO created for ${poVendor} with ${selected.length} item(s) from ${jobOrder.jo_number}`);
        setShowPOCreation(false);
    };

    return (
        <>
            <Drawer
                open={open}
                onClose={onClose}
                title="Job Order Details"
                width="max-w-2xl"
                footer={
                    <div className="flex justify-between">
                        <div className="flex gap-2">
                            <Button variant="secondary" onClick={onClose}>Close</Button>
                            {onDelete && (
                                <Button variant="secondary" onClick={() => onDelete(jobOrder)} className="!text-red-500 hover:!bg-red-50 dark:hover:!bg-red-900/20">
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {jobOrder.status !== "completed" && (
                                <>
                                    <Button variant="secondary" onClick={handleOpenPOCreation}>
                                        <ShoppingCart className="w-3.5 h-3.5" />
                                        Create Purchase Order
                                    </Button>
                                    <Button onClick={() => toast("success", "Job Order completed", `${jobOrder.jo_number} marked as complete`)}>
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Complete JO
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                }
            >
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                        <Hammer className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{jobOrder.jo_number}</h3>
                        <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>{jobOrder.product}</p>
                    </div>
                    <StatusBadge status={jobOrder.status} />
                </div>

                {/* Meta Stats */}
                <DrawerSection label="Order Overview">
                    <div className="grid grid-cols-4 gap-3">
                        <DrawerStatCard label="Sales Order" value={jobOrder.so_number} accent="blue" />
                        <DrawerStatCard label="Customer" value={jobOrder.customer} accent="violet" />
                        <DrawerStatCard label="Quantity" value={`${jobOrder.quantity} pcs`} accent="emerald" />
                        <DrawerStatCard label="Due Date" value={formatDate(jobOrder.due_date)} accent="rose" />
                    </div>
                </DrawerSection>

                {/* Progress bar */}
                <DrawerSection label="Production Status">
                    <div className="mb-2">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>Overall Completion</p>
                            <p className="text-xs font-bold" style={{ color: "var(--primary)" }}>{progress}%</p>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--secondary)" }}>
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${progress}%`, background: progress === 100 ? "#10b981" : "var(--primary)" }}
                            />
                        </div>
                    </div>
                </DrawerSection>

                {/* Tabs */}
                <DrawerTabs
                    tabs={[
                        { key: "stages", label: "Manufacturing Stages", count: MANUFACTURING_STAGES.length },
                        { key: "activity", label: "Activity" },
                    ]}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                />

                {activeTab === "stages" && (
                    <div className="space-y-1.5">
                        {MANUFACTURING_STAGES.map((stage) => {
                            const jobStage = jobOrder.stages.find(s => s.stageId === stage.id) || {
                                stageId: stage.id, status: "not_started" as StageStatus, type: stage.defaultType as StageType
                            };
                            const isExpanded = expandedStage === stage.id;

                            return (
                                <div key={stage.id} className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                                    {/* Stage header */}
                                    <button
                                        onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                                        className="w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--secondary)]"
                                    >
                                        {/* Stage number */}
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${jobStage.status === "completed" ? "bg-emerald-500 text-white" :
                                            jobStage.status === "in_progress" ? "bg-blue-500 text-white" :
                                                "border-2 text-[var(--muted-foreground)]"
                                            }`} style={jobStage.status === "not_started" ? { borderColor: "var(--border)" } : undefined}>
                                            {jobStage.status === "completed" ? <CheckCircle2 className="w-3.5 h-3.5" /> : stage.id}
                                        </div>

                                        {/* Stage info */}
                                        <div className="flex-1 text-left">
                                            <p className={`text-sm font-medium ${jobStage.status === "skipped" ? "line-through opacity-50" : ""}`}
                                                style={{ color: "var(--foreground)" }}>{stage.name}</p>
                                        </div>

                                        {/* Type badge */}
                                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${jobStage.type === "vendor" ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                            "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                            }`}>
                                            {jobStage.type === "vendor" ? <Store className="w-2.5 h-2.5" /> : <Building2 className="w-2.5 h-2.5" />}
                                            {jobStage.type === "vendor" ? (jobStage.vendor || "Vendor") : "In-house"}
                                        </span>

                                        {/* Status */}
                                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[jobStage.status]}`}>
                                            {statusIcons[jobStage.status]}
                                            {jobStage.status.replace("_", " ")}
                                        </span>

                                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} /> :
                                            <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />}
                                    </button>

                                    {/* Expanded content */}
                                    {isExpanded && (
                                        <div className="px-4 py-3 border-t" style={{ borderColor: "var(--border)", background: "var(--secondary)" }}>
                                            <p className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>{stage.description}</p>

                                            {jobStage.startDate && (
                                                <div className="flex gap-4 mb-3">
                                                    <div>
                                                        <p className="text-[10px] font-semibold uppercase" style={{ color: "var(--muted-foreground)" }}>Started</p>
                                                        <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{formatDate(jobStage.startDate)}</p>
                                                    </div>
                                                    {jobStage.endDate && (
                                                        <div>
                                                            <p className="text-[10px] font-semibold uppercase" style={{ color: "var(--muted-foreground)" }}>Completed</p>
                                                            <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{formatDate(jobStage.endDate)}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {jobStage.poNumber && (
                                                <div className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg" style={{ background: "var(--card)", color: "var(--primary)" }}>
                                                    PO: {jobStage.poNumber}
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="flex gap-2">
                                                {jobStage.status === "not_started" && (
                                                    <Button size="sm" onClick={() => handleStartStage(stage.id)}>
                                                        <Play className="w-3 h-3" /> Start
                                                    </Button>
                                                )}
                                                {jobStage.status === "in_progress" && (
                                                    <Button size="sm" onClick={() => handleCompleteStage(stage.id)}>
                                                        <CheckCircle2 className="w-3 h-3" /> Complete
                                                    </Button>
                                                )}
                                                {jobStage.type === "vendor" && !jobStage.poNumber && jobStage.status !== "completed" && (
                                                    <Button size="sm" variant="secondary" onClick={() => handleCreatePO(stage.id, jobStage.vendor || "vendor")}>
                                                        <Plus className="w-3 h-3" /> Create PO
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeTab === "activity" && (
                    <LiveActivityLog entityType="production_order" entityId={jobOrder.id} />
                )}
            </Drawer>

            {/* PO Creation Sub-Drawer */}
            <Drawer
                open={showPOCreation}
                onClose={() => setShowPOCreation(false)}
                title={`Create PO from ${jobOrder.jo_number}`}
                width="max-w-xl"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setShowPOCreation(false)}>Cancel</Button>
                        <Button onClick={handleSubmitPO}>
                            <ShoppingCart className="w-3.5 h-3.5" />
                            Create Purchase Order
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    {/* PO info */}
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Vendor *" value={poVendor} onChange={(e) => setPOVendor(e.target.value)} placeholder="Vendor name" />
                        <Input label="Expected Delivery" type="date" value={poExpectedDate} onChange={(e) => setPOExpectedDate(e.target.value)} />
                    </div>

                    <div className="rounded-xl border p-3 mb-2" style={{ borderColor: "var(--border)", background: "var(--secondary)" }}>
                        <p className="text-xs font-semibold mb-1" style={{ color: "var(--foreground)" }}>
                            {jobOrder.product}
                        </p>
                        <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                            {jobOrder.jo_number} · {jobOrder.quantity} pcs · {jobOrder.customer}
                        </p>
                    </div>

                    {/* Items selection */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Job Items (Stages)</h4>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--secondary)", color: "var(--primary)" }}>
                                {poLineItems.filter(li => li.selected).length} selected
                            </span>
                        </div>

                        <div className="space-y-1.5">
                            {poLineItems.map((li) => (
                                <button
                                    key={li.stageId}
                                    onClick={() => toggleLineItem(li.stageId)}
                                    disabled={li.alreadyOrdered}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${li.selected ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20" :
                                        li.alreadyOrdered ? "opacity-50 cursor-not-allowed" : "hover:bg-[var(--secondary)]"
                                        }`}
                                    style={{ borderColor: li.selected ? undefined : "var(--border)" }}
                                >
                                    {/* Checkbox */}
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${li.selected ? "bg-blue-500 border-blue-500 text-white" :
                                        li.alreadyOrdered ? "bg-zinc-200 border-zinc-300 dark:bg-zinc-700 dark:border-zinc-600" : "border-zinc-300 dark:border-zinc-600"
                                        }`}>
                                        {li.selected && <CheckCircle2 className="w-3 h-3" />}
                                        {li.alreadyOrdered && !li.selected && <span className="text-[8px] font-bold text-zinc-500">✓</span>}
                                    </div>

                                    {/* Image placeholder */}
                                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                        <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />
                                    </div>

                                    {/* Stage info */}
                                    <div className="flex-1">
                                        <p className={`text-sm font-medium ${li.alreadyOrdered ? "line-through" : ""}`}
                                            style={{ color: "var(--foreground)" }}>
                                            {li.stageName}
                                        </p>
                                        <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                                            {li.vendor || "No vendor assigned"} · {li.quantity} pcs
                                        </p>
                                    </div>

                                    {/* Already ordered badge */}
                                    {li.alreadyOrdered && (
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                            PO Created
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </Drawer>
        </>
    );
}
