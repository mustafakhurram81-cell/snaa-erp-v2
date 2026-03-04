"use client";

import React, { useState, useRef } from "react";
import { Upload, X, FileSpreadsheet, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/shared";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/toast";

interface CSVImportProps {
    open: boolean;
    onClose: () => void;
    tableName: string;
    displayName: string; // "Customers", "Products", "Vendors"
    requiredFields: string[];
    optionalFields?: string[];
    onImportComplete: () => void;
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return { headers: [], rows: [] };
    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, "").toLowerCase().replace(/\s+/g, "_"));
    const rows = lines.slice(1).map(line => {
        const vals: string[] = [];
        let current = "";
        let inQuotes = false;
        for (const ch of line) {
            if (ch === '"') { inQuotes = !inQuotes; continue; }
            if (ch === "," && !inQuotes) { vals.push(current.trim()); current = ""; continue; }
            current += ch;
        }
        vals.push(current.trim());
        return vals;
    });
    return { headers, rows };
}

export function CSVImportDialog({ open, onClose, tableName, displayName, requiredFields, optionalFields = [], onImportComplete }: CSVImportProps) {
    const [file, setFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [previewRows, setPreviewRows] = useState<string[][]>([]);
    const [allRows, setAllRows] = useState<string[][]>([]);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
    const [errors, setErrors] = useState<string[]>([]);
    const fileRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const allFields = [...requiredFields, ...optionalFields];

    const handleFile = (f: File) => {
        setFile(f);
        setResult(null);
        setErrors([]);
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const { headers: h, rows: r } = parseCSV(text);
            setHeaders(h);
            setAllRows(r);
            setPreviewRows(r.slice(0, 5));
        };
        reader.readAsText(f);
    };

    const handleImport = async () => {
        setImporting(true);
        setErrors([]);
        let success = 0;
        let failed = 0;
        const errList: string[] = [];

        // Map CSV headers to DB fields
        const fieldMap = headers.map(h => {
            const match = allFields.find(f => f === h || f.replace(/_/g, "") === h.replace(/_/g, "") || f.toLowerCase() === h.toLowerCase());
            return match || null;
        });

        const missing = requiredFields.filter(rf => !fieldMap.includes(rf));
        if (missing.length > 0) {
            setErrors([`Missing required columns: ${missing.join(", ")}`]);
            setImporting(false);
            return;
        }

        // Batch insert
        const records = allRows.map(row => {
            const obj: Record<string, string> = {};
            fieldMap.forEach((field, idx) => {
                if (field && row[idx]) obj[field] = row[idx];
            });
            return obj;
        }).filter(obj => Object.keys(obj).length > 0);

        // Insert in chunks of 50
        for (let i = 0; i < records.length; i += 50) {
            const chunk = records.slice(i, i + 50);
            const { error } = await supabase.from(tableName).insert(chunk);
            if (error) {
                failed += chunk.length;
                errList.push(`Rows ${i + 1}-${i + chunk.length}: ${error.message}`);
            } else {
                success += chunk.length;
            }
        }

        setResult({ success, failed });
        setErrors(errList);
        setImporting(false);
        if (success > 0) {
            toast("success", `${success} ${displayName.toLowerCase()} imported`);
            onImportComplete();
        }
    };

    const handleClose = () => {
        setFile(null);
        setHeaders([]);
        setPreviewRows([]);
        setAllRows([]);
        setResult(null);
        setErrors([]);
        onClose();
    };

    if (!open) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="rounded-2xl border shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" style={{ background: "var(--card)", borderColor: "var(--border)" }} onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
                        <div className="flex items-center gap-3">
                            <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                            <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Import {displayName} from CSV</h2>
                        </div>
                        <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-[var(--secondary)] transition-colors">
                            <X className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                        {/* Drop zone */}
                        {!file && (
                            <div
                                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                                style={{ borderColor: "var(--border)" }}
                                onClick={() => fileRef.current?.click()}
                                onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                                onDrop={e => { e.preventDefault(); e.stopPropagation(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                            >
                                <Upload className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--muted-foreground)" }} />
                                <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Drop CSV file here or click to browse</p>
                                <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Required: {requiredFields.join(", ")}</p>
                                {optionalFields.length > 0 && <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Optional: {optionalFields.join(", ")}</p>}
                                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                            </div>
                        )}

                        {/* Preview */}
                        {file && (
                            <>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                                        <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{file.name}</span>
                                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>{allRows.length} rows</span>
                                    </div>
                                    <Button variant="secondary" size="sm" onClick={() => { setFile(null); setHeaders([]); setPreviewRows([]); setAllRows([]); setResult(null); }}>
                                        <X className="w-3 h-3" /> Remove
                                    </Button>
                                </div>

                                {/* Table preview */}
                                <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr style={{ background: "var(--secondary)" }}>
                                                {headers.map((h, i) => (
                                                    <th key={i} className="text-left px-3 py-2 font-semibold" style={{ color: requiredFields.includes(h) ? "var(--foreground)" : "var(--muted-foreground)" }}>
                                                        {h} {requiredFields.includes(h) && <span className="text-red-500">*</span>}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewRows.map((row, ri) => (
                                                <tr key={ri} className="border-t" style={{ borderColor: "var(--border)" }}>
                                                    {row.map((cell, ci) => (
                                                        <td key={ci} className="px-3 py-2 truncate max-w-[200px]" style={{ color: "var(--foreground)" }}>{cell || "-"}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {allRows.length > 5 && (
                                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Showing first 5 of {allRows.length} rows</p>
                                )}

                                {/* Errors */}
                                {errors.length > 0 && (
                                    <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-3 space-y-1">
                                        {errors.map((err, i) => (
                                            <div key={i} className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
                                                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {err}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Result */}
                                {result && (
                                    <div className="rounded-xl border p-3 flex items-center gap-3" style={{ borderColor: "var(--border)" }}>
                                        <Check className="w-5 h-5 text-emerald-500" />
                                        <div>
                                            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{result.success} imported successfully</p>
                                            {result.failed > 0 && <p className="text-xs text-red-500">{result.failed} failed</p>}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: "var(--border)" }}>
                        <Button variant="secondary" onClick={handleClose}>Cancel</Button>
                        {file && !result && (
                            <Button onClick={handleImport} disabled={importing}>
                                {importing ? "Importing..." : `Import ${allRows.length} ${displayName}`}
                            </Button>
                        )}
                        {result && <Button onClick={handleClose}>Done</Button>}
                    </div>
                </div>
            </div>
        </>
    );
}
