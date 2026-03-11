"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    description?: string;
}

interface ToastContextType {
    toast: (type: ToastType, title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType>({
    toast: () => { },
});

const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500 opacity-80" />,
    error: <XCircle className="w-4 h-4 text-red-500 opacity-80" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-500 opacity-80" />,
    info: <Info className="w-4 h-4 text-blue-500 opacity-80" />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((type: ToastType, title: string, description?: string) => {
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { id, type, title, description }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ toast: addToast }}>
            {children}
            {/* Toast container */}
            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
                <AnimatePresence>
                    {toasts.map((t) => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 100, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="relative overflow-hidden flex items-start gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-3xl bg-white/80 dark:bg-zinc-950/80"
                            style={{ borderColor: "var(--border)" }}
                        >
                            <span className="mt-0.5 flex-shrink-0 z-10 relative">{icons[t.type]}</span>
                            <div className="flex-1 min-w-0 z-10 relative">
                                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{t.title}</p>
                                {t.description && <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{t.description}</p>}
                            </div>
                            <button onClick={() => removeToast(t.id)} className="flex-shrink-0 mt-0.5 hover:opacity-70 z-10 relative">
                                <X className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
                            </button>
                            {/* Animated Progress Bar */}
                            <motion.div
                                initial={{ scaleX: 1 }}
                                animate={{ scaleX: 0 }}
                                transition={{ duration: 4, ease: "linear" }}
                                className={cn(
                                    "absolute bottom-0 left-0 h-[3px] w-full transform origin-left",
                                    t.type === "success" && "bg-emerald-500",
                                    t.type === "error" && "bg-red-500",
                                    t.type === "warning" && "bg-amber-500",
                                    t.type === "info" && "bg-blue-500"
                                )}
                                style={{ opacity: 0.8 }}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    return useContext(ToastContext);
}
