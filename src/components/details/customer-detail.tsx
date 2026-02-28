"use client";

import React, { useState, useEffect } from "react";
import { Drawer, Button, StatusBadge, DrawerTabs, Input } from "@/components/ui/shared";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { Mail, Phone, MapPin, ShoppingCart, FileText, Edit3, Save, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface Customer {
    id: string;
    name: string;
    company: string;
    email: string;
    phone: string;
    city: string;
    country: string;
    status: string;
    ar_balance: number;
    created_at: string;
}

// Mock related data
const relatedOrders = [
    { id: "SO-2026-042", date: "Feb 25, 2026", total: 12500, status: "confirmed" },
    { id: "SO-2026-038", date: "Feb 21, 2026", total: 6300, status: "delivered" },
    { id: "SO-2026-030", date: "Feb 10, 2026", total: 9200, status: "delivered" },
];

const relatedQuotations = [
    { id: "QT-2026-089", date: "Feb 25, 2026", total: 18500, status: "sent" },
    { id: "QT-2026-084", date: "Feb 12, 2026", total: 9200, status: "accepted" },
];

interface CustomerDetailProps {
    customer: Customer | null;
    open: boolean;
    onClose: () => void;
    onUpdate?: (customer: Customer) => void;
}

export function CustomerDetail({ customer, open, onClose, onUpdate }: CustomerDetailProps) {
    if (!customer) return null;
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("orders");
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ ...customer });

    // Reset edit state when customer changes
    useEffect(() => {
        if (customer) {
            setEditData({ ...customer });
            setIsEditing(false);
        }
    }, [customer]);

    const handleSave = () => {
        if (onUpdate) {
            onUpdate(editData);
        }
        setIsEditing(false);
        toast("success", "Customer updated", `${editData.name} saved successfully`);
    };

    const handleCancel = () => {
        setEditData({ ...customer });
        setIsEditing(false);
    };

    const tabs = [
        { key: "orders", label: "Orders", count: relatedOrders.length },
        { key: "quotations", label: "Quotations", count: relatedQuotations.length },
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
            <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                    {getInitials(isEditing ? editData.name : customer.name)}
                </div>
                <div className="flex-1">
                    {isEditing ? (
                        <div className="space-y-2">
                            <Input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} placeholder="Customer name" />
                            <Input value={editData.company} onChange={(e) => setEditData({ ...editData, company: e.target.value })} placeholder="Company" />
                        </div>
                    ) : (
                        <>
                            <h3 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{customer.name}</h3>
                            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{customer.company}</p>
                        </>
                    )}
                </div>
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

            {/* Contact Info */}
            <div className="rounded-xl border p-4 mb-5" style={{ background: "var(--secondary)", borderColor: "var(--border)" }}>
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

            {/* AR Balance */}
            <div className="rounded-xl border p-4 mb-5" style={{ borderColor: "var(--border)" }}>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--muted-foreground)" }}>AR Balance</p>
                <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{formatCurrency(customer.ar_balance)}</p>
                <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Customer since {formatDate(customer.created_at)}</p>
            </div>

            {/* Tabs (hidden during edit) */}
            {!isEditing && (
                <>
                    <DrawerTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

                    {activeTab === "orders" && (
                        <div className="space-y-2">
                            {relatedOrders.map((order) => (
                                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: "var(--border)" }}>
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: "var(--primary)" }}>{order.id}</p>
                                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{order.date}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{formatCurrency(order.total)}</span>
                                        <StatusBadge status={order.status} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === "quotations" && (
                        <div className="space-y-2">
                            {relatedQuotations.map((qt) => (
                                <div key={qt.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: "var(--border)" }}>
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: "var(--primary)" }}>{qt.id}</p>
                                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{qt.date}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{formatCurrency(qt.total)}</span>
                                        <StatusBadge status={qt.status} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </Drawer>
    );
}
