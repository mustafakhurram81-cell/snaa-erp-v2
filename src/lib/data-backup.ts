"use client";

import { supabase } from "@/lib/supabase";

const EXPORTABLE_TABLES = [
    { name: "customers", label: "Customers" },
    { name: "vendors", label: "Vendors" },
    { name: "products", label: "Products" },
    { name: "invoices", label: "Invoices" },
    { name: "quotations", label: "Quotations" },
    { name: "sales_orders", label: "Sales Orders" },
    { name: "purchase_orders", label: "Purchase Orders" },
    { name: "employees", label: "Employees" },
    { name: "accounting_accounts", label: "Chart of Accounts" },
    { name: "journal_entries", label: "Journal Entries" },
    { name: "activity_logs", label: "Activity Logs" },
];

function toCSV(data: Record<string, unknown>[]): string {
    if (!data || data.length === 0) return "";
    const headers = Object.keys(data[0]);
    const headerRow = headers.map(h => `"${h}"`).join(",");
    const rows = data.map(row =>
        headers.map(h => {
            const val = row[h];
            if (val === null || val === undefined) return '""';
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
        }).join(",")
    );
    return [headerRow, ...rows].join("\n");
}

/**
 * Export a single table to CSV and trigger download.
 */
export async function exportTable(tableName: string, filename?: string): Promise<boolean> {
    const { data, error } = await supabase.from(tableName as any).select("*").order("created_at", { ascending: false });
    if (error || !data || data.length === 0) return false;
    const csv = toCSV(data as any);
    downloadBlob(csv, `${filename || tableName}.csv`, "text/csv;charset=utf-8;");
    return true;
}

/**
 * Export ALL tables as a single JSON backup file.
 */
export async function exportFullBackup(): Promise<boolean> {
    const backup: Record<string, unknown[]> = {};
    const timestamp = new Date().toISOString().split("T")[0];

    for (const table of EXPORTABLE_TABLES) {
        const { data } = await supabase.from(table.name as any).select("*");
        backup[table.name] = data || [];
    }

    const json = JSON.stringify(backup, null, 2);
    downloadBlob(json, `erp-backup-${timestamp}.json`, "application/json");
    return true;
}

/**
 * Export ALL tables as separate CSV files combined into one download.
 * Returns a ZIP-like approach using individual CSV downloads.
 */
export async function exportAllCSV(): Promise<{ table: string; count: number }[]> {
    const results: { table: string; count: number }[] = [];

    for (const table of EXPORTABLE_TABLES) {
        const { data } = await supabase.from(table.name as any).select("*");
        if (data && data.length > 0) {
            const csv = toCSV(data as any);
            downloadBlob(csv, `${table.name}.csv`, "text/csv;charset=utf-8;");
            results.push({ table: table.name, count: data.length });
        } else {
            results.push({ table: table.name, count: 0 });
        }
    }

    return results;
}

function downloadBlob(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

export { EXPORTABLE_TABLES };
