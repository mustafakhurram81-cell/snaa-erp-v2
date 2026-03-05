"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Drawer, Button, StatusBadge, DrawerTabs, Input, DrawerSection, DrawerStatCard } from "@/components/ui/shared";
import { formatCurrency, formatDate } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { RoleGuard } from "@/components/shared/role-guard";
import { FileText, ArrowRight, Download, Copy, Send, Edit3, Trash2, Save, X } from "lucide-react";
import { generatePDF } from "@/lib/pdf";
import { useToast } from "@/components/ui/toast";
import { LiveActivityLog } from "@/components/shared/activity-log";
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



interface QuotationDetailProps {
    quotation: Quotation | null;
    open: boolean;
    onClose: () => void;
    onConvertToSO?: (quotation: Quotation) => void;
    onDelete?: (quotation: Quotation) => void;
    onUpdate?: (quotation: Quotation) => void;
}

export function QuotationDetail({ quotation, open, onClose, onConvertToSO, onDelete, onUpdate }: QuotationDetailProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [showDelete, setShowDelete] = useState(false);
    const [showEmail, setShowEmail] = useState(false);
    const [activeTab, setActiveTab] = useState("items");
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState(quotation ? { customer: quotation.customer, date: quotation.date, valid_until: quotation.valid_until, status: quotation.status } : { customer: "", date: "", valid_until: "", status: "" });
    const [dbLineItems, setDbLineItems] = useState<{ description: string; qty: number; unitPrice: number; total: number }[]>([]);

    useEffect(() => {
        if (quotation) {
            setEditData({ customer: quotation.customer, date: quotation.date, valid_until: quotation.valid_until, status: quotation.status });
            setIsEditing(false);
        }
    }, [quotation]);

    useEffect(() => {
        if (!quotation?.line_items && quotation?.id) {
            supabase.from("quotation_items").select("*").eq("quotation_id", quotation.id).then(({ data }) => {
                if (data && data.length > 0) {
                    setDbLineItems(data.map((li: any) => ({ description: li.product_name || li.description || "Item", qty: li.quantity, unitPrice: li.unit_price, total: li.quantity * li.unit_price })));
                }
            });
        }
    }, [quotation?.id, quotation?.line_items]);

    if (!quotation) return null;

    const handleSave = async () => {
        if (onUpdate) onUpdate({ ...quotation, ...editData });
        setIsEditing(false);
        toast("success", "Quotation updated", `${quotation.quote_number} saved`);
        const { logActivity } = await import("@/lib/activity-logger");
        logActivity({ entityType: "quotation", entityId: quotation.id, action: "Quotation updated", details: quotation.quote_number });
    };

    const handleCancel = () => {
        setEditData({ customer: quotation.customer, date: quotation.date, valid_until: quotation.valid_until, status: quotation.status });
        setIsEditing(false);
    };

    const lineItems = quotation.line_items
        ? quotation.line_items.map(li => ({ description: li.product, qty: li.qty, unitPrice: li.unit_price, total: li.qty * li.unit_price }))
        : dbLineItems;
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
                                <RoleGuard minRole="admin"><button onClick={() => setShowDelete(true)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button></RoleGuard>
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
            <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                    <FileText className="w-8 h-8" />
                </div>
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

            {/* Meta Stats */}
            <DrawerSection label="Quotation Summary">
                <div className="grid grid-cols-3 gap-3">
                    <DrawerStatCard label="Total Amount" value={formatCurrency(quotation.total)} accent="emerald" />
                    <DrawerStatCard label="Quoted On" value={formatDate(quotation.date)} accent="blue" />
                    <DrawerStatCard label="Valid Until" value={formatDate(quotation.valid_until)} accent="amber" />
                </div>
            </DrawerSection>

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
                                    <div className="text-right">
                                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Total</p>
                                        <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{formatCurrency(quotation.total)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "activity" && (
                        <LiveActivityLog entityType="quotation" entityId={quotation.id} />
                    )}
                </>
            )}

            <DeleteConfirmation
                open={showDelete}
                onClose={() => setShowDelete(false)}
                onConfirm={async () => { setShowDelete(false); if (onDelete) { onDelete(quotation); } const { logActivity } = await import("@/lib/activity-logger"); logActivity({ entityType: "quotation", entityId: quotation.id, action: "Quotation deleted", details: quotation.quote_number }); toast("success", "Quotation deleted", `${quotation.quote_number} deleted`); onClose(); }}
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
