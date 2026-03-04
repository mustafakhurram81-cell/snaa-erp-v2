"use client";

import React from "react";
import { useAuth } from "@/lib/auth-context";
import { ShieldAlert } from "lucide-react";

type Role = "admin" | "manager" | "user";

const roleHierarchy: Record<Role, number> = {
    admin: 3,
    manager: 2,
    user: 1,
};

interface RoleGuardProps {
    /** Minimum role required to see children */
    minRole: Role;
    children: React.ReactNode;
    /** What to show when access is denied. Defaults to null (hidden). */
    fallback?: React.ReactNode;
    /** If true, shows a styled "Access Denied" message instead of hiding */
    showDenied?: boolean;
}

/**
 * RoleGuard — conditionally renders children based on user role.
 * Usage: <RoleGuard minRole="admin"><DeleteButton /></RoleGuard>
 */
export function RoleGuard({ minRole, children, fallback, showDenied }: RoleGuardProps) {
    const { role } = useAuth();
    const userLevel = roleHierarchy[role as Role] || 1;
    const requiredLevel = roleHierarchy[minRole] || 1;

    if (userLevel >= requiredLevel) {
        return <>{children}</>;
    }

    if (fallback) return <>{fallback}</>;

    if (showDenied) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
                    <ShieldAlert className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>Access Restricted</h3>
                <p className="text-sm mt-1 max-w-xs" style={{ color: "var(--muted-foreground)" }}>
                    You need <strong>{minRole}</strong> privileges to access this section. Contact your administrator.
                </p>
            </div>
        );
    }

    return null;
}

/**
 * Hook to check role access programmatically.
 * Usage: const { allowed } = useRoleCheck("admin");
 */
export function useRoleCheck(minRole: Role) {
    const { role, isAdmin, isManager } = useAuth();
    const userLevel = roleHierarchy[role as Role] || 1;
    const requiredLevel = roleHierarchy[minRole] || 1;

    return {
        allowed: userLevel >= requiredLevel,
        role,
        isAdmin,
        isManager,
    };
}
