"use client";

import React from "react";
import Link from "next/link";
import {
    ArrowUpRight, Package, CreditCard, Truck,
    TrendingUp,
} from "lucide-react";
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip,
} from "recharts";
import { Card, Button, StatusBadge } from "@/components/ui/shared";
import { formatCurrency } from "@/lib/utils";

// --- Types ---
export type RevenueDataPoint = { month: string; revenue: number; orders: number };
export type OrderCategoryPoint = { name: string; value: number; color: string };
export type ProductionDataPoint = { name: string; planned: number; completed: number };


// --- Chart Widgets ---

export function RevenueChart({ data }: { data?: RevenueDataPoint[] }) {
    const revenueData = data && data.length > 0 ? data : [];
    return (
        <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Revenue Overview</h3>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Monthly revenue trend</p>
                </div>
                {revenueData.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                        <TrendingUp className="w-3.5 h-3.5" /> Live
                    </div>
                )}
            </div>
            {revenueData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[260px]">
                    <TrendingUp className="w-8 h-8 mb-2" style={{ color: "var(--muted-foreground)" }} />
                    <p className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>No revenue data yet</p>
                    <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Create invoices to see revenue trends</p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={revenueData}>
                        <defs>
                            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#71717a" stopOpacity={0.15} />
                                <stop offset="100%" stopColor="#71717a" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4} vertical={false} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickFormatter={(v) => `$${v / 1000}k`} dx={-10} />
                        <Tooltip
                            contentStyle={{
                                background: "rgba(24, 24, 27, 0.95)", // zinc-950
                                border: "1px solid rgba(255,255,255,0.05)",
                                borderRadius: "8px",
                                fontSize: "12px",
                                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.3)",
                                backdropFilter: "blur(12px)",
                                WebkitBackdropFilter: "blur(12px)",
                                color: "#f4f4f5", // zinc-50
                            }}
                            itemStyle={{ color: "#f4f4f5", fontWeight: 600 }}
                            formatter={(value: number | undefined) => [formatCurrency(value ?? 0), "Revenue"]}
                            cursor={{ stroke: '#52525b', strokeWidth: 1, strokeDasharray: '3 3' }}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#3f3f46" strokeWidth={2} fill="url(#revenueGradient)" activeDot={{ r: 4, strokeWidth: 0, fill: "#18181b" }} />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </Card>
    );
}

export function OrdersChart({ data }: { data?: OrderCategoryPoint[] }) {
    const ordersByCategory = data && data.length > 0 ? data : [];
    return (
        <Card>
            <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>Orders by Customer</h3>
            <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>Distribution this period</p>
            {ordersByCategory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10">
                    <Package className="w-8 h-8 mb-2" style={{ color: "var(--muted-foreground)" }} />
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>No orders yet</p>
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                                <Pie data={ordersByCategory.map((o, i) => {
                                    const zincShades = ["#18181b", "#3f3f46", "#71717a", "#a1a1aa", "#d4d4d8", "#e4e4e7"];
                                    return { ...o, color: zincShades[i % zincShades.length] };
                                })} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value" stroke="none">
                                    {ordersByCategory.map((entry, index) => {
                                        const zincShades = ["#18181b", "#3f3f46", "#71717a", "#a1a1aa", "#d4d4d8", "#e4e4e7"];
                                        return <Cell key={index} fill={zincShades[index % zincShades.length]} />;
                                    })}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        background: "rgba(24, 24, 27, 0.95)",
                                        border: "1px solid rgba(255,255,255,0.05)",
                                        borderRadius: "8px",
                                        fontSize: "12px",
                                        boxShadow: "0 10px 40px -10px rgba(0,0,0,0.3)",
                                        backdropFilter: "blur(12px)",
                                        WebkitBackdropFilter: "blur(12px)",
                                        color: "#f4f4f5",
                                    }}
                                    itemStyle={{ color: "#f4f4f5", fontWeight: 600 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 mt-2">
                        {ordersByCategory.map((cat, i) => {
                            const zincShades = ["#18181b", "#3f3f46", "#71717a", "#a1a1aa", "#d4d4d8", "#e4e4e7"];
                            const color = zincShades[i % zincShades.length];
                            return (
                                <div key={cat.name} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                                        <span style={{ color: "var(--foreground)" }}>{cat.name}</span>
                                    </div>
                                    <span className="font-medium" style={{ color: "var(--muted-foreground)" }}>{cat.value}%</span>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </Card>
    );
}

export function ProductionChart({ data }: { data?: ProductionDataPoint[] }) {
    const productionData = data && data.length > 0 ? data : [];
    return (
        <Card>
            <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>Production This Week</h3>
            <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>Planned vs Completed</p>
            {productionData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10">
                    <Package className="w-8 h-8 mb-2" style={{ color: "var(--muted-foreground)" }} />
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>No production data this week</p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={productionData} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4} vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} dx={-10} />
                        <Tooltip
                            contentStyle={{
                                background: "rgba(24, 24, 27, 0.95)",
                                border: "1px solid rgba(255,255,255,0.05)",
                                borderRadius: "8px",
                                fontSize: "12px",
                                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.3)",
                                backdropFilter: "blur(12px)",
                                WebkitBackdropFilter: "blur(12px)",
                                color: "#f4f4f5",
                            }}
                            itemStyle={{ color: "#f4f4f5", fontWeight: 600 }}
                            cursor={{ fill: '#3f3f46', opacity: 0.1 }}
                        />
                        <Bar dataKey="planned" fill="#e4e4e7" radius={[4, 4, 0, 0]} barSize={12} />
                        <Bar dataKey="completed" fill="#18181b" radius={[4, 4, 0, 0]} barSize={12} />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </Card>
    );
}

// --- AR/AP Widget ---
export function ARAPSummary({ arTotal, apTotal }: { arTotal: number; apTotal: number }) {
    return (
        <Card>
            <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>AR / AP Summary</h3>
            <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>Receivables & Payables</p>
            <div className="space-y-4">
                <Link href="/accounting">
                    <div className="rounded-xl border p-4 hover:shadow-sm transition-shadow cursor-pointer" style={{ borderColor: "var(--border)" }}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Accounts Receivable</span>
                            <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(arTotal)}</p>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-semibold">
                                {arTotal > 0 ? "Outstanding" : "All clear"}
                            </span>
                        </div>
                    </div>
                </Link>
                <Link href="/accounting">
                    <div className="rounded-xl border p-4 hover:shadow-sm transition-shadow cursor-pointer" style={{ borderColor: "var(--border)" }}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Accounts Payable</span>
                            <Truck className="w-3.5 h-3.5 text-violet-500" />
                        </div>
                        <p className="text-2xl font-bold text-violet-600">{formatCurrency(apTotal)}</p>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 font-semibold">
                                {apTotal > 0 ? "Outstanding" : "All clear"}
                            </span>
                        </div>
                    </div>
                </Link>
            </div>
        </Card>
    );
}

// --- Low Stock Alerts ---
export interface LowStockProduct { name: string; sku: string; stock: number; reorder_point: number; }

export function InventoryAlerts({ products, loading }: { products: LowStockProduct[]; loading: boolean }) {
    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Inventory Alerts</h3>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Products below reorder point</p>
                </div>
                <Link href="/products"><Button variant="ghost" size="sm">View All <ArrowUpRight className="w-3.5 h-3.5" /></Button></Link>
            </div>
            <div className="space-y-3">
                {products.length === 0 && !loading && (
                    <div className="py-8 text-center">
                        <Package className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--muted-foreground)" }} />
                        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>All stock levels healthy</p>
                    </div>
                )}
                {products.map((product) => (
                    <div key={product.sku} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: "var(--border)" }}>
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${product.stock < 15 ? "bg-red-500" : "bg-amber-500"}`} />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{product.name}</p>
                            <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>{product.sku}</p>
                        </div>
                        <div className="text-right">
                            <p className={`text-sm font-bold ${product.stock < 15 ? "text-red-600" : "text-amber-600"}`}>{product.stock}</p>
                            <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>/ {product.reorder_point}</p>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

// --- Invoice Pipeline ---
export interface InvoicePipelineItem { status: string; count: number; amount: number; color: string; }

export function InvoicePipeline({ pipeline }: { pipeline: InvoicePipelineItem[] }) {
    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Invoice Pipeline</h3>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>By status</p>
                </div>
                <Link href="/invoices"><Button variant="ghost" size="sm">View All <ArrowUpRight className="w-3.5 h-3.5" /></Button></Link>
            </div>
            <div className="space-y-2.5">
                {pipeline.map((stage) => (
                    <div key={stage.status} className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: stage.color }} />
                        <span className="text-xs w-14" style={{ color: "var(--muted-foreground)" }}>{stage.status}</span>
                        <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: "var(--secondary)" }}>
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(stage.count * 8, stage.count ? 8 : 0)}%`, background: stage.color }} />
                        </div>
                        <span className="text-xs font-semibold w-5 text-right" style={{ color: "var(--foreground)" }}>{stage.count}</span>
                        <span className="text-xs font-medium w-16 text-right" style={{ color: "var(--muted-foreground)" }}>{formatCurrency(stage.amount)}</span>
                    </div>
                ))}
            </div>
            <div className="border-t mt-4 pt-3 flex justify-between" style={{ borderColor: "var(--border)" }}>
                <span className="text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>Total Outstanding</span>
                <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                    {formatCurrency(pipeline.reduce((s, p) => s + (p.status !== "Paid" ? p.amount : 0), 0))}
                </span>
            </div>
        </Card>
    );
}

// --- Recent Orders ---
export interface RecentOrder { id: string; order_number: string; customer_name: string; total_amount: number; status: string; created_at: string; }

export function RecentOrdersTable({ orders, loading, formatRelativeDate }: { orders: RecentOrder[]; loading: boolean; formatRelativeDate: (d: string) => string }) {
    return (
        <Card className="lg:col-span-2" padding={false}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div>
                    <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Recent Orders</h3>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Latest sales orders</p>
                </div>
                <Link href="/sales-orders"><Button variant="ghost" size="sm">View All <ArrowUpRight className="w-3.5 h-3.5" /></Button></Link>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                            {["Order", "Customer", "Amount", "Status", "Date"].map(h => (
                                <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-2.5" style={{ color: "var(--muted-foreground)" }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length === 0 && !loading && (
                            <tr><td colSpan={5} className="px-5 py-8 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>No orders yet.</td></tr>
                        )}
                        {orders.map((order) => (
                            <Link key={order.id} href={`/sales-orders?open=${order.order_number}`}>
                                <tr className="border-b last:border-b-0 hover:bg-[var(--secondary)] transition-colors cursor-pointer" style={{ borderColor: "var(--border)" }}>
                                    <td className="px-5 py-3 text-sm font-medium" style={{ color: "var(--primary)" }}>{order.order_number}</td>
                                    <td className="px-5 py-3 text-sm" style={{ color: "var(--foreground)" }}>{order.customer_name}</td>
                                    <td className="px-5 py-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>{formatCurrency(Number(order.total_amount) || 0)}</td>
                                    <td className="px-5 py-3"><StatusBadge status={order.status} /></td>
                                    <td className="px-5 py-3 text-sm" style={{ color: "var(--muted-foreground)" }}>{formatRelativeDate(order.created_at)}</td>
                                </tr>
                            </Link>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

// --- JO Pipeline + Attention ---
export function JOPipeline() {
    const [stageData, setStageData] = React.useState<{ stage: string; count: number; color: string }[]>([]);

    React.useEffect(() => {
        const fetchPipeline = async () => {
            const { supabase } = await import("@/lib/supabase");
            const { data } = await supabase.from("production_stages").select("stage_name, status").in("status", ["Pending", "In Progress"]);
            if (data) {
                const STAGE_COLORS: Record<string, string> = {
                    "Die Making": "#1e40af", "Forging": "#2563eb", "Grinding": "#3b82f6", "Filing": "#60a5fa",
                    "Heat Treatment": "#93c5fd", "Plating": "#818cf8", "Assembly": "#a78bfa", "QC": "#c084fc",
                    "Finishing": "#e879f9", "Packaging": "#f472b6",
                };
                const counts: Record<string, number> = {};
                data.forEach((s: any) => { counts[s.stage_name] = (counts[s.stage_name] || 0) + 1; });
                const stages = Object.keys(STAGE_COLORS).map(name => ({
                    stage: name, count: counts[name] || 0, color: STAGE_COLORS[name],
                }));
                setStageData(stages);
            }
        };
        fetchPipeline();
    }, []);

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>JO Pipeline</h3>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Active job orders by stage</p>
                </div>
                <Link href="/production"><Button variant="ghost" size="sm">View All <ArrowUpRight className="w-3.5 h-3.5" /></Button></Link>
            </div>
            <div className="space-y-2">
                {stageData.map((s) => (
                    <div key={s.stage} className="flex items-center gap-3">
                        <span className="text-[11px] w-24 truncate" style={{ color: "var(--muted-foreground)" }}>{s.stage}</span>
                        <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: "var(--secondary)" }}>
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(s.count * 25, s.count ? 8 : 0)}%`, background: s.color }} />
                        </div>
                        <span className="text-xs font-semibold w-5 text-right" style={{ color: s.count > 0 ? "var(--foreground)" : "var(--muted-foreground)" }}>{s.count}</span>
                    </div>
                ))}
            </div>
        </Card>
    );
}

export function AttentionNeeded() {
    const [items, setItems] = React.useState<{ jo: string; product: string; stage: string; days: number; risk: string }[]>([]);

    React.useEffect(() => {
        const fetchAttention = async () => {
            const { supabase } = await import("@/lib/supabase");
            const { data: stages } = await supabase
                .from("production_stages")
                .select("stage_name, start_date, production_order_id")
                .eq("status", "In Progress")
                .not("start_date", "is", null)
                .order("start_date", { ascending: true })
                .limit(5);
            if (stages && stages.length > 0) {
                const orderIds = [...new Set(stages.map((s: any) => s.production_order_id))];
                const { data: orders } = await supabase.from("production_orders").select("id, job_number, product_name").in("id", orderIds);
                const orderMap: Record<string, any> = {};
                (orders || []).forEach((o: any) => { orderMap[o.id] = o; });
                const now = Date.now();
                const result = stages.map((s: any) => {
                    const order = orderMap[s.production_order_id] || {};
                    const days = Math.round((now - new Date(s.start_date).getTime()) / (1000 * 60 * 60 * 24));
                    return {
                        jo: order.job_number || "—",
                        product: order.product_name || "—",
                        stage: s.stage_name,
                        days,
                        risk: days > 5 ? "delayed" : days > 3 ? "at-risk" : "on-track",
                    };
                });
                setItems(result);
            }
        };
        fetchAttention();
    }, []);

    if (items.length === 0) {
        return (
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Attention Needed</h3>
                        <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Stages at risk or delayed</p>
                    </div>
                    <Link href="/production"><Button variant="ghost" size="sm">View All <ArrowUpRight className="w-3.5 h-3.5" /></Button></Link>
                </div>
                <p className="text-xs text-center py-4" style={{ color: "var(--muted-foreground)" }}>No active stages in production</p>
            </Card>
        );
    }

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Attention Needed</h3>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Stages at risk or delayed</p>
                </div>
                <Link href="/production"><Button variant="ghost" size="sm">View All <ArrowUpRight className="w-3.5 h-3.5" /></Button></Link>
            </div>
            <div className="space-y-3">
                {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: "var(--border)" }}>
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.risk === "delayed" ? "bg-red-500" : item.risk === "at-risk" ? "bg-amber-500" : "bg-emerald-500"}`} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold" style={{ color: "var(--primary)" }}>{item.jo}</span>
                                <span className="text-xs" style={{ color: "var(--foreground)" }}>{item.product}</span>
                            </div>
                            <p className="text-[11px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>{item.stage} · {item.days} days in progress</p>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.risk === "delayed" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : item.risk === "at-risk" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"}`}>
                            {item.risk === "delayed" ? "Delayed" : item.risk === "at-risk" ? "At Risk" : "On Track"}
                        </span>
                    </div>
                ))}
            </div>
        </Card>
    );
}
