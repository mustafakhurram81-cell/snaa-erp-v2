"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
    Bell, Sun, Moon, ChevronRight, ChevronDown, Menu,
    Settings, LogOut, Keyboard, Search, Command
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useCurrency, currencies } from "@/lib/currency";
import { NotificationPanel } from "@/components/layout/notifications";
import { useSidebar } from "@/components/layout/sidebar";
import { CommandPalette } from "@/components/layout/command-palette";
import { useAuth } from "@/lib/auth-context";
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
    settings: "Settings",
};

export function Topbar() {
    const { theme, toggleTheme } = useTheme();
    const { collapsed } = useSidebar();
    const pathname = usePathname();
    const router = useRouter();
    const { currency, setCurrency } = useCurrency();
    const { user, signOut, role } = useAuth();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showCurrency, setShowCurrency] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showPalette, setShowPalette] = useState(false);
    const currencyRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Derive user initials from email
    const email = user?.email || "User";
    const initials = email.includes("@")
        ? email.split("@")[0].slice(0, 2).toUpperCase()
        : email.slice(0, 2).toUpperCase();

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) setShowCurrency(false);
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs = [
        { label: "Dashboard", href: "/" },
        ...segments.map((seg, i) => ({
            label: breadcrumbMap[seg] || seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "),
            href: "/" + segments.slice(0, i + 1).join("/"),
        })),
    ];
    const crumbs = pathname === "/" ? [{ label: "Dashboard", href: "/" }] : breadcrumbs;

    return (
        <header
            className={cn(
                "fixed top-0 right-0 z-30 h-14 flex items-center justify-between px-4 md:px-6 transition-all duration-300 backdrop-blur-2xl border-b border-black/5 dark:border-white/5",
                collapsed
                    ? "left-[var(--sidebar-collapsed-width)]"
                    : "left-[var(--sidebar-width)]"
            )}
            style={{
                backgroundColor: theme === "dark" ? "rgba(9,9,11,0.65)" : "rgba(255,255,255,0.65)",
            }}
        >
            {/* Left: Hamburger + Breadcrumbs (flex-1) */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <button
                    className="md:hidden p-1.5 rounded-lg hover:bg-[var(--secondary)] transition-colors flex-shrink-0"
                    onClick={() => window.dispatchEvent(new Event("toggle-mobile-sidebar"))}
                >
                    <Menu className="w-5 h-5" style={{ color: "var(--foreground)" }} />
                </button>

                <nav className="flex items-center gap-1.5 text-sm overflow-hidden whitespace-nowrap">
                    {crumbs.map((crumb, idx) => (
                        <React.Fragment key={crumb.href}>
                            {idx > 0 && (
                                <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
                            )}
                            <span
                                className={cn(
                                    "font-medium truncate",
                                    idx === crumbs.length - 1
                                        ? "text-[var(--foreground)]"
                                        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                                )}
                                onClick={() => idx < crumbs.length - 1 && router.push(crumb.href)}
                            >
                                {crumb.label}
                            </span>
                        </React.Fragment>
                    ))}
                </nav>
            </div>

            {/* Center: Search (flex-1) */}
            <div className="flex-1 flex justify-center max-w-md w-full px-4 hidden sm:flex">
                <button
                    onClick={() => setShowPalette(true)}
                    className="flex w-full items-center justify-between px-3 py-1.5 rounded-lg border text-xs transition-colors hover:bg-[var(--secondary)]"
                    style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
                >
                    <div className="flex items-center gap-2">
                        <Search className="w-3.5 h-3.5" />
                        <span>Search...</span>
                    </div>
                    <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border" style={{ borderColor: "var(--border)", background: "var(--secondary)" }}>
                        <Command className="w-2.5 h-2.5" />K
                    </kbd>
                </button>
                <CommandPalette open={showPalette} onOpenChange={setShowPalette} />
            </div>

            {/* Right: Notifications → Currency → Theme → User (flex-1) */}
            <div className="flex items-center justify-end gap-1 flex-1">
                {/* Mobile search button */}
                <button
                    onClick={() => setShowPalette(true)}
                    className="flex sm:hidden p-2 rounded-lg transition-colors hover:bg-[var(--secondary)]"
                    style={{ color: "var(--muted-foreground)" }}
                >
                    <Search className="w-4 h-4" />
                </button>

                {/* Notifications */}
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

                {/* Currency — hidden on mobile */}
                <div className="relative hidden sm:block" ref={currencyRef}>
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
                            className="absolute right-0 top-full mt-1 w-44 rounded-xl border shadow-xl py-1 z-50 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl"
                            style={{ borderColor: "var(--border)" }}
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
                    title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                    {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                {/* User avatar + dropdown */}
                <div className="relative" ref={userMenuRef}>
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-xs font-semibold ml-1 ring-2 ring-transparent hover:ring-blue-300 transition-all"
                        title={email}
                    >
                        {initials}
                    </button>
                    {showUserMenu && (
                        <div
                            className="absolute right-0 top-full mt-2 w-56 rounded-xl border shadow-xl z-50 overflow-hidden bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl"
                            style={{ borderColor: "var(--border)" }}
                        >
                            {/* User info */}
                            <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                                <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{email}</p>
                                <p className="text-[10px] font-medium capitalize mt-0.5 px-1.5 py-0.5 rounded-full inline-block" style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>{role}</p>
                            </div>
                            {/* Menu items */}
                            <div className="py-1">
                                <button
                                    onClick={() => { router.push("/settings"); setShowUserMenu(false); }}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--secondary)]"
                                    style={{ color: "var(--foreground)" }}
                                >
                                    <Settings className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                                    Settings
                                </button>
                                <button
                                    onClick={() => { window.dispatchEvent(new KeyboardEvent("keydown", { key: "?", bubbles: true })); setShowUserMenu(false); }}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--secondary)]"
                                    style={{ color: "var(--foreground)" }}
                                >
                                    <Keyboard className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                                    Keyboard Shortcuts
                                </button>
                            </div>
                            {/* Sign out */}
                            <div className="border-t py-1" style={{ borderColor: "var(--border)" }}>
                                <button
                                    onClick={() => { signOut(); setShowUserMenu(false); }}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-red-50 dark:hover:bg-red-900/10 text-red-600 dark:text-red-400"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
