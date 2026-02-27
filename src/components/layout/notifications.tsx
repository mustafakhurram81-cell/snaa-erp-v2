"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Clock, Package, DollarSign, Bell } from "lucide-react";

interface Notification {
    id: string;
    type: "overdue" | "low_stock" | "delivery" | "payment";
    title: string;
    description: string;
    time: string;
    read: boolean;
}

const mockNotifications: Notification[] = [
    { id: "1", type: "overdue", title: "Invoice overdue", description: "INV-2026-043 from Gulf Healthcare is 1 day overdue ($42,000)", time: "1h ago", read: false },
    { id: "2", type: "low_stock", title: "Low stock alert", description: "Kelly Clamp 5.5\" Curved — only 12 units left (reorder at 50)", time: "2h ago", read: false },
    { id: "3", type: "delivery", title: "Delivery arriving", description: "PO-2026-028 from Premium Steel Corp due tomorrow", time: "3h ago", read: false },
    { id: "4", type: "payment", title: "Payment received", description: "$12,500 payment from City Hospital for INV-2026-045", time: "5h ago", read: true },
    { id: "5", type: "overdue", title: "Invoice overdue", description: "INV-2026-040 from Prime Healthcare is 6 days overdue ($6,300)", time: "6h ago", read: true },
    { id: "6", type: "low_stock", title: "Low stock alert", description: "Metzenbaum Scissors 7\" Curved — only 8 units left", time: "1d ago", read: true },
];

const typeIcons: Record<string, React.ReactNode> = {
    overdue: <Clock className="w-4 h-4 text-red-500" />,
    low_stock: <Package className="w-4 h-4 text-amber-500" />,
    delivery: <AlertTriangle className="w-4 h-4 text-blue-500" />,
    payment: <DollarSign className="w-4 h-4 text-emerald-500" />,
};

const typeBg: Record<string, string> = {
    overdue: "bg-red-50 dark:bg-red-900/20",
    low_stock: "bg-amber-50 dark:bg-amber-900/20",
    delivery: "bg-blue-50 dark:bg-blue-900/20",
    payment: "bg-emerald-50 dark:bg-emerald-900/20",
};

interface NotificationPanelProps {
    open: boolean;
    onClose: () => void;
}

export function NotificationPanel({ open, onClose }: NotificationPanelProps) {
    const unreadCount = mockNotifications.filter((n) => !n.read).length;

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40"
                        onClick={onClose}
                    />
                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-96 rounded-xl border shadow-xl z-50 overflow-hidden"
                        style={{ background: "var(--card)", borderColor: "var(--border)" }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                            <div className="flex items-center gap-2">
                                <Bell className="w-4 h-4" style={{ color: "var(--foreground)" }} />
                                <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500 text-white">{unreadCount}</span>
                                )}
                            </div>
                            <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--secondary)] transition-colors">
                                <X className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
                            </button>
                        </div>

                        {/* Notifications list */}
                        <div className="max-h-96 overflow-y-auto">
                            {mockNotifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`flex gap-3 px-4 py-3 border-b transition-colors hover:bg-[var(--secondary)] cursor-pointer ${!notif.read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}
                                    style={{ borderColor: "var(--border)" }}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${typeBg[notif.type]}`}>
                                        {typeIcons[notif.type]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className={`text-sm ${!notif.read ? "font-semibold" : "font-medium"}`} style={{ color: "var(--foreground)" }}>{notif.title}</p>
                                            {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
                                        </div>
                                        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--muted-foreground)" }}>{notif.description}</p>
                                        <p className="text-[10px] mt-1" style={{ color: "var(--muted-foreground)" }}>{notif.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2.5 text-center border-t" style={{ borderColor: "var(--border)" }}>
                            <button className="text-xs font-semibold transition-colors hover:opacity-80" style={{ color: "var(--primary)" }}>
                                Mark all as read
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export function getUnreadCount() {
    return mockNotifications.filter((n) => !n.read).length;
}
