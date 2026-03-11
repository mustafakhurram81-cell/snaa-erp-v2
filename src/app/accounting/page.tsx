"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Calculator, ChevronRight, ChevronDown, Plus, BookOpen, DollarSign, TrendingUp, ArrowDownRight, ArrowUpRight, Pencil, Trash2 } from "lucide-react";
import { PageHeader, Button, Card, Tabs, StatCard, Drawer, Input, Select } from "@/components/ui/shared";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { useSupabaseTable } from "@/lib/supabase-hooks";
import { supabase } from "@/lib/supabase";
import { TableSkeleton, EmptyState } from "@/components/ui/shared";

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
  status: string;
}

interface DBJournalLine {
  id: string;
  journal_entry_id: string;
  account_name: string;
  debit: number;
  credit: number;
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

const fallbackJournals: JournalEntry[] = [];

/** Compute aging buckets for an invoice/PO based on due_date */
function getAgingBucket(dueDate: string): "current" | "thirtyDays" | "sixtyDays" | "ninetyDays" {
  const now = new Date();
  const due = new Date(dueDate);
  const diffDays = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "current";
  if (diffDays <= 30) return "thirtyDays";
  if (diffDays <= 60) return "sixtyDays";
  return "ninetyDays";
}

function AccountRow({ account, level = 0, onEdit, onDelete }: { account: Account; level?: number; onEdit?: (id: string) => void; onDelete?: (id: string) => void }) {
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
        className="group flex items-center py-2.5 px-4 hover:bg-[var(--secondary)] transition-colors cursor-pointer border-b"
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
        {level > 0 && onEdit && onDelete && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mr-3">
            <button onClick={(e) => { e.stopPropagation(); onEdit(account.id); }} className="p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
              <Pencil className="w-3 h-3 text-blue-500" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(account.id); }} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <Trash2 className="w-3 h-3 text-red-500" />
            </button>
          </div>
        )}
        <span className={`text-sm font-semibold ${typeColors[account.type] || ""}`}>
          {formatCurrency(account.balance)}
        </span>
      </div>
      {expanded && account.children?.map((child) => (
        <AccountRow key={child.id} account={child} level={level + 1} onEdit={onEdit} onDelete={onDelete} />
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
  const { data: dbAccounts, loading, fetchAll } = useSupabaseTable<DBAccount>("accounting_accounts", { orderBy: "code", ascending: true });
  const { data: journalEntries } = useSupabaseTable<JournalEntry>("journal_entries", { orderBy: "date", ascending: false });
  const { data: journalLines } = useSupabaseTable<DBJournalLine>("journal_entry_lines");
  const displayJournals = journalEntries.length > 0 ? journalEntries : fallbackJournals;
  const { toast } = useToast();

  // --- Journal Entry Creation ---
  const [showJournalDialog, setShowJournalDialog] = useState(false);
  interface JELine { id: string; account: string; debit: string; credit: string; }
  const emptyLine = (): JELine => ({ id: Date.now().toString() + Math.random(), account: "", debit: "", credit: "" });
  const [jeDate, setJeDate] = useState("");
  const [jeDesc, setJeDesc] = useState("");
  const [jeLines, setJeLines] = useState<JELine[]>([emptyLine(), emptyLine()]);

  const resetJEForm = () => {
    setJeDate("");
    setJeDesc("");
    setJeLines([emptyLine(), emptyLine()]);
  };

  const handleCreateJE = async () => {
    if (!jeDesc.trim()) { toast("error", "Description is required"); return; }
    const totalDebit = jeLines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
    const totalCredit = jeLines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
    if (totalDebit === 0) { toast("error", "At least one debit amount is required"); return; }
    if (Math.abs(totalDebit - totalCredit) > 0.01) { toast("error", `Debits (${totalDebit}) must equal Credits (${totalCredit})`); return; }

    // Generate next JE number
    const { data: lastJE } = await supabase.from("journal_entries").select("entry_number").order("created_at", { ascending: false }).limit(1);
    let jeNum = 1;
    if (lastJE && lastJE.length > 0) { const m = lastJE[0].entry_number.match(/(\d+)$/); if (m) jeNum = parseInt(m[1]) + 1; }
    const entryNumber = `JE-2026-${String(jeNum).padStart(3, "0")}`;

    const { data: entry, error: jeErr } = await supabase.from("journal_entries").insert({
      entry_number: entryNumber,
      date: jeDate || new Date().toISOString().split("T")[0],
      description: jeDesc,
      status: "Draft",
    }).select().single();

    if (jeErr || !entry) { toast("error", "Failed to create journal entry"); return; }

    const lines = jeLines
      .filter(l => (parseFloat(l.debit) || 0) > 0 || (parseFloat(l.credit) || 0) > 0)
      .map(l => ({
        journal_entry_id: entry.id,
        account_name: l.account || "Unspecified",
        debit: parseFloat(l.debit) || 0,
        credit: parseFloat(l.credit) || 0,
      }));
    await supabase.from("journal_entry_lines").insert(lines);

    setShowJournalDialog(false);
    resetJEForm();
    toast("success", `Journal Entry ${entryNumber} created`);
    fetchAll();
  };

  // --- Chart of Accounts CRUD ---
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<DBAccount | null>(null);
  const [acctCode, setAcctCode] = useState("");
  const [acctName, setAcctName] = useState("");
  const [acctCategory, setAcctCategory] = useState("Assets");
  const [acctBalance, setAcctBalance] = useState("");

  const resetAcctForm = () => { setAcctCode(""); setAcctName(""); setAcctCategory("Assets"); setAcctBalance(""); setEditingAccount(null); };

  const openEditAccount = (acc: DBAccount) => {
    setEditingAccount(acc);
    setAcctCode(acc.code);
    setAcctName(acc.name);
    setAcctCategory(acc.category);
    setAcctBalance(String(acc.balance || 0));
    setShowAccountDialog(true);
  };

  const handleSaveAccount = async () => {
    if (!acctCode.trim()) { toast("error", "Account code is required"); return; }
    if (!acctName.trim()) { toast("error", "Account name is required"); return; }
    const payload = {
      code: acctCode,
      name: acctName,
      category: acctCategory,
      subcategory: acctCategory,
      balance: parseFloat(acctBalance) || 0,
      is_active: true,
    };
    if (editingAccount) {
      const { error } = await supabase.from("accounting_accounts").update(payload).eq("id", editingAccount.id);
      if (error) { toast("error", "Failed to update account"); return; }
      toast("success", `Account ${acctCode} updated`);
    } else {
      const { error } = await supabase.from("accounting_accounts").insert(payload);
      if (error) { toast("error", "Failed to create account"); return; }
      toast("success", `Account ${acctCode} – ${acctName} created`);
    }
    setShowAccountDialog(false);
    resetAcctForm();
    fetchAll();
  };

  const handleDeleteAccount = async (acc: DBAccount) => {
    if (!confirm(`Delete account ${acc.code} – ${acc.name}?`)) return;
    await supabase.from("accounting_accounts").delete().eq("id", acc.id);
    toast("success", `Account ${acc.code} deleted`);
    fetchAll();
  };

  const chartOfAccounts = useMemo(() => groupAccounts(dbAccounts as any[]), [dbAccounts]);

  // Live AR Aging from invoices
  const [arAging, setArAging] = useState<any[]>([]);
  const [apAging, setApAging] = useState<any[]>([]);

  useEffect(() => {
    // Fetch unpaid invoices for AR
    supabase.from("invoices").select("customer_name, total_amount, amount_paid, due_date, status")
      .or("status.eq.pending,status.eq.overdue")
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        const grouped: Record<string, { current: number; thirtyDays: number; sixtyDays: number; ninetyDays: number; total: number }> = {};
        data.forEach((inv: any) => {
          const cust = inv.customer_name || "Unknown";
          if (!grouped[cust]) grouped[cust] = { current: 0, thirtyDays: 0, sixtyDays: 0, ninetyDays: 0, total: 0 };
          const outstanding = (inv.total_amount || 0) - (inv.amount_paid || 0);
          if (outstanding <= 0) return;
          const bucket = getAgingBucket(inv.due_date || new Date().toISOString());
          grouped[cust][bucket] += outstanding;
          grouped[cust].total += outstanding;
        });
        setArAging(Object.entries(grouped).map(([customer, data]) => ({ customer, ...data })).sort((a, b) => b.total - a.total));
      });

    // Fetch unpaid POs for AP
    supabase.from("purchase_orders").select("vendor_name, total_amount, status, expected_date")
      .or("status.eq.sent,status.eq.received")
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        const grouped: Record<string, { current: number; thirtyDays: number; sixtyDays: number; ninetyDays: number; total: number }> = {};
        data.forEach((po: any) => {
          const vend = po.vendor_name || "Unknown";
          if (!grouped[vend]) grouped[vend] = { current: 0, thirtyDays: 0, sixtyDays: 0, ninetyDays: 0, total: 0 };
          const bucket = getAgingBucket(po.expected_date || new Date().toISOString());
          grouped[vend][bucket] += po.total_amount || 0;
          grouped[vend].total += po.total_amount || 0;
        });
        setApAging(Object.entries(grouped).map(([vendor, data]) => ({ vendor, ...data })).sort((a, b) => b.total - a.total));
      });
  }, []);

  // Live trial balance from chart of accounts
  const trialBalance = useMemo(() => {
    if (dbAccounts.length === 0) return [];
    return (dbAccounts as any[]).filter(a => (a.balance || 0) !== 0).map(a => {
      const bal = a.balance || 0;
      const isDebit = ["Assets", "Expenses"].includes(a.category);
      return {
        account: `${a.code} – ${a.name}`,
        debit: isDebit ? Math.abs(bal) : 0,
        credit: !isDebit ? Math.abs(bal) : 0,
      };
    });
  }, [dbAccounts]);

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
          <Button onClick={() => { resetJEForm(); setShowJournalDialog(true); }}>
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
            { key: "journal", label: "Journal Entries", count: displayJournals.length },
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
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Balance</span>
              <Button size="sm" variant="ghost" onClick={() => { resetAcctForm(); setShowAccountDialog(true); }}>
                <Plus className="w-3 h-3" /> Add Account
              </Button>
            </div>
          </div>
          {loading ? (
            <TableSkeleton rows={5} columns={2} />
          ) : chartOfAccounts.length === 0 ? (
            <div className="py-8">
              <EmptyState
                icon={<BookOpen className="w-8 h-8" />}
                title="No Accounts Found"
                description="Your Chart of Accounts is currently empty. Get started by adding your first account."
                action={
                  <Button onClick={() => { resetAcctForm(); setShowAccountDialog(true); }}>
                    <Plus className="w-4 h-4" /> Add First Account
                  </Button>
                }
              />
            </div>
          ) : (
            chartOfAccounts.map((account) => (
              <AccountRow
                key={account.id}
                account={account}
                onEdit={(id) => {
                  const acc = (dbAccounts as DBAccount[]).find(a => a.id === id);
                  if (acc) openEditAccount(acc);
                }}
                onDelete={(id) => {
                  const acc = (dbAccounts as DBAccount[]).find(a => a.id === id);
                  if (acc) handleDeleteAccount(acc);
                }}
              />
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
                {displayJournals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8">
                      <EmptyState
                        icon={<Calculator className="w-8 h-8" />}
                        title="No Journal Entries"
                        description="Record manual journal entries to adjust account balances."
                        action={
                          <Button onClick={() => { resetJEForm(); setShowJournalDialog(true); }}>
                            <Plus className="w-4 h-4" /> Create Journal Entry
                          </Button>
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  displayJournals.map((entry) => {
                    const entryLines = journalLines.filter((l) => l.journal_entry_id === entry.id);
                    const totalDebit = entryLines.length > 0 ? entryLines.reduce((s, l) => s + (l.debit || 0), 0) : (entry as any).debit || 0;
                    const totalCredit = entryLines.length > 0 ? entryLines.reduce((s, l) => s + (l.credit || 0), 0) : (entry as any).credit || 0;
                    return (
                      <React.Fragment key={entry.id}>
                        <tr className="border-b hover:bg-[var(--secondary)] transition-colors cursor-pointer" style={{ borderColor: "var(--border)" }}>
                          <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--primary)" }}>{entry.entry_number}</td>
                          <td className="px-4 py-3 text-sm" style={{ color: "var(--muted-foreground)" }}>{entry.date}</td>
                          <td className="px-4 py-3 text-sm" style={{ color: "var(--foreground)" }}>{entry.description}</td>
                          <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>
                            {formatCurrency(totalDebit)}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>
                            {formatCurrency(totalCredit)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${entry.status === "Posted"
                              ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400"
                              : "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400"
                              }`}>{entry.status}</span>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })
                )}
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

      {/* Journal Entry Create Drawer */}
      <Drawer
        open={showJournalDialog}
        onClose={() => setShowJournalDialog(false)}
        title="New Journal Entry"
        width="max-w-2xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowJournalDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateJE}>Create Entry</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" type="date" value={jeDate} onChange={(e) => setJeDate(e.target.value)} />
            <Input label="Description *" placeholder="Monthly salaries" value={jeDesc} onChange={(e) => setJeDesc(e.target.value)} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Line Items</h4>
              <Button variant="ghost" size="sm" onClick={() => setJeLines([...jeLines, emptyLine()])}>
                <Plus className="w-3.5 h-3.5" /> Add Line
              </Button>
            </div>
            <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)", background: "var(--secondary)" }}>
                <span className="col-span-5">Account</span>
                <span className="col-span-3">Debit</span>
                <span className="col-span-3">Credit</span>
                <span className="col-span-1"></span>
              </div>
              {jeLines.map((line) => (
                <div key={line.id} className="grid grid-cols-12 gap-2 px-3 py-1.5 items-center border-t" style={{ borderColor: "var(--border)" }}>
                  <div className="col-span-5">
                    <Select
                      value={line.account}
                      onChange={(e) => setJeLines(jeLines.map(l => l.id === line.id ? { ...l, account: e.target.value } : l))}
                      options={[
                        { value: "", label: "Select account..." },
                        ...((dbAccounts as DBAccount[]).map(a => ({ value: `${a.code} – ${a.name}`, label: `${a.code} – ${a.name}` })))
                      ]}
                      className="w-full h-8 px-2 rounded border text-xs bg-[var(--background)] border-[var(--border)] text-[var(--foreground)]"
                    />
                  </div>
                  <input className="col-span-3 h-8 px-2 rounded border text-xs text-right" style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }} type="number" placeholder="0" value={line.debit} onChange={(e) => setJeLines(jeLines.map(l => l.id === line.id ? { ...l, debit: e.target.value, credit: e.target.value ? "" : l.credit } : l))} />
                  <input className="col-span-3 h-8 px-2 rounded border text-xs text-right" style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }} type="number" placeholder="0" value={line.credit} onChange={(e) => setJeLines(jeLines.map(l => l.id === line.id ? { ...l, credit: e.target.value, debit: e.target.value ? "" : l.debit } : l))} />
                  <button className="col-span-1 text-red-500 hover:text-red-600 text-xs" onClick={() => jeLines.length > 2 && setJeLines(jeLines.filter(l => l.id !== line.id))}>×</button>
                </div>
              ))}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 font-semibold text-xs" style={{ background: "var(--secondary)", color: "var(--foreground)" }}>
                <span className="col-span-5">Total</span>
                <span className="col-span-3 text-right">{formatCurrency(jeLines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0))}</span>
                <span className="col-span-3 text-right">{formatCurrency(jeLines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0))}</span>
                <span className="col-span-1"></span>
              </div>
            </div>
            {Math.abs(jeLines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0) - jeLines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0)) > 0.01 && jeLines.some(l => l.debit || l.credit) && (
              <p className="text-xs text-red-500 mt-1">⚠ Debits and Credits must balance</p>
            )}
          </div>
        </div>
      </Drawer>

      {/* Account Create/Edit Drawer */}
      <Drawer
        open={showAccountDialog}
        onClose={() => { setShowAccountDialog(false); resetAcctForm(); }}
        title={editingAccount ? "Edit Account" : "New Account"}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setShowAccountDialog(false); resetAcctForm(); }}>Cancel</Button>
            <Button onClick={handleSaveAccount}>{editingAccount ? "Update Account" : "Create Account"}</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Account Code *" placeholder="e.g. 1020" value={acctCode} onChange={(e) => setAcctCode(e.target.value)} />
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Category *</label>
              <Select
                value={acctCategory}
                onChange={(e) => setAcctCategory(e.target.value)}
                options={[
                  { value: "Assets", label: "Assets" },
                  { value: "Liabilities", label: "Liabilities" },
                  { value: "Equity", label: "Equity" },
                  { value: "Revenue", label: "Revenue" },
                  { value: "Expenses", label: "Expenses" }
                ]}
                className="w-full h-9 px-3 rounded-lg border text-sm bg-[var(--background)] border-[var(--border)] text-[var(--foreground)]"
              />
            </div>
          </div>
          <Input label="Account Name *" placeholder="e.g. Petty Cash" value={acctName} onChange={(e) => setAcctName(e.target.value)} />
          <Input label="Opening Balance" type="number" placeholder="0.00" value={acctBalance} onChange={(e) => setAcctBalance(e.target.value)} />
        </div>
      </Drawer>
    </motion.div>
  );
}
