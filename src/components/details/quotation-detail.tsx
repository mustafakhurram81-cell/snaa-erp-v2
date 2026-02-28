"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Drawer, Button, StatusBadge, DrawerTabs, Input } from "@/components/ui/shared";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowRight, Download, Copy, Send, Edit3, Trash2, Save, X } from "lucide-react";
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
    line_items?: { id: string; product: string; qty: number; unit_price: number }[];
    so_number?: string;
}

// Mock line items (used as fallback when quotation has no line_items)
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
    onConvertToSO?: (quotation: Quotation) => void;
    onDelete?: (quotation: Quotation) => void;
    onUpdate?: (quotation: Quotation) => void;
}

export function QuotationDetail({ quotation, open, onClose, onConvertToSO, onDelete, onUpdate }: QuotationDetailProps) {
    if (!quotation) return null;
    const router = useRouter();
    const { toast } = useToast();
    const [showDelete, setShowDelete] = useState(false);
    const [showEmail, setShowEmail] = useState(false);
    const [activeTab, setActiveTab] = useState("items");
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ customer: quotation.customer, date: quotation.date, valid_until: quotation.valid_until, status: quotation.status });

    useEffect(() => {
        if (quotation) {
            setEditData({ customer: quotation.customer, date: quotation.date, valid_until: quotation.valid_until, status: quotation.status });
            setIsEditing(false);
        }
    }, [quotation]);

    const handleSave = () => {
        if (onUpdate) {
            onUpdate({ ...quotation, ...editData });
        }
        setIsEditing(false);
        toast("success", "Quotation updated", `${quotation.quote_number} saved`);
    };

    const handleCancel = () => {
        setEditData({ customer: quotation.customer, date: quotation.date, valid_until: quotation.valid_until, status: quotation.status });
        setIsEditing(false);
    };

    const lineItems = quotation.line_items
        ? quotation.line_items.map(li => ({ description: li.product, qty: li.qty, unitPrice: li.unit_price, total: li.qty * li.unit_price }))
        : mockLineItems.slice(0, quotation.items_count > 4 ? 4 : quotation.items_count);
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

    const tabs = [
        { key: "items", label: "Line Items", count: quotation.items_count },
        { key: "activity", label: "Activity" },
    ];

    return (
        <Drawer
            open={open}
            onClose={() => { handleCancel(); onClose(); }}
            title={isEditing ? "Edit Quotation" : "Quotation Details"}
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
                                <Button variant="secondary" onClick={() => setIsEditing(true)}>
                                    <Edit3 className="w-3.5 h-3.5" /> Edit
                                </Button>
                                <button onClick={() => setShowDelete(true)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </>
                        )}
                    </div>
                    {!isEditing && (
                        <div className="flex gap-2">
                            <Button variant="secondary" onClick={handleDownloadPDF}>
                                <Download className="w-3.5 h-3.5" /> PDF
                            </Button>
                            {quotation.status === "draft" && (
                                <Button variant="secondary" onClick={() => setShowEmail(true)}>
                                    <Send className="w-3.5 h-3.5" /> Send
                                </Button>
                            )}
                            {quotation.status === "accepted" && !quotation.so_number && onConvertToSO && (
                                <Button onClick={() => { onConvertToSO(quotation); onClose(); }}>
                                    <ArrowRight className="w-3.5 h-3.5" /> Convert to SO
                                </Button>
                            )}
                            {quotation.so_number && (
                                <button onClick={() => { onClose(); router.push(`/sales-orders?open=${quotation.so_number}`); }} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity cursor-pointer" style={{ background: "var(--secondary)", color: "var(--primary)" }}>
                                    <ArrowRight className="w-3.5 h-3.5" /> {quotation.so_number}
                                </button>
                            )}
                            <Button variant="secondary" onClick={() => toast("info", "Quotation duplicated", `Copy of ${quotation.quote_number} created`)}>
                                <Copy className="w-3.5 h-3.5" /> Duplicate
                            </Button>
                        </div>
                    )}
                </div>
            }
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex-1">
                    <h3 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{quotation.quote_number}</h3>
                    {isEditing ? (
                        <Input className="mt-2" value={editData.customer} onChange={(e) => setEditData({ ...editData, customer: e.target.value })} placeholder="Customer name" />
                    ) : (
                        <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>{quotation.customer}</p>
                    )}
                </div>
                {isEditing ? (
                    <select value={editData.status} onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                        className="h-8 px-3 rounded-lg border text-xs font-medium" style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}>
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                    </select>
                ) : (
                    <StatusBadge status={quotation.status} />
                )}
            </div>

            {/* Meta Cards */}
            <div className="grid grid-cols-3 gap-4 mb-5">
                {isEditing ? (
                    <>
                        <Input label="Date" type="date" value={editData.date} onChange={(e) => setEditData({ ...editData, date: e.target.value })} />
                        <Input label="Valid Until" type="date" value={editData.valid_until} onChange={(e) => setEditData({ ...editData, valid_until: e.target.value })} />
                        <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Total</p>
                            <p className="text-lg font-bold mt-0.5" style={{ color: "var(--foreground)" }}>{formatCurrency(quotation.total)}</p>
                        </div>
                    </>
                ) : (
                    <>
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
                    </>
                )}
            </div>

            {/* Tabs (hidden during edit) */}
            {!isEditing && (
                <>
                    <DrawerTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

                    {activeTab === "items" && (
                        <div>
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
                    )}

                    {activeTab === "activity" && (
                        <ActivityLog entries={getMockActivities("Quotation", quotation.id)} />
                    )}
                </>
            )}

            <DeleteConfirmation
                open={showDelete}
                onClose={() => setShowDelete(false)}
                onConfirm={() => { setShowDelete(false); if (onDelete) { onDelete(quotation); } toast("success", "Quotation deleted", `${quotation.quote_number} deleted`); onClose(); }}
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
