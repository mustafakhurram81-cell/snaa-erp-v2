"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Calculator, ChevronRight, ChevronDown, Plus, BookOpen, DollarSign, TrendingUp, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { PageHeader, Button, Card, Tabs, StatCard } from "@/components/ui/shared";
import { formatCurrency } from "@/lib/utils";
import { useSupabaseTable } from "@/lib/supabase-hooks";

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  balance: number;
  children?: Account[];
}

interface DBAccount {
  id: string;
  code: string;
  name: string;
  category: string;
  subcategory: string;
  balance: number;
  is_active: boolean;
}

interface JournalEntry {
  id: string;
  entry_number: string;
  date: string;
  description: string;
  lines: { account: string; debit: number; credit: number }[];
  total: number;
  status: string;
}

// Category to type mapping
function categoryToType(cat: string): string {
  switch (cat) {
    case "Assets": return "asset";
    case "Liabilities": return "liability";
    case "Equity": return "equity";
    case "Revenue": return "revenue";
    case "Expenses": return "expense";
    default: return "asset";
  }
}

function groupAccounts(dbAccounts: DBAccount[]): Account[] {
  const groups: Record<string, { accounts: DBAccount[]; totalBalance: number }> = {};

  const categoryOrder = ["Assets", "Liabilities", "Equity", "Revenue", "Expenses"];
  categoryOrder.forEach(c => { groups[c] = { accounts: [], totalBalance: 0 }; });

  dbAccounts.forEach(acc => {
    const cat = acc.category || "Assets";
    if (!groups[cat]) groups[cat] = { accounts: [], totalBalance: 0 };
    groups[cat].accounts.push(acc);
    groups[cat].totalBalance += acc.balance || 0;
  });

  return categoryOrder
    .filter(cat => groups[cat] && groups[cat].accounts.length > 0)
    .map(cat => ({
      id: cat,
      code: `${groups[cat].accounts[0]?.code?.substring(0, 1)}000`,
      name: cat,
      type: categoryToType(cat),
      balance: groups[cat].totalBalance,
      children: groups[cat].accounts.map(a => ({
        id: a.id,
        code: a.code,
        name: a.name,
        type: categoryToType(cat),
        balance: a.balance || 0,
      })),
    }));
}

const mockJournals: JournalEntry[] = [
  { id: "1", entry_number: "JE-2026-089", date: "2026-02-25", description: "Invoice INV-2026-045 payment received", lines: [{ account: "Cash & Bank", debit: 12500, credit: 0 }, { account: "Accounts Receivable", debit: 0, credit: 12500 }], total: 12500, status: "posted" },
  { id: "2", entry_number: "JE-2026-088", date: "2026-02-24", description: "Purchase from Premium Steel Corp", lines: [{ account: "Inventory", debit: 28000, credit: 0 }, { account: "Accounts Payable", debit: 0, credit: 28000 }], total: 28000, status: "posted" },
  { id: "3", entry_number: "JE-2026-087", date: "2026-02-23", description: "Monthly salaries", lines: [{ account: "Salaries & Wages", debit: 42500, credit: 0 }, { account: "Cash & Bank", debit: 0, credit: 42500 }], total: 42500, status: "posted" },
  { id: "4", entry_number: "JE-2026-086", date: "2026-02-22", description: "Utility bills payment", lines: [{ account: "Rent & Utilities", debit: 8500, credit: 0 }, { account: "Cash & Bank", debit: 0, credit: 8500 }], total: 8500, status: "posted" },
  { id: "5", entry_number: "JE-2026-085", date: "2026-02-20", description: "Sales revenue from Gulf HC", lines: [{ account: "Accounts Receivable", debit: 42000, credit: 0 }, { account: "Product Sales", debit: 0, credit: 42000 }], total: 42000, status: "posted" },
  { id: "6", entry_number: "JE-2026-084", date: "2026-02-18", description: "Vendor payment to Ali Steel Works", lines: [{ account: "Accounts Payable", debit: 15000, credit: 0 }, { account: "Cash & Bank", debit: 0, credit: 15000 }], total: 15000, status: "draft" },
];

const arAging = [
  { customer: "Gulf Healthcare", current: 15000, thirtyDays: 12000, sixtyDays: 8000, ninetyDays: 0, total: 35000 },
  { customer: "City Hospital", current: 8500, thirtyDays: 4000, sixtyDays: 0, ninetyDays: 0, total: 12500 },
  { customer: "Metro Medical", current: 6200, thirtyDays: 2700, sixtyDays: 0, ninetyDays: 0, total: 8900 },
  { customer: "Central Clinic", current: 0, thirtyDays: 15200, sixtyDays: 0, ninetyDays: 0, total: 15200 },
  { customer: "National Hospital", current: 22000, thirtyDays: 0, sixtyDays: 0, ninetyDays: 0, total: 22000 },
  { customer: "Prime Healthcare", current: 3100, thirtyDays: 0, sixtyDays: 3200, ninetyDays: 0, total: 6300 },
];

const apAging = [
  { vendor: "Premium Steel Corp", current: 28000, thirtyDays: 12000, sixtyDays: 0, ninetyDays: 0, total: 40000 },
  { vendor: "Global Stainless Ltd", current: 0, thirtyDays: 18500, sixtyDays: 0, ninetyDays: 0, total: 18500 },
  { vendor: "Ali Steel Works", current: 15000, thirtyDays: 0, sixtyDays: 0, ninetyDays: 0, total: 15000 },
  { vendor: "Riaz Forging", current: 12000, thirtyDays: 5000, sixtyDays: 0, ninetyDays: 0, total: 17000 },
  { vendor: "Precision Grinders", current: 8000, thirtyDays: 0, sixtyDays: 0, ninetyDays: 0, total: 8000 },
];

const trialBalance = [
  { account: "1100 – Cash & Bank", debit: 245000, credit: 0 },
  { account: "1200 – Accounts Receivable", debit: 127000, credit: 0 },
  { account: "1300 – Inventory", debit: 380000, credit: 0 },
  { account: "1400 – Fixed Assets", debit: 140000, credit: 0 },
  { account: "2100 – Accounts Payable", debit: 0, credit: 170500 },
  { account: "2200 – Accrued Expenses", debit: 0, credit: 25000 },
  { account: "2300 – Tax Payable", debit: 0, credit: 19500 },
  { account: "3100 – Owner's Capital", debit: 0, credit: 500000 },
  { account: "3200 – Retained Earnings", debit: 0, credit: 177000 },
  { account: "4100 – Product Sales", debit: 0, credit: 495000 },
  { account: "4200 – Service Income", debit: 0, credit: 28000 },
  { account: "5100 – Cost of Goods Sold", debit: 198000, credit: 0 },
  { account: "5200 – Salaries & Wages", debit: 85000, credit: 0 },
  { account: "5300 – Rent & Utilities", debit: 35000, credit: 0 },
  { account: "5400 – Marketing & Sales", debit: 18000, credit: 0 },
  { account: "5500 – General & Admin", debit: 10000, credit: 0 },
];

function AccountRow({ account, level = 0 }: { account: Account; level?: number }) {
  const [expanded, setExpanded] = useState(level === 0);
  const hasChildren = account.children && account.children.length > 0;
  const typeColors: Record<string, string> = {
    asset: "text-blue-600 dark:text-blue-400",
    liability: "text-red-600 dark:text-red-400",
    equity: "text-violet-600 dark:text-violet-400",
    revenue: "text-emerald-600 dark:text-emerald-400",
    expense: "text-amber-600 dark:text-amber-400",
  };

  return (
    <>
      <div
        className="flex items-center py-2.5 px-4 hover:bg-[var(--secondary)] transition-colors cursor-pointer border-b"
        style={{ paddingLeft: `${level * 24 + 16}px`, borderColor: "var(--border)" }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 flex-1">
          {hasChildren ? (
            expanded ? <ChevronDown className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} /> : <ChevronRight className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
          ) : (
            <div className="w-3.5" />
          )}
          <span className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>{account.code}</span>
          <span className={`text-sm ${level === 0 ? "font-semibold" : "font-medium"}`} style={{ color: "var(--foreground)" }}>
            {account.name}
          </span>
        </div>
        <span className={`text-sm font-semibold ${typeColors[account.type] || ""}`}>
          {formatCurrency(account.balance)}
        </span>
      </div>
      {expanded && account.children?.map((child) => (
        <AccountRow key={child.id} account={child} level={level + 1} />
      ))}
    </>
  );
}

function AgingTable({ data, entityKey }: { data: { [key: string]: string | number }[]; entityKey: string }) {
  const headers = [entityKey === "customer" ? "Customer" : "Vendor", "Current", "30 Days", "60 Days", "90+ Days", "Total"];
  const totals = data.reduce((acc, row) => ({
    current: (acc.current as number) + (row.current as number),
    thirtyDays: (acc.thirtyDays as number) + (row.thirtyDays as number),
    sixtyDays: (acc.sixtyDays as number) + (row.sixtyDays as number),
    ninetyDays: (acc.ninetyDays as number) + (row.ninetyDays as number),
    total: (acc.total as number) + (row.total as number),
  }), { current: 0, thirtyDays: 0, sixtyDays: 0, ninetyDays: 0, total: 0 });

  return (
    <Card padding={false}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b" style={{ borderColor: "var(--border)" }}>
              {headers.map((h) => (
                <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-3" style={{ color: "var(--muted-foreground)", background: "var(--secondary)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className="border-b last:border-b-0 hover:bg-[var(--secondary)] transition-colors" style={{ borderColor: "var(--border)" }}>
                <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>{row[entityKey] as string}</td>
                <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>{formatCurrency(row.current as number)}</td>
                <td className="px-4 py-3 text-sm" style={{ color: (row.thirtyDays as number) > 0 ? "var(--foreground)" : "var(--muted-foreground)" }}>
                  {(row.thirtyDays as number) > 0 ? formatCurrency(row.thirtyDays as number) : "-"}
                </td>
                <td className="px-4 py-3">
                  <span className={(row.sixtyDays as number) > 0 ? "text-sm font-semibold text-amber-600 dark:text-amber-400" : "text-sm text-[var(--muted-foreground)]"}>
                    {(row.sixtyDays as number) > 0 ? formatCurrency(row.sixtyDays as number) : "-"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={(row.ninetyDays as number) > 0 ? "text-sm font-semibold text-red-600 dark:text-red-400" : "text-sm text-[var(--muted-foreground)]"}>
                    {(row.ninetyDays as number) > 0 ? formatCurrency(row.ninetyDays as number) : "-"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-semibold" style={{ color: "var(--foreground)" }}>{formatCurrency(row.total as number)}</td>
              </tr>
            ))}
            {/* Totals row */}
            <tr style={{ background: "var(--secondary)" }}>
              <td className="px-4 py-3 text-sm font-bold" style={{ color: "var(--foreground)" }}>Total</td>
              <td className="px-4 py-3 text-sm font-bold" style={{ color: "var(--foreground)" }}>{formatCurrency(totals.current as number)}</td>
              <td className="px-4 py-3 text-sm font-bold" style={{ color: "var(--foreground)" }}>{formatCurrency(totals.thirtyDays as number)}</td>
              <td className="px-4 py-3 text-sm font-bold text-amber-600 dark:text-amber-400">{formatCurrency(totals.sixtyDays as number)}</td>
              <td className="px-4 py-3 text-sm font-bold text-red-600 dark:text-red-400">{formatCurrency(totals.ninetyDays as number)}</td>
              <td className="px-4 py-3 text-sm font-bold" style={{ color: "var(--foreground)" }}>{formatCurrency(totals.total as number)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState("coa");
  const { data: dbAccounts, loading } = useSupabaseTable<DBAccount>("accounting_accounts", { orderBy: "code", ascending: true });

  const chartOfAccounts = useMemo(() => groupAccounts(dbAccounts as any[]), [dbAccounts]);

  // Compute stats from live data
  const totalAssets = chartOfAccounts.find(a => a.name === "Assets")?.balance || 0;
  const totalAR = dbAccounts.find((a: any) => a.code === "1010")?.balance || 0;
  const totalAP = dbAccounts.find((a: any) => a.code === "2000")?.balance || 0;
  const totalRevenue = chartOfAccounts.find(a => a.name === "Revenue")?.balance || 0;
  const totalExpenses = chartOfAccounts.find(a => a.name === "Expenses")?.balance || 0;
  const netProfit = totalRevenue - totalExpenses;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Accounting"
        description={`Chart of Accounts · ${dbAccounts.length} accounts`}
        actions={
          <Button>
            <Plus className="w-3.5 h-3.5" />
            New Journal Entry
          </Button>
        }
      />

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Assets" value={formatCurrency(totalAssets)} changeType="positive" change={`${chartOfAccounts.find(a => a.name === "Assets")?.children?.length || 0} accounts`} icon={<DollarSign className="w-5 h-5 text-blue-500" />} />
        <StatCard title="Accounts Receivable" value={formatCurrency(totalAR)} changeType="neutral" change="Receivables" icon={<ArrowUpRight className="w-5 h-5 text-emerald-500" />} />
        <StatCard title="Accounts Payable" value={formatCurrency(totalAP)} changeType="neutral" change="Payables" icon={<ArrowDownRight className="w-5 h-5 text-red-500" />} />
        <StatCard title="Net Profit" value={formatCurrency(netProfit)} changeType={netProfit >= 0 ? "positive" : "negative"} change={totalRevenue > 0 ? `${((netProfit / totalRevenue) * 100).toFixed(1)}% margin` : "—"} icon={<TrendingUp className="w-5 h-5 text-violet-500" />} />
      </div>

      <div className="mb-5">
        <Tabs
          tabs={[
            { key: "coa", label: "Chart of Accounts", count: dbAccounts.length },
            { key: "journal", label: "Journal Entries", count: mockJournals.length },
            { key: "ar", label: "AR Aging" },
            { key: "ap", label: "AP Aging" },
            { key: "trial", label: "Trial Balance" },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {activeTab === "coa" && (
        <Card padding={false}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)", background: "var(--secondary)" }}>
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Account</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Balance</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
            </div>
          ) : (
            chartOfAccounts.map((account) => (
              <AccountRow key={account.id} account={account} />
            ))
          )}
        </Card>
      )}

      {activeTab === "journal" && (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                  {["Entry #", "Date", "Description", "Debit", "Credit", "Status"].map((h) => (
                    <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-3" style={{ color: "var(--muted-foreground)", background: "var(--secondary)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockJournals.map((entry) => (
                  <React.Fragment key={entry.id}>
                    <tr className="border-b hover:bg-[var(--secondary)] transition-colors cursor-pointer" style={{ borderColor: "var(--border)" }}>
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--primary)" }}>{entry.entry_number}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--muted-foreground)" }}>{entry.date}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--foreground)" }}>{entry.description}</td>
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>
                        {formatCurrency(entry.lines.reduce((s, l) => s + l.debit, 0))}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>
                        {formatCurrency(entry.lines.reduce((s, l) => s + l.credit, 0))}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${entry.status === "posted"
                          ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400"
                          : "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400"
                          }`}>{entry.status}</span>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === "ar" && (
        <>
          <div className="mb-4">
            <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Accounts Receivable Aging</h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Outstanding customer invoices by aging period</p>
          </div>
          <AgingTable data={arAging} entityKey="customer" />
        </>
      )}

      {activeTab === "ap" && (
        <>
          <div className="mb-4">
            <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Accounts Payable Aging</h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Outstanding vendor bills by aging period</p>
          </div>
          <AgingTable data={apAging} entityKey="vendor" />
        </>
      )}

      {activeTab === "trial" && (
        <>
          <div className="mb-4">
            <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Trial Balance</h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>As of February 27, 2026</p>
          </div>
          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                    {["Account", "Debit", "Credit"].map((h) => (
                      <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-3" style={{ color: "var(--muted-foreground)", background: "var(--secondary)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trialBalance.map((row, idx) => (
                    <tr key={idx} className="border-b last:border-b-0 hover:bg-[var(--secondary)] transition-colors" style={{ borderColor: "var(--border)" }}>
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>{row.account}</td>
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: row.debit > 0 ? "var(--foreground)" : "var(--muted-foreground)" }}>
                        {row.debit > 0 ? formatCurrency(row.debit) : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: row.credit > 0 ? "var(--foreground)" : "var(--muted-foreground)" }}>
                        {row.credit > 0 ? formatCurrency(row.credit) : "-"}
                      </td>
                    </tr>
                  ))}
                  {/* Totals */}
                  <tr style={{ background: "var(--secondary)" }}>
                    <td className="px-4 py-3 text-sm font-bold" style={{ color: "var(--foreground)" }}>Total</td>
                    <td className="px-4 py-3 text-sm font-bold" style={{ color: "var(--foreground)" }}>
                      {formatCurrency(trialBalance.reduce((s, r) => s + r.debit, 0))}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold" style={{ color: "var(--foreground)" }}>
                      {formatCurrency(trialBalance.reduce((s, r) => s + r.credit, 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </motion.div>
  );
}
