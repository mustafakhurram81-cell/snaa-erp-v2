"use client";

import React, { useState } from "react";
import { Drawer, Button, StatusBadge, DrawerTabs } from "@/components/ui/shared";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Download, Receipt, Truck, ClipboardList, Edit3, Trash2 } from "lucide-react";
import { generatePDF } from "@/lib/pdf";
import { useToast } from "@/components/ui/toast";
import { ActivityLog, getMockActivities } from "@/components/shared/activity-log";
import { DeleteConfirmation } from "@/components/shared/delete-confirmation";

interface SalesOrder {
    id: string;
    order_number: string;
    customer: string;
    quotation: string;
    date: string;
    delivery_date: string;
    items_count: number;
    total: number;
    status: string;
    [key: string]: unknown;
}

const mockLineItems = [
    { description: "Mayo Scissors 6.5\" Straight", qty: 50, unitPrice: 24.0, total: 1200 },
    { description: "Adson Forceps 4.75\"", qty: 100, unitPrice: 15.0, total: 1500 },
    { description: "Kelly Clamp 5.5\" Curved", qty: 30, unitPrice: 20.0, total: 600 },
];

interface SalesOrderDetailProps {
    order: SalesOrder | null;
    open: boolean;
    onClose: () => void;
}

export function SalesOrderDetail({ order, open, onClose }: SalesOrderDetailProps) {
    if (!order) return null;
    const { toast } = useToast();
    const [showDelete, setShowDelete] = useState(false);
    const [activeTab, setActiveTab] = useState("details");

    const lineItems = mockLineItems.slice(0, Math.min(order.items_count, 3));

    const handleDownloadPDF = () => {
        generatePDF({
            documentType: "Sales Order",
            documentNumber: order.order_number,
            date: formatDate(order.date),
            dueDate: formatDate(order.delivery_date),
            recipientName: order.customer,
            lineItems,
            subtotal: order.total,
            total: order.total,
            status: order.status,
        });
    };

    const statusSteps = ["confirmed", "in_progress", "shipped", "delivered"];
    const currentStep = statusSteps.indexOf(order.status);

    const tabs = [
        { key: "details", label: "Details" },
        { key: "items", label: "Line Items", count: order.items_count },
        { key: "activity", label: "Activity" },
    ];

    return (
        <Drawer
            open={open}
            onClose={onClose}
            title="Sales Order Details"
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
                        {(order.status === "confirmed" || order.status === "in_progress") && (
                            <Button variant="secondary" onClick={() => { toast("success", "Invoice created", `Invoice generated from ${order.order_number}`); onClose(); }}>
                                <Receipt className="w-3.5 h-3.5" />
                                Create Invoice
                            </Button>
                        )}
                        {order.status === "confirmed" && (
                            <Button onClick={() => { toast("success", "Job Orders created", `JOs created for ${order.items_count} line items from ${order.order_number}`); onClose(); }}>
                                <ClipboardList className="w-3.5 h-3.5" />
                                Create Job Orders
                            </Button>
                        )}
                        {order.status === "in_progress" && (
                            <Button onClick={() => { toast("success", "Order shipped", `${order.order_number} marked as shipped`); onClose(); }}>
                                <Truck className="w-3.5 h-3.5" />
                                Mark Shipped
                            </Button>
                        )}
                    </div>
                </div>
            }
        >
            {/* Pinned Header */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{order.order_number}</h3>
                    <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>{order.customer}</p>
                </div>
                <StatusBadge status={order.status} />
            </div>

            {/* Pinned Progress Tracker */}
            {order.status !== "cancelled" && (
                <div className="mb-5 rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--muted-foreground)" }}>Order Progress</p>
                    <div className="flex items-center gap-1">
                        {statusSteps.map((step, idx) => (
                            <React.Fragment key={step}>
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${idx <= currentStep
                                    ? "bg-blue-600 text-white"
                                    : "border-2 text-[var(--muted-foreground)]"
                                    }`} style={idx > currentStep ? { borderColor: "var(--border)" } : undefined}>
                                    {idx + 1}
                                </div>
                                {idx < statusSteps.length - 1 && (
                                    <div className="flex-1 h-0.5 rounded" style={{ background: idx < currentStep ? "#2563eb" : "var(--border)" }} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2">
                        {["Confirmed", "In Production", "Shipped", "Delivered"].map((label) => (
                            <span key={label} className="text-[10px] font-medium" style={{ color: "var(--muted-foreground)" }}>{label}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <DrawerTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

            {/* Tab: Details */}
            {activeTab === "details" && (
                <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Order Date</p>
                        <p className="text-sm font-medium mt-1" style={{ color: "var(--foreground)" }}>{formatDate(order.date)}</p>
                    </div>
                    <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Delivery</p>
                        <p className="text-sm font-medium mt-1" style={{ color: "var(--foreground)" }}>{formatDate(order.delivery_date)}</p>
                    </div>
                    <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Quotation</p>
                        <p className="text-sm font-medium mt-1" style={{ color: "var(--primary)" }}>{order.quotation}</p>
                    </div>
                </div>
            )}

            {/* Tab: Line Items */}
            {activeTab === "items" && (
                <div>
                    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                        <table className="w-full">
                            <thead>
                                <tr style={{ background: "var(--secondary)" }}>
                                    <th className="text-left text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Product</th>
                                    <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Qty</th>
                                    <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Price</th>
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
                                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Order Total</p>
                                <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{formatCurrency(order.total)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab: Activity */}
            {activeTab === "activity" && (
                <ActivityLog entries={getMockActivities("Sales Order", order.id)} />
            )}

            <DeleteConfirmation
                open={showDelete}
                onClose={() => setShowDelete(false)}
                onConfirm={() => { setShowDelete(false); toast("success", "Order deleted", `${order.order_number} deleted`); onClose(); }}
                title={`Delete ${order.order_number}?`}
                description="This action cannot be undone. The sales order and all linked data will be permanently removed."
            />
        </Drawer>
    );
}
