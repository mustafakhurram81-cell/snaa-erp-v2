"use client";

import React from "react";
import { FileText, Edit2, Trash2, ArrowRight, DollarSign, Truck, CheckCircle2, Clock, User } from "lucide-react";

interface ActivityEntry {
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

// Mock activity entries for use across detail drawers
export function getMockActivities(type: string, id: string): ActivityEntry[] {
    return [
        { id: "1", action: `${type} created`, user: "Mustafa K.", timestamp: "Feb 20, 2026 09:15", type: "create" },
        { id: "2", action: `Status changed to "In Progress"`, user: "Mustafa K.", timestamp: "Feb 21, 2026 14:30", type: "status" },
        { id: "3", action: "Details updated — quantity adjusted", user: "Ali R.", timestamp: "Feb 23, 2026 11:00", type: "update" },
        { id: "4", action: "Payment of $12,500 recorded", user: "Accounting", timestamp: "Feb 24, 2026 16:45", type: "payment" },
    ];
}
