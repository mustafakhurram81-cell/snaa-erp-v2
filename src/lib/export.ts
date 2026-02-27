"use client";

/**
 * Export data as CSV file and trigger download
 */
export function exportToCSV(
    data: Record<string, unknown>[],
    columns: { key: string; label: string }[],
    filename: string
) {
    if (!data.length) return;

    // Build header row
    const headers = columns.map((c) => `"${c.label}"`).join(",");

    // Build data rows
    const rows = data.map((row) =>
        columns
            .map((col) => {
                const val = row[col.key];
                if (val === null || val === undefined) return '""';
                const str = String(val).replace(/"/g, '""');
                return `"${str}"`;
            })
            .join(",")
    );

    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    URL.revokeObjectURL(url);
}
