"use client";

import React, { useState } from "react";
import { Drawer, Button, StatusBadge } from "@/components/ui/shared";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowRight, Download, Copy, Send, Edit3, Trash2 } from "lucide-react";
import { generatePDF } from "@/lib/pdf";
import { useToast } from "@/components/ui/toast";
import { ActivityLog, getMockActivities } from "@/components/shared/activity-log";
import { DeleteConfirmation } from "@/components/shared/delete-confirmation";
import { EmailSend } from "@/components/shared/email-send";

interface Quotation {
    id: string;
    quote_number: string;
    customer: string;
    date: string;
    valid_until: string;
    items_count: number;
    total: number;
    status: string;
    [key: string]: unknown;
}

// Mock line items
const mockLineItems = [
    { description: "Mayo Scissors 6.5\" Straight", qty: 50, unitPrice: 24.0, total: 1200 },
    { description: "Adson Forceps 4.75\"", qty: 100, unitPrice: 15.0, total: 1500 },
    { description: "Kelly Clamp 5.5\" Curved", qty: 30, unitPrice: 20.0, total: 600 },
    { description: "Mayo-Hegar Needle Holder 7\"", qty: 25, unitPrice: 30.0, total: 750 },
];

interface QuotationDetailProps {
    quotation: Quotation | null;
    open: boolean;
    onClose: () => void;
}

export function QuotationDetail({ quotation, open, onClose }: QuotationDetailProps) {
    if (!quotation) return null;
    const { toast } = useToast();
    const [showDelete, setShowDelete] = useState(false);
    const [showEmail, setShowEmail] = useState(false);

    const lineItems = mockLineItems.slice(0, quotation.items_count > 4 ? 4 : quotation.items_count);
    const subtotal = quotation.total;

    const handleDownloadPDF = () => {
        generatePDF({
            documentType: "Quotation",
            documentNumber: quotation.quote_number,
            date: formatDate(quotation.date),
            dueDate: formatDate(quotation.valid_until),
            recipientName: quotation.customer,
            lineItems,
            subtotal,
            total: subtotal,
            status: quotation.status,
            terms: "This quotation is valid for 30 days from the date of issue. Prices are subject to change after the validity period. Payment terms: 50% advance, 50% on delivery.",
        });
    };

    return (
        <Drawer
            open={open}
            onClose={onClose}
            title="Quotation Details"
            width="max-w-2xl"
            footer={
                <div className="flex justify-between">
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={onClose}>Close</Button>
                        <Button variant="secondary" onClick={() => toast("info", "Edit mode", "Editing will be available with database integration")}>
                            <Edit3 className="w-3.5 h-3.5" /> Edit
                        </Button>
                        <button onClick={() => setShowDelete(true)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={handleDownloadPDF}>
                            <Download className="w-3.5 h-3.5" />
                            PDF
                        </Button>
                        {quotation.status === "draft" && (
                            <Button variant="secondary" onClick={() => setShowEmail(true)}>
                                <Send className="w-3.5 h-3.5" />
                                Send
                            </Button>
                        )}
                        {quotation.status === "accepted" && (
                            <Button onClick={() => { toast("success", "Sales Order created", `SO created from ${quotation.quote_number} for ${quotation.customer}`); onClose(); }}>
                                <ArrowRight className="w-3.5 h-3.5" />
                                Convert to SO
                            </Button>
                        )}
                        <Button variant="secondary" onClick={() => toast("info", "Quotation duplicated", `Copy of ${quotation.quote_number} created`)}>
                            <Copy className="w-3.5 h-3.5" />
                            Duplicate
                        </Button>
                    </div>
                </div>
            }
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{quotation.quote_number}</h3>
                    <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>{quotation.customer}</p>
                </div>
                <StatusBadge status={quotation.status} />
            </div>

            {/* Meta */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Date</p>
                    <p className="text-sm font-medium mt-1" style={{ color: "var(--foreground)" }}>{formatDate(quotation.date)}</p>
                </div>
                <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Valid Until</p>
                    <p className="text-sm font-medium mt-1" style={{ color: "var(--foreground)" }}>{formatDate(quotation.valid_until)}</p>
                </div>
                <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Total</p>
                    <p className="text-lg font-bold mt-0.5" style={{ color: "var(--foreground)" }}>{formatCurrency(quotation.total)}</p>
                </div>
            </div>

            {/* Line Items */}
            <div>
                <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>Line Items</h4>
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                    <table className="w-full">
                        <thead>
                            <tr style={{ background: "var(--secondary)" }}>
                                <th className="text-left text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Product</th>
                                <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Qty</th>
                                <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Unit Price</th>
                                <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lineItems.map((item, idx) => (
                                <tr key={idx} className="border-t" style={{ borderColor: "var(--border)" }}>
                                    <td className="px-4 py-3 text-sm" style={{ color: "var(--foreground)" }}>{item.description}</td>
                                    <td className="px-4 py-3 text-sm text-right" style={{ color: "var(--muted-foreground)" }}>{item.qty}</td>
                                    <td className="px-4 py-3 text-sm text-right" style={{ color: "var(--muted-foreground)" }}>{formatCurrency(item.unitPrice)}</td>
                                    <td className="px-4 py-3 text-sm text-right font-medium" style={{ color: "var(--foreground)" }}>{formatCurrency(item.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="border-t px-4 py-3 flex justify-end" style={{ borderColor: "var(--border)", background: "var(--secondary)" }}>
                        <div className="text-right">
                            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Total</p>
                            <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{formatCurrency(quotation.total)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Activity Log */}
            <div className="mt-5">
                <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>Activity</h4>
                <ActivityLog entries={getMockActivities("Quotation", quotation.id)} />
            </div>

            <DeleteConfirmation
                open={showDelete}
                onClose={() => setShowDelete(false)}
                onConfirm={() => { setShowDelete(false); toast("success", "Quotation deleted", `${quotation.quote_number} deleted`); onClose(); }}
                title={`Delete ${quotation.quote_number}?`}
                description="This action cannot be undone. The quotation and all associated data will be permanently removed."
            />

            <EmailSend
                open={showEmail}
                onClose={() => setShowEmail(false)}
                documentType="Quotation"
                documentNumber={quotation.quote_number}
                recipientName={quotation.customer}
            />
        </Drawer>
    );
}
