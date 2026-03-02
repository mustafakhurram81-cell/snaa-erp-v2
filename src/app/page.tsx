"use client";

import React from "react";
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

// --- Mock data ---
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

const recentOrders = [
  { id: "SO-2024-089", customer: "Metro General Hospital", amount: 12450, status: "processing", date: "Today, 10:23 AM" },
  { id: "SO-2024-088", customer: "Apex Surgical Center", amount: 4320, status: "shipped", date: "Yesterday" },
  { id: "SO-2024-087", customer: "Dr. Sarah Jenkins", amount: 850, status: "delivered", date: "Feb 23, 2024" },
  { id: "SO-2024-086", customer: "Westside Clinic", amount: 2100, status: "pending", date: "Feb 23, 2024" },
  { id: "SO-2024-085", customer: "Valley Health", amount: 18500, status: "processing", date: "Feb 22, 2024" },
];

const activities = [
  { action: "New sales order SO-2026-089 created", actor: "Mustafa Khurram", time: "10 min ago", icon: ShoppingCart, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-900/20" },
  { action: "Payment of $12,500 received for INV-2026-156", actor: "System", time: "25 min ago", icon: CreditCard, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  { action: "Production batch JO-2026-001 moved to QC stage", actor: "Ali Raza", time: "1 hour ago", icon: Factory, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
  { action: "Purchase order PO-2026-028 sent to Premium Steel", actor: "Mustafa Khurram", time: "2 hours ago", icon: ClipboardList, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
  { action: "Quotation QT-2026-089 converted to Sales Order", actor: "System", time: "3 hours ago", icon: FileText, color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-900/20" },
  { action: "New customer Metro General Hospital added", actor: "Mustafa Khurram", time: "4 hours ago", icon: Users, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-900/20" },
  { action: "Low stock alert: Adson Forceps below reorder point", actor: "System", time: "5 hours ago", icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20" },
  { action: "Invoice INV-2026-155 marked as overdue", actor: "System", time: "6 hours ago", icon: Receipt, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20" },
  { action: "New vendor MediTech Supplies onboarded", actor: "Mustafa Khurram", time: "Yesterday", icon: Truck, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
  { action: "Weekly sales report generated", actor: "System", time: "Yesterday", icon: BarChart3, color: "text-sky-500", bg: "bg-sky-50 dark:bg-sky-900/20" },
];

const lowStockProducts = [
  { name: "Mayo Scissors 6.5\"", sku: "SKU-001", stock: 12, reorder: 30 },
  { name: "Adson Forceps 4.75\"", sku: "SKU-002", stock: 8, reorder: 25 },
  { name: "Kelly Clamp 5.5\"", sku: "SKU-004", stock: 22, reorder: 30 },
];

const invoicePipeline = [
  { status: "Draft", count: 3, amount: 8500, color: "#94a3b8" },
  { status: "Sent", count: 5, amount: 24500, color: "#3b82f6" },
  { status: "Partial", count: 2, amount: 18000, color: "#f59e0b" },
  { status: "Overdue", count: 2, amount: 15300, color: "#ef4444" },
  { status: "Paid", count: 12, amount: 95000, color: "#10b981" },
];

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

export default function DashboardPage() {
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

      {/* KPI Cards */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Revenue" value={formatCurrency(523000)} change="+12.5% vs last month" changeType="positive" icon={<DollarSign className="w-5 h-5 text-blue-500" />} />
        <StatCard title="Open Orders" value="24" change="3 pending shipment" changeType="neutral" icon={<ShoppingCart className="w-5 h-5 text-violet-500" />} />
        <StatCard title="Production" value="18" change="5 completing today" changeType="positive" icon={<Factory className="w-5 h-5 text-amber-500" />} />
        <StatCard title="Pending Invoices" value={formatCurrency(67800)} change="2 overdue" changeType="negative" icon={<Receipt className="w-5 h-5 text-emerald-500" />} />
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

        {/* AR/AP Summary */}
        <Card>
          <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>AR / AP Summary</h3>
          <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>Receivables & Payables</p>
          <div className="space-y-4">
            <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Accounts Receivable</span>
                <CreditCard className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(182500)}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-semibold">Current: {formatCurrency(125000)}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-semibold">Overdue: {formatCurrency(57500)}</span>
              </div>
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Accounts Payable</span>
                <Truck className="w-3.5 h-3.5 text-violet-500" />
              </div>
              <p className="text-2xl font-bold text-violet-600">{formatCurrency(170500)}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-semibold">Current: {formatCurrency(142500)}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-semibold">Due soon: {formatCurrency(28000)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Inventory Alerts */}
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
            {lowStockProducts.map((product) => (
              <div key={product.sku} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: "var(--border)" }}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${product.stock < 15 ? "bg-red-500" : "bg-amber-500"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{product.name}</p>
                  <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>{product.sku}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${product.stock < 15 ? "text-red-600" : "text-amber-600"}`}>{product.stock}</p>
                  <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>/ {product.reorder}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Third Row: Invoice Pipeline + Recent Orders */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Invoice Pipeline */}
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
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(stage.count * 8, 4)}%`, background: stage.color }} />
                </div>
                <span className="text-xs font-semibold w-5 text-right" style={{ color: "var(--foreground)" }}>{stage.count}</span>
                <span className="text-xs font-medium w-16 text-right" style={{ color: "var(--muted-foreground)" }}>{formatCurrency(stage.amount)}</span>
              </div>
            ))}
          </div>
          <div className="border-t mt-4 pt-3 flex justify-between" style={{ borderColor: "var(--border)" }}>
            <span className="text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>Total Outstanding</span>
            <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{formatCurrency(invoicePipeline.reduce((s, p) => s + (p.status !== "Paid" ? p.amount : 0), 0))}</span>
          </div>
        </Card>

        {/* Recent Orders */}
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
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b last:border-b-0 hover:bg-[var(--secondary)] transition-colors cursor-pointer" style={{ borderColor: "var(--border)" }}>
                    <td className="px-5 py-3 text-sm font-medium" style={{ color: "var(--primary)" }}>{order.id}</td>
                    <td className="px-5 py-3 text-sm" style={{ color: "var(--foreground)" }}>{order.customer}</td>
                    <td className="px-5 py-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>{formatCurrency(order.amount)}</td>
                    <td className="px-5 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-5 py-3 text-sm" style={{ color: "var(--muted-foreground)" }}>{order.date}</td>
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

      {/* Activity Feed - Enhanced */}
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
