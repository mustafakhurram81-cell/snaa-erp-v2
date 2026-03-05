"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Drawer, Button, StatusBadge, DrawerTabs, Input, DrawerSection, DrawerStatCard } from "@/components/ui/shared";
import { formatCurrency, formatDate } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { RoleGuard } from "@/components/shared/role-guard";
import { Download, DollarSign, Send, Edit3, Trash2, Save, X } from "lucide-react";
import { generatePDF } from "@/lib/pdf";
import { useToast } from "@/components/ui/toast";
import { LiveActivityLog } from "@/components/shared/activity-log";
import { DeleteConfirmation } from "@/components/shared/delete-confirmation";
import { EmailSend } from "@/components/shared/email-send";
import { RecordPayment, type PaymentRecord } from "@/components/shared/record-payment";

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
    line_items?: { id: string; product: string; qty: number; unit_price: number }[];
}





interface InvoiceDetailProps {
    invoice: Invoice | null;
    open: boolean;
    onClose: () => void;
    onUpdate?: (invoice: Invoice) => void;
    onDelete?: (invoice: Invoice) => void;
}

export function InvoiceDetail({ invoice, open, onClose, onUpdate, onDelete }: InvoiceDetailProps) {
    if (!invoice) return null;
    const { toast } = useToast();
    const router = useRouter();
    const [showDelete, setShowDelete] = useState(false);
    const [showEmail, setShowEmail] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [activeTab, setActiveTab] = useState("details");
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ customer: invoice.customer, due_date: invoice.due_date, status: invoice.status });
    const [dbLineItems, setDbLineItems] = useState<{ description: string; qty: number; unitPrice: number; total: number }[]>([]);

    useEffect(() => {
        if (invoice) { setEditData({ customer: invoice.customer, due_date: invoice.due_date, status: invoice.status }); setIsEditing(false); }
    }, [invoice]);

    useEffect(() => {
        if (!invoice?.line_items && invoice?.id) {
            supabase.from("invoice_items").select("*").eq("invoice_id", invoice.id).then(({ data }) => {
                if (data && data.length > 0) {
                    setDbLineItems(data.map((li: any) => ({ description: li.product_name || li.description || "Item", qty: li.quantity, unitPrice: li.unit_price, total: li.quantity * li.unit_price })));
                }
            });
        }
    }, [invoice?.id, invoice?.line_items]);

    const handleSave = async () => {
        if (onUpdate) onUpdate({ ...invoice, ...editData });
        setIsEditing(false);
        toast("success", "Invoice updated", `${invoice.invoice_number} saved`);
        const { logActivity } = await import("@/lib/activity-logger");
        logActivity({ entityType: "invoice", entityId: invoice.id, action: "Invoice updated", details: invoice.invoice_number });
    };
    const handleCancel = () => { setEditData({ customer: invoice.customer, due_date: invoice.due_date, status: invoice.status }); setIsEditing(false); };

    const balance = invoice.balance ?? (invoice.total - invoice.paid);
    const lineItems = invoice.line_items
        ? invoice.line_items.map(li => ({ description: li.product, qty: li.qty, unitPrice: li.unit_price, total: li.qty * li.unit_price }))
        : dbLineItems;

    const handleDownloadPDF = () => {
        generatePDF({ documentType: "Invoice", documentNumber: invoice.invoice_number, date: formatDate(invoice.date), dueDate: formatDate(invoice.due_date), recipientName: invoice.customer, lineItems, subtotal: invoice.total, total: invoice.total, status: invoice.status, terms: "Payment is due within 30 days. Please include the invoice number on your remittance." });
    };

    const tabs = [
        { key: "details", label: "Details" },
        { key: "items", label: "Line Items", count: lineItems.length },
        { key: "payments", label: "Payments", count: invoice.paid > 0 ? 1 : 0 },
        { key: "activity", label: "Activity" },
    ];

    return (
        <Drawer
            open={open}
            onClose={() => { handleCancel(); onClose(); }}
            title={isEditing ? "Edit Invoice" : "Invoice Details"}
            width="max-w-2xl"
            footer={
                <div className="flex justify-between">
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => { handleCancel(); onClose(); }}>Close</Button>
                        {isEditing ? (
                            <>
                                <Button variant="secondary" onClick={handleCancel}><X className="w-3.5 h-3.5" /> Cancel</Button>
                                <Button onClick={handleSave}><Save className="w-3.5 h-3.5" /> Save</Button>
                            </>
                        ) : (
                            <>
                                <Button variant="secondary" onClick={() => setIsEditing(true)}><Edit3 className="w-3.5 h-3.5" /> Edit</Button>
                                <RoleGuard minRole="admin"><button onClick={() => setShowDelete(true)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></RoleGuard>
                            </>
                        )}
                    </div>
                    {!isEditing && (
                        <div className="flex gap-2">
                            <Button variant="secondary" onClick={handleDownloadPDF}><Download className="w-3.5 h-3.5" /> PDF</Button>
                            <Button variant="secondary" onClick={() => setShowEmail(true)}><Send className="w-3.5 h-3.5" /> Send</Button>
                            {invoice.status !== "paid" && (<Button onClick={() => setShowPayment(true)}><DollarSign className="w-3.5 h-3.5" /> Record Payment</Button>)}
                        </div>
                    )}
                </div>
            }
        >
            {/* Header */}
            <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                    <DollarSign className="w-8 h-8" />
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{invoice.invoice_number}</h3>
                    {isEditing ? (
                        <Input className="mt-2" value={editData.customer} onChange={(e) => setEditData({ ...editData, customer: e.target.value })} placeholder="Customer name" />
                    ) : (
                        <div className="flex items-center gap-2">
                            <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>{invoice.customer}</p>
                            {invoice.sales_order && invoice.sales_order !== "—" && (
                                <button
                                    onClick={() => { onClose(); router.push(`/sales-orders?open=${invoice.sales_order}`); }}
                                    className="text-xs font-semibold px-2 py-0.5 rounded-lg transition-colors hover:opacity-80 mt-0.5"
                                    style={{ background: "var(--secondary)", color: "var(--primary)" }}
                                >
                                    ← {invoice.sales_order}
                                </button>
                            )}
                        </div>
                    )}
                </div>
                {isEditing ? (
                    <select value={editData.status} onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                        className="h-8 px-3 rounded-lg border text-xs font-medium" style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}>
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="partial">Partial</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                    </select>
                ) : (
                    <StatusBadge status={invoice.status} />
                )}
            </div>

            {/* Payment Summary */}
            <DrawerSection label="Financial Status">
                <div className="grid grid-cols-3 gap-3">
                    <DrawerStatCard label="Total Amount" value={formatCurrency(invoice.total)} accent="blue" />
                    <DrawerStatCard label="Amount Paid" value={formatCurrency(invoice.paid)} accent="emerald" />
                    <DrawerStatCard label="Balance Due" value={formatCurrency(balance)} accent={balance > 0 ? "rose" : "emerald"} />
                </div>
            </DrawerSection>

            {/* Edit: Due Date */}
            {isEditing && (
                <div className="mb-5">
                    <Input label="Due Date" type="date" value={editData.due_date} onChange={(e) => setEditData({ ...editData, due_date: e.target.value })} />
                </div>
            )}

            {/* Tabs (hidden during edit) */}
            {!isEditing && (
                <>
                    <DrawerTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

                    {activeTab === "details" && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Invoice Date</p>
                                <p className="text-sm font-medium mt-1" style={{ color: "var(--foreground)" }}>{formatDate(invoice.date)}</p>
                            </div>
                            <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Due Date</p>
                                <p className="text-sm font-medium mt-1" style={{ color: "var(--foreground)" }}>{formatDate(invoice.due_date)}</p>
                            </div>
                        </div>
                    )}

                    {activeTab === "items" && (
                        <div>
                            <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                                <table className="w-full">
                                    <thead><tr style={{ background: "var(--secondary)" }}>
                                        <th className="text-left text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Item</th>
                                        <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Qty</th>
                                        <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Price</th>
                                        <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Amount</th>
                                    </tr></thead>
                                    <tbody>
                                        {lineItems.map((item, idx) => (
                                            <tr key={idx} className="border-t hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors" style={{ borderColor: "var(--border)" }}>
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
                    )}

                    {activeTab === "payments" && (
                        <div>
                            {invoice.paid > 0 ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: "var(--border)" }}>
                                        <div>
                                            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Payment Received</p>
                                            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Amount paid to date</p>
                                        </div>
                                        <span className="text-sm font-semibold text-emerald-600">{formatCurrency(invoice.paid)}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: "var(--border)" }}>
                                        <div>
                                            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Outstanding Balance</p>
                                            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Remaining to be paid</p>
                                        </div>
                                        <span className={`text-sm font-semibold ${invoice.total - invoice.paid > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                                            {formatCurrency(Math.max(0, invoice.total - invoice.paid))}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: "var(--border)" }}>
                                        <div>
                                            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Invoice Total</p>
                                            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Original amount</p>
                                        </div>
                                        <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{formatCurrency(invoice.total)}</span>
                                    </div>
                                    {/* Progress bar */}
                                    <div className="pt-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Payment Progress</span>
                                            <span className="text-xs font-bold" style={{ color: "var(--primary)" }}>{Math.round((invoice.paid / invoice.total) * 100)}%</span>
                                        </div>
                                        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--secondary)" }}>
                                            <div className="h-full rounded-full transition-all duration-500 bg-emerald-500" style={{ width: `${Math.min(100, (invoice.paid / invoice.total) * 100)}%` }} />
                                        </div>
                                    </div>
                                </div>
                            ) : (<p className="text-sm py-4 text-center" style={{ color: "var(--muted-foreground)" }}>No payments recorded yet</p>)}
                        </div>
                    )}

                    {activeTab === "activity" && (<LiveActivityLog entityType="invoice" entityId={invoice.id} />)}
                </>
            )}

            <DeleteConfirmation open={showDelete} onClose={() => setShowDelete(false)}
                onConfirm={async () => { setShowDelete(false); if (onDelete) { onDelete(invoice); } const { logActivity } = await import("@/lib/activity-logger"); logActivity({ entityType: "invoice", entityId: invoice.id, action: "Invoice deleted", details: invoice.invoice_number }); toast("success", "Invoice deleted", `${invoice.invoice_number} deleted`); onClose(); }}
                title={`Delete ${invoice.invoice_number}?`} description="This action cannot be undone. The invoice and payment history will be permanently removed." />

            <EmailSend open={showEmail} onClose={() => setShowEmail(false)} documentType="Invoice" documentNumber={invoice.invoice_number} recipientName={invoice.customer} />

            <RecordPayment
                open={showPayment}
                onClose={() => setShowPayment(false)}
                invoiceNumber={invoice.invoice_number}
                invoiceTotal={invoice.total}
                invoicePaid={invoice.paid}
                onRecord={async (payment: PaymentRecord) => {
                    const newPaid = invoice.paid + payment.amount;
                    const newStatus = newPaid >= invoice.total ? "paid" : "partial";
                    if (onUpdate) {
                        onUpdate({ ...invoice, paid: newPaid, status: newStatus });
                    }
                    // Update AR balance: look up customer and decrement
                    if (invoice.customer) {
                        const { data: cust } = await supabase
                            .from("customers")
                            .select("id, ar_balance")
                            .eq("name", invoice.customer)
                            .maybeSingle();
                        if (cust) {
                            await supabase
                                .from("customers")
                                .update({ ar_balance: Math.max(0, (cust.ar_balance || 0) - payment.amount) })
                                .eq("id", cust.id);
                        }
                    }
                }}
            />
        </Drawer>
    );
}
