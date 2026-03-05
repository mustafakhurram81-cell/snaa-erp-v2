"use client";

import React, { useState, useEffect } from "react";
import { Drawer, Button, StatusBadge, DrawerTabs, Input, DrawerSection, DrawerStatCard } from "@/components/ui/shared";
import { formatCurrency, formatDate } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { RoleGuard } from "@/components/shared/role-guard";
import { Download, Truck, CheckCircle, Edit3, Trash2, Save, X, Send, ClipboardList } from "lucide-react";
import { generatePDF } from "@/lib/pdf";
import { useToast } from "@/components/ui/toast";
import { LiveActivityLog } from "@/components/shared/activity-log";
import { DeleteConfirmation } from "@/components/shared/delete-confirmation";
import { EmailSend } from "@/components/shared/email-send";
import { adjustStockForPO, adjustStockForPartialReceipt } from "@/lib/inventory-adjustment";
import { Dialog, Card } from "@/components/ui/shared";

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
    line_items?: { id: string; item: string; qty: number; unit_cost: number; received_quantity?: number; product_id?: string }[];
}



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
    const [showEmail, setShowEmail] = useState(false);
    const [activeTab, setActiveTab] = useState("items");
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ vendor: order.vendor, expected_date: order.expected_date, status: order.status });
    const [dbLineItems, setDbLineItems] = useState<{ id: string; description: string; qty: number; unitPrice: number; total: number; receivedQty: number; productId: string | null }[]>([]);
    const [showReceiveModal, setShowReceiveModal] = useState(false);
    const [receiptData, setReceiptData] = useState<Record<string, number>>({});
    const [isReceiving, setIsReceiving] = useState(false);

    useEffect(() => {
        if (order) {
            setEditData({ vendor: order.vendor, expected_date: order.expected_date, status: order.status });
            setIsEditing(false);
            setReceiptData({});
        }
    }, [order]);

    useEffect(() => {
        if (!order?.line_items && order?.id) {
            (supabase as any).from("purchase_order_items").select("*").eq("purchase_order_id", order.id).then(({ data }: any) => {
                if (data && data.length > 0) {
                    setDbLineItems(data.map((li: any) => ({
                        id: li.id,
                        productId: li.product_id,
                        description: li.product_name || li.item_name || li.description || "Item",
                        qty: li.quantity,
                        unitPrice: li.unit_cost || li.unit_price,
                        total: li.quantity * (li.unit_cost || li.unit_price),
                        receivedQty: li.received_quantity || 0
                    })));
                }
            });
        }
    }, [order?.id, order?.line_items]);

    const handleSave = async () => {
        if (onUpdate) onUpdate({ ...order, ...editData });
        setIsEditing(false);
        toast("success", "Purchase Order updated", `${order.po_number} saved`);
        const { logActivity } = await import("@/lib/activity-logger");
        logActivity({ entityType: "purchase_order", entityId: order.id, action: "PO updated", details: order.po_number });
    };
    const handleCancel = () => { setEditData({ vendor: order.vendor, expected_date: order.expected_date, status: order.status }); setIsEditing(false); };

    const lineItems = order.line_items
        ? order.line_items.map(li => ({
            id: li.id,
            productId: li.product_id || null,
            description: li.item,
            qty: li.qty,
            unitPrice: li.unit_cost,
            total: li.qty * li.unit_cost,
            receivedQty: li.received_quantity || 0
        }))
        : dbLineItems;

    const handleReceiveItems = async () => {
        setIsReceiving(true);
        try {
            const updates = [];
            const adjustments = [];

            for (const item of lineItems) {
                const newReceived = receiptData[item.id] || 0;
                if (newReceived > 0) {
                    const totalReceived = (item.receivedQty || 0) + newReceived;
                    updates.push(
                        supabase.from("purchase_order_items").update({
                            received_quantity: totalReceived,
                            received_at: new Date().toISOString()
                        }).eq("id", item.id)
                    );

                    if (item.productId) {
                        adjustments.push({
                            productId: item.productId,
                            quantity: newReceived,
                            description: item.description
                        });
                    }
                }
            }

            if (updates.length > 0) {
                await Promise.all(updates);

                if (adjustments.length > 0) {
                    await adjustStockForPartialReceipt(order.id, adjustments);
                    toast("success", "Stock updated", `Added stock for ${adjustments.length} items`);
                }

                // Check overall status
                const { data: refreshedItems } = await supabase.from("purchase_order_items").select("quantity, received_quantity").eq("purchase_order_id", order.id);
                const allReceived = refreshedItems?.every(ri => (ri.received_quantity ?? 0) >= ri.quantity);
                const someReceived = refreshedItems?.some(ri => (ri.received_quantity ?? 0) > 0);

                let nextStatus = order.status;
                if (allReceived) nextStatus = "received";
                else if (someReceived) nextStatus = "partial"; // or keep 'sent' but show progress

                if (nextStatus !== order.status) {
                    await supabase.from("purchase_orders").update({ status: nextStatus }).eq("id", order.id);
                }

                toast("success", "Items received", "Quantities updated successfully");
                setShowReceiveModal(false);
                if (onUpdate) onUpdate({ ...order, status: nextStatus });
            }
        } catch (error) {
            console.error("Error receiving items:", error);
            toast("error", "Error", "Failed to update received quantities");
        } finally {
            setIsReceiving(false);
        }
    };

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
                                <RoleGuard minRole="admin"><button onClick={() => setShowDelete(true)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></RoleGuard>
                            </>
                        )}
                    </div>
                    {!isEditing && (
                        <div className="flex gap-2">
                            <Button variant="secondary" onClick={handleDownloadPDF}><Download className="w-3.5 h-3.5" /> PDF</Button>
                            <Button variant="secondary" onClick={() => setShowEmail(true)}><Send className="w-3.5 h-3.5" /> Send</Button>
                            {(order.status === "sent" || order.status === "partial") && (
                                <Button onClick={() => setShowReceiveModal(true)}><Truck className="w-3.5 h-3.5" /> Receive Items</Button>
                            )}
                            {(order.status === "received" || order.status === "partial") && (
                                <Button onClick={async () => {
                                    await supabase.from("purchase_orders").update({ status: "closed" }).eq("id", order.id);
                                    toast("success", "PO closed", `${order.po_number} closed`);
                                    const { logActivity } = await import("@/lib/activity-logger");
                                    logActivity({ entityType: "purchase_order", entityId: order.id, action: "PO closed", details: order.po_number });
                                    if (onUpdate) onUpdate({ ...order, status: "closed" });
                                    onClose();
                                }}><CheckCircle className="w-3.5 h-3.5" /> Close PO</Button>
                            )}
                        </div>
                    )}
                </div>
            }
        >
            {/* Header */}
            <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                    <ClipboardList className="w-8 h-8" />
                </div>
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

            {/* Meta Stats */}
            <DrawerSection label="Order Summary">
                <div className={`grid gap-3 ${order.jo_reference ? "grid-cols-4" : "grid-cols-3"}`}>
                    <DrawerStatCard label="Total Cost" value={formatCurrency(order.total)} accent="emerald" />
                    <DrawerStatCard label="Order Date" value={formatDate(order.date)} accent="blue" />
                    <DrawerStatCard label="Expected" value={formatDate(order.expected_date)} accent="amber" />
                    {order.jo_reference && (
                        <DrawerStatCard label="Job Order" value={order.jo_reference} accent="violet" subValue={order.jo_stage} />
                    )}
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
                                    <thead><tr style={{ background: "var(--secondary)" }}>
                                        <th className="text-left text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Item</th>
                                        <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Progress</th>
                                        <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Qty</th>
                                        <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Unit Cost</th>
                                        <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Total</th>
                                    </tr></thead>
                                    <tbody>
                                        {lineItems.map((item, idx) => (
                                            <tr key={idx} className="border-t hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors" style={{ borderColor: "var(--border)" }}>
                                                <td className="px-4 py-3 text-sm" style={{ color: "var(--foreground)" }}>{item.description}</td>
                                                <td className="px-4 py-3 text-sm text-right">
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="text-[10px] font-medium" style={{ color: "var(--muted-foreground)" }}>
                                                            {item.receivedQty} / {item.qty} received
                                                        </span>
                                                        <div className="w-24 h-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                                            <div
                                                                className="h-full bg-emerald-500 transition-all duration-500"
                                                                style={{ width: `${Math.min(100, ((item.receivedQty || 0) / item.qty) * 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
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
                    {activeTab === "activity" && (<LiveActivityLog entityType="purchase_order" entityId={order.id} />)}
                </>
            )}

            <DeleteConfirmation open={showDelete} onClose={() => setShowDelete(false)}
                onConfirm={async () => { setShowDelete(false); if (onDelete) { onDelete(order); } const { logActivity } = await import("@/lib/activity-logger"); logActivity({ entityType: "purchase_order", entityId: order.id, action: "PO deleted", details: order.po_number }); toast("success", "PO deleted", `${order.po_number} deleted`); onClose(); }}
                title={`Delete ${order.po_number}?`} description="This action cannot be undone. The purchase order will be permanently removed." />

            <EmailSend
                open={showEmail}
                onClose={() => setShowEmail(false)}
                documentType="Purchase Order"
                documentNumber={order.po_number}
                recipientName={order.vendor}
            />

            <Dialog
                open={showReceiveModal}
                onClose={() => setShowReceiveModal(false)}
                title="Receive Items"
                width="max-w-xl"
            >
                <div className="space-y-4">
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        Enter the quantities received in this shipment. Inventory stock will be updated automatically.
                    </p>
                    <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                        {lineItems.map(item => (
                            <Card key={item.id} className="p-3">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <h4 className="text-sm font-semibold">{item.description}</h4>
                                        <p className="text-[10px] mt-1" style={{ color: "var(--muted-foreground)" }}>
                                            Pending: <span className="font-bold text-foreground">{item.qty - (item.receivedQty || 0)}</span> / {item.qty}
                                        </p>
                                    </div>
                                    <div className="w-24">
                                        <Input
                                            type="number"
                                            placeholder="Qty"
                                            className="text-right"
                                            value={receiptData[item.id] || ""}
                                            onChange={(e) => setReceiptData({
                                                ...receiptData,
                                                [item.id]: Math.min(item.qty - (item.receivedQty || 0), Math.max(0, parseInt(e.target.value) || 0))
                                            })}
                                        />
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                        <Button variant="secondary" onClick={() => setShowReceiveModal(false)}>Cancel</Button>
                        <Button onClick={handleReceiveItems} disabled={isReceiving || Object.values(receiptData).every(v => v <= 0)}>
                            {isReceiving ? "Saving..." : "Log Receipt"}
                        </Button>
                    </div>
                </div>
            </Dialog>
        </Drawer>
    );
}
