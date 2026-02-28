"use client";

import React, { useState } from "react";
import { Drawer, Button, StatusBadge } from "@/components/ui/shared";
import { formatDate } from "@/lib/utils";
import { MANUFACTURING_STAGES, type JobStage, type StageStatus, type StageType, getProgress } from "@/lib/stages";
import { useToast } from "@/components/ui/toast";
import { ActivityLog, getMockActivities } from "@/components/shared/activity-log";
import {
    Hammer, Flame, CircleDot, FileSliders, Thermometer, Sparkles,
    Wrench, ShieldCheck, PaintBucket, Package as PackageIcon,
    CheckCircle2, Clock, Play, SkipForward, Building2, Store,
    Plus, ChevronDown, ChevronUp
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
}

export function JobOrderDetail({ jobOrder, open, onClose }: JobOrderDetailProps) {
    if (!jobOrder) return null;
    const { toast } = useToast();
    const [expandedStage, setExpandedStage] = useState<number | null>(null);
    const progress = getProgress(jobOrder.stages);

    const handleStartStage = (stageId: number) => {
        const stage = MANUFACTURING_STAGES.find(s => s.id === stageId);
        toast("info", "Stage started", `${stage?.name} is now in progress`);
    };

    const handleCompleteStage = (stageId: number) => {
        const stage = MANUFACTURING_STAGES.find(s => s.id === stageId);
        toast("success", "Stage completed", `${stage?.name} marked as complete`);
    };

    const handleCreatePO = (stageId: number, vendor: string) => {
        const stage = MANUFACTURING_STAGES.find(s => s.id === stageId);
        toast("success", "Purchase Order created", `PO created for ${vendor} — ${stage?.name}`);
    };

    return (
        <Drawer
            open={open}
            onClose={onClose}
            title="Job Order Details"
            width="max-w-2xl"
            footer={
                <div className="flex justify-between">
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                    <div className="flex gap-2">
                        {jobOrder.status !== "completed" && (
                            <Button onClick={() => toast("success", "Job Order completed", `${jobOrder.jo_number} marked as complete`)}>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Complete JO
                            </Button>
                        )}
                    </div>
                </div>
            }
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{jobOrder.jo_number}</h3>
                    <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>{jobOrder.product}</p>
                </div>
                <StatusBadge status={jobOrder.status} />
            </div>

            {/* Meta */}
            <div className="grid grid-cols-4 gap-3 mb-5">
                <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Sales Order</p>
                    <p className="text-sm font-semibold mt-1" style={{ color: "var(--primary)" }}>{jobOrder.so_number}</p>
                </div>
                <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Customer</p>
                    <p className="text-sm font-medium mt-1" style={{ color: "var(--foreground)" }}>{jobOrder.customer}</p>
                </div>
                <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Quantity</p>
                    <p className="text-sm font-medium mt-1" style={{ color: "var(--foreground)" }}>{jobOrder.quantity} pcs</p>
                </div>
                <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Due Date</p>
                    <p className="text-sm font-medium mt-1" style={{ color: "var(--foreground)" }}>{formatDate(jobOrder.due_date)}</p>
                </div>
            </div>

            {/* Progress bar */}
            <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>Overall Progress</p>
                    <p className="text-xs font-bold" style={{ color: "var(--primary)" }}>{progress}%</p>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--secondary)" }}>
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress}%`, background: progress === 100 ? "#10b981" : "var(--primary)" }}
                    />
                </div>
            </div>

            {/* Manufacturing Stages */}
            <div>
                <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>Manufacturing Stages</h4>
                <div className="space-y-1.5">
                    {MANUFACTURING_STAGES.map((stage) => {
                        const jobStage = jobOrder.stages.find(s => s.stageId === stage.id) || {
                            stageId: stage.id, status: "not_started" as StageStatus, type: stage.defaultType as StageType
                        };
                        const isExpanded = expandedStage === stage.id;
                        const isCurrentOrPast = jobStage.status === "in_progress" || jobStage.status === "completed";

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
            </div>

            {/* Activity Log */}
            <div className="mt-5">
                <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>Activity</h4>
                <ActivityLog entries={getMockActivities("Job Order", jobOrder.id)} />
            </div>
        </Drawer>
    );
}
