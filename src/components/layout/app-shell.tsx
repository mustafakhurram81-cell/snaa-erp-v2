"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar, SidebarProvider, useSidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { KeyboardShortcuts } from "@/components/shared/keyboard-shortcuts";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

// Pages that don't need the full shell
const PUBLIC_ROUTES = ["/login"];

function AppContent({ children }: { children: React.ReactNode }) {
    const { collapsed } = useSidebar();
    const { user, loading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [mobileOpen, setMobileOpen] = useState(false);

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    // Redirect unauthenticated users to login
    useEffect(() => {
        if (!loading && !user && !isPublicRoute) {
            router.push("/login");
        }
    }, [loading, user, isPublicRoute, router]);

    // Redirect authenticated users away from login
    useEffect(() => {
        if (!loading && user && isPublicRoute) {
            router.push("/");
        }
    }, [loading, user, isPublicRoute, router]);

    // Listen for hamburger toggle
    useEffect(() => {
        const handler = () => setMobileOpen((v) => !v);
        window.addEventListener("toggle-mobile-sidebar", handler);
        return () => window.removeEventListener("toggle-mobile-sidebar", handler);
    }, []);

    // Close on route change (resize)
    useEffect(() => {
        const handler = () => { if (window.innerWidth > 768) setMobileOpen(false); };
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, []);

    // Show loading spinner while auth is initializing
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen" style={{ background: "var(--background)" }}>
                <div className="text-center">
                    <div className="w-10 h-10 border-3 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: "var(--border)", borderTopColor: "var(--primary)" }} />
                    <p className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>Loading...</p>
                </div>
            </div>
        );
    }

    // Public route (login) — no shell
    if (isPublicRoute) {
        return <>{children}</>;
    }

    // Protected route — full shell
    if (!user) return null;

    return (
        <>
            {/* Mobile backdrop */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar with mobile open class */}
            <div className={mobileOpen ? "mobile-sidebar-open" : ""}>
                <Sidebar />
            </div>

            <style jsx global>{`
                .mobile-sidebar-open aside {
                    transform: translateX(0) !important;
                    z-index: 50 !important;
                }
            `}</style>

            <Topbar />
            <main
                className={cn(
                    "pt-14 min-h-screen transition-all duration-300",
                    "ml-0 md:ml-[var(--sidebar-width)]",
                    collapsed && "md:ml-[var(--sidebar-collapsed-width)]"
                )}
            >
                <div className="p-4 md:p-6">
                    {children}
                </div>
            </main>
            <KeyboardShortcuts />
        </>
    );
}

export function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppContent>{children}</AppContent>
        </SidebarProvider>
    );
}
