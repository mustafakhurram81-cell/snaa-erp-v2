"use client";

import React from "react";
import { motion } from "framer-motion";
import { Package, FileText, Users, ShoppingCart, Truck, Factory, BarChart3, Inbox } from "lucide-react";
import { Button } from "@/components/ui/shared";

const iconMap: Record<string, React.ElementType> = {
    products: Package,
    invoices: FileText,
    quotations: FileText,
    customers: Users,
    vendors: Users,
    "sales-orders": ShoppingCart,
    "purchase-orders": Truck,
    production: Factory,
    reports: BarChart3,
    default: Inbox,
};

interface EmptyStateProps {
    title?: string;
    description?: string;
    icon?: React.ElementType;
    /** Auto-select icon by page name */
    page?: string;
    actionLabel?: string;
    onAction?: () => void;
}

export function EmptyState({
    title = "No data yet",
    description = "Get started by creating your first record.",
    icon,
    page,
    actionLabel,
    onAction,
}: EmptyStateProps) {
    const Icon = icon || (page ? iconMap[page] || iconMap.default : iconMap.default);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-4"
        >
            {/* Icon circle */}
            <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "var(--secondary)" }}
            >
                <Icon className="w-7 h-7" style={{ color: "var(--muted-foreground)" }} />
            </div>

            {/* Text */}
            <h3
                className="text-base font-semibold mb-1"
                style={{ color: "var(--foreground)" }}
            >
                {title}
            </h3>
            <p
                className="text-sm text-center max-w-sm"
                style={{ color: "var(--muted-foreground)" }}
            >
                {description}
            </p>

            {/* CTA */}
            {actionLabel && onAction && (
                <Button className="mt-4" onClick={onAction}>
                    {actionLabel}
                </Button>
            )}
        </motion.div>
    );
}
