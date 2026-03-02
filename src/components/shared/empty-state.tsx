"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    Users, Package, FileText, ShoppingCart, Receipt,
    Factory, Truck, ClipboardList, BarChart3, Plus
} from "lucide-react";
import { Button } from "@/components/ui/shared";

interface EmptyStateProps {
    module: "customers" | "products" | "quotations" | "sales-orders" | "invoices" | "purchase-orders" | "vendors" | "production" | "reports" | "generic";
    onAction?: () => void;
}

const config: Record<string, { icon: React.ReactNode; title: string; description: string; actionLabel: string; gradient: string }> = {
    customers: {
        icon: <Users className="w-10 h-10" />,
        title: "No customers yet",
        description: "Add your first customer to start building your client base. You can add hospitals, distributors, and private practitioners.",
        actionLabel: "Add Customer",
        gradient: "from-blue-500/20 to-violet-500/20",
    },
    products: {
        icon: <Package className="w-10 h-10" />,
        title: "No products in catalog",
        description: "Start adding surgical instruments to your product catalog. Products will appear in orders and quotations.",
        actionLabel: "Add Product",
        gradient: "from-amber-500/20 to-orange-500/20",
    },
    quotations: {
        icon: <FileText className="w-10 h-10" />,
        title: "No quotations created",
        description: "Create your first quotation to start the sales pipeline. Quotations can be converted to sales orders with one click.",
        actionLabel: "Create Quotation",
        gradient: "from-blue-500/20 to-cyan-500/20",
    },
    "sales-orders": {
        icon: <ShoppingCart className="w-10 h-10" />,
        title: "No sales orders yet",
        description: "Sales orders will appear here once you create them or convert quotations. Each order tracks items, shipments, and payments.",
        actionLabel: "Create Sales Order",
        gradient: "from-violet-500/20 to-purple-500/20",
    },
    invoices: {
        icon: <Receipt className="w-10 h-10" />,
        title: "No invoices issued",
        description: "Create invoices to track payments from customers. Invoices can be generated from sales orders automatically.",
        actionLabel: "Create Invoice",
        gradient: "from-emerald-500/20 to-green-500/20",
    },
    "purchase-orders": {
        icon: <ClipboardList className="w-10 h-10" />,
        title: "No purchase orders",
        description: "Create purchase orders to manage vendor procurement. POs track item quantities, costs, and delivery status.",
        actionLabel: "Create Purchase Order",
        gradient: "from-sky-500/20 to-blue-500/20",
    },
    vendors: {
        icon: <Truck className="w-10 h-10" />,
        title: "No vendors added",
        description: "Add your suppliers and service providers. Vendors are linked to purchase orders and production job stages.",
        actionLabel: "Add Vendor",
        gradient: "from-rose-500/20 to-pink-500/20",
    },
    production: {
        icon: <Factory className="w-10 h-10" />,
        title: "No job orders",
        description: "Create job orders to track manufacturing production. Each job tracks progress through multiple stages like forging, grinding, and finishing.",
        actionLabel: "Create Job Order",
        gradient: "from-amber-500/20 to-yellow-500/20",
    },
    reports: {
        icon: <BarChart3 className="w-10 h-10" />,
        title: "No data to report",
        description: "Reports will populate as you create orders, invoices, and manage inventory. Start by adding some transactions.",
        actionLabel: "Go to Dashboard",
        gradient: "from-indigo-500/20 to-blue-500/20",
    },
    generic: {
        icon: <Package className="w-10 h-10" />,
        title: "Nothing here yet",
        description: "This section is empty. Start by adding your first item.",
        actionLabel: "Get Started",
        gradient: "from-gray-500/20 to-slate-500/20",
    },
};

export function EmptyState({ module, onAction }: EmptyStateProps) {
    const c = config[module] || config.generic;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center py-16 px-6"
        >
            {/* Illustrated icon */}
            <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${c.gradient} flex items-center justify-center mb-6 relative`}>
                <div style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>
                    {c.icon}
                </div>
                {/* Decorative dots */}
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-400/30" />
                <div className="absolute -bottom-2 -left-1 w-4 h-4 rounded-full bg-violet-400/20" />
                <div className="absolute top-1/2 -right-3 w-2 h-2 rounded-full bg-emerald-400/30" />
            </div>

            {/* Text */}
            <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--foreground)" }}>
                {c.title}
            </h3>
            <p className="text-sm text-center max-w-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
                {c.description}
            </p>

            {/* CTA */}
            {onAction && (
                <Button onClick={onAction}>
                    <Plus className="w-3.5 h-3.5" />
                    {c.actionLabel}
                </Button>
            )}
        </motion.div>
    );
}
