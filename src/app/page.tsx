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
  ArrowDownRight,
  Plus,
  FileText,
  Users,
  Package,
  Clock,
  Truck,
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
  { action: "New sales order SO-2024-089 created", actor: "Alice Cooper", time: "2 hours ago", icon: ShoppingCart },
  { action: "Production batch PRD-442 completed", actor: "System", time: "4 hours ago", icon: Factory },
  { action: "Payment received for INV-992", actor: "Bob Finance", time: "5 hours ago", icon: Receipt },
  { action: "New vendor MediTech added", actor: "Charlie Procure", time: "Yesterday", icon: Truck },
];

// --- Animation configuration ---
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "tween" as const, duration: 0.3 } },
};

export default function DashboardPage() {
  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <PageHeader
        title="Dashboard"
        description="Welcome back, Mustafa. Here's your business overview."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/quotations?action=new">
              <Button variant="secondary" size="sm">
                <Plus className="w-3.5 h-3.5" />
                New Quote
              </Button>
            </Link>
            <Link href="/sales-orders?action=new">
              <Button size="sm">
                <Plus className="w-3.5 h-3.5" />
                New Order
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Cards */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(523000)}
          change="+12.5% vs last month"
          changeType="positive"
          icon={<DollarSign className="w-5 h-5 text-blue-500" />}
        />
        <StatCard
          title="Open Orders"
          value="24"
          change="3 pending shipment"
          changeType="neutral"
          icon={<ShoppingCart className="w-5 h-5 text-violet-500" />}
        />
        <StatCard
          title="Production"
          value="18"
          change="5 completing today"
          changeType="positive"
          icon={<Factory className="w-5 h-5 text-amber-500" />}
        />
        <StatCard
          title="Pending Invoices"
          value={formatCurrency(67800)}
          change="2 overdue"
          changeType="negative"
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
              <TrendingUp className="w-3.5 h-3.5" />
              +18.2%
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
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                tickFormatter={(v) => `$${v / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                formatter={(value: number | undefined) => [formatCurrency(value ?? 0), "Revenue"]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#2563eb"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
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
                <Pie
                  data={ordersByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {ordersByCategory.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
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

      {/* Second Row */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Production Chart */}
        <Card>
          <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>Production This Week</h3>
          <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>Planned vs Completed</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={productionData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="planned" fill="#93c5fd" radius={[4, 4, 0, 0]} barSize={16} />
              <Bar dataKey="completed" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Recent Orders */}
        <Card className="lg:col-span-2" padding={false}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Recent Orders</h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Latest sales orders</p>
            </div>
            <Link href="/sales-orders">
              <Button variant="ghost" size="sm">
                View All
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
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

      {/* Production Pipeline Row */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* JO Stage Pipeline */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>JO Pipeline</h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Active job orders by stage</p>
            </div>
            <Link href="/production">
              <Button variant="ghost" size="sm">
                View All
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
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
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.max(s.count * 25, s.count ? 8 : 0)}%`, background: s.color }}
                  />
                </div>
                <span className="text-xs font-semibold w-5 text-right" style={{ color: s.count > 0 ? "var(--foreground)" : "var(--muted-foreground)" }}>{s.count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Stages Needing Attention */}
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
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                    {item.stage} · {item.vendor} · {item.days} days
                  </p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.risk === "delayed" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                    item.risk === "at-risk" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  }`}>
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
            <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Recent Activity</h3>
            <Clock className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
          </div>
          <div className="space-y-3">
            {activities.map((activity, idx) => {
              const Icon = activity.icon;
              return (
                <div key={idx} className="flex items-start gap-3 py-2">
                  <div className="p-2 rounded-lg flex-shrink-0" style={{ background: "var(--secondary)" }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: "var(--foreground)" }}>{activity.action}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                      {activity.actor} · {activity.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
