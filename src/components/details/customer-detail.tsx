"use client";

import React from "react";
import { Drawer, Button, StatusBadge } from "@/components/ui/shared";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { Mail, Phone, MapPin, ShoppingCart, FileText, Receipt } from "lucide-react";

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
    [key: string]: unknown;
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
}

export function CustomerDetail({ customer, open, onClose }: CustomerDetailProps) {
    if (!customer) return null;

    return (
        <Drawer
            open={open}
            onClose={onClose}
            title="Customer Details"
            width="max-w-xl"
            footer={
                <div className="flex justify-between">
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                    <div className="flex gap-2">
                        <Button variant="secondary">
                            <FileText className="w-3.5 h-3.5" />
                            New Quote
                        </Button>
                        <Button>
                            <ShoppingCart className="w-3.5 h-3.5" />
                            New Order
                        </Button>
                    </div>
                </div>
            }
        >
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                    {getInitials(customer.name)}
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{customer.name}</h3>
                    <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{customer.company}</p>
                </div>
                <StatusBadge status={customer.status} />
            </div>

            {/* Contact Info */}
            <div className="rounded-xl border p-4 mb-5" style={{ background: "var(--secondary)", borderColor: "var(--border)" }}>
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
            </div>

            {/* AR Balance */}
            <div className="rounded-xl border p-4 mb-5" style={{ borderColor: "var(--border)" }}>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--muted-foreground)" }}>AR Balance</p>
                <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{formatCurrency(customer.ar_balance)}</p>
                <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Customer since {formatDate(customer.created_at)}</p>
            </div>

            {/* Recent Orders */}
            <div className="mb-5">
                <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>Recent Orders</h4>
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
            </div>

            {/* Recent Quotations */}
            <div>
                <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>Recent Quotations</h4>
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
            </div>
        </Drawer>
    );
}
