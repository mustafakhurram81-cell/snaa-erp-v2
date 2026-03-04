"use client";

import React, { useState, useEffect } from "react";
import { FileText, Edit2, Trash2, ArrowRight, DollarSign, Truck, CheckCircle2, Clock, User } from "lucide-react";
import { supabase } from "@/lib/supabase";

export interface ActivityEntry {
    id: string;
    action: string;
    user: string;
    timestamp: string;
    type: "create" | "update" | "delete" | "status" | "payment" | "convert";
}

const typeIcons: Record<string, React.ReactNode> = {
    create: <FileText className="w-3.5 h-3.5 text-emerald-500" />,
    update: <Edit2 className="w-3.5 h-3.5 text-blue-500" />,
    delete: <Trash2 className="w-3.5 h-3.5 text-red-500" />,
    status: <ArrowRight className="w-3.5 h-3.5 text-amber-500" />,
    payment: <DollarSign className="w-3.5 h-3.5 text-emerald-500" />,
    convert: <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />,
};

const typeDot: Record<string, string> = {
    create: "bg-emerald-500",
    update: "bg-blue-500",
    delete: "bg-red-500",
    status: "bg-amber-500",
    payment: "bg-emerald-500",
    convert: "bg-blue-500",
};

function formatTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function guessType(action: string): "create" | "update" | "delete" | "status" | "payment" | "convert" {
    const a = action.toLowerCase();
    if (a.includes("created") || a.includes("insert")) return "create";
    if (a.includes("deleted") || a.includes("removed")) return "delete";
    if (a.includes("status") || a.includes("stage") || a.includes("started") || a.includes("completed")) return "status";
    if (a.includes("payment") || a.includes("paid")) return "payment";
    if (a.includes("convert")) return "convert";
    return "update";
}

export function ActivityLog({ entries }: { entries: ActivityEntry[] }) {
    if (entries.length === 0) {
        return (
            <p className="text-sm py-6 text-center" style={{ color: "var(--muted-foreground)" }}>
                No activity yet
            </p>
        );
    }

    return (
        <div className="space-y-0">
            {entries.map((entry, idx) => (
                <div key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${typeDot[entry.type]} bg-opacity-15`}
                            style={{ background: "var(--secondary)" }}
                        >
                            {typeIcons[entry.type]}
                        </div>
                        {idx < entries.length - 1 && (
                            <div className="w-px h-full min-h-[24px]" style={{ background: "var(--border)" }} />
                        )}
                    </div>
                    <div className="pb-4 flex-1">
                        <p className="text-sm" style={{ color: "var(--foreground)" }}>{entry.action}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] flex items-center gap-1" style={{ color: "var(--muted-foreground)" }}>
                                <User className="w-2.5 h-2.5" />
                                {entry.user}
                            </span>
                            <span className="text-[10px] flex items-center gap-1" style={{ color: "var(--muted-foreground)" }}>
                                <Clock className="w-2.5 h-2.5" />
                                {entry.timestamp}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * Live activity log that fetches from the activity_logs table.
 * Use this instead of getMockActivities() for real data.
 */
export function LiveActivityLog({ entityType, entityId }: { entityType: string; entityId: string }) {
    const [entries, setEntries] = useState<ActivityEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetch() {
            const { data } = await supabase
                .from("activity_logs")
                .select("*")
                .eq("entity_type", entityType.toLowerCase().replace(/ /g, "_"))
                .eq("entity_id", entityId)
                .order("created_at", { ascending: false })
                .limit(20);

            if (data && data.length > 0) {
                setEntries(data.map((log: any) => ({
                    id: log.id,
                    action: `${log.action}${log.details ? ` — ${log.details}` : ""}`,
                    user: log.user_email || "System",
                    timestamp: formatTimeAgo(log.created_at),
                    type: guessType(log.action),
                })));
            }
            setLoading(false);
        }
        fetch();
    }, [entityType, entityId]);

    if (loading) {
        return <p className="text-xs py-4 text-center" style={{ color: "var(--muted-foreground)" }}>Loading activity...</p>;
    }

    if (entries.length === 0) {
        return <p className="text-sm py-6 text-center" style={{ color: "var(--muted-foreground)" }}>No activity recorded yet</p>;
    }

    return <ActivityLog entries={entries} />;
}

// Backward-compatible mock for fallback
export function getMockActivities(type: string, id: string): ActivityEntry[] {
    return [
        { id: "1", action: `${type} created`, user: "Mustafa K.", timestamp: "Feb 20, 2026 09:15", type: "create" },
        { id: "2", action: `Status changed to "In Progress"`, user: "Mustafa K.", timestamp: "Feb 21, 2026 14:30", type: "status" },
        { id: "3", action: "Details updated — quantity adjusted", user: "Ali R.", timestamp: "Feb 23, 2026 11:00", type: "update" },
        { id: "4", action: "Payment of $12,500 recorded", user: "Accounting", timestamp: "Feb 24, 2026 16:45", type: "payment" },
    ];
}

