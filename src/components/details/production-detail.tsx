"use client";

import React, { useState, useEffect } from "react";
import { Drawer, Button, StatusBadge, DrawerTabs, Input, DrawerSection, DrawerStatCard, Select } from "@/components/ui/shared";
import { formatDate } from "@/lib/utils";
import { Play, CheckCircle2, Factory, Edit3, Save, X, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { DeleteConfirmation } from "@/components/shared/delete-confirmation";
import { LiveActivityLog } from "@/components/shared/activity-log";
import { supabase } from "@/lib/supabase";
import { RoleGuard } from "@/components/shared/role-guard";
import { MANUFACTURING_STAGES } from "@/lib/stages";

interface ProductionOrder {
    id: string;
    po_number: string;
    product: string;
    sales_order: string;
    quantity: number;
    completed: number;
    start_date: string;
    due_date: string;
    status: string;
    priority: string;
}

interface ProductionDetailProps {
    order: ProductionOrder | null;
    open: boolean;
    onClose: () => void;
    onUpdate?: (order: ProductionOrder) => void;
    onDelete?: (order: ProductionOrder) => void;
}

interface LiveStage {
    id: string;
    stage_number: number;
    stage_name: string;
    status: string | null;
    execution_type: string | null;
    vendor_id: string | null;
    created_at: string | null;
    updated_at: string | null;
}

const stageStatusColors: Record<string, string> = {
    not_started: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
    pending: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
    in_progress: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    completed: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    skipped: "bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

export function ProductionDetail({ order, open, onClose, onUpdate, onDelete }: ProductionDetailProps) {
    const { toast } = useToast();
    const [showDelete, setShowDelete] = useState(false);
    const [activeTab, setActiveTab] = useState("stages");
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState(order ? { ...order } : {} as ProductionOrder);
    const [liveStages, setLiveStages] = useState<LiveStage[]>([]);
    const [loadingStages, setLoadingStages] = useState(false);

    useEffect(() => {
        if (order) { setEditData({ ...order }); setIsEditing(false); }
    }, [order]);

    // Fetch real production stages for this production order
    useEffect(() => {
        if (!order?.id || !open) return;
        setLoadingStages(true);
        supabase
            .from("production_stages")
            .select("*")
            .eq("production_order_id", order.id)
            .order("stage_number", { ascending: true })
            .then(({ data }) => {
                setLiveStages(data || []);
                setLoadingStages(false);
            });
    }, [order?.id, open]);

    if (!order) return null;

    const progress = order.quantity > 0 ? Math.round((order.completed / order.quantity) * 100) : 0;
    const completedStages = liveStages.filter(s => s.status === "completed").length;
    const totalStages = liveStages.length || MANUFACTURING_STAGES.length;
    const stageProgress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

    const handleSave = async () => {
        if (onUpdate) onUpdate(editData);
        setIsEditing(false);
        toast("success", "Production order updated", `${editData.po_number} saved`);
        const { logActivity } = await import("@/lib/activity-logger");
        logActivity({ entityType: "production_order", entityId: order.id, action: "Production order updated", details: order.po_number });
    };
    const handleCancel = () => { setEditData({ ...order }); setIsEditing(false); };

    const tabs = [
        { key: "stages", label: "Manufacturing Stages", count: liveStages.length || undefined },
        { key: "activity", label: "Activity" },
    ];

    // Get the matching manufacturing stage definition for icon/description
    const getStageInfo = (stageName: string) => {
        return MANUFACTURING_STAGES.find(s => s.name.toLowerCase() === stageName.toLowerCase());
    };

    return (
        <Drawer
            open={open}
            onClose={() => { handleCancel(); onClose(); }}
            title={isEditing ? "Edit Production Order" : "Production Order"}
            width="max-w-2xl"
            footer={
                <div className="flex justify-between">
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => { handleCancel(); onClose(); }}>Close</Button>
                        {isEditing ? (
                            <>
                                <Button variant="secondary" onClick={handleCancel}><X className="w-3.5 h-3.5" /> Cancel</Button>
                                <Button onClick={handleSave}><Save className="w-3.5 h-3.5" /> Save</Button>
                            </>
                        ) : (
                            <>
                                <Button variant="secondary" onClick={() => setIsEditing(true)}><Edit3 className="w-3.5 h-3.5" /> Edit</Button>
                                <RoleGuard minRole="admin"><button onClick={() => setShowDelete(true)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></RoleGuard>
                            </>
                        )}
                    </div>
                    {!isEditing && (
                        <div className="flex gap-2">
                            {order.status === "planned" && (
                                <Button>
                                    <Play className="w-3.5 h-3.5" />
                                    Start Production
                                </Button>
                            )}
                            {order.status === "in_progress" && (
                                <Button>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Mark Complete
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            }
        >
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                    <Factory className="w-8 h-8" />
                </div>
                <div className="flex-1">
                    {isEditing ? (
                        <div className="space-y-2">
                            <Input value={editData.po_number} onChange={(e) => setEditData({ ...editData, po_number: e.target.value })} placeholder="Order number" />
                            <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>{order.product}</p>
                        </div>
                    ) : (
                        <>
                            <h3 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{order.po_number}</h3>
                            <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>{order.product}</p>
                        </>
                    )}
                </div>
                <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={order.priority} />
                    {isEditing ? (
                        <Select
                            value={editData.status}
                            onChange={(e: any) => setEditData({ ...editData, status: e.target.value })}
                            options={[
                                { value: "planned", label: "Planned" },
                                { value: "in_progress", label: "In Progress" },
                                { value: "completed", label: "Completed" },
                                { value: "cancelled", label: "Cancelled" },
                            ]}
                            className="h-8 px-3 rounded-lg border text-xs font-medium bg-[var(--background)] border-[var(--border)] text-[var(--foreground)]"
                        />
                    ) : (
                        <StatusBadge status={order.status} />
                    )}
                </div>
            </div>

            {/* Progress Bars */}
            <DrawerSection label="Production Velocity">
                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>Quantity Progress</p>
                            <p className="text-xs font-bold" style={{ color: "var(--foreground)" }}>{progress}%</p>
                        </div>
                        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--secondary)" }}>
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-2">
                            <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{order.completed} completed</span>
                            <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{order.quantity} total</span>
                        </div>
                    </div>
                    <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>Stage Progress</p>
                            <p className="text-xs font-bold" style={{ color: "var(--foreground)" }}>{stageProgress}%</p>
                        </div>
                        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--secondary)" }}>
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
                                style={{ width: `${stageProgress}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-2">
                            <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{completedStages} completed</span>
                            <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{totalStages} stages</span>
                        </div>
                    </div>
                </div>
            </DrawerSection>

            {/* Order Info Stats */}
            <DrawerSection label="Order Details">
                <div className="grid grid-cols-2 gap-3">
                    <DrawerStatCard label="Sales Order" value={order.sales_order} accent="violet" />
                    <DrawerStatCard label="Units" value={order.quantity} accent="emerald" />
                    <DrawerStatCard label="Start Date" value={formatDate(order.start_date)} accent="blue" />
                    <DrawerStatCard label="Due Date" value={formatDate(order.due_date)} accent="rose" />
                </div>
            </DrawerSection>

            {/* Tabs (hidden during edit) */}
            {!isEditing && (
                <>
                    <DrawerTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

                    {activeTab === "stages" && (
                        <div>
                            {loadingStages ? (
                                <div className="py-8 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>Loading stages...</div>
                            ) : liveStages.length === 0 ? (
                                <div className="py-8 text-center">
                                    <Factory className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--muted-foreground)" }} />
                                    <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No manufacturing stages found</p>
                                    <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Stages will appear when this order is started</p>
                                </div>
                            ) : (
                                <div className="space-y-0">
                                    {liveStages.map((stage, idx) => {
                                        const stageInfo = getStageInfo(stage.stage_name);
                                        const statusNorm = (stage.status || "not_started").toLowerCase().replace(/[\s-]/g, "_");
                                        const isComplete = statusNorm === "completed";
                                        const isActive = statusNorm === "in_progress";
                                        return (
                                            <div key={stage.id} className="flex gap-3">
                                                <div className="flex flex-col items-center">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${isComplete ? "bg-emerald-600 text-white" :
                                                        isActive ? "bg-blue-600 text-white animate-pulse" :
                                                            "border-2"
                                                        }`} style={!isComplete && !isActive ? { borderColor: "var(--border)", color: "var(--muted-foreground)" } : undefined}>
                                                        {isComplete ? (
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        ) : isActive ? (
                                                            <Play className="w-3.5 h-3.5" />
                                                        ) : (
                                                            stage.stage_number
                                                        )}
                                                    </div>
                                                    {idx < liveStages.length - 1 && (
                                                        <div className="w-px h-8 mt-1" style={{ background: isComplete ? "#059669" : "var(--border)" }} />
                                                    )}
                                                </div>
                                                <div className="pb-4 flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <p className={`text-sm ${isComplete || isActive ? "font-semibold" : ""}`} style={{ color: isComplete || isActive ? "var(--foreground)" : "var(--muted-foreground)" }}>
                                                            {stage.stage_name}
                                                        </p>
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${stageStatusColors[statusNorm] || stageStatusColors.not_started}`}>
                                                            {(stage.status || "Not Started").replace(/_/g, " ")}
                                                        </span>
                                                    </div>
                                                    {stageInfo && (
                                                        <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{stageInfo.description}</p>
                                                    )}
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>
                                                            {stage.execution_type === "in-house" ? "🏭 In-house" : "🔧 Vendor"}
                                                        </span>
                                                        {stage.updated_at && (
                                                            <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>Updated {formatDate(stage.updated_at)}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "activity" && (
                        <LiveActivityLog entityType="production_order" entityId={order.id} />
                    )}
                </>
            )}

            <DeleteConfirmation
                open={showDelete}
                onClose={() => setShowDelete(false)}
                onConfirm={async () => { setShowDelete(false); if (onDelete) { onDelete(order); } const { logActivity } = await import("@/lib/activity-logger"); logActivity({ entityType: "production_order", entityId: order.id, action: "Production order deleted", details: order.po_number }); toast("success", "Order deleted", `${order.po_number} deleted`); onClose(); }}
                title={`Delete ${order.po_number}?`}
                description="This action cannot be undone. The production order and all stage data will be permanently removed."
            />
        </Drawer>
    );
}
