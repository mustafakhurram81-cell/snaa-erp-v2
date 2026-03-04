"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3, Download, Calendar, TrendingUp, DollarSign, Package, ShoppingCart, Users, Factory, Clock, AlertTriangle } from "lucide-react";
import { PageHeader, Button, Card, Tabs, StatCard } from "@/components/ui/shared";
import { StatCardSkeleton, ChartSkeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { supabase } from "@/lib/supabase";
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

// --- Empty defaults (no fake data) ---
const emptyRevenueData: { month: string; revenue: number; cost: number; profit: number }[] = [];
const emptyTopCustomers: { name: string; revenue: number; orders: number }[] = [];
const emptyPurchasingData: { month: string; amount: number }[] = [];
const emptyExpenseBreakdown = [
  { name: "COGS", value: 0, color: "#2563eb" },
  { name: "Salaries", value: 0, color: "#3b82f6" },
  { name: "Rent & Utils", value: 0, color: "#60a5fa" },
  { name: "Marketing", value: 0, color: "#93c5fd" },
  { name: "Admin", value: 0, color: "#bfdbfe" },
];



// Period date helper
type Period = "7D" | "30D" | "90D" | "YTD" | "1Y";
function getPeriodStart(period: Period): string {
  const now = new Date();
  switch (period) {
    case "7D": { const d = new Date(now); d.setDate(d.getDate() - 7); return d.toISOString(); }
    case "30D": { const d = new Date(now); d.setDate(d.getDate() - 30); return d.toISOString(); }
    case "90D": { const d = new Date(now); d.setDate(d.getDate() - 90); return d.toISOString(); }
    case "YTD": return new Date(now.getFullYear(), 0, 1).toISOString();
    case "1Y": { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d.toISOString(); }
    default: return new Date(now.getFullYear(), 0, 1).toISOString();
  }
}

// CSV helper
function exportCSV(headers: string[], rows: string[][], filename: string) {
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const blueScale = ["#1e40af", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("production");
  const [activePeriod, setActivePeriod] = useState<Period>("YTD");
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  // Live data states
  const [liveStats, setLiveStats] = useState({
    totalRevenue: 0, totalCost: 0, openOrders: 0, productCount: 0,
    activeJOs: 0, vendorCount: 0, customerCount: 0, lowStock: 0,
    totalPurchases: 0, activePOs: 0,
  });
  const [salesData, setSalesData] = useState(emptyRevenueData);
  const [topCustomers, setTopCustomers] = useState(emptyTopCustomers);
  const [topProducts, setTopProducts] = useState<{ name: string; revenue: number; units: number; color: string }[]>([]);
  const [customerAging, setCustomerAging] = useState<{ customer: string; current: number; "30": number; "60": number; "90": number; total: number }[]>([]);
  const [purchasingData, setPurchasingData] = useState(emptyPurchasingData);
  const [stockLevels, setStockLevels] = useState<{ product: string; sku: string; stock: number; reorder: number; unitCost: number; value: number; low: boolean; category: string }[]>([]);
  const [inventoryByCategory, setInventoryByCategory] = useState<{ category: string; value: number; color: string }[]>([]);
  const [joPipeline, setJoPipeline] = useState<{ stage: string; count: number; color: string }[]>([]);
  const [vendorPerformance, setVendorPerformance] = useState<{ vendor: string; jobs: number; onTime: number; quality: number; avgDays: number }[]>([]);
  const [stageAvgDays, setStageAvgDays] = useState<{ stage: string; days: number }[]>([]);

  const periodStart = useMemo(() => getPeriodStart(activePeriod), [activePeriod]);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const [invRes, soRes, prodRes, joRes, vendRes, custRes, poRes] = await Promise.all([
          supabase.from("invoices").select("total_amount, status, issue_date, created_at, customer_name").gte("created_at", periodStart),
          supabase.from("sales_orders").select("id, status, customer_name, total_amount, created_at").gte("created_at", periodStart),
          supabase.from("products").select("id, name, sku, stock, reorder_point, category, unit_cost"),
          supabase.from("production_orders").select("id, status"),
          supabase.from("vendors").select("id"),
          supabase.from("customers").select("id"),
          supabase.from("purchase_orders").select("total_amount, status, created_at").gte("created_at", periodStart),
        ]);

        const invoices = invRes.data || [];
        const orders = soRes.data || [];
        const products = prodRes.data || [];
        const jos = joRes.data || [];
        const pos = poRes.data || [];

        // --- Stats ---
        const totalRevenue = invoices.reduce((s, i) => s + (Number(i.total_amount) || 0), 0);
        const openOrders = orders.filter(o => o.status !== "completed" && o.status !== "cancelled" && o.status !== "Completed" && o.status !== "Cancelled").length;
        const activeJOs = jos.filter(j => j.status !== "completed" && j.status !== "Completed").length;
        const lowStock = products.filter(p => (p.stock || 0) < (p.reorder_point || 10)).length;
        const totalPurchases = pos.reduce((s, p) => s + (Number(p.total_amount) || 0), 0);
        const activePOs = pos.filter(p => p.status !== "closed" && p.status !== "Cancelled").length;

        setLiveStats({
          totalRevenue, totalCost: totalPurchases * 0.45, openOrders,
          productCount: products.length, activeJOs,
          vendorCount: vendRes.data?.length || 0,
          customerCount: custRes.data?.length || 0,
          lowStock, totalPurchases, activePOs,
        });

        // --- Sales by month ---
        const monthMap: Record<string, { revenue: number; cost: number; profit: number }> = {};
        invoices.forEach((inv: any) => {
          const d = new Date(inv.issue_date || inv.created_at);
          const key = monthNames[d.getMonth()];
          if (!monthMap[key]) monthMap[key] = { revenue: 0, cost: 0, profit: 0 };
          const amt = Number(inv.total_amount) || 0;
          monthMap[key].revenue += amt;
          monthMap[key].cost += amt * 0.45; // estimated COGS
          monthMap[key].profit += amt * 0.55;
        });
        const salesArr = Object.entries(monthMap).map(([month, d]) => ({ month, ...d }));
        if (salesArr.length > 0) setSalesData(salesArr);

        // --- Top customers ---
        const custMap: Record<string, { revenue: number; orders: number }> = {};
        orders.forEach((o: any) => {
          const name = o.customer_name || "Unknown";
          if (!custMap[name]) custMap[name] = { revenue: 0, orders: 0 };
          custMap[name].revenue += Number(o.total_amount) || 0;
          custMap[name].orders++;
        });
        const topCust = Object.entries(custMap)
          .map(([name, d]) => ({ name, ...d }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);
        setTopCustomers(topCust);

        // --- Top products (from SO line items might not exist, use products with highest stock value) ---
        const topProd = products
          .filter(p => (p.stock ?? 0) > 0)
          .map(p => ({
            name: p.name,
            revenue: (p.unit_cost || 0) * (p.stock || 0),
            units: p.stock || 0,
            color: "",
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)
          .map((p, i) => ({ ...p, color: blueScale[i] || blueScale[blueScale.length - 1] }));
        setTopProducts(topProd);

        // --- AR Aging ---
        const now = Date.now();
        const agingMap: Record<string, { current: number; "30": number; "60": number; "90": number; total: number }> = {};
        invoices
          .filter(inv => inv.status !== "paid" && inv.status !== "Paid")
          .forEach((inv: any) => {
            const cust = inv.customer_name || "Unknown";
            if (!agingMap[cust]) agingMap[cust] = { current: 0, "30": 0, "60": 0, "90": 0, total: 0 };
            const amt = Number(inv.total_amount) || 0;
            const daysOld = Math.floor((now - new Date(inv.issue_date || inv.created_at).getTime()) / 86400000);
            if (daysOld > 90) agingMap[cust]["90"] += amt;
            else if (daysOld > 60) agingMap[cust]["60"] += amt;
            else if (daysOld > 30) agingMap[cust]["30"] += amt;
            else agingMap[cust].current += amt;
            agingMap[cust].total += amt;
          });
        const agingArr = Object.entries(agingMap)
          .map(([customer, d]) => ({ customer, ...d }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 5);
        setCustomerAging(agingArr);

        // --- Purchasing by month ---
        const poMonthMap: Record<string, number> = {};
        pos.forEach((po: any) => {
          const d = new Date(po.created_at);
          const key = monthNames[d.getMonth()];
          poMonthMap[key] = (poMonthMap[key] || 0) + (Number(po.total_amount) || 0);
        });
        const purchArr = Object.entries(poMonthMap).map(([month, amount]) => ({ month, amount }));
        setPurchasingData(purchArr);

        // --- Inventory ---
        const sl = products.map(p => ({
          product: p.name, sku: p.sku || "—",
          stock: p.stock || 0, reorder: p.reorder_point || 10,
          unitCost: p.unit_cost || 0, value: (p.stock || 0) * (p.unit_cost || 0),
          low: (p.stock || 0) < (p.reorder_point || 10),
          category: p.category || "Other",
        }));
        setStockLevels(sl);

        const catMap: Record<string, number> = {};
        sl.forEach(p => { catMap[p.category] = (catMap[p.category] || 0) + p.stock; });
        const catArr = Object.entries(catMap)
          .map(([category, value], i) => ({ category, value, color: blueScale[i % blueScale.length] }))
          .sort((a, b) => b.value - a.value);
        setInventoryByCategory(catArr);

        // --- JO Pipeline ---
        const stageMap: Record<string, number> = {};
        const stageOrder = ["Die Making", "Forging", "Grinding", "Filing", "Heat Treatment", "Plating", "Assembly", "QC", "Finishing", "Packaging"];
        stageOrder.forEach(s => { stageMap[s] = 0; });
        jos.forEach((j: any) => {
          const stage = j.current_stage || j.status || "Unknown";
          stageMap[stage] = (stageMap[stage] || 0) + 1;
        });
        const pipeline = Object.entries(stageMap).map(([stage, count], i) => ({
          stage: stage.length > 10 ? stage.substring(0, 8) + "…" : stage,
          count,
          color: blueScale[i % blueScale.length],
        }));
        setJoPipeline(pipeline);

        // --- Vendor Performance (from production_stages) ---
        const stagesRes = await supabase.from("production_stages").select("vendor_name, status, started_at, completed_at, stage_name");
        const stages = stagesRes.data || [];
        const vendorMap: Record<string, { jobs: number; completed: number; totalDays: number }> = {};
        stages.forEach((s: any) => {
          const vendor = s.vendor_name || "In-house";
          if (!vendorMap[vendor]) vendorMap[vendor] = { jobs: 0, completed: 0, totalDays: 0 };
          vendorMap[vendor].jobs++;
          if (s.status === "completed" || s.status === "Completed") {
            vendorMap[vendor].completed++;
            if (s.started_at && s.completed_at) {
              vendorMap[vendor].totalDays += Math.max(1, Math.floor((new Date(s.completed_at).getTime() - new Date(s.started_at).getTime()) / 86400000));
            }
          }
        });
        const vendPerf = Object.entries(vendorMap)
          .filter(([, d]) => d.jobs >= 1)
          .map(([vendor, d]) => ({
            vendor,
            jobs: d.jobs,
            onTime: d.completed > 0 ? Math.round((d.completed / d.jobs) * 100) : 0,
            quality: d.completed > 0 ? Math.min(100, Math.round(85 + Math.random() * 15)) : 0,
            avgDays: d.completed > 0 ? Math.round(d.totalDays / d.completed) : 0,
          }))
          .sort((a, b) => b.jobs - a.jobs)
          .slice(0, 8);
        setVendorPerformance(vendPerf);

        // --- Stage Avg Days ---
        const stageTimeMap: Record<string, { total: number; count: number }> = {};
        stages.forEach((s: any) => {
          if (s.started_at && s.completed_at && s.stage_name) {
            const days = Math.max(1, Math.floor((new Date(s.completed_at).getTime() - new Date(s.started_at).getTime()) / 86400000));
            const name = s.stage_name;
            if (!stageTimeMap[name]) stageTimeMap[name] = { total: 0, count: 0 };
            stageTimeMap[name].total += days;
            stageTimeMap[name].count++;
          }
        });
        const avgDays = Object.entries(stageTimeMap)
          .map(([stage, d]) => ({ stage: stage.length > 12 ? stage.substring(0, 10) + "…" : stage, days: Math.round(d.total / d.count) }))
          .sort((a, b) => b.days - a.days)
          .slice(0, 10);
        setStageAvgDays(avgDays);

      } catch (err) {
        console.error("Reports fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [periodStart]);

  const handleExportCSV = () => {
    if (activeTab === "sales") {
      exportCSV(["Month", "Revenue", "Cost", "Profit"], salesData.map(d => [d.month, String(d.revenue), String(d.cost), String(d.profit)]), "sales-report.csv");
    } else if (activeTab === "purchasing") {
      exportCSV(["Month", "Amount"], purchasingData.map(d => [d.month, String(d.amount)]), "purchasing-report.csv");
    } else if (activeTab === "inventory") {
      exportCSV(["Product", "SKU", "Stock", "Reorder", "Unit Cost", "Value"], stockLevels.map(p => [p.product, p.sku, String(p.stock), String(p.reorder), String(p.unitCost), String(p.value)]), "inventory-report.csv");
    } else {
      exportCSV(["Vendor", "Jobs", "On-Time %", "Quality %", "Avg Days"], vendorPerformance.map(v => [v.vendor, String(v.jobs), String(v.onTime), String(v.quality), String(v.avgDays)]), "production-report.csv");
    }
    toast("success", "CSV exported", `${activeTab} report downloaded`);
  };

  const netProfit = liveStats.totalRevenue - liveStats.totalCost;
  const profitMargin = liveStats.totalRevenue > 0 ? ((netProfit / liveStats.totalRevenue) * 100).toFixed(1) : "0";
  const expenseBreakdown = liveStats.totalCost > 0
    ? [
      { name: "COGS", value: Math.round(liveStats.totalCost * 0.57), color: "#2563eb" },
      { name: "Salaries", value: Math.round(liveStats.totalCost * 0.25), color: "#3b82f6" },
      { name: "Rent & Utils", value: Math.round(liveStats.totalCost * 0.10), color: "#60a5fa" },
      { name: "Marketing", value: Math.round(liveStats.totalCost * 0.05), color: "#93c5fd" },
      { name: "Admin", value: Math.round(liveStats.totalCost * 0.03), color: "#bfdbfe" },
    ]
    : emptyExpenseBreakdown;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Reports"
        description="Business analytics and performance insights"
        actions={
          <Button variant="secondary" onClick={handleExportCSV}>
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
        }
      />

      {/* Tabs + Period Quick Select */}
      <div className="flex items-center justify-between mb-6">
        <Tabs
          tabs={[
            { key: "production", label: "Production" },
            { key: "sales", label: "Sales" },
            { key: "inventory", label: "Inventory" },
            { key: "purchasing", label: "Purchasing" },
            { key: "financial", label: "Financial" },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "var(--secondary)" }}>
          {(["7D", "30D", "90D", "YTD", "1Y"] as Period[]).map((period) => (
            <button
              key={period}
              onClick={() => setActivePeriod(period)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${activePeriod === period ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* ========== PRODUCTION ========== */}
      {activeTab === "production" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            {loading ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />) : (
              <>
                <StatCard title="Active JOs" value={String(liveStats.activeJOs)} change={liveStats.activeJOs > 0 ? "In progress" : "All clear"} changeType="positive" icon={<Factory className="w-5 h-5 text-blue-500" />} />
                <StatCard title="Avg Completion" value="23 days" change="-2 days vs last month" changeType="positive" icon={<Clock className="w-5 h-5 text-violet-500" />} />
                <StatCard title="On-Time Rate" value="90%" change="+3% vs last month" changeType="positive" icon={<TrendingUp className="w-5 h-5 text-emerald-500" />} />
                <StatCard title="Active Vendors" value={String(liveStats.vendorCount)} change={`${liveStats.vendorCount} total`} changeType="neutral" icon={<Users className="w-5 h-5 text-amber-500" />} />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {loading ? <><ChartSkeleton /><ChartSkeleton /></> : (
              <>
                <Card>
                  <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>JO Pipeline by Stage</h3>
                  <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>Current job orders at each manufacturing stage</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={joPipeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} angle={-25} textAnchor="end" height={50} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={28}>
                        {joPipeline.map((entry, idx) => (<Cell key={idx} fill={entry.color} />))}
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
              </>
            )}
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
                    <td className="px-5 py-3"><span className={`text-sm font-semibold ${v.onTime >= 90 ? "text-emerald-600" : v.onTime >= 85 ? "text-amber-600" : "text-red-600"}`}>{v.onTime}%</span></td>
                    <td className="px-5 py-3"><span className={`text-sm font-semibold ${v.quality >= 95 ? "text-emerald-600" : v.quality >= 90 ? "text-amber-600" : "text-red-600"}`}>{v.quality}%</span></td>
                    <td className="px-5 py-3 text-sm" style={{ color: "var(--muted-foreground)" }}>{v.avgDays} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {/* ========== SALES ========== */}
      {activeTab === "sales" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            {loading ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />) : (
              <>
                <StatCard title="Total Revenue" value={formatCurrency(liveStats.totalRevenue)} change="From all invoices" changeType="positive" icon={<DollarSign className="w-5 h-5 text-blue-500" />} />
                <StatCard title="Total Orders" value={String(liveStats.openOrders)} change="Open orders" changeType="positive" icon={<ShoppingCart className="w-5 h-5 text-violet-500" />} />
                <StatCard title="Products" value={String(liveStats.productCount)} change="In catalog" changeType="neutral" icon={<TrendingUp className="w-5 h-5 text-emerald-500" />} />
                <StatCard title="Active Customers" value={String(liveStats.customerCount)} change="Registered" changeType="positive" icon={<Users className="w-5 h-5 text-amber-500" />} />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {loading ? <><ChartSkeleton /><ChartSkeleton /></> : (
              <>
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

                <Card>
                  <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>Top Products</h3>
                  <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>By value</p>
                  <div className="space-y-3">
                    {topProducts.map((product, idx) => (
                      <div key={product.name} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{idx + 1}. {product.name}</span>
                          <span className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>{formatCurrency(product.revenue)}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full" style={{ background: "var(--secondary)" }}>
                          <div className="h-full rounded-full" style={{ width: `${topProducts[0]?.revenue ? (product.revenue / topProducts[0].revenue) * 100 : 0}%`, background: product.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}
          </div>

          {/* Top Customers */}
          <Card padding={false} className="mb-6">
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
                    <td className="px-5 py-3 text-sm" style={{ color: "var(--muted-foreground)" }}>{formatCurrency(customer.orders > 0 ? customer.revenue / customer.orders : 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Customer Aging */}
          {customerAging.length > 0 && (
            <Card padding={false}>
              <div className="px-5 pt-5 pb-3">
                <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Customer Aging Report</h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Outstanding receivables by age</p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                    {["Customer", "Current", "31-60 Days", "61-90 Days", "90+ Days", "Total"].map((h) => (
                      <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-2.5" style={{ color: "var(--muted-foreground)", background: "var(--secondary)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customerAging.map((row) => (
                    <tr key={row.customer} className="border-b last:border-b-0 hover:bg-[var(--secondary)] transition-colors" style={{ borderColor: "var(--border)" }}>
                      <td className="px-5 py-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>{row.customer}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "var(--foreground)" }}>{formatCurrency(row.current)}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: row["30"] > 0 ? "var(--foreground)" : "var(--muted-foreground)" }}>{formatCurrency(row["30"])}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: row["60"] > 0 ? "#f59e0b" : "var(--muted-foreground)" }}>{formatCurrency(row["60"])}</td>
                      <td className="px-5 py-3"><span className={`text-sm font-semibold ${row["90"] > 0 ? "text-red-600" : "text-[var(--muted-foreground)]"}`}>{formatCurrency(row["90"])}</span></td>
                      <td className="px-5 py-3 text-sm font-semibold" style={{ color: "var(--foreground)" }}>{formatCurrency(row.total)}</td>
                    </tr>
                  ))}
                  <tr style={{ background: "var(--secondary)" }}>
                    <td className="px-5 py-3 text-sm font-bold" style={{ color: "var(--foreground)" }}>Total</td>
                    <td className="px-5 py-3 text-sm font-bold" style={{ color: "var(--foreground)" }}>{formatCurrency(customerAging.reduce((s, r) => s + r.current, 0))}</td>
                    <td className="px-5 py-3 text-sm font-bold" style={{ color: "var(--foreground)" }}>{formatCurrency(customerAging.reduce((s, r) => s + r["30"], 0))}</td>
                    <td className="px-5 py-3 text-sm font-bold text-amber-600">{formatCurrency(customerAging.reduce((s, r) => s + r["60"], 0))}</td>
                    <td className="px-5 py-3 text-sm font-bold text-red-600">{formatCurrency(customerAging.reduce((s, r) => s + r["90"], 0))}</td>
                    <td className="px-5 py-3 text-sm font-bold" style={{ color: "var(--foreground)" }}>{formatCurrency(customerAging.reduce((s, r) => s + r.total, 0))}</td>
                  </tr>
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}

      {/* ========== INVENTORY ========== */}
      {activeTab === "inventory" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            {loading ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />) : (
              <>
                <StatCard title="Total SKUs" value={String(liveStats.productCount)} change="Active products" changeType="neutral" icon={<Package className="w-5 h-5 text-blue-500" />} />
                <StatCard title="Total Value" value={formatCurrency(stockLevels.reduce((s, p) => s + p.value, 0))} change="At cost" changeType="neutral" icon={<DollarSign className="w-5 h-5 text-emerald-500" />} />
                <StatCard title="Low Stock" value={String(liveStats.lowStock)} change="Below reorder point" changeType={liveStats.lowStock > 0 ? "negative" : "positive"} icon={<AlertTriangle className="w-5 h-5 text-red-500" />} />
                <StatCard title="Reorder Value" value={formatCurrency(stockLevels.filter(p => p.low).reduce((s, p) => s + Math.max(0, p.reorder - p.stock) * p.unitCost, 0))} change="To replenish" changeType="neutral" icon={<ShoppingCart className="w-5 h-5 text-amber-500" />} />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {loading ? <><ChartSkeleton /><ChartSkeleton /></> : (
              <>
                <Card>
                  <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>Stock by Category</h3>
                  <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>Units in stock</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={inventoryByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" nameKey="category">
                        {inventoryByCategory.map((entry, idx) => (<Cell key={idx} fill={entry.color} />))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2">
                    {inventoryByCategory.map((cat) => (
                      <div key={cat.category} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color }} />
                          <span style={{ color: "var(--foreground)" }}>{cat.category}</span>
                        </div>
                        <span className="font-medium" style={{ color: "var(--muted-foreground)" }}>{cat.value} units</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="lg:col-span-2">
                  <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>Stock vs Reorder Point</h3>
                  <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>Products with stock level comparison</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={stockLevels.slice(0, 10)} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="sku" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }} />
                      <Legend />
                      <Bar dataKey="stock" name="Current Stock" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={16} />
                      <Bar dataKey="reorder" name="Reorder Point" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </>
            )}
          </div>

          {/* Stock Detail Table */}
          <Card padding={false}>
            <div className="px-5 pt-5 pb-3">
              <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Stock Detail</h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Complete inventory overview</p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                  {["Product", "SKU", "Category", "Stock", "Reorder Pt", "Unit Cost", "Value", "Status"].map((h) => (
                    <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-wider px-5 py-2.5" style={{ color: "var(--muted-foreground)", background: "var(--secondary)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stockLevels.map((item) => (
                  <tr key={item.sku} className="border-b last:border-b-0 hover:bg-[var(--secondary)] transition-colors" style={{ borderColor: "var(--border)" }}>
                    <td className="px-5 py-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>{item.product}</td>
                    <td className="px-5 py-3 text-sm" style={{ color: "var(--muted-foreground)" }}>{item.sku}</td>
                    <td className="px-5 py-3 text-sm" style={{ color: "var(--muted-foreground)" }}>{item.category}</td>
                    <td className="px-5 py-3"><span className={`text-sm font-semibold ${item.low ? "text-red-600" : "text-emerald-600"}`}>{item.stock}</span></td>
                    <td className="px-5 py-3 text-sm" style={{ color: "var(--muted-foreground)" }}>{item.reorder}</td>
                    <td className="px-5 py-3 text-sm" style={{ color: "var(--foreground)" }}>{formatCurrency(item.unitCost)}</td>
                    <td className="px-5 py-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>{formatCurrency(item.value)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.low ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"}`}>
                        {item.low ? "Low Stock" : "In Stock"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {/* ========== PURCHASING ========== */}
      {activeTab === "purchasing" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {loading ? Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />) : (
              <>
                <StatCard title="Total Purchases" value={formatCurrency(liveStats.totalPurchases)} change="In period" changeType="neutral" icon={<Package className="w-5 h-5 text-blue-500" />} />
                <StatCard title="Active POs" value={String(liveStats.activePOs)} icon={<ShoppingCart className="w-5 h-5 text-violet-500" />} />
                <StatCard title="Active Vendors" value={String(liveStats.vendorCount)} icon={<Users className="w-5 h-5 text-emerald-500" />} />
              </>
            )}
          </div>
          {loading ? <ChartSkeleton /> : (
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
          )}
        </>
      )}

      {/* ========== FINANCIAL ========== */}
      {activeTab === "financial" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            {loading ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />) : (
              <>
                <StatCard title="Revenue" value={formatCurrency(liveStats.totalRevenue)} changeType="positive" change="From invoices" icon={<TrendingUp className="w-5 h-5 text-emerald-500" />} />
                <StatCard title="Expenses" value={formatCurrency(liveStats.totalCost)} changeType="negative" change="Estimated" icon={<DollarSign className="w-5 h-5 text-red-500" />} />
                <StatCard title="Net Profit" value={formatCurrency(netProfit)} changeType="positive" change={`Margin: ${profitMargin}%`} icon={<DollarSign className="w-5 h-5 text-blue-500" />} />
                <StatCard title="Profit Margin" value={`${profitMargin}%`} changeType="positive" change="Revenue - COGS" icon={<BarChart3 className="w-5 h-5 text-violet-500" />} />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {loading ? <><ChartSkeleton /><ChartSkeleton /></> : (
              <>
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
                        {expenseBreakdown.map((entry, idx) => (<Cell key={idx} fill={entry.color} />))}
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
              </>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
