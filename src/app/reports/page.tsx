"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Download, Calendar, TrendingUp, DollarSign, Package, ShoppingCart, Users, Factory, Clock } from "lucide-react";
import { PageHeader, Button, Card, Tabs, StatCard } from "@/components/ui/shared";
import { formatCurrency } from "@/lib/utils";
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
  LineChart,
  Line,
  Legend,
} from "recharts";

const salesData = [
  { month: "Sep", revenue: 48000, cost: 22000, profit: 26000 },
  { month: "Oct", revenue: 67000, cost: 30000, profit: 37000 },
  { month: "Nov", revenue: 73000, cost: 33000, profit: 40000 },
  { month: "Dec", revenue: 61000, cost: 28000, profit: 33000 },
  { month: "Jan", revenue: 82000, cost: 36000, profit: 46000 },
  { month: "Feb", revenue: 95000, cost: 42000, profit: 53000 },
];

const topProducts = [
  { name: "Mayo Scissors 6.5\"", revenue: 42000, units: 1750, color: "#2563eb" },
  { name: "Adson Forceps 4.75\"", revenue: 35000, units: 2333, color: "#3b82f6" },
  { name: "Army-Navy Retractor", revenue: 28600, units: 550, color: "#60a5fa" },
  { name: "Kelly Clamp 5.5\"", revenue: 24000, units: 1200, color: "#93c5fd" },
  { name: "Debakey Forceps 8\"", revenue: 21000, units: 600, color: "#bfdbfe" },
];

const topCustomers = [
  { name: "Gulf Healthcare", revenue: 125000, orders: 15 },
  { name: "City Hospital", revenue: 98000, orders: 12 },
  { name: "National Hospital", revenue: 85000, orders: 10 },
  { name: "Metro Medical", revenue: 67000, orders: 8 },
  { name: "Central Clinic", revenue: 52000, orders: 7 },
];

const purchasingData = [
  { month: "Sep", amount: 35000 },
  { month: "Oct", amount: 42000 },
  { month: "Nov", amount: 38000 },
  { month: "Dec", amount: 30000 },
  { month: "Jan", amount: 48000 },
  { month: "Feb", amount: 55000 },
];

const expenseBreakdown = [
  { name: "COGS", value: 198000, color: "#2563eb" },
  { name: "Salaries", value: 85000, color: "#3b82f6" },
  { name: "Rent & Utils", value: 35000, color: "#60a5fa" },
  { name: "Marketing", value: 18000, color: "#93c5fd" },
  { name: "Admin", value: 10000, color: "#bfdbfe" },
];

const stagePipeline = [
  { stage: "Die Making", count: 1, color: "#1e40af" },
  { stage: "Forging", count: 2, color: "#2563eb" },
  { stage: "Grinding", count: 1, color: "#3b82f6" },
  { stage: "Filing", count: 1, color: "#60a5fa" },
  { stage: "Heat Treat", count: 0, color: "#93c5fd" },
  { stage: "Plating", count: 0, color: "#818cf8" },
  { stage: "Assembly", count: 0, color: "#a78bfa" },
  { stage: "QC", count: 1, color: "#c084fc" },
  { stage: "Finishing", count: 0, color: "#e879f9" },
  { stage: "Packaging", count: 0, color: "#f472b6" },
];

const vendorPerformance = [
  { vendor: "Ali Steel Works", jobs: 12, onTime: 92, quality: 96, avgDays: 2.8 },
  { vendor: "Riaz Forging", jobs: 10, onTime: 88, quality: 94, avgDays: 3.2 },
  { vendor: "Precision Grinders", jobs: 8, onTime: 95, quality: 98, avgDays: 3.0 },
  { vendor: "Master Filing Works", jobs: 7, onTime: 86, quality: 91, avgDays: 3.5 },
  { vendor: "Chrome Plating Works", jobs: 6, onTime: 90, quality: 97, avgDays: 2.5 },
];

const stageAvgDays = [
  { stage: "Die", days: 2.5 },
  { stage: "Forge", days: 3.2 },
  { stage: "Grind", days: 2.8 },
  { stage: "File", days: 3.5 },
  { stage: "Heat", days: 2.0 },
  { stage: "Plate", days: 2.5 },
  { stage: "Assy", days: 1.5 },
  { stage: "QC", days: 1.0 },
  { stage: "Finish", days: 1.8 },
  { stage: "Pack", days: 0.5 },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("production");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Reports"
        description="Business analytics and performance insights"
        actions={
          <Button variant="secondary">
            <Download className="w-3.5 h-3.5" />
            Export PDF
          </Button>
        }
      />

      {/* Period Quick Select */}
      <div className="flex items-center justify-between mb-6">
        <Tabs
          tabs={[
            { key: "production", label: "Production" },
            { key: "sales", label: "Sales" },
            { key: "purchasing", label: "Purchasing" },
            { key: "financial", label: "Financial" },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "var(--secondary)" }}>
          {["7D", "30D", "90D", "YTD", "1Y"].map((period) => (
            <button
              key={period}
              className="px-2.5 py-1 rounded-md text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "production" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <StatCard title="Active JOs" value="4" change="1 completing soon" changeType="positive" icon={<Factory className="w-5 h-5 text-blue-500" />} />
            <StatCard title="Avg Completion" value="23 days" change="-2 days vs last month" changeType="positive" icon={<Clock className="w-5 h-5 text-violet-500" />} />
            <StatCard title="On-Time Rate" value="90%" change="+3% vs last month" changeType="positive" icon={<TrendingUp className="w-5 h-5 text-emerald-500" />} />
            <StatCard title="Active Vendors" value="5" change="12 total" changeType="neutral" icon={<Users className="w-5 h-5 text-amber-500" />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Card>
              <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>JO Pipeline by Stage</h3>
              <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>Current job orders at each manufacturing stage</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stagePipeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} angle={-25} textAnchor="end" height={50} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={28}>
                    {stagePipeline.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>Avg Days per Stage</h3>
              <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>Average completion time</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stageAvgDays} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} unit=" d" />
                  <YAxis dataKey="stage" type="category" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} width={50} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }} formatter={(v: number | undefined) => [`${v ?? 0} days`, "Avg"]} />
                  <Bar dataKey="days" fill="#2563eb" radius={[0, 6, 6, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card padding={false}>
            <div className="px-5 pt-5 pb-3">
              <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Vendor Performance</h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Quality and delivery metrics</p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                  {["Vendor", "Jobs Done", "On-Time %", "Quality %", "Avg Days"].map((h) => (
                    <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-2.5" style={{ color: "var(--muted-foreground)", background: "var(--secondary)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vendorPerformance.map((v) => (
                  <tr key={v.vendor} className="border-b last:border-b-0 hover:bg-[var(--secondary)] transition-colors" style={{ borderColor: "var(--border)" }}>
                    <td className="px-5 py-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>{v.vendor}</td>
                    <td className="px-5 py-3 text-sm" style={{ color: "var(--foreground)" }}>{v.jobs}</td>
                    <td className="px-5 py-3">
                      <span className={`text-sm font-semibold ${v.onTime >= 90 ? "text-emerald-600" : v.onTime >= 85 ? "text-amber-600" : "text-red-600"}`}>{v.onTime}%</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-sm font-semibold ${v.quality >= 95 ? "text-emerald-600" : v.quality >= 90 ? "text-amber-600" : "text-red-600"}`}>{v.quality}%</span>
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ color: "var(--muted-foreground)" }}>{v.avgDays} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {activeTab === "sales" && (
        <>
          {/* Sales KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <StatCard title="Total Revenue" value={formatCurrency(523000)} change="+18.2% vs last period" changeType="positive" icon={<DollarSign className="w-5 h-5 text-blue-500" />} />
            <StatCard title="Total Orders" value="156" change="+12 this month" changeType="positive" icon={<ShoppingCart className="w-5 h-5 text-violet-500" />} />
            <StatCard title="Avg Order Value" value={formatCurrency(3353)} change="+5.8%" changeType="positive" icon={<TrendingUp className="w-5 h-5 text-emerald-500" />} />
            <StatCard title="Active Customers" value="42" change="+3 new" changeType="positive" icon={<Users className="w-5 h-5 text-amber-500" />} />
          </div>

          {/* Revenue vs Profit Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <Card className="lg:col-span-2">
              <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>Revenue vs Profit</h3>
              <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>Monthly comparison</p>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} dot={{ fill: "#2563eb", r: 4 }} />
                  <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 4 }} />
                  <Line type="monotone" dataKey="cost" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Top Products */}
            <Card>
              <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>Top Products</h3>
              <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>By revenue</p>
              <div className="space-y-3">
                {topProducts.map((product, idx) => (
                  <div key={product.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
                        {idx + 1}. {product.name}
                      </span>
                      <span className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>
                        {formatCurrency(product.revenue)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full" style={{ background: "var(--secondary)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(product.revenue / topProducts[0].revenue) * 100}%`,
                          background: product.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Top Customers */}
          <Card padding={false}>
            <div className="px-5 pt-5 pb-3">
              <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Top Customers</h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>By revenue contribution</p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                  {["#", "Customer", "Revenue", "Orders", "Avg Order"].map((h) => (
                    <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-2.5" style={{ color: "var(--muted-foreground)", background: "var(--secondary)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((customer, idx) => (
                  <tr key={customer.name} className="border-b last:border-b-0 hover:bg-[var(--secondary)] transition-colors" style={{ borderColor: "var(--border)" }}>
                    <td className="px-5 py-3 text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>{idx + 1}</td>
                    <td className="px-5 py-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>{customer.name}</td>
                    <td className="px-5 py-3 text-sm font-semibold" style={{ color: "var(--foreground)" }}>{formatCurrency(customer.revenue)}</td>
                    <td className="px-5 py-3 text-sm" style={{ color: "var(--foreground)" }}>{customer.orders}</td>
                    <td className="px-5 py-3 text-sm" style={{ color: "var(--muted-foreground)" }}>{formatCurrency(customer.revenue / customer.orders)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {activeTab === "purchasing" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatCard title="Total Purchases" value={formatCurrency(248000)} change="6 months" changeType="neutral" icon={<Package className="w-5 h-5 text-blue-500" />} />
            <StatCard title="Active POs" value="4" icon={<ShoppingCart className="w-5 h-5 text-violet-500" />} />
            <StatCard title="Active Vendors" value="4" icon={<Users className="w-5 h-5 text-emerald-500" />} />
          </div>
          <Card>
            <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>Purchasing Trend</h3>
            <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>Monthly purchase volume</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={purchasingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }} />
                <Bar dataKey="amount" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}

      {activeTab === "financial" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <StatCard title="Revenue" value={formatCurrency(523000)} changeType="positive" change="+18.2%" icon={<TrendingUp className="w-5 h-5 text-emerald-500" />} />
            <StatCard title="Expenses" value={formatCurrency(346000)} changeType="negative" change="+8.5%" icon={<DollarSign className="w-5 h-5 text-red-500" />} />
            <StatCard title="Net Profit" value={formatCurrency(177000)} changeType="positive" change="+32.1%" icon={<DollarSign className="w-5 h-5 text-blue-500" />} />
            <StatCard title="Profit Margin" value="33.8%" changeType="positive" change="+3.2pp" icon={<BarChart3 className="w-5 h-5 text-violet-500" />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>P&L Trend</h3>
              <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>Revenue vs Expenses</p>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }} />
                  <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} fill="url(#revGrad)" />
                  <Area type="monotone" dataKey="cost" stroke="#ef4444" strokeWidth={2} fill="url(#costGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>Expense Breakdown</h3>
              <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>Distribution by category</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={expenseBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {expenseBreakdown.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }} formatter={(value: number | undefined) => [formatCurrency(value ?? 0), ""]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {expenseBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                      <span style={{ color: "var(--foreground)" }}>{item.name}</span>
                    </div>
                    <span className="font-medium" style={{ color: "var(--muted-foreground)" }}>{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </motion.div>
  );
}
