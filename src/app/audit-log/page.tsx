"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
    ScrollText, Search, Filter, Calendar, ChevronLeft, ChevronRight,
    ShoppingCart, Receipt, Factory, ClipboardList, Package, Users, UserCog, Clock, AlertTriangle,
} from "lucide-react";
import { PageHeader, Button, Card, Tabs } from "@/components/ui/shared";
import { formatDate } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { TableSkeleton } from "@/components/ui/skeleton";

const entityIcons: Record<string, { icon: typeof ShoppingCart; color: string; bg: string }> = {
    sales_order: { icon: ShoppingCart, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-900/20" },
    invoice: { icon: Receipt, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    product: { icon: Package, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
    customer: { icon: Users, color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-900/20" },
    vendor: { icon: ClipboardList, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20" },
    employee: { icon: UserCog, color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-900/20" },
    production_order: { icon: Factory, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
    purchase_order: { icon: ClipboardList, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
    quotation: { icon: ScrollText, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
};

const PAGE_SIZE = 25;

interface ActivityLog {
    id: string;
    entity_type: string;
    entity_id: string | null;
    action: string;
    details: string | null;
    user_email: string | null;
    created_at: string | null;
}

export default function AuditLogPage() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [activeTab, setActiveTab] = useState("all");
    const [search, setSearch] = useState("");

    const entityTypes = useMemo(() => [
        "all", "sales_order", "invoice", "quotation", "purchase_order",
        "product", "customer", "vendor", "employee", "production_order",
    ], []);

    const tabs = entityTypes.map(t => ({
        key: t,
        label: t === "all" ? "All" : t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    }));

    useEffect(() => {
        async function fetchLogs() {
            setLoading(true);
            let query = supabase.from("activity_logs")
                .select("*", { count: "exact" })
                .order("created_at", { ascending: false })
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

            if (activeTab !== "all") {
                query = query.eq("entity_type", activeTab);
            }

            if (search.trim()) {
                query = query.or(`action.ilike.%${search}%,details.ilike.%${search}%,user_email.ilike.%${search}%`);
            }

            const { data, count, error } = await query;
            if (!error) {
                setLogs(data || []);
                setTotalCount(count || 0);
            }
            setLoading(false);
        }
        fetchLogs();
    }, [page, activeTab, search]);

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    const formatRelativeTime = (dateStr: string) => {
        const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
        if (diffMin < 1) return "Just now";
        if (diffMin < 60) return `${diffMin}m ago`;
        if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
        if (diffMin < 2880) return "Yesterday";
        return formatDate(dateStr);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <PageHeader
                title="Audit Log"
                description="Complete activity trail across all modules"
            />

            {/* Search + Filters */}
            <div className="flex items-center gap-3 mb-5">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                    <input
                        type="text"
                        placeholder="Search actions, details, or users..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/30"
                        style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                    />
                </div>
                <div className="flex items-center gap-2 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                    <ScrollText className="w-4 h-4" />
                    <span>{totalCount.toLocaleString()} entries</span>
                </div>
            </div>

            {/* Entity Tabs */}
            <div className="mb-5 overflow-x-auto">
                <Tabs tabs={tabs} activeTab={activeTab} onChange={(t) => { setActiveTab(t); setPage(0); }} />
            </div>

            {/* Log Table */}
            {loading ? (
                <TableSkeleton rows={10} columns={5} />
            ) : logs.length === 0 ? (
                <Card>
                    <div className="text-center py-12">
                        <Clock className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--muted-foreground)", opacity: 0.4 }} />
                        <p className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>No activity logs found</p>
                        <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)", opacity: 0.7 }}>
                            {search ? "Try a different search term" : "Actions performed in the system will appear here"}
                        </p>
                    </div>
                </Card>
            ) : (
                <Card padding={false}>
                    <table className="w-full">
                        <thead>
                            <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                                {["", "Action", "Entity", "User", "Time"].map((h) => (
                                    <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-2.5"
                                        style={{ color: "var(--muted-foreground)", background: "var(--secondary)" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => {
                                const ei = entityIcons[log.entity_type] || { icon: Clock, color: "text-gray-500", bg: "bg-gray-50 dark:bg-gray-900/20" };
                                const Icon = ei.icon;
                                return (
                                    <tr key={log.id} className="border-b last:border-b-0 hover:bg-[var(--secondary)] transition-colors"
                                        style={{ borderColor: "var(--border)" }}>
                                        <td className="px-5 py-3 w-10">
                                            <div className={`p-1.5 rounded-lg ${ei.bg}`}>
                                                <Icon className={`w-3.5 h-3.5 ${ei.color}`} />
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{log.action}</p>
                                            {log.details && (
                                                <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{log.details}</p>
                                            )}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                                                style={{ background: "var(--secondary)", color: "var(--foreground)" }}>
                                                {log.entity_type?.replace(/_/g, " ")}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-sm" style={{ color: "var(--muted-foreground)" }}>
                                            {log.user_email || "System"}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                                                {formatRelativeTime(log.created_at || "")}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: "var(--border)" }}>
                            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                                Page {page + 1} of {totalPages}
                            </span>
                            <div className="flex gap-1">
                                <Button variant="secondary" size="sm" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="secondary" size="sm" onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            )}
        </motion.div>
    );
}
