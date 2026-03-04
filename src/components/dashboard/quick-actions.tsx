"use client";

import React from "react";
import Link from "next/link";
import {
    FileText, ShoppingCart, Factory, Receipt, Users, Package,
} from "lucide-react";

const quickActions = [
    { label: "New Quote", icon: FileText, href: "/quotations", color: "from-blue-500 to-blue-600" },
    { label: "New Order", icon: ShoppingCart, href: "/sales-orders", color: "from-violet-500 to-violet-600" },
    { label: "New Invoice", icon: Receipt, href: "/invoices", color: "from-emerald-500 to-emerald-600" },
    { label: "New PO", icon: Package, href: "/purchase-orders", color: "from-amber-500 to-amber-600" },
    { label: "Production", icon: Factory, href: "/production", color: "from-rose-500 to-rose-600" },
    { label: "Customers", icon: Users, href: "/customers", color: "from-cyan-500 to-cyan-600" },
];

export function QuickActions() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                    <Link key={action.label} href={action.href}>
                        <div className="group rounded-xl border p-4 text-center cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5" style={{ borderColor: "var(--border)" }}>
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform`}>
                                <Icon className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>{action.label}</span>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
