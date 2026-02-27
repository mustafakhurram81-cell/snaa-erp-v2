"use client";

import React, { useState } from "react";
import { Drawer, Button, StatusBadge } from "@/components/ui/shared";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Download, Truck, CheckCircle, Edit3, Trash2 } from "lucide-react";
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
    [key: string]: unknown;
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
}

export function PurchaseOrderDetail({ order, open, onClose }: PurchaseOrderDetailProps) {
    if (!order) return null;
    const { toast } = useToast();
    const [showDelete, setShowDelete] = useState(false);

    const lineItems = mockLineItems.slice(0, Math.min(order.items_count, 3));

    const handleDownloadPDF = () => {
        generatePDF({
            documentType: "Purchase Order",
            documentNumber: order.po_number,
            date: formatDate(order.date),
            dueDate: formatDate(order.expected_date),
            recipientName: order.vendor,
            lineItems,
            subtotal: order.total,
            total: order.total,
            status: order.status,
            terms: "Please ship to: Smith Instruments, Industrial Area, Sialkot. Include a packing list and quality certificate. Payment terms: Net 30.",
        });
    };

    return (
        <Drawer
            open={open}
            onClose={onClose}
            title="Purchase Order Details"
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
                        {order.status === "sent" && (
                            <Button onClick={() => { toast("success", "PO received", `${order.po_number} marked as received — inventory updated`); onClose(); }}>
                                <Truck className="w-3.5 h-3.5" />
                                Mark Received
                            </Button>
                        )}
                        {order.status === "received" && (
                            <Button onClick={() => { toast("success", "PO closed", `${order.po_number} closed successfully`); onClose(); }}>
                                <CheckCircle className="w-3.5 h-3.5" />
                                Close PO
                            </Button>
                        )}
                    </div>
                </div>
            }
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{order.po_number}</h3>
                    <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>{order.vendor}</p>
                </div>
                <StatusBadge status={order.status} />
            </div>

            {/* Meta */}
            <div className={`grid gap-4 mb-6 ${order.jo_reference ? "grid-cols-4" : "grid-cols-3"}`}>
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
            </div>

            {/* Line Items */}
            <div>
                <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>Line Items ({order.items_count} items)</h4>
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                    <table className="w-full">
                        <thead>
                            <tr style={{ background: "var(--secondary)" }}>
                                <th className="text-left text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Item</th>
                                <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Qty</th>
                                <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Unit Cost</th>
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
                        <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{formatCurrency(order.total)}</p>
                    </div>
                </div>
            </div>

            {/* Activity Log */}
            <div className="mt-5">
                <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>Activity</h4>
                <ActivityLog entries={getMockActivities("Purchase Order", order.id)} />
            </div>

            <DeleteConfirmation
                open={showDelete}
                onClose={() => setShowDelete(false)}
                onConfirm={() => { setShowDelete(false); toast("success", "PO deleted", `${order.po_number} deleted`); onClose(); }}
                title={`Delete ${order.po_number}?`}
                description="This action cannot be undone. The purchase order will be permanently removed."
            />
        </Drawer>
    );
}
