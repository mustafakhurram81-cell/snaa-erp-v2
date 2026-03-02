"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  ShoppingCart,
  Factory,
  Receipt,
  TrendingUp,
  ArrowUpRight,
  Plus,
  FileText,
  Users,
  Package,
  Clock,
  Truck,
  AlertTriangle,
  CreditCard,
  BarChart3,
  ClipboardList,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { PageHeader, StatCard, StatusBadge, Card, Button } from "@/components/ui/shared";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// --- Types for live data ---
interface DashboardStats {
  totalRevenue: number;
  openOrders: number;
  activeProduction: number;
  pendingInvoices: number;
  overdueCount: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface InvoicePipelineItem {
  status: string;
  count: number;
  amount: number;
  color: string;
}

interface LowStockProduct {
  name: string;
  sku: string;
  stock: number;
  reorder_point: number;
}

// --- Static data (charts & activity need time-series tables) ---
const revenueData = [
  { month: "Jul", revenue: 42000, orders: 18 },
  { month: "Aug", revenue: 55000, orders: 23 },
  { month: "Sep", revenue: 48000, orders: 20 },
  { month: "Oct", revenue: 67000, orders: 28 },
  { month: "Nov", revenue: 73000, orders: 31 },
  { month: "Dec", revenue: 61000, orders: 25 },
  { month: "Jan", revenue: 82000, orders: 35 },
  { month: "Feb", revenue: 95000, orders: 42 },
];

const ordersByCategory = [
  { name: "Scissors", value: 35, color: "#2563eb" },
  { name: "Forceps", value: 25, color: "#3b82f6" },
  { name: "Retractors", value: 20, color: "#60a5fa" },
  { name: "Clamps", value: 12, color: "#93c5fd" },
  { name: "Other", value: 8, color: "#bfdbfe" },
];

const productionData = [
  { name: "Mon", planned: 12, completed: 10 },
  { name: "Tue", planned: 15, completed: 14 },
  { name: "Wed", planned: 10, completed: 10 },
  { name: "Thu", planned: 18, completed: 15 },
  { name: "Fri", planned: 14, completed: 12 },
  { name: "Sat", planned: 8, completed: 7 },
];

const defaultActivities = [
  { action: "New sales order SO-2026-089 created", actor: "Mustafa Khurram", time: "10 min ago", icon: ShoppingCart, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-900/20" },
  { action: "Payment of $12,500 received for INV-2026-156", actor: "System", time: "25 min ago", icon: CreditCard, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  { action: "Production batch JO-2026-001 moved to QC stage", actor: "Ali Raza", time: "1 hour ago", icon: Factory, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
  { action: "Purchase order PO-2026-028 sent to Premium Steel", actor: "Mustafa Khurram", time: "2 hours ago", icon: ClipboardList, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
  { action: "Quotation QT-2026-089 converted to Sales Order", actor: "System", time: "3 hours ago", icon: FileText, color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-900/20" },
  { action: "New customer Metro General Hospital added", actor: "Mustafa Khurram", time: "4 hours ago", icon: Users, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-900/20" },
  { action: "Low stock alert: Adson Forceps below reorder point", actor: "System", time: "5 hours ago", icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" },
  { action: "Invoice INV-2026-155 marked as overdue", actor: "System", time: "6 hours ago", icon: Receipt, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20" },
];

const entityIcons: Record<string, { icon: typeof ShoppingCart; color: string; bg: string }> = {
  sales_order: { icon: ShoppingCart, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-900/20" },
  invoice: { icon: Receipt, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  quotation: { icon: FileText, color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-900/20" },
  customer: { icon: Users, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-900/20" },
  vendor: { icon: Truck, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
  product: { icon: Package, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
  production_order: { icon: Factory, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
  purchase_order: { icon: ClipboardList, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
};

const quickActions = [
  { label: "New Quote", icon: FileText, href: "/quotations", color: "from-blue-500 to-blue-600" },
  { label: "New Order", icon: ShoppingCart, href: "/sales-orders", color: "from-violet-500 to-violet-600" },
  { label: "New Invoice", icon: Receipt, href: "/invoices", color: "from-emerald-500 to-emerald-600" },
  { label: "Add Product", icon: Package, href: "/products", color: "from-amber-500 to-amber-600" },
  { label: "Add Customer", icon: Users, href: "/customers", color: "from-rose-500 to-rose-600" },
  { label: "View Reports", icon: BarChart3, href: "/reports", color: "from-indigo-500 to-indigo-600" },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { type: "tween" as const, duration: 0.3 } } };

const statusColors: Record<string, string> = {
  Draft: "#94a3b8",
  draft: "#94a3b8",
  Sent: "#3b82f6",
  sent: "#3b82f6",
  pending: "#3b82f6",
  Pending: "#3b82f6",
  partial: "#f59e0b",
  Partial: "#f59e0b",
  overdue: "#ef4444",
  Overdue: "#ef4444",
  paid: "#10b981",
  Paid: "#10b981",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    openOrders: 0,
    activeProduction: 0,
    pendingInvoices: 0,
    overdueCount: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [invoicePipeline, setInvoicePipeline] = useState<InvoicePipelineItem[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [activities, setActivities] = useState<typeof defaultActivities>(defaultActivities);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch all data in parallel
        const [
          invoicesRes,
          ordersRes,
          productionRes,
          recentOrdersRes,
          lowStockRes,
        ] = await Promise.all([
          supabase.from("invoices").select("total_amount, status"),
          supabase.from("sales_orders").select("id, status"),
          supabase.from("production_orders").select("id, status"),
          supabase.from("sales_orders").select("id, order_number, customer_name, total_amount, status, created_at").order("created_at", { ascending: false }).limit(5),
          supabase.from("products").select("name, sku, stock, reorder_point").filter("stock", "lt", 50).order("stock", { ascending: true }).limit(5),
        ]);

        // Calculate stats
        const invoices = invoicesRes.data || [];
        const totalRevenue = invoices.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
        const pendingInvoices = invoices.filter(i => i.status !== "paid" && i.status !== "Paid").reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
        const overdueCount = invoices.filter(i => i.status === "overdue" || i.status === "Overdue").length;

        const orders = ordersRes.data || [];
        const openOrders = orders.filter(o => o.status !== "completed" && o.status !== "Completed" && o.status !== "cancelled" && o.status !== "Cancelled").length;

        const production = productionRes.data || [];
        const activeProduction = production.filter(p => p.status === "In Progress" || p.status === "in_progress" || p.status === "Planned").length;

        setStats({ totalRevenue, openOrders, activeProduction, pendingInvoices, overdueCount });
        setRecentOrders((recentOrdersRes.data || []) as RecentOrder[]);

        // Build invoice pipeline
        const statusGroups: Record<string, { count: number; amount: number }> = {};
        invoices.forEach(inv => {
          const s = inv.status || "draft";
          if (!statusGroups[s]) statusGroups[s] = { count: 0, amount: 0 };
          statusGroups[s].count++;
          statusGroups[s].amount += Number(inv.total_amount) || 0;
        });
        const pipeline = Object.entries(statusGroups).map(([status, data]) => ({
          status: status.charAt(0).toUpperCase() + status.slice(1),
          count: data.count,
          amount: data.amount,
          color: statusColors[status] || "#94a3b8",
        }));
        setInvoicePipeline(pipeline.length > 0 ? pipeline : [
          { status: "No invoices yet", count: 0, amount: 0, color: "#94a3b8" },
        ]);

        // Low stock
        const lowStock = (lowStockRes.data || []).filter(p => (p.stock || 0) < (p.reorder_point || 10));
        setLowStockProducts(lowStock as LowStockProduct[]);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    async function fetchActivities() {
      const { data } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (data && data.length > 0) {
        setActivities(data.map((log: any) => {
          const ei = entityIcons[log.entity_type] || { icon: Clock, color: "text-gray-500", bg: "bg-gray-50 dark:bg-gray-900/20" };
          const diffMs = Date.now() - new Date(log.created_at).getTime();
          const diffMin = Math.floor(diffMs / 60000);
          const timeStr = diffMin < 1 ? "Just now" : diffMin < 60 ? `${diffMin}m ago` : diffMin < 1440 ? `${Math.floor(diffMin / 60)}h ago` : "Yesterday";
          return {
            action: `${log.action} ${log.entity_type?.replace(/_/g, " ")} ${log.entity_id || ""}`.trim(),
            actor: log.user_email || "System",
            time: timeStr,
            icon: ei.icon,
            color: ei.color,
            bg: ei.bg,
          };
        }));
      }
    }

    fetchDashboardData();
    fetchActivities();
  }, []);

  // AR/AP from live data
  const [arTotal, setARTotal] = useState(0);
  const [apTotal, setAPTotal] = useState(0);

  useEffect(() => {
    async function fetchARAP() {
      const [arRes, apRes] = await Promise.all([
        supabase.from("invoices").select("total_amount, status").neq("status", "paid").neq("status", "Paid"),
        supabase.from("purchase_orders").select("total_amount, status").neq("status", "closed").neq("status", "Cancelled"),
      ]);
      const ar = (arRes.data || []).reduce((s, i) => s + (Number(i.total_amount) || 0), 0);
      const ap = (apRes.data || []).reduce((s, i) => s + (Number(i.total_amount) || 0), 0);
      setARTotal(ar);
      setAPTotal(ap);
    }
    fetchARAP();
  }, []);

  const formatRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <PageHeader
        title="Dashboard"
        description="Welcome back, Mustafa. Here's your business overview."
      />

      {/* Quick Actions */}
      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.label} href={action.href}>
              <div className="group rounded-xl border p-4 text-center cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5" style={{ borderColor: "var(--border)" }}>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>{action.label}</span>
              </div>
            </Link>
          );
        })}
      </motion.div>

      {/* KPI Cards — LIVE */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Revenue"
          value={loading ? "..." : formatCurrency(stats.totalRevenue)}
          change={stats.totalRevenue > 0 ? "From invoices" : "No invoices yet"}
          changeType={stats.totalRevenue > 0 ? "positive" : "neutral"}
          icon={<DollarSign className="w-5 h-5 text-blue-500" />}
        />
        <StatCard
          title="Open Orders"
          value={loading ? "..." : String(stats.openOrders)}
          change={`${stats.openOrders} active`}
          changeType="neutral"
          icon={<ShoppingCart className="w-5 h-5 text-violet-500" />}
        />
        <StatCard
          title="Production"
          value={loading ? "..." : String(stats.activeProduction)}
          change="Active job orders"
          changeType="positive"
          icon={<Factory className="w-5 h-5 text-amber-500" />}
        />
        <StatCard
          title="Pending Invoices"
          value={loading ? "..." : formatCurrency(stats.pendingInvoices)}
          change={stats.overdueCount > 0 ? `${stats.overdueCount} overdue` : "All current"}
          changeType={stats.overdueCount > 0 ? "negative" : "positive"}
          icon={<Receipt className="w-5 h-5 text-emerald-500" />}
        />
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Revenue Overview</h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Monthly revenue trend</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <TrendingUp className="w-3.5 h-3.5" /> +18.2%
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} formatter={(value: number | undefined) => [formatCurrency(value ?? 0), "Revenue"]} />
              <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} fill="url(#revenueGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Orders by Category */}
        <Card>
          <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>Orders by Category</h3>
          <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>Distribution this month</p>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={ordersByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {ordersByCategory.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {ordersByCategory.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color }} />
                  <span style={{ color: "var(--foreground)" }}>{cat.name}</span>
                </div>
                <span className="font-medium" style={{ color: "var(--muted-foreground)" }}>{cat.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Second Row: Production + AR/AP + Inventory Alerts */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Production Chart */}
        <Card>
          <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>Production This Week</h3>
          <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>Planned vs Completed</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={productionData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }} />
              <Bar dataKey="planned" fill="#93c5fd" radius={[4, 4, 0, 0]} barSize={16} />
              <Bar dataKey="completed" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* AR/AP Summary — LIVE */}
        <Card>
          <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>AR / AP Summary</h3>
          <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>Receivables & Payables</p>
          <div className="space-y-4">
            <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
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
            <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
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
          </div>
        </Card>

        {/* Inventory Alerts — LIVE */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Inventory Alerts</h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Products below reorder point</p>
            </div>
            <Link href="/products">
              <Button variant="ghost" size="sm">View All <ArrowUpRight className="w-3.5 h-3.5" /></Button>
            </Link>
          </div>
          <div className="space-y-3">
            {lowStockProducts.length === 0 && !loading && (
              <div className="py-8 text-center">
                <Package className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--muted-foreground)" }} />
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>All stock levels healthy</p>
              </div>
            )}
            {lowStockProducts.map((product) => (
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
      </motion.div>

      {/* Third Row: Invoice Pipeline + Recent Orders — LIVE */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Invoice Pipeline — LIVE */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Invoice Pipeline</h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>By status</p>
            </div>
            <Link href="/invoices">
              <Button variant="ghost" size="sm">View All <ArrowUpRight className="w-3.5 h-3.5" /></Button>
            </Link>
          </div>
          <div className="space-y-2.5">
            {invoicePipeline.map((stage) => (
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
              {formatCurrency(invoicePipeline.reduce((s, p) => s + (p.status !== "Paid" ? p.amount : 0), 0))}
            </span>
          </div>
        </Card>

        {/* Recent Orders — LIVE */}
        <Card className="lg:col-span-2" padding={false}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Recent Orders</h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Latest sales orders</p>
            </div>
            <Link href="/sales-orders">
              <Button variant="ghost" size="sm">View All <ArrowUpRight className="w-3.5 h-3.5" /></Button>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-2.5" style={{ color: "var(--muted-foreground)" }}>Order</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-2.5" style={{ color: "var(--muted-foreground)" }}>Customer</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-2.5" style={{ color: "var(--muted-foreground)" }}>Amount</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-2.5" style={{ color: "var(--muted-foreground)" }}>Status</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-2.5" style={{ color: "var(--muted-foreground)" }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                      No orders yet. Create your first sales order to see it here.
                    </td>
                  </tr>
                )}
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b last:border-b-0 hover:bg-[var(--secondary)] transition-colors cursor-pointer" style={{ borderColor: "var(--border)" }}>
                    <td className="px-5 py-3 text-sm font-medium" style={{ color: "var(--primary)" }}>{order.order_number}</td>
                    <td className="px-5 py-3 text-sm" style={{ color: "var(--foreground)" }}>{order.customer_name}</td>
                    <td className="px-5 py-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>{formatCurrency(Number(order.total_amount) || 0)}</td>
                    <td className="px-5 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-5 py-3 text-sm" style={{ color: "var(--muted-foreground)" }}>{formatRelativeDate(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* Fourth Row: JO Pipeline + Attention Needed */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>JO Pipeline</h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Active job orders by stage</p>
            </div>
            <Link href="/production"><Button variant="ghost" size="sm">View All <ArrowUpRight className="w-3.5 h-3.5" /></Button></Link>
          </div>
          <div className="space-y-2">
            {[
              { stage: "Die Making", count: 1, color: "#1e40af" },
              { stage: "Forging", count: 2, color: "#2563eb" },
              { stage: "Grinding", count: 1, color: "#3b82f6" },
              { stage: "Filing", count: 1, color: "#60a5fa" },
              { stage: "Heat Treatment", count: 0, color: "#93c5fd" },
              { stage: "Plating", count: 0, color: "#818cf8" },
              { stage: "Assembly", count: 0, color: "#a78bfa" },
              { stage: "QC", count: 1, color: "#c084fc" },
              { stage: "Finishing", count: 0, color: "#e879f9" },
              { stage: "Packaging", count: 0, color: "#f472b6" },
            ].map((s) => (
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

        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Attention Needed</h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Stages at risk or delayed</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { jo: "JO-2026-001", product: "Mayo Scissors", stage: "Filing", vendor: "Master Filing Works", days: 5, risk: "delayed" },
              { jo: "JO-2026-002", product: "Adson Forceps", stage: "Grinding", vendor: "Precision Grinders", days: 3, risk: "at-risk" },
              { jo: "JO-2026-003", product: "Kelly Clamp", stage: "Forging", vendor: "Riaz Forging", days: 2, risk: "on-track" },
            ].map((item) => (
              <div key={item.jo} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: "var(--border)" }}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.risk === "delayed" ? "bg-red-500" : item.risk === "at-risk" ? "bg-amber-500" : "bg-emerald-500"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold" style={{ color: "var(--primary)" }}>{item.jo}</span>
                    <span className="text-xs" style={{ color: "var(--foreground)" }}>{item.product}</span>
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>{item.stage} · {item.vendor} · {item.days} days</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.risk === "delayed" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : item.risk === "at-risk" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"}`}>
                  {item.risk === "delayed" ? "Delayed" : item.risk === "at-risk" ? "At Risk" : "On Track"}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Activity Feed */}
      <motion.div variants={item}>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Activity Feed</h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Real-time updates across all modules</p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-medium text-emerald-600">Live</span>
            </div>
          </div>
          <div className="space-y-1">
            {activities.map((activity, idx) => {
              const Icon = activity.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-[var(--secondary)] transition-colors cursor-pointer group"
                >
                  <div className={`p-2 rounded-lg flex-shrink-0 ${activity.bg} transition-transform group-hover:scale-105`}>
                    <Icon className={`w-3.5 h-3.5 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: "var(--foreground)" }}>{activity.action}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>{activity.actor}</span>
                      <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>·</span>
                      <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>{activity.time}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
