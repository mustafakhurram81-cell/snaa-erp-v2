"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Bell, Sun, Moon, ChevronRight, ChevronDown, Menu } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useCurrency, currencies } from "@/lib/currency";
import { NotificationPanel } from "@/components/layout/notifications";
import { useSidebar } from "@/components/layout/sidebar";
import { CommandSearch } from "@/components/shared/command-search";
import { cn } from "@/lib/utils";

const breadcrumbMap: Record<string, string> = {
    "": "Dashboard",
    customers: "Customers",
    quotations: "Quotations",
    "sales-orders": "Sales Orders",
    production: "Production",
    products: "Products",
    accounting: "Accounting",
    invoices: "Invoices",
    "purchase-orders": "Purchase Orders",
    inventory: "Inventory",
    vendors: "Vendors",
    hr: "HR & Payroll",
    reports: "Reports",
};

export function Topbar() {
    const { theme, toggleTheme } = useTheme();
    const { collapsed } = useSidebar();
    const pathname = usePathname();
    const { currency, setCurrency } = useCurrency();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showCurrency, setShowCurrency] = useState(false);
    const currencyRef = useRef<HTMLDivElement>(null);

    // Close currency dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) {
                setShowCurrency(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs = [
        { label: "Dashboard", href: "/" },
        ...segments.map((seg, i) => ({
            label: breadcrumbMap[seg] || seg,
            href: "/" + segments.slice(0, i + 1).join("/"),
        })),
    ];

    // Remove duplicate "Dashboard" if on home
    const crumbs = pathname === "/" ? [{ label: "Dashboard", href: "/" }] : breadcrumbs;

    return (
        <header
            className={cn(
                "fixed top-0 right-0 z-30 h-16 flex items-center justify-between px-6 border-b transition-all duration-300 backdrop-blur-xl shadow-soft",
                collapsed
                    ? "left-[var(--sidebar-collapsed-width)]"
                    : "left-[var(--sidebar-width)]"
            )}
            style={{
                background: "rgba(var(--background), 0.8)",
                backgroundColor: theme === "dark" ? "rgba(9,9,11,0.85)" : "rgba(255,255,255,0.85)",
                borderColor: "var(--border)",
            }}
        >
            {/* Mobile hamburger */}
            <div className="flex items-center gap-2">
                <button
                    className="md:hidden p-1.5 rounded-lg hover:bg-[var(--secondary)] transition-colors"
                    onClick={() => window.dispatchEvent(new Event("toggle-mobile-sidebar"))}
                >
                    <Menu className="w-5 h-5" style={{ color: "var(--foreground)" }} />
                </button>

                {/* Breadcrumbs */}
                <div className="flex items-center gap-1.5 text-sm">
                    {crumbs.map((crumb, idx) => (
                        <React.Fragment key={crumb.href}>
                            {idx > 0 && (
                                <ChevronRight className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
                            )}
                            <span
                                className={cn(
                                    "font-medium",
                                    idx === crumbs.length - 1
                                        ? "text-[var(--foreground)]"
                                        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                                )}
                            >
                                {crumb.label}
                            </span>
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-2">
                {/* Search */}
                <CommandSearch />

                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 rounded-lg transition-colors hover:bg-[var(--secondary)]"
                        style={{ color: "var(--muted-foreground)" }}
                    >
                        <Bell className="w-4 h-4" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-white dark:ring-zinc-900" />
                    </button>
                    <NotificationPanel open={showNotifications} onClose={() => setShowNotifications(false)} />
                </div>

                {/* Currency selector */}
                <div className="relative" ref={currencyRef}>
                    <button
                        onClick={() => setShowCurrency(!showCurrency)}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-[var(--secondary)]"
                        style={{ color: "var(--foreground)" }}
                    >
                        {currency.symbol} {currency.code}
                        <ChevronDown className="w-3 h-3" style={{ color: "var(--muted-foreground)" }} />
                    </button>
                    {showCurrency && (
                        <div
                            className="absolute right-0 top-full mt-1 w-44 rounded-xl border shadow-lg py-1 z-50"
                            style={{ background: "var(--card)", borderColor: "var(--border)" }}
                        >
                            {currencies.map((c) => (
                                <button
                                    key={c.code}
                                    onClick={() => { setCurrency(c.code); setShowCurrency(false); }}
                                    className={cn(
                                        "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-[var(--secondary)]",
                                        c.code === currency.code && "font-semibold"
                                    )}
                                    style={{ color: c.code === currency.code ? "var(--primary)" : "var(--foreground)" }}
                                >
                                    <span className="w-6 text-right font-mono text-xs" style={{ color: "var(--muted-foreground)" }}>{c.symbol}</span>
                                    <span>{c.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Theme toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg transition-colors hover:bg-[var(--secondary)]"
                    style={{ color: "var(--muted-foreground)" }}
                >
                    {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                {/* User avatar */}
                <button className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-xs font-semibold ml-1">
                    MK
                </button>
            </div>
        </header>
    );
}
