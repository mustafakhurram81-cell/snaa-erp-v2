"use client";

import React from "react";
import { Drawer, Button, StatusBadge } from "@/components/ui/shared";
import { formatDate } from "@/lib/utils";
import { Play, CheckCircle2, Clock, Factory } from "lucide-react";

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
    [key: string]: unknown;
}

interface ProductionDetailProps {
    order: ProductionOrder | null;
    open: boolean;
    onClose: () => void;
}

const timeline = [
    { label: "Order created", date: "Feb 20, 2026", done: true },
    { label: "Materials allocated", date: "Feb 21, 2026", done: true },
    { label: "Production started", date: "Feb 22, 2026", done: true },
    { label: "Quality check", date: "Pending", done: false },
    { label: "Completed", date: "—", done: false },
];

export function ProductionDetail({ order, open, onClose }: ProductionDetailProps) {
    if (!order) return null;

    const progress = order.quantity > 0 ? Math.round((order.completed / order.quantity) * 100) : 0;

    return (
        <Drawer
            open={open}
            onClose={onClose}
            title="Production Order"
            width="max-w-xl"
            footer={
                <div className="flex justify-between">
                    <Button variant="secondary" onClick={onClose}>Close</Button>
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
                </div>
            }
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{order.po_number}</h3>
                    <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>{order.product}</p>
                </div>
                <div className="flex items-center gap-2">
                    <StatusBadge status={order.priority} />
                    <StatusBadge status={order.status} />
                </div>
            </div>

            {/* Progress Bar */}
            <div className="rounded-xl border p-4 mb-5" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Production Progress</p>
                    <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{progress}%</p>
                </div>
                <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: "var(--secondary)" }}>
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex justify-between mt-2">
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{order.completed} completed</span>
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{order.quantity} total</span>
                </div>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Sales Order</p>
                    <p className="text-sm font-medium mt-1" style={{ color: "var(--primary)" }}>{order.sales_order}</p>
                </div>
                <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Quantity</p>
                    <p className="text-sm font-medium mt-1" style={{ color: "var(--foreground)" }}>{order.quantity} units</p>
                </div>
                <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Start Date</p>
                    <p className="text-sm font-medium mt-1" style={{ color: "var(--foreground)" }}>{formatDate(order.start_date)}</p>
                </div>
                <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Due Date</p>
                    <p className="text-sm font-medium mt-1" style={{ color: "var(--foreground)" }}>{formatDate(order.due_date)}</p>
                </div>
            </div>

            {/* Timeline */}
            <div>
                <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>Timeline</h4>
                <div className="space-y-0">
                    {timeline.map((step, idx) => (
                        <div key={idx} className="flex gap-3">
                            <div className="flex flex-col items-center">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    step.done ? "bg-blue-600" : "border-2"
                                }`} style={!step.done ? { borderColor: "var(--border)" } : undefined}>
                                    {step.done ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                    ) : (
                                        <Clock className="w-3 h-3" style={{ color: "var(--muted-foreground)" }} />
                                    )}
                                </div>
                                {idx < timeline.length - 1 && (
                                    <div className="w-px h-8" style={{ background: step.done ? "#2563eb" : "var(--border)" }} />
                                )}
                            </div>
                            <div className="pb-6">
                                <p className={`text-sm ${step.done ? "font-medium" : ""}`} style={{ color: step.done ? "var(--foreground)" : "var(--muted-foreground)" }}>{step.label}</p>
                                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{step.date}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Drawer>
    );
}
