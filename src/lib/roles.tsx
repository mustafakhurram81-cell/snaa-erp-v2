"use client";

import React, { createContext, useContext, useState } from "react";

export type Role = "owner" | "manager" | "worker";

export interface RolePermissions {
    canSeePrices: boolean;
    canEditAll: boolean;
    canCreateJO: boolean;
    canCreatePO: boolean;
    canUpdateStages: boolean;
    canAccessQuotations: boolean;
    canAccessInvoices: boolean;
    canAccessAccounting: boolean;
    canAccessHR: boolean;
    canAccessReports: boolean;
    canAccessCustomers: boolean;
    canAccessVendors: boolean;
}

const rolePermissions: Record<Role, RolePermissions> = {
    owner: {
        canSeePrices: true,
        canEditAll: true,
        canCreateJO: true,
        canCreatePO: true,
        canUpdateStages: true,
        canAccessQuotations: true,
        canAccessInvoices: true,
        canAccessAccounting: true,
        canAccessHR: true,
        canAccessReports: true,
        canAccessCustomers: true,
        canAccessVendors: true,
    },
    manager: {
        canSeePrices: false,
        canEditAll: false,
        canCreateJO: true,
        canCreatePO: true,
        canUpdateStages: true,
        canAccessQuotations: false,
        canAccessInvoices: false,
        canAccessAccounting: false,
        canAccessHR: false,
        canAccessReports: false,
        canAccessCustomers: true,
        canAccessVendors: true,
    },
    worker: {
        canSeePrices: false,
        canEditAll: false,
        canCreateJO: false,
        canCreatePO: false,
        canUpdateStages: true,
        canAccessQuotations: false,
        canAccessInvoices: false,
        canAccessAccounting: false,
        canAccessHR: false,
        canAccessReports: false,
        canAccessCustomers: false,
        canAccessVendors: false,
    },
};

interface RoleContextType {
    role: Role;
    setRole: (role: Role) => void;
    permissions: RolePermissions;
    roleName: string;
}

const roleNames: Record<Role, string> = {
    owner: "Owner",
    manager: "Manager",
    worker: "Worker",
};

const RoleContext = createContext<RoleContextType>({
    role: "owner",
    setRole: () => { },
    permissions: rolePermissions.owner,
    roleName: "Owner",
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
    const [role, setRoleState] = useState<Role>(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("erp-role") as Role;
            if (stored && rolePermissions[stored]) return stored;
        }
        return "owner";
    });

    const setRole = (r: Role) => {
        setRoleState(r);
        localStorage.setItem("erp-role", r);
    };

    return (
        <RoleContext.Provider value={{ role, setRole, permissions: rolePermissions[role], roleName: roleNames[role] }}>
            {children}
        </RoleContext.Provider>
    );
}

export function useRole() {
    return useContext(RoleContext);
}

export { rolePermissions };
