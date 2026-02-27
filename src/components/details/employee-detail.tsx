"use client";

import React from "react";
import { Drawer, Button, StatusBadge } from "@/components/ui/shared";
import { formatCurrency, getInitials } from "@/lib/utils";
import { Mail, Phone, Edit2, Briefcase, Calendar, DollarSign } from "lucide-react";

interface Employee {
    id: string;
    name: string;
    email: string;
    phone: string;
    department: string;
    position: string;
    hire_date: string;
    salary: number;
    status: string;
    [key: string]: unknown;
}

interface EmployeeDetailProps {
    employee: Employee | null;
    open: boolean;
    onClose: () => void;
}

const payHistory = [
    { month: "Feb 2026", gross: 65000, deductions: 8000, net: 57000, status: "paid" },
    { month: "Jan 2026", gross: 65000, deductions: 8000, net: 57000, status: "paid" },
    { month: "Dec 2025", gross: 60000, deductions: 7500, net: 52500, status: "paid" },
];

export function EmployeeDetail({ employee, open, onClose }: EmployeeDetailProps) {
    if (!employee) return null;

    return (
        <Drawer
            open={open}
            onClose={onClose}
            title="Employee Details"
            width="max-w-xl"
            footer={
                <div className="flex justify-between">
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                    <Button variant="secondary">
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                    </Button>
                </div>
            }
        >
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                    {getInitials(employee.name)}
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{employee.name}</h3>
                    <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{employee.position}</p>
                </div>
                <StatusBadge status={employee.status} />
            </div>

            {/* Contact & Info */}
            <div className="rounded-xl border p-4 mb-5" style={{ background: "var(--secondary)", borderColor: "var(--border)" }}>
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm" style={{ color: "var(--foreground)" }}>
                        <Mail className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
                        {employee.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm" style={{ color: "var(--foreground)" }}>
                        <Phone className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
                        {employee.phone}
                    </div>
                    <div className="flex items-center gap-2 text-sm" style={{ color: "var(--foreground)" }}>
                        <Briefcase className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
                        {employee.department}
                    </div>
                    <div className="flex items-center gap-2 text-sm" style={{ color: "var(--foreground)" }}>
                        <Calendar className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
                        Hired {employee.hire_date}
                    </div>
                </div>
            </div>

            {/* Salary */}
            <div className="rounded-xl border p-4 mb-5" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Monthly Salary</p>
                </div>
                <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{formatCurrency(employee.salary)}</p>
            </div>

            {/* Pay History */}
            <div>
                <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>Pay History</h4>
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                    <table className="w-full">
                        <thead>
                            <tr style={{ background: "var(--secondary)" }}>
                                <th className="text-left text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Month</th>
                                <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Gross</th>
                                <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Deductions</th>
                                <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Net</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payHistory.map((row, idx) => (
                                <tr key={idx} className="border-t" style={{ borderColor: "var(--border)" }}>
                                    <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>{row.month}</td>
                                    <td className="px-4 py-3 text-sm text-right" style={{ color: "var(--muted-foreground)" }}>{formatCurrency(row.gross)}</td>
                                    <td className="px-4 py-3 text-sm text-right text-red-500">{formatCurrency(row.deductions)}</td>
                                    <td className="px-4 py-3 text-sm text-right font-semibold text-emerald-600">{formatCurrency(row.net)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Drawer>
    );
}
