"use client";

import React, { useState, useEffect } from "react";
import { Drawer, Button, StatusBadge, DrawerTabs, Input } from "@/components/ui/shared";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { Mail, Phone, Edit3, Briefcase, Calendar, DollarSign, Save, X, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { DeleteConfirmation } from "@/components/shared/delete-confirmation";
import { LiveActivityLog } from "@/components/shared/activity-log";
import { supabase } from "@/lib/supabase";

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
}

interface EmployeeDetailProps {
    employee: Employee | null;
    open: boolean;
    onClose: () => void;
    onUpdate?: (employee: Employee) => void;
    onDelete?: (employee: Employee) => void;
}

interface PayHistoryRow {
    month: string;
    gross: number;
    deductions: number;
    net: number;
    status: string;
}

export function EmployeeDetail({ employee, open, onClose, onUpdate, onDelete }: EmployeeDetailProps) {
    if (!employee) return null;
    const { toast } = useToast();
    const [showDelete, setShowDelete] = useState(false);
    const [activeTab, setActiveTab] = useState("payhistory");
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ ...employee });
    const [payHistory, setPayHistory] = useState<PayHistoryRow[]>([]);
    const [loadingPayroll, setLoadingPayroll] = useState(false);

    useEffect(() => {
        if (employee) { setEditData({ ...employee }); setIsEditing(false); }
    }, [employee]);

    // Fetch real payroll history for this employee
    useEffect(() => {
        if (!employee?.id || !open) return;
        setLoadingPayroll(true);
        supabase
            .from("payroll_entries")
            .select("basic_salary, allowances, deductions, net_salary, payroll_runs!inner(month, year, status)")
            .eq("employee_id", employee.id)
            .order("created_at", { ascending: false })
            .limit(12)
            .then(({ data, error }) => {
                if (data && !error) {
                    setPayHistory(data.map((entry: any) => ({
                        month: `${entry.payroll_runs?.month} ${entry.payroll_runs?.year}`,
                        gross: (entry.basic_salary || 0) + (entry.allowances || 0),
                        deductions: entry.deductions || 0,
                        net: entry.net_salary || 0,
                        status: entry.payroll_runs?.status || "draft",
                    })));
                } else {
                    setPayHistory([]);
                }
                setLoadingPayroll(false);
            });
    }, [employee?.id, open]);

    const handleSave = async () => {
        if (onUpdate) onUpdate(editData);
        setIsEditing(false);
        toast("success", "Employee updated", `${editData.name} saved`);
        const { logActivity } = await import("@/lib/activity-logger");
        logActivity({ entityType: "employee", entityId: employee.id, action: "Employee updated", details: employee.name });
    };
    const handleCancel = () => { setEditData({ ...employee }); setIsEditing(false); };

    const tabs = [
        { key: "payhistory", label: "Pay History", count: payHistory.length },
        { key: "activity", label: "Activity" },
    ];

    return (
        <Drawer
            open={open}
            onClose={() => { handleCancel(); onClose(); }}
            title={isEditing ? "Edit Employee" : "Employee Details"}
            width="max-w-xl"
            footer={
                <div className="flex justify-between">
                    <Button variant="secondary" onClick={() => { handleCancel(); onClose(); }}>Close</Button>
                    <div className="flex gap-2">
                        {isEditing ? (
                            <>
                                <Button variant="secondary" onClick={handleCancel}><X className="w-3.5 h-3.5" /> Cancel</Button>
                                <Button onClick={handleSave}><Save className="w-3.5 h-3.5" /> Save Changes</Button>
                            </>
                        ) : (
                            <>
                                <Button variant="secondary" onClick={() => setIsEditing(true)}>
                                    <Edit3 className="w-3.5 h-3.5" /> Edit
                                </Button>
                                <button onClick={() => setShowDelete(true)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                            </>
                        )}
                    </div>
                </div>
            }
        >
            {/* Header */}
            <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                    {getInitials(isEditing ? editData.name : employee.name)}
                </div>
                <div className="flex-1">
                    {isEditing ? (
                        <div className="space-y-2">
                            <Input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} placeholder="Employee name" />
                            <Input value={editData.position} onChange={(e) => setEditData({ ...editData, position: e.target.value })} placeholder="Position" />
                        </div>
                    ) : (
                        <>
                            <h3 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{employee.name}</h3>
                            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{employee.position}</p>
                        </>
                    )}
                </div>
                {!isEditing && <StatusBadge status={employee.status} />}
                {isEditing && (
                    <select value={editData.status} onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                        className="h-8 px-3 rounded-lg border text-xs font-medium" style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="on_leave">On Leave</option>
                    </select>
                )}
            </div>

            {/* Contact & Info */}
            <div className="rounded-xl border p-4 mb-5" style={{ background: "var(--secondary)", borderColor: "var(--border)" }}>
                {isEditing ? (
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Email" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} />
                        <Input label="Phone" value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} />
                        <Input label="Department" value={editData.department} onChange={(e) => setEditData({ ...editData, department: e.target.value })} />
                        <Input label="Hire Date" type="date" value={editData.hire_date} onChange={(e) => setEditData({ ...editData, hire_date: e.target.value })} />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--foreground)" }}>
                            <Mail className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} /> {employee.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--foreground)" }}>
                            <Phone className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} /> {employee.phone}
                        </div>
                        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--foreground)" }}>
                            <Briefcase className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} /> {employee.department}
                        </div>
                        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--foreground)" }}>
                            <Calendar className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} /> Hired {formatDate(employee.hire_date)}
                        </div>
                    </div>
                )}
            </div>

            {/* Salary */}
            <div className="rounded-xl border p-4 mb-5" style={{ borderColor: "var(--border)" }}>
                {isEditing ? (
                    <Input label="Monthly Salary" type="number" value={String(editData.salary)} onChange={(e) => setEditData({ ...editData, salary: parseFloat(e.target.value) || 0 })} />
                ) : (
                    <>
                        <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Monthly Salary</p>
                        </div>
                        <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{formatCurrency(employee.salary)}</p>
                    </>
                )}
            </div>

            {/* Tabs (hidden during edit) */}
            {!isEditing && (
                <>
                    <DrawerTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
                    {activeTab === "payhistory" && (
                        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                            {loadingPayroll ? (
                                <div className="py-8 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>Loading payroll history...</div>
                            ) : payHistory.length === 0 ? (
                                <div className="py-8 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>No payroll records found</div>
                            ) : (
                                <table className="w-full">
                                    <thead><tr style={{ background: "var(--secondary)" }}>
                                        <th className="text-left text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Month</th>
                                        <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Gross</th>
                                        <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Deductions</th>
                                        <th className="text-right text-[10px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "var(--muted-foreground)" }}>Net</th>
                                    </tr></thead>
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
                            )}
                        </div>
                    )}
                    {activeTab === "activity" && (
                        <LiveActivityLog entityType="employee" entityId={employee.id} />
                    )}
                </>
            )}

            <DeleteConfirmation
                open={showDelete}
                onClose={() => setShowDelete(false)}
                onConfirm={async () => { setShowDelete(false); if (onDelete) { onDelete(employee); } const { logActivity } = await import("@/lib/activity-logger"); logActivity({ entityType: "employee", entityId: employee.id, action: "Employee deleted", details: employee.name }); toast("success", "Employee deleted", `${employee.name} deleted`); onClose(); }}
                title={`Delete ${employee.name}?`}
                description="This action cannot be undone. The employee record will be permanently removed."
            />
        </Drawer>
    );
}
