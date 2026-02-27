"use client";

import React, { useState } from "react";
import { Drawer, Button, StatusBadge, DrawerTabs } from "@/components/ui/shared";
import { formatCurrency, getInitials } from "@/lib/utils";
import { Mail, Phone, MapPin, ClipboardList, Edit2 } from "lucide-react";

interface Vendor {
    id: string;
    vendor_code: string;
    name: string;
    contact_name: string;
    email: string;
    phone: string;
    city: string;
    status: string;
    total_orders?: number;
    [key: string]: unknown;
}

const relatedPOs = [
    { id: "PO-2026-028", date: "Feb 24, 2026", total: 28000, status: "sent" },
    { id: "PO-2026-024", date: "Feb 10, 2026", total: 9500, status: "closed" },
    { id: "PO-2026-019", date: "Jan 28, 2026", total: 15000, status: "closed" },
];

interface VendorDetailProps {
    vendor: Vendor | null;
    open: boolean;
    onClose: () => void;
}

export function VendorDetail({ vendor, open, onClose }: VendorDetailProps) {
    if (!vendor) return null;
    const [activeTab, setActiveTab] = useState("pos");

    const tabs = [
        { key: "pos", label: "Purchase Orders", count: relatedPOs.length },
    ];

    return (
        <Drawer
            open={open}
            onClose={onClose}
            title="Vendor Details"
            width="max-w-xl"
            footer={
                <div className="flex justify-between">
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                    <div className="flex gap-2">
                        <Button variant="secondary">
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit
                        </Button>
                        <Button>
                            <ClipboardList className="w-3.5 h-3.5" />
                            New PO
                        </Button>
                    </div>
                </div>
            }
        >
            {/* Pinned Header */}
            <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                    {getInitials(vendor.name)}
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{vendor.name}</h3>
                    <p className="text-sm font-mono" style={{ color: "var(--muted-foreground)" }}>{vendor.vendor_code}</p>
                </div>
                <StatusBadge status={vendor.status} />
            </div>

            {/* Pinned Contact Info */}
            <div className="rounded-xl border p-4 mb-5" style={{ background: "var(--secondary)", borderColor: "var(--border)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--muted-foreground)" }}>Contact Person</p>
                <p className="text-sm font-medium mb-3" style={{ color: "var(--foreground)" }}>{vendor.contact_name}</p>
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm" style={{ color: "var(--foreground)" }}>
                        <Mail className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
                        {vendor.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm" style={{ color: "var(--foreground)" }}>
                        <Phone className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
                        {vendor.phone}
                    </div>
                    <div className="flex items-center gap-2 text-sm col-span-2" style={{ color: "var(--foreground)" }}>
                        <MapPin className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
                        {vendor.city}
                    </div>
                </div>
            </div>

            {/* Pinned Stats */}
            <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Total Orders</p>
                    <p className="text-2xl font-bold mt-0.5" style={{ color: "var(--foreground)" }}>{vendor.total_orders ?? relatedPOs.length}</p>
                </div>
                <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Total Spend</p>
                    <p className="text-2xl font-bold mt-0.5" style={{ color: "var(--foreground)" }}>{formatCurrency(relatedPOs.reduce((s, p) => s + p.total, 0))}</p>
                </div>
            </div>

            {/* Tabs */}
            <DrawerTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

            {/* Tab: Purchase Orders */}
            {activeTab === "pos" && (
                <div className="space-y-2">
                    {relatedPOs.map((po) => (
                        <div key={po.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: "var(--border)" }}>
                            <div>
                                <p className="text-sm font-medium" style={{ color: "var(--primary)" }}>{po.id}</p>
                                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{po.date}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{formatCurrency(po.total)}</span>
                                <StatusBadge status={po.status} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Drawer>
    );
}
