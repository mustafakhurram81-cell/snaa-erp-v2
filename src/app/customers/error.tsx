"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[Page Error]", error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-5">
                <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
                Something went wrong
            </h2>
            <p className="text-sm mb-6 max-w-md" style={{ color: "var(--muted-foreground)" }}>
                {error.message || "An unexpected error occurred. Please try again."}
            </p>
            <div className="flex items-center gap-3">
                <button
                    onClick={reset}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-all shadow-sm"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Try Again
                </button>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-[var(--secondary)]"
                    style={{ color: "var(--muted-foreground)" }}
                >
                    <Home className="w-3.5 h-3.5" />
                    Dashboard
                </Link>
            </div>
        </div>
    );
}
