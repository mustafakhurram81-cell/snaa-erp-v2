"use client";

import React, { useState, useEffect } from "react";
import { Drawer, Button, StatusBadge, DrawerTabs, Input, DrawerSection, DrawerStatCard } from "@/components/ui/shared";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Mail, Phone, MapPin, ShoppingCart, FileText, Edit3, Save, X, Trash2, Building2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { DeleteConfirmation } from "@/components/shared/delete-confirmation";
import { LiveActivityLog } from "@/components/shared/activity-log";
import { supabase } from "@/lib/supabase";
import { RoleGuard } from "@/components/shared/role-guard";
import { CUSTOMER_TYPES } from "@/app/customers/page";

const typeColors: Record<string, string> = {
    hospital: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    distributor: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    private_practitioner: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    clinic: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    government: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

function getTypeLabel(type: string) {
    return CUSTOMER_TYPES.find(t => t.value === type)?.label || type;
}

interface Customer {
    id: string;
    name: string;
    type: string;
    email: string;
    phone: string;
    city: string;
    country: string;
    status: string;
    ar_balance: number;
    created_at: string;
}

interface RelatedOrder {
    id: string;
    order_number: string;
    total_amount: number | null;
    status: string | null;
    created_at: string | null;
}

interface RelatedQuotation {
    id: string;
    quote_number: string;
    total_amount: number | null;
    status: string | null;
    created_at: string | null;
}

interface CustomerDetailProps {
    customer: Customer | null;
    open: boolean;
    onClose: () => void;
    onUpdate?: (customer: Customer) => void;
    onDelete?: (customer: Customer) => void;
}

export function CustomerDetail({ customer, open, onClose, onUpdate, onDelete }: CustomerDetailProps) {
    const { toast } = useToast();
    const [showDelete, setShowDelete] = useState(false);
    const [activeTab, setActiveTab] = useState("orders");
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState(customer ? { ...customer } : {} as Customer);
    const [relatedOrders, setRelatedOrders] = useState<RelatedOrder[]>([]);
    const [relatedQuotations, setRelatedQuotations] = useState<RelatedQuotation[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [loadingQuotations, setLoadingQuotations] = useState(false);

    // Reset edit state when customer changes
    useEffect(() => {
        if (customer) {
            setEditData({ ...customer });
            setIsEditing(false);
        }
    }, [customer]);

    // Fetch related sales orders for this customer
    useEffect(() => {
        if (!customer?.name || !open) return;
        setLoadingOrders(true);
        supabase
            .from("sales_orders")
            .select("id, order_number, total_amount, status, created_at")
            .ilike("customer_name", customer.name)
            .order("created_at", { ascending: false })
            .limit(10)
            .then(({ data }) => {
                setRelatedOrders(data || []);
                setLoadingOrders(false);
            });
    }, [customer?.name, open]);

    // Fetch related quotations for this customer
    useEffect(() => {
        if (!customer?.name || !open) return;
        setLoadingQuotations(true);
        supabase
            .from("quotations")
            .select("id, quote_number, total_amount, status, created_at")
            .ilike("customer_name", customer.name)
            .order("created_at", { ascending: false })
            .limit(10)
            .then(({ data }) => {
                setRelatedQuotations(data || []);
                setLoadingQuotations(false);
            });
    }, [customer?.name, open]);

    if (!customer) return null;

    const handleSave = async () => {
        if (onUpdate) {
            onUpdate(editData);
        }
        setIsEditing(false);
        toast("success", "Customer updated", `${editData.name} saved successfully`);
        const { logActivity } = await import("@/lib/activity-logger");
        logActivity({ entityType: "customer", entityId: customer.id, action: "Customer updated", details: customer.name });
    };

    const handleCancel = () => {
        setEditData({ ...customer });
        setIsEditing(false);
    };

    const tabs = [
        { key: "orders", label: "Orders", count: relatedOrders.length },
        { key: "quotations", label: "Quotations", count: relatedQuotations.length },
        { key: "activity", label: "Activity" },
    ];

    return (
        <Drawer
            open={open}
            onClose={() => { handleCancel(); onClose(); }}
            title={isEditing ? "Edit Customer" : "Customer Details"}
            width="max-w-xl"
            footer={
                <div className="flex justify-between">
                    <Button variant="secondary" onClick={() => { handleCancel(); onClose(); }}>Close</Button>
                    <div className="flex gap-2">
                        {isEditing ? (
                            <>
                                <Button variant="secondary" onClick={handleCancel}>
                                    <X className="w-3.5 h-3.5" /> Cancel
                                </Button>
                                <Button onClick={handleSave}>
                                    <Save className="w-3.5 h-3.5" /> Save Changes
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="secondary" onClick={() => setIsEditing(true)}>
                                    <Edit3 className="w-3.5 h-3.5" /> Edit
                                </Button>
                                <RoleGuard minRole="admin"><button onClick={() => setShowDelete(true)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></RoleGuard>
                                <Button variant="secondary">
                                    <FileText className="w-3.5 h-3.5" /> New Quote
                                </Button>
                                <Button>
                                    <ShoppingCart className="w-3.5 h-3.5" /> New Order
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            }
        >
            {/* Pinned Header */}
            <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                    <Building2 className="w-8 h-8" />
                </div>
                <div className="flex-1">
                    {isEditing ? (
                        <div className="space-y-2">
                            <Input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} placeholder="Customer name" />
                            <div>
                                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--foreground)" }}>Customer Type</label>
                                <select
                                    value={editData.type}
                                    onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                                    className="w-full h-8 px-3 rounded-lg border text-xs font-medium"
                                    style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
                                >
                                    {CUSTOMER_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                                </select>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h3 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{customer.name}</h3>
                            <span className={`inline-flex items-center text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full mt-1.5 ${typeColors[customer.type] || "bg-zinc-100 text-zinc-600"}`}>
                                {getTypeLabel(customer.type)}
                            </span>
                        </>
                    )}
                </div>
                <div className="flex flex-col items-end gap-2">
                    {!isEditing && <StatusBadge status={customer.status} />}
                    {isEditing && (
                        <select
                            value={editData.status}
                            onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                            className="h-8 px-3 rounded-lg border text-xs font-medium"
                            style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    )}
                </div>
            </div>

            {/* Contact Info */}
            <DrawerSection label="Contact Information">
                <div className="rounded-xl border p-4" style={{ background: "var(--secondary)", borderColor: "var(--border)" }}>
                    {isEditing ? (
                        <div className="grid grid-cols-2 gap-3">
                            <Input label="Email" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} />
                            <Input label="Phone" value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} />
                            <Input label="City" value={editData.city} onChange={(e) => setEditData({ ...editData, city: e.target.value })} />
                            <Input label="Country" value={editData.country} onChange={(e) => setEditData({ ...editData, country: e.target.value })} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--foreground)" }}>
                                <Mail className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
                                {customer.email}
                            </div>
                            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--foreground)" }}>
                                <Phone className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
                                {customer.phone}
                            </div>
                            <div className="flex items-center gap-2 text-sm col-span-2" style={{ color: "var(--foreground)" }}>
                                <MapPin className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
                                {customer.city}, {customer.country}
                            </div>
                        </div>
                    )}
                </div>
            </DrawerSection>

            {/* AR Balance */}
            <DrawerSection label="Financial">
                <div className="grid grid-cols-2 gap-3">
                    <DrawerStatCard label="AR Balance" value={formatCurrency(customer.ar_balance)} accent="emerald" />
                    <DrawerStatCard label="Customer Since" value={formatDate(customer.created_at)} accent="blue" />
                </div>
            </DrawerSection>

            {/* Tabs (hidden during edit) */}
            {!isEditing && (
                <>
                    <DrawerTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

                    {activeTab === "orders" && (
                        <div className="space-y-2">
                            {loadingOrders ? (
                                <div className="py-8 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>Loading orders...</div>
                            ) : relatedOrders.length === 0 ? (
                                <div className="py-8 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>No sales orders found</div>
                            ) : (
                                relatedOrders.map((order) => (
                                    <div key={order.id} className="flex items-center justify-between p-3 rounded-xl border transition-all duration-200 hover:shadow-soft-md hover:border-blue-300 dark:hover:border-blue-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer group" style={{ borderColor: "var(--border)" }}>
                                        <div>
                                            <p className="text-sm font-bold group-hover:text-blue-600 transition-colors" style={{ color: "var(--primary)" }}>{order.order_number}</p>
                                            <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{formatDate(order.created_at || "")}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{formatCurrency(order.total_amount ?? 0)}</span>
                                            <StatusBadge status={order.status || "unknown"} />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === "quotations" && (
                        <div className="space-y-2">
                            {loadingQuotations ? (
                                <div className="py-8 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>Loading quotations...</div>
                            ) : relatedQuotations.length === 0 ? (
                                <div className="py-8 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>No quotations found</div>
                            ) : (
                                relatedQuotations.map((qt) => (
                                    <div key={qt.id} className="flex items-center justify-between p-3 rounded-xl border transition-all duration-200 hover:shadow-soft-md hover:border-blue-300 dark:hover:border-blue-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer group" style={{ borderColor: "var(--border)" }}>
                                        <div>
                                            <p className="text-sm font-bold group-hover:text-blue-600 transition-colors" style={{ color: "var(--primary)" }}>{qt.quote_number}</p>
                                            <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{formatDate(qt.created_at || "")}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{formatCurrency(qt.total_amount ?? 0)}</span>
                                            <StatusBadge status={qt.status || "unknown"} />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === "activity" && (
                        <LiveActivityLog entityType="customer" entityId={customer.id} />
                    )}
                </>
            )}

            <DeleteConfirmation
                open={showDelete}
                onClose={() => setShowDelete(false)}
                onConfirm={async () => { setShowDelete(false); if (onDelete) { onDelete(customer); } const { logActivity } = await import("@/lib/activity-logger"); logActivity({ entityType: "customer", entityId: customer.id, action: "Customer deleted", details: customer.name }); toast("success", "Customer deleted", `${customer.name} deleted`); onClose(); }}
                title={`Delete ${customer.name}?`}
                description="This action cannot be undone. The customer and all associated data will be permanently removed."
            />
        </Drawer>
    );
}
