"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Drawer, Button, StatusBadge, DrawerTabs, Input } from "@/components/ui/shared";
import { formatCurrency, formatDate } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { Download, Receipt, Truck, ClipboardList, Edit3, Trash2, Save, X, Send } from "lucide-react";
import { generatePDF } from "@/lib/pdf";
import { useToast } from "@/components/ui/toast";
import { LiveActivityLog } from "@/components/shared/activity-log";
import { DeleteConfirmation } from "@/components/shared/delete-confirmation";
import { EmailSend } from "@/components/shared/email-send";
import { adjustStockForSO } from "@/lib/inventory-adjustment";

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
    line_items?: { id: string; product: string; qty: number; unit_price: number }[];
    invoice_number?: string;
}



interface SalesOrderDetailProps {
    order: SalesOrder | null;
    open: boolean;
    onClose: () => void;
    onCreateInvoice?: (order: SalesOrder) => void;
    onCreateJobOrders?: (order: SalesOrder) => void;
    onDelete?: (order: SalesOrder) => void;
    onUpdate?: (order: SalesOrder) => void;
}

export function SalesOrderDetail({ order, open, onClose, onCreateInvoice, onCreateJobOrders, onDelete, onUpdate }: SalesOrderDetailProps) {
    if (!order) return null;
    const router = useRouter();
    const { toast } = useToast();
    const [showDelete, setShowDelete] = useState(false);
    const [showEmail, setShowEmail] = useState(false);
    const [activeTab, setActiveTab] = useState("details");
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ customer: order.customer, delivery_date: order.delivery_date, status: order.status });
    const [dbLineItems, setDbLineItems] = useState<{ description: string; qty: number; unitPrice: number; total: number }[]>([]);

    useEffect(() => {
        if (order) { setEditData({ customer: order.customer, delivery_date: order.delivery_date, status: order.status }); setIsEditing(false); }
    }, [order]);

    useEffect(() => {
        if (!order?.line_items && order?.id) {
            supabase.from("sales_order_items").select("*").eq("sales_order_id", order.id).then(({ data }) => {
                if (data && data.length > 0) {
                    setDbLineItems(data.map((li: any) => ({ description: li.product_name || li.description || "Item", qty: li.quantity, unitPrice: li.unit_price, total: li.quantity * li.unit_price })));
                }
            });
        }
    }, [order?.id, order?.line_items]);

    const handleSave = async () => {
        if (onUpdate) onUpdate({ ...order, ...editData });
        setIsEditing(false);
        toast("success", "Sales Order updated", `${order.order_number} saved`);
        const { logActivity } = await import("@/lib/activity-logger");
        logActivity({ entityType: "sales_order", entityId: order.id, action: "Sales Order updated", details: order.order_number });
    };
    const handleCancel = () => { setEditData({ customer: order.customer, delivery_date: order.delivery_date, status: order.status }); setIsEditing(false); };

    const lineItems = order.line_items
        ? order.line_items.map(li => ({ description: li.product, qty: li.qty, unitPrice: li.unit_price, total: li.qty * li.unit_price }))
        : dbLineItems;

    const handleDownloadPDF = () => {
        generatePDF({ documentType: "Sales Order", documentNumber: order.order_number, date: formatDate(order.date), dueDate: formatDate(order.delivery_date), recipientName: order.customer, lineItems, subtotal: order.total, total: order.total, status: order.status });
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
            onClose={() => { handleCancel(); onClose(); }}
            title={isEditing ? "Edit Sales Order" : "Sales Order Details"}
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
                            <Button variant="secondary" onClick={() => setShowEmail(true)}><Send className="w-3.5 h-3.5" /> Send</Button>
                            {(order.status === "confirmed" || order.status === "in_progress") && !order.invoice_number && onCreateInvoice && (
                                <Button variant="secondary" onClick={() => { onCreateInvoice(order); onClose(); }}><Receipt className="w-3.5 h-3.5" /> Create Invoice</Button>
                            )}
                            {order.invoice_number && (
                                <button onClick={() => { onClose(); router.push(`/invoices?open=${order.invoice_number}`); }} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity cursor-pointer" style={{ background: "var(--secondary)", color: "var(--primary)" }}>
                                    <Receipt className="w-3.5 h-3.5" /> {order.invoice_number}
                                </button>
                            )}
                            {order.status === "confirmed" && onCreateJobOrders && (
                                <Button onClick={() => { onCreateJobOrders(order); onClose(); }}><ClipboardList className="w-3.5 h-3.5" /> Create Job Orders</Button>
                            )}
                            {order.status === "in_progress" && (
                                <Button onClick={async () => {
                                    const result = await adjustStockForSO(order.id, "deduct");
                                    if (result.adjustments.length > 0) {
                                        toast("success", "Stock updated", `Deducted: ${result.adjustments.map(a => `${a.product} (${a.qty})`).join(", ")}`);
                                    }
                                    toast("success", "Order shipped", `${order.order_number} marked as shipped`);
                                    onClose();
                                }}><Truck className="w-3.5 h-3.5" /> Mark Shipped</Button>
                            )}
                        </div>
                    )}
                </div>
            }
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex-1">
                    <h3 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{order.order_number}</h3>
                    {isEditing ? (
                        <Input className="mt-2" value={editData.customer} onChange={(e) => setEditData({ ...editData, customer: e.target.value })} placeholder="Customer name" />
                    ) : (
                        <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>{order.customer}</p>
                    )}
                </div>
                {isEditing ? (
                    <select value={editData.status} onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                        className="h-8 px-3 rounded-lg border text-xs font-medium" style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}>
                        <option value="confirmed">Confirmed</option>
                        <option value="in_progress">In Progress</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                ) : (
                    <StatusBadge status={order.status} />
                )}
            </div>

            {/* Progress Tracker (hidden during edit) */}
            {!isEditing && order.status !== "cancelled" && (
                <div className="mb-5 rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--muted-foreground)" }}>Order Progress</p>
                    <div className="flex items-center gap-1">
                        {statusSteps.map((step, idx) => (
                            <React.Fragment key={step}>
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${idx <= currentStep ? "bg-blue-600 text-white" : "border-2 text-[var(--muted-foreground)]"}`} style={idx > currentStep ? { borderColor: "var(--border)" } : undefined}>{idx + 1}</div>
                                {idx < statusSteps.length - 1 && (<div className="flex-1 h-0.5 rounded" style={{ background: idx < currentStep ? "#2563eb" : "var(--border)" }} />)}
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

            {/* Meta / Edit Fields */}
            {isEditing ? (
                <div className="grid grid-cols-3 gap-4 mb-5">
                    <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Order Date</p>
                        <p className="text-sm font-medium mt-1" style={{ color: "var(--foreground)" }}>{formatDate(order.date)}</p>
                    </div>
                    <Input label="Delivery Date" type="date" value={editData.delivery_date} onChange={(e) => setEditData({ ...editData, delivery_date: e.target.value })} />
                    <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Quotation</p>
                        <button onClick={() => { onClose(); router.push(`/quotations?open=${order.quotation}`); }} className="text-sm font-medium mt-1 hover:underline cursor-pointer" style={{ color: "var(--primary)" }}>{order.quotation}</button>
                    </div>
                </div>
            ) : null}

            {/* Tabs (hidden during edit) */}
            {!isEditing && (
                <>
                    <DrawerTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

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
                                <button onClick={() => { onClose(); router.push(`/quotations?open=${order.quotation}`); }} className="text-sm font-medium mt-1 hover:underline cursor-pointer" style={{ color: "var(--primary)" }}>{order.quotation}</button>
                            </div>
                        </div>
                    )}

                    {activeTab === "items" && (
                        <div>
                            <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                                <table className="w-full">
                                    <thead><tr style={{ background: "var(--secondary)" }}>
                                        <th className="text-left text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Product</th>
                                        <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Qty</th>
                                        <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Price</th>
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
                                    <div className="text-right">
                                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Order Total</p>
                                        <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{formatCurrency(order.total)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "activity" && (<LiveActivityLog entityType="sales_order" entityId={order.id} />)}
                </>
            )}

            <DeleteConfirmation open={showDelete} onClose={() => setShowDelete(false)}
                onConfirm={async () => { setShowDelete(false); if (onDelete) { onDelete(order); } const { logActivity } = await import("@/lib/activity-logger"); logActivity({ entityType: "sales_order", entityId: order.id, action: "Sales Order deleted", details: order.order_number }); toast("success", "Order deleted", `${order.order_number} deleted`); onClose(); }}
                title={`Delete ${order.order_number}?`} description="This action cannot be undone. The sales order and all linked data will be permanently removed." />

            <EmailSend
                open={showEmail}
                onClose={() => setShowEmail(false)}
                documentType="Sales Order"
                documentNumber={order.order_number}
                recipientName={order.customer}
            />
        </Drawer>
    );
}
