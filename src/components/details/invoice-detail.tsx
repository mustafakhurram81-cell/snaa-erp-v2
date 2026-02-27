"use client";

import React, { useState } from "react";
import { Drawer, Button, StatusBadge } from "@/components/ui/shared";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Download, DollarSign, Send, Edit3, Trash2 } from "lucide-react";
import { generatePDF } from "@/lib/pdf";
import { useToast } from "@/components/ui/toast";
import { ActivityLog, getMockActivities } from "@/components/shared/activity-log";
import { DeleteConfirmation } from "@/components/shared/delete-confirmation";
import { EmailSend } from "@/components/shared/email-send";

interface Invoice {
    id: string;
    invoice_number: string;
    customer: string;
    sales_order: string;
    date: string;
    due_date: string;
    total: number;
    paid: number;
    status: string;
    items_count?: number;
    balance?: number;
    [key: string]: unknown;
}

const mockLineItems = [
    { description: "Mayo Scissors 6.5\" Straight", qty: 50, unitPrice: 24.0, total: 1200 },
    { description: "Adson Forceps 4.75\"", qty: 100, unitPrice: 15.0, total: 1500 },
    { description: "Kelly Clamp 5.5\" Curved", qty: 30, unitPrice: 20.0, total: 600 },
];

const mockPayments = [
    { date: "Feb 20, 2026", amount: 1500, method: "Wire Transfer", reference: "WT-20260220" },
    { date: "Feb 10, 2026", amount: 2000, method: "Check", reference: "CHK-9901" },
];

interface InvoiceDetailProps {
    invoice: Invoice | null;
    open: boolean;
    onClose: () => void;
    onRecordPayment?: () => void;
}

export function InvoiceDetail({ invoice, open, onClose, onRecordPayment }: InvoiceDetailProps) {
    if (!invoice) return null;
    const { toast } = useToast();
    const [showDelete, setShowDelete] = useState(false);
    const [showEmail, setShowEmail] = useState(false);

    const balance = invoice.balance ?? (invoice.total - invoice.paid);
    const lineItems = mockLineItems.slice(0, Math.min(invoice.items_count ?? 3, 3));

    const handleDownloadPDF = () => {
        generatePDF({
            documentType: "Invoice",
            documentNumber: invoice.invoice_number,
            date: formatDate(invoice.date),
            dueDate: formatDate(invoice.due_date),
            recipientName: invoice.customer,
            lineItems,
            subtotal: invoice.total,
            total: invoice.total,
            status: invoice.status,
            terms: "Payment is due within 30 days. Please include the invoice number on your remittance. Bank details: Smith Instruments, Account #1234567890.",
        });
    };

    return (
        <Drawer
            open={open}
            onClose={onClose}
            title="Invoice Details"
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
                        <Button variant="secondary" onClick={() => setShowEmail(true)}>
                            <Send className="w-3.5 h-3.5" />
                            Send
                        </Button>
                        {invoice.status !== "paid" && (
                            <Button onClick={onRecordPayment}>
                                <DollarSign className="w-3.5 h-3.5" />
                                Record Payment
                            </Button>
                        )}
                    </div>
                </div>
            }
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{invoice.invoice_number}</h3>
                    <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>{invoice.customer} · {invoice.sales_order}</p>
                </div>
                <StatusBadge status={invoice.status} />
            </div>

            {/* Payment Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Total</p>
                    <p className="text-lg font-bold mt-0.5" style={{ color: "var(--foreground)" }}>{formatCurrency(invoice.total)}</p>
                </div>
                <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Paid</p>
                    <p className="text-lg font-bold mt-0.5 text-emerald-600">{formatCurrency(invoice.paid)}</p>
                </div>
                <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Balance Due</p>
                    <p className={`text-lg font-bold mt-0.5 ${balance > 0 ? "text-red-600" : "text-emerald-600"}`}>{formatCurrency(balance)}</p>
                </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Invoice Date</p>
                    <p className="text-sm font-medium mt-1" style={{ color: "var(--foreground)" }}>{formatDate(invoice.date)}</p>
                </div>
                <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Due Date</p>
                    <p className="text-sm font-medium mt-1" style={{ color: "var(--foreground)" }}>{formatDate(invoice.due_date)}</p>
                </div>
            </div>

            {/* Line Items */}
            <div className="mb-6">
                <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>Line Items</h4>
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                    <table className="w-full">
                        <thead>
                            <tr style={{ background: "var(--secondary)" }}>
                                <th className="text-left text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Item</th>
                                <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Qty</th>
                                <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Price</th>
                                <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Amount</th>
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
                        <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{formatCurrency(invoice.total)}</p>
                    </div>
                </div>
            </div>

            {/* Payment History */}
            <div>
                <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>Payment History</h4>
                {invoice.paid > 0 ? (
                    <div className="space-y-2">
                        {mockPayments.map((payment, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: "var(--border)" }}>
                                <div>
                                    <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{payment.method}</p>
                                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{payment.date} · {payment.reference}</p>
                                </div>
                                <span className="text-sm font-semibold text-emerald-600">{formatCurrency(payment.amount)}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm py-4 text-center" style={{ color: "var(--muted-foreground)" }}>No payments recorded yet</p>
                )}
            </div>

            {/* Activity Log */}
            <div className="mt-5">
                <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>Activity</h4>
                <ActivityLog entries={getMockActivities("Invoice", invoice.id)} />
            </div>

            <DeleteConfirmation
                open={showDelete}
                onClose={() => setShowDelete(false)}
                onConfirm={() => { setShowDelete(false); toast("success", "Invoice deleted", `${invoice.invoice_number} deleted`); onClose(); }}
                title={`Delete ${invoice.invoice_number}?`}
                description="This action cannot be undone. The invoice and payment history will be permanently removed."
            />

            <EmailSend
                open={showEmail}
                onClose={() => setShowEmail(false)}
                documentType="Invoice"
                documentNumber={invoice.invoice_number}
                recipientName={invoice.customer}
            />
        </Drawer>
    );
}
