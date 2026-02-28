"use client";

import React, { useState, useEffect } from "react";
import { Drawer, Button, StatusBadge, DrawerTabs, Input } from "@/components/ui/shared";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Download, Truck, CheckCircle, Edit3, Trash2, Save, X } from "lucide-react";
import { generatePDF } from "@/lib/pdf";
import { useToast } from "@/components/ui/toast";
import { ActivityLog, getMockActivities } from "@/components/shared/activity-log";
import { DeleteConfirmation } from "@/components/shared/delete-confirmation";

interface PurchaseOrder {
    id: string;
    po_number: string;
    vendor: string;
    date: string;
    expected_date: string;
    items_count: number;
    total: number;
    status: string;
    jo_reference?: string;
    jo_stage?: string;
    line_items?: { id: string; item: string; qty: number; unit_cost: number }[];
}

const mockLineItems = [
    { description: "Stainless Steel 410 (Bars)", qty: 500, unitPrice: 12.0, total: 6000 },
    { description: "Tungsten Carbide Inserts", qty: 200, unitPrice: 45.0, total: 9000 },
    { description: "Handle Components Set", qty: 100, unitPrice: 8.0, total: 800 },
];

interface PurchaseOrderDetailProps {
    order: PurchaseOrder | null;
    open: boolean;
    onClose: () => void;
    onUpdate?: (order: PurchaseOrder) => void;
    onDelete?: (order: PurchaseOrder) => void;
}

export function PurchaseOrderDetail({ order, open, onClose, onUpdate, onDelete }: PurchaseOrderDetailProps) {
    if (!order) return null;
    const { toast } = useToast();
    const [showDelete, setShowDelete] = useState(false);
    const [activeTab, setActiveTab] = useState("items");
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ vendor: order.vendor, expected_date: order.expected_date, status: order.status });

    useEffect(() => {
        if (order) { setEditData({ vendor: order.vendor, expected_date: order.expected_date, status: order.status }); setIsEditing(false); }
    }, [order]);

    const handleSave = () => {
        if (onUpdate) onUpdate({ ...order, ...editData });
        setIsEditing(false);
        toast("success", "PO updated", `${order.po_number} saved`);
    };
    const handleCancel = () => { setEditData({ vendor: order.vendor, expected_date: order.expected_date, status: order.status }); setIsEditing(false); };

    const lineItems = order.line_items
        ? order.line_items.map(li => ({ description: li.item, qty: li.qty, unitPrice: li.unit_cost, total: li.qty * li.unit_cost }))
        : mockLineItems.slice(0, Math.min(order.items_count, 3));

    const handleDownloadPDF = () => {
        generatePDF({ documentType: "Purchase Order", documentNumber: order.po_number, date: formatDate(order.date), dueDate: formatDate(order.expected_date), recipientName: order.vendor, lineItems, subtotal: order.total, total: order.total, status: order.status, terms: "Please ship to: Smith Instruments, Industrial Area, Sialkot. Payment terms: Net 30." });
    };

    const tabs = [
        { key: "items", label: "Line Items", count: order.items_count },
        { key: "activity", label: "Activity" },
    ];

    return (
        <Drawer
            open={open}
            onClose={() => { handleCancel(); onClose(); }}
            title={isEditing ? "Edit Purchase Order" : "Purchase Order Details"}
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
                                <button onClick={() => setShowDelete(true)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                            </>
                        )}
                    </div>
                    {!isEditing && (
                        <div className="flex gap-2">
                            <Button variant="secondary" onClick={handleDownloadPDF}><Download className="w-3.5 h-3.5" /> PDF</Button>
                            {order.status === "sent" && (
                                <Button onClick={() => { toast("success", "PO received", `${order.po_number} marked as received`); onClose(); }}><Truck className="w-3.5 h-3.5" /> Mark Received</Button>
                            )}
                            {order.status === "received" && (
                                <Button onClick={() => { toast("success", "PO closed", `${order.po_number} closed`); onClose(); }}><CheckCircle className="w-3.5 h-3.5" /> Close PO</Button>
                            )}
                        </div>
                    )}
                </div>
            }
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex-1">
                    <h3 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{order.po_number}</h3>
                    {isEditing ? (
                        <Input className="mt-2" value={editData.vendor} onChange={(e) => setEditData({ ...editData, vendor: e.target.value })} placeholder="Vendor name" />
                    ) : (
                        <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>{order.vendor}</p>
                    )}
                </div>
                {isEditing ? (
                    <select value={editData.status} onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                        className="h-8 px-3 rounded-lg border text-xs font-medium" style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}>
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="received">Received</option>
                        <option value="closed">Closed</option>
                    </select>
                ) : (
                    <StatusBadge status={order.status} />
                )}
            </div>

            {/* Meta Cards */}
            <div className={`grid gap-4 mb-5 ${order.jo_reference ? "grid-cols-4" : "grid-cols-3"}`}>
                {isEditing ? (
                    <>
                        <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Order Date</p>
                            <p className="text-sm font-medium mt-1" style={{ color: "var(--foreground)" }}>{formatDate(order.date)}</p>
                        </div>
                        <Input label="Expected Date" type="date" value={editData.expected_date} onChange={(e) => setEditData({ ...editData, expected_date: e.target.value })} />
                        <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Total</p>
                            <p className="text-lg font-bold mt-0.5" style={{ color: "var(--foreground)" }}>{formatCurrency(order.total)}</p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Order Date</p>
                            <p className="text-sm font-medium mt-1" style={{ color: "var(--foreground)" }}>{formatDate(order.date)}</p>
                        </div>
                        <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Expected</p>
                            <p className="text-sm font-medium mt-1" style={{ color: "var(--foreground)" }}>{formatDate(order.expected_date)}</p>
                        </div>
                        <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Total</p>
                            <p className="text-lg font-bold mt-0.5" style={{ color: "var(--foreground)" }}>{formatCurrency(order.total)}</p>
                        </div>
                        {order.jo_reference && (
                            <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Job Order</p>
                                <p className="text-sm font-semibold mt-1" style={{ color: "var(--primary)" }}>{order.jo_reference}</p>
                                {order.jo_stage && <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>{order.jo_stage}</p>}
                            </div>
                        )}
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
                                    <thead><tr style={{ background: "var(--secondary)" }}>
                                        <th className="text-left text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Item</th>
                                        <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Qty</th>
                                        <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Unit Cost</th>
                                        <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Total</th>
                                    </tr></thead>
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
                                    <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{formatCurrency(order.total)}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === "activity" && (<ActivityLog entries={getMockActivities("Purchase Order", order.id)} />)}
                </>
            )}

            <DeleteConfirmation open={showDelete} onClose={() => setShowDelete(false)}
                onConfirm={() => { setShowDelete(false); if (onDelete) { onDelete(order); } toast("success", "PO deleted", `${order.po_number} deleted`); onClose(); }}
                title={`Delete ${order.po_number}?`} description="This action cannot be undone. The purchase order will be permanently removed." />
        </Drawer>
    );
}
