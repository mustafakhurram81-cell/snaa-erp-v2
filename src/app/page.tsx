"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  DollarSign, ShoppingCart, Factory, Receipt, Clock,
  ClipboardList, Calendar,
} from "lucide-react";
import { PageHeader, StatCard } from "@/components/ui/shared";
import { StatCardSkeleton, CardSkeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

type DateRange = "week" | "month" | "quarter" | "ytd" | "all";

function getDateRange(range: DateRange): { from: string; label: string } {
  const now = new Date();
  let from: Date;
  switch (range) {
    case "week":
      from = new Date(now);
      from.setDate(now.getDate() - 7);
      return { from: from.toISOString(), label: "This Week" };
    case "month":
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: from.toISOString(), label: "This Month" };
    case "quarter":
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      from = new Date(now.getFullYear(), qMonth, 1);
      return { from: from.toISOString(), label: "This Quarter" };
    case "ytd":
      from = new Date(now.getFullYear(), 0, 1);
      return { from: from.toISOString(), label: "Year to Date" };
    case "all":
    default:
      return { from: "2000-01-01T00:00:00Z", label: "All Time" };
  }
}
import { supabase } from "@/lib/supabase";
import {
  getStatusChartColor,
} from "@/lib/constants";
// Dashboard widgets
import { QuickActions } from "@/components/dashboard/quick-actions";
import {
  RevenueChart, OrdersChart, ProductionChart,
  ARAPSummary, InventoryAlerts, InvoicePipeline,
  RecentOrdersTable, JOPipeline, AttentionNeeded,
  type LowStockProduct, type InvoicePipelineItem, type RecentOrder,
  type RevenueDataPoint, type OrderCategoryPoint, type ProductionDataPoint,
} from "@/components/dashboard/widgets";

// --- Types ---
interface DashboardSummaryRPC {
  total_revenue: number;
  open_orders: number;
  active_production: number;
  pending_invoices: number;
  overdue_count: number;
  ar_total: number;
  ap_total: number;
}

interface DashboardStats {
  totalRevenue: number;
  openOrders: number;
  activeProduction: number;
  pendingInvoices: number;
  overdueCount: number;
}

// Status colors now come from @/lib/constants — getStatusChartColor()

const entityIcons: Record<string, { icon: typeof ShoppingCart; color: string; bg: string }> = {
  sales_order: { icon: ShoppingCart, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-900/20" },
  invoice: { icon: Receipt, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  product: { icon: Factory, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
  customer: { icon: ShoppingCart, color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-900/20" },
  employee: { icon: ShoppingCart, color: "text-pink-500", bg: "bg-pink-50 dark:bg-pink-900/20" },
  production_order: { icon: Factory, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
  purchase_order: { icon: ClipboardList, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
};

const defaultActivities: { action: string; actor: string; time: string; icon: typeof ShoppingCart; color: string; bg: string }[] = [];

// --- Animations ---
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { type: "tween" as const, duration: 0.3 } } };

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({ totalRevenue: 0, openOrders: 0, activeProduction: 0, pendingInvoices: 0, overdueCount: 0 });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [invoicePipeline, setInvoicePipeline] = useState<InvoicePipelineItem[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [activities, setActivities] = useState<typeof defaultActivities>(defaultActivities);
  const [loading, setLoading] = useState(true);
  const [arTotal, setARTotal] = useState(0);
  const [apTotal, setAPTotal] = useState(0);
  const [revenueChartData, setRevenueChartData] = useState<RevenueDataPoint[]>([]);
  const [orderCategoryData, setOrderCategoryData] = useState<OrderCategoryPoint[]>([]);
  const [productionChartData, setProductionChartData] = useState<ProductionDataPoint[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>("all");

  const { from: dateFrom } = useMemo(() => getDateRange(dateRange), [dateRange]);

  useEffect(() => {
    async function fetchAll() {
      try {
        // Use RPCs for heavy aggregations + 2 small direct queries
        const [summaryRes, revenueRes, pipelineRes, recentRes, lowStockRes, ordersRes] = await Promise.all([
          supabase.rpc("get_dashboard_summary", { date_from: dateFrom }),
          supabase.rpc("get_revenue_chart_data", { date_from: dateFrom }),
          supabase.rpc("get_invoice_pipeline", { date_from: dateFrom }),
          supabase.from("sales_orders").select("id, order_number, customer_name, total_amount, status, created_at").gte("created_at", dateFrom).order("created_at", { ascending: false }).limit(5),
          supabase.from("products").select("name, sku, stock, reorder_point").filter("stock", "lt", 50).order("stock", { ascending: true }).limit(5),
          supabase.from("sales_orders").select("id, status, customer_name").gte("created_at", dateFrom),
        ]);

        // KPI stats from single RPC
        const summary = (summaryRes.data || {}) as unknown as DashboardSummaryRPC;
        setStats({
          totalRevenue: Number(summary.total_revenue) || 0,
          openOrders: Number(summary.open_orders) || 0,
          activeProduction: Number(summary.active_production) || 0,
          pendingInvoices: Number(summary.pending_invoices) || 0,
          overdueCount: Number(summary.overdue_count) || 0,
        });
        setARTotal(Number(summary.ar_total) || 0);
        setAPTotal(Number(summary.ap_total) || 0);

        // Revenue chart from RPC
        const revData = (revenueRes.data || []) as RevenueDataPoint[];
        if (revData.length > 0) setRevenueChartData(revData);

        // Invoice pipeline from RPC
        const pipelineData = ((pipelineRes.data || []) as { status: string; count: number; amount: number }[])
          .map(p => ({ ...p, color: getStatusChartColor(p.status) }));
        setInvoicePipeline(pipelineData.length > 0 ? pipelineData : [{ status: "No invoices yet", count: 0, amount: 0, color: "#94a3b8" }]);

        // Recent orders (direct query – only 5 rows)
        setRecentOrders((recentRes.data || []) as RecentOrder[]);

        // Orders by category (still needs per-record customer_name)
        const catColors = ["#2563eb", "#7c3aed", "#0891b2", "#059669", "#64748b"];
        const custNames: Record<string, number> = {};
        (ordersRes.data || []).forEach((o: any) => {
          const name = o.customer_name || "Other";
          custNames[name] = (custNames[name] || 0) + 1;
        });
        const total = Object.values(custNames).reduce((a, b) => a + b, 0);
        const catData = Object.entries(custNames)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count], i) => ({ name, value: Math.round(count / total * 100), color: catColors[i % catColors.length] }));
        if (catData.length > 0) setOrderCategoryData(catData);

        // Low stock (direct query – only 5 rows)
        const lowStock = (lowStockRes.data || []).filter(p => (p.stock || 0) < (p.reorder_point || 10));
        setLowStockProducts(lowStock as LowStockProduct[]);

        // Production chart - query production_orders for current week
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekStartStr = weekStart.toISOString().split("T")[0];
        const { data: prodOrders } = await supabase
          .from("production_orders")
          .select("start_date, status, quantity, completed")
          .gte("start_date", weekStartStr);
        if (prodOrders && prodOrders.length > 0) {
          const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          const dayMap: Record<string, { planned: number; completed: number }> = {};
          dayNames.forEach(d => { dayMap[d] = { planned: 0, completed: 0 }; });
          prodOrders.forEach((po: any) => {
            const day = dayNames[new Date(po.start_date).getDay()];
            if (dayMap[day]) {
              dayMap[day].planned += po.quantity || 0;
              dayMap[day].completed += po.completed || 0;
            }
          });
          const chartData = dayNames.slice(1, 7).map(name => ({ name, ...dayMap[name] }));
          if (chartData.some(d => d.planned > 0 || d.completed > 0)) {
            setProductionChartData(chartData);
          }
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    async function fetchActivities() {
      const { data } = await supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(10);
      if (data && data.length > 0) {
        setActivities(data.map((log: any) => {
          const ei = entityIcons[log.entity_type] || { icon: Clock, color: "text-gray-500", bg: "bg-gray-50 dark:bg-gray-900/20" };
          const diffMin = Math.floor((Date.now() - new Date(log.created_at).getTime()) / 60000);
          const timeStr = diffMin < 1 ? "Just now" : diffMin < 60 ? `${diffMin}m ago` : diffMin < 1440 ? `${Math.floor(diffMin / 60)}h ago` : "Yesterday";
          return { action: `${log.action} ${log.entity_type?.replace(/_/g, " ")} ${log.entity_id || ""}`.trim(), actor: log.user_email || "System", time: timeStr, icon: ei.icon, color: ei.color, bg: ei.bg };
        }));
      }
    }

    fetchAll();
    fetchActivities();
  }, [dateFrom]);

  const formatRelativeDate = (dateStr: string) => {
    const diffHours = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000);
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return "Yesterday";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <PageHeader title="Dashboard" description="Welcome back, Mustafa. Here's your business overview." />

      {/* Date Range Filter */}
      <motion.div variants={item} className="flex items-center gap-2 mb-5 flex-wrap">
        <div className="flex items-center gap-1.5 mr-2">
          <Calendar className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
          <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Period:</span>
        </div>
        {(["week", "month", "quarter", "ytd", "all"] as DateRange[]).map((range) => {
          const labels: Record<DateRange, string> = { week: "This Week", month: "This Month", quarter: "This Quarter", ytd: "YTD", all: "All Time" };
          const isActive = dateRange === range;
          return (
            <button
              key={range}
              onClick={() => { setLoading(true); setDateRange(range); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isActive
                ? "shadow-sm"
                : "hover:opacity-80"
                }`}
              style={{
                background: isActive ? "var(--primary)" : "var(--secondary)",
                color: isActive ? "white" : "var(--muted-foreground)",
              }}
            >
              {labels[range]}
            </button>
          );
        })}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item}><QuickActions /></motion.div>

      {/* KPI Cards — LIVE */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading ? (
          <>{Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}</>
        ) : (
          <>
            <StatCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} change={stats.totalRevenue > 0 ? "From invoices" : "No invoices yet"} changeType={stats.totalRevenue > 0 ? "positive" : "neutral"} icon={<DollarSign className="w-5 h-5 text-blue-500" />} />
            <StatCard title="Open Orders" value={String(stats.openOrders)} change={`${stats.openOrders} active`} changeType="neutral" icon={<ShoppingCart className="w-5 h-5 text-violet-500" />} />
            <StatCard title="Production" value={String(stats.activeProduction)} change="Active job orders" changeType="positive" icon={<Factory className="w-5 h-5 text-amber-500" />} />
            <StatCard title="Pending Invoices" value={formatCurrency(stats.pendingInvoices)} change={stats.overdueCount > 0 ? `${stats.overdueCount} overdue` : "All current"} changeType={stats.overdueCount > 0 ? "negative" : "positive"} icon={<Receipt className="w-5 h-5 text-emerald-500" />} />
          </>
        )}
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {loading ? <><CardSkeleton height={260} /><CardSkeleton height={260} /></> : <><RevenueChart data={revenueChartData} /><OrdersChart data={orderCategoryData} /></>}
      </motion.div>

      {/* Production + AR/AP + Inventory */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <ProductionChart data={productionChartData.length > 0 ? productionChartData : undefined} />
        <ARAPSummary arTotal={arTotal} apTotal={apTotal} />
        <InventoryAlerts products={lowStockProducts} loading={loading} />
      </motion.div>

      {/* Invoice Pipeline + Recent Orders */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <InvoicePipeline pipeline={invoicePipeline} />
        <RecentOrdersTable orders={recentOrders} loading={loading} formatRelativeDate={formatRelativeDate} />
      </motion.div>

      {/* JO Pipeline + Attention */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <JOPipeline />
        <AttentionNeeded />
      </motion.div>

      {/* Activity Feed */}
      <motion.div variants={item}>
        <div className="rounded-2xl p-5 bg-white/50 dark:bg-zinc-900/30 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Activity Feed</h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Real-time updates across all modules</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-medium text-emerald-600">Live</span>
              </div>
              <a href="/audit-log" className="text-xs font-medium transition-colors hover:underline" style={{ color: "var(--primary)" }}>
                View All →
              </a>
            </div>
          </div>
          <div className="space-y-1">
            {activities.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--muted-foreground)", opacity: 0.4 }} />
                <p className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>No recent activity</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)", opacity: 0.7 }}>Actions you take across the system will appear here</p>
              </div>
            ) : activities.map((activity, idx) => {
              const Icon = activity.icon;
              const isLast = idx === activities.length - 1;
              return (
                <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                  className="relative flex items-start gap-4 p-3 rounded-xl hover:bg-[var(--secondary)] transition-colors cursor-pointer group">
                  {/* Connecting Line */}
                  {!isLast && (
                    <div className="absolute left-[27px] top-10 bottom-[-12px] w-px bg-border group-hover:bg-primary/20 transition-colors" />
                  )}
                  {/* Icon Node */}
                  <div className={`relative z-10 p-2 rounded-lg flex-shrink-0 ${activity.bg} transition-transform group-hover:scale-105 shadow-sm`}>
                    <Icon className={`w-3.5 h-3.5 ${activity.color}`} />
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{activity.action}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-medium" style={{ color: "var(--muted-foreground)" }}>{activity.actor}</span>
                      <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>·</span>
                      <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>{activity.time}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
