"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, X } from "lucide-react";

interface ShortcutGroup {
    title: string;
    shortcuts: { keys: string[]; description: string }[];
}

const shortcutGroups: ShortcutGroup[] = [
    {
        title: "Navigation",
        shortcuts: [
            { keys: ["Ctrl", "K"], description: "Open command palette" },
            { keys: ["?"], description: "Show keyboard shortcuts" },
            { keys: ["Esc"], description: "Close any dialog or drawer" },
        ],
    },
    {
        title: "Quick Actions",
        shortcuts: [
            { keys: ["N"], description: "Create new item (on any page)" },
            { keys: ["S"], description: "Save / Submit form" },
            { keys: ["E"], description: "Edit selected item" },
            { keys: ["Delete"], description: "Delete selected items" },
        ],
    },
    {
        title: "Table",
        shortcuts: [
            { keys: ["Ctrl", "A"], description: "Select all rows" },
            { keys: ["Ctrl", "Shift", "E"], description: "Export as CSV" },
        ],
    },
    {
        title: "Pages",
        shortcuts: [
            { keys: ["G", "D"], description: "Go to Dashboard" },
            { keys: ["G", "C"], description: "Go to Customers" },
            { keys: ["G", "P"], description: "Go to Products" },
            { keys: ["G", "O"], description: "Go to Sales Orders" },
            { keys: ["G", "I"], description: "Go to Invoices" },
            { keys: ["G", "V"], description: "Go to Vendors" },
        ],
    },
];

export function KeyboardShortcuts() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        let lastKey = "";
        let lastTime = 0;
        const handler = (e: KeyboardEvent) => {
            // Don't trigger if user is typing in an input
            const target = e.target as HTMLElement;
            if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable) return;

            if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                setOpen((v) => !v);
            }
            if (e.key === "Escape") setOpen(false);

            // "G then letter" navigation shortcuts
            const now = Date.now();
            if (lastKey === "g" && now - lastTime < 500) {
                const routes: Record<string, string> = {
                    d: "/",
                    c: "/customers",
                    p: "/products",
                    o: "/sales-orders",
                    i: "/invoices",
                    v: "/vendors",
                };
                if (routes[e.key]) {
                    e.preventDefault();
                    window.location.href = routes[e.key];
                }
            }
            lastKey = e.key;
            lastTime = now;
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50"
                        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
                        onClick={() => setOpen(false)}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ type: "tween", duration: 0.15 }}
                        className="fixed left-1/2 top-[15%] -translate-x-1/2 z-50 w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden"
                        style={{ background: "var(--card)", borderColor: "var(--border)" }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                    <Keyboard className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Keyboard Shortcuts</h3>
                                    <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>Press ? anywhere to toggle this panel</p>
                                </div>
                            </div>
                            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-[var(--secondary)] transition-colors">
                                <X className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                            </button>
                        </div>

                        {/* Shortcuts grid */}
                        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-5">
                            {shortcutGroups.map((group) => (
                                <div key={group.title}>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-2.5 px-1" style={{ color: "var(--muted-foreground)" }}>{group.title}</p>
                                    <div className="space-y-1">
                                        {group.shortcuts.map((shortcut, idx) => (
                                            <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--secondary)] transition-colors">
                                                <span className="text-xs" style={{ color: "var(--foreground)" }}>{shortcut.description}</span>
                                                <div className="flex items-center gap-1">
                                                    {shortcut.keys.map((key, ki) => (
                                                        <React.Fragment key={ki}>
                                                            {ki > 0 && <span className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>+</span>}
                                                            <kbd className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-md border text-[10px] font-mono font-semibold shadow-sm" style={{ borderColor: "var(--border)", background: "var(--secondary)", color: "var(--foreground)" }}>
                                                                {key}
                                                            </kbd>
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-3 border-t text-center" style={{ borderColor: "var(--border)" }}>
                            <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                                Press <kbd className="px-1 py-0.5 rounded border text-[9px] font-mono mx-0.5" style={{ borderColor: "var(--border)" }}>?</kbd> to toggle •
                                <kbd className="px-1 py-0.5 rounded border text-[9px] font-mono mx-0.5" style={{ borderColor: "var(--border)" }}>Esc</kbd> to close
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
