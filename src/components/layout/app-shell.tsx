"use client";

import React, { useState, useEffect } from "react";
import { Sidebar, SidebarProvider, useSidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { cn } from "@/lib/utils";

function AppContent({ children }: { children: React.ReactNode }) {
    const { collapsed } = useSidebar();
    const [mobileOpen, setMobileOpen] = useState(false);

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
                    "pt-16 min-h-screen transition-all duration-300",
                    collapsed
                        ? "ml-[var(--sidebar-collapsed-width)]"
                        : "ml-[var(--sidebar-width)]"
                )}
            >
                <div className="p-6">
                    {children}
                </div>
            </main>
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
