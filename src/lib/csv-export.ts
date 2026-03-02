/**
 * Export an array of objects to a CSV file and trigger download.
 */
export function exportToCSV<T extends Record<string, unknown>>(
    data: T[],
    filename: string,
    columns?: { key: keyof T; label: string }[]
) {
    if (data.length === 0) return;

    // Determine columns
    const cols = columns || Object.keys(data[0]).map((key) => ({
        key: key as keyof T,
        label: String(key).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    }));

    // Build CSV
    const header = cols.map((c) => `"${c.label}"`).join(",");
    const rows = data.map((row) =>
        cols.map((c) => {
            const val = row[c.key];
            if (val === null || val === undefined) return '""';
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
        }).join(",")
    );

    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}
